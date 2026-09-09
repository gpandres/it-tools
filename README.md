# IT_TOOLS

IT_TOOLS is a local-first, browser-based toolbox for sysadmins, network engineers, DevOps practitioners and security teams. It turns common operational tasks into focused utilities that are fast to run, easy to inspect and safe to use during day-to-day work, troubleshooting, incident response and authorized security testing.

The project is intentionally practical: calculators produce usable engineering values, generators produce reviewable configuration, references reduce lookup time, and builders help document repeatable procedures. The application does not execute commands against infrastructure and is not intended to replace a SIEM, EDR, cloud console or configuration-management platform.

**Current release:** `v0.1.2`

**MITRE ATT&CK data:** curated Enterprise snapshot based on `v19.2`

**Runtime:** Next.js, React and TypeScript
**Operating model:** local processing by default, with a small number of clearly marked network-dependent tools

## What the project provides

- A searchable catalogue of **80 tools** with category filters, favorites and recently opened tools.
- Network calculators and multi-vendor configuration generators for real operational work.
- Blue-team references for MITRE ATT&CK, Windows events, Sysmon, Linux telemetry and detection engineering.
- Local investigation, IOC, log, PCAP, certificate, metadata and timeline utilities.
- Authorized red-team planning and analysis helpers that keep payloads and scope under user control.
- DevOps security analysis for Dockerfiles, Kubernetes manifests, Terraform, SBOMs, secrets and GitHub Actions.
- Interactive runbook and playbook builders with list and diagram views, validation, import/export and PDF/PNG support where applicable.
- Browser-side encoding, cryptography, text, SQL and developer utilities.
- A shared registry that powers navigation, search, category counts, SEO metadata and related-tool links.

## Tool catalogue

All links below are application routes. The catalogue in `src/lib/tools.ts` is the source of truth for names, categories, descriptions and data-flow metadata.

### Networking

- [Network Diagram Generator](/tools/network/diagram) — Create, edit and export network topology diagrams interactively.
- [Subnetting Calculator](/tools/network/subnet) — Calculate network addresses, broadcast, ranges and wildcard masks.
- [IPv6 Calculator](/tools/network/ipv6) — Expand, compress and calculate IPv6 subnets and network ranges.
- [Interface Config Generator](/tools/network/interface-generator) — Generate Layer 3 interface configurations for Cisco, MikroTik, FortiGate, Juniper and Arista.
- [VLAN Calculator & Config](/tools/network/vlan) — Calculate VLAN ranges and generate 802.1Q access/trunk configurations for Cisco, MikroTik, FortiGate, Juniper and Arista.
- [MTU / MSS Calculator](/tools/network/mtu) — Calculate effective MTU and TCP MSS for network encapsulation.
- [Bandwidth Calculator](/tools/network/bandwidth) — Calculate file-transfer times and analyze the impact of RTT on TCP throughput.
- [VLSM Calculator](/tools/network/vlsm) — Divide a network into subnets of different sizes using variable-length subnet masks.
- [CIDR Converter](/tools/network/cidr) — Convert between CIDR notation and dotted-decimal subnet masks.
- [IP to Bin/Hex](/tools/network/ip-converter) — Convert IPv4 addresses between decimal, binary and hexadecimal formats.
- [MAC Validator](/tools/network/mac) — Validate MAC addresses and look up OUI/vendor information.
- [Cross-Vendor Command Reference](/tools/network/command-reference) — Translate operational intents into CLI commands for Cisco, MikroTik, FortiGate, Linux, Juniper and Arista.

### Cybersecurity / Blue Team

