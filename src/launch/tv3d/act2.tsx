import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { AppScreen } from "../../explainer/components/AppScreen";
import { Avatar } from "../../explainer/components/Avatar";
import { clamp01, ease, lerp } from "../../explainer/lib/anim";
import { B8 } from "../act2";
import { B1_END, B2_END, B3_END, B4_END, B5_END, B6_END, B7_END } from "../scenes";
import { BEATS, BRIDGE, w } from "../timeline";
import { OUTFIT } from "../tv/font";
import { ChatScreen, OffersScreen, PayScreen, ProfileScreen, TrackScreen, Verified } from "../tv/handly";
import { Sym } from "../tv/ios";
import { vo } from "../tv/kit";
import { idle, mixP, PopOut, spin, Touch } from "./act1";
import { bt, Confetti, D0, GREEN, GREEN2, INK, LightBg, r01, RefText, Sparkle, Splash, spring, Tok } from "./kit3d";
import { PremiumDrop } from "./drop";
import { P3, Phones } from "./phone3d";
import { Win } from "../kit";

// ------------------------------------------------------------------ act II, the app at work: everything lifts out of the glass
const card: React.CSSProperties = { background: "#fff", borderRadius: 28, boxShadow: "0 1px 0 rgba(0,0,0,0.04)", fontFamily: OUTFIT, color: INK };
const W2T = (ws: [string, number][], accent: number[] = []): Tok[] => ws.map(([t, at], i) => ({ t, at, accent: accent.includes(i) }));
/** a burst of colour behind a turning phone */
export const SpinSplash: React.FC<{ at: number; x: number; y: number; color?: string; light?: string; seed?: number }> = ({ at, x, y, color = GREEN, light = GREEN2, seed = 5 }) => {
  const f = useCurrentFrame();
  const t = clamp01((f - at) / 12);
  const out = clamp01((f - at - 10) / 14);
  if (t <= 0 || out >= 1) return null;
  return <Splash x={x} y={y} t={t} R={560} color={color} light={light} seed={seed} drops={16} opacity={1 - out} rot={seed * 40} />;
};

