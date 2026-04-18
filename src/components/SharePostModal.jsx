import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import { FaPaperPlane } from "react-icons/fa";
import { useUI } from "../context/UIContext";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function SharePostModal({ post, chatList, onClose, onShareSuccess }) {
  const { setHideBottomNav } = useUI();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Hide bottom nav when modal opens
  useEffect(() => {
    setHideBottomNav(true);
    setIsOpen(true);
    return () => setHideBottomNav(false); // Restore when modal closes
  }, [setHideBottomNav]);

  const filteredChats = useMemo(() => {
    if (!search.trim()) return chatList;
    return chatList.filter(chat =>
      chat.other_user_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, chatList]);

  const toggleSelect = (chat) => {
    if (selected.includes(chat)) {
      setSelected(selected.filter(c => c !== chat));
    } else {
      setSelected([...selected, chat]);
    }
  };

  const sendToChats = async () => {
    if (!selected.length) return;
    setLoading(true);
    try {
      for (const chat of selected) {
        await api.post(`/messages/${chat.conversation_id}/share-post`, { postId: post.id });
      }
      onShareSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to share post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full sm:max-w-md transform transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full sm:translate-y-10"
        } max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Share Post</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 py-3 border-b">
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => (
              <label
                key={chat.conversation_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(chat)}
                  onChange={() => toggleSelect(chat)}
                  className="w-4 h-4 accent-blue-500"
                />
                <img
                  src={chat.other_user_avatar || DEFAULT_AVATAR}
                  alt={chat.other_user_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span className="text-gray-800 font-medium truncate">{chat.other_user_name}</span>
              </label>
            ))
          ) : (
            <div className="text-gray-500 text-sm italic text-center">No chats found</div>
          )}
        </div>

        {/* Send button */}
        <div className="px-4 py-3 border-t flex justify-end">
          <button
            disabled={!selected.length || loading}
            onClick={sendToChats}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition ${
              selected.length && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            <FaPaperPlane />
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}