- [Investigation Workspace](/tools/security/investigation) — Analyze and organize indicators, logs, files and timelines in one local workspace.
- [Interactive Playbook Builder](/tools/security/playbook) — Design and execute structured security incident-response workflows.
- [Sigma Rule Builder](/tools/security/sigma-builder) — Create portable Sigma detection rules locally for SIEM and EDR workflows.
- [Email Security Analyzer](/tools/security/email-analyzer) — Inspect email headers locally for SPF, DKIM, DMARC and phishing indicators.
- [Active Directory Attack Path Analyzer](/tools/security/ad-path-analyzer) — Review BloodHound-style relationships locally and prioritize Tier 0 exposure.
- [MITRE ATT&CK Reference](/tools/security/mitre) — Search and reference MITRE ATT&CK tactics, techniques, sub-techniques and procedures.
- [Windows Events Reference](/tools/security/windows-events) — Search and reference Windows Security and Sysmon event IDs.
- [Linux Telemetry Reference](/tools/security/linux-events) — Search and reference Linux logs and audit records.
- [Incident Report Generator](/tools/security/incident-report) — Create structured IT and cybersecurity incident reports from notes, logs and timelines.
- [MITRE ATT&CK Simulator](/tools/security/mitre-simulator) — Practice mapping attack scenarios to MITRE techniques and Windows event IDs.
- [Universal ACL Builder](/tools/security/acl-builder) — Create firewall rules and compile them for Cisco, MikroTik or FortiGate.
- [ACL Simulator](/tools/security/acl-simulator) — Test ACL rules by simulating packet evaluation against a firewall policy.
- [NAT Generator](/tools/security/nat-generator) — Generate source NAT/masquerade and destination NAT/port-forwarding rules.
- [Headers & TLS Scorecard](/tools/security/scorecard) — Analyze HTTP security headers and TLS configuration for a public website.
- [Local Log Parser](/tools/security/log-parser) — Extract IPs, emails and IOCs from logs without uploading them.
- [PCAP Analyzer](/tools/security/pcap) — Analyze packet captures and flows directly in the browser.
- [URL Defanger](/tools/security/defanger) — Defang IOCs and decode corporate Safe Links for incident reports.
- [File Magic Bytes Detector](/tools/security/magic-bytes) — Detect a file’s actual type by analyzing its hexadecimal signature.
- [EXIF Analyzer & Cleaner](/tools/security/exif) — Extract image metadata or scrub it for privacy.
- [X.509 Certificate Analyzer](/tools/security/x509) — Parse PEM certificates and inspect issuer, subject, SANs and validity.
- [Log Timeline Generator](/tools/security/log-timeline) — Sort raw logs chronologically and generate a visual event timeline.
- [HIBP Password Checker](/tools/security/hibp) — Check a password against breach data using the HIBP SHA-1 k-anonymity model.

### Cybersecurity / Red Team

These tools are intended for authorized assessments, labs and training. They do not grant permission to test a system or target.

- [Rules of Engagement Builder](/tools/security/roe-builder) — Create a bounded, safety-first pentest scope document before testing.
- [HTTP Request Builder](/tools/redteam/http-request) — Build, inspect, modify and export HTTP requests locally without sending them.
- [Payload Encoder](/tools/redteam/payload-encoder) — Encode and transform security-testing payloads through a local pipeline.
- [Web Payload Lab](/tools/redteam/web-payload-lab) — Explore common web-security payloads in a local educational sandbox.
- [Reverse Shell Reference](/tools/redteam/reverse-shell-reference) — Reference common shell techniques for authorized labs and CTFs.
- [DNS Recon](/tools/redteam/dns-recon) — Analyze DNS information and organize authorized reconnaissance data.
- [Attack Surface Mapper](/tools/redteam/attack-surface) — Map assets, endpoints, technologies and findings during an authorized assessment.
- [Wordlist Analyzer](/tools/redteam/wordlist) — Analyze, filter and clean wordlists locally without uploading files.
- [Hash / Format Identifier](/tools/redteam/hash-identifier) — Identify possible hash algorithms or encoding formats from length and character set.

### Sysadmin / Infrastructure

- [Interactive Runbook Builder](/tools/sysadmin/runbook) — Build and execute structured IT operations and troubleshooting runbooks dynamically.
- [RAID Calculator](/tools/sysadmin/raid) — Calculate usable capacity, fault tolerance and theoretical RAID performance.
- [UPS Runtime Calculator](/tools/sysadmin/ups) — Estimate battery-backup time for servers, racks and network equipment.
- [Backup Window Calculator](/tools/sysadmin/backup) — Estimate backup transfer times and storage capacity for a retention policy.
- [Systemd Service Generator](/tools/sysadmin/systemd) — Construct a Linux systemd `.service` file to daemonize scripts and applications.
- [Storage Calculator](/tools/sysadmin/storage) — Convert decimal and binary storage units to understand actual disk capacity.
- [RPO / RTO Calculator](/tools/sysadmin/rpo-rto) — Visualize disaster-recovery impact through Recovery Point and Recovery Time Objectives.

