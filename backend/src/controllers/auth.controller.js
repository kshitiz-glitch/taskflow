const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return sendError(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    return sendSuccess(res, { user, token }, 'Account created successfully', 201);
  } catch (error) {
    return sendError(res, 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;

    return sendSuccess(res, { user: userWithoutPassword, token }, 'Login successful');
  } catch (error) {
    return sendError(res, 'Login failed', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            ownedProjects: true,
            assignedTasks: true,
          },
        },
      },
    });
    return sendSuccess(res, user);
  } catch (error) {
    return sendError(res, 'Failed to fetch profile', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, avatar },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });
    return sendSuccess(res, user, 'Profile updated');
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500);
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    return sendError(res, 'Failed to change password', 500);
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
