import { validateOutput } from "./validation";

export interface QualityResult {
  score: number;
  missing: string[];
  checks: { label: string; passed: boolean; weight: number }[];
}

export function analyzeQuality(text: string): QualityResult {
  const missing = validateOutput(text);
  const stateMatches = text.match(/STATE \d+:/g) ?? [];
  const stateCount = stateMatches.length;
  const hasStart = /START/i.test(text);
  const allStatesStop = stateCount > 0 && (text.match(/Then STOP\./g) ?? []).length >= Math.min(stateCount, 1);
  const noPlaceholders = !/\[INSERT|\[TODO|PLACEHOLDER/i.test(text);
  const hasCoreRules = text.includes("CORE BEHAVIOUR RULES");
  const hasSystemFlow = text.includes("SYSTEM FLOW");
  const hasFinalRules = text.includes("FINAL RULES");
  const reasonableLength = text.length >= 500;

  const checks = [
    { label: "CORE BEHAVIOUR RULES present", passed: hasCoreRules, weight: 15 },
    { label: "SYSTEM FLOW present", passed: hasSystemFlow, weight: 15 },
    { label: "FINAL RULES present", passed: hasFinalRules, weight: 10 },
    { label: "START block present", passed: hasStart, weight: 10 },
    { label: "States end with 'Then STOP.'", passed: allStatesStop, weight: 15 },
    { label: "6–12 states defined", passed: stateCount >= 6 && stateCount <= 12, weight: 15 },
    { label: "No placeholder text", passed: noPlaceholders, weight: 10 },
    { label: "Sufficient length", passed: reasonableLength, weight: 10 },
  ];

  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  const score = Math.round(earned);

  return { score, missing, checks };
}
