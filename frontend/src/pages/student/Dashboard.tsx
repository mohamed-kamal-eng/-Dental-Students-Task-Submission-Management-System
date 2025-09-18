import { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Zap, 
  BookOpen, 
  ArrowRight, 
  Upload, 
  Eye, 
  Award, 
  Sparkles, 
  Target, 
  Crown, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Stethoscope,
  X,
  AlertCircle,
  XCircle,
  MessageCircle,
  Plus,
  Trophy
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

interface DashboardStats {
  totalSubmissions: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  averageGrade: number;
  completionRate: number;
}

interface Submission {
  id: number;
  title: string;
  course?: string;
  submittedAt: string;
  status: string;
  grade?: number;
  feedback?: string;
  assignmentId: number;
}

interface AvailableAssignment {
  assignment_id: number;
  title: string;
  description: string;
  deadline: string;
  max_grade: number;
  max_file_size_mb: number;
  instructions: string;
  target_year: string;
  department_name: string;
  assignment_type: string;
  submission_status: 'available' | 'submitted';
  submission_id?: number;
  submission_status_detail?: string;
  submitted_at?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  full_name?: string; // For backward compatibility with API responses
  role: string;
}

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubmissions: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    averageGrade: 0,
    completionRate: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<AvailableAssignment[]>([]);
  const [isAnimated, setIsAnimated] = useState(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Submission Modal state
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formAssignmentId, setFormAssignmentId] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string>("");

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    loadAvailableAssignments();
  }, []);

  // Listen for profile updates from Settings page
  useEffect(() => {
    const handleProfileUpdate = async (event: Event) => {
      try {
        // Get the full name from the event detail if available
        const fullName = (event as CustomEvent)?.detail?.fullName;
        
        if (fullName) {
          // Update the user's full name directly from the event
          setUser(prevUser => ({
            ...prevUser!,
            fullName: fullName
          }));
        } else {
          // Fallback: Reload user data if full name is not in the event
          const userResponse = await api.get("/auth/me");
          setUser(userResponse.data);
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeSubmissionModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Load user info with updated data
      const userResponse = await api.get("/auth/me");
      const userData = userResponse.data;
      
      // Ensure we have the latest user data
      setUser(prevUser => ({
        ...prevUser,
        ...userData,
        fullName: userData.full_name || userData.fullName || 'Student' // Fallback to full_name or 'Student' if not available
      }));

      // Load submissions directly using the correct API (now includes grade data)
      const submissionsResponse = await api.get("/student/submissions");
      const submissions = submissionsResponse.data;
      
      // Calculate stats from submissions with grade data
      const totalSubmissions = submissions.length;
      const pendingReview = submissions.filter((s: any) => s.status === "Pending").length;
      const approved = submissions.filter((s: any) => s.status === "Accepted").length;
      const rejected = submissions.filter((s: any) => s.status === "Rejected").length;
      
      // Calculate average grade from graded submissions
      const gradedSubmissions = submissions.filter((s: any) => s.grade > 0);
      const averageGrade = gradedSubmissions.length > 0 
        ? Math.round(gradedSubmissions.reduce((sum: number, s: any) => sum + s.grade, 0) / gradedSubmissions.length * 10) // Convert to percentage
        : 0;
      
      setStats({
        totalSubmissions,
        pendingReview,
        approved,
        rejected,
        averageGrade,
        completionRate: totalSubmissions > 0 ? Math.round((approved / totalSubmissions) * 100) : 0
      });

      // Map submissions for display
      const mappedSubmissions = submissions.slice(0, 5).map((sub: any) => ({
        id: sub.id,
        title: sub.title || `Assignment ${sub.assignmentId}`,
        course: sub.course || "Course",
        submittedAt: sub.submittedAt,
        status: sub.status.toLowerCase(),
        grade: sub.grade || 0,
        feedback: sub.feedback,
        assignmentId: sub.assignmentId
      }));
      
      setRecentSubmissions(mappedSubmissions);

    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
      
      // If authentication fails, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/signin');
        return;
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsAnimated(true), 100);
    }
  };

  const loadAvailableAssignments = async () => {
    try {
      const response = await api.get("/student/assignments");
      setAvailableAssignments(response.data);
    } catch (err: any) {
      console.error("Error loading available assignments:", err);
      // non-blocking toast-like inline message
      // optionally set a subtle message for the empty state
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/signin');
  };


  // Modal handlers
  const openSubmissionModal = () => {
    console.log("Opening submission modal...");
    setFormError("");
    setFormAssignmentId("");
    setFormNotes("");
    setFormFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const closeSubmissionModal = () => {
    if (uploading) return;
    console.log("Closing submission modal...");
    setShowModal(false);
  };

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const idNum = Number(formAssignmentId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setFormError("Assignment ID must be a positive number.");
      return;
    }
    if (!formFile) {
      setFormError("Please choose a file to upload.");
      return;
    }

    // Check file size (max 10MB)
    if (formFile.size > 10 * 1024 * 1024) {
      setFormError("File size must be less than 10MB.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("assignment_id", String(idNum));
      form.append("file", formFile);
      form.append("student_notes", formNotes || "");

      const response = await api.post("/student/submissions", form);
      
      // Show success message
      setShowModal(false);
      
      // Refresh dashboard data
      await loadDashboardData();
      
      // Show success notification (you could add a toast library)
      alert("Submission uploaded successfully!");
      
      // Navigate to submissions page
      navigate("/student/submissions");
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.";
      setFormError(msg);
    } finally {
      setUploading(false);
    }
  };

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': 
      case 'approved': 
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      case 'pending': 
        return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
      case 'rejected': 
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'needsrevision':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default: 
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
      case 'approved': 
        return CheckCircle;
      case 'pending': 
        return Clock;
      case 'rejected': 
        return XCircle;
      default: 
        return FileText;
    }
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-red-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-sm text-white/70 font-medium">Student Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6">
                <button 
                  onClick={() => navigate("/student/notifications")}
                  className="relative p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {stats.pendingReview > 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </button>
                <button 
                  onClick={() => navigate("/student/settings")}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white">
                    {user?.fullName || user?.full_name || 'Student'}
                  </p>
                  <p className="text-xs text-white/60 capitalize">{user?.role || "student"}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-white/70 hover:text-white transition-colors group"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
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
                <Award className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                Welcome back, {user?.fullName?.split(' ')[0] || user?.username || "Student"}!
              </h2>
              <p className="text-white/70 text-lg">Track your academic progress and submissions</p>
            </div>
          </div>
        </div>

        {/* Quick Stats - Now using real data */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '200ms'}}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.totalSubmissions}</h3>
            <p className="text-white/70 text-sm font-medium">Total Submissions</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-300">All time</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.pendingReview}</h3>
            <p className="text-white/70 text-sm font-medium">Pending Review</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs text-amber-300">Awaiting feedback</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <Star className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.approved}</h3>
            <p className="text-white/70 text-sm font-medium">Accepted</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-300">Great work!</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <X className="w-6 h-6 text-white" />
              </div>
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.rejected}</h3>
            <p className="text-white/70 text-sm font-medium">Rejected</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              <span className="text-xs text-red-300">Needs revision</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.completionRate}%</h3>
            <p className="text-white/70 text-sm font-medium">Completion Rate</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-xs text-purple-300">Great progress</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Submissions - Now with real data */}
          <div className={`lg:col-span-2 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '400ms'}}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Recent Submissions</h3>
                </div>
                <Link to="/student/submissions" className="group flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="space-y-4">
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No submissions yet</p>
                    <p className="text-white/40 text-sm">Upload your first assignment to get started</p>
                  </div>
                ) : (
                  recentSubmissions.map((submission, index) => {
                    const StatusIcon = getStatusIcon(submission.status);
                    return (
                      <div
                        key={submission.id}
                        className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
                        style={{animationDelay: `${index * 100}ms`}}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-1">{submission.title}</h4>
                            {submission.course && (
                              <p className="text-white/70 text-sm">{submission.course}</p>
                            )}
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(submission.status)}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="capitalize">{submission.status.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-white/60">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {submission.grade && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-300 font-bold">{submission.grade}/10</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => navigate(`/student/submissions/${submission.id}`)}
                              className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {submission.feedback && (
                              <button 
                                onClick={() => navigate(`/student/submissions/${submission.id}#feedback`)}
                                className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                                title="View Feedback"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {submission.feedback && (
                          <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            <p className="text-white/80 text-sm italic">"{submission.feedback}"</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={openSubmissionModal}
                  className="w-full group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-3 shadow-2xl hover:shadow-cyan-500/25"
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span>New Submission</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar - Quick Actions now connected */}
          <div className="space-y-6">
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
                    type="button"
                    onClick={openSubmissionModal}
                    className="w-full group bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Submit Assignment</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/student/submissions")}
                    className="w-full group bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>View Submissions</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/student/grades")}
                    className="w-full group bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <Trophy className="w-4 h-4 text-purple-400" />
                    <span>View Grades</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/student/courses")}
                    className="w-full group bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white font-medium py-3 px-4 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-300 flex items-center gap-3"
                  >
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Browse Courses</span>
                    <ArrowRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '1000ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Performance</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Success Rate</span>
                    <span className="text-emerald-400 font-bold">{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{width: `${stats.completionRate}%`}}
                    />
                  </div>
                  
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/70 text-sm">This Month</span>
                      <Crown className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Submitted</span>
                        <span className="text-white">{stats.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Approved</span>
                        <span className="text-emerald-400">{stats.approved}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Pending</span>
                        <span className="text-amber-400">{stats.pendingReview}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Rejected</span>
                        <span className="text-red-400">{stats.rejected}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Assignments Section */}
        <div className={`mt-6 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '600ms'}}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Available Assignments</h3>
              </div>
            </div>

            <div className="space-y-4">
              {availableAssignments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No assignments available</p>
                  <p className="text-white/40 text-sm">Check back later for new assignments</p>
                </div>
              ) : (
                availableAssignments.map((assignment, index) => (
                  <div
                    key={assignment.assignment_id}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]"
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-1">{assignment.title}</h4>
                        <p className="text-white/70 text-sm mb-2">{assignment.description}</p>
                        <div className="flex items-center gap-4 text-xs text-white/60">
                          <span>{assignment.department_name}</span>
                          <span>•</span>
                          <span>{assignment.assignment_type}</span>
                          <span>•</span>
                          <span>Max Grade: {assignment.max_grade}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
                        assignment.submission_status === 'submitted' 
                          ? 'bg-green-500/20 border-green-500/30 text-green-300'
                          : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                      }`}>
                        {assignment.submission_status === 'submitted' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Submitted</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>Available</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-white/60">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/60">
                          <Upload className="w-4 h-4" />
                          <span>Max: {assignment.max_file_size_mb}MB</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {assignment.submission_status === 'available' ? (
                          <button 
                            onClick={() => {
                              setFormAssignmentId(assignment.assignment_id.toString());
                              setShowModal(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 hover:scale-105"
                          >
                            Submit
                          </button>
                        ) : (
                          <button 
                            onClick={() => navigate(`/student/submissions/${assignment.submission_id}`)}
                            className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all duration-300"
                          >
                            View Submission
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Debug info - remove this in production */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          Modal State: {showModal ? 'OPEN' : 'CLOSED'}
        </div>
      )}

      {/* Modal for New Submission */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeSubmissionModal}
        >
          <div 
            className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl border border-white/20 p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">New Submission</h3>
              </div>
              <button
                onClick={closeSubmissionModal}
                disabled={uploading}
                className="p-2 text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNew} className="space-y-6">
              <div>
                <label htmlFor="assignmentId" className="block text-white/80 text-sm font-medium mb-2">
                  Assignment ID
                </label>
                <input
                  id="assignmentId"
                  type="number"
                  value={formAssignmentId}
                  onChange={(e) => setFormAssignmentId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  placeholder="Enter assignment ID"
                  required
                  disabled={uploading}
                />
              </div>

              <div>
                <label htmlFor="file" className="block text-white/80 text-sm font-medium mb-2">
                  Upload File
                </label>
                <input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  required
                  disabled={uploading}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-white/80 text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
                  placeholder="Add any additional notes..."
                  disabled={uploading}
                />
              </div>

              {formError && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <p className="text-red-300 text-sm">{formError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeSubmissionModal}
                  disabled={uploading}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formFile || !formAssignmentId}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Submit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}