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
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
    },
    {
      label: "Approved",
      value: bookings.filter((b) => b.status === "approved").length,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-green-600",
      bg: "bg-gradient-to-r from-emerald-500/10 to-green-600/10",
    },
    {
      label: "Pending",
      value: bookings.filter((b) => b.status === "pending").length,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10",
    },
    {
      label: "Rejected",
      value: bookings.filter((b) => b.status === "rejected").length,
      icon: XCircle,
      gradient: "from-red-500 to-rose-600",
      bg: "bg-gradient-to-r from-red-500/10 to-rose-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass-card p-8 rounded-3xl mb-8">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Complete control over users, batches, and review slot bookings
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              className={cn(
                "glass-card p-8 rounded-3xl group cursor-pointer transform-hover",
                stat.bg,
              )}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-2xl bg-white/20 group-hover:bg-white/30 backdrop-blur-sm`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-white/80 transition-all" />
              </div>
              <p className="text-sm font-medium text-white/80 uppercase tracking-wide mb-2">
                {stat.label}
              </p>
              <p className="text-3xl lg:text-4xl font-black text-white drop-shadow-lg">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Create User Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="glass-card p-8 rounded-3xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <UserPlus className="w-8 h-8 text-primary" />
                Create New User
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Quickly add students, guides, or admins to the system
              </p>
            </div>
            <motion.button
              onClick={() => setOpen(true)}
              className="btn btn-primary btn-lg shadow-xl hover:shadow-2xl px-8 gap-3 self-start lg:self-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Calendar className="w-8 h-8 text-primary" />
                All Slot Bookings ({bookings.length})
              </h3>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select select-bordered max-w-xs"
              >
                <option value="">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
              <h4 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
                No bookings {roleFilter ? `with status "${roleFilter}"` : "yet"}
              </h4>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Bookings will appear here once students start scheduling their
                review slots.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-lg table-stack w-full">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Batch</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover">
                      <td data-label="Student" className="font-medium">
                        {booking.studentId?.name || "N/A"}
                      </td>
                      <td data-label="Batch">
                        {booking.batchId?.batchName || "N/A"}
                      </td>
                      <td data-label="Date">
                        {new Date(booking.date).toLocaleDateString()}
                      </td>
                      <td data-label="Slot">
                        <div className="badge badge-primary font-bold">
                          Slot {booking.slotNumber}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span
                          className={cn("badge font-semibold text-sm", {
                            "badge-success": booking.status === "approved",
                            "badge-warning": booking.status === "pending",
                            "badge-error": booking.status === "rejected",
                          })}
                        >
                          {booking.status.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Actions">
                        <motion.button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="btn btn-error btn-sm gap-2 shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Create User Modal */}
      <motion.dialog open={open} className="modal modal-open">
        <div className="modal-box glass-card max-w-md p-8 rounded-3xl">
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-primary" />
            Create New User
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text font-semibold">Full Name</span>
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="input input-bordered input-lg w-full"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                placeholder="john@college.edu"
                className="input input-bordered input-lg w-full"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Roll Number</span>
              </label>
              <input
                type="text"
                placeholder="21CS001"
                className="input input-bordered input-lg w-full"
                value={formData.rollNo}
                onChange={(e) =>
                  setFormData({ ...formData, rollNo: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold">Role</span>
              </label>
              <select
                className="select select-bordered w-full"
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
          <div className="modal-action mt-8">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary gap-2 shadow-xl"
              onClick={handleCreateUser}
              disabled={!formData.name || !formData.email || !formData.rollNo}
            >
              Create User
            </button>
          </div>
        </div>
      </motion.dialog>
    </motion.div>
  );
};

export default AdminDashboard;
