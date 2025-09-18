# 🔥 Full Force Academia WhatsApp Bot - Deployment Guide

## 📋 Overview

This guide provides complete instructions for deploying the Full Force Academia WhatsApp Bot with the enhanced Docker infrastructure. The system integrates Baileys and WAHA for hybrid WhatsApp automation with PostgreSQL and Redis for data persistence.

## 🏗️ Architecture

### Core Components

1. **Hybrid WhatsApp Bot** (`academia-app`)
   - Baileys (primary) + WAHA (fallback)
   - Express API server with health endpoints
   - PostgreSQL integration for data persistence
   - Redis integration for session management

2. **WAHA WhatsApp API** (`waha`)
   - HTTP API for WhatsApp
   - Dashboard and webhook support
   - Session management

3. **PostgreSQL Database** (`postgres`)
   - Contact and message storage
   - Member management
   - Analytics and performance metrics

4. **Redis Cache** (`redis`)
   - Session storage
   - Anti-spam management
   - Caching layer

5. **N8N Automation** (`n8n`)
   - Workflow automation
   - Integration hub
   - Advanced automation rules

6. **Adminer** (`adminer`)
   - Database management interface
   - Development and debugging

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- 8GB+ RAM recommended
- 20GB+ disk space

### 1. Clone and Setup

```bash
# Navigate to project directory
cd FullForceAcademia

# Copy environment configuration
cp .env.example .env

# Edit configuration
nano .env
```

### 2. Environment Configuration

Key variables to configure in `.env`:

```bash
# Academia Information
ACADEMIA_NOME=Academia Full Force
ACADEMIA_TELEFONE=+5511999999999

# WhatsApp Configuration
WHATSAPP_PREFERRED_MODE=baileys
WHATSAPP_FALLBACK_ENABLED=true

# Security Keys
WAHA_API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### 3. Deploy Services

```bash
# Navigate to parent directory
cd ..

# Start all services
docker-compose -f docker-compose-academia-waha.yml up -d

# Check status
docker-compose -f docker-compose-academia-waha.yml ps
```

### 4. Verify Deployment

```bash
# Check application health
curl http://localhost:3001/health

# Check WAHA status
curl http://localhost:3000/api/health

# Check N8N status
curl http://localhost:5678/healthz
```

## 📱 WhatsApp Configuration

### Baileys Setup (Primary)

1. **Container Logs**: Monitor for QR code
   ```bash
   docker logs academia-whatsapp-bot -f
   ```

2. **QR Code Scan**: Use WhatsApp mobile app to scan QR code displayed in logs

3. **Session Persistence**: Authentication stored in `/app/sessions/baileys_auth_info`

### WAHA Setup (Fallback)

1. **Access Dashboard**: http://localhost:3000
   - Username: `admin`
   - Password: `admin123` (configure in `.env`)

2. **Create Session**: Use dashboard to create WhatsApp session

3. **API Access**: Use API key for programmatic access

## 🔧 Service Configuration

### Service Ports

| Service | Internal Port | External Port | Purpose |
|---------|---------------|---------------|---------|
| Academia App | 3001 | 3001 | WhatsApp Bot API |
| WAHA | 3000 | 3000 | WhatsApp HTTP API |
| N8N | 5678 | 5678 | Automation Platform |
| PostgreSQL | 5432 | 5434 | Database |
| Redis | 6379 | 6381 | Cache |
| Adminer | 8080 | 8080 | Database Admin |

### Database Access

**Adminer Interface**: http://localhost:8080
- Server: `postgres`
- Username: `n8n`
- Password: `n8n123`
- Database: `n8n`

**Direct Connection**:
```bash
# From host
psql -h localhost -p 5434 -U n8n -d n8n

# From container
docker exec -it academia-postgres psql -U n8n -d n8n
```

## 🔍 Monitoring and Management

### Health Checks

```bash
# Application health
curl http://localhost:3001/health

# Detailed status
curl http://localhost:3001/status

# Analytics
curl http://localhost:3001/analytics
```

### Monitoring Scripts

```bash
# Run health monitor
cd FullForceAcademia
npm run monitor:health

# Continuous monitoring
npm run monitor:continuous

# Configuration validation
npm run validate:config
```

### Log Management

```bash
# View application logs
docker logs academia-whatsapp-bot -f

# View all service logs
docker-compose -f ../docker-compose-academia-waha.yml logs -f

