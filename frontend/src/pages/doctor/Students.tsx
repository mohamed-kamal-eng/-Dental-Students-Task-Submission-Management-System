import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft, User, Mail, Phone, Calendar, BookOpen, Award, TrendingUp,
  FileText, Clock, CheckCircle, AlertTriangle, Eye, Download, Edit,
  MessageSquare, Star, Target, Activity, BarChart3, PieChart, Upload,
  ThumbsUp, ThumbsDown, Send, Plus, Filter, Search, ChevronDown,
  GraduationCap, Stethoscope, Crown, Sparkles, Bell, Settings,
  Users, UserCheck, ClipboardList, XCircle, Zap, Shield, LogOut,
  MoreVertical, Trash2, RefreshCw, SortAsc, SortDesc, MapPin,
  Globe, CreditCard, Bookmark, ChevronRight, TrendingDown
} from "lucide-react";

import {
  listDoctorSubmissions,
  getDoctorSubmission,
  reviewDoctorSubmission,
  fileUrl,
  getStudentProfile,
  getStudentAcademicInfo,
  updateStudentGpa,
  getStudentEnrollments,
  getStudentAttendance,
} from "../../lib/api";
import { signOut } from "../../lib/auth";

/** ---------- types (UI-friendly) ---------- */
type UiStatus = "approved" | "pending" | "reviewed" | "needs_revision";

interface UiSubmission {
  id: number;
  title: string;
  course?: string | null;
  submittedDate?: string | null; // ISO string
  dueDate?: string | null;       // not available (keep null so UI still works)
  status: UiStatus;
  grade?: number | null;
  feedback?: string | null;
  fileType?: string | null;
  filePath?: string | null;      // to download
  priority?: "high" | "medium" | "low"; // purely visual; optional
}

/** Map API status to UI status chips */
function mapStatus(apiStatus?: string | null): UiStatus {
  switch ((apiStatus || "").toLowerCase()) {
    case "accepted": return "approved";
    case "needsrevision": return "needs_revision";
    case "rejected": return "needs_revision"; // display as red chip
    case "pending":
    default: return "pending";
  }
}

/** ----- UI helpers (kept exactly like your styling expects) ----- */
const getStatusColor = (status: UiStatus) => {
  switch (status) {
    case "approved": return "text-emerald-400 bg-emerald-500/20 border-emerald-400/30";
    case "pending": return "text-amber-400 bg-amber-500/20 border-amber-400/30";
    case "reviewed": return "text-blue-400 bg-blue-500/20 border-blue-400/30";
    case "needs_revision": return "text-red-400 bg-red-500/20 border-red-400/30";
    default: return "text-gray-400 bg-gray-500/20 border-gray-400/30";
  }
};

const getStatusIcon = (status: UiStatus) => {
  switch (status) {
    case "approved": return CheckCircle;
    case "pending": return Clock;
    case "reviewed": return Eye;
    case "needs_revision": return AlertTriangle;
    default: return FileText;
  }
};

const getGradeColor = (grade: number) => {
  if (grade >= 9) return "text-emerald-400";
  if (grade >= 8) return "text-blue-400";
  if (grade >= 7) return "text-amber-400";
  return "text-red-400";
};

const getCourseStatusColor = (s: string) => {
  switch (s) {
    case "excellent": return "text-emerald-400 bg-emerald-500/20";
    case "good": return "text-blue-400 bg-blue-500/20";
    case "satisfactory": return "text-amber-400 bg-amber-500/20";
    case "needs_improvement": return "text-red-400 bg-red-500/20";
    default: return "text-gray-400 bg-gray-500/20";
  }
};

