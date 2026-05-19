import { jsPDF } from "jspdf";
import type { Order } from "@/components/orders/OrderForm";

const company = {
  name: "Jersey Solutions BD",
  address: ["Dhaka, Bangladesh", "Phone: +880 1862932701"],
  logoPath: "/js_main_logo_png.png",
};

const money = (value: number) => `BDT ${Number(value || 0).toLocaleString("en-BD")}`;

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getLogoDataUrl = async () => {
  try {
    const response = await fetch(company.logoPath);
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read logo"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
};

const createWatermarkDataUrl = async (logoDataUrl: string) => {
  if (!logoDataUrl) return "";

  return await new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 520;
      canvas.height = 520;
      const context = canvas.getContext("2d");

      if (!context) {
        resolve("");
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.globalAlpha = 0.07;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve("");
    image.src = logoDataUrl;
  });
};

const createPaidStampDataUrl = () => {
  const size = 720;
  const center = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) return "";

  const drawArcText = (label: string, radius: number, startAngle: number, endAngle: number, flip = false) => {
    const chars = label.split("");
    const angleStep = (endAngle - startAngle) / Math.max(chars.length - 1, 1);

    chars.forEach((char, index) => {
      const angle = startAngle + angleStep * index;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      context.save();
      context.translate(x, y);
      context.rotate(angle + (flip ? -Math.PI / 2 : Math.PI / 2));
      context.fillText(char, 0, 0);
      context.restore();
    });
  };

  context.clearRect(0, 0, size, size);
  const red = "#d71920";
  context.strokeStyle = red;
  context.fillStyle = red;
  context.globalAlpha = 0.86;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.save();
  context.translate(center, center);

  context.lineWidth = 11;
  context.beginPath();
  context.arc(0, 0, 230, 0, Math.PI * 2);
  context.stroke();

  context.lineWidth = 5;
  context.beginPath();
  context.arc(0, 0, 198, 0, Math.PI * 2);
  context.stroke();

  context.lineWidth = 8;
  context.beginPath();
  context.arc(0, 0, 120, 0, Math.PI * 2);
  context.stroke();

  context.save();
  context.rotate((-10 * Math.PI) / 180);
  context.font = "900 158px Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("PAID", 0, 12);
  context.restore();

  context.font = "900 44px Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  drawArcText("THANK YOU", 164, (218 * Math.PI) / 180, (322 * Math.PI) / 180);
  drawArcText("THANK YOU", 164, (142 * Math.PI) / 180, (38 * Math.PI) / 180, true);

  context.restore();

  return canvas.toDataURL("image/png");
};

const buildLineItems = (order: Order) => {
  const jerseyBillable = Math.max(0, Number(order.quantity || 0) - Number(order.gift || 0));
  const rows = [
    {
      item: "Custom Jersey",
      fabric: [order.jersey_type, order.gsm].filter(Boolean).join(", ") || "-",
      quantity: Number(order.quantity || 0),
      gift: Number(order.gift || 0),
      billable: jerseyBillable,
      rate: Number(order.selling_price_per_pcs || 0),
      amount: jerseyBillable * Number(order.selling_price_per_pcs || 0),
    },
  ];

  const hasTrouser =
    Boolean(order.trouser_type && order.trouser_type !== "None") ||
    Boolean(order.trouser_gsm && order.trouser_gsm !== "None") ||
    Number(order.trouser_quantity || 0) > 0 ||
    Number(order.trouser_selling_price_per_pcs || 0) > 0;

  if (hasTrouser) {
    rows.push({
      item: "Trouser",
      fabric: [order.trouser_type, order.trouser_gsm].filter(Boolean).join(", ") || "-",
      quantity: Number(order.trouser_quantity || 0),
      gift: 0,
      billable: Number(order.trouser_quantity || 0),
      rate: Number(order.trouser_selling_price_per_pcs || 0),
      amount: Number(order.trouser_quantity || 0) * Number(order.trouser_selling_price_per_pcs || 0),
    });
  }

  return rows;
};

const rightText = (doc: jsPDF, text: string, x: number, y: number) => {
  doc.text(text, x, y, { align: "right" });
};

const leftText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number) => {
  doc.text(doc.splitTextToSize(text, maxWidth), x, y);
};

const centerText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line: string, index: number) => {
    doc.text(line, x, y + index * 11, { align: "center" });
  });
};

const centerCellText = (
  doc: jsPDF,
  text: string,
  column: { x: number; width: number },
  rowTop: number,
  rowHeight: number,
) => {
  const lineHeight = 11;
  const lines = doc.splitTextToSize(text, column.width - 14);
  const firstLineY = rowTop + rowHeight / 2 - ((lines.length - 1) * lineHeight) / 2 + 3;
  lines.forEach((line: string, index: number) => {
    doc.text(line, column.x + column.width / 2, firstLineY + index * lineHeight, { align: "center" });
  });
};

const safeFileName = (value: string) => String(value || "invoice").replace(/[^a-z0-9-_]+/gi, "-");