### DevOps

- [Chmod Calculator](/tools/devops/chmod) — Calculate Linux file permissions with an interactive visual grid.
- [Docker Converter](/tools/devops/docker) — Convert `docker run` commands into `docker-compose.yml` files.
- [SBOM Generator](/tools/devops/sbom-generator) — Generate a local CycloneDX software bill of materials from dependency lists.
- [Dockerfile Security Linter](/tools/devops/dockerfile-linter) — Review Dockerfiles for unsafe images, privilege, embedded secrets and supply-chain risks.
- [Kubernetes Manifest Analyzer](/tools/devops/kubernetes-auditor) — Audit Kubernetes YAML for privilege, RBAC, secrets, images and workload hardening.
- [Terraform Security Analyzer](/tools/devops/terraform-analyzer) — Inspect Terraform for public exposure, weak IAM, secrets and unsafe defaults.
- [Secrets Scanner](/tools/devops/secrets-scanner) — Find common credential patterns in source, configuration, logs and environment files locally.
- [GitHub Actions Security Auditor](/tools/devops/github-actions-auditor) — Review workflows for excessive permissions, injection risks and mutable third-party actions.

### Cryptography

- [Hash Generators](/tools/crypto/hash) — Generate MD5, SHA-1, SHA-256 and SHA-512 hashes from text.
- [File Hash Analyzer](/tools/crypto/file-hash) — Verify file integrity with MD5/SHA using browser-side processing.
- [Password Gen & Audit](/tools/crypto/password) — Generate strong passwords and estimate entropy and crack time locally.

### Development

- [UUID/ULID Generator](/tools/crypto/uuid) — Generate UUID and ULID identifiers.
- [Timestamp Converter](/tools/encoding/timestamp) — Convert Unix epoch timestamps to dates, ISO 8601 and local time zones.
- [SQL Beautifier](/tools/dev/sql-beautifier) — Format and prettify raw or minified SQL queries.
- [SQL Minifier](/tools/dev/sql-minifier) — Compress SQL queries by removing unnecessary whitespace and comments.
- [.gitignore Generator](/tools/dev/gitignore) — Create useful `.gitignore` files for common projects, entirely offline.

### Encoding / Decoding

- [Base64 Encode/Decoder](/tools/encoding/base64) — Encode and decode text to and from Base64.
- [URL Encoder](/tools/encoding/url) — Encode and decode URLs and query parameters.
- [Number Base Converter](/tools/encoding/number-base) — Convert numbers between binary, octal, decimal and hexadecimal.
- [JSON / YAML Converter](/tools/encoding/json-yaml) — Convert data between JSON and YAML.
- [JWT Master Tool](/tools/encoding/jwt) — Decode and inspect JWTs locally without validating or compromising their signature.

### Text

- [Regex Tester](/tools/text/regex) — Test regular expressions against text in real time.
- [Text Diff](/tools/text/diff) — Compare two blocks of text and find their differences.
- [JSON Formatter](/tools/text/json) — Beautify and format JSON with syntax highlighting.
- [Word Counter](/tools/text/counter) — Count characters, words, lines and bytes.
- [Lorem Ipsum](/tools/text/lorem) — Generate placeholder text.

### Other Tools

- [IT Cheatsheets](/tools/other/cheatsheets) — Fast, cross-platform command references for networking, Linux, Windows and more.
- [Cron Parser](/tools/other/cron) — Parse cron expressions and translate them into human-readable text.
- [QR Code Generator](/tools/other/qr) — Generate customizable QR codes.
- [Color Converter](/tools/other/color) — Convert colors between HEX, RGB, HSL and CMYK.

## Privacy and data flow

The default design is local-first: most parsing, calculation, generation and analysis happens in the browser, and the application does not require an account or send usage analytics. The catalogue marks tools that have a non-local data flow.

