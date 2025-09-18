# Full Force Academia - Docker Setup Guide

This guide provides complete instructions for setting up and managing the Full Force Academia WhatsApp automation system using Docker.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ for development
- Port availability: 3000, 3001, 5434, 5678, 6381, 8080

### Setup Commands

```bash
# 1. Setup directories
npm run setup:directories

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 3. Validate configuration
npm run validate:config

# 4. Clean any existing conflicts
npm run cleanup:docker

# 5. Start all services
npm run docker:up

# 6. Verify system health
npm run health:all

# 7. Run integration tests
npm run test:integration
```

## 📋 System Architecture

### Services Overview

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Academia App** | 3001 | WhatsApp Bot Application | ✅ Optimized |
| **WAHA API** | 3000 | WhatsApp HTTP API | ✅ Enhanced |
| **n8n** | 5678 | Workflow Automation | ✅ Configured |
| **PostgreSQL** | 5434 | Database (conflict-free) | ✅ Updated |
| **Redis** | 6381 | Cache & Queue (conflict-free) | ✅ Updated |
| **Adminer** | 8080 | Database Management | ✅ Enhanced |

### Port Conflict Resolution

**Original Issues:**
- PostgreSQL: 5432 → **5434** (avoiding conflicts)
- Redis: 6379 → **6381** (avoiding conflicts)

**Benefits:**
- No conflicts with existing services
- Parallel development environments
- Isolated container networking

## 🛠️ Configuration Files

### Updated Docker Compose (`docker-compose-academia-waha.yml`)

**Enhancements:**
- ✅ Resolved port conflicts
- ✅ Added comprehensive logging
- ✅ Enhanced health checks
- ✅ Security improvements
- ✅ Performance optimizations
- ✅ Monitoring capabilities

### Environment Configuration (`.env`)

**New Variables:**
```bash
# Database (Updated Ports)
DATABASE_URL=postgresql://n8n:n8n123@localhost:5434/n8n
DB_PORT=5434

# Redis (Updated Ports)
REDIS_HOST=localhost
REDIS_PORT=6381
REDIS_PASSWORD=redis123

# WAHA Integration
WAHA_API_URL=http://localhost:3000
WAHA_API_KEY=academia_secure_key_2024

# Security & Monitoring
JWT_SECRET=your_jwt_secret_key_here
ENABLE_METRICS=true
ENABLE_HEALTH_CHECK=true
```

## 📜 Available Scripts

### Docker Management
```bash
npm run docker:build      # Build application image
npm run docker:up         # Start all services
npm run docker:down       # Stop all services
npm run docker:restart    # Restart all services
npm run docker:status     # Check service status
npm run docker:rebuild    # Full rebuild and restart
npm run docker:clean      # Clean unused resources
```

### Monitoring & Health
```bash
npm run health:check      # Check application health
npm run health:all        # Check all services health
npm run monitor:health    # One-time health monitoring
npm run monitor:continuous # Continuous health monitoring
npm run monitor:services  # Watch service status
```

### Testing & Validation
```bash
npm run validate:config   # Validate configuration
npm run test:integration  # Run integration tests
npm run cleanup:docker    # Clean orphaned containers
```

### Logging & Debugging
```bash
npm run logs:app         # View application logs
npm run logs:waha        # View WAHA API logs
npm run logs:n8n         # View n8n logs
npm run docker:logs      # View all container logs
```

### Backup & Restore
```bash
npm run backup:volumes   # Backup PostgreSQL data
npm run restore:volumes  # Restore PostgreSQL data
```

## 🔧 Management Commands

### Configuration Validation

```bash
# Comprehensive configuration check
npm run validate:config

# Sample output:
# 🔍 Validating Full Force Academia Configuration...
# 📋 Validating Environment Variables...
# ✅ PORT: configured
# ✅ ACADEMIA_NOME: configured
# 🔌 Validating Port Configuration...
# ✅ Port 3001 (Application): available
# ✅ Port 5434 (PostgreSQL): available
```

### Health Monitoring

```bash
# Single health check
npm run monitor:health

# Continuous monitoring (5-minute intervals)
npm run monitor:continuous

# Sample output:
# 🏥 Full Force Academia - Health Monitor
# ✅ Academia WhatsApp Bot [CRITICAL]
# ✅ WAHA API [CRITICAL]
# ✅ n8n Automation [NON-CRITICAL]
```

