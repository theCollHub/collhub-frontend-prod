import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import LandingPage from "./pages/SplashScreen";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import CampusFeed from "./pages/CampusFeed";
import ProfilePage from "./pages/ProfilePage";
import NotificationsPage from "./pages/NotificationsPage";
import MessagesPage from "./pages/MessagesPage";
import { useAuth } from "./context/AuthContext";
import OtherUserProfilePage from "./pages/OtherUserProfilePage";
import AboutPage from "./pages/AboutPage";
import TeamPage from "./pages/TeamPage";
import NotificationComponent from "./components/NotificationComponent";
import PostDetail from "./pages/PostDetail";
import AdminFeedbackList from "./pages/AdminFeedbackList";
import SearchPage from "./pages/SearchPage";
import Layout from "./components/Layout";
import CollaboratorsListPage from "./pages/CollaboratorsListPage";
import CollaboratingListPage from "./pages/CollaboratingListPage";
import GroupsPage from "./pages/GroupsPage";
import CompanyOnboarding from "./pages/CompanyOnboarding";
import GroupChatPage from "./pages/GroupChatPage";
import SplashScreen from "./pages/SplashScreen";


function ProtectedRoute({ children }) {
  const { authenticated, checking } = useAuth();
  const location = useLocation();
  const [redirected, setRedirected] = React.useState(false);

  if (checking) return <div>Loading...</div>;

  if (!authenticated && !redirected){
    setRedirected(true);
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  const { authenticated, user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Global notifications for authenticated users */}
      {authenticated && user?.id && <NotificationComponent userId={user.id} />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<TeamPage />} />

        {/* Protected route without bottom nav */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/*  Protected routes with Layout (BottomNav + Outlet) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/campus-feed" element={<CampusFeed />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupChatPage />} />
          <Route path="/admin/companies" element={<CompanyOnboarding />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route
            path="/profile/user/:username"
            element={<OtherUserProfilePage />}
          />
          <Route path="/profile/collaborators" element={<CollaboratorsListPage />} />
          <Route path="/profile/collaborating" element={<CollaboratingListPage />} />
          <Route path="/profile/user/:username/collaborators" element={<CollaboratorsListPage />} />
          <Route path="/profile/user/:username/collaborating" element={<CollaboratingListPage />} />

          <Route
            path="/notifications"
            element={
              <NotificationsPage
                key={location.pathname + location.search}
              />
            }
          />
          <Route path="/messages" element={<MessagesPage userId={user?.id} />} />
          <Route
            path="/messages/:chatId"
            element={<MessagesPage userId={user?.id} />}
          />
          <Route path="/posts/:postId" element={<PostDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route
            path="/admin/feedbacks"
            element={
              user?.role === "admin" ? (
                <AdminFeedbackList />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Route>

        {/* Fallback for unknown paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}