export type StepType = 'checklist' | 'command' | 'information' | 'decision' | 'verification' | 'warning';

export interface RunbookStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  
  // Type specific fields
  content?: string; // For info, warning, verification (markdown/text)
  command?: string; // For command steps
  expectedResult?: string; // For verification/command
  
  // Checklist items
  items?: string[];
  
  // Decision logic
  decisionTrueNext?: string; // Step ID to jump to if true
  decisionFalseNext?: string; // Step ID to jump to if false
  decisionQuestion?: string;
}

export interface RunbookVariable {
  name: string; // e.g. "HOST", "IP"
  description: string;
  defaultValue?: string;
  value?: string; // Value populated during execution
}

export interface Runbook {
  id: string;
  title: string;
  description: string;
  author?: string;
  version?: string;
  lastUpdated?: string;
  variables: RunbookVariable[];
  steps: RunbookStep[];
}
