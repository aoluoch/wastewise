const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
)

messageSchema.index({ room: 1, createdAt: -1 })

module.exports = mongoose.model('Message', messageSchema)
