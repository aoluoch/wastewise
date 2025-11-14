const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const crypto = require('crypto');
const { sendCustomEmail } = require('../services/emailService');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authMiddleware } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { aj } = require('../services/arcjet');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address.street')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Street address is required if address is provided'),
  body('address.city')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('City is required if address is provided'),
  body('address.state')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('State is required if address is provided'),
  body('address.zipCode')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Zip code is required if address is provided'),
  body('address.coordinates.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('address.coordinates.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  validate
], async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Arcjet: Validate email against disposable/invalid/no-MX rules
    try {
      if (aj && typeof aj.protect === 'function') {
        const decision = await aj.protect(req, { email });
        if (decision && typeof decision.isDenied === 'function' && decision.isDenied()) {
          let reasonDetails;
          try {
            // Provide specific reason when available (e.g., DISPOSABLE, INVALID, NO_MX_RECORDS)
            if (decision.reason && typeof decision.reason.isEmail === 'function' && decision.reason.isEmail()) {
              reasonDetails = decision.reason.emailTypes;
            }
          } catch (_error) {
            // Intentionally suppress errors when parsing reason details
          }

          return res.status(400).json({
            success: false,
            message: 'Invalid email. Disposable or non-routable emails are not allowed.',
            reason: reasonDetails
          });
        }
      }
    } catch (e) {
      // Fail-open on Arcjet errors to avoid blocking legitimate signups due to transient issues
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Arcjet] protect() error during register:', e && e.message ? e.message : e);
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      address
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          _id: user._id,
          id: user._id, // Also include id for frontend compatibility
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          address: user.address,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    // Handle duplicate email error from Mongo (race condition or index enforcement)
    if (error && error.code === 11000 && (error.keyPattern?.email || error.keyValue?.email)) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Handle Mongoose validation errors explicitly
    if (error && error.name === 'ValidationError') {
      const formattedErrors = {}
      Object.keys(error.errors || {}).forEach((key) => {
        const msg = error.errors[key]?.message || 'Invalid value'
        formattedErrors[key] = [msg]
      })
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors
      })
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? (error.message || String(error)) : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
], async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          _id: user._id,
          id: user._id, // Also include id for frontend compatibility
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          address: user.address,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Set cache control headers to prevent caching of auth responses
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Normalize user data to include both _id and id fields
    const normalizedUser = {
      _id: req.user._id,
      id: req.user._id, // Also include id for frontend compatibility
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      phone: req.user.phone,
      address: req.user.address,
      isActive: req.user.isActive,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };
    
    res.json({
      success: true,
      data: {
        user: normalizedUser
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validate
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.some(rt => rt.token === refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate refresh token)
// @access  Private
router.post('/logout', [
  authMiddleware,
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validate
], async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: refreshToken } }
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Request password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  validate
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Do not reveal whether the email exists
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#2E7D32;">Password Reset Request</h2>
        <p>Hello ${user.firstName || 'there'},</p>
        <p>You requested to reset your Wastewise password.</p>
        <div style="background-color:#f5f5f5; padding:15px; border-radius:5px; margin:20px 0; text-align:center;">
          <a href="${resetUrl}" style="background:#2E7D32; color:#fff; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await sendCustomEmail(user.email, subject, html);

    res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error sending reset email' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validate
], async (req, res) => {
  try {
    const { token, password } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    // Invalidate refresh tokens upon password change for safety
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error resetting password' });
  }
});

module.exports = router;