### Integration Testing

```bash
# Full integration test suite
npm run test:integration

# Sample output:
# 🧪 Full Force Academia - Integration Tests
# 🔌 Testing Service Connectivity...
# ✅ Application: Connected
# ✅ WAHA API: Connected
# 📊 INTEGRATION TEST REPORT
# Total Tests: 12
# ✅ Passed: 12
# 🎉 ALL TESTS PASSED
```

### Docker Cleanup

```bash
# Clean orphaned containers and conflicts
npm run cleanup:docker

# Sample output:
# 🧹 Full Force Academia - Docker Cleanup
# 🔍 Identifying Orphaned Containers...
# Found potentially orphaned containers:
#    - old_postgres_container
# 🧹 Executing cleanup...
# ✅ Removed: old_postgres_container
```

## 🚨 Troubleshooting

### Common Issues

**1. Port Conflicts**
```bash
# Check what's using ports
netstat -an | grep :5432
netstat -an | grep :6379

# Clean conflicting containers
npm run cleanup:docker
```

**2. Service Not Starting**
```bash
# Check logs
npm run docker:logs

# Restart specific service
docker restart academia-postgres
docker restart academia-redis
```

**3. Database Connection Issues**
```bash
# Verify PostgreSQL is running on correct port
docker ps | grep postgres

# Test connection
psql -h localhost -p 5434 -U n8n -d n8n
```

**4. Redis Connection Issues**
```bash
# Test Redis connection
redis-cli -h localhost -p 6381 -a redis123 ping
```

### Health Check Failures

```bash
# If health checks fail:
1. npm run validate:config    # Check configuration
2. npm run cleanup:docker     # Clean conflicts
3. npm run docker:rebuild     # Rebuild everything
4. npm run test:integration   # Verify functionality
```

## 📊 Monitoring Dashboard

### Service Status URLs

- **Application Health**: http://localhost:3001/health
- **WAHA Dashboard**: http://localhost:3000 (admin/admin123)
- **n8n Interface**: http://localhost:5678 (admin/academia123)
- **Database Manager**: http://localhost:8080
- **Application Root**: http://localhost:3001

### Log Files

- Application: `./logs/app/`
- WAHA: `./logs/waha/`
- n8n: `./logs/n8n/`
- Health Reports: `./logs/health-report-*.json`
- Integration Tests: `./logs/integration-test-*.json`

## 🔐 Security Features

### Enhanced Security
- Environment variable-based secrets
- Non-root container users
- Isolated network communications
- Comprehensive logging
- Rate limiting capabilities
- Input validation ready

### Production Recommendations
1. Change all default passwords
2. Use strong JWT secrets
3. Enable HTTPS in production
4. Configure firewall rules
5. Set up log rotation
6. Enable backup automation

## 🚀 Deployment Workflow

### Development
```bash
1. npm run validate:config
2. npm run docker:up
3. npm run health:all
4. npm run test:integration
```

### Production
```bash
1. Update .env for production
2. npm run cleanup:docker
3. npm run docker:rebuild
4. npm run monitor:continuous &
5. Setup backup automation
```

### Continuous Integration
```bash
# CI/CD Pipeline Commands
npm run validate:config
npm run test:integration
npm run docker:build
npm run health:all
```

## 📈 Performance Optimizations

### Database (PostgreSQL)
- Optimized connection pools
- Performance-tuned settings
- Automated backup system
- Health monitoring

### Redis
- Memory optimization (512MB limit)
- LRU eviction policy
- Persistence configuration
- Connection pooling

### Application
- Multi-stage Docker builds
- Security hardening
- Logging optimization
- Health check endpoints

## 🎯 Next Steps

1. **Configure Google APIs**: Update .env with real Google credentials
2. **Setup Webhooks**: Configure n8n workflows for WhatsApp automation
3. **Enable Monitoring**: Setup continuous health monitoring
4. **Production Deploy**: Follow production deployment checklist
5. **Backup Strategy**: Implement automated backup procedures

---

**Full Force Academia WhatsApp Automation System**
*Optimized for Docker deployment with port conflict resolution*

For support or questions, check the logs or run diagnostic commands.