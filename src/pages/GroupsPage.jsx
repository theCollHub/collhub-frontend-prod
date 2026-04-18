import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { MdArrowBack } from 'react-icons/md';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/groups').then(res => setGroups(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-white py-4 px-2">
      {/* Back button */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <MdArrowBack size={24} />
        </button>
      </div>

      {/* Groups grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {groups.map(group => (
          <div
            key={group.id}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            <div className="w-20 h-20 mb-2 overflow-hidden rounded-lg shadow-sm">
              <img
                src={group.logo_url || '/default-company.png'}
                alt={group.company_name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-center truncate px-1">
              {group.company_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}