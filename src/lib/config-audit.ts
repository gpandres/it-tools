export type AuditSeverity = "high" | "medium" | "low";

export type AuditRule = {
  id: string;
  label: string;
  severity: AuditSeverity;
  pattern: RegExp;
  explanation: string;
  fix: string;
};

export type AuditFinding = AuditRule & {
  line: number;
  column: number;
  excerpt: string;
};

export const MAX_AUDIT_INPUT_LENGTH = 1_000_000;

export function sourcePositionAt(input: string, index: number) {
  const beforeMatch = input.slice(0, index);
  const lastNewline = beforeMatch.lastIndexOf("\n");

  return {
    line: beforeMatch.split("\n").length,
    column: index - lastNewline,
  };
}

export function sourceExcerptAt(input: string, index: number) {
  const lines = input.split("\n");
  const line = lines[input.slice(0, index).split("\n").length - 1] ?? "";
  return line.trim().slice(0, 240);
}

function statelessPattern(pattern: RegExp) {
  return new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
}

export function analyzeConfig(input: string, rules: AuditRule[]): AuditFinding[] {
  return rules.flatMap(rule => {
    const match = statelessPattern(rule.pattern).exec(input);
    if (!match || match.index === undefined) return [];

    return [{
      ...rule,
      ...sourcePositionAt(input, match.index),
      excerpt: sourceExcerptAt(input, match.index),
    }];
  });
}
