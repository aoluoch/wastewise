# Quick Fix for Deployment Issues

## 🔴 Critical Issue: Server Crashing

**Error**: `ReferenceError: swaggerUi is not defined`

**Status**: ✅ FIXED

**What was done**: Added missing imports to `/server/src/server.js`

## 🟡 Important Issue: 403 Forbidden Errors

**Error**: `GET https://wastewise-zc02.onrender.com/api/reports/... 403 (Forbidden)`

**Root Cause**: Missing or incorrect `FRONTEND_URL` environment variable in Render

**Status**: ✅ FIXED (with fallback)

**What was done**: 
1. Improved CORS configuration to handle missing `FRONTEND_URL`
2. Added logging to help debug CORS issues
3. Added fallback to allow all origins if `FRONTEND_URL` is not set (with warning)

## 🚀 Immediate Action Required

### Step 1: Set Environment Variable in Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service (wastewise-zc02)
3. Click on "Environment" in the left sidebar
4. Add this environment variable:
   ```
   Key: FRONTEND_URL
   Value: https://your-frontend-url.netlify.app
   ```
   (Replace with your actual Netlify URL)
5. Click "Save Changes"

### Step 2: Deploy the Fixed Code

```bash
# In your terminal, from the project root:
cd /home/amosoluoch/Desktop/Wastewise

# Add the changes
git add server/src/server.js

# Commit
git commit -m "Fix: Add missing swagger imports and improve CORS configuration"

# Push to trigger deployment
git push origin main
```

### Step 3: Monitor Deployment

1. Watch the Render logs for:
   ```
   ✓ CORS Configuration: { nodeEnv: 'production', allowedOrigins: [...] }
   ✓ Server running on port 5000 in production mode
   ```

2. If you see this warning, it means `FRONTEND_URL` is still not set:
   ```
   ⚠️  WARNING: FRONTEND_URL not set in production. Allowing all origins as fallback.
   ```

### Step 4: Test

1. Open your frontend application
2. Try to login or view reports
3. Check browser console for errors
4. Verify API calls return 200 status (not 403)

## 📋 Complete Environment Variables Needed

For a full list of required environment variables, see `DEPLOYMENT_CHECKLIST.md`

**Minimum required for backend to work**:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Random secret for JWT tokens
- `JWT_REFRESH_SECRET` - Random secret for refresh tokens
- `NODE_ENV=production`
- `FRONTEND_URL` - Your frontend URL(s)
- `CLOUDINARY_CLOUD_NAME` - For image uploads
- `CLOUDINARY_API_KEY` - For image uploads
- `CLOUDINARY_API_SECRET` - For image uploads

## ✅ Expected Result

After applying these fixes:
- ✅ Server starts without crashing
- ✅ API endpoints respond (no 403 errors)
- ✅ CORS allows your frontend to make requests
- ✅ Authentication works
- ✅ Image uploads work

## 🆘 Still Having Issues?

If you still see 403 errors after setting `FRONTEND_URL`:

1. **Check the exact URL format**:
   - ✅ Correct: `https://your-app.netlify.app`
   - ❌ Wrong: `https://your-app.netlify.app/`
   - ❌ Wrong: `http://your-app.netlify.app` (http vs https)

2. **Check Render logs** for CORS warnings:
   ```
   CORS blocked origin: https://...
   Allowed origins: ...
   ```

3. **Multiple frontend URLs?** Separate with commas:
   ```
   FRONTEND_URL=https://app1.netlify.app,https://app2.netlify.app
   ```

4. **Clear browser cache** and localStorage:
   - Open DevTools (F12)
   - Go to Application tab
   - Clear Storage
   - Refresh page

## 📞 Need More Help?

See `DEPLOYMENT_CHECKLIST.md` for comprehensive troubleshooting guide.
