import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Bell, Check } from "lucide-react"; 
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setNotificationsUnreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLoading(true);

    async function fetchNotifications() {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
        setNotificationsUnreadCount(0);
        await api.post("/notifications/mark-read");
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [setNotificationsUnreadCount, location.search]);

  const handleClick = async (n) => {
    try {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === n.id ? { ...notif, is_read: true } : notif
        )
      );

      await api.post(`/notifications/mark-read`, { id: n.id });

      if (n.link) {
        navigate(n.link);   // Always rely on backend-provided link
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h1 className="text-slate-900">Notifications</h1>
          </div>

          {/* Empty State */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-slate-900 mb-2">No notifications yet</h2>
            <p className="text-slate-500">When you get notifications, they'll show up here</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h1 className="text-slate-900">Notifications</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-200">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="text-slate-700">{notifications.length}</span>
          </div>
        </div>

        {/* Notifications List */}
        <motion.ul 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence>
            {notifications.map((n, index) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer ${
                  n.is_read 
                    ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md" 
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:shadow-lg shadow-sm"
                }`}
                onClick={() => handleClick(n)}
              >
                {/* Unread Indicator */}
                {!n.is_read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {n.sender?.avatar_url ? (
                        <img
                          src={n.sender.avatar_url}
                          alt={n.sender.username}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                          <span>{n.sender?.username?.[0]?.toUpperCase() || "U"}</span>
                        </div>
                      )}
                      {!n.is_read && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-slate-800 leading-relaxed ${!n.is_read ? 'font-medium' : ''}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-500 text-sm">
                          {formatTimeAgo(n.created_at)}
                        </span>
                        {n.is_read && (
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <Check className="w-3 h-3" />
                            <span>Read</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowLeft className="w-5 h-5 text-slate-400 rotate-180" />
                    </div>
                  </div>
                </div>

                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </div>
    </div>
  );
} //wee