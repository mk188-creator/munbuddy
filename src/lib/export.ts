import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

export type ExportFormat = "docx" | "pdf" | "txt";

type Block = { text: string; heading: 1 | 2 | null; bullet: boolean };

/** Turns the editor's HTML into flat blocks usable by every export target. */
function parseBlocks(html: string): Block[] {
  if (typeof window === "undefined") return [];
  const container = window.document.createElement("div");
  container.innerHTML = html;

  const blocks: Block[] = [];
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        for (const item of Array.from(child.children)) {
          blocks.push({ text: item.textContent?.trim() ?? "", heading: null, bullet: true });
        }
        continue;
      }
      const text = child.textContent?.trim() ?? "";
      if (!text) continue;
      blocks.push({
        text,
        heading: tag === "h1" ? 1 : tag === "h2" ? 2 : null,
        bullet: false,
      });
    }
  };
  walk(container);

  if (blocks.length === 0) {
    const fallback = container.textContent?.trim();
    if (fallback) blocks.push({ text: fallback, heading: null, bullet: false });
  }
  return blocks;
}

function safeName(title: string) {
  return (title.trim() || "document").replace(/[^\w\-. ]+/g, "_").slice(0, 80);
}

export async function exportDocument(title: string, html: string, format: ExportFormat) {
  const blocks = parseBlocks(html);
  const name = safeName(title);

  if (format === "txt") {
    const text = [title, "", ...blocks.map((b) => (b.bullet ? `• ${b.text}` : b.text))].join("\n\n");
    saveAs(new Blob([text], { type: "text/plain;charset=utf-8" }), `${name}.txt`);
    return;
  }

  if (format === "pdf") {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 56;
    const width = pdf.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    for (const line of pdf.splitTextToSize(title || "Untitled", width)) {
      pdf.text(line, margin, y);
      y += 24;
    }
    y += 8;

    for (const block of blocks) {
      const size = block.heading === 1 ? 15 : block.heading === 2 ? 13 : 11;
      pdf.setFont("helvetica", block.heading ? "bold" : "normal");
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(
        block.bullet ? `• ${block.text}` : block.text,
        width,
      ) as string[];
      for (const line of lines) {
        if (y > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += size + 6;
      }
      y += 8;
    }

    pdf.save(`${name}.pdf`);
    return;
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            children: [new TextRun({ text: title || "Untitled", bold: true })],
          }),
          ...blocks.map(
            (block) =>
              new Paragraph({
                ...(block.heading === 1
                  ? { heading: HeadingLevel.HEADING_1 }
                  : block.heading === 2
                    ? { heading: HeadingLevel.HEADING_2 }
                    : {}),
                ...(block.bullet ? { bullet: { level: 0 } } : {}),
                children: [new TextRun(block.text)],
              }),
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${name}.docx`);
}
