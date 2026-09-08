export const TEMPLATES = {
  "Empty Canvas": {
    nodes: [],
    edges: []
  },
  "Small Office": {
    nodes: [
      { id: "isp", type: "networkNode", position: { x: 400, y: 50 }, data: { label: "Internet", type: "cloud", ip: "8.8.8.8" } },
      { id: "router", type: "networkNode", position: { x: 400, y: 200 }, data: { label: "Edge Router", type: "router", ip: "192.168.1.1" } },
      { id: "switch", type: "networkNode", position: { x: 400, y: 350 }, data: { label: "Core Switch", type: "switch", ip: "192.168.1.2", vlan: "1" } },
      { id: "ap", type: "networkNode", position: { x: 200, y: 500 }, data: { label: "WiFi AP", type: "wireless", ip: "192.168.1.3" } },
      { id: "pc1", type: "networkNode", position: { x: 400, y: 500 }, data: { label: "Office PC 1", type: "pc", ip: "192.168.1.10" } },
      { id: "pc2", type: "networkNode", position: { x: 600, y: 500 }, data: { label: "Office PC 2", type: "pc", ip: "192.168.1.11" } }
    ],
    edges: [
      { id: "e-isp-router", source: "isp", sourceHandle: "bottom-source", target: "router", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-router-switch", source: "router", sourceHandle: "bottom-source", target: "switch", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-ap", source: "switch", sourceHandle: "bottom-source", target: "ap", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-pc1", source: "switch", sourceHandle: "bottom-source", target: "pc1", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-pc2", source: "switch", sourceHandle: "bottom-source", target: "pc2", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } }
    ]
  },
  "Enterprise Core": {
    nodes: [
      { id: "fw1", type: "networkNode", position: { x: 300, y: 100 }, data: { label: "Primary FW", type: "firewall", ip: "10.0.0.1" } },
      { id: "fw2", type: "networkNode", position: { x: 500, y: 100 }, data: { label: "Secondary FW", type: "firewall", ip: "10.0.0.2" } },
      { id: "core1", type: "networkNode", position: { x: 400, y: 250 }, data: { label: "Core Switch", type: "switch", ip: "10.0.0.3", vlan: "100" } },
      { id: "dist1", type: "networkNode", position: { x: 250, y: 400 }, data: { label: "Dist Switch 1", type: "switch", ip: "10.0.1.1" } },
      { id: "dist2", type: "networkNode", position: { x: 550, y: 400 }, data: { label: "Dist Switch 2", type: "switch", ip: "10.0.2.1" } },
      { id: "srv1", type: "networkNode", position: { x: 150, y: 550 }, data: { label: "Web Server", type: "server", ip: "10.0.1.10", vlan: "10" } },
      { id: "srv2", type: "networkNode", position: { x: 350, y: 550 }, data: { label: "DB Server", type: "server", ip: "10.0.1.11", vlan: "20" } }
    ],
    edges: [
      { id: "e-fw1-core", source: "fw1", sourceHandle: "bottom-source", target: "core1", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-fw2-core", source: "fw2", sourceHandle: "bottom-source", target: "core1", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber" }, animated: true },
      { id: "e-core-dist1", source: "core1", sourceHandle: "bottom-source", target: "dist1", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-core-dist2", source: "core1", sourceHandle: "bottom-source", target: "dist2", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-dist1-srv1", source: "dist1", sourceHandle: "bottom-source", target: "srv1", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-dist1-srv2", source: "dist1", sourceHandle: "bottom-source", target: "srv2", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet" } }
    ]
  },
  "DMZ": {
    nodes: [
      { id: "dmz-internet", type: "networkNode", position: { x: 430, y: 40 }, data: { label: "Internet", type: "cloud", ip: "0.0.0.0/0", zone: "internet", status: "active" } },
      { id: "dmz-fw", type: "networkNode", position: { x: 430, y: 190 }, data: { label: "Perimeter Firewall", type: "firewall", ip: "203.0.113.1/30", role: "edge firewall", zone: "wan", status: "active" } },
      { id: "dmz-lb", type: "networkNode", position: { x: 180, y: 360 }, data: { label: "Public Load Balancer", type: "load-balancer", ip: "198.51.100.10/24", zone: "dmz", status: "active" } },
      { id: "dmz-web", type: "networkNode", position: { x: 430, y: 360 }, data: { label: "Web Server", type: "server", ip: "198.51.100.20/24", vlan: "110", zone: "dmz", status: "active" } },
      { id: "dmz-ids", type: "networkNode", position: { x: 680, y: 360 }, data: { label: "DMZ IDS", type: "ids-ips", ip: "198.51.100.30/24", vlan: "110", zone: "dmz", status: "active" } },
      { id: "dmz-core", type: "networkNode", position: { x: 430, y: 530 }, data: { label: "Internal Core", type: "switch", ip: "10.10.0.1/24", vlan: "10", zone: "lan", status: "active" } }
    ],
    edges: [
      { id: "e-dmz-internet-fw", source: "dmz-internet", sourceHandle: "bottom-source", target: "dmz-fw", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber", bandwidth: "1 Gbps", vlanMode: "routed" } },
      { id: "e-dmz-fw-lb", source: "dmz-fw", sourceHandle: "bottom-source", target: "dmz-lb", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber", vlanMode: "routed" } },
      { id: "e-dmz-fw-web", source: "dmz-fw", sourceHandle: "bottom-source", target: "dmz-web", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet", vlanMode: "access", vlans: "110" } },
      { id: "e-dmz-fw-ids", source: "dmz-fw", sourceHandle: "bottom-source", target: "dmz-ids", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet", vlanMode: "access", vlans: "110" } },
      { id: "e-dmz-fw-core", source: "dmz-fw", sourceHandle: "bottom-source", target: "dmz-core", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber", vlanMode: "trunk", vlans: "10,110" } }
    ]
  },
  "VLAN Segmentation": {
    nodes: [
      { id: "vlan-router", type: "networkNode", position: { x: 430, y: 60 }, data: { label: "Inter-VLAN Router", type: "router", ip: "10.0.0.1/24", role: "gateway", zone: "lan", status: "active" } },
      { id: "vlan-switch", type: "networkNode", position: { x: 430, y: 240 }, data: { label: "Distribution Switch", type: "switch", ip: "10.0.0.2/24", role: "distribution", zone: "lan", status: "active" } },
      { id: "vlan-users", type: "networkNode", position: { x: 160, y: 450 }, data: { label: "User Access", type: "pc", ip: "10.10.10.10/24", vlan: "10", zone: "lan", status: "active" } },
      { id: "vlan-servers", type: "networkNode", position: { x: 430, y: 450 }, data: { label: "Server Segment", type: "server", ip: "10.10.20.10/24", vlan: "20", zone: "server", status: "active" } },
      { id: "vlan-management", type: "networkNode", position: { x: 700, y: 450 }, data: { label: "Management", type: "server", ip: "10.10.99.10/24", vlan: "99", zone: "management", status: "active" } }
    ],
    edges: [
      { id: "e-vlan-router-switch", source: "vlan-router", sourceHandle: "bottom-source", target: "vlan-switch", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "fiber", vlanMode: "trunk", vlans: "10,20,99" } },
      { id: "e-vlan-switch-users", source: "vlan-switch", sourceHandle: "bottom-source", target: "vlan-users", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet", vlanMode: "access", vlans: "10" } },
      { id: "e-vlan-switch-servers", source: "vlan-switch", sourceHandle: "bottom-source", target: "vlan-servers", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet", vlanMode: "access", vlans: "20" } },
      { id: "e-vlan-switch-management", source: "vlan-switch", sourceHandle: "bottom-source", target: "vlan-management", targetHandle: "top-target", type: "networkEdge", data: { connectionType: "ethernet", vlanMode: "access", vlans: "99" } }
    ]
  }
};
