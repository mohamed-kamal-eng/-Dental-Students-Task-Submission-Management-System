// src/lib/api.ts
import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
} from "axios";
import { getToken, clearToken } from "./auth";

/* ------------------------------- Base URL ------------------------------- */

const rawBase = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000";
const API_BASE_URL = rawBase.replace(/\/+$/, ""); // strip trailing slash for clean joins

/* ----------------------------- Axios instance --------------------------- */

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // fail fast instead of hanging forever
  withCredentials: false, // we use Bearer token, not cookies
  headers: {
    Accept: "application/json",
  },
});

// Attach Bearer token automatically
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized response handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const status = error?.response?.status;
    const code = (error as any)?.code;

    // Network/timeout (backend down) — don't nuke session in dev
    if (!status || code === "ERR_NETWORK" || code === "ECONNABORTED") {
      if (!import.meta.env.PROD) {
        console.warn("[api] Network/timeout error — suppressing sign-out in dev.", { code, status });
      }
      return Promise.reject(error);
    }

    // Unauthorized
    if (status === 401) {
      if (!import.meta.env.PROD) {
        console.warn("[api] 401 in dev — NOT redirecting to /signin.");
        return Promise.reject(error);
      }
      clearToken();
      const p = window.location.pathname;
      if (p !== "/signin" && p !== "/signup") {
        window.location.replace("/signin");
      }
      return Promise.reject(error);
    }

    // Forbidden — surface as-is (do NOT redirect)
    if (status === 403 && !import.meta.env.PROD) {
      console.warn("[api] 403 (forbidden)"); // helpful while wiring roles on backend
    }

    return Promise.reject(error);
  }
);

/* ------------------------------- Utilities ------------------------------ */

/** Build absolute URL for downloads — accepts absolute or relative paths. */
export const fileUrl = (path?: string | null): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const clean = String(path).replace(/^\/+/, ""); // drop leading slashes
  return `${API_BASE_URL}/${clean}`;
};

/* ------------------------------- Student Management ------------------------------ */

export const createStudent = async (studentData: any) => {
  const response = await api.post("/student-management/students", studentData);
  return response.data;
};

export const getStudents = async (params?: any) => {
  const response = await api.get("/student-management/students", { params });
  return response.data;
};

export const updateStudent = async (studentId: number, studentData: any) => {
  const response = await api.put(`/student-management/students/${studentId}`, studentData);
  return response.data;
};

export const deleteStudent = async (studentId: number) => {
  const response = await api.delete(`/student-management/students/${studentId}`);
  return response.data;
};

export const bulkImportStudents = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/student-management/students/bulk-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createAssignment = async (assignmentData: any) => {
  const response = await api.post("/assignments", assignmentData);
  return response.data;
};

export const getAssignments = async (params?: any) => {
  const response = await api.get("/assignments", { params });
  return response.data;
};

/* ------------------------------- Course Management ------------------------------ */

export const createCourse = async (courseData: any) => {
  const response = await api.post("/course-management/courses", courseData);
  return response.data;
};

export const getCourses = async (params?: any) => {
  const response = await api.get("/course-management/courses", { params });
  return response.data;
};

// Course Enrollment APIs
export const enrollInCourse = async (enrollmentData: { course_id: number }) => {
  const response = await api.post("/course-management/enrollments/self", enrollmentData);
  return response.data;
};

export const adminEnrollStudent = async (enrollmentData: { course_id: number; student_id: number }) => {
  const response = await api.post("/course-management/enrollments", enrollmentData);
  return response.data;
};

export const getStudentEnrollments = async (studentId: number) => {
  const response = await api.get(`/course-management/enrollments/student/${studentId}`);
  return response.data;
};

export const getCourseEnrollments = async (courseId: number) => {
  const response = await api.get(`/course-management/enrollments/course/${courseId}`);
  return response.data;
};

/* ------------------------------- Reports & Analytics ------------------------------ */

export const generateReport = async (reportData: any) => {
  const response = await api.post("/reports/generate", reportData);
  return response.data;
};

export const getAnalytics = async (period: string = "month") => {
  const response = await api.get("/reports/analytics", { params: { period } });
  return response.data;
};

/* ------------------------------- Announcements ------------------------------ */

