#!/bin/bash

# Wastewise - Commit and Deploy Script
# This script commits all the fixes and prepares for deployment

echo "🚀 Wastewise - Committing Fixes"
echo "================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

echo "📝 Staging changes..."
echo ""

# Stage backend fixes
git add server/src/server.js
echo "✓ Staged: server/src/server.js (swagger imports + CORS improvements)"

# Stage frontend fixes
git add client/src/routes/AppRoutes.tsx
echo "✓ Staged: client/src/routes/AppRoutes.tsx (added /reports/:id/edit route)"

git add client/src/pages/reports/ReportDetail.tsx
echo "✓ Staged: client/src/pages/reports/ReportDetail.tsx (auto-edit mode support)"

# Stage documentation
git add DEPLOYMENT_CHECKLIST.md QUICK_FIX.md ROUTE_FIX_SUMMARY.md
echo "✓ Staged: Documentation files"

echo ""
echo "📊 Changes to be committed:"
git status --short

echo ""
echo "💬 Creating commit..."
git commit -m "Fix: Critical deployment issues and missing route

Backend fixes:
- Add missing swagger-ui-express imports to fix server crash
- Improve CORS configuration with better logging and fallback
- Add support for missing FRONTEND_URL environment variable

Frontend fixes:
- Add /reports/:id/edit route to fix 404 error
- Implement auto-edit mode when accessing via /edit URL
- Add navigation after save/cancel for better UX

Documentation:
- Add comprehensive deployment checklist
- Add quick fix guide for immediate issues
- Add route fix summary with testing checklist"

echo ""
echo "✅ Commit created successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Push changes: git push origin main"
echo "2. Set FRONTEND_URL in Render dashboard"
echo "3. Monitor deployment logs"
echo "4. Test the application"
echo ""
echo "For detailed instructions, see:"
echo "- QUICK_FIX.md (immediate actions)"
echo "- DEPLOYMENT_CHECKLIST.md (comprehensive guide)"
echo "- ROUTE_FIX_SUMMARY.md (route fix details)"
