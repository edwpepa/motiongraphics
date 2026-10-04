import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { H, W, clamp01, ease, lerp, mulberry, useT } from "./kit";
import SHAPES from "./logo-shapes.json";

/**
 * The EDW mark as a real object: mirror chrome with brushed tops, lying on a black lacquered floor,
 * lit by long studio strip lights that slide across it. Rendered once to video by tools/edw/render_logo.sh
 * (composition "EdwLogoFilm") and composited into the film, so the main render stays fast.
 */

// ------------------------------------------------------------------ geometry
type Poly = number[][];
const areaOf = (p: Poly) =>
  p.reduce((s, [x, y], i) => {
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
const U = 100;
const CX = 927, CY = 343;
const v2 = ([x, y]: number[]) => new THREE.Vector2((x - CX) / U, -(y - CY) / U);
const S = SHAPES as unknown as Record<string, Poly[]>;

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

let GEO: { mark: THREE.BufferGeometry; word: THREE.BufferGeometry } | null = null;
function geometry() {
  if (GEO) return GEO;
  const mark = new THREE.ExtrudeGeometry(shapes(S["edw-symbol"]), { depth: 0.62, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.024, bevelSegments: 4, curveSegments: 4 });
  const word = new THREE.ExtrudeGeometry(shapes(S["enterprise"]), { depth: 0.2, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 3, curveSegments: 4 });
  GEO = { mark: toCreasedNormals(mark, 0.3), word: toCreasedNormals(word, 0.3) };
  return GEO;
}

// ------------------------------------------------------------------ textures (made once)
const canvasTex = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void, srgb = false) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
let TEX: { brushed: THREE.CanvasTexture; rough: THREE.CanvasTexture; bump: THREE.CanvasTexture; albedo: THREE.CanvasTexture; sideRough: THREE.CanvasTexture; floorRough: THREE.CanvasTexture; shadow: THREE.CanvasTexture } | null = null;
function textures() {
  if (TEX) return TEX;
  const r = mulberry(9);
  // fine linear brushing for the tops of the letters (roughness: mid grey with lighter/darker streaks)
  const brushed = canvasTex(1024, 1024, (g) => {
    g.fillStyle = "rgb(70,70,70)";
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 14000; i++) {
      const y = r() * 1024, x = r() * 1024 - 300, len = 120 + r() * 900, v = Math.floor(30 + r() * 110);
      g.strokeStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.35})`;
      g.lineWidth = 0.4 + r() * 0.9;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len, y);
      g.stroke();
    }
  });
  brushed.repeat.set(0.35, 0.35);
  // the lacquered floor: almost a mirror, with faint wipes and specks so it reads as a real surface
  const floorRough = canvasTex(1024, 1024, (g) => {
    g.fillStyle = "rgb(28,28,28)";
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 260; i++) {
      const x = r() * 1024, y = r() * 1024, rad = 30 + r() * 160;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(80,80,80,${0.08 + r() * 0.1})`);
      gr.addColorStop(1, "rgba(80,80,80,0)");
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 2500; i++) {
      const v = Math.floor(90 + r() * 120);
      g.fillStyle = `rgba(${v},${v},${v},${0.3 + r() * 0.5})`;
      g.fillRect(r() * 1024, r() * 1024, 1 + r() * 1.5, 1 + r() * 1.5);
    }
  });
  floorRough.repeat.set(6, 6);
  // soft contact shadow: the logo silhouette, blurred (alpha)
  const shadow = canvasTex(
    2048,
    760,
    (g) => {
      g.fillStyle = "#000";
      g.fillRect(0, 0, 2048, 760);
      g.filter = "blur(14px)";
      g.fillStyle = "#fff";
      g.translate(97, 37);
      for (const key of ["edw-symbol", "enterprise"]) {
        g.beginPath();
        for (const p of S[key]) {
          if (Math.abs(areaOf(p)) <= 30) continue;
          p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.closePath();
        }
        g.fill("evenodd");
      }
    },
    false,
  );
  shadow.wrapS = shadow.wrapT = THREE.ClampToEdgeWrapping;
  // worked metal: linear brushing, a web of fine scratches, finger smudges and tiny pits — a surface that has lived
  const wear = (g: CanvasRenderingContext2D, base: number, seed: number, strong: number) => {
    const q = mulberry(seed);
    g.fillStyle = `rgb(${base},${base},${base})`;
    g.fillRect(0, 0, 2048, 2048);
    for (let i = 0; i < 26000; i++) {
      const y = q() * 2048, x = q() * 2048 - 400, len = 200 + q() * 1600, v = Math.floor(base + (q() - 0.5) * 120 * strong);
      g.strokeStyle = `rgba(${v},${v},${v},${0.1 + q() * 0.3})`;
      g.lineWidth = 0.4 + q() * 1.1;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + len, y + (q() - 0.5) * 3);
      g.stroke();
    }
    for (let i = 0; i < 90; i++) {
      const x = q() * 2048, y = q() * 2048, rad = 60 + q() * 260, v = Math.floor(base + (q() < 0.5 ? -1 : 1) * 60 * strong);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(${v},${v},${v},${0.18 + q() * 0.22})`);
      gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 1400; i++) {
      const x = q() * 2048, y = q() * 2048, a = q() * Math.PI, len = 20 + q() * (q() < 0.1 ? 600 : 160), v = q() < 0.5 ? 20 : 235;
      g.strokeStyle = `rgba(${v},${v},${v},${0.25 + q() * 0.45})`;
      g.lineWidth = 0.5 + q() * 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (q() - 0.5) * 30, y + Math.sin(a) * len * 0.5 + (q() - 0.5) * 30, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
    for (let i = 0; i < 9000; i++) {
      const v = q() < 0.5 ? 15 : 240;
      g.fillStyle = `rgba(${v},${v},${v},${0.2 + q() * 0.5})`;
      const sz = 0.8 + q() * 2.2;
      g.fillRect(q() * 2048, q() * 2048, sz, sz);
    }
  };
  const rough = canvasTex(2048, 2048, (g) => wear(g, 105, 21, 1.0));
  const bump = canvasTex(2048, 2048, (g) => wear(g, 128, 21, 1.4));
  const albedo = canvasTex(2048, 2048, (g) => wear(g, 214, 33, 0.35), true);
  const sideRough = canvasTex(2048, 2048, (g) => wear(g, 95, 47, 1.1));
  for (const t of [rough, bump, albedo, sideRough]) t.repeat.set(0.16, 0.16);
  TEX = { brushed, rough, bump, albedo, sideRough, floorRough, shadow };
  return TEX;
}

/** studio environment: black, with long strip softboxes and one broad panel (HDR, so chrome gets real highlights) */
function studio(gl: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0.012, 0.012, 0.014);
  // soft-edged lights: bright in the middle, falling off to the edges (no hard cut lines in the chrome)
  const soft = canvasTex(256, 256, (g) => {
    const gx = g.createLinearGradient(0, 0, 256, 0);
    gx.addColorStop(0, "rgba(0,0,0,1)");
    gx.addColorStop(0.3, "rgba(255,255,255,1)");
    gx.addColorStop(0.7, "rgba(255,255,255,1)");
    gx.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = gx;
    g.fillRect(0, 0, 256, 256);
    const gy = g.createLinearGradient(0, 0, 0, 256);
    gy.addColorStop(0, "rgba(0,0,0,1)");
    gy.addColorStop(0.18, "rgba(0,0,0,0)");
    gy.addColorStop(0.82, "rgba(0,0,0,0)");
    gy.addColorStop(1, "rgba(0,0,0,1)");
    g.fillStyle = gy;
    g.fillRect(0, 0, 256, 256);
  }, true);
  soft.wrapS = soft.wrapT = THREE.ClampToEdgeWrapping;
  const strip = (w: number, h: number, pos: [number, number, number], rot: [number, number, number], k: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(k), map: soft, side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.rotation.set(...rot);
    env.add(m);
  };
  strip(18, 9, [0, 9, -2], [-Math.PI / 2, 0, 0], 1.6); // a big overhead softbox: the brushed tops glow with it
  strip(1.2, 20, [-4, 7, 0], [-Math.PI / 2, 0, 0], 4.0); // long strips: the hard lines running along the chrome
  strip(1.2, 20, [4, 7, 0], [-Math.PI / 2, 0, 0], 4.0);
  strip(12, 2.5, [0, 2.2, -9], [0, 0, 0], 1.8); // horizon panel behind
  strip(16, 1.6, [0, 1.4, 11], [0, Math.PI, 0], 1.3); // a low band in front: the walls facing us pick up a soft line
  strip(0.6, 6, [-9, 2, 3], [0, Math.PI / 2, 0], 3.5); // side kickers
  strip(0.6, 6, [9, 2, -3], [0, -Math.PI / 2, 0], 2.5);
  const pm = new THREE.PMREMGenerator(gl);
  const tex = pm.fromScene(env, 0.0).texture;
  pm.dispose();
  return tex;
}

// ------------------------------------------------------------------ camera moves
export type V = [number, number, number];
export type Shot = { from: number; to: number; cam: [V, V]; look: [V, V]; env: [number, number]; fov?: number; exposure?: number; dof?: number };
const mix3 = (a: V, b: V, u: number): V => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const shotAt = (shots: Shot[], t: number) => shots.find((x) => t >= x.from && t < x.to) ?? shots[shots.length - 1];

const Stage: React.FC<{ shots: Shot[]; t: number }> = ({ shots, t }) => {
  const { camera, gl, scene } = useThree();
  const env = useMemo(() => studio(gl), [gl]);
  const G = geometry();
  const mats = useMemo(() => {
    const T = textures();
    const top = new THREE.MeshStandardMaterial({ color: 0xe9ebef, map: T.albedo, metalness: 1, roughness: 1, roughnessMap: T.rough, bumpMap: T.bump, bumpScale: 1.6 });
    const side = new THREE.MeshStandardMaterial({ color: 0xdcdee3, map: T.albedo, metalness: 1, roughness: 0.85, roughnessMap: T.sideRough, bumpMap: T.bump, bumpScale: 1.2 });
    const wordTop = new THREE.MeshStandardMaterial({ color: 0xc4c7ce, map: T.albedo, metalness: 1, roughness: 1, roughnessMap: T.rough, bumpMap: T.bump, bumpScale: 1.4 });
    const floor = new THREE.MeshStandardMaterial({ color: 0x020203, metalness: 0.0, roughness: 0.55, roughnessMap: T.floorRough, envMapIntensity: 0.06, });
    const shadow = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: T.shadow, transparent: true, opacity: 0.95, depthWrite: false });
    // scene.environment ignores envMapIntensity, so the floor gets the map itself to stay a dark lacquer
    floor.envMap = env;
    return { mark: [top, side], word: [wordTop, side], floor, shadow };
  }, [env]);
  scene.background = new THREE.Color(0x000000);
  scene.environment = env;
  scene.environmentIntensity = 1.0;
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  const s = shotAt(shots, t);
  const u = ease.inOutSine(clamp01((t - s.from) / (s.to - s.from)));
  scene.environmentRotation.set(0, lerp(s.env[0], s.env[1], u), 0);
  const cam = camera as THREE.PerspectiveCamera;
  cam.fov = s.fov ?? 30;
  cam.near = 0.03;
  cam.far = 400;
  cam.position.set(...mix3(s.cam[0], s.cam[1], u));
  cam.up.set(0, 1, 0);
  cam.lookAt(new THREE.Vector3(...mix3(s.look[0], s.look[1], u)));
  cam.updateProjectionMatrix();
  gl.toneMappingExposure = s.exposure ?? 1.0;
  // the shadow texture covers the svg box (1854 x 686 px + margin) → scene units
  const sw = 2048 / U, sh = 760 / U;
  return (
    <>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={G.mark} material={mats.mark} />
        <mesh geometry={G.word} material={mats.word} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={mats.floor}>
        <planeGeometry args={[400, 400]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(2048 / 2 - 97 - CX) / U, 0.003, (760 / 2 - 37 - CY) / U]} material={mats.shadow}>
        <planeGeometry args={[sw, sh]} />
      </mesh>
    </>
  );
};

/** just the 3D picture (black where no shot is running) */
export const Logo3D: React.FC<{ shots: Shot[] }> = ({ shots }) => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={W} height={H} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={1}>
        <Stage shots={shots} t={t} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
