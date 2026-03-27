import axios from "axios";

import { showToast } from "../components/Toaster";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  // Lightweight debug log to help trace API calls from the frontend
  try {
    console.debug(
      `API Request → ${config.method?.toUpperCase() || "GET"} ${config.baseURL || ""}${config.url}`,
    );
  } catch (e) {
    /* ignore logging errors */
  }
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
    // Log response error details for easier debugging in browser console
    try {
      console.error(
        "API Response Error →",
        error?.response?.status,
        error?.config?.method?.toUpperCase(),
        error?.config?.url,
        error?.response?.data,
      );
    } catch (e) {
      /* ignore */
    }
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
  updateBatch: (id, data) => api.put(`/admin/batches/${id}`, data),
  assignGuides: () => api.post("/admin/assign-guides"),
  getBatches: () => api.get("/admin/batches"),
  getGuides: () => api.get("/admin/guides"),
  deleteBatch: (id) => api.delete(`/admin/batches/${id}`),
  getReports: (format = "json") => api.get(`/admin/reports?format=${format}`),

  getSettings: () => api.get("/admin/settings"),
  updateSettings: (data) => api.put("/admin/settings", data),
  getBookings: () => api.get("/admin/bookings"),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
};

export const guideAPI = {
  getBatches: () => api.get("/guide/batches"),
  getPending: () => api.get("/guide/pending-bookings"),
  getBatch: (id) => api.get(`/guide/batches/${id}`),
  approveBooking: (id) => api.put(`/guide/bookings/${id}/approve`),
  rejectBooking: (id) => api.put(`/guide/bookings/${id}/reject`),
  getReports: (format = "json", batchId) => {
    const qs = `?format=${format}${batchId ? `&batchId=${batchId}` : ""}`;
    // Binary formats should be downloaded as arraybuffer
    if (format === "excel" || format === "pdf" || format === "docx") {
      return api.get(`/guide/reports${qs}`, { responseType: "arraybuffer" });
    }
    if (format === "csv") {
      return api.get(`/guide/reports${qs}`, { responseType: "text" });
    }
    return api.get(`/guide/reports${qs}`);
  },
};

export const studentAPI = {
  getAllBatches: () => api.get("/student/batches"),
  getMyBatch: () => api.get("/student/my-batch"),
  bookSlot: (data) => api.post("/student/book-slot", data),
  getGuideBookings: () => api.get("/student/guide-bookings"),
};

export default api;
