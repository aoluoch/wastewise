const User = require('../models/User');
const WasteReport = require('../models/WasteReport');
const PickupTask = require('../models/PickupTask');

// Dashboard statistics for different user roles
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let stats = {};

    switch (userRole) {
      case 'admin':
        stats = await getAdminStats();
        break;
      case 'collector':
        stats = await getCollectorStats(userId);
        break;
      case 'resident':
        stats = await getResidentStats(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid user role'
        });
    }

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
};

// Admin dashboard statistics
const getAdminStats = async () => {
  const [
    totalUsers,
    activeUsers,
    totalReports,
    pendingReports,
    completedReports,
    totalPickups,
    completedPickups,
    recentReports,
    recentPickups
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    WasteReport.countDocuments(),
    WasteReport.countDocuments({ status: 'pending' }),
    WasteReport.countDocuments({ status: 'completed' }),
    PickupTask.countDocuments(),
    PickupTask.countDocuments({ status: 'completed' }),
    WasteReport.find()
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5),
    PickupTask.find()
      .populate('reportId', 'type description')
      .populate('collectorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 }
      }
    }
  ]);

  const reportStats = await WasteReport.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const pickupStats = await PickupTask.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    overview: {
      totalUsers,
      activeUsers,
      totalReports,
      pendingReports,
      completedReports,
      totalPickups,
      completedPickups
    },
    userStats,
    reportStats,
    pickupStats,
    recent: {
      reports: recentReports,
      pickups: recentPickups
    }
  };
};

// Collector dashboard statistics
const getCollectorStats = async (userId) => {
  const [
    assignedTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    todayTasks,
    upcomingTasks
  ] = await Promise.all([
    PickupTask.countDocuments({ collectorId: userId }),
    PickupTask.countDocuments({ collectorId: userId, status: 'completed' }),
    PickupTask.countDocuments({ collectorId: userId, status: 'scheduled' }),
    PickupTask.countDocuments({ collectorId: userId, status: 'in_progress' }),
    PickupTask.find({
      collectorId: userId,
      scheduledDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }).populate('reportId', 'type description location priority'),
    PickupTask.find({
      collectorId: userId,
      scheduledDate: { $gt: new Date() },
      status: 'scheduled'
    })
      .populate('reportId', 'type description location priority')
      .sort({ scheduledDate: 1 })
      .limit(5)
  ]);

  return {
    overview: {
      assignedTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks
    },
    todayTasks,
    upcomingTasks
  };
};

// Resident dashboard statistics
const getResidentStats = async (userId) => {
  const [
    totalReports,
    pendingReports,
    completedReports,
    recentReports,
    upcomingPickups
  ] = await Promise.all([
    WasteReport.countDocuments({ userId }),
    WasteReport.countDocuments({ userId, status: 'pending' }),
    WasteReport.countDocuments({ userId, status: 'completed' }),
    WasteReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5),
    PickupTask.find({
      'reportId': { $in: await WasteReport.find({ userId }).distinct('_id') },
      scheduledDate: { $gt: new Date() },
      status: 'scheduled'
    })
      .populate('reportId', 'type description')
      .populate('collectorId', 'firstName lastName')
      .sort({ scheduledDate: 1 })
      .limit(3)
  ]);

  return {
    overview: {
      totalReports,
      pendingReports,
      completedReports
    },
    recentReports,
    upcomingPickups
  };
};

// Analytics data for admin
const getAnalytics = async (req, res) => {
  try {
    const { period = '30d', type = 'reports' } = req.query;

    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    let analytics = {};

    if (type === 'reports') {
      analytics = await getReportAnalytics(dateFilter);
    } else if (type === 'pickups') {
      analytics = await getPickupAnalytics(dateFilter);
    } else if (type === 'users') {
      analytics = await getUserAnalytics(dateFilter);
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Report analytics
const getReportAnalytics = async (dateFilter) => {
  const [
    totalReports,
    reportsByType,
    reportsByStatus,
    reportsByPriority,
    dailyReports,
    topAreas
  ] = await Promise.all([
    WasteReport.countDocuments({ createdAt: dateFilter }),
    WasteReport.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    WasteReport.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    WasteReport.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    WasteReport.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]),
    WasteReport.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: '$location.address',
          count: { $sum: 1 },
          coordinates: { $first: '$location.coordinates' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  return {
    totalReports,
    reportsByType,
    reportsByStatus,
    reportsByPriority,
    dailyReports,
    topAreas
  };
};

// Pickup analytics
const getPickupAnalytics = async (dateFilter) => {
  const [
    totalPickups,
    pickupsByStatus,
    averageCompletionTime,
    collectorPerformance,
    dailyPickups
  ] = await Promise.all([
    PickupTask.countDocuments({ createdAt: dateFilter }),
    PickupTask.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    PickupTask.aggregate([
      { $match: { createdAt: dateFilter, status: 'completed' } },
      {
        $addFields: {
          duration: { $subtract: ['$actualEndTime', '$actualStartTime'] }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]),
    PickupTask.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: '$collectorId',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'collector'
        }
      },
      {
        $unwind: '$collector'
      },
      {
        $addFields: {
          completionRate: {
            $multiply: [
              { $divide: ['$completedTasks', '$totalTasks'] },
              100
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]),
    PickupTask.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ]);

  return {
    totalPickups,
    pickupsByStatus,
    averageCompletionTime: averageCompletionTime[0]?.avgDuration || 0,
    collectorPerformance,
    dailyPickups
  };
};

// User analytics
const getUserAnalytics = async (dateFilter) => {
  const [
    totalUsers,
    usersByRole,
    activeUsers,
    newUsers,
    userGrowth
  ] = await Promise.all([
    User.countDocuments({ createdAt: dateFilter }),
    User.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    User.countDocuments({ isActive: true, createdAt: dateFilter }),
    User.countDocuments({ createdAt: dateFilter }),
    User.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ])
  ]);

  return {
    totalUsers,
    usersByRole,
    activeUsers,
    newUsers,
    userGrowth
  };
};

module.exports = {
  getDashboardStats,
  getAnalytics
};
