// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { authenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) {return <div>Loading...</div>;} // prevent flicker
  if (!authenticated) {
    return <Navigate to="/login" replace state={{from: location}} />;
  }

  return children;
}
