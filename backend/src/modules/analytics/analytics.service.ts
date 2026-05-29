import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AnalyticsService {
  async getOverview(organizationId: string) {
    // 1. Task status distribution
    const statusDistribution = await prisma.task.groupBy({
      by: ['status'],
      where: { project: { organizationId } },
      _count: true,
    });

    // 2. Priority distribution
    const priorityDistribution = await prisma.task.groupBy({
      by: ['priority'],
      where: { project: { organizationId } },
      _count: true,
    });

    // 3. Overdue tasks per user (raw SQL with window functions)
    const overdueByUser = await prisma.$queryRaw<
      Array<{
        user_id: string;
        user_name: string;
        user_email: string;
        overdue_count: bigint;
        total_assigned: bigint;
        overdue_percentage: number;
      }>
    >`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('DONE') THEN 1 END) as overdue_count,
        COUNT(t.id) as total_assigned,
        ROUND(
          COUNT(CASE WHEN t.due_date < NOW() AND t.status NOT IN ('DONE') THEN 1 END)::numeric * 100 / 
          NULLIF(COUNT(t.id), 0),
          2
        ) as overdue_percentage
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE u.organization_id = ${organizationId}
        AND (p.organization_id = ${organizationId} OR p.id IS NULL)
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(t.id) > 0
      ORDER BY overdue_count DESC
    `;

    // 4. Average completion time (using window functions)
    const avgCompletionTime = await prisma.$queryRaw<
      Array<{
        avg_hours: number;
        median_hours: number;
        min_hours: number;
        max_hours: number;
        total_completed: bigint;
      }>
    >`
      WITH completed_tasks AS (
        SELECT 
          t.id,
          t.created_at,
          t.completed_at,
          EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 3600 as completion_hours,
          ROW_NUMBER() OVER (ORDER BY EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) as rn,
          COUNT(*) OVER () as total
        FROM tasks t
        JOIN projects p ON t.project_id = p.id
        WHERE p.organization_id = ${organizationId}
          AND t.status = 'DONE'
          AND t.completed_at IS NOT NULL
      )
      SELECT 
        ROUND(AVG(completion_hours)::numeric, 2) as avg_hours,
        ROUND(
          (SELECT completion_hours FROM completed_tasks WHERE rn = CEIL(total::float / 2) LIMIT 1)::numeric,
          2
        ) as median_hours,
        ROUND(MIN(completion_hours)::numeric, 2) as min_hours,
        ROUND(MAX(completion_hours)::numeric, 2) as max_hours,
        COUNT(*) as total_completed
      FROM completed_tasks
    `;

    // 5. Tasks created per day (last 30 days)
    const tasksPerDay = await prisma.$queryRaw<
      Array<{ date: string; count: bigint }>
    >`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as count
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE p.organization_id = ${organizationId}
        AND t.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `;

    // 6. Top performers — users who complete the most tasks
    const topPerformers = await prisma.$queryRaw<
      Array<{
        user_id: string;
        user_name: string;
        completed_count: bigint;
        avg_completion_hours: number;
        rank: bigint;
      }>
    >`
      SELECT 
        u.id as user_id,
        u.name as user_name,
        COUNT(t.id) as completed_count,
        ROUND(
          AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 3600)::numeric,
          2
        ) as avg_completion_hours,
        RANK() OVER (ORDER BY COUNT(t.id) DESC) as rank
      FROM users u
      JOIN tasks t ON t.assignee_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE u.organization_id = ${organizationId}
        AND t.status = 'DONE'
        AND t.completed_at IS NOT NULL
      GROUP BY u.id, u.name
      ORDER BY completed_count DESC
      LIMIT 10
    `;

    // 7. Project summary
    const projectSummary = await prisma.$queryRaw<
      Array<{
        project_id: string;
        project_name: string;
        total_tasks: bigint;
        completed_tasks: bigint;
        in_progress_tasks: bigint;
        blocked_tasks: bigint;
        completion_rate: number;
      }>
    >`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        COUNT(t.id) as total_tasks,
        COUNT(CASE WHEN t.status = 'DONE' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN t.status = 'IN_PROGRESS' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN t.status = 'BLOCKED' THEN 1 END) as blocked_tasks,
        ROUND(
          COUNT(CASE WHEN t.status = 'DONE' THEN 1 END)::numeric * 100 / NULLIF(COUNT(t.id), 0),
          2
        ) as completion_rate
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      WHERE p.organization_id = ${organizationId}
      GROUP BY p.id, p.name
      ORDER BY total_tasks DESC
    `;

    // Serialize BigInt values
    const serializeResult = (arr: any[]) =>
      arr.map((item) => {
        const obj: any = {};
        for (const [key, value] of Object.entries(item)) {
          obj[key] = typeof value === 'bigint' ? Number(value) : value;
        }
        return obj;
      });

    logger.info(`Analytics overview generated for org ${organizationId}`);

    return {
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      priorityDistribution: priorityDistribution.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      overdueByUser: serializeResult(overdueByUser),
      completionMetrics: avgCompletionTime.length > 0
        ? {
            avgHours: avgCompletionTime[0].avg_hours || 0,
            medianHours: avgCompletionTime[0].median_hours || 0,
            minHours: avgCompletionTime[0].min_hours || 0,
            maxHours: avgCompletionTime[0].max_hours || 0,
            totalCompleted: Number(avgCompletionTime[0].total_completed || 0),
          }
        : {
            avgHours: 0,
            medianHours: 0,
            minHours: 0,
            maxHours: 0,
            totalCompleted: 0,
          },
      tasksPerDay: serializeResult(tasksPerDay),
      topPerformers: serializeResult(topPerformers),
      projectSummary: serializeResult(projectSummary),
    };
  }
}

export const analyticsService = new AnalyticsService();
