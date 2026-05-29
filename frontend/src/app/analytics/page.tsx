'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAnalytics } from '@/hooks/use-data';
import { 
  Clock, 
  AlertOctagon, 
  CheckCircle,
  Medal,
  Activity,
  Layers
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalytics();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-title">Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-[0.875rem]">Aggregated task metrics and performance graphs.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-[0.875rem]">Loading analytics...</div>
      ) : !analytics ? (
        <div className="card p-12 text-center text-[var(--text-muted)] text-[0.875rem]">
          No analytics data available.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Avg Completion</span>
                <Clock className="h-4 w-4 text-[var(--brand)]" />
              </div>
              <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-none">{analytics.completionMetrics.avgHours}h</div>
              <p className="text-[var(--text-muted)] text-[0.6875rem] mt-1.5">Average resolution hours</p>
            </div>

            <div className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Median Completion</span>
                <Clock className="h-4 w-4 text-[#A855F7]" />
              </div>
              <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-none">{analytics.completionMetrics.medianHours}h</div>
              <p className="text-[var(--text-muted)] text-[0.6875rem] mt-1.5">Median completion hours</p>
            </div>

            <div className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Resolved Tasks</span>
                <CheckCircle className="h-4 w-4 text-[#22C55E]" />
              </div>
              <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-none">{analytics.completionMetrics.totalCompleted}</div>
              <p className="text-[var(--text-muted)] text-[0.6875rem] mt-1.5">Total tasks set to DONE</p>
            </div>

            <div className="card p-5">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Overdue Tasks</span>
                <AlertOctagon className="h-4 w-4 text-[#EF4444]" />
              </div>
              <div className="text-[1.75rem] font-bold text-[var(--text-primary)] leading-none">
                {analytics.overdueByUser.reduce((acc, curr) => acc + curr.overdue_count, 0)}
              </div>
              <p className="text-[var(--text-muted)] text-[0.6875rem] mt-1.5">Tasks past their due date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performers (Raw SQL window rank aggregation) */}
            <div className="card p-6 lg:col-span-1">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-[rgba(91,91,214,0.1)] text-[var(--brand)] rounded-[6px]">
                  <Medal className="h-4 w-4" />
                </div>
                <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Top Performers</h3>
              </div>

              <div className="space-y-3">
                {analytics.topPerformers.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-[0.875rem] py-4 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-btn)]">No completed tasks yet.</p>
                ) : (
                  analytics.topPerformers.map((performer, idx) => (
                    <div key={performer.user_id} className="flex justify-between items-center p-3 bg-[rgba(255,255,255,0.01)] border border-[var(--border-subtle)] rounded-[var(--radius-btn)]">
                      <div className="flex items-center gap-3">
                        <span className={`text-[1rem] font-bold ${idx === 0 ? 'text-[#FBBF24]' : idx === 1 ? 'text-[#94A3B8]' : idx === 2 ? 'text-[#D97706]' : 'text-[var(--text-muted)]'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{performer.user_name}</p>
                          <p className="text-[0.6875rem] text-[var(--text-muted)] font-mono font-medium">Avg: {performer.avg_completion_hours}h</p>
                        </div>
                      </div>
                      <span className="badge bg-[var(--brand-soft)] text-[var(--brand)]">
                        {performer.completed_count} done
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overdue Task Distribution Table */}
            <div className="card p-6 lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-1.5 bg-[rgba(168,85,247,0.1)] text-[#A855F7] rounded-[6px]">
                  <Activity className="h-4 w-4" />
                </div>
                <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">User Workload & Overdue Matrix</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-2">Team Member</th>
                      <th className="pb-3 px-2">Assigned Tasks</th>
                      <th className="pb-3 px-2">Overdue Count</th>
                      <th className="pb-3 px-2 text-right">Overdue %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] text-[0.875rem]">
                    {analytics.overdueByUser.map((user) => (
                      <tr key={user.user_id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="py-3 px-2 font-medium text-[var(--text-primary)]">{user.user_name}</td>
                        <td className="py-3 px-2 text-[var(--text-secondary)]">{user.total_assigned}</td>
                        <td className="py-3 px-2 text-[var(--text-secondary)]">{user.overdue_count}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`badge ${
                            user.overdue_percentage > 50 ? 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]' :
                            user.overdue_percentage > 20 ? 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' :
                            'bg-[rgba(34,197,94,0.12)] text-[#22C55E]'
                          }`}>
                            {user.overdue_percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Project Summary breakdown */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-[rgba(59,130,246,0.1)] text-[#3B82F6] rounded-[6px]">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Project Performance metrics</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-2">Project</th>
                    <th className="pb-3 px-2">Total Tasks</th>
                    <th className="pb-3 px-2">In Progress</th>
                    <th className="pb-3 px-2">Blocked</th>
                    <th className="pb-3 px-2">Completed</th>
                    <th className="pb-3 px-2 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[0.875rem]">
                  {analytics.projectSummary.map((project) => (
                    <tr key={project.project_id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="py-3.5 px-2 font-medium text-[var(--text-primary)]">{project.project_name}</td>
                      <td className="py-3.5 px-2 text-[var(--text-secondary)]">{project.total_tasks}</td>
                      <td className="py-3.5 px-2 text-[var(--text-secondary)]">{project.in_progress_tasks}</td>
                      <td className="py-3.5 px-2 text-[var(--text-secondary)]">{project.blocked_tasks}</td>
                      <td className="py-3.5 px-2 text-[var(--text-secondary)]">{project.completed_tasks}</td>
                      <td className="py-3.5 px-2 text-right font-semibold text-[var(--brand)]">
                        {project.completion_rate !== null ? `${project.completion_rate}%` : '0%'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
