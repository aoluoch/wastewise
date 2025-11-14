const express = require('express')
const { body, query } = require('express-validator')
const Notification = require('../models/Notification')
const { authMiddleware, authorize } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')

const router = express.Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// @route   GET /api/notifications
// @desc    Get user notifications with pagination
// @access  Private
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn([
        'report_created',
        'report_assigned',
        'report_completed',
        'pickup_scheduled',
        'pickup_reminder',
        'system_alert',
        'general',
      ])
      .withMessage('Invalid notification type'),
    query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
    validate,
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const skip = (page - 1) * limit

      // Build filter object
      const filter = { userId: req.user._id }

      if (req.query.type) {
        filter.type = req.query.type
      }
      if (req.query.isRead !== undefined) {
        filter.isRead = req.query.isRead === 'true'
      }

      // Get notifications with pagination
      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

      const total = await Notification.countDocuments(filter)
      const totalPages = Math.ceil(total / limit)
      const unreadCount = await Notification.getUnreadCount(req.user._id)

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
          unreadCount,
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

// @route   GET /api/notifications/unread-count
// @desc    Get unread notifications count
// @access  Private
router.get('/unread-count', [validate], async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user._id)

    res.json({
      success: true,
      data: { unreadCount },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   PATCH /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', [validate], async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    await notification.markAsRead()

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   PATCH /api/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.patch('/mark-all-read', [validate], async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user._id)

    res.json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', [validate], async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      })
    }

    // Check if user owns this notification
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      })
    }

    await Notification.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications
// @access  Private
router.delete('/clear-all', [validate], async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id })

    res.json({
      success: true,
      message: 'All notifications cleared',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
})

// @route   POST /api/notifications/send
// @desc    Send notification to users (admin only)
// @access  Private (Admin)
router.post(
  '/send',
  [
    authorize('admin'),
    body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
    body('type')
      .isIn([
        'report_created',
        'report_assigned',
        'report_completed',
        'pickup_scheduled',
        'pickup_reminder',
        'system_alert',
        'general',
      ])
      .withMessage('Invalid notification type'),
    body('title')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title is required and cannot exceed 100 characters'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Message is required and cannot exceed 500 characters'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('data').optional().isObject().withMessage('Data must be an object'),
    validate,
  ],
  async (req, res) => {
    try {
      const { userIds, type, title, message, priority = 'medium', data = {} } = req.body

      // Create notifications for all specified users
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        priority,
        data,
      }))

      const createdNotifications = await Notification.insertMany(notifications)

      // Emit socket event for real-time updates
      const io = req.app.get('io')
      if (io) {
        io.emit('new_notification', {
          notifications: createdNotifications,
        })
      }

      res.status(201).json({
        success: true,
        message: 'Notifications sent successfully',
        data: { notifications: createdNotifications },
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

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (admin only)
// @access  Private (Admin)
router.get('/stats', [authorize('admin'), validate], async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: ['$isRead', 0, 1] },
          },
        },
      },
    ])

    const totalNotifications = await Notification.countDocuments()
    const totalUnread = await Notification.countDocuments({ isRead: false })

    res.json({
      success: true,
      data: {
        totalNotifications,
        totalUnread,
        byType: stats,
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

module.exports = router
