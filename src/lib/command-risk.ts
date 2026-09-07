export type CommandRisk = "safe" | "caution" | "destructive";

export interface CommandRiskInfo {
  risk: CommandRisk;
  label: string;
  message: string;
}

const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-[a-z]*f/i,
  /\brm\s+-[^\n]*\brf\b/i,
  /\b(?:del|erase)\s+(?:\/s|\/q|\/f)\b/i,
  /\bformat\s+[a-z]:/i,
  /\bdiskpart\b[\s\S]*\bclean\b/i,
  /\b(?:docker\s+system\s+prune|docker\s+volume\s+prune)\b/i,
  /\bkubectl\s+delete\b/i,
  /\bterraform\s+destroy\b/i,
  /\b(?:shutdown|poweroff|halt|reboot)\b/i,
  /\biptables\s+(-F|--flush)\b/i,
  /\bDROP\s+(?:DATABASE|TABLE|SCHEMA)\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
  /\bDELETE\s+FROM\b[\s\S]*\bWHERE\s+1\s*=\s*1\b/i,
];

const CAUTION_PATTERNS: RegExp[] = [
  /\brm\s+-/i,
  /\b(?:del|erase)\b/i,
  /\b(?:docker\s+(?:rm|rmi)|kubectl\s+delete)\b/i,
  /\bterraform\s+apply\b/i,
  /\bsystemctl\s+(?:stop|restart|disable|mask)\b/i,
  /\b(?:service|rc-service)\s+\S+\s+(?:stop|restart)\b/i,
  /\b(?:kill|pkill|killall)\b/i,
  /\bchmod\s+(?:-R\s+)?777\b/i,
  /\bchown\s+-R\b/i,
  /\bgit\s+push\b[\s\S]*--force(?:-with-lease)?\b/i,
  /\b(?:iptables|ip6tables|ufw|firewall-cmd|netsh)\b[\s\S]*\b(?:-A|-D|-F|allow|deny|delete|disable|reset|set)\b/i,
  /\b(?:passwd|userdel|usermod)\b/i,
  /\bDELETE\s+FROM\b/i,
  /\b(?:curl|wget)\b[\s\S]*\|\s*(?:sh|bash|zsh|powershell|pwsh)\b/i,
];

export function assessCommandRisk(command: string): CommandRiskInfo {
  const normalized = command.replace(/\s+/g, " ").trim();

  if (DESTRUCTIVE_PATTERNS.some(pattern => pattern.test(normalized))) {
    return {
      risk: "destructive",
      label: "DESTRUCTIVE",
      message: "Destructive command. Review the target, scope, backup and environment before running it.",
    };
  }

  if (CAUTION_PATTERNS.some(pattern => pattern.test(normalized))) {
    return {
      risk: "caution",
      label: "HIGH IMPACT",
      message: "High-impact command. Verify the target, permissions and environment before running it.",
    };
  }

  return {
    risk: "safe",
    label: "",
    message: "",
  };
}
