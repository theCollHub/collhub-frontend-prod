import React, { useEffect, useState } from "react";
import { MdArrowBack, MdSearch } from "react-icons/md";
import axios from "axios";
import { getSocket } from "../utils/socket";
import api from "../utils/api";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

// helper: truncate username
const truncateName = (text, maxLength = 20) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
};

// helper: truncate last message
const truncateMessage = (text, maxLength = 25) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
};

export default function ChatList({
  chats = [],
  onSelectChat,
  searchTerm,
  setSearchTerm,
  setChats,
  onBack,
}) {
  const [onlineStatus, setOnlineStatus] = useState({});
  const socket = getSocket();

  // Fetch online status
  useEffect(() => {
    const fetchStatus = async () => {
      const statusObj = {};
      await Promise.all(
        chats.map(async (chat) => {
          if (!chat.other_user_id) return;
          try {
            const res = await api.get(`/online/${chat.other_user_id}`);
            statusObj[chat.other_user_id] = res.data.online;
          } catch {
            statusObj[chat.other_user_id] = false;
          }
        })
      );
      setOnlineStatus(statusObj);
    };

    if (chats.length > 0) {
      fetchStatus();
    }
  }, [chats]);

  // Listen for conversation updates from socket and chat updates after sending messages
  useEffect(() => {
    const handleConversationUpdate = (payload) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.conversation_id === payload.conversation_id
            ? {
                ...chat,
                last_message: payload.content,
                last_message_time: payload.created_at,
                type: payload.type || "text",
                media_url: payload.media_url || null,
                media_type: payload.media_type || null,
              }
            : chat
        )
      );
    };

    const handleChatUpdate = (update) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.conversation_id === update.conversation_id
            ? {
                ...chat,
                last_message: update.last_message,
                last_message_time: update.last_message_time,
                type: update.type,
                media_url: update.media_url,
                media_type: update.media_type,
              }
            : chat
        )
      );
    };

    socket.on("conversation:update", handleConversationUpdate);
    socket.on("chat:update", handleChatUpdate);
    return () => {
      socket.off("conversation:update", handleConversationUpdate);
      socket.off("chat:update", handleChatUpdate);
    };
  }, [socket, setChats]);

  const filtered = chats.filter((c) =>
    (c.other_user_name ?? "")
      .toLowerCase()
      .includes((searchTerm ?? "").toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Go back"
              >
                <MdArrowBack size={24} className="text-gray-700" />
              </button>
            )}
            <h2 className="text-2xl sm:text-3xl text-gray-900 tracking-tight">Messages</h2>
          </div>

          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 pointer-events-none z-10">
              <MdSearch size={20} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-sm sm:text-base transition-all duration-200 placeholder:text-gray-400"
              aria-label="Search chats"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden px-2 sm:px-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <MdSearch size={40} className="text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              No conversations found.
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Try adjusting your search
            </p>
          </div>
        ) : (
          <div>
            {filtered.map((chat, index) => {
              const unread = (chat.unread_count ?? 0) > 0;
              const isOnline = onlineStatus[chat.other_user_id] ?? false;

              return (
                <div
                  key={chat.conversation_id || index}
                  className="group cursor-pointer px-3 py-3.5 flex items-center 
                             hover:bg-gray-50 transition-all duration-200 border-b border-gray-100"
                  onClick={() => onSelectChat(chat.conversation_id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onSelectChat(chat.conversation_id)
                  }
                  aria-label={`Open chat with ${chat.other_user_name ?? "user"}`}
                >
                  {/* Avatar with Online Indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-full ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200">
                      <img
                        src={chat.other_user_avatar || DEFAULT_AVATAR_URL}
                        alt={chat.other_user_name || "User Avatar"}
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DEFAULT_AVATAR_URL;
                        }}
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-green-500 shadow-lg animate-pulse" />
                    )}
                  </div>

                  {/* Chat details */}
                  <div className="flex-1 min-w-0 ml-4">
                    {/* Top: username + time */}
                    <div className="flex justify-between items-center min-w-0 mb-1">
                      <span
                        className={`${
                          unread
                            ? "text-gray-900"
                            : "text-gray-800"
                        } text-sm sm:text-base overflow-hidden text-ellipsis whitespace-nowrap 
                        group-hover:text-blue-700 transition-colors duration-200`}
                      >
                        {truncateName(chat.other_user_name ?? "Unnamed User")}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2 group-hover:text-blue-500 transition-colors duration-200">
                        {chat.last_message_time
                          ? new Date(chat.last_message_time).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : ""}
                      </span>
                    </div>

                    {/* Bottom: last message + unread badge */}
                    <div className="flex items-center justify-between min-w-0 gap-2">
                      <p className={`text-xs sm:text-sm ${unread ? "text-gray-700" : "text-gray-500"} overflow-hidden text-ellipsis whitespace-nowrap flex-1`}>
                        {chat.type === "media" && chat.media_url ? (
                          chat.media_type === "image" ? (
                            <span className="flex items-center gap-1">
                              <span className="text-base">📷</span>
                              <span>Photo</span>
                            </span>
                          ) : chat.media_type === "video" ? (
                            <span className="flex items-center gap-1">
                              <span className="text-base">🎥</span>
                              <span>Video</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="text-base">📎</span>
                              <span>Attachment</span>
                            </span>
                          )
                        ) : chat.type === "shared_post" ? (
                          (() => {
                            try {
                              const post = JSON.parse(chat.last_message || "{}");
                              return (
                                <span className="flex items-center gap-1">
                                  <span className="text-base">📌</span>
                                  <span>{post.caption || "Post"}</span>
                                </span>
                              );
                            } catch {
                              return (
                                <span className="flex items-center gap-1">
                                  <span className="text-base">📌</span>
                                  <span>Post</span>
                                </span>
                              );
                            }
                          })()
                        ) : (
                          truncateMessage(chat.last_message || "No messages yet", 25)
                        )}
                      </p>

                      {unread && (
                        <span className="ml-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full flex-shrink-0 shadow-md min-w-[24px] text-center">
                          {chat.unread_count > 99 ? "99+" : chat.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}