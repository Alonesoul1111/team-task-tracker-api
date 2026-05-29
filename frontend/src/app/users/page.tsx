'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useUsers } from '@/hooks/use-data';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Mail, 
  Calendar,
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { data: usersData, isLoading } = useUsers({ limit: 100 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const users = usersData?.data || [];

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.patch(`/users/${userId}/status`, { status: newStatus });
      toast.success(`User status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success('User permanently deleted');
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-[rgba(34,197,94,0.12)] text-[#22C55E]';
      case 'INACTIVE':
        return 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]';
      case 'LEFT':
        return 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]';
      default:
        return 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]';
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="page-title">Team Members</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-[0.875rem]">Manage user roles, status, and permissions within your organization.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-[var(--text-muted)] text-[0.875rem]">Loading team members...</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)] text-[var(--text-muted)] text-[0.6875rem] font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  {currentUser?.role === 'ADMIN' && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[0.875rem]">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-[rgba(255,255,255,0.02)] transition-colors ${user.status === 'LEFT' ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-[32px] w-[32px] items-center justify-center rounded-[8px] font-semibold text-[0.75rem] ${
                          user.status === 'ACTIVE' 
                            ? 'bg-[var(--brand-soft)] text-[var(--brand)]' 
                            : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'
                        }`}>
                          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{user.name}</span>
                          {user.status === 'LEFT' && (
                            <span className="ml-2 text-[0.6875rem] text-[var(--text-muted)] italic">departed</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2 text-[0.8125rem]">
                        <Mail className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-2 text-[0.8125rem]">
                        <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`badge ${
                        user.role === 'ADMIN' ? 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]' :
                        user.role === 'MANAGER' ? 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' :
                        'bg-[rgba(59,130,246,0.12)] text-[#3B82F6]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`badge ${getStatusBadge(user.status || 'ACTIVE')}`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="py-3 px-6">
                        {user.id === currentUser.id ? (
                          <span className="text-[0.6875rem] text-[var(--text-muted)] flex items-center gap-1 justify-end font-medium">
                            <Lock className="h-3.5 w-3.5" /> Current User
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            {/* Role Selector */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-btn)] px-2 py-1.5 text-[0.75rem] text-[var(--text-primary)] outline-none cursor-pointer hover:border-[rgba(255,255,255,0.1)] transition-colors"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                            </select>

                            {/* Status Selector */}
                            <select
                              value={user.status || 'ACTIVE'}
                              onChange={(e) => handleStatusChange(user.id, e.target.value)}
                              className={`border rounded-[var(--radius-btn)] px-2 py-1.5 text-[0.75rem] outline-none cursor-pointer transition-colors ${
                                user.status === 'LEFT' 
                                  ? 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-muted)]' 
                                  : user.status === 'INACTIVE'
                                  ? 'bg-[rgba(245,158,11,0.05)] border-[rgba(245,158,11,0.2)] text-[#F59E0B]'
                                  : 'bg-[rgba(34,197,94,0.05)] border-[rgba(34,197,94,0.2)] text-[#22C55E]'
                              }`}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="LEFT">Left Company</option>
                            </select>

                            {/* Delete Button */}
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="p-1.5 rounded-[var(--radius-btn)] text-[var(--text-muted)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors ml-1"
                              title="Delete user permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-backdrop">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-subtle)] shadow-2xl p-6 ring-1 ring-white/5 mx-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-[rgba(239,68,68,0.12)] rounded-[10px]">
                <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
              </div>
              <div>
                <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)]">Delete User Permanently?</h3>
                <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-[0.875rem] text-[var(--text-secondary)] mb-4 leading-relaxed">
              Deleting this user will permanently remove their account, unassign all their tasks, and erase their comment history.
            </p>

            <div className="p-3 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] rounded-[var(--radius-btn)] mb-6">
              <p className="text-[0.75rem] text-[#FBBF24] leading-relaxed">
                <strong>Tip:</strong> If this person is leaving the company, consider changing their status to <strong>&quot;Left Company&quot;</strong> instead. This preserves their task history while blocking their login.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="btn-danger"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
