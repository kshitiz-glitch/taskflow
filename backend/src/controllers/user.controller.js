const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: { assignedTasks: true, ownedProjects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, users);
  } catch (error) {
    return sendError(res, 'Failed to fetch users', 500);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: { select: { assignedTasks: true, ownedProjects: true } },
      },
    });
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch user', 500);
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return sendSuccess(res, []);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, avatar: true, role: true },
      take: 10,
    });
    return sendSuccess(res, users);
  } catch (error) {
    return sendError(res, 'Search failed', 500);
  }
};

module.exports = { getAllUsers, getUserById, searchUsers };
