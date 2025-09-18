import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, BookOpen, Save, X, AlertCircle
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

interface Department {
  department_id: number;
  name: string;
}

export default function CourseEdit() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    code: '',
    credits: 1,
    department_id: 1,
    is_active: 1
  });

  useEffect(() => {
    if (courseId) {
      loadCourseData();
      loadDepartments();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/course-management/courses/${courseId}`);
      const courseData = response.data;
      setCourse(courseData);
      
      // Populate form with existing data
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        code: courseData.code || '',
        credits: courseData.credits || 1,
        department_id: courseData.department_id || 1,
        is_active: courseData.is_active || 1
      });
    } catch (error: any) {
      console.error("Error loading course:", error);
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

  const loadDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data);
    } catch (error: any) {
      console.error("Error loading departments:", error);
      // Fallback to hardcoded departments
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Course code is required";
    }

    if (formData.credits < 1 || formData.credits > 10) {
      newErrors.credits = "Credits must be between 1 and 10";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/course-management/courses/${courseId}`, formData);
      alert("Course updated successfully!");
      navigate(`/doctor/courses/${courseId}`);
    } catch (error: any) {
      console.error("Error updating course:", error);
      if (error.response?.data?.detail) {
        alert(`Error: ${error.response.data.detail}`);
      } else {
        alert("Failed to update course. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading course...</p>
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
            onClick={() => navigate(`/doctor/courses/${courseId}`)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Edit Course</h1>
              <p className="text-gray-300">Update course information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-white font-medium mb-2">
                Course Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="Enter course title"
              />
              {errors.title && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Course Code */}
            <div>
              <label className="block text-white font-medium mb-2">
                Course Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.code ? 'border-red-400' : 'border-white/20'
                }`}
                placeholder="e.g., DENT101"
              />
              {errors.code && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {errors.code}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-white font-medium mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter course description"
              />
            </div>

            {/* Credits and Department */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Credits *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.credits}
                  onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                  className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.credits ? 'border-red-400' : 'border-white/20'
                  }`}
                />
                {errors.credits && (
                  <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors.credits}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Department *
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => handleInputChange('department_id', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept.department_id} value={dept.department_id} className="bg-slate-800 text-white">
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-white font-medium mb-2">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    value="1"
                    checked={formData.is_active === 1}
                    onChange={() => handleInputChange('is_active', 1)}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="is_active"
                    value="0"
                    checked={formData.is_active === 0}
                    onChange={() => handleInputChange('is_active', 0)}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-white">Inactive</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(`/doctor/courses/${courseId}`)}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
