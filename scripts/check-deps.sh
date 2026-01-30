#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dependency Checker ===${NC}"

# Track if all requirements are met
ALL_GOOD=true

# Check for required commands
echo -e "\n${GREEN}Checking required dependencies:${NC}"
REQUIRED_COMMANDS="node npm"

for cmd in $REQUIRED_COMMANDS; do
    if command -v $cmd &> /dev/null; then
        VERSION=$($cmd --version 2>/dev/null || echo "unknown")
        echo -e "  ✓ $cmd: ${GREEN}installed${NC} (version: $VERSION)"
    else
        echo -e "  ✗ $cmd: ${RED}NOT INSTALLED${NC}"
        ALL_GOOD=false
    fi
done

# Check for optional commands
echo -e "\n${GREEN}Checking optional dependencies:${NC}"
OPTIONAL_COMMANDS="git systemctl nginx pm2"

for cmd in $OPTIONAL_COMMANDS; do
    if command -v $cmd &> /dev/null; then
        VERSION=$($cmd --version 2>/dev/null | head -n1 || echo "unknown")
        echo -e "  ✓ $cmd: ${GREEN}installed${NC} (version: $VERSION)"
    else
        echo -e "  - $cmd: ${YELLOW}not installed${NC} (optional)"
    fi
done

# Check Node version if installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    MIN_VERSION="18.0.0"
    
    echo -e "\n${GREEN}Node.js version check:${NC}"
    if [ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$MIN_VERSION" ]; then
        echo -e "  ✓ Node.js $NODE_VERSION: ${GREEN}meets minimum requirement ($MIN_VERSION)${NC}"
    else
        echo -e "  ✗ Node.js $NODE_VERSION: ${RED}below minimum requirement ($MIN_VERSION)${NC}"
        ALL_GOOD=false
    fi
fi

# Check system resources
echo -e "\n${GREEN}System resources:${NC}"
# Memory
MEM_TOTAL=$(free -m | awk 'NR==2{print $2}')
MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
echo -e "  Memory: ${MEM_AVAILABLE}MB available / ${MEM_TOTAL}MB total"

# Disk space
DISK_AVAILABLE=$(df -BM . | awk 'NR==2{print $4}' | sed 's/M//')
echo -e "  Disk space: ${DISK_AVAILABLE}MB available in current directory"

# Architecture
ARCH=$(uname -m)
echo -e "  Architecture: $ARCH"

# Port availability
echo -e "\n${GREEN}Checking port availability:${NC}"
for PORT in 3000 4000; do
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "  Port $PORT: ${RED}IN USE${NC}"
        ALL_GOOD=false
    else
        echo -e "  Port $PORT: ${GREEN}available${NC}"
    fi
done

# Summary
echo -e "\n${GREEN}=== Summary ===${NC}"
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✓ All requirements met! Ready to install.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some requirements not met. Please install missing dependencies.${NC}"
    exit 1
fi