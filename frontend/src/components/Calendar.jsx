import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const BookingCalendar = ({ settings, bookings, onDateSelect }) => {
  const [calendarApi, setCalendarApi] = useState(null);

  const handleDatesSet = (arg) => {
    // Update view dates
  };

  const eventContent = (arg) => {
    const event = arg.event.extendedProps;
    return (
      <div style={{ padding: "2px 5px", fontSize: "12px" }}>
        <div>{event.slotNumber}</div>
        <div
          style={{ color: event.status === "approved" ? "green" : "orange" }}
        >
          {event.status}
        </div>
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      validRange={{
        start: settings.reviewStartDate,
        end: settings.reviewEndDate,
      }}
      events={bookings.map((b) => ({
        id: b._id,
        title: `Slot ${b.slotNumber}`,
        date: b.date,
        extendedProps: { ...b, display: "block" },
      }))}
      eventContent={eventContent}
      dateClick={onDateSelect}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek",
      }}
      height="600px"
      slotMinTime="09:00:00"
      slotMaxTime="17:00:00"
    />
  );
};

export default BookingCalendar;
