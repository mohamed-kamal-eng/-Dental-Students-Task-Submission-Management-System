import { useState, useEffect } from 'react';
import { Bell, AlertCircle, ArrowLeft, FileText, MessageCircle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStudentAnnouncements } from '../../lib/api';

 

interface Notification {
  id: number;
  type: 'submission' | 'feedback' | 'grade' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await getStudentAnnouncements({ limit: 100 });
      const mapped: Notification[] = (data ?? []).map((a: any) => ({
        id: a.id,
        type: 'system',
        title: a.title,
        message: a.message,
        timestamp: a.sent_at,
        read: false,
      }));
      setNotifications(mapped);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // Mock API call - replace with actual API
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mock API call - replace with actual API
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <FileText className="w-5 h-5" />;
      case 'feedback':
        return <MessageCircle className="w-5 h-5" />;
      case 'grade':
        return <Star className="w-5 h-5" />;
      case 'system':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'submission':
        return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'feedback':
        return 'text-purple-400 bg-purple-500/20 border-purple-400/30';
      case 'grade':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'system':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/70 font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white">Notifications</h1>
                  <p className="text-sm text-white/70">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-colors text-sm font-medium"
              >
                Mark All Read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-white/60" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                No notifications
              </h3>
              <p className="text-white/60">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white/10 backdrop-blur-xl rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
                  notification.read 
                    ? 'border-white/10 opacity-75' 
                    : 'border-white/20 shadow-lg'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">{notification.title}</h3>
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        )}
                        <span className="text-xs text-white/50">
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-white/80 text-sm mb-4 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-3">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-colors text-xs font-medium"
                        >
                          Mark as Read
                        </button>
                      )}
                      
                      {notification.actionUrl && (
                        <button
                          onClick={() => navigate(notification.actionUrl!)}
                          className="px-3 py-1.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg transition-colors text-xs font-medium"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
