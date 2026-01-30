import { Router } from 'express';
import passport from 'passport';

const router = Router();

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
  passport.authenticate('logto', { 
    scope: ['openid', 'profile', 'email'] 
  })
);

router.get('/auth/logto/callback',
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
  passport.authenticate('casdoor', { 
    scope: ['openid', 'profile', 'email'] 
  })
);

router.get('/auth/casdoor/callback',
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