const express = require('express')
const { body, query } = require('express-validator')
const User = require('../models/User')
const { authMiddleware, authorize } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get(
  '/',
  [
    authorize('admin'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['admin', 'collector', 'resident']).withMessage('Invalid role'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term cannot be empty'),
    validate,
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      // Build filter object
      const filter = {}

      if (req.query.role) {
        filter.role = req.query.role
      }

      if (req.query.search) {
        filter.$or = [
          { firstName: { $regex: req.query.search, $options: 'i' } },
          { lastName: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ]
      }

      // Get users with pagination
      const users = await User.find(filter)
        .select('-refreshTokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await User.countDocuments(filter)
      const totalPages = Math.ceil(total / limit)

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
)

// @route   GET /api/users/:id
// @desc    Get user by ID (admin only)
// @access  Private (Admin)
router.get('/:id', [authorize('admin'), validate], async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-refreshTokens')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      data: { user },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   PATCH /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.patch(
  '/:id',
  [
    authorize('admin'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('role').optional().isIn(['admin', 'collector', 'resident']).withMessage('Invalid role'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
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
    validate,
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      // Prevent admin from deactivating themselves
      if (req.params.id === req.user._id.toString() && req.body.isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account',
        })
      }

      // Update user
      const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).select('-refreshTokens')

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
)

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', [authorize('admin'), validate], async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      })
    }

    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   GET /api/users/collectors/available
// @desc    Get available collectors (admin only)
// @access  Private (Admin)
router.get('/collectors/available', [authorize('admin'), validate], async (req, res) => {
  try {
    const collectors = await User.find({
      role: 'collector',
      isActive: true,
    }).select('firstName lastName email phone address')

    res.json({
      success: true,
      data: { collectors },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   GET /api/users/stats
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get('/stats', [authorize('admin'), validate], async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] },
          },
        },
      },
    ])

    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        byRole: stats,
        inactiveUsers: totalUsers - activeUsers,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   POST /api/users/apply-for-collector
// @desc    Apply to become a collector
// @access  Private (Resident)
router.post(
  '/apply-for-collector',
  [
    authorize('resident'),
    body('county')
      .trim()
      .notEmpty()
      .withMessage('County is required')
      .isLength({ max: 100 })
      .withMessage('County cannot exceed 100 characters'),
    body('constituency')
      .trim()
      .notEmpty()
      .withMessage('Constituency is required')
      .isLength({ max: 100 })
      .withMessage('Constituency cannot exceed 100 characters'),
    validate,
  ],
  async (req, res) => {
    try {
      const { county, constituency } = req.body
      const user = await User.findById(req.user._id)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      // Check if already a collector
      if (user.role === 'collector') {
        return res.status(400).json({
          success: false,
          message: 'You are already a collector',
        })
      }

      // Check if already applied
      if (user.collectorApplicationStatus === 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Your application is already pending review',
        })
      }

      // Check if already approved
      if (user.collectorApplicationStatus === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Your application has already been approved',
        })
      }

      // Update application status and location
      user.collectorApplicationStatus = 'pending'
      user.county = county
      user.constituency = constituency
      await user.save()

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: { user },
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
)

module.exports = router
