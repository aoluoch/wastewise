const { validationResult } = require('express-validator')

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = {}

    errors.array().forEach(error => {
      if (!formattedErrors[error.path]) {
        formattedErrors[error.path] = []
      }
      formattedErrors[error.path].push(error.msg)
    })

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    })
  }

  next()
}

// Custom validation rules
const customValidators = {
  // Check if user exists
  userExists: async value => {
    const User = require('../models/User')
    const user = await User.findById(value)
    if (!user) {
      throw new Error('User not found')
    }
    return true
  },

  // Check if report exists
  reportExists: async value => {
    const WasteReport = require('../models/WasteReport')
    const report = await WasteReport.findById(value)
    if (!report) {
      throw new Error('Report not found')
    }
    return true
  },

  // Check if pickup task exists
  pickupTaskExists: async value => {
    const PickupTask = require('../models/PickupTask')
    const task = await PickupTask.findById(value)
    if (!task) {
      throw new Error('Pickup task not found')
    }
    return true
  },

  // Validate coordinates
  validCoordinates: value => {
    if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number') {
      throw new Error('Invalid coordinates format')
    }
    if (value.lat < -90 || value.lat > 90) {
      throw new Error('Latitude must be between -90 and 90')
    }
    if (value.lng < -180 || value.lng > 180) {
      throw new Error('Longitude must be between -180 and 180')
    }
    return true
  },

  // Validate date is in future
  futureDate: value => {
    const date = new Date(value)
    if (date <= new Date()) {
      throw new Error('Date must be in the future')
    }
    return true
  },

  // Validate file type
  validFileType: (value, allowedTypes) => {
    if (!value || !Array.isArray(value)) {
      throw new Error('Files are required')
    }

    const allowedMimeTypes = allowedTypes || ['image/jpeg', 'image/png', 'image/webp']

    for (const file of value) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`)
      }
    }

    return true
  },
}

module.exports = {
  validate,
  customValidators,
}
