import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

// Helper to check if a strategy is configured
function isStrategyConfigured(strategyName: string): boolean {
  try {
    // @ts-ignore - accessing internal passport property
    return !!passport._strategies[strategyName];
  } catch {
    return false;
  }
}

// Middleware to check strategy availability
function requireStrategy(strategyName: string, providerDisplayName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isStrategyConfigured(strategyName)) {
      const envVarPrefix = strategyName.toUpperCase();
      res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${providerDisplayName} Not Configured</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #d97706; }
            code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
            .env-vars { background: #1f2937; color: #10b981; padding: 15px; border-radius: 8px; font-family: monospace; }
            a { color: #3b82f6; }
          </style>
        </head>
        <body>
          <h1>⚠️ ${providerDisplayName} Authentication Not Configured</h1>
          <p>The <strong>${providerDisplayName}</strong> OAuth provider is not configured on this server.</p>
          <p>To enable ${providerDisplayName} login, add the following environment variables:</p>
          <div class="env-vars">
            ${envVarPrefix}_CLIENT_ID=your-client-id<br>
            ${envVarPrefix}_CLIENT_SECRET=your-client-secret<br>
            ${envVarPrefix}_AUTH_URL=...<br>
            ${envVarPrefix}_TOKEN_URL=...<br>
            ${envVarPrefix}_USERINFO_URL=...<br>
            ${envVarPrefix}_CALLBACK_URL=http://localhost:3000/auth/${strategyName}/callback
          </div>
          <p style="margin-top: 20px;"><a href="/">← Back to Home</a></p>
        </body>
        </html>
      `);
      return;
    }
    next();
  };
}

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// OAuth callbacks - Logto
router.get('/auth/logto',
  requireStrategy('logto', 'Logto'),
  passport.authenticate('logto', {
    scope: ['openid', 'profile', 'email']
  })
);

router.get('/auth/logto/callback',
  requireStrategy('logto', 'Logto'),
  passport.authenticate('logto', {
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication - redirect back to home
    res.redirect('/');
  }
);

// OAuth callbacks - Casdoor
router.get('/auth/casdoor',
  requireStrategy('casdoor', 'Casdoor'),
  passport.authenticate('casdoor', {
    scope: ['openid', 'profile', 'email']
  })
);

router.get('/auth/casdoor/callback',
  requireStrategy('casdoor', 'Casdoor'),
  passport.authenticate('casdoor', {
    failureRedirect: '/login?error=auth_failed'
  }),
  (req, res) => {
    // Successful authentication - redirect back to home
    res.redirect('/');
  }
);

// User profile API
router.get('/api/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    user: req.user,
    authenticated: true,
  });
});

export default router;