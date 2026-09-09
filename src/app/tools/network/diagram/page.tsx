"use client";

import { useState, useCallback, useRef, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { ReactFlow, Controls, MiniMap, Panel, Background, applyNodeChanges, applyEdgeChanges, addEdge, BackgroundVariant, ReactFlowProvider, SelectionMode, useReactFlow, getViewportForBounds, type Connection, type EdgeChange, type NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng, toSvg } from 'html-to-image';
import { Copy, FileArchive, Group, LayoutDashboard, Maximize2, Minimize2, Network as NetworkIcon, Redo2, Save, Settings2, Trash2, Undo2, Ungroup } from 'lucide-react';

import { ToolLayout } from "@/components/tool-layout";
import { distributeEdgeLanes } from '@/lib/diagram-routing';
import NetworkNodeComponent from './nodes/NetworkNode';
import NetworkEdgeComponent from './edges/NetworkEdge';
import Sidebar from './components/Sidebar';
import { DiagramExportPanel, DiagramWorkspacePanel } from './components/DiagramSupportPanels';
import { ToolActionButton, ToolActionPanel, ToolDialog } from '@/components/tool-design';
import { TEMPLATES } from './components/Templates';
import { hasStorageConsent, readLocalStorage, writeLocalStorage } from '@/lib/storage';
import { parseDiagram, validateDiagram } from '@/lib/diagram-validation';
import { autoLayout } from '@/lib/diagram-layout';
import { useNotification } from '@/components/notification-provider';
import { downloadBlob, downloadUrl } from '@/lib/browser-download';
import { serializeNetworkDiagram, serializeNetworkInventory } from '@/lib/network-diagram-export';
import { analyzeNetworkTopology, findNetworkPath } from '@/lib/diagram-analysis';
import { serializeNetworkMarkdown } from '@/lib/network-diagram-documentation';
import { MAX_SAVED_NETWORK_DIAGRAMS, readNetworkDiagramLibrary, writeNetworkDiagramLibrary, type SavedNetworkDiagram } from '@/lib/network-diagram-workspace';
import type { DiagramMetadata } from '@/lib/diagram-validation';
import type { NetworkEdge, NetworkNode, NetworkNodeData, NetworkNodeType, DiagramSnapshot } from './types';

const nodeTypes = { networkNode: NetworkNodeComponent };
const edgeTypes = { networkEdge: NetworkEdgeComponent };
const DEFAULT_DIAGRAM_METADATA: DiagramMetadata = { title: 'Network topology', description: 'Network topology documentation generated locally in the browser.' };
type DiagramAppearance = { deviceDensity: 'compact' | 'comfortable'; deviceStyle: 'solid' | 'outline' | 'minimal'; cableWeight: 'fine' | 'standard' | 'bold'; grid: 'subtle' | 'dense' | 'off'; edgeLabels: 'selected' | 'always' };
const DEFAULT_DIAGRAM_APPEARANCE: DiagramAppearance = { deviceDensity: 'comfortable', deviceStyle: 'solid', cableWeight: 'standard', grid: 'subtle', edgeLabels: 'selected' };

function DiagramFlow() {
  const [nodes, setNodes] = useState<NetworkNode[]>(() => cloneNodes(TEMPLATES["Empty Canvas"].nodes as NetworkNode[]));
  const [edges, setEdges] = useState<NetworkEdge[]>(() => cloneEdges(TEMPLATES["Empty Canvas"].edges as NetworkEdge[]));
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [history, setHistory] = useState<DiagramSnapshot[]>([]);
  const [future, setFuture] = useState<DiagramSnapshot[]>([]);
  const [showMinimap, setShowMinimap] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileToolboxOpen, setMobileToolboxOpen] = useState(false);
  const [diagramMetadata, setDiagramMetadata] = useState<DiagramMetadata>(DEFAULT_DIAGRAM_METADATA);
  const [savedDiagrams, setSavedDiagrams] = useState<SavedNetworkDiagram[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [appearance, setAppearance] = useState<DiagramAppearance>(DEFAULT_DIAGRAM_APPEARANCE);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const exportInFlight = useRef(false);
  const diagramClipboardRef = useRef<DiagramSnapshot | null>(null);
  const workspaceLoaded = useRef(false);
  const workspacePersistErrorShown = useRef(false);
  const { notify } = useNotification();
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<NetworkNode[]>(nodes);
  const edgesRef = useRef<NetworkEdge[]>(edges);
  const { screenToFlowPosition, fitView, getNodesBounds: getNodesBoundsFromFlow } = useReactFlow();

  const selectedNode = useMemo(() => selectedNodeIds.length === 1 ? nodes.find(node => node.id === selectedNodeIds[0]) as NetworkNode | undefined ?? null : null, [nodes, selectedNodeIds]);
  const selectedEdge = useMemo(() => selectedEdgeIds.length === 1 ? edges.find(edge => edge.id === selectedEdgeIds[0]) as NetworkEdge | undefined ?? null : null, [edges, selectedEdgeIds]);
  const renderedEdges = useMemo(() => distributeEdgeLanes(edges), [edges]);
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
    const safeEdges = distributeEdgeLanes(cloneEdges(nextEdges));
    nodesRef.current = safeNodes;
    edgesRef.current = safeEdges;
    setNodes(safeNodes);
    setEdges(safeEdges);
  }, [recordHistory]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = readLocalStorage('network_diagram');
    if (saved) {
      try {
        const parsedValue = JSON.parse(saved);
        const parsed = parseDiagram(parsedValue);
        if (parsed) {
          // Hydrate persisted metadata once after the browser storage read.
          // eslint-disable-next-line react-hooks/set-state-in-effect
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
    setSavedDiagrams(readNetworkDiagramLibrary());
    workspaceLoaded.current = true;
  }, [fitView, replaceDiagram]);

  // Save to local storage on change
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      writeLocalStorage('network_diagram', JSON.stringify({ nodes, edges, metadata: diagramMetadata }));
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [nodes, edges, diagramMetadata]);

  useEffect(() => {
    if (!workspaceLoaded.current || !hasStorageConsent()) return;
    if (!writeNetworkDiagramLibrary(savedDiagrams)) {
      if (!workspacePersistErrorShown.current) {
        notify('Could not persist the diagram workspace. Browser storage may be full.', 'error');
        workspacePersistErrorShown.current = true;
      }
      return;
    }
    workspacePersistErrorShown.current = false;
  }, [notify, savedDiagrams]);

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
      const nextEdges = distributeEdgeLanes(addEdge({ ...params, type: 'networkEdge', data: { connectionType: 'ethernet', vlanMode: 'unknown' } }, edgesRef.current) as NetworkEdge[]);
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
    const nextEdges = distributeEdgeLanes(edgesRef.current.map(edge => edge.id === edgeId ? { ...edge, data: { connectionType: edge.data?.connectionType ?? 'ethernet', ...edge.data, ...newData } } : edge) as NetworkEdge[]);
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

  const copySelection = useCallback(() => {
    if (selectedNodeIds.length === 0) {
      notify('Select one or more devices to copy.', 'info');
      return false;
    }
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
    const copiedNodes = cloneNodes(nodesRef.current.filter(node => nodeIds.has(node.id)));
    const copiedEdges = cloneEdges(edgesRef.current.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target)));
    diagramClipboardRef.current = { nodes: copiedNodes, edges: copiedEdges };
    notify(`Copied ${copiedNodes.length} device${copiedNodes.length === 1 ? '' : 's'}.`, 'info');
    return true;
  }, [notify, selectedNodeIds]);

  const pasteSelection = useCallback(() => {
    const clipboard = diagramClipboardRef.current;
    if (!clipboard || clipboard.nodes.length === 0) {
      notify('Copy one or more devices before pasting.', 'info');
      return;
    }
    recordHistory();
    const timestamp = Date.now();
    const idMap = new Map<string, string>();
    clipboard.nodes.forEach((node, index) => idMap.set(node.id, `${node.data.type === 'group' ? 'group' : 'node'}_${timestamp}_${index}`));
    const copiedNodes = clipboard.nodes.map(node => {
      const parentId = node.parentId && idMap.get(node.parentId);
      return {
        ...node,
        id: idMap.get(node.id) as string,
        parentId,
        extent: parentId ? node.extent : undefined,
        position: parentId ? { ...node.position } : { x: node.position.x + 48, y: node.position.y + 48 },
        selected: !parentId,
        data: { ...node.data },
      };
    });
    const copiedEdges = clipboard.edges.map((edge, index) => ({ ...edge, id: `edge_${timestamp}_${index}`, source: idMap.get(edge.source) as string, target: idMap.get(edge.target) as string, selected: false, data: edge.data ? { ...edge.data } : edge.data }));
    const nextNodes = [...nodesRef.current.map(node => ({ ...node, selected: false })), ...copiedNodes];
    const nextEdges = [...edgesRef.current.map(edge => ({ ...edge, selected: false })), ...copiedEdges];
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeIds(copiedNodes.filter(node => !node.parentId).map(node => node.id));
    setSelectedEdgeIds([]);
    notify(`Pasted ${copiedNodes.length} device${copiedNodes.length === 1 ? '' : 's'}.`, 'info');
  }, [notify, recordHistory]);

  const selectAll = useCallback(() => {
    const nextNodes = nodesRef.current.map(node => ({ ...node, selected: true }));
    const nextEdges = edgesRef.current.map(edge => ({ ...edge, selected: true }));
    nodesRef.current = nextNodes;
    edgesRef.current = nextEdges;
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeIds(nextNodes.map(node => node.id));
    setSelectedEdgeIds(nextEdges.map(edge => edge.id));
  }, []);

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
      data: { label: 'Network group', type: 'group', status: 'active', groupColor: '#00ff9c', notes: 'Movable container for grouped topology nodes.' },
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
      if (document.querySelector('[role=dialog]')) return;
      if (event.key === 'Shift') {
        setIsShiftHeld(true);
        return;
      }
      if (event.key === 'Escape') {
        setFocusMode(false);
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === 'a') {
        event.preventDefault();
        selectAll();
      } else if (modifier && key === 'c') {
        event.preventDefault();
        copySelection();
      } else if (modifier && key === 'x') {
        event.preventDefault();
        if (copySelection()) deleteSelected();
      } else if (modifier && key === 'v') {
        event.preventDefault();
        pasteSelection();
      } else if (modifier && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if (modifier && key === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelected();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') setIsShiftHeld(false);
    };
    const onWindowBlur = () => setIsShiftHeld(false);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [copySelection, deleteSelected, pasteSelection, redo, selectAll, undo]);

  const onNodeDragStart = useCallback(() => recordHistory(), [recordHistory]);

  const loadTemplate = (templateName: string) => {
    const template = TEMPLATES[templateName as keyof typeof TEMPLATES];
    if (!template) return;
    replaceDiagram(template.nodes as NetworkNode[], template.edges as NetworkEdge[]);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const clearCanvas = useCallback(() => {
    if (nodesRef.current.length === 0 && edgesRef.current.length === 0) {
      notify('The canvas is already empty.', 'info');
      return;
    }
    recordHistory();
    nodesRef.current = [];
    edgesRef.current = [];
    setNodes([]);
    setEdges([]);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    notify('Canvas cleared. Use Undo to restore it.', 'info');
  }, [notify, recordHistory]);

  const exportDiagram = () => {
    const serialized = serializeNetworkDiagram(nodes, edges, diagramMetadata);
    if (!serialized) {
      notify('The current diagram cannot be exported because it is invalid.', 'error');
      return;
    }
    downloadBlob(new Blob([serialized], { type: 'application/json;charset=utf-8' }), `network-diagram-${Date.now()}.json`);
    notify('Diagram JSON exported.');
  };

  const importDiagram = async (file: File): Promise<string | null> => {
    if (file.size > 2 * 1024 * 1024) return 'Diagram files are limited to 2 MB.';
    try {
      const parsed = parseDiagram(JSON.parse(await file.text()));
      if (!parsed) return 'Invalid diagram JSON format. Check the nodes and links.';
      replaceDiagram(parsed.nodes as NetworkNode[], parsed.edges as NetworkEdge[]);
      if (parsed.metadata) setDiagramMetadata(current => ({ ...current, ...parsed.metadata }));
      setSelectedNodeIds([]);
      setSelectedEdgeIds([]);
      setLibraryDialogOpen(false);
      notify('Diagram imported. Undo restores the previous topology.');
      setTimeout(() => fitView({ padding: 0.2 }), 100);
      return null;
    } catch {
      return 'Could not read a valid JSON diagram. Check the file and try again.';
    }
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
    const usesLightExport = bgColor === 'white';
    if (usesLightExport) element.classList.add('diagram-export-light');

    toPng(element, {
      filter: node => !(node instanceof Element && node.matches('.react-flow__handle, .react-flow__resize-control')),
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
      notify('Diagram PNG exported.');
    }).catch(() => notify("Could not export the diagram image.", "error")).finally(() => {
      if (usesLightExport) element.classList.remove('diagram-export-light');
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
      filter: node => !(node instanceof Element && node.matches('.react-flow__handle, .react-flow__resize-control')),
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
      notify('Diagram SVG exported.');
    }).catch(() => notify('Could not export the diagram as SVG.', 'error')).finally(() => {
      exportInFlight.current = false;
    });
  };

  const exportInventory = () => {
    const csv = serializeNetworkInventory(nodes, edges);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `network-inventory-${Date.now()}.csv`);
    notify('CSV inventory exported.');
  };

  const exportMarkdown = () => {
    const markdown = serializeNetworkMarkdown(nodes, edges, topologyAnalysis, validationIssues, diagramMetadata);
    downloadBlob(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `network-documentation-${Date.now()}.md`);
    notify('Markdown documentation exported.');
  };

  const saveWorkspaceSnapshot = () => {
    if (nodesRef.current.length === 0) {
      notify('Add at least one node before saving a diagram snapshot.', 'info');
      return;
    }
    const timestamp = Date.now();
    const title = diagramMetadata.title?.trim() || 'Untitled topology';
    const snapshot: SavedNetworkDiagram = {
      id: `diagram_${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${timestamp}_${Math.random().toString(36).slice(2)}`}`,
      title,
      description: diagramMetadata.description?.trim() || '',
      nodes: cloneNodes(nodesRef.current),
      edges: cloneEdges(edgesRef.current),
      updatedAt: timestamp,
    };
    setSavedDiagrams(current => [snapshot, ...current].slice(0, MAX_SAVED_NETWORK_DIAGRAMS));
    notify(`Saved local snapshot: ${title}`, 'info');
  };

  const loadWorkspaceSnapshot = (snapshot: SavedNetworkDiagram) => {
    replaceDiagram(snapshot.nodes, snapshot.edges);
    setDiagramMetadata({ title: snapshot.title, description: snapshot.description });
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
    setLibraryDialogOpen(false);
    notify(`Loaded local snapshot: ${snapshot.title}`, 'info');
  };

  const deleteWorkspaceSnapshot = (snapshotId: string) => {
    setSavedDiagrams(current => current.filter(snapshot => snapshot.id !== snapshotId));
    notify('Local diagram snapshot deleted.', 'info');
  };

  const runAutoLayout = () => {
    recordHistory();
    const nextNodes = autoLayout(nodesRef.current, edgesRef.current);
    nodesRef.current = nextNodes;
    setNodes(nextNodes);
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  };

  const canvasStyle = {
    '--diagram-node-min-height': appearance.deviceDensity === 'compact' ? '72px' : '92px',
    '--diagram-node-min-width': appearance.deviceDensity === 'compact' ? '136px' : '172px',
    '--diagram-edge-width': appearance.cableWeight === 'fine' ? '1.5px' : appearance.cableWeight === 'bold' ? '3px' : '2px',
  } as CSSProperties;
  const gridGap = appearance.grid === 'dense' ? 16 : 24;

  return (
    <>
      <section className={`${focusMode ? 'fixed inset-0 z-50 h-dvh border-0' : 'relative h-[min(800px,calc(100dvh-8rem))] min-h-[29rem] sm:min-h-[34rem] 2xl:h-[min(1080px,calc(100dvh-8rem))]'} flex w-full flex-col overflow-hidden border border-[#1a1a1a] bg-[#050505]`} data-testid="network-diagram-editor" role="application" aria-label="Network diagram editor">
        <ToolActionPanel className="shrink-0 gap-1.5 border-x-0 border-t-0 px-3 sm:px-4">
          <div className="hidden flex-1 items-center gap-1 sm:flex"><EditorButton label="Undo" icon={<Undo2 />} onClick={undo} disabled={history.length === 0} /><EditorButton label="Redo" icon={<Redo2 />} onClick={redo} disabled={future.length === 0} /><span className="mx-1 h-5 w-px bg-[#242424]" /><EditorButton label="Auto layout" icon={<LayoutDashboard />} onClick={runAutoLayout} /><EditorButton label="Clear" icon={<Trash2 />} onClick={clearCanvas} danger /><span className="mx-1 hidden h-5 w-px bg-[#242424] lg:block" /><span className="hidden lg:contents"><EditorButton label={showMinimap ? 'Hide map' : 'Show map'} icon={<NetworkIcon />} onClick={() => setShowMinimap(current => !current)} /><EditorButton label={focusMode ? 'Exit focus' : 'Focus'} icon={focusMode ? <Minimize2 /> : <Maximize2 />} onClick={() => setFocusMode(current => !current)} /></span></div>
          <div className="flex flex-1 items-center gap-1 sm:hidden"><EditorButton label="Undo" icon={<Undo2 />} onClick={undo} disabled={history.length === 0} /><EditorButton label="Redo" icon={<Redo2 />} onClick={redo} disabled={future.length === 0} /><EditorButton label={focusMode ? 'Exit focus' : 'Focus'} icon={focusMode ? <Minimize2 /> : <Maximize2 />} onClick={() => setFocusMode(current => !current)} /></div>
          {(selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) && <div className="flex items-center gap-1 border-l border-[#242424] pl-2"><EditorButton label="Duplicate" icon={<Copy />} onClick={duplicateSelected} />{canGroup && <EditorButton label="Group" icon={<Group />} onClick={groupSelected} />}{canUngroup && <EditorButton label="Ungroup" icon={<Ungroup />} onClick={ungroupSelected} />}<EditorButton label="Delete" icon={<span>×</span>} onClick={deleteSelected} danger /></div>}
          <EditorButton label="Settings" icon={<Settings2 />} onClick={() => setSettingsOpen(true)} />
          <ToolActionButton type="button" onClick={saveWorkspaceSnapshot} tone="accent" className="text-[10px]"><Save className="mr-1 h-3.5 w-3.5" />Save</ToolActionButton>
          <ToolActionButton type="button" onClick={() => setLibraryDialogOpen(true)} className="text-[10px]"><NetworkIcon className="mr-1 h-3.5 w-3.5 text-[#00ff9c]" />Open / import</ToolActionButton>
          <ToolActionButton type="button" onClick={() => setExportDialogOpen(true)} className="text-[10px]"><FileArchive className="mr-1 h-3.5 w-3.5 text-sky-300" />Export</ToolActionButton>
        </ToolActionPanel>
        <div className="relative flex min-h-0 flex-1">
          <button type="button" onClick={() => setMobileToolboxOpen(true)} className="absolute left-3 top-3 z-30 flex items-center gap-2 rounded-none border border-[#242424] bg-[#090a0c]/95 px-3 py-2 text-[10px] font-semibold text-zinc-300 shadow-lg hover:border-[#00ff9c] hover:text-[#00ff9c] md:hidden" aria-label="Open diagram toolbox"><NetworkIcon className="h-3.5 w-3.5 text-[#00ff9c]" />Library</button>
          {mobileToolboxOpen && <button type="button" onClick={() => setMobileToolboxOpen(false)} className="absolute inset-0 z-30 bg-black/35 md:hidden" aria-label="Close diagram toolbox overlay" />}
          <Sidebar selectedNode={selectedNode} selectedEdge={selectedEdge} selectedNodeCount={selectedNodeIds.length} selectedEdgeCount={selectedEdgeIds.length} updateNodeData={updateNodeData} updateEdgeData={updateEdgeData} onAddNode={addNode} validationIssues={validationIssues} topologyNodes={topologyNodes} topologyAnalysis={topologyAnalysis} findPath={findPath} validate={() => notify(validationIssues.length === 0 ? 'No topology issues detected.' : `${validationIssues.length} topology issue${validationIssues.length === 1 ? '' : 's'} found.`, validationIssues.some(issue => issue.severity === 'error') ? 'error' : 'info')} loadTemplate={loadTemplate} mobileOpen={mobileToolboxOpen} closeMobile={() => setMobileToolboxOpen(false)} />
          <div className="min-h-0 min-w-0 flex-1" ref={reactFlowWrapper} data-testid="network-diagram-canvas" aria-label="Network diagram canvas"><ReactFlow nodes={nodes} edges={renderedEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStart={onNodeDragStart} onDrop={onDrop} onDragOver={onDragOver} onSelectionChange={onSelectionChange} selectionKeyCode="Shift" multiSelectionKeyCode="Shift" selectionMode={SelectionMode.Partial} snapToGrid={isShiftHeld} snapGrid={[gridGap, gridGap]} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView colorMode="dark" style={canvasStyle} className={`select-none bg-[#07080a] diagram-devices-${appearance.deviceStyle} ${appearance.edgeLabels === 'selected' ? 'diagram-labels-selected' : ''}`}>
            {appearance.grid !== 'off' && <Background color="#202124" variant={BackgroundVariant.Dots} gap={gridGap} size={appearance.grid === 'dense' ? 1.1 : 1.4} />}<Controls style={{ backgroundColor: '#050505', border: '1px solid #1a1a1a', borderRadius: 0 }} />
            {showMinimap && <MiniMap pannable zoomable ariaLabel="Topology overview" nodeColor={node => { const data = node.data as { status?: string; type?: string; groupColor?: string } | undefined; return data?.type === 'group' ? data.groupColor || '#00ff9c' : data?.status === 'offline' ? '#ef4444' : '#00c782'; }} maskColor="rgba(0, 0, 0, 0.62)" nodeStrokeColor="#07080a" nodeBorderRadius={0} style={{ width: 184, height: 116, backgroundColor: 'rgba(8, 8, 8, 0.78)', border: '1px solid rgba(42,42,42,.9)', borderRadius: 0, boxShadow: 'none', opacity: 1 }} />}
            {nodes.length === 0 && <Panel position="top-center" className="!m-0 !mt-[max(2.5rem,6vh)] !w-[min(25rem,calc(100vw-3rem))]"><div className="rounded-none border border-[#1a1a1a] bg-[#050505] p-5 text-center shadow-2xl backdrop-blur"><p className="text-sm font-semibold text-zinc-100">Start a topology</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-500">Set the context, then choose a starter or add a device from the library.</p><div className="mt-4 border-y border-[#2b2d32] py-3 text-left"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Diagram details</p><div className="mt-3 space-y-2"><label className="block text-[10px] text-zinc-500">Title<input value={diagramMetadata.title || ''} onChange={event => setDiagramMetadata(current => ({ ...current, title: event.target.value }))} className="mt-1 h-8 w-full rounded-none border border-[#2b2d32] bg-black px-2 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label><label className="block text-[10px] text-zinc-500">Description<textarea value={diagramMetadata.description || ''} onChange={event => setDiagramMetadata(current => ({ ...current, description: event.target.value }))} placeholder="Purpose, scope, or change context…" className="mt-1 min-h-16 w-full resize-y rounded-none border border-[#2b2d32] bg-black px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-[#00ff9c]" /></label></div></div><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Starters</p><div className="mt-2 grid grid-cols-2 gap-2">{['Small Office', 'Enterprise Core', 'DMZ', 'VLAN Segmentation'].map(template => <ToolActionButton key={template} type="button" onClick={() => loadTemplate(template)} className="rounded-none border border-[#2b2d32] bg-black px-2 py-2 text-[10px] text-zinc-300 transition-colors hover:border-[#00ff9c]/50 hover:bg-[#00ff9c]/[0.06] hover:text-[#a9f7c8]">{template}</ToolActionButton>)}</div></div></Panel>}
            <Panel position="bottom-left" className="!m-3 !max-w-[calc(100%-1.5rem)] !rounded-none border border-[#292a2f] !bg-[#0d0e10]/95 px-2.5 py-1.5 text-[10px] text-zinc-500" aria-live="polite"><span className="text-[#73e9af]">{nodes.length}</span> devices · <span className="text-sky-300">{edges.length}</span> links · {validationIssues.length === 0 ? <span className="text-[#73e9af]">ready</span> : <span className="text-amber-300">{validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}</span>}</Panel>
          </ReactFlow></div>
        </div>
      </section>
      <ToolDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} title="Export topology" description="Create a local image, inventory, source file, or documentation." size="lg"><DiagramExportPanel exportImage={exportImage} exportSvg={exportSvg} exportInventory={exportInventory} exportDiagram={exportDiagram} exportMarkdown={exportMarkdown} /></ToolDialog>
      <ToolDialog open={libraryDialogOpen} onOpenChange={setLibraryDialogOpen} title="Open or import diagram" description="Load a local snapshot or replace the canvas with a validated JSON file." size="lg"><DiagramWorkspacePanel diagrams={savedDiagrams} onSave={saveWorkspaceSnapshot} onLoad={loadWorkspaceSnapshot} onDelete={deleteWorkspaceSnapshot} importDiagram={importDiagram} /></ToolDialog>
      <ToolDialog open={settingsOpen} onOpenChange={setSettingsOpen} title="Diagram settings" description="Tune the canvas presentation without changing topology data."><DiagramSettings appearance={appearance} onChange={setAppearance} /></ToolDialog>
    </>
  );
}

export default function NetworkDiagramPage() {
  return (
    <ToolLayout
      title="Network Diagram Generator"
      description="Create, edit and export network topology diagrams directly in your browser."
      fullWidth
    >
      <div className="h-full w-full">
        <ReactFlowProvider>
          <DiagramFlow />
        </ReactFlowProvider>
      </div>
    </ToolLayout>
  );
}

function EditorButton({ label, icon, onClick, disabled = false, danger = false }: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return <ToolActionButton type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label} tone={danger ? 'danger' : 'neutral'} className="px-2 text-[10px]"><span className="grid h-3.5 w-3.5 place-items-center [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span><span className="hidden xl:inline">{label}</span></ToolActionButton>;
}

function DiagramSettings({ appearance, onChange }: { appearance: DiagramAppearance; onChange: (next: DiagramAppearance) => void }) {
  const update = <K extends keyof DiagramAppearance>(key: K, value: DiagramAppearance[K]) => onChange({ ...appearance, [key]: value });
  return <div className="mt-2 space-y-5"><SettingsOption label="Device sizing" description="Controls the visual density of every device card." value={appearance.deviceDensity} options={[['compact', 'Compact'], ['comfortable', 'Comfortable']]} onChange={value => update('deviceDensity', value as DiagramAppearance['deviceDensity'])} /><SettingsOption label="Cable weight" description="Sets the base thickness of connections." value={appearance.cableWeight} options={[['fine', 'Fine'], ['standard', 'Standard'], ['bold', 'Bold']]} onChange={value => update('cableWeight', value as DiagramAppearance['cableWeight'])} /><SettingsOption label="Grid" description="Adjusts the canvas reference grid." value={appearance.grid} options={[['subtle', 'Subtle'], ['dense', 'Dense'], ['off', 'Off']]} onChange={value => update('grid', value as DiagramAppearance['grid'])} /><SettingsOption label="Link labels" description="Choose when connection metadata is visible." value={appearance.edgeLabels} options={[['selected', 'On selection'], ['always', 'Always']]} onChange={value => update('edgeLabels', value as DiagramAppearance['edgeLabels'])} /><DeviceStyleOptions value={appearance.deviceStyle} onChange={value => update('deviceStyle', value)} /></div>;
}

function DeviceStyleOptions({ value, onChange }: { value: DiagramAppearance['deviceStyle']; onChange: (value: DiagramAppearance['deviceStyle']) => void }) {
  const options: Array<{ value: DiagramAppearance['deviceStyle']; label: string }> = [{ value: 'solid', label: '01 / Workbench canonical' }, { value: 'outline', label: '02 / Modern product' }, { value: 'minimal', label: '03 / Retro terminal' }];
  return <section><div className="mb-2"><h3 className="text-xs font-semibold uppercase tracking-widest text-[#00ff9c]">Theme</h3><p className="mt-0.5 text-[10px] text-zinc-500">The three device box families from the diagram design reference.</p></div><div className="grid gap-2 sm:grid-cols-3">{options.map(option => <button key={option.value} type="button" onClick={() => onChange(option.value)} aria-pressed={value === option.value} className={`border p-2 text-left transition-colors ${value === option.value ? 'border-[#00ff9c]/70 bg-[#00ff9c]/[0.06]' : 'border-[#2a2a2a] bg-black hover:border-zinc-500'}`}><span className={`mb-2 flex min-h-7 items-start text-[9px] font-bold uppercase leading-tight tracking-widest ${value === option.value ? 'text-[#00ff9c]' : 'text-zinc-500'}`}>{option.label}</span><DeviceStylePreview style={option.value} /></button>)}</div></section>;
}

function DeviceStylePreview({ style }: { style: DiagramAppearance['deviceStyle'] }) {
  return <div className="grid gap-2"><PreviewDevice style={style} tone="dark" /><PreviewDevice style={style} tone="light" /></div>;
}

function PreviewDevice({ style, tone }: { style: DiagramAppearance['deviceStyle']; tone: 'dark' | 'light' }) {
  const isDark = tone === 'dark';
  const family = style === 'solid' ? 'workbench' : style === 'outline' ? 'modern' : 'retro';
  const familyClass = family === 'workbench' ? (isDark ? 'border-[#1a1a1a] bg-[#050505] text-zinc-100' : 'border-slate-400 bg-white text-slate-900') : family === 'modern' ? (isDark ? 'rounded-xl border-sky-400/50 bg-[#111827] text-zinc-100 shadow-[0_12px_30px_rgba(0,0,0,0.35)]' : 'rounded-xl border-slate-300 bg-white text-slate-900 shadow-lg') : (isDark ? 'border-[#00ff9c]/70 bg-[#06120d] text-[#b7ffd9] shadow-[3px_3px_0_#176b52]' : 'border-slate-700 bg-[#f8f4e8] text-slate-900 shadow-[3px_3px_0_#64748b]');
  const accent = family === 'retro' ? (isDark ? 'text-[#00ff9c]' : 'text-slate-700') : family === 'modern' ? (isDark ? 'text-sky-300' : 'text-blue-700') : (isDark ? 'text-[#00ff9c]' : 'text-slate-600');
  return <div className={`relative flex h-[68px] w-full flex-col justify-center border p-2 font-mono ${familyClass}`}>{family === 'retro' && <div className="pointer-events-none absolute inset-1 border border-dashed border-current opacity-20" />}{family === 'workbench' && <div className={`absolute inset-x-0 top-0 border-b px-1.5 py-1 text-[7px] font-bold uppercase tracking-widest ${isDark ? 'border-[#1a1a1a] text-[#00ff9c]' : 'border-slate-200 text-slate-500'}`}>[NODE]</div>}<div className={`flex items-center gap-1.5 ${family === 'workbench' ? 'mt-2' : ''}`}><NetworkIcon className={`h-4 w-4 shrink-0 ${accent}`} /><div className="min-w-0"><div className={`truncate text-[9px] font-bold ${family === 'workbench' && isDark ? 'text-[#ffb000]' : ''}`}>{isDark ? (family === 'modern' ? 'Firewall' : family === 'retro' ? 'Archive DB' : 'Router') : 'Light export'}</div><div className={`truncate text-[8px] ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>{isDark ? '10.0.0.1 · active' : 'print / report mode'}</div></div></div><div className={`mt-1 text-[7px] uppercase tracking-widest ${isDark ? 'text-[#72e6b4]' : 'text-emerald-700'}`}>● active</div></div>;
}

function SettingsOption({ label, description, value, options, onChange }: { label: string; description: string; value: string; options: Array<[string, string]>; onChange: (value: string) => void }) {
  return <section><div className="mb-2"><h3 className="text-xs font-semibold text-zinc-200">{label}</h3><p className="mt-0.5 text-[10px] text-zinc-500">{description}</p></div><div className="flex flex-wrap gap-1.5">{options.map(([optionValue, optionLabel]) => <ToolActionButton key={optionValue} tone={value === optionValue ? 'accent' : 'neutral'} type="button" onClick={() => onChange(optionValue)} aria-pressed={value === optionValue} className={`rounded-none border px-2.5 py-1.5 text-[10px] transition-colors ${value === optionValue ? 'border-[#00ff9c]/60 bg-[#00ff9c]/10 text-[#a9f7c8]' : 'border-[#2a2a2a] bg-black text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>{optionLabel}</ToolActionButton>)}</div></section>;
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
