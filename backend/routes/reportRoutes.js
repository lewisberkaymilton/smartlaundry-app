const express = require('express');
const {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus,
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createReport);
router.get('/me', getMyReports);
router.get('/', adminOnly, getAllReports);
router.patch('/:id/status', adminOnly, updateReportStatus);

module.exports = router;
