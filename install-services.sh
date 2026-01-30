#!/bin/bash
# Install all webapp services as systemd units

echo "Installing systemd service files..."

# Copy service files
sudo cp /mnt/usb/projects/webapp/webapp.service /etc/systemd/system/
sudo cp /mnt/usb/projects/webapp/logto-auth.service /etc/systemd/system/
sudo cp /mnt/usb/projects/webapp/casdoor.service /etc/systemd/system/

# Reload systemd
echo "Reloading systemd..."
sudo systemctl daemon-reload

# Enable services (auto-start on boot)
echo "Enabling services..."
sudo systemctl enable webapp.service
sudo systemctl enable logto-auth.service
sudo systemctl enable casdoor.service

# Kill old nohup processes
echo "Stopping old processes..."
pkill -f "node.*4000" 2>/dev/null
pkill -f "node.*3000" 2>/dev/null
pkill -f casdoor 2>/dev/null
sleep 2

# Start services
echo "Starting services..."
sudo systemctl start logto-auth.service
sudo systemctl start casdoor.service
sleep 3
sudo systemctl start webapp.service

# Show status
echo ""
echo "=== Service Status ==="
sudo systemctl status logto-auth.service --no-pager -l
echo ""
sudo systemctl status casdoor.service --no-pager -l
echo ""
sudo systemctl status webapp.service --no-pager -l

echo ""
echo "✅ Services installed and started!"
echo "They will now:"
echo "  - Auto-start on boot"
echo "  - Auto-restart on crash"
echo "  - Run continuously in background"
echo ""
echo "To manage:"
echo "  sudo systemctl status webapp|logto-auth|casdoor"
echo "  sudo systemctl restart webapp|logto-auth|casdoor"
echo "  sudo systemctl stop webapp|logto-auth|casdoor"
