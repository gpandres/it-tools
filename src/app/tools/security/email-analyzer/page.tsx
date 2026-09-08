"use client";

import { ConfigAuditTool, type AuditRule } from "@/components/config-audit-tool";

const rules: AuditRule[] = [
  { id: "spf", label: "SPF soft fail or fail", severity: "medium", pattern: /spf=(?:softfail|fail|neutral)/i, explanation: "The Authentication-Results header does not show a passing SPF result.", fix: "Review the sending service and SPF policy; do not treat SPF alone as proof of identity." },
  { id: "dkim", label: "DKIM failure", severity: "high", pattern: /dkim=(?:fail|none|temperror|permerror)/i, explanation: "The message signature is missing or did not validate.", fix: "Verify the signing domain, selector and message integrity." },
  { id: "dmarc", label: "DMARC failure", severity: "high", pattern: /dmarc=(?:fail|none|temperror|permerror)/i, explanation: "The message does not pass DMARC alignment or has no usable DMARC result.", fix: "Check From-domain alignment with SPF/DKIM and enforce DMARC gradually." },
  { id: "external", label: "External sender", severity: "low", pattern: /(?:from|return-path):[^\n]*(?:gmail|outlook|protonmail|yahoo)\./i, explanation: "The header appears to use a consumer mailbox domain.", fix: "Validate the business context and inspect the complete Received chain." },
  { id: "replyto", label: "Reply-To mismatch", severity: "medium", pattern: /from:([^\n]+)[\s\S]*reply-to:(?!\1)/i, explanation: "From and Reply-To addresses may point to different identities.", fix: "Confirm the expected workflow out of band before replying or opening links." },
];

export default function EmailAnalyzerPage() { return <ConfigAuditTool title="Email Security Analyzer" description="Inspect pasted email headers locally for SPF, DKIM, DMARC and phishing indicators." placeholder={'Authentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail\nFrom: Finance <finance@example.com>\nReply-To: finance-team@external.example\nReceived: from ...'} rules={rules} />; }
