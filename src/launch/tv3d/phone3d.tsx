import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * The real iPhone 16 (GLB) in three.js, with the app's screen as a live DOM layer pinned to the
 * display by a perspective (homography) transform. World units are pixels on the z = 0 plane, so a
 * pose is written in frame coordinates: x, y in px, z towards the camera, angles in degrees.
 */
export const W = 1920, H = 1080;
export const SCR_W = 400, SCR_H = 863;
const SCREEN = { hw: 3.2633, hh: 7.0425, z: 0.392 };
const MODEL_H = 14.74;
export const FOV = 30;
export const CAM_Z = H / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);

export type PhoneColor = "teal" | "green" | "black" | "white" | "blue";
export type P3 = { x: number; y: number; z?: number; rx: number; ry: number; rz: number; h: number; color?: PhoneColor; opacity?: number };

const CAM = (() => {
  const c = new THREE.PerspectiveCamera(FOV, W / H, 1, 40000);
  c.position.set(0, 0, CAM_Z);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
})();
const D2R = Math.PI / 180;
export const phoneMatrix = (p: P3) => {
  const k = p.h / MODEL_H;
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(p.x - W / 2, H / 2 - p.y, p.z ?? 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(p.rx * D2R, p.ry * D2R, p.rz * D2R, "YXZ")), new THREE.Vector3(k, k, k));
  return m;
};
/** where a point on the phone (model units) lands in the frame */
export const projectLocal = (p: P3, lx: number, ly: number, lz: number) => {
  const v = new THREE.Vector3(lx, ly, lz).applyMatrix4(phoneMatrix(p)).project(CAM);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H] as [number, number];
};
/** a screen point (in screen px, 0..SCR_W, 0..SCR_H) → frame px */
export const screenToFrame = (p: P3, sx: number, sy: number) => projectLocal(p, -SCREEN.hw + (sx / SCR_W) * 2 * SCREEN.hw, SCREEN.hh - (sy / SCR_H) * 2 * SCREEN.hh, SCREEN.z);
/** frame px per screen px, roughly, at this pose */
export const screenScale = (p: P3) => {
  const a = screenToFrame(p, 0, SCR_H / 2), b = screenToFrame(p, SCR_W, SCR_H / 2);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) / SCR_W;
};
const facing = (p: P3) => {
  const m = phoneMatrix(p);
  const c = new THREE.Vector3(0, 0, SCREEN.z).applyMatrix4(m);
  const n = new THREE.Vector3(0, 0, 1).transformDirection(m);
  return n.dot(new THREE.Vector3(0, 0, CAM_Z).sub(c)) > 0;
};

/** CSS matrix3d taking a w×h box onto the quad q (tl, tr, br, bl) */
export const quadMatrix = (w: number, h: number, q: [number, number][]) => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1 || 1e-9;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
  const A = a / w, B = b / h, D = d / w, E = e / h, G = g / w, Hh = hh / h;
  return `matrix3d(${A},${D},0,${G},${B},${E},0,${Hh},0,0,1,0,${c},${f},0,1)`;
};

// ------------------------------------------------------------------ the model, loaded once
let MODEL: THREE.Group | null = null;
let LOADING: Promise<THREE.Group> | null = null;
const loadModel = () => {
  if (MODEL) return Promise.resolve(MODEL);
  if (!LOADING)
    LOADING = new Promise((res, rej) => {
      new GLTFLoader().load(
        staticFile("models/iphone16.glb"),
        (g) => {
          MODEL = g.scene;
          res(g.scene);
        },
        undefined,
        rej,
      );
    });
  return LOADING;
};
export const usePhoneModel = () => {
  const [m, setM] = useState<THREE.Group | null>(MODEL);
  const [handle] = useState(() => (MODEL ? null : delayRender("iphone glb", { timeoutInMilliseconds: 60000 })));
  useEffect(() => {
    if (MODEL) return;
    loadModel()
      .then((g) => {
        setM(g);
        if (handle !== null) continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        if (handle !== null) continueRender(handle);
      });
  }, [handle]);
  return m;
};

