import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, BookMarked, Calendar, CheckCircle, ChartLine, ClipboardList, Clock, Crown, Download, Eye, FileText, Filter, GraduationCap, Mail, Plus, Search, Sparkles, Star, Stethoscope, UserPlus, Users, Zap 
} from 'lucide-react';
// ...existing imports...
import { getDashboardSummary, getDashboardRecentSubmissions, reviewDoctorSubmission, downloadSubmissionFile, getStudents, getAssignments, getMe, getAnnouncements } from "../../lib/api";
import SubmissionModal from "./SubmissionModal";
import ProfileDropdown from "../../components/ProfileDropdown";
import SubmissionReviewModal from "../../components/SubmissionReviewModal";

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/doctor/dashboard');
  };

  const [isLoading, setIsLoading] = useState(true);
  const [doctor, setDoctor] = useState({
    fullName: "",
    email: "",
    specialization: "",
  });
  const [stats, setStats] = useState({
    totalStudents: 0,
    teachingAssistants: 0,
    activeTasks: 0,
    pendingReviews: 0,
    acceptedSubmissions: 0,
    rejectedSubmissions: 0,
    averageGrade: 0,
    completionRate: 0,
    totalAssignments: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [isAnimated, setIsAnimated] = useState(false);
  const [modalSubmissionId, setModalSubmissionId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // messagesSent state inside the component
  const [messagesSent, setMessagesSent] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  
  // Submission review modal state
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<number | null>(null);

  // Handle submission review modal save
  const handleReviewSaved = (updatedSubmission: any) => {
    setRecentSubmissions(prev => 
      prev.map(s => 
        s.id === updatedSubmission.id 
          ? { ...s, status: updatedSubmission.status, grade: updatedSubmission.grade?.toString() || null }
          : s
      )
    );
    setAllSubmissions(prev => 
      prev.map(s => 
        s.id === updatedSubmission.id 
          ? { ...s, status: updatedSubmission.status, grade: updatedSubmission.grade?.toString() || null }
          : s
      )
    );
  };

  // Debug logging to see what data we have
  console.log('All submissions for counting:', allSubmissions);
  console.log('Submissions with grades:', allSubmissions.filter(s => (s.grade != null && s.grade !== '') || (s.grade100 != null && s.grade100 !== '') || (s.feedback_grade != null && s.feedback_grade !== '')));
  console.log('Submissions with feedback:', allSubmissions.filter(s => (s.feedback && String(s.feedback).trim().length > 0) || (s.feedback_text && String(s.feedback_text).trim().length > 0)));


  const loadDashboardData = async () => {
    try {
      // restore persisted messages count (so it survives navigation/refresh)
      try {
        // Prefer the locally persisted counter so increments survive navigation.
        const raw = localStorage.getItem('messagesSent');
        if (raw != null) {
          const savedMessages = parseInt(raw || '0', 10);
          if (!Number.isNaN(savedMessages)) setMessagesSent(savedMessages);
        } else {
          // localStorage empty -> try a lightweight server fallback (count recent announcements)
          try {
            const anns = await getAnnouncements({ limit: 100 }).catch(() => ({ data: null } as any));
            if (anns && Array.isArray(anns.data)) {
              // use total announcements as a reasonable default for the counter
              setMessagesSent(anns.data.length || 0);
              try { localStorage.setItem('messagesSent', String(anns.data.length || 0)); } catch (_) {}
            }
          } catch (_) {
            // swallow server fallback errors
          }
        }
      } catch {
        // ignore localStorage errors
      }
      // Fetch doctor info from backend
      try {
        const meResp = await getMe().catch(() => null);
        if (meResp && meResp.data) {
          const user = meResp.data as any;
          let name = user?.doctor_name || user?.full_name || user?.name || user?.username;
          if (!name || name === "456" || name === user?.id?.toString()) {
            name = `Dr. ${user?.username || "Doctor"}`;
          }
          setDoctor((d) => ({ ...d, fullName: name, email: user?.email || d.email }));
        }
      } catch (err) {
        console.error("Failed to load /auth/me", err);
      }

      // load dashboard summary (role-aware)
      const { data: summary } = await getDashboardSummary().catch(() => ({ data: null } as any));
      if (summary && summary.role === "doctor") {
        const cards = summary.cards || {};
        const k = cards.my_submissions || {};
        const grades = cards.grades || {};
        setStats((s) => ({
          ...s,
          pendingReviews: Number(k.pending || 0),
          acceptedSubmissions: Number((k.by_status && k.by_status["Accepted"]) || 0),
          averageGrade: typeof grades.average === "number" ? Number(grades.average.toFixed(1)) : 0,
        }));
      }

      // Load recent submissions for display (limit 10)
      const { data: recent } = await getDashboardRecentSubmissions({ mine_only: true, limit: 10 }).catch(() => ({ data: null } as any));
      if (recent && Array.isArray(recent.items)) {
        const mapped = recent.items.map((r: any) => {
          const numericId = r.id != null ? Number(r.id) : null;
          if (numericId == null) console.warn('Recent submission missing id', r);
          return {
            id: numericId,
            title: r.title || "Assignment",
            student: r.studentUsername || `#${r.studentId}`,
            course: r.course || "",
            submittedAt: r.submittedAt,
            status: String(r.status || "Pending").toLowerCase().replace("needsrevision","needs_revision"),
            grade: r.grade ?? null,
            grade100: r.grade != null ? Math.round(Number(r.grade) * 10) : (r.grade100 ?? null),
            feedback: r.feedback || r.review_feedback || r.feedback_text || null,
            priority: "medium",
            fileType: r.fileType || "",
          };
        });
        setRecentSubmissions(mapped);
      }

      // Load ALL submissions for counting
      const { data: allData } = await getDashboardRecentSubmissions({ mine_only: true, limit: 1000 }).catch(() => ({ data: null } as any));
      if (allData && Array.isArray(allData.items)) {
        const mapped = allData.items.map((r: any) => {
          const numericId = r.id != null ? Number(r.id) : null;
          if (numericId == null) console.warn('Submission missing id', r);
          return {
            id: numericId,
            title: r.title || "Assignment",
            student: r.studentUsername || `#${r.studentId}`,
            course: r.course || "",
            submittedAt: r.submittedAt,
            status: String(r.status || "Pending").toLowerCase().replace("needsrevision","needs_revision"),
            grade: r.grade ?? null,
            grade100: r.grade != null ? Math.round(Number(r.grade) * 10) : (r.grade100 ?? null),
            feedback: r.feedback || r.review_feedback || r.feedback_text || null,
            priority: "medium",
            fileType: r.fileType || "",
          };
        });
        setAllSubmissions(mapped);
      }

      // Load students list and total students count
      try {
        const studentsData = await getStudents();
        setStats((s) => ({ ...s, totalStudents: studentsData.length }));
      } catch (error) {
        console.error('Error loading students:', error);
      }

      try {
        const assignmentsData = await getAssignments();
        setStats((s) => ({ ...s, totalAssignments: assignmentsData.length }));
      } catch (error) {
        console.error('Error loading assignments:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      // Load existing notifications from localStorage
      const stored = localStorage.getItem('doctorNotifications');
      let existingNotifications = stored ? JSON.parse(stored) : [];
      
      // Check for new submissions and create notifications
      const newSubmissionNotifications = allSubmissions
        .filter(sub => {
          const submittedAt = new Date(sub.submittedAt);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const notificationExists = existingNotifications.some((n: any) => n.id === `sub_${sub.id}`);
          return submittedAt > oneHourAgo && !notificationExists;
        })
        .map(sub => ({
          id: `sub_${sub.id}`,
          title: "New Submission",
          message: `${sub.student} submitted ${sub.title}`,
          type: "submission",
          read: false,
          date: new Date(sub.submittedAt).toISOString().split('T')[0],
          createdAt: sub.submittedAt
        }));
      
      // Add new notifications to existing ones
      if (newSubmissionNotifications.length > 0) {
        const updatedNotifications = [...existingNotifications, ...newSubmissionNotifications];
        localStorage.setItem('doctorNotifications', JSON.stringify(updatedNotifications));
        setNotifications(updatedNotifications);
      } else {
        setNotifications(existingNotifications);
      }
      
      // Count unread notifications
      const currentNotifications = newSubmissionNotifications.length > 0 
        ? [...existingNotifications, ...newSubmissionNotifications]
        : existingNotifications;
      setUnreadCount(currentNotifications.filter((n: any) => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    let t = setTimeout(() => {
      setIsLoading(false);
      setIsAnimated(true);
    }, 800);

    loadDashboardData();

    return () => clearTimeout(t);
  }, []);

  // Listen for profile updates from AccountSettings page
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Trigger animation after a short delay
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load notifications when submissions change
  useEffect(() => {
    if (allSubmissions.length > 0) {
      loadNotifications();
    }
  }, [allSubmissions]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [allSubmissions]);

  // Add focus event listener to refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSignOut = () => {
    // Clear token and redirect
    localStorage.removeItem('token');
    window.location.href = '/signin';
  };

  // Navigation handlers


  const handleManageAll = () => {
    navigate('/doctor/tasks');
  };

  const handleCreateAssignment = () => {
    navigate('/doctor/create-assignment');
  };

  const handleViewAnalytics = () => {
    navigate('/doctor/analytics');
  };

  const handleViewAllStudents = () => {
    navigate('/doctor/students');
  };

  const handleAddStudent = () => {
    navigate('/doctor/students/add');
  };

  const handleCreateCourse = () => {
    navigate('/doctor/courses/create');
  };


  // increment messagesSent then navigate (persist to localStorage so it survives navigation)
  const handleSendAnnouncement = () => {
    // update persistence synchronously using current state, then update UI state and navigate.
    try {
      const next = (messagesSent || 0) + 1;
      localStorage.setItem('messagesSent', String(next));
      setMessagesSent(next);
    } catch (err) {
      // if localStorage is unavailable, still update UI optimistically
      setMessagesSent((prev) => (prev || 0) + 1);
    }
    // navigate after persisting so the new value survives the route change
    navigate('/doctor/announcements');
  };

  const handleNotifications = () => {
    // Mark all notifications as read when opening notifications page
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    localStorage.setItem('doctorNotifications', JSON.stringify(updatedNotifications));
    navigate('/doctor/notifications');
  };

  const handleSettings = () => {
    navigate('/doctor/settings');
  };

  const downloadSubmission = async (id: number) => {
    if (!id || isNaN(id)) {
      console.error('Invalid submission ID:', id);
      alert('Invalid submission ID. Cannot download file.');
      return;
    }

    try {
      console.log('Downloading submission with ID:', id);
      const res = await downloadSubmissionFile(id);
      
      console.log('Download response:', res);
      
      if (!res.data) {
        throw new Error('No file data received');
      }

      // Create blob with proper content type
      const blob = new Blob([res.data], { 
        type: res.headers['content-type'] || 'application/octet-stream' 
      });
      
      // Get filename from Content-Disposition header if available
      let filename = `submission-${id}`;
      const contentDisposition = res.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Force download by creating a temporary link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated successfully with filename:', filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download submission file.');
    }
  };

  const viewSubmission = async (id: number) => {
    try {
      const response = await downloadSubmissionFile(id, true);
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      
      // Create a new window with just the file content
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.location.href = url;
      }
      
      // Cleanup after delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view submission file.');
    }
  };

  const getStatusColor = (status: 'accepted' | 'pending' | 'reviewed' | 'needs_revision') => {
    // ... (rest of the code remains the same)
    switch (status) {
      case 'accepted': return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      case 'pending': return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
      case 'reviewed': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'needs_revision': return 'text-red-400 bg-red-500/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: 'accepted' | 'pending' | 'reviewed' | 'needs_revision') => {
    switch (status) {
      case 'accepted': return CheckCircle;
      case 'pending': return Clock;
      case 'reviewed': return Eye;
      case 'needs_revision': return AlertTriangle;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-500/10';
      case 'medium': return 'border-l-amber-400 bg-amber-500/10';
      case 'low': return 'border-l-green-400 bg-green-500/10';
      default: return 'border-l-gray-400 bg-gray-500/10';
    }
  };

  const filteredSubmissions = recentSubmissions.filter(submission => {
    const matchesSearch = (submission.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (submission.student || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === "all" || submission.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName = doctor.fullName && doctor.fullName !== "456" && doctor.fullName !== "" ? doctor.fullName : "Doctor";

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1000ms'}} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '500ms'}} />
        </div>
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <button
                  onClick={handleLogoClick}
                  className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 focus:outline-none"
                  title="Go to Dashboard"
                >
                  <GraduationCap className="w-8 h-8 text-white" />
                </button>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-white/70 font-medium">Doctor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6">
                <button 
                  onClick={handleNotifications}
                  className="relative p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-red-400' : ''}`} />
                  {unreadCount > 0 && (
                    <>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </div>
                    </>
                  )}
                </button>
              </div>
              
              <div className="pl-4 border-l border-white/20">
                <ProfileDropdown 
                  userInfo={{
                    fullName: displayName,
                    email: doctor.email || "",
                    role: "Doctor",
                    specialization: doctor.specialization || "",
                    department: "",
                    phone: ""
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  Welcome back, {displayName}!
              </h2>
              <p className="text-white/70 text-lg">Monitor student progress and manage submissions</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '200ms'}}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.totalStudents}</h3>
            <p className="text-white/70 text-sm font-medium">Total Students</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-300">Active this semester</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.pendingReviews}</h3>
            <p className="text-white/70 text-sm font-medium">Pending Reviews</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs text-amber-300">Requires attention</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.acceptedSubmissions}</h3>
            <p className="text-white/70 text-sm font-medium">Accepted</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-300">This month</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.averageGrade}/10</h3>
            <p className="text-white/70 text-sm font-medium">Average Grade</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-xs text-purple-300">Class performance</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Submissions - Enhanced */}
          <div className={`lg:col-span-2 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '400ms'}}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Recent Submissions</h3>
                </div>
                <button 
                  onClick={handleManageAll}
                  className="group flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search submissions or students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="text-white/60 w-4 h-4" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all backdrop-blur-xl"
                  >
                    <option value="all" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>All Status</option>
                    <option value="pending" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Pending</option>
                    <option value="reviewed" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Reviewed</option>
                    <option value="accepted" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Accepted</option>
                    <option value="needs_revision" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Needs Revision</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {(showAllSubmissions ? filteredSubmissions : filteredSubmissions.slice(0, 3)).map((submission) => {
                  const StatusIcon = getStatusIcon(submission.status);
                  return (
                    <div
                      key={submission.id}
                      className={`bg-white/5 backdrop-blur-sm rounded-2xl border-l-4 border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] ${getPriorityColor(submission.priority)}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-white">{submission.title}</h4>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-bold ${getStatusColor(submission.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="capitalize">{submission.status.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <p className="text-cyan-300 font-medium text-sm mb-1">{submission.student}</p>
                          <p className="text-white/60 text-sm">{submission.course}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {(submission.grade100 != null || submission.grade != null) && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 px-2 py-1 rounded-lg">
                              <Star className="w-3 h-3 text-yellow-400" />
                              <span className="text-yellow-300 font-bold text-sm">{submission.grade100 != null ? `${submission.grade100}/100` : `${submission.grade}/10`}</span>
                            </div>
                          )}
                          <span className="text-xs text-white/40">{submission.fileType}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-white/60">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                          </div>
                          {(() => {
                            const map: Record<'high' | 'medium' | 'low', string> = {
                              high: 'bg-red-500/20 text-red-300',
                              medium: 'bg-amber-500/20 text-amber-300',
                              low: 'bg-green-500/20 text-green-300',
                            };
                            const cls = map[(submission.priority as 'high' | 'medium' | 'low') || 'medium'];
                            return (
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
                                {submission.priority} priority
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadSubmission(submission.id)} className="p-2 text-blue-400/60 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10 group">
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          {submission.status === "pending" && (
                            <button
                              onClick={() => setReviewingSubmissionId(submission.id)}
                              className="p-2 text-yellow-400/60 hover:text-yellow-400 transition-colors rounded-lg hover:bg-yellow-500/10 group"
                              title="Grade Submission"
                            >
                              <Star className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          <button
                            onClick={() => viewSubmission(submission.id)}
                            className="p-2 text-green-400/60 hover:text-green-400 transition-colors rounded-lg hover:bg-green-500/10 group"
                            title="View Submission"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Load All Button */}
              {filteredSubmissions.length > 3 && (
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                    className="group bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-2xl hover:shadow-blue-500/25 mx-auto"
                  >
                    <ArrowRight className={`w-5 h-5 group-hover:scale-110 transition-transform ${showAllSubmissions ? 'rotate-90' : ''}`} />
                    <span>{showAllSubmissions ? 'Show Less' : `Load All (${filteredSubmissions.length - 3} more)`}</span>
                  </button>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button 
                   onClick={handleCreateAssignment}
                   className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-2xl hover:shadow-emerald-500/25"
                 >
                   <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   <span>Create Assignment</span>
                 </button>
                 <button 
                   onClick={handleViewAnalytics}
                   className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-2xl hover:shadow-purple-500/25"
                 >
                   <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                   <span>Analytics</span>
                 </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Students Section */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '700ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Students</h3>
                </div>
                {/* Only show the button, no student list */}
                <button 
                  onClick={handleViewAllStudents}
                  className="w-full mt-4 group bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>View All Students</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '800ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Quick Actions</h3>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleAddStudent}
                    className="w-full group bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Add Student</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={handleCreateCourse}
                    className="w-full group bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <BookMarked className="w-4 h-4 text-blue-400" />
                    <span>Create Course</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => navigate('/doctor/courses')}
                    className="w-full group bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <BookMarked className="w-4 h-4 text-purple-400" />
                    <span>View Courses</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>


                  <button 
                    onClick={handleSendAnnouncement}
                    className="w-full group bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-amber-500/30 hover:to-orange-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <Mail className="w-4 h-4 text-amber-400" />
                    <span>Send Announcement</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div> 
      {modalSubmissionId != null && (
        <SubmissionModal
          id={modalSubmissionId}
          onClose={() => setModalSubmissionId(null)}
          onReviewed={(updated) => {
            // update recentSubmissions and quick stats
            setRecentSubmissions((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated, grade100: updated.grade != null ? Math.round(Number(updated.grade) * 10) : (updated.grade100 ?? s.grade100), feedback: updated.feedback ?? updated.feedback_text ?? s.feedback } : s)));
            // recompute pendingReviews/approvedSubmissions
            setStats((st) => ({
              ...st,
              pendingReviews: Math.max(0, (st.pendingReviews || 0) - 1),
              acceptedSubmissions: (st.acceptedSubmissions || 0) + (updated.status === 'accepted' ? 1 : 0),
            }));
          }}
        />
      )}

      {/* Submission Review Modal */}
      {reviewingSubmissionId && (
        <SubmissionReviewModal
          submissionId={reviewingSubmissionId}
          onClose={() => setReviewingSubmissionId(null)}
          onSaved={handleReviewSaved}
        />
      )}
    </div>
  );
}