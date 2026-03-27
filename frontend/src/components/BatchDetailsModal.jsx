import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  BookOpen,
} from "lucide-react";
import { guideAPI } from "../services/api";
import { showToast } from "./Toaster";
import { cn } from "../utils/utils";

const BatchDetailsModal = ({
  batchId,
  isOpen,
  onClose,
  initialBatch = null,
}) => {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialBatch) {
      setBatch(initialBatch);
      return;
    }
    if (batchId) {
      fetchBatchDetails();
    }
  }, [isOpen, batchId]);

  const fetchBatchDetails = async () => {
    try {
      setLoading(true);
      const response = await guideAPI.getBatch(batchId);
      setBatch(response.data);
    } catch (err) {
      showToast("Failed to load batch details", "error");
    } finally {
      setLoading(false);
    }
  };

  const StatsCard = ({ icon: Icon, label, value, color = "primary" }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "glass-card p-6 rounded-2xl text-center shadow-xl",
        color === "success" && "bg-green-50/50 border-green-200/50",
        color === "warning" && "bg-amber-50/50 border-amber-200/50",
        color === "error" && "bg-red-50/50 border-red-200/50",
      )}
    >
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-80" />
      <div className="text-3xl font-black text-slate-900 mb-1">{value}</div>
      <div className="text-base-content font-medium text-sm uppercase tracking-wide">
        {label}
      </div>
    </motion.div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 bg-base-100/80 backdrop-blur-md rounded-t-3xl border-b border-slate-200/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-base-content line-clamp-1 max-w-md">
                    {batch?.batchName || "Loading..."}
                  </h2>
                  <p className="text-base-content text-lg mt-1">
                    {batch?.projectTitle || ""}
                  </p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-xl transition-all group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6 text-slate-600 group-hover:text-slate-700" />
              </motion.button>
            </div>
          </div>

          <div className="p-8 pb-12 space-y-8">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl bg-slate-200/50 animate-pulse"
                  />
                ))}
              </div>
            ) : batch ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <StatsCard
                    icon={Users}
                    label="Total Bookings"
                    value={batch.bookingsCount?.total ?? 0}
                  />
                  <StatsCard
                    icon={CheckCircle}
                    label="Approved"
                    value={batch.bookingsCount?.approved ?? 0}
                    color="success"
                  />
                  <StatsCard
                    icon={Clock}
                    label="Pending"
                    value={batch.bookingsCount?.pending ?? 0}
                    color="warning"
                  />
                  <StatsCard
                    icon={XCircle}
                    label="Rejected"
                    value={batch.bookingsCount?.rejected ?? 0}
                    color="error"
                  />
                </div>

                <div className="glass-card p-8 rounded-3xl">
                  <h3 className="text-2xl font-black text-base-content mb-6 flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary-token" />
                    Team Information
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-base-100/50 rounded-2xl">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Users className="w-7 h-7 text-white font-bold" />
                      </div>
                      <div>
                        <p className="font-black text-xl text-slate-900">
                          Team Leader
                        </p>
                        <p className="text-2xl font-black text-slate-900">
                          {batch.teamLeaderName}
                        </p>
                        <p className="text-base-content">
                          {batch.teamLeaderEmail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="glass-card p-6 space-y-4">
                    <h4 className="font-black text-xl text-base-content">
                      Project Details
                    </h4>
                    <div className="space-y-2 text-lg">
                      <div>
                        <span className="font-semibold text-base-content">
                          Section:
                        </span>{" "}
                        {batch.section || "N/A"}
                      </div>
                      <div>
                        <span className="font-semibold text-base-content">
                          Status:
                        </span>
                        <span
                          className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${
                            batch.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {batch.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <h4 className="font-black text-xl text-slate-900 mb-4">
                      Assigned Guide
                    </h4>
                    <div className="flex items-center gap-4 p-4 bg-primary-50/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">
                          {batch.guideId?.name}
                        </p>
                        <p className="text-muted">{batch.guideId?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Users className="w-20 h-20 text-slate-400 mx-auto mb-6" />
                <h3 className="text-2xl font-black text-slate-500 mb-2">
                  No batch data
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Batch information could not be loaded.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BatchDetailsModal;
