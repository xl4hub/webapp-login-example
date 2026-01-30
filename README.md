# Web Application with OAuth2 Authentication

A modern TypeScript web application with built-in OAuth2 identity server, designed to run on both x86_64 and ARM64 (Raspberry Pi) systems.

## 🚀 Features

- **Full-stack TypeScript** application with Express.js backend
- **OAuth2 Authentication Server** with admin panel
- **Tailwind CSS** for modern, responsive UI
- **SQLite Database** for zero-configuration data storage
- **Cross-platform** support (Ubuntu, Debian, Raspberry Pi OS)
- **Production-ready** with systemd and PM2 support
- **Security-focused** with proper session management

## 📋 Requirements

- Node.js 18.0 or later
- npm 8.0 or later
- Linux, macOS, or Windows with WSL
- 500MB free disk space
- 1GB RAM minimum (2GB recommended)

## 🔧 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd webapp

# Check system dependencies
./scripts/check-deps.sh

# Run the installer
./scripts/install.sh

# Configure environment
cp config/.env.example .env
# Edit .env with your settings

# Start the application
npm start
```

Access the application at:
- Web App: http://localhost:3000
- Auth Admin: http://localhost:4000/admin (admin/admin123)

## 📁 Project Structure

```
webapp/
├── src/                    # TypeScript source files
│   ├── server.ts          # Main Express server
│   ├── auth.ts            # Authentication logic
│   └── routes/            # API routes
├── auth-server/           # OAuth2 server
│   ├── server.js          # OAuth2 implementation
│   └── admin.html         # Admin interface
├── public/                # Static assets
├── scripts/               # Deployment scripts
├── config/                # Configuration templates
├── docs/                  # Documentation
└── dist/                  # Compiled JavaScript (generated)
```

## 🛠️ Installation

### Automated Installation

The easiest way is using our install script:

```bash
./scripts/install.sh
```

This will:
- Install all dependencies
- Build the TypeScript application
- Create required directories
- Set up initial configuration

### Manual Installation

See [docs/SETUP.md](docs/SETUP.md) for detailed manual installation steps.

### Platform-Specific Guides

- [Raspberry Pi Setup](docs/RASPBERRY-PI.md)
- [Ubuntu Production Setup](docs/UBUNTU.md)

## ⚙️ Configuration

### Environment Variables

Key configuration in `.env`:

```env
# Server
PORT=3000
SESSION_SECRET=<random-string>

# OAuth2 Settings
OAUTH_CLIENT_ID=webapp-client
OAUTH_CLIENT_SECRET=<random-string>
OAUTH_AUTH_URL=http://localhost:4000/oauth/authorize
OAUTH_TOKEN_URL=http://localhost:4000/oauth/token
OAUTH_USERINFO_URL=http://localhost:4000/oauth/userinfo
OAUTH_CALLBACK_URL=http://localhost:3000/auth/callback
```

### Generating Secrets

```bash
# Generate secure random strings
openssl rand -hex 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Running in Production

### Using systemd (Linux)

```bash
sudo ./scripts/setup-systemd.sh
sudo systemctl start webapp
sudo systemctl start auth-server
```

### Using PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker

```bash
docker-compose up -d
```

## 🔒 Security

**Important**: The default admin credentials are:
- Username: `admin`
- Password: `admin123`

**Change these immediately in production!**

### Security Best Practices

1. Always use HTTPS in production
2. Change all default passwords
3. Use strong session secrets
4. Keep Node.js and dependencies updated
5. Configure firewall rules appropriately
6. Enable rate limiting for APIs

## 📚 API Documentation

### Authentication Endpoints

- `GET /auth/login` - Initiate OAuth2 login
- `GET /auth/callback` - OAuth2 callback
- `POST /auth/logout` - Logout user
- `GET /api/me` - Get current user info

### Application Endpoints

- `GET /api/health` - Health check
- `GET /api/status` - Application status

## 🛠️ Development

### Running in Development Mode

```bash
# Install dev dependencies
npm install

# Run with hot reload
npm run dev
```

### Building

```bash
# Compile TypeScript
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
lsof -i :3000
kill -9 <PID>
```

**Permission errors**
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**Build failures**
```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Getting Help

1. Check the [documentation](docs/)
2. Review [common issues](docs/TROUBLESHOOTING.md)
3. Open an issue on GitHub

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the Apache License 2.0 - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Express.js and TypeScript
- UI styled with Tailwind CSS
- Authentication powered by OAuth2
- Designed for Raspberry Pi enthusiasts

---

**Note**: This application includes a built-in OAuth2 server for development and small deployments. For large-scale production use, consider integrating with established identity providers like Auth0, Okta, or Keycloak.