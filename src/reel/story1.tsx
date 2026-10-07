import React from "react";
import { clamp01, ease, flare, glow, hash, lerp, mulberry, rng01, V3 } from "../edw/kit";
import { Cam, P, glass, groundY, terrain } from "./cube";
import { figure, icon, Look, mix, P_EAT, P_HANDS, P_LAUGH, P_TALK, P_THINK, Pose, speech, STAND, thought, walk } from "./fig";
import { RCanvas, RH, RW, starfield, w } from "./rk";

const BG = "#030304";
const GROUND = 1180;
const fill = (ctx: CanvasRenderingContext2D, a = 1) => {
  ctx.globalAlpha = a;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, RW, RH);
  ctx.globalAlpha = 1;
};
/** the floor people stand on: a fine horizon line, a little light pooled on it */
export function floorLine(ctx: CanvasRenderingContext2D, y: number, a: number) {
  if (a <= 0.003) return;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, RW, 0);
  g.addColorStop(0, "rgba(225,232,248,0)");
  g.addColorStop(0.5, `rgba(225,232,248,${0.32 * a})`);
  g.addColorStop(1, "rgba(225,232,248,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y, RW, 1.5);
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(RW / 2, y);
  ctx.scale(1, 0.12);
  glow(ctx, 0, 0, 560, 0.07 * a);
  ctx.restore();
}
const flip = (ctx: CanvasRenderingContext2D, x: number, f: () => void) => {
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.translate(-x, 0);
  f();
  ctx.restore();
};

// ------------------------------------------------------------------ 4.5 – 9.6: people — each eats, laughs, thinks and talks in their own way
type Walker = { x: number; v: number; h: number; y: number; look: Look; ph: number; a: number; dir: number };
const BACK: Walker[] = (() => {
  const r = mulberry(12);
  const looks: Look[] = [{}, { skirt: true, hair: 2 }, { hat: true }, { hair: 1, skirt: true }, { build: 1.2 }, { child: 1 }, { bag: true }, { hair: 3 }, { cane: true }, { build: 0.9, hair: 2 }];
  const out: Walker[] = [];
  for (let i = 0; i < 11; i++) out.push({ x: r() * 1200 - 60, v: (24 + r() * 26) * (i % 2 ? 1 : -1), h: 205 + r() * 50, y: 1085, look: looks[i % looks.length], ph: r() * 6, a: 0.42, dir: i % 2 ? 1 : -1 });
  for (let i = 0; i < 13; i++) out.push({ x: r() * 1200 - 60, v: (18 + r() * 20) * (i % 2 ? -1 : 1), h: 140 + r() * 30, y: 1020, look: looks[(i + 3) % looks.length], ph: r() * 6, a: 0.22, dir: i % 2 ? -1 : 1 });
  return out;
})();
type Actor = { x: number; h: number; look: Look; at: number; pose: Pose; kind: "eat" | "laugh" | "think" | "talk" };
const ACTORS: Actor[] = [
  { x: 168, h: 330, look: { build: 1.08 }, at: w("laugh", 4), pose: P_EAT, kind: "eat" },
  { x: 398, h: 318, look: { skirt: true, hair: 2 }, at: w("laugh", 6), pose: P_LAUGH, kind: "laugh" },
  { x: 628, h: 336, look: { hair: 3, build: 0.94 }, at: w("laugh", 11), pose: P_THINK, kind: "think" },
  { x: 872, h: 326, look: { hat: true }, at: w("laugh", 13), pose: P_TALK, kind: "talk" },
];

