"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeAdPath } from "@/lib/ad-path-audit";

export default function AdPathAnalyzerPage() { return <ConfigAuditTool title="Active Directory Attack Path Analyzer" description="Review pasted BloodHound-style paths or relationship exports locally and prioritize Tier 0 exposure." placeholder={'User: analyst\nMemberOf: Helpdesk\nRelationship: GenericAll\nTarget: Domain Admins\nadminCount: 1'} analyzer={analyzeAdPath} />; }
