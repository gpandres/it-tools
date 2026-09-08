"use client";

import { useState, useEffect, Suspense } from "react";
import { ToolLayout } from "@/components/tool-layout";
import { Play, Shield, ShieldAlert, Terminal, RefreshCw, CheckCircle2, XCircle, Skull, Shuffle, Plus, Share2, Copy, Info, Monitor, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import { MITRE_DB, MITRE_VERSION, MitreDef } from "@/lib/mitre-db";
import { WIN_EVENTS_DB, WinEventDef } from "@/lib/windows-events-db";
import { LINUX_EVENTS_DB, LinuxEventDef } from "@/lib/linux-events-db";

// --- Types ---
type TileType = "mitre" | "event";

type Tile = { id: string; type: TileType; label: string; };

type ScenarioStep = { id: string; description: string; requiredMitreId: string; requiredEventId: string; };

type Scenario = {
  id: string;
  title: string;
  description: string;
  platform: "Windows" | "Linux";
  steps: ScenarioStep[];
  pool?: Tile[]; 
};

type ModalData = 
  | { type: "mitre", data: MitreDef }
  | { type: "windows", data: WinEventDef }
  | { type: "linux", data: LinuxEventDef };

// --- Helper Functions ---
const T = (id: string, label: string): Tile => ({ id, type: "mitre", label });
const E = (id: string, label: string): Tile => ({ id, type: "event", label });

function encodeScenario(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeScenario(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function localSubtechniques(def: MitreDef): MitreDef[] {
  return MITRE_DB.filter(item => item.parentId === def.id || (!item.parentId && item.id.startsWith(`${def.id}.`)));
}

// --- Procedural Generation Engine ---
const VECTORS = [
  {
    name: "Privilege Escalation Chain",
    desc: "A focused escalation exercise covering token abuse, vulnerable services, scheduled execution and identity policy changes.",
    windows_phases: [
      [
        { desc: "A low-integrity process starts a new process with an administrator token.", mitre: "T1134.002", event: "4688" },
        { desc: "The attacker injects code into a higher-privileged process to inherit its context.", mitre: "T1055.002", event: "Sysmon 10" },
      ],
      [
        { desc: "A vulnerable local service is exploited to execute code as SYSTEM.", mitre: "T1068", event: "Sysmon 1" },
        { desc: "A writable scheduled task is modified to run an elevated payload.", mitre: "T1053.005", event: "4698" },
      ],
      [
        { desc: "The attacker bypasses User Account Control without a consent prompt.", mitre: "T1548.002", event: "4688" },
        { desc: "A domain Group Policy Object is changed to grant elevated rights.", mitre: "T1484.001", event: "5136" },
      ],
      [
        { desc: "A compromised account is used to access an administrator-only resource.", mitre: "T1078.002", event: "4624" },
        { desc: "A service account receives an additional role with administrative permissions.", mitre: "T1098.003", event: "Cloud Audit" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A setuid binary is abused to execute a command as its owning user.", mitre: "T1548.001", event: "auditd EXECVE" },
        { desc: "The attacker uses sudo privileges and an unsafe sudoers rule to become root.", mitre: "T1548.003", event: "auditd USER_CMD" },
      ],
      [
        { desc: "A vulnerable kernel or privileged service is exploited to obtain root access.", mitre: "T1068", event: "auditd EXECVE" },
        { desc: "The attacker uses ptrace to inject code into a privileged process.", mitre: "T1055.008", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A systemd service is modified so it starts a root-owned payload.", mitre: "T1543.002", event: "auditd SYSCALL" },
        { desc: "A container escapes its isolation boundary and reaches the host namespace.", mitre: "T1611", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A PAM module is altered to grant access through the authentication path.", mitre: "T1556.003", event: "auditd SYSCALL" },
        { desc: "A compromised domain account is used to access a privileged Linux service.", mitre: "T1078.002", event: "auth.log" },
      ]
    ]
  },
  {
    name: "Persistence & Identity Abuse",
    desc: "A persistence-focused investigation spanning autostart, services, cloud identity and authentication hooks.",
    windows_phases: [
      [
        { desc: "The payload adds a Registry Run Key so it starts when the user logs on.", mitre: "T1547.001", event: "Sysmon 13" },
        { desc: "The attacker creates a new local account for fallback access.", mitre: "T1136.001", event: "4720" },
      ],
      [
        { desc: "A malicious Windows service is created to run the payload as a background process.", mitre: "T1543.003", event: "7045" },
        { desc: "An Office template is modified to load attacker-controlled code when Word starts.", mitre: "T1137.001", event: "Sysmon 11" },
      ],
      [
        { desc: "The attacker adds a second cloud role to an account they control.", mitre: "T1098.003", event: "CloudTrail IAM" },
        { desc: "A conditional-access policy is weakened to preserve access after credential rotation.", mitre: "T1556.009", event: "Cloud Audit" },
      ],
      [
        { desc: "The attacker modifies a service registry value to change the persistent executable.", mitre: "T1112", event: "Sysmon 13" },
        { desc: "The attacker adds a PowerShell profile hook that runs at every interactive shell start.", mitre: "T1546.013", event: "4688" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A malicious systemd service is installed and enabled for persistence.", mitre: "T1543.002", event: "auditd SYSCALL" },
        { desc: "An attacker-controlled SSH key is appended to a user's authorized_keys file.", mitre: "T1098.004", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A shell profile is modified so every login sources an attacker-controlled command.", mitre: "T1546.004", event: "auditd SYSCALL" },
        { desc: "A systemd timer launches a payload after the host boots.", mitre: "T1053.006", event: "auditd EXECVE" },
      ],
      [
        { desc: "A malicious PAM module is registered in the authentication path.", mitre: "T1556.003", event: "auditd SYSCALL" },
        { desc: "A container service is modified so a backdoored workload is started automatically.", mitre: "T1543.005", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A udev rule is added to run a command when a device is connected.", mitre: "T1546.017", event: "auditd SYSCALL" },
        { desc: "A cloud account is created for continued access to the tenant.", mitre: "T1136.003", event: "Cloud Audit" },
      ]
    ]
  },
  {
    name: "Execution & Runtime Abuse",
    desc: "A hands-on execution chain covering native APIs, service and scheduled execution, trusted developer utilities and container administration.",
    windows_phases: [
      [
        { desc: "A signed developer utility loads an attacker-controlled build task to proxy code execution.", mitre: "T1127.001", event: "4688" },
        { desc: "A malicious DLL is loaded through a trusted application during startup.", mitre: "T1574.001", event: "Sysmon 7" },
      ],
      [
        { desc: "The operator invokes a Windows service to launch the payload under its configured account.", mitre: "T1569.002", event: "7045" },
        { desc: "A BITS job transfers a payload and invokes it when the transfer completes.", mitre: "T1197", event: "Sysmon 1" },
      ],
      [
        { desc: "The payload calls native operating-system APIs to create a process without spawning a shell.", mitre: "T1106", event: "Sysmon 1" },
        { desc: "A scheduled task launches a script at a defined time to continue execution.", mitre: "T1053.005", event: "4698" },
      ],
      [
        { desc: "An attacker uses WMI to execute a command on a Windows host.", mitre: "T1047", event: "4688" },
        { desc: "A cloud administration command runs a script inside a managed virtual machine.", mitre: "T1651", event: "4688" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A malicious shared library is loaded by a legitimate process through the dynamic linker.", mitre: "T1574.006", event: "auditd EXECVE" },
        { desc: "A container orchestration job starts a workload containing an attacker-controlled command.", mitre: "T1053.007", event: "auditd EXECVE" },
      ],
      [
        { desc: "The operator starts a malicious systemd service through systemctl.", mitre: "T1569.003", event: "auditd EXECVE" },
        { desc: "A systemd timer schedules a payload to run after a defined interval.", mitre: "T1053.006", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The payload invokes native system APIs to create a process and avoid a visible shell.", mitre: "T1106", event: "auditd EXECVE" },
        { desc: "The attacker uses a container administration API to execute a command in a running workload.", mitre: "T1609", event: "auditd EXECVE" },
      ],
      [
        { desc: "A cloud automation service runs an attacker-controlled script in a managed Linux VM.", mitre: "T1651", event: "auditd EXECVE" },
        { desc: "The attacker deploys a privileged container to execute a payload on a cluster node.", mitre: "T1610", event: "auditd EXECVE" },
      ]
    ]
  },
  {
    name: "Phishing & Ransomware",
    desc: "A client-side compromise starting with a phishing email and ending in massive data encryption.",
    windows_phases: [
      [
        { desc: "Attacker sends an email with a malicious macro-enabled Word document.", mitre: "T1566.001", event: "none" },
        { desc: "Victim receives a spearphishing link pointing to a fake login portal.", mitre: "T1566.002", event: "Sysmon 22" },
      ],
      [
        { desc: "The macro executes an obfuscated PowerShell script in the background.", mitre: "T1059.001", event: "Sysmon 1" },
        { desc: "The user downloads a disguised executable and double-clicks it.", mitre: "T1204.002", event: "Sysmon 1" },
      ],
      [
        { desc: "Malware dumps LSASS memory using a custom procdump technique.", mitre: "T1003.001", event: "Sysmon 10" },
        { desc: "Malware searches local browser databases for saved passwords.", mitre: "T1555.003", event: "Sysmon 1" },
      ],
      [
        { desc: "The malware encrypts all user documents and drops a ransom note.", mitre: "T1486", event: "Sysmon 11" },
        { desc: "Malware disables Windows Defender via PowerShell cmdlets.", mitre: "T1562.001", event: "Sysmon 1" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Employee receives an email with a malicious PDF attachment that exploits a local viewer.", mitre: "T1566.001", event: "none" },
        { desc: "Victim is tricked into running a curl command copied from a fake IT portal.", mitre: "T1204.004", event: "auditd EXECVE" },
      ],
      [
        { desc: "A malicious bash script is executed to download a secondary payload.", mitre: "T1059.004", event: "auditd EXECVE" },
        { desc: "The attacker drops a python script to run silently in the background.", mitre: "T1059.004", event: "auditd SYSCALL" },
      ],
      [
        { desc: "Malware searches local browser databases for saved passwords.", mitre: "T1555.003", event: "auditd SYSCALL" },
        { desc: "Attacker attempts to read /etc/shadow directly.", mitre: "T1003.008", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The malware encrypts all user home directories.", mitre: "T1486", event: "auditd SYSCALL" },
        { desc: "Malware echoes empty strings into /var/log/syslog to hide its tracks.", mitre: "T1070.002", event: "syslog" },
      ]
    ]
  },
  {
    name: "Web Exploitation to Data Theft",
    desc: "An attacker exploits a vulnerability on a public-facing web server to steal sensitive databases.",
    windows_phases: [
      [
        { desc: "Attacker exploits an RCE vulnerability on a public IIS server.", mitre: "T1190", event: "none" },
      ],
      [
        { desc: "An ASPX web shell is written to the webroot directory.", mitre: "T1505.003", event: "Sysmon 11" },
      ],
      [
        { desc: "The attacker dumps the SAM registry hive.", mitre: "T1003.002", event: "Sysmon 1" },
      ],
      [
        { desc: "The stolen data is exfiltrated to an external MEGA cloud account.", mitre: "T1567.002", event: "Sysmon 3" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Attacker exploits an RCE vulnerability (e.g. Log4Shell) on a public Apache server.", mitre: "T1190", event: "none" },
      ],
      [
        { desc: "A PHP web shell is written to the /var/www/html/uploads directory.", mitre: "T1505.003", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The attacker dumps local /etc/shadow.", mitre: "T1003.008", event: "auditd EXECVE" },
      ],
      [
        { desc: "The stolen data is exfiltrated to an external MEGA cloud account.", mitre: "T1567.002", event: "auditd EXECVE" },
      ]
    ]
  },
  {
    name: "The Insider Threat",
    desc: "A disgruntled employee abuses valid credentials to destroy company data and hide their tracks.",
    windows_phases: [
      [
        { desc: "Employee logs into an internal file server via RDP.", mitre: "T1021.001", event: "4624" },
      ],
      [
        { desc: "Employee accesses the sensitive 'HR_Confidential' network share.", mitre: "T1135", event: "5140" },
      ],
      [
        { desc: "Employee uses wevtutil to completely clear the Windows Security Event logs.", mitre: "T1070.001", event: "1102" },
      ],
      [
        { desc: "Employee permanently deletes the primary financial databases.", mitre: "T1485", event: "Sysmon 23" },
      ]
    ],
    linux_phases: [
      [
        { desc: "Employee logs into an internal database server via SSH.", mitre: "T1021.004", event: "auth.log" },
      ],
      [
        { desc: "Employee uses sudo to elevate to root.", mitre: "T1548.003", event: "auditd USER_CMD" },
      ],
      [
        { desc: "Employee deletes their own bash history to prevent auditing.", mitre: "T1070.003", event: "bash_history" },
      ],
      [
        { desc: "Employee permanently deletes the primary financial databases.", mitre: "T1485", event: "auditd EXECVE" },
      ]
    ]
  },
  {
    name: "Supply Chain & Persistence",
    desc: "A trusted vendor update introduces a backdoor that establishes deep persistence on the system.",
    windows_phases: [
      [
        { desc: "Victim installs a digitally signed but backdoored update of a popular tool.", mitre: "T1195", event: "none" },
      ],
      [
        { desc: "The backdoor establishes a beacon encapsulated in DNS queries.", mitre: "T1071.004", event: "Sysmon 22" },
      ],
      [
        { desc: "The payload creates a new Windows Service to ensure it runs on every boot.", mitre: "T1543.003", event: "7045" },
      ],
      [
        { desc: "The malware creates a Scheduled Task to run silently every hour.", mitre: "T1053.005", event: "4698" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A developer installs a malicious npm package via typo-squatting.", mitre: "T1195", event: "none" },
      ],
      [
        { desc: "The backdoor reaches out to a C2 server to download a secondary payload.", mitre: "T1105", event: "auditd EXECVE" },
      ],
      [
        { desc: "The payload creates a malicious systemd unit file for persistence.", mitre: "T1543.002", event: "syslog" },
      ],
      [
        { desc: "The malware adds an entry to /etc/crontab to run a reverse shell.", mitre: "T1053.003", event: "auditd SYSCALL" },
      ]
    ]
  },
  {
    name: "Discovery & Environment Mapping",
    desc: "An enumeration exercise covering identity, endpoint, network, services, cloud and container discovery before lateral movement.",
    windows_phases: [
      [
        { desc: "The operator enumerates local and domain accounts to identify privileged targets.", mitre: "T1087.002", event: "4798" },
        { desc: "Local and domain group membership is queried for escalation paths.", mitre: "T1069.002", event: "4799" },
      ],
      [
        { desc: "Running processes, installed security products and services are inventoried.", mitre: "T1057", event: "Sysmon 1" },
        { desc: "The host's operating system, patch level and hardware are collected.", mitre: "T1082", event: "4688" },
      ],
      [
        { desc: "Network configuration, connections and nearby shares are enumerated.", mitre: "T1016", event: "5156" },
        { desc: "Remote systems and exposed services are probed for lateral movement.", mitre: "T1018", event: "5156" },
      ],
      [
        { desc: "Cloud services and storage objects are listed using a management identity.", mitre: "T1526", event: "Cloud Audit" },
        { desc: "Domain trusts and Group Policy settings are collected.", mitre: "T1482", event: "4662" },
      ],
    ],
    linux_phases: [
      [
        { desc: "Local users, groups and the current account context are enumerated.", mitre: "T1087.001", event: "auditd EXECVE" },
        { desc: "Processes, services and installed software are listed from the host.", mitre: "T1007", event: "auditd EXECVE" },
      ],
      [
        { desc: "Interfaces, routes, connections and neighboring systems are collected.", mitre: "T1016", event: "auditd EXECVE" },
        { desc: "Listening ports and network services are scanned before pivoting.", mitre: "T1046", event: "auditd SYSCALL" },
      ],
      [
        { desc: "Mounted disks and local storage capacity are enumerated before targeting data.", mitre: "T1680", event: "auditd EXECVE" },
        { desc: "System logs are enumerated for usernames, hosts and security tooling.", mitre: "T1654", event: "auditd SYSCALL" },
      ],
      [
        { desc: "Container images, pods, nodes and cluster resources are listed.", mitre: "T1613", event: "auditd EXECVE" },
        { desc: "Cloud infrastructure and storage objects are queried through APIs.", mitre: "T1580", event: "Cloud Audit" },
      ],
    ],
  },
  {
    name: "Impact & Business Disruption",
    desc: "A destructive-activity investigation covering access denial, encryption, recovery inhibition, service disruption and cloud resource abuse.",
    windows_phases: [
      [
        { desc: "Administrative access is removed from a group of critical user accounts before the destructive action.", mitre: "T1531", event: "4725" },
        { desc: "A recovery service and its associated backup configuration are disabled.", mitre: "T1490", event: "7036" },
      ],
      [
        { desc: "A ransomware process encrypts files across a workstation and its reachable shares.", mitre: "T1486", event: "Sysmon 11" },
        { desc: "A critical service is stopped, causing an application outage.", mitre: "T1489", event: "7036" },
      ],
      [
        { desc: "A cloud workload consumes unusual compute resources under a compromised identity.", mitre: "T1496.001", event: "Cloud Audit" },
        { desc: "A large number of requests exhausts an exposed application endpoint.", mitre: "T1499.003", event: "IIS Log" },
      ],
      [
        { desc: "Files are overwritten on a targeted disk, leaving the host unable to boot normally.", mitre: "T1561.002", event: "Sysmon 1" },
        { desc: "Stored records are altered to corrupt operational decision-making.", mitre: "T1565.001", event: "4663" },
      ],
    ],
    linux_phases: [
      [
        { desc: "Privileged accounts are locked or their credentials are changed to remove legitimate access.", mitre: "T1531", event: "auditd USER_CHAUTHTOK" },
        { desc: "Local recovery services and backup targets are removed before encryption.", mitre: "T1490", event: "auditd EXECVE" },
      ],
      [
        { desc: "A process encrypts files across mounted home directories and shared storage.", mitre: "T1486", event: "auditd SYSCALL" },
        { desc: "A critical systemd service is stopped to interrupt application availability.", mitre: "T1489", event: "syslog" },
      ],
      [
        { desc: "A container workload consumes excessive CPU on a shared cluster node.", mitre: "T1496.001", event: "Cloud Audit" },
        { desc: "Repeated resource-intensive requests exhaust a public application service.", mitre: "T1499.003", event: "nginx access.log" },
      ],
      [
        { desc: "Disk structures are corrupted so the host cannot boot into its normal operating system.", mitre: "T1561.002", event: "auditd EXECVE" },
        { desc: "A database record is altered at rest to affect an operational workflow.", mitre: "T1565.001", event: "auditd SYSCALL" },
      ],
    ],
  },
  {
    name: "Collection to Exfiltration",
    desc: "A data-loss investigation follows sensitive files from staging to an external destination over web services, alternate protocols and scheduled transfers.",
    windows_phases: [
      [
        { desc: "A process prepares a large document set for automated transfer after a collection burst.", mitre: "T1020", event: "Sysmon 1" },
        { desc: "The archive is split into fixed-size chunks before leaving the endpoint.", mitre: "T1030", event: "Sysmon 1" },
      ],
      [
        { desc: "The compromised account uploads an archive to an external cloud-storage service.", mitre: "T1567.002", event: "Cloud Audit" },
        { desc: "A second transfer uses a protocol different from the established C2 channel.", mitre: "T1048.003", event: "5156" },
      ],
      [
        { desc: "A scheduled job transfers small batches outside the normal business window.", mitre: "T1029", event: "4698" },
        { desc: "A webhook receives data from a process that has no approved integration.", mitre: "T1567.004", event: "Sysmon 3" },
      ],
      [
        { desc: "A cloud account under the actor's control receives a copied dataset through a sharing operation.", mitre: "T1537", event: "Cloud Audit" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A job automatically processes and transfers a set of sensitive files after collection.", mitre: "T1020", event: "auditd EXECVE" },
        { desc: "The dataset is sent in bounded chunks to stay below network transfer thresholds.", mitre: "T1030", event: "auditd EXECVE" },
      ],
      [
        { desc: "An archive is uploaded to an external cloud-storage account over an approved-looking web service.", mitre: "T1567.002", event: "auditd EXECVE" },
        { desc: "Data leaves over an alternate unencrypted protocol rather than the implant's normal channel.", mitre: "T1048.003", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A timer schedules repeated transfers during a quiet period overnight.", mitre: "T1029", event: "syslog" },
        { desc: "A webhook endpoint receives files from a process running under a service account.", mitre: "T1567.004", event: "auditd EXECVE" },
      ],
      [
        { desc: "A cloud sharing or synchronization operation moves the dataset into an external account.", mitre: "T1537", event: "Cloud Audit" },
      ],
    ],
  },
  {
    name: "Command and Control Investigation",
    desc: "A C2 investigation that correlates beaconing, protocol abuse, encoding, proxying and remote-access activity across endpoint and network telemetry.",
    windows_phases: [
      [
        { desc: "A workstation makes periodic HTTPS requests to a rare external domain with a stable beacon interval.", mitre: "T1071.001", event: "Sysmon 22" },
        { desc: "DNS queries contain unusually long, encoded labels and a low-volume recurring pattern.", mitre: "T1071.004", event: "DNS Query" },
      ],
      [
        { desc: "The payload encodes command traffic using a standard representation before transmission.", mitre: "T1132.001", event: "Sysmon 3" },
        { desc: "A process connects through an internal proxy to reach another compromised host.", mitre: "T1090.001", event: "5156" },
      ],
      [
        { desc: "A remote-access application creates an interactive session outside the approved support window.", mitre: "T1219.002", event: "4688" },
        { desc: "A second-stage payload is transferred into the host over the active command channel.", mitre: "T1105", event: "Sysmon 11" },
      ],
      [
        { desc: "The endpoint falls back to a non-standard port after the primary destination becomes unavailable.", mitre: "T1571", event: "5156" },
        { desc: "A traffic-signaling sequence precedes access to a service that is normally closed.", mitre: "T1205.001", event: "Firewall Log" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A daemon periodically resolves a rare domain and sends small HTTPS requests with a stable interval.", mitre: "T1071.001", event: "auditd EXECVE" },
        { desc: "DNS requests contain encoded subdomains that are inconsistent with normal resolver use.", mitre: "T1071.004", event: "DNS Query" },
      ],
      [
        { desc: "C2 messages use non-standard encoding to conceal command content from simple inspection.", mitre: "T1132.002", event: "auditd EXECVE" },
        { desc: "The compromised host relays traffic through an internal proxy or pivot service.", mitre: "T1090.001", event: "auditd SYSCALL" },
      ],
      [
        { desc: "An IDE tunnel creates remote development access from an unusual user session.", mitre: "T1219.001", event: "auth.log" },
        { desc: "A second-stage tool is downloaded into a temporary directory.", mitre: "T1105", event: "auditd EXECVE" },
      ],
      [
        { desc: "The implant switches to a non-application protocol when its normal channel is blocked.", mitre: "T1095", event: "auditd SYSCALL" },
        { desc: "A port-knocking sequence is followed by a new listening service.", mitre: "T1205.001", event: "firewalld" },
      ],
    ],
  },
  {
    name: "Collection & Data Staging",
    desc: "A collection exercise that follows sensitive data from endpoints, repositories and shared storage into local and remote staging areas.",
    windows_phases: [
      [
        { desc: "A suspicious process reads clipboard contents and captures an operator's screen during an active session.", mitre: "T1115", event: "Sysmon 1" },
        { desc: "A process captures screenshots from a workstation outside the approved support workflow.", mitre: "T1113", event: "Sysmon 1" },
      ],
      [
        { desc: "Sensitive documents are enumerated and copied from a local user profile.", mitre: "T1005", event: "4663" },
        { desc: "Messages are collected from a local mailbox database by an unexpected process.", mitre: "T1114.001", event: "4663" },
      ],
      [
        { desc: "A code repository is queried for source, configuration and deployment data.", mitre: "T1213.003", event: "Cloud Audit" },
        { desc: "Collected files are staged in a local working directory before transfer.", mitre: "T1074.001", event: "Sysmon 11" },
      ],
      [
        { desc: "Collected files are compressed with a trusted archiving utility.", mitre: "T1560.001", event: "Sysmon 1" },
        { desc: "Sensitive data is copied from a network share accessed by the compromised account.", mitre: "T1039", event: "5140" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A process reads clipboard data and records input from an interactive desktop session.", mitre: "T1115", event: "auditd SYSCALL" },
        { desc: "A user-session process captures video or screenshots outside the expected desktop workflow.", mitre: "T1113", event: "auditd EXECVE" },
      ],
      [
        { desc: "Sensitive files are searched and copied from local home and application directories.", mitre: "T1005", event: "auditd SYSCALL" },
        { desc: "A local mail store is read by a process that does not normally access it.", mitre: "T1114.001", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A self-hosted code repository or database is queried for secrets and operational records.", mitre: "T1213.006", event: "auditd EXECVE" },
        { desc: "Collected files are placed in a hidden local staging directory.", mitre: "T1074.001", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The staged dataset is archived through a library or custom packer.", mitre: "T1560.002", event: "auditd EXECVE" },
        { desc: "Data is collected from a mounted network share before exfiltration.", mitre: "T1039", event: "auditd SYSCALL" },
      ],
    ],
  },
  {
    name: "Credential Access Hunt",
    desc: "A credential-theft investigation spanning password stores, credential dumping, Kerberos abuse, MFA pressure and unsecured files.",
    windows_phases: [
      [
        { desc: "A suspicious process reads browser credential databases from a user profile.", mitre: "T1555.003", event: "Sysmon 11" },
        { desc: "A process accesses LSASS memory from an unexpected administrative tool.", mitre: "T1003.001", event: "Sysmon 10" },
      ],
      [
        { desc: "A service account ticket is requested and prepared for offline password cracking.", mitre: "T1558.003", event: "4769" },
        { desc: "Repeated authentication attempts target many accounts with one common password.", mitre: "T1110.003", event: "4625" },
      ],
      [
        { desc: "An attacker accesses a domain controller replication interface from an unusual host.", mitre: "T1003.006", event: "4662" },
        { desc: "A malicious process captures credentials through an API hook.", mitre: "T1056.004", event: "Sysmon 7" },
      ],
      [
        { desc: "A private key and configuration file containing credentials are read from a project directory.", mitre: "T1552.004", event: "4663" },
        { desc: "A stolen web session cookie is replayed to access a SaaS application.", mitre: "T1539", event: "Cloud Audit" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A process reads `/etc/shadow` and nearby account files outside a normal administration workflow.", mitre: "T1003.008", event: "auditd SYSCALL" },
        { desc: "A command searches shell history for passwords and tokens.", mitre: "T1552.003", event: "auditd EXECVE" },
      ],
      [
        { desc: "A process inspects `/proc/<pid>/mem` to collect credential material.", mitre: "T1003.007", event: "auditd SYSCALL" },
        { desc: "A Kerberos ccache file is copied from a user profile for reuse.", mitre: "T1558.005", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A malicious PAM module is introduced into the authentication path.", mitre: "T1556.003", event: "auditd SYSCALL" },
        { desc: "Network traffic is captured from an interface in promiscuous mode.", mitre: "T1040", event: "auditd EXECVE" },
      ],
      [
        { desc: "A container API is queried for environment variables and service credentials.", mitre: "T1552.007", event: "auditd EXECVE" },
        { desc: "An attacker-in-the-middle position relays name-resolution authentication traffic.", mitre: "T1557.001", event: "auditd SYSCALL" },
      ],
    ],
  },
  {
    name: "Defense Impairment",
    desc: "A blue-team exercise focused on detecting firewall tampering, logging gaps, tool degradation and trust-control changes.",
    windows_phases: [
      [
        { desc: "A host firewall profile is disabled and a new inbound rule exposes a remote service.", mitre: "T1686.003", event: "4946" },
        { desc: "The Windows Event Log service is stopped to create a telemetry gap.", mitre: "T1685.001", event: "7036" },
      ],
      [
        { desc: "Security tooling configuration is modified after an administrative token is obtained.", mitre: "T1562.001", event: "4688" },
        { desc: "The attacker clears the Security event log to remove evidence of prior activity.", mitre: "T1685.005", event: "1102" },
      ],
      [
        { desc: "A code-signing policy is weakened so unsigned content can execute.", mitre: "T1553.006", event: "4688" },
        { desc: "A domain policy is changed to weaken centrally enforced controls.", mitre: "T1484.001", event: "5136" },
      ],
      [
        { desc: "An obsolete protocol or security component is selected to bypass a newer control.", mitre: "T1689", event: "Sysmon 1" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A Linux audit rule set is altered and audit collection is stopped.", mitre: "T1685.004", event: "auditd SYSCALL" },
        { desc: "The host firewall rules are changed to expose an unexpected service.", mitre: "T1686", event: "auditd EXECVE" },
      ],
      [
        { desc: "System logs under `/var/log` are cleared after suspicious command execution.", mitre: "T1685.006", event: "auditd SYSCALL" },
        { desc: "Permissions on a protected directory are weakened to bypass access controls.", mitre: "T1222.002", event: "auditd SYSCALL" },
      ],
      [
        { desc: "A PAM module is modified to weaken the authentication boundary.", mitre: "T1556.003", event: "auditd SYSCALL" },
        { desc: "A system image is downgraded to an older version with weaker protections.", mitre: "T1601.002", event: "auditd EXECVE" },
      ],
      [
        { desc: "Command history logging is prevented for an interactive shell.", mitre: "T1690", event: "auditd SYSCALL" },
        { desc: "A security component vulnerability is exploited to reduce monitoring coverage.", mitre: "T1687", event: "auditd EXECVE" },
      ],
    ],
  },
  {
    name: "Stealth & Evasion",
    desc: "A detection-focused exercise covering obfuscation, hidden artifacts, masquerading, process injection and evidence removal.",
    windows_phases: [
      [
        { desc: "The payload uses command obfuscation to conceal a PowerShell command from simple signatures.", mitre: "T1027.010", event: "4688" },
        { desc: "A malicious file is hidden with NTFS attributes in a user-writable directory.", mitre: "T1564.004", event: "Sysmon 11" },
      ],
      [
        { desc: "A trusted Windows binary proxies execution of a script-backed payload.", mitre: "T1218.005", event: "4688" },
        { desc: "The process tree is altered so the payload appears to originate from a trusted parent.", mitre: "T1036.009", event: "Sysmon 1" },
      ],
      [
        { desc: "Code is injected into a legitimate process to mask execution under a benign image.", mitre: "T1055.012", event: "Sysmon 10" },
        { desc: "The payload checks for a virtualized analysis environment before continuing.", mitre: "T1497.001", event: "Sysmon 1" },
      ],
      [
        { desc: "The attacker removes command history and timestamps a dropped file to resemble a legitimate artifact.", mitre: "T1070.003", event: "1102" },
        { desc: "A trusted-looking account name is used to blend malicious activity into normal administration.", mitre: "T1036.010", event: "4720" },
      ],
    ],
    linux_phases: [
      [
        { desc: "A compressed and encoded payload is reconstructed only in memory before execution.", mitre: "T1027.013", event: "auditd EXECVE" },
        { desc: "A hidden file is placed in a dot-directory under a user home path.", mitre: "T1564.001", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The attacker uses a dynamic-linker hijack to load a malicious shared library.", mitre: "T1574.006", event: "auditd EXECVE" },
        { desc: "Process arguments are overwritten so `/proc/<pid>/cmdline` resembles a normal daemon.", mitre: "T1036.011", event: "auditd SYSCALL" },
      ],
      [
        { desc: "Code is injected into a privileged process through `/proc` memory.", mitre: "T1055.009", event: "auditd SYSCALL" },
        { desc: "The payload delays execution and checks uptime before activating its main routine.", mitre: "T1678", event: "auditd EXECVE" },
      ],
      [
        { desc: "The attacker clears shell history and removes a temporary payload after execution.", mitre: "T1070.003", event: "auditd SYSCALL" },
        { desc: "A bind mount hides an attacker-controlled path behind a normal filesystem location.", mitre: "T1564.013", event: "auditd SYSCALL" },
      ],
    ],
  },
  {
    name: "Initial Access Entry Points",
    desc: "A multi-vector intrusion begins with targeting, delivery and abuse of an exposed access path.",
    windows_phases: [
      [
        { desc: "The attacker sends a targeted message through a third-party collaboration service.", mitre: "T1566.003", event: "4688" },
        { desc: "The attacker sends a voice lure that convinces the victim to provide access.", mitre: "T1566.004", event: "4688" },
      ],
      [
        { desc: "The attacker authenticates to an externally exposed remote service with stolen credentials.", mitre: "T1133", event: "4624" },
        { desc: "The attacker uses a compromised cloud account to enter the organization tenant.", mitre: "T1078.004", event: "4624" },
      ],
      [
        { desc: "A trusted supplier connection is used to reach the intended victim environment.", mitre: "T1199", event: "5140" },
        { desc: "A compromised software dependency is delivered to a downstream application.", mitre: "T1195.001", event: "4688" },
      ],
      [
        { desc: "The attacker exploits a weakness in an Internet-facing application.", mitre: "T1190", event: "Sysmon 3" },
        { desc: "The attacker connects a prepared device to the target network from nearby.", mitre: "T1200", event: "4624" },
      ]
    ],
    linux_phases: [
      [
        { desc: "The attacker sends a targeted message through a third-party collaboration service.", mitre: "T1566.003", event: "auth.log" },
        { desc: "The attacker uses a voice lure to convince the victim to provide access.", mitre: "T1566.004", event: "auth.log" },
      ],
      [
        { desc: "The attacker authenticates to an externally exposed SSH or VPN service.", mitre: "T1133", event: "auth.log" },
        { desc: "A trusted supplier connection is used to reach the intended victim environment.", mitre: "T1199", event: "auditd USER_LOGIN" },
      ],
      [
        { desc: "A compromised software dependency is delivered to a downstream application.", mitre: "T1195.001", event: "auditd EXECVE" },
        { desc: "The attacker uses a compromised local account to enter an exposed service.", mitre: "T1078.003", event: "auth.log" },
      ],
      [
        { desc: "The attacker exploits a weakness in an Internet-facing application.", mitre: "T1190", event: "auditd EXECVE" },
        { desc: "The attacker connects a prepared device to the target wireless network.", mitre: "T1669", event: "auth.log" },
      ]
    ]
  },
  {
    name: "DevSecOps Supply Chain",
    desc: "A compromised dependency poisons a CI/CD pipeline, persists through Python hooks and reaches a database.",
    windows_phases: [
      [
        { desc: "A developer installs a malicious package from a public registry.", mitre: "T1204.005", event: "4688" },
        { desc: "An attacker alters a workflow referenced by a pull request to run with CI permissions.", mitre: "T1677", event: "Sysmon 11" },
      ],
      [
        { desc: "The poisoned pipeline executes a container command against a build workload.", mitre: "T1059.013", event: "Sysmon 1" },
      ],
      [
        { desc: "The package plants a Python startup hook for persistence on a build host.", mitre: "T1546.018", event: "Sysmon 11" },
      ],
      [
        { desc: "The compromised job queries a production database for sensitive records.", mitre: "T1213.006", event: "Sysmon 3" },
      ]
    ],
    linux_phases: [
      [
        { desc: "A developer installs a malicious package from a public registry.", mitre: "T1204.005", event: "auditd EXECVE" },
        { desc: "An attacker modifies a CI workflow or referenced build script.", mitre: "T1677", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The poisoned pipeline executes a container CLI command in a build job.", mitre: "T1059.013", event: "auditd EXECVE" },
      ],
      [
        { desc: "The package places a .pth startup hook on the build host.", mitre: "T1546.018", event: "auditd SYSCALL" },
      ],
      [
        { desc: "The compromised job queries a production database for sensitive records.", mitre: "T1213.006", event: "auditd EXECVE" },
      ]
    ]
  }
];

const generateProceduralScenario = (): Scenario => {
  const vector = VECTORS[Math.floor(Math.random() * VECTORS.length)];
  const isWindows = Math.random() > 0.5;
  const platform = isWindows ? "Windows" : "Linux";
  const phases = isWindows ? vector.windows_phases : vector.linux_phases;
  
  const steps: ScenarioStep[] = [];
  const pool: Tile[] = [];

  phases.forEach((phase, idx) => {
    const choice = phase[Math.floor(Math.random() * phase.length)];
    steps.push({
      id: `step-${idx + 1}`,
      description: choice.desc,
      requiredMitreId: choice.mitre,
      requiredEventId: choice.event
    });
    
    pool.push(T(choice.mitre, choice.mitre));
    pool.push(E(choice.event, choice.event === "none" ? "No Event" : choice.event));
  });

  // Decoys tailored to OS
  const decoysMitreWin = ["T1566", "T1059.001", "T1003.001", "T1505.003", "T1486", "T1070.001", "T1021.001", "T1543.003", "T1055", "T1677", "T1059.013", "T1213.006", "T1686.003"];
  const decoysEventWin = ["Sysmon 1", "Sysmon 3", "Sysmon 10", "Sysmon 11", "Sysmon 22", "4624", "4688", "5140", "1102", "7045", "4698"];
  
  const decoysMitreLin = ["T1566", "T1059.004", "T1003.008", "T1505.003", "T1486", "T1070.003", "T1021.004", "T1543.002", "T1548.003", "T1546.018", "T1059.013", "T1213.006", "T1680"];
  const decoysEventLin = ["auditd EXECVE", "auditd USER_LOGIN", "auditd USER_CMD", "auditd SYSCALL", "auth.log", "syslog", "bash_history"];
  
  const decoysMitre = isWindows ? decoysMitreWin : decoysMitreLin;
  const decoysEvent = isWindows ? decoysEventWin : decoysEventLin;

  for(let i=0; i<3; i++) {
    const rm = decoysMitre[Math.floor(Math.random() * decoysMitre.length)];
    const re = decoysEvent[Math.floor(Math.random() * decoysEvent.length)];
    if (!pool.find(t => t.id === rm)) pool.push(T(rm, rm));
    if (!pool.find(t => t.id === re)) pool.push(E(re, re));
  }

  return {
    id: "procedural-" + Math.random().toString(36).substring(7),
    title: `Incident: ${vector.name}`,
    description: vector.desc,
    platform,
    steps,
    pool: pool.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
  };
};

// --- Component with Suspense ---
export default function MitreSimulatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#00ff9c] font-mono">Loading Simulator...</div>}>
      <MitreSimulator />
    </Suspense>
  );
}

function MitreSimulator() {
  const searchParams = useSearchParams();
  const sharedScenarioBase64 = searchParams.get("s");

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [simulatorMode, setSimulatorMode] = useState<"standard" | "hard">("standard");
  const isHardMode = simulatorMode === "hard";
  const [showHints, setShowHints] = useState(true);
  
  // Custom Scenario Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderTitle, setBuilderTitle] = useState("");
  const [builderDesc, setBuilderDesc] = useState("");
  const [builderPlatform, setBuilderPlatform] = useState<"Windows" | "Linux">("Windows");
  const [builderSteps, setBuilderSteps] = useState([{ desc: "", mitre: "", event: "" }]);
  const [shareLink, setShareLink] = useState("");
  const [builderError, setBuilderError] = useState("");
  const [focusedField, setFocusedField] = useState<{index: number, type: "mitre" | "event"} | null>(null);
  const [seedError, setSeedError] = useState<string>("");

  // Info Modal State
  const [infoModalData, setInfoModalData] = useState<ModalData | null>(null);

  const [pool, setPool] = useState<Tile[]>([]);
  type MappingState = { mitre: Tile | null; event: Tile | null; textMitre: string; textEvent: string; };
  const [mapping, setMapping] = useState<Record<string, MappingState>>({});
  
  const [validation, setValidation] = useState<{ isChecked: boolean, results: Record<string, { mitre: boolean, event: boolean }> }>({
    isChecked: false,
    results: {}
  });
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (sharedScenarioBase64) {
      try {
        if (sharedScenarioBase64.length > 12000) throw new Error("Payload too large");
        const decoded = decodeScenario(sharedScenarioBase64);
        if (decoded && typeof decoded === "object" && typeof decoded.title === "string" && Array.isArray(decoded.steps)) {
          
          // Strict Validation
          if (decoded.title.length > 100 || (decoded.description && decoded.description.length > 500)) {
             throw new Error("Payload text fields too long");
          }
          if (decoded.platform !== "Windows" && decoded.platform !== "Linux") {
             throw new Error("Invalid platform");
          }
          if (decoded.steps.length < 1 || decoded.steps.length > 12) throw new Error("Invalid step count");

          const customPool: Tile[] = [];
          for (const s of decoded.steps) {
            if (typeof s.description !== "string" || s.description.length > 500) throw new Error("Invalid step description");
            if (typeof s.requiredMitreId !== "string" || typeof s.requiredEventId !== "string") throw new Error("Invalid step IDs");
            
            const mitreId = s.requiredMitreId.trim().toUpperCase();
            const eventId = s.requiredEventId.trim();
            
            // Validate against DBs
            const mitreExists = MITRE_DB.some(m => m.id.toUpperCase() === mitreId);
            if (!mitreExists) throw new Error(`MITRE ID ${mitreId} does not exist in DB.`);
            
            let eventExists = false;
            if (eventId.toLowerCase() === "none" || eventId.toLowerCase() === "no event") {
              eventExists = true;
            } else if (decoded.platform === "Windows") {
              eventExists = WIN_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
            } else {
              eventExists = LINUX_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
            }
            if (!eventExists) throw new Error(`Event ID ${eventId} does not exist in ${decoded.platform} DB.`);

            customPool.push(T(mitreId, mitreId));
            customPool.push(E(eventId, eventId.toLowerCase() === "none" ? "No Event" : eventId));
            s.requiredMitreId = mitreId;
            s.requiredEventId = eventId;
          }
          
          decoded.pool = customPool;
          loadScenario(decoded as Scenario);
          window.history.replaceState({}, '', window.location.pathname);
          return;
        } else {
           throw new Error("Invalid structure");
        }
      } catch (e: any) {
        window.history.replaceState({}, '', window.location.pathname);
        setSeedError("The provided custom scenario data is corrupt, manipulated, or contains invalid telemetry IDs.");
      }
    }
    handleGenerateProcedural();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedScenarioBase64]);

  function loadScenario(sc: Scenario) {
    setScenario(sc);
    const shuffledPool = sc.pool ? [...sc.pool].sort(() => Math.random() - 0.5) : [];
    setPool(shuffledPool);
    
    const initialMapping: Record<string, MappingState> = {};
    sc.steps.forEach(s => {
      initialMapping[s.id] = { mitre: null, event: null, textMitre: "", textEvent: "" };
    });
    setMapping(initialMapping);
    setValidation({ isChecked: false, results: {} });
    setScore(null);
    setAttempts(0);
  };

  function handleGenerateProcedural() {
    loadScenario(generateProceduralScenario());
  }

  const changeSimulatorMode = (mode: "standard" | "hard") => {
    setSimulatorMode(mode);
    if (scenario) loadScenario(scenario);
  };

  // --- Builder Handlers ---
  const handleAddBuilderStep = () => {
    setBuilderSteps([...builderSteps, { desc: "", mitre: "", event: "" }]);
  };
  const handleBuilderGenerateLink = () => {
    setBuilderError("");
    setShareLink("");
    
    if (!builderTitle.trim()) {
      setBuilderError("Title is required.");
      return;
    }
    
    if (builderSteps.length === 0) {
      setBuilderError("At least one step is required.");
      return;
    }

    try {
      const steps = builderSteps.map((s, i) => {
        const mitreId = s.mitre.trim().toUpperCase() || "T1566";
        const eventId = s.event.trim() || "none";
        
        // Validate MITRE
        if (!MITRE_DB.some(m => m.id.toUpperCase() === mitreId)) {
           throw new Error(`Step ${i+1}: MITRE ID '${mitreId}' not found in database.`);
        }
        
        // Validate Event
        let eventExists = false;
        if (eventId.toLowerCase() === "none" || eventId.toLowerCase() === "no event") {
          eventExists = true;
        } else if (builderPlatform === "Windows") {
          eventExists = WIN_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
        } else {
          eventExists = LINUX_EVENTS_DB.some(e => e.id.toLowerCase() === eventId.toLowerCase());
        }
        
        if (!eventExists) {
          throw new Error(`Step ${i+1}: Event ID '${eventId}' not found in ${builderPlatform} database.`);
        }

        return {
          id: `step-${i+1}`,
          description: s.desc.trim() || "Step",
          requiredMitreId: mitreId,
          requiredEventId: eventId
        };
      });

      const sc = {
        id: "custom-" + Date.now(),
        title: builderTitle.trim(),
        description: builderDesc.trim() || "A custom incident response scenario created by a user.",
        platform: builderPlatform,
        steps: steps
      };
      const b64 = encodeScenario(sc);
      const url = `${window.location.origin}${window.location.pathname}?s=${b64}`;
      setShareLink(url);
    } catch (err: any) {
      setBuilderError(err.message);
    }
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, tile: Tile, sourceLoc: "pool" | "step", stepId?: string, stepSlotType?: TileType) => {
    if (isHardMode) return;
    e.dataTransfer.setData("application/json", JSON.stringify({ tile, sourceLoc, stepId, stepSlotType }));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent) => { if (!isHardMode) e.preventDefault(); };
  const handleDropToSlot = (e: React.DragEvent, targetStepId: string, targetSlotType: TileType) => {
    if (isHardMode) return;
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { tile, sourceLoc, stepId: sourceStepId, stepSlotType: sourceSlotType } = data;
      if (tile.type !== targetSlotType) return;

      const newMapping = { ...mapping };
      const newPool = [...pool];
      const existingTileInTarget = newMapping[targetStepId][targetSlotType];
      
      if (sourceLoc === "pool") {
        const idx = newPool.findIndex(t => t.id === tile.id);
        if (idx > -1) newPool.splice(idx, 1);
      } else if (sourceLoc === "step" && sourceStepId && sourceSlotType) {
        newMapping[sourceStepId][sourceSlotType as TileType] = null;
      }
      if (existingTileInTarget) newPool.push(existingTileInTarget);
      
      newMapping[targetStepId][targetSlotType] = tile;
      setMapping(newMapping);
      setPool(newPool);
      setValidation({ isChecked: false, results: {} }); 
    } catch (err) {}
  };
  const handleDropToPool = (e: React.DragEvent) => {
    if (isHardMode) return;
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.sourceLoc === "step" && data.stepId && data.stepSlotType) {
        const newMapping = { ...mapping };
        newMapping[data.stepId][data.stepSlotType as TileType] = null;
        setMapping(newMapping);
        setPool([...pool, data.tile]);
        setValidation({ isChecked: false, results: {} });
      }
    } catch (err) {}
  };

  const handleTextChange = (stepId: string, type: "textMitre" | "textEvent", value: string) => {
    const newMapping = { ...mapping };
    newMapping[stepId][type] = value;
    setMapping(newMapping);
    setValidation({ isChecked: false, results: {} });
  };

  const validate = () => {
    if (!scenario) return;
    const results: Record<string, { mitre: boolean, event: boolean }> = {};
    scenario.steps.forEach(step => {
      const state = mapping[step.id];
      let isMitreCorrect = false;
      let isEventCorrect = false;
      if (isHardMode) {
        isMitreCorrect = state.textMitre.trim().toUpperCase() === step.requiredMitreId.toUpperCase();
        isEventCorrect = state.textEvent.trim().toLowerCase() === step.requiredEventId.toLowerCase();
      } else {
        isMitreCorrect = state.mitre?.id.toLowerCase() === step.requiredMitreId.toLowerCase();
        isEventCorrect = state.event?.id.toLowerCase() === step.requiredEventId.toLowerCase();
      }
      results[step.id] = { mitre: isMitreCorrect, event: isEventCorrect };
    });
    const correct = Object.values(results).reduce((total, result) => total + Number(result.mitre) + Number(result.event), 0);
    setScore(Math.round((correct / (scenario.steps.length * 2)) * 100));
    setAttempts(current => current + 1);
    setValidation({ isChecked: true, results });
  };

  const missedSteps = validation.isChecked && scenario ? scenario.steps.filter(step => {
    const result = validation.results[step.id];
    return !result?.mitre || !result?.event;
  }) : [];

  // --- Modal Openers ---
  const openInfoModalMitre = (mitreId: string) => {
    const info = MITRE_DB.find(m => m.id.toUpperCase() === mitreId.toUpperCase());
    if (info) setInfoModalData({ type: "mitre", data: info });
  };
  
  const openInfoModalEvent = (eventId: string) => {
    if (!scenario) return;
    if (scenario.platform === "Windows") {
      const info = WIN_EVENTS_DB.find(e => e.id.toLowerCase() === eventId.toLowerCase());
      if (info) setInfoModalData({ type: "windows", data: info });
    } else {
      const info = LINUX_EVENTS_DB.find(e => e.id.toLowerCase() === eventId.toLowerCase());
      if (info) setInfoModalData({ type: "linux", data: info });
    }
  };

  if (!scenario) return null;

  return (
    <ToolLayout
      title="MITRE ATT&CK Simulator"
      description="Interactive Incident Response generator. Map real attack scenarios to MITRE techniques and Windows/Linux Event telemetry."
    >
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 border border-[#1a1a1a] bg-[#050505]">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-[#00ff9c] font-bold uppercase tracking-widest text-sm flex items-center gap-2">
              {scenario.platform === "Windows" ? <Monitor className="w-4 h-4 text-blue-400" /> : <TerminalSquare className="w-4 h-4 text-orange-400" />}
              {scenario.title}
            </h2>
            {sharedScenarioBase64 && <span className="bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">Custom Seed</span>}
          </div>
          <p className="text-zinc-400 text-xs max-w-2xl leading-relaxed mt-2"><strong className="text-zinc-300">Environment: {scenario.platform || "Unknown"}</strong> — {scenario.description}</p>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-zinc-600">MITRE ATT&CK Enterprise v{MITRE_VERSION}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            <span>{scenario.steps.length} phases</span>
            {score !== null && <span className={score === 100 ? "text-[#00ff9c]" : score >= 50 ? "text-amber-400" : "text-red-400"}>Score {score}%</span>}
            {attempts > 0 && <span className="text-zinc-600">Attempt {attempts}</span>}
            {validation.isChecked && <span className="text-zinc-600">{Object.values(validation.results).filter(result => result.mitre && result.event).length}/{scenario.steps.length} phases complete</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <Button onClick={() => setIsBuilderOpen(!isBuilderOpen)} variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-mono text-xs h-9">
            <Plus className="w-3 h-3 mr-2" /> Custom Scenario
          </Button>
          <div className="flex items-center gap-2 border-l border-[#1a1a1a] pl-4">
            <Label htmlFor="simulator-mode" className={`font-bold font-mono text-xs uppercase tracking-widest flex items-center gap-1 ${isHardMode ? 'text-red-500' : 'text-zinc-500'}`}><Skull className="w-3 h-3" /> Mode</Label>
            <select id="simulator-mode" value={simulatorMode} onChange={(event) => changeSimulatorMode(event.target.value as "standard" | "hard")} className="h-9 border border-[#1a1a1a] bg-black px-2 text-[10px] font-mono uppercase tracking-widest text-zinc-300 outline-none focus:border-[#00ff9c]">
              <option value="standard">Training</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <Button onClick={handleGenerateProcedural} variant="outline" className="border-[#00ff9c]/50 text-[#00ff9c] hover:bg-[#00ff9c]/10 h-9 font-mono text-xs ml-2">
            <Shuffle className="w-3 h-3 mr-2" /> Random Incident
          </Button>
        </div>
      </div>

      {/* Builder Modal */}
      {isBuilderOpen && (
        <div className="mb-6 border border-purple-500/30 bg-[#050505] p-6 relative">
          <button onClick={() => setIsBuilderOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
          <h3 className="text-purple-400 font-bold uppercase tracking-widest text-sm mb-4">Create & Share Custom Scenario</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Scenario Title</label>
              <input type="text" value={builderTitle} onChange={(e)=>setBuilderTitle(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1" placeholder="My APT29 Simulation" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Platform OS</label>
              <select value={builderPlatform} onChange={(e)=>setBuilderPlatform(e.target.value as "Windows" | "Linux")} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1">
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-500">Description</label>
              <input type="text" value={builderDesc} onChange={(e)=>setBuilderDesc(e.target.value)} className="w-full bg-black border border-[#1a1a1a] p-2 text-xs text-zinc-300 focus:border-purple-500 outline-none mt-1" placeholder="Brief backstory of the attack..." />
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 border-b border-[#1a1a1a] pb-1">Attack Steps</h4>
            {builderSteps.map((step, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 border border-[#1a1a1a] bg-black">
                <div className="flex-1">
                  <label className="text-[10px] text-zinc-500">Narrative Step {i+1}</label>
                  <input type="text" value={step.desc} onChange={(e) => { const n = [...builderSteps]; n[i].desc = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs text-zinc-300 focus:border-purple-500 outline-none" placeholder="Attacker does X..." />
                </div>
                <div className="w-48 shrink-0 relative">
                  <label className="text-[10px] text-zinc-500">MITRE ID</label>
                  <input type="text" value={step.mitre} onFocus={() => setFocusedField({index: i, type: "mitre"})} onBlur={() => setTimeout(() => setFocusedField(null), 200)} onChange={(e) => { const n = [...builderSteps]; n[i].mitre = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-[#00ff9c] focus:border-purple-500 outline-none" placeholder="T1566" />
                  {focusedField?.index === i && focusedField?.type === "mitre" && step.mitre && (
                    <div className="absolute z-10 w-[300px] left-0 bg-black border border-purple-500/50 mt-1 max-h-48 overflow-y-auto shadow-2xl divide-y divide-[#1a1a1a]">
                      {MITRE_DB.filter(m => m.id.toLowerCase().includes(step.mitre.toLowerCase()) || m.name.toLowerCase().includes(step.mitre.toLowerCase())).slice(0, 10).map(s => (
                        <div key={s.id} className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer" onClick={() => { const n = [...builderSteps]; n[i].mitre = s.id; setBuilderSteps(n); setFocusedField(null); }}>
                          <span className="font-bold text-[#00ff9c]">{s.id}</span> - {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-48 shrink-0 relative">
                  <label className="text-[10px] text-zinc-500">Telemetry ID</label>
                  <input type="text" value={step.event} onFocus={() => setFocusedField({index: i, type: "event"})} onBlur={() => setTimeout(() => setFocusedField(null), 200)} onChange={(e) => { const n = [...builderSteps]; n[i].event = e.target.value; setBuilderSteps(n); }} className="w-full bg-transparent border-b border-[#1a1a1a] p-1 text-xs font-mono text-blue-400 focus:border-purple-500 outline-none" placeholder="Sysmon 1 / auditd" />
                  {focusedField?.index === i && focusedField?.type === "event" && step.event && (
                    <div className="absolute z-10 w-[300px] right-0 sm:left-0 bg-black border border-purple-500/50 mt-1 max-h-48 overflow-y-auto shadow-2xl divide-y divide-[#1a1a1a]">
                      {(builderPlatform === "Windows" ? WIN_EVENTS_DB : LINUX_EVENTS_DB).filter(e => e.id.toLowerCase().includes(step.event.toLowerCase()) || e.name.toLowerCase().includes(step.event.toLowerCase())).slice(0, 10).map(s => (
                        <div key={s.id} className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer" onClick={() => { const n = [...builderSteps]; n[i].event = s.id; setBuilderSteps(n); setFocusedField(null); }}>
                          <span className="font-bold text-blue-400">{s.id}</span> - {s.name}
                        </div>
                      ))}
                      <div className="p-2 text-[10px] hover:bg-purple-500/20 cursor-pointer text-zinc-400" onClick={() => { const n = [...builderSteps]; n[i].event = "none"; setBuilderSteps(n); setFocusedField(null); }}>
                        <span className="font-bold">none</span> - No Telemetry
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <Button onClick={handleAddBuilderStep} variant="ghost" className="text-zinc-500 hover:text-white text-xs"><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
          </div>

          <div className="pt-4 border-t border-[#1a1a1a] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button onClick={handleBuilderGenerateLink} className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-xs h-10 shrink-0">
              <Share2 className="w-4 h-4 mr-2" /> Generate Shareable Link
            </Button>
            {builderError && <p className="text-red-500 text-xs font-bold">{builderError}</p>}
            {shareLink && (
              <div className="flex-1 flex w-full border border-purple-500/50 bg-black">
                <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent text-zinc-400 text-xs p-2 outline-none font-mono" />
                <button onClick={() => navigator.clipboard.writeText(shareLink)} className="p-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 transition-colors"><Copy className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Modal Renderer */}
      {infoModalData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setInfoModalData(null)}>
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 max-w-lg w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setInfoModalData(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded bg-black border border-[#1a1a1a] ${infoModalData.data.color}`}>
                <infoModalData.data.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg font-mono ${infoModalData.type === 'mitre' ? 'text-[#00ff9c]' : infoModalData.type === 'windows' ? 'text-blue-400' : 'text-orange-400'}`}>
                  {infoModalData.data.id}
                </h3>
                <p className="text-zinc-400 text-xs uppercase tracking-widest">{infoModalData.data.name}</p>
                {infoModalData.type === 'mitre' && <p className="text-[10px] font-mono text-zinc-600 mt-1">ATT&CK Enterprise v{MITRE_VERSION}</p>}
              </div>
            </div>

            <div className="space-y-4">
              {infoModalData.type === 'mitre' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Tactic</h4>
                    <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as MitreDef).tactic}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Platform</h4>
                    <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as MitreDef).platform}</p>
                  </div>
                </div>
              )}

              {(infoModalData.type === 'windows' || infoModalData.type === 'linux') && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Log Type</h4>
                  <p className="text-xs text-zinc-300 bg-black border border-[#1a1a1a] p-2 font-mono">{(infoModalData.data as WinEventDef | LinuxEventDef).type}</p>
                </div>
              )}

              <div>
                <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Description</h4>
                <p className="text-sm text-zinc-300 leading-relaxed bg-black border border-[#1a1a1a] p-3">{infoModalData.data.description}</p>
              </div>

              {infoModalData.type === 'mitre' && (
                <div className="space-y-4">
                  <div><h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Example in the Wild</h4><p className="text-sm text-[#00ff9c] leading-relaxed bg-[#00ff9c]/10 border border-[#00ff9c]/30 p-3 italic">"{(infoModalData.data as MitreDef).example}"</p></div>
                  <div><h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Sub-techniques</h4>{localSubtechniques(infoModalData.data as MitreDef).length === 0 ? <p className="text-xs text-zinc-600">No local sub-techniques recorded.</p> : <div className="space-y-2">{localSubtechniques(infoModalData.data as MitreDef).map(child => <button key={child.id} onClick={() => setInfoModalData({ type: 'mitre', data: child })} className="w-full border border-[#1a1a1a] bg-black p-3 text-left hover:border-[#00ff9c]/50"><span className="font-mono text-[10px] text-[#00ff9c]">{child.id}</span><span className="block text-xs text-zinc-300">{child.name}</span><span className="mt-2 block text-[11px] leading-relaxed text-zinc-500">{child.description}</span><span className="mt-2 block text-[10px] text-[#ffb000]">Example: {child.example}</span></button>)}</div>}</div>
                </div>
              )}

              {(infoModalData.type === 'windows' || infoModalData.type === 'linux') && (
                <>
                  <div className="bg-black border border-[#1a1a1a] p-3 mb-2 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${infoModalData.type === 'windows' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                    <p className="text-zinc-300 text-xs font-mono ml-2">
                      <span className={`${infoModalData.type === 'windows' ? 'text-blue-500' : 'text-orange-500'} font-bold mr-2`}>Useful Fields:</span>
                      {(infoModalData.data as WinEventDef | LinuxEventDef).fields.join(", ")}
                    </p>
                  </div>
                  <div className="bg-red-900/10 border border-red-900/30 p-3 mb-2 relative overflow-hidden">
                    <p className="text-red-400 text-xs font-mono">
                      <span className="font-bold mr-2">Malicious Use:</span>
                      {(infoModalData.data as WinEventDef | LinuxEventDef).maliciousUse}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest flex items-center mr-1">Related MITRE:</span>
                    {(infoModalData.data as WinEventDef | LinuxEventDef).mitre.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-[#00ff9c]/10 text-[#00ff9c] border border-[#00ff9c]/30 text-[10px] font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seed Error Modal */}
      {seedError && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSeedError("")}>
          <div className="bg-[#050505] border border-red-500/50 p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-500">Seed Invalid</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-6">{seedError}</p>
            <div className="flex justify-end">
              <Button onClick={() => setSeedError("")} className="bg-red-500/20 text-red-500 hover:bg-red-500/40 border border-red-500/30">
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Core */}
      <div className={`grid grid-cols-1 ${isHardMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 transition-all`}>
        
        {/* Main: Scenario Timeline */}
        <div className={`${isHardMode ? 'lg:col-span-1' : 'lg:col-span-8'} space-y-4 max-w-5xl mx-auto w-full`}>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Attack Timeline</h3>
          
          <div className="space-y-4">
            {scenario.steps.map((step, idx) => {
              const res = validation.results[step.id];
              return (
                <div key={step.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded bg-black border border-[#1a1a1a] flex items-center justify-center font-mono text-[#00ff9c] font-bold text-sm z-10 shrink-0">{idx + 1}</div>
                    {idx < scenario.steps.length - 1 && <div className="w-px h-full bg-[#1a1a1a] -mb-4 mt-2"></div>}
                  </div>

                  <div className={`flex-1 border border-[#1a1a1a] bg-[#050505] p-4 ${validation.isChecked && res?.mitre && res?.event ? 'border-l-4 border-l-[#00ff9c]' : ''} ${validation.isChecked && (!res?.mitre || !res?.event) ? 'border-l-4 border-l-red-500' : ''}`}>
                    <p className="text-zinc-300 text-sm mb-4 leading-relaxed">{step.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* MITRE Area */}
                      {isHardMode ? (
                        <div className="relative flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Shield className="w-3 h-3"/> Mitre ID</label>
                          <input type="text" placeholder="" value={mapping[step.id].textMitre} onChange={(e) => handleTextChange(step.id, "textMitre", e.target.value)} className={`w-full bg-black border p-3 text-xs font-mono text-[#00ff9c] focus:outline-none transition-colors ${validation.isChecked && !res?.mitre ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a1a] focus:border-[#00ff9c]'}`} />
                        </div>
                      ) : (
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropToSlot(e, step.id, "mitre")} className={`min-h-[60px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-colors ${mapping[step.id]?.mitre ? 'border-transparent bg-transparent p-0' : 'border-zinc-800 bg-black/50'} ${validation.isChecked && !res?.mitre ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                          {mapping[step.id]?.mitre ? (
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].mitre!, "step", step.id, "mitre")} className="w-full bg-[#1a1a1a] border border-[#00ff9c]/50 p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a]">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Shield className="w-4 h-4 text-[#00ff9c] shrink-0" />
                                <span className="text-xs font-mono text-[#00ff9c] truncate">{mapping[step.id].mitre!.label}</span>
                              </div>
                              <button onClick={() => openInfoModalMitre(mapping[step.id].mitre!.id)} className="p-1 hover:bg-[#00ff9c]/20 text-[#00ff9c]/50 hover:text-[#00ff9c] transition-colors rounded shrink-0">
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Shield className="w-4 h-4 mb-1"/> Drop MITRE Technique</span>
                          )}
                        </div>
                      )}

                      {/* Event Area */}
                      {isHardMode ? (
                        <div className="relative flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1"><Terminal className="w-3 h-3"/> Event / Telemetry</label>
                          <input type="text" placeholder="" value={mapping[step.id].textEvent} onChange={(e) => handleTextChange(step.id, "textEvent", e.target.value)} className={`w-full bg-black border p-3 text-xs font-mono ${scenario.platform === 'Windows' ? 'text-blue-400 focus:border-blue-400' : 'text-orange-400 focus:border-orange-400'} focus:outline-none transition-colors ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-[#1a1a1a]'}`} />
                        </div>
                      ) : (
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropToSlot(e, step.id, "event")} className={`min-h-[60px] border-2 border-dashed flex flex-col items-center justify-center p-2 transition-colors ${mapping[step.id]?.event ? 'border-transparent bg-transparent p-0' : 'border-zinc-800 bg-black/50'} ${validation.isChecked && !res?.event ? 'border-red-500/50 bg-red-500/10' : ''}`}>
                          {mapping[step.id]?.event ? (
                            <div draggable onDragStart={(e) => handleDragStart(e, mapping[step.id].event!, "step", step.id, "event")} className={`w-full bg-[#1a1a1a] border p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#2a2a2a] ${scenario.platform === 'Windows' ? 'border-blue-400/50' : 'border-orange-400/50'}`}>
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Terminal className={`w-4 h-4 shrink-0 ${scenario.platform === 'Windows' ? 'text-blue-400' : 'text-orange-400'}`} />
                                <span className={`text-xs font-mono truncate ${scenario.platform === 'Windows' ? 'text-blue-400' : 'text-orange-400'}`}>{mapping[step.id].event!.label}</span>
                              </div>
                              <button onClick={() => openInfoModalEvent(mapping[step.id].event!.id)} className={`p-1 transition-colors rounded shrink-0 ${scenario.platform === 'Windows' ? 'hover:bg-blue-400/20 text-blue-400/50 hover:text-blue-400' : 'hover:bg-orange-400/20 text-orange-400/50 hover:text-orange-400'}`}>
                                <Info className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center flex flex-col items-center gap-1"><Terminal className="w-4 h-4 mb-1"/> Drop Telemetry</span>
                          )}
                        </div>
                      )}

                    </div>

                    {validation.isChecked && (
                      <div className="mt-3 flex gap-4 text-[10px] uppercase font-bold tracking-widest">
                        {res?.mitre ? <span className="text-[#00ff9c] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> MITRE OK</span> : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> MITRE WRONG</span>}
                        {res?.event ? <span className="text-[#00ff9c] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> EVENT OK</span> : <span className="text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> EVENT WRONG</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6">
            <Button onClick={validate} className="w-full bg-[#00ff9c] text-black hover:bg-[#00cc7d] font-bold uppercase tracking-widest h-12 shadow-[0_0_15px_rgba(0,255,156,0.2)]">
              Verify Incident Report <Play className="w-4 h-4 ml-2 fill-black" />
            </Button>
          </div>

          {validation.isChecked && (
            <div className={`border p-4 ${score === 100 ? 'border-[#00ff9c]/40 bg-[#00ff9c]/5' : 'border-amber-400/30 bg-amber-400/5'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${score === 100 ? 'text-[#00ff9c]' : 'text-amber-400'}`}>
                    {score === 100 ? 'Incident mapped correctly' : 'Debrief required'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {score === 100
                      ? 'Every phase has a matching MITRE technique and telemetry source.'
                      : `${missedSteps.length} phase${missedSteps.length === 1 ? '' : 's'} still needs review. Use the red markers in the timeline to correct the mapping.`}
                  </p>
                </div>
                <span className="text-2xl font-bold font-mono text-zinc-200">{score}%</span>
              </div>
              {missedSteps.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {missedSteps.map(step => {
                    const result = validation.results[step.id];
                    const mitre = MITRE_DB.find(item => item.id.toLowerCase() === step.requiredMitreId.toLowerCase());
                    return (
                      <div key={step.id} className="border border-[#1a1a1a] bg-black/40 p-3 text-[10px] font-mono">
                        <p className="text-zinc-300 truncate">{step.description}</p>
                        <p className={result?.mitre ? 'text-[#00ff9c] mt-2' : 'text-red-400 mt-2'}>
                          {result?.mitre ? 'MITRE OK' : `Expected MITRE: ${step.requiredMitreId}${mitre ? ` — ${mitre.name}` : ''}`}
                        </p>
                        <p className={result?.event ? 'text-[#00ff9c] mt-1' : 'text-red-400 mt-1'}>
                          {result?.event ? 'EVENT OK' : `Expected telemetry: ${step.requiredEventId}`}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Tile Inventory (Hidden in Hard Mode) */}
        {!isHardMode && (
          <div className="lg:col-span-4">
            <div className="sticky top-24 border border-[#1a1a1a] bg-[#050505] flex flex-col h-[calc(100vh-140px)]" onDragOver={handleDragOver} onDrop={handleDropToPool}>
              <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Tiles</h3>
                  <p className="text-[10px] text-zinc-600 mt-1">Drag tiles to the timeline</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="show-hints" className="text-[10px] uppercase font-bold text-zinc-500">Hints</Label>
                  <Switch id="show-hints" checked={showHints} onCheckedChange={setShowHints} className="scale-75 origin-right" />
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-[#00ff9c] uppercase tracking-widest mb-3 flex items-center gap-2"><Shield className="w-3 h-3" /> MITRE Techniques</h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "mitre").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "mitre").map(tile => {
                      const dbInfo = MITRE_DB.find(m => m.id.toUpperCase() === tile.id.toUpperCase());
                      return (
                        <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#00ff9c] transition-colors group">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Shield className="w-4 h-4 text-[#00ff9c] shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                              {showHints && dbInfo && <span className="text-[9px] text-zinc-500 truncate mt-0.5">{dbInfo.name}</span>}
                            </div>
                          </div>
                          {dbInfo && (
                            <button onClick={() => openInfoModalMitre(tile.id)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#00ff9c]/20 text-[#00ff9c]/50 hover:text-[#00ff9c] transition-all rounded shrink-0">
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${scenario.platform === 'Windows' ? 'text-blue-400' : 'text-orange-400'}`}>
                    <Terminal className="w-3 h-3" /> {scenario.platform} Telemetry
                  </h4>
                  <div className="flex flex-col gap-2">
                    {pool.filter(t => t.type === "event").length === 0 && <p className="text-xs text-zinc-600 italic">None available.</p>}
                    {pool.filter(t => t.type === "event").map(tile => {
                      const isWin = scenario.platform === "Windows";
                      const dbInfo = isWin ? WIN_EVENTS_DB.find(e => e.id.toLowerCase() === tile.id.toLowerCase()) : LINUX_EVENTS_DB.find(e => e.id.toLowerCase() === tile.id.toLowerCase());
                      const colorHover = isWin ? 'hover:border-blue-400' : 'hover:border-orange-400';
                      const textColor = isWin ? 'text-blue-400' : 'text-orange-400';
                      
                      return (
                        <div key={tile.id} draggable onDragStart={(e) => handleDragStart(e, tile, "pool")} className={`bg-[#0a0a0a] border border-[#1a1a1a] p-3 flex items-center justify-between cursor-grab active:cursor-grabbing ${colorHover} transition-colors group`}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Terminal className={`w-4 h-4 ${textColor} shrink-0`} />
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-xs font-mono text-zinc-300 leading-tight">{tile.label}</span>
                              {showHints && dbInfo && <span className="text-[9px] text-zinc-500 truncate mt-0.5">{dbInfo.name}</span>}
                            </div>
                          </div>
                          {dbInfo && (
                            <button onClick={() => openInfoModalEvent(tile.id)} className={`p-1 opacity-0 group-hover:opacity-100 hover:bg-black text-zinc-600 hover:${textColor} transition-all rounded shrink-0`}>
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
