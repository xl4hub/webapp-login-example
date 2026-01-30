# Local OAuth2 Server Setup

✅ **Both servers are running!**

## OAuth2 Server (Port 4000)
- **URL:** http://localhost:4000
- **Status:** Running
- **Default login:** admin / admin123

### OAuth Endpoints:
- Authorization: http://localhost:4000/oauth/authorize
- Token: http://localhost:4000/oauth/token
- User Info: http://localhost:4000/oauth/userinfo

### OAuth Credentials:
```
Client ID: webapp-client
Client Secret: webapp-secret-d11db8de85239edb5e8d932c18c728e8
```

## Web App (Port 3000)
- **URL:** http://192.168.10.14:3000
- **Status:** Running with authentication enabled
- **Login:** Click "Login with log2" button

## How Authentication Works

1. User clicks "Login with log2" on webapp
2. Redirected to OAuth server login page
3. User enters credentials (admin/admin123)
4. OAuth server redirects back with authorization code
5. Webapp exchanges code for access token
6. User is logged in!

## File Locations

- OAuth Server: `~/usb-projects/webapp/auth-server/`
- Web App: `~/usb-projects/webapp/`
- OAuth Database: `~/usb-projects/webapp/auth-server/oauth.db`

## Managing the Servers

### Check status:
```bash
ps aux | grep -E "(auth-server|webapp)" | grep node
```

### Stop servers:
```bash
pkill -f "auth-server/server.js"
pkill -f "webapp/dist/server.js"
```

### Restart servers:
```bash
cd ~/usb-projects/webapp/auth-server && npm start &
cd ~/usb-projects/webapp && npm start &
```

## Adding Users

To add new users to the OAuth server:
```bash
sqlite3 ~/usb-projects/webapp/auth-server/oauth.db
INSERT INTO users (username, password, email, name) 
VALUES ('newuser', '$2b$10$...', 'user@example.com', 'New User');
```

Note: Passwords must be bcrypt hashed!