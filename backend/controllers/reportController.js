const Report = require('../models/Report');
const Machine = require('../models/Machine');
const { logAuditEvent } = require('../utils/auditLogger');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { machineId, title, description, severity = 'medium' } = req.body;
    if (!machineId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'machineId, title, and description are required',
      });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    const report = await Report.create({
      machine: machineId,
      reportedBy: req.user._id,
      title,
      description,
      severity,
    });

    const populated = await Report.findById(report._id)
      .populate('machine', 'name block type')
      .populate('reportedBy', 'name email');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/me
const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id })
      .populate('machine', 'name block type')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports (admin)
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('machine', 'name block type')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/reports/:id/status (admin)
const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid report status' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = status;
    if (status === 'resolved') {
      report.resolvedAt = new Date();
      report.resolvedBy = req.user._id;
    } else {
      report.resolvedAt = null;
      report.resolvedBy = null;
    }

    await report.save();
    await logAuditEvent({
      req,
      action: 'REPORT_STATUS_UPDATED',
      entityType: 'Report',
      entityId: report._id,
      metadata: { status },
    });
    const populated = await Report.findById(report._id)
      .populate('machine', 'name block type')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus,
};
