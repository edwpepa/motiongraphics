import React, { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, ease, lerp, seeded } from "../lib/anim";
import { useLayout } from "../layout";

// ---------------------------------------------------------------------------------------------
// Floating liquid-glass spheres for the white set. Their paths come from a small deterministic
// physics simulation (soft walls + elastic collisions, mass ∝ area), so they drift, meet and bounce
// off each other the same way on every render.
// ---------------------------------------------------------------------------------------------

type Ball = { x: number; y: number; vx: number; vy: number; r: number };

const simulate = (W: number, H: number, vertical: boolean, frames: number) => {
  const k = vertical ? 0.85 : 1;
  const radii = [300, 210, 150, 112, 84, 62, 46, 34, 26].map((r) => r * k);
  const spots: [number, number][] = [
    [0.12, 0.78],
    [0.86, 0.22],
    [0.7, 0.86],
    [0.22, 0.16],
    [0.92, 0.6],
    [0.42, 0.9],
    [0.55, 0.1],
    [0.05, 0.42],
    [0.33, 0.62],
  ];
  const balls: Ball[] = radii.map((r, i) => {
    const a = seeded(i, 11) * Math.PI * 2;
    const sp = (0.9 + seeded(i, 12) * 1.2) * (60 / (r + 60)) * 2.2;
    return { x: spots[i][0] * W, y: spots[i][1] * H, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r };
  });
  const out = new Float32Array(frames * balls.length * 2);
  for (let fr = 0; fr < frames; fr++) {
    for (const b of balls) {
      b.x += b.vx;
      b.y += b.vy;
      // soft walls: spheres may hang partly off-frame, then bounce back
      const m = b.r * 0.45;
      if (b.x < -m && b.vx < 0) b.vx *= -1;
      if (b.x > W + m && b.vx > 0) b.vx *= -1;
      if (b.y < -m && b.vy < 0) b.vy *= -1;
      if (b.y > H + m && b.vy > 0) b.vy *= -1;
    }
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const overlap = a.r + b.r - d;
        if (overlap <= 0) continue;
        const nx = dx / d;
        const ny = dy / d;
        const ma = a.r * a.r;
        const mb = b.r * b.r;
        // separate
        a.x -= nx * overlap * (mb / (ma + mb));
        a.y -= ny * overlap * (mb / (ma + mb));
        b.x += nx * overlap * (ma / (ma + mb));
        b.y += ny * overlap * (ma / (ma + mb));
        // elastic bounce along the normal
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const imp = (2 * rel) / (ma + mb);
          a.vx += imp * mb * nx;
          a.vy += imp * mb * ny;
          b.vx -= imp * ma * nx;
          b.vy -= imp * ma * ny;
        }
      }
    }
    balls.forEach((b, i) => {
      out[(fr * balls.length + i) * 2] = b.x;
      out[(fr * balls.length + i) * 2 + 1] = b.y;
    });
  }
  return { radii, out, n: balls.length };
};

