const express = require('express');
const { body, query } = require('express-validator');
const PickupTask = require('../models/PickupTask');
const WasteReport = require('../models/WasteReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authMiddleware, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   POST /api/pickups
// @desc    Schedule a pickup task (admin only)
// @access  Private (Admin)
router.post('/', [
  authorize('admin'),
  body('reportId')
    .isMongoId()
    .withMessage('Invalid report ID'),
  body('collectorId')
    .isMongoId()
    .withMessage('Invalid collector ID'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('estimatedDuration')
    .isInt({ min: 5 })
    .withMessage('Duration must be at least 5 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  validate
], async (req, res) => {
  try {
    const { reportId, collectorId, scheduledDate, estimatedDuration, notes } = req.body;

    // Check if report exists and is not already assigned
    const report = await WasteReport.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule pickup for completed report'
      });
    }

    // Check if collector exists and is active
    const collector = await User.findOne({ _id: collectorId, role: 'collector', isActive: true });
    if (!collector) {
      return res.status(404).json({
        success: false,
        message: 'Collector not found or inactive'
      });
    }

    // Create pickup task
    const pickupTask = new PickupTask({
      reportId,
      collectorId,
      scheduledDate: new Date(scheduledDate),
      estimatedDuration,
      notes
    });

    await pickupTask.save();

    // Update report status and assign collector
    report.status = 'assigned';
    report.assignedCollectorId = collectorId;
    report.scheduledPickupDate = new Date(scheduledDate);
    await report.save();

    // Create notifications
    const notifications = [
      {
        userId: collectorId,
        type: 'pickup_scheduled',
        title: 'New Pickup Task',
        message: `You have been assigned a new pickup task scheduled for ${new Date(scheduledDate).toLocaleDateString()}`,
        data: { pickupTaskId: pickupTask._id, reportId },
        priority: 'high'
      },
      {
        userId: report.userId,
        type: 'pickup_scheduled',
        title: 'Pickup Scheduled',
        message: `Your waste report has been scheduled for pickup on ${new Date(scheduledDate).toLocaleDateString()}`,
        data: { pickupTaskId: pickupTask._id, reportId },
        priority: 'medium'
      }
    ];

    await Notification.insertMany(notifications);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('assign_task', {
        // Explicitly include collectorId so frontend can match and refetch
        collectorId: collectorId,
        pickupTask,
        report,
        collector
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pickup task scheduled successfully',
      data: { pickupTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups
// @desc    Get pickup tasks with filtering
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
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
  query('collectorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid collector ID'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Collectors can only see their own tasks
    if (req.user.role === 'collector') {
      filter.collectorId = req.user._id;
    }

    // Residents can see tasks for their reports
    if (req.user.role === 'resident') {
      const userReports = await WasteReport.find({ userId: req.user._id }).select('_id');
      filter.reportId = { $in: userReports.map(r => r._id) };
    }

    // Apply query filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.collectorId) {
      filter.collectorId = req.query.collectorId;
    }

    // Get pickup tasks with pagination
    const pickupTasks = await PickupTask.find(filter)
      .populate('reportId', 'type description location priority estimatedVolume')
      .populate('collectorId', 'firstName lastName email phone')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await PickupTask.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: {
        pickupTasks: pickupTasks.length === 0 ? [] : pickupTasks,
        pagination: {
          page,
          limit,
          total: pickupTasks.length === 0 ? 0 : total,
          totalPages: pickupTasks.length === 0 ? 0 : totalPages
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

// (moved below '/my-tasks' to avoid shadowing)

// @route   PATCH /api/pickups/:id/start
// @desc    Start pickup task (collector only)
// @access  Private (Collector)
router.patch('/:id/start', [
  authorize('collector'),
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id);

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    if (pickupTask.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (pickupTask.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in scheduled status'
      });
    }

    await pickupTask.startTask();

    // Update report status
    await WasteReport.findByIdAndUpdate(pickupTask.reportId, {
      status: 'in_progress'
    });

    // Create notification for report creator
    const report = await WasteReport.findById(pickupTask.reportId);
    await Notification.createNotification(
      report.userId,
      'pickup_reminder',
      'Pickup Started',
      'Your waste pickup has started',
      { pickupTaskId: pickupTask._id },
      'medium'
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask,
        status: 'in_progress'
      });
    }

    res.json({
      success: true,
      message: 'Pickup task started successfully',
      data: { pickupTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/pickups/:id/complete
// @desc    Complete pickup task (collector only)
// @access  Private (Collector)
router.patch('/:id/complete', [
  authorize('collector'),
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Completion notes cannot exceed 300 characters'),
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id);

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    if (pickupTask.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (pickupTask.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in progress'
      });
    }

    const { completionNotes } = req.body;

    await pickupTask.completeTask(completionNotes);

    // Update report status
    await WasteReport.findByIdAndUpdate(pickupTask.reportId, {
      status: 'completed',
      completedAt: new Date()
    });

    // Create notifications
    const report = await WasteReport.findById(pickupTask.reportId);
    const notifications = [
      {
        userId: report.userId,
        type: 'report_completed',
        title: 'Pickup Completed',
        message: 'Your waste pickup has been completed successfully',
        data: { pickupTaskId: pickupTask._id, reportId: report._id },
        priority: 'medium'
      }
    ];

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true });
    admins.forEach(admin => {
      notifications.push({
        userId: admin._id,
        type: 'report_completed',
        title: 'Task Completed',
        message: `Pickup task completed by ${req.user.firstName} ${req.user.lastName}`,
        data: { pickupTaskId: pickupTask._id, reportId: report._id },
        priority: 'low'
      });
    });

    await Notification.insertMany(notifications);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask,
        status: 'completed'
      });
    }

    res.json({
      success: true,
      message: 'Pickup task completed successfully',
      data: { pickupTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PATCH /api/pickups/:id/cancel
// @desc    Cancel pickup task
// @access  Private (Admin/Collector)
router.patch('/:id/cancel', [
  authorize('admin', 'collector'),
  body('reason')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Reason is required and cannot exceed 200 characters'),
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id);

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    // Collectors can only cancel their own tasks
    if (req.user.role === 'collector' && pickupTask.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (pickupTask.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed task'
      });
    }

    const { reason } = req.body;

    await pickupTask.cancelTask(reason);

    // Update report status
    await WasteReport.findByIdAndUpdate(pickupTask.reportId, {
      status: 'pending',
      assignedCollectorId: null,
      scheduledPickupDate: null
    });

    // Create notifications
    const report = await WasteReport.findById(pickupTask.reportId);
    await Notification.createNotification(
      report.userId,
      'system_alert',
      'Pickup Cancelled',
      `Your pickup has been cancelled: ${reason}`,
      { pickupTaskId: pickupTask._id },
      'medium'
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask,
        status: 'cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Pickup task cancelled successfully',
      data: { pickupTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/my-tasks
// @desc    Get current collector's tasks
// @access  Private (Collector)
router.get('/my-tasks', [
  authorize('collector'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
], async (req, res) => {
  try {
    console.log('📋 My-tasks endpoint called for user:', req.user._id);
    
    // Validate user exists and has collector role
    if (!req.user || req.user.role !== 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Collector role required.'
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { collectorId: req.user._id };
    console.log('🔍 Filter:', filter);

    // First check if any tasks exist for this collector
    let taskCount;
    try {
      taskCount = await PickupTask.countDocuments(filter);
      console.log('📊 Total tasks found:', taskCount);
    } catch (countError) {
      console.error('❌ Error counting tasks:', countError);
      return res.status(500).json({
        success: false,
        message: 'Database error while counting tasks',
        error: process.env.NODE_ENV === 'development' ? countError.message : undefined
      });
    }

    if (taskCount === 0) {
      return res.json({
        success: true,
        data: {
          pickupTasks: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    // Try to get tasks with population
    let pickupTasks;
    try {
      pickupTasks = await PickupTask.find(filter)
        .populate({
          path: 'reportId',
          select: 'type description location priority estimatedVolume status userId',
          options: { strictPopulate: false }
        })
        .populate({
          path: 'collectorId',
          select: 'firstName lastName email phone',
          options: { strictPopulate: false }
        })
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limit)
        .lean(); // Use lean() for better performance
      
      console.log('✅ Tasks retrieved successfully:', pickupTasks.length);
    } catch (populationError) {
      console.error('❌ Population error:', populationError);
      // Fallback: get tasks without population
      try {
        pickupTasks = await PickupTask.find(filter)
          .sort({ scheduledDate: 1 })
          .skip(skip)
          .limit(limit)
          .lean();
        console.log('⚠️ Retrieved tasks without population:', pickupTasks.length);
      } catch (fallbackError) {
        console.error('❌ Fallback query error:', fallbackError);
        return res.status(500).json({
          success: false,
          message: 'Database error while retrieving tasks',
          error: process.env.NODE_ENV === 'development' ? fallbackError.message : undefined
        });
      }
    }

    const total = taskCount;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        pickupTasks: pickupTasks || [],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in /my-tasks endpoint:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      user: req.user ? { id: req.user._id, role: req.user.role } : 'No user'
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/:id
// @desc    Get single pickup task by ID
// @access  Private
router.get('/:id', [
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id)
      .populate('reportId')
      .populate('collectorId', 'firstName lastName email phone');

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'collector' && pickupTask.collectorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'resident' && pickupTask.reportId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { pickupTask }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/tasks/:id
// @desc    Get single pickup task by ID (alternative route for frontend compatibility)
// @access  Private
router.get('/tasks/:id', [
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id)
      .populate('reportId')
      .populate('collectorId', 'firstName lastName email phone');

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    // Check access permissions
    if (req.user.role === 'collector' && pickupTask.collectorId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'resident' && pickupTask.reportId.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: pickupTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/pickups/tasks/:id/start
// @desc    Start pickup task (alternative route for frontend compatibility)
// @access  Private (Collector)
router.post('/tasks/:id/start', [
  authorize('collector'),
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id);

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    if (pickupTask.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (pickupTask.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in scheduled status'
      });
    }

    await pickupTask.startTask();

    // Update report status
    await WasteReport.findByIdAndUpdate(pickupTask.reportId, {
      status: 'in_progress'
    });

    // Create notification for report creator
    const report = await WasteReport.findById(pickupTask.reportId);
    await Notification.createNotification(
      report.userId,
      'pickup_reminder',
      'Pickup Started',
      'Your waste pickup has started',
      { pickupTaskId: pickupTask._id },
      'medium'
    );

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask,
        status: 'in_progress'
      });
    }

    res.json({
      success: true,
      message: 'Pickup task started successfully',
      data: pickupTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/pickups/tasks/:id/complete
// @desc    Complete pickup task (alternative route for frontend compatibility)
// @access  Private (Collector)
router.post('/tasks/:id/complete', [
  authorize('collector'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Notes cannot exceed 300 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL'),
  validate
], async (req, res) => {
  try {
    const pickupTask = await PickupTask.findById(req.params.id);

    if (!pickupTask) {
      return res.status(404).json({
        success: false,
        message: 'Pickup task not found'
      });
    }

    if (pickupTask.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (pickupTask.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Task is not in progress'
      });
    }

    const { notes, images = [] } = req.body;

    await pickupTask.completeTask(notes, images);

    // Update report status
    await WasteReport.findByIdAndUpdate(pickupTask.reportId, {
      status: 'completed',
      completedAt: new Date()
    });

    // Create notifications
    const report = await WasteReport.findById(pickupTask.reportId);
    const notifications = [
      {
        userId: report.userId,
        type: 'report_completed',
        title: 'Pickup Completed',
        message: 'Your waste pickup has been completed successfully',
        data: { pickupTaskId: pickupTask._id, reportId: report._id },
        priority: 'medium'
      }
    ];

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true });
    admins.forEach(admin => {
      notifications.push({
        userId: admin._id,
        type: 'report_completed',
        title: 'Task Completed',
        message: `Pickup task completed by ${req.user.firstName} ${req.user.lastName}`,
        data: { pickupTaskId: pickupTask._id, reportId: report._id },
        priority: 'low'
      });
    });

    await Notification.insertMany(notifications);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask,
        status: 'completed'
      });
    }

    res.json({
      success: true,
      message: 'Pickup task completed successfully',
      data: pickupTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/tasks
// @desc    Get pickup tasks with filtering (alternative route for frontend compatibility)
// @access  Private
router.get('/tasks', [
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
    .isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
    .withMessage('Invalid status'),
  query('collectorId')
    .optional()
    .isMongoId()
    .withMessage('Invalid collector ID'),
  validate
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Collectors can only see their own tasks
    if (req.user.role === 'collector') {
      filter.collectorId = req.user._id;
    }

    // Residents can see tasks for their reports
    if (req.user.role === 'resident') {
      const userReports = await WasteReport.find({ userId: req.user._id }).select('_id');
      filter.reportId = { $in: userReports.map(r => r._id) };
    }

    // Apply query filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.collectorId) {
      filter.collectorId = req.query.collectorId;
    }

    // Get pickup tasks with pagination
    const pickupTasks = await PickupTask.find(filter)
      .populate('reportId', 'type description location priority estimatedVolume')
      .populate('collectorId', 'firstName lastName email phone')
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await PickupTask.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        pickupTasks,
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

// @route   GET /api/pickups/schedule/:collectorId
// @desc    Get collector's schedule for a date
// @access  Private (Admin/Collector)
router.get('/schedule/:collectorId', [
  authorize('admin', 'collector'),
  query('date')
    .isISO8601()
    .withMessage('Date is required'),
  validate
], async (req, res) => {
  try {
    const { collectorId } = req.params;
    const { date } = req.query;

    // Collectors can only view their own schedule
    if (req.user.role === 'collector' && collectorId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const pickupTasks = await PickupTask.find({
      collectorId,
      scheduledDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
      .populate('reportId', 'type description location priority estimatedVolume')
      .sort({ scheduledDate: 1 });

    const totalEstimatedDuration = pickupTasks.reduce((total, task) => total + task.estimatedDuration, 0);

    const schedule = {
      id: `schedule-${collectorId}-${date}`,
      collectorId,
      date,
      tasks: pickupTasks,
      totalEstimatedDuration,
      status: pickupTasks.length === 0 ? 'pending' : 
              pickupTasks.every(task => task.status === 'completed') ? 'completed' :
              pickupTasks.some(task => task.status === 'in_progress') ? 'in_progress' : 'pending'
    };

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/collector/:collectorId/schedule
// @desc    Get collector's schedule for a date range
// @access  Private (Admin/Collector)
router.get('/collector/:collectorId/schedule', [
  authorize('admin', 'collector'),
  query('startDate')
    .isISO8601()
    .withMessage('Start date is required'),
  query('endDate')
    .isISO8601()
    .withMessage('End date is required'),
  validate
], async (req, res) => {
  try {
    const { collectorId } = req.params;
    const { startDate, endDate } = req.query;

    // Collectors can only view their own schedule
    if (req.user.role === 'collector' && collectorId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const pickupTasks = await PickupTask.find({
      collectorId,
      scheduledDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('reportId', 'type description location priority estimatedVolume')
      .sort({ scheduledDate: 1 });

    res.json({
      success: true,
      data: { pickupTasks }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/collector/stats
// @desc    Get collector statistics
// @access  Private (Collector)
router.get('/collector/stats', [
  authorize('collector'),
  validate
], async (req, res) => {
  try {
    console.log('📊 Collector stats request from user:', req.user._id);
    
    // Validate user exists and has collector role
    if (!req.user || req.user.role !== 'collector') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Collector role required.'
      });
    }
    
    const collectorId = req.user._id;
    
    // Get all tasks for this collector with error handling
    let allTasks;
    try {
      allTasks = await PickupTask.find({ collectorId }).lean();
    } catch (taskError) {
      console.error('❌ Error fetching tasks for stats:', taskError);
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching tasks',
        error: process.env.NODE_ENV === 'development' ? taskError.message : undefined
      });
    }
    
    // Calculate statistics
    const stats = {
      total: allTasks.length,
      completed: allTasks.filter(task => task.status === 'completed').length,
      inProgress: allTasks.filter(task => task.status === 'in_progress').length,
      scheduled: allTasks.filter(task => task.status === 'scheduled').length,
      cancelled: allTasks.filter(task => task.status === 'cancelled').length,
    };
    
    // Calculate completion rate
    stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    
    // Get today's tasks with error handling
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let todayTasks;
    try {
      todayTasks = await PickupTask.find({
        collectorId,
        scheduledDate: {
          $gte: today,
          $lt: tomorrow
        }
      }).populate({
        path: 'reportId',
        select: 'type priority estimatedVolume',
        options: { strictPopulate: false }
      }).lean();
    } catch (todayError) {
      console.error('❌ Error fetching today tasks:', todayError);
      // Fallback without population
      todayTasks = await PickupTask.find({
        collectorId,
        scheduledDate: {
          $gte: today,
          $lt: tomorrow
        }
      }).lean();
    }
    
    stats.today = {
      total: todayTasks.length,
      completed: todayTasks.filter(task => task.status === 'completed').length,
      inProgress: todayTasks.filter(task => task.status === 'in_progress').length,
      scheduled: todayTasks.filter(task => task.status === 'scheduled').length,
      totalDuration: todayTasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0),
      highPriority: todayTasks.filter(task => task.reportId && task.reportId.priority === 'high').length
    };
    
    // Get this week's performance with error handling
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    let weekTasks;
    try {
      weekTasks = await PickupTask.find({
        collectorId,
        scheduledDate: {
          $gte: weekStart,
          $lt: new Date()
        }
      }).lean();
    } catch (weekError) {
      console.error('❌ Error fetching week tasks:', weekError);
      weekTasks = [];
    }
    
    stats.thisWeek = {
      total: weekTasks.length,
      completed: weekTasks.filter(task => task.status === 'completed').length,
      completionRate: weekTasks.length > 0 ? Math.round((weekTasks.filter(task => task.status === 'completed').length / weekTasks.length) * 100) : 0
    };
    
    // Add cache-busting headers to prevent 429 caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/pickups/collector/performance
// @desc    Get collector performance metrics
// @access  Private (Collector)
router.get('/collector/performance', [
  authorize('collector'),
  query('period')
    .optional()
    .isIn(['week', 'month', 'year'])
    .withMessage('Period must be week, month, or year'),
  validate
], async (req, res) => {
  try {
    const collectorId = req.user._id;
    const period = req.query.period || 'month';
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    // Get tasks in the period
    const tasks = await PickupTask.find({
      collectorId,
      createdAt: {
        $gte: startDate,
        $lte: now
      }
    }).populate('reportId', 'type priority estimatedVolume');
    
    // Calculate performance metrics
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedDuration, 0);
    const totalActualTime = completedTasks.reduce((sum, task) => {
      if (task.actualStartTime && task.actualEndTime) {
        return sum + (new Date(task.actualEndTime) - new Date(task.actualStartTime)) / (1000 * 60);
      }
      return sum;
    }, 0);
    
    const performance = {
      period,
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      averageCompletionTime: completedTasks.length > 0 ? Math.round(totalActualTime / completedTasks.length) : 0,
      efficiency: totalEstimatedTime > 0 ? Math.round((totalActualTime / totalEstimatedTime) * 100) : 0,
      tasksByPriority: {
        high: tasks.filter(task => task.reportId && task.reportId.priority === 'high').length,
        medium: tasks.filter(task => task.reportId && task.reportId.priority === 'medium').length,
        low: tasks.filter(task => task.reportId && task.reportId.priority === 'low').length
      },
      tasksByStatus: {
        completed: completedTasks.length,
        inProgress: tasks.filter(task => task.status === 'in_progress').length,
        scheduled: tasks.filter(task => task.status === 'scheduled').length,
        cancelled: tasks.filter(task => task.status === 'cancelled').length
      }
    };
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/pickups/tasks/:id/reschedule
// @desc    Reschedule a pickup task
// @access  Private (Admin/Collector)
router.post('/tasks/:id/reschedule', [
  authorize('admin', 'collector'),
  body('scheduledDate')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date <= now) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  validate
], async (req, res) => {
  try {
    const { scheduledDate, reason } = req.body;
    const taskId = req.params.id;
    
    const task = await PickupTask.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Collectors can only reschedule their own tasks
    if (req.user.role === 'collector' && task.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (task.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed task'
      });
    }
    
    // Update task
    task.scheduledDate = new Date(scheduledDate);
    task.status = 'rescheduled';
    if (reason) {
      task.notes = reason;
    }
    await task.save();
    
    // Update report status
    await WasteReport.findByIdAndUpdate(task.reportId, {
      scheduledPickupDate: new Date(scheduledDate)
    });
    
    // Create notifications
    const report = await WasteReport.findById(task.reportId);
    const notifications = [
      {
        userId: report.userId,
        type: 'pickup_rescheduled',
        title: 'Pickup Rescheduled',
        message: `Your pickup has been rescheduled to ${new Date(scheduledDate).toLocaleDateString()}${reason ? `: ${reason}` : ''}`,
        data: { pickupTaskId: task._id, reportId: report._id },
        priority: 'medium'
      }
    ];
    
    await Notification.insertMany(notifications);
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('task_update', {
        pickupTask: task,
        status: 'rescheduled'
      });
    }
    
    res.json({
      success: true,
      message: 'Task rescheduled successfully',
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/pickups/tasks/:id/update-location
// @desc    Update collector's current location for a task
// @access  Private (Collector)
router.post('/tasks/:id/update-location', [
  authorize('collector'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  validate
], async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const taskId = req.params.id;
    
    const task = await PickupTask.findById(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    if (task.collectorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update collector's location (you might want to store this in a separate collection)
    // For now, we'll just acknowledge the location update
    
    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    if (io) {
      io.emit('collector_location_update', {
        taskId,
        collectorId: req.user._id,
        location: { latitude, longitude },
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        taskId,
        location: { latitude, longitude },
        timestamp: new Date()
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

module.exports = router;
