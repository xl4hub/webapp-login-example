#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}=== Systemd Service Setup ===${NC}"

# Get the actual user (not root)
ACTUAL_USER="${SUDO_USER:-$USER}"
WEBAPP_DIR=$(pwd)
NODE_PATH=$(which node)

echo -e "User: ${YELLOW}$ACTUAL_USER${NC}"
echo -e "Directory: ${YELLOW}$WEBAPP_DIR${NC}"
echo -e "Node path: ${YELLOW}$NODE_PATH${NC}"

# Create webapp service
echo -e "\n${GREEN}Creating webapp.service...${NC}"
cat > /etc/systemd/system/webapp.service <<EOF
[Unit]
Description=Web Application
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$WEBAPP_DIR
ExecStart=$NODE_PATH dist/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# Logging
StandardOutput=append:/var/log/webapp.log
StandardError=append:/var/log/webapp-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Create auth-server service
echo -e "${GREEN}Creating auth-server.service...${NC}"
cat > /etc/systemd/system/auth-server.service <<EOF
[Unit]
Description=OAuth2 Auth Server
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$WEBAPP_DIR/auth-server
ExecStart=$NODE_PATH server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4000

# Logging
StandardOutput=append:/var/log/auth-server.log
StandardError=append:/var/log/auth-server-error.log

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Create log files and set permissions
touch /var/log/{webapp,webapp-error,auth-server,auth-server-error}.log
chown $ACTUAL_USER:$ACTUAL_USER /var/log/{webapp,webapp-error,auth-server,auth-server-error}.log

# Reload systemd
echo -e "\n${GREEN}Reloading systemd...${NC}"
systemctl daemon-reload

# Enable services
echo -e "${GREEN}Enabling services...${NC}"
systemctl enable webapp.service
systemctl enable auth-server.service

echo -e "\n${GREEN}✓ Systemd setup complete!${NC}"
echo -e "\nAvailable commands:"
echo -e "  ${YELLOW}systemctl start webapp${NC}        - Start webapp"
echo -e "  ${YELLOW}systemctl start auth-server${NC}   - Start auth server"
echo -e "  ${YELLOW}systemctl status webapp${NC}       - Check webapp status"
echo -e "  ${YELLOW}systemctl status auth-server${NC}  - Check auth server status"
echo -e "  ${YELLOW}journalctl -u webapp -f${NC}       - View webapp logs"
echo -e "  ${YELLOW}journalctl -u auth-server -f${NC}  - View auth server logs"

# Ask if user wants to start services now
echo -e "\n${YELLOW}Start services now? (y/n)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    systemctl start webapp
    systemctl start auth-server
    echo -e "${GREEN}✓ Services started!${NC}"
    echo -e "\nWebapp: http://localhost:3000"
    echo -e "Auth server: http://localhost:4000"
fi