import { useState, useEffect } from "react";
import { 
  Users, Clock, Star, Settings, MessageSquare, Upload, BarChart3,
  GraduationCap, User, BookOpen, FileText, CheckCircle, 
  XCircle, Bell, LogOut, Sparkles, Crown, Award, Target, 
  Activity, Plus, ArrowRight, Eye, Download, MessageCircle, Zap, Shield,
  Search, Filter, Edit, Calendar, TrendingUp, AlertTriangle, ThumbsUp,
  UserCheck, ClipboardList, PieChart, Mail, Phone, BookMarked,
  ChartLine, Headphones, Coffee, Timer, Brain, Send
} from "lucide-react";

// Mock data - replace with actual API calls
const mockAssistant = {
  id: 1,
  fullName: "Sarah Johnson",
  email: "sarah.ta@dental.edu",
  role: "Teaching Assistant",
  department: "Oral Biology",
  avatar: null
};

const mockStats = {
  totalStudents: 245,
  pendingReviews: 12,
  averageRating: 4.7,
  gradesSent: 48,
  messagesReplied: 23,
  hoursWorked: 35,
  sessionsConducted: 8,
  helpRequestsResolved: 31
};

const mockRecentActivities = [
  {
    id: 1,
    type: "submission",
    description: "Reviewed John Doe's Assignment 3",
    student: "John Doe",
    timestamp: "2 hours ago",
    status: "completed",
    priority: "medium"
  },
  {
    id: 2,
    type: "review",
    description: "Sarah Miller left a 5-star review",
    student: "Sarah Miller",
    timestamp: "4 hours ago",
    status: "positive",
    priority: "low"
  },
  {
    id: 3,
    type: "help",
    description: "Assisted Alex Lee with Quiz 2",
    student: "Alex Lee",
    timestamp: "6 hours ago",
    status: "resolved",
    priority: "high"
  },
  {
    id: 4,
    type: "grade",
    description: "Graded Maria Garcia's Lab Report",
    student: "Maria Garcia",
    timestamp: "1 day ago",
    status: "completed",
    priority: "medium"
  }
];

const mockPendingTasks = [
  {
    id: 1,
    title: "Grade Midterm Exams",
    description: "Review 45 midterm submissions",
    dueDate: "2025-01-25",
    priority: "high",
    progress: 65,
    estimatedTime: "4 hours"
  },
  {
    id: 2,
    title: "Prepare Lab Session",
    description: "Set up materials for next week's lab",
    dueDate: "2025-01-27",
    priority: "medium",
    progress: 30,
    estimatedTime: "2 hours"
  },
  {
    id: 3,
    title: "Office Hours",
    description: "Student consultation sessions",
    dueDate: "2025-01-26",
    priority: "medium",
    progress: 80,
    estimatedTime: "3 hours"
  }
];

const mockTopStudents = [
  { id: 1, name: "Ahmed Hassan", grade: 95, engagement: "High", course: "Oral Biology" },
  { id: 2, name: "Sarah Miller", grade: 92, engagement: "High", course: "Dental Anatomy" },
  { id: 3, name: "John Martinez", grade: 89, engagement: "Medium", course: "Oral Biology" }
];

const mockQuickActions = [
  { id: 1, title: "Grade Submissions", icon: Upload, color: "from-blue-500 to-cyan-500", description: "Review student work" },
  { id: 2, title: "Send Messages", icon: Send, color: "from-green-500 to-emerald-500", description: "Contact students" },
  { id: 3, title: "Schedule Office Hours", icon: Calendar, color: "from-purple-500 to-pink-500", description: "Set availability" },
  { id: 4, title: "Generate Reports", icon: BarChart3, color: "from-orange-500 to-red-500", description: "View analytics" }
];

