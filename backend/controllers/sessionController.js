const Machine = require('../models/Machine');
const Session = require('../models/Session');

// POST /api/sessions/start
const startSession = async (req, res) => {
  try {
    const { machineId, durationSeconds, programme } = req.body;

    if (!machineId || !durationSeconds || !programme) {
      return res.status(400).json({
        success: false,
        message: 'machineId, durationSeconds, and programme are required',
      });
    }

    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    if (machine.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Machine is currently ${machine.status}`,
      });
    }

    const now = new Date();
    const expectedEndTime = new Date(now.getTime() + Number(durationSeconds) * 1000);

    const session = await Session.create({
      user: req.user._id,
      machine: machine._id,
      block: machine.block,
      machineType: machine.type,
      programme,
      durationSeconds: Number(durationSeconds),
      startTime: now,
      expectedEndTime,
    });

    machine.status = 'Washing';
    machine.currentUser = req.user._id;
    machine.currentSession = session._id;
    machine.currentUsageStart = now;
    machine.currentUsageEnd = expectedEndTime;
    machine.sessionDurationMinutes = Math.round(Number(durationSeconds) / 60);
    machine.programme = programme;
    await machine.save();

    const updatedMachine = await Machine.findById(machine._id).populate('currentUser', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Session started',
      data: updatedMachine,
      session,
      endsAt: expectedEndTime,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/sessions/machine/:machineId/complete
const completeSession = async (req, res) => {
  try {
    const { machineId } = req.params;
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    if (!machine.currentSession) {
      return res.status(400).json({ success: false, message: 'No active session for this machine' });
    }

    const session = await Session.findById(machine.currentSession);
    if (!session || session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Active session not found' });
    }

    const isOwner = session.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not allowed to complete this session' });
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    machine.status = 'Available';
    machine.currentUser = null;
    machine.currentSession = null;
    machine.currentUsageStart = null;
    machine.currentUsageEnd = null;
    machine.programme = null;
    await machine.save();

    const updatedMachine = await Machine.findById(machine._id).populate('currentUser', 'name email role');
    res.status(200).json({ success: true, message: 'Session completed', data: updatedMachine, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/history/me
const getMySessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.user._id, status: 'completed' })
      .populate('machine', 'name block type')
      .sort({ startTime: -1 });

    const history = sessions.map((s) => ({
      machineName: s.machine?.name || 'Unknown Machine',
      machineId: s.machine?._id || null,
      block: s.block,
      type: s.machineType,
      programme: s.programme,
      startTime: s.startTime,
      endTime: s.endTime || s.expectedEndTime,
      durationMinutes: Math.round(s.durationSeconds / 60),
    }));

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/sessions/active
const getActiveSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'active' })
      .populate('user', 'name email')
      .populate('machine', 'name block type status')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startSession,
  completeSession,
  getMySessionHistory,
  getActiveSessions,
};
