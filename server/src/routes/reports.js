const express = require('express');
const { body, query } = require('express-validator');
const WasteReport = require('../models/WasteReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { uploadMultiple, deleteImages, extractPublicId } = require('../services/cloudinaryService');
const { verifyImagesAreWaste } = require('../services/aiImageVerifier');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   POST /api/reports
// @desc    Create a new waste report
// @access  Private
router.post('/', [
  uploadMultiple,
  // Multer error handler
  (err, req, res, next) => {
    if (err) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB per file.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field name.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error'
      });
    }
    next();
  },
  body('type')
    .isIn(['household', 'electronic', 'hazardous', 'organic', 'recyclable', 'construction', 'other'])
    .withMessage('Invalid waste type'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('location')
    .custom((value) => {
      try {
        const location = JSON.parse(value);
        if (!location.address || !location.coordinates || 
            typeof location.coordinates.lat !== 'number' || 
            typeof location.coordinates.lng !== 'number') {
          throw new Error('Invalid location format');
        }
        if (location.coordinates.lat < -90 || location.coordinates.lat > 90) {
          throw new Error('Invalid latitude');
        }
        if (location.coordinates.lng < -180 || location.coordinates.lng > 180) {
          throw new Error('Invalid longitude');
        }
        return true;
      } catch (error) {
        throw new Error('Invalid location data');
      }
    }),
  body('estimatedVolume')
    .isFloat({ min: 0.1 })
    .withMessage('Estimated volume must be greater than 0'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  validate
], async (req, res) => {
  try {
    console.log('Reports route - req.files:', req.files);
    console.log('Reports route - req.body:', req.body);
    
    // Check if images were uploaded
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'At least one image is required'
      });
    }

    const { type, description, location: locationString, estimatedVolume, notes, priority } = req.body;
    
    // Parse location JSON
    const location = JSON.parse(locationString);

    // Extract image URLs from uploaded files
    const images = req.files.map(file => file.path);

    // AI verify images depict waste
    console.log('Starting AI verification for', images.length, 'images...');
    const aiDecision = await verifyImagesAreWaste(images)
    console.log('AI verification result:', aiDecision);
    
    if (!aiDecision.allowed) {
      // Clean up uploaded images if rejected
      const publicIds = req.files.map(file => extractPublicId(file.path));
      await deleteImages(publicIds);
      
      const confidenceText = aiDecision.confidence ? ` (Confidence: ${(aiDecision.confidence * 100).toFixed(1)}%)` : '';
      
      return res.status(400).json({
        success: false,
        message: `Uploaded photos do not appear to depict waste${confidenceText}`,
        reasons: aiDecision.reasons || ['Images do not clearly show waste materials'],
        confidence: aiDecision.confidence || 0.0
      });
    }
    
    console.log('AI verification passed. Creating report...');

    // Create new report
    const report = new WasteReport({
      userId: req.user._id,
      type,
      description,
      location: {
        address: location.address,
        coordinates: {
          lat: parseFloat(location.coordinates.lat),
          lng: parseFloat(location.coordinates.lng)
        }
      },
      images,
      estimatedVolume: parseFloat(estimatedVolume),
      notes,
      priority: priority || 'medium'
    });

    await report.save();

    // Create notification for admins and collectors
    const adminsAndCollectors = await User.find({
      role: { $in: ['admin', 'collector'] },
      isActive: true
    });

    const notifications = adminsAndCollectors.map(user => ({
      userId: user._id,
      type: 'report_created',
      title: 'New Waste Report',
      message: `New ${type} waste report created by ${req.user.firstName} ${req.user.lastName}`,
      data: { reportId: report._id },
      priority: 'medium'
    }));

    await Notification.insertMany(notifications);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('new_report', {
        report: report,
        user: req.user
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: { report }
    });
  } catch (error) {
    console.error('Reports route error:', error);
    
    // Clean up uploaded images if report creation fails
    if (req.files) {
      const publicIds = req.files.map(file => extractPublicId(file.path));
      await deleteImages(publicIds);
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/reports
// @desc    Get reports with filtering and pagination
// @access  Private
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['household', 'electronic', 'hazardous', 'organic', 'recyclable', 'construction', 'other'])
    .withMessage('Invalid type'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Residents can only see their own reports
    if (req.user.role === 'resident') {
      filter.userId = req.user._id;
    }

    // Collectors can see assigned reports and all reports
    if (req.user.role === 'collector') {
      filter.$or = [
        { assignedCollectorId: req.user._id },
        { status: 'pending' }
      ];
    }

    // Admins can see all reports
    if (req.user.role === 'admin') {
      // No additional filter
    }

    // Apply query filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Get reports with pagination
    const reports = await WasteReport.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedCollectorId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WasteReport.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
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

// @route   GET /api/reports/feed
// @desc    Get all reports visible to logged-in users, newest first
// @access  Private
router.get('/feed', [
  validate
], async (req, res) => {
  try {
    const filter = {}
    // Residents can see all reports (community feed)
    // Collectors and Admins also see all
    // No extra filter for now

    console.log('Fetching reports from database...')
    const reports = await WasteReport.find(filter)
      .populate('userId', 'firstName lastName email')
      .select('type description images location status priority estimatedVolume notes userId createdAt updatedAt')
      .sort({ createdAt: -1 })

    console.log(`Found ${reports.length} reports in database`)
    console.log('Report IDs:', reports.map(r => r._id))

    res.json({ success: true, data: { reports } })
  } catch (error) {
    console.error('Error fetching reports:', error)
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Private
router.get('/:id', [
  validate
], async (req, res) => {
  try {
    console.log('Fetching report by ID:', req.params.id)
    const report = await WasteReport.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedCollectorId', 'firstName lastName email phone');

    if (!report) {
      console.log('Report not found:', req.params.id)
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    console.log('Report found:', {
      id: report._id,
      type: report.type,
      hasLocation: !!report.location,
      locationAddress: report.location?.address,
      hasCoordinates: !!(report.location?.coordinates?.lat && report.location?.coordinates?.lng)
    })

    // Allow all authenticated users to view report details (community feed)
    // No access restrictions - everyone can view all reports

    res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/reports/:id
// @desc    Update report (admin/collector/resident)
// @access  Private (Admin/Collector/Resident)
router.patch('/:id', [
  authorize('admin', 'collector', 'resident'),
  body('status')
    .optional()
    .isIn(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('assignedCollectorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid collector ID'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must be between 1 and 500 characters'),
  validate
], async (req, res) => {
  try {
    const report = await WasteReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Collectors can only update reports assigned to them
    if (req.user.role === 'collector' && report.assignedCollectorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Residents can only update their own reports (allow editing description/notes only)
    if (req.user.role === 'resident') {
      if (report.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }
      
      console.log('Resident updating their own report:', {
        reportId: req.params.id,
        userId: req.user._id,
        updates: req.body
      })
      
      const { description, notes } = req.body
      
      // Update description if provided
      if (description !== undefined) {
        if (typeof description === 'string' && description.trim().length > 0) {
          report.description = description.trim()
        } else {
          return res.status(400).json({
            success: false,
            message: 'Description is required and cannot be empty'
          })
        }
      }
      
      // Update notes if provided
      if (notes !== undefined) {
        report.notes = typeof notes === 'string' ? notes.trim() : ''
      }
      
      await report.save()
      
      console.log('Report updated successfully by resident:', {
        reportId: req.params.id,
        newDescription: report.description,
        newNotes: report.notes
      })
      
      return res.json({ 
        success: true, 
        message: 'Report updated successfully', 
        data: { report } 
      })
    }

    const { status, priority, assignedCollectorId, notes } = req.body;
    const oldStatus = report.status;

    // Update report
    if (status) report.status = status;
    if (priority) report.priority = priority;
    if (assignedCollectorId) report.assignedCollectorId = assignedCollectorId;
    if (notes) report.notes = notes;

    if (status === 'completed') {
      report.completedAt = new Date();
    }

    await report.save();

    // Create notifications for status changes
    if (status && status !== oldStatus) {
      const notifications = [];

      // Notify the report creator
      notifications.push({
        userId: report.userId,
        type: 'report_assigned',
        title: 'Report Status Updated',
        message: `Your report status has been updated to ${status}`,
        data: { reportId: report._id },
        priority: 'medium'
      });

      // Notify assigned collector if status is assigned
      if (status === 'assigned' && assignedCollectorId) {
        notifications.push({
          userId: assignedCollectorId,
          type: 'report_assigned',
          title: 'New Task Assigned',
          message: `You have been assigned a new waste collection task`,
          data: { reportId: report._id },
          priority: 'high'
        });
      }

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.emit('task_update', {
          report: report,
          oldStatus,
          newStatus: status
        });
      }
    }

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report (admin only)
// @access  Private (Admin)
router.delete('/:id', [
  authorize('admin', 'collector', 'resident'),
  validate
], async (req, res) => {
  try {
    const report = await WasteReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Only allow residents to delete their own
    if (req.user.role === 'resident' && report.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' })
    }

    // Delete images from Cloudinary
    const publicIds = report.images.map(imageUrl => extractPublicId(imageUrl)).filter(Boolean);
    if (publicIds.length > 0) {
      try {
        await deleteImages(publicIds);
        console.log('Successfully deleted images from Cloudinary:', publicIds);
      } catch (imageError) {
        console.error('Error deleting images from Cloudinary:', imageError);
        // Continue with database deletion even if image deletion fails
      }
    }

    // Delete the report from database using deleteOne for more explicit control
    const deleteResult = await WasteReport.deleteOne({ _id: req.params.id });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found or already deleted'
      });
    }

    console.log('Successfully deleted report from database:', req.params.id, 'Deleted count:', deleteResult.deletedCount);

    // Verify deletion by trying to find the report again
    const verifyDeleted = await WasteReport.findById(req.params.id);
    if (verifyDeleted) {
      console.error('WARNING: Report still exists after deletion!', req.params.id);
    } else {
      console.log('Verification: Report successfully deleted from database');
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('report_deleted', {
        reportId: req.params.id,
        userId: report.userId
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/reports/nearby
// @desc    Get reports near a location
// @access  Private
router.get('/nearby', [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Radius must be between 0.1 and 50 km'),
  validate
], async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 5; // Default 5km

    const reports = await WasteReport.getReportsByArea({ lat, lng }, radius);

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
