import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import { useUI } from "../context/UIContext";
import CollaborateActionButtons from "../components/CollaborateActionButtons";

export default function CollaboratorsListPage({ userId }) {
  const [collaborators, setCollaborators] = useState([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setHideBottomNav } = useUI();
  const { username } = useParams();
  const [fetchedUserId, setFetchedUserId] = useState(null);

  const effectiveUserId = userId || fetchedUserId;

  useEffect(() => {
    setHideBottomNav(true);
    return () => setHideBottomNav(false);
  }, [setHideBottomNav]);

  // Fetch "my collaborators"
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const endpoint = effectiveUserId
      ? `/collaboration/user/${effectiveUserId}/collaborators`
      : "/collaboration/my/collaborators";

    api
      .get(endpoint)
      .then((res) => {
        if (mounted) {
          const users = res.data.users || [];
          setCollaborators(users);
          setFilteredCollaborators(users);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err?.response?.data?.error || "Failed to load collaborators");
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [effectiveUserId]);

  useEffect(() => {
    if (!username) return;
    api.get(`/profile/user/${username}`).then((res) => setFetchedUserId(res.data.id));
  }, [username]);

  // Filter collaborators by search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFilteredCollaborators(
      collaborators.filter((u) => u.username.toLowerCase().includes(q))
    );
  }, [searchQuery, collaborators]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-2xl mx-auto pt-6 px-4 pb-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Title */}
        <h1 className="text-center mb-6">Collaborators</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search collaborators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-full pl-12 pr-4 py-3 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading collaborators...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-red-800 mb-1">Error</h3>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCollaborators.length === 0 && !error && (
          <div className="flex flex-col items-center gap-4 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 mb-1">
                {searchQuery ? "No matching users found" : "No collaborators yet"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:text-blue-700 text-sm transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        )}

        {/* Collaborators List */}
        {!loading && filteredCollaborators.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredCollaborators.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                  index !== filteredCollaborators.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div
                  className="flex items-center gap-4 cursor-pointer flex-1 min-w-0 group"
                  onClick={() => navigate(`/profile/user/${user.username}`)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        user.avatar_url ||
                        "https://res.cloudinary.com/collhub-demo/image/upload/w_80,h_80,c_fill,r_max/default_avatar_hu9cmz.png"
                      }
                      alt={user.username}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-blue-400 transition-colors"
                    />
                    {user.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate group-hover:text-blue-600 transition-colors">
                      {user.username}
                    </p>
                    <p className="text-sm text-gray-500">Collaborator</p>
                  </div>
                </div>

                <div className="ml-3 flex-shrink-0">
                  <CollaborateActionButtons viewedUserId={user.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}