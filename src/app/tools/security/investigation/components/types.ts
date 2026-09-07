export type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'other';
export type IOCTag = 'malicious' | 'suspicious' | 'benign' | 'unknown';

export interface IOC {
  id: string;
  type: IOCType;
  value: string;
  tag: IOCTag;
  notes?: string;
  timestamp: number;
}

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO String or readable date
  description: string;
  source?: string;
}

export interface InvestigationCase {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  iocs: IOC[];
  timeline: TimelineEvent[];
  findings: string; // Markdown text
}
