const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.com' },
    update: {},
    create: {
      email: 'admin@taskflow.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@taskflow.com' },
    update: {},
    create: {
      email: 'alice@taskflow.com',
      password: memberPassword,
      name: 'Alice Johnson',
      role: 'MEMBER',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@taskflow.com' },
    update: {},
    create: {
      email: 'bob@taskflow.com',
      password: memberPassword,
      name: 'Bob Smith',
      role: 'MEMBER',
    },
  });

  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design',
      status: 'ACTIVE',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App v2.0',
      description: 'New features and performance improvements for the mobile app',
      status: 'ACTIVE',
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create Figma mockup for the new homepage',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: alice.id,
        creatorId: admin.id,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Implement navigation component',
        description: 'Build responsive navigation with mobile menu',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: bob.id,
        creatorId: admin.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'SEO optimization',
        description: 'Optimize meta tags and page structure for SEO',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: alice.id,
        creatorId: admin.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Performance audit',
        description: 'Run Lighthouse and fix performance issues',
        status: 'TODO',
        priority: 'LOW',
        projectId: project1.id,
        creatorId: admin.id,
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Setup push notifications',
        description: 'Integrate Firebase Cloud Messaging',
        status: 'IN_REVIEW',
        priority: 'HIGH',
        projectId: project2.id,
        assigneeId: bob.id,
        creatorId: alice.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Dark mode implementation',
        description: 'Add system-aware dark mode to the app',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project2.id,
        assigneeId: alice.id,
        creatorId: alice.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('Seed completed successfully');
  console.log('Admin: admin@taskflow.com / admin123');
  console.log('Member: alice@taskflow.com / member123');
  console.log('Member: bob@taskflow.com / member123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
