# Toolbox

Local-first toolbox for sysadmin, networking, blue-team and DevOps work. It includes calculators, configuration generators, incident/runbook builders, MITRE ATT&CK references, log/PCAP helpers and encoding/development utilities.

## Run locally

```bash
npm install
npm run dev       # http://localhost:3501
```

Production checks:

```bash
npm test
npm run lint
npm run build
npm run check       # typecheck + tests + lint regression gate + build
npm run test:routes # HTTP smoke against localhost:3501 (start dev first)
```

Most tools process input in the browser. Exceptions are labelled in the catalogue: the public-domain scorecard contacts the target server, HIBP uses the k-anonymity API, and the incident-report PDF exporter loads pdfmake and fonts from cdnjs. Do not paste secrets, credentials, production tokens or sensitive logs into any tool unless you have verified its data flow.

## Product foundation

The home catalogue and command palette share the tool registry and search engine. Filter all 60 tools by category, favorites or external-service use. Guided workflows link existing tools for investigation, network changes and recovery; data transfer between steps is currently manual.

Favorites and recent tool IDs remain in memory unless device storage is enabled. The footer's Storage preferences dialog can change that choice at any time. Disabling saving removes application-owned persisted data, including supported drafts, while leaving unrelated browser storage alone. Existing favorites are migrated to a validated, versioned format. Recent tools never store inputs.

Strict lint has pre-existing debt. The quality workflow rejects increases against a per-file/rule baseline without disabling lint rules. See [phase 2 QA and remaining work](docs/phase-2-qa.md) for evidence and limits.

## Security model

- The domain scorecard accepts public DNS names only and rejects private, loopback, link-local, multicast and reserved resolutions.
- Imported ACLs, runbooks and playbooks are schema-validated and size-limited before entering application state.
- Draft persistence uses browser local storage only after the application’s storage-consent setting allows it.
- Generated commands are references, not an approval of the resulting change. Review vendor syntax, object dependencies, interface names, scope and ordering before applying them.
- MITRE links point to official ATT&CK technique pages. The embedded reference data is a curated snapshot and should be refreshed against the current ATT&CK version before formal reporting.

## Current limitations

This is a client-side toolbox, not a replacement for a SIEM, EDR, cloud console or configuration-management system. It does not execute commands, validate configurations against live vendor devices, or provide authenticated multi-user storage. The scorecard is an informational HTTP/TLS check and is not a full vulnerability assessment.