/** clean vector glass bubble: pale mint body, fine rim, white highlight crescent, mint caustic */
const Bubble: React.FC<{ r: number }> = ({ r }) => (
  <svg width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`} style={{ position: "absolute", left: -r, top: -r, overflow: "visible" }}>
    <defs>
      <radialGradient id={`bub${Math.round(r)}`} cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="55%" stopColor="rgba(232,248,239,0.75)" />
        <stop offset="100%" stopColor="rgba(190,236,212,0.7)" />
      </radialGradient>
    </defs>
    <circle r={r} fill={`url(#bub${Math.round(r)})`} stroke="rgba(0,163,82,0.28)" strokeWidth={Math.max(1.5, r * 0.012)} />
    <circle r={r * 0.9} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={Math.max(1, r * 0.01)} />
    <path d={`M ${-r * 0.66} ${-r * 0.08} A ${r * 0.68} ${r * 0.68} 0 0 1 ${-r * 0.1} ${-r * 0.67}`} fill="none" stroke="#ffffff" strokeWidth={Math.max(3, r * 0.075)} strokeLinecap="round" />
    <circle cx={r * 0.08} cy={-r * 0.7} r={Math.max(2, r * 0.045)} fill="#ffffff" />
    <path d={`M ${r * 0.28} ${r * 0.72} A ${r * 0.78} ${r * 0.78} 0 0 0 ${r * 0.74} ${r * 0.24}`} fill="none" stroke="#2be38a" strokeWidth={Math.max(2, r * 0.035)} strokeLinecap="round" opacity={0.45} />
  </svg>
);

/** index of the sphere that bounces in during the cold open */
const BOUNCER = 3;
/** frames the bouncing ball hits the floor (the audio's bounce thuds use the same frames) */
export const BOUNCE_HITS = [13, 25, 33, 38];
const BOUNCE_HEIGHTS = [260, 110, 40];
const JOIN_FROM = 46;

const bounceAt = (frame: number, x: number, floor: number, r: number) => {
  const hits = BOUNCE_HITS;
  let y = floor - r;
  if (frame < hits[0]) {
    const s = clamp01(frame / hits[0]);
    y = lerp(-r * 1.4, floor - r, s * s);
  } else {
    for (let i = 0; i < hits.length - 1; i++) {
      if (frame >= hits[i] && frame < hits[i + 1]) {
        const s = (frame - hits[i]) / (hits[i + 1] - hits[i]);
        y = floor - r - 4 * BOUNCE_HEIGHTS[i] * s * (1 - s);
      }
    }
  }
  // squash on every impact, stretch while falling fast
  let squash = 0;
  hits.forEach((h, i) => {
    const d = frame - h;
    if (d >= 0 && d < 6) squash = Math.max(squash, (1 - d / 6) * (0.28 - i * 0.06));
  });
  const stretch = frame < hits[0] ? 0.12 * clamp01(frame / hits[0]) : 0;
  return { x, y, sx: 1 + squash - stretch * 0.5, sy: 1 - squash + stretch };
};

/**
 * White set: pale near-white base, quiet grid, and the glass spheres. `pull` (0..1) draws the spheres
 * into the frame centre one by one (smallest first), shrinking them into the charging orb.
 */
export const LightBackdrop: React.FC<{ frame: number; frames: number; pull: number }> = ({ frame, frames, pull }) => {
  const L = useLayout();
  const sim = useMemo(() => simulate(L.W, L.H, L.vertical, frames), [L.W, L.H, L.vertical, frames]);
  const fr = Math.max(0, Math.min(frames - 1, Math.round(frame)));
  const grid = "rgba(16,40,28,0.065)";
  const cell = L.vertical ? 90 : 96;
  const mask = `radial-gradient(ellipse ${L.vertical ? "95% 60%" : "70% 85%"} at 50% 50%, #000 35%, transparent 100%)`;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #f6f8f7 60%, #eef1ef 100%)", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${grid} 1.5px, transparent 1.5px), linear-gradient(90deg, ${grid} 1.5px, transparent 1.5px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `${(L.W / 2) % cell}px ${(L.H / 2) % cell}px`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
      {sim.radii.map((r, i) => {
        // smallest go first
        const order = (sim.n - 1 - i) / (sim.n - 1);
        const k = ease.inCubic(clamp01(pull * 1.7 - order * 0.7));
        if (k >= 0.999) return null;
        let x = sim.out[(fr * sim.n + i) * 2];
        let y = sim.out[(fr * sim.n + i) * 2 + 1];
        let sx = 1;
        let sy = 1;
        if (i === BOUNCER) {
          // the cold open: this one drops in, bounces like a ball, then drifts off to join the others
          const b = bounceAt(frame, L.cx, L.cy + (L.vertical ? 160 : 110), r);
          const join = ease.inOutCubic(clamp01((frame - JOIN_FROM) / 26));
          x = lerp(b.x, x, join);
          y = lerp(b.y, y, join);
          sx = lerp(b.sx, 1, join);
          sy = lerp(b.sy, 1, join);
        }
        x = lerp(x, L.cx, k);
        y = lerp(y, L.cy, k);
        return (
          <React.Fragment key={i}>
            {i === BOUNCER && frame < JOIN_FROM + 20 && (
              // contact shadow under the bouncing ball
              <div
                style={{
                  position: "absolute",
                  left: L.cx - r,
                  top: L.cy + (L.vertical ? 160 : 110) - r * 0.12,
                  width: r * 2,
                  height: r * 0.24,
                  borderRadius: "50%",
                  background: "radial-gradient(ellipse, rgba(10,50,30,0.22) 0%, rgba(10,50,30,0) 70%)",
                  opacity: clamp01(1 - (L.cy + (L.vertical ? 160 : 110) - r - y) / 320) * (1 - clamp01((frame - JOIN_FROM) / 16)),
                  transform: `scaleX(${0.6 + 0.4 * clamp01(1 - (L.cy + (L.vertical ? 160 : 110) - r - y) / 320)})`,
                }}
              />
            )}
            <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, transform: `scale(${(1 - k) * sx}, ${(1 - k) * sy})`, transformOrigin: "50% 100%" }}>
              <div style={{ position: "absolute", left: r, top: r }}>
                <Bubble r={r} />
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------------------------
// Flat, vector-style brand orb + the burst that opens the dark half.
// ---------------------------------------------------------------------------------------------

/** Clean graphic orb: flat two-tone disc, a crisp highlight crescent, thin orbit rings. */
export const VectorOrb: React.FC<{ r: number; frame: number; rings?: number }> = ({ r, frame, rings = 1 }) => (
  <svg width={r * 6} height={r * 6} viewBox={`${-r * 3} ${-r * 3} ${r * 6} ${r * 6}`} style={{ position: "absolute", left: -r * 3, top: -r * 3, overflow: "visible" }}>
    <defs>
      <linearGradient id="vo-fill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#3df29a" />
        <stop offset="100%" stopColor="#00a352" />
      </linearGradient>
    </defs>
    {[1.45, 1.9].map((k, i) => (
      <circle key={i} r={r * k} fill="none" stroke="#00c46a" strokeWidth={2} opacity={(0.35 - i * 0.15) * rings} strokeDasharray={i ? `${r * 0.25} ${r * 0.18}` : undefined} transform={`rotate(${frame * (i ? -1.2 : 0.8)})`} />
    ))}
    <circle r={r} fill="url(#vo-fill)" />
    <circle cx={-r * 0.18} cy={-r * 0.2} r={r * 0.62} fill="#7dffb4" opacity={0.35} />
    <path d={`M ${-r * 0.62} ${-r * 0.1} A ${r * 0.64} ${r * 0.64} 0 0 1 ${-r * 0.05} ${-r * 0.66}`} fill="none" stroke="#ffffff" strokeWidth={r * 0.09} strokeLinecap="round" opacity={0.9} />
    <circle cx={r * 0.12} cy={-r * 0.66} r={r * 0.05} fill="#ffffff" opacity={0.9} />
  </svg>
);

/** radius of the hole the burst opens into the white set, `t` frames after it starts */
export const burstRadius = (t: number, W: number, H: number) => (Math.hypot(W, H) / 2 + 60) * ease.inOutCubic(clamp01(t / 14));

/** The burst: a bright ring rides the edge of the opening hole, with radial streaks and two echo rings. */
export const BurstRing: React.FC<{ t: number }> = ({ t }) => {
  const L = useLayout();
  if (t < 0 || t > 18) return null;
  const R = burstRadius(t, L.W, L.H);
  const fade = 1 - clamp01((t - 10) / 8);
  return (
    <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <g transform={`translate(${L.cx} ${L.cy})`} opacity={fade}>
        <circle r={R} fill="none" stroke="#2be38a" strokeWidth={10} style={{ filter: "drop-shadow(0 0 18px rgba(43,227,138,0.9))" }} />
        <circle r={R * 0.84} fill="none" stroke="#2be38a" strokeWidth={3} opacity={0.6} />
        <circle r={R * 0.68} fill="none" stroke="#2be38a" strokeWidth={2} opacity={0.35} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2 + 0.12;
          const r0 = R * 0.55;
          const r1 = R * (0.75 + 0.12 * (i % 3));
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke="#b9ffd6" strokeWidth={4} strokeLinecap="round" opacity={0.8} />;
        })}
      </g>
    </svg>
  );
};

/** Cold-open radar: a green dot pings three rings out across the white set (like the taskers map). */
export const RadarOpen: React.FC<{ frame: number; end: number }> = ({ frame, end }) => {
  const L = useLayout();
  const dot = ease.outBack(clamp01((frame - 2) / 12));
  const out = ease.inCubic(clamp01((frame - (end - 8)) / 10));
  if (out >= 1) return null;
  const rings = [4, 15, 26];
  return (
    <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${L.cx} ${L.cy})`}>
        {rings.map((s, i) => {
          const p = clamp01((frame - s) / 48);
          if (p <= 0 || p >= 1) return null;
          const R = 30 + 950 * ease.outCubic(p);
          return (
            <g key={i}>
              <circle r={R} fill="rgba(0,196,106,0.05)" opacity={1 - p} />
              <circle r={R} fill="none" stroke="#00c46a" strokeWidth={3} opacity={(1 - p) * 0.8} />
            </g>
          );
        })}
        <g transform={`scale(${dot * (1 - out)})`}>
          <circle r={34} fill="rgba(0,196,106,0.15)" />
          <circle r={16} fill="#00c46a" />
          <circle r={6} fill="#ffffff" />
        </g>
      </g>
    </svg>
  );
};

/** wobbling closed outline (sum of slow sines around a circle) */
const wobblePath = (r: number, t: number, amt: number, pts = 64) => {
  let d = "";
  for (let i = 0; i <= pts; i++) {
    const th = (i / pts) * Math.PI * 2;
    const rr = r * (1 + amt * (Math.sin(3 * th + t * 0.9) * 0.6 + Math.sin(2 * th - t * 1.3) * 0.4));
    d += (i ? "L" : "M") + (Math.cos(th) * rr).toFixed(1) + " " + (Math.sin(th) * rr).toFixed(1);
  }
  return d + "Z";
};

/** minimal liquid bead: flat green, softly wobbling, one clean highlight */
export const LiquidDrop: React.FC<{ r: number; frame: number }> = ({ r, frame }) => (
  <svg width={r * 4} height={r * 4} viewBox={`${-r * 2} ${-r * 2} ${r * 4} ${r * 4}`} style={{ position: "absolute", left: -r * 2, top: -r * 2, overflow: "visible" }}>
    <defs>
      <linearGradient id="drop-fill" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stopColor="#3df29a" />
        <stop offset="100%" stopColor="#00a352" />
      </linearGradient>
    </defs>
    <path d={wobblePath(r, frame / 3, 0.06)} fill="url(#drop-fill)" />
    <path d={`M ${-r * 0.55} ${-r * 0.12} A ${r * 0.6} ${r * 0.6} 0 0 1 ${-r * 0.1} ${-r * 0.58}`} fill="none" stroke="#ffffff" strokeWidth={r * 0.1} strokeLinecap="round" opacity={0.9} />
  </svg>
);

/** frames the splash needs to cover the whole frame */
export const SPLASH_COVER = 13;

/**
 * The splash: the bead bursts into a gooey liquid crown — a core that floods outwards with droplets
 * flung ahead of it, dark ink with a bright green rim — until it covers the frame; then it clears
 * to reveal the dark set underneath.
 */
export const LiquidSplash: React.FC<{ t: number }> = ({ t }) => {
  const L = useLayout();
  if (t < 0 || t > SPLASH_COVER + 10) return null;
  const maxR = Math.hypot(L.W, L.H) / 2 + 120;
  const k = clamp01(t / SPLASH_COVER);
  // explosive start, then the flood keeps rolling out to the corners
  const core = maxR * (0.07 + 0.93 * Math.pow(k, 1.5));
  const drops = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2 + seeded(i, 21) * 0.25;
    const sp = seeded(i, 22);
    // flung just ahead of the rim, then swallowed by it again
    const lead = (30 + 230 * sp) * Math.sin(Math.PI * Math.min(1, k * 1.25));
    const d = core + lead;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (16 + 34 * seeded(i, 23)) * (1 + 0.6 * k) };
  });
  const clear = 1 - ease.inOutCubic(clamp01((t - SPLASH_COVER - 1) / 9));
  const shapes = (grow: number, fill: string) => (
    <g filter="url(#splash-goo)" fill={fill}>
      <circle r={core + grow} />
      {drops.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r + grow} />
      ))}
    </g>
  );
  return (
    <svg width={L.W} height={L.H} viewBox={`${-L.cx} ${-L.cy} ${L.W} ${L.H}`} style={{ position: "absolute", inset: 0, opacity: clear }}>
      <defs>
        <filter id="splash-goo" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -11" />
        </filter>
      </defs>
      {shapes(14, "#2be38a")}
      {shapes(0, "#04100b")}
    </svg>
  );
};
