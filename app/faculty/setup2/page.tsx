// app/faculty/setup-test/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupTest() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('facultyToken');
    if (!storedToken) {
      router.replace('/login/faculty');
      return;
    }
    setToken(storedToken);
  }, [router]);

  const handleSave = async () => {
    setMessage('Saving...');
    
    const res = await fetch('/api/faculty/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        department: department || 'CSE - Computer Science and Engineering',
        designation: designation || 'Assistant Professor',
        phone: '',
        profilePhoto: '',
      }),
    });

    const data = await res.json();
    console.log('Save response:', data);

    if (res.ok) {
      setMessage('✅ Saved! Redirecting...');
      setTimeout(() => {
        router.push('/faculty/dashboard');
      }, 1000);
    } else {
      setMessage('❌ Error: ' + (data.error || 'Failed'));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">Quick Setup</h1>
        
        <div className="space-y-4">
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department (e.g., CSE - Computer Science)"
            className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none"
          />
          
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Designation (e.g., Assistant Professor)"
            className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none"
          />

          {message && (
            <p className="text-white text-sm text-center">{message}</p>
          )}

          <button
            onClick={handleSave}
            className="w-full py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition"
          >
            Save & Go to Dashboard
          </button>
          
          <button
            onClick={() => router.push('/faculty/dashboard')}
            className="w-full py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10 transition"
          >
            Skip
          </button>
        </div>
      </div>
    </main>
  );
}