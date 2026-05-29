'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--bg-app)] px-4 py-12 relative overflow-hidden">
      {/* Decorative backdrop elements (subtle) */}
      <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-[var(--brand)] opacity-[0.03] blur-[100px] pointer-events-none"></div>
      
      <div className="w-full max-w-md panel p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--brand)] font-bold text-white shadow-lg shadow-[var(--brand-glow)] text-lg mb-5">
            A
          </div>
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[var(--text-primary)]">Welcome back</h2>
          <p className="text-[var(--text-secondary)] text-[0.875rem] mt-1.5">Sign in to your AeroTask account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="input"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)]">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[0.875rem] border-t border-[var(--border-subtle)] pt-6">
          <span className="text-[var(--text-muted)]">Don&apos;t have an account? </span>
          <Link href="/register" className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
