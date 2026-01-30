# log2 Authentication Setup Guide

This app is ready to integrate with log2 as an OAuth2/OpenID Connect identity provider.

## Quick Setup

1. **Register your app with log2**
   - Register this app in your log2 instance
   - Callback URL: `http://192.168.10.14:3000/auth/log2/callback`
   - Note your Client ID and Client Secret

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Update these values:
   ```
   LOG2_CLIENT_ID=your-client-id-from-log2
   LOG2_CLIENT_SECRET=your-client-secret-from-log2
   LOG2_AUTH_URL=https://your-log2-domain.com/oauth/authorize
   LOG2_TOKEN_URL=https://your-log2-domain.com/oauth/token
   LOG2_USERINFO_URL=https://your-log2-domain.com/oauth/userinfo
   LOG2_CALLBACK_URL=http://192.168.10.14:3000/auth/log2/callback
   
   # Generate a secure session secret
   SESSION_SECRET=use-a-random-32-character-string-here
   ```

3. **Start the server**
   ```bash
   npm start
   ```

## OAuth Flow

The app implements standard OAuth 2.0 flow:

1. User clicks "Login with log2" → Redirected to log2
2. User authenticates at log2
3. log2 redirects back with authorization code
4. App exchanges code for access token
5. App fetches user profile from log2
6. User session created

## Endpoints

### Public Routes
- `/` - Homepage (public)
- `/login` - Login page
- `/api/health` - Health check (public)
- `/api/info` - App info (public)

### Protected Routes
- `/dashboard` - User dashboard (requires login)
- `/api/me` - Current user info
- `/api/items` - Protected API example

### Auth Routes
- `/auth/log2` - Initiates log2 login
- `/auth/log2/callback` - OAuth callback
- `/logout` - Ends session

## Common log2 Configurations

### If log2 uses standard OAuth2:
```env
LOG2_AUTH_URL=https://log2.example.com/oauth/authorize
LOG2_TOKEN_URL=https://log2.example.com/oauth/token
LOG2_USERINFO_URL=https://log2.example.com/api/userinfo
```

### If log2 uses OpenID Connect:
```env
LOG2_AUTH_URL=https://log2.example.com/auth/realms/{realm}/protocol/openid-connect/auth
LOG2_TOKEN_URL=https://log2.example.com/auth/realms/{realm}/protocol/openid-connect/token
LOG2_USERINFO_URL=https://log2.example.com/auth/realms/{realm}/protocol/openid-connect/userinfo
```

### If log2 uses custom endpoints:
Check your log2 documentation for the correct URLs.

## Customization

### User Profile Mapping
Edit `src/auth.ts` to map log2 user fields:
```typescript
const user: User = {
  id: userInfo.sub || userInfo.id || userInfo.user_id,
  email: userInfo.email || userInfo.mail,
  name: userInfo.name || userInfo.display_name || userInfo.username,
  provider: 'log2',
  raw: userInfo,
};
```

### Scopes
Adjust requested scopes in `src/auth-routes.ts`:
```typescript
scope: ['openid', 'profile', 'email', 'custom-scope']
```

### Session Duration
Edit session config in `src/server.ts`:
```typescript
cookie: {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}
```

## Security Notes

1. **Session Secret**: Use a strong, random secret in production
2. **HTTPS**: Required for production OAuth flows
3. **CORS**: Configure specific origins in production
4. **Cookie Security**: Set `secure: true` when using HTTPS

## Troubleshooting

### "Authentication failed"
- Check Client ID and Secret are correct
- Verify callback URL matches exactly
- Check log2 logs for errors

### "Cannot fetch user profile"
- Verify userProfileURL is correct
- Check if access token has required scopes
- Try accessing the URL directly with the token

### Session not persisting
- Check cookie settings
- Ensure session secret is set
- Verify domain/port consistency

## Testing

1. Open http://192.168.10.14:3000
2. Click "Login"
3. Click "Login with log2"
4. Complete authentication at log2
5. Should redirect to dashboard

## Need Help?

Check the server logs for detailed error messages:
```bash
npm start
# Watch console output during login attempts
```