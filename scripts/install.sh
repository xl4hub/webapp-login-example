#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Web Application Installer ===${NC}"

# Detect architecture and OS
ARCH=$(uname -m)
OS=$(uname -s)
DISTRO="Unknown"

if [ -f /etc/os-release ]; then
    . /etc/os-release
    DISTRO=$NAME
fi

echo -e "Platform: ${YELLOW}$OS $ARCH${NC}"
echo -e "Distribution: ${YELLOW}$DISTRO${NC}"

# Check for Node.js
echo -e "\n${GREEN}Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found!${NC}"
    echo "Please install Node.js 18 or later:"
    if [[ "$DISTRO" == *"Ubuntu"* ]] || [[ "$DISTRO" == *"Debian"* ]]; then
        echo "  sudo apt update && sudo apt install nodejs npm"
    elif [[ "$DISTRO" == *"Raspberry Pi OS"* ]]; then
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt install nodejs"
    fi
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2)
echo -e "Node.js version: ${YELLOW}$NODE_VERSION${NC}"

# Check Node version
MIN_VERSION="18.0.0"
if [ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo -e "${RED}ERROR: Node.js $MIN_VERSION or higher required${NC}"
    exit 1
fi

# Install main webapp dependencies
echo -e "\n${GREEN}Installing webapp dependencies...${NC}"
npm install --production

# Install auth-server dependencies
echo -e "\n${GREEN}Installing auth-server dependencies...${NC}"
cd auth-server
npm install --production
cd ..

# Build the webapp
echo -e "\n${GREEN}Building webapp...${NC}"
if [ -f "tsconfig.json" ]; then
    npm run build
fi

# Setup directories
echo -e "\n${GREEN}Setting up directories...${NC}"
mkdir -p data logs auth-server/data

# Copy environment template
if [ ! -f .env ]; then
    if [ -f config/.env.example ]; then
        cp config/.env.example .env
    elif [ -f .env.example ]; then
        cp .env.example .env
    else
        echo -e "${YELLOW}WARNING: No .env.example found${NC}"
    fi
    echo -e "${YELLOW}Please configure .env with your settings${NC}"
fi

# Set permissions
chmod +x scripts/*.sh

echo -e "\n${GREEN}✓ Installation complete!${NC}"
echo -e "\nNext steps:"
echo "1. Edit .env to configure your settings"
echo "2. Run 'npm start' to start the webapp"
echo "3. Access the webapp at http://localhost:3000"
echo -e "\nFor systemd setup, run: ${YELLOW}sudo ./scripts/setup-systemd.sh${NC}"