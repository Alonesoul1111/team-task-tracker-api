import { prisma } from '../../config/database';
import { Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { CreateProjectInput, UpdateProjectInput } from './projects.validation';
import { Prisma } from '@prisma/client';

export class ProjectsService {
  async create(input: CreateProjectInput, organizationId: string) {
    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        organizationId,
      },
      include: { _count: { select: { tasks: true } } },
    });

    logger.info(`Project created: ${project.name} in org ${organizationId}`);
    return project;
  }

  async list(
    organizationId: string,
    params: { page: number; limit: number; search?: string }
  ) {
    const where: Prisma.ProjectWhereInput = {
      organizationId,
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          _count: { select: { tasks: true } },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  async getById(projectId: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            assignee: { select: { id: true, name: true, email: true } },
          },
          take: 10,
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!project) {
      throw Errors.NOT_FOUND('Project');
    }

    return project;
  }

  async update(projectId: string, input: UpdateProjectInput, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw Errors.NOT_FOUND('Project');
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: input,
      include: { _count: { select: { tasks: true } } },
    });

    logger.info(`Project updated: ${updated.name}`);
    return updated;
  }

  async delete(projectId: string, organizationId: string) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw Errors.NOT_FOUND('Project');
    }

    await prisma.project.delete({ where: { id: projectId } });
    logger.info(`Project deleted: ${project.name}`);
  }
}

export const projectsService = new ProjectsService();
