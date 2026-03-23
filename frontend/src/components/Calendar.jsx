import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar as CalendarIcon, CheckCircle2, Clock, X } from "lucide-react";
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
        return CheckCircle2;
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

    return (
      <div className="flex items-center gap-1 p-1 text-xs font-medium min-w-[80px]">
        <Icon
          className="w-3 h-3 flex-shrink-0"
          style={{ color: getEventColor(status) }}
        />
        <span>{slotNumber}</span>
      </div>
    );
  };

  const handleDateClick = (arg) => {
    onDateSelect?.(arg.dateStr);
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
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          height={height}
          slotMinTime="09:00:00"
          slotMaxTime="17:00:00"
          dayMaxEvents={3}
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
              "!rounded-xl",
              "shadow-md",
              "backdrop-blur-sm",
            );
          }}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded" />
          <span className="text-sm font-medium">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded" />
          <span className="text-sm font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span className="text-sm font-medium">Rejected</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 bg-gray-500 rounded cursor-pointer"
            onClick={handleDateClick}
          />
          <span className="text-sm font-medium">Click to Book</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingCalendar;
