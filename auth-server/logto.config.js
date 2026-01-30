module.exports = {
  // Server Configuration
  server: {
    port: 4000,
    host: '0.0.0.0',
    publicUrl: 'http://192.168.10.14:4000'
  },

  // Database
  database: {
    type: 'sqlite',
    path: './oauth.db'
  },

  // Security Settings
  security: {
    // Token expiration times (in seconds)
    authCodeTTL: 600,        // 10 minutes
    accessTokenTTL: 3600,    // 1 hour
    refreshTokenTTL: 86400,  // 24 hours
    
    // Password requirements
    passwordMinLength: 8,
    requireUppercase: false,
    requireNumbers: false,
    requireSpecialChars: false
  },

  // Session Settings
  session: {
    secret: 'change-this-in-production-' + require('crypto').randomBytes(16).toString('hex'),
    cookieMaxAge: 86400000, // 24 hours in ms
  },

  // OAuth Scopes
  scopes: {
    openid: 'OpenID Connect',
    profile: 'User profile information', 
    email: 'Email address',
    offline_access: 'Refresh token'
  },

  // Branding
  branding: {
    name: 'Logto Local',
    logo: '/logo.png',
    primaryColor: '#5d34f2'
  }
};