export default function AssistantDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [assistant, setAssistant] = useState(mockAssistant);
  const [stats, setStats] = useState(mockStats);
  const [recentActivities, setRecentActivities] = useState(mockRecentActivities);
  const [pendingTasks, setPendingTasks] = useState(mockPendingTasks);
  const [topStudents, setTopStudents] = useState(mockTopStudents);
  const [quickActions, setQuickActions] = useState(mockQuickActions);
  const [isAnimated, setIsAnimated] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsAnimated(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSignOut = () => {
    // In a real app, you would clear the token and redirect
    // For demo purposes, we'll just show an alert
    alert('Sign out functionality would redirect to login page');
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'submission': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'review': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'help': return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'grade': return 'text-amber-400 bg-amber-500/20 border-amber-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'submission': return Upload;
      case 'review': return Star;
      case 'help': return Headphones;
      case 'grade': return Award;
      default: return Activity;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-500/10';
      case 'medium': return 'border-l-amber-400 bg-amber-500/10';
      case 'low': return 'border-l-green-400 bg-green-500/10';
      default: return 'border-l-gray-400 bg-gray-500/10';
    }
  };

  const handleQuickAction = (actionTitle) => {
    alert(`${actionTitle} clicked! This would navigate to the respective page.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading your dashboard...</p>
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
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
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
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                  DentalEd Portal
                </h1>
                <p className="text-sm text-white/70 font-medium">Teaching Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-6">
                <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </button>
                <button className="p-2 text-white/70 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-white">{assistant.fullName}</p>
                  <p className="text-xs text-white/60">{assistant.department}</p>
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
        {/* Welcome Section */}
        <div className={`mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black bg-gradient-to-r from-white via-cyan-100 to-blue-100 bg-clip-text text-transparent">
                Welcome back, {assistant.fullName.split(' ')[0]}!
              </h2>
              <p className="text-white/70 text-lg">Support students and assist with their learning journey</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '200ms'}}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-blue-400 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.totalStudents}</h3>
            <p className="text-white/70 text-sm font-medium">Total Students</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-300">Under your guidance</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Urgent</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.pendingReviews}</h3>
            <p className="text-white/70 text-sm font-medium">Pending Reviews</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs text-amber-300">Need attention</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ThumbsUp className="w-4 h-4" />
                <span>Excellent</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.averageRating}/5</h3>
            <p className="text-white/70 text-sm font-medium">Average Rating</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-300">Student feedback</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 transform transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Timer className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-purple-400 text-sm">
                <Coffee className="w-4 h-4" />
                <span>This week</span>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-1">{stats.hoursWorked}h</h3>
            <p className="text-white/70 text-sm font-medium">Hours Worked</p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-xs text-purple-300">Productive week</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity - Enhanced */}
          <div className={`lg:col-span-2 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '400ms'}}>
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-black text-white">Recent Activity</h3>
                </div>
                <button className="group flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-medium text-sm transition-colors">
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className={`bg-white/5 backdrop-blur-sm rounded-2xl border-l-4 border-white/10 p-6 group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] ${getPriorityColor(activity.priority)}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            <ActivityIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{activity.description}</h4>
                            <p className="text-cyan-300 text-sm">{activity.student}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60 text-sm">{activity.timestamp}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${{ high: 'bg-red-500/20 text-red-300', medium: 'bg-amber-500/20 text-amber-300', low: 'bg-green-500/20 text-green-300' }[activity.priority]}`}>
                            {activity.priority}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button className="group bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-2xl hover:shadow-blue-500/25">
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Reviews</span>
                </button>
                <button className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-2xl hover:shadow-emerald-500/25">
                  <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Grade</span>
                </button>
                <button className="group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-2xl hover:shadow-purple-500/25">
                  <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="text-sm">Stats</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Pending Tasks */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '600ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Pending Tasks</h3>
                </div>

                <div className="space-y-4">
                  {pendingTasks.map((task, index) => (
                    <div key={task.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white mb-1">{task.title}</h4>
                          <p className="text-white/60 text-xs mb-2">{task.description}</p>
                          <div className="flex items-center gap-2 text-xs text-white/50">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${{ high: 'bg-red-500/20 text-red-300', medium: 'bg-amber-500/20 text-amber-300', low: 'bg-green-500/20 text-green-300' }[task.priority]}`}>
                          {task.priority}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">Progress</span>
                          <span className="text-white font-medium">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Timer className="w-3 h-3" />
                          <span>Est. {task.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Students */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '700ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Top Students</h3>
                </div>

                <div className="space-y-3">
                  {topStudents.map((student, index) => (
                    <div key={student.id} className="bg-white/5 rounded-2xl p-4 border border-white/10 group hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                          'bg-gradient-to-r from-orange-400 to-red-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">{student.name}</h4>
                          <p className="text-white/60 text-xs">{student.course}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-300">{student.grade}%</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${student.engagement === 'High' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {student.engagement}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '800ms'}}>
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-white">Quick Actions</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {quickActions.map((action) => {
                    const ActionIcon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.title)}
                        className={`group bg-gradient-to-r ${action.color} hover:scale-[1.02] text-white font-bold py-4 px-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 shadow-lg hover:shadow-2xl`}
                      >
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ActionIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="text-sm font-bold">{action.title}</div>
                          <div className="text-xs opacity-80">{action.description}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })}
                </div>

                {/* Additional Stats */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-lg font-bold text-cyan-300">{stats.sessionsConducted}</div>
                      <div className="text-xs text-white/60">Sessions</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-lg font-bold text-purple-300">{stats.helpRequestsResolved}</div>
                      <div className="text-xs text-white/60">Help Requests</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className={`mt-12 transform transition-all duration-1000 ${isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{transitionDelay: '900ms'}}>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold">System Status</h4>
                  <p className="text-white/60 text-sm">All systems operational</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-300 text-sm font-medium">Online</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="p-2 text-white/70 hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-white/70 hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-white/70 hover:text-white transition-colors">
                    <BookMarked className="w-4 h-4" />
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