export const createAnnouncement = async (announcementData: any) => {
  const response = await api.post("/announcements", announcementData);
  return response.data;
};

export const getAnnouncements = async (params?: any) => {
  const response = await api.get("/announcements", { params });
  return response.data;
};

export const updateAnnouncement = async (id: number, announcementData: any) => {
  const response = await api.put(`/announcements/${id}`, announcementData);
  return response.data;
};

export const deleteAnnouncement = async (id: number) => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
};


/** Small helper for x-www-form-urlencoded bodies */
const formBody = (data: Record<string, string | number | boolean | null | undefined>) => {
  const u = new URLSearchParams();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.append(k, String(v));
  });
  return u;
};

/* --------------------------------- Types -------------------------------- */

export interface ApiResponse<T = any> { data: T }

export interface AuthTokenResponse {
  access_token: string;
  token_type?: string;
  // Optional extras if your backend returns them
  expires_in?: number;
  user?: any;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;              // "student" | "doctor" | "assistant" | "admin" (if any)
  created_at?: string;
}

export interface SignUpData {
  username: string;
  password: string;
  email: string;
  role: string; // "student" | "doctor" | "assistant"
}

export interface SignInData {
  username: string;
  password: string;
}

/* --------------------------------- Auth --------------------------------- */

// POST /auth/login (form)
export const signIn = (payload: SignInData) =>
  api.post<AuthTokenResponse>("/auth/login", formBody({
    username: payload.username,
    password: payload.password,
  }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });

// POST /auth/register (json)
export const signUp = (payload: SignUpData) =>
  api.post<UserResponse>("/auth/register", payload);

// GET /auth/me
export const getMe = () => api.get<UserResponse>("/auth/me");

// GET /auth/verify-token
export const verifyToken = () => api.get<UserResponse>("/auth/verify-token");

// POST /auth/refresh-token
export const refreshToken = () => api.post<AuthTokenResponse>("/auth/refresh-token");

// Update current user basic profile (username/email). Does not touch doctor profile fields.
export const updateMe = (payload: Partial<{ username: string; email: string }>) =>
  api.put<UserResponse>("/auth/me", payload);

// Change password for current user
export const changePassword = (payload: { current_password: string; new_password: string }) =>
  api.post("/auth/change-password", payload);

/* ------------------------------- Students -------------------------------- */

// NOTE: There is no `/students` router in the backend. Student-facing APIs live under `/student/*`.
// The previously declared `/students` helpers were removed to prevent accidental calls to non-existent routes.

/* ------------------------- Assignments / Tasks --------------------------- */

// ---- Assignments / Tasks (Doctor) ----
export const listAssignments = (params?: {
  status?: string;
  department?: string;
  q?: string;
}) => api.get("/assignments", { params });

// normalize fields to typical backend shapes
function buildAssignmentPayload(p: {
  title: string;
  description?: string;
  type_id?: number | string;
  department_id?: number | string;
  deadline?: string;        // ISO datetime string expected by backend
  is_active?: boolean;
}) {
  const out: any = {};
  if (p.title) out.title = p.title;
  if (p.description != null) out.description = p.description;

  // backend expects numeric foreign keys: type_id, department_id
  if (p.type_id != null) out.type_id = Number(p.type_id);
  if (p.department_id != null) out.department_id = Number(p.department_id);

  // deadline field name matches backend
  if (p.deadline != null) out.deadline = p.deadline;

  if (p.is_active != null) out.is_active = p.is_active;
  return out;
}






export const updateAssignment = (
  id: number | string,
  payload: Partial<{
    title: string;
    description: string;
    department_id: number | string;
    type_id: number | string;
    deadline: string; // ISO datetime
    instructions: string;
    max_file_size_mb: number;
    is_active: boolean;
  }>
) => api.put(`/assignments/${id}`, buildAssignmentPayload(payload as any));

export const deleteAssignment = (id: number | string) =>
  api.delete(`/assignments/${id}`);
// Doctor: list all submissions for a given assignment
export const listAssignmentSubmissions = (
  assignment_id: number | string,
  extraParams: Record<string, any> = {}
) => {
  return api.get("/doctor/submissions", {
    params: { assignment_id, ...extraParams },
  });
};


/* --------------------------- Doctor / Reviews ---------------------------- */

