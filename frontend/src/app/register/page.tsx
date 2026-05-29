'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgOption, setOrgOption] = useState<'create' | 'join'>('create');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all standard fields');
      return;
    }

    if (orgOption === 'create' && !organizationName) {
      toast.error('Please specify an organization name');
      return;
    }

    if (orgOption === 'join' && !organizationId) {
      toast.error('Please specify an organization ID to join');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name,
        email,
        password,
      };

      if (orgOption === 'create') {
        payload.organizationName = organizationName;
      } else {
        payload.organizationId = organizationId;
      }

      await register(payload);
      toast.success('Account created successfully');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[var(--bg-app)] px-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-[var(--brand)] opacity-[0.03] blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md panel p-8 relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--brand)] font-bold text-white shadow-lg shadow-[var(--brand-glow)] text-lg mb-4">
            A
          </div>
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-[var(--text-primary)]">Create account</h2>
          <p className="text-[var(--text-secondary)] text-[0.875rem] mt-1.5 font-medium">Get started with AeroTask today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 chars (A-Z, a-z, 0-9)"
              className="input"
              required
            />
          </div>

          {/* Org Options */}
          <div className="border-t border-[var(--border-subtle)] pt-4 mt-2">
            <label className="block text-[0.75rem] font-medium text-[var(--text-secondary)] mb-2">
              Organization
            </label>
            <div className="flex bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] rounded-[var(--radius-btn)] p-1 mb-4">
              <button
                type="button"
                onClick={() => setOrgOption('create')}
                className={`flex-1 text-[0.75rem] font-medium py-1.5 rounded-[6px] transition-all cursor-pointer ${
                  orgOption === 'create'
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)] border border-[rgba(91,91,214,0.25)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setOrgOption('join')}
                className={`flex-1 text-[0.75rem] font-medium py-1.5 rounded-[6px] transition-all cursor-pointer ${
                  orgOption === 'join'
                    ? 'bg-[var(--brand-soft)] text-[var(--brand)] border border-[rgba(91,91,214,0.25)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                Join Existing
              </button>
            </div>

            {orgOption === 'create' ? (
              <div>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Acme Corp"
                  className="input"
                  required={orgOption === 'create'}
                />
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  placeholder="Enter Organization UUID"
                  className="input"
                  required={orgOption === 'join'}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[0.875rem] border-t border-[var(--border-subtle)] pt-5">
          <span className="text-[var(--text-muted)] font-medium">Already have an account? </span>
          <Link href="/login" className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
