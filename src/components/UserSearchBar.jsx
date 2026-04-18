import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/collhub-demo/image/upload/w_150,h_150,c_fill,r_max/default_avatar_hu9cmz.png";

export default function UserSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const dropdownRef = useRef();
  const navigate = useNavigate();

  // Fetch search results
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
          `/search/users?q=${encodeURIComponent(query)}&t=${Date.now()}`,
          { headers: { "Cache-Control": "no-cache" } }
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setResults([]);
        setNotFound(false);
      }
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigate to user profile and close dropdown
  const handleSelectUser = (e, username) => {
    e.stopPropagation(); // Prevent outside click handler from firing
    setResults([]);
    setQuery("");
    navigate(`/profile/user/${username}`);
  };

  return (
    <div className="relative w-full max-w-xs sm:max-w-md" ref={dropdownRef}>
      <input
        type="search"
        placeholder="Search users..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border rounded-md p-2 pl-10 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
        aria-label="Search users"
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 sm:w-6 sm:h-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M10 2a8 8 0 105.293 14.293l4.7 4.7 1.414-1.414-4.7-4.7A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
      </svg>

      {(loading || results.length > 0 || notFound) && (
        <div className="absolute bg-white border w-full rounded-md shadow-lg max-h-60 overflow-y-auto z-50 mt-1">
          {loading && <div className="p-2 text-gray-500 text-sm">Searching...</div>}

          {!loading &&
            Array.isArray(results) &&
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-blue-100"
                onClick={(e) => handleSelectUser(e, user.username)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelectUser(e, user.username);
                }}
              >
                <img
                  src={user.avatar_url || DEFAULT_AVATAR_URL}
                  alt={user.username}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                />
                <span className="text-gray-800 text-sm sm:text-base truncate">{user.username}</span>
              </div>
            ))}

          {!loading && notFound && (
            <div className="p-2 text-gray-500 italic cursor-default text-sm">User not found</div>
          )}
        </div>
      )}
    </div>
  );
}