const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Generate JWT token
const generateToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  })
}

// Generate refresh token
const generateRefreshToken = userId => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  })
}

// Verify JWT token
const verifyToken = token => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Auth middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token)
      const user = await User.findById(decoded.userId).select('-password')

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid. User not found.',
        })
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated.',
        })
      }

      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.',
      })
    }
  } catch (error) {
    next(error)
  }
}

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.',
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      })
    }

    next()
  }
}

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      try {
        const decoded = verifyToken(token)
        const user = await User.findById(decoded.userId).select('-password')

        if (user && user.isActive) {
          req.user = user
        }
      } catch (error) {
        // Token is invalid, but we continue without user
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  authMiddleware,
  authorize,
  optionalAuth,
}
