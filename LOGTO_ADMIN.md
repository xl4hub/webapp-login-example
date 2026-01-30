# Logto Admin Console

Your local Logto server now has a web-based admin console! 🎉

## Access the Admin Console

### Option 1: Direct URLs
- **Admin Console**: http://192.168.10.14:4000/admin
- **Server Home**: http://192.168.10.14:4000

### Option 2: Command
```bash
cd /mnt/usb/projects/webapp/auth-server
./open-admin.sh
```

## Features

The web admin console lets you:
- ✅ View all users
- ✅ Add new users
- ✅ Delete users  
- ✅ View OAuth clients
- ✅ See server configuration

## Default Login

The webapp uses these credentials:
- Username: `admin`
- Password: `admin123`

## Test Users Created
- `john` / `password123`

## OAuth Client
- Client ID: `webapp-client`
- Client Secret: `webapp-secret-d11db8de85239edb5e8d932c18c728e8`

## Architecture

```
Port 3000: Your Web App
    ↓
Port 4000: Logto Auth Server
    ├── /         - Home page
    ├── /admin    - Admin console
    └── /oauth/*  - OAuth endpoints
```