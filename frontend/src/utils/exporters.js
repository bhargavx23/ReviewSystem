/* Utilities to export structured data as CSV, printable PDF (via print window), and DOC/DOCX (HTML blob)
   This implementation avoids adding new npm deps — PDF uses browser print, DOCX is an HTML-word blob.
*/

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(filename, headers = [], rows = []) {
  const csvRows = [];
  csvRows.push(
    headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
  );
  rows.forEach((r) => {
    const line = headers
      .map((h) => {
        const val = r[h] == null ? "" : r[h];
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",");
    csvRows.push(line);
  });
  downloadBlob(
    csvRows.join("\n"),
    `${filename}.csv`,
    "text/csv;charset=utf-8;",
  );
}

function buildHTMLTable(title, headers = [], rows = []) {
  const styles = `
    <style>
      body{font-family: Arial, Helvetica, sans-serif; color:#111}
      table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f4f4f7;font-weight:700}
      h1{font-size:20px}
    </style>`;

  const headerRow = headers.map((h) => `<th>${h}</th>`).join("");
  const bodyRows = rows
    .map(
      (r) =>
        `<tr>${headers.map((h) => `<td>${(r[h] ?? "").toString()}</td>`).join("")}</tr>`,
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8">${styles}</head><body><h1>${title}</h1><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

export function exportDoc(filename, title, headers = [], rows = []) {
  const html = buildHTMLTable(title, headers, rows);
  // Many word processors accept HTML with the .doc extension — use application/msword
  downloadBlob(html, `${filename}.doc`, "application/msword;charset=utf-8;");
}

export function exportPDF(filename, title, headers = [], rows = []) {
  const html = buildHTMLTable(title, headers, rows);
  // Try to generate a real PDF using jsPDF + html2canvas (dynamic import).
  // Fallback: download HTML if libraries are unavailable.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.innerHTML = html;
  document.body.appendChild(container);
  (async () => {
    try {
      const { jsPDF } = await import("jspdf");
      // html2canvas is used internally by jsPDF.html, but ensure it's available
      await import("html2canvas");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      await doc.html(container, {
        callback: (pdf) => {
          try {
            pdf.save(`${filename}.pdf`);
          } catch (e) {
            console.error("PDF save failed:", e);
            downloadBlob(html, `${filename}.html`, "text/html;charset=utf-8;");
          }
        },
        x: 20,
        y: 20,
        html2canvas: { scale: 1.2 },
      });
    } catch (e) {
      console.error("PDF generation failed, falling back to HTML:", e);
      downloadBlob(html, `${filename}.html`, "text/html;charset=utf-8;");
    } finally {
      container.remove();
    }
  })();
}

export function structuredBatchRows(batches = [], bookings = []) {
  const rows = batches.map((batch) => {
    const related =
      bookings.find((b) => String(b.batchId?._id) === String(batch._id)) || {};
    return {
      BatchNumber: batch.batchName || "",
      Section: batch.section || "",
      ProjectTitle: batch.projectTitle || "",
      TeamLeaderName: batch.teamLeaderName || "",
      TeamLeaderEmail: batch.teamLeaderEmail || "",
      TeamLeaderRollNo: batch.teamLeaderRollNo || "",
      GuideName: batch.guideId?.name || "",
      BookedDate: related.date
        ? new Date(related.date).toLocaleDateString()
        : "",
      SlotNumber: related.slotNumber || "",
      BookingStatus: related.status || "",
    };
  });
  return rows;
}

export default {
  exportCSV,
  exportDoc,
  exportPDF,
  structuredBatchRows,
};
