import { Document, Packer, Paragraph, TextRun } from "docx";

export async function buildDocx(title: string, content: string): Promise<Buffer> {
  const paragraphs = content.split("\n").map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line || " ", size: 22 })],
        spacing: { after: 120 },
      })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 32 })],
            spacing: { after: 300 },
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export function formatForCursor(output: string): string {
  return `---\ndescription: Master Prompt — generated system instructions\n---\n\n${output}`;
}

export function formatForClaude(output: string): string {
  return `# Project Instructions\n\n${output}`;
}

export function formatForChatGPT(output: string): string {
  return output;
}
