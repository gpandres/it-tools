import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { Lock } from 'lucide-react';
import type { NetworkEdge } from '../types';

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
  selected,
}: EdgeProps<NetworkEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

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

  const metadataLabel = data?.label || [
    data?.sourcePort && data?.targetPort ? `${data.sourcePort} → ${data.targetPort}` : '',
    data?.bandwidth || '',
    data?.vlanMode && data.vlanMode !== 'unknown' ? data.vlanMode : '',
  ].filter(Boolean).join(' · ');

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, stroke: strokeColor, strokeWidth, strokeDasharray, transition: 'all 0.3s' }} 
      />
      
      {(isVpn || metadataLabel) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className={`flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] backdrop-blur-sm ${isVpn ? 'border-[#b026ff]/50 bg-[#b026ff]/20 text-[#d8a8ff]' : 'border-zinc-800 bg-black/80 text-zinc-300'}`}>
              {isVpn && <Lock className="h-3 w-3 shrink-0 text-[#b026ff]" />}
              {metadataLabel && <span>{metadataLabel}</span>}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
