"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant, ReactFlowProvider, useReactFlow, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import { ToolLayout } from "@/components/tool-layout";
import NetworkNode from './nodes/NetworkNode';
import NetworkEdge from './edges/NetworkEdge';
import Sidebar from './components/Sidebar';
import { TEMPLATES } from './components/Templates';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { parseDiagram } from '@/lib/diagram-validation';

const nodeTypes = { networkNode: NetworkNode };
const edgeTypes = { networkEdge: NetworkEdge };

function DiagramFlow() {
  const [nodes, setNodes] = useState<any[]>(TEMPLATES["Small Office"].nodes);
  const [edges, setEdges] = useState<any[]>(TEMPLATES["Small Office"].edges);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();

  // Load from local storage on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const saved = readLocalStorage('network_diagram');
    if (saved) {
      try {
        const parsed = parseDiagram(JSON.parse(saved));
        if (parsed && parsed.nodes.length > 0) {
          const { nodes: savedNodes, edges: savedEdges } = parsed;
          setNodes(savedNodes);
          setEdges(savedEdges);
          setTimeout(() => fitView(), 100);
        }
      } catch (e) {
        console.error("Failed to parse saved diagram", e);
      }
    }
  }, [fitView]);

  // Save to local storage on change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      writeLocalStorage('network_diagram', JSON.stringify({ nodes, edges }));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge({ ...params, type: 'networkEdge', data: { connectionType: 'ethernet' } }, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeData = event.dataTransfer.getData('application/reactflow');
      if (!typeData) return;

      const { type, label } = JSON.parse(typeData);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type: 'networkNode',
        position,
        data: { label, type, ip: '', vlan: '' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const onSelectionChange = useCallback(({ nodes, edges }: any) => {
    setSelectedNode(nodes.length === 1 ? nodes[0] : null);
    setSelectedEdge(edges.length === 1 ? edges[0] : null);
  }, []);

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, ...newData };
        }
        return node;
      })
    );
  };

  const updateEdgeData = (edgeId: string, newData: any) => {
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === edgeId) {
          edge.data = { ...edge.data, ...newData };
        }
        return edge;
      })
    );
  };

  const loadTemplate = (templateName: keyof typeof TEMPLATES) => {
    const template = TEMPLATES[templateName];
    setNodes(template.nodes);
    setEdges(template.edges);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const exportDiagram = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `network-diagram-${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const importDiagram = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length > 2_000_000) throw new Error("Diagram file is too large");
        const parsed = parseDiagram(JSON.parse(content));
        if (parsed) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
          setTimeout(() => fitView({ padding: 0.2 }), 100);
        } else {
          alert("Invalid diagram JSON format.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const exportImage = (bgColor: 'black' | 'white' | 'transparent') => {
    const nodesBounds = getNodesBounds(nodes);
    
    // Default image width/height (will scale based on bounds)
    const imageWidth = 1920;
    const imageHeight = 1080;
    
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);
    
    const element = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!element) return;
    
    let backgroundColor = bgColor === 'black' ? '#0a0a0a' : (bgColor === 'white' ? '#ffffff' : 'transparent');

    toPng(element, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', `network-diagram-${bgColor}.png`);
      a.setAttribute('href', dataUrl);
      a.click();
    });
  };

  return (
    <div className="flex w-full h-[800px] border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#0a0a0a]">
      <Sidebar 
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        updateNodeData={updateNodeData}
        updateEdgeData={updateEdgeData}
        exportDiagram={exportDiagram}
        importDiagram={importDiagram}
        loadTemplate={loadTemplate}
        exportImage={exportImage}
      />
      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
          className="bg-[#050505]"
        >
          <Background color="#1a1a1a" variant={BackgroundVariant.Dots} gap={20} size={2} />
          <Controls style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a' }} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function NetworkDiagramPage() {
  return (
    <ToolLayout
      title="Network Diagram Generator"
      description="Create, edit and export network topology diagrams directly in your browser."
    >
      <div className="w-full h-full max-w-7xl mx-auto">
        <ReactFlowProvider>
          <DiagramFlow />
        </ReactFlowProvider>
      </div>
    </ToolLayout>
  );
}
