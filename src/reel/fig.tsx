import { clamp01, glow, lerp } from "../edw/kit";

// ------------------------------------------------------------------ people, drawn as clean pictograms (museum-signage style)
/** limb angles in radians in the picture plane: 0 points straight down, +π/2 to the right, π up, −π/2 to the left */
export type Pose = { lean: number; head: number; la: number; lf: number; ra: number; rf: number; ll: number; lk: number; rl: number; rk: number; drop?: number };
export type Look = { build?: number; skirt?: boolean; hair?: 0 | 1 | 2 | 3; hat?: boolean; child?: number; bag?: boolean; cane?: boolean; tie?: boolean; pack?: boolean };
export type FigOpt = { a?: number; ai?: boolean; core?: number; color?: string; bg?: string };

export const STAND: Pose = { lean: 0, head: 0, la: -0.12, lf: -0.06, ra: 0.12, rf: 0.06, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };
export const mix = (a: Pose, b: Pose, t: number): Pose => {
  const o = {} as Pose;
  (Object.keys(a) as (keyof Pose)[]).forEach((k) => ((o as Record<string, number>)[k] = lerp(a[k] ?? 0, b[k] ?? 0, t)));
  if (a.drop !== undefined || b.drop !== undefined) o.drop = lerp(a.drop ?? 0, b.drop ?? 0, t);
  return o;
};
/** a walk cycle, phase in radians, facing right */
export const walk = (ph: number, amt = 1): Pose => {
  const s = Math.sin(ph) * amt;
  return {
    lean: 0.04 * amt,
    head: 0,
    la: -0.38 * s,
    lf: -0.38 * s + 0.25 * amt,
    ra: 0.38 * s,
    rf: 0.38 * s + 0.25 * amt,
    ll: 0.36 * s,
    lk: 0.36 * s - 0.3 * amt * Math.max(0, -Math.cos(ph)),
    rl: -0.36 * s,
    rk: -0.36 * s - 0.3 * amt * Math.max(0, Math.cos(ph)),
  };
};
export const P_EAT: Pose = { lean: 0.02, head: 0.08, la: -0.55, lf: -1.45, ra: 0.25, rf: 2.75, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };
export const P_LAUGH: Pose = { lean: -0.12, head: -0.38, la: -0.45, lf: 0.85, ra: 0.45, rf: -0.85, ll: -0.1, lk: -0.06, rl: 0.1, rk: 0.06 };
export const P_THINK: Pose = { lean: 0.03, head: 0.18, la: 0.3, lf: 1.65, ra: 0.3, rf: 2.85, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };
export const P_TALK: Pose = { lean: 0.02, head: 0.05, la: -0.75, lf: -1.6, ra: 0.6, rf: 1.75, ll: -0.1, lk: -0.06, rl: 0.1, rk: 0.06 };
export const P_ARMSUP: Pose = { lean: 0, head: -0.3, la: -2.75, lf: -2.95, ra: 2.75, rf: 2.95, ll: -0.1, lk: -0.06, rl: 0.1, rk: 0.06 };
export const P_KNEEL: Pose = { lean: 0.25, head: -0.45, la: 2.2, lf: 2.7, ra: 2.35, rf: 2.8, ll: 1.15, lk: -1.57, rl: 1.25, rk: -1.57, drop: 0.24 };
export const P_POINT: Pose = { lean: 0.02, head: 0.05, la: -0.12, lf: -0.06, ra: 1.9, rf: 2.1, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };
export const P_SCRATCH: Pose = { lean: -0.04, head: -0.12, la: -0.12, lf: -0.06, ra: 2.5, rf: -2.6, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };
export const P_HOLD: Pose = { lean: 0, head: -0.25, la: -2.55, lf: -3.05, ra: 2.55, rf: 3.05, ll: -0.1, lk: -0.06, rl: 0.1, rk: 0.06 };
export const P_HANDS: Pose = { lean: 0, head: 0, la: -0.55, lf: -0.5, ra: 0.55, rf: 0.5, ll: -0.07, lk: -0.04, rl: 0.07, rk: 0.04 };

