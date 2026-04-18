import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const team = [
  {
    name: "Dheeraj Bollam",
    role: "Founder & CEO",
    bio: "Visionary entrepreneur passionate about AI, startups, and building a global student ecosystem.",
    image: `${import.meta.env.VITE_BACKEND_URL}/uploads/dheeraj.png`, 
  },
  {
    name: "P.Bharath kumar Reddy",
    role: "Back End Developer",
    bio: "Tech enthusiast and problem-solver driving product innovation at CollHub.",
    image: `${import.meta.env.VITE_BACKEND_URL}/uploads/bharath_kumar.png`, 
  },
  {
    name: "Lenkalapelly Akhila",
    role: "Front End Developer",
    bio: "Creative front-end developer passionate about crafting user-friendly interfaces and seamless digital experiences.",
    image: `${import.meta.env.VITE_BACKEND_URL}/uploads/akhila.png`, 
  },
  {
    name: "Gaje Aravind",
    role: "Front End Developer",
    bio: "Detail-oriented front-end developer focused on building responsive, efficient, and visually engaging web applications",
    image: `${import.meta.env.VITE_BACKEND_URL}/uploads/aravind.png`, 
  },
];

export default function TeamPage() {
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
    <div className="max-w-5xl mx-auto p-6 sm:p-10">
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

      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-10 text-gray-900 text-center sm:text-left">
        Our Team
      </h1>
      <p className="text-gray-700 mb-8 leading-relaxed text-center sm:text-left max-w-3xl mx-auto sm:mx-0">
        Meet the passionate minds behind CollHub. Our team is dedicated to building
        a platform that empowers students, startups, and freshers to collaborate and grow together.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {team.map((member, index) => (
          <div
            key={member.name + index}
            className="bg-white shadow-md rounded-lg p-6 text-center hover:shadow-lg transition"
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full mb-4 object-cover"
            />
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
              {member.name}
            </h2>
            <p className="text-indigo-600 font-medium text-sm sm:text-base">{member.role}</p>
            <p className="text-gray-600 text-sm sm:text-base mt-3">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