export const downloadInvoice = async (order: Order) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  const primary = "#183b75";
  const text = "#111827";
  const muted = "#64748b";
  const border = "#dbe3ef";
  const logo = await getLogoDataUrl();
  const watermark = await createWatermarkDataUrl(logo);
  const lineItems = buildLineItems(order);
  const totalQuantity = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  if (watermark) {
    const watermarkSize = 300;
    doc.addImage(
      watermark,
      "PNG",
      (pageWidth - watermarkSize) / 2,
      266,
      watermarkSize,
      watermarkSize,
      undefined,
      "FAST",
    );
  }

  doc.setTextColor(text);
  doc.setDrawColor(primary);
  doc.setLineWidth(2);

  if (logo) {
    doc.addImage(logo, "PNG", margin, 34, 78, 78, undefined, "FAST");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(text);
  doc.text(company.name, margin + 94, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(muted);
  company.address.forEach((line, index) => doc.text(line, margin + 94, 76 + index * 14));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(text);
  rightText(doc, "INVOICE", pageWidth - margin, 58);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  rightText(doc, `Invoice No: ${order.order_number || "-"}`, pageWidth - margin, 80);
  rightText(doc, `Date: ${formatDate(order.order_date)}`, pageWidth - margin, 94);

  doc.line(margin, 126, pageWidth - margin, 126);

  const boxY = 154;
  const boxHeight = 70;
  const boxWidth = (pageWidth - margin * 2 - 18) / 2;
  doc.setDrawColor(border);
  doc.roundedRect(margin, boxY, boxWidth, boxHeight, 8, 8);
  doc.roundedRect(margin + boxWidth + 18, boxY, boxWidth, boxHeight, 8, 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(muted);
  doc.text("BILL TO", margin + 10, boxY + 18);
  doc.text("ORDER SUMMARY", margin + boxWidth + 28, boxY + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(text);
  doc.text(`Name: ${order.customer_name || "-"}`, margin + 10, boxY + 36);
  doc.text(`Phone: ${order.phone || "-"}`, margin + 10, boxY + 52);

  const summaryX = margin + boxWidth + 28;
  doc.text(`Delivery Status: ${order.delivery_status || "-"}`, summaryX, boxY + 36);
  doc.text(`Total Quantity: ${totalQuantity}`, summaryX, boxY + 52);

  const tableY = 258;
  const tableWidth = pageWidth - margin * 2;
  const columns = [
    { label: "SL", x: margin, width: 48 },
    { label: "Item", x: margin + 48, width: 82 },
    { label: "Fabric", x: margin + 130, width: 126 },
    { label: "Qty", x: margin + 256, width: 54 },
    { label: "Rate", x: margin + 310, width: 104 },
    { label: "Amount", x: margin + 440, width: tableWidth - 440 },
  ];

  doc.setFillColor(primary);
  doc.rect(margin, tableY, tableWidth, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor("#ffffff");
  columns.forEach((column) => {
    doc.text(column.label, column.x + column.width / 2, tableY + 19, { align: "center" });
  });

  let rowY = tableY + 30;
  const rowHeight = 44;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(text);
  lineItems.forEach((item, index) => {
    doc.setDrawColor("#e5eaf1");
    doc.line(margin, rowY + rowHeight, pageWidth - margin, rowY + rowHeight);
    centerCellText(doc, String(index + 1), columns[0], rowY, rowHeight);
    centerCellText(doc, item.item === "Custom Jersey" ? "Jersey" : item.item, columns[1], rowY, rowHeight);
    centerCellText(doc, item.fabric, columns[2], rowY, rowHeight);
    centerCellText(doc, String(item.quantity), columns[3], rowY, rowHeight);
    centerCellText(doc, money(item.rate), columns[4], rowY, rowHeight);
    centerCellText(doc, money(item.amount), columns[5], rowY, rowHeight);
    rowY += rowHeight;
  });

  const totalsX = pageWidth - margin - 240;
  let totalsY = rowY + 26;
  const totalRow = (label: string, value: string, highlight = false) => {
    if (highlight) {
      doc.setFillColor(primary);
      doc.roundedRect(totalsX, totalsY - 11, 240, 32, 7, 7, "F");
      doc.setTextColor("#ffffff");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(label, totalsX + 10, totalsY + 7);
      rightText(doc, value, totalsX + 230, totalsY + 7);
      totalsY += 42;
      return;
    } else {
      doc.setTextColor(text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    }
    doc.text(label, totalsX + 10, totalsY + 3);
    doc.setFont("helvetica", "bold");
    rightText(doc, value, totalsX + 230, totalsY + 3);
    doc.setFont("helvetica", "normal");
    if (label !== "Advance Paid") {
      doc.setDrawColor("#e5eaf1");
      doc.line(totalsX, totalsY + 11, totalsX + 240, totalsY + 11);
    }
    totalsY += highlight ? 42 : 28;
  };

  totalRow("Subtotal", money(order.total_amount));
  totalRow("Delivery Charge", money(order.delivery_charge));
  totalRow("Advance Paid", money(order.advance));
  totalRow("Due Amount", money(order.due), true);

  if (Number(order.due || 0) === 0) {
    const stamp = createPaidStampDataUrl();
    if (stamp) {
      doc.addImage(stamp, "PNG", totalsX + 50, totalsY + 6, 140, 140, undefined, "FAST");
      totalsY += 148;
    }
  }

  const footerY = 792;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(muted);
  doc.text(`Thank you for choosing ${company.name}.`, margin, footerY);
  doc.setDrawColor("#94a3b8");
  doc.line(pageWidth - margin - 180, footerY - 8, pageWidth - margin, footerY - 8);
  doc.setTextColor(text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Md. Arman Hossain", pageWidth - margin - 90, footerY - 16, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Authorized Signature", pageWidth - margin - 90, footerY + 8, { align: "center" });

  doc.save(`invoice-${safeFileName(order.customer_name)}.pdf`);
};
