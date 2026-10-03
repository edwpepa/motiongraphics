import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Avatar, Person } from "../explainer/components/Avatar";
import { Glyph } from "../explainer/components/Icons";
import { StoreBadge } from "../explainer/components/StoreBadge";
import { useExplainerFonts } from "../explainer/fonts";
import { clamp01, ease, lerp } from "../explainer/lib/anim";
import { BOLD, FONT } from "../explainer/theme";
import { ServiceName, ServiceTile } from "../launch/fx";
import { GREEN_INK, Logo, Txt, Wordmark } from "../launch/kit";
import { CITIES, proj, roPath } from "./art";
import { CATHEDRAL, CityShapes, Ground, PAL, city, iso } from "./iso";
import { DROP, TOTAL, kw, pStart, w } from "./timeline";

const CX = 960;
const CY = 540;
const INK: [string, string] = ["#14201a", "#14201a"];

// ------------------------------------------------------------------ places in the city
const nearestHouse = (ti: number, tj: number, avoid: Array<[number, number]> = []) => {
  let best: [number, number] = [0, 0];
  let bd = Infinity;
  for (const h of city().houses) {
    if (avoid.some((a) => a[0] === h[0] && a[1] === h[1])) continue;
    const d = (h[0] - ti) ** 2 + (h[1] - tj) ** 2;
    if (d < bd) {
      bd = d;
      best = h;
    }
  }
  return best;
};
const SERV: Array<{ k: "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6"; icon: ServiceName; label: string; near: [number, number] }> = [
  { k: "s0", icon: "droplet", label: "Instalații", near: [5, 5] },
  { k: "s1", icon: "sofa", label: "Montat mobilă", near: [13, 5] },
  { k: "s2", icon: "roller", label: "Zugrăvit", near: [18, 9] },
  { k: "s3", icon: "sparkles", label: "Curățenie", near: [4, 9] },
  { k: "s4", icon: "leaf", label: "Tuns iarba", near: [9, 20] },
  { k: "s5", icon: "box", label: "Mutat", near: [17, 21] },
  { k: "s6", icon: "hammer", label: "Plimbat cățelul", near: [21, 18] },
];
const TARGETS: Array<[number, number]> = [];
SERV.forEach((s) => TARGETS.push(nearestHouse(s.near[0], s.near[1], TARGETS)));
const NEEDS: Array<[number, number]> = [];
[[2, 2], [10, 1], [21, 2], [1, 18], [6, 13], [18, 13], [13, 18], [22, 22], [2, 22], [19, 6]].forEach(([a, b]) => NEEDS.push(nearestHouse(a, b, [...TARGETS, ...NEEDS])));
const YOU = nearestHouse(10, 5, TARGETS);

/** door of a house, in world pixels */
const door = (h: [number, number]) => iso(h[0] + 0.5, h[1] + 0.92);
const roofTop = (h: [number, number]) => iso(h[0] + 0.5, h[1] + 0.5, 120);
const streetJ = (b: number) => Math.floor(b / 4) * 4 + 3;
/** a walking route along the streets to a house's door */
const route = (from: [number, number], h: [number, number]): Array<[number, number]> => [from, [from[0], streetJ(h[1]) + 0.5], [h[0] + 0.5, streetJ(h[1]) + 0.5], [h[0] + 0.5, h[1] + 0.92]];
const along = (pts: Array<[number, number]>, u: number): [number, number] => {
  const seg = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
  const L = seg.reduce((a, b) => a + b, 0);
  let d = clamp01(u) * L;
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k] || k === seg.length - 1) {
      const t = seg[k] ? Math.min(1, d / seg[k]) : 1;
      return [lerp(pts[k][0], pts[k + 1][0], t), lerp(pts[k][1], pts[k + 1][1], t)];
    }
    d -= seg[k];
  }
  return pts[pts.length - 1];
};

