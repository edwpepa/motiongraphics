import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, ease, lerp, seeded } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { AText, Cam, outExpo, r01 } from "../apple";
import { B8, B1 } from "../act2";
import { Explosion } from "../fx";
import { Logo, Win } from "../kit";
import { B1_END, B2_END, B3_END, B4_END, B5_END, B6_END, B7_END } from "../scenes";
import { BRIDGE, DROP, F, w } from "../timeline";
import { W2 } from "./act1";
import { C, Dust, Grade, Halftone, Head, MiniFace, SpeedLines, ToonSocket } from "./kit";

const INK = "#1d1d1f";
const WHITE = "#f6f3ee";
const GREEN_TXT = "#00a852";
const D0 = F(DROP);
const card: React.CSSProperties = { position: "absolute", borderRadius: 34, background: "rgba(255,255,255,0.97)", boxShadow: "0 30px 70px rgba(20,50,35,0.22), 0 0 0 1.5px rgba(0,0,0,0.04)", fontFamily: FONT, color: INK, overflow: "hidden" };
const pill = (bg: string, fg: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 999, background: bg, color: fg, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" });
const Check: React.FC<{ size: number; color?: string; bg?: string }> = ({ size, color = "#fff", bg = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={12} fill={bg} />
    <path d="M7 12.4l3.2 3.1L17 8.8" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
/** card fly-in: rises out of blur */
const rise = (f: number, at: number, d = 16) => {
  const p = outExpo(clamp01((f - at) / d));
  return { opacity: clamp01(p * 1.6), transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined } as React.CSSProperties;
};
/** a bright daytime room: soft wall, window light falling across it */
const DayWall: React.FC<{ tint?: string; f: number }> = ({ tint = "#eef2ea", f }) => (
  <>
    <AbsoluteFill style={{ background: `linear-gradient(115deg, #ffffff 0%, ${tint} 45%, #d9e2d8 100%)` }} />
    <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(255,246,220,0) 10%, rgba(255,246,220,0.75) 22%, rgba(255,246,220,0) 34%, rgba(255,246,220,0) 42%, rgba(255,246,220,0.6) 52%, rgba(255,246,220,0) 62%)", transform: `translateX(${Math.sin(f / 60) * 20}px)` }} />
  </>
);

// ------------------------------------------------------------------ U2: he photographs the socket; the request lifts off the phone — posted in 0:52
export const U2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B1_END;
  const snap = w("postezi", 2) - 1;
  const flash = f >= snap ? clamp01(1 - (f - snap) / 9) : 0;
  const lift = outExpo(clamp01((f - snap - 3) / 20));
  const t0 = snap + 6, t1 = w("postezi", 9);
  const secs = Math.round(52 * r01(f, t0, t1, (t) => t));
  const done = ease.outBack(clamp01((f - t1) / 10));
  const L = W2("postezi");
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.06 - 0.05 * r01(fr, a0, B2_END, (t) => t), x: Math.sin(fr / 30) * 6, y: Math.cos(fr / 37) * 4 })}>
        <DayWall f={f} />
        <div style={{ position: "absolute", left: 1450, top: 520 }}>
          <ToonSocket size={300} broken={1} />
        </div>
        {/* Andrei, hopeful, phone up */}
        <div style={{ position: "absolute", left: 90, top: 300 }}>
          <Head width={620} l={{ side: 1, key: "#fff1d6", rim: "#ffffff", shade: 0.6 }} e={{ open: 0.95, brow: -0.1, mouth: "smile", gx: 12, gy: 2 }} f={f} />
        </div>
        <div style={{ position: "absolute", left: 720, top: 360, transform: "rotate(7deg)" }}>
          <div style={{ width: 230, height: 460, borderRadius: 40, background: "linear-gradient(160deg,#2c3238,#14181b)", border: `6px solid ${C.ink}`, position: "relative" }}>
            <div style={{ position: "absolute", left: 22, top: 22, width: 96, height: 96, borderRadius: 26, background: "#0c0e10", border: "3px solid #3a4046" }}>
              <div style={{ position: "absolute", left: 12, top: 12, width: 30, height: 30, borderRadius: "50%", background: "#1b2a33", border: "3px solid #4a5560" }} />
              <div style={{ position: "absolute", left: 50, top: 50, width: 30, height: 30, borderRadius: "50%", background: "#1b2a33", border: "3px solid #4a5560" }} />
              <div style={{ position: "absolute", left: 56, top: 14, width: 16, height: 16, borderRadius: "50%", background: `rgba(255,250,230,${0.4 + 0.6 * flash})`, boxShadow: `0 0 ${80 * flash}px ${40 * flash}px rgba(255,250,230,${flash})` }} />
            </div>
          </div>
          {/* his fingers round the edges */}
          {[120, 200, 280].map((y, i) => (
            <div key={i} style={{ position: "absolute", left: 206, top: y, width: 50, height: 46, borderRadius: 24, background: C.skin, border: `5px solid ${C.ink}` }} />
          ))}
          <div style={{ position: "absolute", left: -26, top: 300, width: 60, height: 120, borderRadius: 30, background: C.skin, border: `5px solid ${C.ink}` }} />
        </div>
        {/* the request card lifts off the phone */}
        {f >= snap + 3 && (
          <div style={{ ...card, left: lerp(760, 980, lift), top: lerp(420, 130, lift), width: 520, padding: 26, boxSizing: "border-box", opacity: clamp01(lift * 2), transform: `scale(${lerp(0.4, 1, lift)}) rotate(${lerp(7, 0, lift)}deg)`, transformOrigin: "0% 0%" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 120, height: 120, borderRadius: 24, background: "#eef1ec", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <ToonSocket size={96} broken={1} />
              </div>
              <div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}>Priză stricată</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#7c837f", marginTop: 6 }}>Electrice · Azi, 18:00</div>
              </div>
            </div>
            <div style={{ marginTop: 22, height: 10, borderRadius: 5, background: "#e8ece9", overflow: "hidden" }}>
              <div style={{ width: `${100 * r01(f, t0, t1, (t) => t)}%`, height: "100%", background: C.green, borderRadius: 5 }} />
            </div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 22, color: "#7c837f", fontWeight: 600 }}>{done > 0 ? "Cererea ta e live" : "Se postează…"}</div>
              <div style={{ ...pill(done > 0 ? C.green : "#eef1ec", done > 0 ? "#fff" : INK), transform: `scale(${done > 0 ? 0.8 + 0.2 * done : 1})` }}>
                {done > 0 && <Check size={22} bg="#fff" color={C.green} />}
                {done > 0 ? "Postat" : `0:${String(secs).padStart(2, "0")}`}
              </div>
            </div>
          </div>
        )}
      </Cam>
      <AbsoluteFill style={{ background: `rgba(255,255,250,${0.85 * flash * flash})` }} />
      <AText words={L.slice(0, 4)} size={76} x={880} y={860} align="left" color={INK} />
      <AText words={L.slice(4)} size={76} x={880} y={948} align="left" color={INK} hi={{ 4: GREEN_TXT, 5: GREEN_TXT }} />
      <Grade vignette={0.22} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ U3: over the blocks at sunset, three roofs light up green; then three taskers, lit by the notification
