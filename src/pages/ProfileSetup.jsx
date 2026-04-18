import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { use } from "react";

export default function ProfileSetup() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();
  const { accessToken } = useAuth();

  const handleAddInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
    }
    setInterestInput("");
  };

  const handleRemoveInterest = (interest) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      interests.forEach((i) => formData.append("interests", interests.join(",")));
      if (avatarFile) formData.append("profilePic", avatarFile);
      if (coverFile) formData.append("coverPic", coverFile);

      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/me`, {
        method: "PUT",
       body: formData,
       credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update profile");
        setLoading(false);
        return;
      }

      await res.json();
      navigate("/campus-feed");
    } catch (err) {
      alert("Server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-96 flex flex-col space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Setup Your Profile</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          placeholder="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div>
          <label className="block mb-1 font-semibold">Avatar:</label>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Cover Photo:</label>
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Interests:</label>
          <div className="flex mb-2">
            <input
              type="text"
              placeholder="Add interest"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              className="border px-3 py-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="ml-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {interests.map((i) => (
              <span
                key={i}
                className="bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
              >
                {i}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(i)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}