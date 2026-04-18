import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import EnvelopeButton from "../components/EnvelopeButton";

export default function MobileTopNav({
  user,
  notificationsUnreadCount = 0,
  messagesUnreadCount = 0,
  handleNotificationsClick,
  handleMessagesClick,
  hidden = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className={`flex items-center justify-between bg-white px-4 py-3 border-b border-gray-200 md:hidden transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <h1
        className="text-2xl font-bold text-black cursor-pointer select-none"
        onClick={() => navigate("/campus-feed")}
      >
        CollHub
      </h1>

      <div className="flex items-center space-x-4 text-gray-700">

        {user && (
          <NotificationBell
            unreadTotal={notificationsUnreadCount}
            onClick={handleNotificationsClick}
          />
        )}

        <EnvelopeButton
          unreadTotal={messagesUnreadCount}
          onClick={handleMessagesClick}
          isActive={location.pathname.startsWith("/messages")}
        />
      </div>
    </header>
  );
}