const ISO = 64;
const P3 = (x: number, y: number, z: number) => [960 + (x - y) * ISO * 0.866, 120 + (x + y) * ISO * 0.5 - z] as const;
const poly = (pts: ReadonlyArray<readonly [number, number] | readonly number[]>) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const BLOCKS = (() => {
  const out: { x: number; y: number; a: number; b: number; h: number; k: number }[] = [];
  let k = 0;
  for (let gx = 0; gx < 8; gx++)
    for (let gy = 0; gy < 8; gy++) {
      const r = seeded(k, 3);
      const long = r > 0.5;
      out.push({ x: gx * 2.3 - 2 + seeded(k, 4) * 0.2, y: gy * 2.3 - 3 + seeded(k, 5) * 0.2, a: long ? 1.8 : 0.8, b: long ? 0.7 : 0.8, h: 70 + seeded(k, 6) * 150, k });
      k++;
    }
  return out.sort((p, q) => p.x + p.y - (q.x + q.y));
})();
const PINS = [10, 27, 44];
const IsoCity: React.FC<{ f: number; pinAt: number[] }> = ({ f, pinAt }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <Halftone id="isoHt" color="#0b2430" opacity={0.35} />
    </defs>
    {/* ground and streets */}
    <polygon points={poly([P3(-4, -5, 0), P3(18, -5, 0), P3(18, 17, 0), P3(-4, 17, 0)])} fill="#3c4a4c" />
    {Array.from({ length: 9 }, (_, i) => (
      <g key={i}>
        <line x1={P3(-4, i * 2.3 - 3.55, 0)[0]} y1={P3(-4, i * 2.3 - 3.55, 0)[1]} x2={P3(18, i * 2.3 - 3.55, 0)[0]} y2={P3(18, i * 2.3 - 3.55, 0)[1]} stroke="#26302f" strokeWidth={22} />
        <line x1={P3(i * 2.3 - 2.55, -5, 0)[0]} y1={P3(i * 2.3 - 2.55, -5, 0)[1]} x2={P3(i * 2.3 - 2.55, 17, 0)[0]} y2={P3(i * 2.3 - 2.55, 17, 0)[1]} stroke="#26302f" strokeWidth={22} />
      </g>
    ))}
    {BLOCKS.map((b) => {
      const { x, y, a, h } = b;
      const bb = b.b;
      const top = [P3(x, y, h), P3(x + a, y, h), P3(x + a, y + bb, h), P3(x, y + bb, h)];
      const fx = [P3(x + a, y, 0), P3(x + a, y + bb, 0), P3(x + a, y + bb, h), P3(x + a, y, h)];
      const fy = [P3(x, y + bb, 0), P3(x + a, y + bb, 0), P3(x + a, y + bb, h), P3(x, y + bb, h)];
      const floors = Math.floor(h / 16);
      const pin = PINS.indexOf(b.k);
      const lit = pin >= 0 ? clamp01((f - pinAt[pin]) / 8) : 0;
      return (
        <g key={b.k}>
          <polygon points={poly(fy)} fill="#25495a" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <polygon points={poly(fy)} fill="url(#isoHt)" />
          <polygon points={poly(fx)} fill="#e88a52" stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          <polygon points={poly(top)} fill={lit > 0 ? `rgb(${lerp(206, 93, lit)},${lerp(160, 240, lit)},${lerp(120, 165, lit)})` : "#cfa07a"} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
          {Array.from({ length: floors }, (_, j) => {
            const z = 12 + j * 16;
            const p1 = P3(x + 0.08, y + bb, z), p2 = P3(x + a - 0.08, y + bb, z);
            const q1 = P3(x + a, y + 0.08, z), q2 = P3(x + a, y + bb - 0.08, z);
            return (
              <g key={j}>
                <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={seeded(b.k * 30 + j, 8) > 0.6 ? "#ffd38a" : "#3f6878"} strokeWidth={5} strokeDasharray="7 9" />
                <line x1={q1[0]} y1={q1[1]} x2={q2[0]} y2={q2[1]} stroke="#b9653a" strokeWidth={5} strokeDasharray="7 9" />
              </g>
            );
          })}
        </g>
      );
    })}
    {/* the pings */}
    {PINS.map((k, i) => {
      const b = BLOCKS.find((q) => q.k === k)!;
      const [cx, cy] = P3(b.x + b.a / 2, b.y + b.b / 2, b.h);
      const t = f - pinAt[i];
      if (t < 0) return null;
      return (
        <g key={k}>
          {[0, 1, 2].map((r) => {
            const q = ((t + r * 12) % 36) / 36;
            return <ellipse key={r} cx={cx} cy={cy} rx={30 + 140 * q} ry={(30 + 140 * q) * 0.5} fill="none" stroke={C.greenLight} strokeWidth={4} opacity={(1 - q) * 0.9} />;
          })}
          <line x1={cx} y1={cy} x2={cx} y2={cy - 80 * clamp01(t / 8)} stroke={C.greenLight} strokeWidth={4} />
        </g>
      );
    })}
  </svg>
);
const PIN_FACES: Array<{ who: "mihai" | "andrei"; filter?: string; mirror?: boolean; name: string; price: string; bg: string; glow: string }> = [
  { who: "andrei", filter: "saturate(0.85) brightness(0.94)", name: "Radu S.", price: "170 lei", bg: "linear-gradient(180deg,#3b2a1e,#1b130d)", glow: "#ffb565" },
  { who: "mihai", name: "Mihai D.", price: "150 lei", bg: "linear-gradient(180deg,#1f3346,#0c1620)", glow: "#7fc8ff" },
  { who: "mihai", filter: "hue-rotate(-14deg) brightness(1.06)", mirror: true, name: "Vlad P.", price: "160 lei", bg: "linear-gradient(180deg,#24403a,#0d1a17)", glow: "#a0e8c8" },
];
export const U3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B2_END;
  const cut = w("taskeri", 5) - 5;
  const L = W2("taskeri");
  const pinAt = [w("taskeri", 1) - 4, w("taskeri", 1) + 2, w("taskeri", 1) + 8];
  if (f < cut) {
    return (
      <AbsoluteFill style={{ background: "linear-gradient(180deg,#f6a86a,#c46a4a)", overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1.18 - 0.1 * r01(fr, a0, cut, (t) => t), x: lerp(60, -60, r01(fr, a0, cut, (t) => t)), y: lerp(-120, -60, r01(fr, a0, cut, (t) => t)), r: lerp(-3, 1, r01(fr, a0, cut, (t) => t)) })} blur={0.6}>
          <IsoCity f={f} pinAt={pinAt} />
          {/* the pins with faces */}
          {PINS.map((k, i) => {
            const b = BLOCKS.find((q) => q.k === k)!;
            const [cx, cy] = P3(b.x + b.a / 2, b.y + b.b / 2, b.h);
            const p = ease.outBack(clamp01((f - pinAt[i] - 4) / 12));
            if (p <= 0) return null;
            return (
              <div key={k} style={{ position: "absolute", left: cx - 52, top: cy - 80 - 120, transform: `scale(${p})`, transformOrigin: "50% 100%" }}>
                <div style={{ padding: 6, borderRadius: "50%", background: "#fff", boxShadow: `0 0 40px ${C.greenLight}` }}>
                  <MiniFace who={PIN_FACES[i].who} size={92} filter={PIN_FACES[i].filter} bg="#d4efe0" />
                </div>
                <div style={{ position: "absolute", right: -4, bottom: 2 }}>
                  <Check size={34} />
                </div>
              </div>
            );
          })}
        </Cam>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at 70% 10%, rgba(255,210,150,0.45), rgba(0,0,0,0) 60%)", mixBlendMode: "screen" }} />
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 38%)" }} />
        <AText words={L.slice(0, 2)} size={84} x={120} y={150} align="left" color={WHITE} hi={{ 1: C.greenLight }} />
        <AText words={L.slice(2, 5)} size={84} x={120} y={248} align="left" color={WHITE} />
        <Grade vignette={0.4} warm={0.5} />
      </AbsoluteFill>
    );
  }
  // three taskers, three places, the same green light on their faces
  const at = [cut + 1, w("taskeri", 6) - 4, w("taskeri", 7) - 4];
  return (
    <AbsoluteFill style={{ background: "#060b09" }}>
      {PIN_FACES.map((p, i) => {
        const e = outExpo(clamp01((f - at[i]) / 14));
        const chip = ease.outBack(clamp01((f - at[i] - 8) / 12));
        return (
          <div key={i} style={{ position: "absolute", left: i * 640 + 6, top: 0, width: 628, height: 1080, overflow: "hidden", background: p.bg, transform: `translateY(${(1 - e) * 1080}px)` }}>
            {Array.from({ length: 8 }, (_, k) => (
              <div key={k} style={{ position: "absolute", left: seeded(k + i * 9, 1) * 600, top: 80 + seeded(k + i * 9, 2) * 500, width: 50 + seeded(k, 3) * 80, height: 50 + seeded(k, 3) * 80, borderRadius: "50%", background: p.glow, opacity: 0.14, filter: "blur(10px)" }} />
            ))}
            <div style={{ position: "absolute", left: 314 - 270, top: 330 + Math.sin(f / 18 + i) * 4, transform: p.mirror ? "scaleX(-1)" : undefined, filter: p.filter }}>
              <Head who={p.who} width={540} l={{ side: i === 0 ? 1 : -1, key: p.glow, rim: p.glow, under: C.greenLight, underAmt: 1, shade: 0.85 }} e={{ open: 0.9, gy: 10, mouth: "smile", brow: -0.1 }} f={f} />
            </div>
            <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 30% at 50% 100%, rgba(93,240,165,${0.55 * e}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
            <div style={{ position: "absolute", left: 314, top: 860, transform: `translateX(-50%) scale(${chip})`, opacity: clamp01(chip * 2) }}>
              <div style={{ ...card, position: "relative", display: "flex", alignItems: "center", gap: 16, padding: "18px 26px", borderRadius: 999, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{p.name}</span>
                <Check size={28} />
                <span style={{ fontSize: 28, fontWeight: 700, color: GREEN_TXT }}>{p.price}</span>
              </div>
            </div>
          </div>
        );
      })}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%)" }} />
      <AText words={L.slice(5)} size={84} y={130} color={WHITE} hi={{ 2: C.greenLight }} />
      <Grade vignette={0.45} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ U4: on the couch, smiling at his phone: he picks Mihai, they talk, he pays — a shield closes over it
const PICK = [
  { who: "andrei" as const, filter: "saturate(0.85) brightness(0.94)", name: "Radu S.", r: "4.8" },
  { who: "mihai" as const, filter: undefined, name: "Mihai D.", r: "4.9" },
  { who: "mihai" as const, filter: "hue-rotate(-14deg) brightness(1.06)", name: "Vlad P.", r: "5.0" },
];
const Bub: React.FC<{ t: string; me?: boolean; at: number; f: number }> = ({ t, me, at, f }) => {
  const p = ease.outBack(clamp01((f - at) / 10));
  if (p <= 0) return null;
  return (
    <div style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: 380, padding: "16px 22px", borderRadius: 26, borderBottomRightRadius: me ? 8 : 26, borderBottomLeftRadius: me ? 26 : 8, background: me ? C.green : "#eef2ef", color: me ? "#fff" : INK, fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", transform: `scale(${p})`, transformOrigin: me ? "100% 100%" : "0% 100%" }}>{t}</div>
  );
};
export const U4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B3_END;
  const sel = w("alegi", 3);
  const s2 = w("alegi", 5) - 4;
  const s3 = w("alegi", 11) - 4;
  const L = W2("alegi");
  const shield = ease.outBack(clamp01((f - s3 - 10) / 14));
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.04 - 0.04 * r01(fr, a0, B4_END, (t) => t), x: lerp(20, -20, r01(fr, a0, B4_END, (t) => t)), y: 0 })}>
        <DayWall f={f} tint="#e6efe8" />
        {/* the window behind him, a plant, the couch */}
        <div style={{ position: "absolute", left: 1000, top: 60, width: 760, height: 620, borderRadius: 18, background: "linear-gradient(180deg,#bfe3f5,#e9f6ee)", border: `10px solid ${C.ink}`, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 370, top: 0, width: 10, height: 620, background: C.ink }} />
          <div style={{ position: "absolute", left: -40, top: 380, width: 900, height: 300, background: "#9fcf9a", borderRadius: "50% 50% 0 0" }} />
          <div style={{ position: "absolute", left: 160, top: 290, width: 180, height: 140, background: "#e8d2b0", border: `6px solid ${C.ink}` }} />
        </div>
        <svg width={260} height={420} viewBox="0 0 260 420" style={{ position: "absolute", left: 1700, top: 420 }}>
          {[[-30, 90], [10, 40], [40, 100], [-60, 140], [70, 160]].map(([r, l], i) => (
            <ellipse key={i} cx={130} cy={260 - l} rx={34} ry={l} transform={`rotate(${r + Math.sin(f / 30 + i) * 3} 130 260)`} fill={i % 2 ? "#3e8a4a" : "#56a85c"} stroke={C.ink} strokeWidth={6} />
          ))}
          <path d="M70 260 L190 260 L176 410 L84 410 Z" fill="#d07a4a" stroke={C.ink} strokeWidth={7} />
        </svg>
        <div style={{ position: "absolute", left: 880, top: 640, width: 1100, height: 500, borderRadius: 80, background: "linear-gradient(180deg,#5d7194,#46587a)", border: `10px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 1040, top: 300 }}>
          <Head width={640} l={{ side: -1, key: "#fff1d6", rim: "#ffffff", under: C.greenLight, underAmt: 0.7, shade: 0.6 }} e={{ open: 0.75, gy: 12, gx: -8, mouth: "smile", brow: -0.1 }} f={f} />
        </div>
        <div style={{ position: "absolute", left: 1180, top: 880, transform: "rotate(-10deg)" }}>
          <div style={{ width: 230, height: 300, borderRadius: 36, background: "linear-gradient(160deg,#2c3238,#14181b)", border: `6px solid ${C.ink}`, boxShadow: `0 -30px 80px rgba(93,240,165,0.35)` }} />
          <div style={{ position: "absolute", left: -30, top: 90, width: 70, height: 140, borderRadius: 34, background: C.skin, border: `5px solid ${C.ink}` }} />
          <div style={{ position: "absolute", left: 200, top: 70, width: 70, height: 140, borderRadius: 34, background: C.skin, border: `5px solid ${C.ink}` }} />
        </div>
      </Cam>
      {/* phase 1: three profiles, the middle one is picked */}
      {f < s2 + 4 &&
        PICK.map((p, i) => {
          const chosen = i === 1;
          const pk = ease.outBack(clamp01((f - sel) / 12));
          const away = chosen ? 0 : ease.inOutCubic(clamp01((f - sel) / 12));
          const toChat = ease.inOutCubic(clamp01((f - s2 + 6) / 10));
          return (
            <div key={i} style={{ ...card, left: 120 + i * 270 + (i - 1) * 200 * away, top: 220 + Math.abs(i - 1) * 40, width: 250, height: 330, ...rise(f, a0 + 2 + i * 3), opacity: (1 - away) * (1 - toChat) * clamp01((f - a0 - 2 - i * 3) / 6), display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 34, gap: 12, boxSizing: "border-box", boxShadow: chosen && pk > 0 ? `0 0 0 ${6 * pk}px ${C.green}, 0 30px 70px rgba(20,50,35,0.22)` : card.boxShadow }}>
              <MiniFace who={p.who} size={120} filter={p.filter} />
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>{p.name}</div>
              <div style={{ fontSize: 24, color: "#6d7672", fontWeight: 600 }}>★ {p.r}</div>
              {chosen && pk > 0 && <div style={{ ...pill(C.green, "#fff"), transform: `scale(${pk})` }}>Ales</div>}
            </div>
          );
        })}
      {/* phase 2: the chat */}
      {f >= s2 - 2 && f < s3 + 8 && (
        <div style={{ ...card, left: 160, top: 170, width: 640, height: 470, padding: 26, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 14, ...rise(f, s2 - 2, 14), opacity: clamp01((f - s2 + 2) / 6) * (1 - clamp01((f - s3) / 8)) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 14, borderBottom: "1.5px solid #edf0ee" }}>
            <MiniFace who="mihai" size={64} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>Mihai D.</div>
              <div style={{ fontSize: 20, color: GREEN_TXT, fontWeight: 600 }}>online</div>
            </div>
          </div>
          <Bub t="Salut! Pot veni azi la 18." at={s2 + 6} f={f} />
          <Bub t="Perfect, te aștept!" me at={s2 + 18} f={f} />
          <Bub t="Îmi iau sculele, e rezolvat." at={s2 + 30} f={f} />
        </div>
      )}
      {/* phase 3: the payment, and the shield */}
      {f >= s3 && (
        <div style={{ position: "absolute", left: 160, top: 360, width: 640, ...rise(f, s3, 14) }}>
          <div style={{ ...card, position: "relative", padding: 30, boxSizing: "border-box" }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: "#8a8f8d" }}>PLATĂ</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>Priză stricată</div>
              <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.03em" }}>150 lei</div>
            </div>
            <div style={{ marginTop: 20, ...pill(shield > 0.5 ? C.green : "#eef1ec", shield > 0.5 ? "#fff" : INK) }}>
              {shield > 0.5 && <Check size={22} bg="#fff" color={C.green} />}
              {shield > 0.5 ? "Plată protejată" : "Se procesează…"}
            </div>
          </div>
          <svg width={200} height={230} viewBox="0 0 24 27" style={{ position: "absolute", left: 220, top: -270, transform: `scale(${shield}) rotate(${(1 - shield) * -30}deg)`, filter: "drop-shadow(0 20px 30px rgba(0,120,60,0.35))" }}>
            <path d="M12 1 L22 5 V12 C22 19 17 24 12 26 C7 24 2 19 2 12 V5 Z" fill={C.green} stroke={C.ink} strokeWidth={1.1} />
            <path d="M12 3 L20 6.3 V12" fill="none" stroke={C.greenLight} strokeWidth={1.2} />
            <rect x={7.6} y={12} width={8.8} height={7} rx={1.6} fill="#fff" />
            <path d="M9.4 12 V10 a2.6 2.6 0 0 1 5.2 0 V12" fill="none" stroke="#fff" strokeWidth={1.6} />
          </svg>
        </div>
      )}
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 26%)" }} />
      <AText words={L.slice(0, 5)} size={70} x={150} y={940} align="left" color={INK} out={s2 - 4} />
      <AText words={L.slice(5, 11)} size={70} x={150} y={940} align="left" color={INK} out={s3 - 4} hi={{ 3: GREEN_TXT, 4: GREEN_TXT, 5: GREEN_TXT }} />
      <AText words={L.slice(11)} size={70} x={150} y={940} align="left" color={INK} hi={{ 2: GREEN_TXT, 3: GREEN_TXT }} />
      <Grade vignette={0.2} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ U5: macro, slow motion — the banknotes on the table come apart into green light
const BILL_W = 620, BILL_H = 300, GX = 18, GY = 9;
const Bill: React.FC<{ v: string; c: string }> = ({ v, c }) => (
  <g>
    <rect x={0} y={0} width={BILL_W} height={BILL_H} rx={18} fill={c} stroke={C.ink} strokeWidth={8} />
    <rect x={24} y={24} width={BILL_W - 48} height={BILL_H - 48} rx={10} fill="none" stroke="rgba(20,60,35,0.45)" strokeWidth={4} />
    <circle cx={470} cy={150} r={86} fill="rgba(255,255,255,0.28)" stroke="rgba(20,60,35,0.4)" strokeWidth={4} />
    <text x={52} y={128} fontFamily={FONT} fontWeight={700} fontSize={96} fill="#163a24" letterSpacing="-4">{v}</text>
    <text x={58} y={240} fontFamily={FONT} fontWeight={700} fontSize={34} fill="#163a24" letterSpacing="8">LEI</text>
    <path d="M0 200 L620 120 L620 300 L0 300 Z" fill="rgba(10,40,20,0.12)" />
  </g>
);
export const U5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B4_END;
  const dis = w("cash", 3) - 6;
  const L = W2("cash");
  const cell = (i: number) => {
    const cx = i % GX, cy = Math.floor(i / GX);
    const delay = cx * 1.6 + seeded(i, 1) * 8;
    return { cx, cy, t: clamp01((f - dis - delay) / 26) };
  };
  return (
    <AbsoluteFill style={{ background: "#120c08", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.2 + 0.14 * r01(fr, a0, B5_END, (t) => t), x: 0, y: -30, r: lerp(-2, 1, r01(fr, a0, B5_END, (t) => t)) })}>
        <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(8deg, #5a3a24 0 120px, #4f331f 120px 124px, #5e3e27 124px 230px, #4a2f1c 230px 234px)" }} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 45% at 50% 52%, rgba(255,200,140,0.35), rgba(0,0,0,0) 70%)", mixBlendMode: "screen" }} />
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <mask id="billMask">
              {Array.from({ length: GX * GY }, (_, i) => {
                const { cx, cy, t } = cell(i);
                return <rect key={i} x={640 + cx * ((BILL_W + 20) / GX) - 0.5} y={390 + cy * ((BILL_H + 20) / GY) - 0.5} width={(BILL_W + 20) / GX + 1} height={(BILL_H + 20) / GY + 1} fill="#fff" opacity={1 - ease.inCubic(t)} />;
              })}
            </mask>
          </defs>
          <g transform="translate(560 470) rotate(-12)" opacity={1 - clamp01((f - dis - 10) / 30)}>
            <Bill v="50" c="#d9c08a" />
          </g>
          <g transform="translate(700 330) rotate(9)" opacity={1 - clamp01((f - dis - 4) / 30)}>
            <Bill v="10" c="#b6c6e6" />
          </g>
          <g mask="url(#billMask)">
            <g transform="translate(650 400)">
              <Bill v="100" c="#8fcf9e" />
            </g>
          </g>
          {/* the pieces, lifting off as green light */}
          {Array.from({ length: GX * GY }, (_, i) => {
            const { cx, cy, t } = cell(i);
            if (t <= 0 || t >= 1) return null;
            const e = ease.outCubic(t);
            const x = 650 + (cx + 0.5) * (BILL_W / GX) + e * (120 + seeded(i, 2) * 260) * (seeded(i, 7) - 0.3);
            const y = 400 + (cy + 0.5) * (BILL_H / GY) - e * (160 + seeded(i, 3) * 380);
            const s = (1 - e) * 16 + 3;
            return <rect key={i} x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.3} fill={t < 0.25 ? "#8fcf9e" : C.greenLight} opacity={(1 - t) * 0.95} transform={`rotate(${e * 200 * (seeded(i, 4) - 0.5)} ${x} ${y})`} style={{ filter: t > 0.25 ? "drop-shadow(0 0 6px #5df0a5)" : undefined }} />;
          })}
        </svg>
      </Cam>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 40% 40% at 50% 40%, rgba(93,240,165,${0.25 * clamp01((f - dis) / 20)}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
      <Dust f={f} n={30} color="255,220,170" />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 30%)" }} />
      <AText words={L} size={92} y={150} color={WHITE} hi={{ 0: C.greenLight, 1: C.greenLight }} />
      <Grade vignette={0.6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ U6: Mihai's van across the evening city, the route drawn in green; the job tracked live
const STEPS: Array<[string, number]> = [
  ["Mihai e pe drum", 0],
  ["Ajunge în 4 min", 3],
  ["În lucru", 6],
  ["Gata!", 8],
];
export const U6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B5_END;
  const t = f - a0;
  const L = W2("urmaresti");
  const at = (k: number) => w("urmaresti", k) - 2;
  const doneAt = at(8);
  const done = ease.outBack(clamp01((f - doneAt) / 10));
  const road = t * 22;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#1a2350 0%,#5a3a6e 45%,#e2805a 72%,#2a1e2a 100%)", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.04, x: 0, y: Math.sin(fr / 4) * 1.5 })}>
        {/* far skyline */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          {Array.from({ length: 22 }, (_, i) => {
            const x = ((i * 130 - road * 0.12) % 2860 + 2860) % 2860 - 300;
            const h = 160 + seeded(i, 1) * 220;
            return <rect key={i} x={x} y={700 - h} width={110 + seeded(i, 2) * 60} height={h} fill="#2b2448" />;
          })}
          {Array.from({ length: 14 }, (_, i) => {
            const x = ((i * 230 - road * 0.35) % 3220 + 3220) % 3220 - 400;
            const h = 260 + seeded(i, 3) * 260;
            const wd = 200 + seeded(i, 4) * 60;
            return (
              <g key={i}>
                <rect x={x} y={780 - h} width={wd} height={h} fill="#1a1830" stroke={C.ink} strokeWidth={4} />
                {Array.from({ length: Math.floor(h / 44) }, (_, j) =>
                  Array.from({ length: 4 }, (_, k) => (seeded(i * 50 + j * 4 + k, 5) > 0.45 ? <rect key={`${j}-${k}`} x={x + 20 + k * ((wd - 40) / 4)} y={780 - h + 22 + j * 44} width={26} height={20} fill={seeded(i * 50 + j * 4 + k, 6) > 0.3 ? "#ffcf7a" : "#7fc8ff"} opacity={0.85} /> : null)),
                )}
              </g>
            );
          })}
          {/* the street */}
          <rect x={0} y={780} width={1920} height={300} fill="#1c1b22" />
          <rect x={0} y={780} width={1920} height={16} fill="#3a3842" />
          {Array.from({ length: 12 }, (_, i) => {
            const x = ((i * 220 - road) % 2640 + 2640) % 2640 - 300;
            return <rect key={i} x={x} y={960} width={120} height={12} rx={6} fill="#e8e2d0" opacity={0.7} />;
          })}
          {/* the route, drawn in green along the road ahead */}
          <path d={`M1180 905 C1400 905 1500 890 1700 860 S1920 820 2000 800`} fill="none" stroke="rgba(93,240,165,0.35)" strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${clamp01(t / 24)} 1`} />
          <path d={`M1180 905 C1400 905 1500 890 1700 860 S1920 820 2000 800`} fill="none" stroke={C.greenLight} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 22" strokeDashoffset={-t * 3} opacity={clamp01(t / 10)} />
        </svg>
        {/* the van */}
        <div style={{ position: "absolute", left: 560, top: 640 + Math.sin(t / 3) * 2 }}>
          <svg width={640} height={300} viewBox="0 0 640 300" style={{ overflow: "visible" }}>
            <path d="M20 230 L20 70 C20 46 40 30 64 30 L420 30 C450 30 470 44 486 66 L560 160 C580 166 610 180 616 206 L620 230 Z" fill="#f4f1ea" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
            <path d="M20 180 L620 180 L620 230 L20 230 Z" fill="#d7d2c6" />
            <path d="M20 150 L600 150 L606 172 L20 172 Z" fill={C.green} />
            <path d="M440 58 L478 58 L546 150 L440 150 Z" fill="#9fd0e6" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
            <path d="M444 62 L470 62 L500 104" fill="none" stroke="#fff" strokeWidth={6} opacity={0.7} />
            <g transform="translate(470 74)">
              <circle cx={22} cy={30} r={24} fill="#1d1a1a" />
              <path d="M2 74 C6 54 18 50 30 50 C44 50 54 58 56 76 Z" fill="#1d4a35" />
            </g>
            <foreignObject x={60} y={52} width={300} height={90}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Logo size={72} />
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: "#0d3a24", letterSpacing: "-0.03em" }}>handly</div>
              </div>
            </foreignObject>
            {[130, 500].map((cx) => (
              <g key={cx} transform={`rotate(${t * 18} ${cx} 236)`}>
                <circle cx={cx} cy={236} r={52} fill="#1a1a1e" stroke={C.ink} strokeWidth={8} />
                <circle cx={cx} cy={236} r={24} fill="#9aa0a6" stroke={C.ink} strokeWidth={5} />
                <line x1={cx - 22} y1={236} x2={cx + 22} y2={236} stroke={C.ink} strokeWidth={5} />
              </g>
            ))}
            <ellipse cx={610} cy={196} rx={14} ry={10} fill="#fff6c8" />
          </svg>
          <div style={{ position: "absolute", left: 610, top: 150, width: 600, height: 120, background: "linear-gradient(90deg, rgba(255,240,190,0.55), rgba(255,240,190,0))", clipPath: "polygon(0 35%, 100% 0, 100% 100%, 0 65%)" }} />
        </div>
        {/* streetlights, fastest */}
        {Array.from({ length: 4 }, (_, i) => {
          const x = ((i * 700 - road * 1.4) % 2800 + 2800) % 2800 - 300;
          return (
            <div key={i} style={{ position: "absolute", left: x, top: 200 }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: 22, height: 900, background: "#0e0d12", border: `4px solid ${C.ink}` }} />
              <div style={{ position: "absolute", left: -10, top: -10, width: 140, height: 26, borderRadius: 13, background: "#0e0d12" }} />
              <div style={{ position: "absolute", left: 60, top: 10, width: 300, height: 700, background: "linear-gradient(180deg, rgba(255,210,140,0.35), rgba(255,210,140,0))", clipPath: "polygon(20% 0, 30% 0, 100% 100%, 0 100%)", mixBlendMode: "screen" }} />
            </div>
          );
        })}
      </Cam>
      <SpeedLines x={300} y={540} a={0.1} f={f} />
      {/* the live tracking card */}
      <div style={{ ...card, left: 1280, top: 110, width: 540, padding: 30, boxSizing: "border-box", ...rise(f, a0 + 4, 16) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>Priză stricată</div>
          <div style={pill("rgba(0,191,99,0.14)", GREEN_TXT)}>
            <div style={{ width: 12, height: 12, borderRadius: 6, background: C.green, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5)) }} />
            LIVE
          </div>
        </div>
        <div style={{ marginTop: 22, position: "relative" }}>
          {STEPS.map(([s, k], i) => {
            const on = f >= at(k);
            const p = ease.outBack(clamp01((f - at(k)) / 10));
            const last = i === 3;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, height: 64, opacity: on ? 1 : 0.35 }}>
                <div style={{ transform: `scale(${on ? (last ? 0.7 + 0.5 * done : p) : 0.8})` }}>{on ? <Check size={40} /> : <div style={{ width: 40, height: 40, borderRadius: 20, border: "3px solid #cfd5d2" }} />}</div>
                <div style={{ fontSize: last ? 32 : 27, fontWeight: 700, letterSpacing: "-0.02em", color: last && on ? GREEN_TXT : INK }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%)" }} />
      <AText words={L.slice(0, 2)} size={84} x={120} y={170} align="left" color={WHITE} />
      <AText words={L.slice(2, 5)} size={84} x={120} y={268} align="left" color={WHITE} hi={{ 1: C.greenLight, 2: C.greenLight }} />
      <AText words={L.slice(5)} size={84} x={120} y={366} align="left" color={WHITE} />
      <Grade vignette={0.45} warm={0.3} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ U7: three cuts on the beat — fixed, mowed, built — then Andrei lets the breath out and smiles
const Sparkle: React.FC<{ x: number; y: number; t: number; s?: number }> = ({ x, y, t, s = 1 }) => {
  if (t <= 0 || t >= 1) return null;
  const k = Math.sin(t * Math.PI);
  return (
    <svg width={200} height={200} viewBox="-100 -100 200 200" style={{ position: "absolute", left: x - 100, top: y - 100, transform: `scale(${s * (0.4 + k)}) rotate(${t * 60}deg)`, opacity: k }}>
      <path d="M0 -90 C8 -20 20 -8 90 0 C20 8 8 20 0 90 C-8 20 -20 8 -90 0 C-20 -8 -8 -20 0 -90 Z" fill="#fff" />
    </svg>
  );
};
export const U7: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = B6_END;
  const c2 = w("fara1", 1) - 1, c3 = w("fara1", 3) - 4, c4 = w("fara2", 0) - 3;
  const shot = f < c2 ? 0 : f < c3 ? 1 : f < c4 ? 2 : 3;
  const L1 = W2("fara1");
  const L2 = W2("fara2");
  const t1 = (
    <>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 18%, rgba(255,255,255,0) 34%)" }} />
      <AText words={L1} size={110} y={940} color={INK} hi={{ 0: GREEN_TXT }} />
    </>
  );
  if (shot === 0) {
    const turn = r01(f, a0, c2 - 4, (t) => t);
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1.25 - 0.08 * clamp01((fr - a0) / (c2 - a0)), x: 0, y: 0 })}>
          <DayWall f={f} tint="#f0ece2" />
          <div style={{ position: "absolute", left: 960 - 240, top: 540 - 300 }}>
            <ToonSocket size={480} screw={turn * 360} glow={clamp01((f - c2 + 8) / 4)} />
          </div>
          {/* the screwdriver at the screw, his hand on it */}
          <div style={{ position: "absolute", left: 960 - 20, top: 540 + 180 - 10, transform: `rotate(${-8 + Math.sin(turn * 12) * 6}deg)`, transformOrigin: "20px 0px" }}>
            <div style={{ width: 40, height: 230, background: "linear-gradient(90deg,#9aa0a3,#eef1f2,#8a9093)", border: `5px solid ${C.ink}`, borderRadius: 6 }} />
            <div style={{ position: "absolute", left: -30, top: 220, width: 100, height: 240, borderRadius: 30, background: "#e8463a", border: `7px solid ${C.ink}` }} />
            <div style={{ position: "absolute", left: -60, top: 300, width: 160, height: 150, borderRadius: 60, background: C.skin, border: `6px solid ${C.ink}` }} />
          </div>
        </Cam>
        <Sparkle x={1160} y={330} t={(f - (c2 - 8)) / 10} />
        {t1}
        <Grade vignette={0.25} />
      </AbsoluteFill>
    );
  }
  if (shot === 1) {
    const m = r01(f, c2, c3, (t) => t);
    return (
      <AbsoluteFill style={{ background: "#4caa4f", overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1.1, x: 0, y: 0, r: -6 })}>
          {Array.from({ length: 16 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: -200 + i * 150, top: -200, width: 150, height: 1500, background: i % 2 ? "#5cbf5c" : "#47a64b" }} />
          ))}
          {/* the last stripe, still to be cut */}
          <div style={{ position: "absolute", left: -200 + 9 * 150, top: -200, width: 150, height: 1500 * (1 - m), background: "repeating-linear-gradient(90deg,#3d8c3e 0 10px,#357d36 10px 18px)" }} />
          <div style={{ position: "absolute", left: -200 + 9 * 150 - 25, top: -200 + 1500 * (1 - m) - 200, width: 200, height: 220 }}>
            <div style={{ position: "absolute", left: 0, top: 40, width: 200, height: 160, borderRadius: 26, background: "#e8463a", border: `7px solid ${C.ink}` }} />
            <div style={{ position: "absolute", left: 60, top: 70, width: 80, height: 80, borderRadius: "50%", background: "#2a2a2a", border: `6px solid ${C.ink}` }} />
            <div style={{ position: "absolute", left: 90, top: 190, width: 20, height: 260, background: "#2a2a2a", border: `5px solid ${C.ink}` }} />
          </div>
        </Cam>
        <Sparkle x={1500} y={260} t={(f - c3 + 10) / 10} s={0.8} />
        {t1}
        <Grade vignette={0.3} />
      </AbsoluteFill>
    );
  }
  if (shot === 2) {
    const close = ease.outBack(clamp01((f - c3 - 2) / 10));
    return (
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1.06 - 0.04 * clamp01((fr - c3) / 20), x: 0, y: 0 })}>
          <DayWall f={f} tint="#ece6da" />
          <div style={{ position: "absolute", left: 960 - 330, top: 130, width: 660, height: 820, borderRadius: 12, background: "#c79a62", border: `10px solid ${C.ink}`, boxShadow: "30px 30px 0 rgba(0,0,0,0.12)" }}>
            {[0, 1].map((d) => (
              <div key={d} style={{ position: "absolute", top: 20, bottom: 20, left: d === 0 ? 20 : 330, width: 290, transformOrigin: d === 0 ? "0% 50%" : "100% 50%", transform: `perspective(1600px) rotateY(${(d === 0 ? -1 : 1) * (1 - close) * 75}deg)`, background: "linear-gradient(90deg,#e2bb84,#d6ab70)", border: `7px solid ${C.ink}`, borderRadius: 6 }}>
                <div style={{ position: "absolute", top: "46%", [d === 0 ? "right" : "left"]: 24, width: 14, height: 90, borderRadius: 7, background: "#5a4a3a", border: `4px solid ${C.ink}` } as React.CSSProperties} />
              </div>
            ))}
          </div>
        </Cam>
        <Sparkle x={1180} y={200} t={(f - c3 - 8) / 10} />
        {t1}
        <Grade vignette={0.25} />
      </AbsoluteFill>
    );
  }
  // he lets the breath out, sinks back, smiles
  const lean = ease.inOutCubic(clamp01((f - c4) / 18));
  const shut = f > c4 + 4 && f < c4 + 22 ? Math.sin(((f - c4 - 4) / 18) * Math.PI) : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 70% at 50% 40%, #f4fbf6 0%, #cfeedd 60%, #9fd9bb 100%)", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.02 + 0.05 * clamp01((fr - c4) / 40), x: 0, y: 0 })}>
        {Array.from({ length: 10 }, (_, k) => (
          <div key={k} style={{ position: "absolute", left: seeded(k, 1) * 1800, top: seeded(k, 2) * 700, width: 80 + seeded(k, 3) * 120, height: 80 + seeded(k, 3) * 120, borderRadius: "50%", background: k % 2 ? "rgba(255,255,255,0.7)" : "rgba(93,240,165,0.35)", filter: "blur(14px)" }} />
        ))}
        <div style={{ position: "absolute", left: 960 - 330, top: 110 + lean * 30, transform: `rotate(${-5 * lean}deg)`, transformOrigin: "50% 100%" }}>
          <Head width={660} l={{ side: -1, key: "#fff1d6", rim: C.greenLight, shade: 0.55 }} e={{ open: lerp(0.9, 0.15, shut) * (lean > 0.9 ? 1 : 1), brow: -0.3 * (1 - lean), mouth: lean > 0.5 ? "grin" : "sigh", gy: -4 }} f={f} />
        </div>
      </Cam>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.6) 18%, rgba(255,255,255,0) 34%)" }} />
      <AText words={L2} size={150} y={935} color={INK} hi={{ 1: GREEN_TXT }} />
      <Grade vignette={0.2} />
    </AbsoluteFill>
  );
};

/** act II: the kept drop, the new animated shots, the kept beat montage */
export const ACT2T: React.FC = () => (
  <>
    <Win from={D0} to={B1_END}>
      <B1 />
      <Explosion at={D0} cx={960} cy={570} />
    </Win>
    <Win still from={B1_END} to={B2_END}><U2 /></Win>
    <Win still from={B2_END} to={B3_END}><U3 /></Win>
    <Win still from={B3_END} to={B4_END}><U4 /></Win>
    <Win still from={B4_END} to={B5_END}><U5 /></Win>
    <Win still from={B5_END} to={B6_END}><U6 /></Win>
    <Win still from={B6_END} to={B7_END}><U7 /></Win>
    <Win from={B7_END} to={BRIDGE}><B8 /></Win>
  </>
);

