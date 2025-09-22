/**
 * 🔐 N8N AUTHENTICATION MIDDLEWARE
 * Security middleware for N8N workflow integration
 * Ensures secure communication between N8N and JavaScript services
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Authenticate N8N requests
 */
const authenticateN8N = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const n8nSecret = req.headers['x-n8n-secret'];
        const timestamp = req.headers['x-timestamp'];

        // Check for API token
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            // Verify against environment variable
            if (token === process.env.ACADEMIA_API_TOKEN) {
                req.authSource = 'api_token';
                return next();
            }
        }

        // Check for N8N webhook secret
        if (n8nSecret) {
            const expectedSecret = process.env.N8N_WEBHOOK_SECRET || 'fullforce_n8n_secret_2024';

            if (n8nSecret === expectedSecret) {
                req.authSource = 'n8n_secret';
                return next();
            }
        }

        // Check for timestamp-based authentication (webhook verification)
        if (timestamp && isValidTimestamp(timestamp)) {
            const signature = req.headers['x-signature'];
            const body = JSON.stringify(req.body);

            if (verifyWebhookSignature(body, signature, timestamp)) {
                req.authSource = 'webhook_signature';
                return next();
            }
        }

        logger.warn('🚫 N8N Authentication failed', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            path: req.path
        });

        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Valid API token, N8N secret, or webhook signature required'
        });

    } catch (error) {
        logger.error('❌ N8N Auth error:', error);
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

/**
 * Validate N8N payload structure
 */
const validateN8NPayload = (req, res, next) => {
    try {
        const contentType = req.headers['content-type'];

        // Ensure JSON content type
        if (!contentType || !contentType.includes('application/json')) {
            return res.status(400).json({
                success: false,
                error: 'Content-Type must be application/json'
            });
        }

        // Validate payload exists
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Request body is required'
            });
        }

        // Add N8N context to request
        req.n8nContext = {
            source: req.headers['x-n8n-source'] || 'unknown',
            workflowId: req.headers['x-n8n-workflow-id'],
            executionId: req.headers['x-n8n-execution-id'],
            nodeId: req.headers['x-n8n-node-id'],
            timestamp: new Date().toISOString()
        };

        logger.info('📝 N8N Payload validated', {
            source: req.n8nContext.source,
            workflowId: req.n8nContext.workflowId,
            path: req.path
        });

        next();

    } catch (error) {
        logger.error('❌ N8N Payload validation error:', error);
        return res.status(400).json({
            success: false,
            error: 'Invalid payload format'
        });
    }
};

/**
 * Rate limiting for N8N requests
 */
const rateLimitN8N = (() => {
    const requests = new Map();
    const WINDOW_SIZE = 60 * 1000; // 1 minute
    const MAX_REQUESTS = 1000; // 1000 requests per minute

    return (req, res, next) => {
        const clientId = getClientIdentifier(req);
        const now = Date.now();

        // Clean old entries
        if (requests.has(clientId)) {
            const clientRequests = requests.get(clientId);
            const validRequests = clientRequests.filter(time => now - time < WINDOW_SIZE);
            requests.set(clientId, validRequests);
        }

        // Check rate limit
        const clientRequests = requests.get(clientId) || [];

        if (clientRequests.length >= MAX_REQUESTS) {
            logger.warn('🚫 N8N Rate limit exceeded', {
                clientId,
                requests: clientRequests.length,
                path: req.path
            });

            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded',
                retryAfter: Math.ceil(WINDOW_SIZE / 1000)
            });
        }

        // Add current request
        clientRequests.push(now);
        requests.set(clientId, clientRequests);

        next();
    };
})();

/**
 * Webhook signature verification
 */
const verifyWebhookSignature = (body, signature, timestamp) => {
    try {
        const webhookSecret = process.env.N8N_WEBHOOK_SECRET || 'fullforce_n8n_secret_2024';
        const payload = timestamp + '.' + body;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(payload, 'utf8')
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (error) {
        logger.error('❌ Webhook signature verification error:', error);
        return false;
    }
};

/**
 * Validate timestamp freshness (prevent replay attacks)
 */
const isValidTimestamp = (timestamp) => {
    try {
        const requestTime = parseInt(timestamp);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeDiff = Math.abs(currentTime - requestTime);

        // Allow 5 minutes tolerance
        return timeDiff <= 300;
    } catch (error) {
        return false;
    }
};

/**
 * Get client identifier for rate limiting
 */
const getClientIdentifier = (req) => {
    // Use N8N workflow ID if available, otherwise fall back to IP
    return req.n8nContext?.workflowId ||
           req.headers['x-n8n-workflow-id'] ||
           req.ip ||
           'unknown';
};

/**
 * Advanced N8N request validation
 */
const validateN8NSource = (allowedSources = []) => {
    return (req, res, next) => {
        const source = req.headers['x-n8n-source'] || req.n8nContext?.source;

        if (allowedSources.length > 0 && !allowedSources.includes(source)) {
            logger.warn('🚫 Invalid N8N source', {
                source,
                allowedSources,
                path: req.path
            });

            return res.status(403).json({
                success: false,
                error: 'Invalid source',
                allowedSources
            });
        }

        next();
    };
};

/**
 * Secure headers for N8N responses
 */
const secureN8NHeaders = (req, res, next) => {
    // Add security headers
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });

    // Add N8N-specific headers
    res.set({
        'X-API-Version': '2.0',
        'X-Service': 'fullforce-academia',
        'X-Integration': 'n8n-automation'
    });

    next();
};

/**
 * CORS configuration for N8N
 */
const corsForN8N = (req, res, next) => {
    const allowedOrigins = [
        process.env.N8N_URL,
        'http://localhost:5678',
        'https://n8n.fullforceacademia.com'
    ].filter(Boolean);

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.set({
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-N8N-Secret, X-Timestamp, X-Signature, X-N8N-Source, X-N8N-Workflow-ID, X-N8N-Execution-ID',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '86400'
        });
    }

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
};

/**
 * Error handler for N8N authentication
 */
const handleN8NAuthError = (error, req, res, next) => {
    logger.error('❌ N8N Auth Error:', error);

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Authentication error',
        code: 'AUTH_ERROR'
    });
};

module.exports = {
    authenticateN8N,
    validateN8NPayload,
    rateLimitN8N,
    validateN8NSource,
    secureN8NHeaders,
    corsForN8N,
    handleN8NAuthError,
    verifyWebhookSignature,
    isValidTimestamp
};