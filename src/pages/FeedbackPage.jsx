import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      alert("Please write some feedback before submitting.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/feedback", { userId: user.id, feedback });
      alert("Feedback submitted");
      setFeedback("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900">
        Feedback
      </h1>
      <textarea
        rows={6}
        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base sm:text-lg"
        placeholder="Write your feedback..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        disabled={loading}
        aria-label="Write your feedback"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        aria-live="polite"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
