import React, { useState, useRef } from "react";
import { FaEllipsisH } from "react-icons/fa";
import api from "../utils/api";
import { toast } from "react-toastify";

export default function PostCard({ post, onDeleted, navigate }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef();

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success("Post deleted!");
      if (onDeleted) onDeleted(post.id);
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post.");
    }
    setShowMenu(false);
  };

  // Determine background and text color with fallbacks
  const backgroundColor = post.background_color || post.backgroundColor || "#FFD700";
  const textColor = post.text_color || post.textColor || "#222222";

  return (
    <div
      className="relative cursor-pointer rounded-lg overflow-hidden hover:shadow-md transition"
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      {/* Three-dot menu */}
      <div
        className="absolute top-2 right-2 z-10"
        onClick={(e) => {
          e.stopPropagation(); // Prevent navigation
          setShowMenu((prev) => !prev);
        }}
      >
        <FaEllipsisH className="text-white bg-black bg-opacity-50 rounded-full p-1" />
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-md z-20"
          >
            <button
              className="w-full text-left px-3 py-2 hover:bg-red-100 text-red-600"
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Render media image */}
      {post.media_type === "image" && (
        <img
          src={post.media_url}
          alt="Post Media"
          className="w-full object-cover max-h-96"
        />
      )}

      {/* Render media video */}
      {post.media_type === "video" && (
        <video src={post.media_url} controls className="w-full h-48 object-cover" />
      )}

      {/* Render text post with colored background */}
      {!post.media_type && post.text_content && (
        <div
          className="flex items-center justify-center rounded-lg w-full"
          style={{
            backgroundColor: backgroundColor,
            color: textColor,
            minHeight: "200px",
            padding: "24px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontWeight: 600,
            fontSize: "1.5rem",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          {post.text_content}
        </div>
      )}
    </div>
  );
}