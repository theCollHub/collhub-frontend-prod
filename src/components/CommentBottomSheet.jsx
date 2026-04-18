import React, { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function CommentBottomSheet({ 
  post, 
  onClose, 
  onCommentAdded 
}) {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [closing, setClosing] = useState(false);

  const inputRef = useRef(null);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [post.id]);

  useEffect(() => {
    // Simulate API call - replace with your actual API
    async function fetchComments() {
      setLoading(true);
      try {
        // const res = await api.get(`/posts/${post.id}/comments`);
        // setComments(res.data.comments);
        
        // Simulated delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setComments(post.comments || []);
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [post.id, post.comments]);

  useEffect(() => {
    // Auto-scroll to bottom when new comments are added
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);

    const tempComment = {
      id: `temp-${Date.now()}`,
      author_name: "You",
      text: newComment.trim(),
      created_at: new Date().toISOString(),
      author_avatar: DEFAULT_AVATAR_URL,
    };

    setComments((prev) => [...prev, tempComment]);
    setNewComment("");

    try {
      // Simulate API call - replace with your actual API
      // const res = await api.post(`/posts/${post.id}/comments`, { text: tempComment.text });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const savedComment = {
        ...tempComment,
        id: Date.now(), // Replace with actual server ID
      };
      
      setComments((prev) =>
        prev.map((c) => (c.id === tempComment.id ? savedComment : c))
      );
      if (onCommentAdded) onCommentAdded(savedComment);
    } catch (err) {
      console.error("Failed to add comment:", err);
      // Replace with your toast notification
      // toast.error("Failed to post comment");
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
    } finally {
      setPosting(false);
    }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  const handleProfileClick = (username, name) => {
    // Replace with your navigation logic
    // navigate(`/profile/user/${username || name}`);
    console.log("Navigate to profile:", username || name);
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

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
        className={`relative w-full max-w-2xl bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden transform transition-all duration-300 ease-out ${
          closing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
        }`}
        style={{ height: "75vh", maxHeight: "80vh" }}
      >
        {/* Header with gradient border */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl">Comments</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {comments.length} {comments.length === 1 ? "comment" : "comments"}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
              aria-label="Close comments"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div
          id="comments-list"
          className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide"
          style={{ minHeight: 0 }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No comments yet</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-3 group animate-fadeIn"
                >
                  <img
                    src={comment.author_avatar || DEFAULT_AVATAR_URL}
                    alt={comment.author_name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 rounded-2xl px-4 py-3 group-hover:bg-gray-100 transition-colors duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(
                            comment.author_username,
                            comment.author_name
                          );
                        }}
                        className="hover:underline text-left"
                      >
                        <p className="text-sm text-gray-900 mb-1">
                          {comment.author_name}
                        </p>
                      </button>
                      <p className="text-gray-800 leading-relaxed break-words">
                        {comment.text}
                      </p>
                    </div>
                    <time className="text-xs text-gray-400 mt-1.5 ml-4 block">
                      {getTimeAgo(comment.created_at)}
                    </time>
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Write a comment..."
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                disabled={posting}
              />
              {newComment.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {newComment.length}
                </div>
              )}
            </div>
            <button
              onClick={handleAddComment}
              disabled={posting || !newComment.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-3 rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:shadow-none flex-shrink-0"
              aria-label="Post comment"
            >
              {posting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 ml-1">
            Press Enter to post • Shift+Enter for new line
          </p>
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