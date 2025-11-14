const express = require('express');
const WasteReport = require('../models/WasteReport');
const { authMiddleware, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// @route   GET /api/statistics/resident
// @desc    Get resident statistics
// @access  Private (resident only)
router.get('/resident', [
  authorize('resident'),
  validate
], async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all reports by this resident
    const allReports = await WasteReport.find({ userId });
    
    // Get reports by status
    const reportsByStatus = await WasteReport.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get reports by type
    const reportsByType = await WasteReport.aggregate([
      { $match: { userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get reports by priority
    const reportsByPriority = await WasteReport.aggregate([
      { $match: { userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Get reports created in last 30 days (for trend)
    const reportsLast30Days = await WasteReport.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Get reports created in last 7 days
    const reportsLast7Days = await WasteReport.find({
      userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get recent reports (last 5) for dashboard
    const recentReports = await WasteReport.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type description status createdAt updatedAt');

    console.log('Recent reports for user', userId, ':', recentReports.length, 'reports found');

    // Calculate daily reports for last 30 days
    const dailyReports = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const count = reportsLast30Days.filter(report => 
        report.createdAt >= startOfDay && report.createdAt < endOfDay
      ).length;
      
      dailyReports.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      });
    }

    // Calculate completion rate
    const totalReports = allReports.length;
    const completedReports = allReports.filter(r => r.status === 'completed').length;
    const completionRate = totalReports > 0 ? (completedReports / totalReports) * 100 : 0;

    // Calculate average response time (from creation to assignment)
    const assignedReports = allReports.filter(r => r.status !== 'pending' && r.assignedCollectorId);
    const avgResponseTime = assignedReports.length > 0 
      ? assignedReports.reduce((sum, report) => {
          const responseTime = new Date(report.updatedAt) - new Date(report.createdAt);
          return sum + responseTime;
        }, 0) / assignedReports.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Get waste volume by type
    const volumeByType = await WasteReport.aggregate([
      { $match: { userId } },
      { $group: { 
        _id: '$type', 
        totalVolume: { $sum: '$estimatedVolume' },
        count: { $sum: 1 }
      }},
      { $sort: { totalVolume: -1 } }
    ]);

    // Get monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthReports = await WasteReport.find({
        userId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      monthlyTrends.push({
        month: monthStart.toISOString().substring(0, 7),
        count: monthReports.length,
        volume: monthReports.reduce((sum, r) => sum + r.estimatedVolume, 0)
      });
    }

    res.json({
      success: true,
      data: {
        overview: {
          totalReports,
          completedReports,
          pendingReports: allReports.filter(r => r.status === 'pending').length,
          completionRate: Math.round(completionRate * 100) / 100,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          reportsLast7Days: reportsLast7Days.length
        },
        recentReports,
        charts: {
          reportsByStatus: reportsByStatus.map(item => ({
            status: item._id,
            count: item.count
          })),
          reportsByType: reportsByType.map(item => ({
            type: item._id,
            count: item.count
          })),
          reportsByPriority: reportsByPriority.map(item => ({
            priority: item._id,
            count: item.count
          })),
          dailyTrend: dailyReports,
          monthlyTrend: monthlyTrends,
          volumeByType: volumeByType.map(item => ({
            type: item._id,
            volume: Math.round(item.totalVolume * 100) / 100,
            count: item.count
          }))
        }
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
