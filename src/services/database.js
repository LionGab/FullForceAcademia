const { Pool } = require('pg');
const redis = require('redis');
const pino = require('pino');

class DatabaseService {
    constructor() {
        this.pgPool = null;
        this.redisClient = null;
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV === 'development' ? {
                target: 'pino-pretty',
                options: { colorize: true }
            } : undefined
        });

        // Don't auto-initialize in constructor for campaign scripts
        this.initialized = false;
    }

    // Public initialize method for manual initialization
    async initialize() {
        if (this.initialized) {
            return;
        }

        await this.initializeConnections();
        this.initialized = true;
    }

    async initializeConnections() {
        try {
            await this.initializePostgreSQL();
            await this.initializeRedis();
            await this.createTables();
            this.logger.info('✅ Database connections initialized successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize database connections:', error);
            throw error;
        }
    }

    async initializePostgreSQL() {
        // Skip PostgreSQL if using SQLite or if DATABASE_TYPE is sqlite
        if (process.env.DATABASE_TYPE === 'sqlite' || process.env.DATABASE_URL?.includes('sqlite')) {
            this.logger.info('📄 Using SQLite database, skipping PostgreSQL');
            return;
        }

        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT) || 5432,
            database: process.env.DB_NAME || 'n8n',
            user: process.env.DB_USER || 'n8n',
            password: process.env.DB_PASSWORD || 'n8n123',
            max: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
            connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 60000,
        };

        // For Docker environment, use internal network hostnames
        if (process.env.NODE_ENV === 'production') {
            dbConfig.host = 'postgres';
            dbConfig.port = 5432;
        }

        try {
            this.pgPool = new Pool(dbConfig);

            // Test connection
            const client = await this.pgPool.connect();
            await client.query('SELECT NOW()');
            client.release();

            this.logger.info('✅ PostgreSQL connection established');
        } catch (error) {
            this.logger.warn('⚠️ PostgreSQL not available, continuing with SQLite fallback');
            this.pgPool = null;
        }
    }

    async initializeRedis() {
        // Skip Redis if MOCK_REDIS is true
        if (process.env.MOCK_REDIS === 'true') {
            this.logger.info('🤖 Using Redis mock mode, skipping Redis connection');
            this.redisClient = null;
            return;
        }

        const redisConfig = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB) || 0,
            maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
            retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 1000,
            connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT) || 5000,
        };

        // For Docker environment, use internal network hostnames
        if (process.env.NODE_ENV === 'production') {
            redisConfig.host = 'redis';
            redisConfig.port = 6379;
        }

        try {
            this.redisClient = redis.createClient(redisConfig);

            this.redisClient.on('error', (err) => {
                this.logger.error('Redis client error:', err);
            });

            this.redisClient.on('connect', () => {
                this.logger.info('✅ Redis connection established');
            });

            await this.redisClient.connect();
        } catch (error) {
            this.logger.warn('⚠️ Redis not available, continuing without cache');
            this.redisClient = null;
        }
    }

    async createTables() {
        // Skip table creation if PostgreSQL is not available
        if (!this.pgPool) {
            this.logger.info('📄 PostgreSQL not available, skipping table creation');
            return;
        }

        const createTablesSQL = `
            -- Contacts table for storing WhatsApp contact information
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                name VARCHAR(255),
                first_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_contact_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Messages table for storing conversation history
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES contacts(id),
                phone VARCHAR(20) NOT NULL,
                message_text TEXT NOT NULL,
                message_type VARCHAR(50) DEFAULT 'text',
                direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
                processed BOOLEAN DEFAULT FALSE,
                response_sent BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Members table for academy member information
            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                contact_id INTEGER REFERENCES contacts(id),
                full_name VARCHAR(255),
                email VARCHAR(255),
                membership_type VARCHAR(100),
                membership_status VARCHAR(50) DEFAULT 'active',
                join_date DATE,
                last_checkin TIMESTAMP,
                emergency_contact VARCHAR(255),
                medical_conditions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Schedules table for class scheduling
            CREATE TABLE IF NOT EXISTS schedules (
                id SERIAL PRIMARY KEY,
                member_id INTEGER REFERENCES members(id),
                class_name VARCHAR(255) NOT NULL,
                instructor VARCHAR(255),
                scheduled_date TIMESTAMP NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                status VARCHAR(50) DEFAULT 'scheduled',
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Analytics table for bot performance tracking
            CREATE TABLE IF NOT EXISTS analytics (
                id SERIAL PRIMARY KEY,
                metric_name VARCHAR(100) NOT NULL,
                metric_value NUMERIC,
                metric_data JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes for better performance
            CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
            CREATE INDEX IF NOT EXISTS idx_messages_contact_id ON messages(contact_id);
            CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
            CREATE INDEX IF NOT EXISTS idx_members_contact_id ON members(contact_id);
            CREATE INDEX IF NOT EXISTS idx_schedules_member_id ON schedules(member_id);
            CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(scheduled_date);
            CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);

            -- Create updated_at trigger function
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';

            -- Create triggers for updated_at
            DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
            CREATE TRIGGER update_contacts_updated_at
                BEFORE UPDATE ON contacts
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            DROP TRIGGER IF EXISTS update_members_updated_at ON members;
            CREATE TRIGGER update_members_updated_at
                BEFORE UPDATE ON members
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();

            DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
            CREATE TRIGGER update_schedules_updated_at
                BEFORE UPDATE ON schedules
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `;

        const client = await this.pgPool.connect();
        try {
            await client.query(createTablesSQL);
            this.logger.info('✅ Database tables created/updated successfully');
        } finally {
            client.release();
        }
    }

    // Contact management methods
    async saveContact(contactData) {
        const client = await this.pgPool.connect();
        try {
            const { phone, name, notes } = contactData;

            const result = await client.query(`
                INSERT INTO contacts (phone, name, notes)
                VALUES ($1, $2, $3)
                ON CONFLICT (phone)
                DO UPDATE SET
                    name = COALESCE(EXCLUDED.name, contacts.name),
                    last_contact_date = CURRENT_TIMESTAMP,
                    notes = COALESCE(EXCLUDED.notes, contacts.notes)
                RETURNING *
            `, [phone, name, notes]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getContact(phone) {
        const client = await this.pgPool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM contacts WHERE phone = $1',
                [phone]
            );
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async saveMessage(messageData) {
        const client = await this.pgPool.connect();
        try {
            const { phone, message_text, direction, message_type = 'text' } = messageData;

            // Get or create contact
            let contact = await this.getContact(phone);
            if (!contact) {
                contact = await this.saveContact({ phone });
            }

            const result = await client.query(`
                INSERT INTO messages (contact_id, phone, message_text, message_type, direction)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [contact.id, phone, message_text, message_type, direction]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getMessageHistory(phone, limit = 50) {
        const client = await this.pgPool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM messages
                WHERE phone = $1
                ORDER BY timestamp DESC
                LIMIT $2
            `, [phone, limit]);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Member management methods
    async saveMember(memberData) {
        const client = await this.pgPool.connect();
        try {
            const {
                phone, full_name, email, membership_type,
                membership_status = 'active', join_date,
                emergency_contact, medical_conditions
            } = memberData;

            // Get contact
            const contact = await this.getContact(phone);
            if (!contact) {
                throw new Error('Contact not found. Please create contact first.');
            }

            const result = await client.query(`
                INSERT INTO members (
                    contact_id, full_name, email, membership_type,
                    membership_status, join_date, emergency_contact, medical_conditions
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (contact_id)
                DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    email = EXCLUDED.email,
                    membership_type = EXCLUDED.membership_type,
                    membership_status = EXCLUDED.membership_status,
                    emergency_contact = EXCLUDED.emergency_contact,
                    medical_conditions = EXCLUDED.medical_conditions
                RETURNING *
            `, [
                contact.id, full_name, email, membership_type,
                membership_status, join_date, emergency_contact, medical_conditions
            ]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    async getMember(phone) {
        const client = await this.pgPool.connect();
        try {
            const result = await client.query(`
                SELECT m.*, c.phone, c.name
                FROM members m
                JOIN contacts c ON m.contact_id = c.id
                WHERE c.phone = $1
            `, [phone]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Analytics methods
    async saveAnalytics(metricName, metricValue, metricData = null) {
        const client = await this.pgPool.connect();
        try {
            const result = await client.query(`
                INSERT INTO analytics (metric_name, metric_value, metric_data)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [metricName, metricValue, metricData]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Redis cache methods
    async setCache(key, value, ttl = 3600) {
        try {
            const serializedValue = JSON.stringify(value);
            await this.redisClient.setEx(key, ttl, serializedValue);
        } catch (error) {
            this.logger.error('Redis set error:', error);
        }
    }

    async getCache(key) {
        try {
            const value = await this.redisClient.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.error('Redis get error:', error);
            return null;
        }
    }

    async deleteCache(key) {
        try {
            await this.redisClient.del(key);
        } catch (error) {
            this.logger.error('Redis delete error:', error);
        }
    }

    // Session management for WhatsApp
    async saveSession(sessionId, sessionData) {
        await this.setCache(`session:${sessionId}`, sessionData, 24 * 3600); // 24 hours
    }

    async getSession(sessionId) {
        return await this.getCache(`session:${sessionId}`);
    }

    async deleteSession(sessionId) {
        await this.deleteCache(`session:${sessionId}`);
    }

    // Anti-spam management
    async isSpamUser(phone) {
        const cacheKey = `spam:${phone}`;
        const lastMessage = await this.getCache(cacheKey);

        if (lastMessage) {
            const timeDiff = Date.now() - lastMessage.timestamp;
            return timeDiff < (parseInt(process.env.ANTI_SPAM_DELAY) || 5000);
        }

        await this.setCache(cacheKey, { timestamp: Date.now() }, 60); // 1 minute TTL
        return false;
    }

    // Health check methods
    async healthCheck() {
        const health = {
            postgres: false,
            redis: false,
            timestamp: new Date().toISOString()
        };

        try {
            // Test PostgreSQL
            const client = await this.pgPool.connect();
            await client.query('SELECT 1');
            client.release();
            health.postgres = true;
        } catch (error) {
            this.logger.error('PostgreSQL health check failed:', error);
        }

        try {
            // Test Redis
            await this.redisClient.ping();
            health.redis = true;
        } catch (error) {
            this.logger.error('Redis health check failed:', error);
        }

        return health;
    }

    // Cleanup and shutdown
    async shutdown() {
        this.logger.info('🛑 Shutting down database connections...');

        if (this.redisClient) {
            await this.redisClient.quit();
        }

        if (this.pgPool) {
            await this.pgPool.end();
        }

        this.logger.info('✅ Database connections closed');
    }
}

module.exports = DatabaseService;