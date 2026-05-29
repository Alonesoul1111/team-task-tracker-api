'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  FolderGit, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ShieldAlert,
  Check,
  CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationStore } from '@/store/notifications';

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
    { name: 'Kanban Board', href: '/tasks', icon: KanbanSquare, roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
    { name: 'Projects', href: '/projects', icon: FolderGit, roles: ['ADMIN', 'MANAGER', 'MEMBER'] },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Team Members', href: '/users', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(user.role));

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const handlePrefetch = (href: string) => {
    if (href === '/projects') {
      queryClient.prefetchQuery({ queryKey: ['projects', {}], queryFn: async () => (await api.get('/projects')).data });
    } else if (href === '/tasks') {
      queryClient.prefetchQuery({ queryKey: ['tasks', { limit: 100 }], queryFn: async () => (await api.get('/tasks?limit=100')).data });
    } else if (href === '/users') {
      queryClient.prefetchQuery({ queryKey: ['users', { limit: 100 }], queryFn: async () => (await api.get('/users?limit=100')).data });
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden md:flex md:w-64 md:flex-col glass-panel border-r border-slate-900">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 gap-2 border-b border-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/30">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">AeroTask</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onMouseEnter={() => handlePrefetch(item.href)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border border-transparent'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-300">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-2xs font-semibold uppercase ${
                  user.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  user.role === 'MANAGER' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-slate-900/50 glass-panel">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-900"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Org Name */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono">ORGANIZATION:</span>
            <span className="text-sm font-semibold text-slate-300">Acme Corporation</span>
          </div>

          {/* Alerts / Profile */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-lg transition-colors relative ${isNotificationsOpen ? 'bg-slate-900 text-slate-200' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-950"></span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isNotificationsOpen && (
                <>
                  {/* Backdrop for closing */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsNotificationsOpen(false)}
                  ></div>
                  
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                      <h3 className="font-semibold text-sm text-slate-200">Notifications {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs">{unreadCount}</span>}</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          No notifications yet
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y divide-slate-800/50">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              onClick={() => {
                                if (!notification.isRead) markAsRead(notification.id);
                                if (notification.link) {
                                  router.push(notification.link);
                                  setIsNotificationsOpen(false);
                                }
                              }}
                              className={`p-3 hover:bg-slate-800/50 transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-slate-800/20' : ''}`}
                            >
                              <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!notification.isRead ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-slate-200' : 'text-slate-400'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-2xs text-slate-600 mt-1.5 font-medium">
                                  {formatRelativeTime(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="h-8 w-px bg-slate-900"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Main Content Scroll Container */}
        <main className="flex-1 overflow-y-auto bg-slate-950/20 p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* ─── MOBILE SIDEBAR MENU ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <div className="relative flex w-full max-w-xs flex-col bg-slate-950 border-r border-slate-900 p-6">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:bg-slate-900"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
                A
              </div>
              <span className="text-xl font-bold tracking-tight text-gradient">AeroTask</span>
            </div>

            <nav className="flex-1 space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                        : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-900 pt-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                  <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-2xs font-semibold text-indigo-400 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
