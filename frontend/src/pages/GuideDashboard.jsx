import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  CalendarDays,
  Activity,
  Search,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { guideAPI } from "../services/api";
import BatchGrid from "../components/BatchGrid.jsx";
import BatchDetailsModal from "../components/BatchDetailsModal.jsx";
import { Skeleton } from "../components/Skeleton.jsx";

const GuideDashboard = () => {
  const [batches, setBatches] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({});
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

      const totalBatches = batchesRes.data?.length || 0;
      const totalPending = pendingRes.data?.length || 0;
      setStats({
        batches: totalBatches,
        pending: totalPending,
        approvedToday: 0,
      });
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

  const filteredBookings = pendingBookings.filter(
    (booking) =>
      booking.studentId?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      booking.batchId?.batchName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const StatsCard = ({
    icon: Icon,
    title,
    value,
    description,
    color = "slate",
  }) => (
    <motion.article
      role="region"
      aria-label={title}
      whileHover={{ y: -4 }}
      className={`glass-card p-5 rounded-2xl shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-center gap-4 mb-3">
        <div className="p-3 rounded-lg bg-white/60 shadow-sm">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <div className="text-2xl font-extrabold text-slate-900">{value}</div>
          <div className="text-xs uppercase text-slate-500 tracking-wide">
            {title}
          </div>
        </div>
      </div>
      <p className="text-sm text-slate-600">{description}</p>
    </motion.article>
  );

  const BookingRowSkeleton = () => (
    <div className="h-16 bg-slate-200/40 rounded-lg animate-pulse" />
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 rounded-3xl" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <BookingRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Guide Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage review requests and assigned batches
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <label htmlFor="search" className="sr-only">
                Search bookings
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="search"
                  type="search"
                  aria-label="Search students or batches"
                  placeholder="Search students or batches"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </header>

        <section
          aria-labelledby="stats"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatsCard
            icon={Users2}
            title="Assigned Batches"
            value={stats.batches || 0}
            description="Batches assigned to you"
          />
          <StatsCard
            icon={Clock}
            title="Pending Reviews"
            value={stats.pending || 0}
            description="Bookings awaiting approval"
          />
          <StatsCard
            icon={CheckCircle}
            title="Approved Today"
            value={stats.approvedToday || 0}
            description="Approvals in last 24hrs"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section
            aria-labelledby="batches"
            className="bg-white rounded-2xl shadow-sm p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="batches" className="text-xl font-bold">
                Assigned Batches ({batches.length})
              </h2>
            </div>
            {batches.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>No batches assigned yet. Admin assigns batches to guides.</p>
              </div>
            ) : (
              <BatchGrid
                batches={batches}
                onBatchClick={(batch) => {
                  setSelectedBatch(batch._id);
                  setShowModal(true);
                }}
                className="grid-cols-1 lg:grid-cols-2"
              />
            )}
          </section>

          <section
            aria-labelledby="pending"
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 id="pending" className="text-xl font-bold">
                Pending Requests ({filteredBookings.length})
              </h2>
              <div className="sm:hidden">
                <label htmlFor="mobile-search" className="sr-only">
                  Search
                </label>
                <input
                  id="mobile-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search"
                  className="pl-3 pr-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center p-8 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="font-semibold">
                  All caught up — no pending requests.
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left min-w-[640px]">
                  <thead className="text-slate-600 text-sm border-b border-slate-100">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Slot</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id} className="even:bg-slate-50">
                        <td className="p-3 align-top font-semibold">
                          {booking.studentId?.name || "N/A"}
                        </td>
                        <td className="p-3 align-top">
                          <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-bold">
                            {booking.batchId?.batchName || "N/A"}
                          </span>
                        </td>
                        <td className="p-3 align-top font-mono text-sm">
                          {new Date(booking.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="p-3 align-top">
                          <span className="px-3 py-2 bg-slate-100 rounded-md font-bold">
                            Slot {booking.slotNumber}
                          </span>
                        </td>
                        <td className="p-3 align-top text-center">
                          <div className="flex gap-2 justify-center">
                            <motion.button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading === booking._id}
                              aria-label={`Approve booking for ${booking.studentId?.name || "student"}`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm font-semibold disabled:opacity-60"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading === booking._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Approve</span>
                            </motion.button>
                            <motion.button
                              onClick={() => handleReject(booking._id)}
                              disabled={actionLoading === booking._id}
                              aria-label={`Reject booking for ${booking.studentId?.name || "student"}`}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm font-semibold disabled:opacity-60"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {actionLoading === booking._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">Reject</span>
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <section
          aria-labelledby="activity"
          className="bg-white rounded-2xl shadow-sm p-5"
        >
          <h3
            id="activity"
            className="text-lg font-bold mb-4 flex items-center gap-3"
          >
            <Activity className="w-5 h-5 text-indigo-600" />
            Recent Activity
          </h3>
          <div className="text-sm text-slate-500 py-8 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            Activity feed coming soon...
          </div>
        </section>

        <BatchDetailsModal
          batchId={selectedBatch}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    </main>
  );
};

export default GuideDashboard;
