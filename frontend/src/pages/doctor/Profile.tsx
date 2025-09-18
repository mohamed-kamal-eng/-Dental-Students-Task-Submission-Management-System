import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Mail, Phone, Calendar, Award,
  FileText, CheckCircle, Edit, Settings,
  Star, Activity, Bell,
  GraduationCap, Stethoscope, Crown, Sparkles, LogOut,
  MapPin, CreditCard, ChevronRight,
  Users, Shield
} from "lucide-react";

import { signOut, getUser } from "../../lib/auth";
import { getDoctorProfile, getDoctorStats, getDoctorRecentActivity } from "../../lib/api";

interface DoctorProfile {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  department?: string;
  licenseNumber?: string;
  yearsOfExperience?: number;
  education?: string;
  certifications?: string[];
  address?: string;
  joinDate?: string;
  role?: string;
  status?: string;
}

interface DoctorStats {
  totalPatients?: number;
  activePatients?: number;
  completedTreatments?: number;
  pendingAppointments?: number;
  averageRating?: number;
  totalReviews?: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  time: string;
  icon: any;
  color: string;
}

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [isAnimated, setIsAnimated] = useState(false);
  
  // State for real data
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [doctorStats, setDoctorStats] = useState<DoctorStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get current user info from auth
  const currentUser = getUser();

  // Load doctor profile data
  const loadDoctorData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load profile, stats, and recent activity in parallel
      const [profileResponse, statsResponse, activityResponse] = await Promise.allSettled([
        getDoctorProfile(),
        getDoctorStats(),
        getDoctorRecentActivity()
      ]);
      
      // Handle profile data
      if (profileResponse.status === 'fulfilled') {
        setDoctorProfile(profileResponse.value.data);
      } else {
        console.error('Failed to load doctor profile:', profileResponse.reason);
      }
      
      // Handle stats data
      if (statsResponse.status === 'fulfilled') {
        setDoctorStats(statsResponse.value.data);
      } else {
        console.error('Failed to load doctor stats:', statsResponse.reason);
      }
      
      // Handle activity data
      if (activityResponse.status === 'fulfilled') {
        const activities = (activityResponse.value.data || []).map((activity: any, index: number) => ({
          id: activity.id || index,
          type: activity.type || 'general',
          title: activity.title || activity.description || 'Activity',
          time: activity.time || activity.created_at || 'Recently',
          icon: getActivityIcon(activity.type),
          color: getActivityColor(activity.type)
        }));
        setRecentActivity(activities);
      } else {
        console.error('Failed to load recent activity:', activityResponse.reason);
      }
      
    } catch (err: any) {
      console.error('Error loading doctor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Load data on mount
  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  const handleGoBack = () => navigate("/doctor/dashboard");
  const handleSignOut = () => signOut("/signin");

  const getInitials = (name?: string) => {
    if (!name) return 'DR';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return CheckCircle;
      case 'review': return Star;
      case 'treatment': return FileText;
      case 'patient': return Users;
      default: return Activity;
    }
  };
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'text-emerald-400';
      case 'review': return 'text-yellow-400';
      case 'treatment': return 'text-blue-400';
      case 'patient': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };
  
  // Fallback to current user data if profile data is not available
  const displayProfile = {
    fullName: doctorProfile?.fullName || currentUser?.full_name || currentUser?.username || 'Doctor',
    email: doctorProfile?.email || currentUser?.email || '',
    role: doctorProfile?.role || currentUser?.role || 'Doctor',
    specialization: doctorProfile?.specialization || 'General Practice',
    department: doctorProfile?.department || 'Medical',
    id: doctorProfile?.id || currentUser?.id || 'N/A',
    phone: doctorProfile?.phone || '',
    address: doctorProfile?.address || '',
    joinDate: doctorProfile?.joinDate || '',
    licenseNumber: doctorProfile?.licenseNumber || '',
    yearsOfExperience: doctorProfile?.yearsOfExperience || 0,
    education: doctorProfile?.education || '',
    certifications: doctorProfile?.certifications || []
  };
  
  const displayStats = doctorStats || {
    totalPatients: 0,
    activePatients: 0,
    completedTreatments: 0,
    pendingAppointments: 0,
    averageRating: 0,
    totalReviews: 0
  };
  
  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-purple-900/90 to-pink-900/90" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1000ms" }} />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-emerald-400/25 to-teal-500/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "500ms" }} />
        </div>
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-sm text-white/70 font-medium">Doctor Profile</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="group flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/15 transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Back to Dashboard</span>
              </button>

              <div className="hidden sm:flex items-center gap-6">
                <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </button>
                <button 
                  onClick={() => navigate("/doctor/account-settings")}
                  className="p-2 text-white/70 hover:text-white transition-colors"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center text-white font-semibold">
                  {getInitials(displayProfile.fullName)}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white">{displayProfile.fullName}</p>
                  <p className="text-xs text-white/60">{displayProfile.specialization}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-white/70 hover:text-white transition-colors group"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Doctor Header Card */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
            <div className="flex flex-col items-start gap-8">
              {/* Doctor Info */}
              <div className="flex items-start gap-6 flex-1">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
                    {getInitials(displayProfile.fullName)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-4xl font-black text-white">{displayProfile.fullName}</h2>
                    <div className="px-4 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-bold border border-emerald-400/30 flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      {displayProfile.role}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-white/70">
                      <CreditCard className="w-4 h-4" />
                      <span>ID: {displayProfile.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Stethoscope className="w-4 h-4" />
                      <span>{displayProfile.specialization} • {displayProfile.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail className="w-4 h-4" />
                      <span>{displayProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone className="w-4 h-4" />
                      <span>{displayProfile.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-4 h-4" />
                      <span>{displayProfile.address || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {displayProfile.joinDate ? new Date(displayProfile.joinDate).toLocaleDateString() : 'Not available'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-300 font-bold">
                        {displayStats.averageRating}/5.0 ({displayStats.totalReviews} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-purple-300 font-medium">{displayProfile.yearsOfExperience} years experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-medium">License: {displayProfile.licenseNumber || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>


        {/* Content */}
        <div className={`transform transition-all duration-1000 ${isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`} style={{ transitionDelay: "200ms" }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Professional Information */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Professional Information</h3>
                </div>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Education & Credentials</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-5 h-5 text-blue-400" />
                        <span className="text-white/90">{displayProfile.education || 'Education not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span className="text-white/90">License: {displayProfile.licenseNumber || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Certifications</h4>
                    <div className="space-y-2">
                      {displayProfile.certifications.length > 0 ? (
                        displayProfile.certifications.map((cert: string, index: number) => (
                          <div key={index} className="flex items-center gap-3">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-white/90">{cert}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-white/60 text-sm">No certifications listed</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Performance Metrics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-black text-emerald-400 mb-1">{displayStats.averageRating}</div>
                        <div className="text-white/60 text-sm">Average Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-black text-blue-400 mb-1">{displayStats.completedTreatments}</div>
                        <div className="text-white/60 text-sm">Completed Treatments</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                </div>

                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-white/10`}>
                            <Icon className={`w-4 h-4 ${activity.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{activity.title}</p>
                            <p className="text-white/60 text-xs">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-white/60 text-sm text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate("/doctor/account-settings")}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left"
                  >
                    <Edit className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Edit Profile</span>
                    <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span className="text-white text-sm">View Schedule</span>
                    <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-left">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">Manage Patients</span>
                    <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
