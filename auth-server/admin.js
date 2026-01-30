#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'oauth.db'));

const args = process.argv.slice(2);
const command = args[0];

function showHelp() {
  console.log(`
Logto Server Admin Tool

Commands:
  users list                    - List all users
  users add <username> <pass>   - Add a new user
  users delete <username>       - Delete a user
  users reset <username> <pass> - Reset user password
  
  clients list                  - List OAuth clients
  clients add <id> <name> <uri> - Add new OAuth client
  clients delete <id>           - Delete a client
  
  tokens list                   - List active tokens
  tokens revoke <token>         - Revoke a token
  
  info                         - Show server info
`);
}

function listUsers() {
  db.all('SELECT id, username, email, name FROM users', (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('\n👥 Users:');
    console.log('ID | Username | Email | Name');
    console.log('---|----------|-------|-----');
    rows.forEach(row => {
      console.log(`${row.id} | ${row.username} | ${row.email || 'N/A'} | ${row.name || 'N/A'}`);
    });
  });
}

function addUser(username, password, email, name) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password, email, name) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, email || null, name || null],
    (err) => {
      if (err) {
        console.error('Error adding user:', err);
      } else {
        console.log(`✅ User '${username}' added successfully`);
      }
    }
  );
}

function deleteUser(username) {
  db.run('DELETE FROM users WHERE username = ?', [username], function(err) {
    if (err) {
      console.error('Error deleting user:', err);
    } else if (this.changes === 0) {
      console.log(`❌ User '${username}' not found`);
    } else {
      console.log(`✅ User '${username}' deleted`);
    }
  });
}

function resetPassword(username, newPassword) {
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], function(err) {
    if (err) {
      console.error('Error resetting password:', err);
    } else if (this.changes === 0) {
      console.log(`❌ User '${username}' not found`);
    } else {
      console.log(`✅ Password reset for '${username}'`);
    }
  });
}

function listClients() {
  db.all('SELECT id, name, redirect_uri FROM clients', (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    console.log('\n🔐 OAuth Clients:');
    console.log('Client ID | Name | Redirect URI');
    console.log('----------|------|-------------');
    rows.forEach(row => {
      console.log(`${row.id} | ${row.name || 'N/A'} | ${row.redirect_uri}`);
    });
  });
}

function addClient(clientId, name, redirectUri) {
  const clientSecret = crypto.randomBytes(32).toString('hex');
  db.run('INSERT INTO clients (id, secret, name, redirect_uri) VALUES (?, ?, ?, ?)',
    [clientId, clientSecret, name, redirectUri],
    (err) => {
      if (err) {
        console.error('Error adding client:', err);
      } else {
        console.log(`✅ Client added successfully`);
        console.log(`   Client ID: ${clientId}`);
        console.log(`   Client Secret: ${clientSecret}`);
        console.log(`   ⚠️  Save this secret - it cannot be retrieved later!`);
      }
    }
  );
}

function showInfo() {
  console.log('\n📊 Logto Server Info');
  console.log('-------------------');
  console.log('Server URL: http://192.168.10.14:4000');
  console.log('Database: oauth.db');
  console.log('\nOAuth Endpoints:');
  console.log('  Authorization: /oauth/authorize');
  console.log('  Token: /oauth/token');
  console.log('  User Info: /oauth/userinfo');
  console.log('\nDefault Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
}

// Process commands
switch(command) {
  case 'users':
    switch(args[1]) {
      case 'list':
        listUsers();
        break;
      case 'add':
        if (args[2] && args[3]) {
          addUser(args[2], args[3], args[4], args[5]);
        } else {
          console.log('Usage: users add <username> <password> [email] [name]');
        }
        break;
      case 'delete':
        if (args[2]) {
          deleteUser(args[2]);
        } else {
          console.log('Usage: users delete <username>');
        }
        break;
      case 'reset':
        if (args[2] && args[3]) {
          resetPassword(args[2], args[3]);
        } else {
          console.log('Usage: users reset <username> <new-password>');
        }
        break;
      default:
        showHelp();
    }
    break;
    
  case 'clients':
    switch(args[1]) {
      case 'list':
        listClients();
        break;
      case 'add':
        if (args[2] && args[3] && args[4]) {
          addClient(args[2], args[3], args[4]);
        } else {
          console.log('Usage: clients add <client-id> <name> <redirect-uri>');
        }
        break;
      default:
        showHelp();
    }
    break;
    
  case 'info':
    showInfo();
    break;
    
  default:
    showHelp();
}

// Close database after a short delay to ensure operations complete
setTimeout(() => {
  db.close();
}, 100);