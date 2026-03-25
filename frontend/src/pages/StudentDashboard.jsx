import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Users2,
  XCircle,
  Loader2,
} from "lucide-react";
import BookingCalendar from "../components/Calendar.jsx";
import { showToast } from "../components/Toaster";
import { studentAPI } from "../services/api";
import BatchGrid from "../components/BatchGrid.jsx";

const StudentDashboard = () => {
  const [myBatch, setMyBatch] = useState(null);
  const [activeBatch, setActiveBatch] = useState(null);
  const [allBatches, setAllBatches] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    remaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [hasApprovedBooking, setHasApprovedBooking] = useState(false);
  const [guideData, setGuideData] = useState({ bookings: [], settings: {} });
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedDateForSlot, setSelectedDateForSlot] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlotsCount, setBookedSlotsCount] = useState(0);
  const [selectedBatchModal, setSelectedBatchModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myBatchRes, guideRes, allBatchesRes] = await Promise.all([
        studentAPI.getMyBatch(),
        studentAPI.getGuideBookings(),
        studentAPI.getAllBatches(),
      ]);
      const batchFromApi = myBatchRes.data?.batch || null;
      const myBookingsFromApi = myBatchRes.data?.bookings || [];
      setMyBatch(batchFromApi);
      setActiveBatch(batchFromApi);
      setMyBookings(myBookingsFromApi);
      setGuideData(guideRes.data || { bookings: [], settings: {} });

      const batches = allBatchesRes.data || [];
      setAllBatches(batches);

      const approved = batches.filter((b) => b.status === "approved").length;
      const pending = batches.filter((b) => b.status === "pending").length;
      setStats({
        total: batches.length,
        approved,
        pending,
        remaining: batches.length - approved - pending,
      });

      setHasApprovedBooking(myBookingsFromApi.some((b) => b.status === "approved"));
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

    const start = guideData.settings?.reviewStartDate
      ? new Date(guideData.settings.reviewStartDate).toISOString().split("T")[0]
      : null;
    const end = guideData.settings?.reviewEndDate
      ? new Date(guideData.settings.reviewEndDate).toISOString().split("T")[0]
      : null;

    if (start && dateStr < start) {
      showToast("Selected date is before allowed review window", "error");
      return;
    }
    if (end && dateStr > end) {
      showToast("Selected date is after allowed review window", "error");
      return;
    }

    const bookedSlots = guideData.bookings
      .filter((b) => new Date(b.date).toISOString().split("T")[0] === dateStr)
      .map((b) => b.slotNumber);
    setBookedSlotsCount(bookedSlots.length);
    const allSlots = Array.from(
      { length: guideData.settings?.slotsPerDay || 10 },
      (_, i) => i + 1,
    );
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
        batchId: activeBatch?._id,
      });

      showToast(
        "✅ Slot booked successfully! Awaiting admin approval.",
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
      "guide-approved": {
        className: "badge-info",
        icon: Clock,
        label: "Guide Approved (awaiting admin)",
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
          <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
          <p className="text-xl font-bold text-slate-700">
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
      className="space-y-8"
    >
      {/* Hero Header */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="glass-card p-6 lg:p-10 rounded-2xl mb-8 shadow-xl">
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 mb-4 leading-tight">
            Student Dashboard
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
            Book your project review slots and track approval status in
            real-time. View-only access to all batches.
          </p>
        </div>
      </motion.section>

      {/* All Batches Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 lg:p-8 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
          <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-3">
            <BookOpen className="w-12 h-12 text-primary-600 bg-primary-100 p-3 rounded-2xl shadow-xl" />
            All Batches Overview ({allBatches.length})
          </h3>
          <p className="text-lg text-slate-600 opacity-90">
            View-only • Green = Approved • Yellow = Pending • Click for details
            (no booking/editing)
          </p>
        </div>
        <div className="p-6 lg:p-8">
          <BatchGrid
            batches={allBatches}
            onBatchClick={(batch) => setSelectedBatchModal(batch)}
          />
        </div>
      </motion.section>

      {/* Stats Horizontal */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="stats glass-card p-6 lg:p-8 rounded-2xl shadow-xl stats-vertical lg:stats-horizontal bg-gradient-to-r from-slate-50/50 to-primary-50/50"
      >
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-slate-700">
            Total Batches
          </div>
          <div className="stat-value text-3xl text-primary-600">
            {stats.total}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-slate-700">Approved</div>
          <div className="stat-value text-3xl text-accent-600">
            {stats.approved}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-slate-700">Pending</div>
          <div className="stat-value text-3xl text-amber-600">
            {stats.pending}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-slate-700">Remaining</div>
          <div className="stat-value text-3xl text-red-600">
            {stats.remaining}
          </div>
        </div>
      </motion.section>

      {/* My Batch Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-10 lg:p-16 rounded-3xl shadow-2xl"
      >
        {myBatch ? (
          <>
            <div className="text-center lg:text-left mb-12">
              <div className="inline-flex items-center gap-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-8 py-4 rounded-3xl font-black text-xl shadow-2xl mb-8 inline-block">
                <BookOpen className="w-8 h-8" />
                {myBatch.batchName}
              </div>
              <h2 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-slate-900 to-primary-900 bg-clip-text text-transparent mb-8 dark:from-white dark:to-slate-200">
                {myBatch.projectTitle}
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-lg">
                <div className="flex items-center gap-6 p-8 bg-white/70 dark:bg-slate-800/70 rounded-3xl shadow-xl hover:shadow-2xl transition-all">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <CheckCircle className="w-8 h-8 text-white shadow-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-xl mb-2">
                      Assigned Guide
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {myBatch.guideId?.name || "Pending Assignment"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <BookOpen className="w-28 h-28 text-slate-300 mx-auto mb-8 opacity-60" />
            <h3 className="text-4xl font-black text-slate-400 mb-6">
              No Batch Assigned
            </h3>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Contact administrator to assign you to a project batch before
              booking review slots.
            </p>
            <motion.button
              className="btn btn-outline btn-primary btn-lg px-12 shadow-xl text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => showToast("Contact admin to assign batch", "info")}
            >
              <Users className="w-6 h-6 mr-3" />
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
          <div className="p-10 lg:p-12 border-b border-slate-200/50">
            {hasApprovedBooking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-accent-500 to-accent-600 text-white p-10 rounded-3xl mb-12 shadow-2xl border-l-8 border-accent-400 mb-8"
              >
                <div className="flex items-center gap-6 mb-4">
                  <CheckCircle className="w-20 h-20 flex-shrink-0 shadow-2xl" />
                  <div>
                    <h4 className="text-4xl font-black mb-4 drop-shadow-lg">
                      Slot Approved! 🎉
                    </h4>
                    <p className="text-2xl opacity-95 leading-relaxed">
                      Your review slot is confirmed. Check bookings below.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <h3 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-8">
              <Calendar className="w-16 h-16 text-primary-600 bg-primary-100 p-4 rounded-3xl shadow-2xl" />
              Review Calendar • {myBatch.guideId?.name || "Your Guide"}
            </h3>
            <p className="text-xl text-slate-600 mb-8 opacity-90">
              {hasApprovedBooking
                ? "✅ Slot approved. One booking per student."
                : "Click dates to book slots. Colors show availability."}
            </p>
            {!hasApprovedBooking && (
              <div className="mb-6">
                <button
                  className="custom-btn-primary"
                  onClick={() => {
                    const today = new Date().toISOString().split("T")[0];
                    handleDateSelect(today);
                  }}
                >
                  Book Today
                </button>
              </div>
            )}
          </div>
          <BookingCalendar
            settings={guideData.settings}
            bookings={guideData.bookings}
            onDateSelect={hasApprovedBooking ? undefined : handleDateSelect}
            height="500px"
            className="px-6 pb-12"
          />
        </motion.section>
      )}

      {/* My Bookings */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-10 lg:p-12 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4 mb-4">
              My Bookings ({myBookings.length})
            </h3>
            {myBookings.length === 0 && (
              <p className="text-xl text-slate-600">
                Book your first slot using calendar above!
              </p>
            )}
          </div>
          {myBookings.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar className="w-28 h-28 text-slate-300 mx-auto mb-12 opacity-60" />
              <h4 className="text-4xl font-black text-slate-500 mb-6">
                No Bookings Yet
              </h4>
              <p className="text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Use calendar above to schedule your project review slot and
                track approval status here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-12">
              {myBookings.map((booking) => {
                const status = getStatusBadge(booking.status);
                const Icon = status.icon;
                return (
                  <motion.div
                    key={booking._id}
                    className="glass-card p-8 rounded-2xl hover:shadow-xl group cursor-pointer border-l-8 border-primary-500 shadow-2xl"
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200/50">
                      <div
                        className={`p-3 rounded-2xl ${status.className.replace("badge-", "bg-")}`}
                      >
                        <Icon className="w-8 h-8 shadow-lg" />
                      </div>
                      <span
                        className={`badge font-bold text-lg px-6 py-3 shadow-md ${status.className}`}
                      >
                        {status.label.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-3xl font-black text-slate-900">
                        Slot {booking.slotNumber}
                      </h4>
                      <p className="text-2xl font-mono text-primary-600">
                        {new Date(booking.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-200/50">
                      <p className="text-slate-600 text-lg group-hover:text-slate-800 transition-colors">
                        {booking.batchId?.batchName || "Batch"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {/* Batch Detail Modal */}
      {selectedBatchModal && (
        <div
          className="dialog-overlay"
          onClick={() => setSelectedBatchModal(null)}
        >
          <div
            className="dialog-content max-w-4xl p-0 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-primary-50 rounded-t-3xl">
              <h3 className="text-4xl font-black flex items-center gap-6 text-slate-900">
                <BookOpen className="w-16 h-16 text-primary-600 bg-primary-100 p-4 rounded-3xl shadow-2xl" />
                {selectedBatchModal.batchName}
              </h3>
            </div>
            <div className="p-12">
              <div className="grid md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-8">
                    Project Details
                  </h4>
                  <p className="text-3xl mb-8 font-black text-slate-800 leading-tight">
                    {selectedBatchModal.projectTitle}
                  </p>
                  <div className="space-y-6 text-lg">
                    <div className="flex items-center gap-4 p-6 bg-white/50 rounded-2xl shadow-sm">
                      <Users className="w-12 h-12 text-accent-600 bg-accent-100 p-3 rounded-xl shadow-md" />
                      <div>
                        <p className="font-bold text-slate-700 text-xl">
                          Team Leader
                        </p>
                        <p className="font-black text-2xl">
                          {selectedBatchModal.teamLeaderName}
                        </p>
                      </div>
                    </div>
                    {selectedBatchModal.guideId && (
                      <div className="flex items-center gap-4 p-6 bg-primary-50 rounded-2xl shadow-sm">
                        <Users2 className="w-12 h-12 text-primary-600 bg-primary-200 p-3 rounded-xl shadow-md" />
                        <div>
                          <p className="font-bold text-slate-700 text-xl">
                            Guide
                          </p>
                          <p className="font-black text-2xl text-primary-800">
                            {selectedBatchModal.guideId.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-8 md:pt-0 md:border-l border-slate-200">
                  <h4 className="text-2xl font-bold text-slate-900 mb-8">
                    Status
                  </h4>
                  <div
                    className={`badge font-bold px-12 py-6 text-3xl rounded-3xl shadow-2xl mb-8 ${getStatusBadge(selectedBatchModal.status).className}`}
                  >
                    {getStatusBadge(
                      selectedBatchModal.status,
                    ).label.toUpperCase()}
                  </div>
                  {selectedBatchModal.status === "not-booked" && (
                    <motion.button
                      className="btn btn-primary btn-lg w-full gap-4 text-xl shadow-2xl font-black py-8 text-white bg-primary-600"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => {
                        setSelectedBatchModal(null);
                        showToast(
                          "Use main calendar to book slots for your own batch!",
                          "info",
                        );
                      }}
                    >
                      <Calendar className="w-8 h-8" />
                      Book Slot (Your Batch Only)
                    </motion.button>
                  )}
                </div>
              </div>
              <div className="flex gap-6 pt-12 border-t border-slate-200">
                <button
                  className="btn btn-outline btn-slate flex-1 py-4 text-lg font-bold"
                  onClick={() => setSelectedBatchModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slot Booking Modal */}
      {bookingOpen && (
        <div
          className="dialog-overlay"
          onClick={() => {
            setBookingOpen(false);
            setSelectedDateForSlot("");
            setSelectedSlot(1);
            setAvailableSlots([]);
          }}
        >
          <div
            className="dialog-content max-w-2xl rounded-3xl shadow-2xl p-0 z-50 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-10 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-primary-50 rounded-t-3xl">
              <h3 className="text-4xl font-black text-slate-900 flex items-center gap-6 mb-2">
                <Calendar className="w-16 h-16 text-primary-600 bg-primary-100 p-4 rounded-3xl shadow-2xl" />
                Book Slot for
              </h3>
              <p className="text-2xl font-bold text-primary-700">
                {new Date(selectedDateForSlot).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="p-12">
              <div className="stats stats-vertical lg:stats-horizontal shadow-xl bg-slate-50/50 p-8 rounded-3xl mb-12">
                <div className="stat">
                  <div className="stat-title font-bold text-slate-700">
                    Booked Slots
                  </div>
                  <div className="stat-value text-danger">
                    {bookedSlotsCount}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title font-bold text-slate-700">
                    Available
                  </div>
                  <div className="stat-value text-success">
                    {availableSlots.length}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title font-bold text-slate-700">
                    Total
                  </div>
                  <div className="stat-value text-primary-600">
                    {guideData.settings?.slotsPerDay || 10}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-12 p-8 bg-slate-50/50 rounded-3xl">
                {availableSlots.map((slot) => (
                  <motion.button
                    key={slot}
                    className={`btn font-bold text-xl aspect-square shadow-lg hover:shadow-xl transition-all ${
                      selectedSlot === slot
                        ? "btn-primary bg-primary-600 hover:bg-primary-700 shadow-primary-500/25"
                        : "btn-outline btn-primary hover:bg-primary-50"
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {slot}
                  </motion.button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-6 pt-12 border-t-2 border-slate-200 bg-slate-50/50 p-8 rounded-b-3xl">
                <button
                  className="btn btn-outline btn-slate order-2 sm:order-1 flex-1 py-4 text-lg font-bold"
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
                  className="btn btn-primary order-1 sm:order-2 flex-1 py-4 text-lg font-bold gap-4 shadow-2xl hover:shadow-3xl text-white bg-primary-600 z-50"
                  onClick={handleBookSlot}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <span>Book Slot {selectedSlot}</span>
                      <Calendar className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;
