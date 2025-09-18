import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Plus, Search, Filter, Users, 
  GraduationCap, Calendar, Clock, Star, Eye, Edit, Trash2
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

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadCourses();
    loadDepartments();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      console.log("Loading courses...");
      console.log("Auth token:", localStorage.getItem('token'));
      
      const coursesData = await getCourses();
      console.log("Courses loaded:", coursesData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
      console.error("Error details:", error.response?.data);
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert("Please log in again. Your session may have expired.");
        navigate("/signin");
      } else {
        alert("Failed to load courses. Please try again.");
        // Set empty array to show "no courses" message
        setCourses([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      console.log("Loading departments...");
      const response = await api.get('/departments');
      console.log("Departments loaded:", response.data);
      setDepartments(response.data);
    } catch (error) {
      console.error("Error loading departments:", error);
      console.error("Error details:", error.response?.data);
      
      // Fallback to hardcoded departments if API fails
      setDepartments([
        { department_id: 1, name: "Oral Surgery" },
        { department_id: 2, name: "Orthodontics" },
        { department_id: 3, name: "Periodontics" },
        { department_id: 4, name: "Endodontics" },
        { department_id: 5, name: "Prosthodontics" },
        { department_id: 6, name: "Pediatric Dentistry" },
        { department_id: 7, name: "Oral Medicine" },
        { department_id: 8, name: "Dental Radiology" }
      ]);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || 
                             course.department_id.toString() === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const handleCreateCourse = () => {
    navigate("/doctor/courses/create");
  };

  const handleViewCourse = (courseId: number) => {
    navigate(`/doctor/courses/${courseId}`);
  };

  const handleEditCourse = (courseId: number) => {
    navigate(`/doctor/courses/${courseId}/edit`);
  };

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
            onClick={() => navigate("/doctor/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Course Management</h1>
              <p className="text-gray-300">Manage and view all courses</p>
            </div>
          </div>
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
                className="w-full bg-white/10 border border-white/20 rounded-lg px-10 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-white/60 w-4 h-4" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all" className="bg-slate-800 text-white">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.department_id} value={dept.department_id} className="bg-slate-800 text-white">
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Course
            </button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.course_id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {course.title}
                    </h3>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg text-xs font-medium">
                      {course.code}
                    </span>
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewCourse(course.course_id)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="View Course"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditCourse(course.course_id)}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit Course"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/70 mb-2">No courses found</h3>
            <p className="text-white/50 mb-6">
              {searchTerm || selectedDepartment !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first course"
              }
            </p>
            {!searchTerm && selectedDepartment === "all" && (
              <button
                onClick={handleCreateCourse}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Course
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
