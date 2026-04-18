// src/utils/api.js
import axios from "axios";

//Centralized axios instance
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`, // backend base URL
  withCredentials: true, // send HttpOnly cookies automatically
  timeout: 20000, // 20-second timeout safeguard
});

//Response interceptor → handle 401 with refresh logic safely
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Only refresh if refreshToken exists in cookies
      if (document.cookie.includes("refreshToken")) {
        try {
          await api.post("/auth/refresh", {}, { withCredentials: true });
          return api(originalRequest); // retry original request
        } catch (refreshError) {
          console.error("Refresh token invalid - redirecting to login...", refreshError);
          return Promise.reject(refreshError);
        }
      } else {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ------- Custom API Calls -------

// Block a user by username
export const blockUser = async (userId) => {
  try {
    const res = await api.post(`/block/${userId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to block user:", error.response?.data || error.message);
    throw error;
  }
};

// Unblock a user by username
export const unblockUser = async (userId) => {
  try {
    const res = await api.delete(`/block/${userId}`);
    return res.data;
  } catch (error) {
    console.error("Failed to unblock user:", error.response?.data || error.message);
    throw error;
  }
};

// Get block status for a user
export const getBlockStatus = async (userId) => {
  try {
    const res = await api.get(`/block/${userId}/status`);
    return res.data;
  } catch (error) {
    console.error("Failed to get block status:", error.response?.data || error.message);
    throw error;
  }
};

// Change password helper
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const res = await api.post(
      "/auth/change-password",
      { currentPassword, newPassword },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    console.error("Failed to change password:", error?.response?.data || error?.message);
    throw error;
  }
};

export const getMyCollaborators = async () => {
  const res = await api.get('/collaboration/my/collaborators');
  return res.data.users;
};
export const getMyCollaborating = async () => {
  const res = await api.get('/collaboration/my/collaborating');
  return res.data.users;
};

export const getUserCollaborators = async (userId) => {
  const res = await api.get(`/collaboration/user/${userId}/collaborators`);
  return res.data.users;
};

export const getUserCollaborating = async (userId) => {
  const res = await api.get(`/collaboration/user/${userId}/collaborating`);
  return res.data.users;
};

export const getUserFollowers = async (userId) => {
  try {
    const res = await api.get(`/collaboration/user/${userId}/followers`);
    return res.data.users;
  } catch (error) {
    console.error("Failed to fetch user followers:", error.response?.data || error.message);
    throw error;
  }
};


export default api;