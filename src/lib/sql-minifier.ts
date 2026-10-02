export type MinifyDialect = "sql" | "postgresql" | "mysql";

/** Compact whitespace outside quoted tokens; never rewrite literal contents. */
export function minifySql(input: string, removeComments: boolean, dialect: MinifyDialect): string {
  const output: string[] = [];
  let index = 0;
  let pendingSpace = false;
  let pendingNewline = false;
  let previousQuoted = false;
  const emit = (token: string, quoted = false) => {
    if (output.length && pendingSpace && !output[output.length - 1].endsWith("\n")) output.push(pendingNewline && previousQuoted ? "\n" : " ");
    output.push(token);
    pendingSpace = false;
    pendingNewline = false;
    previousQuoted = quoted;
  };
  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      pendingSpace = true;
      pendingNewline ||= char === "\n" || char === "\r";
      index++;
      continue;
    }
    const lineComment = input.startsWith("--", index) && (dialect !== "mysql" || !input[index + 2] || /\s/.test(input[index + 2]));
    if (lineComment || (dialect === "mysql" && char === "#")) {
      const start = index;
      while (index < input.length && !/[\r\n]/.test(input[index])) index++;
      if (!removeComments) {
        emit(input.slice(start, index));
        output.push("\n");
      }
      pendingSpace = removeComments;
      pendingNewline = true;
      continue;
    }
    if (input.startsWith("/*", index)) {
      const start = index;
      let depth = 1;
      index += 2;
      while (index < input.length && depth) {
        if (input.startsWith("/*", index) && dialect !== "mysql") { depth++; index += 2; }
        else if (input.startsWith("*/", index)) { depth--; index += 2; }
        else index++;
      }
      if (depth) throw new Error("Unclosed block comment.");
      const comment = input.slice(start, index);
      if (!removeComments || /^\/\*[!+]/.test(comment)) emit(comment);
      pendingSpace = true;
      pendingNewline ||= /[\r\n]/.test(comment);
      continue;
    }
    if (dialect === "postgresql" && char === "$" && (index === 0 || !/[\w$]/.test(input[index - 1]))) {
      const marker = input.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
      if (marker) {
        const end = input.indexOf(marker, index + marker.length);
        if (end < 0) throw new Error("Unclosed dollar-quoted string.");
        emit(input.slice(index, end + marker.length), true);
        index = end + marker.length;
        continue;
      }
    }
    if (char === "'" || char === '"' || (dialect === "mysql" && char.charCodeAt(0) === 96)) {
      const start = index++;
      const escapes = dialect === "mysql" || (dialect === "postgresql" && char === "'" && /[eE]/.test(input[start - 1] ?? "") && (start < 2 || !/[\w$]/.test(input[start - 2])));
      let closed = false;
      while (index < input.length) {
        if (escapes && input[index] === "\\") { index += 2; continue; }
        if (input[index] === char) {
          if (input[index + 1] === char) { index += 2; continue; }
          index++;
          closed = true;
          break;
        }
        index++;
      }
      if (!closed) throw new Error("Unclosed quoted string or identifier.");
      emit(input.slice(start, index), true);
      continue;
    }
    emit(char);
    index++;
  }
  return output.join("").replace(/\n$/, "");
}
