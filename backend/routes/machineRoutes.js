const express = require('express');
const {
  getMachines,
  getMachine,
  createMachine,
  updateStatus,
  deleteMachine,
} = require('../controllers/machineController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getMachines);
router.get('/:id', getMachine);
router.post('/', adminOnly, createMachine);
router.patch('/:id/status', adminOnly, updateStatus);
router.delete('/:id', adminOnly, deleteMachine);

module.exports = router;
