#!/usr/bin/env node
/**
 * Logto Seed Script
 * Creates the webapp application and excelfore user via Management API
 */

const https = require('https');
const http = require('http');

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://logto:3001';
const MAX_RETRIES = 60;
const RETRY_DELAY = 5000;

// Helper to make HTTP requests
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Wait for Logto to be ready
async function waitForLogto() {
  console.log('Waiting for Logto to be ready...');

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await request(`${LOGTO_ENDPOINT}/api/status`);
      if (res.status === 200 || res.status === 204) {
        console.log('Logto is ready!');
        return true;
      }
    } catch (err) {
      // Ignore connection errors while waiting
    }

    console.log(`Logto not ready, retrying in ${RETRY_DELAY/1000}s... (${i + 1}/${MAX_RETRIES})`);
    await new Promise(r => setTimeout(r, RETRY_DELAY));
  }

  throw new Error('Logto failed to become ready');
}

// Get or create M2M application for Management API access
async function getManagementApiAccess() {
  // For now, we'll try to use the public endpoints that don't require auth
  // The /api/.well-known/sign-in-exp endpoint is public
  console.log('Checking Logto configuration...');

  try {
    const res = await request(`${LOGTO_ENDPOINT}/api/.well-known/sign-in-exp`);
    console.log('Sign-in experience:', res.status);
    return null; // No token needed for some operations
  } catch (err) {
    console.log('Could not get sign-in experience:', err.message);
    return null;
  }
}

// Create the webapp application
async function createApplication(token) {
  console.log('Creating webapp application...');

  const appData = {
    name: 'Webapp Login Example',
    description: 'OAuth2 webapp login example application',
    type: 'Traditional',
    oidcClientMetadata: {
      redirectUris: ['http://localhost:3000/auth/logto/callback'],
      postLogoutRedirectUris: ['http://localhost:3000/']
    }
  };

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await request(`${LOGTO_ENDPOINT}/api/applications`, {
      method: 'POST',
      headers,
      body: appData
    });

    if (res.status === 201 || res.status === 200) {
      console.log('Application created successfully!');
      console.log('Client ID:', res.data.id);
      console.log('Client Secret:', res.data.secret);
      return res.data;
    } else if (res.status === 401) {
      console.log('Management API requires authentication - skipping auto-creation');
      console.log('Please create the application manually via the Admin Console at http://localhost:3002');
      return null;
    } else {
      console.log('Failed to create application:', res.status, res.data);
      return null;
    }
  } catch (err) {
    console.log('Error creating application:', err.message);
    return null;
  }
}

// Create the excelfore user
async function createUser(token) {
  console.log('Creating excelfore user...');

  const userData = {
    username: 'excelfore',
    password: 'excelfore32!',
    name: 'Excelfore User',
    primaryEmail: 'excelfore@example.com'
  };

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await request(`${LOGTO_ENDPOINT}/api/users`, {
      method: 'POST',
      headers,
      body: userData
    });

    if (res.status === 201 || res.status === 200) {
      console.log('User created successfully!');
      console.log('User ID:', res.data.id);
      return res.data;
    } else if (res.status === 401) {
      console.log('Management API requires authentication - skipping auto-creation');
      console.log('Please create the user manually via the Admin Console at http://localhost:3002');
      return null;
    } else if (res.status === 422 && res.data?.code === 'user.username_already_in_use') {
      console.log('User excelfore already exists');
      return { existing: true };
    } else {
      console.log('Failed to create user:', res.status, res.data);
      return null;
    }
  } catch (err) {
    console.log('Error creating user:', err.message);
    return null;
  }
}

// Main seeding function
async function seed() {
  console.log('=== Logto Seed Script ===');
  console.log(`Endpoint: ${LOGTO_ENDPOINT}`);

  try {
    await waitForLogto();

    const token = await getManagementApiAccess();

    await createApplication(token);
    await createUser(token);

    console.log('');
    console.log('=== Seeding Complete ===');
    console.log('');
    console.log('If auto-creation failed due to authentication requirements,');
    console.log('please configure the following manually via Admin Console (http://localhost:3002):');
    console.log('');
    console.log('1. Create Application:');
    console.log('   - Name: Webapp Login Example');
    console.log('   - Type: Traditional Web');
    console.log('   - Redirect URI: http://localhost:3000/auth/logto/callback');
    console.log('   - Post Logout URI: http://localhost:3000/');
    console.log('');
    console.log('2. Create User:');
    console.log('   - Username: excelfore');
    console.log('   - Password: excelfore32!');
    console.log('   - Email: excelfore@example.com');
    console.log('');

  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
