'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useUsers } from '@/hooks/use-data';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Users as UsersIcon, 
  Shield, 
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
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'INACTIVE':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'LEFT':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Team Members</h1>
        <p className="text-slate-400 mt-1">Manage user roles, status, and permissions within your organization.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-500">Loading team members...</div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-3xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Status</th>
                  {currentUser?.role === 'ADMIN' && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className={`hover:bg-slate-900/10 ${user.status === 'LEFT' ? 'opacity-50' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                          user.status === 'ACTIVE' 
                            ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' 
                            : 'bg-slate-800 border border-slate-700 text-slate-500'
                        }`}>
                          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-200">{user.name}</span>
                          {user.status === 'LEFT' && (
                            <span className="ml-2 text-2xs text-slate-500 italic">departed</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-600" />
                        {user.email}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-600" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold uppercase ${
                        user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        user.role === 'MANAGER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold uppercase ${getStatusBadge(user.status || 'ACTIVE')}`}>
                        {user.status || 'ACTIVE'}
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="py-4 px-6">
                        {user.id === currentUser.id ? (
                          <span className="text-3xs text-slate-600 flex items-center gap-1 justify-end">
                            <Lock className="h-3 w-3" /> Current User
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            {/* Role Selector */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 outline-none cursor-pointer"
                            >
                              <option value="MEMBER">Member</option>
                              <option value="MANAGER">Manager</option>
                              <option value="ADMIN">Admin</option>
                            </select>

                            {/* Status Selector */}
                            <select
                              value={user.status || 'ACTIVE'}
                              onChange={(e) => handleStatusChange(user.id, e.target.value)}
                              className={`border rounded-lg px-2 py-1 text-xs outline-none cursor-pointer ${
                                user.status === 'LEFT' 
                                  ? 'bg-slate-900 border-slate-700 text-slate-400' 
                                  : user.status === 'INACTIVE'
                                  ? 'bg-amber-950/30 border-amber-800/40 text-amber-400'
                                  : 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                              }`}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="INACTIVE">Inactive</option>
                              <option value="LEFT">Left Company</option>
                            </select>

                            {/* Delete Button */}
                            <button
                              onClick={() => setConfirmDeleteId(user.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-950/95 rounded-2xl border border-slate-800/60 shadow-2xl p-6 ring-1 ring-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Delete User Permanently?</h3>
                <p className="text-sm text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 mb-2 leading-relaxed">
              Deleting this user will permanently remove their account, unassign all their tasks, and erase their comment history.
            </p>

            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-6">
              <p className="text-xs text-amber-400">
                <strong>Tip:</strong> If this person is leaving the company, consider changing their status to <strong>&quot;Left Company&quot;</strong> instead. This preserves their task history while blocking their login.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-red-600/20"
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
