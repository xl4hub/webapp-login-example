#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Docker Setup for WebApp ===${NC}"

# Detect architecture
ARCH=$(uname -m)
COMPOSE_FILE="docker-compose.yml"

if [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "armv7l" ]]; then
    echo -e "${YELLOW}Detected ARM architecture ($ARCH)${NC}"
    echo -e "${YELLOW}Using Raspberry Pi optimized configuration${NC}"
    COMPOSE_FILE="docker-compose.pi.yml"
    
    # Create volume directories on USB if available
    if [ -d "/mnt/usb" ]; then
        echo -e "${GREEN}Creating Docker volumes on USB storage${NC}"
        sudo mkdir -p /mnt/usb/docker-volumes/{webapp-data,webapp-logs,auth-data}
        sudo chown -R $USER:$USER /mnt/usb/docker-volumes
    fi
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    echo -e "Install Docker with:"
    echo -e "  curl -fsSL https://get.docker.com | sh"
    echo -e "  sudo usermod -aG docker $USER"
    echo -e "  logout and login again"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    echo -e "Install with:"
    echo -e "  sudo apt install docker-compose"
    exit 1
fi

# Build multi-architecture images if needed
if [ "$1" == "--build-multiarch" ]; then
    echo -e "\n${GREEN}Building multi-architecture images${NC}"
    
    # Enable buildx
    docker buildx create --use --name multiarch-builder || true
    
    # Build webapp
    echo -e "${YELLOW}Building webapp for linux/amd64,linux/arm64${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag webapp:latest \
        --push=false \
        --load \
        .
    
    # Build auth-server
    echo -e "${YELLOW}Building auth-server for linux/amd64,linux/arm64${NC}"
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --tag auth-server:latest \
        --push=false \
        --load \
        ./auth-server
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${GREEN}Creating .env file${NC}"
    cat > .env << EOF
# Docker environment variables
SESSION_SECRET=$(openssl rand -hex 32)
OAUTH_CLIENT_SECRET=$(openssl rand -hex 32)
LOGTO_ADMIN_PASSWORD=$(openssl rand -hex 16)
EXTERNAL_URL=http://$(hostname -I | awk '{print $1}')

# Add custom environment variables here
EOF
    echo -e "${YELLOW}Generated random secrets in .env${NC}"
    echo -e "${YELLOW}Please review and update if needed${NC}"
fi

# Docker Compose command
COMPOSE_CMD="docker-compose"
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
fi

# Start services
echo -e "\n${GREEN}Starting services with $COMPOSE_FILE${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE up -d

# Wait for services
echo -e "\n${BLUE}Waiting for services to be healthy...${NC}"
sleep 5

# Check service status
echo -e "\n${GREEN}Service Status:${NC}"
$COMPOSE_CMD -f $COMPOSE_FILE ps

# Get container IPs
echo -e "\n${GREEN}Service URLs:${NC}"
if [ -f "/.dockerenv" ]; then
    # Running inside Docker
    echo -e "  WebApp: http://webapp:3000"
    echo -e "  Auth Server: http://auth-server:4000"
else
    # Running on host
    IP=$(hostname -I | awk '{print $1}')
    echo -e "  WebApp: ${BLUE}http://$IP:3000${NC}"
    echo -e "  Auth Server: ${BLUE}http://$IP:4000${NC}"
    echo -e "  Auth Admin: ${BLUE}http://$IP:4000/admin${NC}"
    
    if [[ "$COMPOSE_FILE" == "docker-compose.yml" ]]; then
        echo -e "  Casdoor: ${BLUE}http://$IP:8000${NC}"
        echo -e "  Logto: ${BLUE}http://$IP:3001${NC}"
        echo -e "  Logto Admin: ${BLUE}http://$IP:3002${NC}"
    fi
fi

echo -e "\n${GREEN}Default credentials:${NC}"
echo -e "  Auth Server: admin/admin123"
echo -e "  ${YELLOW}⚠️  Change these in production!${NC}"

echo -e "\n${GREEN}Useful commands:${NC}"
echo -e "  View logs: ${BLUE}$COMPOSE_CMD -f $COMPOSE_FILE logs -f${NC}"
echo -e "  Stop services: ${BLUE}$COMPOSE_CMD -f $COMPOSE_FILE down${NC}"
echo -e "  Restart service: ${BLUE}$COMPOSE_CMD -f $COMPOSE_FILE restart webapp${NC}"
echo -e "  View stats: ${BLUE}docker stats${NC}"

echo -e "\n${GREEN}✅ Docker setup complete!${NC}"