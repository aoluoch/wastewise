const rateLimit = require('express-rate-limit');

/**
 * Rate Limiting Configuration for Scalability
 * 
 * This module provides different rate limiting strategies for various endpoints
 * to ensure the application can handle high traffic while preventing abuse.
 */

// General API rate limiter - applies to most endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 requests per 15 min in production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
});

// Strict rate limiter for authentication endpoints (login, register)
// Prevents brute force attacks and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 login attempts per 15 min in production
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false, // Count failed attempts
});

// Moderate rate limiter for password reset endpoints
// Prevents abuse of password reset functionality
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 3 : 50, // 3 reset requests per hour in production
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiter for read operations (GET requests)
// Allows more frequent reads for better user experience
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 2000, // 200 requests per 15 min in production
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for write operations (POST, PUT, PATCH, DELETE)
// Prevents spam and abuse of resource creation
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 50 : 500, // 50 write requests per 15 min in production
  message: {
    success: false,
    message: 'Too many write operations. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict limiter for file uploads
// Prevents storage abuse and excessive bandwidth usage
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 20 : 100, // 20 uploads per hour in production
  message: {
    success: false,
    message: 'Upload limit exceeded. Please try again after 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limiter for API documentation access
const docsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 300, // 30 requests per 15 min in production
  message: {
    success: false,
    message: 'Too many requests to API documentation.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a custom limiter with configurable options
const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max: process.env.NODE_ENV === 'production' ? max : max * 10,
    message: {
      success: false,
      message,
      retryAfter: `${windowMs / 60000} minutes`
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  readLimiter,
  writeLimiter,
  uploadLimiter,
  docsLimiter,
  createCustomLimiter
};
