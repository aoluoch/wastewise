# 🌱 Wastewise - Smart Waste Management Platform

A comprehensive waste management application that connects residents, collectors, and administrators to create a cleaner, more efficient waste collection system.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Frontend Guide](#frontend-guide)
- [Backend Guide](#backend-guide)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Wastewise is a modern waste management platform that leverages technology to streamline waste collection processes. The platform enables residents to report waste issues, allows collectors to manage pickup tasks efficiently, and provides administrators with comprehensive analytics and management tools.

### Key Benefits

- **For Residents**: Easy waste reporting, real-time updates, scheduled pickups
- **For Collectors**: Optimized routes, task management, location tracking
- **For Administrators**: Analytics dashboard, user management, system oversight

## ✨ Features

### 🆕 Latest Updates (v2.0)

#### Location-Based Task Assignment
- **County & Constituency Integration**: All waste reports now include detailed location data
- **Smart Collector Matching**: Admins can easily assign collectors from the same area as the waste report
- **Advanced Filtering**: Filter reports by county, constituency, priority, and search terms
- **Collector Application with Location**: Residents applying to be collectors must provide their service area
- **Prioritized Collector List**: When assigning tasks, collectors from the same county are shown first

#### Enhanced Admin Features
- **Comprehensive Search**: Search reports by description, type, location, or reporter details
- **Multi-Filter Support**: Combine county, constituency, and priority filters for precise results
- **Location-Aware Assignment**: See waste location and collector location side-by-side
- **Collector Application Management**: Review and approve/reject collector applications with location info

### 🔐 Authentication & User Management
- **Multi-role System**: Admin, Collector, Resident roles with specific permissions
- **Secure Authentication**: JWT-based authentication with refresh tokens
- **Profile Management**: Complete user profiles with location data (county & constituency)
- **Role-based Access Control**: Granular permissions for different user types
- **Collector Application System**: Residents can apply to become collectors with location verification

### 📱 Waste Reporting
- **Smart Reporting**: Create detailed waste reports with photos
- **Location Services**: GPS-based location tracking with county and constituency data
- **Geographic Filtering**: Filter and search reports by administrative boundaries
- **Map Search**: Integrated Mapbox search for quick location selection
- **Priority System**: Urgent, high, medium, low priority levels
- **Real-time Updates**: Live status updates and notifications

### 🚛 Pickup Management
- **Task Scheduling**: Automated pickup scheduling based on location and capacity
- **Location-Based Assignment**: Smart collector assignment based on county and constituency
- **Route Optimization**: Efficient route planning for collectors
- **Advanced Search & Filtering**: Search reports by location, priority, and status
- **Status Tracking**: Real-time task status updates
- **Time Management**: Duration tracking and completion notes
- **Photo Documentation**: Before/after photos for verification

### 🔔 Notifications & Communication
- **Multi-channel Notifications**: In-app, email, and SMS notifications
- **Real-time Chat**: Direct communication between users
- **Emergency Alerts**: Critical situation reporting
- **Status Updates**: Automated notifications for all stakeholders

### 📊 Analytics & Reporting
- **Dashboard Analytics**: Role-specific dashboards with key metrics
- **Performance Tracking**: Collector efficiency and completion rates
- **Geographic Analysis**: Waste patterns by location
- **Trend Analysis**: Historical data and forecasting

### 🌐 Real-time Features
- **Live Updates**: Socket.io integration for real-time communication
- **Location Tracking**: Real-time collector location updates
- **Chat System**: Instant messaging between users
- **Status Synchronization**: Live status updates across all clients

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **React Query** - Server state management
- **Mapbox GL JS** - Interactive maps and geocoding search
- **Recharts** - Data visualization

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time bidirectional communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image and video management
- **Nodemailer** - Email sending
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **Swagger/OpenAPI** - API documentation
- **Jest** - Testing framework

### DevOps & Deployment
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and load balancer
- **PM2** - Process manager for Node.js
- **GitHub Actions** - CI/CD pipeline

## 📁 Project Structure

```
Wastewise/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── MapView.tsx
│   │   ├── pages/                  # Page components
│   │   │   ├── auth/               # Authentication pages
│   │   │   ├── admin/              # Admin dashboard pages
│   │   │   ├── collector/          # Collector pages
│   │   │   └── resident/          # Resident pages
│   │   ├── context/               # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── SocketContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── api/                   # API client functions
│   │   ├── types/                 # TypeScript type definitions
│   │   ├── utils/                 # Utility functions
│   │   └── styles/                # Global styles
│   ├── public/                    # Static assets
│   ├── package.json
│   └── vite.config.ts
├── server/                         # Backend Express application
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── models/                # Database models
│   │   │   ├── User.js
│   │   │   ├── WasteReport.js
│   │   │   ├── PickupTask.js
│   │   │   └── Notification.js
│   │   ├── routes/                # API routes
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── reports.js
│   │   │   ├── pickups.js
│   │   │   └── notifications.js
│   │   ├── services/              # Business logic services
│   │   │   ├── cloudinaryService.js
│   │   │   ├── socketService.js
│   │   │   └── emailService.js
│   │   ├── middlewares/           # Express middlewares
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── tests/                 # Test files
│   │   └── server.js              # Main server file
│   ├── package.json
│   └── README.md
├── docker-compose.yml             # Docker orchestration
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **pnpm** package manager
- **Git**

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/wastewise.git
   cd wastewise
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies (using pnpm)
   cd client
   pnpm install
   
   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp client/.env.example client/.env
   ```

4. **Configure Environment Variables**
   
   **Backend (.env)**
   ```env
   MONGODB_URI=mongodb://localhost:27017/wastewise
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   PORT=5000
   NODE_ENV=development
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # Email (for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@wastewise.com
   
   # Socket.io
   SOCKET_CORS_ORIGIN=http://localhost:5173
   ```
   
   **Frontend (client/.env)**
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Start the applications**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   pnpm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/health
   - **API Documentation (Swagger)**: http://localhost:5000/api-docs

## 📚 API Documentation

### Interactive API Documentation

Wastewise provides comprehensive interactive API documentation using **Swagger/OpenAPI 3.0**.

**Access the API Documentation:**
- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

The Swagger UI provides:
- ✅ Interactive API testing
- ✅ Request/response examples
- ✅ Schema definitions
- ✅ Authentication testing
- ✅ Real-time API exploration

### Quick API Reference

#### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user info | Private |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| POST | `/api/auth/reset-password` | Reset password with token | Public |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|  
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PATCH | `/api/users/:id` | Update user | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |
| GET | `/api/users/stats` | Get user statistics | Admin |
| POST | `/api/users/apply-for-collector` | Apply to become a collector | Resident |

### Waste Reports

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/reports` | Create waste report | Private |
| GET | `/api/reports` | List reports | Private |
| GET | `/api/reports/:id` | Get single report | Private |
| PATCH | `/api/reports/:id` | Update report | Admin/Collector |
| DELETE | `/api/reports/:id` | Delete report | Admin |
| GET | `/api/reports/nearby` | Get nearby reports | Private |

### Pickup Task Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/pickups/tasks` | Schedule pickup task | Admin |
| GET | `/api/pickups/tasks` | List all pickup tasks | Admin |
| GET | `/api/pickups/my-tasks` | Get collector's tasks | Collector |
| GET | `/api/pickups/tasks/:id` | Get pickup task details | Private |
| POST | `/api/pickups/tasks/:id/start` | Start pickup task | Collector |
| POST | `/api/pickups/tasks/:id/complete` | Complete pickup task | Collector |
| POST | `/api/pickups/tasks/:id/cancel` | Cancel pickup task | Admin/Collector |
| POST | `/api/pickups/tasks/:id/reschedule` | Reschedule pickup task | Admin/Collector |
| POST | `/api/pickups/tasks/:id/update-location` | Update collector location | Collector |
| GET | `/api/pickups/collector/stats` | Get collector statistics | Collector |
| GET | `/api/pickups/collector/performance` | Get performance metrics | Collector |

### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/notifications` | Get notifications | Private |
| PATCH | `/api/notifications/:id/read` | Mark as read | Private |
| PATCH | `/api/notifications/mark-all-read` | Mark all as read | Private |
| DELETE | `/api/notifications/:id` | Delete notification | Private |
| POST | `/api/notifications/send` | Send notification | Admin |

### Admin Analytics Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|  
| GET | `/api/admin/pending-reports` | Get pending waste reports with location data | Admin |
| POST | `/api/admin/assign-collector` | Assign collector to report (location-aware) | Admin |
| GET | `/api/admin/collectors` | Get all active collectors with location info | Admin |
| GET | `/api/admin/collector-applications` | Get pending collector applications | Admin |
| PUT | `/api/admin/collector-applications/:id/approve` | Approve collector application | Admin |
| PUT | `/api/admin/collector-applications/:id/reject` | Reject collector application | Admin |
| GET | `/api/admin/reports` | Get all reports with filters | Admin |
| PATCH | `/api/admin/reports/:id/status` | Update report status | Admin |
| GET | `/api/admin/users` | Get all users with filters | Admin |
| PATCH | `/api/admin/users/:id/status` | Update user status | Admin |
| GET | `/api/admin/analytics/reports` | Get report analytics | Admin |
| GET | `/api/admin/analytics/users` | Get user analytics | Admin |
| GET | `/api/admin/export/reports` | Export reports (CSV/Excel) | Admin |
| GET | `/api/admin/export/users` | Export users (CSV/Excel) | Admin |

### Messaging Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|  
| GET | `/api/messages/rooms/:room/messages` | Get room messages | Private |
| POST | `/api/messages/send` | Send message | Private |

### Statistics Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|  
| GET | `/api/statistics/dashboard` | Get dashboard statistics | Private |
| GET | `/api/statistics/reports` | Get report statistics | Admin |
| GET | `/api/statistics/collectors` | Get collector statistics | Admin |

### Example API Usage

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "resident"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Create a waste report:**
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "type=household" \
  -F "description=Large pile of household waste" \
  -F "location[address]=123 Main St, City" \
  -F "location[coordinates][lat]=40.7128" \
  -F "location[coordinates][lng]=-74.0060" \
  -F "estimatedVolume=5.5" \
  -F "priority=medium" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

**Get collector's tasks:**
```bash
curl -X GET "http://localhost:5000/api/pickups/my-tasks?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_COLLECTOR_TOKEN"
```

**Complete a pickup task:**
```bash
curl -X POST http://localhost:5000/api/pickups/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_COLLECTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Task completed successfully"
  }'
```

### Testing with Swagger UI

1. **Start the server**: `npm run dev`
2. **Open Swagger UI**: Navigate to http://localhost:5000/api-docs
3. **Authenticate**: Click "Authorize" button and enter your JWT token
4. **Test endpoints**: Expand any endpoint and click "Try it out"
5. **Execute**: Fill in parameters and click "Execute"
6. **View response**: See the response body, headers, and status code

### API Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## 🎨 Frontend Guide

### Component Structure

The frontend is built with React and TypeScript, following modern best practices:

- **Components**: Reusable UI components in `/src/components/`
- **Pages**: Route-specific pages in `/src/pages/`
- **Context**: Global state management with React Context
- **Hooks**: Custom hooks for API calls and state management
- **Types**: TypeScript definitions for type safety

### Key Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Socket.io integration for live updates
- **State Management**: React Query for server state
- **Maps Integration**: Mapbox GL JS for interactive maps and search
- **Image Upload**: Cloudinary integration

### Development Commands

```bash
# Start development server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test

# Lint code
pnpm run lint

# Type checking
pnpm run type-check
```

## 🔧 Backend Guide

### Architecture

The backend follows a clean architecture pattern:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and external service integration
- **Models**: Database schemas and data validation
- **Routes**: API endpoint definitions
- **Middlewares**: Authentication, validation, and error handling

### Key Features

- **RESTful API**: Well-structured API endpoints
- **Real-time Communication**: Socket.io for live updates
- **File Upload**: Cloudinary integration for images
- **Email Service**: Nodemailer for notifications
- **Security**: JWT authentication, rate limiting, CORS
- **Validation**: Comprehensive input validation
- **Error Handling**: Centralized error management

### Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🐳 Deployment

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Environment variables for production**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb://mongo:27017/wastewise
   JWT_SECRET=your-production-secret
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   EMAIL_USER=your-production-email
   ```

### Manual Deployment

1. **Build frontend**
   ```bash
   cd client
   pnpm run build
   ```

2. **Start backend**
   ```bash
   cd server
   npm start
   ```

3. **Configure reverse proxy** (Nginx example)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           root /path/to/client/dist;
           try_files $uri $uri/ /index.html;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 🧪 Testing

### Frontend Testing

```bash
cd client
pnpm run test          # Run tests
pnpm run test:coverage # Run with coverage
pnpm run test:ui       # Run with UI
```

### Backend Testing

```bash
cd server
npm test              # Run tests
npm run test:watch    # Run in watch mode
npm run test:coverage # Run with coverage
```

### API Testing

Use the provided test suite or tools like Postman:

```bash
# Run API tests
cd server
npm test src/tests/api.test.js
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Use meaningful commit messages
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Express.js Team** - For the robust backend framework
- **MongoDB Team** - For the flexible database solution
- **Socket.io Team** - For real-time communication capabilities
- **Cloudinary** - For image management services
- **Tailwind CSS** - For the utility-first CSS framework

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/wastewise/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/wastewise/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/wastewise/discussions)
- **Email**: support@wastewise.com

---

**Made with ❤️ by the Wastewise Team**

*Building a cleaner future, one report at a time.* 🌱