| Tool | Data flow | What leaves the browser |
| --- | --- | --- |
| Headers & TLS Scorecard | Network | The public hostname being checked and the response data needed for the scorecard. It rejects private, loopback, link-local, multicast and reserved targets. |
| HIBP Password Checker | Network | Only the first five characters of the SHA-1 hash prefix, following the HIBP k-anonymity model; the full password is not sent. |
| DNS Recon | Mixed | DNS queries use an external resolver when resolving authorized reconnaissance input. |
| All other tools | Local by default | Input is processed in the browser unless the user explicitly exports, copies or shares it. |

PDF generation uses the bundled `pdfmake` package and bundled fonts locally; it does not depend on a runtime PDF CDN. Exported files are created by the browser and are not uploaded by the application.

Do not paste credentials, production tokens, private incident data or sensitive logs into any tool until you have verified the data flow relevant to your use case. Browser extensions, copied exports and user-selected external destinations are outside the application’s control.

## Product and security model

- Imported ACLs, runbooks and playbooks are schema-validated and size-limited before entering application state.
- Favorites and supported drafts use browser storage only when the user enables the application’s storage-consent setting. Recent tool IDs do not store tool inputs.
- Generated commands and configuration are references, not approvals. Review vendor syntax, object dependencies, interface names, scope, ordering and rollback steps before applying them.
- Commands that may be destructive or operationally aggressive are labelled with an in-context warning. The application does not execute them.
- MITRE links target official ATT&CK pages. The embedded data is a curated Enterprise v19.2 snapshot and should be checked against the current ATT&CK release before formal reporting or threat-intelligence publication.
- Red-team features are for systems and environments where the user has explicit authorization.
- The app is not a live validator for vendor devices, Kubernetes clusters, Terraform state, SIEM rules or network controls. Results are decision support and should be reviewed by a qualified operator.

## Architecture

```text
src/app/       Next.js routes and tool pages
src/components Shared UI, navigation, notifications and reusable action controls
src/lib/       Tool registry, data models, analyzers, calculators and export helpers
tests/         TypeScript unit and data-integrity tests
docs/          QA notes and project documentation
public/        Static assets and browser-served files
```

The tool registry in `src/lib/tools.ts` is deliberately shared by the home page, sidebar, command palette, category filters, related tools and per-tool SEO metadata. A tool should be added to the registry and its route rather than duplicated in separate navigation lists.

The application is a static-friendly Next.js client experience. Tool state is generally ephemeral, with opt-in browser persistence for supported preferences and drafts. There is no built-in authenticated multi-user backend, server-side job queue or infrastructure execution layer.

## Local development

Requirements: Node.js with npm.

```bash
npm install
npm run dev       # http://localhost:3501
```

Useful commands:

```bash
npm test            # unit and data-integrity tests
npm run typecheck   # TypeScript without emitting files
npm run lint        # full ESLint run
npm run lint:ratchet
npm run build
npm run check       # typecheck + tests + lint regression gate + build
npm run test:routes # HTTP smoke checks against localhost:3501
```

Start the development server before running `npm run test:routes`. Browser-based QA can be performed with the repository’s agent-browser setup or manually in a supported browser.

## Quality and contribution expectations

Before opening a change:

1. Keep new processing local unless a network flow is necessary and documented.
2. Add or update tests for parsers, validators, data snapshots and security-sensitive behavior.
3. Reuse shared UI, notification and export helpers instead of creating one-off implementations.
4. Keep tool metadata, route names, SEO text and README entries consistent with `src/lib/tools.ts`.
5. Test empty, malformed, oversized and adversarial input as well as the normal happy path.
6. Review generated commands and examples for safe defaults, accurate vendor syntax and clear warnings.

The lint ratchet protects the repository from introducing new findings while existing debt is reduced separately. See [phase 2 QA and remaining work](docs/phase-2-qa.md) for the current QA evidence and known limits.

## License

This repository does not currently declare a license in `package.json` or a root `LICENSE` file. Treat it as all-rights-reserved until the project owner publishes explicit licensing terms.
