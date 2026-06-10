const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const { getAdminInsights } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, adminOnly);
router.get('/insights', getAdminInsights);

module.exports = router;
