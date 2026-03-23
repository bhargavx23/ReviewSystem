import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Users2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { showToast } from '../components/Toaster';
import { guideAPI } from '../services/api';

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
      showToast("Failed to load dashboard", 'error');
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
      showToast(err.response?.data?.message || "Error approving booking", "error");
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
      showToast("Booking rejected!", "error");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || "Error rejecting booking", "error");
    } finally {
      setActionLoading(null);
    }
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="glass-card p-8 lg:p-12 rounded-3xl mb-8 shadow-2xl">
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Guide Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Review and manage student booking requests for your assigned batches
          </p>
        </div>
      </motion.div>

      {/* Assigned Batches */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
      >
        <div className="glass-card p-8 rounded-3xl">
<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <Users2 className="w-10 h-10 text-primary bg-primary/10 p-3 rounded-2xl" />
            My Assigned Batches ({batches.length})
          </h3>
          
          {batches.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-20 h-20 text-gray-400 mx-auto mb-6 opacity-50" />
              <h4 className="text-2xl font-semibold text-gray-500 dark:text-gray-400 mb-4">
                No batches assigned yet
              </h4>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                Assigned batches will appear here. Admin will assign students to your batches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {batches.map((batch) => (
                <motion.div
                  key={batch._id}
                  className="card glass-card p-6 lg:p-8 rounded-2xl hover:shadow-xl cursor-pointer border-l-4 border-primary/50 group"
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <h4 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">
                    {batch.batchName}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {batch.projectTitle}
                  </p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-md">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-sm bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-full">
                      {batch.teamLeaderName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">
                    Click to view students >
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
      >
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-10 h-10 text-amber-500 bg-amber-100/50 dark:bg-amber-900/30 p-2.5 rounded-xl" />
                Pending Requests ({pendingBookings.length})
              </h3>
              {pendingBookings.length === 0 && (
                <span className="badge badge-success text-lg px-6 py-3 font-bold">
                  All up to date! 🎉
                </span>
              )}
            </div>
          </div>

          {pendingBookings.length === 0 ? (
            <div className="p-16 text-center bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-b-3xl">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h4 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-4">
                All Requests Reviewed!
              </h4>
              <p className="text-lg text-emerald-700 dark:text-emerald-300 max-w-lg mx-auto">
                Great job keeping up with student requests. New bookings will appear here automatically.
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBookings.map((booking) => (
                    <tr key={booking._id} className="hover">
                      <td data-label="Student" className="font-semibold">
                        {booking.studentId?.name || "N/A"}
                      </td>
                      <td data-label="Batch">
                        <span className="badge badge-primary font-semibold">{booking.batchId?.batchName || "N/A"}</span>
                      </td>
                      <td data-label="Date">
                        <div className="font-mono text-lg font-bold text-primary">
                          {new Date(booking.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td data-label="Slot">
                        <div className="badge badge-lg badge-primary font-bold px-4 py-3 text-lg shadow-lg">
                          Slot {booking.slotNumber}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <motion.button
                            onClick={() => handleApprove(booking._id)}
                            disabled={actionLoading === booking._id}
                            className="btn btn-success gap-2 shadow-xl flex-1 sm:flex-none"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {actionLoading === booking._id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                            Approve
                          </motion.button>
                          <motion.button
                            onClick={() => handleReject(booking._id)}
                            disabled={actionLoading === booking._id}
                            className="btn btn-error gap-2 shadow-xl flex-1 sm:flex-none"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {actionLoading === booking._id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                            Reject
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
      </motion.section>
    </motion.div>
  );
};

export default GuideDashboard;

