// app/faculty/setup/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function FacultySetup() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState<string>('');

  const [form, setForm] = useState({
    department: '',
    designation: '',
    phone: '',
    profilePhoto: '',
  });

 const departments = [
  'CSE - Computer Science and Engineering',
  'MECH - Mechanical Engineering',
  'ECE - Electronics and Communication Engineering',
  'AIDS - Artificial Intelligence and Data Science',
  'IT - Information Technology',
  'MBA - Master of Business Administration',
  'S&H - Science and Humanities',
   'Other Faculties',
];

  const designations = [
    'Assistant Professor',
    'Associate Professor',
    'Professor',
    'Lecturer',
    'Senior Lecturer',
    'Head of Department',
    'Research Scholar',
  ];

  useEffect(() => {
    const auth = localStorage.getItem('facultyAuth');
    const storedToken = localStorage.getItem('facultyToken');

    if (auth !== 'true' || !storedToken) {
      router.replace('/login/faculty');
      return;
    }

    setToken(storedToken);
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setForm({ ...form, profilePhoto: base64 });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPreviewImage('');
    setForm({ ...form, profilePhoto: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!form.department || !form.designation) {
      setError('Department and designation are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/faculty/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Profile setup complete! Redirecting...');
        setTimeout(() => {
          router.push('/faculty/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
  // Save with defaults if skipping
  try {
    await fetch('/api/faculty/update-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        department: 'CSE - Computer Science and Engineering',
        designation: 'Assistant Professor',
        phone: '',
        profilePhoto: '',
      }),
    });
  } catch (error) {
    console.error('Skip error:', error);
  }
  
  router.push('/faculty/dashboard');
};

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-md rounded-2xl mb-4">
            <span className="text-5xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-white">JACSICE</h1>
          <p className="text-blue-200 text-sm mt-2">Complete Your Profile</p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-blue-200 mb-2">
              <span>Profile Setup</span>
              <span>Step 1 of 1</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full">
              <div className="h-full bg-gradient-to-r from-blue-400 to-violet-400 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">Set Up Your Profile</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo */}
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-3 font-medium">
                PROFILE PHOTO <span className="text-blue-400">(Optional)</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-white/30"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-white/10 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition"
                  >
                    Upload Photo
                  </button>
                  <p className="text-blue-200/50 text-xs mt-1">JPG, PNG (Max 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">
                DEPARTMENT <span className="text-red-400">*</span>
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition"
                required
              >
                <option value="" className="text-gray-900">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                ))}
              </select>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">
                DESIGNATION <span className="text-red-400">*</span>
              </label>
              <select
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition"
                required
              >
                <option value="" className="text-gray-900">Select Designation</option>
                {designations.map((desig) => (
                  <option key={desig} value={desig} className="text-gray-900">{desig}</option>
                ))}
              </select>
            </div>

            {/* Phone (Optional) */}
            <div>
              <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">
                PHONE NUMBER <span className="text-blue-400">(Optional)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 focus:outline-none focus:border-white/50 transition"
              />
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex items-center gap-2">
                <span>⚠️</span>
                <p className="text-red-200 text-xs">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-3 flex items-center gap-2">
                <span>✅</span>
                <p className="text-green-200 text-xs">{success}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 px-4 py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10 transition"
              >
                Skip for Now
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}