/** the reference's progress bar: a soft track, a gradient fill, a counter */
const Progress: React.FC<{ x: number; y: number; p: number; label: string; right: string; done: number; at: number }> = ({ x, y, p, label, right, done, at }) => {
  const f = useCurrentFrame();
  const a = spring(clamp01((f - at) / 18));
  if (a <= 0) return null;
  const W = 640;
  return (
    <div style={{ position: "absolute", left: x - W / 2, top: y - 70, width: W, height: 140, ...card, borderRadius: 34, padding: "22px 30px", boxSizing: "border-box", transform: `translateY(${(1 - a) * 40}px) scale(${0.94 + 0.06 * a})`, opacity: clamp01(a * 2), boxShadow: "0 30px 60px rgba(20,50,35,0.14)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 500 }}>
        <span>{done > 0.5 ? "Postat" : label}</span>
        <span style={{ color: GREEN, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{right}</span>
      </div>
      <div style={{ marginTop: 18, height: 26, borderRadius: 13, background: "#eef1f4", overflow: "hidden" }}>
        <div style={{ width: `${100 * p}%`, height: "100%", borderRadius: 13, background: `linear-gradient(90deg, ${GREEN2}, ${GREEN})`, boxShadow: "0 0 20px rgba(0,191,99,0.45)" }} />
      </div>
    </div>
  );
};
const DoneCheck: React.FC<{ x: number; y: number; at: number; label?: string }> = ({ x, y, at, label = "Gata" }) => {
  const f = useCurrentFrame();
  const t = clamp01((f - at) / 22);
  if (t <= 0) return null;
  const s = spring(t);
  const draw = clamp01((f - at - 6) / 12);
  return (
    <div style={{ position: "absolute", left: x - 130, top: y - 160, width: 260, textAlign: "center" }}>
      <div style={{ fontFamily: OUTFIT, fontSize: 64, fontWeight: 500, backgroundImage: `linear-gradient(90deg, ${GREEN}, ${GREEN2})`, WebkitBackgroundClip: "text", color: "transparent", opacity: clamp01(t * 2), filter: t < 0.5 ? `blur(${(0.5 - t) * 16}px)` : undefined }}>{label}</div>
      <svg width={180} height={180} viewBox="0 0 180 180" style={{ marginTop: 14, transform: `scale(${s})` }}>
        <circle cx={90} cy={90} r={80} fill="#fff" stroke="rgba(0,191,99,0.25)" strokeWidth={4} />
        <circle cx={90} cy={90} r={80} fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} transform="rotate(-90 90 90)" />
        <path d="M58 92 L80 113 L124 68" fill="none" stroke={GREEN} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01((f - at - 10) / 10)} />
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------ 1 · post it in under a minute
export const K2: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B1_END;
  const enter = r01(f, b0, b0 + 22, (u) => 1 - Math.pow(1 - u, 4));
  const TYPE = b0 + 10, CAT = TYPE + 26, PRESS = w("postezi", 7) - 4, SUCC = w("postezi", 9) - 4;
  const text = "Priză stricată în bucătărie";
  const app = {
    typed: clamp01((f - TYPE) / 22) * text.length,
    caret: Math.floor(f / 7) % 2 === 0 || (f > TYPE && f < TYPE + 24),
    focus: clamp01((f - (TYPE - 4)) / 4) * (1 - clamp01((f - CAT) / 4)),
    category: ease.outCubic(clamp01((f - CAT) / 6)),
    location: clamp01((f - (CAT + 6)) / 14),
    priceSel: ease.outCubic(clamp01((f - (CAT + 16)) / 8)),
    press: clamp01((f - PRESS) / 9),
    loading: clamp01((f - (PRESS + 3)) / 8),
    success: ease.outCubic(clamp01((f - SUCC) / 8)),
    check: clamp01((f - (SUCC + 4)) / 12),
    since: f - SUCC,
  };
  const target = idle(f, 1300, 570, 800, "green", -20);
  const p = mixP({ ...target, x: 2300, ry: -220, rx: 20 }, target, enter);
  const secs = Math.round(52 * r01(f, TYPE, SUCC, (u) => u));
  const done = r01(f, SUCC, SUCC + 6);
  const typed = text.slice(0, Math.floor(app.typed));
  return (
    <AbsoluteFill>
      <LightBg />
      <SpinSplash at={b0 + 4} x={1300} y={560} />
      <Phones slots={[{ p, screen: <><AppScreen s={app} text={text} placeholder="ex: Priză stricată" cats={[[<Sym key="z" n="zap" size={16} w={2.4} />, "Electrice"], [<Sym key="d" n="drop" size={16} w={2.4} />, "Instalații"], [<Sym key="b" n="box" size={16} w={2.4} />, "Montaj"]]} /><Touch x={200} y={773} at={PRESS} dark /></> }]} />
      <PopOut p={p} sx={200} sy={261} w={352} h={58} at={TYPE + 2} to={{ x: 560, y: 330, s: 1.75, r: -2 }}>
        <div style={{ width: 352, height: 58, borderRadius: 14, background: "#fff", border: `2px solid ${GREEN}`, boxShadow: "0 0 0 4px rgba(0,191,99,0.12)", display: "flex", alignItems: "center", padding: "0 16px", boxSizing: "border-box", fontFamily: OUTFIT, fontSize: 19, fontWeight: 600, color: INK }}>
          {typed}
          <span style={{ width: 2, height: 22, marginLeft: 1, background: GREEN, opacity: Math.floor(f / 7) % 2 === 0 ? 1 : 0 }} />
        </div>
      </PopOut>
      <Progress x={560} y={560} p={r01(f, TYPE, SUCC, (u) => u)} label="Se postează…" right={`0:${String(secs).padStart(2, "0")}`} done={done} at={TYPE + 8} />
      <DoneCheck x={560} y={870} at={SUCC + 2} label="" />
      <Confetti at={SUCC + 2} x={560} y={700} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · verified taskers, offers flying out to you
const OFFERS = [
  { p: "mihai" as const, name: "Mihai D.", rating: "4,9", reviews: 312, dist: "1,2 km", price: "150 lei" },
  { p: "radu" as const, name: "Radu S.", rating: "4,8", reviews: 187, dist: "2,4 km", price: "170 lei" },
  { p: "andrei" as const, name: "Andrei P.", rating: "4,7", reviews: 96, dist: "3,1 km", price: "160 lei" },
];
const OfferCard: React.FC<{ o: (typeof OFFERS)[number] }> = ({ o }) => (
  <div style={{ width: 364, height: 106, ...card, borderRadius: 22, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", boxSizing: "border-box" }}>
    <Avatar person={o.p} size={62} dark={false} ring="#fff" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 19, fontWeight: 600 }}>
        {o.name} <Verified />
      </div>
      <div style={{ fontSize: 14, color: "#7b8480", fontWeight: 500, marginTop: 4 }}>★ {o.rating} ({o.reviews}) · {o.dist}</div>
    </div>
    <div style={{ fontSize: 22, fontWeight: 600, color: GREEN }}>{o.price}</div>
  </div>
);
export const K3: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B2_END;
  const ats = [w("taskeri", 1) - 2, w("taskeri", 4) - 4, w("taskeri", 6) - 4];
  const offers = OFFERS.map((o, i) => ({ ...o, at: ats[i] - 12 }));
  const p = idle(f, 960, 590, 780, "green", -6);
  const TO = [
    { x: 470, y: 330, s: 1.55, r: -5 },
    { x: 1460, y: 420, s: 1.55, r: 4 },
    { x: 520, y: 790, s: 1.5, r: 3 },
  ];
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen: <OffersScreen f={f} offers={offers} /> }]} />
      {OFFERS.map((o, i) => (
        <React.Fragment key={i}>
          <PopOut p={p} sx={200} sy={344 + i * 118 + 53} w={364} h={106} at={ats[i]} to={TO[i]}>
            <OfferCard o={o} />
          </PopOut>
          <Sparkle x={TO[i].x + (i === 1 ? -300 : 300)} y={TO[i].y - 80} size={30} t={Math.sin(Math.PI * clamp01((f - ats[i] - 8) / 24))} rot={(f - ats[i]) * 4} />
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · choose him, talk to him, pay — safely
export const K4: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B3_END;
  const s2 = w("alegi", 5) - 5, s3 = w("alegi", 11) - 5;
  const sp2 = spin(f, s2 - 9, 18), sp3 = spin(f, s3 - 9, 18);
  const shot = sp3.past ? 2 : sp2.past ? 1 : 0;
  const base = idle(f, 1300, 580, 800, "green", -18);
  const p: P3 = { ...base, ry: base.ry + sp2.ry + sp3.ry };
  const blur = sp2.blur + sp3.blur;
  const pick = w("alegi", 4) - 2;
  const payTap = w("alegi", 12) - 2;
  const paid = r01(f, payTap + 2, payTap + 14);
  const msgs = [
    { t: "Salut! Pot veni azi la 18:00.", at: s2 + 4 },
    { t: "Perfect, te aștept!", me: true, at: s2 + 20 },
    { t: "Îmi iau sculele. Rezolvăm repede.", at: s2 + 36 },
  ];
  const screen = shot === 0 ? <><ProfileScreen f={f - b0} press={Math.sin(Math.PI * clamp01((f - pick) / 8))} /><Touch x={200} y={772} at={pick} dark /></> : shot === 1 ? <ChatScreen f={f} msgs={msgs} /> : <PayScreen f={f} scan={r01(f, payTap, payTap + 8)} paid={r01(f, w("alegi", 14) - 4, w("alegi", 14) + 12, (u) => u)} />;
  const bw = lerp(420, 470, paid);
  return (
    <AbsoluteFill>
      <LightBg />
      <SpinSplash at={s2 - 2} x={1300} y={570} seed={7} />
      <SpinSplash at={s3 - 2} x={1300} y={570} seed={9} color="#0d3b24" light="#155a37" />
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <Phones slots={[{ p, screen }]} />
      </AbsoluteFill>
      {shot === 0 && (
        <PopOut p={p} sx={200} sy={150} w={400} h={300} at={b0 + 8} to={{ x: 620, y: 470, s: 1.25, r: -3 }} back={s2 - 10}>
          <div style={{ width: 400, height: 300, borderRadius: 30, overflow: "hidden", position: "relative", background: "#fff" }}>
            <Img src={staticFile("images/people/mihai.webp")} style={{ width: 400, height: 300, objectFit: "cover", objectPosition: "50% 30%" }} />
            <div style={{ position: "absolute", left: 16, bottom: 16, padding: "10px 16px", borderRadius: 18, background: "rgba(255,255,255,0.95)", fontFamily: OUTFIT, display: "flex", alignItems: "center", gap: 8, fontSize: 24, fontWeight: 600, color: INK }}>
              Mihai D. <Verified size={22} /> <span style={{ fontSize: 18, color: "#7b8480", fontWeight: 500 }}>★ 4,9 · 312 task-uri</span>
            </div>
          </div>
        </PopOut>
      )}
      {shot === 1 &&
        msgs.map((m, i) => (
          <PopOut key={i} p={p} sx={m.me ? 290 : 130} sy={200 + i * 70} w={300} h={64} at={m.at + 2} to={{ x: m.me ? 760 : 560, y: 360 + i * 140, s: 1.6, r: m.me ? 2 : -2 }} back={s3 - 10}>
            <div style={{ width: 300, height: 64, borderRadius: 26, background: m.me ? GREEN : "#fff", color: m.me ? "#fff" : INK, fontFamily: OUTFIT, fontSize: 19, fontWeight: 500, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", whiteSpace: "nowrap" }}>{m.t}</div>
          </PopOut>
        ))}
      {shot === 2 && (
        <PopOut p={p} sx={200} sy={700} w={bw} h={92} at={s3 + 2} to={{ x: 600, y: 520, s: 1.5 }}>
          <div style={{ position: "relative", width: bw, height: 92, borderRadius: 46, background: paid > 0.5 ? `linear-gradient(90deg, ${GREEN}, ${GREEN2})` : "#111", color: "#fff", fontFamily: OUTFIT, fontSize: 30, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transform: `scale(${1 - 0.06 * Math.sin(Math.PI * clamp01((f - payTap + 3) / 8))})`, boxShadow: paid > 0.5 ? "0 20px 50px rgba(0,191,99,0.4)" : "0 20px 50px rgba(0,0,0,0.25)" }}>
            {paid > 0.5 ? <><Sym n="shield" size={30} color="#fff" /> Plată protejată</> : <><Sym n="lock" size={26} color="#fff" /> Plătește 150 lei</>}
            <Touch x={bw / 2} y={46} at={payTap} />
          </div>
        </PopOut>
      )}
      {shot === 2 && [0, 1, 2].map((i) => <Sparkle key={i} x={600 + [-300, 290, 120][i]} y={520 + [-120, -90, 130][i]} size={[40, 28, 22][i]} t={Math.sin(Math.PI * clamp01((f - payTap - 6 - i * 3) / 26))} rot={(f - payTap) * 5} />)}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · no cash (nothing to show — the words)
export const K5: React.FC = () => {
  const f = useCurrentFrame();
  const L = vo("cash");
  const strike = r01(f, w("cash", 3) - 4, w("cash", 3) + 8);
  const toks: Tok[] = [
    { t: "Fără", at: L[0][1], accent: true },
    { t: "cash", at: L[1][1], strike },
  ];
  return (
    <AbsoluteFill>
      <LightBg />
      <RefText toks={toks} size={150} y={470} out={B5_END - 10} />
      <RefText toks={W2T(L.slice(2))} size={64} y={640} color="#86868b" out={B5_END - 8} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · follow it live, to "done"
export const K6: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B5_END;
  const t = r01(f, b0 + 4, w("urmaresti", 5), (u) => u);
  const gata = w("urmaresti", 8) - 2;
  const step = f >= gata ? 4 : f >= w("urmaresti", 6) - 2 ? 3 : t >= 1 ? 2 : 1;
  const done = r01(f, gata, gata + 14, (u) => u);
  const p = idle(f, 1300, 580, 800, "green", -18);
  const pp = [0.25, 0.25, 0.5, 0.75, 1][step];
  const eta = Math.max(0, Math.round(lerp(8, 0, t)));
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen: <TrackScreen f={f} t={t} step={step} done={done} /> }]} />
      <PopOut p={p} sx={200} sy={470} w={360} h={70} at={b0 + 10} to={{ x: 600, y: 300, s: 1.6, r: -2 }} back={gata - 6}>
        <div style={{ width: 360, height: 70, ...card, borderRadius: 35, display: "flex", alignItems: "center", gap: 12, padding: "0 18px", boxSizing: "border-box", fontSize: 22, fontWeight: 600 }}>
          <Avatar person="mihai" size={46} dark={false} ring="#fff" />
          {step >= 3 ? "Mihai lucrează" : eta > 0 ? `Ajunge în ${eta} min` : "A ajuns"}
          <div style={{ marginLeft: "auto", width: 12, height: 12, borderRadius: 6, background: GREEN, opacity: 0.4 + 0.6 * Math.abs(Math.sin(f / 5)) }} />
        </div>
      </PopOut>
      <Progress x={600} y={560} p={lerp(0, pp, spring(clamp01((f - b0 - 14) / 20)))} label={["Acceptat", "Pe drum", "A ajuns", "În lucru", "Gata"][step]} right={`${Math.round(pp * 100)}%`} done={0} at={b0 + 14} />
      <DoneCheck x={600} y={880} at={gata + 2} />
      <Confetti at={gata + 2} x={600} y={720} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6 · no hassle, no stress (the words, then the paint)
export const K7: React.FC = () => {
  const f = useCurrentFrame();
  const b0 = B6_END;
  const A = vo("fara1"), B = vo("fara2");
  const cut = w("fara2", 0) - 6;
  return (
    <AbsoluteFill>
      <LightBg />
      <RefText toks={W2T(A)} size={110} out={cut} />
      <RefText toks={W2T(B, [1])} size={150} out={B7_END - 6} />
      <Splash x={960} y={560} t={clamp01((f - (B7_END - 10)) / 10)} R={1500} color={GREEN} light={GREEN2} seed={41} drops={22} />
      <div style={{ display: "none" }}>{b0}</div>
    </AbsoluteFill>
  );
};

/** the beat montage, kept — its brand switch played as the new paint drop, fading to the dark of act III */
const MontageEnd: React.FC = () => {
  const f = useCurrentFrame();
  const k0 = Math.ceil((B7_END - D0) / BEATS);
  const sw = bt(k0 + 5);
  if (f < sw) return <B8 />;
  return <PremiumDrop from={sw} offset={0} fadeTo={BRIDGE} hit={false} />;
};

export const ACT2_3D: React.FC = () => (
  <>
    <Win still from={B1_END} to={B2_END}><K2 /></Win>
    <Win still from={B2_END} to={B3_END}><K3 /></Win>
    <Win still from={B3_END} to={B4_END}><K4 /></Win>
    <Win still from={B4_END} to={B5_END}><K5 /></Win>
    <Win still from={B5_END} to={B6_END}><K6 /></Win>
    <Win still from={B6_END} to={B7_END}><K7 /></Win>
    <Win still from={B7_END} to={BRIDGE}><MontageEnd /></Win>
  </>
);
