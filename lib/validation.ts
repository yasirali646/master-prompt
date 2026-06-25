export const REQUIRED_SECTIONS = [
  "CORE BEHAVIOUR RULES",
  "SYSTEM FLOW",
  "STATE 1",
  "FINAL RULES",
  "START",
] as const;

export function validateOutput(text: string): string[] {
  return REQUIRED_SECTIONS.filter((section) => !text.includes(section));
}
