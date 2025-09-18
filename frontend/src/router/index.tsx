import { createHashRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

/* Auth */
import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";
import RoleLanding from "../pages/auth/RoleLanding";

/* Doctor */
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorStudents from "../pages/doctor/Students";
import StudentsList from "../pages/doctor/StudentsList";
import DoctorTasks from "../pages/doctor/Tasks";
import AddStudent from "../pages/doctor/AddStudent";
import CreateCourse from "../pages/doctor/CreateCourse";
import Courses from "../pages/doctor/Courses";
import CourseDetail from "../pages/doctor/CourseDetail";
import CourseEdit from "../pages/doctor/CourseEdit";
import CreateAssignment from "../pages/doctor/CreateAssignment";
import Reports from "../pages/doctor/Reports";
import Announcements from "../pages/doctor/Announcements";
import Analytics from "../pages/doctor/Analytics";
import Settings from "../pages/doctor/Settings";
import AccountSettings from "../pages/doctor/AccountSettings";
import DoctorProfile from "../pages/doctor/Profile";

import DoctorNotifications from "../pages/doctor/Notifications";
import SubmissionView from "../pages/doctor/SubmissionView";
import SubmissionEdit from "../pages/doctor/SubmissionEdit";

/* Student */
import StudentDashboard from "../pages/student/Dashboard";
import StudentSubmissions from "../pages/student/Submissions";
import SubmissionDetail from "../pages/student/SubmissionDetail";
import StudentNotifications from "../pages/student/Notifications";
import StudentSettings from "../pages/student/Settings";
import StudentGrades from "../pages/student/Grades";
import StudentCourses from "../pages/student/Courses";
import CourseDetails from "../pages/student/CourseDetails";

/* Assistant */
import AssistantDashboard from "../pages/assistant/Dashboard";
import AssistantReviews from "../pages/assistant/Reviews";

const router = createHashRouter([
  { path: "/", element: <Navigate to="/signin" replace /> },
  { path: "/signin", element: <SignIn /> },
  { path: "/signup", element: <SignUp /> },
  { path: "/role", element: <RoleLanding /> },

  {
    path: "/doctor/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <DoctorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/students",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <StudentsList />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/student",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <DoctorStudents />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/tasks",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <DoctorTasks />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/students/add",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <AddStudent />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/courses",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <Courses />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/courses/create",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <CreateCourse />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/courses/:courseId",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <CourseDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/courses/:courseId/edit",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <CourseEdit />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/create-assignment",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <CreateAssignment />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/reports",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <Reports />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/announcements",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <Announcements />
      </ProtectedRoute>
    ),
  },

    {
      path: "/doctor/notifications",
      element: (
        <ProtectedRoute allowedRoles={["doctor", "admin"]}>
          <DoctorNotifications />
        </ProtectedRoute>
      ),
    },
  {
    path: "/doctor/analytics",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <Analytics />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/settings",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/account-settings",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <AccountSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/profile",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <DoctorProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/submissions/:id",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <SubmissionView />
      </ProtectedRoute>
    ),
  },
  {
    path: "/doctor/submissions/:id/edit",
    element: (
      <ProtectedRoute allowedRoles={["doctor", "admin"]}>
        <SubmissionEdit />
      </ProtectedRoute>
    ),
  },

  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/submissions",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentSubmissions />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/submissions/:id",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <SubmissionDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/notifications",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentNotifications />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/settings",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentSettings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/grades",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentGrades />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/courses",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <StudentCourses />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/courses/:courseId",
    element: (
      <ProtectedRoute allowedRoles={["student"]}>
        <CourseDetails />
      </ProtectedRoute>
    ),
  },

  {
    path: "/assistant/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["assistant", "admin"]}>
        <AssistantDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/assistant/reviews",
    element: (
      <ProtectedRoute allowedRoles={["assistant", "admin"]}>
        <AssistantReviews />
      </ProtectedRoute>
    ),
  },

  { path: "*", element: <div style={{ padding: 24 }}>404</div> },
]);

export default router;
