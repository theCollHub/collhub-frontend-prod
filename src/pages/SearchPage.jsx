// src/pages/SearchPage.jsx
import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setNotFound(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/search/users?q=${encodeURIComponent(query)}&t=${Date.now()}`
        );
        const users = Array.isArray(res.data.users) ? res.data.users : [];
        if (users.length === 0) {
          setResults([]);
          setNotFound(true);
        } else {
          setResults(users);
          setNotFound(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelectUser = (username) => {
    navigate(`/profile/user/${username}`);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Search bar */}
      <div className="p-3 border-b shadow-sm">
        <input
          type="search"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-3 text-gray-500">Searching...</div>}

        {!loading &&
          results.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-100"
              onClick={() => handleSelectUser(user.username)}
            >
              <img
                src={user.avatar_url || DEFAULT_AVATAR_URL}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-gray-800">{user.username}</span>
            </div>
          ))}

        {!loading && notFound && (
          <div className="p-3 text-gray-500 italic">User not found</div>
        )}
      </div>
    </div>
  );
}