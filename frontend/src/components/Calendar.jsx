import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar as CalendarIcon, CheckCircle, Clock, X } from "lucide-react";
import { motion } from "framer-motion";

const BookingCalendar = ({
  settings,
  bookings = [],
  onDateSelect,
  height = "auto",
  className = "",
}) => {
  const getEventColor = (status) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getEventIcon = (status) => {
    switch (status) {
      case "approved":
        return CheckCircle;
      case "pending":
        return Clock;
      case "rejected":
        return X;
      default:
        return CalendarIcon;
    }
  };

  const renderEventContent = (eventInfo) => {
    const { slotNumber, status } = eventInfo.event.extendedProps;
    const Icon = getEventIcon(status);
    const dayStr = eventInfo.event.startStr.split("T")[0];
    const dayBookings = bookings.filter(
      (b) => new Date(b.date).toISOString().split("T")[0] === dayStr,
    );
    const bookedCount = dayBookings.length;
    const totalSlots = settings?.slotsPerDay || 10;

    return (
      <div
        role="button"
        tabIndex={0}
        className="flex flex-col gap-1.5 p-1.5 text-sm font-semibold min-w-[75px] h-[50px] justify-center items-center"
      >
        <div className="flex items-center gap-1.5">
          <Icon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: getEventColor(status) }}
          />
          <span className="font-bold text-sm">{slotNumber}</span>
        </div>
        <div className="text-xs opacity-90 font-mono tracking-wide">
          {bookedCount}/{totalSlots}
        </div>
      </div>
    );
  };

  const handleDateClick = (arg) => {
    onDateSelect?.(arg.dateStr);
  };

  const handleEventClick = (arg) => {
    // Allow clicking on an event (slot box) to open booking modal for that date
    onDateSelect?.(arg.event.startStr);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <div className="glass-card rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <CalendarIcon className="w-8 h-8 text-primary" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Review Calendar
          </h3>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          validRange={{
            start: settings?.reviewStartDate,
            end: settings?.reviewEndDate,
          }}
          events={bookings.map((b) => ({
            id: b._id,
            title: `Slot ${b.slotNumber}`,
            date: b.date,
            extendedProps: { ...b },
            backgroundColor: getEventColor(b.status),
            borderColor: getEventColor(b.status),
            textColor: "white",
            display: "block",
          }))}
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          height={height}
          slotMinTime="09:00:00"
          slotMaxTime="17:00:00"
          dayMaxEvents={2}
          moreLinkClick="popover"
          eventDisplay="block"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          dayHeaderFormat={{
            weekday: "short",
            month: "numeric",
            day: "numeric",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
          }}
          firstDay={1} // Monday start
          weekends={true}
          nowIndicator={true}
          eventDidMount={(info) => {
            info.el.classList.add(
              "!rounded-2xl",
              "shadow-lg",
              "backdrop-blur-md",
              "border-2",
              "border-white/20",
              "hover:scale-[1.05]",
              "transition-all",
              "cursor-pointer",
            );
          }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t-2 border-gray-200/60 dark:border-gray-700/60 rounded-t-2xl bg-gradient-to-r from-gray-50/70 to-primary-50/70 dark:from-slate-900/50 dark:to-slate-800/50 p-6">
        <div className="flex items-center gap-3 p-3 bg-accent-500/10 rounded-2xl border border-accent-200/50 dark:border-accent-400/50">
          <div className="w-5 h-5 bg-accent-500 rounded-lg shadow-md" />
          <span className="text-sm font-bold text-accent-900 dark:text-accent-300">
            Approved
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-2xl border border-amber-200/50 dark:border-amber-400/50">
          <div className="w-5 h-5 bg-amber-500 rounded-lg shadow-md" />
          <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
            Pending
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-2xl border border-red-200/50 dark:border-red-400/50">
          <div className="w-5 h-5 bg-red-500 rounded-lg shadow-md" />
          <span className="text-sm font-bold text-red-900 dark:text-red-300">
            Rejected
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-2xl border border-primary/50 cursor-pointer hover:bg-primary/20 transition-all">
          <div className="w-5 h-5 bg-primary rounded-lg shadow-md" />
          <span className="text-sm font-bold text-primary hover:text-primary/90">
            Available
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCalendar;