const D = (a: number): [number, number] => [Math.sin(a), Math.cos(a)];

/** a person standing on (x, y) — y is the ground — h tall. Humans are solid; AIs are drawn as an outline with a light in the head. */
export function figure(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, p: Pose, look: Look = {}, o: FigOpt = {}) {
  const a = o.a ?? 1;
  if (a <= 0.003 || h < 2) return;
  const b = look.build ?? 1;
  const c = look.child ?? 0;
  const legL = lerp(0.235, 0.205, c) * h, armU = lerp(0.17, 0.15, c) * h, armF = lerp(0.155, 0.14, c) * h, torso = lerp(0.3, 0.26, c) * h;
  const hr = lerp(0.066, 0.095, c) * h;
  const hip: [number, number] = [x, y - 2 * legL * Math.cos(0.05) - (p.drop ?? 0) * h];
  const sh: [number, number] = [hip[0] + Math.sin(p.lean) * torso, hip[1] - Math.cos(p.lean) * torso];
  const hd: [number, number] = [sh[0] + Math.sin(p.lean + p.head) * (hr + 0.06 * h), sh[1] - Math.cos(p.lean + p.head) * (hr + 0.06 * h)];
  const sw = 0.078 * h * b;
  const ls: [number, number] = [sh[0] - sw * Math.cos(p.lean), sh[1] + 0.02 * h - sw * Math.sin(p.lean)];
  const rs: [number, number] = [sh[0] + sw * Math.cos(p.lean), sh[1] + 0.02 * h + sw * Math.sin(p.lean)];
  const lh: [number, number] = [hip[0] - 0.045 * h * b, hip[1]];
  const rh: [number, number] = [hip[0] + 0.045 * h * b, hip[1]];
  const seg = (s: [number, number], ang: number, len: number): [number, number] => [s[0] + D(ang)[0] * len, s[1] + D(ang)[1] * len];
  const le = seg(ls, p.la, armU), lw = seg(le, p.lf, armF);
  const re = seg(rs, p.ra, armU), rw = seg(re, p.rf, armF);
  const lk = seg(lh, p.ll, legL), lf = seg(lk, p.lk, legL);
  const rk = seg(rh, p.rl, legL), rf = seg(rk, p.rk, legL);
  const col = o.color ?? "240,243,250";
  const limbs: [[number, number], [number, number], number][] = [
    [lh, lk, 0.07], [lk, lf, 0.062], [rh, rk, 0.07], [rk, rf, 0.062],
    [[hip[0], hip[1] - 0.04 * h], [sh[0], sh[1] + 0.05 * h], 0.165 * b],
    [ls, le, 0.058], [le, lw, 0.052], [rs, re, 0.058], [re, rw, 0.052],
  ];
  const ol = Math.min(4.5, Math.max(1.1, 0.0065 * h));
  const draw = (pass: number) => {
    const grow = pass === 0 ? 0 : -2 * ol;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const [s, e, wd] of limbs) {
      ctx.lineWidth = Math.max(0.5, wd * h + grow);
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(e[0], e[1]);
      ctx.stroke();
    }
    // shoulders
    ctx.lineWidth = Math.max(0.5, 0.075 * h + grow);
    ctx.beginPath();
    ctx.moveTo(ls[0], ls[1]);
    ctx.lineTo(rs[0], rs[1]);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hd[0], hd[1], Math.max(0.5, hr + grow / 2), 0, Math.PI * 2);
    ctx.fill();
    if (look.skirt) {
      const k = 0.2 * h + grow / 2;
      ctx.beginPath();
      ctx.moveTo(hip[0] - 0.07 * h, hip[1] - 0.05 * h);
      ctx.lineTo(hip[0] + 0.07 * h, hip[1] - 0.05 * h);
      ctx.lineTo(hip[0] + k * 0.75, hip[1] + k);
      ctx.lineTo(hip[0] - k * 0.75, hip[1] + k);
      ctx.closePath();
      ctx.fill();
    }
    if (look.hair === 1) {
      ctx.beginPath();
      ctx.arc(hd[0] - hr * 0.95, hd[1] + hr * 0.15, Math.max(0.5, hr * 0.5 + grow / 3), 0, Math.PI * 2);
      ctx.fill();
    } else if (look.hair === 2) {
      ctx.beginPath();
      ctx.ellipse(hd[0], hd[1] + hr * 0.55, Math.max(0.5, hr * 1.12 + grow / 3), Math.max(0.5, hr * 1.2 + grow / 3), 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (look.hair === 3) {
      ctx.beginPath();
      ctx.arc(hd[0], hd[1] - hr * 1.05, Math.max(0.5, hr * 0.45 + grow / 3), 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.hat) {
      ctx.fillRect(hd[0] - hr * 1.6, hd[1] - hr * 0.75, hr * 3.2, Math.max(0.5, hr * 0.28 + grow / 4));
      ctx.fillRect(hd[0] - hr * 0.95, hd[1] - hr * 1.75, hr * 1.9, Math.max(0.5, hr * 1.05 + grow / 4));
    }
    if (look.bag) {
      ctx.fillRect(rw[0] - 0.05 * h, rw[1], 0.1 * h + grow / 2, 0.08 * h + grow / 2);
    }
    if (look.tie) {
      ctx.lineWidth = Math.max(0.5, 0.03 * h + grow / 2);
      ctx.beginPath();
      ctx.moveTo(sh[0], sh[1] + 0.03 * h);
      ctx.lineTo(sh[0] + Math.sin(p.lean) * -0.14 * h, sh[1] + 0.17 * h);
      ctx.stroke();
    }
    if (look.pack) {
      ctx.beginPath();
      ctx.ellipse(sh[0] - 0.1 * h, sh[1] + 0.12 * h, Math.max(0.5, 0.06 * h + grow / 2), Math.max(0.5, 0.1 * h + grow / 2), 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    if (look.cane) {
      ctx.lineWidth = Math.max(0.5, 0.025 * h + grow / 3);
      ctx.beginPath();
      ctx.moveTo(rw[0], rw[1]);
      ctx.lineTo(rw[0] + 0.04 * h, y);
      ctx.stroke();
    }
  };
  ctx.save();
  // solid figures fade by colour, not by transparency, so overlapping limbs never show their seams
  let rgb = col;
  if (!o.ai && a < 1) rgb = col.split(",").map((v) => Math.round(3 + (Number(v) - 3) * a)).join(",");
  else ctx.globalAlpha *= a;
  ctx.strokeStyle = ctx.fillStyle = `rgb(${rgb})`;
  draw(0);
  if (o.ai && h >= 90) {
    // hollow body: the inside cut back to the background, the joints left as seams
    ctx.strokeStyle = ctx.fillStyle = o.bg ?? "#030304";
    draw(1);
    ctx.globalCompositeOperation = "lighter";
    const k = o.core ?? 1;
    glow(ctx, hd[0], hd[1], hr * 2.6, 0.55 * k);
    glow(ctx, hd[0], hd[1], hr * 0.7, 1 * k);
    glow(ctx, sh[0], sh[1] + 0.1 * h, 0.05 * h, 0.45 * k);
  } else if (o.ai) {
    ctx.globalCompositeOperation = "lighter";
    glow(ctx, hd[0], hd[1], hr * 3.2, 0.7 * (o.core ?? 1));
  }
  ctx.restore();
  return { hd, hr, lw, rw, sh, hip };
}

// ------------------------------------------------------------------ icons: thin-line symbols, centred on (x, y), size s
export type Icon = "gear" | "note" | "heart" | "atom" | "star" | "rocket" | "book" | "bulb" | "leaf" | "question" | "infinity" | "brush" | "planet" | "music";
export function icon(ctx: CanvasRenderingContext2D, k: Icon | string, x: number, y: number, s: number, a = 1, lw = 2) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, y);
  ctx.strokeStyle = ctx.fillStyle = "rgb(242,245,252)";
  ctx.lineWidth = lw;
  ctx.lineCap = ctx.lineJoin = "round";
  const r = s / 2;
  ctx.beginPath();
  switch (k) {
    case "gear": {
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * Math.PI * 2;
        const rr = r * (0.78 + 0.22 * (Math.cos(t * 8) > 0.2 ? 1 : 0));
        i ? ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) : ctx.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
      }
      ctx.closePath();
      ctx.moveTo(r * 0.3, 0);
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      break;
    }
    case "note":
    case "music":
      ctx.ellipse(-r * 0.35, r * 0.55, r * 0.3, r * 0.22, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.08, r * 0.5);
      ctx.lineTo(-r * 0.08, -r * 0.8);
      ctx.lineTo(r * 0.55, -r * 0.55);
      break;
    case "heart":
      ctx.moveTo(0, r * 0.75);
      ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.55, -r * 1.05, 0, -r * 0.4);
      ctx.bezierCurveTo(r * 0.55, -r * 1.05, r * 1.3, -r * 0.1, 0, r * 0.75);
      break;
    case "atom":
      for (const ang of [0, Math.PI / 3, -Math.PI / 3]) {
        ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.ellipse(0, 0, r, r * 0.36, ang, 0, Math.PI * 2);
      }
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      break;
    case "star":
      for (let i = 0; i <= 10; i++) {
        const t = -Math.PI / 2 + (i / 10) * Math.PI * 2;
        const rr = i % 2 ? r * 0.42 : r;
        i ? ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr) : ctx.moveTo(Math.cos(t) * rr, Math.sin(t) * rr);
      }
      ctx.closePath();
      break;
    case "rocket":
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(r * 0.45, -r * 0.5, r * 0.3, r * 0.45);
      ctx.lineTo(-r * 0.3, r * 0.45);
      ctx.quadraticCurveTo(-r * 0.45, -r * 0.5, 0, -r);
      ctx.moveTo(r * 0.3, r * 0.15);
      ctx.lineTo(r * 0.55, r * 0.7);
      ctx.lineTo(r * 0.28, r * 0.5);
      ctx.moveTo(-r * 0.3, r * 0.15);
      ctx.lineTo(-r * 0.55, r * 0.7);
      ctx.lineTo(-r * 0.28, r * 0.5);
      ctx.moveTo(r * 0.12, -r * 0.25);
      ctx.arc(0, -r * 0.25, r * 0.12, 0, Math.PI * 2);
      break;
    case "book":
      ctx.moveTo(0, -r * 0.55);
      ctx.quadraticCurveTo(-r * 0.5, -r * 0.8, -r, -r * 0.55);
      ctx.lineTo(-r, r * 0.65);
      ctx.quadraticCurveTo(-r * 0.5, r * 0.4, 0, r * 0.65);
      ctx.quadraticCurveTo(r * 0.5, r * 0.4, r, r * 0.65);
      ctx.lineTo(r, -r * 0.55);
      ctx.quadraticCurveTo(r * 0.5, -r * 0.8, 0, -r * 0.55);
      ctx.lineTo(0, r * 0.65);
      break;
    case "bulb":
      ctx.arc(0, -r * 0.2, r * 0.62, Math.PI * 0.78, Math.PI * 2.22);
      ctx.lineTo(r * 0.25, r * 0.55);
      ctx.lineTo(-r * 0.25, r * 0.55);
      ctx.closePath();
      ctx.moveTo(-r * 0.22, r * 0.75);
      ctx.lineTo(r * 0.22, r * 0.75);
      ctx.moveTo(-r * 0.15, r * 0.92);
      ctx.lineTo(r * 0.15, r * 0.92);
      break;
    case "leaf":
      ctx.moveTo(-r * 0.8, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.9, -r * 0.9, r * 0.85, -r * 0.85);
      ctx.quadraticCurveTo(r * 0.9, r * 0.9, -r * 0.8, r * 0.8);
      ctx.moveTo(-r * 0.8, r * 0.8);
      ctx.lineTo(r * 0.3, -r * 0.3);
      break;
    case "question":
      ctx.arc(0, -r * 0.35, r * 0.45, Math.PI * 1.1, Math.PI * 2.35);
      ctx.quadraticCurveTo(0, r * 0.05, 0, r * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, r * 0.75, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      break;
    case "infinity":
      for (let i = 0; i <= 60; i++) {
        const t = (i / 60) * Math.PI * 2;
        const d = 1 + Math.sin(t) ** 2;
        const px = (r * Math.cos(t)) / d, py = (r * Math.sin(t) * Math.cos(t)) / d;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      break;
    case "brush":
      ctx.moveTo(r * 0.8, -r * 0.8);
      ctx.lineTo(-r * 0.1, r * 0.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, r * 0.4, r * 0.32, r * 0.2, -0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      break;
    case "planet":
      ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      ctx.moveTo(r, 0);
      ctx.ellipse(0, 0, r, r * 0.28, -0.35, 0, Math.PI * 2);
      break;
  }
  ctx.stroke();
  ctx.restore();
}

/** a thought bubble rising from a head: three dots and a round cloud, with an icon inside */
export function thought(ctx: CanvasRenderingContext2D, hx: number, hy: number, cx: number, cy: number, r: number, a: number, k?: string, ka = 1) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = "rgba(240,243,250,0.85)";
  ctx.lineWidth = Math.max(1.2, r * 0.035);
  for (let i = 1; i <= 3; i++) {
    const u = i / 4;
    ctx.beginPath();
    ctx.arc(lerp(hx, cx, u * 0.8), lerp(hy, cy + r * 0.8, u * 0.9), r * (0.04 + 0.04 * i), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const rr = r * (1 + 0.07 * Math.cos(t * 7));
    i ? ctx.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.8) : ctx.moveTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.8);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(3,3,4,0.85)";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (k) icon(ctx, k, cx, cy, r * 1.0, a * ka, Math.max(1.5, r * 0.05));
}