# View specific service
docker logs academia-waha -f
docker logs academia-n8n -f
docker logs academia-postgres -f
```

## 📊 API Endpoints

### Core Endpoints

- `GET /` - System status
- `GET /health` - Health check (required by Docker)
- `GET /status` - Detailed status information
- `GET /analytics` - Basic analytics
- `POST /send-message` - Send WhatsApp message
- `POST /webhook/waha` - WAHA webhook endpoint

### API Usage Examples

**Send Message**:
```bash
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511999999999",
    "message": "Hello from Full Force Academia!"
  }'
```

**Get Analytics**:
```bash
curl http://localhost:3001/analytics
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. WhatsApp Connection Issues

**Symptoms**: QR code not appearing, connection failures
**Solutions**:
```bash
# Check Baileys logs
docker logs academia-whatsapp-bot | grep -i baileys

# Restart application container
docker restart academia-whatsapp-bot

# Clear sessions and restart
docker exec academia-whatsapp-bot rm -rf /app/sessions/baileys_auth_info/*
docker restart academia-whatsapp-bot
```

#### 2. Database Connection Errors

**Symptoms**: Application fails to start, database errors
**Solutions**:
```bash
# Check PostgreSQL status
docker logs academia-postgres

# Verify database connection
docker exec academia-postgres pg_isready -U n8n

# Reset database
docker-compose -f ../docker-compose-academia-waha.yml down -v
docker-compose -f ../docker-compose-academia-waha.yml up -d
```

#### 3. WAHA API Issues

**Symptoms**: WAHA service unavailable, webhook failures
**Solutions**:
```bash
# Check WAHA logs
docker logs academia-waha

# Restart WAHA service
docker restart academia-waha

# Check WAHA session status
curl http://localhost:3000/api/sessions
```

#### 4. Memory Issues

**Symptoms**: Services crashing, slow performance
**Solutions**:
```bash
# Check resource usage
docker stats

# Restart specific service
docker restart academia-whatsapp-bot

# Clean up Docker resources
docker system prune -f
```

### Log Analysis

```bash
# Search for errors across all services
docker-compose -f ../docker-compose-academia-waha.yml logs | grep -i error

# Monitor specific service performance
docker stats academia-whatsapp-bot

# Check application-specific logs
docker exec academia-whatsapp-bot ls -la /app/logs/
```

## 🔐 Security Considerations

### Production Hardening

1. **Change Default Passwords**:
   ```bash
   # In .env file
   WAHA_DASHBOARD_PASSWORD=strong_password_here
   N8N_BASIC_AUTH_PASSWORD=strong_password_here
   REDIS_PASSWORD=strong_password_here
   ```

2. **Network Security**:
   ```bash
   # Limit external access
   # Only expose necessary ports in docker-compose.yml
   ```

3. **SSL/TLS**:
   ```bash
   # Configure reverse proxy (nginx/traefik)
   # Add SSL certificates
   # Update webhook URLs to HTTPS
   ```

4. **Secrets Management**:
   ```bash
   # Use Docker secrets or external secret management
   # Avoid plain text secrets in .env files
   ```

## 📈 Performance Optimization

### Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  academia-app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### Database Optimization

```sql
-- Connect to PostgreSQL and run:

-- Analyze database performance
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Update statistics
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# Monitor Redis performance
docker exec academia-redis redis-cli INFO memory
docker exec academia-redis redis-cli INFO stats

# Adjust memory policy if needed
# (already configured in docker-compose.yml)
```

## 🔄 Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec academia-postgres pg_dump -U n8n n8n > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
npm run backup:volumes
```

### Session Backup

```bash
# Backup WhatsApp sessions
docker cp academia-whatsapp-bot:/app/sessions ./sessions_backup_$(date +%Y%m%d)
```

### Restore Procedures

```bash
# Restore database
cat backup_file.sql | docker exec -i academia-postgres psql -U n8n -d n8n

# Restore sessions
docker cp ./sessions_backup_20240918 academia-whatsapp-bot:/app/sessions
docker restart academia-whatsapp-bot
```

## 📞 Support and Maintenance

### Regular Maintenance

1. **Weekly Tasks**:
   - Check service health
   - Review error logs
   - Monitor resource usage
   - Backup data

2. **Monthly Tasks**:
   - Update Docker images
   - Clean up old logs
   - Performance review
   - Security audit

3. **Monitoring Scripts**:
   ```bash
   # Add to crontab for automated checks
   0 */6 * * * cd /path/to/FullForceAcademia && npm run monitor:health
   0 2 * * 0 cd /path/to/FullForceAcademia && npm run backup:volumes
   ```

### Getting Help

1. **Check Application Logs**: Start with container logs
2. **Run Health Monitor**: Use built-in monitoring scripts
3. **Validate Configuration**: Run configuration validator
4. **Community Support**: Check documentation and forums

---

**🔥 Full Force Academia - Transforming Lives Through Technology! 💪**