import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  useReactFlow,
  useNodesInitialized,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Runbook, RunbookStep } from './types';
import RunbookNode from './RunbookNode';
import { Download, Plus, Trash2 } from 'lucide-react';
import { ToolActionButton, ToolActionPanel } from '@/components/tool-action-panel';
import { captureRunbookDiagram } from '@/lib/runbook-diagram-export';

interface DiagramBuilderProps {
  runbook: Runbook;
  onChange: (r: Runbook) => void;
  onExportReady?: (root: HTMLElement, nodes: Node[]) => void;
}

const nodeTypes = {
  runbookStep: RunbookNode
};

const decisionLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  stroke: 'var(--runbook-label-outline)',
  strokeWidth: 4,
  strokeLinejoin: 'round' as const,
  paintOrder: 'stroke' as const
};

function createStepId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function DiagramBuilderCanvas({ runbook, onChange, onExportReady }: DiagramBuilderProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const [pngBackground, setPngBackground] = useState<'black' | 'white' | 'transparent'>('black');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const [canvasNotice, setCanvasNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!onExportReady || (!nodesInitialized && runbook.steps.length > 0)) return;
    // Measurements initialize the handles first; allow the edges and labels to paint.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (diagramRef.current) onExportReady(diagramRef.current, getNodes());
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [onExportReady, nodesInitialized, runbook.steps.length, getNodes]);

  const showCanvasNotice = useCallback((message: string) => {
    setCanvasNotice(message);
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setCanvasNotice(null), 3600);
  }, []);

  useEffect(() => () => {
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current);
  }, []);

  const updateStepTitle = useCallback((id: string, title: string) => {
    onChange({ ...runbook, steps: runbook.steps.map(step => step.id === id ? { ...step, title } : step) });
  }, [runbook, onChange]);

  const updateStepDescription = useCallback((id: string, description: string) => {
    onChange({ ...runbook, steps: runbook.steps.map(step => step.id === id ? { ...step, description } : step) });
  }, [runbook, onChange]);

  const updateStepSize = useCallback((id: string, uiSize: { width: number; height: number }) => {
    onChange({ ...runbook, steps: runbook.steps.map(step => step.id === id ? { ...step, uiSize } : step) });
  }, [runbook, onChange]);
  
  // Transform Runbook Steps into ReactFlow Nodes
  const initialNodes: Node[] = useMemo(() => {
    return runbook.steps.map((step, index) => ({
      id: step.id,
      type: 'runbookStep',
      position: step.uiPosition || { x: 250, y: index * 200 },
      style: { width: step.uiSize?.width || 250, height: step.uiSize?.height || 150 },
      data: {
        ...step,
        onTitleChange: (title: string) => updateStepTitle(step.id, title),
        onDescriptionChange: (description: string) => updateStepDescription(step.id, description),
        onSizeChange: (size: { width: number; height: number }) => updateStepSize(step.id, size)
      }
    }));
  }, [runbook.steps, updateStepTitle, updateStepDescription, updateStepSize]);

  // Transform Runbook Steps into ReactFlow Edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const hiddenEdges = new Set(runbook.hiddenEdges || []);
    
    runbook.steps.forEach((step, index) => {
      if (step.type === 'decision') {
        const trueEdgeId = `e-${step.id}-true-${step.decisionTrueNext}`;
        if (step.decisionTrueNext && !hiddenEdges.has(trueEdgeId)) {
          edges.push({
            id: trueEdgeId,
            source: step.id,
            target: step.decisionTrueNext,
            sourceHandle: 'true',
            label: 'YES',
            labelShowBg: false,
            labelStyle: { ...decisionLabelStyle, fill: 'var(--runbook-yes)' },
            style: { stroke: 'var(--runbook-yes)', strokeWidth: 2 },
            animated: true
          });
        }
        const falseEdgeId = `e-${step.id}-false-${step.decisionFalseNext}`;
        if (step.decisionFalseNext && !hiddenEdges.has(falseEdgeId)) {
          edges.push({
            id: falseEdgeId,
            source: step.id,
            target: step.decisionFalseNext,
            sourceHandle: 'false',
            label: 'NO',
            labelShowBg: false,
            labelStyle: { ...decisionLabelStyle, fill: 'var(--runbook-no)' },
            style: { stroke: 'var(--runbook-no)', strokeWidth: 2 },
            animated: true
          });
        }
      } else {
        // For linear non-decision steps, if there's a logical next step (index + 1), draw a generic line
        // But since we want to fully support flowcharts, let's look at the next sequential step unless specified otherwise
        // Actually, for a fully graph-based runbook, we should probably add `nextStepId` to linear steps.
        // But to keep JSON simple, we assume linear progression by array order if not defined.
        const linearEdgeId = `e-${step.id}-linear-${runbook.steps[index + 1]?.id}`;
        if (index + 1 < runbook.steps.length && !hiddenEdges.has(linearEdgeId)) {
          const nextStep = runbook.steps[index + 1];
          // Only draw linear fallback edge if the user hasn't explicitly wired it.
          // Since our JSON doesn't strictly have a `nextStep` property for non-decisions,
          // we'll just show the implicit linear flow as gray edges.
          edges.push({
            id: linearEdgeId,
            source: step.id,
            target: nextStep.id,
            style: { stroke: 'var(--runbook-line)', strokeWidth: 2, strokeDasharray: '6 5' }
          });
        }
      }
    });

    (runbook.edges || []).forEach(edge => {
      if (hiddenEdges.has(edge.id)) return;
      edges.push({ ...edge, markerEnd: undefined });
    });
    
    return edges;
  }, [runbook.steps, runbook.edges, runbook.hiddenEdges]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Sync internal state if runbook changes externally
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setNodes(initialNodes);
      setEdges(initialEdges);
    });
    return () => cancelAnimationFrame(frame);
  }, [initialNodes, initialEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const nextNodes = applyNodeChanges(changes, nds);
        
        // Sync position back to runbook JSON if dragged
        const updatedSteps = [...runbook.steps];
        let hasChanges = false;
        
        changes.forEach(change => {
          if (change.type === 'position' && change.dragging === false && change.position) {
            const stepIndex = updatedSteps.findIndex(s => s.id === change.id);
            if (stepIndex !== -1) {
              updatedSteps[stepIndex] = {
                ...updatedSteps[stepIndex],
                uiPosition: { x: change.position.x, y: change.position.y }
              };
              hasChanges = true;
            }
          }
        });
        
        if (hasChanges) {
          // We use setTimeout to avoid React warnings about rendering during dispatch
          setTimeout(() => onChange({ ...runbook, steps: updatedSteps }), 0);
        }
        
        return nextNodes;
      });
    },
    [runbook, onChange]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
      const removed = changes.filter(change => change.type === 'remove').map(change => change.id);
      if (!removed.length) return;
      const updatedSteps = runbook.steps.map(step => {
        const trueEdge = `e-${step.id}-true-${step.decisionTrueNext}`;
        const falseEdge = `e-${step.id}-false-${step.decisionFalseNext}`;
        return {
          ...step,
          decisionTrueNext: removed.includes(trueEdge) ? undefined : step.decisionTrueNext,
          decisionFalseNext: removed.includes(falseEdge) ? undefined : step.decisionFalseNext
        };
      });
      const customEdges = (runbook.edges || []).filter(edge => !removed.includes(edge.id));
      const hiddenEdges = Array.from(new Set([...(runbook.hiddenEdges || []), ...removed.filter(id => !customEdges.some(edge => edge.id === id))]));
      onChange({ ...runbook, steps: updatedSteps, edges: customEdges, hiddenEdges });
    },
    [runbook, onChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // Decision nodes use their YES/NO handles; other nodes create custom links.
      const sourceStep = runbook.steps.find(s => s.id === connection.source);
      if (!sourceStep || !connection.target) {
        return;
      }

      if (connection.source === connection.target) {
        showCanvasNotice('A step cannot connect to itself.');
        return;
      }
      
      const updatedSteps = [...runbook.steps];
      const stepIndex = updatedSteps.findIndex(s => s.id === connection.source);
      
      if (sourceStep.type === 'decision' && connection.sourceHandle === 'true') {
        if (sourceStep.decisionFalseNext === connection.target) {
          showCanvasNotice('YES and NO cannot point to the same step.');
          return;
        }
        updatedSteps[stepIndex] = { ...sourceStep, decisionTrueNext: connection.target };
      } else if (sourceStep.type === 'decision' && connection.sourceHandle === 'false') {
        if (sourceStep.decisionTrueNext === connection.target) {
          showCanvasNotice('YES and NO cannot point to the same step.');
          return;
        }
        updatedSteps[stepIndex] = { ...sourceStep, decisionFalseNext: connection.target };
      } else {
        const duplicate = (runbook.edges || []).some(edge => edge.source === sourceStep.id && edge.target === connection.target);
        if (duplicate) {
          showCanvasNotice('That connection already exists.');
          return;
        }
        const edgeId = `e-custom-${sourceStep.id}-${connection.target}-${Date.now()}`;
        onChange({ ...runbook, edges: [...(runbook.edges || []), { id: edgeId, source: sourceStep.id, target: connection.target }] });
        return;
      }
      
      onChange({ ...runbook, steps: updatedSteps });
    },
    [runbook, onChange, showCanvasNotice]
  );

  const handleSelectionChange = useCallback(({ edges: selectedEdges }: { edges: Edge[] }) => {
    const nextIds = selectedEdges.map(edge => edge.id).sort();
    setSelectedEdgeIds(current => current.length === nextIds.length && current.every((id, index) => id === nextIds[index]) ? current : nextIds);
  }, []);

  const removeSelectedEdges = () => {
    if (!selectedEdgeIds.length) return;
    onEdgesChange(selectedEdgeIds.map(id => ({ id, type: 'remove' })));
    setSelectedEdgeIds([]);
  };

  const addStep = (type: RunbookStep['type'], position?: { x: number; y: number }) => {
    const stepNumber = runbook.steps.length + 1;
    const newStep: RunbookStep = {
      id: createStepId(),
      type,
      title: `New ${type} step`,
      description: '',
      items: type === 'checklist' ? [''] : undefined,
      uiPosition: position || { x: 80 + (stepNumber % 3) * 300, y: Math.floor((stepNumber - 1) / 3) * 220 }
    };
    onChange({ ...runbook, steps: [...runbook.steps, newStep] });
  };

  const handlePaletteDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/runbook-step-type') as RunbookStep['type'];
    if (!type) return;
    addStep(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  };

  const exportPng = async () => {
    if (!diagramRef.current || isExporting) return;
    const diagram = diagramRef.current;
    setIsExporting(true);
    setExportError(null);
    try {
      const { dataUrl } = await captureRunbookDiagram(diagram, getNodes(), 'png', pngBackground);
      const anchor = document.createElement('a');
      anchor.download = `runbook-diagram-${runbook.id}.png`;
      anchor.href = dataUrl;
      anchor.click();
    } catch {
      setExportError('The PNG could not be exported. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <ToolActionPanel className="justify-end bg-[#0a0a0a]">
        <label className="mr-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
          PNG background
          <select disabled={isExporting} value={pngBackground} onChange={event => setPngBackground(event.target.value as typeof pngBackground)} className="h-8 border border-[#242424] bg-black px-2 text-xs normal-case tracking-normal text-zinc-300 outline-none focus:border-[#00ff9c]">
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="transparent">Transparent</option>
          </select>
        </label>
        <ToolActionButton type="button" variant="outline" disabled={isExporting} onClick={exportPng}><Download className="mr-2 h-3.5 w-3.5" /> {isExporting ? 'Exporting…' : 'Export PNG'}</ToolActionButton>
      </ToolActionPanel>
      {exportError && <p role="alert" className="text-sm text-red-400">{exportError}</p>}
      <div ref={diagramRef} id="runbook-diagram" onDragOver={event => event.preventDefault()} onDrop={handlePaletteDrop} className="runbook-diagram relative h-[800px] w-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={handleSelectionChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Backspace', 'Delete']}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#222" />
        <Controls className="diagram-export-exclude bg-black border border-[#1a1a1a] fill-white" />
        </ReactFlow>
      
      <div className="diagram-export-exclude absolute left-3 top-3 z-20 w-36 border border-[#242424] bg-[#050505]/95 p-2 shadow-xl backdrop-blur" aria-label="Diagram step toolbox">
        <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#ffb000]">Step toolbox</div>
        <div className="space-y-1">
          {(['checklist', 'command', 'information', 'decision', 'warning', 'verification'] as const).map(type => (
            <button key={type} type="button" draggable onDragStart={event => event.dataTransfer.setData('application/runbook-step-type', type)} onClick={() => addStep(type)} className="flex w-full cursor-grab items-center border border-[#1a1a1a] px-2 py-1.5 text-left text-[10px] text-zinc-400 transition-colors hover:border-[#00ff9c] hover:text-[#00ff9c] active:cursor-grabbing">
              <Plus className="mr-2 h-3 w-3 shrink-0" /> {type}
            </button>
          ))}
        </div>
          <p className="mt-2 text-[9px] leading-relaxed text-zinc-600">Click to add or drag onto the canvas.</p>
        <ToolActionButton type="button" tone="danger" disabled={!selectedEdgeIds.length} onClick={removeSelectedEdges} className="mt-2 w-full justify-center"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete line</ToolActionButton>
      </div>
      {canvasNotice && <div role="status" aria-live="polite" className="diagram-export-exclude pointer-events-none absolute bottom-4 left-1/2 z-30 -translate-x-1/2 border border-[#6b4a00] bg-[#120e04]/95 px-3 py-2 text-xs text-[#ffcc66] shadow-lg">{canvasNotice}</div>}

      </div>
    </div>
  );
}

export default function DiagramBuilder(props: DiagramBuilderProps) {
  return (
    <ReactFlowProvider>
      <DiagramBuilderCanvas {...props} />
    </ReactFlowProvider>
  );
}