/** a speech bubble with a tail towards (tx, ty) and a few lines of "text" */
export function speech(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tx: number, ty: number, a: number, k?: string) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.strokeStyle = "rgba(240,243,250,0.9)";
  ctx.fillStyle = "rgba(3,3,4,0.85)";
  ctx.lineWidth = 2;
  const rr = Math.min(w, h) * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 + rr, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, rr);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, rr);
  const bx = clamp01((tx - (x - w / 2)) / w) * w + x - w / 2;
  ctx.lineTo(Math.min(x + w / 2 - rr, Math.max(x - w / 2 + rr, bx + 12)), y + h / 2);
  ctx.lineTo(tx, ty);
  ctx.lineTo(Math.min(x + w / 2 - rr, Math.max(x - w / 2 + rr, bx - 12)), y + h / 2);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, rr);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, rr);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  if (k) icon(ctx, k, x, y, h * 0.6, a, 2);
  else {
    ctx.save();
    ctx.globalAlpha *= a * 0.7;
    ctx.fillStyle = "rgb(240,243,250)";
    for (let i = 0; i < 2; i++) ctx.fillRect(x - w * 0.32, y - h * 0.18 + i * h * 0.3, w * (i ? 0.4 : 0.64), Math.max(2, h * 0.09));
    ctx.restore();
  }
}
