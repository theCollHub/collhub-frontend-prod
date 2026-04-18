import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MdHome, MdSchool, MdGroup, MdPerson } from "react-icons/md";
import { FaHeart, FaComment } from "react-icons/fa";
import AddPostModal from "./AddPostModal";
import CommentBottomSheet from "../components/CommentBottomSheet";
import api from "../utils/api";
import MessageBox from "../components/MessageBox";
import ChatList from "../components/ChatList";
import UserSearchBar from "../components/UserSearchBar";
import NotificationBell from "../components/NotificationBell";
import EnvelopeButton from "../components/EnvelopeButton";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../utils/socket";
import useDoubleTap from "../hooks/useDoubleTap";
import MobileBottomNav from "../components/MobileBottomNav";
import { useUI} from "../context/UIContext";
import MobileTopNav from "../components/MobileTopNav";
import { FaPaperPlane } from "react-icons/fa6";
import SharePostModal from "../components/SharePostModal";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import LikedByBottomSheet from "../components/LikedByBottomSheet";
import ExpandableText from "../components/ExpandableText";


const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function CampusFeed() {
  const {
    user,
    notificationsUnreadCount,
    setNotificationsUnreadCount,
    messagesUnreadCount,
    setMessagesUnreadCount,
  } = useAuth();

  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const bottomBoundaryRef = useRef(null);
  const [likedPostId, setLikedPostId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatList, setChatList] = useState([]);
  const [conversationId, setConversationId] = useState("");
  const [chatSearchTerm, setChatSearchTerm] = useState("");
  const socket = useMemo(() => (user ? getSocket() : null), [user]);
  const [hideNavbar, setHideNavbar] = useState(false);
  const lastScrollTop = useRef(0);

  const { setHideBottomNav} = useUI();
  const [bottomSheetPost, setBottomSheetPost] = useState(null);
  const handleDoubleTap = useDoubleTap((postId) => { handleLike(postId); }, 300);
  const [sharePost, setSharePost] = useState(null);
  const [showLikedBy, setShowLikedBy] = useState(false);
  const [likedByPostId, setLikedByPostId] = useState(null);


  //Hide mobile bottom nav when chat is open
  useEffect(() => {
    if (isChatOpen) setHideBottomNav(true);
    else setHideBottomNav(false);
  }, [isChatOpen, setHideBottomNav]);

  // Fetch Chat List
  useEffect(() => {
    if (!user) return;
    api
      .get("/messages")
      .then((res) => setChatList(res.data))
      .catch((err) => console.error("Error fetching chats:", err));
  }, [user]);

  const handleScroll = (e) => {
    const scrollTop =  e.target.scrollTop;

    if (scrollTop > lastScrollTop.current) {
      setHideNavbar(true);
    } else {
      setHideNavbar(false);
    }

    lastScrollTop.current =  scrollTop <= 0 ? 0 : scrollTop;
  };

  // Fetch Posts (Infinite Scroll)
  const fetchPostsPage = useCallback(
    async (pageNum) => {
      setLoading(true);
      try {
        const res = await api.get(`/posts?page=${pageNum}&limit=10`);
        const fetchedPosts = res.data.posts || [];
        if (fetchedPosts.length === 0) setHasMore(false);
        else
          setPosts((prev) =>
            pageNum === 1 ? fetchedPosts : [...prev, ...fetchedPosts]
          );
      } catch (err) {
        console.error("Error fetching posts:", err);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPostsPage(page);
  }, [page, fetchPostsPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  }, [loading, hasMore]);

  useEffect(() => {
    if (!bottomBoundaryRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadMore();
        });
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );
    observer.observe(bottomBoundaryRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  // Fetch unread notifications
  useEffect(() => {
    if (!user) return;
    api
      .get("/notifications/unread-count")
      .then((res) => setNotificationsUnreadCount(res.data.unreadCount))
      .catch((err) => console.error("Failed to fetch unread count:", err));
  }, [user, setNotificationsUnreadCount]);

  const handleNotificationsClick = async () => {
    try {
      await api.post("/notifications/mark-read");
    } catch (e) {
      console.warn("Failed to mark notifications read:", e);
    } finally {
      setNotificationsUnreadCount(0);
      navigate("/notifications");
    }
  };

  const handleLike = async (postId) => {
    if (!postId) return; // safeguard
    try {
      const res = await api.post(`/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes: res.data.likes_count, liked_by_me: res.data.liked }
            : p
        )
      );
      setLikedPostId(postId);
      setTimeout(() => setLikedPostId(null), 800);
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Failed to like post");
    }
  };

  const openLikedBySheet = (postId) => {
    setLikedByPostId(postId);
    setShowLikedBy(true);
  };

  const closeLikedBySheet = () => {
    setShowLikedBy(false);
    setLikedByPostId(null);
  };

  const handleOpenComments = (post) =>  { 
    setBottomSheetPost(post);
    setHideBottomNav(true);
  };

  const handleCloseComments = () => {
    setBottomSheetPost(null);
    setHideBottomNav(false);
  }
  const handleCommentAdded = (newComment) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === bottomSheetPost.id
          ? { ...p, comments: [...(p.comments || []), newComment] }
          : p
      )
    );
  };

  const handlePostAdded = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setPage(1);
    setHasMore(true);
  };

  const toggleChat = async () => {
    if (!isChatOpen) {
      try {
        const res = await api.get("/messages");
        setChatList(res.data);
      } catch (err) {
        toast.error("Failed to load chats");
      }
      setMessagesUnreadCount(0);
    }
    setIsChatOpen((prev) => !prev);
    if (isChatOpen) setConversationId("");
  };

  const handleSelectChat = async (conversationId) => {
    setConversationId(conversationId);
    try {
      await api.post(`/messages/${conversationId}/read`);
      setMessagesUnreadCount(0);
    } catch (err) {
      console.warn("Mark read failed", err);
    }
    setChatList((prev) =>
      prev.map((c) =>
        c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
  };

  const handleMessagesClick = () => {
    toggleChat();
  };

  // Socket listeners
  useEffect(() => {
    if (!user) return;

    const handleNewMessage = (msg) => {
      if (msg.sender_id === user?.id) return;
      setChatList((prev) => {
        const exists = prev.find((c) => c.conversation_id === msg.conversation_id);
        if (!exists) {
          return [
            ...prev,
            {
              conversation_id: msg.conversation_id,
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: 1,
            },
          ];
        }
        return prev.map((c) =>
          c.conversation_id === msg.conversation_id
            ? {
                ...c,
                last_message: msg.content,
                last_message_time: msg.created_at,
                unread_count: (c.unread_count || 0) + 1,
              }
            : c
        );
      });
      setMessagesUnreadCount((prev) => prev + 1);
    };

    const handleNotification = (notif) => {
      if (notif.type !== "message") setNotificationsUnreadCount((prev) => prev + 1);
    };

    const handleNewComment = (comment) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === comment.post_id
            ? { ...post, comments: [...(post.comments || []), comment] }
            : post
        )
      );
    };

    socket.on("message:new", handleNewMessage);
    socket.on("notification", handleNotification);
    socket.on("comment:new", handleNewComment);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("notification", handleNotification);
      socket.off("comment:new", handleNewComment);
    };
  }, [user, socket, setNotificationsUnreadCount, setMessagesUnreadCount]);

  const handleLogoClick = () => {};
  const handleComingSoon = () => toast.info("Coming soon");

  return (
    <>
      <div className="flex flex-col h-screen bg-gray-50 relative">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white px-8 py-4 shadow sticky top-0 z-40">
          <div className="flex items-center space-x-5">
            <h1 className="text-3xl font-bold text-black cursor-default select-none">
              CollHub
            </h1>
            <div className="w-72">
              <UserSearchBar />
            </div>
          </div>
          <div className="flex items-center space-x-8 text-gray-700">
            {user && (
              <NotificationBell
                unreadTotal={notificationsUnreadCount}
                onClick={handleNotificationsClick}
              />
            )}
            <EnvelopeButton
              unreadTotal={messagesUnreadCount}
              onClick={toggleChat}
              isActive={isChatOpen}
            />
          </div>
        </header>

        {/* Mobile Bottom Navbar */}
        <MobileBottomNav
          onOpenAddPost={() => setIsModalOpen(true)}
          onRefreshCampusFeed={() => {
          setPage(1);
          setHasMore(true);
          fetchPostsPage(1); // fetch fresh posts
        }}
        />
        <div
          className={`flex flex-1 overflow-hidden relative ${
            isModalOpen ? "pointer-events-none select-none" : ""
          }`}
        >
          {/* Left Sidebar */}
          <nav className="hidden md:flex flex-col w-72 bg-white shadow p-6 sticky top-[68px] h-[calc(100vh-68px)] space-y-8">
            <NavButton icon={<MdHome size={26} />} label="Home" active />
            <NavButton icon={<MdGroup size={26} />} label="Groups" onClick={handleComingSoon} />
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-4 px-6 py-4 rounded-lg text-xl font-semibold text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
            >
              <MdPerson size={26} /> Profile
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-auto px-4 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              + Create Post
            </button>
          </nav>

          {/* Main Feed */}
          <main
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto bg-white relative${
              isChatOpen ? "md:w-3/4" : "w-full"
            }`}
          >
            {/* Mobile Navbar */}
            <div className="md:hidden">
              <MobileTopNav
                user={user}
                notificationsUnreadCount={notificationsUnreadCount}
                messagesUnreadCount={messagesUnreadCount}
                handleNotificationsClick={handleNotificationsClick}
                handleMessagesClick={handleMessagesClick}
                hidden={hideNavbar}
                className="bg-white border-b border-gray-200"
              />
            </div>

            {posts.length === 0 ? (
              <p className="text-center text-gray-500 mt-20 text-lg sm:text-xl">
                No posts available.
              </p>
            ) : (
              posts.map((post, index) => (
                <article
                  key={post.id || index}
                  className="bg-white border-t border-gray-200 first:border-t-0"
                >
                  {/* Post Header */}
                  <header className="relative group">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-white transition-all duration-200 hover:bg-gray-50/50">
                      <div
                        className="flex items-center gap-3 sm:gap-4 cursor-pointer flex-1 min-w-0"
                        onClick={() => navigate(`/profile/user/${post.author_name}`)}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author_avatar || DEFAULT_AVATAR_URL}
                            alt={post.author_name}
                            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all duration-200"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent to-black/5 pointer-events-none" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors duration-200">
                            {post.author_name}
                          </h3>
                          <time className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                            {new Date(post.created_at).toLocaleString()}
                          </time>
                        </div>
                      </div>
                      <button
                        aria-label="Post options"
                        className="flex-shrink-0 ml-2 sm:ml-3 h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 active:scale-95"
                      >
                        <span className="text-xl sm:text-2xl select-none leading-none">&#x22EE;</span>
                      </button>
                    </div>
                  </header>

                  {/* Media */}
                  <div
                    className="relative w-full bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer overflow-hidden group"
                    onDoubleClick={() => handleLike(post.id)}
                    onTouchEnd={(e) => handleDoubleTap(e, post.id)}
                  >
                    <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] max-h-[32rem] flex items-center justify-center">
                      {post.media_type === "image" && (
                        <img
                          src={post.media_url}
                          alt="post content"
                          className="w-full h-full object-contain bg-black select-none transition-transform duration-300 group-hover:scale-[1.02]"
                          draggable={false}
                        />
                      )}
                      {post.media_type === "video" && (
                        <div className="w-full h-full bg-black">
                          <VideoPlayer
                            videoUrl={post.media_url}
                          />
                        </div>
                      )}
                      {!post.media_type && post.text_content && (
                        <div
                          className="flex items-center justify-center w-full h-full p-6 sm:p-8 md:p-12 shadow-inner"
                          style={{
                            backgroundColor: post.backgroundColor || "#FFD700",
                            color: post.text_color || "#222222",
                          }}>
                          <p 
                            className="text-2xl sm:text-3xl md:text-4xl text-center whitespace-pre-line break-words leading-relaxed"
                            style={{ 
                              fontWeight: 600,
                              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          >
                            {post.text_content}
                          </p>
                        </div>
                      )}
                      {likedPostId === post.id && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                                                <FaHeart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 text-7xl sm:text-8xl opacity-75 animate-ping pointer-events-none" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <section className="flex items-center gap-6 sm:gap-8 p-4 sm:p-6">
                    <button
                      className={`flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl ${
                        post.liked_by_me
                          ? "text-red-600"
                          : "text-gray-700 hover:text-red-600"
                      } transition`}
                      onClick={() => handleLike(post.id)}
                      aria-label="Like post"
                    >
                      <FaHeart />
                      <span className="text-lg sm:text-xl select-none">{post.likes || 0}</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl text-gray-700 hover:text-blue-600 transition"
                      onClick={() => handleOpenComments(post)}
                    >
                      <FaComment />
                      <span className="text-lg sm:text-xl select-none">{post.comments?.length || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-xl text-gray-700 hover:text-green-600 transition"
                      onClick={() => setSharePost(post)}
                      aria-label="Share post"
                    >
                      <FaPaperPlane />
                    </button>
                  </section>

                  {post.likers && post.likers.length > 0 && (
                    <section className="px-4 sm:px-6 pb-2 cursor-pointer"
                      onClick={() => openLikedBySheet(post.id)}
                    >
                      <p className="liked-by-text">
                        Liked by{" "}
                        {post.likers.slice(0, 3).map((username, i) => (
                          <span key={username}>
                            {username}
                            {i < Math.min(post.likers.length, 3) - 1 ? ", " : ""}
                          </span>
                        ))}
                        {post.likes > 3 && <span> and {post.likes - 3} others</span>}
                      </p>
                    </section>
                  )}

                  {/* Caption & Comments */}
                  <section className="px-4 sm:px-6 pb-6">
                    <div className="mb-3">
                      <ExpandableText text = {post.text_content || post.caption} limit={120} />
                    </div>
                    {(Array.isArray(post.comments) ? post.comments : [])
                      .slice(0, 4)
                      .map((comment) => (
                        <p key={comment.id} className="text-sm sm:text-base text-gray-600 mb-1">
                          <span className="font-semibold mr-2">{comment.author_name}</span>
                          {comment.text}
                        </p>
                      ))}
                    {Array.isArray(post.comments) && post.comments.length > 4 && (
                      <p className="text-xs sm:text-sm text-gray-400 cursor-pointer select-none">
                        View all {post.comments.length} comments
                      </p>
                    )}
                  </section>
                </article>
              ))
            )}
            <div ref={bottomBoundaryRef} style={{ height: "1px" }} />
            {loading && <p className="text-center">Loading more posts...</p>}
          </main>

          {/* Right Sidebar */}
          <aside className="hidden md:flex flex-col w-80 bg-white shadow p-8 sticky top-[68px] h-[calc(100vh-68px)] space-y-8 overflow-y-auto">
            <section>
              <h2 className="text-2xl font-bold mb-4">Suggestions</h2>
              <ul className="space-y-6">
                <li className="flex items-center gap-5 cursor-pointer hover:bg-gray-100 rounded-xl p-3 transition">
                  <img src="https://i.pravatar.cc/40?img=5" alt="Suggestion 1" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900 text-lg">John Doe</p>
                    <p className="text-gray-500 text-sm">Followed by 3 friends</p>
                  </div>
                  <button className="ml-auto text-blue-600 font-semibold hover:underline">Follow</button>
                </li>
                <li className="flex items-center gap-5 cursor-pointer hover:bg-gray-100 rounded-xl p-3 transition">
                  <img src="https://i.pravatar.cc/40?img=8" alt="Suggestion 2" className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex flex-col">
                    <p className="font-semibold text-gray-900 text-lg">Jane Smith</p>
                    <p className="text-gray-500 text-sm">Popular in your campus</p>
                  </div>
                  <button className="ml-auto text-blue-600 font-semibold hover:underline">Follow</button>
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">Advertisements</h2>
              <div className="bg-gray-200 rounded-xl p-6 text-center text-gray-700 font-medium">
                Your ad could be here
              </div>
            </section>
          </aside>
        </div>

        {/* Add Post Modal */}
        <AddPostModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPostAdded={handlePostAdded}
        />

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className=" fixed top-0 bottom-0 z-50 bg-white flex flex-col
                           w-full       /* mobile: full width */
                           md:w-96 md:right-0 md:border-l md:border-gray-300 md:shadow-lg">
            {!conversationId ? (
              <ChatList
                chats={chatList}
                onSelectChat={handleSelectChat}
                searchTerm={chatSearchTerm}
                setSearchTerm={setChatSearchTerm}
                onBack={() => setIsChatOpen(false)}
              />
            ) : (
              <MessageBox
                userId={user?.id}
                conversationId={conversationId}
                onClose={() => setConversationId("")}
              />
            )}
          </div>
        )}

        {sharePost && (
          <SharePostModal
            post={sharePost}
            chatList={chatList}
            onClose={() => setSharePost(null)}
            onShareSuccess={() => {
              toast.success("Shared!");
              setSharePost(null);
           }}
          />
        )}


        {/* Bottom Sheet for Comments */}
        {bottomSheetPost && (
          <CommentBottomSheet
            post={bottomSheetPost}
            onClose={handleCloseComments}
            onCommentAdded={handleCommentAdded}
          />
        )}

        {showLikedBy && likedByPostId && (
          <LikedByBottomSheet
            postId={likedByPostId}
            onClose={closeLikedBySheet}
          />
        )}

      </div>
      <ToastContainer newestOnTop />
    </>
  );
}

// NavButton Component
function NavButton({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-lg text-xl font-semibold transition ${
        active
          ? "bg-blue-100 text-blue-600 cursor-default"
          : "text-gray-600 hover:bg-gray-100 hover:text-blue-600 cursor-pointer"
      }`}
    >
      {icon} {label}
    </button>
  );
}

// VideoPlayer Component
function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    videoRef.current.volume = muted ? 1 : 0;
    setMuted(!muted);
  };

  return (
    <div className="relative w-full h-64 sm:h-[28rem] bg-gray-200 overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="object-cover w-full h-full select-none"
        draggable={false}
      />
      {/* Sound Toggle */}
      <button
        className="absolute bottom-2 right-2 p-2 bg-black bg-opacity-40 rounded-full text-white"
        onClick={toggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}
      >
        {muted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
      </button>
    </div>
  );
}