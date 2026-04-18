import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import api from "../utils/api";

export default function FeedbackModal({ isOpen, onClose, userId }) {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Click outside closes modal
  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      alert("Please enter some feedback.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/feedback", { userId, feedback });
      alert("Feedback submitted");
      setFeedback("");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to submit feedback");
    }
    setLoading(false);
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onMouseDown={handleClickOutside}
      aria-modal="true"
      role="dialog"
      aria-labelledby="feedbackModalTitle"
    >
      <div
        className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6 relative"
        ref={modalRef}
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black focus:outline-none"
          aria-label="Close feedback form"
        >
          ✕
        </button>

        <h2 id="feedbackModalTitle" className="text-2xl font-bold mb-4">
          Feedback
        </h2>
        <textarea
          rows={5}
          className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Write your feedback here..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          disabled={loading}
          aria-label="Write your feedback here"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          aria-live="polite"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>,
    document.body
  );
}

