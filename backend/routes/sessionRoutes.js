const express = require('express');
const {
  startSession,
  completeSession,
  getMySessionHistory,
  getActiveSessions,
} = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/start', startSession);
router.patch('/machine/:machineId/complete', completeSession);
router.get('/history/me', getMySessionHistory);
router.get('/active', adminOnly, getActiveSessions);

module.exports = router;
