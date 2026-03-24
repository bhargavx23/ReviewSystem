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
import BookingCalendar from "../components/Calendar.jsx";
import { showToast } from "../components/Toaster";
import { studentAPI } from "../services/api";

const StudentDashboard = () => {
  const [myBatch, setMyBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [guideData, setGuideData] = useState({ bookings: [], settings: {} });
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDateForSlot, setSelectedDateForSlot] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myBatchRes, guideRes] = await Promise.all([
        studentAPI.getMyBatch(),
        studentAPI.getGuideBookings(),
      ]);
      setMyBatch(myBatchRes.data?.batch || null);
      setMyBookings(myBatchRes.data?.bookings || []);
      setGuideData(guideRes.data || { bookings: [], settings: {} });
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status !== 404) {
        showToast("Failed to load batch data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (dateStr) => {
    const todayStr = new Date().toISOString().split("T")[0];
    if (dateStr < todayStr) {
      showToast("Cannot book past dates", "error");
      return;
    }
    const bookedSlots = guideData.bookings
      .filter((b) => new Date(b.date).toISOString().split("T")[0] === dateStr)
      .map((b) => b.slotNumber);
    const allSlots = Array.from({ length: 10 }, (_, i) => i + 1);
    const avail = allSlots.filter((s) => !bookedSlots.includes(s));
    if (avail.length === 0) {
      showToast("All slots are booked for this date", "error");
      return;
    }
    setSelectedDateForSlot(dateStr);
    setAvailableSlots(avail);
    setBookingOpen(true);
  };

  const handleBookSlot = async () => {
    try {
      if (!selectedDateForSlot) {
        showToast("Please select a date", "error");
        return;
      }

      setActionLoading(true);
      showToast("Booking slot...", "loading");

      await studentAPI.bookSlot({
        date: selectedDateForSlot,
        slotNumber: selectedSlot,
      });

      showToast(
        "✅ Slot booked successfully! Awaiting guide approval.",
        "success",
      );
      setBookingOpen(false);
      setSelectedDateForSlot("");
      setSelectedSlot(1);
      setAvailableSlots([]);
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

      {/* Review Calendar */}
      {myBatch && guideData.settings.reviewStartDate && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-4 mb-4">
              <Calendar className="w-12 h-12 text-primary bg-primary/10 p-3 rounded-2xl" />
              Review Calendar - {myBatch.guideId?.name || "Your Guide"}
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Click any available date to book a slot. Booked slots shown in
              color.
            </p>
          </div>
          <BookingCalendar
            settings={guideData.settings}
            bookings={guideData.bookings}
            onDateSelect={handleDateSelect}
            height="400px"
          />
        </motion.section>
      )}

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
                No bookings yet. Use the calendar above to book your review
                slot!
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
                      <p className="text-lg font-mono text-primary truncate">
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

      {/* Slot Selection Modal */}
      <motion.dialog open={bookingOpen} className="modal modal-open">
        <div className="modal-box glass-card max-w-lg p-8 rounded-3xl max-h-[90vh] overflow-y-auto">
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <Calendar className="w-10 h-10 text-primary bg-primary/10 p-2.5 rounded-xl" />
            Select Slot for{" "}
            {new Date(selectedDateForSlot).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Available slots:{" "}
            <span className="font-bold text-primary">
              {availableSlots.length}
            </span>{" "}
            / 10
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-8 p-4 bg-gray-50 dark:bg-slate-800/30 rounded-2xl">
            {availableSlots.map((slot) => (
              <motion.button
                key={slot}
                className={`btn md:btn-lg font-bold md:text-xl text-lg aspect-square shadow-lg ${
                  selectedSlot === slot ? "btn-primary" : "btn-outline btn-info"
                }`}
                onClick={() => setSelectedSlot(slot)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {slot}
              </motion.button>
            ))}
          </div>
          <div className="flex gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <button
              className="btn btn-ghost btn-lg flex-1"
              onClick={() => {
                setBookingOpen(false);
                setSelectedDateForSlot("");
                setSelectedSlot(1);
                setAvailableSlots([]);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-lg flex-1 gap-3 shadow-2xl"
              onClick={handleBookSlot}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Booking...
                </>
              ) : (
                `Book Slot ${selectedSlot}`
              )}
            </button>
          </div>
        </div>
      </motion.dialog>
    </motion.div>
  );
};

export default StudentDashboard;
