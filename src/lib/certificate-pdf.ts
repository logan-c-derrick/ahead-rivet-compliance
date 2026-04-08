import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export async function buildDeclarationPdf(input: {
  productName: string;
  batchSerial: string;
  regulationLines: string[];
  templateBody: string | null;
  signerTitle: string | null;
  signaturePng?: Uint8Array | null;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const title = "Declaration of Conformity";
  let y = 720;

  page.drawText(title, {
    x: 72,
    y,
    size: 18,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.35),
  });
  y -= 36;

  const body =
    input.templateBody?.trim() ||
    [
      "This document certifies that the product identified below is tracked in ComplianceHub for the selected regulations.",
      "",
      `Product: ${input.productName}`,
      `Batch / serial: ${input.batchSerial}`,
      "",
      "Regulations referenced:",
      ...input.regulationLines.map((l) => `• ${l}`),
    ].join("\n");

  const lines = body.split("\n");
  for (const line of lines) {
    page.drawText(line.length > 110 ? `${line.slice(0, 107)}...` : line, {
      x: 72,
      y,
      size: 11,
      font,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: 468,
    });
    y -= 14;
    if (y < 120) break;
  }

  y = Math.min(y, 140);

  if (input.signaturePng && input.signaturePng.length > 0) {
    try {
      const img = await pdf.embedPng(input.signaturePng);
      const w = 120;
      const scale = w / img.width;
      const h = img.height * scale;
      page.drawImage(img, { x: 72, y: y - h - 8, width: w, height: h });
      y -= h + 24;
    } catch {
      /* ignore bad image */
    }
  }

  page.drawText(input.signerTitle || "Authorized signatory", {
    x: 72,
    y: y - 8,
    size: 9,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 72,
    y: 48,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.45),
  });

  return pdf.save();
}
