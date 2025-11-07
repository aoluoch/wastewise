const mongoose = require('mongoose');

const wasteReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['household', 'electronic', 'hazardous', 'organic', 'recyclable', 'construction', 'other'],
    required: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    }
  },
  county: {
    type: String,
    required: [true, 'County is required'],
    trim: true
  },
  constituency: {
    type: String,
    required: [true, 'Constituency is required'],
    trim: true
  },
  images: [{
    type: String, // Cloudinary URLs
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedVolume: {
    type: Number,
    required: [true, 'Estimated volume is required'],
    min: [0.1, 'Volume must be greater than 0']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  },
  assignedCollectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scheduledPickupDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  aiClassification: {
    confidence: Number,
    predictedType: String,
    processedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
wasteReportSchema.index({ userId: 1 });
wasteReportSchema.index({ status: 1 });
wasteReportSchema.index({ type: 1 });
wasteReportSchema.index({ priority: 1 });
wasteReportSchema.index({ assignedCollectorId: 1 });
wasteReportSchema.index({ 'location.coordinates': '2dsphere' });
wasteReportSchema.index({ createdAt: -1 });

// Virtual for duration
wasteReportSchema.virtual('duration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.createdAt;
  }
  return null;
});

// Method to update status
wasteReportSchema.methods.updateStatus = function(newStatus, userId = null) {
  this.status = newStatus;
  
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  if (userId) {
    this.assignedCollectorId = userId;
  }
  
  return this.save();
};

// Static method to get reports by area
wasteReportSchema.statics.getReportsByArea = function(coordinates, radiusInKm = 5) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat]
        },
        $maxDistance: radiusInKm * 1000 // Convert km to meters
      }
    }
  });
};

module.exports = mongoose.model('WasteReport', wasteReportSchema);
