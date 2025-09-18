import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Save, User, Mail, Phone, Building, Stethoscope, 
  CheckCircle, AlertCircle, Key, Eye, EyeOff, GraduationCap
} from "lucide-react";
import { getMe, getDoctorProfile, updateDoctorProfile, updateMe, listDepartments, changePassword } from "../../lib/api";

export default function AccountSettings() {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    specialization: "",
    departmentId: "",
    phone: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [departments, setDepartments] = useState<Array<{ department_id: number; name: string }>>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [meResp, deptResp, docResp] = await Promise.all([
        getMe(),
        listDepartments({ include_inactive: false }),
        getDoctorProfile(),
      ]);

      const user = (meResp?.data as any) || {};
      const doc = (docResp?.data as any) || {};
      const depts = Array.isArray(deptResp?.data) ? deptResp.data : [];
      setDepartments(depts.map((d: any) => ({ department_id: d.department_id, name: d.name })));

      setProfileData({
        fullName: doc?.full_name || user?.doctor_name || user?.full_name || user?.username || "",
        email: user?.email || doc?.email || "",
        specialization: doc?.specialization || "",
        departmentId: doc?.department_id ? String(doc.department_id) : "",
        phone: doc?.phone || "",
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateProfileForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!profileData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      // Update doctor profile (full_name, department)
      await updateDoctorProfile({
        full_name: profileData.fullName,
        department_id: profileData.departmentId ? Number(profileData.departmentId) : undefined,
      });
      // Update auth user email if changed
      await updateMe({ email: profileData.email });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
      // Refresh header name consumers
      await loadUserData();
      
      // Dispatch event to notify other components (like Dashboard) of the update
      window.dispatchEvent(new CustomEvent('profileUpdated'));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePasswordForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      await changePassword({ current_password: passwordData.currentPassword, new_password: passwordData.newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setValidationErrors({});
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1000ms'}} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse" style={{animationDelay: '500ms'}} />
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/doctor/dashboard')}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                    Account Settings
                  </h1>
                  <p className="text-white/70">Manage your profile and security settings</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-2 backdrop-blur-xl border ${
            message.type === 'success' 
              ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' 
              : 'bg-red-500/20 text-red-100 border-red-400/30'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, fullName: e.target.value }));
                      if (validationErrors.fullName) {
                        setValidationErrors(prev => ({ ...prev, fullName: '' }));
                      }
                    }}
                    className={`w-full bg-white/10 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all ${
                      validationErrors.fullName ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-cyan-400'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.fullName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData(prev => ({ ...prev, email: e.target.value }));
                      if (validationErrors.email) {
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`w-full bg-white/10 border rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all ${
                      validationErrors.email ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-cyan-400'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Specialization (optional)
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    value={profileData.specialization}
                    onChange={(e) => setProfileData(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                    placeholder="Choose from known tracks or leave blank"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Department
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <select
                    value={profileData.departmentId}
                    onChange={(e) => setProfileData(prev => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all appearance-none"
                  >
                    <option value="" style={{ backgroundColor: 'rgb(51, 65, 85)', color: 'white' }}>Select department</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={String(d.department_id)} style={{ backgroundColor: 'rgb(51, 65, 85)', color: 'white' }}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-10 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 px-6 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Save className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Password Change */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <Key className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Change Password</h2>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                      if (validationErrors.currentPassword) {
                        setValidationErrors(prev => ({ ...prev, currentPassword: '' }));
                      }
                    }}
                    className={`w-full bg-white/10 border rounded-xl py-3 pl-10 pr-12 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all ${
                      validationErrors.currentPassword ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-400'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {validationErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.currentPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                      if (validationErrors.newPassword) {
                        setValidationErrors(prev => ({ ...prev, newPassword: '' }));
                      }
                    }}
                    className={`w-full bg-white/10 border rounded-xl py-3 pl-10 pr-12 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all ${
                      validationErrors.newPassword ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-400'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {validationErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.newPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                      if (validationErrors.confirmPassword) {
                        setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    className={`w-full bg-white/10 border rounded-xl py-3 pl-10 pr-12 text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition-all ${
                      validationErrors.confirmPassword ? 'border-red-400 focus:border-red-400' : 'border-white/20 focus:border-purple-400'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="text-sm text-white/60 bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="font-medium mb-2">Password Requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li>• At least 8 characters long</li>
                  <li>• Must match confirmation password</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Key className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Changing Password...' : 'Change Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
