"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeEmailHeaders } from "@/lib/email-audit";

export default function EmailAnalyzerPage() { return <ConfigAuditTool title="Email Security Analyzer" description="Inspect pasted email headers locally for SPF, DKIM, DMARC and phishing indicators." placeholder={'Authentication-Results: mx.example; spf=fail; dkim=fail; dmarc=fail\nFrom: Finance <finance@example.com>\nReply-To: finance-team@external.example\nReceived: from ...'} analyzer={analyzeEmailHeaders} />; }
