import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen } from "lucide-react";
import { cn } from "../utils/utils";

const BatchGrid = ({ batches, onBatchClick, className = "" }) => {
  const getStatusProps = (status) => {
    const statuses = {
      approved: {
        badge: "bg-green-100 text-green-800",
        border: "border-green-100",
        iconBg: "bg-gradient-to-r from-accent-400 to-accent-500",
      },
      pending: {
        badge: "bg-amber-100 text-amber-800",
        border: "border-amber-100",
        iconBg: "bg-gradient-to-r from-amber-400 to-orange-500",
      },
      rejected: {
        badge: "bg-red-100 text-red-800",
        border: "border-red-100",
        iconBg: "bg-gradient-to-r from-red-400 to-rose-500",
      },
      default: {
        badge: "bg-slate-100 text-slate-800",
        border: "border-slate-100",
        iconBg: "bg-gradient-to-r from-gray-400 to-gray-500",
      },
    };
    return statuses[status] || statuses.default;
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      default: "Not Booked",
    };
    return labels[status] || labels.default;
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
        className,
      )}
    >
      {batches.map((batch, index) => {
        const statusProps = getStatusProps(batch.status);
        const studentCount = batch.students?.length ?? batch.studentCount ?? 0;

        return (
          <motion.article
            key={batch._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={cn(
              "bg-white rounded-xl shadow-sm p-4 flex flex-col h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300",
              statusProps.border,
            )}
            onClick={() => onBatchClick?.(batch)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onBatchClick?.(batch)}
            aria-label={`Open batch ${batch.batchName}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {batch.batchName}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">
                  {batch.projectTitle}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <div
                  className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold",
                    statusProps.badge,
                  )}
                >
                  {getStatusLabel(batch.status)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-lg text-white font-bold shadow-sm",
                  statusProps.iconBg,
                )}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Team Leader</div>
                <div className="font-semibold text-sm">
                  {batch.teamLeaderName || "TBA"}
                </div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-xs text-slate-500">Students</div>
                <div className="font-semibold text-sm">{studentCount}</div>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onBatchClick?.(batch);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
                aria-label={`View details for ${batch.batchName}`}
              >
                <BookOpen className="w-4 h-4" />
                View details
              </button>
            </div>
          </motion.article>
        );
      })}

      {batches.length === 0 && (
        <motion.div
          className="col-span-full text-center py-16"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Users className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h4 className="text-2xl font-bold text-slate-600 mb-4">
            No Batches Yet
          </h4>
          <p className="text-base text-slate-500 max-w-md mx-auto">
            Assigned batches will appear here once admin creates them.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BatchGrid;
