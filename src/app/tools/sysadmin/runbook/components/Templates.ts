import { Runbook } from './types';

export const TEMPLATES: Record<string, Runbook> = {
  "Empty Runbook": {
    id: "empty-01",
    title: "New Runbook",
    description: "Start building your procedure from scratch.",
    variables: [],
    steps: []
  },
  "Network Outage Triage": {
    id: "net-triage-01",
    title: "Network Outage Triage",
    description: "Standard operating procedure for investigating a reported network outage.",
    variables: [
      { name: "TARGET_HOST", description: "IP or hostname of the unreachable system", defaultValue: "192.168.1.1" }
    ],
    steps: [
      {
        id: "step-1",
        type: "information",
        title: "Initial Assessment",
        content: "Before starting, ensure you have an active ticket assigned and notify the NOC channel."
      },
      {
        id: "step-2",
        type: "command",
        title: "Ping Target Host",
        description: "Verify basic ICMP connectivity to the target.",
        command: "ping -c 4 {{TARGET_HOST}}",
        expectedResult: "0% packet loss"
      },
      {
        id: "step-3",
        type: "decision",
        title: "Is the host reachable?",
        decisionQuestion: "Did the ping command return successful replies?",
        decisionTrueNext: "step-4",
        decisionFalseNext: "step-5"
      },
      {
        id: "step-4",
        type: "verification",
        title: "Verify Application Layer",
        content: "Network layer is up. Check if the specific application port is listening (e.g. nmap, curl). If it's listening, re-assign ticket to App Team.",
      },
      {
        id: "step-5",
        type: "command",
        title: "Traceroute to Target",
        description: "Identify where the traffic is dropping.",
        command: "traceroute {{TARGET_HOST}}",
      },
      {
        id: "step-6",
        type: "checklist",
        title: "Physical & Layer 2 Check",
        items: [
          "Verify link lights on switch port",
          "Check MAC address table for the host",
          "Verify VLAN assignment on the port",
          "Check for port security violations (err-disable)"
        ]
      }
    ]
  },
  "Linux Service Troubleshooting": {
    id: "linux-service-01",
    title: "Linux Service Troubleshooting",
    description: "Steps to diagnose a failing systemd service.",
    variables: [
      { name: "SERVICE_NAME", description: "Name of the systemd service", defaultValue: "nginx" }
    ],
    steps: [
      {
        id: "step-1",
        type: "command",
        title: "Check Service Status",
        command: "systemctl status {{SERVICE_NAME}}",
        expectedResult: "Active: active (running)"
      },
      {
        id: "step-2",
        type: "decision",
        title: "Is the service running?",
        decisionQuestion: "Is the status showing as active and running?",
        decisionTrueNext: "step-3",
        decisionFalseNext: "step-4"
      },
      {
        id: "step-3",
        type: "information",
        title: "Service is Running",
        content: "The service is already running. You may want to check application logs or reverse proxy configurations if users are still reporting issues."
      },
      {
        id: "step-4",
        type: "command",
        title: "Check Service Logs",
        description: "View the most recent logs for the service.",
        command: "journalctl -u {{SERVICE_NAME}} -n 50 --no-pager"
      },
      {
        id: "step-5",
        type: "command",
        title: "Restart Service",
        description: "Attempt to restart the service to see if it recovers.",
        command: "sudo systemctl restart {{SERVICE_NAME}}"
      }
    ]
  }
};
