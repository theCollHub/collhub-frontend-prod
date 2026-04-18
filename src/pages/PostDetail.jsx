import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaTrash, FaHeart, FaComment } from "react-icons/fa";
import { Heart, MessageCircle, Share2, Bookmark, Trash2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import api from "../utils/api";
import CommentBottomSheet from "../components/CommentBottomSheet";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { user } = useAuth();
  const { setHideBottomNav } = useUI();
  const navigate = useNavigate();

  // Hide/show bottom nav when sheet toggles
  useEffect(() => {
    setHideBottomNav(isCommentsOpen);
    return () => setHideBottomNav(false);
  }, [isCommentsOpen, setHideBottomNav]);

  // Fetch post details
  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [postId]);

  // Toggle like
  const handleToggleLike = async () => {
    if (!post) return;
    setLikeLoading(true);
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setPost((prev) => ({
        ...prev,
        likes: res.data.likes_count,
        liked_by_me: res.data.liked,
      }));
    } catch (err) {
      console.error("Error toggling like:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  // Add comment (optimistic update)
  const handleCommentAdded = (newComment) => {
    setPost((prev) => ({
      ...prev,
      comments: [...(prev.comments || []), newComment],
    }));
  };

  // Delete post
  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success("Post deleted successfully!");
      navigate("/");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error("Failed to delete post.");
    }
  };

  // Share post
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author_name}`,
          text: post.caption?.replace(/<[^>]*>/g, '').substring(0, 100),
          url: window.location.href,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard();
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // Toggle bookmark
  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks");
  };

  // Format date relative to now
  const getRelativeTime = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Check if caption is long
  const captionText = post?.caption?.replace(/<[^>]*>/g, '') || '';
  const isLongCaption = captionText.length > 200;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        {/* Skeleton Loader */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
          <div className="p-4 sm:p-6">
            {/* Header Skeleton */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            {/* Caption Skeleton */}
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            {/* Media Skeleton */}
            <div className="w-full h-96 bg-gray-200 rounded-xl"></div>
            {/* Actions Skeleton */}
            <div className="flex items-center gap-6 mt-6">
              <div className="h-8 bg-gray-200 rounded w-16"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-red-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-600">Post not found.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </motion.button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <header className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={post.author_avatar || DEFAULT_AVATAR_URL}
                    alt={post.author_name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{post.author_name}</p>
                  <time className="text-sm text-gray-500">
                    {getRelativeTime(post.created_at)}
                  </time>
                </div>
              </div>

              {user.id === post.user_id && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
          </header>

          {/* Post Caption */}
          {post.caption && (
            <div className="px-4 sm:px-6 pt-4">
              <div className={`prose prose-sm max-w-full ${!isExpanded && isLongCaption ? 'line-clamp-3' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: post.caption }} />
              </div>
              {isLongCaption && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Post Media */}
          {post.media_type === "image" && (
            <div className="mt-4 relative bg-gray-50">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={post.media_url}
                alt="Post media"
                className="w-full max-h-[600px] object-contain"
                onLoad={() => setImageLoaded(true)}
              />
            </div>
          )}
          {post.media_type === "video" && (
            <div className="mt-4 bg-gray-50">
              <video
                src={post.media_url}
                controls
                className="w-full max-h-[600px] object-contain"
              />
            </div>
          )}

          {/* Actions Section */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {/* Like Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleToggleLike}
                  disabled={likeLoading}
                  aria-pressed={post.liked_by_me}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    post.liked_by_me
                      ? "text-red-600 bg-red-50"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <motion.div
                    animate={post.liked_by_me ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart
                      className={`w-6 h-6 ${post.liked_by_me ? "fill-current" : ""}`}
                    />
                  </motion.div>
                  <span className="font-semibold">{post.likes}</span>
                </motion.button>

                {/* Comment Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCommentsOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="font-semibold">{post.comments?.length || 0}</span>
                </motion.button>

                {/* Share Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Bookmark Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleBookmark}
                className={`p-2 rounded-lg transition-all ${
                  isBookmarked
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Bookmark className={`w-6 h-6 ${isBookmarked ? "fill-current" : ""}`} />
              </motion.button>
            </div>

            {/* Like Summary */}
            {post.likes > 0 && (
              <div className="text-sm text-gray-600">
                {post.liked_by_me && post.likes === 1 && "You liked this post"}
                {post.liked_by_me && post.likes > 1 && `You and ${post.likes - 1} ${post.likes - 1 === 1 ? 'other' : 'others'} liked this`}
                {!post.liked_by_me && `${post.likes} ${post.likes === 1 ? 'like' : 'likes'}`}
              </div>
            )}
          </div>
        </motion.article>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-center text-gray-900 mb-2">Delete Post?</h3>
              <p className="text-center text-gray-600 text-sm mb-6">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      {isCommentsOpen && (
        <CommentBottomSheet
          post={post}
          onClose={() => setIsCommentsOpen(false)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </>
  );
}