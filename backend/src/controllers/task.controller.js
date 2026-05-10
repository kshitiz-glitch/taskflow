const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const taskSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true, avatar: true } },
  creator: { select: { id: true, name: true, avatar: true } },
  comments: {
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { comments: true } },
};

const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId, overdue, search } = req.query;

    const where = {};

    if (req.user.role !== 'ADMIN') {
      where.project = { members: { some: { userId: req.user.id } } };
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'DONE' };
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });

    return sendSuccess(res, tasks);
  } catch (error) {
    return sendError(res, 'Failed to fetch tasks', 500);
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: taskSelect,
    });

    if (!task) return sendError(res, 'Task not found', 404);

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.project.id, userId: req.user.id } },
      });
      if (!membership) return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, task);
  } catch (error) {
    return sendError(res, 'Failed to fetch task', 500);
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId, projectId } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, 'Project not found', 404);

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: req.user.id } },
      });
      if (!membership) return sendError(res, 'Not a project member', 403);
    }

    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!assigneeMembership) return sendError(res, 'Assignee is not a project member', 400);
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.id,
      },
      select: taskSelect,
    });

    return sendSuccess(res, task, 'Task created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create task', 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const existing = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!existing) return sendError(res, 'Task not found', 404);

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
      });
      if (!membership) return sendError(res, 'Access denied', 403);
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      select: taskSelect,
    });

    return sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update task', 500);
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Task not found', 404);

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
      });
      if (!membership) return sendError(res, 'Access denied', 403);
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      select: taskSelect,
    });

    return sendSuccess(res, task, 'Status updated');
  } catch (error) {
    return sendError(res, 'Failed to update status', 500);
  }
};

const deleteTask = async (req, res) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Task not found', 404);

    if (req.user.role !== 'ADMIN') {
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
      });
      if (!membership || (membership.role !== 'ADMIN' && existing.creatorId !== req.user.id)) {
        return sendError(res, 'Access denied', 403);
      }
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Task deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete task', 500);
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return sendError(res, 'Task not found', 404);

    const comment = await prisma.comment.create({
      data: { content, taskId: req.params.id, userId: req.user.id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return sendSuccess(res, comment, 'Comment added', 201);
  } catch (error) {
    return sendError(res, 'Failed to add comment', 500);
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
    if (!comment) return sendError(res, 'Comment not found', 404);
    if (comment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Access denied', 403);
    }
    await prisma.comment.delete({ where: { id: req.params.commentId } });
    return sendSuccess(res, null, 'Comment deleted');
  } catch (error) {
    return sendError(res, 'Failed to delete comment', 500);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  addComment,
  deleteComment,
};
