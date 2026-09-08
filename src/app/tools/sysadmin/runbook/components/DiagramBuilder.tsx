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
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Runbook, RunbookStep } from './types';
import RunbookNode from './RunbookNode';
import { Button } from '@/components/ui/button';
import { Download, Plus } from 'lucide-react';
import { toPng } from 'html-to-image';

interface DiagramBuilderProps {
  runbook: Runbook;
  onChange: (r: Runbook) => void;
}

const nodeTypes = {
  runbookStep: RunbookNode
};

export default function DiagramBuilder({ runbook, onChange }: DiagramBuilderProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [newStepType, setNewStepType] = useState<RunbookStep['type']>('information');
  
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

  const addStep = () => {
    const stepNumber = runbook.steps.length + 1;
    const newStep: RunbookStep = {
      id: `step-${Date.now()}`,
      type: newStepType,
      title: `New ${newStepType} step`,
      description: '',
      items: newStepType === 'checklist' ? [''] : undefined,
      uiPosition: { x: 80 + (stepNumber % 3) * 300, y: Math.floor((stepNumber - 1) / 3) * 220 }
    };
    onChange({ ...runbook, steps: [...runbook.steps, newStep] });
  };

  const exportPng = async () => {
    if (!diagramRef.current) return;
    const dataUrl = await toPng(diagramRef.current, {
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: '#0a0a0a',
      filter: node => !node.classList?.contains('diagram-export-exclude')
    });
    const anchor = document.createElement('a');
    anchor.download = `runbook-diagram-${runbook.id}.png`;
    anchor.href = dataUrl;
    anchor.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-[#1a1a1a] bg-[#0a0a0a] p-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Add step</span>
          <select value={newStepType} onChange={event => setNewStepType(event.target.value as RunbookStep['type'])} className="h-9 border border-[#242424] bg-black px-2 text-xs text-zinc-300 outline-none focus:border-[#00ff9c]">
            {(['checklist', 'command', 'information', 'decision', 'warning', 'verification'] as const).map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <Button type="button" size="sm" onClick={addStep} className="bg-[#00ff9c] text-black hover:bg-[#00cc7a]"><Plus className="mr-2 h-3.5 w-3.5" /> Add step</Button>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={exportPng} className="border-[#242424] bg-black text-zinc-300 hover:border-[#00ff9c] hover:text-[#00ff9c]"><Download className="mr-2 h-3.5 w-3.5" /> Export PNG</Button>
      </div>
      <div ref={diagramRef} id="runbook-diagram" className="h-[800px] w-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#222" />
        <Controls className="diagram-export-exclude bg-black border border-[#1a1a1a] fill-white" />
        </ReactFlow>
      
      <div className="diagram-export-exclude absolute top-4 right-4 bg-black/80 backdrop-blur p-4 rounded-lg border border-[#1a1a1a] max-w-xs z-10 pointer-events-none">
        <h4 className="text-[#00ff9c] font-bold text-sm mb-2">Diagram Mode</h4>
        <p className="text-xs text-zinc-400">
          Drag nodes to arrange them. For "Decision" steps, you can drag the green (YES) and red (NO) handles to explicitly link them to other steps.
        </p>
      </div>
      </div>
    </div>
  );
}
