import React from "react";

const DEFAULT_AVATAR =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_80,h_80,c_fill,r_max/default_avatar_hu9cmz.png";

/**
 * UserCard component to display user avatar, username, and handle click actions
 * @param {Object} user { id, username, avatar_url }
 * @param {Function} onClick Function to execute when card is clicked (e.g. navigate to profile)
 * @param {String} className Optional additional classes for styling/layout
 */
export default function UserCard({ user, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded hover:bg-blue-50 transition text-left shadow ${className}`}
      aria-label={`View profile of ${user.username}`}
    >
      <img
        src={user.avatar_url || DEFAULT_AVATAR}
        alt={`${user.username} avatar`}
        className="w-14 h-14 rounded-full object-cover border"
        loading="lazy"
      />
      <span className="text-lg font-medium truncate">{user.username}</span>
    </button>
  );
}