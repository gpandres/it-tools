import { load } from "js-yaml";

export type SigmaDiagnostic = { severity: "error" | "warning"; message: string };

type SigmaRule = Record<string, unknown>;

function isObject(value: unknown): value is SigmaRule {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateSigmaRule(input: string): SigmaDiagnostic[] {
  if (!input.trim()) return [{ severity: "error", message: "The generated rule is empty." }];
  let parsed: unknown;
  try {
    parsed = load(input);
  } catch (error) {
    return [{ severity: "error", message: error instanceof Error ? `Invalid YAML: ${error.message}` : "Invalid YAML." }];
  }
  if (!isObject(parsed)) return [{ severity: "error", message: "A Sigma rule must be a YAML mapping." }];
  const diagnostics: SigmaDiagnostic[] = [];
  if (typeof parsed.title !== "string" || !parsed.title.trim()) diagnostics.push({ severity: "error", message: "A non-empty title is required." });
  const logsource = parsed.logsource;
  if (!isObject(logsource) || !Object.values(logsource).some(value => typeof value === "string" && value.trim())) diagnostics.push({ severity: "error", message: "logsource needs at least one of category, product or service." });
  const detection = parsed.detection;
  if (!isObject(detection)) {
    diagnostics.push({ severity: "error", message: "detection must be a YAML mapping." });
  } else {
    const selections = Object.keys(detection).filter(key => key !== "condition");
    if (selections.length === 0) diagnostics.push({ severity: "error", message: "detection needs at least one selection." });
    if (typeof detection.condition !== "string" || !detection.condition.trim()) {
      diagnostics.push({ severity: "error", message: "detection.condition is required." });
    } else {
      const referenced = detection.condition.match(/\b(?:all|1|any)\s+of\s+([A-Za-z0-9_*?-]+)|\b([A-Za-z_][A-Za-z0-9_]*)\b/g) ?? [];
      const keywords = new Set(["all", "of", "and", "or", "not", "near"]);
      const unknown = referenced.map(token => token.toLowerCase()).filter(token => !keywords.has(token) && !/^\d+$/.test(token) && !selections.includes(token) && !token.includes("*"));
      for (const selection of [...new Set(unknown)]) diagnostics.push({ severity: "error", message: `Condition references unknown selection: ${selection}.` });
    }
  }
  if (parsed.id !== undefined && (typeof parsed.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.id))) diagnostics.push({ severity: "warning", message: "id should be a UUIDv4 when supplied." });
  if (parsed.status !== undefined && !["stable", "test", "experimental", "deprecated", "unsupported"].includes(String(parsed.status))) diagnostics.push({ severity: "warning", message: "status is not a recognized Sigma status." });
  if (parsed.level !== undefined && !["informational", "low", "medium", "high", "critical"].includes(String(parsed.level))) diagnostics.push({ severity: "warning", message: "level is not a recognized Sigma level." });
  if (parsed.date !== undefined && (typeof parsed.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date))) diagnostics.push({ severity: "warning", message: "date should use YYYY-MM-DD." });
  return diagnostics;
}
