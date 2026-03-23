const Booking = require("../models/Booking");
const Batch = require("../models/Batch");
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { parse } = require("json2csv");

const generateReport = async (format = "json") => {
  const bookings = await Booking.find()
    .populate(
      "batchId",
      "batchName projectTitle teamLeaderName teamLeaderEmail",
    )
    .populate("guideId", "name")
    .lean();

  const reportData = bookings.map((b) => ({
    batchName: b.batchId?.batchName,
    projectTitle: b.batchId?.projectTitle,
    teamLeader: b.batchId?.teamLeaderName,
    guide: b.guideId?.name,
    date: new Date(b.date).toLocaleDateString(),
    slotNumber: b.slotNumber,
    status: b.status,
  }));

  if (format === "excel") {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");

    worksheet.columns = [
      { header: "Batch", key: "batchName", width: 15 },
      { header: "Project", key: "projectTitle", width: 25 },
      { header: "Team Leader", key: "teamLeader", width: 15 },
      { header: "Guide", key: "guide", width: 15 },
      { header: "Date", key: "date", width: 12 },
      { header: "Slot", key: "slotNumber", width: 8 },
      { header: "Status", key: "status", width: 10 },
    ];

    reportData.forEach((row) => worksheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  } else if (format === "pdf") {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      // Return pdfData
    });

    doc.text("Review Slot Bookings Report", { align: "center" });
    doc.moveDown();
    // Add table logic...

    doc.end();
    return buffers;
  } else if (format === "csv") {
    const csv = parse(reportData);
    return csv;
  }

  return reportData;
};

module.exports = { generateReport };
