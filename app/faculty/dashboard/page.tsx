// app/faculty/dashboard/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FacultyProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  specialization: string;
  profilePhoto: string;
  phone: string;
  facultyCode: string;
  qualifications: any[];
  publications: any[];
  status: string;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('network');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchResults, setSearchResults] = useState<FacultyProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Profile state
  const [myProfile, setMyProfile] = useState<FacultyProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<FacultyProfile | null>(null);

  // Certificate state
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [viewCertificate, setViewCertificate] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [certTypeFilter, setCertTypeFilter] = useState('All');

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // Message/Chat state
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contactsSearch, setContactsSearch] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    certId: string;
    certTitle: string;
  }>({ show: false, certId: '', certTitle: '' });

  const departments = [
    'CSE - Computer Science and Engineering',
    'MECH - Mechanical Engineering',
    'ECE - Electronics and Communication Engineering',
    'AIDS - Artificial Intelligence and Data Science',
    'IT - Information Technology',
    'MBA - Master of Business Administration',
    'S&H - Science and Humanities',
  ];

  const certTypes = ['All', 'Degree', 'Conference', 'Workshop', 'FDP', 'Seminar', 'Online Course', 'Training', 'Other'];

  const menuItems = [
    { id: 'network', label: 'Faculty Network', icon: '🌐' },
    { id: 'certificates', label: 'My Certificates', icon: '📜' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'upload', label: 'Upload Certificate', icon: '📤' },
  ];

  // Initialize
  useEffect(() => {
    const auth = localStorage.getItem('facultyAuth');
    const storedToken = localStorage.getItem('facultyToken');
    const storedUser = localStorage.getItem('facultyUser');

    if (auth !== 'true' || !storedToken) {
      router.replace('/login/faculty');
      return;
    }

    setToken(storedToken || '');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
    loadMyProfile(storedToken || '');
    setLoading(false);
  }, [router]);

  // Notification helper
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Load my profile
  const loadMyProfile = async (authToken?: string) => {
    const t = authToken || token;
    if (!t) return;
    try {
      const res = await fetch('/api/faculty/profile-check', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.faculty) setMyProfile(data.faculty);
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  // Load my certificates
  const loadMyCertificates = async () => {
    try {
      const res = await fetch('/api/faculty/certificates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMyCertificates(data.certificates || []);
    } catch (error) {
      console.error('Certificates load error:', error);
    }
  };

  // Load announcements
  const loadAnnouncements = async () => {
    try {
      const res = await fetch('/api/faculty/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Announcements load error:', error);
    }
  };

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/faculty/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Conversations error:', error);
    }
  };

  // Load chat with specific user
  const loadChat = async (userId: string) => {
    setMessagesLoading(true);
    setActiveChat(userId);
    try {
      const res = await fetch(`/api/faculty/messages?contactId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChatMessages(data.messages || []);
      
      // Find active chat user info
      const conv = conversations.find(c => c.userId === userId);
      if (conv) {
        setActiveChatUser(conv.user);
      }
      
      setTimeout(() => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Chat load error:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Search contacts for new chat
  const searchContacts = async (query: string) => {
    setContactsSearch(query);
    if (query.length < 2) {
      setContacts([]);
      return;
    }
    try {
      const res = await fetch(`/api/faculty/contacts?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Contacts error:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const messageText = newMessage.trim();
    setNewMessage('');
    
    try {
      const res = await fetch('/api/faculty/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId: activeChat, message: messageText }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setChatMessages(prev => [...prev, data.data]);
        loadConversations();
        setTimeout(() => {
          if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Send error:', error);
      showNotification('❌ Failed to send message');
    }
  };

  // Start new chat
  const startNewChat = (contact: any) => {
    setActiveChat(contact.userId);
    setActiveChatUser(contact);
    setShowNewChat(false);
    setContactsSearch('');
    setContacts([]);
    loadChat(contact.userId);
    loadConversations();
  };

  // Poll for new messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'messages') {
      loadConversations();
      interval = setInterval(() => {
        loadConversations();
        if (activeChat) loadChat(activeChat);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, activeChat]);

  // Search faculty
  const searchFaculty = useCallback(async () => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (departmentFilter) params.append('department', departmentFilter);
      const res = await fetch(`/api/faculty/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery, departmentFilter, token]);

  useEffect(() => {
    if (activeTab === 'network') {
      searchFaculty();
    }
  }, [activeTab, departmentFilter, searchFaculty]);

  // Upload certificate
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setExtractedData(null);

    const formData = new FormData();
    formData.append('certificate', file);

    try {
      const res = await fetch('/api/faculty/certificates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        showNotification('✅ Certificate uploaded & analyzed!');
        setExtractedData(data.extracted);
        loadMyCertificates();
        loadMyProfile(token);
      } else {
        showNotification('❌ ' + (data.error || 'Upload failed'));
      }
    } catch {
      showNotification('❌ Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (certId: string) => {
    try {
      const res = await fetch(`/api/faculty/certificates/${certId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('✅ Certificate removed');
        loadMyCertificates();
        loadMyProfile(token);
        setDeleteConfirm({ show: false, certId: '', certTitle: '' });
      } else {
        showNotification('❌ ' + (data.error || 'Failed'));
      }
    } catch {
      showNotification('❌ Failed');
    }
  };

  const confirmDelete = (certId: string, certTitle: string) => {
    setDeleteConfirm({ show: true, certId, certTitle });
  };

  // Download Excel
  const downloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (departmentFilter) params.append('department', departmentFilter);
      const res = await fetch(`/api/faculty/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `JACSICE-Faculty-Data-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification('📥 Excel downloaded!');
    } catch {
      showNotification('❌ Download failed');
    }
  };

  const viewProfile = (faculty: FacultyProfile) => {
    setSelectedProfile(faculty);
    setActiveTab('profile');
  };

  const filteredCertificates = certTypeFilter === 'All'
    ? myCertificates
    : certTypeFilter === 'Other'
      ? myCertificates.filter((c: any) => !['Degree', 'Conference', 'Workshop', 'FDP', 'Seminar', 'Online Course', 'Training'].includes(c.certificateType))
      : myCertificates.filter((c: any) => c.certificateType === certTypeFilter);

  const handleLogout = () => {
    localStorage.removeItem('facultyAuth');
    localStorage.removeItem('facultyToken');
    localStorage.removeItem('facultyUser');
    document.cookie = 'facultyAuth=; path=/; max-age=0';
    router.replace('/');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading dashboard...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-white text-gray-900 px-6 py-3 rounded-xl shadow-2xl text-sm font-medium animate-bounce">
          {notification}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-black/20 backdrop-blur-md border-r border-white/10 transition-all duration-300 flex flex-col flex-shrink-0`}>
        <div className="p-6 border-b border-white/10">
          <h1 className={`text-white font-bold tracking-wider ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}>
            {sidebarOpen ? 'JACSICE' : 'J'}
          </h1>
          {sidebarOpen && <p className="text-blue-200 text-xs mt-1">Faculty Portal</p>}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-3 mt-3 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition text-sm"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'certificates') loadMyCertificates();
                if (item.id === 'announcements') loadAnnouncements();
                if (item.id === 'messages') loadConversations();
                if (item.id === 'profile') loadMyProfile();
                if (item.id === 'upload') setShowUploadModal(true);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm ${
                activeTab === item.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-red-500/20 hover:text-red-300 transition text-sm"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {activeTab === 'network' && '🌐 Faculty Network'}
                {activeTab === 'certificates' && '📜 My Certificates'}
                {activeTab === 'announcements' && '📢 Announcements'}
                {activeTab === 'messages' && '💬 Messages'}
                {activeTab === 'profile' && '👤 Profile'}
              </h2>
              <p className="text-blue-200 text-sm mt-1">Welcome, {user?.name?.split(' ')[0]}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={downloadExcel}
                className="px-4 py-2 text-sm text-white bg-green-500/20 border border-green-400/30 rounded-xl hover:bg-green-500/30 transition flex items-center gap-2"
              >
                <span>📥</span> Export Excel
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition flex items-center gap-2"
              >
                <span>📤</span> Upload Certificate
              </button>
            </div>
          </div>

          {/* ============ NETWORK TAB ============ */}
          {activeTab === 'network' && (
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchFaculty()}
                    placeholder="Search by name, email, department..."
                    className="w-full pl-12 pr-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:border-white/50"
                  />
                </div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none"
                >
                  <option value="" className="text-gray-900">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d} className="text-gray-900">{d.split(' - ')[0]}</option>
                  ))}
                </select>
                <button
                  onClick={searchFaculty}
                  className="px-6 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition"
                >
                  Search
                </button>
              </div>

              {searchLoading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/60 text-sm mt-4">Searching...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                  <span className="text-6xl">🔍</span>
                  <p className="text-white/60 mt-4">Search for faculty members</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((faculty) => (
                      <div
                        key={faculty._id}
                        onClick={() => viewProfile(faculty)}
                        className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                            {faculty.profilePhoto ? (
                              <img src={faculty.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : '👤'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{faculty.firstName} {faculty.lastName}</h3>
                            <p className="text-blue-200 text-sm truncate">{faculty.designation}</p>
                            <p className="text-blue-300 text-xs truncate">{faculty.department?.split(' - ')[0]}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-white/40 text-xs bg-white/5 px-2 py-0.5 rounded">📜 {faculty.qualifications?.length || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/40 text-xs text-center mt-6">Showing {searchResults.length} faculty</p>
                </>
              )}
            </>
          )}

          {/* ============ MESSAGES TAB ============ */}
          {activeTab === 'messages' && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                <div className="flex h-full">
                  {/* Conversations List */}
                  <div className="w-80 border-r border-white/10 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-white font-semibold">💬 Messages</h3>
                      <button
                        onClick={() => { setShowNewChat(true); searchContacts(''); }}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition text-sm"
                      >
                        + New Chat
                      </button>
                    </div>

                    {/* New Chat Search */}
                    {showNewChat && (
                      <div className="p-3 border-b border-white/10">
                        <input
                          type="text"
                          placeholder="Search faculty..."
                          value={contactsSearch}
                          onChange={(e) => searchContacts(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none"
                          autoFocus
                        />
                        {contacts.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                            {contacts.map((contact: any) => (
                              <button
                                key={contact.userId}
                                onClick={() => startNewChat(contact)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition"
                              >
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-sm overflow-hidden">
                                  {contact.profilePhoto ? (
                                    <img src={contact.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                  ) : '👤'}
                                </div>
                                <div className="text-left">
                                  <p className="text-white text-sm">{contact.name}</p>
                                  <p className="text-blue-200/60 text-xs">{contact.department?.split(' - ')[0]}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conversations */}
                    <div className="flex-1 overflow-y-auto">
                      {conversations.length === 0 ? (
                        <div className="text-center py-12">
                          <span className="text-4xl">💬</span>
                          <p className="text-white/40 text-sm mt-2">No conversations yet</p>
                          <button onClick={() => setShowNewChat(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300">
                            Start a chat
                          </button>
                        </div>
                      ) : (
                        conversations.map((conv: any) => (
                          <button
                            key={conv.userId}
                            onClick={() => { loadChat(conv.userId); setShowNewChat(false); }}
                            className={`w-full flex items-center gap-3 p-4 hover:bg-white/10 transition border-b border-white/5 text-left ${
                              activeChat === conv.userId ? 'bg-white/10' : ''
                            }`}
                          >
                            <div className="relative">
                              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg overflow-hidden">
                                {conv.user?.profilePhoto ? (
                                  <img src={conv.user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                                ) : '👤'}
                              </div>
                              {conv.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                                  {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="text-white text-sm font-medium truncate">{conv.user?.name}</p>
                                <span className="text-white/40 text-xs">
                                  {new Date(conv.lastMessageDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <p className="text-white/50 text-xs truncate">{conv.lastMessage}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col">
                    {activeChat ? (
                      <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg overflow-hidden">
                            {activeChatUser?.profilePhoto ? (
                              <img src={activeChatUser.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : '👤'}
                          </div>
                          <div>
                            <p className="text-white font-medium">{activeChatUser?.name || 'Chat'}</p>
                            <p className="text-blue-200/60 text-xs">{activeChatUser?.department?.split(' - ')[0] || ''}</p>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {messagesLoading ? (
                            <div className="text-center py-8">
                              <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            </div>
                          ) : chatMessages.length === 0 ? (
                            <div className="text-center py-12 text-white/40">
                              <span className="text-4xl">💬</span>
                              <p className="mt-2">Start the conversation!</p>
                            </div>
                          ) : (
                            chatMessages.map((msg: any, i: number) => {
                              const isMe = (msg.sender?._id === user?.id) || (msg.sender === user?.id);
                              return (
                                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                    isMe ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white'
                                  }`}>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-white/40'}`}>
                                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-white/10">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                              placeholder="Type a message..."
                              className="flex-1 px-4 py-3 text-sm bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none"
                            />
                            <button
                              onClick={sendMessage}
                              disabled={!newMessage.trim()}
                              className="px-5 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition disabled:opacity-50 text-sm font-medium"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-white/40">
                        <div className="text-center">
                          <span className="text-6xl">💬</span>
                          <p className="mt-4 text-lg">Select a conversation</p>
                          <p className="text-sm mt-1">or start a new chat</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ CERTIFICATES TAB ============ */}
          {activeTab === 'certificates' && (
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">📜 My Certificates</h3>
                  <p className="text-blue-200/70 text-sm mt-1">{myCertificates.length} certificates</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={loadMyCertificates} className="px-4 py-2 text-sm text-white bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition">
                    🔄 Refresh
                  </button>
                  <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition">
                    + Add
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {certTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setCertTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${certTypeFilter === type ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total', value: myCertificates.length, icon: '📜', color: 'from-blue-400/20 to-blue-500/20' },
                  { label: 'Degrees', value: myCertificates.filter((c: any) => c.certificateType === 'Degree').length, icon: '🎓', color: 'from-yellow-400/20 to-yellow-500/20' },
                  { label: 'Workshops', value: myCertificates.filter((c: any) => c.certificateType === 'Workshop').length, icon: '🔧', color: 'from-green-400/20 to-green-500/20' },
                  { label: 'Conferences', value: myCertificates.filter((c: any) => c.certificateType === 'Conference').length, icon: '🎤', color: 'from-purple-400/20 to-purple-500/20' },
                ].map((stat) => (
                  <div key={stat.label} className={`bg-gradient-to-br ${stat.color} backdrop-blur-md rounded-xl p-4 border border-white/10`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/70">{stat.label}</span>
                      <span className="text-lg">{stat.icon}</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {filteredCertificates.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 border border-white/10 text-center">
                  <span className="text-7xl">📜</span>
                  <h3 className="text-white text-lg font-medium mt-4">No Certificates Yet</h3>
                  <button onClick={() => setShowUploadModal(true)} className="mt-6 px-6 py-3 text-sm font-medium text-indigo-600 bg-white rounded-xl hover:bg-gray-100 transition">
                    📤 Upload Your First Certificate
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCertificates.map((cert: any, index: number) => (
                    <div key={cert._id || index} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition group">
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="sm:w-40 h-40 flex-shrink-0">
                            {cert.certificateFile ? (
                              <div className="w-full h-full rounded-xl overflow-hidden cursor-pointer relative border-2 border-white/10 hover:border-white/30 transition">
                                {cert.certificateFile.startsWith('data:image') ? (
                                  <img src={cert.certificateFile} alt="" className="w-full h-full object-contain bg-gray-900" onClick={() => setViewCertificate(cert)} />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex flex-col items-center justify-center" onClick={() => setViewCertificate(cert)}>
                                    <span className="text-4xl mb-2">📄</span>
                                    <span className="text-white/60 text-xs">PDF</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-xl flex items-center justify-center">
                                <span className="text-4xl">📜</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cert.certificateType === 'Degree' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60'
                              }`}>{cert.certificateType || 'Certificate'}</span>
                              {cert.year && <span className="text-white/40 text-xs">📅 {cert.year}</span>}
                            </div>
                            <h4 className="text-white font-semibold">{cert.title || 'Untitled'}</h4>
                            {cert.issuedBy && <p className="text-blue-200 text-sm mt-1">🏛️ {cert.issuedBy}</p>}
                            <div className="flex gap-2 mt-3">
                              {cert.certificateFile && (
                                <>
                                  <button onClick={() => setViewCertificate(cert)} className="px-3 py-1.5 text-xs text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition">👁️ View</button>
                                  <a href={cert.certificateFile} download={cert.certificateFileName || 'certificate'} className="px-3 py-1.5 text-xs text-green-400 bg-green-500/10 rounded-lg hover:bg-green-500/20 transition">📥 Download</a>
                                </>
                              )}
                              <button onClick={() => confirmDelete(cert._id, cert.title)} className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition">🗑️ Delete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ ANNOUNCEMENTS TAB ============ */}
          {activeTab === 'announcements' && (
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">📢 Announcements</h3>
                <button onClick={loadAnnouncements} className="px-4 py-2 text-sm text-white bg-white/10 rounded-xl hover:bg-white/20 transition">🔄 Refresh</button>
              </div>
              {announcements.length === 0 ? (
                <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/10">
                  <span className="text-6xl">📢</span>
                  <p className="text-white/60 mt-4">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann: any) => (
                    <div key={ann._id} className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                      <div className="flex items-start justify-between mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ann.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                          ann.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {ann.priority === 'high' ? '🔴 High' : ann.priority === 'medium' ? '🟡 Medium' : '🟢 Low'}
                        </span>
                        <span className="text-white/40 text-xs">{new Date(ann.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                      <h4 className="text-white font-semibold text-lg mb-2">{ann.title}</h4>
                      <p className="text-white/70">{ann.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============ PROFILE TAB ============ */}
          {activeTab === 'profile' && (selectedProfile || myProfile) && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
                {selectedProfile && (
                  <button onClick={() => { setSelectedProfile(null); setActiveTab('network'); }} className="text-blue-300 text-sm mb-6 hover:text-white transition">
                    ← Back to Network
                  </button>
                )}
                <div className="text-center mb-8">
                  <div className="w-28 h-28 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl overflow-hidden">
                    {(selectedProfile || myProfile)?.profilePhoto ? (
                      <img src={(selectedProfile || myProfile)?.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : '👤'}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{(selectedProfile || myProfile)?.firstName} {(selectedProfile || myProfile)?.lastName}</h2>
                  <p className="text-blue-200 text-lg">{(selectedProfile || myProfile)?.designation}</p>
                  <p className="text-blue-300">{(selectedProfile || myProfile)?.department}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: '📧 Email', value: (selectedProfile || myProfile)?.email },
                    { label: '📱 Phone', value: (selectedProfile || myProfile)?.phone || 'N/A' },
                    { label: '🔢 Code', value: (selectedProfile || myProfile)?.facultyCode },
                    { label: '🎯 Specialization', value: (selectedProfile || myProfile)?.specialization || 'N/A' },
                    { label: '📜 Certificates', value: `${(selectedProfile || myProfile)?.qualifications?.length || 0}` },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-xl p-4">
                      <p className="text-blue-200/70 text-xs mb-1">{item.label}</p>
                      <p className="text-white text-sm font-medium">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4">📜 Certificates Gallery</h3>
                {(selectedProfile || myProfile)?.qualifications && ((selectedProfile || myProfile)?.qualifications?.length ?? 0) > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(selectedProfile || myProfile)?.qualifications?.map((cert: any, i: number) => (
                      <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition cursor-pointer" onClick={() => setViewCertificate(cert)}>
                        <div className="h-40 bg-gray-900 flex items-center justify-center">
                          {cert.certificateFile && cert.certificateFile.startsWith('data:image') ? (
                            <img src={cert.certificateFile} alt="" className="w-full h-full object-contain p-2" />
                          ) : (
                            <span className="text-4xl">📜</span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-white text-xs font-medium truncate">{cert.title || 'Untitled'}</p>
                          <p className="text-blue-200/60 text-xs mt-1">{cert.issuedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm py-8 text-center">No certificates uploaded</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ UPLOAD MODAL ============ */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2">Upload Certificate</h2>
            <p className="text-blue-200 text-sm mb-6">AI will auto-extract details.</p>
            <div className="space-y-4">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 transition">
                {uploading ? (
                  <div>
                    <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-white text-sm">Analyzing...</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-5xl">📤</span>
                    <p className="text-white mt-3">Click to select file</p>
                    <p className="text-blue-200/60 text-xs mt-1">PDF, JPG, PNG (Max 10MB)</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertificateUpload} className="hidden" />
              </div>
              {extractedData && (
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-400/20">
                  <h4 className="text-green-300 text-sm font-medium mb-3">🤖 AI Extracted:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-green-200/60">Type:</span><p className="text-green-200">{extractedData.certificateType || 'N/A'}</p></div>
                    <div><span className="text-green-200/60">Year:</span><p className="text-green-200">{extractedData.year || 'N/A'}</p></div>
                    <div className="col-span-2"><span className="text-green-200/60">Title:</span><p className="text-green-200">{extractedData.title || 'N/A'}</p></div>
                    <div className="col-span-2"><span className="text-green-200/60">Issued By:</span><p className="text-green-200">{extractedData.issuedBy || 'N/A'}</p></div>
                  </div>
                </div>
              )}
              <button onClick={() => { setShowUploadModal(false); setExtractedData(null); }} className="w-full px-4 py-3 text-sm text-white border border-white/30 rounded-xl hover:bg-white/10 transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ VIEW CERTIFICATE MODAL ============ */}
      {viewCertificate && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setViewCertificate(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-900 relative">
              {viewCertificate.certificateFile?.startsWith('data:image') ? (
                <img src={viewCertificate.certificateFile} alt="" className="w-full max-h-[70vh] object-contain" />
              ) : (
                <div className="flex items-center justify-center min-h-[30vh] text-white/40">
                  <span className="text-6xl">📜</span>
                </div>
              )}
              <button onClick={() => setViewCertificate(null)} className="absolute top-4 right-4 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl">×</button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">{viewCertificate.title}</h3>
              {viewCertificate.certificateFile && (
                <a href={viewCertificate.certificateFile} download={viewCertificate.certificateFileName || 'certificate'} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm mt-4">📥 Download</a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE CONFIRMATION MODAL ============ */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-white/10">
            <div className="text-center mb-6">
              <span className="text-4xl">⚠️</span>
              <h2 className="text-xl font-bold text-white mt-4">Delete Certificate?</h2>
              <p className="text-white/60 text-sm mt-2">&ldquo;{deleteConfirm.certTitle}&rdquo;</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({ show: false, certId: '', certTitle: '' })} className="flex-1 px-4 py-3 text-sm text-white border border-white/30 rounded-xl">Cancel</button>
              <button onClick={() => handleDeleteCertificate(deleteConfirm.certId)} className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 rounded-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}