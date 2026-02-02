# Web Application with OAuth2 Authentication

A TypeScript web application demonstrating OAuth2 authentication with Logto and Casdoor identity providers.

## Quick Start

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f
```

Access the application at:
- **Web App**: http://localhost:3000
- **Logto Admin**: http://localhost:3002
- **Casdoor Admin**: http://localhost:8000

## Default Login

Both Logto and Casdoor are pre-configured with a test user:
- **Username**: `excelfore`
- **Password**: `Excelfore32!`

## Services

| Service | Port | Description |
|---------|------|-------------|
| webapp | 3000 | Main web application |
| logto | 3001 | Logto OIDC endpoint |
| logto | 3002 | Logto Admin Console |
| casdoor | 8000 | Casdoor identity server |

## Configuration

Copy `.env.example` to `.env` and customize as needed:

```bash
cp .env.example .env
```

Key variables:
- `SESSION_SECRET` - Session encryption key
- `LOGTO_CLIENT_ID` / `LOGTO_CLIENT_SECRET` - Logto OAuth credentials
- `CASDOOR_CLIENT_ID` / `CASDOOR_CLIENT_SECRET` - Casdoor OAuth credentials

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
