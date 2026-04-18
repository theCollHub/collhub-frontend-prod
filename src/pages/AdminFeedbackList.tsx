// src/pages/AdminFeedbackList.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

interface Feedback {
  id: number;
  user_id: string | number;
  feedback_text: string;
  created_at: string;
}

export default function AdminFeedbackList() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setError("Access denied. Admins only.");
      setLoading(false);
      return;
    }

    const fetchFeedbacks = async () => {
      try {
        const res = await api.get("/api/feedback");
        setFeedbacks(res.data.feedbacks);
      } catch (err: any) {
        console.error("Error fetching feedbacks:", err);
        setError(err.response?.data?.error || "Failed to fetch feedbacks");
      }
      setLoading(false);
    };

    fetchFeedbacks();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (error)
    return (
      <p className="text-red-500 font-semibold text-center mt-6">{error}</p>
    );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">User Feedbacks</h1>

      {feedbacks.length === 0 ? (
        <p className="text-gray-500 text-center">No feedback submitted yet.</p>
      ) : (
        <ul className="space-y-4">
          {feedbacks.map((fb) => (
            <li
              key={fb.id}
              className="p-4 border rounded-md shadow-sm hover:shadow-md transition"
            >
              <p className="text-gray-700">{fb.feedback_text}</p>
              <p className="text-gray-400 text-sm mt-1">
                User: {fb.user_id} |{" "}
                {new Date(fb.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
