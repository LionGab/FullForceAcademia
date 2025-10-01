#!/bin/bash

# MCP Sequential Thinking Server Deployment Script
# This script deploys the MCP server to production or development environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-development}"
VERSION="${2:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."

    local deps=("docker" "docker-compose" "curl" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            log_error "$dep is not installed. Please install it first."
            exit 1
        fi
    done

    log_success "All dependencies are installed"
}

# Validate environment
validate_environment() {
    log_info "Validating environment: $ENVIRONMENT"

    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment. Must be: development, staging, or production"
        exit 1
    fi

    # Check if environment file exists
    local env_file="$PROJECT_DIR/.env.$ENVIRONMENT"
    if [[ ! -f "$env_file" ]]; then
        log_warning "Environment file $env_file not found. Using .env.example"
        cp "$PROJECT_DIR/.env.example" "$env_file"
    fi

    log_success "Environment validation complete"
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."

    cd "$PROJECT_DIR"

    # Build main application image
    docker build \
        --target production \
        --tag "mcp-sequential-thinking:$VERSION" \
        --tag "mcp-sequential-thinking:latest" \
        .

    if [[ "$ENVIRONMENT" == "development" ]]; then
        # Build development image
        docker build \
            --target development \
            --tag "mcp-sequential-thinking:dev" \
            .
    fi

    log_success "Docker images built successfully"
}

# Setup database
setup_database() {
    log_info "Setting up database..."

    # Start PostgreSQL container if not running
    docker-compose up -d postgres

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    timeout 60 bash -c 'until docker-compose exec -T postgres pg_isready -U postgres; do sleep 2; done'

    # Run database migrations
    if [[ -f "$PROJECT_DIR/sql/migrations.sql" ]]; then
        log_info "Running database migrations..."
        docker-compose exec -T postgres psql -U postgres -d whatsapp_automation -f /docker-entrypoint-initdb.d/migrations.sql
    fi

    log_success "Database setup complete"
}

# Setup Redis
setup_redis() {
    log_info "Setting up Redis..."

    # Start Redis container
    docker-compose up -d redis

    # Wait for Redis to be ready
    log_info "Waiting for Redis to be ready..."
    timeout 30 bash -c 'until docker-compose exec -T redis redis-cli ping | grep -q PONG; do sleep 2; done'

    log_success "Redis setup complete"
}

# Deploy services
deploy_services() {
    log_info "Deploying services for $ENVIRONMENT environment..."

    cd "$PROJECT_DIR"

    # Use appropriate docker-compose file
    local compose_file="docker-compose.yml"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        compose_file="docker-compose.prod.yml"
    elif [[ "$ENVIRONMENT" == "development" ]]; then
        compose_file="docker-compose.dev.yml"
    fi

    # Deploy all services
    if [[ -f "$compose_file" ]]; then
        docker-compose -f "$compose_file" up -d
    else
        docker-compose up -d
    fi

    log_success "Services deployed successfully"
}

# Health check
health_check() {
    log_info "Performing health checks..."

    local services=("mcp-server" "postgres" "redis")

    for service in "${services[@]}"; do
        log_info "Checking $service health..."

        # Wait for service to be healthy
        timeout 120 bash -c "until docker-compose exec -T $service-whatsapp echo 'Service is running' 2>/dev/null; do sleep 5; done" || {
            log_error "$service failed to start properly"
            return 1
        }
    done

    # Check MCP server endpoint
    log_info "Checking MCP server API..."
    timeout 60 bash -c 'until curl -f http://localhost:8000/health &>/dev/null; do sleep 5; done'

    log_success "All health checks passed"
}

# Backup data (for production)
backup_data() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating backup..."

        local backup_dir="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"

        # Backup database
        docker-compose exec -T postgres pg_dump -U postgres whatsapp_automation > "$backup_dir/database.sql"

        # Backup Redis data
        docker-compose exec -T redis redis-cli BGSAVE
        docker cp "$(docker-compose ps -q redis):/data/dump.rdb" "$backup_dir/redis.rdb"

        # Backup configuration files
        cp -r "$PROJECT_DIR/config" "$backup_dir/"

        log_success "Backup created at $backup_dir"
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring..."

    # Start monitoring services
    docker-compose up -d prometheus grafana

    # Wait for services to be ready
    timeout 60 bash -c 'until curl -f http://localhost:9090/api/v1/status/config &>/dev/null; do sleep 5; done'
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health &>/dev/null; do sleep 5; done'

    log_success "Monitoring setup complete"
    log_info "Prometheus: http://localhost:9090"
    log_info "Grafana: http://localhost:3001 (admin/password)"
}

# Cleanup old containers and images
cleanup() {
    log_info "Cleaning up old containers and images..."

    # Remove old containers
    docker container prune -f

    # Remove old images (keep last 3 versions)
    docker images "mcp-sequential-thinking" --format "table {{.Tag}}\t{{.ID}}" | \
        tail -n +4 | awk '{print $2}' | xargs -r docker rmi

    log_success "Cleanup complete"
}

# Generate SSL certificates (for production)
setup_ssl() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Setting up SSL certificates..."

        local ssl_dir="$PROJECT_DIR/nginx/ssl"
        mkdir -p "$ssl_dir"

        # Generate self-signed certificate (replace with real certificate)
        if [[ ! -f "$ssl_dir/server.crt" ]]; then
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$ssl_dir/server.key" \
                -out "$ssl_dir/server.crt" \
                -subj "/C=BR/ST=SP/L=SaoPaulo/O=FullForce/CN=localhost"
        fi

        log_success "SSL certificates configured"
    fi
}

# Main deployment function
main() {
    log_info "Starting deployment of MCP Sequential Thinking Server"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"

    check_dependencies
    validate_environment

    # Production-specific steps
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backup_data
        setup_ssl
    fi

    build_images
    setup_database
    setup_redis
    deploy_services
    health_check

    if [[ "$ENVIRONMENT" != "development" ]]; then
        setup_monitoring
    fi

    cleanup

    log_success "Deployment completed successfully!"

    # Display access information
    echo ""
    log_info "Service URLs:"
    echo "  MCP Server: http://localhost:8000"
    echo "  N8N: http://localhost:5678 (admin/password)"
    echo "  WhatsApp API: http://localhost:3000"

    if [[ "$ENVIRONMENT" != "development" ]]; then
        echo "  Prometheus: http://localhost:9090"
        echo "  Grafana: http://localhost:3001 (admin/password)"
    fi

    echo ""
    log_info "Useful commands:"
    echo "  View logs: docker-compose logs -f mcp-server"
    echo "  Stop services: docker-compose down"
    echo "  Restart: docker-compose restart mcp-server"
    echo "  Scale: docker-compose up -d --scale mcp-server=3"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi