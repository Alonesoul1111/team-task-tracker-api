'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAnalytics } from '@/hooks/use-data';
import { 
  BarChart3, 
  Clock, 
  AlertOctagon, 
  CheckCircle,
  Medal,
  Activity,
  Layers
} from 'lucide-react';
import type { AnalyticsData } from '@/lib/types';

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useAnalytics();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Analytics</h1>
        <p className="text-slate-400 mt-1">Aggregated task metrics and performance graphs.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading analytics...</div>
      ) : !analytics ? (
        <div className="glass-card p-12 rounded-2xl border text-center text-slate-500 border-slate-900">
          No analytics data available.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 rounded-2xl border border-slate-900">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Completion</span>
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100">{analytics.completionMetrics.avgHours}h</div>
              <p className="text-slate-500 text-2xs mt-1">Average resolution hours</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-900">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Median Completion</span>
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100">{analytics.completionMetrics.medianHours}h</div>
              <p className="text-slate-500 text-2xs mt-1">Median completion hours</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-900">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolved Tasks</span>
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100">{analytics.completionMetrics.totalCompleted}</div>
              <p className="text-slate-500 text-2xs mt-1">Total tasks set to DONE</p>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-900">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue Tasks</span>
                <AlertOctagon className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-3xl font-extrabold text-slate-100">
                {analytics.overdueByUser.reduce((acc, curr) => acc + curr.overdue_count, 0)}
              </div>
              <p className="text-slate-500 text-2xs mt-1">Tasks past their due date</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Performers (Raw SQL window rank aggregation) */}
            <div className="glass-card p-6 rounded-2xl border border-slate-900 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <Medal className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-200">Top Performers</h3>
              </div>

              <div className="space-y-4">
                {analytics.topPerformers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">No completed tasks yet.</p>
                ) : (
                  analytics.topPerformers.map((performer, idx) => (
                    <div key={performer.user_id} className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-900/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-extrabold ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{performer.user_name}</p>
                          <p className="text-3xs text-slate-500 font-mono">Avg: {performer.avg_completion_hours}h</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 border border-indigo-500/15 rounded-lg">
                        {performer.completed_count} done
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Overdue Task Distribution Table */}
            <div className="glass-card p-6 rounded-2xl border border-slate-900 lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold text-slate-200">User Workload & Overdue Matrix</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 text-3xs font-semibold uppercase tracking-wider">
                      <th className="pb-3">Team Member</th>
                      <th className="pb-3">Assigned Tasks</th>
                      <th className="pb-3">Overdue Count</th>
                      <th className="pb-3 text-right">Overdue %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40 text-sm">
                    {analytics.overdueByUser.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-900/10">
                        <td className="py-3 font-semibold text-slate-200">{user.user_name}</td>
                        <td className="py-3 text-slate-400">{user.total_assigned}</td>
                        <td className="py-3 text-slate-400">{user.overdue_count}</td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                            user.overdue_percentage > 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            user.overdue_percentage > 20 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
          <div className="glass-card p-6 rounded-2xl border border-slate-900">
            <div className="flex items-center gap-2 mb-6">
              <Layers className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-200">Project Performance metrics</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 text-3xs font-semibold uppercase tracking-wider">
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Total Tasks</th>
                    <th className="pb-3">In Progress</th>
                    <th className="pb-3">Blocked</th>
                    <th className="pb-3">Completed</th>
                    <th className="pb-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-sm">
                  {analytics.projectSummary.map((project) => (
                    <tr key={project.project_id} className="hover:bg-slate-900/10">
                      <td className="py-3.5 font-bold text-slate-200">{project.project_name}</td>
                      <td className="py-3.5 text-slate-400">{project.total_tasks}</td>
                      <td className="py-3.5 text-slate-400">{project.in_progress_tasks}</td>
                      <td className="py-3.5 text-slate-400">{project.blocked_tasks}</td>
                      <td className="py-3.5 text-slate-400">{project.completed_tasks}</td>
                      <td className="py-3.5 text-right font-semibold text-indigo-400">
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
