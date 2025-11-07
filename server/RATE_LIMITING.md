# Rate Limiting Configuration

## Overview
Comprehensive rate limiting implemented to ensure scalability and prevent abuse.

## Rate Limits (Production)

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| All API routes | 100 req | 15 min | Baseline protection |
| Auth (login/register) | 5 req | 15 min | Prevent brute force |
| Password reset | 3 req | 1 hour | Prevent abuse |
| File uploads | 20 req | 1 hour | Storage protection |
| API docs | 30 req | 15 min | Documentation access |

## Response Format
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```
HTTP Status: `429 Too Many Requests`

## Environment Behavior
- **Production**: All limits enabled
- **Development**: Limits disabled (10x higher if enabled)

## Implementation
- File: `server/src/middlewares/rateLimiter.js`
- Applied in: `server/src/server.js`
- Per-route limiters in route files
