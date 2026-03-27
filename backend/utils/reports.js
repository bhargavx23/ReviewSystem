const Booking = require("../models/Booking");
const Batch = require("../models/Batch");
const excelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { parse } = require("json2csv");

const generateReport = async (format = "json", filter = {}) => {
  const bookings = await Booking.find(filter)
    .populate(
      "batchId",
      "batchName projectTitle teamLeaderName teamLeaderEmail section",
    )
    .populate("guideId", "name")
    .lean();

  const reportData = bookings.map((b) => ({
    "Batch Number": b.batchId?.batchName,
    Section: b.batchId?.section || "",
    "Project Title": b.batchId?.projectTitle,
    Leader: b.batchId?.teamLeaderName,
    Guide: b.guideId?.name,
    Date: new Date(b.date).toLocaleDateString(),
    Slot: b.slotNumber,
    Status: b.status,
  }));

  if (format === "excel") {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Bookings");

    worksheet.columns = [
      { header: "Batch Number", key: "Batch Number", width: 15 },
      { header: "Section", key: "Section", width: 10 },
      { header: "Project Title", key: "Project Title", width: 25 },
      { header: "Leader", key: "Leader", width: 15 },
      { header: "Guide", key: "Guide", width: 15 },
      { header: "Date", key: "Date", width: 12 },
      { header: "Slot", key: "Slot", width: 8 },
      { header: "Status", key: "Status", width: 12 },
    ];

    reportData.forEach((row) => worksheet.addRow(row));

    return workbook.xlsx.writeBuffer();
  } else if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    return new Promise((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      doc.fontSize(18).text("Review Slot Bookings Report", { align: "center" });
      doc.moveDown();

      // Header
      doc
        .fontSize(10)
        .text(
          "Batch | Section | Project | Leader | Guide | Date | Slot | Status",
          {
            underline: true,
          },
        );
      doc.moveDown(0.5);

      // Rows
      reportData.forEach((r) => {
        const line = `${r["Batch Number"] || ""} | ${r["Section"] || ""} | ${r["Project Title"] || ""} | ${r["Leader"] || ""} | ${r["Guide"] || ""} | ${r["Date"] || ""} | ${r["Slot"] || ""} | ${r["Status"] || ""}`;
        doc.fontSize(9).text(line);
      });

      doc.end();
    });
  } else if (format === "csv") {
    const csv = parse(reportData);
    return csv;
  } else if (format === "docx") {
    const {
      Packer,
      Document,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
    } = require("docx");
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Review Slot Bookings Report",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({}),
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph("Batch Number")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Section")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Project Title")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Leader")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Guide")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Date")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Slot")],
                    }),
                    new TableCell({
                      children: [new Paragraph("Status")],
                    }),
                  ],
                }),
                ...reportData.map(
                  (r) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph(r["Batch Number"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Section"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Project Title"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Leader"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Guide"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Date"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Slot"] || "")],
                        }),
                        new TableCell({
                          children: [new Paragraph(r["Status"] || "")],
                        }),
                      ],
                    }),
                ),
              ],
            }),
          ],
        },
      ],
    });
    const packer = new Packer(doc);
    const blob = await packer.toBlob();
    return Buffer.from(await blob.arrayBuffer());
  }

  return reportData;
};

module.exports = { generateReport };
