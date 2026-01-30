# Docker Deployment Guide

## Overview

This guide covers containerizing the webapp stack using Docker and Docker Compose. The setup includes:
- WebApp (TypeScript/Express)
- Auth-server (Custom OAuth2)
- Casdoor (Optional identity server)
- Logto (Optional identity platform)

## Quick Start

```bash
# Run the setup script
chmod +x docker-setup.sh
./docker-setup.sh

# Access the services
# WebApp: http://localhost:3000
# Auth Server: http://localhost:4000/admin
```

## Architecture Support

### Multi-Architecture Builds
The Dockerfiles support both x86_64 and ARM64:
- Intel/AMD processors (amd64)
- Raspberry Pi 3/4/5 (arm64)
- Older Raspberry Pi (arm/v7)

### Building for Multiple Architectures
```bash
# Enable Docker buildx
docker buildx create --use

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
```

## Docker Compose Files

### Standard Configuration (`docker-compose.yml`)
- Full stack with all services
- Suitable for development and x86_64 production
- Includes Casdoor and Logto

### Raspberry Pi Configuration (`docker-compose.pi.yml`)
- Optimized for ARM devices
- Lower memory limits
- USB storage for volumes
- Excludes heavy services

## Service Configuration

### Environment Variables
Create a `.env` file:
```env
# Security
SESSION_SECRET=your-random-secret-here
OAUTH_CLIENT_SECRET=another-random-secret

# External URL (for OAuth redirects)
EXTERNAL_URL=http://your-server-ip

# Service passwords
LOGTO_ADMIN_PASSWORD=secure-password
```

### Networking
Services communicate via internal network:
- Internal: `http://service-name:port`
- External: `http://host-ip:port`

Example:
```javascript
// Internal communication
const authUrl = 'http://auth-server:4000/oauth/token';

// External redirect
const redirectUrl = process.env.EXTERNAL_URL + ':4000/oauth/authorize';
```

## Deployment Scenarios

### Development Mode
```bash
# Start with logs
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f webapp
```

### Production Mode
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# With nginx proxy
docker-compose -f docker-compose.yml -f docker-compose.nginx.yml up -d
```

### Raspberry Pi
```bash
# Use Pi-optimized configuration
docker-compose -f docker-compose.pi.yml up -d

# Check memory usage
docker stats
```

## Volume Management

### Data Persistence
```yaml
volumes:
  webapp-data:    # Application data
  auth-data:      # OAuth server data
  casdoor-data:   # Casdoor configuration
  logto-data:     # Logto database
```

### Backup
```bash
# Backup all volumes
docker run --rm -v webapp-data:/data -v $(pwd):/backup alpine tar czf /backup/webapp-backup.tar.gz -C /data .

# Restore
docker run --rm -v webapp-data:/data -v $(pwd):/backup alpine tar xzf /backup/webapp-backup.tar.gz -C /data
```

### Raspberry Pi USB Storage
```yaml
volumes:
  webapp-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/usb/docker-volumes/webapp-data
```

## Health Checks

All services include health checks:
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

Check health status:
```bash
docker-compose ps
docker inspect webapp --format='{{.State.Health.Status}}'
```

## Monitoring

### Resource Usage
```bash
# Real-time stats
docker stats

# Container logs
docker-compose logs -f --tail=100

# System resources
htop
```

### Log Aggregation
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Security Best Practices

### 1. Non-Root Users
All containers run as non-root:
```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs
```

### 2. Secret Management
```bash
# Generate secure secrets
openssl rand -hex 32

# Use Docker secrets (Swarm mode)
echo "my-secret" | docker secret create session_secret -
```

### 3. Network Isolation
```yaml
networks:
  auth-network:
    internal: true  # No external access
  public-network:
    external: true
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs webapp

# Interactive debug
docker-compose run --rm webapp sh
```

### Permission Issues
```bash
# Fix volume permissions
docker-compose run --rm webapp chown -R nodejs:nodejs /app/data
```

### Memory Issues (Pi)
```bash
# Check memory
free -h

# Increase swap
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile  # CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Network Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect webapp_auth-network

# Test connectivity
docker-compose exec webapp ping auth-server
```

## Advanced Configuration

### Custom Nginx Proxy
```nginx
upstream webapp {
    server webapp:3000;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://webapp;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /auth {
        proxy_pass http://auth-server:4000;
    }
}
```

### SSL/TLS with Let's Encrypt
```yaml
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs

  letsencrypt:
    image: nginxproxy/acme-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - certs:/etc/nginx/certs
    environment:
      - DEFAULT_EMAIL=admin@example.com
```

### Scaling Services
```bash
# Scale webapp to 3 instances
docker-compose up -d --scale webapp=3

# With load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

## Migration from Docker Compose to Kubernetes

### Using Kompose
```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.28.0/kompose-linux-amd64 -o kompose
chmod +x kompose

# Convert to Kubernetes manifests
./kompose convert -f docker-compose.yml

# Deploy to Kubernetes
kubectl apply -f .
```

### Helm Chart Structure
```
webapp-chart/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
```

## Performance Optimization

### Image Size Reduction
- Multi-stage builds
- Alpine Linux base
- Production dependencies only
- No build tools in final image

### Caching Strategy
```dockerfile
# Cache dependencies
COPY package*.json ./
RUN npm ci --production

# Then copy source
COPY . .
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      memory: 256M
```

## Maintenance

### Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

# Rolling update
docker-compose up -d --no-deps webapp
```

### Cleanup
```bash
# Remove stopped containers
docker-compose rm -f

# Remove unused images
docker image prune -a

# Full cleanup
docker system prune -a --volumes
```