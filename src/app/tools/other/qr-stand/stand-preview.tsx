"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ToolActionButton, ToolStatus } from "@/components/tool-design";
import type { SolidMesh, StandModel } from "@/lib/qr-stand/model";

export default function StandPreview({ model, baseColor }: { model: StandModel; baseColor: string }) {
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef<(action: string) => void>(() => {});
  const [exploded, setExploded] = useState(false);
  const [showCavity, setShowCavity] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true }); }
    catch { queueMicrotask(() => setError("3D preview needs WebGL. The STL download is still available.")); return; }
    queueMicrotask(() => setError(""));
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x080808);
    renderer.domElement.setAttribute("aria-label", "Interactive 3D stand. Drag to orbit or use the view buttons.");
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.style.touchAction = "pan-y";
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
    camera.up.set(0, 0, 1);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 150;
    controls.maxDistance = 800;
    const target = new THREE.Vector3(0, 15, exploded ? 105 : 75);
    controls.target.copy(target);
    const reset = () => { camera.position.set(210, -330, 210); controls.target.copy(target); controls.update(); };
    reset();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-100, -200, 350); scene.add(light);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const add = (data: SolidMesh, color: string, parent: THREE.Object3D) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      geometry.setIndex(new THREE.BufferAttribute(data.indices, 1));
      geometry.computeVertexNormals();
      const flat = geometry.toNonIndexed();
      flat.computeVertexNormals();
      geometries.push(geometry, flat);
      const material = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, flatShading: true });
      materials.push(material);
      const mesh = new THREE.Mesh(flat, material); parent.add(mesh); return mesh;
    };
    add(model.base, baseColor, scene);
    const sign = new THREE.Group();
    sign.rotation.x = model.angle * Math.PI / 180;
    sign.position.z = exploded ? 40 : 4;
    scene.add(sign);
    const plateMesh = add(showCavity && model.cavityPreview ? model.cavityPreview : model.plate, "#f4f1e8", sign);
    if (showCavity && model.cavityPreview) {
      const edges = new THREE.EdgesGeometry(plateMesh.geometry);
      const outline = new THREE.LineBasicMaterial({ color: "#177358" });
      geometries.push(edges); materials.push(outline);
      plateMesh.add(new THREE.LineSegments(edges, outline));
    }
    if (!(showCavity && model.cavityPreview)) add(model.relief, "#101010", sign);
    if (model.pocket) {
      const pocket = add(model.pocket, baseColor, sign);
      pocket.position.set(-model.pocketWidth / 2, 145 - model.pocketHeight, -model.pocketDepth - (exploded ? 35 : 0));
    }
    const grid = new THREE.GridHelper(300, 15, 0x303030, 0x191919);
    grid.rotation.x = Math.PI / 2; grid.position.z = -0.1; scene.add(grid);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    actions.current = action => {
      if (action === "reset") reset();
      else if (action === "front" || action === "back") camera.position.set(0, action === "front" ? -360 : 360, 160);
      else if (action === "in" || action === "out") {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(THREE.MathUtils.clamp(offset.length() * (action === "in" ? 0.8 : 1.25), 150, 800));
        camera.position.copy(controls.target).add(offset);
      } else {
        const offset = camera.position.clone().sub(controls.target).applyAxisAngle(new THREE.Vector3(0, 0, 1), action === "left" ? -Math.PI / 8 : Math.PI / 8);
        camera.position.copy(controls.target).add(offset);
      }
      controls.update(); render();
    };
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); render();
    });
    resize.observe(element);
    const lost = (event: Event) => { event.preventDefault(); setError("The 3D context was lost. Reload to restore it; STL export remains available."); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      resize.disconnect(); controls.dispose();
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      grid.geometry.dispose(); (grid.material as THREE.Material).dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); actions.current = () => {};
    };
  }, [model, baseColor, exploded, showCavity]);
  return <div className="space-y-3">
    <div ref={host} className="h-[380px] min-w-0 overflow-hidden border border-[#1a1a1a] bg-[#080808] sm:h-[480px]" />
    {error && <ToolStatus tone="attention">{error}</ToolStatus>}
    <div className="flex flex-wrap gap-2" aria-label="3D view controls">
      {[["front", "Front"], ["back", "Back"], ["left", "Rotate left"], ["right", "Rotate right"], ["in", "Zoom in"], ["out", "Zoom out"], ["reset", "Reset view"]].map(([action, label]) => <ToolActionButton key={action} onClick={() => actions.current(action)}>{label}</ToolActionButton>)}
      <ToolActionButton aria-pressed={exploded} tone={exploded ? "accent" : "neutral"} onClick={() => setExploded(value => !value)}>Exploded view</ToolActionButton>
      {model.cavityPreview && <ToolActionButton aria-pressed={showCavity} tone={showCavity ? "accent" : "neutral"} onClick={() => setShowCavity(value => !value)}>Show NFC cavity</ToolActionButton>}
    </div>
    <p className="text-xs text-zinc-400">Drag to orbit · scroll to zoom · colors illustrate a two-color print.</p>
    {showCavity && model.cavityPreview && <p className="text-xs text-[#ffb000]">Cutaway at Z={model.pauseHeight?.toFixed(1)} mm, before the cavity is closed. Export contains the complete plate.</p>}
  </div>;
}
