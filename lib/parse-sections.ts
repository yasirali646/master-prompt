export interface ParsedSection {
  id: string;
  title: string;
  content: string;
  level: number;
}

export function parseSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const lines = text.split("\n");
  let current: ParsedSection | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) {
      current.content = buffer.join("\n").trim();
      sections.push(current);
    }
    buffer = [];
  };

  for (const line of lines) {
    const stateMatch = line.match(/^STATE (\d+):\s*(.+)/i);
    const headerMatch = line.match(/^(CORE BEHAVIOUR RULES|SYSTEM FLOW|FINAL RULES|START|CRITICAL .+)$/i);

    if (stateMatch) {
      flush();
      current = {
        id: `state-${stateMatch[1]}`,
        title: `STATE ${stateMatch[1]}: ${stateMatch[2]}`,
        content: "",
        level: 2,
      };
    } else if (headerMatch) {
      flush();
      const title = headerMatch[1];
      current = {
        id: title.toLowerCase().replace(/\s+/g, "-"),
        title,
        content: "",
        level: 1,
      };
    } else if (!current && line.trim() && sections.length === 0) {
      current = { id: "title", title: "Engine Title", content: "", level: 0 };
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  flush();

  if (sections.length === 0 && text.trim()) {
    return [{ id: "raw", title: "Full Prompt", content: text.trim(), level: 0 }];
  }
  return sections;
}

export function toStructuredJson(text: string) {
  const sections = parseSections(text);
  const stateMatches = text.match(/STATE \d+ -> .+/g) ?? [];
  return {
    title: sections.find((s) => s.id === "title")?.content.split("\n")[0] ?? "",
    sections: sections.map((s) => ({ id: s.id, title: s.title, content: s.content })),
    flow: stateMatches,
  };
}
