import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow } from '@xyflow/react';
import { Lock } from 'lucide-react';

export default function NetworkEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}: any) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setEdges } = useReactFlow();

  const connType = data?.connectionType || 'ethernet';
  
  let strokeColor = '#52525b'; // zinc-600
  let strokeWidth = 2;
  let strokeDasharray = '0';
  let isVpn = false;

  switch (connType) {
    case 'fiber':
      strokeColor = '#00ff9c';
      strokeWidth = 3;
      break;
    case 'wireless':
      strokeColor = '#00e5ff';
      strokeDasharray = '5,5';
      break;
    case 'vpn':
      strokeColor = '#b026ff';
      strokeDasharray = '5,10';
      isVpn = true;
      break;
    case 'ethernet':
    default:
      strokeColor = '#a1a1aa'; // zinc-400
      break;
  }

  if (selected) {
    strokeColor = '#ffffff';
    strokeWidth += 1;
  }

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, stroke: strokeColor, strokeWidth, strokeDasharray, transition: 'all 0.3s' }} 
      />
      
      {isVpn && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-[#b026ff]/20 p-1 rounded-full backdrop-blur-sm border border-[#b026ff]/50">
               <Lock className="w-3 h-3 text-[#b026ff]" />
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {data?.label && !isVpn && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300 border border-zinc-800">
               {data.label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
