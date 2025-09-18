#!/bin/bash

# ============================================================================
# FULLFORCE ACADEMIA - DOCKER INFRASTRUCTURE CLEANUP SCRIPT
# ============================================================================
# This script safely cleans up orphaned containers and optimizes Docker resources
# Run with: bash docker-cleanup-script.sh

set -e

echo "🔧 FULLFORCE ACADEMIA - Docker Infrastructure Cleanup"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to safely remove containers
safe_remove_container() {
    local container_name="$1"
    if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
        echo -e "${YELLOW}[INFO]${NC} Removing container: ${container_name}"
        docker stop "$container_name" 2>/dev/null || true
        docker rm "$container_name" 2>/dev/null || true
        echo -e "${GREEN}[SUCCESS]${NC} Container ${container_name} removed"
    else
        echo -e "${BLUE}[SKIP]${NC} Container ${container_name} not found"
    fi
}

# Function to remove orphaned volumes
cleanup_orphaned_volumes() {
    echo -e "\n${BLUE}[CLEANUP]${NC} Removing orphaned Docker volumes..."

    # Remove volumes that are not used by any containers
    orphaned_volumes=$(docker volume ls -f dangling=true -q)
    if [ -n "$orphaned_volumes" ]; then
        echo "$orphaned_volumes" | xargs docker volume rm
        echo -e "${GREEN}[SUCCESS]${NC} Orphaned volumes removed"
    else
        echo -e "${BLUE}[INFO]${NC} No orphaned volumes found"
    fi
}

# Function to remove unused networks
cleanup_networks() {
    echo -e "\n${BLUE}[CLEANUP]${NC} Removing unused Docker networks..."
    docker network prune -f
    echo -e "${GREEN}[SUCCESS]${NC} Unused networks removed"
}

echo -e "\n${YELLOW}[PHASE 1]${NC} Stopping and removing orphaned containers"
echo "---------------------------------------------------"

# Remove orphaned WAHA containers
safe_remove_container "compassionate_gagarin"
safe_remove_container "angry_mahavira"
safe_remove_container "zen_panini"

# Remove orphaned N8N containers
safe_remove_container "n8n-local"
safe_remove_container "n8n-mcp"
safe_remove_container "recursing_sanderson"

echo -e "\n${YELLOW}[PHASE 2]${NC} Cleaning up Docker resources"
echo "--------------------------------------------"

# Clean up orphaned volumes (excluding active ones)
cleanup_orphaned_volumes

# Clean up unused networks
cleanup_networks

echo -e "\n${YELLOW}[PHASE 3]${NC} Docker system cleanup"
echo "------------------------------------"

# Remove dangling images
echo -e "${BLUE}[CLEANUP]${NC} Removing dangling images..."
docker image prune -f

# Clean up build cache
echo -e "${BLUE}[CLEANUP]${NC} Cleaning build cache..."
docker builder prune -f

echo -e "\n${YELLOW}[PHASE 4]${NC} Current infrastructure status"
echo "--------------------------------------------"

echo -e "${BLUE}[STATUS]${NC} Active containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${BLUE}[STATUS]${NC} Docker volumes in use:"
docker volume ls | grep -E "(academia|fullforce|gamified)"

echo -e "\n${BLUE}[STATUS]${NC} Docker networks:"
docker network ls | grep -v "bridge\|host\|none"

echo -e "\n${GREEN}[COMPLETE]${NC} Docker cleanup completed successfully!"
echo -e "${YELLOW}[RECOMMENDATION]${NC} Use 'docker-compose-academia-waha.yml' for the complete FullForce Academia stack"