// ------------------------------------------------------------------ timing
const S1 = pStart("orice") - 8;
const S2 = pStart("s0") - 4;
const S3 = pStart("tot") - 4;
const S5 = pStart("alegi") - 6;
const S6 = pStart("daca") - 6;
const S7 = pStart("pornit") - 6;
const S8 = pStart("handly") - 8;
const startOf = (i: number) => (i === 6 ? w("s6", 3) - 8 : pStart(SERV[i].k) - 6);
const OFFER_FROM: Array<[number, number]> = [
  [3.5, 21],
  [19.5, 2],
  [23.5, 9],
];
const CHOSEN = 1;
const TRUST_ROUTE = route(OFFER_FROM[CHOSEN], YOU);
const EARN_HOUSES = [nearestHouse(14, 18, [YOU]), nearestHouse(17, 18, [YOU]), nearestHouse(20, 18, [YOU])];
const EARN_ROUTE: Array<[number, number]> = [
  [11.5, 19.5],
  [23.5, 19.5],
];

// ------------------------------------------------------------------ camera
type Key = { f: number; x: number; y: number; z: number };
const wp = (h: [number, number], dy = 0) => {
  const [x, y] = iso(h[0] + 0.5, h[1] + 0.5);
  return { x, y: y + dy };
};
const cathedralP = wp([CATHEDRAL[0] + 1, CATHEDRAL[1] + 1], -60);
const centre = iso(12, 12);

const KEYS: Key[] = (() => {
  const k: Key[] = [];
  k.push({ f: 0, x: cathedralP.x + 200, y: cathedralP.y - 80, z: 0.42 });
  k.push({ f: S1 - 6, x: cathedralP.x, y: cathedralP.y, z: 0.62 });
  k.push({ f: S2 - 6, x: centre[0], y: centre[1] - 40, z: 0.46 });
  SERV.forEach((_, i) => {
    const p = wp(TARGETS[i], -40);
    k.push({ f: startOf(i), x: p.x, y: p.y, z: 1.15 });
    k.push({ f: (i < SERV.length - 1 ? startOf(i + 1) : S3) - 9, x: p.x + 14, y: p.y - 6, z: 1.22 });
  });
  k.push({ f: S3 + 10, x: centre[0], y: centre[1] - 60, z: 0.36 });
  k.push({ f: DROP, x: centre[0], y: centre[1] - 80, z: 0.4 });
  const you = wp(YOU, -30);
  k.push({ f: DROP + 22, x: you.x - 300 / 0.62, y: you.y, z: 0.62 });
  k.push({ f: S5 - 6, x: you.x - 300 / 0.66, y: you.y + 30, z: 0.66 });
  return k;
})();

const camAt = (f: number): { x: number; y: number; z: number } => {
  // follow cams for the walking scenes
  if (f >= S5 && f < S6) {
    const u = ease.inOutCubic(clamp01((f - (S5 + 4)) / (S6 - S5 - 18)));
    const [i, j] = along(TRUST_ROUTE, u);
    const [x, y] = iso(i, j);
    const enter = ease.inOutCubic(clamp01((f - S5) / 14));
    const prev = KEYS[KEYS.length - 1];
    return { x: lerp(prev.x, x, enter), y: lerp(prev.y, y - 40, enter), z: lerp(prev.z, 1.15, enter) };
  }
  if (f >= S6 && f < S7) {
    const u = clamp01((f - S6) / (S7 - S6));
    const [i, j] = along(EARN_ROUTE, u);
    const [x, y] = iso(i, j);
    return { x, y: y - 50, z: 1.45 };
  }
  if (f >= S7) {
    const [i, j] = along(EARN_ROUTE, 1);
    const [x, y] = iso(i, j);
    const t = ease.inExpo(clamp01((f - S7) / 30));
    return { x: lerp(x, centre[0], t), y: lerp(y - 50, centre[1], t), z: lerp(1.45, 0.08, t) };
  }
  for (let n = 1; n < KEYS.length; n++) {
    if (f <= KEYS[n].f) {
      const a = KEYS[n - 1];
      const b = KEYS[n];
      const t = ease.inOutCubic(clamp01((f - a.f) / Math.max(1, b.f - a.f)));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
    }
  }
  const l = KEYS[KEYS.length - 1];
  return { x: l.x, y: l.y, z: l.z };
};

