import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MdArrowBack } from 'react-icons/md';
import { IoMdSend } from 'react-icons/io';
import { useUI } from "../context/UIContext";

export default function GroupChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const { setHideBottomNav } = useUI();
  const [groupInfo, setGroupInfo] = useState(null);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/groups/${groupId}/messages`);
        setMessages(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    if (groupId) fetchMessages();
  }, [groupId]);

  // Fetch group info
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const res = await api.get(`/groups/${groupId}`);
        setGroupInfo(res.data);
      } catch (err) {
        console.error("Failed to load group info", err);
      }
    };
    if (groupId) fetchGroupInfo();
  }, [groupId]);

  // Hide bottom nav
  useEffect(() => {
    setHideBottomNav(true);
    return () => setHideBottomNav(false);
  }, [setHideBottomNav]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle text message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    try {
      setError('');
      if (file) {
        await sendMedia();
      } 
      if (newMessage.trim()) {
        await api.post(`/groups/${groupId}/messages`, { content: newMessage.trim() });
      }

      setNewMessage('');
      setFile(null);

      const response = await api.get(`/groups/${groupId}/messages`);
      setMessages(response.data);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Only admins can post.');
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Send media file
  const sendMedia = async () => {
    if (!file) return;

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(`/groups/${groupId}/send-media`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Failed to send media:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center shadow-sm relative">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100 mr-3 z-10"
        >
          <MdArrowBack size={24} />
        </button>
        <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
          <img
            src={groupInfo?.logo_url || '/default-group.png'}
            alt={groupInfo?.name || 'Group'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute left-0 right-0 text-center pointer-events-none">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {groupInfo?.name || `Group Chat #${groupId}`}
          </h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-4 mt-4 rounded">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No messages yet. Admins can post the first message!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {msg.username?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {msg.username || msg.email}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {msg.media_url ? (
                  msg.media_type === "image" ? (
                    <img src={msg.media_url} alt="sent-media" className="rounded-lg max-h-60 object-cover" />
                  ) : (
                    <video controls className="rounded-lg max-h-60">
                      <source src={msg.media_url} />
                    </video>
                  )
                ) : (
                  <p className="text-sm text-gray-900 leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4">
        <div className="flex space-x-2">
          {/* File input */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="text-blue-600 text-xl mr-2">📎</span>
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message (Admins only)..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() && !file}
            className="bg-blue-600 p-4 rounded-full flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <IoMdSend className="text-white text-lg" />
          </button>
        </div>

        {/* File preview */}
        {file && (
          <div className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2 mt-2">
            Selected: {file.name}
            <button onClick={() => setFile(null)} className="text-red-500">
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
}