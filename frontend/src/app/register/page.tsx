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
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-900">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-500/30 text-xl mb-4">
            A
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gradient font-sans">Create account</h2>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Get started with AeroTask today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all duration-200"
              required
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 chars (A-Z, a-z, 0-9)"
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all duration-200"
              required
            />
          </div>

          {/* Org Options */}
          <div className="border-t border-slate-900 pt-4 mt-2">
            <label className="block text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Organization
            </label>
            <div className="flex bg-slate-950/60 border border-slate-800 rounded-lg p-1 mb-3">
              <button
                type="button"
                onClick={() => setOrgOption('create')}
                className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all cursor-pointer ${
                  orgOption === 'create'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setOrgOption('join')}
                className={`flex-1 text-xs font-semibold py-2 rounded-md transition-all cursor-pointer ${
                  orgOption === 'join'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
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
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all duration-200"
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
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 text-sm outline-none transition-all duration-200"
                  required={orgOption === 'join'}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 mt-2 flex items-center justify-center gap-2 cursor-pointer"
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

        <div className="mt-6 text-center text-sm border-t border-slate-900/60 pt-4">
          <span className="text-slate-500 font-medium">Already have an account? </span>
          <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
