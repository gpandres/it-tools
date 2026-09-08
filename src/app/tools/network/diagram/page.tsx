"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReactFlow, Controls, MiniMap, Panel, Background, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant, ReactFlowProvider, useReactFlow, getNodesBounds, getViewportForBounds, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';

import { ToolLayout } from "@/components/tool-layout";
import NetworkNodeComponent from './nodes/NetworkNode';
import NetworkEdgeComponent from './edges/NetworkEdge';
import Sidebar from './components/Sidebar';
import { TEMPLATES } from './components/Templates';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { parseDiagram, validateDiagram } from '@/lib/diagram-validation';
import { autoLayout } from '@/lib/diagram-layout';
import { useNotification } from '@/components/notification-provider';
import type { NetworkEdge, NetworkNode, NetworkNodeData, NetworkNodeType, DiagramSnapshot } from './types';

const nodeTypes = { networkNode: NetworkNodeComponent };
const edgeTypes = { networkEdge: NetworkEdgeComponent };

function DiagramFlow() {
  const [nodes, setNodes] = useState<NetworkNode[]>(() => cloneNodes(TEMPLATES["Small Office"].nodes as NetworkNode[]));
  const [edges, setEdges] = useState<NetworkEdge[]>(() => cloneEdges(TEMPLATES["Small Office"].edges as NetworkEdge[]));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [history, setHistory] = useState<DiagramSnapshot[]>([]);
  const [future, setFuture] = useState<DiagramSnapshot[]>([]);
  const { notify } = useNotification();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<NetworkNode[]>(nodes);
  const edgesRef = useRef<NetworkEdge[]>(edges);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const selectedNode = useMemo(() => nodes.find(node => node.id === selectedNodeId) as NetworkNode | undefined ?? null, [nodes, selectedNodeId]);
  const selectedEdge = useMemo(() => edges.find(edge => edge.id === selectedEdgeId) as NetworkEdge | undefined ?? null, [edges, selectedEdgeId]);
  const validationIssues = useMemo(() => validateDiagram({ nodes, edges }), [nodes, edges]);

  const recordHistory = useCallback(() => {
    setHistory(current => [...current.slice(-29), { nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }]);
    setFuture([]);
  }, []);

  const replaceDiagram = useCallback((nextNodes: NetworkNode[], nextEdges: NetworkEdge[], remember = true) => {
    if (remember) recordHistory();
    const safeNodes = cloneNodes(nextNodes);
    const safeEdges = cloneEdges(nextEdges);
    nodesRef.current = safeNodes;
    edgesRef.current = safeEdges;
    setNodes(safeNodes);
    setEdges(safeEdges);
  }, [recordHistory]);

  // Load from local storage on mount
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const saved = readLocalStorage('network_diagram');
    if (saved) {
      try {
        const parsed = parseDiagram(JSON.parse(saved));
        if (parsed && parsed.nodes.length > 0) {
          const { nodes: savedNodes, edges: savedEdges } = parsed;
          replaceDiagram(savedNodes as NetworkNode[], savedEdges as NetworkEdge[], false);
          setTimeout(() => fitView(), 100);
        }
      } catch (e) {
        console.error("Failed to parse saved diagram", e);
      }
    }
  }, [fitView, replaceDiagram]);

  // Save to local storage on change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      writeLocalStorage('network_diagram', JSON.stringify({ nodes, edges }));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [nodes, edges]);

  const onNodesChange = useCallback(
    (changes: NodeChange<NetworkNode>[]) => setNodes((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      nodesRef.current = nextNodes;
      return nextNodes;
    }),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<NetworkEdge>[]) => {
      if (changes.some(change => change.type === 'remove')) recordHistory();
      setEdges((eds) => {
        const nextEdges = applyEdgeChanges(changes, eds);
        edgesRef.current = nextEdges;
        return nextEdges;
      });
    },
    [recordHistory]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) {
        notify('A device cannot be connected to itself.', 'error');
        return;
      }
      if (params.sourceHandle && !params.sourceHandle.endsWith('-source')) {
        notify('Choose a source handle to start the connection.', 'error');
        return;
      }
      if (params.targetHandle && !params.targetHandle.endsWith('-target')) {
        notify('Choose a target handle to finish the connection.', 'error');
        return;
      }
      const isDuplicate = edgesRef.current.some(edge => edge.source === params.source && edge.target === params.target && edge.sourceHandle === params.sourceHandle && edge.targetHandle === params.targetHandle);
      if (isDuplicate) {
        notify('This exact connection already exists. Use different ports for a second link.', 'error');
        return;
      }
      recordHistory();
      const nextEdges = addEdge({ ...params, type: 'networkEdge', data: { connectionType: 'ethernet', vlanMode: 'unknown' } }, edgesRef.current);
      edgesRef.current = nextEdges;
      setEdges(nextEdges);
    },
    [notify, recordHistory]
  );

  const addNode = useCallback((type: NetworkNodeType, label: string, position?: { x: number; y: number }) => {
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    const center = rect ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }) : { x: 200, y: 200 };
    const offset = (nodesRef.current.length % 6) * 24;
    const newNode: NetworkNode = { id: `node_${Date.now()}_${nodesRef.current.length}`, type: 'networkNode', position: position ?? { x: center.x + offset, y: center.y + offset }, data: { label, type, ip: '', vlan: '', status: 'active' } };
    recordHistory();
    const nextNodes = [...nodesRef.current, newNode];
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
  }, [recordHistory, screenToFlowPosition]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const typeData = event.dataTransfer.getData('application/reactflow');
      if (!typeData) return;

      const { type, label } = JSON.parse(typeData) as { type: NetworkNodeType; label: string };

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, label, position);
    },
    [addNode, screenToFlowPosition]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) => {
    setSelectedNodeId(selectedNodes.length === 1 ? selectedNodes[0].id : null);
    setSelectedEdgeId(selectedEdges.length === 1 ? selectedEdges[0].id : null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NetworkNodeData>) => {
    recordHistory();
    const nextNodes = nodesRef.current.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node);
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
  }, [recordHistory]);

  const updateEdgeData = useCallback((edgeId: string, newData: Partial<NetworkEdge['data']>) => {
    recordHistory();
    const nextEdges = edgesRef.current.map(edge => edge.id === edgeId ? { ...edge, data: { connectionType: edge.data?.connectionType ?? 'ethernet', ...edge.data, ...newData } } : edge) as NetworkEdge[];
    edgesRef.current = nextEdges;
    setEdges(nextEdges);
  }, [recordHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedNodeId) {
      recordHistory();
      const nextNodes = nodesRef.current.filter(node => node.id !== selectedNodeId);
      const nextEdges = edgesRef.current.filter(edge => edge.source !== selectedNodeId && edge.target !== selectedNodeId);
      replaceDiagram(nextNodes, nextEdges, false);
      setSelectedNodeId(null);
      return;
    }
    if (selectedEdgeId) {
      recordHistory();
      replaceDiagram(nodesRef.current, edgesRef.current.filter(edge => edge.id !== selectedEdgeId), false);
      setSelectedEdgeId(null);
    }
  }, [recordHistory, replaceDiagram, selectedEdgeId, selectedNodeId]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    recordHistory();
    const copy = { ...selectedNode, id: `node_${Date.now()}_${nodesRef.current.length}`, position: { x: selectedNode.position.x + 48, y: selectedNode.position.y + 48 }, selected: false, data: { ...selectedNode.data, label: `${selectedNode.data.label} copy` } };
    const nextNodes = [...nodesRef.current, copy];
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setSelectedNodeId(copy.id);
  }, [recordHistory, selectedNode]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture(current => [{ nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }, ...current].slice(0, 30));
    setHistory(current => current.slice(0, -1));
    replaceDiagram(previous.nodes, previous.edges, false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [history, replaceDiagram]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setHistory(current => [...current, { nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }].slice(-30));
    setFuture(current => current.slice(1));
    replaceDiagram(next.nodes, next.edges, false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, [future, replaceDiagram]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteSelected, redo, undo]);

  const onNodeDragStart = useCallback(() => recordHistory(), [recordHistory]);

  const loadTemplate = (templateName: string) => {
    const template = TEMPLATES[templateName as keyof typeof TEMPLATES];
    if (!template) return;
    replaceDiagram(template.nodes as NetworkNode[], template.edges as NetworkEdge[]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
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
    if (file.size > 2_000_000) {
      notify("Diagram files are limited to 2 MB in the browser.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (content.length > 2_000_000) throw new Error("Diagram file is too large");
        const parsed = parseDiagram(JSON.parse(content));
        if (parsed) {
          replaceDiagram(parsed.nodes as NetworkNode[], parsed.edges as NetworkEdge[]);
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setTimeout(() => fitView({ padding: 0.2 }), 100);
        } else {
          notify("Invalid diagram JSON format.", "error");
        }
      } catch (err) {
        notify("Failed to parse the diagram JSON file.", "error");
      }
    }
    reader.onerror = () => notify("Could not read the diagram JSON file.", "error");
    reader.readAsText(file);
  };

  const exportImage = (bgColor: 'black' | 'white' | 'transparent') => {
    if (nodes.length === 0) {
      notify('Add at least one node before exporting an image.', 'error');
      return;
    }
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
    }).catch(() => notify("Could not export the diagram image.", "error"));
  };

  const exportSvg = () => {
    if (nodes.length === 0) {
      notify('Add at least one node before exporting an SVG.', 'error');
      return;
    }

    const nodesBounds = getNodesBounds(nodes);
    const imageWidth = 1920;
    const imageHeight = 1080;
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, 0.1);
    const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!element) {
      notify('The diagram canvas is not ready for export.', 'error');
      return;
    }

    toSvg(element, {
      backgroundColor: '#0a0a0a',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      const anchor = document.createElement('a');
      anchor.download = `network-diagram-${Date.now()}.svg`;
      anchor.href = dataUrl;
      anchor.click();
    }).catch(() => notify('Could not export the diagram as SVG.', 'error'));
  };

  const exportInventory = () => {
    const headers = ['record_type', 'id', 'name', 'type', 'source', 'target', 'ip_cidr', 'vlan', 'zone', 'status', 'role', 'vendor', 'model', 'source_port', 'target_port', 'bandwidth', 'vlan_mode', 'allowed_vlans', 'hostname_or_label'];
    const rows: string[][] = [headers];
    nodes.forEach(node => rows.push(['node', node.id, node.data.label, node.data.type, '', '', node.data.ip || '', node.data.vlan || '', node.data.zone || '', node.data.status || '', node.data.role || '', node.data.vendor || '', node.data.model || '', '', '', '', '', '', node.data.hostname || '']));
    edges.forEach(edge => rows.push(['edge', edge.id, edge.data?.label || '', edge.data?.connectionType || '', edge.source, edge.target, '', '', '', '', '', '', '', edge.data?.sourcePort || '', edge.data?.targetPort || '', edge.data?.bandwidth || '', edge.data?.vlanMode || '', edge.data?.vlans || '', edge.data?.label || '']));

    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    anchor.download = `network-inventory-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const runAutoLayout = () => {
    recordHistory();
    const nextNodes = autoLayout(nodesRef.current, edgesRef.current);
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const fitDiagram = () => fitView({ padding: 0.2 });

  return (
    <div className="flex w-full h-[800px] border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#0a0a0a]">
      <Sidebar 
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        updateNodeData={updateNodeData}
        updateEdgeData={updateEdgeData}
        onAddNode={addNode}
        duplicateSelected={duplicateSelected}
        deleteSelected={deleteSelected}
        undo={undo}
        redo={redo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        autoLayout={runAutoLayout}
        fitView={fitDiagram}
        validationIssues={validationIssues}
        validate={() => notify(validationIssues.length === 0 ? 'No topology issues detected.' : `${validationIssues.length} topology issue${validationIssues.length === 1 ? '' : 's'} found.`, validationIssues.some(issue => issue.severity === 'error') ? 'error' : 'info')}
        exportDiagram={exportDiagram}
        exportSvg={exportSvg}
        exportInventory={exportInventory}
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
          onNodeDragStart={onNodeDragStart}
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
          <MiniMap
            pannable
            zoomable
            nodeColor={node => (node.data as { status?: string } | undefined)?.status === 'offline' ? '#ef4444' : '#00ff9c'}
            maskColor="rgba(0, 0, 0, 0.72)"
            style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a' }}
          />
          <Panel position="bottom-left" className="!m-3 !rounded border border-[#1a1a1a] !bg-[#050505]/95 px-2.5 py-1.5 font-mono text-[10px] text-zinc-500">
            <span className="text-[#00ff9c]">{nodes.length}</span> nodes · <span className="text-[#38bdf8]">{edges.length}</span> links · {validationIssues.length === 0 ? <span className="text-[#72e6b4]">topology ok</span> : <span className="text-amber-300">{validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}</span>}
          </Panel>
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

function cloneNodes(nodes: NetworkNode[]): NetworkNode[] {
  return nodes.map(node => ({ ...node, position: { ...node.position }, data: { ...node.data } }));
}

function cloneEdges(edges: NetworkEdge[]): NetworkEdge[] {
  return edges.map(edge => ({ ...edge, data: edge.data ? { ...edge.data } : edge.data }));
}
