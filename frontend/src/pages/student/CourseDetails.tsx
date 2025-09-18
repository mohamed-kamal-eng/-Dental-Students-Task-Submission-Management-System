import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Users, GraduationCap, 
  Calendar, Building, CheckCircle, UserPlus
} from "lucide-react";
import { api } from "../../lib/api";

interface Course {
  course_id: number;
  title: string;
  description?: string;
  code: string;
  credits: number;
  department_id: number;
  created_by: number;
  is_active: number;
  created_at: string;
  enrollment_count: number;
  department_name: string;
}

interface Enrollment {
  enrollment_id: number;
  course_id: number;
  student_id: number;
  enrolled_at: string;
  status: string;
  grade?: number;
  notes?: string;
}

export default function CourseDetails() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);

  useEffect(() => {
    if (courseId) {
      loadCourseDetails();
      checkEnrollmentStatus();
    }
  }, [courseId]);

  const loadCourseDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/course-management/courses/${courseId}`);
      setCourse(response.data);
    } catch (error: any) {
      console.error("Error loading course details:", error);
      alert("Failed to load course details");
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      // Get student profile
      const studentProfileResponse = await api.get('/student-profile/me');
      const student = studentProfileResponse.data;
      
      if (student && student.student_id) {
        // Get student's enrollments
        const enrollmentsResponse = await api.get(`/course-management/enrollments/student/${student.student_id}`);
        const enrollments = enrollmentsResponse.data;
        
        // Check if enrolled in this course
        const courseEnrollment = enrollments.find((e: Enrollment) => 
          e.course_id === parseInt(courseId!) && e.status === "Active"
        );
        
        if (courseEnrollment) {
          setIsEnrolled(true);
          setEnrollment(courseEnrollment);
        }
      }
    } catch (error: any) {
      console.error("Error checking enrollment status:", error);
    }
  };

  const enrollInCourse = async () => {
    try {
      const response = await api.post('/course-management/enrollments/self', {
        course_id: parseInt(courseId!)
      });
      console.log("Enrollment response:", response.data);

      alert("Successfully enrolled in course!");
      setIsEnrolled(true);
      await checkEnrollmentStatus(); // Refresh enrollment status
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      alert(`Failed to enroll: ${error.response?.data?.detail || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white/70 mb-2">Course not found</h3>
          <p className="text-white/50 mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/student/courses")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/student/courses")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Course Details</h1>
              <p className="text-gray-300">View course information and enroll</p>
            </div>
          </div>
        </div>

        {/* Course Info Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-white">{course.title}</h2>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-medium">
                  {course.code}
                </span>
                {isEnrolled && (
                  <div className="flex items-center gap-1 bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Enrolled
                  </div>
                )}
              </div>
              
              <p className="text-white/80 text-lg mb-6 leading-relaxed">
                {course.description || "No description available for this course."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Credits</p>
                    <p className="text-white font-semibold">{course.credits}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Department</p>
                    <p className="text-white font-semibold">{course.department_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Enrolled Students</p>
                    <p className="text-white font-semibold">{course.enrollment_count}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Created</p>
                    <p className="text-white font-semibold">
                      {new Date(course.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enrollment Section */}
          <div className="border-t border-white/20 pt-6">
            {isEnrolled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-green-400 font-semibold">You are enrolled in this course</p>
                    {enrollment && (
                      <p className="text-white/60 text-sm">
                        Enrolled on: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/student/courses")}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  View All Courses
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold mb-1">Ready to enroll?</p>
                  <p className="text-white/60 text-sm">
                    Join {course.enrollment_count} other students in this course
                  </p>
                </div>
                <button
                  onClick={enrollInCourse}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Enroll Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Course Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Course Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/60">Course Code:</span>
                <span className="text-white font-medium">{course.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Credits:</span>
                <span className="text-white font-medium">{course.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Department:</span>
                <span className="text-white font-medium">{course.department_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Status:</span>
                <span className={`font-medium ${course.is_active ? 'text-green-400' : 'text-red-400'}`}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Enrollment Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-white/60">Total Enrolled:</span>
                <span className="text-white font-medium">{course.enrollment_count} students</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Your Status:</span>
                <span className={`font-medium ${isEnrolled ? 'text-green-400' : 'text-orange-400'}`}>
                  {isEnrolled ? 'Enrolled' : 'Not Enrolled'}
                </span>
              </div>
              {enrollment && (
                <div className="flex justify-between">
                  <span className="text-white/60">Enrollment Date:</span>
                  <span className="text-white font-medium">
                    {new Date(enrollment.enrolled_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
