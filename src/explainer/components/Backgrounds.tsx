import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { useLayout } from "../layout";

// Backgrounds are painted on a quarter-resolution canvas with canvas-level blur and scaled up by
// CSS: heavy, silky gradients for almost no per-frame cost.
const canvasSize = (W: number, H: number) => ({ CW: Math.round(W / 4), CH: Math.round(H / 4) });

type Blob = { x: number; y: number; r: number; color: string; ax: number; ay: number; px: number; py: number; phase: number };

// Light "mesh" — mint / aqua / lime / lavender clouds drifting over a cool white.
const LIGHT_BLOBS: Blob[] = [
  { x: 0.12, y: 0.82, r: 0.55, color: "120,220,172", ax: 0.08, ay: 0.05, px: 11, py: 13, phase: 0 },
  { x: 0.85, y: 0.9, r: 0.6, color: "102,206,214", ax: 0.07, ay: 0.06, px: 13, py: 9, phase: 1.3 },
  { x: 0.55, y: 1.05, r: 0.5, color: "185,236,140", ax: 0.1, ay: 0.04, px: 9, py: 12, phase: 2.2 },
  { x: 0.95, y: 0.15, r: 0.42, color: "205,200,250", ax: 0.06, ay: 0.06, px: 12, py: 10, phase: 0.7 },
  { x: 0.05, y: 0.1, r: 0.38, color: "170,232,214", ax: 0.06, ay: 0.05, px: 10, py: 14, phase: 2.9 },
];

// Night aurora — deep green / teal / lime light.
const NIGHT_BLOBS: Blob[] = [
  { x: 0.25, y: 0.7, r: 0.5, color: "0,170,90", ax: 0.1, ay: 0.06, px: 9, py: 11, phase: 0 },
  { x: 0.8, y: 0.3, r: 0.42, color: "0,120,130", ax: 0.08, ay: 0.08, px: 11, py: 8, phase: 1.7 },
  { x: 0.6, y: 0.85, r: 0.36, color: "90,200,90", ax: 0.09, ay: 0.05, px: 8, py: 12, phase: 3.1 },
  { x: 0.1, y: 0.15, r: 0.3, color: "20,90,120", ax: 0.07, ay: 0.07, px: 12, py: 10, phase: 0.9 },
];

function paint(ctx: CanvasRenderingContext2D, CW: number, CH: number, blobs: Blob[], t: number, alpha: number, base: string, beam: number) {
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CW, CH);
  const U = Math.max(CW, CH);
  for (const b of blobs) {
    const cx = (b.x + b.ax * Math.sin((t / b.px) * Math.PI * 2 + b.phase)) * CW;
    const cy = (b.y + b.ay * Math.cos((t / b.py) * Math.PI * 2 + b.phase)) * CH;
    const r = b.r * U * (1 + 0.08 * Math.sin(t * 0.5 + b.phase));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(${b.color},${alpha})`);
    g.addColorStop(0.55, `rgba(${b.color},${alpha * 0.45})`);
    g.addColorStop(1, `rgba(${b.color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CW, CH);
  }
  // soft diagonal light beam drifting across
  if (beam > 0) {
    ctx.save();
    ctx.filter = `blur(${U * 0.03}px)`;
    ctx.translate(((t * 0.035) % 1.6 - 0.3) * CW, 0);
    ctx.rotate(-0.5);
    const lg = ctx.createLinearGradient(-U * 0.12, 0, U * 0.12, 0);
    lg.addColorStop(0, "rgba(255,255,255,0)");
    lg.addColorStop(0.5, `rgba(255,255,255,${beam})`);
    lg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = lg;
    ctx.fillRect(-U * 0.12, -U, U * 0.24, U * 3);
    ctx.restore();
  }
}

const useCanvas = (draw: (ctx: CanvasRenderingContext2D, CW: number, CH: number, t: number) => void, deps: unknown[]) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const L = useLayout();
  const { CW, CH } = canvasSize(L.W, L.H);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    draw(ctx, CW, CH, frame / 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, CW, CH, ...deps]);
  return <canvas ref={ref} width={CW} height={CH} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};

/** Fine grid that gives the liquid glass something to bend. */
const Grid: React.FC<{ color: string; opacity: number }> = ({ color, opacity }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
        backgroundPosition: `${(frame * 0.25) % 72}px ${(frame * 0.12) % 72}px`,
        WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 85%)",
        maskImage: "radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 85%)",
      }}
    />
  );
};

/** Light theme: animated mint/aqua mesh gradient, a drifting light beam, a faint grid and grain. */
export const LightBackground: React.FC = () => {
  const canvas = useCanvas((ctx, CW, CH, t) => paint(ctx, CW, CH, LIGHT_BLOBS, t, 0.85, "#f1f5f3", 0.35), []);
  return (
    <AbsoluteFill style={{ background: "#f1f5f3", overflow: "hidden" }}>
      {canvas}
      <Grid color="rgba(20,60,40,0.06)" opacity={1} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

/** Dark theme: near-black with slow green/teal aurora light. */
export const NightBackground: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const canvas = useCanvas((ctx, CW, CH, t) => paint(ctx, CW, CH, NIGHT_BLOBS, t, 0.55 * intensity, "#060a08", 0.05 * intensity), [intensity]);
  return (
    <AbsoluteFill style={{ background: "#060a08", overflow: "hidden" }}>
      {canvas}
      <Grid color="rgba(255,255,255,0.035)" opacity={intensity} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.6) 100%)" }} />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url(${staticFile("images/grain.png")})`,
      backgroundSize: "512px 512px",
      opacity,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }}
  />
);
