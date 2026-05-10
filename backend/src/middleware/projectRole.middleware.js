const { PrismaClient } = require('@prisma/client');
const { sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) {
      return sendError(res, 'Not a member of this project', 403);
    }

    if (membership.role !== 'ADMIN') {
      return sendError(res, 'Project admin access required', 403);
    }

    req.membership = membership;
    next();
  } catch (error) {
    return sendError(res, 'Authorization check failed', 500);
  }
};

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    if (req.user.role === 'ADMIN') return next();

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) {
      return sendError(res, 'Not a member of this project', 403);
    }

    req.membership = membership;
    next();
  } catch (error) {
    return sendError(res, 'Authorization check failed', 500);
  }
};

module.exports = { requireProjectAdmin, requireProjectMember };