/** ---------- component ---------- */
export default function StudentProfile() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // You control what student we’re looking at via URL:
  //   /doctor/student?id=123&name=Ahmed%20Hassan&year=Year%204&dept=Orthodontics
  const studentId = params.get("id") || params.get("student_id") || "";
  const displayName = params.get("name") || "Student";
  const displayYear = params.get("year") || "";
  const displayDept = params.get("dept") || "";

  // STATE (no mock data)
  const [activeTab, setActiveTab] = useState<"overview" | "submissions" | "courses" | "attendance" | "feedback">("overview");
  const [isAnimated, setIsAnimated] = useState(false);

  const [submissions, setSubmissions] = useState<UiSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Student profile state
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [academicInfo, setAcademicInfo] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  
  // GPA editing state
  const [editingGpa, setEditingGpa] = useState(false);
  const [newGpa, setNewGpa] = useState<string>("");
  
  // Courses and attendance state
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Filters/sort (kept from your UI)
  const [submissionFilter, setSubmissionFilter] = useState<"all" | UiStatus>("all");
  const [sortBy, setSortBy] = useState<"submittedDate" | "grade">("submittedDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // simple local input for feedback form
  const [feedbackText, setFeedbackText] = useState("");

  // Avoid white flash: animate after mount but always render gradient
  useEffect(() => {
    const t = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Load student profile data
  const loadStudentProfile = useCallback(async () => {
    if (!studentId) {
      setLoadingProfile(false);
      setStudentProfile(null);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);
    try {
      console.log("[student profile] Loading profile for student_id:", studentId);
      const { data } = await getStudentProfile(studentId);
      console.log("[student profile] Profile response:", data);
      setStudentProfile(data);
    } catch (e: any) {
      console.error("[student profile] loadStudentProfile failed", e);
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Failed to load student profile.";
      setProfileError(errorMsg);
    } finally {
      setLoadingProfile(false);
    }
  }, [studentId]);

  // Load academic info
  const loadAcademicInfo = useCallback(async () => {
    if (!studentId) return;
    try {
      console.log("[student profile] Loading academic info for student_id:", studentId);
      const { data } = await getStudentAcademicInfo(studentId);
      console.log("[student profile] Academic info response:", data);
      setAcademicInfo(data);
    } catch (e: any) {
      console.error("[student profile] loadAcademicInfo failed", e);
    }
  }, [studentId]);

  // Load student courses
  const loadStudentCourses = useCallback(async () => {
    if (!studentId) return;
    setLoadingCourses(true);
    try {
      console.log("[student profile] Loading courses for student_id:", studentId, "type:", typeof studentId);
      console.log("[student profile] Converting to number:", Number(studentId));
      console.log("[student profile] Making API call to:", `/course-management/enrollments/student/${Number(studentId)}`);
      
      const response = await getStudentEnrollments(Number(studentId));
      console.log("[student profile] Full API response:", response);
      console.log("[student profile] Response data:", response.data);
      console.log("[student profile] Data type:", typeof response.data, "length:", Array.isArray(response.data) ? response.data.length : 'not array');
      
      const enrollments = response.data || [];
      console.log("[student profile] Final enrollments to set:", enrollments);
      setStudentCourses(enrollments);
    } catch (e: any) {
      console.error("[student profile] loadStudentCourses failed", e);
      console.error("[student profile] Error details:", {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
        message: e?.message
      });
      setStudentCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, [studentId]);

  // Load attendance data
  const loadAttendanceData = useCallback(async () => {
    if (!studentId) return;
    setLoadingAttendance(true);
    try {
      console.log("[student profile] Loading attendance for student_id:", studentId);
      const { data } = await getStudentAttendance(studentId);
      console.log("[student profile] Attendance response:", data);
      setAttendanceData(data);
    } catch (e: any) {
      console.error("[student profile] loadAttendanceData failed", e);
      setAttendanceData(null);
    } finally {
      setLoadingAttendance(false);
    }
  }, [studentId]);

  // Load submissions for the selected student
  const loadSubmissions = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      setSubmissions([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      console.log("[student profile] Loading submissions for student_id:", studentId);
      const { data } = await listDoctorSubmissions({ student_id: studentId });
      console.log("[student profile] API response:", data);
      // doctor endpoint returns:
      // { id, assignmentId, studentId, title, course, submittedAt, status, fileName, filePath, fileType, notes }
      const mapped: UiSubmission[] = (data || []).map((r: any) => ({
        id: Number(r.id ?? r.submission_id ?? r.submissionId),
        title: r.title ?? "",
        course: r.course ?? null,
        submittedDate: r.submittedAt ?? r.submitted_at ?? null,
        dueDate: null, // not provided
        status: mapStatus(r.status),
        grade: null,   // will load per-submission when needed
        feedback: null,// will load per-submission when needed
        fileType: r.fileType ?? null,
        filePath: r.filePath ?? null,
        priority: "medium",
      }));
      setSubmissions(mapped);
    } catch (e: any) {
      console.error("[student profile] loadSubmissions failed", e);
      const errorMsg = e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Failed to load submissions.";
      console.error("[student profile] API error details:", {
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        data: e?.response?.data,
        url: e?.config?.url,
        method: e?.config?.method
      });
      setFetchError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadSubmissions();
    loadStudentProfile();
    loadAcademicInfo();
    loadStudentCourses();
    loadAttendanceData();
  }, [loadSubmissions, loadStudentProfile, loadAcademicInfo, loadStudentCourses, loadAttendanceData]);

  // Lazy-load feedback/grade for “feedback” tab
  useEffect(() => {
    if (activeTab !== "feedback") return;
    if (!submissions.length) return;

    let cancelled = false;
    (async () => {
      try {
        setLoadingFeedback(true);
        const withFb = await Promise.all(
          submissions.map(async (s) => {
            try {
              const { data } = await getDoctorSubmission(s.id);
              const fb = data?.feedback;
              return {
                ...s,
                grade: typeof fb?.grade === "number" ? fb.grade : s.grade ?? null,
                feedback: fb?.text ?? s.feedback ?? null,
                // status is already from submission; keep
              };
            } catch {
              return s;
            }
          })
        );
        if (!cancelled) setSubmissions(withFb);
      } finally {
        if (!cancelled) setLoadingFeedback(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeTab, submissions.length]);

  /** ------- derived list for Submissions tab (kept your logic) ------- */
  const filteredSubmissions = useMemo(() => {
    const base = submissions.filter((s) => (submissionFilter === "all" ? true : s.status === submissionFilter));
    const val = (x: UiSubmission) =>
      sortBy === "submittedDate"
        ? (x.submittedDate ? new Date(x.submittedDate).getTime() : 0)
        : (x.grade ?? -1);
    const sorted = base.sort((a, b) => {
      const A = val(a), B = val(b);
      return sortOrder === "desc" ? B - A : A - B;
    });
    return sorted;
  }, [submissions, submissionFilter, sortBy, sortOrder]);

  /** ---------------- button handlers ---------------- */
  const handleGoBack = () => window.history.back();
  const handleSignOut = () => signOut("/signin");

  const handleView = (id: number) => {
    navigate(`/doctor/submissions/${id}`);
  };

  const handleDownload = (s: UiSubmission) => {
    const url = fileUrl(s.filePath);
    if (url) window.open(url, "_blank");
  };

  const handleApprove = async (id: number) => {
    try {
      await reviewDoctorSubmission(id, { status: "Accepted" });
      setSubmissions((prev) => prev.map((x) => (x.id === id ? { ...x, status: "approved" } : x)));
    } catch (e) {
      console.error("approve failed", e);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await reviewDoctorSubmission(id, { status: "NeedsRevision" });
      setSubmissions((prev) => prev.map((x) => (x.id === id ? { ...x, status: "needs_revision" } : x)));
    } catch (e) {
      console.error("reject failed", e);
    }
  };

  const handleUpdateGpa = async () => {
    if (!studentId || !newGpa) return;
    try {
      const gpaValue = parseFloat(newGpa);
      if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > 4) {
        alert("Please enter a valid GPA between 0.0 and 4.0");
        return;
      }
      await updateStudentGpa(studentId, gpaValue);
      setEditingGpa(false);
      setNewGpa("");
      // Reload profile to get updated GPA
      loadStudentProfile();
    } catch (e: any) {
      console.error("update GPA failed", e);
      alert("Failed to update GPA. Please try again.");
    }
  };

  /** ---------------- header quick stats (from real data) ---------------- */
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  /** --------- UI starts here (unchanged styles) --------- */
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Gradient & particles always render -> prevents white flickers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1000ms" }} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "500ms" }} />
        </div>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
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
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-sm text-white/70 font-medium">Student Profile</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="group flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back</span>
              </button>

              <div className="hidden sm:flex items-center gap-6">
                <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </button>
                <button className="p-2 text-white/70 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white">Doctor</p>
                  <p className="text-xs text-white/60">Orthodontics</p>
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
        {/* Student Header Card */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Student Info */}
              <div className="flex items-start gap-6 flex-1">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl">
                    {displayName?.trim().slice(0, 2).toUpperCase() || "ST"}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-black text-white">{displayName || "Student"}</h2>
                    <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-400/30">
                      active
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-white/70">
                      <CreditCard className="w-4 h-4" />
                      <span>ID: {studentId || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <GraduationCap className="w-4 h-4" />
                      <span>{[displayYear, displayDept].filter(Boolean).join(" • ") || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail className="w-4 h-4" />
                      <span>{studentProfile?.email || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone className="w-4 h-4" />
                      <span>{studentProfile?.phone || "-"}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {editingGpa ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={newGpa}
                            onChange={(e) => setNewGpa(e.target.value)}
                            placeholder="0.0"
                            min="0"
                            max="4"
                            step="0.1"
                            className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                          />
                          <button
                            onClick={handleUpdateGpa}
                            className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs hover:bg-green-500/30"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingGpa(false);
                              setNewGpa("");
                            }}
                            className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs hover:bg-red-500/30"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-300 font-bold">
                            GPA: {studentProfile?.gpa ? studentProfile.gpa.toFixed(2) : "-"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingGpa(true);
                              setNewGpa(studentProfile?.gpa?.toString() || "");
                            }}
                            className="p-1 text-white/60 hover:text-white transition-colors"
                            title="Edit GPA"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-medium">Rank: -</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 font-medium">Enrolled: -</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats (live counts from submissions) */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 min-w-[280px]">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{approvedCount}</p>
                      <p className="text-white/70 text-xs">Approved</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white">{pendingCount}</p>
                      <p className="text-white/70 text-xs">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} style={{ transitionDelay: "200ms" }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-2">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview", icon: Target },
                { id: "submissions", label: "Submissions", icon: FileText },
                { id: "courses", label: "Courses", icon: BookOpen },
                { id: "attendance", label: "Attendance", icon: Calendar },
                { id: "feedback", label: "Feedback", icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon as any;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg transform scale-105"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} style={{ transitionDelay: "400ms" }}>
          {/* OVERVIEW (kept visual shell; no mock metrics) */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white">Academic Performance</h3>
                  </div>

                  {/* Academic performance with real data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white">Overall GPA</h4>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-400">
                            {academicInfo?.overall_gpa ? academicInfo.overall_gpa.toFixed(2) : "-"}
                          </p>
                          <p className="text-white/60 text-sm">out of 4.0</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-1000" 
                          style={{ width: `${academicInfo?.overall_gpa ? (academicInfo.overall_gpa / 4.0) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-white">Credits Progress</h4>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-400">
                            {academicInfo?.credits_completed || 0}
                          </p>
                          <p className="text-white/60 text-sm">of {academicInfo?.credits_required || 0}</p>
                        </div>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all duration-1000" 
                          style={{ 
                            width: `${academicInfo?.credits_completed && academicInfo?.credits_required 
                              ? (academicInfo.credits_completed / academicInfo.credits_required) * 100 
                              : 0}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-white mb-4">Current Courses</h4>
                    {academicInfo?.current_courses && academicInfo.current_courses.length > 0 ? (
                      <div className="space-y-3">
                        {academicInfo.current_courses.map((course: any, index: number) => (
                          <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-bold text-white">{course.course_title}</h5>
                              <span className="text-blue-300 text-sm font-medium">{course.course_code}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/70">{course.department_name}</span>
                              <span className="text-cyan-300">{course.credits} credits</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/60 text-sm">No current courses enrolled.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Recent Activity: use submissions timestamps for now */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white">Recent Activity</h3>
                  </div>

                  <div className="space-y-4">
                    {loading && <p className="text-white/70 text-sm">Loading submissions…</p>}
                    {!loading && submissions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 bg-blue-400`} />
                        <div className="flex-1">
                          <p className="text-white text-sm">Submitted {s.title || "Assignment"}</p>
                          <p className="text-white/50 text-xs">
                            {s.submittedDate ? new Date(s.submittedDate).toLocaleDateString() : "-"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {!loading && submissions.length === 0 && (
                      <p className="text-white/60 text-sm">No activity yet.</p>
                    )}
                  </div>
                </div>

                {/* Personal Info shell (you can fill via params or future API) */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white">Personal Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-white/60 text-xs">Date of Birth</p>
                        <p className="text-white text-sm">
                          {studentProfile?.date_of_birth 
                            ? new Date(studentProfile.date_of_birth).toLocaleDateString() 
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-green-400" />
                      <div>
                        <p className="text-white/60 text-xs">Nationality</p>
                        <p className="text-white text-sm">{studentProfile?.nationality || "-"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-white/60 text-xs">Address</p>
                        <p className="text-white text-sm">{studentProfile?.address || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact shell */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-black text-white">Emergency Contact</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-white/60 text-xs">Name</p>
                      <p className="text-white font-medium">{studentProfile?.emergency_contact_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Relationship</p>
                      <p className="text-white font-medium">{studentProfile?.emergency_contact_relationship || "-"}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Phone</p>
                      <p className="text-white font-medium">{studentProfile?.emergency_contact_phone || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBMISSIONS (live) */}
          {activeTab === "submissions" && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex flex-col lg:flex-row gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    <select
                      value={submissionFilter}
                      onChange={(e) => setSubmissionFilter(e.target.value as any)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="all" className="bg-gray-900">All Submissions</option>
                      <option value="approved" className="bg-gray-900">Approved</option>
                      <option value="pending" className="bg-gray-900">Pending</option>
                      <option value="reviewed" className="bg-gray-900">Reviewed</option>
                      <option value="needs_revision" className="bg-gray-900">Needs Revision</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    >
                      <option value="submittedDate" className="bg-gray-900">Sort by Date</option>
                      <option value="grade" className="bg-gray-900">Sort by Grade</option>
                    </select>

                    <button
                      onClick={() => setSortOrder((p) => (p === "desc" ? "asc" : "desc"))}
                      className="p-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all"
                    >
                      {sortOrder === "desc" ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-black text-white">{filteredSubmissions.length}</p>
                      <p className="text-white/60 text-xs">Showing</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-black text-emerald-400">
                        {filteredSubmissions.filter((s) => s.status === "approved").length}
                      </p>
                      <p className="text-white/60 text-xs">Approved</p>
                    </div>
                  </div>
                </div>
              </div>

              {fetchError && (
                <div className="bg-red-500/10 border border-red-400/30 text-red-200 rounded-2xl p-4">
                  {fetchError}
                </div>
              )}

              <div className="space-y-6">
                {loading && (
                  <div className="text-white/70">Loading submissions…</div>
                )}

                {!loading && filteredSubmissions.map((submission) => {
                  const StatusIcon = getStatusIcon(submission.status);
                  return (
                    <div key={submission.id} className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-500">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-white">{submission.title || "Assignment"}</h3>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(submission.status)}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="capitalize">{submission.status.replace("_", " ")}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 mb-4 text-sm">
                            <div className="flex items-center gap-2 text-cyan-300">
                              <BookOpen className="w-4 h-4" />
                              <span>{submission.course || "-"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/70">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Submitted:{" "}
                                {submission.submittedDate ? new Date(submission.submittedDate).toLocaleDateString() : "-"}
                              </span>
                            </div>
                            {typeof submission.grade === "number" && (
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className={`font-bold ${getGradeColor(submission.grade)}`}>
                                  {submission.grade}/10
                                </span>
                              </div>
                            )}
                          </div>

                          {submission.feedback && (
                            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                                <span className="text-sm font-bold text-cyan-400">Feedback</span>
                              </div>
                              <p className="text-white/80 text-sm">{submission.feedback}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(submission.id)}
                            className="p-2 text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(submission)}
                            className="p-2 text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/10"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(submission.id)}
                            className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors rounded-xl hover:bg-emerald-500/10"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(submission.id)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-xl hover:bg-red-500/10"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!loading && !filteredSubmissions.length && (
                  <div className="text-white/60">No submissions to show.</div>
                )}
              </div>
            </div>
          )}

          {/* COURSES */}
          {activeTab === "courses" && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Enrolled Courses</h3>
                </div>

                {loadingCourses ? (
                  <div className="text-white/70">Loading courses...</div>
                ) : studentCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {studentCourses.map((enrollment: any, index: number) => (
                      <div key={index} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-white">
                            {enrollment.course_title || `Course ${enrollment.course_id}`}
                          </h4>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            enrollment.status === 'Active' 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                          }`}>
                            {enrollment.status || 'Active'}
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/70">Course ID:</span>
                            <span className="text-white">{enrollment.course_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/70">Enrolled:</span>
                            <span className="text-white">
                              {enrollment.enrolled_at 
                                ? new Date(enrollment.enrolled_at).toLocaleDateString()
                                : '-'
                              }
                            </span>
                          </div>
                          {enrollment.grade && (
                            <div className="flex justify-between">
                              <span className="text-white/70">Grade:</span>
                              <span className="text-emerald-300 font-bold">{enrollment.grade}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No courses enrolled</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Attendance Summary</h3>
                </div>

                {loadingAttendance ? (
                  <div className="text-white/70">Loading attendance data...</div>
                ) : attendanceData ? (
                  <div className="space-y-6">
                    {/* Overall Attendance Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-white">
                              {attendanceData.total_present || 0}
                            </p>
                            <p className="text-white/70 text-xs">Present</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-white">
                              {attendanceData.total_absent || 0}
                            </p>
                            <p className="text-white/70 text-xs">Absent</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-white">
                              {attendanceData.attendance_percentage 
                                ? `${attendanceData.attendance_percentage}%`
                                : '0%'
                              }
                            </p>
                            <p className="text-white/70 text-xs">Attendance Rate</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Attendance Records */}
                    {attendanceData.recent_records && attendanceData.recent_records.length > 0 && (
                      <div className="bg-white/5 rounded-2xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4">Recent Records</h4>
                        <div className="space-y-3">
                          {attendanceData.recent_records.slice(0, 10).map((record: any, index: number) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  record.status === 'Present' 
                                    ? 'bg-green-400'
                                    : record.status === 'Absent'
                                    ? 'bg-red-400'
                                    : 'bg-yellow-400'
                                }`} />
                                <div>
                                  <p className="text-white text-sm">
                                    {record.course_name || `Course ${record.course_id}`}
                                  </p>
                                  <p className="text-white/60 text-xs">
                                    {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-sm font-medium ${
                                record.status === 'Present' 
                                  ? 'text-green-300'
                                  : record.status === 'Absent'
                                  ? 'text-red-300'
                                  : 'text-yellow-300'
                              }`}>
                                {record.status || 'Unknown'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No attendance data available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FEEDBACK (loads real feedback for submissions when opened) */}
          {activeTab === "feedback" && (
            <div className="space-y-8">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                <h3 className="text-xl font-black text-white">Add Feedback</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-3">Your Feedback</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Write your feedback for this student..."
                      className="w-full h-32 bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setFeedbackText("")}
                      className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send Feedback (wire /feedback when ready)</span>
                    </button>
                    <button
                      onClick={() => setFeedbackText("")}
                      className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-2xl hover:bg-white/15 transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <h3 className="text-xl font-black text-white mb-6">Previous Feedback</h3>
                {loadingFeedback && <p className="text-white/70">Loading feedback…</p>}
                {!loadingFeedback && submissions.filter((s) => s.feedback).length === 0 && (
                  <p className="text-white/60">No feedback yet.</p>
                )}
                <div className="space-y-4">
                  {submissions.filter((s) => s.feedback).map((s) => (
                    <div key={s.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-white">{s.title || "Assignment"}</h4>
                        <span className="text-white/60 text-sm">
                          {s.submittedDate ? new Date(s.submittedDate).toLocaleDateString() : "-"}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm mb-3">{s.feedback}</p>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(s.status)}`}>
                          <span className="capitalize">{s.status.replace("_", " ")}</span>
                        </div>
                        {typeof s.grade === "number" && (
                          <div className="flex items-center gap-2">
                            <Star className="w-3 h-3 text-yellow-400" />
                            <span className={`text-sm font-bold ${getGradeColor(s.grade)}`}>{s.grade}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Bar (unchanged visuals; wire later if needed) */}
        <div className={`mt-12 transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} style={{ transitionDelay: "600ms" }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Quick Actions</h3>
                  <p className="text-white/70 text-sm">Manage student progress efficiently</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="group bg-white/10 border border-white/20 hover:bg-white/15 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message</span>
                </button>

                <button className="group bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 hover:from-emerald-500/30 hover:to-green-500/30 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Award Grade</span>
                </button>

                <button className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-500 transform hover:scale-105 flex items-center gap-2 shadow-lg">
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
