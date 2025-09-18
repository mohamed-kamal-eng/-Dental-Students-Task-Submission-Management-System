import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Save, Calendar, Target, Users, FileText } from "lucide-react";
import { createAssignment } from "../../lib/api";
import { api } from "../../lib/api";

export default function CreateAssignment() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<any[]>([]);
  const [assignmentTypes, setAssignmentTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type_id: "",
    department_id: "",
    target_year: "All",
    deadline: "",
    max_grade: 100.0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Load departments and assignment types from API
    const loadData = async () => {
      try {
        // Load departments using the API function
        const deptResponse = await api.get('/departments');
        if (deptResponse.data) {
          setDepartments(deptResponse.data);
        }
        
        // Load assignment types using the API function
        const typeResponse = await api.get('/assignment-types');
        if (typeResponse.data) {
          setAssignmentTypes(typeResponse.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to hardcoded data
        setDepartments([
          { department_id: 1, name: "Dental Surgery" },
          { department_id: 2, name: "Orthodontics" },
          { department_id: 3, name: "Periodontics" },
          { department_id: 4, name: "Endodontics" },
          { department_id: 5, name: "Oral Surgery" }
        ]);
        
        setAssignmentTypes([
          { type_id: 1, name: "Research Paper", description: "Academic research assignment" },
          { type_id: 2, name: "Case Study", description: "Clinical case analysis" },
          { type_id: 3, name: "Presentation", description: "Oral presentation assignment" },
          { type_id: 4, name: "Clinical Assessment", description: "Clinical evaluation assignment" }
        ]);
      }
    };

    loadData();
  }, []);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate title
    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required";
    }
    
    // Validate type_id
    if (!formData.type_id) {
      newErrors.type_id = "Assignment type is required";
    }
    
    // Validate department_id
    if (!formData.department_id) {
      newErrors.department_id = "Department is required";
    }
    
    // Validate deadline
    if (!formData.deadline) {
      newErrors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.deadline = "Deadline must be in the future";
      }
    }
    
    // Validate max_grade
    if (!formData.max_grade || formData.max_grade <= 0) {
      newErrors.max_grade = "Maximum grade must be greater than 0";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare data for API call
      const assignmentData = {
        ...formData,
        type_id: parseInt(formData.type_id),
        department_id: parseInt(formData.department_id),
        max_grade: parseFloat(formData.max_grade.toString()),
        deadline: new Date(formData.deadline).toISOString()
      };
      
      // Call API to create assignment
      await createAssignment(assignmentData);
      alert("Assignment created successfully!");
      navigate("/doctor/dashboard");
    } catch (error: any) {
      console.error("Error creating assignment:", error);
      
      // Show more specific error message
      let errorMessage = "Failed to create assignment. Please try again.";
      
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error?.response?.status === 403) {
        errorMessage = "Access denied. Doctor profile required.";
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.detail || "Invalid data provided.";
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/doctor/dashboard")}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Create New Assignment</h1>
              <p className="text-white/60">Create a new assignment for your students</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assignment Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter assignment title"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Assignment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assignment Type *
                  </label>
                  <select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.type_id ? 'border-red-500' : 'border-white/20'
                    }`}
                  >
                    <option value="" className="bg-slate-800 text-white">Select assignment type</option>
                    {assignmentTypes.map((type) => (
                      <option key={type.type_id} value={type.type_id} className="bg-slate-800 text-white">
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {errors.type_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.type_id}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department *
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.department_id ? 'border-red-500' : 'border-white/20'
                    }`}
                  >
                    <option value="" className="bg-slate-800 text-white">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.department_id} value={dept.department_id} className="bg-slate-800 text-white">
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department_id && (
                    <p className="text-red-400 text-sm mt-1">{errors.department_id}</p>
                  )}
                </div>

                {/* Target Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target Year
                  </label>
                  <select
                    name="target_year"
                    value={formData.target_year}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="All" className="bg-slate-800 text-white">All Years</option>
                    <option value="First" className="bg-slate-800 text-white">First Year</option>
                    <option value="Second" className="bg-slate-800 text-white">Second Year</option>
                    <option value="Third" className="bg-slate-800 text-white">Third Year</option>
                    <option value="Fourth" className="bg-slate-800 text-white">Fourth Year</option>
                    <option value="Fifth" className="bg-slate-800 text-white">Fifth Year</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.deadline ? 'border-red-500' : 'border-white/20'
                    }`}
                  />
                  {errors.deadline && (
                    <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>
                  )}
                </div>

                {/* Max Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maximum Grade *
                  </label>
                  <input
                    type="number"
                    name="max_grade"
                    value={formData.max_grade}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="1000"
                    step="0.1"
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.max_grade ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter maximum grade"
                  />
                  {errors.max_grade && (
                    <p className="text-red-400 text-sm mt-1">{errors.max_grade}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Enter assignment description and instructions"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {isSubmitting ? "Creating Assignment..." : "Create Assignment"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/doctor/dashboard")}
                className="px-8 py-4 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
