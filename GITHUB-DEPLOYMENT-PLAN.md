# GitHub Deployment Plan for Webapp

## Overview
This plan covers pushing the webapp + auth server to GitHub with portable deployment scripts that work on both x86_64 (Ubuntu) and Raspberry Pi (ARM64).

## Repository Structure

```
webapp/
├── src/                    # Main webapp source
├── auth-server/           # OAuth2 identity server
├── public/                # Static assets
├── scripts/               # Deployment scripts
│   ├── install.sh         # Main installer
│   ├── setup-systemd.sh   # Service setup
│   └── check-deps.sh      # Dependency checker
├── config/                # Configuration templates
│   ├── .env.example
│   ├── webapp.service.template
│   └── auth-server.service.template
├── docs/                  # Documentation
│   ├── SETUP.md
│   ├── RASPBERRY-PI.md
│   └── UBUNTU.md
├── .gitignore
├── package.json
├── README.md
└── DEPLOYMENT.md
```

## Phase 1: Prepare for Git

### 1.1 Create .gitignore
```
node_modules/
dist/
.env
*.db
*.sqlite
data/
logs/
.DS_Store
*.log
npm-debug.log*
*.pid
*.seed
*.pid.lock
.npm
.eslintcache
```

### 1.2 Remove Sensitive Data
- Remove any hardcoded secrets
- Ensure .env is not tracked
- Clean up any database files with real data

### 1.3 Create Configuration Templates
- Convert .env to .env.example with placeholders
- Create service file templates with variable substitution

## Phase 2: Create Portable Scripts

### 2.1 Main Install Script (scripts/install.sh)
```bash
#!/bin/bash
set -e

# Detect architecture
ARCH=$(uname -m)
OS=$(uname -s)

echo "Installing webapp on $OS $ARCH"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js 18 or later."
    exit 1
fi

# Install dependencies
npm install --production
cd auth-server && npm install --production && cd ..

# Build the webapp
npm run build

# Setup directories
mkdir -p data logs

# Copy environment template
if [ ! -f .env ]; then
    cp config/.env.example .env
    echo "Please configure .env with your settings"
fi

echo "Installation complete!"
```

### 2.2 Dependency Checker (scripts/check-deps.sh)
```bash
#!/bin/bash

# Check for required commands
REQUIRED_COMMANDS="node npm"
OPTIONAL_COMMANDS="systemctl nginx"

for cmd in $REQUIRED_COMMANDS; do
    if ! command -v $cmd &> /dev/null; then
        echo "ERROR: $cmd is required but not installed"
        exit 1
    fi
done

for cmd in $OPTIONAL_COMMANDS; do
    if ! command -v $cmd &> /dev/null; then
        echo "WARNING: $cmd is recommended but not installed"
    fi
done

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MIN_VERSION="18.0.0"
if [ "$(printf '%s\n' "$MIN_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_VERSION" ]; then
    echo "ERROR: Node.js $MIN_VERSION or higher required (found $NODE_VERSION)"
    exit 1
fi
```

## Phase 3: Documentation

### 3.1 Main README.md
```markdown
# Web Application with OAuth2 Server

A TypeScript web application with built-in OAuth2 identity server.

## Features
- Modern TypeScript + Express.js backend
- Tailwind CSS frontend
- Local OAuth2 server for authentication
- SQLite database for user management
- Cross-platform: works on x86_64 and ARM64 (Raspberry Pi)

## Quick Start
```bash
git clone <your-repo>
cd webapp
./scripts/check-deps.sh
./scripts/install.sh
npm start
```

## Requirements
- Node.js 18 or later
- npm
- Linux/macOS/WSL (Windows)

## Documentation
- [Setup Guide](docs/SETUP.md)
- [Raspberry Pi Guide](docs/RASPBERRY-PI.md)
- [Ubuntu Guide](docs/UBUNTU.md)
```

### 3.2 Architecture-Specific Docs

**docs/RASPBERRY-PI.md**
- Specific Pi setup instructions
- Performance tuning tips
- systemd service setup
- Auto-start configuration

**docs/UBUNTU.md**
- Ubuntu/Debian setup
- nginx reverse proxy config
- Production deployment tips

## Phase 4: GitHub Actions (Optional)

### 4.1 CI/CD Workflow (.github/workflows/ci.yml)
```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: npm run build
    - run: npm test
```

## Phase 5: Docker Support (Optional)

### 5.1 Dockerfile
```dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY auth-server/package*.json ./auth-server/

# Install dependencies
RUN npm ci --production && \
    cd auth-server && npm ci --production

# Copy application
COPY . .

# Build
RUN npm run build

EXPOSE 3000 4000

CMD ["npm", "start"]
```

### 5.2 docker-compose.yml
```yaml
version: '3.8'
services:
  webapp:
    build: .
    ports:
      - "3000:3000"
      - "4000:4000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## Phase 6: Git Commands

```bash
# Initialize repository
cd ~/usb-projects/webapp
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: webapp with OAuth2 server"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/webapp.git

# Push to GitHub
git push -u origin main
```

## Phase 7: Post-Deploy Setup

### On Target System:
```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/webapp.git
cd webapp

# Run setup
./scripts/check-deps.sh
./scripts/install.sh

# Configure
cp config/.env.example .env
nano .env  # Edit configuration

# Start services
npm start

# Or with systemd
sudo ./scripts/setup-systemd.sh
sudo systemctl start webapp
sudo systemctl start auth-server
```

## Key Considerations

1. **Architecture Detection**: Scripts detect ARM64 vs x86_64 automatically
2. **No Binary Dependencies**: Pure JavaScript/TypeScript for portability
3. **SQLite**: Works on all platforms without external database
4. **Configuration**: Environment variables for all settings
5. **Documentation**: Clear guides for each platform

## Security Notes

- Never commit .env files
- Rotate OAuth secrets before deploying
- Use HTTPS in production
- Configure firewall rules
- Regular security updates

## Next Steps

1. Review and clean up existing code
2. Create the directory structure
3. Write the deployment scripts
4. Test on both architectures
5. Push to GitHub
6. Tag a release