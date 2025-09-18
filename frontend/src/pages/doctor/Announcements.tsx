import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Bell, Users, Target, Calendar, X, Edit, Trash2 } from "lucide-react";
import { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } from "../../lib/api";

export default function Announcements() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetAudience: "all",
    priority: "normal",
    scheduledFor: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Error loading announcements:", error);
      // Fallback to mock data if API fails
      setAnnouncements([
        {
          id: 1,
          title: "Important: Assignment Deadline Extended",
          message: "Due to technical difficulties, the deadline for Research Paper has been extended to Friday.",
          targetAudience: "all",
          priority: "high",
          scheduledFor: "2024-01-15T10:00",
          sentAt: "2024-01-15T09:30",
          status: "sent"
        },
        {
          id: 2,
          title: "Welcome to New Semester",
          message: "Welcome back everyone! I hope you had a great break. Let's make this semester productive.",
          targetAudience: "all",
          priority: "normal",
          scheduledFor: "2024-01-10T08:00",
          sentAt: "2024-01-10T08:00",
          status: "sent"
        }
      ]);
    }
  };

  const targetAudiences = [
    { value: "all", label: "All Students", icon: Users },
    { value: "first", label: "First Year", icon: Target },
    { value: "second", label: "Second Year", icon: Target },
    { value: "third", label: "Third Year", icon: Target },
    { value: "fourth", label: "Fourth Year", icon: Target },
    { value: "fifth", label: "Fifth Year", icon: Target }
  ];

  const priorities = [
    { value: "low", label: "Low", color: "text-blue-400" },
    { value: "normal", label: "Normal", color: "text-green-400" },
    { value: "high", label: "High", color: "text-yellow-400" },
    { value: "urgent", label: "Urgent", color: "text-red-400" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        // Update existing announcement
        await updateAnnouncement(editingId, formData);
        await loadAnnouncements(); // Reload to get updated data
        setEditingId(null);
      } else {
        // Create new announcement
        await createAnnouncement(formData);
        await loadAnnouncements(); // Reload to get new data
      }
      
      // Reset form
      setFormData({
        title: "",
        message: "",
        targetAudience: "all",
        priority: "normal",
        scheduledFor: ""
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: any) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      scheduledFor: announcement.scheduledFor
    });
    setEditingId(announcement.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await deleteAnnouncement(id);
        await loadAnnouncements(); // Reload to get updated data
      } catch (error) {
        console.error("Error deleting announcement:", error);
        alert("Failed to delete announcement. Please try again.");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "text-blue-400 bg-blue-500/20 border-blue-400/30";
      case "normal": return "text-green-400 bg-green-500/20 border-green-400/30";
      case "high": return "text-yellow-400 bg-yellow-500/20 border-yellow-400/30";
      case "urgent": return "text-red-400 bg-red-500/20 border-red-400/30";
      default: return "text-gray-400 bg-gray-500/20 border-gray-400/30";
    }
  };

  const getTargetAudienceLabel = (value: string) => {
    return targetAudiences.find(t => t.value === value)?.label || "All Students";
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
              <h1 className="text-3xl font-bold">Announcements</h1>
              <p className="text-gray-300">Communicate with your students</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            New Announcement
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Announcements List */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-bold mb-6">Recent Announcements</h2>
              
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(announcement.priority)}`}>
                            {announcement.priority}
                          </span>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-3">{announcement.message}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {getTargetAudienceLabel(announcement.targetAudience)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(announcement.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {announcements.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No announcements yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Announcement Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">
                    {editingId ? "Edit Announcement" : "New Announcement"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setFormData({
                        title: "",
                        message: "",
                        targetAudience: "all",
                        priority: "normal",
                        scheduledFor: ""
                      });
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter announcement title"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your message"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Audience
                    </label>
                    <select
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {targetAudiences.map(audience => (
                        <option key={audience.value} value={audience.value} style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>
                          {audience.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="low" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Low Priority</option>
                      <option value="medium" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>Medium Priority</option>
                      <option value="high" style={{backgroundColor: 'rgb(51, 65, 85)', color: 'white'}}>High Priority</option>
                    </select>
                  </div>

                  {/* Scheduled For */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Schedule For (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="scheduledFor"
                      value={formData.scheduledFor}
                      onChange={handleInputChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Sending..." : (editingId ? "Update" : "Send")}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
