import React, { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSocket } from "../utils/socket";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";

const socket = getSocket();

export default function NotificationComponent({ userId }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;

    socket.emit("joinUserRoom", userId);

    const handleNotification = async (notification) => {
      if (notification.type === "MESSAGE") return;

      const senderName = notification.sender?.username || "Someone";
      const senderAvatar = notification.sender?.avatar_url;
      const link = notification.link || "/notifications";

      toast.info(
        <div
          className="flex items-start gap-3 cursor-pointer group"
          onClick={async () => {
            toast.dismiss();

            try {
              await api.post(`/notifications/mark-read`, { id: notification.id });
            } catch (err) {
              console.error("Failed to mark notification as read:", err);
            }

            if (notification.link){
              navigate(notification.link)
            }
          }}
        >
          {/* Avatar with subtle animation */}
          <div className="flex-shrink-0 relative">
            {senderAvatar ? (
              <img 
                src={senderAvatar} 
                alt={senderName} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" 
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                <span>{senderName[0].toUpperCase()}</span>
              </div>
            )}
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>

          {/* Message content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-slate-800 leading-snug group-hover:text-slate-900 transition-colors">
              {notification.message}
            </p>
            <p className="text-slate-500 text-sm mt-1">Click to view</p>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          pauseOnHover: true,
          draggable: true,
          closeOnClick: false,
          className: "!bg-white !rounded-xl !shadow-lg !border !border-slate-200",
          bodyClassName: "!p-0",
          progressClassName: "!bg-gradient-to-r !from-blue-500 !to-indigo-500",
          icon: false,
        }
      );
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [userId, navigate, location.pathname]);

  return (
    <ToastContainer 
      newestOnTop 
      className="!mt-16"
      toastClassName="!mb-4"
    />
  );
}
