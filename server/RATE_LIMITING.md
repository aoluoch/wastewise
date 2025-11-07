# Rate Limiting Configuration

## Overview
Comprehensive rate limiting implemented to ensure scalability and prevent abuse. This was implemented to address production issues where high traffic prevented legitimate users from logging in.

## Problem Solved
**Issue**: Production link was shared publicly, causing high traffic that prevented legitimate users from logging in.

**Solution**: Implemented tiered rate limiting that:
- Protects authentication endpoints from brute force attacks
- Allows legitimate users to access the application
- Prevents server overload during traffic spikes
- Ensures application scalability for many concurrent users

## Rate Limits (Production)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| All API routes | 100 req | 15 min | Baseline protection |
| Auth (login/register) | 5 req | 15 min | Prevent brute force |
| Password reset | 3 req | 1 hour | Prevent abuse |
| File uploads | 20 req | 1 hour | Storage protection |
| Write operations | 50 req | 15 min | Prevent spam |
| Read operations | 200 req | 15 min | Allow frequent reads |
| API docs | 30 req | 15 min | Documentation access |

## Response Format
When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```
HTTP Status: `429 Too Many Requests`

## Rate Limit Headers
All responses include these headers:
- `RateLimit-Limit`: Maximum requests allowed in window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Unix timestamp when limit resets

## Environment Behavior

### Production (`NODE_ENV=production`)
✅ **All rate limiters ENABLED**
- Strict limits enforced
- Protects against abuse
- Ensures scalability
- Logged on startup with configuration details

### Development (`NODE_ENV=development`)
⚠️ **Rate limiters DISABLED**
- Better developer experience
- No artificial delays during testing
- Limits are 10x higher if manually enabled

## Implementation Files

### Core Files
```
server/src/
├── middlewares/
│   └── rateLimiter.js       # Rate limiting configuration
├── server.js                # Global rate limiter application
└── routes/
    ├── auth.js              # Auth-specific limiters
    ├── reports.js           # Upload limiters
    └── pickups.js           # Write limiters
```

### Usage Examples

#### In Routes
```javascript
const { authLimiter, uploadLimiter } = require('../middlewares/rateLimiter');

// Apply to authentication endpoint
router.post('/login', authLimiter, async (req, res) => {
  // Login logic
});

// Apply to file upload endpoint
router.post('/reports', uploadLimiter, uploadMiddleware, async (req, res) => {
  // Report creation logic
});
```

#### Custom Limiter
```javascript
const { createCustomLimiter } = require('../middlewares/rateLimiter');

const customLimiter = createCustomLimiter(
  60 * 60 * 1000,  // 1 hour window
  10,              // 10 requests max
  'Custom limit exceeded'
);

router.post('/special-endpoint', customLimiter, handler);
```

## Configuration

### Environment Variables
```env
# Required
NODE_ENV=production

# Optional - Override defaults
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

## Monitoring

### Startup Logs
When server starts in production, you'll see:
```
✓ Rate limiting enabled for production - Application is now scalable
✓ Endpoint-specific rate limits configured:
  - Auth endpoints: 5 attempts per 15 minutes
  - Password reset: 3 attempts per hour
  - General API: 100 requests per 15 minutes
  - API Docs: 30 requests per 15 minutes
```

### Client-Side Handling
Frontend should handle 429 responses:
```javascript
if (response.status === 429) {
  const retryAfter = response.headers.get('RateLimit-Reset');
  // Show user-friendly message with retry time
  showError('Too many requests. Please try again later.');
}
```

## Best Practices

### For Developers
1. **Test in Development**: Rate limits are disabled by default
2. **Check Headers**: Monitor `RateLimit-*` headers during testing
3. **Handle 429s**: Always implement proper error handling for rate limit responses
4. **Use Appropriate Limiter**: Choose the right limiter for each endpoint type

### For Production
1. **Monitor Logs**: Watch for rate limit violations in production logs
2. **Adjust Limits**: Tune limits based on actual usage patterns
3. **User Communication**: Inform users about rate limits in API documentation
4. **Whitelist IPs**: Consider whitelisting trusted IPs if needed

## Security Benefits

1. **Brute Force Protection**: Limits authentication attempts
2. **DDoS Mitigation**: Prevents overwhelming the server
3. **Resource Protection**: Limits expensive operations (uploads, etc.)
4. **Cost Control**: Reduces unnecessary API calls
5. **Fair Usage**: Ensures resources are shared fairly among users

## Scalability Benefits

1. **Server Protection**: Prevents overload during traffic spikes
2. **Predictable Performance**: Maintains consistent response times
3. **Resource Management**: Controls database and API usage
4. **Cost Efficiency**: Reduces infrastructure costs
5. **User Experience**: Ensures legitimate users can always access the app

## Troubleshooting

### Issue: Users hitting rate limits too quickly
**Solution**: Increase limits in `rateLimiter.js` or implement user-based rate limiting

### Issue: Rate limiting not working
**Check**: 
- `NODE_ENV=production` is set
- Server logs show rate limiting enabled
- Headers include `RateLimit-*` fields

### Issue: Development is too slow
**Solution**: Ensure `NODE_ENV=development` to disable rate limiting

## Future Enhancements

Potential improvements:
- [ ] User-based rate limiting (instead of IP-based)
- [ ] Redis-backed rate limiting for distributed systems
- [ ] Dynamic rate limits based on user tier/subscription
- [ ] Rate limit bypass for trusted API clients
- [ ] Advanced analytics and monitoring dashboard

## Related Documentation
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Security Best Practices](./SECURITY.md)
- [API Documentation](./API.md)