// ------------------------------------------------------------------ people and bubbles (inside the world)
const Walker: React.FC<{ i: number; j: number; walking: boolean; shirt?: string }> = ({ i, j, walking, shirt = PAL.green }) => {
  const f = useCurrentFrame();
  const [x, y] = iso(i, j);
  const s = walking ? Math.sin(f * 0.6) : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse rx={16} ry={7} fill="rgba(20,60,40,0.18)" />
      <line x1={-4} y1={-26} x2={-4 - 6 * s} y2={-2} stroke="#2a3a33" strokeWidth={6} strokeLinecap="round" />
      <line x1={4} y1={-26} x2={4 + 6 * s} y2={-2} stroke="#2a3a33" strokeWidth={6} strokeLinecap="round" />
      <rect x={-12} y={-58} width={24} height={36} rx={11} fill={shirt} transform={`translate(0 ${walking ? Math.abs(s) * -2 : 0})`} />
      <circle cy={-70 + (walking ? Math.abs(s) * -2 : 0)} r={11} fill="#f2c9a5" />
      <path d={`M -12 ${-72 + (walking ? Math.abs(s) * -2 : 0)} A 12 12 0 0 1 12 ${-72 + (walking ? Math.abs(s) * -2 : 0)} L 16 ${-70 + (walking ? Math.abs(s) * -2 : 0)} Z`} fill={PAL.greenD} />
    </g>
  );
};

/** a bubble that keeps its on-screen size whatever the zoom */
const Bubble: React.FC<{ x: number; y: number; z: number; at: number; children: React.ReactNode; scale?: number }> = ({ x, y, z, at, children, scale = 1 }) => {
  const f = useCurrentFrame();
  const p = ease.outBack(clamp01((f - at) / 12), 1.4);
  if (p <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${(p * scale) / z})`}>
      <foreignObject x={-200} y={-200} width={400} height={220} style={{ overflow: "visible" }}>
        <div style={{ width: 400, height: 220, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{children}</div>
      </foreignObject>
    </g>
  );
};

const Pin: React.FC<{ icon: ServiceName; done?: number; label?: string; big?: boolean }> = ({ icon, done = 0, label, big }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: big ? "14px 26px 14px 14px" : 10, borderRadius: 999, background: "#ffffff", boxShadow: "0 14px 34px rgba(20,60,40,0.22)" }}>
      <div style={{ position: "relative" }}>
        <ServiceTile name={icon} size={big ? 74 : 54} tone={done > 0.5 ? "green" : big ? "green" : "white"} />
        {done > 0 && (
          <div style={{ position: "absolute", right: -8, top: -8, width: 30, height: 30, borderRadius: 15, background: PAL.green, border: "3px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ease.outBack(done)})` }}>
            <Glyph name="check" size={16} color="#fff" weight={3.6} />
          </div>
        )}
      </div>
      {label && <div style={{ fontFamily: FONT, fontWeight: BOLD, fontSize: 40, color: "#14201a", letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{label}</div>}
    </div>
    <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "14px solid #ffffff", marginTop: -1 }} />
  </div>
);

