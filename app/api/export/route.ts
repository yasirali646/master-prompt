import { buildDocx } from "@/lib/export";
import { toStructuredJson } from "@/lib/parse-sections";

export async function POST(request: Request) {
  const body = await request.json();
  const { output, format, idea } = body;
  if (!output) return Response.json({ detail: "output required" }, { status: 400 });

  const title = idea || "Master Prompt";

  if (format === "docx") {
    const buffer = await buildDocx(title, output);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="master-prompt.docx"',
      },
    });
  }

  if (format === "json") {
    return Response.json(toStructuredJson(output));
  }

  if (format === "md") {
    const md = `# ${title}\n\n${output}`;
    return new Response(md, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": 'attachment; filename="master-prompt.md"',
      },
    });
  }

  return new Response(output, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": 'attachment; filename="master-prompt.txt"',
    },
  });
}