export const Crowd: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 4.5, 5.0) * (1 - rng01(T, 9.15, 9.6));
      fill(ctx, fade);
      ctx.globalAlpha = fade;
      const all = T > w("laugh", 16) - 0.1 ? 1 : 0;
      const dim = lerp(1, 0.45, rng01(T, 5.4, 5.9)) * (1 - all) + all;
      floorLine(ctx, GROUND, 1);
      // everyone else, walking past
      for (const b of BACK) {
        const x = ((((b.x + b.v * (T - 4.5)) % 1240) + 1240) % 1240) - 80;
        const ph = T * 5.2 * Math.sign(b.v) + b.ph;
        const draw = () => figure(ctx, x, b.y, b.h, walk(ph), b.look, { a: b.a * dim * 1.0, color: "214,220,234" });
        b.v < 0 ? flip(ctx, x, draw) : draw();
      }
      // the four we watch
      for (const A of ACTORS) {
        const stop = A.at - 0.12;
        const x = T < stop ? A.x - 30 * (stop - T) : A.x;
        const e = ease.inOut(rng01(T, stop, stop + 0.35));
        let pose = mix(walk(T * 5.2), A.pose, e);
        if (A.kind === "laugh" && e > 0) pose = { ...pose, head: pose.head - 0.08 * Math.sin(T * 14) * e, lean: pose.lean - 0.04 * Math.sin(T * 14) * e };
        const on = e > 0 ? 1 : dim;
        if (e > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.translate(x, GROUND);
          ctx.scale(1, 0.16);
          glow(ctx, 0, 0, 150, 0.22 * e);
          ctx.restore();
        }
        const f = figure(ctx, x, GROUND, A.h, pose, A.look, { a: on });
        if (!f || e <= 0) continue;
        const [hx, hy] = f.hd;
        if (A.kind === "eat") {
          // a bowl in one hand, the spoon on its way up
          ctx.save();
          ctx.strokeStyle = "rgb(240,243,250)";
          ctx.fillStyle = "rgb(240,243,250)";
          ctx.lineWidth = 3;
          const [bx, by] = f.lw;
          ctx.beginPath();
          ctx.arc(bx - 22, by - 8, 32, 0.05 * Math.PI, 0.95 * Math.PI);
          ctx.closePath();
          ctx.fill();
          // the spoon
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(f.rw[0], f.rw[1]);
          ctx.lineTo(f.rw[0] - 22, f.rw[1] - 18);
          ctx.stroke();
          ctx.globalAlpha = e;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            for (let k = 0; k <= 10; k++) {
              const yy = by - 16 - k * 5, xx = bx - 34 + i * 12 + Math.sin(k * 0.8 + T * 4 + i) * 4;
              k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
            }
            ctx.globalAlpha = 0.45 * e;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.restore();
        } else if (A.kind === "laugh") {
          ctx.save();
          ctx.strokeStyle = `rgba(240,243,250,${0.8 * e})`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          for (const s of [-1, 1])
            for (let i = 0; i < 3; i++) {
              const ang = -Math.PI / 2 + s * (0.55 + i * 0.32);
              const pul = 1 + 0.15 * Math.sin(T * 14 + i);
              ctx.beginPath();
              ctx.moveTo(hx + Math.cos(ang) * 40, hy - 6 + Math.sin(ang) * 40);
              ctx.lineTo(hx + Math.cos(ang) * 58 * pul, hy - 6 + Math.sin(ang) * 58 * pul);
              ctx.stroke();
            }
          ctx.restore();
        } else if (A.kind === "think") {
          thought(ctx, hx + 20, hy - 26, hx + 72, hy - 150, 56, e, "question", rng01(T, A.at + 0.2, A.at + 0.5));
        } else {
          speech(ctx, hx - 40, hy - 125, 150, 78, hx - 12, hy - 40, e);
        }
      }
      // "around other people": everyone lights up together
      if (all) {
        const k = Math.exp(-(T - w("laugh", 16)) / 0.6);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.translate(RW / 2, GROUND);
        ctx.scale(1, 0.14);
        glow(ctx, 0, 0, 700, 0.18 * k);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 9.3 – 11.6: genes — the code inside a person
export const Genes: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 9.3, 9.75) * (1 - rng01(T, 11.25, 11.6));
      fill(ctx, fade);
      ctx.globalAlpha = fade;
      const H = 960, x = RW / 2, y = 1225;
      const f = figure(ctx, x, y, H, STAND, {}, { ai: true, core: 0, a: 0.75 });
      ctx.globalAlpha = fade;
      if (!f) return;
      const lit = 0.55 + 0.45 * rng01(T, w("genes", 6) - 0.2, w("genes", 6) + 0.2);
      const reveal = ease.outCubic(rng01(T, 9.45, 10.5, (t) => t));
      const top = f.hd[1] - f.hr * 0.6, bot = f.hip[1] + 40;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let yy = top; yy <= bot; yy += 4) {
        const u = (yy - top) / (bot - top);
        if (u > reveal) break;
        const wd = (yy < f.hd[1] + f.hr ? 0.5 : 1) * 46;
        for (const s of [0, 1]) {
          const ang = yy * 0.035 + T * 2.4 + s * Math.PI;
          const xx = x + Math.cos(ang) * wd;
          const dep = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(ang));
          ctx.fillStyle = `rgba(240,244,252,${0.9 * dep * lit})`;
          ctx.fillRect(xx - 2.2, yy - 2.2, 4.4, 4.4);
        }
        if (Math.round(yy) % 20 < 4) {
          const ang = yy * 0.035 + T * 2.4;
          ctx.strokeStyle = `rgba(230,236,250,${0.35 * lit})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(ang) * wd, yy);
          ctx.lineTo(x - Math.cos(ang) * wd, yy);
          ctx.stroke();
        }
      }
      glow(ctx, x, (top + bot) / 2, 360, 0.08 * lit);
      ctx.restore();
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 11.2 – 20.4: a child grows up — parents, school, a place, ideas heard and its own
const childH = (T: number) => lerp(250, 470, ease.inOut(rng01(T, 11.4, 19.6, (t) => t)));
const childC = (T: number) => 1 - ease.inOut(rng01(T, 15.6, 17.4, (t) => t));
const IDEAS_IN: { k: string; x: number; y: number }[] = [
  { k: "music", x: 120, y: 420 },
  { k: "book", x: 960, y: 360 },
  { k: "atom", x: 150, y: 760 },
  { k: "heart", x: 930, y: 700 },
  { k: "star", x: 330, y: 260 },
  { k: "planet", x: 760, y: 230 },
];

/** the street the child grows up in, drawn as a thin line skyline */
function street(ctx: CanvasRenderingContext2D, y: number, a: number, reveal: number) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, RW * reveal, RH);
  ctx.clip();
  ctx.strokeStyle = `rgba(222,229,244,${0.5 * a})`;
  ctx.lineWidth = 1.6;
  const house = (x: number, wd: number, hh: number, roof: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - hh);
    ctx.lineTo(x + wd / 2, y - hh - roof);
    ctx.lineTo(x + wd, y - hh);
    ctx.lineTo(x + wd, y);
    ctx.stroke();
    ctx.fillStyle = `rgba(245,236,214,${0.55 * a})`;
    for (let i = 0; i < 2; i++) ctx.fillRect(x + wd * (0.22 + i * 0.4), y - hh * 0.62, wd * 0.18, hh * 0.22);
  };
  const tree = (x: number, s: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - s * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - s * 0.9, s * 0.38, 0, Math.PI * 2);
    ctx.stroke();
  };
  house(30, 120, 110, 50);
  tree(190, 120);
  house(240, 100, 150, 40);
  // a church
  ctx.beginPath();
  ctx.moveTo(380, y);
  ctx.lineTo(380, y - 200);
  ctx.lineTo(410, y - 290);
  ctx.lineTo(440, y - 200);
  ctx.lineTo(440, y);
  ctx.moveTo(410, y - 290);
  ctx.lineTo(410, y - 330);
  ctx.moveTo(398, y - 316);
  ctx.lineTo(422, y - 316);
  ctx.stroke();
  house(640, 140, 120, 55);
  tree(810, 140);
  house(860, 110, 170, 45);
  tree(1010, 100);
  // street lamps
  for (const lx of [340, 600, 990]) {
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y - 150);
    ctx.lineTo(lx + 22, y - 150);
    ctx.stroke();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, lx + 22, y - 146, 46, 0.35 * a);
    ctx.restore();
  }
  ctx.restore();
}

export const Grow: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const fade = rng01(T, 11.25, 11.7);
      fill(ctx, fade);
      ctx.globalAlpha = fade;
      const bgOut = 1 - rng01(T, 20.2, 20.8);
      const cx = RW / 2;
      const h = childH(T), cc = childC(T);
      floorLine(ctx, GROUND, bgOut);
      // the place it grows up in
      const place = rng01(T, w("place", 1) - 0.15, w("place", 1) + 0.85, (t) => t);
      if (place > 0) street(ctx, GROUND, (0.35 + 0.65 * (1 - rng01(T, 16.0, 16.6)) ) * bgOut, ease.inOut(place));
      // school: a blackboard
      const sch = rng01(T, w("parents", 9) - 0.15, w("parents", 9) + 0.3) * (1 - rng01(T, 14.55, 14.95));
      if (sch > 0.003) {
        ctx.save();
        ctx.globalAlpha = sch * fade;
        const bx = cx - 300, by = 300, bw = 600, bh = 300;
        ctx.fillStyle = "rgba(14,16,18,1)";
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "rgba(230,236,248,0.75)";
        ctx.lineWidth = 6;
        ctx.strokeRect(bx, by, bw, bh);
        const d = rng01(T, w("parents", 9) - 0.1, w("parents", 9) + 0.45, (t) => t);
        ctx.beginPath();
        ctx.rect(bx, by, bw * d, bh);
        ctx.clip();
        ctx.strokeStyle = "rgba(236,240,248,0.85)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 60, by + 230);
        ctx.lineTo(bx + 210, by + 230);
        ctx.lineTo(bx + 60, by + 90);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = "rgba(236,240,248,0.85)";
        ctx.font = "italic 300 52px Inter, sans-serif";
        ctx.fillText("a² + b² = c²", bx + 260, by + 170);
        ctx.restore();
        ctx.globalAlpha = fade;
      }
      // the parents
      const par = rng01(T, w("parents", 7) - 0.35, w("parents", 7) + 0.3);
      const apart = ease.inOut(rng01(T, 15.9, 16.8, (t) => t));
      const ch = figure(ctx, cx, GROUND, h, mix(P_HANDS, STAND, apart), { child: cc, hair: cc > 0.5 ? 1 : 0 }, { a: 1 })!;
      if (par > 0.003) {
        const pa = par * lerp(1, 0.55, apart) * bgOut;
        for (const s of [-1, 1]) {
          const px = cx + s * lerp(185, 330, apart) + s * (1 - par) * 60;
          const PH = 540;
          const sx = px - s * 0.078 * PH, sy = GROUND - PH * 0.78;
          const tx = s < 0 ? ch.lw[0] : ch.rw[0], ty = s < 0 ? ch.lw[1] : ch.rw[1];
          const ang = Math.atan2(tx - sx, ty - sy);
          const reach = lerp(ang, s * 0.12, apart);
          const pose: Pose = s < 0 ? { ...STAND, ra: reach, rf: reach } : { ...STAND, la: reach, lf: reach };
          figure(ctx, px, GROUND, PH, pose, s < 0 ? { skirt: true, hair: 2 } : { build: 1.12 }, { a: pa });
        }
      }
      ctx.globalAlpha = fade;
      // ideas it hears: they come from everywhere and go in
      const [hx, hy] = ch.hd;
      IDEAS_IN.forEach((d, i) => {
        const t0 = w("idea", 1) - 0.2 + i * 0.26;
        const ap = rng01(T, t0, t0 + 0.3);
        const go = ease.inCubic(rng01(T, t0 + 0.55, t0 + 1.35, (t) => t));
        if (ap <= 0 || go >= 1) return;
        const x = lerp(d.x, hx, go), y = lerp(d.y, hy, go);
        const s = lerp(1, 0.15, go);
        speech(ctx, x, y, 120 * s, 84 * s, x + 20 * s, y + 60 * s, ap * (1 - go * 0.3) * bgOut, d.k);
      });
      // and the ones it comes up with on its own
      const bulb = rng01(T, w("idea", 7) - 0.1, w("idea", 7) + 0.3);
      if (bulb > 0) {
        const bx = hx, by = hy - 150;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        glow(ctx, bx, by - 6, 120, 0.35 * bulb * bgOut);
        ctx.restore();
        icon(ctx, "bulb", bx, by, 92, bulb * bgOut, 3);
        ["gear", "rocket", "brush"].forEach((k, i) => {
          const t0 = w("idea", 9) + i * 0.3;
          const u = rng01(T, t0, t0 + 1.1, (t) => t);
          if (u <= 0 || u >= 1) return;
          const ang = -Math.PI / 2 + (i - 1) * 0.75;
          const r = 60 + 160 * ease.outCubic(u);
          icon(ctx, k, bx + Math.cos(ang) * r, by - 10 + Math.sin(ang) * r, 54, Math.sin(Math.PI * u) * bgOut, 2.5);
        });
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 20.2 – 24.4: the same person, scanned into an artificial mind
const TEEN: Look = { hair: 0 };
export const Digitize: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      fill(ctx, 1 - rng01(T, 24.0, 24.4));
      const out = 1 - rng01(T, 24.0, 24.4);
      ctx.globalAlpha = out;
      const push = ease.inOut(rng01(T, 21.3, 22.5, (t) => t));
      const H = lerp(470, 900, push), y = lerp(GROUND, 1360, push);
      const scan = rng01(T, 20.3, 21.35, ease.inOut);
      const top = y - H * 1.02, sy = lerp(top - 10, y + 6, scan);
      // the grid floor of a simulation, under its feet
      const grid = rng01(T, 21.0, 21.8) * (1 - push * 0.6);
      if (grid > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(220,228,246,${0.18 * grid})`;
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
          ctx.beginPath();
          ctx.moveTo(RW / 2 + i * 26, GROUND);
          ctx.lineTo(RW / 2 + i * 160, RH);
          ctx.stroke();
        }
        for (let k = 0; k < 9; k++) {
          const yy = GROUND + Math.pow(k / 8, 1.8) * (RH - GROUND);
          ctx.beginPath();
          ctx.moveTo(0, yy);
          ctx.lineTo(RW, yy);
          ctx.stroke();
        }
        ctx.restore();
      }
      floorLine(ctx, GROUND, 1 - push);
      // below the scan line: still a person; above it: an artificial one
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, sy, RW, RH);
      ctx.clip();
      figure(ctx, RW / 2, y, H, STAND, TEEN, { a: 1 });
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, RW, sy);
      ctx.clip();
      const ai = figure(ctx, RW / 2, y, H, STAND, TEEN, { ai: true, core: rng01(T, 20.4, 21.4) * (0.6 + 0.4 * rng01(T, 22.5, 22.9)) });
      ctx.restore();
      if (scan > 0 && scan < 1) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(245,248,255,0.9)";
        ctx.fillRect(RW / 2 - 260, sy - 1, 520, 2);
        const g = ctx.createLinearGradient(0, sy - 70, 0, sy);
        g.addColorStop(0, "rgba(235,240,255,0)");
        g.addColorStop(1, "rgba(235,240,255,0.16)");
        ctx.fillStyle = g;
        ctx.fillRect(RW / 2 - 260, sy - 70, 520, 70);
        ctx.restore();
      }
      // "artificial minds": circuits light up inside the head
      if (ai) {
        const [hx, hy] = ai.hd, hr = ai.hr;
        const c = rng01(T, w("imagine", 7) - 0.1, w("imagine", 8) - 0.1, (t) => t);
        if (c > 0) {
          const r = mulberry(4);
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.lineWidth = Math.max(1.2, hr * 0.03);
          for (let i = 0; i < 16; i++) {
            const a0 = r() * Math.PI * 2;
            let px = hx + Math.cos(a0) * hr * 0.15, py = hy + Math.sin(a0) * hr * 0.15;
            const pts: [number, number][] = [[px, py]];
            for (let k = 0; k < 3; k++) {
              const horiz = (k + i) % 2 === 0;
              const len = hr * (0.18 + r() * 0.25);
              const sgn = r() < 0.5 ? -1 : 1;
              px += horiz ? sgn * len : 0;
              py += horiz ? 0 : sgn * len;
              const d = Math.hypot(px - hx, py - hy);
              if (d > hr * 0.78) {
                px = hx + ((px - hx) / d) * hr * 0.78;
                py = hy + ((py - hy) / d) * hr * 0.78;
              }
              pts.push([px, py]);
            }
            const u = clamp01(c * 1.6 - i / 16);
            if (u <= 0) continue;
            ctx.strokeStyle = `rgba(240,245,255,${0.8 * u})`;
            ctx.beginPath();
            pts.forEach(([a, b], j) => (j ? ctx.lineTo(a, b) : ctx.moveTo(a, b)));
            ctx.stroke();
            glow(ctx, px, py, hr * 0.08, u);
          }
          glow(ctx, hx, hy, hr * 1.8, 0.25 * c);
          ctx.restore();
        }
        if (T > w("imagine", 8)) flare(ctx, hx, hy, 0.6 * Math.exp(-(T - w("imagine", 8)) / 0.6), 900, 50);
      }
      ctx.globalAlpha = 1;
    }}
  />
);

