# Dual Authentication Setup

Your webapp now supports TWO authentication providers! 🎉

## 🚀 Running Services

### Port 3000: Web Application
- URL: http://192.168.10.14:3000
- Two login buttons: Logto & Casdoor

### Port 4000: Logto Server
- Admin Console: http://192.168.10.14:4000/admin
- Default Login: admin / admin123
- Client ID: webapp-client
- Client Secret: webapp-secret-d11db8de85239edb5e8d932c18c728e8

### Port 8000: Casdoor Server
- Admin Console: http://192.168.10.14:8000/admin
- Default Login: admin / admin123
- Client ID: webapp-client
- Client Secret: webapp-secret-casdoor

## 🔐 Test Users

Both servers have the same users for easy testing:
- **admin** / admin123
- **john** / password123 (Logto only)

## 🎯 How to Test

1. Open http://192.168.10.14:3000
2. You'll see TWO login buttons:
   - 🔐 **Login with Logto** (purple button)
   - 🛡️ **Login with Casdoor** (green button)
3. Click either button to authenticate
4. Both will redirect back to the webapp after login

## 📊 Architecture

```
                     Web App (Port 3000)
                    /                    \
                   /                      \
         Logto Server (4000)      Casdoor Server (8000)
              |                           |
         SQLite DB                   SQLite DB
        (oauth.db)                  (casdoor.db)
```

## 🛠️ Managing Users

### Logto Admin
- Web UI: http://192.168.10.14:4000/admin
- CLI: `cd auth-server && node admin.js`

### Casdoor Admin
- Web UI: http://192.168.10.14:8000/admin
- Beautiful login page with gradient design

## 🔧 Configuration

All settings in `/webapp/.env`:
- LOGTO_* variables for Logto
- CASDOOR_* variables for Casdoor

Both providers use standard OAuth2 flow with:
- Authorization endpoint
- Token endpoint
- User info endpoint