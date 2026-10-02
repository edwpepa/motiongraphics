import { spring } from "remotion";
import { FPS } from "../timing";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ease = {
  linear: (t: number) => t,
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outBack: (t: number, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
};

type EaseFn = (t: number) => number;

/** Eased 0→1 progress of a move that starts at `start` and lasts `dur` frames. */
export const prog = (frame: number, start: number, dur: number, fn: EaseFn = ease.outExpo) =>
  fn(clamp01((frame - start) / Math.max(1e-6, dur)));

/** Animate between keyframes [frame, value] with one easing per segment. */
export const keys = (frame: number, kf: Array<[number, number]>, fn: EaseFn = ease.inOutCubic) => {
  if (frame <= kf[0][0]) return kf[0][1];
  for (let i = 1; i < kf.length; i++) {
    const [f1, v1] = kf[i];
    const [f0, v0] = kf[i - 1];
    if (frame <= f1) return lerp(v0, v1, fn(clamp01((frame - f0) / Math.max(1e-6, f1 - f0))));
  }
  return kf[kf.length - 1][1];
};

/** Overshooting pop (0 → 1) for UI elements. */
export const pop = (frame: number, start: number, damping = 13, stiffness = 170) =>
  frame < start ? 0 : spring({ frame: frame - start, fps: FPS, config: { damping, stiffness, mass: 0.7 } });

/** Never-quite-still idle drift. */
export const drift = (frame: number, amp: number, period: number, phase = 0) =>
  Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

export const seeded = (i: number, salt = 0) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const hexToRgb = (hex: string) => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

export const mixColor = (a: string, b: string, t: number) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const k = clamp01(t);
  return `rgb(${ca.map((v, i) => Math.round(lerp(v, cb[i], k))).join(",")})`;
};
