import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';

export interface AuthProvider {
  name: string;
  displayName: string;
  clientID: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userProfileURL: string;
  callbackURL: string;
  icon?: string;
  buttonClass?: string;
}

export const authProviders: AuthProvider[] = [
  {
    name: 'logto',
    displayName: 'Logto',
    clientID: process.env.LOGTO_CLIENT_ID || '',
    clientSecret: process.env.LOGTO_CLIENT_SECRET || '',
    authorizationURL: process.env.LOGTO_AUTH_URL || 'http://192.168.10.14:4000/oauth/authorize',
    tokenURL: process.env.LOGTO_TOKEN_URL || 'http://192.168.10.14:4000/oauth/token',
    userProfileURL: process.env.LOGTO_USERINFO_URL || 'http://192.168.10.14:4000/oauth/userinfo',
    callbackURL: process.env.LOGTO_CALLBACK_URL || 'http://192.168.10.14:3000/auth/logto/callback',
    icon: '🔐',
    buttonClass: 'bg-indigo-600 hover:bg-indigo-700'
  },
  {
    name: 'casdoor',
    displayName: 'Casdoor',
    clientID: process.env.CASDOOR_CLIENT_ID || '',
    clientSecret: process.env.CASDOOR_CLIENT_SECRET || '',
    authorizationURL: process.env.CASDOOR_AUTH_URL || 'http://192.168.10.14:8000/login/oauth/authorize',
    tokenURL: process.env.CASDOOR_TOKEN_URL || 'http://192.168.10.14:8000/api/login/oauth/access_token',
    userProfileURL: process.env.CASDOOR_USERINFO_URL || 'http://192.168.10.14:8000/api/get-account',
    callbackURL: process.env.CASDOOR_CALLBACK_URL || 'http://192.168.10.14:3000/auth/casdoor/callback',
    icon: '🛡️',
    buttonClass: 'bg-green-600 hover:bg-green-700'
  }
];

export function initializeMultiAuth() {
  authProviders.forEach(provider => {
    if (provider.clientID) {
      const strategy = new OAuth2Strategy(
        {
          authorizationURL: provider.authorizationURL,
          tokenURL: provider.tokenURL,
          clientID: provider.clientID,
          clientSecret: provider.clientSecret,
          callbackURL: provider.callbackURL,
        },
        async (accessToken, refreshToken, params, profile, done) => {
          try {
            // Fetch user profile
            const fetch = require('node-fetch');
            const response = await fetch(provider.userProfileURL, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const userData = await response.json();
            
            const user = {
              id: userData.id || userData.sub || userData.username,
              username: userData.username || userData.preferred_username || userData.name,
              email: userData.email,
              name: userData.name || userData.displayName,
              provider: provider.name
            };
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      );
      
      strategy.name = provider.name;
      passport.use(provider.name, strategy);
      console.log(`✅ ${provider.displayName} authentication configured`);
    }
  });
}