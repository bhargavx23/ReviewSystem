import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { cn } from "../utils/utils";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    role: "student",
  });
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingsRes = await adminAPI.getBookings();
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.name || !formData.email || !formData.rollNo) {
        showToast("Please fill all fields", "error");
        return;
      }
      await adminAPI.createUser(formData);
      setOpen(false);
      setFormData({ name: "", email: "", rollNo: "", role: "student" });
      showToast("User created successfully!", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating user", "error");
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await adminAPI.deleteBooking(id);
        showToast("Booking deleted!", "success");
        fetchData();
      } catch (err) {
        showToast(
          err.response?.data?.message || "Error deleting booking",
          "error",
        );
      }
    }
  };

  const stats = [
    {
      label: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
      color: "royal-blue",
    },
    {
      label: "Approved",
      value: bookings.filter((b) => b.status === "approved").length,
      icon: CheckCircle,
      color: "emerald",
    },
    {
      label: "Pending",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: Clock,
      color: "amber",
    },
    {
      label: "Rejected",
      value: bookings.filter((b) => b.status === "rejected").length,
      icon: XCircle,
      color: "red",
    },
  ];

  if (loading) {
    return (
      <div className="flex-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-xl font-medium text-gray-600">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(
    (b) => !roleFilter || b.status === roleFilter,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 py-8">
      <div className="container-max">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 fade-in-up"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete control over users, batches, and review slot bookings
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const colorClasses = {
              "royal-blue": "from-blue-600 to-blue-700",
              emerald: "from-emerald-500 to-emerald-600",
              amber: "from-amber-500 to-amber-600",
              red: "from-red-500 to-red-600",
            };
            return (
              <motion.div
                key={stat.label}
                className="stat-card"
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[stat.color]} shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
        >
          <div className="card p-6 bg-gradient-light border-blue-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create User</h3>
                <p className="text-sm text-gray-600">
                  Add new students, guides, or admins
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="btn-primary w-full"
            >
              <UserPlus className="w-5 h-5" />
              Add New User
            </button>
          </div>

          <div className="card p-6 bg-white border-blue-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Filter Bookings
                </h3>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-primary flex-1"
              >
                <option value="">All Status</option>
                <option value="approved">✅ Approved</option>
                <option value="pending">⏳ Pending</option>
                <option value="rejected">❌ Rejected</option>
              </select>
              <button
                onClick={() => {
                  setRoleFilter("");
                  fetchData();
                }}
                className="btn-secondary"
              >
                Reset
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bookings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-0 overflow-hidden"
        >
          <div className="p-6 border-b border-blue-100 bg-gradient-light">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Slot Bookings
              <span className="text-lg text-gray-600 font-normal">
                ({bookings.length})
              </span>
            </h3>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-lg flex-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">
                No bookings found
              </h4>
              <p className="text-gray-600 max-w-md mx-auto">
                Bookings will appear here once students schedule review slots.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="font-semibold text-gray-900">
                        {booking.studentId?.name || "N/A"}
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {booking.batchId?.batchName || "N/A"}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono font-medium">
                          {new Date(booking.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-info">
                          Slot {booking.slotNumber}
                        </span>
                      </td>
                      <td>
                        {(() => {
                          const statusConfig = {
                            approved: "badge-success",
                            pending: "badge-warning",
                            rejected: "badge-danger",
                          };
                          return (
                            <span
                              className={`badge ${statusConfig[booking.status] || "badge-warning"}`}
                            >
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="btn-danger btn-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Create User Modal */}
        {open && (
          <div className="dialog-overlay" onClick={() => setOpen(false)}>
            <div
              className="dialog-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                Create New User
              </div>
              <div className="dialog-body space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    className="input-primary"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="user@college.edu"
                    className="input-primary"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="21CS001"
                    className="input-primary"
                    value={formData.rollNo}
                    onChange={(e) =>
                      setFormData({ ...formData, rollNo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    className="select-primary"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                  >
                    <option value="student">Student</option>
                    <option value="guide">Guide</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="dialog-footer gap-3">
                <button
                  className="btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary gap-2"
                  onClick={handleCreateUser}
                  disabled={
                    !formData.name || !formData.email || !formData.rollNo
                  }
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
