import * as yaml from "js-yaml";

export function yamlToJson(text: string): string {
  if (!text.trim()) return "";
  const parsed = yaml.load(text);
  return parsed === undefined ? "" : JSON.stringify(parsed, null, 2);
}
