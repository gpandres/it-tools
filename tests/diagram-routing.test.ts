import test from 'node:test';
import assert from 'node:assert/strict';
import { cableAppearance, distributeEdgeLanes } from '../src/lib/diagram-routing.ts';
import type { NetworkEdge, NetworkEdgeData } from '../src/app/tools/network/diagram/types.ts';

const edge = (id: string, data: Partial<NetworkEdgeData> = {}, target = id): NetworkEdge => ({
  id, source: 'switch', sourceHandle: 'bottom-source', target, targetHandle: 'top-target',
  data: { connectionType: 'ethernet', ...data },
});

test('identical looking cables share a lane, even with different labels or explicit defaults', () => {
  const result = distributeEdgeLanes([edge('a'), edge('b', { color: '#A1A1AA', texture: 'solid', label: 'backup' })]);
  assert.deepEqual(result.map(e => e.data?.lane), [0, 0]);
});

test('different colors, textures and widths fan out; matching cables keep one lane', () => {
  const original = [edge('a'), edge('b', { color: '#ffb000' }), edge('c', { texture: 'dashed' }), edge('d'), edge('e', { connectionType: 'fiber', color: '#a1a1aa' })];
  const result = distributeEdgeLanes(original);
  assert.equal(new Set(result.map(e => e.data?.lane)).size, 4);
  assert.equal(result[0].data?.lane, result[3].data?.lane);
  assert.equal(original[0].data?.lane, undefined);
  assert.deepEqual(distributeEdgeLanes([...original].reverse()).reverse(), result);
});

test('incoming and outgoing cables sharing a physical handle use the same lane allocation', () => {
  const outgoing = edge('out');
  const incoming = { ...edge('in', { color: '#ffb000' }), source: 'other', sourceHandle: 'top-source', target: 'switch', targetHandle: 'bottom-target' };
  const result = distributeEdgeLanes([outgoing, incoming]);
  assert.notEqual(result[0].data?.lane, result[1].data?.targetLane);
  assert.equal(result[0].data?.targetLane, 0);
  assert.equal(result[1].data?.lane, 0);
});

test('different handles stay independent and removing a treatment resets lanes', () => {
  const a = edge('a');
  const b = { ...edge('b', { color: '#ffb000' }), sourceHandle: 'right-source' };
  assert.deepEqual(distributeEdgeLanes([a, b]).map(e => e.data?.lane), [0, 0]);
  const routed = distributeEdgeLanes([a, edge('c', { color: '#ffb000' })]);
  assert.equal(distributeEdgeLanes(routed.slice(0, 1))[0].data?.lane, 0);
});

test('wireless and VPN defaults are dashed, but an explicit solid texture overrides them', () => {
  for (const connectionType of ['wireless', 'vpn'] as const) {
    assert.notEqual(cableAppearance({ connectionType }).dash, '0');
    assert.equal(cableAppearance({ connectionType, texture: 'solid' }).dash, '0');
  }
});

test('unknown imported connection types retain the safe Ethernet rendering fallback', () => {
  assert.equal(cableAppearance({ connectionType: 'legacy' } as unknown as NetworkEdgeData).color, '#a1a1aa');
});
