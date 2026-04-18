import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function AboutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.state?.from === "profile") {
      navigate("/profile");
    } else {
      navigate(-1); // fallback
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      {/* Back Button */}
      <div className="mb-6 flex items-center">
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold"
        >
          <FiArrowLeft className="mr-2" size={20} />
          Back
        </button>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900 text-center sm:text-left">
        About CollHub
      </h1>
      <p className="text-gray-700 mb-8 leading-relaxed text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
        CollHub is a vibrant community-driven platform built for students, freshers, and startups to connect, collaborate, and grow together.     
        We aim to bridge the gap between <strong>campus life and real-world opportunities</strong>, empowering young talent to showcase skills, network, and discover internships or projects.
      </p>

      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-800">Our Mission</h2>
      <p className="text-gray-700 mb-8 leading-relaxed text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
        To empower students and startups by providing a <strong>social-professional hub</strong> where ideas meet execution. We want to make networking, learning, and collaboration as natural as scrolling your feed.
      </p>

      <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-800">Our Vision</h2>
      <p className="text-gray-700 leading-relaxed text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
        We envision CollHub as the go-to platform for the <strong>next generation of innovators, leaders, and creators</strong>. A place where every student can find their tribe, startups can discover talent, and freshers can launch their careers with confidence.
      </p>
    </div>
  );
}


