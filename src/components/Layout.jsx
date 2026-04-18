// src/layouts/Layout.jsx
import React, { useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import MobileBottomNav from "../components/MobileBottomNav";
import MobileTopNav from "../components/MobileTopNav";
import AddPostModal from "../pages/AddPostModal";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";

export default function Layout() {
  const {
    user,
    messagesUnreadCount,
    notificationsUnreadCount,
    setNotificationsUnreadCount,
    setMessagesUnreadCount,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const { hideBottomNav } = useUI();

  const [isAddPostOpen, setIsAddPostOpen] = useState(false);
  const [hideNavbar, setHideNavbar] = useState(false);
  const lastScrollTop = useRef(0);

  const handleOpenAddPost = () => setIsAddPostOpen(true);
  const handleCloseAddPost = () => setIsAddPostOpen(false);

  // Paths where the mobile top nav should be hidden
  const hideMobileTopNavPaths = ["/messages", "/search", "/profile/user"];
  const shouldHideTopNav = hideMobileTopNavPaths.some((path) =>
    location.pathname.startsWith(path)
  );

  // Scroll handler to hide/show top nav
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    if (scrollTop > lastScrollTop.current) setHideNavbar(true);
    else setHideNavbar(false);
    lastScrollTop.current = scrollTop <= 0 ? 0 : scrollTop;
  };

  // Navigate to notifications and mark as read
  const handleNotificationsClick = async () => {
    navigate("/notifications");
    setNotificationsUnreadCount(0);
  };

  // Navigate to messages
  const handleMessagesClick = () => {
    navigate("/messages");
    setMessagesUnreadCount(0);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with scroll listener */}
      <main
        className="flex-grow overflow-auto"
        onScroll={handleScroll}
      >
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      {!hideBottomNav && (
        <div className="md:hidden">
          <MobileBottomNav onOpenAddPost={handleOpenAddPost} />
        </div>
      )}

      {/* Add Post Modal */}
      <AddPostModal
        isOpen={isAddPostOpen}
        onClose={handleCloseAddPost}
        onPostAdded={(newPost) => console.log("New post added:", newPost)}
      />
    </div>
  );
}