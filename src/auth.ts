import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Request, Response, NextFunction } from 'express';

// User type
export interface User {
  id: string;
  email?: string;
  name?: string;
  provider: string;
  raw?: any;
}

// Session augmentation
declare global {
  namespace Express {
    interface User {
      id: string;
      email?: string;
      name?: string;
      provider: string;
    }
  }
}

// Configuration interface for logto
export interface LogtoConfig {
  clientID: string;
  clientSecret: string;
  authorizationURL: string;
  tokenURL: string;
  userProfileURL?: string;
  callbackURL: string;
  scope?: string[];
}

// Initialize logto OAuth strategy
export function initializeLogtoAuth(config: LogtoConfig, providerName: string = "logto") {
  const strategy = new OAuth2Strategy(
    {
      authorizationURL: config.authorizationURL,
      tokenURL: config.tokenURL,
      clientID: config.clientID,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || ['openid', 'profile', 'email'],
    },
    async (accessToken: string, refreshToken: string, params: any, profile: any, done: Function) => {
      try {
        // If we have a userProfileURL, fetch the user profile
        if (config.userProfileURL) {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(config.userProfileURL, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const userInfo = await response.json();
            const user: User = {
              id: userInfo.sub || userInfo.id || userInfo.user_id,
              email: userInfo.email,
              name: userInfo.name || userInfo.username,
              provider: providerName,
              raw: userInfo,
            };
            return done(null, user);
          }
        }
        
        // Fallback to basic profile
        const user: User = {
          id: params.id_token || 'unknown',
          provider: providerName,
          raw: params,
        };
        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  );

  // Custom name for the strategy
  strategy.name = providerName;
  
  passport.use(strategy);
}

// Serialize/deserialize user for session
passport.serializeUser((user: any, done) => {
  done(null, {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
  });
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  
  // For API routes, return 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // For web routes, redirect to login
  res.redirect('/login');
}

// Optional auth middleware (doesn't require auth but attaches user if available)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  next();
}

export default passport;