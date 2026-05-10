const router = require('express').Router();
const { getAllUsers, getUserById, searchUsers } = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', requireAdmin, getAllUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserById);

module.exports = router;
