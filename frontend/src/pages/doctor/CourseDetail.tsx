import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Users, Calendar, 
  GraduationCap, Edit, Plus, Eye, FileText,
  Activity
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

interface Assignment {
  assignment_id: number;
  title: string;
  description: string;
  deadline: string;
  created_at: string;
  max_grade: number;
  target_year: string;
}

interface Student {
  enrollment_id: number;
  student_id: number;
  course_title: string;
  course_code: string;
  enrolled_at: string;
  status: string;
}

export default function CourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'students'>('overview');

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      
      // Load course details
      const courseResponse = await api.get(`/course-management/courses/${courseId}`);
      setCourse(courseResponse.data);

      // Load assignments for this course
      const assignmentsResponse = await api.get(`/course-management/courses/${courseId}/assignments`);
      setAssignments(assignmentsResponse.data || []);

      // Load enrolled students
      const studentsResponse = await api.get(`/course-management/enrollments/course/${courseId}`);
      setStudents(studentsResponse.data || []);

    } catch (error: any) {
      console.error("Error loading course data:", error);
      if (error.response?.status === 404) {
        alert("Course not found");
        navigate("/doctor/courses");
      } else {
        alert("Failed to load course data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourse = () => {
    navigate(`/doctor/courses/${courseId}/edit`);
  };

  const handleCreateAssignment = () => {
    navigate(`/doctor/create-assignment?courseId=${courseId}`);
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
          <button
            onClick={() => navigate("/doctor/courses")}
            className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
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
            onClick={() => navigate("/doctor/courses")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-medium">
                  {course.code}
                </span>
              </div>
              <p className="text-gray-300">{course.department_name}</p>
            </div>
          </div>
          <button
            onClick={handleEditCourse}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Course
          </button>
        </div>

        {/* Course Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{course.enrollment_count}</h3>
                <p className="text-white/70 text-sm">Enrolled Students</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{assignments.length}</h3>
                <p className="text-white/70 text-sm">Assignments</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{course.credits}</h3>
                <p className="text-white/70 text-sm">Credits</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{course.is_active ? 'Active' : 'Inactive'}</h3>
                <p className="text-white/70 text-sm">Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 mb-8">
          <div className="flex border-b border-white/10">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpen },
              { id: 'assignments', label: 'Assignments', icon: FileText },
              { id: 'students', label: 'Students', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === id
                    ? 'text-cyan-300 border-b-2 border-cyan-400'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Description</h3>
                  <p className="text-white/70 leading-relaxed">
                    {course.description || "No description available for this course."}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Course Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm mb-1">Created</p>
                      <p className="text-white font-medium">{new Date(course.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/60 text-sm mb-1">Department</p>
                      <p className="text-white font-medium">{course.department_name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assignments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Assignments</h3>
                  <button
                    onClick={handleCreateAssignment}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Assignment
                  </button>
                </div>
                
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60">No assignments created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.assignment_id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-2">{assignment.title}</h4>
                            <p className="text-white/60 text-sm mb-3">{assignment.description}</p>
                            <div className="flex items-center gap-4 text-sm text-white/60">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>Max Grade: {assignment.max_grade}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <GraduationCap className="w-4 h-4" />
                                <span>Year: {assignment.target_year}</span>
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Enrolled Students</h3>
                  <span className="text-white/60">{students.length} students</span>
                </div>
                
                {students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/30 mx-auto mb-3" />
                    <p className="text-white/60">No students enrolled yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.enrollment_id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {student.student_id ? student.student_id.toString().charAt(0) : 'S'}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-medium">Student #{student.student_id}</h4>
                              <p className="text-white/60 text-sm">Status: {student.status}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white/60 text-sm">Enrolled</p>
                            <p className="text-white text-sm">{new Date(student.enrolled_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
