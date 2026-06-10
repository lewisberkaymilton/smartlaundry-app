const Machine = require('../models/Machine');
const Session = require('../models/Session');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');

const getAdminInsights = async (req, res) => {
  try {
    const [machines, reports, activeSessionsCount, completedSessionsCount, avgDurationResult, peakHourResult, weeklySessions, recentAuditLogs] =
      await Promise.all([
        Machine.find().select('status type block'),
        Report.find().select('status severity createdAt'),
        Session.countDocuments({ status: 'active' }),
        Session.countDocuments({ status: 'completed' }),
        Session.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, avgDurationSeconds: { $avg: '$durationSeconds' } } },
        ]),
        Session.aggregate([
          { $match: { status: 'completed' } },
          { $project: { hour: { $hour: '$startTime' } } },
          { $group: { _id: '$hour', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ]),
        Session.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        AuditLog.find()
          .populate('actor', 'name email role')
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    const machineStatusCounts = machines.reduce(
      (acc, machine) => {
        acc[machine.status] = (acc[machine.status] || 0) + 1;
        return acc;
      },
      { Available: 0, Washing: 0, 'Out of Order': 0 }
    );

    const machineTypeCounts = machines.reduce(
      (acc, machine) => {
        acc[machine.type] = (acc[machine.type] || 0) + 1;
        return acc;
      },
      { Washer: 0, Dryer: 0 }
    );

    const reportStatusCounts = reports.reduce(
      (acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1;
        return acc;
      },
      { open: 0, in_progress: 0, resolved: 0 }
    );

    const averageSessionMinutes = avgDurationResult[0]?.avgDurationSeconds
      ? Math.round(avgDurationResult[0].avgDurationSeconds / 60)
      : 0;

    const peakHour = typeof peakHourResult[0]?._id === 'number'
      ? `${String(peakHourResult[0]._id).padStart(2, '0')}:00`
      : 'N/A';

    res.status(200).json({
      success: true,
      data: {
        totals: {
          machines: machines.length,
          activeSessions: activeSessionsCount,
          completedSessions: completedSessionsCount,
          reports: reports.length,
        },
        machineStatusCounts,
        machineTypeCounts,
        reportStatusCounts,
        averageSessionMinutes,
        peakHour,
        weeklySessions,
        recentAuditLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminInsights };
