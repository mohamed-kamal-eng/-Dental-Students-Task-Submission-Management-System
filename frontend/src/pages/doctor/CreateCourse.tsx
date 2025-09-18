import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookMarked, Save, X, Calendar, Users, Target, GraduationCap } from "lucide-react";
import { createCourse, api } from "../../lib/api";

export default function CreateCourse() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    credits: 3,
    department_id: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load departments from API
    const loadData = async () => {
      try {
        // Use the centralized API instance that handles auth automatically
        const deptResponse = await api.get('/departments');
        if (deptResponse.data) {
          setDepartments(deptResponse.data);
        }
      } catch (error) {
        console.error('Error loading departments:', error);
        // Fallback to hardcoded data
        setDepartments([
          { department_id: 1, name: "Dental Surgery" },
          { department_id: 2, name: "Orthodontics" },
          { department_id: 3, name: "Periodontics" },
          { department_id: 4, name: "Endodontics" },
          { department_id: 5, name: "Oral Surgery" }
        ]);
      }
    };
    
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Prepare course data
      const courseData = {
        ...formData,
        department_id: parseInt(formData.department_id),
        credits: parseInt(formData.credits.toString())
      };
      
      // Call API to create course
      const result = await createCourse(courseData);
      
      // Redirect back to dashboard
      navigate("/doctor/dashboard");
    } catch (error) {
      console.error("Error creating course:", error);
      alert(`Failed to create course: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Create New Course</h1>
              <p className="text-gray-300">Set up a new course for your students</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter course title (e.g., Advanced Oral Surgery)"
                  />
                </div>

                {/* Course Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., DENT401"
                  />
                </div>

                {/* Credits */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Credits *
                  </label>
                  <input
                    type="number"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="10"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3"
                  />
                </div>

                {/* Department */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department *
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="" className="bg-slate-800 text-white">Select department</option>
                    {departments.map((dept, index) => (
                      <option key={dept.department_id || dept.id || index} value={dept.department_id || dept.id} className="bg-slate-800 text-white">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Course Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the course content, learning objectives, and requirements"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate("/doctor/dashboard")}
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
