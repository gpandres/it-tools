import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, type EdgeProps } from '@xyflow/react';
import { cableAppearance } from '@/lib/diagram-routing';
import { Lock } from 'lucide-react';
import type { NetworkEdge } from '../types';

export default function NetworkEdge({
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
  const sourceVector = positionVector(sourcePosition);
  const targetVector = positionVector(targetPosition);
  // React Flow reports handle centres outside the card. Draw to the card edge so
  // the cable visually enters the device instead of stopping at a floating dot.
  const anchorInset = 8;
  const anchoredSourceX = sourceX - sourceVector.x * anchorInset;
  const anchoredSourceY = sourceY - sourceVector.y * anchorInset;
  const anchoredTargetX = targetX - targetVector.x * anchorInset;
  const anchoredTargetY = targetY - targetVector.y * anchorInset;
  const sourceLane = data?.lane ?? 0;
  const targetLane = data?.targetLane ?? 0;
  // Screen-space normals keep opposing handles from reversing lane order.
  const lanePoint = (x: number, y: number, position: Position, lane: number) => ({
    x: x + (position === Position.Top || position === Position.Bottom ? lane * 18 : 0),
    y: y + (position === Position.Left || position === Position.Right ? lane * 18 : 0),
  });
  const start = lanePoint(anchoredSourceX, anchoredSourceY, sourcePosition, sourceLane);
  const end = lanePoint(anchoredTargetX, anchoredTargetY, targetPosition, targetLane);
  const lead = 24;
  const [route, labelX, labelY] = getSmoothStepPath({
    sourceX: start.x + sourceVector.x * lead,
    sourceY: start.y + sourceVector.y * lead,
    sourcePosition,
    targetX: end.x + targetVector.x * lead,
    targetY: end.y + targetVector.y * lead,
    targetPosition,
    centerX: (anchoredSourceX + anchoredTargetX) / 2 + (sourceLane || targetLane) * 18,
    centerY: (anchoredSourceY + anchoredTargetY) / 2 + (sourceLane || targetLane) * 18,
    offset: 24 + Math.max(Math.abs(sourceLane), Math.abs(targetLane)) * 18,
    borderRadius: 8,
  });
  const edgePath = 'M ' + anchoredSourceX + ' ' + anchoredSourceY + ' L ' + (start.x + sourceVector.x * lead) + ' ' + (start.y + sourceVector.y * lead) + ' ' + route.replace(/^M\s*[-\d.e]+[, ]+[-\d.e]+/, '') + ' L ' + anchoredTargetX + ' ' + anchoredTargetY;
  const appearance = cableAppearance(data);
  let strokeColor = appearance.color;
  let strokeWidth = appearance.extraWidth ? 'calc(var(--diagram-edge-width, 2px) + 1px)' : 'var(--diagram-edge-width, 2px)';
  const strokeDasharray = appearance.dash;
  const isVpn = data?.connectionType === 'vpn';

  if (selected) {
    strokeColor = '#ffffff';
    strokeWidth = `calc(${strokeWidth} + 1px)`;
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
        interactionWidth={24}
        style={{ ...style, stroke: strokeColor, strokeWidth, strokeDasharray }}
      />
      
      {(isVpn || metadataLabel) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={`edge-metadata nodrag nopan ${selected ? 'edge-metadata-selected' : ''}`}
          >
            <div className={`flex items-center gap-1 rounded-none border px-1.5 py-0.5 font-mono text-[9px] backdrop-blur-sm ${isVpn ? 'border-[#b026ff]/50 bg-[#b026ff]/20 text-[#d8a8ff]' : 'border-zinc-800 bg-black/80 text-zinc-300'}`}>
              {isVpn && <Lock className="h-3 w-3 shrink-0 text-[#b026ff]" />}
              {metadataLabel && <span>{metadataLabel}</span>}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function positionVector(position: Position) {
  if (position === Position.Left) return { x: -1, y: 0 };
  if (position === Position.Top) return { x: 0, y: -1 };
  if (position === Position.Bottom) return { x: 0, y: 1 };
  return { x: 1, y: 0 };
}
