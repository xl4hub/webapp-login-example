const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'oauth.db'));

// Initialize database
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    name TEXT
  )`);

  // OAuth clients table
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    name TEXT,
    redirect_uri TEXT
  )`);

  // OAuth codes table
  db.run(`CREATE TABLE IF NOT EXISTS auth_codes (
    code TEXT PRIMARY KEY,
    client_id TEXT,
    user_id INTEGER,
    redirect_uri TEXT,
    expires_at INTEGER
  )`);

  // OAuth tokens table
  db.run(`CREATE TABLE IF NOT EXISTS access_tokens (
    token TEXT PRIMARY KEY,
    client_id TEXT,
    user_id INTEGER,
    expires_at INTEGER
  )`);

  // Create default client for our webapp
  const clientId = 'webapp-client';
  const clientSecret = 'webapp-secret-' + crypto.randomBytes(16).toString('hex');
  
  db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, row) => {
    if (!row) {
      db.run('INSERT INTO clients (id, secret, name, redirect_uri) VALUES (?, ?, ?, ?)',
        [clientId, clientSecret, 'Web App', 'http://192.168.10.14:3000/auth/logto/callback'],
        (err) => {
          if (!err) {
            console.log(`📝 OAuth Client Created:`);
            console.log(`   Client ID: ${clientId}`);
            console.log(`   Client Secret: ${clientSecret}`);
          }
        }
      );
    } else {
      console.log(`📝 OAuth Client:`);
      console.log(`   Client ID: ${row.id}`);
      console.log(`   Client Secret: ${row.secret}`);
    }
  });

  // Create default user
  db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, row) => {
    if (!row) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      db.run('INSERT INTO users (username, password, email, name) VALUES (?, ?, ?, ?)',
        ['admin', hashedPassword, 'admin@local', 'Administrator'],
        (err) => {
          if (!err) {
            console.log('👤 Default user: admin / admin123');
          }
        }
      );
    }
  });
});

// OAuth endpoints
app.get('/oauth/authorize', (req, res) => {
  const { client_id, redirect_uri, response_type, state } = req.query;
  
  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).send('Invalid request');
  }

  // Simple login form
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login - OAuth Server</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .login-box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #1f2937; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; color: #4b5563; font-size: 0.875rem; }
        input { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; }
        button { width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
        button:hover { background: #2563eb; }
        .error { color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem; }
        .info { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="login-box">
        <h2>Login to OAuth Server</h2>
        ${req.query.error ? '<div class="error">Invalid username or password</div>' : ''}
        <form method="POST" action="/oauth/authorize">
          <input type="hidden" name="client_id" value="${client_id}">
          <input type="hidden" name="redirect_uri" value="${redirect_uri}">
          <input type="hidden" name="response_type" value="${response_type}">
          <input type="hidden" name="state" value="${state || ''}">
          
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autofocus>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          <button type="submit">Authorize</button>
          
          <p class="info">Default: admin / admin123</p>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.post('/oauth/authorize', (req, res) => {
  const { username, password, client_id, redirect_uri, response_type, state } = req.body;
  
  // Verify user credentials
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user || !await bcrypt.compare(password, user.password)) {
      return res.redirect(`/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=${response_type}&state=${state}&error=1`);
    }
    
    // Verify client
    db.get('SELECT * FROM clients WHERE id = ?', [client_id], (err, client) => {
      if (err || !client) {
        return res.status(400).send('Invalid client');
      }
      
      // Generate authorization code
      const code = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 600000; // 10 minutes
      
      db.run('INSERT INTO auth_codes (code, client_id, user_id, redirect_uri, expires_at) VALUES (?, ?, ?, ?, ?)',
        [code, client_id, user.id, redirect_uri, expiresAt],
        (err) => {
          if (err) {
            return res.status(500).send('Server error');
          }
          
          // Redirect with code
          const redirectUrl = new URL(redirect_uri);
          redirectUrl.searchParams.append('code', code);
          if (state) redirectUrl.searchParams.append('state', state);
          
          res.redirect(redirectUrl.toString());
        }
      );
    });
  });
});

app.post('/oauth/token', (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;
  
  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }
  
  // Verify client
  db.get('SELECT * FROM clients WHERE id = ? AND secret = ?', [client_id, client_secret], (err, client) => {
    if (err || !client) {
      return res.status(401).json({ error: 'invalid_client' });
    }
    
    // Verify code
    db.get('SELECT * FROM auth_codes WHERE code = ? AND client_id = ? AND expires_at > ?',
      [code, client_id, Date.now()],
      (err, authCode) => {
        if (err || !authCode) {
          return res.status(400).json({ error: 'invalid_grant' });
        }
        
        // Generate access token
        const accessToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 3600000; // 1 hour
        
        db.run('INSERT INTO access_tokens (token, client_id, user_id, expires_at) VALUES (?, ?, ?, ?)',
          [accessToken, client_id, authCode.user_id, expiresAt],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'server_error' });
            }
            
            // Delete used code
            db.run('DELETE FROM auth_codes WHERE code = ?', [code]);
            
            // Return token
            res.json({
              access_token: accessToken,
              token_type: 'Bearer',
              expires_in: 3600
            });
          }
        );
      }
    );
  });
});

app.get('/oauth/userinfo', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'invalid_token' });
  }
  
  const token = authHeader.substring(7);
  
  db.get('SELECT * FROM access_tokens WHERE token = ? AND expires_at > ?',
    [token, Date.now()],
    (err, accessToken) => {
      if (err || !accessToken) {
        return res.status(401).json({ error: 'invalid_token' });
      }
      
      db.get('SELECT id, username, email, name FROM users WHERE id = ?',
        [accessToken.user_id],
        (err, user) => {
          if (err || !user) {
            return res.status(500).json({ error: 'server_error' });
          }
          
          res.json({
            sub: user.id.toString(),
            id: user.id.toString(),
            username: user.username,
            email: user.email,
            name: user.name
          });
        }
      );
    }
  );
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'Logto Server (Local)' });
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Admin API - Get users
app.get('/admin/users', (req, res) => {
  db.all('SELECT id, username, email, name FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Admin API - Add user
app.post('/admin/users', (req, res) => {
  const { username, password, email, name } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, password, email, name) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, email || null, name || null],
    (err) => {
      if (err) {
        return res.status(400).json({ error: 'User already exists' });
      }
      res.json({ success: true });
    }
  );
});

// Admin API - Delete user
app.delete('/admin/users/:username', (req, res) => {
  db.run('DELETE FROM users WHERE username = ?', [req.params.username], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, deleted: this.changes > 0 });
  });
});

// Admin API - Get clients
app.get('/admin/clients', (req, res) => {
  db.all('SELECT id, name, redirect_uri FROM clients', (err, clients) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(clients);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 OAuth2 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📍 OAuth endpoints:`);
  console.log(`   Authorization: http://localhost:${PORT}/oauth/authorize`);
  console.log(`   Token: http://localhost:${PORT}/oauth/token`);
  console.log(`   User Info: http://localhost:${PORT}/oauth/userinfo`);
});