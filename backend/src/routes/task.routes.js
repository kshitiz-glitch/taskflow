const router = require('express').Router();
const { body } = require('express-validator');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  deleteComment,
} = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', getTasks);
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  body('projectId').notEmpty().withMessage('Project ID required'),
  body('assigneeId').optional({ nullable: true }),
  validate,
], createTask);

router.get('/:id', getTaskById);
router.put('/:id', [
  body('title').optional().trim().notEmpty().isLength({ max: 200 }),
  body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  body('dueDate').optional({ nullable: true }).isISO8601(),
  validate,
], updateTask);

router.patch('/:id/status', [
  body('status').isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).withMessage('Invalid status'),
  validate,
], updateTaskStatus);

router.delete('/:id', deleteTask);

router.post('/:id/comments', [
  body('content').trim().notEmpty().withMessage('Comment content required'),
  validate,
], addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
