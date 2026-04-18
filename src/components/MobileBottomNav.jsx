import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MdHome, MdGroup, MdPerson } from "react-icons/md";
import { FiSearch } from "react-icons/fi";

export default function MobileBottomNav({ onOpenAddPost, onRefreshCampusFeed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    if (location.pathname === "/campus-feed") {
      onRefreshCampusFeed?.();
    } else {
      navigate("/campus-feed");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-pb">
      <div className="flex justify-around items-end px-2 py-3 relative">

        {/* Home */}
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isActive("/campus-feed")
              ? "text-black"
              : "text-gray-500 hover:text-gray-700 active:scale-95"
          }`}
          aria-label="Home"
        >
          <div className="relative">
            <MdHome size={24} />
            {isActive("/campus-feed") && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
            )}
          </div>
          <span className="text-xs select-none">Home</span>
        </button>

        {/* Search */}
        <button
          onClick={() => navigate("/search")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isActive("/search")
              ? "text-black"
              : "text-gray-500 hover:text-gray-700 active:scale-95"
          }`}
          aria-label="Search"
        >
          <div className="relative">
            <FiSearch size={24} />
            {isActive("/search") && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
            )}
          </div>
          <span className="text-xs select-none">Search</span>
        </button>

        {/* Create Post */}
        <button
          onClick={onOpenAddPost}
          aria-label="Create Post"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black shadow-md flex items-center justify-center text-white transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95">
            <span className="text-3xl leading-none pb-0.5">+</span>
          </div>
        </button>

        {/* Groups */}
        <button
          onClick={() => navigate("/groups")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isActive("/groups")
              ? "text-black"
              : "text-gray-500 hover:text-gray-700 active:scale-95"
          }`}
          aria-label="Groups"
        >
          <div className="relative">
            <MdGroup size={24} />
            {isActive("/groups") && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
            )}
          </div>
          <span className="text-xs select-none">Groups</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 ${
            isActive("/profile")
              ? "text-black"
              : "text-gray-500 hover:text-gray-700 active:scale-95"
          }`}
          aria-label="Profile"
        >
          <div className="relative">
            <MdPerson size={24} />
            {isActive("/profile") && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
            )}
          </div>
          <span className="text-xs select-none">Profile</span>
        </button>

      </div>
    </nav>
  );
}
