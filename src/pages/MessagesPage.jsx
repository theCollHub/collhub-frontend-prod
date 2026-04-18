import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiMessageCircle } from "react-icons/fi";
import api from "../utils/api";
import { getSocket } from "../utils/socket";
import MessageBox from "../components/MessageBox";
import { useAuth } from "../context/AuthContext";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function MessagesPage({ userId }) {
  const navigate = useNavigate();
  const socket = getSocket();
  const scrollContainerRef = useRef(null);

  const [currentChatId, setCurrentChatId] = useState(null);
  const [receiverId, setReceiverId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({}); // Track online status

  const { chats, setChats, messagesUnreadCount, setMessagesUnreadCount } = useAuth();

  // Helper to truncate messages
  const truncateMessage = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  // Fetch chats on mount and initialize online status
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get("/messages");
        const formattedChats = res.data.map((chat) => ({
          chatId: chat.conversation_id,
          otherUserId: chat.other_user_id,
          otherUserName: chat.other_user_name,
          lastMessage: chat.last_message,
          lastMessageTime: chat.last_message_time,
          avatarUrl:
            chat.other_user_avatar &&
            chat.other_user_avatar.trim() !== "" &&
            chat.other_user_avatar.startsWith("http")
              ? chat.other_user_avatar
              : DEFAULT_AVATAR_URL,
          unread_count: chat.unread_count || 0,
        }));
        setChats(formattedChats);

        // Fetch online status for each user
        formattedChats.forEach(async (c) => {
          try {
            const { data } = await api.get(`/online/${c.otherUserId}`);
            setOnlineUsers((prev) => ({ ...prev, [c.otherUserId]: data.online }));
          } catch (err) {
            console.error("Error fetching online status:", err);
          }
        });
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };
    fetchChats();
  }, [setChats]);

  // Reset global unread count when entering messages page
  useEffect(() => {
    setMessagesUnreadCount(0);
  }, [setMessagesUnreadCount]);

  // Socket listeners for messages and online/offline updates
  useEffect(() => {
    if (!userId) return;
    socket.emit("joinUserRoom", userId);

    const handleReceiveMessage = (message) => {
      setChats((prevChats) => {
        const exists = prevChats.find((c) => c.chatId === message.chatId);
        if (exists) {
          return prevChats.map((c) =>
            c.chatId === message.chatId
              ? {
                  ...c,
                  lastMessage: message.text,
                  lastMessageTime: message.createdAt,
                  unread_count:
                    currentChatId === message.chatId ? 0 : (c.unread_count || 0) + 1,
                }
              : c
          );
        } else {
          return [
            {
              chatId: message.chatId,
              otherUserId: message.senderId === userId ? message.receiverId : message.senderId,
              otherUserName: message.senderName,
              lastMessage: message.text,
              lastMessageTime: message.createdAt,
              avatarUrl: DEFAULT_AVATAR_URL,
              unread_count: 1,
            },
            ...prevChats,
          ];
        }
      });

      if (currentChatId !== message.chatId) {
        setMessagesUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    // Online/Offline socket updates
    socket.on("user:online", (id) => setOnlineUsers((prev) => ({ ...prev, [id]: true })));
    socket.on("user:offline", (id) => setOnlineUsers((prev) => ({ ...prev, [id]: false })));

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [userId, socket, currentChatId, setChats, setMessagesUnreadCount]);

  const filteredChats = chats.filter((chat) =>
    chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setIsScrolled(scrollContainerRef.current.scrollTop > 10);
    }
  };

  const handleChatClick = (chat) => {
    setCurrentChatId(chat.chatId);
    setReceiverId(chat.otherUserId);
    navigate(`/messages/${chat.chatId}`);

    const unread = chat.unread_count || 0;
    setChats((prev) =>
      prev.map((c) => (c.chatId === chat.chatId ? { ...c, unread_count: 0 } : c))
    );
    setMessagesUnreadCount((prev) => Math.max(0, prev - unread));

    api.post(`/messages/${chat.chatId}/read`).catch(console.error);
  };

  if (!chats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!currentChatId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div
          className="max-w-2xl mx-auto overflow-auto"
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{ maxHeight: "calc(100vh - 0px)" }}
        >
          <div
            className={`sticky top-0 z-10 backdrop-blur-md bg-white/80 transition-all duration-300 ${
              isScrolled ? "py-3 shadow-md" : "py-6"
            }`}
          >
            <div className="px-6">
              <h2
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent transition-all duration-300 ${
                  isScrolled ? "" : ""
                }`}
              >
                Messages
              </h2>
              
              <div className="relative mt-4">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md ${
                    isScrolled ? "" : ""
                  }`}
                />
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            {filteredChats.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
                  <FiMessageCircle className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-500">
                  {searchQuery ? "No conversations found." : "No conversations yet."}
                </p>
                {!searchQuery && (
                  <p className="text-gray-400 mt-2">Start a conversation to see it here</p>
                )}
              </div>
            ) : (
              <ul className="space-y-2 mt-2">
                {filteredChats.map((chat, index) => (
                  <li
                    key={chat.chatId ?? `${chat.otherUserId}-${index}`}
                    className={`group relative p-4 bg-white rounded-2xl shadow-sm cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-gray-100 ${
                      chat.unread_count > 0 ? "ring-2 ring-blue-500/20" : ""
                    }`}
                    onClick={() => handleChatClick(chat)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.avatarUrl}
                          alt={chat.otherUserName || "User Avatar"}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-500/30 transition-all duration-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = DEFAULT_AVATAR_URL;
                          }}
                        />
                        {onlineUsers[chat.otherUserId] && (
                          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className={`truncate ${chat.unread_count > 0 ? "" : ""}`}>
                            {chat.otherUserName}
                          </span>
                          <span className="flex-shrink-0 text-gray-400">
                            {chat.lastMessageTime
                              ? new Date(chat.lastMessageTime).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <p className={`text-gray-500 truncate ${chat.unread_count > 0 ? "" : ""}`}>
                            {truncateMessage(chat.lastMessage || "No messages yet", 30)}
                          </p>
                          {chat.unread_count > 0 && (
                            <span className="flex-shrink-0 min-w-[24px] h-6 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 rounded-full shadow-md">
                              {chat.unread_count > 99 ? "99+" : chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile-friendly chat view with sticky back button
  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-white">
      <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center px-4 py-4 shadow-lg">
        <button
          onClick={() => {
            setCurrentChatId(null);
            setReceiverId(null);
            navigate(-1);
          }}
          className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 flex items-center text-white"
          aria-label="Back to messages"
        >
          <FiArrowLeft size={22} />
          <span className="ml-2">Back</span>
        </button>
        <div className="flex items-center ml-3 gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            {(() => {
              const currentChat = chats.find((c) => c.chatId === currentChatId);
              return currentChat ? (
                <>
                  <img
                    src={currentChat.avatarUrl}
                    alt={currentChat.otherUserName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                  />
                  {onlineUsers[currentChat.otherUserId] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  )}
                </>
              ) : null;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block truncate text-white">
              {chats.find((c) => c.chatId === currentChatId)?.otherUserName || "Chat"}
            </span>
            {(() => {
              const currentChat = chats.find((c) => c.chatId === currentChatId);
              return currentChat && onlineUsers[currentChat.otherUserId] ? (
                <span className="text-blue-100">Online</span>
              ) : null;
            })()}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/30">
        <MessageBox
          onClose={() => {
            setCurrentChatId(null);
            setReceiverId(null);
            navigate(-1);
          }}
          userId={userId}
          conversationId={currentChatId}
          baseUrl={DEFAULT_AVATAR_URL} 
        />
      </div>
    </div>
  );
}