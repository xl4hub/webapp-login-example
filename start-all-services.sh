#!/bin/bash
# Start both OAuth server and webapp

echo "Starting OAuth2 Server..."
cd /mnt/usb/projects/webapp/auth-server
npm start &
OAUTH_PID=$!

sleep 2

echo "Starting Web Application..."
cd /mnt/usb/projects/webapp
npm start &
WEBAPP_PID=$!

echo ""
echo "✅ Services started!"
echo "OAuth2 Server PID: $OAUTH_PID"
echo "Web App PID: $WEBAPP_PID"
echo ""
echo "OAuth2 Server: http://localhost:4000"
echo "Web App: http://192.168.10.14:3000"
echo ""
echo "To stop: pkill -f 'node.*server.js'"