// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../utils/api";
import { getSocket } from "../utils/socket";

const AuthContext = createContext();
const socket = getSocket();

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

  const [chats, setChats] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // -----------------------------
  // Initialize auth on mount
  // -----------------------------
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // Check if user is authenticated
  // Avoid triggering 401 refresh on public pages
  // -----------------------------
  const checkAuth = async () => {
    setChecking(true);
    try {
      const res = await api.get("/auth/check", {
        withCredentials: true,
      });

      if (res.data?.user) {
        setAuthenticated(true);
        setUser(res.data.user);
        fetchUnreadCounts();
        return true;
      } else {
        setAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      console.warn("checkAuth failed:", err?.response?.status || err.message);
      setAuthenticated(false);
      setUser(null);
      return false;
    } finally {
      setChecking(false);
    }
  };

  // -----------------------------
  // Fetch unread counts for notifications and messages
  // -----------------------------
  const fetchUnreadCounts = async () => {
    try {
      const [notifRes, chatsRes] = await Promise.all([
        api.get("/notifications/unread-count"),
        api.get("/messages/unread-count"),
      ]);
      setNotificationsUnreadCount(notifRes.data.unreadCount || 0);
      setMessagesUnreadCount(chatsRes.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread counts:", err);
    }
  };

  // -----------------------------
  // Login (with loginType support)
  // -----------------------------
  const login = async (email, password, loginType) => {
    try {
      // Send loginType to backend
      await api.post( "/auth/login", { email, password, loginType }, { withCredentials: true });

      // Fetch logged-in user details
      const res = await api.get("/auth/check", { withCredentials: true });

      if (res.data?.user) {
        setAuthenticated(true);
        setUser(res.data.user);
        setAccessToken(res.data.accessToken);

        // Load notifications
        fetchUnreadCounts();
        return true;
      } else {
        setAuthenticated(false);
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error("login error:", err);
      setAuthenticated(false);
      setUser(null);
      setAccessToken(null);
      return false;
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const logout = async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.error("logout error:", err);
    } finally {
      setAuthenticated(false);
      setUser(null);
      setMessagesUnreadCount(0);
      setNotificationsUnreadCount(0);
      setChats([]);
      setActiveConversationId(null);
    }
  };

  // -----------------------------
  // Socket: join user room
  // -----------------------------
  useEffect(() => {
    if (user?.id) {
      socket.emit("joinUserRoom", user.id);
    }
  }, [user]);

  // -----------------------------
  // Socket: notifications listener
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const handleNotification = (notif) => {
      try {
        const t = (notif?.type || "").toString().toUpperCase();
        if (t !== "MESSAGE") setNotificationsUnreadCount((prev) => prev + 1);
      } catch (e) {
        setNotificationsUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("notification", handleNotification);
    return () => socket.off("notification", handleNotification);
  }, [user]);

  // -----------------------------
  // Socket: handle incoming messages
  // -----------------------------
  useEffect(() => {
    if (!user) return;

    const onNewMessage = (msg) => {
      const normalized = msg || {};
      const conversation_id = normalized.conversation_id || normalized.chatId || normalized.conversationId;
      const sender_id = normalized.sender_id || normalized.senderId;
      const content = normalized.content || normalized.text || normalized.message;
      const created_at = normalized.created_at || normalized.createdAt || new Date().toISOString();

      if (sender_id === user?.id) return;

      setChats((prev) => {
        const exists = prev.some((c) => c.conversation_id === conversation_id || c.chatId === conversation_id);
        if (!exists) {
          return [
            {
              conversation_id,
              last_message: content,
              last_message_time: created_at,
              unread_count: activeConversationId === conversation_id ? 0 : 1,
            },
            ...prev,
          ];
        }

        return prev.map((c) =>
          c.conversation_id === conversation_id || c.chatId === conversation_id
            ? {
                ...c,
                last_message: content,
                last_message_time: created_at,
                unread_count: activeConversationId === conversation_id ? 0 : (c.unread_count || 0) + 1,
              }
            : c
        );
      });

      if (activeConversationId !== conversation_id) {
        setMessagesUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("message:new", onNewMessage);
    socket.on("receive_message", onNewMessage);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("receive_message", onNewMessage);
    };
  }, [user, activeConversationId]);

  // -----------------------------
  // Mark conversation as read
  // -----------------------------
  const markConversationRead = async (conversationId) => {
    try {
      if (!user?.id) return;
      await api.post(`/messages/${conversationId}/read`);
      socket.emit("conversation:read", { conversationId });

      const convo = chats.find((c) => c.conversation_id === conversationId || c.chatId === conversationId);
      const reduceBy = convo?.unread_count || 0;

      setChats((prev) =>
        prev.map((c) =>
          c.conversation_id === conversationId || c.chatId === conversationId ? { ...c, unread_count: 0 } : c
        )
      );

      setMessagesUnreadCount((prev) => Math.max(0, prev - reduceBy));
    } catch (err) {
      console.warn("mark read failed:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        user,
        checking,
        login,
        logout,
        checkAuth,
        setUser,
        messagesUnreadCount,
        notificationsUnreadCount,
        setMessagesUnreadCount,
        setNotificationsUnreadCount,
        chats,
        setChats,
        activeConversationId,
        setActiveConversationId,
        markConversationRead,
        fetchUnreadCounts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}