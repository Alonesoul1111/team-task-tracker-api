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
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-[var(--bg-app)] border-r border-[var(--border-subtle)] relative z-10">
        {/* Brand */}
        <div className="flex h-16 items-center px-6 gap-3 border-b border-[var(--border-subtle)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--brand)] font-bold text-white shadow-lg shadow-[var(--brand-glow)]">
            A
          </div>
          <span className="text-[1.125rem] font-semibold tracking-tight text-[var(--text-primary)]">AeroTask</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] text-[0.875rem] font-medium transition-all duration-200 group border-l-[3px] ${
                  isActive
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]'
                    : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[var(--text-primary)] border-transparent'
                }`}
              >
                <item.icon className={`h-[18px] w-[18px] transition-transform duration-200 ${
                  isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[rgba(255,255,255,0.01)]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] text-[0.8125rem] font-semibold text-[var(--text-primary)]">
              {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)] truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`badge ${
                  user.role === 'ADMIN' ? 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]' :
                  user.role === 'MANAGER' ? 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' :
                  'bg-[rgba(59,130,246,0.12)] text-[#3B82F6]'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-[var(--radius-btn)] text-[0.875rem] font-medium text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444] transition-all duration-200"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col flex-1 overflow-hidden bg-[var(--bg-content)]">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-app)] relative z-20">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 rounded-[var(--radius-btn)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Org Name */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[0.6875rem] text-[var(--text-muted)] font-mono font-medium tracking-widest uppercase">ORGANIZATION:</span>
            <span className="text-[0.875rem] font-medium text-[var(--text-primary)]">Acme Corporation</span>
          </div>

          {/* Alerts / Profile */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-[var(--radius-btn)] transition-colors relative ${isNotificationsOpen ? 'bg-[rgba(255,255,255,0.05)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]'}`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--brand)] ring-2 ring-[var(--bg-app)]"></span>
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
                  
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] shadow-2xl z-50 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-[var(--border-subtle)] flex items-center justify-between sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur-sm z-10">
                      <h3 className="font-semibold text-[0.875rem] text-[var(--text-primary)]">Notifications {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[0.6875rem]">{unreadCount}</span>}</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                          className="text-[0.75rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-[0.875rem] text-[var(--text-muted)]">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                          No notifications yet
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
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
                              className={`p-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-[rgba(91,91,214,0.05)]' : ''}`}
                            >
                              <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notification.isRead ? 'bg-[var(--brand)]' : 'bg-transparent'}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[0.875rem] font-medium truncate ${!notification.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-[0.75rem] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-[0.6875rem] text-[var(--text-muted)] mt-1.5 font-medium">
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
          </div>
        </header>

        {/* Main Content Scroll Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* MOBILE SIDEBAR MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden modal-backdrop">
          <div className="relative flex w-full max-w-xs flex-col h-full bg-[var(--bg-app)] border-r border-[var(--border-subtle)] p-6 ml-0 mr-auto shadow-2xl">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-[var(--radius-btn)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-8 mt-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[var(--brand)] font-bold text-white shadow-lg shadow-[var(--brand-glow)]">
                A
              </div>
              <span className="text-[1.125rem] font-semibold tracking-tight text-[var(--text-primary)]">AeroTask</span>
            </div>

            <nav className="flex-1 space-y-1.5">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-btn)] text-[0.875rem] font-medium transition-all border-l-[3px] ${
                      isActive
                        ? 'bg-[var(--brand-soft)] text-[var(--brand)] border-[var(--brand)]'
                        : 'text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.02)] hover:text-[var(--text-primary)] border-transparent'
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] ${isActive ? 'text-[var(--brand)]' : 'text-[var(--text-muted)]'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] text-[0.8125rem] font-semibold text-[var(--text-primary)]">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{user.name}</p>
                  <span className={`badge mt-0.5 ${
                    user.role === 'ADMIN' ? 'bg-[rgba(239,68,68,0.12)] text-[#EF4444]' :
                    user.role === 'MANAGER' ? 'bg-[rgba(245,158,11,0.12)] text-[#F59E0B]' :
                    'bg-[rgba(59,130,246,0.12)] text-[#3B82F6]'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-3 py-2 rounded-[var(--radius-btn)] text-[0.875rem] font-medium text-[var(--text-muted)] hover:bg-[rgba(239,68,68,0.08)] hover:text-[#EF4444] transition-colors"
              >
                <LogOut className="h-[18px] w-[18px]" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
