const router = require('express').Router();
const { getStats, getActivityFeed } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/stats', getStats);
router.get('/activity', getActivityFeed);

module.exports = router;
