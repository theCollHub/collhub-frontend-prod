import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import FeedbackModal from "../components/FeedbackModal";
import { useNavigate } from "react-router-dom";
import MobileBottomNav from "../components/MobileBottomNav";
import ChangePasswordModal from "../components/ChangePasswordModal";
import PostCard from "../components/PostCard";
import { getUserCollaborators, getUserCollaborating } from "../utils/api";
import ImageCropperModal from "../components/ImageCropperModal";
import BackupEmailModal from "../components/BackupEmailModal";


const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function ProfilePage() {
  const { user, authenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: "",
    name: "",
    bio: "",
    interests: [],
    profilePic: null,
    coverPic: null,
  });

  const [profilePicPreview, setProfilePicPreview] = useState(DEFAULT_AVATAR_URL);
  const [coverPicPreview, setCoverPicPreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [interestsInput, setInterestsInput] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [showBackupEmailModal, setShowBackupEmailModal] = useState(false);
  const [backupEmailInput, setBackupEmailInput] = useState("");
  const [loadingBackupEmail, setLoadingBackupEmail] = useState(false);

  const profilePicInputRef = useRef();
  const coverPicInputRef = useRef();

  // Fetch profile and posts on mount
  useEffect(() => {
    if (authenticated && user?.id) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [authenticated, user]);

  async function fetchProfile() {
    try {
      const res = await api.get("/profile/me");
      const data = res.data;

      const [collaborators, collaborating] = await Promise.all([
        getUserCollaborators(data.id),
        getUserCollaborating(data.id),
      ]);

      setProfile({
        username: data.username || "",
        name: data.name || "",
        backupEmail: data.backup_email || "",
        bio: data.bio || "",
        interests: Array.isArray(data.interests) ? data.interests : 
            data.interests?.split(",").map(i => i.trim()) || [],
        profilePic: data.avatar_url || null,
        coverPic: data.coverpicurl || null,
        collaboratorsCount: collaborators.length,
        collaboratingCount: collaborating.length,
      });

      const backendURL = "http://localhost:4000";

      setProfilePicPreview(
        data.avatar_url
        ? `${backendURL}${data.avatar_url}`
        : DEFAULT_AVATAR_URL
      );

      setCoverPicPreview(
        data.coverpicurl
        ? `${backendURL}${data.coverpicurl}`
        : null
      );
      setInterestsInput(Array.isArray(data.interests) ? data.interests.join(", ") : data.interests || "");
      setBackupEmailInput(data.backup_email || "");
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }

  async function fetchUserPosts() {
    try {
      const res = await api.get(`/profile/${user.id}/posts`);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("Error fetching user posts:", err);
    }
  } 

   // Callback to remove post from list after deletion
  const handlePostDeleted = (deletedPostId) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
  };

  function handleFileChange(e, type) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      if (type === "profilePic") {
        const previewURL = URL.createObjectURL(file);;
        setTempImage(previewURL);
        setCropperOpen(true);
      } else {
        setProfile((p) => ({ ...p, [type]: file }));
        if (type === "coverPic") setCoverPicPreview(URL.createObjectURL(file));
        setHasChanges(true);
      }
    }
  }

  const handleCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
    setProfile((p) => ({ ...p, profilePic: croppedFile }));
    setProfilePicPreview(URL.createObjectURL(croppedBlob));
    setCropperOpen(false);
    setTempImage(null);
    setHasChanges(true);
  };

  function onUsernameChange(e) {
    setProfile((p) => ({ ...p, username: e.target.value }));
    setHasChanges(true);
  }

  function onBioChange(e) {
    setProfile((p) => ({ ...p, bio: e.target.value }));
    setHasChanges(true);
  }

  function onInterestsChange(e) {
    const cleaned = e.target.value
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    setProfile((p) => ({ ...p, interests: cleaned }));
    setHasChanges(true);
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!user?.id) return alert("User data not loaded yet. Please wait.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", profile.username);
      formData.append("bio", profile.bio);
      formData.append("interests", interestsInput);
      if (profile.profilePic instanceof File)
        formData.append("profilePic", profile.profilePic);
      if (profile.coverPic instanceof File)
        formData.append("coverPic", profile.coverPic);

      await api.put("/profile/me", formData);

      alert("Profile updated");
      setHasChanges(false);
      setIsEditMode(false);
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Update failed");
      console.error(err);
    }
    setLoading(false);
  }

  async function sendBackupEmailOtp(newEmail) {
    await api.post("/auth/request-otp", {email: newEmail });
  }

  async function saveBackupEmail(newEmail, otp) {
    const formData = new FormData();
    formData.append("username", profile.username);
    formData.append("bio", profile.bio);
    formData.append("interests", interestsInput);
    formData.append("backupEmail", newEmail);
    formData.append("backupEmailOtp", otp);
    if (profile.profilePic instanceof File)
      formData.append("profilePic", profile.profilePic);
    if (profile.coverPic instanceof File)
      formData.append("coverPic", profile.coverPic);
    await api.put("/profile/me", formData);
    setProfile((p) => ({ ...p, backupEmail: newEmail }));
  }

  function handleMenuClick() {
    setShowMenu(!showMenu);
  }

  function handleEditProfile() {
    setIsEditMode(true);
    setShowMenu(false);
  }

  function handleCancelEdit() {
    setIsEditMode(false);
    setHasChanges(false);
    fetchProfile();
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Cover Image */}
        <div className="relative w-full h-64 sm:h-80">
          {coverPicPreview ? (
            <img
              src={coverPicPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 w-full h-full"></div>
          )}
          {isEditMode && (
            <>
              <button
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-900 px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-all duration-200 flex items-center gap-2"
                onClick={() => coverPicInputRef.current.click()}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Change Cover
              </button>
              <input
                type="file"
                accept="image/*"
                ref={coverPicInputRef}
                onChange={(e) => handleFileChange(e, "coverPic")}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex items-start justify-between -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-5">
              {/* Profile Picture */}
              <div className="relative">
                {profilePicPreview ? (
                  <img
                    src={profilePicPreview}
                    alt="Profile"
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl">
                    {profile.username ? profile.username[0].toUpperCase() : "?"}
                  </div>
                )}
                {isEditMode && (
                  <>
                    <button
                      onClick={() => profilePicInputRef.current.click()}
                      className="absolute bottom-1 right-1 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-200 shadow-lg"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={profilePicInputRef}
                      onChange={(e) => handleFileChange(e, "profilePic")}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <ImageCropperModal
                isOpen={cropperOpen}
                imageSrc={tempImage}
                onCancel={() => setCropperOpen(false)}
                onCropComplete={handleCropComplete}
              />

              {/* Stats - Desktop */}
              <div className="hidden sm:flex gap-8 pb-4">
                <div className="text-center cursor-pointer" onClick={() => navigate("/profile/collaborators")}>
                  <div className="font-semibold text-gray-900">
                    {profile.collaboratorsCount ?? 0}
                  </div>
                  <div className="text-gray-600 text-sm">Collaborators</div>
                </div>
                <div className="text-center cursor-pointer" onClick={() => navigate("/profile/collaborating")}>
                  <div className="font-semibold text-gray-900">
                    {profile.collaboratingCount ?? 0}
                  </div>
                  <div className="text-gray-600 text-sm">Collaborating</div>
                </div>
              </div>
            </div>

            {/* Menu Button */}
            {!isEditMode && (
              <div className="relative mt-4">
                <button
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  onClick={handleMenuClick}
                >
                  <svg width="24" height="24" fill="currentColor" className="text-gray-700">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[180px] z-50">
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={handleEditProfile}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={() => {
                        setShowMenu(false);
                        setShowChangePasswordModal(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={() => {
                        setShowMenu(false);
                        setShowBackupEmailModal(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Add Backup Email
                    </button>
                    <div className="my-1 border-t border-gray-100"></div>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/about", { state: { from: "profile" } });
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      About
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={() => {
                        setShowMenu(false);
                        navigate("/team", { state: { from: "profile" } });
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Our Team
                    </button>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-50 transition-colors text-gray-700 text-sm"
                      onClick={() => {
                        setShowMenu(false);
                        setShowFeedbackModal(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Feedback
                    </button>
                    <div className="my-1 border-t border-gray-100"></div>
                    <button
                      className="flex items-center gap-3 w-full px-4 py-2 hover:bg-red-50 transition-colors text-red-600 text-sm"
                      onClick={async () => {
                        setShowMenu(false);
                        await logout();
                        navigate("/login");
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}

                <FeedbackModal
                  isOpen={showFeedbackModal}
                  onClose={() => setShowFeedbackModal(false)}
                  userId={user?.id}
                />
                <ChangePasswordModal
                  isOpen={showChangePasswordModal}
                  onClose={() => setShowChangePasswordModal(false)}
                />
                <BackupEmailModal
                  isOpen={showBackupEmailModal}
                  onClose={() => setShowBackupEmailModal(false)}
                  initialEmail={backupEmailInput}
                  onSendOtp={sendBackupEmailOtp}
                  onSave={saveBackupEmail}
                />
              </div>
            )}
          </div>

          {/* Stats - Mobile */}
          <div className="flex sm:hidden gap-8 mb-4 pb-4 border-b border-gray-200">
            <div className="text-center cursor-pointer" onClick={() => navigate("/profile/collaborators")}>
              <div className="font-semibold text-gray-900">
                {profile.collaboratorsCount ?? 0}
              </div>
              <div className="text-gray-600 text-sm">Collaborators</div>
            </div>
            <div className="text-center cursor-pointer" onClick={() => navigate("/profile/collaborating")}>
              <div className="font-semibold text-gray-900">
                {profile.collaboratingCount ?? 0}
              </div>
              <div className="text-gray-600 text-sm">Collaborating</div>
            </div>
          </div>

          {/* Username */}
          <div className="mb-2">
            {isEditMode ? (
              <input
                type="text"
                value={profile.username}
                onChange={onUsernameChange}
                className="text-xl font-semibold border-2 border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:outline-none transition-colors w-full"
                placeholder="Username"
              />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900">
                {profile.username || "User"}
              </h1>
            )}
          </div>

          {/* Bio */}
          <div className="mb-3">
            {isEditMode ? (
              <textarea
                rows={3}
                className="w-full border-2 border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="Tell us about yourself..."
                value={profile.bio}
                onChange={onBioChange}
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No bio provided."}
              </p>
            )}
          </div>

          {/* Interests */}
          <div className="mb-4">
            {isEditMode ? (
              <input
                type="text"
                className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                placeholder="e.g. Photography, Coding, Traveling"
                value={interestsInput}
                onChange={(e) => {
                  setInterestsInput(e.target.value);
                  setHasChanges(true);
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.interests.length > 0 ? (
                  profile.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm border border-gray-200"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No interests added.</span>
                )}
              </div>
            )}
          </div>

          {/* Edit Mode Buttons */}
          {isEditMode && (
            <div className="flex gap-3 mb-6 pb-6 border-b border-gray-200">
              <button
                disabled={!hasChanges || loading}
                onClick={saveProfile}
                className="flex-1 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2.5 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Posts Grid Header */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            <span className="font-semibold text-gray-900 uppercase text-sm tracking-wider">Posts</span>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 pb-8">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-100 cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  {post.media_type === "image" && post.media_url ? (
                    <img
                      src={post.media_url}
                      alt={post.title || "Post image"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : post.media_type === "video" && post.media_url ? (
                    <video
                      src={post.media_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="text-white text-center px-2">
                      <p className="font-semibold text-sm mb-1">{post.title}</p>
                      {post.description && (
                        <p className="text-xs opacity-90 line-clamp-2">{post.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navbar */}
      <MobileBottomNav onOpenAddPost={() => navigate("/add-post")} />
    </div>
  );
}