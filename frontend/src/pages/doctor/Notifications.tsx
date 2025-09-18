import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, Trash2, ArrowLeft, Plus } from "lucide-react";

const DoctorNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load notifications from localStorage or API
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('doctorNotifications');
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          // Default notifications
          const defaultNotifications = [
            {
              id: 1,
              title: "New Assignment Submitted",
              message: "Student John Doe has submitted Assignment 3.",
              date: "2025-09-05",
              read: false,
            },
            {
              id: 2,
              title: "Assistant Email",
              message: "You received an email from teaching assistant.",
              date: "2025-09-04",
              read: false,
            },
            {
              id: 3,
              title: "System Update",
              message: "Platform will be updated tonight at 11 PM.",
              date: "2025-09-03",
              read: true,
            },
          ];
          setNotifications(defaultNotifications);
          localStorage.setItem('doctorNotifications', JSON.stringify(defaultNotifications));
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
  }, []);

  const markAsRead = (id: number) => {
    const updatedNotifications = notifications.map((n) => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('doctorNotifications', JSON.stringify(updatedNotifications));
  };

  const deleteNotification = (id: number) => {
    const updatedNotifications = notifications.filter((n) => n.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('doctorNotifications', JSON.stringify(updatedNotifications));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex flex-col items-center py-10">
      <div className="w-full max-w-2xl bg-white/10 rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/doctor/dashboard')}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Bell className="w-8 h-8 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">Notifications</h2>
          </div>
          <button
            onClick={() => navigate('/doctor/announcements')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
        <ul className="space-y-4">
          {notifications.length === 0 ? (
            <li className="text-white/70 text-center py-8">No notifications.</li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  n.read
                    ? "bg-white/5 border-white/10"
                    : "bg-cyan-500/10 border-cyan-400/30 shadow-lg"
                }`}
              >
                <div className="flex flex-col items-center gap-2 pt-1">
                  {n.read ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Bell className="w-5 h-5 text-cyan-400 animate-pulse" />
                  )}
                  <span className="text-xs text-white/50">{n.date}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-white ${n.read ? "opacity-70" : ""}`}>{n.title}</h3>
                  <p className={`text-white/80 text-sm ${n.read ? "opacity-60" : ""}`}>{n.message}</p>
                  <div className="mt-2 flex gap-2">
                    {!n.read && (
                      <button
                        className="px-3 py-1 bg-emerald-500/80 text-white rounded hover:bg-emerald-600 text-xs"
                        onClick={() => markAsRead(n.id)}
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      className="px-3 py-1 bg-red-500/80 text-white rounded hover:bg-red-600 text-xs flex items-center gap-1"
                      onClick={() => deleteNotification(n.id)}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default DoctorNotifications;
