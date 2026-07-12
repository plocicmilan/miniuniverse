// pdf.js — Work Order PDF generacija (jsPDF)
// Format prati nase work_order.docx template iz Business Starter Kita

const BRAND_BLUE = [46, 92, 138];   // #2E5C8A
const BRAND_LIGHT = [236, 244, 251];
const ETSY_URL = 'tradesmansplaybook.etsy.com';

// Generise PDF za jedan work order record, pokrace download na uredjaju
async function exportWorkOrderPDF(record) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const W = 215.9; // letter width mm
  const M = 15;    // margin

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text("TRADESMAN'S PLAYBOOK", M, 10);
  doc.setFontSize(11);
  doc.text('WORK ORDER', M, 17);
  doc.setFontSize(10);
  doc.text(`Job #: ${record.job_number}`, W - M - 50, 10, { align: 'left' });
  doc.text(`Date: ${record.date}  ${record.time}`, W - M - 50, 17, { align: 'left' });

  // ── Job Info block ───────────────────────────────────────
  let y = 30;
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(...BRAND_LIGHT);
  doc.rect(M, y, W - M * 2, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TRADE:', M + 3, y + 7);
  doc.text('CUSTOMER:', M + 3, y + 14);
  doc.text('SERVICE ADDRESS:', M + 3, y + 21);

  doc.setFont('helvetica', 'normal');
  doc.text(tradeName(record.trade), M + 40, y + 7);
  doc.text(record.customer_name || '—', M + 40, y + 14);

  // Adresa moze biti dugacka — multi-cell
  const addrLines = doc.splitTextToSize(record.address || '—', W - M * 2 - 44);
  doc.text(addrLines, M + 44, y + 21);

  // ── Description ─────────────────────────────────────────
  y += 34;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESCRIPTION OF WORK:', M, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const descLines = doc.splitTextToSize(record.description || '—', W - M * 2);
  doc.text(descLines, M, y);
  y += descLines.length * 5 + 8;

  // ── Photos ──────────────────────────────────────────────
  if (record.photos && record.photos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PHOTOS:', M, y);
    y += 5;

    const photoW = 55;
    const photoH = 40;
    const gap = 5;
    let x = M;

    for (const photo of record.photos.slice(0, 4)) { // max 4 slike na strani
      if (x + photoW > W - M) { x = M; y += photoH + gap; }
      try {
        doc.addImage(photo, 'JPEG', x, y, photoW, photoH);
      } catch {
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, photoW, photoH);
        doc.setFontSize(7);
        doc.text('[photo]', x + photoW / 2, y + photoH / 2, { align: 'center' });
      }
      x += photoW + gap;
    }
    y += photoH + 12;
  }

  // ── Signature block ─────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Technician:', M, y);
  doc.line(M + 28, y, M + 80, y);
  doc.text('Date:', M + 85, y);
  doc.line(M + 96, y, W - M, y);
  y += 10;
  doc.text('Customer:', M, y);
  doc.line(M + 28, y, M + 80, y);
  doc.text('Date:', M + 85, y);
  doc.line(M + 96, y, W - M, y);

  // ── Footer / Upsell ─────────────────────────────────────
  const footerY = 265;
  doc.setDrawColor(...BRAND_BLUE);
  doc.setLineWidth(0.5);
  doc.line(M, footerY, W - M, footerY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Work Order Snap by Tradesman's Playbook  |  Invoice & Contract Templates from $6:  ${ETSY_URL}`,
    W / 2, footerY + 5, { align: 'center' }
  );
  doc.text(
    'Templates are for single-business use. Not legal advice.',
    W / 2, footerY + 10, { align: 'center' }
  );

  // ── Download ────────────────────────────────────────────
  doc.save(`WorkOrder_${record.job_number}_${record.date}.pdf`);
}

function tradeName(key) {
  const names = {
    plumber: 'Plumbing',
    hvac: 'HVAC / Mechanical',
    electrician: 'Electrical',
    roofer: 'Roofing',
    handyman: 'General Handyman'
  };
  return names[key] || key;
}

export { exportWorkOrderPDF };
