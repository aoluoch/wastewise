const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'report_created',
        'report_assigned',
        'report_completed',
        'pickup_scheduled',
        'pickup_reminder',
        'system_alert',
        'general',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data like reportId, pickupId, etc.
      default: {},
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
notificationSchema.index({ userId: 1 })
notificationSchema.index({ isRead: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ priority: 1 })
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// Static method to create notification
notificationSchema.statics.createNotification = function (
  userId,
  type,
  title,
  message,
  data = {},
  priority = 'medium'
) {
  return this.create({
    userId,
    type,
    title,
    message,
    data,
    priority,
  })
}

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false })
}

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() })
}

module.exports = mongoose.model('Notification', notificationSchema)
