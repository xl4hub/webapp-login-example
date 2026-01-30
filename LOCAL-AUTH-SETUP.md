# Local Authentication Setup

✅ **Local username/password authentication is now active!**

## Default Login

**URL:** http://192.168.10.14:3000/local/login

**Default credentials:**
- Username: `admin`
- Password: `admin123`

## Features

1. **User Registration**
   - Create new accounts at: http://192.168.10.14:3000/local/register
   - Username, email, and password required
   - Passwords are hashed with bcrypt

2. **SQLite Database**
   - User data stored in: `webapp/data/users.db`
   - Automatic database initialization
   - Secure password hashing

3. **Session Management**
   - 24-hour sessions
   - Secure cookies
   - Logout functionality

## How to Use

1. **Login as Admin:**
   - Go to: http://192.168.10.14:3000/login
   - Click "Login with Username/Password"
   - Enter: admin / admin123

2. **Create New Users:**
   - Visit: http://192.168.10.14:3000/local/register
   - Fill out the registration form
   - Auto-login after successful registration

3. **Access Protected Content:**
   - Dashboard: http://192.168.10.14:3000/dashboard
   - API: http://192.168.10.14:3000/api/items

## Database Management

View all users (admin only):
```bash
curl -b cookies.txt http://192.168.10.14:3000/api/users
```

Direct database access:
```bash
sqlite3 ~/usb-projects/webapp/data/users.db
.tables
SELECT * FROM users;
```

## Security Notes

1. **Change the default admin password** after first login
2. Passwords are hashed with bcrypt (10 rounds)
3. Use HTTPS in production for secure transmission
4. Session cookies are httpOnly

## Switching to log2 Later

This local auth works independently. When you're ready to use log2:
1. Add log2 credentials to `.env`
2. Restart the server
3. Both auth methods will be available