// ------------------------------------------------------------------ the world, with everything that happens in it
const World: React.FC = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const z = cam.z;
  const allDone = (k: number) => clamp01((f - (w("tot", 0) + k * 1.2)) / 8);
  const NEED_ICONS: ServiceName[] = ["wrench", "plug", "roller", "droplet", "sofa", "sparkles", "box", "hammer", "leaf", "wrench"];
  // offers: three taskers light up and set off towards you
  const offerAt = w("oferte", 6) - 8;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${CX - cam.x * z} ${CY - cam.y * z}) scale(${z})`}>
        <Ground />
        {/* routes for the offers */}
        {f >= offerAt &&
          OFFER_FROM.map((from, k) => {
            const pts = route(from, YOU).map(([i, j]) => iso(i, j));
            const p = ease.inOutCubic(clamp01((f - (offerAt + k * 5)) / 22));
            return <polyline key={k} points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={k === CHOSEN ? PAL.green : PAL.greenL} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 22" pathLength={undefined} opacity={0.85 * p} />;
          })}
        <CityShapes />
        {/* the services: a tasker arrives at each door */}
        {f >= S2 &&
          f < S3 + 20 &&
          SERV.map((s, i) => {
            const at = startOf(i);
            if (f < at) return null;
            const [di, dj] = [TARGETS[i][0] + 0.5, TARGETS[i][1] + 0.92];
            const u = ease.inOutCubic(clamp01((f - at - 4) / 20));
            return <Walker key={s.k} i={di + 1.4 * (1 - u)} j={dj + 0.6} walking={u < 1} />;
          })}
        {/* the offering taskers */}
        {f >= offerAt &&
          f < S6 &&
          OFFER_FROM.map((from, k) => {
            if (f >= S5 && k !== CHOSEN) return null;
            const r = route(from, YOU);
            const u = f >= S5 ? ease.inOutCubic(clamp01((f - (S5 + 4)) / (S6 - S5 - 18))) : 0;
            const [i, j] = along(r, u);
            return <Walker key={k} i={i} j={j} walking={u > 0 && u < 1} shirt={k === CHOSEN ? PAL.green : PAL.greenL} />;
          })}
        {/* the earner */}
        {f >= S6 - 4 && f < S7 + 30 && (() => {
          const u = clamp01((f - S6) / (S7 - S6));
          const [i, j] = along(EARN_ROUTE, u);
          return <Walker i={i} j={j} walking shirt={PAL.greenD} />;
        })()}
        {/* bubbles: needs all over town */}
        {f >= S1 &&
          f < S5 &&
          NEEDS.map((h, k) => {
            const [x, y] = roofTop(h);
            return (
              <Bubble key={`n${k}`} x={x} y={y} z={z} at={S1 + 8 + k * 6} scale={0.8}>
                <Pin icon={NEED_ICONS[k]} done={allDone(k + 7)} />
              </Bubble>
            );
          })}
        {f >= S2 &&
          f < S5 &&
          SERV.map((s, i) => {
            const [x, y] = roofTop(TARGETS[i]);
            const active = f >= startOf(i) && (i === SERV.length - 1 || f < startOf(i + 1)) && f < S3;
            return (
              <Bubble key={s.k} x={x} y={y} z={z} at={startOf(i) + 2} scale={active ? 1 : 0.8}>
                <Pin icon={s.icon} label={active ? s.label : undefined} big={active} done={allDone(i)} />
              </Bubble>
            );
          })}
        {/* you */}
        {f >= DROP && f < S6 && (f < S5 || f >= S6 - 22) && (() => {
          const [x, y] = roofTop(YOU);
          const home = f >= S6 - 22;
          return (
            <Bubble x={x} y={y} z={z} at={DROP + 14}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 999, background: home ? PAL.green : "#14201a", color: "#fff", fontFamily: FONT, fontWeight: BOLD, fontSize: 34, boxShadow: "0 14px 34px rgba(20,60,40,0.25)" }}>
                {home ? <Glyph name="check" size={30} color="#fff" weight={3.4} /> : <div style={{ width: 14, height: 14, borderRadius: 7, background: PAL.greenL }} />}
                {home ? "Rezolvat" : "Tu"}
              </div>
            </Bubble>
          );
        })()}
        {/* earnings popping over the earner */}
        {f >= S6 &&
          f < S7 + 20 &&
          [0, 1, 2].map((k) => {
            const at = S6 + 16 + k * 26;
            const t = clamp01((f - at) / 26);
            if (t <= 0 || t >= 1) return null;
            const [i, j] = along(EARN_ROUTE, clamp01((at - S6) / (S7 - S6)));
            const [x, y] = iso(i, j, 120 + 80 * ease.outCubic(t));
            return (
              <g key={k} transform={`translate(${x} ${y}) scale(${1 / z})`} opacity={1 - ease.inCubic(t)}>
                <text textAnchor="middle" fontFamily={FONT} fontWeight={BOLD} fontSize={58} fill={PAL.greenD} letterSpacing="-0.03em">{`+${[150, 200, 120][k]} lei`}</text>
              </g>
            );
          })}
      </g>
    </svg>
  );
};

// ------------------------------------------------------------------ overlays
const Sky: React.FC = () => <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 80% at 50% 55%, #f3faf6 0%, #e2f1e8 100%)" }} />;
const TopFade: React.FC = () => <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(250,253,251,0.92) 0%, rgba(250,253,251,0.6) 16%, rgba(250,253,251,0) 30%)" }} />;

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const T = (words: ReturnType<typeof kw>, out: number, y = 120, x = 120, size = 72) => <Txt words={words} size={size} on="white" x={x} y={y} align="left" ink={INK} tint={GREEN_INK} out={out} />;
  return (
    <>
      {T(kw("tm"), pStart("veste") - 6, 120, 120, 96)}
      {T(kw("veste", { color: { 2: GREEN_INK, 3: GREEN_INK } }), S1 - 4, 120, 120, 96)}
      {T(kw("orice"), S2 - 4)}
      {T(kw("loc", { cap: false, color: { 5: GREEN_INK, 6: GREEN_INK } }), S2 - 4, 205)}
      {T(kw("tot"), w("pe", 0) - 4, 140, 120, 130)}
      {T(kw("pe", { color: { 1: GREEN_INK } }), DROP - 2, 140, 120, 130)}
      {T(kw("alegi", { color: { 1: GREEN_INK } }), S6 - 6, 120)}
      {T(kw("platesti", { cap: true, color: { 2: GREEN_INK } }), S6 - 6, 205)}
      {T(kw("urmaresti", { cap: true, color: { 2: GREEN_INK } }), S6 - 6, 290)}
      {T(kw("daca", { color: { 5: GREEN_INK } }), S7 - 6)}
      {T([...kw("castigi", { cap: true, color: { 0: GREEN_INK } }), ...kw("timp", { cap: false, color: { 3: GREEN_INK } })], S7 - 6, 205)}
      {f >= 0 && null}
    </>
  );
};

/** the app, next to the city, while the offers come in */
const AppPanel: React.FC = () => {
  const f = useCurrentFrame();
  const inT = ease.outExpo(clamp01((f - (DROP + 10)) / 22));
  const outT = ease.inCubic(clamp01((f - (S5 - 10)) / 10));
  if (inT <= 0 || outT >= 1) return null;
  const typed = Math.floor(clamp01((f - (DROP + 24)) / 26) * "Montat dulap".length);
  const posted = clamp01((f - (w("postezi", 9) - 4)) / 10);
  const offerAt = w("oferte", 6) - 8;
  const OFFERS: Array<{ p: Person; n: string; price: string }> = [
    { p: "mihai", n: "Mihai D.", price: "150 lei" },
    { p: "andrei", n: "Andrei P.", price: "140 lei" },
    { p: "radu", n: "Radu S.", price: "170 lei" },
  ];
  return (
    <div style={{ position: "absolute", left: 120, top: 250, width: 560, transform: `translateX(${(1 - inT) * -700 + outT * -700}px)`, fontFamily: FONT, fontWeight: BOLD }}>
      <div style={{ borderRadius: 40, background: "#ffffff", boxShadow: "0 40px 80px rgba(20,60,40,0.18)", padding: 34 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size={40} />
          <div style={{ fontSize: 30, color: "#14201a", letterSpacing: "-0.03em" }}>Postează un task</div>
        </div>
        <div style={{ marginTop: 22, height: 64, borderRadius: 18, background: "#f1f5f2", display: "flex", alignItems: "center", padding: "0 20px", fontSize: 28, color: "#14201a", fontWeight: 500 }}>
          {"Montat dulap".slice(0, typed)}
          {typed < 12 && <span style={{ width: 2.5, height: 30, background: PAL.green, marginLeft: 2 }} />}
        </div>
        <div style={{ marginTop: 16, height: 64, borderRadius: 18, background: posted > 0 ? PAL.green : "#14201a", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff", fontSize: 28 }}>
          {posted > 0 && <Glyph name="check" size={26} color="#fff" weight={3.4} />}
          {posted > 0 ? "Postat în 47 de secunde" : "Postează"}
        </div>
        {OFFERS.map((o, k) => {
          const t = ease.outBack(clamp01((f - (offerAt + k * 5)) / 12));
          if (t <= 0) return null;
          return (
            <div key={o.p} style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderRadius: 22, background: k === CHOSEN && f >= S5 - 16 ? "#e3f7ec" : "#f7faf8", border: `2px solid ${k === CHOSEN && f >= S5 - 16 ? PAL.green : "transparent"}`, transform: `scale(${t})`, transformOrigin: "0 50%" }}>
              <Avatar person={o.p} size={56} dark={false} />
              <div style={{ flex: 1, fontSize: 26, color: "#14201a" }}>{o.n}</div>
              <div style={{ fontSize: 26, color: PAL.greenD }}>{o.price}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AppCaptions: React.FC = () => (
  <>
    <Txt words={kw("postezi", { only: [0, 1, 2, 3], color: { 0: GREEN_INK } })} size={58} on="white" x={760} y={110} align="left" ink={INK} tint={GREEN_INK} out={pStart("oferte") - 6} />
    <Txt words={kw("postezi", { only: [4, 5, 6, 7, 8, 9] })} size={58} on="white" x={760} y={180} align="left" ink={INK} tint={GREEN_INK} out={pStart("oferte") - 6} />
    <Txt words={kw("oferte", { only: [0, 1, 2], cap: true, color: { 2: GREEN_INK } })} size={58} on="white" x={760} y={110} align="left" ink={INK} tint={GREEN_INK} out={S5 - 6} />
    <Txt words={kw("oferte", { only: [3, 4, 5, 6, 7], color: { 4: GREEN_INK } })} size={58} on="white" x={760} y={180} align="left" ink={INK} tint={GREEN_INK} out={S5 - 6} />
  </>
);

/** a status track while the chosen tasker walks over */
const Status: React.FC = () => {
  const f = useCurrentFrame();
  const items = [
    { t: "Andrei P. ales", at: w("alegi", 1) - 4, icon: "check" as const },
    { t: "Plată securizată", at: w("platesti", 0) - 4, icon: "check" as const },
    { t: "Pe drum spre tine", at: w("urmaresti", 1) - 4, icon: "pin" as const },
  ];
  const out = ease.inCubic(clamp01((f - (S6 - 8)) / 8));
  return (
    <div style={{ position: "absolute", right: 110, top: 110, display: "flex", flexDirection: "column", gap: 14, opacity: 1 - out }}>
      {items.map((it, k) => {
        const t = ease.outBack(clamp01((f - it.at) / 12));
        if (t <= 0) return null;
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 26px 14px 16px", borderRadius: 999, background: "#ffffff", boxShadow: "0 14px 34px rgba(20,60,40,0.18)", transform: `scale(${t})`, transformOrigin: "100% 50%", fontFamily: FONT, fontWeight: BOLD, fontSize: 30, color: "#14201a" }}>
            <div style={{ width: 38, height: 38, borderRadius: 19, background: PAL.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Glyph name={it.icon} size={20} color="#fff" weight={3.2} />
            </div>
            {it.t}
          </div>
        );
      })}
    </div>
  );
};

/** "Tot. Pe Handly.": the mark rises over the city */
const Mark: React.FC = () => {
  const f = useCurrentFrame();
  const p = ease.outBack(clamp01((f - (w("pe", 1) - 6)) / 14), 1.3);
  const out = ease.inCubic(clamp01((f - (DROP + 8)) / 10));
  if (p <= 0 || out >= 1) return null;
  const ring = ((f - (w("pe", 1) - 6)) % 30) / 30;
  return (
    <div style={{ position: "absolute", left: CX, top: CY + 40, transform: `translate(-50%, -50%) scale(${p * (1 + 0.6 * out)})`, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 300, height: 300, marginLeft: -150, marginTop: -150, borderRadius: "50%", border: `4px solid ${PAL.green}`, transform: `scale(${1 + ring})`, opacity: 1 - ring }} />
      <div style={{ width: 240, height: 240, borderRadius: "50%", background: "#ffffff", boxShadow: "0 40px 90px rgba(20,60,40,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Logo size={170} />
      </div>
    </div>
  );
};

/** we started in Timișoara; soon in every city */
const RoMap: React.FC = () => {
  const f = useCurrentFrame();
  const inT = ease.inOutCubic(clamp01((f - (S7 + 18)) / 14));
  if (inT <= 0) return null;
  const tm = proj(CITIES[0].lon, CITIES[0].lat);
  const spreadAt = w("curand", 3) - 6;
  return (
    <AbsoluteFill style={{ opacity: inT }}>
      <Sky />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `scale(${lerp(1.6, 1, inT)})`, transformOrigin: `${tm[0]}px ${tm[1]}px` }}>
        <path d={roPath()} fill="#ffffff" stroke="#cfe3d7" strokeWidth={4} strokeLinejoin="round" style={{ filter: "drop-shadow(0 30px 60px rgba(20,60,40,0.15))" }} />
        {CITIES.slice(1).map((c, i) => {
          const at = spreadAt + i * 3;
          const [x, y] = proj(c.lon, c.lat);
          const p = ease.inOutCubic(clamp01((f - at) / 12));
          const pop = ease.outBack(clamp01((f - (at + 10)) / 10), 1.6);
          return (
            <g key={c.n}>
              {p > 0.01 && <line x1={tm[0]} y1={tm[1]} x2={lerp(tm[0], x, p)} y2={lerp(tm[1], y, p)} stroke={PAL.greenL} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />}
              {pop > 0 && (
                <g transform={`translate(${x} ${y}) scale(${pop})`}>
                  <circle r={12} fill={PAL.green} stroke="#fff" strokeWidth={4} />
                  <text x={18} y={-12} fontFamily={FONT} fontWeight={BOLD} fontSize={26} fill="#14201a">
                    {c.n}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        <g transform={`translate(${tm[0]} ${tm[1]})`}>
          <circle r={20 + ((f % 36) / 36) * 60} fill="none" stroke={PAL.green} strokeWidth={3} opacity={1 - (f % 36) / 36} />
          <circle r={16} fill={PAL.green} stroke="#fff" strokeWidth={5} />
          <text x={-28} y={-22} textAnchor="end" fontFamily={FONT} fontWeight={BOLD} fontSize={38} fill="#14201a">
            Timișoara
          </text>
        </g>
      </svg>
      <TopFade />
      <Txt words={kw("pornit", { color: { 3: GREEN_INK } })} size={72} on="white" x={120} y={120} align="left" ink={INK} tint={GREEN_INK} out={pStart("curand") - 6} />
      <Txt words={kw("curand", { color: { 3: GREEN_INK, 4: GREEN_INK } })} size={72} on="white" x={120} y={120} align="left" ink={INK} tint={GREEN_INK} out={S8 - 4} />
    </AbsoluteFill>
  );
};

const Final: React.FC = () => {
  const f = useCurrentFrame();
  const inT = ease.inOutCubic(clamp01((f - S8) / 12));
  if (inT <= 0) return null;
  const logo = ease.outBack(clamp01((f - (S8 + 6)) / 14), 1.3);
  const badges = (k: number) => ease.outBack(clamp01((f - (w("cta", 1) - 4 + k * 5)) / 12));
  const fade = ease.inOutCubic(clamp01((f - (TOTAL - 20)) / 18));
  return (
    <AbsoluteFill style={{ opacity: inT, background: "radial-gradient(ellipse 80% 90% at 50% 45%, #1cd57a 0%, #00bf63 50%, #009e51 100%)" }}>
      <div style={{ position: "absolute", left: CX, top: 440, transform: `translate(-50%, -50%) scale(${logo})`, display: "flex", alignItems: "center", gap: 30 }}>
        <Logo size={160} tone="white" />
        <div style={{ transform: "translateY(-8px)" }}>
          <Wordmark size={160} color="#ffffff" ro />
        </div>
      </div>
      <div style={{ position: "absolute", left: CX, top: 640, transform: "translate(-50%, -50%)", display: "flex", gap: 24 }}>
        {(["apple", "google"] as const).map((s, k) => (
          <div key={s} style={{ transform: `scale(${badges(k)})` }}>
            <StoreBadge store={s} h={88} shine={clamp01((f - (w("cta", 2) + k * 6)) / 20)} />
          </div>
        ))}
      </div>
      <Txt words={kw("cta")} size={64} on="green" y={880} />
      <AbsoluteFill style={{ background: "#000", opacity: fade }} />
    </AbsoluteFill>
  );
};

export const HandlyTimisoaraIso: React.FC = () => {
  const ready = useExplainerFonts();
  const f = useCurrentFrame();
  if (!ready) return <AbsoluteFill style={{ background: "#f4fbf7" }} />;
  const punch = f >= DROP && f < DROP + 12 ? 1 + 0.05 * Math.pow(1 - (f - DROP) / 12, 2) : 1;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <Sky />
        {f < S7 + 40 && <World />}
        <TopFade />
        <Captions />
        {f >= DROP && f < S5 && <AppCaptions />}
        <AppPanel />
        {f >= S5 && f < S6 && <Status />}
        <Mark />
        {f >= DROP && f < DROP + 8 && <AbsoluteFill style={{ background: "#ffffff", opacity: 1 - (f - DROP) / 8 }} />}
      </AbsoluteFill>
      <RoMap />
      <Final />
      <Audio src={staticFile("audio/tm-mix.mp3")} />
    </AbsoluteFill>
  );
};
