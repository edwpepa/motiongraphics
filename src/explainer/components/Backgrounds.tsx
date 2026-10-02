import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";

// Both backgrounds are painted on a small canvas with a canvas-level blur and scaled up by CSS.
// The heavy Gaussian blur then costs almost nothing per frame and the soft edges stay buttery.
const CW = 480;
const CH = 270;

type WaveLayer = {
  base: number;
  amps: [number, number, number];
  freqs: [number, number, number];
  speeds: [number, number, number];
  phases: [number, number, number];
  top: string;
  bottom: string;
  alpha: number;
  blur: number;
};

const LAYERS: WaveLayer[] = [
  {
    base: 0.6,
    amps: [0.1, 0.04, 0.018],
    freqs: [0.7, 1.45, 2.6],
    speeds: [0.16, -0.23, 0.31],
    phases: [0.4, 1.9, 0.2],
    top: "rgba(205,236,221,0.9)",
    bottom: "rgba(166,221,195,0.9)",
    alpha: 0.7,
    blur: 16,
  },
  {
    base: 0.71,
    amps: [0.11, 0.035, 0.015],
    freqs: [0.55, 1.2, 2.3],
    speeds: [-0.12, 0.19, -0.27],
    phases: [2.2, 0.6, 1.1],
    top: "rgba(164,222,195,1)",
    bottom: "rgba(118,203,163,1)",
    alpha: 0.92,
    blur: 12,
  },
];

function drawWave(ctx: CanvasRenderingContext2D, layer: WaveLayer, t: number, lift: number) {
  ctx.save();
  ctx.filter = `blur(${layer.blur}px)`;
  ctx.globalAlpha = layer.alpha;
  ctx.beginPath();
  ctx.moveTo(-40, CH + 40);
  for (let x = -40; x <= CW + 40; x += 6) {
    const u = x / CW;
    let y = layer.base + lift;
    for (let k = 0; k < 3; k++) {
      y += layer.amps[k] * Math.sin(Math.PI * 2 * (u * layer.freqs[k] + t * layer.speeds[k]) + layer.phases[k]);
    }
    ctx.lineTo(x, y * CH);
  }
  ctx.lineTo(CW + 40, CH + 40);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, CH * (layer.base - 0.12), 0, CH);
  g.addColorStop(0, layer.top);
  g.addColorStop(1, layer.bottom);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** Light theme: soft grey paper + a slow, heavily blurred mint wave (brand-tinted take on the reference's sky wave). */
export const WaveBackground: React.FC<{ lift?: number }> = ({ lift = 0 }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const t = frame / 30;
    ctx.clearRect(0, 0, CW, CH);
    for (const layer of LAYERS) drawWave(ctx, layer, t, lift);
  }, [frame, lift]);

  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <canvas ref={ref} width={CW} height={CH} style={{ width: "100%", height: "100%" }} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

type Glow = { x: number; y: number; rx: number; ry: number; rot: number; color: string; alpha: number; blur: number };

/** Dark theme: near-black with a drifting green light ribbon (the reference's magenta flame, in brand colour). */
export const NightBackground: React.FC<{ cx?: number; cy?: number; scale?: number; intensity?: number }> = ({
  cx = 0.42,
  cy = 0.5,
  scale = 1,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const t = frame / 30;
    ctx.clearRect(0, 0, CW, CH);
    const sway = Math.sin(t * 0.9) * 0.06;
    const glows: Glow[] = [
      { x: 0, y: 0, rx: 0.3, ry: 0.1, rot: -0.75 + sway, color: "0,191,99", alpha: 0.5, blur: 24 },
      { x: 0.05, y: -0.03, rx: 0.19, ry: 0.04, rot: -0.95 + sway * 1.6, color: "30,215,125", alpha: 0.5, blur: 10 },
      { x: -0.08, y: 0.06, rx: 0.25, ry: 0.07, rot: -0.45 - sway, color: "0,140,120", alpha: 0.4, blur: 20 },
      { x: 0.1, y: 0.02, rx: 0.11, ry: 0.025, rot: -1.15 + sway * 2, color: "150,240,190", alpha: 0.28, blur: 7 },
    ];
    ctx.globalCompositeOperation = "lighter";
    for (const g of glows) {
      ctx.save();
      ctx.filter = `blur(${g.blur * scale}px)`;
      ctx.globalAlpha = g.alpha * intensity;
      ctx.translate((cx + g.x * scale) * CW + Math.sin(t * 0.7 + g.rot) * 6, (cy + g.y * scale) * CH);
      ctx.rotate(g.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, g.rx * CW * scale, g.ry * CH * scale * 1.8, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${g.color})`;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
  }, [frame, cx, cy, scale, intensity]);

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <canvas ref={ref} width={CW} height={CH} style={{ width: "100%", height: "100%" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
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
