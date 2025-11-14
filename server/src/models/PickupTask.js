const mongoose = require('mongoose')

const pickupTaskSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteReport',
      required: true,
    },
    collectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    estimatedDuration: {
      type: Number, // in minutes
      required: true,
      min: [5, 'Duration must be at least 5 minutes'],
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
    completionNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Completion notes cannot exceed 300 characters'],
    },
    images: [
      {
        type: String, // URLs of completion photos
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Indexes
pickupTaskSchema.index({ collectorId: 1 })
pickupTaskSchema.index({ reportId: 1 })
pickupTaskSchema.index({ status: 1 })
pickupTaskSchema.index({ scheduledDate: 1 })

// Virtual for actual duration
pickupTaskSchema.virtual('actualDuration').get(function () {
  if (this.actualStartTime && this.actualEndTime) {
    return (this.actualEndTime - this.actualStartTime) / (1000 * 60) // Convert to minutes
  }
  return null
})

// Method to start task
pickupTaskSchema.methods.startTask = function () {
  this.status = 'in_progress'
  this.actualStartTime = new Date()
  return this.save()
}

// Method to complete task
pickupTaskSchema.methods.completeTask = function (completionNotes, images = []) {
  this.status = 'completed'
  this.actualEndTime = new Date()
  this.completionNotes = completionNotes
  this.images = images
  return this.save()
}

// Method to cancel task
pickupTaskSchema.methods.cancelTask = function (reason) {
  this.status = 'cancelled'
  this.notes = reason
  return this.save()
}

module.exports = mongoose.model('PickupTask', pickupTaskSchema)
