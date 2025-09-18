import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Search, Filter, Users, 
  GraduationCap, Eye, UserPlus, CheckCircle
} from "lucide-react";
import { getCourses, api } from "../../lib/api";

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
  course_title: string;
  course_code: string;
  course_credits: number;
  department_name: string;
}

export default function StudentCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "enrolled">("available");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("Loading courses and enrollments...");
      const [coursesData, enrollmentsData] = await Promise.all([
        getCourses(),
        loadEnrollments()
      ]);
      console.log("Courses loaded:", coursesData);
      console.log("Enrollments loaded:", enrollmentsData);
      console.log("Number of courses:", coursesData?.length);
      console.log("Number of enrollments:", enrollmentsData?.length);
      
      setCourses(coursesData);
      setEnrollments(enrollmentsData || []);
      
      // Debug: Log enrolled course IDs
      if (enrollmentsData && enrollmentsData.length > 0) {
        const enrolledIds = enrollmentsData.map((e: any) => e.course_id);
        console.log("Enrolled course IDs:", enrolledIds);
        
        // Check if any courses match the enrolled IDs
        const matchingCourses = coursesData.filter((course: any) => enrolledIds.includes(course.course_id));
        console.log("Matching enrolled courses:", matchingCourses);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEnrollments = async () => {
    try {
      // Get student profile using "me" endpoint (students can access their own profile)
      console.log("Getting student profile...");
      const studentProfileResponse = await api.get('/student-profile/me');
      const student = studentProfileResponse.data;
      console.log("Student profile:", student);
      
      if (student && student.student_id) {
        console.log(`Getting enrollments for student ID: ${student.student_id}`);
        const enrollmentsResponse = await api.get(`/course-management/enrollments/student/${student.student_id}`);
        console.log("Enrollments response:", enrollmentsResponse.data);
        setEnrollments(enrollmentsResponse.data);
        return enrollmentsResponse.data;
      } else {
        console.log("No student profile found for current user");
      }
      return [];
    } catch (error: any) {
      console.error("Error loading enrollments:", error);
      console.error("Error details:", error.response?.data);
      return [];
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        console.log("Loading departments...");
        const response = await api.get('/departments');
        console.log("Departments loaded:", response.data);
        setDepartments(response.data);
      } catch (error: any) {
        console.error("Error loading departments:", error);
        console.error("Error details:", error.response?.data);
      }
    };
    
    loadDepartments();
  }, []);

  const enrollInCourse = async (courseId: number) => {
    try {
      console.log("Enrolling in course:", courseId);
      const response = await api.post('/course-management/enrollments/self', {
        course_id: courseId
      });
      console.log("Enrollment response:", response.data);

      alert("Successfully enrolled in course!");
      await loadData(); // Reload data and wait for it to complete
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      console.error("Full error:", error.response);
      alert(`Failed to enroll: ${error.response?.data?.detail || error.message}`);
    }
  };

  const viewCourse = (course: Course) => {
    // Navigate to course details page
    navigate(`/student/courses/${course.course_id}`);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || 
                             course.department_id.toString() === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const availableCourses = filteredCourses.filter(course => !enrolledCourseIds.includes(course.course_id));
  const enrolledCourses = filteredCourses.filter(course => enrolledCourseIds.includes(course.course_id));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading courses...</p>
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
            onClick={() => navigate("/student/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Course Catalog</h1>
              <p className="text-gray-300">Browse and enroll in courses</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "available"
                ? "bg-blue-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            Available Courses ({availableCourses.length})
          </button>
          <button
            onClick={() => setActiveTab("enrolled")}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "enrolled"
                ? "bg-green-500 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            My Courses ({enrolledCourses.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search courses by title, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-white/60 w-4 h-4" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all" className="bg-slate-800 text-white">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.department_id} value={dept.department_id} className="bg-slate-800 text-white">
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "available" ? availableCourses : enrolledCourses).map((course) => {
            const enrollment = enrollments.find(e => e.course_id === course.course_id);
            const isEnrolled = !!enrollment;
            
            return (
              <div
                key={course.course_id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-green-300 transition-colors">
                        {course.title}
                      </h3>
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-xs font-medium">
                        {course.code}
                      </span>
                      {isEnrolled && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">
                      {course.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" />
                        <span>{course.credits} credits</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollment_count} enrolled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/60">
                    <p>{course.department_name}</p>
                    <p>{new Date(course.created_at).toLocaleDateString()}</p>
                    {isEnrolled && enrollment && (
                      <p className="text-green-400 font-medium">
                        Enrolled: {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewCourse(course)}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="View Course"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!isEnrolled && (
                      <button
                        onClick={() => enrollInCourse(course.course_id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Enroll
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(activeTab === "available" ? availableCourses : enrolledCourses).length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/70 mb-2">
              {activeTab === "available" ? "No available courses" : "No enrolled courses"}
            </h3>
            <p className="text-white/50">
              {activeTab === "available" 
                ? "No courses match your search criteria"
                : "You haven't enrolled in any courses yet"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
