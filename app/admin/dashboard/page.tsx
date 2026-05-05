// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Faculty {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  facultyCode: string;
  department: string;
  designation: string;
  phone: string;
  specialization: string;
  profilePhoto: string;
  status: string;
  qualifications: any[];
  publications: any[];
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState('');

  // Faculty state
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showFacultyProfile, setShowFacultyProfile] = useState<Faculty | null>(null);
  const [viewCertificate, setViewCertificate] = useState<any>(null);

  // Forms
  const [form, setForm] = useState({ name: '', facultyCode: '', email: '' });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    broadcastType: 'all' as 'all' | 'department' | 'specific',
    targetDepartments: [] as string[],
  });

  // Faculty search for announcement
  const [facultySearch, setFacultySearch] = useState('');
  const [facultySearchResults, setFacultySearchResults] = useState<Faculty[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty[]>([]);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);

  // Credentials popup
  const [credentialsPopup, setCredentialsPopup] = useState({
    show: false, name: '', email: '', username: '', password: '', facultyCode: '', loginUrl: '',
  });

  // Announcements
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const departments = [
    'CSE - Computer Science and Engineering',
    'MECH - Mechanical Engineering',
    'ECE - Electronics and Communication Engineering',
    'AIDS - Artificial Intelligence and Data Science',
    'IT - Information Technology',
    'MBA - Master of Business Administration',
    'S&H - Science and Humanities',
  ];

  const recentMessages = [
    { id: '1', from: 'Dr. Rajesh Kumar', department: 'CSE', message: 'Requesting lab equipment upgrade for AI course.', time: '10:30 AM' },
    { id: '2', from: 'Prof. Priya Sharma', department: 'ECE', message: 'Submitted semester exam papers for review.', time: '9:15 AM' },
    { id: '3', from: 'Dr. Senthil Kumar', department: 'MECH', message: 'Need approval for conference attendance.', time: 'Yesterday' },
    { id: '4', from: 'Prof. Lakshmi Narayanan', department: 'IT', message: 'Lab assistant recruitment pending approval.', time: 'Yesterday' },
    { id: '5', from: 'Dr. Anitha Raj', department: 'AIDS', message: 'Library book procurement list attached.', time: '2 days ago' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'faculty', label: 'Faculty List', icon: '👥' },
    { id: 'invite', label: 'Invite Faculty', icon: '📧' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Auth
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    const storedToken = localStorage.getItem('adminToken');
    if (auth !== 'true' || !storedToken) { router.replace('/login/admin'); return; }
    verifyToken(storedToken);
  }, [router]);

  const verifyToken = async (storedToken: string) => {
    try {
      const res = await fetch('/api/admin/verify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${storedToken}` } });
      if (res.ok) { setIsAuthenticated(true); setToken(storedToken); }
      else { localStorage.clear(); document.cookie = 'adminAuth=; path=/; max-age=0'; router.replace('/login/admin'); }
    } catch { setIsAuthenticated(true); setToken(storedToken); } finally { setIsLoading(false); }
  };

  const fetchFaculty = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/faculty?search=${search}&limit=100`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFacultyList(data.data || []);
    } catch (error) { console.error('Fetch error:', error); } finally { setLoading(false); }
  }, [search, token]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) { console.error('Announcements error:', error); }
  }, [token]);

  useEffect(() => { if (isAuthenticated) { fetchFaculty(); fetchAnnouncements(); } }, [isAuthenticated, fetchFaculty, fetchAnnouncements]);

  const showNotification = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000); };

  // Invite faculty
  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/faculty', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        showNotification(`✅ Faculty invited! ${data.emailSent ? '✅ Email sent!' : '⚠️ Email queued'}`);
        setShowAddModal(false); setForm({ name: '', facultyCode: '', email: '' });
        setCredentialsPopup({ show: true, name: data.credentials.name, email: data.credentials.email, username: data.credentials.username, password: data.credentials.password, facultyCode: data.credentials.facultyCode, loginUrl: data.credentials.loginUrl });
        fetchFaculty();
      } else showNotification(`❌ ${data.error}`);
    } catch { showNotification('❌ Failed'); }
  };

  // Remove faculty
  const handleRemoveFaculty = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      const res = await fetch(`/api/admin/faculty/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { showNotification(`✅ ${data.message}`); fetchFaculty(); }
      else showNotification(`❌ ${data.error}`);
    } catch { showNotification('❌ Failed'); }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showNotification('❌ Passwords do not match'); return; }
    try {
      const res = await fetch('/api/admin/reset-password', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(passwordForm) });
      const data = await res.json();
      if (res.ok) { showNotification('✅ Password updated'); setShowPasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
      else showNotification(`❌ ${data.error}`);
    } catch { showNotification('❌ Failed'); }
  };

  // Search faculty for announcement
  const searchFacultyForAnnouncement = async (query: string) => {
    setFacultySearch(query);
    if (query.length < 2) { setFacultySearchResults([]); setShowFacultyDropdown(false); return; }
    try {
      const res = await fetch(`/api/admin/faculty?search=${query}&limit=10`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setFacultySearchResults(data.data || []); setShowFacultyDropdown(true);
    } catch (error) { console.error('Search error:', error); }
  };

  const toggleFacultySelection = (faculty: Faculty) => {
    const isSelected = selectedFaculty.find(f => f._id === faculty._id);
    if (isSelected) setSelectedFaculty(selectedFaculty.filter(f => f._id !== faculty._id));
    else setSelectedFaculty([...selectedFaculty, faculty]);
  };

  const removeSelectedFaculty = (facultyId: string) => setSelectedFaculty(selectedFaculty.filter(f => f._id !== facultyId));

  // Add announcement
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (announcementForm.broadcastType === 'specific' && selectedFaculty.length === 0) { showNotification('❌ Select at least one faculty'); return; }
    if (announcementForm.broadcastType === 'department' && announcementForm.targetDepartments.length === 0) { showNotification('❌ Select at least one department'); return; }
    try {
      const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...announcementForm, targetFaculty: selectedFaculty.map(f => f._id) }) });
      const data = await res.json();
      if (res.ok) {
        showNotification('✅ Announcement posted!'); setShowAnnouncementModal(false);
        setAnnouncementForm({ title: '', message: '', priority: 'medium', broadcastType: 'all', targetDepartments: [] });
        setSelectedFaculty([]); setFacultySearch(''); fetchAnnouncements();
      } else showNotification('❌ ' + data.error);
    } catch { showNotification('❌ Failed'); }
  };

  // View faculty profile
  const viewFacultyProfile = (faculty: Faculty) => {
    setShowFacultyProfile(faculty);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth'); localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser');
    document.cookie = 'adminAuth=; path=/; max-age=0'; router.replace('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center">
        <div className="text-center"><div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div><p className="text-white text-sm">Verifying...</p></div>
      </main>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex">
      {notification && <div className="fixed top-4 right-4 z-50 bg-white text-gray-900 px-6 py-3 rounded-xl shadow-2xl animate-bounce text-sm font-medium">{notification}</div>}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-black/20 backdrop-blur-md border-r border-white/10 transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-6 border-b border-white/10">
          <h1 className={`text-white font-bold tracking-wider ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}>{sidebarOpen ? 'JACSICE' : 'J'}</h1>
          {sidebarOpen && <p className="text-blue-200 text-xs mt-1">Admin Panel</p>}
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mx-3 mt-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition text-sm">{sidebarOpen ? '◀' : '▶'}</button>
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveMenu(item.id); if (item.id === 'invite') setShowAddModal(true); if (item.id === 'settings') setShowPasswordModal(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${activeMenu === item.id ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
              <span className="text-lg">{item.icon}</span>{sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition text-sm"><span>🚪</span>{sidebarOpen && <span>Logout</span>}</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{activeMenu === 'dashboard' && 'Admin Dashboard'}{activeMenu === 'faculty' && 'Faculty List'}{activeMenu === 'announcements' && 'Announcements'}{activeMenu === 'messages' && 'Messages'}</h2>
              <p className="text-blue-200 text-sm mt-1">Welcome back, Admin</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAnnouncementModal(true)} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm hover:bg-white/20 transition flex items-center gap-2"><span>📢</span> New Announcement</button>
              <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"><span>+</span> Invite Faculty</button>
            </div>
          </div>

          {/* DASHBOARD */}
          {activeMenu === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[{ label: 'Total Faculty', value: facultyList.length, icon: '👥', color: 'from-blue-400/20 to-blue-500/20' },{ label: 'Active', value: facultyList.filter(f => f.status === 'active').length, icon: '✅', color: 'from-green-400/20 to-green-500/20' },{ label: 'Departments', value: [...new Set(facultyList.map(f => f.department))].length, icon: '🏛️', color: 'from-violet-400/20 to-violet-500/20' },{ label: 'Announcements', value: announcements.length, icon: '📢', color: 'from-yellow-400/20 to-yellow-500/20' }].map(stat => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-2xl p-5 border border-white/10`}>
                    <div className="flex items-center justify-between"><p className="text-white/70 text-xs tracking-wide">{stat.label}</p><span className="text-2xl">{stat.icon}</span></div>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-white">📢 Recent Announcements</h3><button onClick={() => setActiveMenu('announcements')} className="text-sm text-blue-300 hover:text-white transition">View All</button></div>
                  <div className="space-y-4">
                    {announcements.length === 0 ? <p className="text-white/40 text-sm text-center py-8">No announcements yet</p> :
                      announcements.slice(0, 4).map((ann: any) => (
                        <div key={ann._id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition">
                          <div className="flex items-start justify-between mb-2"><h4 className="text-white font-medium text-sm">{ann.title}</h4><span className={`px-2 py-0.5 rounded-full text-xs ${ann.priority === 'high' ? 'bg-red-500/20 text-red-300' : ann.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>{ann.priority}</span></div>
                          <p className="text-white/60 text-sm line-clamp-2">{ann.message}</p>
                          <div className="flex items-center gap-2 mt-2"><span className="text-white/40 text-xs">{ann.broadcastType === 'all' ? '📢 All' : ann.broadcastType === 'department' ? '🏛️ Dept' : '👤 Specific'}</span><span className="text-white/40 text-xs">{new Date(ann.createdAt).toLocaleDateString('en-IN')}</span></div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-semibold text-white">💬 Faculty Messages</h3><button onClick={() => setActiveMenu('messages')} className="text-sm text-blue-300 hover:text-white transition">View All</button></div>
                  <div className="space-y-4">
                    {recentMessages.map(msg => (
                      <div key={msg.id} className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition">
                        <div className="flex items-start justify-between mb-1"><div><h4 className="text-white font-medium text-sm">{msg.from}</h4><p className="text-blue-300 text-xs">{msg.department}</p></div><span className="text-white/40 text-xs">{msg.time}</span></div>
                        <p className="text-white/60 text-sm mt-2">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FACULTY LIST */}
          {activeMenu === 'faculty' && (
            <>
              <div className="mb-6">
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty by name, email, department, code..." className="w-full max-w-md px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/50" />
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                {loading ? <div className="text-center text-white py-12">Loading...</div> :
                 facultyList.length === 0 ? <div className="text-center text-white/60 py-12">No faculty found</div> :
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/10"><th className="text-left p-4 text-blue-200 font-medium">Name</th><th className="text-left p-4 text-blue-200 font-medium">Code</th><th className="text-left p-4 text-blue-200 font-medium">Email</th><th className="text-left p-4 text-blue-200 font-medium">Department</th><th className="text-left p-4 text-blue-200 font-medium">Designation</th><th className="text-left p-4 text-blue-200 font-medium">Status</th><th className="text-left p-4 text-blue-200 font-medium">Actions</th></tr></thead>
                      <tbody>
                        {facultyList.map(faculty => (
                          <tr key={faculty._id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4 text-white">
                              <button onClick={() => viewFacultyProfile(faculty)} className="hover:text-blue-300 transition text-left flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs overflow-hidden">{faculty.profilePhoto ? <img src={faculty.profilePhoto} alt="" className="w-full h-full object-cover" /> : '👤'}</div>
                                {faculty.firstName} {faculty.lastName}
                              </button>
                            </td>
                            <td className="p-4 text-white/80 font-mono">{faculty.facultyCode}</td>
                            <td className="p-4 text-white/80">{faculty.email}</td>
                            <td className="p-4 text-white/80">{faculty.department?.split(' - ')[0]}</td>
                            <td className="p-4 text-white/80">{faculty.designation}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${faculty.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{faculty.status}</span></td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button onClick={() => viewFacultyProfile(faculty)} className="px-3 py-1 text-xs text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-500/20 transition">👁️ View</button>
                                <button onClick={() => handleRemoveFaculty(faculty._id, `${faculty.firstName} ${faculty.lastName}`)} className="px-3 py-1 text-xs text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/20 transition">🗑️ Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                }
              </div>
            </>
          )}

          {/* ANNOUNCEMENTS */}
          {activeMenu === 'announcements' && (
            <div className="space-y-4 max-w-3xl">
              {announcements.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/10"><span className="text-6xl">📢</span><p className="text-white/60 mt-4">No announcements yet</p><button onClick={() => setShowAnnouncementModal(true)} className="mt-4 px-6 py-2 text-sm text-white bg-white/10 rounded-xl hover:bg-white/20 transition">Create First Announcement</button></div>
              ) : announcements.map((ann: any) => (
                <div key={ann._id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${ann.priority === 'high' ? 'bg-red-500/20 text-red-300' : ann.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>{ann.priority === 'high' ? '🔴 High' : ann.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}</span>
                      <span className="text-white/40 text-xs">{ann.broadcastType === 'all' ? '📢 All Faculty' : ann.broadcastType === 'department' ? `🏛️ ${ann.targetDepartments?.length || 0} Dept(s)` : '👤 Specific Faculty'}</span>
                    </div>
                    <span className="text-white/40 text-xs">{new Date(ann.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <h4 className="text-white font-semibold text-lg mb-2">{ann.title}</h4>
                  <p className="text-white/70">{ann.message}</p>
                  {ann.broadcastType === 'department' && ann.targetDepartments?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">{ann.targetDepartments.map((dept: string) => <span key={dept} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/50">{dept.split(' - ')[0]}</span>)}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeMenu === 'messages' && (
            <div className="space-y-4 max-w-3xl">
              {recentMessages.map(msg => (
                <div key={msg.id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start justify-between mb-2"><div><h3 className="text-white font-semibold">{msg.from}</h3><p className="text-blue-300 text-sm">{msg.department}</p></div><span className="text-white/40 text-sm">{msg.time}</span></div>
                  <p className="text-white/70">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FACULTY PROFILE MODAL */}
      {showFacultyProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowFacultyProfile(null)}>
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 lg:p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Faculty Profile</h2>
                <button onClick={() => setShowFacultyProfile(null)} className="text-white/60 hover:text-white text-2xl">×</button>
              </div>

              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl overflow-hidden">
                  {showFacultyProfile.profilePhoto ? <img src={showFacultyProfile.profilePhoto} alt="" className="w-full h-full object-cover" /> : '👤'}
                </div>
                <h3 className="text-2xl font-bold text-white">{showFacultyProfile.firstName} {showFacultyProfile.lastName}</h3>
                <p className="text-blue-200">{showFacultyProfile.designation}</p>
                <p className="text-blue-300 text-sm">{showFacultyProfile.department}</p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                {[{ label: '📧 Email', value: showFacultyProfile.email },{ label: '📱 Phone', value: showFacultyProfile.phone || 'N/A' },{ label: '🔢 Code', value: showFacultyProfile.facultyCode },{ label: '🎯 Specialization', value: showFacultyProfile.specialization || 'N/A' },{ label: '📊 Status', value: showFacultyProfile.status },{ label: '📜 Certificates', value: `${showFacultyProfile.qualifications?.length || 0}` }].map(item => (
                  <div key={item.label} className="bg-white/5 rounded-xl p-3"><p className="text-blue-200/70 text-xs mb-1">{item.label}</p><p className="text-white text-sm font-medium">{item.value}</p></div>
                ))}
              </div>

              {/* Certificates Gallery */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">📜 Certificates ({showFacultyProfile.qualifications?.length || 0})</h4>
                {showFacultyProfile.qualifications && showFacultyProfile.qualifications.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {showFacultyProfile.qualifications.map((cert: any, i: number) => (
                      <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition cursor-pointer" onClick={() => setViewCertificate(cert)}>
                        <div className="h-36 bg-gray-900 flex items-center justify-center">
                          {cert.certificateFile && cert.certificateFile.startsWith('data:image') ? <img src={cert.certificateFile} alt="" className="w-full h-full object-contain p-2" /> :
                           cert.certificateFile && cert.certificateFile.includes('pdf') ? <div className="text-white/60 text-center"><span className="text-3xl">📄</span><p className="text-xs mt-1">PDF</p></div> :
                           <span className="text-3xl">{cert.certificateType === 'Degree' ? '🎓' : cert.certificateType === 'Conference' ? '🎤' : cert.certificateType === 'Workshop' ? '🔧' : '📜'}</span>}
                        </div>
                        <div className="p-3">
                          <p className="text-white text-xs font-medium line-clamp-2">{cert.title || 'Untitled'}</p>
                          <p className="text-blue-200/60 text-xs mt-1">{cert.issuedBy}</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-2 ${cert.certificateType === 'Degree' ? 'bg-yellow-500/20 text-yellow-300' : cert.certificateType === 'Conference' ? 'bg-blue-500/20 text-blue-300' : cert.certificateType === 'Workshop' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>{cert.certificateType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-white/40 text-sm py-8 text-center">No certificates uploaded</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW CERTIFICATE MODAL */}
      {viewCertificate && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setViewCertificate(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-900 relative">
              {viewCertificate.certificateFile?.startsWith('data:image') ? <img src={viewCertificate.certificateFile} alt="" className="w-full max-h-[70vh] object-contain" /> :
               viewCertificate.certificateFile?.includes('pdf') ? <iframe src={viewCertificate.certificateFile} className="w-full h-[70vh]" /> :
               <div className="flex items-center justify-center min-h-[30vh] text-white/40"><span className="text-6xl">📜</span></div>}
              <button onClick={() => setViewCertificate(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">×</button>
            </div>
            <div className="p-6">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewCertificate.certificateType === 'Degree' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{viewCertificate.certificateType || 'Certificate'}</span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">{viewCertificate.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {viewCertificate.issuedBy && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 text-xs">Issued By</p><p className="text-gray-900 font-medium text-sm">{viewCertificate.issuedBy}</p></div>}
                {viewCertificate.year && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 text-xs">Year</p><p className="text-gray-900 font-medium text-sm">{viewCertificate.year}</p></div>}
                {viewCertificate.eventName && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 text-xs">Event</p><p className="text-gray-900 font-medium text-sm">{viewCertificate.eventName}</p></div>}
                {viewCertificate.place && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 text-xs">Place</p><p className="text-gray-900 font-medium text-sm">{viewCertificate.place}</p></div>}
                {viewCertificate.duration && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-500 text-xs">Duration</p><p className="text-gray-900 font-medium text-sm">{viewCertificate.duration}</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6"><span className="text-3xl">📧</span><div><h2 className="text-2xl font-bold text-white">Invite Faculty</h2><p className="text-blue-200 text-sm">Send login credentials via email</p></div></div>
            <form onSubmit={handleAddFaculty} className="space-y-5">
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">FULL NAME</label><input type="text" placeholder="e.g. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required /></div>
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">FACULTY CODE</label><input type="text" placeholder="e.g. CS101" value={form.facultyCode} onChange={(e) => setForm({ ...form, facultyCode: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none uppercase" required /><p className="text-blue-200/50 text-xs mt-1">Username: firstname+code</p></div>
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">EMAIL ADDRESS</label><input type="email" placeholder="faculty@jacsice.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required /></div>
              <div className="bg-white/10 rounded-xl p-4"><p className="text-white/80 text-xs font-medium mb-2">📋 Details:</p><ul className="text-white/60 text-xs space-y-1"><li>• Auto-generated password</li><li>• Username based on name + code</li><li>• Email with login instructions</li></ul></div>
              <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowAddModal(false); setForm({ name: '', facultyCode: '', email: '' }); }} className="flex-1 px-4 py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10">Cancel</button><button type="submit" className="flex-1 px-4 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100">Send Invitation</button></div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS POPUP */}
      {credentialsPopup.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
            <div className="text-center mb-6"><div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-4xl">✅</span></div><h2 className="text-2xl font-bold text-white">Faculty Invited!</h2></div>
            <div className="bg-white/10 rounded-xl p-5 border border-white/20 mb-6 space-y-3">
              <div className="flex justify-between"><span className="text-blue-200 text-sm">Name:</span><span className="text-white text-sm">{credentialsPopup.name}</span></div>
              <div className="flex justify-between"><span className="text-blue-200 text-sm">Email:</span><span className="text-white text-sm">{credentialsPopup.email}</span></div>
              <div className="flex justify-between"><span className="text-blue-200 text-sm">Username:</span><span className="text-green-300 font-mono font-bold text-sm bg-green-500/20 px-2 py-0.5 rounded">{credentialsPopup.username}</span></div>
              <div className="flex justify-between"><span className="text-blue-200 text-sm">Password:</span><span className="text-yellow-300 font-mono font-bold text-sm bg-yellow-500/20 px-2 py-0.5 rounded">{credentialsPopup.password}</span></div>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(`Name: ${credentialsPopup.name}\nEmail: ${credentialsPopup.email}\nUsername: ${credentialsPopup.username}\nPassword: ${credentialsPopup.password}\nLogin: ${credentialsPopup.loginUrl}`); showNotification('📋 Copied!'); }} className="w-full mb-3 px-4 py-3 text-sm text-white bg-white/10 rounded-xl hover:bg-white/20">📋 Copy Credentials</button>
            <button onClick={() => setCredentialsPopup({ ...credentialsPopup, show: false })} className="w-full px-4 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100">Done</button>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6">📢 New Announcement</h2>
            <form onSubmit={handleAddAnnouncement} className="space-y-5">
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">TITLE</label><input type="text" placeholder="Title" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required /></div>
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">MESSAGE</label><textarea placeholder="Message..." value={announcementForm.message} onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })} rows={4} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none resize-none" required /></div>
              <div><label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">PRIORITY</label><select value={announcementForm.priority} onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as 'high' | 'medium' | 'low' })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none"><option value="high" className="text-gray-900">🔴 High</option><option value="medium" className="text-gray-900">🟡 Medium</option><option value="low" className="text-gray-900">🟢 Low</option></select></div>
              <div>
                <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">BROADCAST TO</label>
                <div className="space-y-2">
                  {[{ value: 'all', label: '📢 Broadcast to All', desc: 'All faculty' },{ value: 'department', label: '🏛️ Specific Department(s)', desc: 'Selected departments only' },{ value: 'specific', label: '👤 Specific Faculty', desc: 'Selected faculty only' }].map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition">
                      <input type="radio" name="broadcastType" value={opt.value} checked={announcementForm.broadcastType === opt.value} onChange={(e) => { setAnnouncementForm({ ...announcementForm, broadcastType: e.target.value as 'all' | 'department' | 'specific', targetDepartments: [] }); setSelectedFaculty([]); }} className="w-4 h-4" />
                      <div><span className="text-white text-sm font-medium">{opt.label}</span><p className="text-blue-200/60 text-xs">{opt.desc}</p></div>
                    </label>
                  ))}
                </div>
              </div>
              {announcementForm.broadcastType === 'department' && (
                <div>
                  <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">SELECT DEPARTMENTS</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {departments.map(dept => (
                      <label key={dept} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                        <input type="checkbox" checked={announcementForm.targetDepartments?.includes(dept)} onChange={(e) => { const d = e.target.checked ? [...(announcementForm.targetDepartments || []), dept] : announcementForm.targetDepartments.filter(x => x !== dept); setAnnouncementForm({ ...announcementForm, targetDepartments: d }); }} className="w-4 h-4 rounded" />
                        <span className="text-white text-sm">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {announcementForm.broadcastType === 'specific' && (
                <div>
                  <label className="block text-xs text-blue-100 tracking-wide mb-2 font-medium">SELECT FACULTY</label>
                  <div className="relative">
                    <input type="text" placeholder="Search faculty..." value={facultySearch} onChange={(e) => searchFacultyForAnnouncement(e.target.value)} onFocus={() => facultySearchResults.length > 0 && setShowFacultyDropdown(true)} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" />
                    {showFacultyDropdown && facultySearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-xl shadow-2xl z-10 max-h-48 overflow-y-auto">
                        {facultySearchResults.filter(f => !selectedFaculty.find(sf => sf._id === f._id)).map(faculty => (
                          <button key={faculty._id} type="button" onClick={() => { toggleFacultySelection(faculty); setFacultySearch(''); setShowFacultyDropdown(false); }} className="w-full text-left px-4 py-3 hover:bg-white/10 transition flex items-center justify-between">
                            <div><p className="text-white text-sm font-medium">{faculty.firstName} {faculty.lastName}</p><p className="text-blue-300 text-xs">{faculty.department?.split(' - ')[0]} • {faculty.email}</p></div>
                            <span className="text-white/40 text-lg">+</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedFaculty.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-white/60 text-xs">{selectedFaculty.length} selected:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedFaculty.map(faculty => (
                          <div key={faculty._id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs text-white font-medium">{faculty.firstName?.[0]}{faculty.lastName?.[0]}</div>
                            <div><p className="text-white text-xs font-medium">{faculty.firstName} {faculty.lastName}</p><p className="text-blue-200/60 text-xs">{faculty.department?.split(' - ')[0]}</p></div>
                            <button type="button" onClick={() => removeSelectedFaculty(faculty._id)} className="ml-1 p-1 text-red-400 hover:bg-red-500/20 rounded transition">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-white/10 rounded-xl p-4"><p className="text-white/60 text-xs mb-1">Preview:</p><p className="text-white text-sm">{announcementForm.broadcastType === 'all' ? '📢 All faculty' : announcementForm.broadcastType === 'department' ? `🏛️ ${announcementForm.targetDepartments?.length || 0} department(s)` : `👤 ${selectedFaculty.length} faculty member(s)`}</p></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAnnouncementModal(false)} className="flex-1 px-4 py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10">Cancel</button><button type="submit" className="flex-1 px-4 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100">📢 Post</button></div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Reset Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <input type="password" placeholder="Current Password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required />
              <input type="password" placeholder="New Password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required />
              <input type="password" placeholder="Confirm New Password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none" required />
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10">Cancel</button><button type="submit" className="flex-1 px-4 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100">Update</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}