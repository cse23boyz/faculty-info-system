// app/login/admin/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store in localStorage
        localStorage.setItem('adminAuth', 'true');
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.admin));
        
        // Also set cookie for middleware
        document.cookie = `adminAuth=true; path=/; max-age=86400; SameSite=Lax`;
        
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-wider text-white mb-2 drop-shadow-lg">
            JACSICE
          </h1>
          <p className="text-sm text-blue-200 tracking-widest uppercase font-light">
            Admin Portal
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">
                USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-white focus:bg-white/30 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 text-sm bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-white focus:bg-white/30 transition"
                required
              />
            </div>

            {error && (
              <p className="text-red-300 text-xs text-center bg-red-500/20 rounded-lg py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold tracking-wider text-indigo-600 bg-white rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-blue-200/60 text-xs mt-6">
            Default: admin / admin123
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-sm text-blue-200 hover:text-white transition"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}