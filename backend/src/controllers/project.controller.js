const { PrismaClient } = require('@prisma/client');
const { sendSuccess, sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const projectSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, email: true, avatar: true } },
  members: {
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  },
  _count: { select: { tasks: true, members: true } },
};

const getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = req.user.role === 'ADMIN'
      ? {}
      : { members: { some: { userId: req.user.id } } };

    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const projects = await prisma.project.findMany({
      where,
      select: projectSelect,
      orderBy: { updatedAt: 'desc' },
    });

    return sendSuccess(res, projects);
  } catch (error) {
    return sendError(res, 'Failed to fetch projects', 500);
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      select: {
        ...projectSelect,
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            dueDate: true,
            createdAt: true,
            assignee: { select: { id: true, name: true, avatar: true } },
            creator: { select: { id: true, name: true } },
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return sendError(res, 'Project not found', 404);

    if (req.user.role !== 'ADMIN') {
      const isMember = project.members.some((m) => m.userId === req.user.id);
      if (!isMember) return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, project);
  } catch (error) {
    return sendError(res, 'Failed to fetch project', 500);
  }
};

const createProject = async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || 'ACTIVE',
        deadline: deadline ? new Date(deadline) : null,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      select: projectSelect,
    });

    return sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to create project', 500);
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, status, deadline } = req.body;

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Project not found', 404);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
      select: projectSelect,
    });

    return sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    return sendError(res, 'Failed to update project', 500);
  }
};

const deleteProject = async (req, res) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendError(res, 'Project not found', 404);

    if (existing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Only project owner can delete', 403);
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Project deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete project', 500);
  }
};

const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const projectId = req.params.id;

    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) return sendError(res, 'User not found', 404);

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (existing) return sendError(res, 'User is already a member', 409);

    const member = await prisma.projectMember.create({
      data: { projectId, userId, role: role || 'MEMBER' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return sendSuccess(res, member, 'Member added successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to add member', 500);
  }
};

const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return sendError(res, 'Project not found', 404);

    if (project.ownerId === userId) {
      return sendError(res, 'Cannot remove project owner', 400);
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    return sendSuccess(res, null, 'Member removed successfully');
  } catch (error) {
    return sendError(res, 'Failed to remove member', 500);
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    return sendSuccess(res, member, 'Member role updated');
  } catch (error) {
    return sendError(res, 'Failed to update member role', 500);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
};
