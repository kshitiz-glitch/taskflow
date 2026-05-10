const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const projectWhere = isAdmin ? {} : { members: { some: { userId } } };
    const taskWhere = isAdmin ? {} : { project: { members: { some: { userId } } } };

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus,
      overdueTasks,
      myTasks,
      recentTasks,
      upcomingDeadlines,
    ] = await Promise.all([
      prisma.project.count({ where: projectWhere }),
      prisma.project.count({ where: { ...projectWhere, status: 'ACTIVE' } }),
      prisma.task.count({ where: taskWhere }),
      prisma.task.groupBy({
        by: ['status'],
        where: taskWhere,
        _count: true,
      }),
      prisma.task.count({
        where: {
          ...taskWhere,
          dueDate: { lt: new Date() },
          status: { not: 'DONE' },
        },
      }),
      prisma.task.count({
        where: { assigneeId: userId, status: { not: 'DONE' } },
      }),
      prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.project.findMany({
        where: {
          ...projectWhere,
          deadline: { gte: new Date() },
          status: { not: 'COMPLETED' },
        },
        select: {
          id: true,
          name: true,
          deadline: true,
          status: true,
          _count: { select: { tasks: true } },
        },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
    ]);

    const statusMap = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach((s) => { statusMap[s.status] = s._count; });

    const completedTasks = statusMap.DONE;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return sendSuccess(res, {
      overview: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        myTasks,
        completionRate,
      },
      tasksByStatus: statusMap,
      recentTasks,
      upcomingDeadlines,
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch dashboard stats', 500);
  }
};

const getActivityFeed = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const taskWhere = isAdmin ? {} : { project: { members: { some: { userId: req.user.id } } } };

    const recentUpdates = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return sendSuccess(res, recentUpdates);
  } catch (error) {
    return sendError(res, 'Failed to fetch activity', 500);
  }
};

module.exports = { getStats, getActivityFeed };
