import React, { useEffect, useState, useRef } from "react";
import api from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import CollaborateActionButtons from "../components/CollaborateActionButtons";
import MessageBox from "../components/MessageBox";
import { blockUser, unblockUser, getBlockStatus, getUserCollaborators, getUserCollaborating, getUserFollowers } from "../utils/api";
import CollaboratorsListPage from "../pages/CollaboratorsListPage";
import CollaboratingListPage from "../pages/CollaboratingListPage";
import { useUI } from "../context/UIContext";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function OtherUserProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [followers, setFollowers] = useState([]);

  const [isMessageBoxOpen, setIsMessageBoxOpen] = useState(false);
  const [conversationId, setConversationId] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [showCollaborating, setShowCollaborating] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const { setHideBottomNav } = useUI();

  useEffect(() => {
    if (!username) return;

    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(null);

        const profileRes = await api.get(`/profile/user/${username}`);
        const data = profileRes.data;
        const userId = data.id;

        const postsRes = await api.get(`/profile/${userId}/posts`);

        const followersData = await getUserFollowers(userId);
        setFollowers(followersData || []);

        const [collaborators, collaborating] = await Promise.all([
          getUserCollaborators(userId),
          getUserCollaborating(userId),
        ]);

        setProfile({
          id: userId,
          username: data.username || "User",
          bio: data.bio || "No bio provided.",
          interests: Array.isArray(data.interests) ? data.interests : [],
          profilePic: data.avatar_url || DEFAULT_AVATAR_URL,
          coverPic: data.coverpicurl || null,
          collaboratorsCount: collaborators.length,
          collaboratingCount: collaborating.length,
        });

        setPosts(postsRes.data.posts || []);

        if (user) {
          const blockStatusRes = await getBlockStatus(userId);
          setIsBlocked(blockStatusRes.blocked);
        }
      } catch (err) {
        console.error(
          "Error fetching profile or posts:",
          err.response?.data || err.message
        );
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [username, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMessage = async () => {
    if (!user || !profile) {
      return alert("You must be logged in");
    }
    try {
      const res = await api.post("/messages/conversation", {
        user1: user.id,
        user2: profile.id,
      });
      setConversationId(res.data.conversationId);
      setIsMessageBoxOpen(true);
      setHideBottomNav(true);
    } catch (err) {
      console.error("Failed to open/create conversation:", err);
      alert("Could not open chat at this time.");
    }
  };

  const handleBlockToggle = async () => {
    try {
      if (isBlocked) {
        await unblockUser(profile.id);
        setIsBlocked(false);
      } else {
        await blockUser(profile.id);
        setIsBlocked(true);
      }
      setShowMenu(false);
    } catch (err) {
      console.error("Block toggle failed:", err);
      alert("Action failed. Please try again.");
    }
  };

  const onClickCollaboratorsCount = () => {
    navigate(`/profile/user/${profile.username}/collaborators`);
  };

  const onClickCollaboratingCount = () => {
    navigate(`/profile/user/${profile.username}/collaborating`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 px-4">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-gray-900">{profile.username}</span>

          <div className="relative" ref={menuRef}>
            <button
              className="p-2 hover:bg-gray-100 rounded-full transition"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="More options"
            >
              <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                  onClick={handleBlockToggle}
                >
                  {isBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-white">
        {/* Cover Photo */}
        <div className="relative h-52 md:h-72 bg-gray-200">
          {profile.coverPic ? (
            <img
              src={profile.coverPic}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-4 md:px-8 relative">
          {/* Profile Picture & Stats in One Row */}
          <div className="flex items-end justify-between pb-4 border-b border-gray-200">
            {/* Left Side: Profile Picture */}
            <div className="-mt-20 md:-mt-24 relative z-10">
              <img
                src={profile.profilePic}
                alt={profile.username}
                className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 border-white bg-white shadow-lg"
              />
            </div>

            {/* Right Side: Stats in a Single Row */}
            <div className="flex space-x-6 md:space-x-10 pb-2">
              <button
                className="flex flex-col items-center hover:opacity-70 transition"
                onClick={() => navigate(`/profile/user/${profile.username}/posts`)}
              >
                <span className="text-lg md:text-2xl text-gray-900">{posts.length}</span>
                <span className="text-xs md:text-sm text-gray-500">posts</span>
              </button>
              <button
                className="flex flex-col items-center hover:opacity-70 transition"
                onClick={onClickCollaboratorsCount}
              >
                <span className="text-lg md:text-2xl text-gray-900">{profile.collaboratorsCount}</span>
                <span className="text-xs md:text-sm text-gray-500">collaborators</span>
              </button>
              <button
                className="flex flex-col items-center hover:opacity-70 transition"
                onClick={onClickCollaboratingCount}
              >
                <span className="text-lg md:text-2xl text-gray-900">{profile.collaboratingCount}</span>
                <span className="text-xs md:text-sm text-gray-500">collaborating</span>
              </button>
            </div>
          </div>

          {/* Username & Bio */}
          <div className="py-5 border-b border-gray-200">
            <h1 className="text-2xl mb-2">{profile.username}</h1>
            
            <p className="text-gray-700 mb-3 max-w-2xl">{profile.bio}</p>

            {/* Interests */}
            {profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Followers Preview */}
            {followers.length > 0 && (
              <p className="text-sm text-gray-600">
                Followed by{" "}
                {followers.slice(0, 3).map((f, i) => (
                  <span key={f.id}>
                    <span className="text-gray-900">{f.username}</span>
                    {i < Math.min(followers.length, 3) - 1 ? ", " : ""}
                  </span>
                ))}
                {followers.length > 3 && (
                  <span> and {followers.length - 3} others</span>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons - Below Profile Section */}
          <div className="py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-3">
              <CollaborateActionButtons viewedUserId={profile.id} currentUserId={user?.id} />
              <button
                onClick={handleMessage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div>
          <div className="px-4 md:px-8 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl">Posts</h2>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="aspect-square cursor-pointer group relative bg-gray-100"
                    onClick={() => navigate(`/posts/${post.id}`)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/posts/${post.id}`);
                    }}
                    role="button"
                    aria-label="View post details"
                  >
                    {post.media_type === "image" && (
                      <img
                        src={post.media_url}
                        alt={post.caption || "Post image"}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {post.media_type === "video" && (
                      <video
                        src={post.media_url}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Hover Overlay - Instagram Style */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center space-x-6 text-white">
                        <div className="flex items-center space-x-2">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>{post.comments?.length ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Box Modal */}
      {isMessageBoxOpen && conversationId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
            <MessageBox
              userId={user?.id}
              conversationId={conversationId}
              onClose={() => {
                setIsMessageBoxOpen(false);
                setHideBottomNav(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}