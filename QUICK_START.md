# Wastewise Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or connection string ready
- Git installed

### Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/your-username/wastewise.git
cd wastewise

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Environment Setup (1 minute)

**Backend (.env in server folder):**
```env
MONGODB_URI=mongodb://localhost:27017/wastewise
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
PORT=5000
NODE_ENV=development

# Optional: Add these for full functionality
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Frontend (.env in client folder):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Start the Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### Step 4: Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 📱 Test the Application

### 1. Register a User

Open http://localhost:3000 and click "Register"

**Test Credentials:**
- Email: `admin@wastewise.com`
- Password: `admin123`
- Role: Admin

### 2. Create a Waste Report

1. Login as a resident
2. Navigate to "Report Waste"
3. Fill in the form with waste details
4. Upload 2+ images
5. Select location on map
6. Submit

### 3. Explore the API

Visit http://localhost:5000/api-docs to:
- View all available endpoints
- Test API calls interactively
- See request/response examples
- Authenticate with JWT tokens

## 🔑 Default Test Accounts

After running the seed script (optional):

**Admin:**
- Email: `admin@wastewise.com`
- Password: `admin123`

**Collector:**
- Email: `collector@wastewise.com`
- Password: `collector123`

**Resident:**
- Email: `resident@wastewise.com`
- Password: `resident123`

## 📚 Key Features to Try

### For Residents
1. **Report Waste** - Create waste reports with photos
2. **Track Reports** - View status of your reports
3. **View Feed** - See community waste reports

### For Collectors
1. **View Tasks** - See assigned pickup tasks
2. **Route Optimization** - Optimize daily routes
3. **Complete Tasks** - Mark tasks as complete
4. **Performance** - View your performance metrics

### For Admins
1. **Dashboard** - View system analytics
2. **Assign Tasks** - Assign collectors to reports
3. **Manage Users** - View and manage all users
4. **Analytics** - View detailed reports and statistics

## 🛠️ Useful Commands

### Backend
```bash
npm run dev          # Start development server
npm start            # Start production server
npm test             # Run tests
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wastewise
```

### Port Already in Use
```bash
# Change port in .env file
PORT=5001  # Backend
VITE_PORT=3001  # Frontend
```

### CORS Errors
Make sure frontend URL is in backend CORS allowed origins:
```env
FRONTEND_URL=http://localhost:3000
```

## 📖 Next Steps

1. **Read Full Documentation**: Check `README.md`
2. **API Documentation**: Explore `API_DOCUMENTATION.md`
3. **Test with Swagger**: Visit http://localhost:5000/api-docs
4. **Customize**: Modify environment variables for your needs

## 🆘 Need Help?

- **Documentation**: Check README.md and API_DOCUMENTATION.md
- **API Docs**: http://localhost:5000/api-docs
- **Issues**: https://github.com/your-username/wastewise/issues

---

**Happy Coding! 🌱**
