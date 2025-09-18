import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Save, X } from "lucide-react";
import { createStudent } from "../../lib/api";

export default function AddStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    student_number: "",
    full_name: "",
    email: "",
    phone: "",
    year_level: "Fourth",
    status: "Active",
    graduation_year: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate student number - must be exactly 4 digits
    if (!formData.student_number) {
      newErrors.student_number = "Student number is required";
    } else if (!/^\d{4}$/.test(formData.student_number)) {
      newErrors.student_number = "Student number must be exactly 4 digits";
    }
    
    // Validate full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
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
      const studentData = {
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null
      };
      
      // Call API to create student
      await createStudent(studentData);
      
      // Show success message
      alert("Student added successfully!");
      
      // Redirect back to students list
      navigate("/doctor/students");
    } catch (error: any) {
      console.error("Error adding student:", error);
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        (error?.response?.status === 401 ? "Unauthorized - please sign in again." : undefined) ||
        (error?.response?.status === 403 ? "Forbidden - doctor role required." : undefined) ||
        (error?.response?.status === 409 ? "Student already exists." : undefined) ||
        error?.message ||
        "Failed to add student. Please try again.";
      alert(message);
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
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Add New Student</h1>
            <p className="text-gray-300">Register a new student in the system</p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Student Number *
                  </label>
                  <input
                    type="text"
                    name="student_number"
                    value={formData.student_number}
                    onChange={handleInputChange}
                    required
                    maxLength={4}
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.student_number ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter 4-digit student number"
                  />
                  {errors.student_number && (
                    <p className="text-red-400 text-sm mt-1">{errors.student_number}</p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.full_name ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && (
                    <p className="text-red-400 text-sm mt-1">{errors.full_name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Year Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Year Level *
                  </label>
                  <select
                    name="year_level"
                    value={formData.year_level}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="First" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>First Year</option>
                    <option value="Second" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Second Year</option>
                    <option value="Third" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Third Year</option>
                    <option value="Fourth" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Fourth Year</option>
                    <option value="Fifth" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Fifth Year</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Active" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Active</option>
                    <option value="Inactive" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Inactive</option>
                    <option value="Graduated" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Graduated</option>
                    <option value="Suspended" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Suspended</option>
                  </select>
                </div>

                {/* Graduation Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Expected Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduation_year"
                    value={formData.graduation_year}
                    onChange={handleInputChange}
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter graduation year"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Additional notes about the student"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                type="button"
                onClick={() => navigate("/doctor/students")}
                className="px-6 py-3 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "Adding..." : "Add Student"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
