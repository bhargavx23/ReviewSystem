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
  Settings as SettingsIcon,
  BookOpen,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { cn } from "../utils/utils";
import { adminAPI } from "../services/api";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [batches, setBatches] = useState([]);
  const [guides, setGuides] = useState([]);
  const [openUser, setOpenUser] = useState(false);
  const [openBatch, setOpenBatch] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    rollNo: "",
    role: "student",
  });
  const [batchFormData, setBatchFormData] = useState({
    batchName: "",
    projectTitle: "",
    section: "",
    guideId: "",
    teamLeaderName: "",
    teamLeaderEmail: "",
    teamLeaderRollNo: "",
  });
  const [settingsData, setSettingsData] = useState({});
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, batchesRes, guidesRes] = await Promise.all([
        adminAPI.getBookings(),
        adminAPI.getBatches(),
        adminAPI.getGuides(),
      ]);
      setBookings(bookingsRes.data || []);
      setBatches(batchesRes.data || []);
      setGuides(guidesRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettingsData(res.data);
    } catch (err) {
      showToast("Failed to load settings", "error");
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!userFormData.name || !userFormData.email || !userFormData.rollNo) {
        showToast("Please fill all fields", "error");
        return;
      }
      await adminAPI.createUser(userFormData);
      setOpenUser(false);
      setUserFormData({ name: "", email: "", rollNo: "", role: "student" });
      showToast("User created successfully!", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating user", "error");
    }
  };

  const handleCreateBatch = async () => {
    try {
      const {
        batchName,
        projectTitle,
        section,
        teamLeaderName,
        teamLeaderEmail,
        teamLeaderRollNo,
      } = batchFormData;
      if (
        !batchName ||
        !projectTitle ||
        !teamLeaderName ||
        !teamLeaderEmail ||
        !teamLeaderRollNo ||
        !batchFormData.guideId
      ) {
        showToast(
          "Please fill all required batch fields and assign a guide",
          "error",
        );
        return;
      }

      await adminAPI.createBatch(batchFormData);
      setOpenBatch(false);
      setBatchFormData({
        batchName: "",
        projectTitle: "",
        section: "",
        guideId: "",
        teamLeaderName: "",
        teamLeaderEmail: "",
        teamLeaderRollNo: "",
      });
      showToast("Batch created successfully!", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating batch", "error");
    }
  };

  const handleUpdateSettings = async () => {
    try {
      await adminAPI.updateSettings({
        reviewStartDate: settingsData.reviewStartDate,
        reviewEndDate: settingsData.reviewEndDate,
        slotsPerDay: settingsData.slotsPerDay || 10,
      });
      showToast("Review date range updated successfully!", "success");
      setOpenSettings(false);
      fetchData();
      fetchSettings();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error updating settings",
        "error",
      );
    }
  };

  const handleApproveBooking = async (id) => {
    try {
      setActionLoading(id);
      showToast("Approving booking...", "loading");
      await adminAPI.approveBookingHOD(id);
      showToast("Booking approved!", "success");
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error approving booking",
        "error",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectBooking = async (id) => {
    if (!window.confirm("Reject this booking request?")) return;
    try {
      setActionLoading(id);
      showToast("Rejecting booking...", "loading");
      await adminAPI.rejectBookingHOD(id);
      showToast("Booking rejected!", "error");
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error rejecting booking",
        "error",
      );
    } finally {
      setActionLoading(null);
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
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
              onClick={() => setOpenUser(true)}
              className="btn btn-primary w-full"
            >
              <UserPlus className="w-5 h-5" />
              Add New User
            </button>
          </div>

          <div className="card p-6 bg-gradient-light border-emerald-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Create Batch
                </h3>
                <p className="text-sm text-gray-600">Add new project batches</p>
              </div>
            </div>
            <button
              onClick={() => setOpenBatch(true)}
              className="btn btn-success w-full"
            >
              <BookOpen className="w-5 h-5" />
              Add Batch
            </button>
          </div>

          <div className="card p-6 bg-gradient-light border-amber-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Review Settings
                </h3>
                <p className="text-sm text-gray-600">
                  Set date range & slots per day (global for all guides)
                </p>
                {settingsData.reviewStartDate && settingsData.reviewEndDate && (
                  <p className="text-sm font-mono mt-1">
                    📅 Current:{" "}
                    {new Date(
                      settingsData.reviewStartDate,
                    ).toLocaleDateString()}{" "}
                    -{" "}
                    {new Date(settingsData.reviewEndDate).toLocaleDateString()}(
                    {settingsData.slotsPerDay || 10} slots/day)
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                await fetchSettings();
                setOpenSettings(true);
              }}
              className="btn btn-warning w-full gap-2"
            >
              <Calendar className="w-5 h-5" />
              Edit Settings
            </button>
          </div>
        </motion.div>

        {/* Batch Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Batches</h3>
          {batches.length === 0 ? (
            <p className="text-gray-600">No batches created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {batches.map((batch) => (
                <div
                  key={batch._id}
                  className="card p-4 bg-white border rounded-lg shadow-sm"
                >
                  <h4 className="font-bold text-lg text-gray-900">
                    {batch.batchName}{" "}
                    {batch.section ? `(${batch.section})` : ""}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Project: {batch.projectTitle}
                  </p>
                  <p className="text-sm text-gray-600">
                    Lead: {batch.teamLeaderName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {batch.teamLeaderEmail}
                  </p>
                  <p className="text-sm text-gray-600">
                    Roll: {batch.teamLeaderRollNo}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Guide: {batch.guideId?.name || "Unassigned"}
                  </p>
                </div>
              ))}
            </div>
          )}
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
                            pending: {
                              className: "badge-warning",
                              label: "Pending",
                            },
                            approved: {
                              className: "badge-success",
                              label: "Approved",
                            },
                            rejected: {
                              className: "badge-danger",
                              label: "Rejected",
                            },
                          };
                          const status = statusConfig[booking.status] || {
                            className: "badge-secondary",
                            label: booking.status,
                          };
                          return (
                            <span className={`badge ${status.className}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          {booking.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveBooking(booking._id)
                                }
                                className="btn-success btn-sm"
                                disabled={actionLoading === booking._id}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectBooking(booking._id)}
                                className="btn-warning btn-sm"
                                disabled={actionLoading === booking._id}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(booking._id)}
                            className="btn-danger btn-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Create User Modal */}
        {openUser && (
          <div className="dialog-overlay" onClick={() => setOpenUser(false)}>
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
                    value={userFormData.name}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, name: e.target.value })
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
                    value={userFormData.email}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        email: e.target.value,
                      })
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
                    value={userFormData.rollNo}
                    onChange={(e) =>
                      setUserFormData({
                        ...userFormData,
                        rollNo: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    className="select-primary"
                    value={userFormData.role}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, role: e.target.value })
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
                  onClick={() => setOpenUser(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary gap-2"
                  onClick={handleCreateUser}
                  disabled={
                    !userFormData.name ||
                    !userFormData.email ||
                    !userFormData.rollNo
                  }
                >
                  <UserPlus className="w-4 h-4" />
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {openBatch && (
          <div className="dialog-overlay" onClick={() => setOpenBatch(false)}>
            <div
              className="dialog-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dialog-header flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                Create New Batch
              </div>
              <div className="dialog-body space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Batch A"
                    className="input-primary"
                    value={batchFormData.batchName}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        batchName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="Section 1"
                    className="input-primary"
                    value={batchFormData.section}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        section: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Project Title
                  </label>
                  <input
                    type="text"
                    placeholder="MERN Review System"
                    className="input-primary"
                    value={batchFormData.projectTitle}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        projectTitle: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Assign Guide
                  </label>
                  <select
                    className="select-primary w-full"
                    value={batchFormData.guideId}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        guideId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select guide</option>
                    {guides.map((guide) => (
                      <option key={guide._id} value={guide._id}>
                        {guide.name} ({guide.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team Leader Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input-primary"
                    value={batchFormData.teamLeaderName}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        teamLeaderName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team Leader Email
                  </label>
                  <input
                    type="email"
                    placeholder="leader@college.edu"
                    className="input-primary"
                    value={batchFormData.teamLeaderEmail}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        teamLeaderEmail: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team Leader Roll No
                  </label>
                  <input
                    type="text"
                    placeholder="STU002"
                    className="input-primary"
                    value={batchFormData.teamLeaderRollNo}
                    onChange={(e) =>
                      setBatchFormData({
                        ...batchFormData,
                        teamLeaderRollNo: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="dialog-footer gap-3">
                <button
                  className="btn-secondary"
                  onClick={() => setOpenBatch(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-success gap-2"
                  onClick={handleCreateBatch}
                  disabled={
                    !batchFormData.batchName ||
                    !batchFormData.projectTitle ||
                    !batchFormData.guideId ||
                    !batchFormData.teamLeaderName ||
                    !batchFormData.teamLeaderEmail ||
                    !batchFormData.teamLeaderRollNo
                  }
                >
                  <UserPlus className="w-4 h-4" />
                  Create Batch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {openSettings && (
          <div
            className="modal modal-open"
            onClick={() => setOpenSettings(false)}
          >
            <div
              className="modal-box max-w-2xl glass-card p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-2xl flex items-center gap-3 mb-8">
                <SettingsIcon className="w-8 h-8 text-amber-600" />
                Review Period Settings (Global)
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Review Start Date
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full input-lg"
                    value={
                      settingsData.reviewStartDate
                        ? new Date(settingsData.reviewStartDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        reviewStartDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Review End Date
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full input-lg"
                    value={
                      settingsData.reviewEndDate
                        ? new Date(settingsData.reviewEndDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        reviewEndDate: e.target.value
                          ? new Date(e.target.value)
                          : null,
                      })
                    }
                  />
                  {settingsData.reviewStartDate &&
                    settingsData.reviewEndDate && (
                      <p className="text-sm text-info mt-1">
                        Range:{" "}
                        {new Date(
                          settingsData.reviewStartDate,
                        ).toLocaleDateString()}
                        →{" "}
                        {new Date(
                          settingsData.reviewEndDate,
                        ).toLocaleDateString()}
                        (
                        {Math.ceil(
                          (new Date(settingsData.reviewEndDate) -
                            new Date(settingsData.reviewStartDate)) /
                            (1000 * 60 * 60 * 24),
                        )}{" "}
                        days)
                      </p>
                    )}
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">
                      Slots Per Day (per guide)
                    </span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    className="input input-bordered w-full input-lg"
                    value={settingsData.slotsPerDay || ""}
                    onChange={(e) =>
                      setSettingsData({
                        ...settingsData,
                        slotsPerDay: parseInt(e.target.value) || 10,
                      })
                    }
                    placeholder="10"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Max 20 recommended
                  </p>
                </div>
              </div>

              <div className="modal-action mt-8">
                <button
                  className="btn btn-ghost"
                  onClick={() => setOpenSettings(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning gap-2"
                  onClick={handleUpdateSettings}
                  disabled={
                    !settingsData.reviewStartDate || !settingsData.reviewEndDate
                  }
                >
                  <Calendar className="w-5 h-5" />
                  {new Date(settingsData.reviewStartDate || 0) > new Date()
                    ? "Schedule"
                    : "Update"}{" "}
                  Range
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
