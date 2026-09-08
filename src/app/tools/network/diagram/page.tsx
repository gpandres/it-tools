"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ReactFlow, Controls, MiniMap, Panel, Background, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant, ReactFlowProvider, SelectionMode, useReactFlow, getViewportForBounds, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';

import { ToolLayout } from "@/components/tool-layout";
import NetworkNodeComponent from './nodes/NetworkNode';
import NetworkEdgeComponent from './edges/NetworkEdge';
import Sidebar from './components/Sidebar';
import { DiagramExportPanel, DiagramGuide } from './components/DiagramSupportPanels';
import { TEMPLATES } from './components/Templates';
import { readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { parseDiagram, validateDiagram } from '@/lib/diagram-validation';
import { autoLayout } from '@/lib/diagram-layout';
import { useNotification } from '@/components/notification-provider';
import { downloadBlob, downloadUrl } from '@/lib/browser-download';
import { serializeNetworkDiagram, serializeNetworkInventory } from '@/lib/network-diagram-export';
import { analyzeNetworkTopology, findNetworkPath } from '@/lib/diagram-analysis';
import { serializeNetworkMarkdown } from '@/lib/network-diagram-documentation';
import type { DiagramMetadata } from '@/lib/diagram-validation';
import type { NetworkEdge, NetworkNode, NetworkNodeData, NetworkNodeType, DiagramSnapshot } from './types';

const nodeTypes = { networkNode: NetworkNodeComponent };
const edgeTypes = { networkEdge: NetworkEdgeComponent };
const DEFAULT_DIAGRAM_METADATA: DiagramMetadata = { title: 'Network topology', description: 'Network topology documentation generated locally in the browser.' };

function DiagramFlow() {
  const [nodes, setNodes] = useState<NetworkNode[]>(() => cloneNodes(TEMPLATES["Empty Canvas"].nodes as NetworkNode[]));
  const [edges, setEdges] = useState<NetworkEdge[]>(() => cloneEdges(TEMPLATES["Empty Canvas"].edges as NetworkEdge[]));
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [history, setHistory] = useState<DiagramSnapshot[]>([]);
  const [future, setFuture] = useState<DiagramSnapshot[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [diagramMetadata, setDiagramMetadata] = useState<DiagramMetadata>(DEFAULT_DIAGRAM_METADATA);
  const exportInFlight = useRef(false);
  const { notify } = useNotification();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<NetworkNode[]>(nodes);
  const edgesRef = useRef<NetworkEdge[]>(edges);
  const { screenToFlowPosition, fitView, getNodesBounds: getNodesBoundsFromFlow } = useReactFlow();

  const selectedNode = useMemo(() => selectedNodeIds.length === 1 ? nodes.find(node => node.id === selectedNodeIds[0]) as NetworkNode | undefined ?? null : null, [nodes, selectedNodeIds]);
  const selectedEdge = useMemo(() => selectedEdgeIds.length === 1 ? edges.find(edge => edge.id === selectedEdgeIds[0]) as NetworkEdge | undefined ?? null : null, [edges, selectedEdgeIds]);
  const selectedNodes = useMemo(() => nodes.filter(node => selectedNodeIds.includes(node.id)), [nodes, selectedNodeIds]);
  const canGroup = selectedNodes.length >= 2 && selectedNodes.every(node => !node.parentId && node.data.type !== 'group');
  const canUngroup = selectedNodes.length === 1 && selectedNodes[0].data.type === 'group';
  const validationIssues = useMemo(() => validateDiagram({ nodes, edges }), [nodes, edges]);
  const topologyAnalysis = useMemo(() => analyzeNetworkTopology(nodes, edges), [nodes, edges]);
  const topologyNodes = useMemo(() => nodes.filter(node => node.data.type !== 'group').map(node => ({ id: node.id, label: node.data.label || node.id })), [nodes]);
  const findPath = useCallback((sourceId: string, targetId: string) => findNetworkPath(nodesRef.current, edgesRef.current, sourceId, targetId), []);

  const recordHistory = useCallback(() => {
    setHistory(current => [...current.slice(-29), { nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }]);
    setFuture([]);
  }, []);

  const replaceDiagram = useCallback((nextNodes: NetworkNode[], nextEdges: NetworkEdge[], remember = true) => {
    if (remember) recordHistory();
    const safeNodes = cloneNodes(nextNodes).map(node => ({ ...node, selected: false }));
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
        const parsedValue = JSON.parse(saved);
        const parsed = parseDiagram(parsedValue);
        if (parsed) {
          if (parsed.metadata) setDiagramMetadata(current => ({ ...current, ...parsed.metadata }));
          if (parsed.nodes.length > 0) {
            const { nodes: savedNodes, edges: savedEdges } = parsed;
            replaceDiagram(savedNodes as NetworkNode[], savedEdges as NetworkEdge[], false);
            setTimeout(() => fitView(), 100);
          }
        }
      } catch (e) {
        console.error("Failed to parse saved diagram", e);
      }
    }
  }, [fitView, replaceDiagram]);

  // Save to local storage on change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      writeLocalStorage('network_diagram', JSON.stringify({ nodes, edges, metadata: diagramMetadata }));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [nodes, edges, diagramMetadata]);

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
    const nextNodeIds = selectedNodes.map(node => node.id).sort();
    const nextEdgeIds = selectedEdges.map(edge => edge.id).sort();
    setSelectedNodeIds(current => sameIds(current, nextNodeIds) ? current : nextNodeIds);
    setSelectedEdgeIds(current => sameIds(current, nextEdgeIds) ? current : nextEdgeIds);
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
    if (selectedNodeIds.length > 0) {
      recordHistory();
      const nodeIds = new Set(selectedNodeIds);
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of nodesRef.current) {
          if (node.parentId && nodeIds.has(node.parentId) && !nodeIds.has(node.id)) {
            nodeIds.add(node.id);
            changed = true;
          }
        }
      }
      const nextNodes = nodesRef.current.filter(node => !nodeIds.has(node.id));
      const nextEdges = edgesRef.current.filter(edge => !nodeIds.has(edge.source) && !nodeIds.has(edge.target));
      replaceDiagram(nextNodes, nextEdges, false);
      setSelectedNodeIds([]);
      setSelectedEdgeIds([]);
      return;
    }
    if (selectedEdgeIds.length > 0) {
      recordHistory();
      const edgeIds = new Set(selectedEdgeIds);
      replaceDiagram(nodesRef.current, edgesRef.current.filter(edge => !edgeIds.has(edge.id)), false);
      setSelectedEdgeIds([]);
    }
  }, [recordHistory, replaceDiagram, selectedEdgeIds, selectedNodeIds]);

  const duplicateSelected = useCallback(() => {
    const selected = nodesRef.current.filter(node => selectedNodeIds.includes(node.id));
    if (selected.length === 0) return;
    recordHistory();
    const now = Date.now();
    const copies: NetworkNode[] = [];
    const idMap = new Map<string, string>();
    selected.filter(node => node.data.type === 'group').forEach((group, index) => {
      const copyId = `group_${now}_${index}`;
      idMap.set(group.id, copyId);
      copies.push({ ...group, id: copyId, position: { x: group.position.x + (group.width ?? 200) + 48, y: group.position.y + 48 }, selected: false, data: { ...group.data, label: `${group.data.label} copy` } });
      nodesRef.current.filter(node => node.parentId === group.id).forEach((child, childIndex) => {
        const childCopyId = `node_${now}_${index}_${childIndex}`;
        idMap.set(child.id, childCopyId);
        copies.push({ ...child, id: childCopyId, parentId: copyId, selected: false, position: { ...child.position }, data: { ...child.data } });
      });
    });
    selected.filter(node => node.data.type !== 'group' && !node.parentId).forEach((node, index) => {
      const copyId = `node_${now}_${index}_${copies.length}`;
      idMap.set(node.id, copyId);
      copies.push({ ...node, id: copyId, position: { x: node.position.x + 48, y: node.position.y + 48 }, selected: false, data: { ...node.data, label: `${node.data.label} copy` } });
    });
    if (copies.length === 0) {
      notify('Select top-level nodes or a group to duplicate.', 'info');
      return;
    }
    const copiedTopLevelIds = new Set(copies.filter(node => !node.parentId).map(node => node.id));
    const nextNodes = [...nodesRef.current.map(node => ({ ...node, selected: false })), ...copies.map(node => ({ ...node, selected: copiedTopLevelIds.has(node.id) }))];
    const copiedEdges = edgesRef.current.filter(edge => idMap.has(edge.source) && idMap.has(edge.target)).map((edge, index) => ({ ...edge, id: `edge_${now}_${index}`, source: idMap.get(edge.source) as string, target: idMap.get(edge.target) as string, selected: false, data: edge.data ? { ...edge.data } : edge.data }));
    nodesRef.current = nextNodes;
    const nextEdges = [...edgesRef.current, ...copiedEdges];
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeIds(copies.filter(node => !node.parentId).map(node => node.id));
    setSelectedEdgeIds([]);
  }, [notify, recordHistory, selectedNodeIds]);

  const groupSelected = useCallback(() => {
    const groupable = nodesRef.current.filter(node => selectedNodeIds.includes(node.id));
    if (groupable.length < 2 || groupable.some(node => node.parentId || node.data.type === 'group')) {
      notify('Select at least two top-level nodes to create a group.', 'info');
      return;
    }
    recordHistory();
    const bounds = getNodeBounds(groupable);
    const groupId = `group_${Date.now()}_${nodesRef.current.length}`;
    const groupNode: NetworkNode = {
      id: groupId,
      type: 'networkNode',
      position: { x: bounds.x - 40, y: bounds.y - 40 },
      width: bounds.width + 80,
      height: bounds.height + 80,
      zIndex: -1,
      selected: true,
      data: { label: 'Network group', type: 'group', status: 'active', notes: 'Movable container for grouped topology nodes.' },
    };
    const selectedIds = new Set(selectedNodeIds);
    const nextNodes = [groupNode, ...nodesRef.current.map(node => selectedIds.has(node.id) ? { ...node, selected: false, parentId: groupId, extent: 'parent' as const, position: { x: node.position.x - bounds.x + 40, y: node.position.y - bounds.y + 40 } } : { ...node, selected: false })];
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setSelectedNodeIds([groupId]);
    setSelectedEdgeIds([]);
  }, [notify, recordHistory, selectedNodeIds]);

  const ungroupSelected = useCallback(() => {
    if (!canUngroup || !selectedNode) return;
    recordHistory();
    const group = selectedNode;
    const children = nodesRef.current.filter(node => node.parentId === group.id);
    const childIds = new Set(children.map(node => node.id));
    const nextNodes = nodesRef.current.filter(node => node.id !== group.id).map(node => {
      if (node.parentId !== group.id) return { ...node, selected: false };
      return { ...node, selected: childIds.has(node.id), parentId: undefined, extent: undefined, position: { x: group.position.x + node.position.x, y: group.position.y + node.position.y } };
    });
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setSelectedNodeIds(children.map(node => node.id));
    setSelectedEdgeIds([]);
  }, [canUngroup, recordHistory, selectedNode]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture(current => [{ nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }, ...current].slice(0, 30));
    setHistory(current => current.slice(0, -1));
    replaceDiagram(previous.nodes, previous.edges, false);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [history, replaceDiagram]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setHistory(current => [...current, { nodes: cloneNodes(nodesRef.current), edges: cloneEdges(edgesRef.current) }].slice(-30));
    setFuture(current => current.slice(1));
    replaceDiagram(next.nodes, next.edges, false);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
  }, [future, replaceDiagram]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setFocusMode(false);
        return;
      }
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
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const exportDiagram = () => {
    const serialized = serializeNetworkDiagram(nodes, edges, diagramMetadata);
    if (!serialized) {
      notify('The current diagram cannot be exported because it is invalid.', 'error');
      return;
    }
    downloadBlob(new Blob([serialized], { type: 'application/json;charset=utf-8' }), `network-diagram-${Date.now()}.json`);
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
          if (parsed.metadata) setDiagramMetadata(current => ({ ...current, ...parsed.metadata }));
          setSelectedNodeIds([]);
          setSelectedEdgeIds([]);
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
    const nodesBounds = getNodesBoundsFromFlow(nodes);
    
    // Keep ordinary exports crisp while reducing raster work for large
    // diagrams. The viewport transform still includes every node and edge.
    const isLargeDiagram = nodes.length > 300;
    const imageWidth = isLargeDiagram ? 1600 : 1920;
    const imageHeight = isLargeDiagram ? 900 : 1080;
    const pixelRatio = isLargeDiagram ? 0.75 : 1;
    
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.01, 2, 0.1);
    
    const element = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!element) return;
    
    const backgroundColor = bgColor === 'black' ? '#0a0a0a' : (bgColor === 'white' ? '#ffffff' : 'transparent');

    if (exportInFlight.current) {
      notify('An export is already being generated. Please wait for it to finish.', 'info');
      return;
    }
    exportInFlight.current = true;
    if (isLargeDiagram) notify('Generating a lighter export for this large topology.', 'info');

    toPng(element, {
      backgroundColor,
      width: imageWidth,
      height: imageHeight,
      pixelRatio,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
    }).then((dataUrl) => {
      downloadUrl(dataUrl, `network-diagram-${bgColor}.png`);
    }).catch(() => notify("Could not export the diagram image.", "error")).finally(() => {
      exportInFlight.current = false;
    });
  };

  const exportSvg = () => {
    if (nodes.length === 0) {
      notify('Add at least one node before exporting an SVG.', 'error');
      return;
    }

    const nodesBounds = getNodesBoundsFromFlow(nodes);
    const imageWidth = 1920;
    const imageHeight = 1080;
    const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.01, 2, 0.1);
    const element = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!element) {
      notify('The diagram canvas is not ready for export.', 'error');
      return;
    }

    if (exportInFlight.current) {
      notify('An export is already being generated. Please wait for it to finish.', 'info');
      return;
    }
    exportInFlight.current = true;

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
      downloadUrl(dataUrl, `network-diagram-${Date.now()}.svg`);
    }).catch(() => notify('Could not export the diagram as SVG.', 'error')).finally(() => {
      exportInFlight.current = false;
    });
  };

  const exportInventory = () => {
    const csv = serializeNetworkInventory(nodes, edges);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `network-inventory-${Date.now()}.csv`);
  };

  const exportMarkdown = () => {
    const markdown = serializeNetworkMarkdown(nodes, edges, topologyAnalysis, validationIssues, diagramMetadata);
    downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `network-documentation-${Date.now()}.md`);
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
    <>
      <div className="relative">
        <div className="mb-4 2xl:hidden"><DiagramGuide /></div>
        <div className="pointer-events-auto absolute right-full top-0 mr-6 hidden w-56 2xl:block"><DiagramGuide /></div>
        <div className={`${focusMode ? 'fixed inset-3 z-50 h-[calc(100dvh-1.5rem)]' : 'h-[800px]'} flex w-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]`} data-testid="network-diagram-editor" role="application" aria-label="Network diagram editor">
      <Sidebar 
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        selectedNodeCount={selectedNodeIds.length}
        selectedEdgeCount={selectedEdgeIds.length}
        updateNodeData={updateNodeData}
        updateEdgeData={updateEdgeData}
        onAddNode={addNode}
        duplicateSelected={duplicateSelected}
        deleteSelected={deleteSelected}
        undo={undo}
        redo={redo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        groupSelected={groupSelected}
        ungroupSelected={ungroupSelected}
        canGroup={canGroup}
        canUngroup={canUngroup}
        autoLayout={runAutoLayout}
        fitView={fitDiagram}
        validationIssues={validationIssues}
        diagramMetadata={diagramMetadata}
        updateDiagramMetadata={newMetadata => setDiagramMetadata(current => ({ ...current, ...newMetadata }))}
        topologyNodes={topologyNodes}
        topologyAnalysis={topologyAnalysis}
        findPath={findPath}
        validate={() => notify(validationIssues.length === 0 ? 'No topology issues detected.' : `${validationIssues.length} topology issue${validationIssues.length === 1 ? '' : 's'} found.`, validationIssues.some(issue => issue.severity === 'error') ? 'error' : 'info')}
        loadTemplate={loadTemplate}
        showMinimap={showMinimap}
        toggleMinimap={() => setShowMinimap(current => !current)}
        focusMode={focusMode}
        toggleFocusMode={() => setFocusMode(current => !current)}
      />
      <div className="h-full flex-1" ref={reactFlowWrapper} data-testid="network-diagram-canvas" aria-label="Network diagram canvas">
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
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Shift"
          selectionMode={SelectionMode.Partial}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
          className="bg-[#050505]"
        >
          <Background color="#1a1a1a" variant={BackgroundVariant.Dots} gap={20} size={2} />
          <Controls style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a' }} />
          {showMinimap && <MiniMap
              pannable
              zoomable
              nodeColor={node => (node.data as { status?: string } | undefined)?.status === 'offline' ? '#ef4444' : '#00ff9c'}
              maskColor="rgba(0, 0, 0, 0.72)"
              style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a' }}
            />}
          <Panel position="bottom-left" className="!m-3 !rounded border border-[#1a1a1a] !bg-[#050505]/95 px-2.5 py-1.5 font-mono text-[10px] text-zinc-500" aria-live="polite">
            <span className="text-[#00ff9c]">{nodes.length}</span> nodes · <span className="text-[#38bdf8]">{edges.length}</span> links · {validationIssues.length === 0 ? <span className="text-[#72e6b4]">topology ok</span> : <span className="text-amber-300">{validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}</span>}
          </Panel>
        </ReactFlow>
      </div>
        </div>
      </div>
      <DiagramExportPanel exportImage={exportImage} exportSvg={exportSvg} exportInventory={exportInventory} exportDiagram={exportDiagram} exportMarkdown={exportMarkdown} importDiagram={importDiagram} />
    </>
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

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function getNodeBounds(nodes: NetworkNode[]) {
  const left = Math.min(...nodes.map(node => node.position.x));
  const top = Math.min(...nodes.map(node => node.position.y));
  const right = Math.max(...nodes.map(node => node.position.x + (node.width ?? 120)));
  const bottom = Math.max(...nodes.map(node => node.position.y + (node.height ?? 100)));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
