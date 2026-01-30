# Setup Guide

## Prerequisites

- Node.js 18 or later
- npm (comes with Node.js)
- Linux, macOS, or Windows with WSL
- 500MB free disk space
- 1GB RAM minimum (2GB recommended)

## Quick Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webapp
   ```

2. **Check dependencies**
   ```bash
   ./scripts/check-deps.sh
   ```

3. **Run the installer**
   ```bash
   ./scripts/install.sh
   ```

4. **Configure environment**
   ```bash
   cp config/.env.example .env
   nano .env  # or your preferred editor
   ```

5. **Start the application**
   ```bash
   npm start
   ```

## Manual Installation

If the scripts don't work on your system:

```bash
# Install webapp dependencies
npm install

# Install auth-server dependencies
cd auth-server
npm install
cd ..

# Build the application
npm run build

# Create required directories
mkdir -p data logs auth-server/data

# Copy environment template
cp config/.env.example .env
```

## Configuration

### Essential Settings

Edit `.env` and configure:

- `SESSION_SECRET`: Generate a random string (32+ characters)
- `OAUTH_CLIENT_SECRET`: Generate another random string
- Replace `localhost` with your server's IP if accessing remotely

### Generate Secrets

```bash
# Generate random secrets on Linux/Mac
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using PM2 (recommended for production)
```bash
# Install PM2
npm install -g pm2

# Start both services
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save
pm2 startup
```

### Using systemd
```bash
sudo ./scripts/setup-systemd.sh
sudo systemctl start webapp
sudo systemctl start auth-server
```

## Default Credentials

The auth server comes with a default admin account:
- Username: `admin`
- Password: `admin123`

**⚠️ Change this immediately in production!**

## Accessing the Application

- Web Application: http://localhost:3000
- Auth Server Admin: http://localhost:4000/admin
- API Endpoints: http://localhost:3000/api/

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Permission Errors
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Security Considerations

1. Always change default passwords
2. Use HTTPS in production
3. Configure firewall rules
4. Keep Node.js updated
5. Regular security audits

## Next Steps

- [Raspberry Pi Specific Guide](RASPBERRY-PI.md)
- [Ubuntu Production Guide](UBUNTU.md)
- [API Documentation](API.md)