import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Users, FileText, Award, BarChart3, PieChart, Activity, AlertCircle } from "lucide-react";
import { getAnalytics } from "../../lib/api";

export default function Analytics() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [analyticsData, setAnalyticsData] = useState<any>({
    overview: {
      totalStudents: 0,
      activeAssignments: 0,
      totalSubmissions: 0,
      averageGrade: 0
    },
    submissions: {
      labels: [],
      data: []
    },
    grades: {
      excellent: 0,
      good: 0,
      average: 0,
      below: 0
    },
    performance: {
      labels: [],
      data: []
    },
    topStudents: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load analytics data from API
      const response = await getAnalytics(selectedPeriod);
      console.log("Analytics API response:", response);
      
      // Ensure the response has the expected structure
      const safeData = {
        overview: response?.overview || {
          totalStudents: 0,
          activeAssignments: 0,
          totalSubmissions: 0,
          averageGrade: 0
        },
        submissions: response?.submissions || {
          labels: [],
          data: []
        },
        grades: response?.grades || {
          excellent: 0,
          good: 0,
          average: 0,
          below: 0
        },
        performance: response?.performance || {
          labels: [],
          data: []
        },
        topStudents: response?.top_students || response?.topStudents || []
      };
      
      setAnalyticsData(safeData);
    } catch (err) {
      console.error("Error loading analytics:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load analytics data";
      setError(errorMessage);
      
      // Keep the default empty state structure
    } finally {
      setIsLoading(false);
    }
  };

  const periods = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
              <p className="text-gray-300">Comprehensive insights into your courses and students</p>
            </div>
          </div>
          
          {/* Period Selector */}
          <div className="flex bg-white/10 rounded-lg p-1">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  selectedPeriod === period.value
                    ? "bg-purple-500 text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-red-400 font-semibold">Error Loading Analytics</h3>
              <p className="text-red-300/80 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Students</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Assignments</p>
                <p className="text-3xl font-bold">{analyticsData.overview.activeAssignments}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Submissions</p>
                <p className="text-3xl font-bold">{analyticsData.overview.totalSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Grade</p>
                <p className="text-3xl font-bold">{analyticsData.overview.averageGrade}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Submissions Trend */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Submission Trends
            </h2>
            
            <div className="space-y-4">
              {analyticsData.submissions.labels.length > 0 ? (
                analyticsData.submissions.labels.map((label: string, index: number) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-300">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.max(...analyticsData.submissions.data) > 0 ? (analyticsData.submissions.data[index] / Math.max(...analyticsData.submissions.data)) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {analyticsData.submissions.data[index]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No submission data available for this period</p>
                </div>
              )}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Grade Distribution
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Excellent (9-10)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(analyticsData.grades.excellent / analyticsData.overview.totalSubmissions) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{analyticsData.grades.excellent}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Good (7-8.9)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(analyticsData.grades.good / analyticsData.overview.totalSubmissions) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{analyticsData.grades.good}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Average (6-6.9)</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(analyticsData.grades.average / analyticsData.overview.totalSubmissions) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{analyticsData.grades.average}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Below Average</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-white/10 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(analyticsData.grades.below / analyticsData.overview.totalSubmissions) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{analyticsData.grades.below}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assignment Performance */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Assignment Performance
            </h2>
            
            <div className="space-y-4">
              {analyticsData.performance.labels.length > 0 ? (
                analyticsData.performance.labels.map((label: string, index: number) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">{label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${(analyticsData.performance.data[index] / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">
                        {analyticsData.performance.data[index]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No assignment performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Performers
            </h2>
            
            <div className="space-y-4">
              {analyticsData.topStudents.length > 0 ? (
                analyticsData.topStudents.map((student: any, index: number) => (
                  <div key={student.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-yellow-500 text-black" :
                        index === 1 ? "bg-gray-400 text-black" :
                        index === 2 ? "bg-amber-600 text-white" :
                        "bg-white/10 text-white"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-gray-400">{student.submissions} submissions</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-purple-400">{student.grade}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No student performance data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
