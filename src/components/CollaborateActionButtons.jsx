import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function CollaborateActionButtons({ viewedUserId, currentUserId }) {
  if (!viewedUserId || !currentUserId || viewedUserId === currentUserId) {
    return null;
  }
  const [status, setStatus] = useState("none"); // 'none', 'sent', 'received', 'accepted', 'blocked', 'collaborate-back'
  const [loading, setLoading] = useState(false);
  
  // Fetch collaboration status
  useEffect(() => {
    if (!viewedUserId || !currentUserId ) return null;
    async function fetchStatus() {
      try {
        const res = await api.get(`/collaboration/status/${viewedUserId}`);
        setStatus(res.data?.status || "none");
      } catch (err) {
        console.error("Failed to fetch collaboration status:", err);
        setStatus("none");
      }
    }

    fetchStatus();
  }, [viewedUserId, currentUserId]);

  const sendCollaboration = async (targetUserId) => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      const statusRes = await api.get(`/collaboration/status/${targetUserId}`);
      if (statusRes.data.status === "blocked") {
        alert("Cannot send collaboration request to this user because they are blocked.");
        setLoading(false);
        return;
      }

      const res = await api.post(`/collaboration/request/${targetUserId}`);
      setStatus("sent");
    } catch (err) {
      console.error("Error during collaboration request:", err);
      if (err.response?.status === 403) {
        alert("Cannot send collaboration request to this user (blocked).");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (!viewedUserId) return;

    setLoading(true);
    try {
      await api.post(`/collaboration/${action}/${viewedUserId}`);
      if (action === "accept" || action === "collaborate-back") setStatus("accepted");
      if (action === "decline") setStatus("none");
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setStatus("none");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button disabled className="px-4 py-2 rounded bg-gray-300">
        Processing...
      </button>
    );
  }

  switch (status) {
    case "none":
      return (
        <button
          onClick={() => sendCollaboration(viewedUserId)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Collaborate
        </button>
      );
    case "sent":
      return (
        <button disabled className="px-4 py-2 bg-gray-400 text-white rounded">
          Request Sent
        </button>
      );
    case "received":
      return (
        <div className="inline-flex space-x-2">
          <button
            onClick={() => handleAction("accept")}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Accept
          </button>
          <button
            onClick={() => handleAction("decline")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Decline
          </button>
        </div>
      );
    case "accepted":
      return (
        <button disabled className="px-4 py-2 bg-gray-500 text-white rounded cursor-default">
          Collaborators
        </button>
      );
    case "collaborate-back":
      return (
        <button
          onClick={() => handleAction("collaborate-back")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Collaborate Back
        </button>
      );
    case "blocked":
      return (
        <button disabled className="px-4 py-2 bg-gray-700 text-white rounded cursor-not-allowed">
          Blocked
        </button>
      );
    default:
      return (
        <button
          onClick={() => sendCollaboration(viewedUserId)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Collaborate
        </button>
      );
  }
}