import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport, { initializeLogtoAuth, requireAuth } from './auth';
import authRoutes from './auth-routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Session configuration
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure logto authentication
// TODO: Update these with your actual logto OAuth endpoints
const logtoConfig = {
  clientID: process.env.LOGTO_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.LOGTO_CLIENT_SECRET || 'your-client-secret',
  authorizationURL: process.env.LOGTO_AUTH_URL || 'https://logto.example.com/oauth/authorize',
  tokenURL: process.env.LOGTO_TOKEN_URL || 'https://logto.example.com/oauth/token',
  userProfileURL: process.env.LOGTO_USERINFO_URL || 'https://logto.example.com/oauth/userinfo',
  callbackURL: process.env.LOGTO_CALLBACK_URL || 'http://192.168.10.14:3000/auth/logto/callback',
};

// Initialize logto authentication if configured
if (process.env.LOGTO_CLIENT_ID) {
  initializeLogtoAuth(logtoConfig);
  console.log('✅ Logto authentication configured');
} else {
  console.log('⚠️  Logto authentication not configured - set LOGTO_CLIENT_ID in .env');
}

// Configure Casdoor authentication
const casdoorConfig = {
  clientID: process.env.CASDOOR_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.CASDOOR_CLIENT_SECRET || 'your-client-secret',
  authorizationURL: process.env.CASDOOR_AUTH_URL || 'http://192.168.10.14:8000/login/oauth/authorize',
  tokenURL: process.env.CASDOOR_TOKEN_URL || 'http://192.168.10.14:8000/api/login/oauth/access_token',
  userProfileURL: process.env.CASDOOR_USERINFO_URL || 'http://192.168.10.14:8000/api/get-account',
  callbackURL: process.env.CASDOOR_CALLBACK_URL || 'http://192.168.10.14:3000/auth/casdoor/callback',
};

// Initialize Casdoor authentication if configured
if (process.env.CASDOOR_CLIENT_ID) {
  initializeLogtoAuth(casdoorConfig, 'casdoor');
  console.log('✅ Casdoor authentication configured');
} else {
  console.log('⚠️  Casdoor authentication not configured - set CASDOOR_CLIENT_ID in .env');
}

// Middleware
app.use(cors({
  credentials: true,
  origin: true, // In production, specify exact origins
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form posts
app.use(express.static(path.join(__dirname, '../public')));

// Authentication routes (login, logout, callbacks)
app.use(authRoutes);

// Public API Routes (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    authenticated: req.isAuthenticated(),
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    app: 'TypeScript + Tailwind Web App',
    version: '1.0.0',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    authConfigured: !!process.env.LOG2_CLIENT_ID,
  });
});

// Protected API Routes (auth required)
app.get('/api/items', requireAuth, (req, res) => {
  const items = [
    { id: 1, name: 'Protected Item One', description: 'Only visible when authenticated' },
    { id: 2, name: 'Protected Item Two', description: 'Requires logto login' },
    { id: 3, name: 'Protected Item Three', description: `Hello ${req.user?.name || 'User'}!` }
  ];
  res.json(items);
});

// Protected web routes
app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// Store return URL for post-login redirect
app.use((req, res, next) => {
  if (!req.isAuthenticated() && req.path !== '/login' && !req.path.startsWith('/auth/')) {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

// Catch all - serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
  console.log(`📱 Local network: http://${getLocalIP()}:${PORT}`);
  console.log(`🔐 Authentication: ${process.env.LOGTO_CLIENT_ID ? 'Enabled' : 'Not configured'}`);
});

// Helper to get local IP
function getLocalIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}