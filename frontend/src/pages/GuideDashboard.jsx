import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Users2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { guideAPI } from "../services/api";

const GuideDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesRes, pendingRes] = await Promise.all([
        guideAPI.getBatches(),
        guideAPI.getPending(),
      ]);
      setBatches(batchesRes.data || []);
      setPendingBookings(pendingRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      showToast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(id);
      showToast("Approving booking...", "loading");
      await guideAPI.approveBooking(id);
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

  const handleReject = async (id) => {
    if (!window.confirm("Reject this booking request?")) return;

    try {
      setActionLoading(id);
      showToast("Rejecting booking...", "loading");
      await guideAPI.rejectBooking(id);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4 p-12">
          <Loader2 className="w-16 h-16 animate-spin text-primary-600 shadow-lg" />
          <p className="text-2xl font-bold text-slate-700">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 py-12"
    >
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass-card p-12 lg:p-20 rounded-3xl shadow-2xl mb-16">
          <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-tight">
            Guide Dashboard
          </h1>
          <p className="text-2xl text-slate-600 max-w-4xl leading-relaxed opacity-90">
            Manage student review requests and assigned project batches with
            real-time updates
          </p>
        </div>
      </motion.section>

      {/* Assigned Batches */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="glass-card rounded-3xl p-12 shadow-2xl">
          <h3 className="text-4xl font-black text-slate-900 mb-12 flex items-center gap-6">
            <Users2 className="w-20 h-20 text-primary-600 bg-primary-100 p-5 rounded-3xl shadow-2xl" />
            Assigned Batches ({batches.length})
          </h3>

          {batches.length === 0 ? (
            <div className="text-center py-32">
              <Users className="w-32 h-32 text-slate-300 mx-auto mb-12 opacity-50 shadow-2xl" />
              <h4 className="text-4xl font-black text-slate-500 mb-8">
                No Batches Assigned
              </h4>
              <p className="text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed opacity-90">
                Admin will assign project batches to you. Pending bookings will
                appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
              {batches.map((batch, index) => (
                <motion.div
                  key={batch._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-modern glass-card p-10 lg:p-12 rounded-3xl hover:shadow-2xl border-l-8 border-primary-500/70 cursor-pointer group shadow-xl"
                  whileHover={{ y: -12, scale: 1.03 }}
                >
                  <div className="mb-8">
                    <h4 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 line-clamp-1">
                      {batch.batchName}
                    </h4>
                    <p className="text-xl text-slate-600 leading-relaxed line-clamp-2 mb-8">
                      {batch.projectTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 p-8 bg-white/60 dark:bg-slate-800/60 rounded-3xl shadow-inner mb-10 backdrop-blur-md group-hover:bg-white/80 transition-all">
                    <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                      <Users className="w-10 h-10 text-white shadow-lg" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-2xl mb-3">
                        Team Leader
                      </p>
                      <p className="text-3xl font-black text-slate-900">
                        {batch.teamLeaderName}
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl text-slate-500 group-hover:text-primary-600 transition-all font-semibold opacity-0 group-hover:opacity-100">
                    Manage Students →
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Pending Bookings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-12 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <h3 className="text-4xl font-black text-slate-900 flex items-center gap-6">
              <Clock className="w-20 h-20 text-amber-600 bg-amber-100 p-5 rounded-3xl shadow-2xl" />
              Pending Requests ({pendingBookings.length})
            </h3>
            {pendingBookings.length === 0 ? (
              <motion.div
                className="badge badge-success text-2xl px-12 py-6 font-black shadow-2xl inline-flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <CheckCircle className="w-8 h-8" />
                All Requests Up to Date! 🎉
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-xl w-full">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Batch</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingBookings.map((booking) => (
                      <tr key={booking._id} className="hover group">
                        <th className="font-black text-2xl text-slate-900">
                          {booking.studentId?.name || "N/A"}
                        </th>
                        <td>
                          <span className="badge badge-primary font-bold px-8 py-4 text-xl shadow-md rounded-2xl">
                            {booking.batchId?.batchName || "N/A"}
                          </span>
                        </td>
                        <td>
                          <div className="font-mono text-2xl font-black text-primary-600 shadow-md px-6 py-4 bg-primary-50 rounded-2xl inline-block">
                            {new Date(booking.date).toLocaleDateString(
                              "en-IN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="badge badge-lg badge-primary font-black px-8 py-4 text-2xl shadow-2xl rounded-3xl">
                            Slot {booking.slotNumber}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col lg:flex-row gap-4 pt-8">
                            <motion.button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="btn btn-success gap-4 text-xl py-6 px-12 shadow-2xl font-black flex-1 lg:flex-none hover:shadow-accent-500/25"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading === booking._id ? (
                                <>
                                  <Loader2 className="w-7 h-7 animate-spin" />
                                  Approving...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-7 h-7" />
                                  Approve
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              onClick={() => handleReject(booking._id)}
                              disabled={actionLoading === booking._id}
                              className="btn btn-error gap-4 text-xl py-6 px-12 shadow-2xl font-black flex-1 lg:flex-none hover:shadow-red-500/25"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading === booking._id ? (
                                <>
                                  <Loader2 className="w-7 h-7 animate-spin" />
                                  Rejecting...
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-7 h-7" />
                                  Reject
                                </>
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
};

export default GuideDashboard;
