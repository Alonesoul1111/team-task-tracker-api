import { PrismaClient, Role, TaskPriority, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Create organization
  const org = await prisma.organization.create({
    data: { name: 'Acme Corporation' },
  });

  console.log(`✅ Created organization: ${org.name}`);

  // Create users
  const hashedPassword = await bcrypt.hash('Password123', 12);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme.com',
      password: hashedPassword,
      name: 'Alice Admin',
      role: Role.ADMIN,
      organizationId: org.id,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@acme.com',
      password: hashedPassword,
      name: 'Bob Manager',
      role: Role.MANAGER,
      organizationId: org.id,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'member1@acme.com',
      password: hashedPassword,
      name: 'Charlie Member',
      role: Role.MEMBER,
      organizationId: org.id,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'member2@acme.com',
      password: hashedPassword,
      name: 'Diana Member',
      role: Role.MEMBER,
      organizationId: org.id,
    },
  });

  console.log('✅ Created users: admin, manager, member1, member2');
  console.log('   All passwords: Password123');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design',
      organizationId: org.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App v2',
      description: 'Next generation mobile application',
      organizationId: org.id,
    },
  });

  console.log('✅ Created projects');

  // Create tasks with various statuses and assignments
  const tasks = [
    {
      title: 'Design new homepage layout',
      description: 'Create wireframes and mockups for the new homepage',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      assigneeId: member1.id,
      creatorId: manager.id,
      projectId: project1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Implement authentication flow',
      description: 'Build login/register pages with JWT integration',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      assigneeId: member2.id,
      creatorId: manager.id,
      projectId: project1.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.DONE,
      assigneeId: member1.id,
      creatorId: admin.id,
      projectId: project1.id,
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST endpoints with examples',
      priority: TaskPriority.LOW,
      status: TaskStatus.IN_REVIEW,
      assigneeId: member2.id,
      creatorId: manager.id,
      projectId: project1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Fix navigation bug on mobile',
      description: 'Menu dropdown not closing on route change',
      priority: TaskPriority.HIGH,
      status: TaskStatus.BLOCKED,
      assigneeId: member1.id,
      creatorId: manager.id,
      projectId: project2.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // overdue
    },
    {
      title: 'Implement push notifications',
      description: 'Add Firebase Cloud Messaging for push notifications',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assigneeId: member2.id,
      creatorId: admin.id,
      projectId: project2.id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Database optimization',
      description: 'Optimize slow queries and add missing indexes',
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      assigneeId: member1.id,
      creatorId: manager.id,
      projectId: project2.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'User profile settings page',
      description: 'Allow users to update their profile information',
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
      assigneeId: null,
      creatorId: manager.id,
      projectId: project2.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log(`✅ Created ${tasks.length} tasks`);
  console.log('\n🎉 Seed complete!');
  console.log('\nTest accounts:');
  console.log('  Admin:   admin@acme.com / Password123');
  console.log('  Manager: manager@acme.com / Password123');
  console.log('  Member:  member1@acme.com / Password123');
  console.log('  Member:  member2@acme.com / Password123');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
