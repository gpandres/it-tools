import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  applyNodeChanges, 
  applyEdgeChanges, 
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Runbook, RunbookStep } from './types';
import RunbookNode from './RunbookNode';
import { Download, Plus, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { ToolActionButton, ToolActionPanel } from '@/components/tool-action-panel';

interface DiagramBuilderProps {
  runbook: Runbook;
  onChange: (r: Runbook) => void;
}

const nodeTypes = {
  runbookStep: RunbookNode
};

function DiagramBuilderCanvas({ runbook, onChange }: DiagramBuilderProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [pngBackground, setPngBackground] = useState<'black' | 'white' | 'transparent'>('black');
  const [showDiagramHelp, setShowDiagramHelp] = useState(true);
  
  // Transform Runbook Steps into ReactFlow Nodes
  const initialNodes: Node[] = useMemo(() => {
    return runbook.steps.map((step, index) => ({
      id: step.id,
      type: 'runbookStep',
      position: step.uiPosition || { x: 250, y: index * 200 },
      data: { ...step }
    }));
  }, [runbook.steps]);

  // Transform Runbook Steps into ReactFlow Edges
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    runbook.steps.forEach((step, index) => {
      if (step.type === 'decision') {
        if (step.decisionTrueNext) {
          edges.push({
            id: `e-${step.id}-true-${step.decisionTrueNext}`,
            source: step.id,
            target: step.decisionTrueNext,
            sourceHandle: 'true',
            label: 'YES',
            style: { stroke: '#00ff9c' },
            animated: true
          });
        }
        if (step.decisionFalseNext) {
          edges.push({
            id: `e-${step.id}-false-${step.decisionFalseNext}`,
            source: step.id,
            target: step.decisionFalseNext,
            sourceHandle: 'false',
            label: 'NO',
            style: { stroke: '#ef4444' },
            animated: true
          });
        }
      } else {
        // For linear non-decision steps, if there's a logical next step (index + 1), draw a generic line
        // But since we want to fully support flowcharts, let's look at the next sequential step unless specified otherwise
        // Actually, for a fully graph-based runbook, we should probably add `nextStepId` to linear steps.
        // But to keep JSON simple, we assume linear progression by array order if not defined.
        if (index + 1 < runbook.steps.length) {
          const nextStep = runbook.steps[index + 1];
          // Only draw linear fallback edge if the user hasn't explicitly wired it.
          // Since our JSON doesn't strictly have a `nextStep` property for non-decisions,
          // we'll just show the implicit linear flow as gray edges.
          edges.push({
            id: `e-${step.id}-linear-${nextStep.id}`,
            source: step.id,
            target: nextStep.id,
            style: { stroke: '#333', strokeDasharray: '5 5' }
          });
        }
      }
    });
    
    return edges;
  }, [runbook.steps]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Sync internal state if runbook changes externally
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
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
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // Only allow connecting if source is a decision node
      const sourceStep = runbook.steps.find(s => s.id === connection.source);
      if (!sourceStep || sourceStep.type !== 'decision') {
        alert("Currently, explicit wiring is only supported for Decision nodes.");
        return;
      }
      
      const updatedSteps = [...runbook.steps];
      const stepIndex = updatedSteps.findIndex(s => s.id === connection.source);
      
      if (connection.sourceHandle === 'true') {
        updatedSteps[stepIndex] = { ...sourceStep, decisionTrueNext: connection.target };
      } else if (connection.sourceHandle === 'false') {
        updatedSteps[stepIndex] = { ...sourceStep, decisionFalseNext: connection.target };
      }
      
      onChange({ ...runbook, steps: updatedSteps });
    },
    [runbook, onChange]
  );

  const addStep = (type: RunbookStep['type'], position?: { x: number; y: number }) => {
    const stepNumber = runbook.steps.length + 1;
    const newStep: RunbookStep = {
      id: `step-${Date.now()}`,
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
    if (!diagramRef.current) return;
    const flowViewport = diagramRef.current.querySelector<HTMLElement>('.react-flow__viewport');
    const target = flowViewport || diagramRef.current;
    const bounds = nodes.length ? getNodesBounds(nodes) : { x: 0, y: 0, width: 1200, height: 800 };
    const padding = 80;
    const imageWidth = Math.min(4000, Math.max(1200, Math.ceil(bounds.width + padding * 2)));
    const imageHeight = Math.min(3000, Math.max(800, Math.ceil(bounds.height + padding * 2)));
    const viewport = nodes.length
      ? getViewportForBounds(bounds, imageWidth, imageHeight, 0.1, 2, padding / Math.max(bounds.width, bounds.height))
      : { x: 0, y: 0, zoom: 1 };
    const backgroundColor = pngBackground === 'transparent' ? undefined : pngBackground === 'white' ? '#ffffff' : '#000000';
    const dataUrl = await toPng(target, {
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 1,
      cacheBust: true,
      backgroundColor,
      style: flowViewport ? {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
      } : undefined,
      filter: node => !node.classList?.contains('diagram-export-exclude')
    });
    const anchor = document.createElement('a');
    anchor.download = `runbook-diagram-${runbook.id}.png`;
    anchor.href = dataUrl;
    anchor.click();
  };

  return (
    <div className="space-y-3">
      <ToolActionPanel className="justify-end bg-[#0a0a0a]">
        <label className="mr-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-600">
          PNG background
          <select value={pngBackground} onChange={event => setPngBackground(event.target.value as typeof pngBackground)} className="h-8 border border-[#242424] bg-black px-2 text-xs normal-case tracking-normal text-zinc-300 outline-none focus:border-[#00ff9c]">
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="transparent">Transparent</option>
          </select>
        </label>
        <ToolActionButton type="button" variant="outline" onClick={exportPng}><Download className="mr-2 h-3.5 w-3.5" /> Export PNG</ToolActionButton>
      </ToolActionPanel>
      <div ref={diagramRef} id="runbook-diagram" onDragOver={event => event.preventDefault()} onDrop={handlePaletteDrop} className="relative h-[800px] w-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
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
      </div>

      {showDiagramHelp && <div className="diagram-export-exclude absolute right-4 top-4 z-10 max-w-xs border border-[#1a1a1a] bg-black/80 p-4 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-4">
          <h4 className="text-sm font-bold text-[#00ff9c]">Diagram Mode</h4>
          <button type="button" onClick={() => setShowDiagramHelp(false)} aria-label="Close diagram help" title="Close" className="text-zinc-500 transition-colors hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
        <p className="text-xs text-zinc-400">
          Drag nodes to arrange them. For "Decision" steps, you can drag the green (YES) and red (NO) handles to explicitly link them to other steps.
        </p>
      </div>}
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
