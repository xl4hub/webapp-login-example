# Docker Quick Start Guide

## 🚀 One-Line Start
```bash
chmod +x docker-setup.sh && ./docker-setup.sh
```

## 📋 What Gets Deployed

### Standard Setup (x86_64)
- ✅ WebApp (port 3000)
- ✅ Auth-server (port 4000)
- ✅ Casdoor (port 8000)
- ✅ Logto (ports 3001/3002)

### Raspberry Pi Setup
- ✅ WebApp (port 3000) - memory limited
- ✅ Auth-server (port 4000) - memory limited
- ❌ Casdoor/Logto (too heavy for Pi)

## 🔧 Manual Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Restart a service
docker-compose restart webapp
```

### Raspberry Pi
```bash
# Use Pi-specific config
docker-compose -f docker-compose.pi.yml up -d

# Check memory usage
docker stats
```

## 🌐 Access URLs

After running `docker-setup.sh`, find your IP and access:
- WebApp: `http://YOUR-IP:3000`
- Auth Admin: `http://YOUR-IP:4000/admin` (admin/admin123)
- Casdoor: `http://YOUR-IP:8000` (x86 only)
- Logto: `http://YOUR-IP:3001` (x86 only)

## 🛠️ Troubleshooting

### Service won't start
```bash
docker-compose logs webapp  # Check specific service logs
```

### Out of memory (Pi)
```bash
# Use Pi-optimized config
docker-compose -f docker-compose.pi.yml up -d
```

### Permission issues
```bash
# Fix volume permissions
sudo chown -R $USER:$USER ./data
```

## 🏗️ Building for Multiple Architectures

```bash
# Enable buildx
docker buildx create --use

# Build for x86 and ARM
docker buildx build --platform linux/amd64,linux/arm64 -t webapp:latest .
```

## 📦 Volumes & Backup

### Backup all data
```bash
# Create backup
docker run --rm \
  -v webapp_webapp-data:/data/webapp \
  -v webapp_auth-data:/data/auth \
  -v $(pwd):/backup \
  alpine tar czf /backup/docker-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore from backup
```bash
# Restore data
docker run --rm \
  -v webapp_webapp-data:/data/webapp \
  -v webapp_auth-data:/data/auth \
  -v $(pwd):/backup \
  alpine tar xzf /backup/docker-backup-20260129.tar.gz -C /data
```

## 🔒 Production Checklist

- [ ] Change default passwords in .env
- [ ] Set `SESSION_SECRET` to random value
- [ ] Update `EXTERNAL_URL` to your domain
- [ ] Enable HTTPS with nginx/traefik
- [ ] Set up automated backups
- [ ] Configure firewall rules

## 📊 Resource Requirements

### Minimum (Pi 4)
- RAM: 2GB
- Storage: 1GB
- CPU: 4 cores

### Recommended (x86)
- RAM: 4GB
- Storage: 5GB
- CPU: 2+ cores

## 🆘 Get Help

1. Check service logs: `docker-compose logs -f webapp`
2. Read full guide: [docs/DOCKER.md](docs/DOCKER.md)
3. Check health: `curl http://localhost:3000/api/health`