// GET /doctor/submissions (with optional filters)
export const listDoctorSubmissions = (params?: {
  status_filter?: "Pending" | "Accepted" | "Rejected" | "NeedsRevision";
  student_id?: number | string;
  search?: string;
  include_feedback?: boolean;
}) => api.get("/doctor/submissions", { params });

// GET /doctor/submissions/{id}
export const getDoctorSubmission = (id: number | string) =>
  api.get(`/doctor/submissions/${id}`);

// POST /doctor/submissions/{id}/review
export const reviewDoctorSubmission = (
  id: number | string,
  payload: { status: "Accepted" | "Rejected" | "NeedsRevision"; grade?: number; feedback_text?: string }
) => api.post(`/doctor/submissions/${id}/review`, payload);

/* ----------------------------- Student side ------------------------------ */

// GET /student/submissions
export const fetchMySubmissions = () => api.get("/student/submissions");

// GET /student/submissions/{id}
export const fetchSubmissionById = (id: number | string) =>
  api.get(`/student/submissions/${id}`);

// POST /student/submissions  (FormData or JSON depending on backend)
export const createSubmission = (payload: FormData | any) =>
  api.post("/student/submissions", payload);

/* ------------------------------- Dashboard -------------------------------- */

// GET /dashboard/summary (role-aware)
export const getDashboardSummary = (params?: {
  from_date?: string;
  to_date?: string;
}) => api.get("/dashboard/summary", { params });

// GET /dashboard/recent/submissions
export const getDashboardRecentSubmissions = (params?: {
  mine_only?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) => api.get("/dashboard/recent/submissions", { params });

// GET /submissions/{id}/file (admin/doctor) — use for downloads
export const downloadSubmissionFile = (submission_id: number | string, inline = false) =>
  api.get(`/submissions/${submission_id}/file`, { params: { inline }, responseType: "blob" });

/* --------------------------- Student endpoints ---------------------------- */

// GET /announcements/ (get announcements for students)
export const getStudentAnnouncements = (params?: { limit?: number; offset?: number }) =>
  api.get("/announcements/", { params });

/* --------------------------- Student Profile ---------------------------- */

// GET /student-profile/{student_id} or /student-profile/me
// Note: Use "me" to get the current student's profile
export const getStudentProfile = (studentId: number | string) =>
  api.get(`/student-profile/${studentId}`);

// PUT /student-profile/{student_id} or /student-profile/me
// Note: Use "me" to update the current student's profile
export const updateStudentProfile = (studentId: number | string, data: any) =>
  api.put(`/student-profile/${studentId}`, data);

/* --------------------------- Doctor Profile ---------------------------- */

// GET /doctor-profile/{doctor_id} or /doctor-profile/me for current doctor
export const getDoctorProfile = (doctorId?: number | string) =>
  api.get(doctorId ? `/doctor/profile/${doctorId}` : `/doctor/profile/me`);

// PUT /doctor-profile/{doctor_id} or /doctor-profile/me for current doctor
export const updateDoctorProfile = (data: any, doctorId?: number | string) =>
  api.put(doctorId ? `/doctor/profile/${doctorId}` : `/doctor/profile/me`, data);

/* --------------------------- Departments (for selects) --------------------------- */
export const listDepartments = (params?: { include_inactive?: boolean }) =>
  api.get("/departments", { params });

// GET /doctor/stats - Get doctor statistics (patients, appointments, etc.)
export const getDoctorStats = () =>
  api.get('/doctor/stats');

// GET /doctor/recent-activity - Get recent activity for doctor
export const getDoctorRecentActivity = () =>
  api.get('/doctor/recent-activity');

// GET /student-profile/{student_id}/academic-info
export const getStudentAcademicInfo = (studentId: number | string) =>
  api.get(`/student-profile/${studentId}/academic-info`);

// POST /student-profile/{student_id}/update-gpa
export const updateStudentGpa = (studentId: number | string, gpa: number) =>
  api.post(`/student-profile/${studentId}/update-gpa`, { gpa });

/* --------------------------- Student Attendance ---------------------------- */

// GET /student-profile/{student_id}/attendance
export const getStudentAttendance = (studentId: number | string) =>
  api.get(`/student-profile/${studentId}/attendance`);