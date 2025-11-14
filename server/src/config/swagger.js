const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wastewise API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Wastewise waste management platform',
      contact: {
        name: 'Wastewise Team',
        email: 'support@wastewise.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.wastewise.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'User first name',
            },
            lastName: {
              type: 'string',
              description: 'User last name',
            },
            phone: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['admin', 'collector', 'resident'],
              description: 'User role',
            },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zipCode: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            isActive: {
              type: 'boolean',
              description: 'User account status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        WasteReport: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Report ID',
            },
            type: {
              type: 'string',
              enum: [
                'household',
                'recyclable',
                'hazardous',
                'electronic',
                'organic',
                'construction',
              ],
              description: 'Type of waste',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the waste',
            },
            location: {
              type: 'object',
              properties: {
                address: { type: 'string' },
                coordinates: {
                  type: 'object',
                  properties: {
                    lat: { type: 'number' },
                    lng: { type: 'number' },
                  },
                },
              },
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of image URLs',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed', 'cancelled'],
              description: 'Report status',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Priority level',
            },
            estimatedVolume: {
              type: 'number',
              description: 'Estimated volume in cubic feet',
            },
            notes: {
              type: 'string',
              description: 'Additional notes',
            },
            userId: {
              type: 'string',
              description: 'ID of the user who created the report',
            },
            assignedCollectorId: {
              type: 'string',
              description: 'ID of the assigned collector',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PickupTask: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Task ID',
            },
            reportId: {
              type: 'string',
              description: 'Associated waste report ID',
            },
            collectorId: {
              type: 'string',
              description: 'Assigned collector ID',
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
              description: 'Task status',
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled pickup date',
            },
            estimatedDuration: {
              type: 'number',
              description: 'Estimated duration in minutes',
            },
            actualStartTime: {
              type: 'string',
              format: 'date-time',
              description: 'Actual start time',
            },
            actualEndTime: {
              type: 'string',
              format: 'date-time',
              description: 'Actual end time',
            },
            notes: {
              type: 'string',
              description: 'Task notes',
            },
            completionNotes: {
              type: 'string',
              description: 'Completion notes',
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              description: 'Completion images',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Notification ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            type: {
              type: 'string',
              enum: ['info', 'success', 'warning', 'error'],
              description: 'Notification type',
            },
            title: {
              type: 'string',
              description: 'Notification title',
            },
            message: {
              type: 'string',
              description: 'Notification message',
            },
            isRead: {
              type: 'boolean',
              description: 'Read status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'object',
              description: 'Validation errors',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Waste Reports',
        description: 'Waste report management endpoints',
      },
      {
        name: 'Pickup Tasks',
        description: 'Pickup task management endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification management endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints',
      },
      {
        name: 'Analytics',
        description: 'Analytics and reporting endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js', './src/docs/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec
