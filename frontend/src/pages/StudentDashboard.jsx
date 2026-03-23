import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  Loader2,
} from "lucide-react";
import { showToast } from "../components/Toaster";
import { studentAPI } from "../services/api";

const StudentDashboard = () => {
  const [myBatch, setMyBatch] = useState(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const myBatchRes = await studentAPI.getMyBatch();
      setMyBatch(myBatchRes.data?.batch || null);
      setMyBookings(myBatchRes.data?.bookings || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status !== 404) {
        showToast("Failed to load batch data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async () => {
    try {
      if (!selectedDate) {
        showToast("Please select a date", "error");
        return;
      }

      setActionLoading(true);
      showToast("Booking slot...", "loading");

      await studentAPI.bookSlot({
        date: selectedDate,
        slotNumber: selectedSlot,
      });

      showToast(
        "✅ Slot booked successfully! Awaiting guide approval.",
        "success",
      );
      setBookingOpen(false);
      setSelectedDate(null);
      setSelectedSlot(1);
      fetchData();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Booking failed. Try again.",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: {
        className: "badge-success",
        icon: CheckCircle,
        label: "Approved",
      },
      pending: { className: "badge-warning", icon: Clock, label: "Pending" },
      rejected: { className: "badge-error", icon: XCircle, label: "Rejected" },
    };
    return (
      badges[status] || {
        className: "badge-neutral",
        icon: Clock,
        label: status,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-blue-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Student Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Book your project review slots and track approval status in
            real-time
          </p>
        </div>
      </motion.div>

      {/* My Batch Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-8 lg:p-12 rounded-3xl shadow-2xl"
      >
        {myBatch ? (
          <>
            <div className="text-center lg:text-left mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 rounded-2xl font-bold mb-6 shadow-xl">
                <BookOpen className="w-6 h-6" />
                {myBatch.batchName}
              </div>
              <h2 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4 dark:from-white dark:to-gray-200">
                {myBatch.projectTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-lg">
                <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">
                      Guide
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {myBatch.guideId?.name || "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
              No Batch Assigned
            </h3>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
              Contact your administrator to get assigned to a project batch.
            </p>
            <motion.button
              className="btn btn-outline btn-warning btn-lg px-8 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showToast("Contact admin to assign batch", "info")}
            >
              <Users className="w-5 h-5 mr-2" />
              Contact Admin
            </motion.button>
          </div>
        )}
      </motion.section>

      {/* Book Slot CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 rounded-3xl shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
              <Calendar className="w-9 h-9 text-primary bg-primary/10 p-2 rounded-xl" />
              Book Review Slot
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Schedule your project review with your guide. Max 10 slots per
              day.
            </p>
          </div>
          <motion.button
            onClick={() => setBookingOpen(true)}
            disabled={!myBatch}
            className="btn btn-warning btn-lg px-12 shadow-xl hover:shadow-2xl gap-3 order-first lg:order-last"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Calendar className="w-6 h-6" />
            Book Now
          </motion.button>
        </div>
      </motion.div>

      {/* My Bookings Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              My Bookings ({myBookings.length})
            </h3>
            {myBookings.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400">
                No bookings yet. Book your first slot above!
              </p>
            )}
          </div>

          {myBookings.length === 0 ? (
            <div className="p-16 text-center">
              <Calendar className="w-20 h-20 text-gray-400 mx-auto mb-6 opacity-50" />
              <h4 className="text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-2">
                No bookings yet
              </h4>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Book your first review slot using the button above and track the
                approval status here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
              {myBookings.map((booking) => {
                const status = getStatusBadge(booking.status);
                const Icon = status.icon;
                return (
                  <motion.div
                    key={booking._id}
                    className="glass-card p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer group"
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`p-2 rounded-xl ${status.className.replace("badge-", "bg-")}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`badge font-bold text-sm ${status.className}`}
                      >
                        {status.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                        Slot {booking.slotNumber}
                      </h4>
                      <p className="text-lg font-mono text-primary">
                        {new Date(booking.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                      <p className="text-sm text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                        Batch: {booking.batchId?.batchName || "N/A"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* Booking Modal */}
      <motion.dialog open={bookingOpen} className="modal modal-open">
        <div className="modal-box glass-card max-w-md p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <Calendar className="w-9 h-9 text-primary bg-primary/10 p-2 rounded-xl" />
            Book Review Slot
          </h3>
          <div className="space-y-6">
            <div>
              <label className="label">
                <span className="label-text font-semibold text-lg">
                  Review Date
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered input-lg w-full text-lg"
                value={selectedDate || ""}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text font-semibold text-lg">
                  Slot Number
                </span>
              </label>
              <input
                type="number"
                placeholder="1-10"
                className="input input-bordered input-lg w-full text-lg"
                value={selectedSlot}
                onChange={(e) =>
                  setSelectedSlot(
                    Math.max(1, Math.min(10, parseInt(e.target.value) || 1)),
                  )
                }
                min="1"
                max="10"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                💡 Choose slots 1-10 based on your guide&apos;s availability
                schedule
              </p>
            </div>
          </div>
          <div className="modal-action mt-12 gap-4">
            <button
              className="btn btn-ghost btn-lg flex-1"
              onClick={() => {
                setBookingOpen(false);
                setSelectedDate(null);
                setSelectedSlot(1);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-lg flex-1 gap-3 shadow-2xl"
              onClick={handleBookSlot}
              disabled={!selectedDate || actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      </motion.dialog>
    </motion.div>
  );
};

export default StudentDashboard;