// ------------------------------------------------------------------ colour: the teal finish re-tinted, keeping its light and shade
const REF = new THREE.Color(0.239, 0.476, 0.479);
const lum = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const FINISH: Record<PhoneColor, THREE.Color | null> = {
  teal: null,
  green: new THREE.Color(0.0, 0.2, 0.085),
  black: new THREE.Color(0.075, 0.08, 0.085),
  white: new THREE.Color(0.86, 0.87, 0.86),
  blue: new THREE.Color(0.12, 0.22, 0.55),
};
const isTeal = (c: THREE.Color) => c.g > c.r * 1.25 && c.b > c.r * 1.25;
const tinted = (src: THREE.Group, color: PhoneColor) => {
  const g = src.clone(true);
  const target = FINISH[color];
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (!mat || !mat.color) return;
    if (target && isTeal(mat.color)) {
      const m2 = mat.clone();
      const k = lum(mat.color) / lum(REF);
      m2.color = target.clone().multiplyScalar(Math.min(color === "white" ? 1.15 : 1.3, k));
      if (color === "white") m2.color.lerp(new THREE.Color(1, 1, 1), 0.2 * k);
      mesh.material = m2;
    }
  });
  return g;
};

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl, scene]);
  return null;
};

const Phone3D: React.FC<{ model: THREE.Group; p: P3 }> = ({ model, p }) => {
  const color = p.color ?? "teal";
  const obj = useMemo(() => {
    const g = tinted(model, color);
    g.matrixAutoUpdate = false;
    return g;
  }, [model, color]);
  obj.matrix.copy(phoneMatrix(p));
  obj.matrixWorldNeedsUpdate = true;
  return <primitive object={obj} />;
};

export type PhoneSlot = { p: P3; screen?: React.ReactNode; glare?: boolean; shadow?: boolean };

/**
 * A stage of one or more real iPhones. Each slot's `screen` renders as a 400×863 DOM screen pinned
 * onto that phone's display; it hides when the phone turns its back.
 */
export const Phones: React.FC<{ slots: PhoneSlot[]; dark?: boolean; children?: React.ReactNode }> = ({ slots, dark, children }) => {
  const model = usePhoneModel();
  const order = slots.map((s, i) => ({ s, i, z: s.p.z ?? 0 })).sort((a, b) => a.z - b.z);
  return (
    <AbsoluteFill>
      {/* contact shadows under the phones */}
      {slots.map((s, i) => {
        if (s.shadow === false) return null;
        const [bx, by] = projectLocal(s.p, 0, -7.6, 0);
        const sc = s.p.h / 900;
        return <div key={`sh${i}`} style={{ position: "absolute", left: bx - 230 * sc, top: by + 30 * sc, width: 460 * sc, height: 70 * sc, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(0,0,0,${dark ? 0.6 : 0.16}) 0%, rgba(0,0,0,0) 70%)`, filter: `blur(${12 * sc}px)`, opacity: s.p.opacity ?? 1 }} />;
      })}
      {model && (
        <ThreeCanvas width={W} height={H} camera={{ fov: FOV, near: 1, far: 40000, position: [0, 0, CAM_Z] }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }}>
          <Env />
          <ambientLight intensity={0.35} />
          <directionalLight position={[-900, 1200, 1500]} intensity={2.2} />
          <directionalLight position={[1400, -300, 600]} intensity={dark ? 1.4 : 0.9} color={dark ? "#9ff5c8" : "#ffffff"} />
          {slots.map((s, i) => (
            <Phone3D key={i} model={model} p={s.p} />
          ))}
        </ThreeCanvas>
      )}
      {order.map(({ s, i }) => {
        if (!s.screen || !facing(s.p)) return null;
        const q = [screenToFrame(s.p, 0, 0), screenToFrame(s.p, SCR_W, 0), screenToFrame(s.p, SCR_W, SCR_H), screenToFrame(s.p, 0, SCR_H)];
        const glare = 0.5 + s.p.ry / 70;
        return (
          <div key={`sc${i}`} style={{ position: "absolute", left: 0, top: 0, width: SCR_W, height: SCR_H, transformOrigin: "0 0", transform: quadMatrix(SCR_W, SCR_H, q), borderRadius: 54, overflow: "hidden", background: "#000", opacity: s.p.opacity ?? 1 }}>
            {s.screen}
            <div style={{ position: "absolute", left: 160, top: 13, width: 80, height: 0 }} />
            {s.glare !== false && <div style={{ position: "absolute", inset: -300, background: `linear-gradient(115deg, rgba(255,255,255,0) ${28 + glare * 30}%, rgba(255,255,255,0.16) ${36 + glare * 30}%, rgba(255,255,255,0) ${44 + glare * 30}%)`, pointerEvents: "none" }} />}
          </div>
        );
      })}
      {children}
    </AbsoluteFill>
  );
};
