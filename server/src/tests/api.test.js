const request = require('supertest')
const path = require('path')

// Set required env vars for tests before importing the app
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret'
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret'
// Ensure mongodb-memory-server uses an older binary and caches it locally
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '4.4.24'
process.env.MONGOMS_DOWNLOAD_DIR =
  process.env.MONGOMS_DOWNLOAD_DIR || path.resolve(__dirname, '../../.cache/mongodb-binaries')

// Increase default Jest timeout for async DB ops (first MongoDB binary download can be slow)
jest.setTimeout(300000)

const { MongoMemoryServer } = require('mongodb-memory-server')
let mongoServer

const { app } = require('../server')
const mongoose = require('mongoose')
const User = require('../models/User')
const useExternalMongo = !!process.env.TEST_MONGO_URI

describe('Wastewise API Tests', () => {
  beforeAll(async () => {
    // Use external MongoDB if provided, otherwise start in-memory server
    if (useExternalMongo) {
      await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: 'wastewise_test' })
    } else {
      mongoServer = await MongoMemoryServer.create({
        // Use MongoDB 4.4.x which does not require AVX (fixes SIGILL on older CPUs)
        binary: { version: process.env.MONGOMS_VERSION || '4.4.24' },
      })
      const uri = mongoServer.getUri()
      await mongoose.connect(uri, { dbName: 'wastewise_test' })
    }
  })

  afterAll(async () => {
    // Clean up and disconnect
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.db.dropDatabase()
      }
    } catch (_) {}
    try {
      await mongoose.connection.close()
    } catch (_) {}
    if (mongoServer) {
      await mongoServer.stop()
    }
  })

  describe('Health Check', () => {
    test('GET /health should return server status', async () => {
      const response = await request(app).get('/health').expect(200)

      expect(response.body.status).toBe('OK')
      expect(response.body.timestamp).toBeDefined()
      expect(response.body.uptime).toBeDefined()
    })
  })

  describe('Authentication', () => {
    test('POST /api/auth/register should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      }

      const response = await request(app).post('/api/auth/register').send(userData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    test('POST /api/auth/login should authenticate user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const response = await request(app).post('/api/auth/login').send(loginData).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.token).toBeDefined()
    })

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      }

      const response = await request(app).post('/api/auth/login').send(loginData).expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Invalid')
    })
  })

  describe('Protected Routes', () => {
    let authToken

    beforeAll(async () => {
      // Create a user and get auth token
      const userData = {
        email: 'protected@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      }

      const registerResponse = await request(app).post('/api/auth/register').send(userData)

      authToken = registerResponse.body.data.token
    })

    test('GET /api/auth/me should return user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('protected@example.com')
    })

    test('GET /api/auth/me should reject request without token', async () => {
      const response = await request(app).get('/api/auth/me').expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Access denied')
    })
  })

  describe('User Management', () => {
    let adminToken

    beforeAll(async () => {
      // Create an admin user
      const adminData = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
      }

      const admin = new User(adminData)
      await admin.save()

      const loginResponse = await request(app).post('/api/auth/login').send({
        email: adminData.email,
        password: adminData.password,
      })

      adminToken = loginResponse.body.data.token
    })

    test('GET /api/users should return users list for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.users).toBeDefined()
      expect(response.body.data.pagination).toBeDefined()
    })

    test('GET /api/users should reject request from non-admin', async () => {
      // Create a regular user
      const userData = {
        email: 'regular@example.com',
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
      }

      const registerResponse = await request(app).post('/api/auth/register').send(userData)

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${registerResponse.body.data.token}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Access denied')
    })
  })

  describe('Error Handling', () => {
    test('Should handle 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route').expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Route not found')
    })

    test('Should handle validation errors', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123', // Too short
        firstName: '', // Empty
        lastName: 'Doe',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUserData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toBeDefined()
    })
  })
})