// ------------------------------------------------------------------ 24.0 – 29.0: a simulated world, every individual an AI that grows up
const simCam = (T: number): Cam => ({ cx: RW / 2, cy: 720, s: lerp(250, 300, ease.outCubic(rng01(T, 24.0, 26.0, (t) => t))), yaw: 0.6 + 0.09 * (T - 24), pitch: -0.42 });
type Sim = { x: number; z: number; look: Look; dir: number; ph: number };
const SIMPOP: Sim[] = (() => {
  const r = mulberry(51);
  const looks: Look[] = [{}, { skirt: true, hair: 2 }, { hat: true }, { hair: 1 }, { build: 1.15 }, { hair: 3, skirt: true }, { bag: true }];
  const out: Sim[] = [];
  while (out.length < 26) {
    const x = (r() * 2 - 1) * 0.74, z = (r() * 2 - 1) * 0.74;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 0.22)) continue;
    out.push({ x, z, look: looks[out.length % looks.length], dir: r() < 0.5 ? -1 : 1, ph: r() * 6 });
  }
  return out;
})();
let DIVE = -1;
export const Simworld: React.FC = () => (
  <RCanvas
    draw={(ctx, T) => {
      const cam = simCam(T);
      const fin = rng01(T, 24.0, 24.45);
      fill(ctx, fin);
      ctx.globalAlpha = fin;
      ctx.globalCompositeOperation = "lighter";
      starfield(ctx, T, 0.3, 140, T * 3);
      ctx.globalCompositeOperation = "source-over";
      // the dive into one of them at the end
      if (DIVE < 0) {
        let best = 1e9;
        SIMPOP.forEach((s, i) => {
          const p = P(simCam(28.3), [s.x, groundY(s.x, s.z), s.z]);
          const sc = Math.abs(p.x - RW / 2) + Math.abs(p.y - 820) * 0.6 - p.k * 200;
          if (sc < best) {
            best = sc;
            DIVE = i;
          }
        });
      }
      const dv = ease.inCubic(rng01(T, 28.25, 28.95, (t) => t));
      const rest = 1 - rng01(T, 28.35, 28.8);
      const pos = (s: Sim): V3 => {
        const x = s.x + 0.03 * Math.sin(T * 0.6 + s.ph), z = s.z + 0.03 * Math.cos(T * 0.5 + s.ph);
        return [x, groundY(x, z), z];
      };
      const grow = (i: number) => ease.inOut(rng01(T, w("world", 10) - 0.1 + 0.25 * hash(i * 3.1), w("world", 10) + 0.7 + 0.25 * hash(i * 3.1), (t) => t));
      const tall = (i: number, k: number) => cam.s * k * lerp(0.13, 0.21, grow(i));
      if (dv > 0) {
        const s = SIMPOP[DIVE];
        const p = P(cam, pos(s));
        const hy = p.y - tall(DIVE, p.k) * 0.85;
        const Z = Math.pow(14, dv);
        ctx.translate(lerp(p.x, RW / 2, dv), lerp(hy, 560, dv));
        ctx.scale(Z, Z);
        ctx.translate(-p.x, -hy);
      }
      ctx.globalAlpha = fin * rest;
      glass(ctx, cam, "back", rng01(T, 24.05, 24.6));
      terrain(ctx, cam, 0.75 * rng01(T, 24.2, 24.9), { rise: ease.inOut(rng01(T, 24.3, 25.4, (t) => t)), light: (n) => 0.3 + 0.7 * Math.max(0, n[1] * 0.85 + n[0] * 0.3) });
      // everyone, back to front
      const order = SIMPOP.map((s, i) => ({ s, i, p: P(cam, pos(s)) })).sort((a, b) => b.p.z - a.p.z);
      for (const { s, i, p } of order) {
        const t0 = w("world", 5) - 0.1 + 0.8 * hash(i * 1.7);
        const ap = rng01(T, t0, t0 + 0.35);
        if (ap <= 0) continue;
        const g = grow(i);
        const h = tall(i, p.k);
        const blink = T > w("world", 8) ? Math.exp(-Math.max(0, T - w("world", 8) - 0.2 * hash(i)) / 0.35) : 0;
        ctx.globalAlpha = fin * (i === DIVE ? 1 : rest) * ap;
        const draw = () => figure(ctx, p.x, p.y, h, walk(T * 3 + s.ph, 0.4), { ...s.look, child: 1 - g }, { ai: true, core: 0.7 + 0.8 * blink });
        s.dir < 0 ? flip(ctx, p.x, draw) : draw();
      }
      ctx.globalAlpha = fin * rest;
      glass(ctx, cam, "front", rng01(T, 24.05, 24.6));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
    }}
  />
);
