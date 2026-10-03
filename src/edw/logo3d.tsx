import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CanvasScene, H, W, clamp01, ease, flare, glow, lerp, mulberry, useT } from "./kit";
import SHAPES from "./logo-shapes.json";

// ------------------------------------------------------------------ geometry: the cleaned outlines, extruded, on a brushed metal plate
type Poly = number[][];
const areaOf = (p: Poly) => p.reduce((s, [x, y], i) => {
  const [x2, y2] = p[(i + 1) % p.length];
  return s + x * y2 - x2 * y;
}, 0) / 2;
const inside = (pt: number[], poly: Poly) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const U = 100; // svg px per scene unit
const CX = 927, CY = 343;
const v2 = ([x, y]: number[]) => new THREE.Vector2((x - CX) / U, -(y - CY) / U);

function shapes(polys: Poly[]): THREE.Shape[] {
  const good = polys.filter((p) => Math.abs(areaOf(p)) > 30);
  const outers = good.filter((p) => areaOf(p) < 0);
  const holes = good.filter((p) => areaOf(p) > 0);
  return outers.map((o) => {
    const s = new THREE.Shape(o.map(v2));
    for (const h of holes) if (inside(h[0], o)) s.holes.push(new THREE.Path(h.map(v2)));
    return s;
  });
}

let GEO: { mark: THREE.BufferGeometry; word: THREE.BufferGeometry; plate: THREE.BufferGeometry } | null = null;
function geometry() {
  if (GEO) return GEO;
  const S = SHAPES as unknown as Record<string, Poly[]>;
  const mark = new THREE.ExtrudeGeometry(shapes(S["edw-symbol"]), { depth: 0.34, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.014, bevelSegments: 3, curveSegments: 4 });
  const word = new THREE.ExtrudeGeometry(shapes(S["enterprise"]), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.008, bevelSegments: 3, curveSegments: 4 });
  const plate = new RoundedBoxGeometry(23.5, 10.4, 0.5, 8, 0.2);
  // smooth the curved walls, keep every real corner crisp
  GEO = { mark: toCreasedNormals(mark, 0.3), word: toCreasedNormals(word, 0.3), plate };
  return GEO;
}

/** fine horizontal brushing: used for colour and roughness of the plate */
let BRUSH: THREE.CanvasTexture | null = null;
function brush() {
  if (BRUSH) return BRUSH;
  const c = document.createElement("canvas");
  c.width = 2048;
  c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, c.width, c.height);
  const r = mulberry(3);
  for (let i = 0; i < 9000; i++) {
    const y = r() * c.height, x = r() * c.width - 200, len = 200 + r() * 1400;
    const v = Math.floor(90 + r() * 90);
    g.strokeStyle = `rgba(${v},${v},${v},${0.08 + r() * 0.2})`;
    g.lineWidth = 0.5 + r() * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + len, y + (r() - 0.5) * 2);
    g.stroke();
  }
  BRUSH = new THREE.CanvasTexture(c);
  BRUSH.wrapS = BRUSH.wrapT = THREE.RepeatWrapping;
  BRUSH.repeat.set(2, 2);
  BRUSH.colorSpace = THREE.SRGBColorSpace;
  BRUSH.anisotropy = 8;
  return BRUSH;
}

// ------------------------------------------------------------------ camera moves
export type V = [number, number, number];
export type Shot = { from: number; to: number; cam: [V, V]; look: [V, V]; light: [V, V]; fov?: number; exposure?: number };
const mix3 = (a: V, b: V, u: number): V => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

const Stage: React.FC<{ shots: Shot[]; t: number; fade: number }> = ({ shots, t, fade }) => {
  const { camera, gl, scene } = useThree();
  const env = useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const e = pm.fromScene(new RoomEnvironment(), 0.03).texture;
    pm.dispose();
    return e;
  }, [gl]);
  const G = geometry();
  const mats = useMemo(() => {
    const b = brush();
    return {
      chrome: new THREE.MeshPhysicalMaterial({ color: 0xe4e6ea, metalness: 1, roughness: 0.14, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
      satin: new THREE.MeshPhysicalMaterial({ color: 0xa9adb5, metalness: 1, roughness: 0.3 }),
      plate: new THREE.MeshPhysicalMaterial({ color: 0x7d8088, metalness: 0.9, roughness: 0.4, map: b, roughnessMap: b, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    };
  }, []);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  scene.background = new THREE.Color(0x000000);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  const s = shots.find((x) => t >= x.from && t < x.to) ?? shots[shots.length - 1];
  const u = ease.inOutSine(clamp01((t - s.from) / (s.to - s.from)));
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = s.fov ?? 30;
  cam.near = 0.05;
  cam.far = 200;
  cam.position.set(...mix3(s.cam[0], s.cam[1], u));
  cam.lookAt(new THREE.Vector3(...mix3(s.look[0], s.look[1], u)));
  cam.updateProjectionMatrix();
  gl.toneMappingExposure = (s.exposure ?? 1.0) * fade;
  const lp = mix3(s.light[0], s.light[1], ease.inOutSine(clamp01((t - s.from) / (s.to - s.from))));
  return (
    <>
      <ambientLight intensity={0.02} />
      {/* the travelling light that draws along the edges */}
      <pointLight position={lp} intensity={160} distance={40} decay={2} color={0xf2f4ff} />
      {/* cool rim from above and behind */}
      <directionalLight position={[-6, 10, 4]} intensity={0.6} color={0xdfe6ff} />
      <directionalLight position={[8, -6, 6]} intensity={0.25} color={0xffffff} />
      <mesh geometry={G.plate} material={mats.plate} position={[0, -0.1, -0.25]} />
      <mesh geometry={G.mark} material={mats.chrome} />
      <mesh geometry={G.word} material={mats.satin} />
    </>
  );
};

/** the 3D logo film: macro shots along the edges, then the whole mark; flashes on the cuts */
export const Logo3D: React.FC<{ shots: Shot[]; hit: number; fadeIn: number; fadeOut: [number, number] }> = ({ shots, hit, fadeIn, fadeOut }) => {
  const t = useT();
  const fade = clamp01((t - fadeIn) / 0.4) * (1 - clamp01((t - fadeOut[0]) / (fadeOut[1] - fadeOut[0])));
  const cuts = shots.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill>
      <ThreeCanvas width={W} height={H} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={1}>
        <Stage shots={shots} t={t} fade={Math.max(0.0001, fade)} />
      </ThreeCanvas>
      <CanvasScene
        style={{ mixBlendMode: "screen" }}
        draw={(ctx, T) => {
          ctx.globalCompositeOperation = "lighter";
          for (const c of cuts) {
            const k = T >= c ? Math.exp(-(T - c) / (c === hit ? 0.45 : 0.18)) : 0;
            if (k > 0.01) flare(ctx, W / 2, H / 2, k * (c === hit ? 0.9 : 0.35), c === hit ? 1600 : 900, c === hit ? 120 : 50);
          }
          // a few motes of dust drifting in the light
          const r = mulberry(5);
          for (let i = 0; i < 60; i++) {
            const x = (r() * W + T * (r() - 0.5) * 40 + W) % W, y = (r() * H - T * 10 * r() + H * 4) % H;
            glow(ctx, x, y, 2 + 3 * r(), 0.18 * fade * (0.5 + 0.5 * Math.sin(T * 2 + i)));
          }
        }}
      />
    </AbsoluteFill>
  );
};
