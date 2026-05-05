// app/login/faculty/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function FacultyLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Attempting login with:', email);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('📡 Response:', { status: res.status, ok: res.ok, data });

      if (res.ok) {
        // Store auth data
        localStorage.setItem('facultyAuth', 'true');
        localStorage.setItem('facultyToken', data.token);
        localStorage.setItem('facultyUser', JSON.stringify(data.user));
        document.cookie = `facultyAuth=true; path=/; max-age=86400; SameSite=Lax`;

        console.log('✅ Login successful, checking profile...');

        // Check profile status
        try {
          const checkRes = await fetch('/api/faculty/profile-check', {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          const checkData = await checkRes.json();
          console.log('👤 Profile check:', checkData);

          if (checkData.isComplete) {
            console.log('➡️ Redirecting to DASHBOARD');
            router.push('/faculty/dashboard');
          } else {
            console.log('➡️ Redirecting to SETUP');
            router.push('/faculty/setup');
          }
        } catch (checkError) {
          console.error('❌ Profile check failed:', checkError);
          // If check fails, go to setup by default
          router.push('/faculty/setup');
        }
      } else {
        console.error('❌ Login failed:', data.error);
        setError(data.error || 'Invalid email or password');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center p-4">
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-4">
            <span className="text-5xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-white drop-shadow-lg">JACSICE</h1>
          <p className="text-blue-200 text-sm tracking-widest uppercase mt-2 font-light">Faculty Portal</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faculty@jacsice.edu"
                  className="w-full pl-12 pr-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 focus:outline-none focus:border-white/50 focus:bg-white/20 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">PASSWORD</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 focus:outline-none focus:border-white/50 focus:bg-white/20 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-red-200 text-xs">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold tracking-wider text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-blue-200 hover:text-white transition inline-flex items-center gap-1">
            <span>←</span> Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}