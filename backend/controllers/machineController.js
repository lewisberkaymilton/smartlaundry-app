const Machine = require('../models/Machine');

// GET /api/machines
const getMachines = async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate('currentUser', 'name email role')
      .populate('currentSession');
    res.status(200).json({ success: true, data: machines });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/machines/:id
const getMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('currentUser', 'name email role')
      .populate('currentSession');
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/machines (admin)
const createMachine = async (req, res) => {
  try {
    const { name, block, type, sessionDurationMinutes = 45, status = 'Available' } = req.body;
    const machine = await Machine.create({ name, block, type, status, sessionDurationMinutes });
    res.status(201).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/machines/:id/status (admin)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Washing', 'Out of Order'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }

    if (machine.currentSession && status !== 'Washing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually change status while a live session is attached',
      });
    }

    machine.status = status;
    await machine.save();
    res.status(200).json({ success: true, data: machine });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/machines/:id (admin)
const deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ success: false, message: 'Machine not found' });
    }
    if (machine.currentSession) {
      return res.status(400).json({ success: false, message: 'Cannot delete a machine with an active session' });
    }
    await machine.deleteOne();
    res.status(200).json({ success: true, message: 'Machine deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMachines,
  getMachine,
  createMachine,
  updateStatus,
  deleteMachine,
};
