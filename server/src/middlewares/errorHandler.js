// Global error handler middleware
const errorHandler = (err, req, res, _next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('Error:', err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, status: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    error = { message, status: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map(val => val.message)
      .join(', ')
    error = { message, status: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { message, status: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { message, status: 401 }
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large'
    error = { message, status: 400 }
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files'
    error = { message, status: 400 }
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected field'
    error = { message, status: 400 }
  }

  // Default error
  const statusCode = error.status || 500
  const message = error.message || 'Internal Server Error'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
