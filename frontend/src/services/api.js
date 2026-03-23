import axios from "axios";

import { showToast } from "../components/Toaster";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
    showToast(
      error.response?.data?.message || error.message || "Something went wrong",
      "error",
    );
    return Promise.reject(error);
  },
);

export const authAPI = {
  sendOtp: (data) => api.post("/auth/send-otp", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
};

export const adminAPI = {
  createUser: (data) => api.post("/admin/users", data),
  createBatch: (data) => api.post("/admin/batches", data),
  assignGuides: () => api.post("/admin/assign-guides"),
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
  getBookings: () => api.get("/admin/bookings"),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
};

export const guideAPI = {
  getBatches: () => api.get("/guide/batches"),
  getPending: () => api.get("/guide/pending-bookings"),
  approveBooking: (id) => api.put(`/guide/bookings/${id}/approve`),
  rejectBooking: (id) => api.put(`/guide/bookings/${id}/reject`),
};

export const studentAPI = {
  getAllBatches: () => api.get("/student/batches"),
  getMyBatch: () => api.get("/student/my-batch"),
  bookSlot: (data) => api.post("/student/book-slot", data),
};

export default api;
