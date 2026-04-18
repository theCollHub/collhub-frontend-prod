// src/utils/socket.js
import { io } from "socket.io-client";

// Shared socket instance
let socket = null;

/**
 * Get backend origin dynamically:
 * - Uses REACT_APP_API_URL but strips off `/api` for sockets
 * - Falls back to localhost:4000 in development
 */
function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  if (!apiUrl) {
    console.warn("VITE_BACKEND_URL not defined! Falling back to localhost:4000");
    return "http://localhost:4000";
  }
  return apiUrl.replace(/\/api\/?$/, "");
}

/**
 * Returns a singleton socket instance
 */
export function getSocket() {
  if (!socket) {
    const BACKEND_ORIGIN = getBackendOrigin();

    socket = io(BACKEND_ORIGIN, {
      withCredentials: true, // send HttpOnly cookies automatically
      autoConnect: true,
    });

    // Logs for debugging
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id, "to", BACKEND_ORIGIN);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect_error:", err.message || err);
    });
  }

  return socket;
}