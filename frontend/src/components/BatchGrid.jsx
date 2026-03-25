import React from "react";
import { motion } from "framer-motion";
import { Users, BookOpen } from "lucide-react";
import { cn } from "../utils/utils";

const BatchGrid = ({ batches, onBatchClick, className = "" }) => {
  const getStatusProps = (status) => {
    const statuses = {
      approved: {
        badge: "badge-success",
        border: "border-accent-500/50",
        iconBg: "from-accent-400 to-accent-500",
      },
      pending: {
        badge: "badge-warning",
        border: "border-amber-500/50",
        iconBg: "from-amber-400 to-orange-500",
      },
      rejected: {
        badge: "badge-error",
        border: "border-red-500/50",
        iconBg: "from-red-400 to-rose-500",
      },
      default: {
        badge: "badge-neutral",
        border: "border-gray-300/50",
        iconBg: "from-gray-400 to-gray-500",
      },
    };
    return statuses[status] || statuses.default;
  };

  const getStatusLabel = (status) => {
    const labels = {
      approved: "✅ Approved",
      pending: "⏳ Pending",
      rejected: "❌ Rejected",
      default: "➤ Not Booked",
    };
    return labels[status] || labels.default;
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className,
      )}
    >
      {batches.map((batch, index) => {
        const statusProps = getStatusProps(batch.status);
        return (
          <motion.div
            key={batch._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onBatchClick?.(batch)}
            className={cn(
              "glass-card p-6 lg:p-8 rounded-2xl cursor-pointer transform-hover group hover:shadow-2xl border-l-4",
              statusProps.border,
            )}
          >
            {/* Status Badge */}
            <div
              className={cn(
                "badge font-bold mb-4 px-4 py-2 shadow-md",
                statusProps.badge,
              )}
            >
              {getStatusLabel(batch.status)}
            </div>

            {/* Batch Name */}
            <h3 className="text-xl lg:text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent dark:from-white dark:to-gray-200 mb-3 line-clamp-1">
              {batch.batchName}
            </h3>

            {/* Project Title */}
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed line-clamp-2 text-sm lg:text-base">
              {batch.projectTitle}
            </p>

            {/* Team Leader */}
            {batch.teamLeaderName && (
              <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl mb-4 backdrop-blur-sm group-hover:bg-white/70 dark:group-hover:bg-slate-800/70 transition-all">
                <div
                  className={`w-12 h-12 p-2 rounded-xl flex items-center justify-center shadow-md ${statusProps.iconBg}`}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    Team Leader
                  </p>
                  <p className="font-bold text-lg">{batch.teamLeaderName}</p>
                </div>
              </div>
            )}

            {/* Action Hint */}
            <div className="flex items-center gap-2 mt-auto pt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                View Details
              </span>
            </div>
          </motion.div>
        );
      })}

      {batches.length === 0 && (
        <motion.div
          className="col-span-full text-center py-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Users className="w-20 h-20 text-gray-400 mx-auto mb-6 opacity-50" />
          <h4 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-4">
            No Batches Yet
          </h4>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Assigned batches will appear here once admin creates them.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BatchGrid;
