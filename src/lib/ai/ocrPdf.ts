/**
 * Rasterize PDF pages and run local Tesseract OCR (no cloud).
 * Used when AI_MODE=local and the PDF has no usable text layer.
 */
export async function ocrPdfText(pdfBase64: string, maxPages = 2): Promise<string> {
  const buf = Buffer.from(pdfBase64, "base64");
  const data = new Uint8Array(buf);

  // Dynamic imports keep the analyze route light when OCR is not needed.
  const [{ definePDFJSModule, getDocumentProxy, renderPageAsImage }, tesseract] = await Promise.all([
    import("unpdf"),
    import("tesseract.js"),
  ]);

  await definePDFJSModule(() => import("pdfjs-dist/legacy/build/pdf.mjs"));

  const pdf = await getDocumentProxy(data);
  const pages = Math.min(pdf.numPages || 1, maxPages);
  const worker = await tesseract.createWorker("eng", 1, {
    // Keep logs quiet in the Next.js server terminal.
    logger: () => {},
  });

  try {
    const chunks: string[] = [];
    for (let page = 1; page <= pages; page++) {
      const png = (await renderPageAsImage(pdf, page, {
        canvasImport: () => import("@napi-rs/canvas"),
        scale: 2,
        toDataURL: false,
      })) as ArrayBuffer;
      const { data: result } = await worker.recognize(Buffer.from(png));
      if (result.text?.trim()) chunks.push(result.text.trim());
    }
    return chunks.join("\n\n");
  } finally {
    await worker.terminate().catch(() => {});
  }
}
