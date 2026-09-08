"use client";

import { ConfigAuditTool } from "@/components/config-audit-tool";
import { analyzeDockerfile } from "@/lib/dockerfile-audit";

export default function DockerfileLinterPage() { return <ConfigAuditTool title="Dockerfile Security Linter" description="Review Dockerfiles for unsafe base images, privilege, secrets and supply-chain risks." placeholder={'FROM ubuntu:latest\n\nRUN apt-get update && apt-get install -y curl\nENV API_KEY=replace-me\n\nCMD ["./app"]'} analyzer={analyzeDockerfile} />; }
