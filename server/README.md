# Wastewise Backend Server

A comprehensive Express.js backend server for the Wastewise waste management application.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete CRUD operations for users with different roles (admin, collector, resident)
- **Waste Reports**: Create, manage, and track waste reports with image uploads
- **Pickup Scheduling**: Schedule and manage waste pickup tasks
- **Real-time Communication**: Socket.io integration for live updates
- **Notifications**: Email and in-app notification system
- **Image Upload**: Cloudinary integration for image storage
- **Analytics**: Dashboard statistics and analytics for different user roles
- **Security**: Rate limiting, CORS, helmet security headers
- **Validation**: Comprehensive input validation and error handling

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Users (Admin only)

- `GET /api/users` - List all users with pagination and filtering
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/collectors/available` - Get available collectors
- `GET /api/users/stats` - Get user statistics

### Waste Reports

- `POST /api/reports` - Create a new waste report (with image upload)
- `GET /api/reports` - List reports with filtering and pagination
- `GET /api/reports/:id` - Get single report
- `PATCH /api/reports/:id` - Update report status/assign collector
- `DELETE /api/reports/:id` - Delete report (admin only)
- `GET /api/reports/nearby` - Get reports near a location

### Pickups

- `POST /api/pickups` - Schedule pickup task (admin only)
- `GET /api/pickups` - List pickup tasks with filtering
- `GET /api/pickups/:id` - Get single pickup task
- `PATCH /api/pickups/:id/start` - Start pickup task (collector only)
- `PATCH /api/pickups/:id/complete` - Complete pickup task (collector only)
- `PATCH /api/pickups/:id/cancel` - Cancel pickup task
- `GET /api/pickups/collector/:collectorId/schedule` - Get collector's schedule

### Notifications

- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/send` - Send notification (admin only)

### Dashboard & Analytics

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/analytics` - Get analytics data

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Wastewise/server
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/wastewise

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

   # Server
   PORT=5000
   NODE_ENV=development

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## Database Models

### User

- Authentication and user profile information
- Role-based access (admin, collector, resident)
- Address and location data
- Refresh token management

### WasteReport

- Waste report details with location
- Image storage via Cloudinary
- Status tracking and assignment
- AI classification support

### PickupTask

- Pickup scheduling and management
- Time tracking and completion
- Collector assignment
- Status updates

### Notification

- In-app notification system
- Email integration
- Priority and expiration handling
- Real-time delivery

## Socket.io Events

### Client to Server

- `join_room` - Join a specific room
- `leave_room` - Leave a room
- `send_message` - Send chat message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `location_update` - Update collector location
- `task_status_update` - Update task status
- `emergency_alert` - Send emergency alert

### Server to Client

- `new_report` - New waste report created
- `assign_task` - Task assigned to collector
- `task_update` - Task status updated
- `new_message` - New chat message
- `user_typing` - User typing indicator
- `collector_location_update` - Collector location update
- `emergency_alert` - Emergency alert received
- `new_notification` - New notification

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: Comprehensive validation using express-validator
- **Error Handling**: Centralized error handling
- **Password Hashing**: bcrypt for secure password storage

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

The server is containerized with Docker. Use the provided `Dockerfile` and `docker-compose.yml` for deployment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
