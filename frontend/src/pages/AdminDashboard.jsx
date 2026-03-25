import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Users2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  BookOpen,
  Edit,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { cn } from "../utils/utils";
import {
  Skeleton,
  StatSkeleton,
  TableRowSkeleton,
} from "../components/Skeleton";

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
  const [tabView, setTabView] = useState("batches");
  const [editingBatch, setEditingBatch] = useState(null);
  const [settingsData, setSettingsData] = useState({});
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, batchesRes, guidesRes] = await Promise.all([
        adminAPI.getBookings().catch(() => ({ data: [] })),
        adminAPI.getBatches().catch(() => ({ data: [] })),
        adminAPI.getGuides().catch(() => ({ data: [] })),
      ]);
      setBookings(bookingsRes.data || []);
      setBatches(batchesRes.data || []);
      setGuides(guidesRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Some data failed to load (check console)", "warning");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettingsData(res.data || {});
    } catch (err) {
      console.error("Settings fetch error:", err);
      // Set defaults
      setSettingsData({
        reviewStartDate: new Date(Date.now() + 86400000)
          .toISOString()
          .split("T")[0],
        reviewEndDate: new Date(Date.now() + 7 * 86400000)
          .toISOString()
          .split("T")[0],
        slotsPerDay: 10,
      });
      showToast("Using default settings", "warning");
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

      if (editingBatch) {
        await adminAPI.updateBatch(editingBatch._id, batchFormData);
        setEditingBatch(null);
        showToast("Batch updated successfully!", "success");
      } else {
        await adminAPI.createBatch(batchFormData);
        showToast("Batch created successfully!", "success");
      }
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
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error creating batch", "error");
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchFormData({
      batchName: batch.batchName || "",
      projectTitle: batch.projectTitle || "",
      section: batch.section || "",
      guideId: batch.guideId?._id || "",
      teamLeaderName: batch.teamLeaderName || "",
      teamLeaderEmail: batch.teamLeaderEmail || "",
      teamLeaderRollNo: batch.teamLeaderRollNo || "",
    });
    setOpenBatch(true);
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm("Delete this batch and its bookings?")) return;
    try {
      await adminAPI.deleteBatch(id);
      showToast("Batch deleted", "success");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error deleting batch", "error");
    }
  };

  const downloadBatchesCSV = () => {
    // Use structured exporter if available
    try {
      const exporters = require("../utils/exporters");
      const rows = exporters.structuredBatchRows(batches, bookings);
      const headers = Object.keys(rows[0] || {});
      exporters.exportCSV("batches_report_structured", headers, rows);
    } catch (e) {
      console.error(e);
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
      showToast("Booking rejected!", "success");
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
      color: "indigo",
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
      <div className="min-h-screen min-w-full justify-center items-center bg-gradient-to-br from-slate-50 via-primary-50  self-center flex  to-slate-50 py-12">
        <div className=" max-w-full px-4 lg:px-8 space-y-16">
          {/* Hero Header Skeleton */}
          <div className="text-center mb-16">
            <Skeleton className="h-20 w-96 mx-auto mb-6 rounded-full" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>

          {/* Action Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl p-8">
              <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl p-8">
              <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl p-8">
              <Skeleton className="w-16 h-16 rounded-2xl mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl overflow-hidden">
            <div className="p-8 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
              <Skeleton className="h-12 w-64 rounded-xl" />
            </div>
            <div className="p-8 space-y-4">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredBookings = bookings.filter(
    (b) => !roleFilter || b.status === roleFilter,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-slate-50 py-12 overflow-x-hidden">
      <div className="w-full px-4 lg:px-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 fade-in-up"
        >
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Complete control over users, batches, and review slot bookings with
            real-time analytics
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              indigo: "from-primary-600 to-primary-700",
              emerald: "from-accent-500 to-accent-600",
              amber: "from-amber-500 to-amber-600",
              red: "from-red-500 to-red-600",
            };
            return (
              <motion.div
                key={stat.label}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl p-8 group hover:shadow-2xl transition-all"
                whileHover={{ y: -8 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[stat.color]} shadow-lg group-hover:shadow-xl transition-all`}
                  >
                    <Icon className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                </div>
                <p className="text-slate-600 font-semibold text-lg mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-slate-900">
                  {stat.value}
                </p>
              </motion.div>
            );
          })}
        </motion.section>

        {/* Action Cards */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16"
        >
          <div className="card-modern p-8 rounded-3xl group hover:shadow-primary-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Create User
                </h3>
                <p className="text-slate-600 text-lg">
                  Add students, guides, admins
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpenUser(true)}
              className="custom-btn-primary w-full shadow-xl hover:shadow-2xl flex justify-center items-center"
            >
              <UserPlus className="w-5 h-5" /> Add User
            </button>
          </div>

          <div className="card-modern p-8 rounded-3xl group hover:shadow-accent-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Create Batch
                </h3>
                <p className="text-slate-600 text-lg">Manage project groups</p>
              </div>
            </div>
            <button
              onClick={() => setOpenBatch(true)}
              className="custom-btn-success w-full shadow-xl hover:shadow-2xl flex justify-center items-center"
            >
              <BookOpen className="w-5 h-5" /> New Batch
            </button>
          </div>

          <div className="card-modern p-8 rounded-3xl group hover:shadow-amber-500/20">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                <SettingsIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Review Settings
                </h3>
                <p className="text-slate-600 text-lg">
                  {settingsData.reviewStartDate
                    ? `${new Date(settingsData.reviewStartDate).toLocaleDateString()} - ${new Date(settingsData.reviewEndDate).toLocaleDateString()}`
                    : "Set date range"}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetchSettings();
                setOpenSettings(true);
              }}
              className="custom-btn-warning w-full shadow-xl hover:shadow-2xl flex justify-center items-center p-3 "
            >
              <SettingsIcon className="w-5 h-5" /> Settings
            </button>
          </div>
        </motion.section>

        {/* Batches List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl p-8 mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <BookOpen className="w-12 h-12 text-primary-600 bg-primary-100 p-4 rounded-2xl shadow-lg" />
                <div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {tabView === "batches"
                      ? `Batches (${batches.length})`
                      : `Guides (${guides.length})`}
                  </h3>
                  <div className="mt-2">
                    <button
                      onClick={() => setTabView("batches")}
                      className={cn(
                        "px-4 py-2 rounded-l-xl border border-slate-200",
                        tabView === "batches"
                          ? "bg-primary-50 font-bold"
                          : "bg-white",
                      )}
                    >
                      Batches
                    </button>
                    <button
                      onClick={() => setTabView("guides")}
                      className={cn(
                        "px-4 py-2 rounded-r-xl border border-slate-200 ml-1",
                        tabView === "guides"
                          ? "bg-primary-50 font-bold"
                          : "bg-white",
                      )}
                    >
                      Guides
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ">
                {tabView === "batches" && (
                  <>
                    <button
                      onClick={() => {
                        setEditingBatch(null);
                        setBatchFormData({
                          batchName: "",
                          projectTitle: "",
                          section: "",
                          guideId: "",
                          teamLeaderName: "",
                          teamLeaderEmail: "",
                          teamLeaderRollNo: "",
                        });
                        setOpenBatch(true);
                      }}
                      className="custom-btn-success"
                    >
                      New Batch
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const rows =
                            require("../utils/exporters").structuredBatchRows(
                              batches,
                              bookings,
                            );
                          const headers = Object.keys(rows[0] || {});
                          require("../utils/exporters").exportCSV(
                            "batches_report_structured",
                            headers,
                            rows,
                          );
                        }}
                        className="btn btn-outline"
                      >
                        Export CSV
                      </button>
                      <button
                        onClick={() => {
                          const exporters = require("../utils/exporters");
                          const rows = exporters.structuredBatchRows(
                            batches,
                            bookings,
                          );
                          const headers = Object.keys(rows[0] || {});
                          exporters.exportPDF(
                            "batches_report_structured",
                            "Batches Report",
                            headers,
                            rows,
                          );
                        }}
                        className="btn btn-outline"
                      >
                        Export PDF
                      </button>
                      <button
                        onClick={() => {
                          const exporters = require("../utils/exporters");
                          const rows = exporters.structuredBatchRows(
                            batches,
                            bookings,
                          );
                          const headers = Object.keys(rows[0] || {});
                          exporters.exportDoc(
                            "batches_report_structured",
                            "Batches Report",
                            headers,
                            rows,
                          );
                        }}
                        className="btn btn-outline"
                      >
                        Export DOC
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8  ">
              {tabView === "batches"
                ? batches.map((batch) => (
                    <motion.div
                      key={batch._id}
                      className="bg-white border border-slate-100 p-5 flex flex-col items-center shadow-lg rounded-2xl hover:shadow-xl transition-all"
                      whileHover={{ y: -4 }}
                    >
                      <h4 className="text-2xl font-bold text-slate-900 mb-4">
                        {batch.batchName}{" "}
                        {batch.section ? `(${batch.section})` : ""}
                      </h4>
                      <p className="text-slate-600 mb-4 text-lg">
                        {batch.projectTitle}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-slate-500" />
                          <span className="font-semibold text-slate-800">
                            {batch.teamLeaderName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 text-slate-500">📧</span>
                          <span>{batch.teamLeaderEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 text-slate-500">🆔</span>
                          <span className="font-mono">
                            {batch.teamLeaderRollNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-4 mt-6 border-t border-slate-200">
                          <Users2 className="w-5 h-5 text-primary-600" />
                          <span className="font-semibold text-primary-700">
                            {batch.guideId?.name || "No Guide"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleEditBatch(batch)}
                          className="btn btn-outline px-4 py-2 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch._id)}
                          className="btn btn-danger px-4 py-2 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </motion.div>
                  ))
                : guides.map((g) => (
                    <div
                      key={g._id}
                      className="bg-white border border-slate-100 shadow-lg rounded-2xl p-6"
                    >
                      <h4 className="text-xl font-bold">{g.name}</h4>
                      <p className="text-sm text-slate-600">{g.email}</p>
                      <p className="text-sm text-slate-500">
                        Guides are displayed read-only here.
                      </p>
                    </div>
                  ))}
            </div>
          </div>
        </motion.section>

        {/* Bookings Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-3xl overflow-hidden"
        >
          <div className="p-8 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4">
                <Calendar className="w-12 h-12 text-primary-600 bg-primary-100 p-3 rounded-2xl shadow-lg" />{" "}
                All Bookings ({filteredBookings.length})
              </h3>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select-primary max-w-xs bg-white border-slate-300 shadow-md text-slate-700"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar className="w-24 h-24 text-slate-300 mx-auto mb-8 opacity-50" />
              <h4 className="text-3xl font-bold text-slate-500 mb-4">
                No bookings match filter
              </h4>
              <p className="text-xl text-slate-500 max-w-lg mx-auto">
                Adjust filters or create some test bookings to see the magic ✨
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/50">
              {filteredBookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6 hover:shadow-xl transition-all border-b last:border-b-0"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-6">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Student
                      </label>
                      <p className="font-bold text-xl text-slate-900">
                        {booking.studentId?.name || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Batch
                      </label>
                      <span className="inline-block badge-primary font-bold px-6 py-3 rounded-2xl shadow-lg">
                        {booking.batchId?.batchName || "N/A"}
                      </span>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                        Date & Slot
                      </label>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-2xl font-black text-primary-600 bg-primary-50 px-4 py-2 rounded-2xl shadow-md">
                          {new Date(booking.date).toLocaleDateString()}
                        </span>
                        <span className="badge badge-info text-xl font-bold px-6 py-3 shadow-lg">
                          Slot {booking.slotNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 pt-6">
                    <div className="flex-1 flex items-center gap-3">
                      {(() => {
                        const statusConfig = {
                          pending: {
                            className: "badge-warning",
                            label: "Pending Review",
                          },
                          approved: {
                            className: "badge-success",
                            label: "✅ Approved",
                          },
                          rejected: {
                            className: "badge-danger",
                            label: "❌ Rejected",
                          },
                        };
                        const status = statusConfig[booking.status] || {
                          className: "badge-neutral",
                          label: booking.status,
                        };
                        return (
                          <span
                            className={`badge ${status.className} px-6 py-3 font-bold text-lg shadow-xl flex-shrink-0`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-1 sm:pt-0">
                      {booking.status === "pending" && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleApproveBooking(booking._id)}
                            className="btn-success px-8 py-4 text-lg font-black shadow-2xl border-2 border-accent-200 hover:border-accent-300 flex items-center gap-3 flex-1 sm:flex-none"
                            disabled={actionLoading === booking._id}
                          >
                            {actionLoading === booking._id ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <CheckCircle className="w-6 h-6" />
                            )}{" "}
                            Approve
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRejectBooking(booking._id)}
                            className="btn-danger px-8 py-4 text-lg font-black shadow-2xl border border-red-200/50 hover:border-red-300 flex items-center gap-3 flex-1 sm:flex-none"
                            disabled={actionLoading === booking._id}
                          >
                            {actionLoading === booking._id ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                              <XCircle className="w-6 h-6" />
                            )}{" "}
                            Reject
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteBooking(booking._id)}
                        className="btn btn-outline btn-danger px-8 py-4 text-lg font-black gap-3 shadow-xl flex items-center justify-center h-full flex-1 sm:flex-none min-h-[56px]"
                      >
                        <Trash2 className="w-6 h-6" /> Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Top-level modals (rendered outside animated sections to preserve fixed positioning) */}
        {/* Create User Modal */}
        {openUser && (
          <div className="dialog-overlay" onClick={() => setOpenUser(false)}>
            <div
              className="dialog-content relative w-full sm:max-w-2xl sm:max-h-[90vh] sm:rounded-3xl p-0 bg-white sm:shadow-2xl sm:mx-auto sm:overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      Create New User
                    </h2>
                    <p className="text-slate-600 mt-1">
                      Add students, guides, or admins to the system
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      className="input-primary w-full"
                      value={userFormData.name}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Email *
                    </label>
                    <input
                      type="email"
                      placeholder="user@college.edu"
                      className="input-primary w-full"
                      value={userFormData.email}
                      onChange={(e) =>
                        setUserFormData({
                          ...userFormData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Roll Number *
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
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Role *
                  </label>
                  <select
                    className="select-primary w-full"
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
              <div className="p-8 border-t border-slate-200 bg-slate-50/50 flex gap-4 justify-end">
                <button
                  className="btn-secondary px-8 py-3 font-bold"
                  onClick={() => setOpenUser(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary px-8 py-3 font-bold shadow-xl"
                  onClick={handleCreateUser}
                  disabled={
                    !userFormData.name ||
                    !userFormData.email ||
                    !userFormData.rollNo
                  }
                >
                  <UserPlus className="w-5 h-5" /> Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Batch Modal */}
        {openBatch && (
          <div
            className="dialog-overlay"
            onClick={() => {
              setOpenBatch(false);
              setEditingBatch(null);
            }}
          >
            <div
              className="dialog-content relative w-full sm:max-w-4xl sm:max-h-[90vh] sm:rounded-3xl p-0 bg-white sm:shadow-2xl sm:mx-auto sm:overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {editingBatch ? "Update Batch" : "Create New Batch"}
                    </h2>
                    <p className="text-slate-600 mt-1">
                      Add project batch with team details
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Batch A"
                      className="input-primary w-full"
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
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Section
                    </label>
                    <input
                      type="text"
                      placeholder="Section 1"
                      className="input-primary w-full"
                      value={batchFormData.section}
                      onChange={(e) =>
                        setBatchFormData({
                          ...batchFormData,
                          section: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    placeholder="MERN Review System"
                    className="input-primary w-full"
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
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Assign Guide *
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
                    <option value="">Select Guide</option>
                    {guides.map((guide) => (
                      <option key={guide._id} value={guide._id}>
                        {guide.name} ({guide.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Team Leader Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="input-primary w-full"
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
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Team Leader Email *
                    </label>
                    <input
                      type="email"
                      placeholder="leader@college.edu"
                      className="input-primary w-full"
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
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Team Leader Roll No *
                    </label>
                    <input
                      type="text"
                      placeholder="STU002"
                      className="input-primary w-full"
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
              </div>
              <div className="p-8 border-t border-slate-200 bg-slate-50/50 flex gap-4 justify-end">
                <button
                  className="btn-secondary px-8 py-3 font-bold"
                  onClick={() => {
                    setOpenBatch(false);
                    setEditingBatch(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-success px-8 py-3 font-bold shadow-xl"
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
                  <BookOpen className="w-5 h-5" />{" "}
                  {editingBatch ? "Update Batch" : "Create Batch"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal (uses same overlay/content pattern for consistent centering) */}
        {openSettings && (
          <div
            className="dialog-overlay"
            onClick={() => setOpenSettings(false)}
          >
            <div
              className="dialog-content relative w-full sm:max-w-3xl sm:max-h-[90vh] sm:rounded-3xl p-0 bg-white sm:shadow-2xl sm:mx-auto overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-primary-50">
                <h3 className="text-3xl font-black flex items-center gap-4 text-slate-900">
                  <SettingsIcon className="w-12 h-12 text-amber-600 bg-amber-100 p-3 rounded-2xl shadow-lg" />
                  Global Review Settings
                </h3>
                <p className="text-slate-600 mt-2 text-lg">
                  Controls availability for ALL guides
                </p>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <label className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 sm:w-36">
                      Start Date *
                    </span>
                    <input
                      type="date"
                      className="input-primary flex-1 w-full sm:w-auto focus:ring-primary-500"
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
                  </label>
                  {settingsData.reviewStartDate &&
                    settingsData.reviewEndDate && (
                      <p className="text-sm text-primary-600 font-semibold sm:ml-36 ml-0">
                        Preview:{" "}
                        {new Date(
                          settingsData.reviewStartDate,
                        ).toLocaleDateString()}{" "}
                        →{" "}
                        {new Date(
                          settingsData.reviewEndDate,
                        ).toLocaleDateString()}
                      </p>
                    )}
                </div>

                <div className="space-y-4">
                  <label className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 sm:w-36">
                      End Date *
                    </span>
                    <input
                      type="date"
                      className="input-primary flex-1 w-full sm:w-auto focus:ring-primary-500"
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
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-sm font-bold text-slate-700 sm:w-36">
                      Slots per Day
                    </span>
                    <input
                      type="number"
                      min="5"
                      max="24"
                      className="input-primary flex-1 w-full sm:w-32 focus:ring-primary-500"
                      value={settingsData.slotsPerDay || ""}
                      onChange={(e) =>
                        setSettingsData({
                          ...settingsData,
                          slotsPerDay: parseInt(e.target.value) || 10,
                        })
                      }
                      placeholder="10"
                    />
                    <span className="text-sm text-slate-500">(per guide)</span>
                  </label>
                  <p className="sm:ml-36 ml-0 text-sm text-slate-600">
                    Recommended: 8-12 slots. Max 24 for full day.
                  </p>
                </div>
              </div>
              <div className="p-8 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  className="btn-secondary px-8 py-3 font-bold order-2 sm:order-1 flex-1 sm:flex-none"
                  onClick={() => setOpenSettings(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary px-10 py-3 font-bold shadow-xl order-1 sm:order-2 flex-1 sm:flex-none gap-2"
                  onClick={handleUpdateSettings}
                  disabled={
                    !settingsData.reviewStartDate || !settingsData.reviewEndDate
                  }
                >
                  <Calendar className="w-5 h-5" />
                  {new Date(settingsData.reviewStartDate || 0) > new Date()
                    ? "Schedule Review Period"
                    : "Update Settings"}
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
