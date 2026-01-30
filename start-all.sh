#!/bin/bash
# Startup script for all services

echo "Starting all services..."

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "node.*4000" 2>/dev/null
pkill -f "node.*3000" 2>/dev/null
pkill -f casdoor 2>/dev/null
sleep 2

# Start Logto auth server
echo "Starting Logto auth server on port 4000..."
cd /mnt/usb/projects/webapp/auth-server
nohup node server.js > /tmp/logto.log 2>&1 &
echo "Logto PID: $!"

# Start Casdoor
echo "Starting Casdoor on port 8000..."
cd /mnt/usb/projects/casdoor
nohup ./casdoor > /tmp/casdoor.log 2>&1 &
echo "Casdoor PID: $!"

# Wait for services to be ready
sleep 3

# Start webapp
echo "Starting webapp on port 3000..."
cd /mnt/usb/projects/webapp
nohup npm start > /tmp/webapp.log 2>&1 &
echo "Webapp PID: $!"

sleep 5

# Check status
echo ""
echo "=== Service Status ==="
netstat -tlnp 2>/dev/null | grep -E "(3000|4000|8000)" | sort

echo ""
echo "=== URLs ==="
echo "Web App: http://192.168.10.14:3000"
echo "Logto Admin: http://192.168.10.14:4000/admin"
echo "Casdoor: http://192.168.10.14:8000"

echo ""
echo "=== Log Files ==="
echo "Webapp: /tmp/webapp.log"
echo "Logto: /tmp/logto.log"
echo "Casdoor: /tmp/casdoor.log"

echo ""
echo "All services started!"