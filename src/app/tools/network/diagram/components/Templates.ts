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
      { id: "e-isp-router", source: "isp", target: "router", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-router-switch", source: "router", target: "switch", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-ap", source: "switch", target: "ap", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-pc1", source: "switch", target: "pc1", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-switch-pc2", source: "switch", target: "pc2", type: "networkEdge", data: { connectionType: "ethernet" } }
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
      { id: "e-fw1-core", source: "fw1", target: "core1", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-fw2-core", source: "fw2", target: "core1", type: "networkEdge", data: { connectionType: "fiber" }, animated: true },
      { id: "e-core-dist1", source: "core1", target: "dist1", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-core-dist2", source: "core1", target: "dist2", type: "networkEdge", data: { connectionType: "fiber" } },
      { id: "e-dist1-srv1", source: "dist1", target: "srv1", type: "networkEdge", data: { connectionType: "ethernet" } },
      { id: "e-dist1-srv2", source: "dist1", target: "srv2", type: "networkEdge", data: { connectionType: "ethernet" } }
    ]
  }
};
