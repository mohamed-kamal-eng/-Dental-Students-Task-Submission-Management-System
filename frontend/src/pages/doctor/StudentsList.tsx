import React, { useState, useEffect } from "react";
import { ArrowLeft, UserPlus, Search, Filter, Eye, Edit, Trash2, RefreshCw, Users, Mail, Phone, GraduationCap, X, Save, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getStudents, updateStudent, deleteStudent, bulkImportStudents } from "../../lib/api";

export default function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    student_number: "",
    email: "",
    phone: "",
    year_level: "Fourth",
    status: "Active",
    graduation_year: "",
    notes: ""
  });
  const [editErrors, setEditErrors] = useState<{[key: string]: string}>({});
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const validateEditForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate student number - must be exactly 4 digits
    if (!editFormData.student_number) {
      newErrors.student_number = "Student number is required";
    } else if (!/^\d{4}$/.test(editFormData.student_number)) {
      newErrors.student_number = "Student number must be exactly 4 digits";
    }
    
    // Validate full name
    if (!editFormData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (error: any) {
      console.error('Error loading students:', error);
      // If it's an auth error, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === "all" || student.year_level === filterYear;
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    
    return matchesSearch && matchesYear && matchesStatus;
  });

  const handleViewStudent = (student: any) => {
    const fullName = `${student.full_name} ${student.student_number}`;
    navigate(`/doctor/student?id=${student.student_id}&name=${encodeURIComponent(fullName)}&year=${student.year_level}&dept=${student.department || ''}`);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name || "",
      student_number: student.student_number || "",
      email: student.email || "",
      phone: student.phone || "",
      year_level: student.year_level || "Fourth",
      status: student.status || "Active",
      graduation_year: student.graduation_year?.toString() || "",
      notes: student.notes || ""
    });
    setEditErrors({}); // Clear any previous errors
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Validate form before submitting
    if (!validateEditForm()) {
      return;
    }

    try {
      const updateData = {
        ...editFormData,
        graduation_year: editFormData.graduation_year ? parseInt(editFormData.graduation_year) : null
      };

      await updateStudent(editingStudent.student_id, updateData);
      alert('Student updated successfully!');
      setShowEditModal(false);
      setEditingStudent(null);
      loadStudents(); // Reload the list
    } catch (error) {
      console.error('Error updating student:', error);
      alert('Failed to update student. Please try again.');
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (editErrors[name]) {
      setEditErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
      try {
        console.log('Attempting to delete student ID:', studentId);
        await deleteStudent(studentId);
        alert('Student deleted successfully!');
        loadStudents(); // Reload the list
      } catch (error: any) {
        console.error('Error deleting student:', error);
        console.error('Student ID that failed:', studentId);
        console.error('Error response:', error.response);
        
        if (error.response?.status === 401) {
          alert('Unauthorized - please login again');
          localStorage.removeItem('token');
          navigate('/signin');
        } else if (error.response?.status === 404) {
          alert(`Student not found. The student may have already been deleted. Refreshing the list...`);
          loadStudents(); // Refresh to show current state
        } else {
          const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
          alert(`Failed to delete student: ${errorMsg}`);
        }
      }
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) {
      // Trigger file input click
      const fileInput = document.getElementById('bulk-import-file') as HTMLInputElement;
      fileInput?.click();
      return;
    }

    setIsImporting(true);
    try {
      console.log('Starting bulk import...');
      console.log('File:', importFile.name, 'Size:', importFile.size);
      
      const result = await bulkImportStudents(importFile);
      console.log('Import result:', result);
      alert(`Successfully imported ${result.imported} students! Skipped: ${result.skipped}`);
      setImportFile(null);
      loadStudents(); // Refresh the students list
    } catch (error) {
      console.error('Bulk import error:', error);
      console.error('Error details:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Network error. Please check if the server is running.'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        setImportFile(file);
      } else {
        alert('Please select a .txt file');
        event.target.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/doctor/dashboard")}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Students Management</h1>
              <p className="text-gray-300">Manage and view all students</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/doctor/students/add")}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300"
            >
              <UserPlus className="w-5 h-5" />
              Add Student
            </button>
            
            <button
              onClick={handleBulkImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-lg hover:from-cyan-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className={`w-5 h-5 ${isImporting ? 'animate-spin' : ''}`} />
              {isImporting ? 'Importing...' : importFile ? `Import ${importFile.name}` : 'Bulk Import'}
            </button>
            
            <input
              id="bulk-import-file"
              type="file"
              accept=".txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{students.length}</p>
                <p className="text-white/70 text-sm">Total Students</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{students.filter(s => s.status === 'Active').length}</p>
                <p className="text-white/70 text-sm">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{filteredStudents.length}</p>
                <p className="text-white/70 text-sm">Filtered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
              <input
                type="text"
                placeholder="Search students by name, number, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
              />
            </div>
            
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all" className="bg-slate-800 text-white">All Years</option>
              <option value="First" className="bg-slate-800 text-white">First Year</option>
              <option value="Second" className="bg-slate-800 text-white">Second Year</option>
              <option value="Third" className="bg-slate-800 text-white">Third Year</option>
              <option value="Fourth" className="bg-slate-800 text-white">Fourth Year</option>
              <option value="Fifth" className="bg-slate-800 text-white">Fifth Year</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="all" className="bg-slate-800 text-white">All Status</option>
              <option value="Active" className="bg-slate-800 text-white">Active</option>
              <option value="Inactive" className="bg-slate-800 text-white">Inactive</option>
              <option value="Graduated" className="bg-slate-800 text-white">Graduated</option>
              <option value="Suspended" className="bg-slate-800 text-white">Suspended</option>
            </select>
            
            <button
              onClick={loadStudents}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/15 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white/70">Loading students...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Student Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Student Number</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Year Level</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white/70">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.student_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                            {student.full_name?.slice(0, 2).toUpperCase() || 'ST'}
                          </div>
                          <div>
                            <p className="font-medium text-white">{student.full_name}</p>
                            <p className="text-white/60 text-sm">ID: {student.student_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white font-mono">{student.student_number}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-400/30">
                          {student.year_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm border ${
                          student.status === 'Active' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            : student.status === 'Graduated'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {student.email && (
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                              <Mail className="w-3 h-3" />
                              <span>{student.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-2 text-white/70 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.student_id, `${student.full_name} ${student.student_number}`)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredStudents.length === 0 && (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/70">No students found</p>
                  <p className="text-white/50 text-sm">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Student</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStudent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={editFormData.full_name}
                      onChange={handleEditInputChange}
                      required
                      className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        editErrors.full_name ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter full name"
                    />
                    {editErrors.full_name && (
                      <p className="text-red-400 text-sm mt-1">{editErrors.full_name}</p>
                    )}
                  </div>

                  {/* Student Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Student Number *
                    </label>
                    <input
                      type="text"
                      name="student_number"
                      value={editFormData.student_number}
                      onChange={handleEditInputChange}
                      required
                      maxLength={4}
                      className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        editErrors.student_number ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter 4-digit student number"
                    />
                    {editErrors.student_number && (
                      <p className="text-red-400 text-sm mt-1">{editErrors.student_number}</p>
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
                      value={editFormData.email}
                      onChange={handleEditInputChange}
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
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
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
                      value={editFormData.year_level}
                      onChange={handleEditInputChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="First" className="bg-slate-800 text-white">First Year</option>
                      <option value="Second" className="bg-slate-800 text-white">Second Year</option>
                      <option value="Third" className="bg-slate-800 text-white">Third Year</option>
                      <option value="Fourth" className="bg-slate-800 text-white">Fourth Year</option>
                      <option value="Fifth" className="bg-slate-800 text-white">Fifth Year</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={editFormData.status}
                      onChange={handleEditInputChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Active" className="bg-slate-800 text-white">Active</option>
                      <option value="Inactive" className="bg-slate-800 text-white">Inactive</option>
                      <option value="Graduated" className="bg-slate-800 text-white">Graduated</option>
                      <option value="Suspended" className="bg-slate-800 text-white">Suspended</option>
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
                      value={editFormData.graduation_year}
                      onChange={handleEditInputChange}
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 10}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter graduation year"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={editFormData.notes}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Enter any additional notes"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300"
                  >
                    <Save className="w-4 h-4" />
                    Update Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/15 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
