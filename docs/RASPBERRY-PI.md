# Raspberry Pi Deployment Guide

## Tested Hardware
- Raspberry Pi 5 (8GB RAM)
- Raspberry Pi 4 (4GB+ recommended)
- Raspberry Pi 400

## OS Requirements
- Raspberry Pi OS (64-bit) - **Required for best performance**
- Raspberry Pi OS Lite is sufficient (no desktop needed)

## Installation

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Git
```bash
sudo apt install -y git
```

### 4. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Run installation
./scripts/check-deps.sh
./scripts/install.sh
```

### 5. Configure for Network Access
Edit `.env` and replace `localhost` with your Pi's IP:
```bash
# Find your IP
hostname -I

# Edit .env
nano .env
```

Change all URLs from `http://localhost:3000` to `http://YOUR_PI_IP:3000`

## Performance Optimization

### 1. Increase Swap (for 4GB models)
```bash
# Temporarily increase swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048

sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### 2. Node.js Memory Settings
Add to your start script:
```bash
export NODE_OPTIONS="--max-old-space-size=1024"
```

### 3. Enable Hardware Acceleration
For SQLite performance:
```bash
# Install optimized SQLite
sudo apt install libsqlite3-dev
npm rebuild better-sqlite3
```

## Auto-Start on Boot

### Using systemd (Recommended)
```bash
sudo ./scripts/setup-systemd.sh
sudo systemctl enable webapp
sudo systemctl enable auth-server
```

### Using rc.local (Alternative)
```bash
sudo nano /etc/rc.local
# Add before 'exit 0':
su - pi -c "cd /home/pi/webapp && npm start > /home/pi/webapp.log 2>&1 &"
```

## USB Drive Setup (Optional)

For logs and data on external storage:

```bash
# Find your USB drive
lsblk

# Create mount point
sudo mkdir /mnt/webapp-data

# Mount drive (replace sdX1 with your drive)
sudo mount /dev/sdX1 /mnt/webapp-data

# Auto-mount on boot
sudo nano /etc/fstab
# Add: /dev/sdX1 /mnt/webapp-data ext4 defaults,nofail 0 0

# Update .env paths
DATABASE_PATH=/mnt/webapp-data/webapp.db
LOG_FILE=/mnt/webapp-data/logs/webapp.log
```

## Network Configuration

### Enable Access from Other Devices
```bash
# Check firewall
sudo ufw status

# Allow webapp ports
sudo ufw allow 3000/tcp
sudo ufw allow 4000/tcp
```

### Static IP (Optional)
```bash
sudo nano /etc/dhcpcd.conf
# Add:
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

## Monitoring

### Check Service Status
```bash
# Service status
sudo systemctl status webapp
sudo systemctl status auth-server

# View logs
sudo journalctl -u webapp -f
sudo journalctl -u auth-server -f

# Resource usage
htop
```

### Temperature Monitoring
```bash
# Check CPU temperature
vcgencmd measure_temp

# Continuous monitoring
watch -n 2 vcgencmd measure_temp
```

## Troubleshooting

### High CPU Usage
- Normal during initial build
- Consider using pre-built dist folder
- Reduce concurrent connections

### Memory Issues
```bash
# Check memory
free -h

# Clear cache
sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

### Slow Performance
1. Ensure 64-bit OS
2. Use Class 10+ SD card
3. Consider USB boot for Pi 4+
4. Disable unnecessary services

### Build Failures
```bash
# Increase npm timeout
npm config set timeout 600000

# Build with reduced parallelism
export JOBS=1
npm install
```

## Security Hardening

### 1. Change Default Password
```bash
passwd
```

### 2. SSH Key Authentication
```bash
ssh-keygen -t ed25519
ssh-copy-id pi@raspberrypi
# Disable password auth in /etc/ssh/sshd_config
```

### 3. Fail2ban
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## Backup Strategy

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/mnt/usb/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup databases
cp data/*.db $BACKUP_DIR/webapp_$DATE.db
cp auth-server/data/*.db $BACKUP_DIR/auth_$DATE.db

# Backup config
cp .env $BACKUP_DIR/env_$DATE

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
```

## Tips

1. **Use Ethernet** over WiFi for better performance
2. **Schedule restarts** weekly for stability
3. **Monitor logs** regularly
4. **Keep system updated** but test updates first
5. **Document your setup** for easy recovery