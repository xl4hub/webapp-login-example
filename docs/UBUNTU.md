# Ubuntu/Debian Production Deployment Guide

## System Requirements
- Ubuntu 20.04 LTS or later (22.04 recommended)
- Debian 11 or later
- 2GB RAM minimum (4GB recommended)
- 10GB free disk space

## Initial Server Setup

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Create Application User
```bash
# Create dedicated user
sudo useradd -m -s /bin/bash webappuser
sudo passwd webappuser

# Add to sudo group (optional)
sudo usermod -aG sudo webappuser
```

### 3. Install Node.js
```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Application Deployment

### 1. Clone Repository
```bash
sudo su - webappuser
git clone <repository-url>
cd webapp
```

### 2. Install and Build
```bash
./scripts/check-deps.sh
./scripts/install.sh

# Configure environment
cp config/.env.example .env
nano .env
```

### 3. Production Configuration
Update `.env` for production:
```env
NODE_ENV=production
SESSION_SECRET=<generate-long-random-string>
OAUTH_CLIENT_SECRET=<generate-another-random-string>

# Use your domain or server IP
OAUTH_CALLBACK_URL=https://yourdomain.com/auth/callback
```

## Reverse Proxy Setup (nginx)

### 1. Install nginx
```bash
sudo apt install -y nginx
```

### 2. Configure nginx
```bash
sudo nano /etc/nginx/sites-available/webapp
```

```nginx
# Main webapp
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth server API
    location /oauth {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Process Management with PM2

### 1. Install PM2
```bash
sudo npm install -g pm2
```

### 2. Create ecosystem file
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'webapp',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/webapp-error.log',
      out_file: './logs/webapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '1G'
    },
    {
      name: 'auth-server',
      script: './auth-server/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/auth-error.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      max_memory_restart: '500M'
    }
  ]
};
```

### 3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Follow the command output to enable startup
```

## Database Optimization

### PostgreSQL Option
For better performance at scale:

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres createdb webapp
sudo -u postgres createuser webappuser

# Update application to use PostgreSQL
# (requires code changes)
```

## Security Hardening

### 1. Firewall Setup
```bash
# Install ufw
sudo apt install -y ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban
```bash
sudo apt install -y fail2ban

# Configure for nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-limit-req]
enabled = true
```

### 3. Security Headers
Add to nginx config:
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Monitoring and Logging

### 1. System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install Netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 2. Application Monitoring
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View logs
pm2 logs webapp
pm2 logs auth-server

# Monitor resources
pm2 monit
```

### 3. Log Aggregation
```bash
# Install Loki + Promtail (optional)
# Or use ELK stack
# Or simply use journalctl
journalctl -u webapp -f
```

## Backup Strategy

### 1. Automated Backups
```bash
# Create backup script
sudo nano /opt/webapp-backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/webapp"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/webappuser/webapp"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup databases
cp $APP_DIR/data/*.db $BACKUP_DIR/db_$DATE/

# Backup config
cp $APP_DIR/.env $BACKUP_DIR/config_$DATE

# Create archive
tar -czf $BACKUP_DIR/webapp_$DATE.tar.gz -C $APP_DIR data .env

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Optional: sync to remote storage
# rsync -avz $BACKUP_DIR/ remote-server:/backups/
```

### 2. Schedule Backups
```bash
sudo chmod +x /opt/webapp-backup.sh
sudo crontab -e
# Add: 0 2 * * * /opt/webapp-backup.sh
```

## Performance Tuning

### 1. Node.js Settings
```bash
# In ecosystem.config.js or .env
NODE_OPTIONS="--max-old-space-size=4096"
UV_THREADPOOL_SIZE=128
```

### 2. nginx Optimization
```nginx
# In nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    multi_accept on;
    worker_connections 65535;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript;
}
```

### 3. System Limits
```bash
# Edit limits
sudo nano /etc/security/limits.conf

# Add:
webappuser soft nofile 65535
webappuser hard nofile 65535
```

## Troubleshooting

### High Load
```bash
# Check CPU usage
htop
ps aux | sort -nrk 3,3 | head -n 10

# Check memory
free -m
ps aux | sort -nrk 4,4 | head -n 10

# Check disk I/O
iotop
```

### Connection Issues
```bash
# Check listening ports
sudo netstat -tlnp

# Check nginx
sudo nginx -t
sudo systemctl status nginx

# Check PM2 apps
pm2 status
pm2 logs --lines 100
```

### Database Lock
```bash
# For SQLite locks
lsof | grep webapp.db

# Restart application
pm2 restart webapp
```

## Maintenance

### Regular Updates
```bash
# System updates
sudo apt update && sudo apt upgrade

# Node.js updates
npm outdated
npm update

# PM2 updates
pm2 update
```

### Health Checks
Add to monitoring:
```bash
# Health check endpoint
curl http://localhost:3000/health

# Database check
sqlite3 data/webapp.db "SELECT COUNT(*) FROM users;"
```

## Scaling Considerations

1. **Horizontal Scaling**: Use PM2 cluster mode
2. **Database**: Migrate to PostgreSQL/MySQL for concurrent writes
3. **Sessions**: Use Redis for session storage
4. **Static Files**: Serve via CDN
5. **Load Balancing**: Use HAProxy or nginx upstream