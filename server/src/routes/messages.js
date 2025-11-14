const express = require('express')
const { query } = require('express-validator')
const { authMiddleware } = require('../middlewares/auth')
const { validate } = require('../middlewares/validate')
const Message = require('../models/Message')

const router = express.Router()

// All routes require auth
router.use(authMiddleware)

// GET /api/messages?room=role:collector&page=1&limit=50
router.get(
  '/',
  [
    query('room').isString().trim().notEmpty().withMessage('room is required'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    validate,
  ],
  async (req, res) => {
    const room = req.query.room
    const page = req.query.page || 1
    const limit = req.query.limit || 50
    const skip = (page - 1) * limit

    // Basic authorization: allow fetching only rooms the user is allowed to join
    // Authorization checks
    const allowedRooms = new Set([`user:${req.user._id.toString()}`, `role:${req.user.role}`])

    let authorized = false

    if (allowedRooms.has(room)) {
      authorized = true
    }

    // Area rooms are allowed
    if (!authorized && room.startsWith('area:')) {
      authorized = true
    }

    // Direct messages dm:<idA>:<idB> where ids are sorted
    if (!authorized && room.startsWith('dm:')) {
      const parts = room.split(':')
      if (parts.length === 3) {
        const a = parts[1]
        const b = parts[2]
        const sorted = [a, b].sort().join(':')
        const expected = `dm:${sorted}`
        if (room === expected && (a === req.user._id.toString() || b === req.user._id.toString())) {
          authorized = true
        }
      }
    }

    if (!authorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this room' })
    }

    const [messages, total] = await Promise.all([
      Message.find({ room })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'firstName lastName role')
        .lean(),
      Message.countDocuments({ room }),
    ])

    const normalized = messages.reverse().map(m => ({
      id: m._id.toString(),
      senderId: m.sender?._id?.toString?.() || 'system',
      senderName: m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : 'System',
      senderRole: m.sender?.role || 'system',
      message: m.message,
      timestamp: new Date(m.createdAt).toISOString(),
      type: m.type === 'system' ? 'system' : 'text',
    }))

    return res.json({
      success: true,
      data: {
        messages: normalized,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  }
)

module.exports = router
