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
import BatchDetailsModal from "../components/BatchDetailsModal.jsx";

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
  const [hasExistingBooking, setHasExistingBooking] = useState(false);
  const [hasRejectedBooking, setHasRejectedBooking] = useState(false);
  const [guideData, setGuideData] = useState({ bookings: [], settings: {} });
  const [selectedDateForSlot, setSelectedDateForSlot] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlotsCount, setBookedSlotsCount] = useState(0);
  const [selectedBatchModal, setSelectedBatchModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Poll bookings periodically so calendar shows near real-time data
  useEffect(() => {
    let mounted = true;
    const pollInterval = 5000; // 5s

    const pollBookings = async () => {
      try {
        const guideRes = await studentAPI.getGuideBookings();
        const myBatchRes = await studentAPI.getMyBatch();
        if (!mounted) return;
        setGuideData(guideRes.data || { bookings: [], settings: {} });
        setMyBookings(myBatchRes.data?.bookings || []);

        const myBookingsFromApi = myBatchRes.data?.bookings || [];
        setHasApprovedBooking(
          myBookingsFromApi.some((b) => b.status === "approved"),
        );
        setHasExistingBooking(
          myBookingsFromApi.some((b) => b.status && b.status !== "rejected"),
        );
        setHasRejectedBooking(
          myBookingsFromApi.some((b) => b.status === "rejected"),
        );
      } catch (e) {
        // silent — keep current UI if poll fails
        // console.debug("Polling error:", e);
      }
    };

    const id = setInterval(pollBookings, pollInterval);
    // run once immediately after mount
    pollBookings();

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use allSettled so a 404 for my-batch doesn't prevent other data from loading
      const results = await Promise.allSettled([
        studentAPI.getMyBatch(),
        studentAPI.getGuideBookings(),
        studentAPI.getAllBatches(),
      ]);

      const myBatchRes =
        results[0].status === "fulfilled"
          ? results[0].value
          : { data: { batch: null, bookings: [] } };
      const guideRes =
        results[1].status === "fulfilled"
          ? results[1].value
          : { data: { bookings: [], settings: {} } };
      const allBatchesRes =
        results[2].status === "fulfilled" ? results[2].value : { data: [] };

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

      setHasApprovedBooking(
        myBookingsFromApi.some((b) => b.status === "approved"),
      );
      setHasExistingBooking(
        myBookingsFromApi.some((b) => b.status && b.status !== "rejected"),
      );
      setHasRejectedBooking(
        myBookingsFromApi.some((b) => b.status === "rejected"),
      );
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
      setSelectedDateForSlot("");
      return;
    }
    setSelectedDateForSlot(dateStr);
    setAvailableSlots(avail);
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
      setSelectedDateForSlot("");
      setSelectedSlot(1);
      setAvailableSlots([]);
      setBookedSlotsCount(0);
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

  const handleRebookClick = () => {
    setSelectedDateForSlot("");
    setSelectedSlot(1);
    setAvailableSlots([]);
    setBookedSlotsCount(0);
    showToast(
      "Your previous slot was rejected — pick a new date to rebook",
      "info",
    );
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      // ignore when running in non-browser environments
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
          <Loader2 className="w-16 h-16 animate-spin text-primary-token" />
          <p className="text-xl font-bold text-base-content">
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
          <h1 className="text-4xl lg:text-5xl font-black text-base-content mb-4 leading-tight">
            Student Dashboard
          </h1>
          <p className="text-xl text-base-content max-w-3xl leading-relaxed">
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
          <h3 className="text-3xl font-black text-base-content flex items-center gap-4 mb-3">
            <BookOpen className="w-12 h-12 text-primary-token bg-primary-100 p-3 rounded-2xl shadow-xl" />
            All Batches Overview ({allBatches.length})
          </h3>
          <p className="text-lg text-muted opacity-90">
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
          <div className="stat-title font-bold text-base-content">
            Total Batches
          </div>
          <div className="stat-value text-3xl text-primary-token">
            {stats.total}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-base-content">Approved</div>
          <div className="stat-value text-3xl text-accent-token">
            {stats.approved}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-base-content">Pending</div>
          <div className="stat-value text-3xl text-amber-600">
            {stats.pending}
          </div>
        </div>
        <div className="stat place-items-center place-items-stretch">
          <div className="stat-title font-bold text-base-content">
            Remaining
          </div>
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
              <h1 className="text-4xl lg:text-5xl font-black text-primary-token mb-8">
                {myBatch.projectTitle}
              </h1>
              <div className="grid md:grid-cols-2 gap-8 text-lg">
                <div className="flex items-center gap-6 p-8 bg-base-100/70 rounded-3xl shadow-xl hover:shadow-2xl transition-all">
                  <div className="w-20 h-20 bg-gradient-to-br from-accent-400 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <CheckCircle className="w-8 h-8 text-white shadow-lg" />
                  </div>
                  <div>
                    <p className="font-bold text-base-content text-xl mb-2">
                      Assigned Guide
                    </p>
                    <p className="text-3xl font-black text-base-content">
                      {myBatch.guideId?.name || "Pending Assignment"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <BookOpen className="w-28 h-28 text-muted mx-auto mb-8 opacity-60" />
            <h3 className="text-4xl font-black text-muted mb-6">
              No Batch Assigned
            </h3>
            <p className="text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
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

          <h3 className="text-4xl font-black text-base-content flex items-center gap-6 mb-8">
            <Calendar className="w-16 h-16 text-primary-token bg-primary-100 p-4 rounded-2xl shadow-2xl" />
            Review Calendar • {myBatch?.guideId?.name || "Your Guide"}
          </h3>
          <p className="text-xl text-muted mb-8 opacity-90">
            {hasExistingBooking
              ? "You already have a booking (pending or approved). You cannot book another slot."
              : hasRejectedBooking
                ? "Your previous booking was rejected by the guide — you may book another slot."
                : "Click dates to book slots. Colors show availability."}
          </p>
          {!hasExistingBooking && (
            <div className="mb-6">
              <button
                className="btn btn-primary opacity-70 cursor-not-allowed text-sm"
                disabled
              >
                📅 Select date from calendar to book slot
              </button>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BookingCalendar
                settings={guideData.settings}
                bookings={guideData.bookings}
                onDateSelect={hasExistingBooking ? undefined : handleDateSelect}
                height="500px"
                className="px-6 pb-12"
              />
            </div>
            {/* Desktop booking side-panel (shows on lg and up) */}
            <div className="md:col-span-1 order-3 lg:order-2 self-start lg:sticky lg:top-24 lg:col-span-1">
              <aside className="p-4 md:p-6 rounded-3xl shadow-2xl bg-base-100/80 bg-purple-100 backdrop-blur-sm border border-slate-200/50">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="text-base md:text-lg font-extrabold leading-tight">
                      {selectedDateForSlot
                        ? `Book: ${new Date(selectedDateForSlot).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}`
                        : "Pick a date on the calendar"}
                    </h4>
                    <p className="text-xs md:text-sm text-muted mt-1">
                      Select slot below and confirm booking
                    </p>
                  </div>
                  <div className="text-right hidden sm:block min-w-[80px]">
                    <p className="text-xs text-muted">Slots/day</p>
                    <div className="text-base md:text-lg font-bold text-primary-token">
                      {guideData.settings?.slotsPerDay || 10}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
                  <div className="flex flex-col items-center text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent-500/20 flex items-center justify-center mb-1 md:mb-2">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent-token" />
                    </div>
                    <div className="font-bold">Booked</div>
                    <div className="text-muted">{bookedSlotsCount}</div>
                  </div>
                  <div className="flex flex-col items-center text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-amber-500/20 flex items-center justify-center mb-1 md:mb-2">
                      <Clock className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                    </div>
                    <div className="font-bold">Available</div>
                    <div className="text-muted">{availableSlots.length}</div>
                  </div>
                  <div className="flex flex-col items-center text-xs md:text-sm">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-1 md:mb-2">
                      <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-token" />
                    </div>
                    <div className="font-bold">Total</div>
                    <div className="text-muted">
                      {guideData.settings?.slotsPerDay || 10}
                    </div>
                  </div>
                </div>

                <div className="mb-3 md:mb-5 bg-white rounded-2xl p-2 md:p-4 max-h-48 md:max-h-64 overflow-auto">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-1 md:gap-3">
                    {(() => {
                      const total =
                        parseInt(guideData.settings?.slotsPerDay, 10) || 10;
                      const dayBookings = guideData.bookings
                        .filter(
                          (b) =>
                            new Date(b.date).toISOString().split("T")[0] ===
                            selectedDateForSlot,
                        )
                        .map((b) => b.slotNumber);
                      const allSlots = Array.from(
                        { length: total },
                        (_, i) => i + 1,
                      );
                      return allSlots.map((slot) => {
                        const isBooked = dayBookings.includes(slot);
                        const selected = selectedSlot === slot && !isBooked;
                        return (
                          <button
                            key={slot}
                            className={
                              isBooked
                                ? "flex items-center justify-center py-2 px-1 md:py-3 md:px-2 text-base md:text-lg font-bold transition-transform bg-slate-200 text-slate-500 cursor-not-allowed rounded-lg"
                                : selected
                                  ? "flex items-center justify-center py-2 px-1 md:py-3 md:px-2 text-base md:text-lg font-bold transition-transform bg-white border border-primary-300 text-primary-token shadow-md rounded-lg"
                                  : "flex items-center justify-center py-2 px-1 md:py-3 md:px-2 text-base md:text-lg font-bold transition-transform bg-white border border-slate-200 text-slate-900 hover:scale-105 rounded-lg hover:bg-primary-50"
                            }
                            onClick={() => !isBooked && setSelectedSlot(slot)}
                            disabled={isBooked}
                          >
                            {slot}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:gap-3">
                  <motion.button
                    className="w-full py-2.5 md:py-3 text-sm md:text-lg rounded-lg font-black text-white bg-primary-600 hover:bg-primary-700 shadow-md disabled:opacity-60"
                    onClick={handleBookSlot}
                    disabled={!selectedDateForSlot || hasExistingBooking}
                    whileHover={
                      !selectedDateForSlot || hasExistingBooking
                        ? {}
                        : { scale: 1.02 }
                    }
                    whileTap={
                      !selectedDateForSlot || hasExistingBooking
                        ? {}
                        : { scale: 0.98 }
                    }
                  >
                    {hasExistingBooking
                      ? "Booking unavailable"
                      : `Confirm Booking ${selectedDateForSlot ? `Slot ${selectedSlot}` : ""}`}
                  </motion.button>
                  <button
                    className="w-full py-2.5 md:py-3 text-sm md:text-lg rounded-lg font-bold border border-slate-200 bg-base-100/50 hover:bg-base-100/70"
                    onClick={() => {
                      setSelectedDateForSlot("");
                      setSelectedSlot(1);
                      setAvailableSlots([]);
                      setBookedSlotsCount(0);
                    }}
                  >
                    Reset Selection
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-10 lg:p-12 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-primary-50">
            <h3 className="text-3xl font-black text-base-content flex items-center gap-4 mb-4">
              My Bookings ({myBookings.length})
            </h3>
            {myBookings.length === 0 && (
              <p className="text-xl text-base-content">
                Book your first slot using calendar above!
              </p>
            )}
          </div>
          {myBookings.length === 0 ? (
            <div className="p-20 text-center">
              <Calendar className="w-28 h-28 text-muted mx-auto mb-12 opacity-60" />
              <h4 className="text-4xl font-black text-base-content mb-6">
                No Bookings Yet
              </h4>
              <p className="text-2xl text-base-content max-w-2xl mx-auto leading-relaxed">
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
                      <h4 className="text-3xl font-black text-base-content">
                        Slot {booking.slotNumber}
                      </h4>
                      <p className="text-2xl font-mono text-base-content">
                        {new Date(booking.date).toLocaleDateString("en-IN", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-200/50">
                      <p className="text-base-content text-lg group-hover:text-base-content transition-colors">
                        {booking.batchId?.batchName || "Batch"}
                      </p>
                      {booking.status === "rejected" && (
                        <div className="mt-4">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={handleRebookClick}
                          >
                            Book New Slot
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.section>

      {selectedBatchModal && (
        <BatchDetailsModal
          batchId={selectedBatchModal._id}
          initialBatch={selectedBatchModal}
          isOpen={!!selectedBatchModal}
          onClose={() => setSelectedBatchModal(null)}
        />
      )}
    </motion.div>
  );
};

export default StudentDashboard;
