// jsPDF を使ってブックをPDF出力する（要件定義書 FR-8）
// 各ページを renderPageToCanvas で画像化して貼るため、日本語も文字化けしない。

import { jsPDF } from "jspdf";
import type { Book } from "./types";
import { renderPageToCanvas, renderAfterwordToCanvas, A4_LANDSCAPE } from "./pageRender";

function sanitizeFileName(name: string): string {
  const trimmed = (name || "えほん").trim() || "えほん";
  return trimmed.replace(/[\\/:*?"<>|]/g, "_");
}

export async function exportBookToPdf(book: Book): Promise<void> {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const canvas = document.createElement("canvas");

  for (let i = 0; i < book.pages.length; i++) {
    await renderPageToCanvas(book.pages[i], canvas, {
      width: A4_LANDSCAPE.width,
      height: A4_LANDSCAPE.height,
      pageNumber: i + 1,
    });
    const imgData = canvas.toDataURL("image/png");
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
  }

  // あとがき（あれば最終ページに追加）
  if (book.afterword && book.afterword.trim()) {
    renderAfterwordToCanvas(book.afterword, canvas, {
      width: A4_LANDSCAPE.width,
      height: A4_LANDSCAPE.height,
    });
    pdf.addPage();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
  }

  pdf.save(`${sanitizeFileName(book.title)}.pdf`);
}
