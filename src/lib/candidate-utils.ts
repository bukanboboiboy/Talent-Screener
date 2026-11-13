/**
 * Shared utility functions for candidate scoring and summary parsing
 */

export function getScoreColor(score: number): string {
  if (score >= 80) {
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  }
  if (score >= 60) {
    return "text-amber-500 bg-amber-500/10 border-amber-500/30";
  }
  return "text-rose-500 bg-rose-500/10 border-rose-500/30";
}

export function getScoreTier(score: number): { label: string; colorClass: string } {
  if (score >= 85) {
    return { label: "High Match", colorClass: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" };
  }
  if (score >= 70) {
    return { label: "Potential Fit", colorClass: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30" };
  }
  if (score >= 50) {
    return { label: "Requires Review", colorClass: "text-amber-400 bg-amber-500/15 border-amber-500/30" };
  }
  return { label: "Low Alignment", colorClass: "text-rose-400 bg-rose-500/15 border-rose-500/30" };
}

export function parseSummary(summaryString: string): string[] {
  if (!summaryString) {
    return ["No detailed AI evaluation notes provided."];
  }

  try {
    const parsed = JSON.parse(summaryString);
    if (Array.isArray(parsed)) {
      const items = parsed
        .map((p) => (typeof p === "string" ? p.trim() : JSON.stringify(p)))
        .filter((p) => p.length > 0);
      return items.length > 0 ? items : [summaryString];
    }
    if (typeof parsed === "string") {
      return [parsed.trim()];
    }
    return [String(parsed)];
  } catch {
    const trimmed = summaryString.trim();
    if (trimmed) {
      return [trimmed];
    }
    return ["Failed to parse candidate evaluation details."];
  }
}
