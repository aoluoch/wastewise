# Wastewise Deployment Checklist

## Critical Fixes Applied

### 1. ✅ Fixed Server Crash (ReferenceError: swaggerUi is not defined)
**Issue**: Server was crashing on startup due to missing swagger imports.

**Fix**: Added missing imports in `/server/src/server.js`:
```javascript
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
```

### 2. ✅ Improved CORS Configuration
**Issue**: 403 Forbidden errors when `FRONTEND_URL` environment variable is not set.

**Fix**: Enhanced CORS configuration with:
- Better logging to show allowed origins on startup
- Fallback to allow all origins if `FRONTEND_URL` is not set in production (with warning)
- Improved error messages for debugging

## Required Environment Variables for Production

### Backend (Render/Server)

Set these environment variables in your Render dashboard:

```env
# Required - Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wastewise

# Required - JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters

# Required - Server Configuration
NODE_ENV=production
PORT=5000

# Required - Frontend URL (CRITICAL for CORS)
# Set this to your deployed frontend URL(s), comma-separated if multiple
FRONTEND_URL=https://your-frontend-app.netlify.app,https://your-custom-domain.com

# Required - Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional - Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@wastewise.com

# Optional - Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional - JWT Expiration
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Optional - Socket.io CORS (usually same as FRONTEND_URL)
SOCKET_CORS_ORIGIN=https://your-frontend-app.netlify.app

# Optional - Arcjet (for advanced security)
ARCJET_KEY=your-arcjet-key
```

### Frontend (Netlify/Client)

Set these environment variables in your Netlify dashboard:

```env
# Required - Backend API URL
VITE_API_BASE_URL=https://wastewise-zc02.onrender.com

# Optional - Google Maps (if using maps features)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Optional - Analytics
VITE_GA_TRACKING_ID=your-google-analytics-id
```

## Deployment Steps

### 1. Backend Deployment (Render)

1. **Push the fixed code to your repository**
   ```bash
   git add .
   git commit -m "Fix: Add missing swagger imports and improve CORS configuration"
   git push origin main
   ```

2. **Set Environment Variables in Render**
   - Go to your Render dashboard
   - Select your backend service
   - Go to "Environment" tab
   - Add all required environment variables listed above
   - **CRITICAL**: Make sure `FRONTEND_URL` is set correctly

3. **Trigger Manual Deploy**
   - Go to "Manual Deploy" and click "Deploy latest commit"
   - Monitor the logs for any errors

4. **Verify Deployment**
   - Check logs for: `CORS Configuration: { ... }`
   - Ensure `NODE_ENV: 'production'` is shown
   - Verify `allowedOrigins` includes your frontend URL

### 2. Frontend Deployment (Netlify)

1. **Update API Base URL**
   - Ensure `VITE_API_BASE_URL` points to your Render backend URL
   - Should be: `https://wastewise-zc02.onrender.com`

2. **Rebuild and Deploy**
   - Trigger a new deploy in Netlify
   - Or push changes to trigger auto-deploy

### 3. Post-Deployment Verification

1. **Check Backend Health**
   ```bash
   curl https://wastewise-zc02.onrender.com/health
   ```
   Should return: `{"status":"OK","timestamp":"...","uptime":...}`

2. **Check CORS**
   - Open browser console on your frontend
   - Check Network tab for API requests
   - Verify no CORS errors

3. **Test Authentication**
   - Try logging in
   - Check if token is stored in localStorage
   - Verify API calls include Authorization header

4. **Test API Endpoints**
   - Create a waste report
   - View reports feed
   - Check if images upload correctly

## Troubleshooting

### 403 Forbidden Errors

**Symptoms**: API calls return 403 status

**Possible Causes**:
1. `FRONTEND_URL` not set or incorrect
2. CORS blocking the request
3. Authentication token expired or invalid

**Solutions**:
1. Check Render logs for CORS warnings
2. Verify `FRONTEND_URL` matches your frontend domain exactly
3. Clear browser localStorage and login again
4. Check if token is being sent in Authorization header

### Server Crashes on Startup

**Symptoms**: Server exits with status 1 immediately after starting

**Possible Causes**:
1. Missing environment variables
2. MongoDB connection failure
3. Missing dependencies

**Solutions**:
1. Check Render logs for specific error messages
2. Verify `MONGODB_URI` is correct and accessible
3. Ensure all required packages are in `package.json`
4. Check Node.js version compatibility

### Images Not Uploading

**Symptoms**: Image upload fails or returns error

**Possible Causes**:
1. Cloudinary credentials not set
2. File size too large
3. Invalid file type

**Solutions**:
1. Verify Cloudinary environment variables
2. Check file size limit (default 5MB per file)
3. Ensure file is an image type (jpg, png, etc.)

## Monitoring

### Key Logs to Watch

1. **Startup Logs**
   ```
   ✓ MongoDB connected successfully
   ✓ CORS Configuration: { nodeEnv: 'production', allowedOrigins: [...] }
   ✓ Rate limiting enabled for production
   ✓ Server running on port 5000 in production mode
   ```

2. **Request Logs**
   - Watch for CORS warnings
   - Monitor authentication failures
   - Check for rate limit hits

3. **Error Logs**
   - Database connection errors
   - Cloudinary upload failures
   - JWT verification errors

## Security Checklist

- [ ] JWT secrets are strong random strings (min 32 characters)
- [ ] `FRONTEND_URL` is set to specific domains (not wildcard)
- [ ] MongoDB connection uses authentication
- [ ] Cloudinary credentials are secure
- [ ] Rate limiting is enabled in production
- [ ] HTTPS is enforced on both frontend and backend
- [ ] Environment variables are not committed to git

## Performance Optimization

- [ ] Enable compression (already configured)
- [ ] Set appropriate rate limits
- [ ] Monitor MongoDB query performance
- [ ] Optimize image sizes before upload
- [ ] Use CDN for static assets
- [ ] Enable caching where appropriate

## Next Steps After Successful Deployment

1. Set up monitoring and alerting (e.g., Sentry, LogRocket)
2. Configure custom domain names
3. Set up automated backups for MongoDB
4. Implement CI/CD pipeline
5. Add end-to-end tests
6. Set up staging environment
7. Document API with Swagger UI (accessible at `/api-docs`)

## Support

If you encounter issues not covered in this checklist:

1. Check the application logs in Render/Netlify
2. Review the error messages carefully
3. Search for similar issues in the project's issue tracker
4. Contact the development team with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Screenshots if applicable
