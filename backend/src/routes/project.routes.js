const router = require('express').Router();
const { body, param } = require('express-validator');
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireProjectAdmin, requireProjectMember } = require('../middleware/projectRole.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', getProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  body('deadline').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
  validate,
], createProject);

router.get('/:id', getProjectById);
router.put('/:id', requireProjectAdmin, [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('status').optional().isIn(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
  validate,
], updateProject);
router.delete('/:id', requireProjectMember, deleteProject);

router.post('/:id/members', requireProjectAdmin, [
  body('userId').notEmpty().withMessage('User ID required'),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
  validate,
], addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);
router.patch('/:id/members/:userId/role', requireProjectAdmin, [
  body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
  validate,
], updateMemberRole);

module.exports = router;
