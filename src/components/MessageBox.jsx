import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "../utils/socket";
import api from "../utils/api";
import { MdArrowBack } from "react-icons/md";
import { useNavigate } from "react-router-dom";
// messageboxoff collhub 

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function MessageBox({ onClose, userId, conversationId, baseUrl }) {
  const socket = getSocket();
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);

  const scrollToBottom = () =>
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!conversationId || !userId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const messagesRes = await api.get(`/messages/${conversationId}/messages`);
        setMessages(messagesRes.data || []);

        const participantsRes = await api.get(`/messages/${conversationId}/participants`);
        const recipient = participantsRes.data.find((p) => p.id !== userId);
        if (recipient) {
          setOtherUser({
            id: recipient.id,
            username: recipient.username || "Unknown",
            profilePic:
              recipient.avatar_url?.startsWith("http")
                ? recipient.avatar_url
                : DEFAULT_AVATAR_URL,
          });
          try {
            const statusRes = await api.get(`/online/${recipient.id}`);
            setIsOnline(statusRes.data.online);
          } catch {}
        }
        scrollToBottom();
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [conversationId, userId, baseUrl]);

  // Fetch last seen when fetching user
  useEffect(() => {
    const fetchLastSeen = async () => {
      if (!otherUser?.id) return;
      try {
        const res = await api.get(`/messages/lastseen/${otherUser.id}`);
        setLastSeen(res.data?.lastSeen || null);
      } catch (err) {
        console.error("Failed to fetch last seen:", err);
      }
    };
    fetchLastSeen();
  }, [otherUser?.id]);

  useEffect(() => {
    socket.on("message:block", (data) => {
      alert(data.error || "Message blocked");
    });
    return () => {
      socket.off("message:block");
    };
  }, [socket]);



  useEffect(() => {
    if (!userId) return;
    socket.emit("joinUserRoom", userId);
    const handleReceive = (message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) return prev;

          const tempIndex = prev.findIndex(
            (msg) =>
              msg.isTemp &&
              ((msg.content && message.content && msg.content === message.content) ||
                (msg.media_url &&
                  message.media_url &&
                  msg.media_url === message.media_url)) &&
              msg.sender_id === message.sender_id
          );
          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = message;
            return updated;
          }
          return [...prev, message];
        });
        scrollToBottom();

        if (message.sender_id !== userId && !otherUser) {
          setOtherUser({
            id: message.sender_id,
            username: message.username || "Unknown",
            profilePic:
              message.avatar_url?.startsWith("http")
                ? message.avatar_url
                : DEFAULT_AVATAR_URL,
          });
        }
      }
    };

    socket.on("message:new", handleReceive);
    socket.on("message:sent", handleReceive);

    socket.on("user:online", (onlineUserId) => {
      if (onlineUserId === otherUser?.id) setIsOnline(true);
    });
    socket.on("user:offline", (offlineUserId) => {
      if (offlineUserId === otherUser?.id) setIsOnline(false);
    });

    return () => {
      socket.off("message:new", handleReceive);
      socket.off("message:sent", handleReceive);
      socket.off("user:online");
      socket.off("user:offline");
    };
  }, [userId, conversationId, otherUser, socket]);

  const sendMessage = () => {
    if (!input.trim() || !conversationId || !userId) return;

    const tempId = `temp-${Date.now()}`;
    const newMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content: input.trim(),
      created_at: new Date().toISOString(),
      username: otherUser?.username || "Me",
      avatar_url: otherUser?.profilePic || DEFAULT_AVATAR_URL,
      type: "text",
      isTemp: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    socket.emit("send_message", {
      tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content: newMsg.content,
      receiver_id: otherUser?.id || "",
      type: "text",
    });

    socket.emit("chat:update", {
      conversation_id: newMsg.conversation_id,
      last_message: newMsg.content,
      last_message_time: newMsg.created_at,
      type: newMsg.type,
      media_url: null,
      media_type: null,
    });

    scrollToBottom();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return "Offline";
    const date = new Date(timestamp);
    return `Last seen ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const sendMedia = async () => {
    if (!file) return;

    const tempId = `temp-${Date.now()}`;
    const mediaType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "file";

    const previewUrl = URL.createObjectURL(file);
    const tempMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: userId,
      content: null,
      media_url: previewUrl,
      media_type: mediaType,
      type: "media",
      created_at: new Date().toISOString(),
      username: otherUser?.username || "Me",
      avatar_url: otherUser?.profilePic || DEFAULT_AVATAR_URL,
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setFile(null);
    scrollToBottom();

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("senderId", userId);
      form.append("receiverId", otherUser?.id || "");
      const res = await api.post(`/messages/${conversationId}/send-media`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? res.data : msg))
      );

      socket.emit("chat:update", {
        conversation_id: res.data.conversation_id,
        last_message: null,
        last_message_time: res.data.created_at,
        type: res.data.type,
        media_url: res.data.media_url,
        media_type: res.data.media_type,
      });

      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error("Failed to send media:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      URL.revokeObjectURL(previewUrl);
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center
                md:w-96 md:right-0 md:top-0 md:bottom-0 md:left-auto">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-[100] bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col
                md:w-96 md:right-0 md:top-0 md:bottom-0 md:left-auto
                md:border-l md:border-gray-200 md:shadow-2xl"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white/80 backdrop-blur-lg sticky top-0 z-10 border-b border-gray-100 shadow-sm">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
        >
          <MdArrowBack size={22} />
        </motion.button>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative cursor-pointer"
          onClick={() =>
            otherUser?.username && navigate(`/profile/user/${otherUser.username}`)
          }
        >
          <img
            src={otherUser?.profilePic || DEFAULT_AVATAR_URL}
            alt={otherUser?.username || "User Avatar"}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-100 shadow-md"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = DEFAULT_AVATAR_URL;
            }}
          />
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </motion.div>
        <div
          className="cursor-pointer flex flex-col flex-1 min-w-0"
          onClick={() =>
            otherUser?.username && navigate(`/profile/user/${otherUser.username}`)
          }
        >
          <h3 className="font-semibold text-gray-900 truncate">
            {otherUser?.username || "Chat"}
          </h3>
          <p className="text-xs text-gray-500">
            {isOnline ? (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </span>
            ) : (
              formatLastSeen(lastSeen)
            )}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <p className="text-gray-400">No messages yet.</p>
            <p className="text-xs text-gray-300 mt-1">Start a conversation!</p>
          </motion.div>
        ) : (
          messages.map((msg, index) => {
            const isSender = msg.sender_id === userId;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`message-bubble max-w-[75%] break-words ${
                    isSender
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                      : "bg-white text-gray-800 shadow-md border border-gray-100"
                  } px-4 py-2.5 rounded-2xl ${
                    isSender ? "rounded-br-md" : "rounded-bl-md"
                  } transition-all hover:shadow-xl`}
                >
                  {msg.type === "shared_post" && msg.content ? (
                    (() => {
                      const shared = JSON.parse(msg.content);
                      return (
                        <div className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                          {shared.media_type === "image" && (
                            <img
                              src={shared.media_url}
                              className="max-h-32 rounded-lg mb-2 w-full object-cover"
                              alt="Post"
                            />
                          )}
                          {shared.media_type === "video" && (
                            <video controls className="max-h-40 rounded-lg mb-2 w-full">
                              <source src={shared.media_url} />
                            </video>
                          )}
                          <div
                            className="underline text-blue-600 cursor-pointer hover:text-blue-700 transition-colors"
                            onClick={() => navigate(`/posts/${shared.post_id}`)}
                          >
                            View Post
                          </div>
                          <div className="text-gray-800 text-sm mt-1">{shared.caption}</div>
                        </div>
                      );
                    })()
                  ) : msg.type === "media" && msg.media_url ? (
                    <div className="whatsapp-media-card flex flex-col gap-2">
                      {msg.media_type === "image" && (
                        <motion.img
                          whileHover={{ scale: 1.02 }}
                          src={msg.media_url}
                          alt="sent-media"
                          className="rounded-xl max-h-60 object-cover cursor-pointer shadow-md"
                          onClick={() => setFullscreenMedia({ url: msg.media_url, type: "image"})}
                        />
                      )}
                      {msg.media_type === "video" && (
                        <video controls className="rounded-xl max-h-60 cursor-pointer shadow-md"
                          onClick={() =>  setFullscreenMedia({ url: msg.media_url, type: "video"})}>
                          <source src={msg.media_url} />
                        </video>
                      )}
                      {msg.content && (
                        <div className={`media-caption text-sm ${isSender ? "text-blue-50" : "text-gray-700"}`}>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}

                  <div className={`text-xs mt-1.5 text-right ${isSender ? "text-blue-100" : "text-gray-400"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 bg-white/80 backdrop-blur-lg sticky bottom-0 border-t border-gray-100 shadow-lg">
        <div className="flex items-end gap-2">
          <motion.label 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="cursor-pointer p-2 hover:bg-blue-50 rounded-full transition-colors"
          >
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-2xl">📎</span>
          </motion.label>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full resize-none border border-gray-200 rounded-2xl px-4 py-3 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                       overflow-hidden bg-white shadow-sm transition-all max-h-32"
              style={{ minHeight: '44px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-full 
                     hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed 
                     shadow-lg shadow-blue-200 transition-all disabled:shadow-none min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Media preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-100"
          >
            <div className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
              <div className="flex-1">
                <p className="text-sm text-gray-600 truncate">
                  📄 {file.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFile(null)} 
                className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={sendMedia} 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md transition-all"
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Media */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-sm flex justify-center items-center z-[9999] p-4"
            onClick={() => setFullscreenMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="relative max-h-full max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {fullscreenMedia.type === "image" ? (
                <img
                  src={fullscreenMedia.url}
                  alt="fullscreen media"
                  className="max-h-full max-w-full rounded-lg shadow-2xl"
                />
              ) : (
                <video
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-lg shadow-2xl"
                >
                  <source src={fullscreenMedia.url} />
                </video>
              )}
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
              onClick={() => setFullscreenMedia(null)}
              aria-label="Close fullscreen media"
            >
              <span className="text-2xl">&times;</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}