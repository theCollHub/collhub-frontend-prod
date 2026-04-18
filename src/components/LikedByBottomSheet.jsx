import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Heart } from "lucide-react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function LikedByBottomSheet({ postId, onClose }) {
  const { setHideBottomNav } = useUI();
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    setHideBottomNav(true);

    async function fetchLikers() {
      setLoading(true);
      try {
        const res = await api.get(`/posts/${postId}/likers`);
        setLikers(res.data.likers || []);
      } catch (err) {
        console.error("Failed to fetch likers:", err);
        toast.error("Failed to load likers");
      } finally {
        setLoading(false);
      }
    }
    fetchLikers();
    return () => setHideBottomNav(false);
  }, [postId, setHideBottomNav]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          closing ? "bg-opacity-0" : "bg-opacity-50"
        }`}
        onClick={handleClose}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={wrapperRef}
        className={`relative w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 ease-out ${
          closing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{ height: "75vh", maxHeight: "80vh" }}
      >
        {/* Header with gradient border */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-pink-500 via-red-500 to-rose-500" />
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <div>
                <h2 className="text-xl">Liked by</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {likers.length} {likers.length === 1 ? "person" : "people"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              aria-label="Close liked by list"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Likers List */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide"
          style={{ minHeight: 0 }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : likers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
              <Heart className="w-16 h-16" strokeWidth={1.5} />
              <p>No likes yet</p>
              <p className="text-sm">Be the first to like this post!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {likers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 rounded-2xl p-3 transition-all duration-200 group animate-fadeIn"
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => {
                    navigate(`/profile/user/${user.username}`);
                    handleClose();
                  }}
                >
                  <div className="relative">
                    <img
                      src={user.avatar_url || DEFAULT_AVATAR_URL}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-red-200 transition-all duration-200"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-1">
                      <Heart className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 group-hover:text-red-600 transition-colors duration-200">
                      {user.username}
                    </p>
                    {user.full_name && (
                      <p className="text-sm text-gray-500 truncate">
                        {user.full_name}
                      </p>
                    )}
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}