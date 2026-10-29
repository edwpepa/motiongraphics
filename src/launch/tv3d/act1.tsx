import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { iw, S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "../introTimes";
import { A10_END } from "../scenes";
import { w } from "../timeline";
import { BankScreen, CalendarScreen, CallScreen, ContactsScreen, HANDLY_ICON, HeartScreen, HomeScreen, LockScreen, MessagesScreen, Notif, RemindersScreen, SearchScreen, ShopScreen, Sym } from "../tv/ios";
import { vo } from "../tv/kit";
import { DarkBg, INK, io3, LightBg, outExpo, PhotoMask, r01, RefText, spring, Tok } from "./kit3d";
import { P3, Phones, PhoneColor, screenScale, screenToFrame, SCR_H, SCR_W } from "./phone3d";
import { OUTFIT } from "../tv/font";

// ------------------------------------------------------------------ helpers shared by the 3D acts
/** idle life of a phone: it never stops moving */
export const idle = (f: number, x: number, y: number, h: number, color: PhoneColor = "teal", ry0 = -16): P3 => ({
  x: x + Math.sin(f / 90) * 10,
  y: y + Math.sin(f / 63) * 8,
  rx: 4 + 3 * Math.sin(f / 80),
  ry: ry0 + 9 * Math.sin(f / 97),
  rz: 1.6 * Math.sin(f / 121),
  h: h * (1 + 0.01 * Math.sin(f / 70)),
  color,
});
/** a full turn of the phone; the screen and finish change while its back is to us */
export const spin = (f: number, at: number, len = 18) => {
  const t = clamp01((f - at) / len);
  const e = io3(t);
  const v = t > 0 && t < 1 ? Math.abs(io3(t + 0.02) - io3(t - 0.02)) / 0.04 : 0;
  return { ry: 360 * e, past: t >= 0.5, blur: v * 5 };
};
export const mixP = (a: P3, b: P3, t: number): P3 => ({ ...b, x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z ?? 0, b.z ?? 0, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t), h: lerp(a.h, b.h, t) });
/** an element of the screen lifting out of it towards the viewer: it starts exactly where it sits on the glass */
export const PopOut: React.FC<{ p: P3; sx: number; sy: number; w: number; h: number; at: number; to: { x: number; y: number; s: number; r?: number }; back?: number; children: React.ReactNode; dur?: number }> = ({ p, sx, sy, w, h, at, to, back, children, dur = 22 }) => {
  const f = useCurrentFrame();
  const t = clamp01((f - at) / dur);
  if (t <= 0) return null;
  const b = back === undefined ? 0 : r01(f, back, back + 14, io3);
  const e = spring(t) * (1 - b);
  const [fx, fy] = screenToFrame(p, sx, sy);
  const k = screenScale(p);
  const x = lerp(fx, to.x, e), y = lerp(fy, to.y, e), s = lerp(k, to.s, e);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h, transformOrigin: "50% 50%", transform: `translate(${x - w / 2}px, ${y - h / 2}px) scale(${s}) rotate(${(to.r ?? 0) * e}deg)`, filter: `drop-shadow(0 ${30 * e}px ${50 * e}px rgba(10,30,20,${0.22 * e}))`, opacity: clamp01(t * 4) * (1 - clamp01((b - 0.85) / 0.15)) }}>
      {children}
    </div>
  );
};
/** the white dot of a finger on glass, in screen coordinates */
export const Touch: React.FC<{ x: number; y: number; at: number; dark?: boolean }> = ({ x, y, at, dark }) => {
  const f = useCurrentFrame();
  const t = (f - at + 6) / 18;
  if (t < 0 || t > 1) return null;
  const down = Math.sin(t * Math.PI);
  return <div style={{ position: "absolute", left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: dark ? `rgba(20,24,22,${0.25 * down})` : `rgba(255,255,255,${0.55 * down})`, border: `2px solid rgba(255,255,255,${0.7 * down})`, transform: `scale(${0.8 + 0.3 * down})`, zIndex: 50 }} />;
};
const W2T = (ws: [string, number][], accent: number[] = []): Tok[] => ws.map(([t, at], i) => ({ t, at, accent: accent.includes(i) }));
const capT = (ws: [string, number][]): [string, number][] => ws.map(([t, at], i) => [i === 0 ? t.charAt(0).toLocaleUpperCase("ro-RO") + t.slice(1) : t, at]);
const Box: React.FC<{ w: number; h: number; children: React.ReactNode; bg?: string; r?: number }> = ({ w: ww, h, children, bg, r = 26 }) => <div style={{ position: "relative", width: ww, height: h, borderRadius: r, background: bg, overflow: "visible" }}>{children}</div>;

// ------------------------------------------------------------------ 1 · "Problems around the house" — then the phone arrives, and the reminders spill out of it
const NOTES: Array<[Parameters<typeof Notif>[0]["k"], string, string, string]> = [
  ["reminders", "Mementouri", "Repară priza din bucătărie", "Întârziat de 3 săptămâni"],
  ["reminders", "Mementouri", "Tunde iarba", "Întârziat de 2 săptămâni"],
  ["messages", "Mama", "Mama", "Ai rezolvat cu priza?"],
  ["reminders", "Mementouri", "Montează dulapul", "Stă în cutie de o lună"],
  ["mail", "Asociația de proprietari", "Spațiul verde din fața blocului", "Vă rugăm să tundeți iarba."],
];
const NotifCard: React.FC<{ i: number; dark?: boolean }> = ({ i, dark = true }) => (
  <Box w={SCR_W} h={96}>
    <Notif k={NOTES[i][0]} app={NOTES[i][1]} title={NOTES[i][2]} body={NOTES[i][3]} dark={dark} style={{ top: 0 }} />
  </Box>
);
const lockNotifs = (f: number, start: number, gap = 9) =>
  NOTES.map(([k, app, t, b], i) => {
    const at = start + i * gap;
    const p = outExpo(clamp01((f - at) / 12));
    if (p <= 0) return null;
    const above = NOTES.filter((_, j) => j > i && f >= start + j * gap).length;
    return <Notif key={i} k={k} app={app} title={t} body={b} style={{ top: 300 + above * 92 - (1 - p) * 60, opacity: clamp01(p * 2) * (above > 3 ? 0 : 1), transform: `scale(${(0.9 + 0.1 * p) * (1 - above * 0.02)})`, zIndex: 10 + i }} badge={k === "reminders" ? String(i + 1) : undefined} />;
  });
export const POUT = [
  { x: 470, y: 300, s: 1.25, r: -4 },
  { x: 1460, y: 360, s: 1.2, r: 3 },
  { x: 520, y: 780, s: 1.15, r: 3 },
];
export const G1: React.FC = () => {
  const f = useCurrentFrame();
  const P = vo("probleme");
  const arrive = P[3][1] - 8;
  const e = r01(f, arrive, arrive + 34, (u) => 1 - Math.pow(1 - u, 3));
  const base = idle(f, 960, 560, 820);
  const p: P3 = { ...base, y: lerp(1700, base.y, e), ry: lerp(-200, base.ry, e), rx: lerp(28, base.rx, e), rz: lerp(-12, base.rz, e) };
  const pops = [arrive + 46, arrive + 54, arrive + 62];
  return (
    <AbsoluteFill>
      <LightBg />
      <RefText toks={W2T(P.slice(0, 3), [0])} size={96} out={arrive - 4} />
      <Phones slots={[{ p, screen: <LockScreen f={f} time="23:47">{lockNotifs(f, arrive + 16)}</LockScreen> }]} />
      {pops.map((at, i) => (
        <PopOut key={i} p={p} sx={200} sy={348} w={SCR_W} h={96} at={at} to={POUT[i]} back={S1_END + 2}>
          <NotifCard i={[0, 1, 3][i]} dark={false} />
        </PopOut>
      ))}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 2 · the socket, the grass, the cabinet — the real things, opening out of masks around the list
const REMS = [
  { t: "Repară priza din bucătărie", s: "Nu merge de 3 săptămâni", late: true },
  { t: "Tunde iarba", s: "Întârziat · 2 săptămâni", late: true },
  { t: "Montează dulapul", s: "În cutie de o lună", late: true },
  { t: "Schimbă becul de pe hol", s: "Mâine" },
  { t: "Sună administratorul", s: "Fără dată" },
];
const Tag: React.FC<{ title: string; sub: React.ReactNode; at: number }> = ({ title, sub, at }) => {
  const f = useCurrentFrame();
  const p = spring(clamp01((f - at) / 18));
  return (
    <div style={{ position: "absolute", left: 22, bottom: 22, padding: "12px 18px", borderRadius: 18, background: "rgba(255,255,255,0.92)", boxShadow: "0 10px 30px rgba(0,0,0,0.18)", fontFamily: OUTFIT, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + 0.1 * p})`, opacity: clamp01(p * 2), transformOrigin: "0% 100%" }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "#ff3b30", marginTop: 2 }}>{sub}</div>
    </div>
  );
};
export const G2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S1_END;
  const t = [iw("priza", 0) - 4, iw("iarba", 0) - 4, iw("dulap", 0) - 4];
  const hi = t.map((at, i) => r01(f, at, at + 8) * (i < 2 ? 1 - r01(f, t[i + 1], t[i + 1] + 8) : 1));
  const p = { ...idle(f, 960, 560, 760), ry: -8 + 6 * Math.sin(f / 60) };
  const days = Math.round(lerp(1, 31, r01(f, iw("dulap", 4), iw("dulap", 6) + 4, (u) => u)));
  const out = S2_END - 16;
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen: <RemindersScreen items={REMS} hi={hi} f={f} /> }]} />
      <PhotoMask src="images/photos/socket.jpg" x={430} y={330} w={580} h={304} kind="circle" inAt={t[0]} outAt={out} tilt={10} caption={<Tag title="Priză stricată" sub="de 3 săptămâni" at={t[0] + 12} />} />
      <PhotoMask src="images/photos/grass.jpg" x={1490} y={310} w={580} h={304} kind="wipe" inAt={t[1]} outAt={out + 3} tilt={-10} caption={<Tag title="Iarbă netunsă" sub="de 2 săptămâni" at={t[1] + 12} />} />
      <PhotoMask src="images/photos/cabinet.jpg" x={1490} y={780} w={580} h={304} kind="card" inAt={t[2]} outAt={out + 6} tilt={-8} caption={<Tag title="Dulap nemontat" sub={<span style={{ fontVariantNumeric: "tabular-nums" }}>de {days} {days === 1 ? "zi" : "zile"}</span>} at={t[2] + 12} />} />
      {/* the notifications from the opening drift off as the photos arrive */}
      {[0, 1, 2].map((i) => {
        const k = r01(f, a0 - 2 + i * 3, a0 + 14 + i * 3, io3);
        if (k >= 1) return null;
        const q = POUT[i];
        return (
          <div key={i} style={{ position: "absolute", left: q.x - SCR_W / 2, top: q.y - 48 - k * 60, width: SCR_W, height: 96, transform: `scale(${q.s * (1 - 0.2 * k)}) rotate(${q.r}deg)`, opacity: 1 - k, filter: `blur(${k * 10}px)` }}>
            <NotifCard i={[0, 1, 3][i]} dark={false} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · no time, no tools, no nerves — three turns of the phone, each a new screen and a new finish
export const G3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S2_END;
  const c2 = iw("sculele", 0) - 13, c3 = iw("nervii", 0) - 13;
  const s1 = spin(f, a0 - 2), s2 = spin(f, c2), s3 = spin(f, c3);
  const shot = s3.past ? 3 : s2.past ? 2 : s1.past ? 1 : 0;
  const colors: PhoneColor[] = ["teal", "white", "black", "teal"];
  const base = idle(f, 960, 570, 800, colors[shot], -10);
  const p: P3 = { ...base, ry: base.ry + s1.ry + s2.ry + s3.ry };
  const blur = s1.blur + s2.blur + s3.blur;
  const screen =
    shot === 0 ? <RemindersScreen items={REMS} hi={[0, 0, 1]} f={f} /> : shot === 1 ? <CalendarScreen f={f} fill={r01(f, a0 + 6, a0 + 30, (u) => u)} banner={r01(f, a0 + 22, a0 + 32)} /> : shot === 2 ? <ShopScreen f={f} n={(f - c2 - 6) / 4} total={2886 * r01(f, c2 + 8, c2 + 28, (u) => u)} /> : <HeartScreen f={f} bpm={lerp(76, 124, r01(f, c3 + 6, c3 + 36, (u) => 1 - (1 - u) ** 2))} t={r01(f, c3 + 6, c3 + 36, (u) => u)} />;
  return (
    <AbsoluteFill>
      <LightBg />
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
        <Phones slots={[{ p, screen }]} />
      </AbsoluteFill>
      {shot === 1 && (
        <PopOut p={p} sx={200} sy={786} w={280} h={52} at={a0 + 30} to={{ x: 1440, y: 420, s: 2.3, r: -3 }} back={c2 - 2}>
          <div style={{ width: 280, height: 52, borderRadius: 26, background: "#ff3b30", color: "#fff", fontFamily: OUTFIT, fontSize: 22, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Sym n="clock" size={20} color="#fff" /> Nicio oră liberă
          </div>
        </PopOut>
      )}
      {shot === 2 && (
        <PopOut p={p} sx={200} sy={772} w={368} h={96} at={c2 + 26} to={{ x: 480, y: 640, s: 1.8, r: 3 }} back={c3 - 2}>
          <div style={{ width: 368, height: 96, borderRadius: 22, background: "#000", color: "#fff", fontFamily: OUTFIT, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", boxSizing: "border-box" }}>
            <div>
              <div style={{ fontSize: 15, opacity: 0.6 }}>Total scule</div>
              <div style={{ fontSize: 32, fontWeight: 600 }}>2.886 lei</div>
            </div>
            <Sym n="cart" size={30} color="#fff" />
          </div>
        </PopOut>
      )}
      {shot === 3 && (
        <PopOut p={p} sx={150} sy={175} w={300} h={110} at={c3 + 30} to={{ x: 1450, y: 470, s: 2.1, r: -2 }}>
          <div style={{ width: 300, height: 110, borderRadius: 26, background: "#fff", fontFamily: OUTFIT, display: "flex", alignItems: "center", gap: 14, padding: "0 22px", boxSizing: "border-box" }}>
            <Sym n="heart" size={40} color="#ff375f" fill="#ff375f" w={1} />
            <div style={{ fontSize: 56, fontWeight: 600, color: "#ff375f", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{Math.round(lerp(76, 124, r01(f, c3 + 6, c3 + 36, (u) => 1 - (1 - u) ** 2)))}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "#8e8e93" }}>BPM</div>
          </div>
        </PopOut>
      )}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 4 · and you keep snoozing — the reminder leaps out, the button keeps getting pressed
export const G4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S3_END;
  const taps = [iw("amani", 0) - 3, iw("amani", 1) - 2, iw("amani", 2) + 3];
  const k = taps.filter((t) => f >= t + 2).length;
  const press = taps.reduce((m, t) => Math.max(m, Math.sin(Math.PI * clamp01((f - t + 3) / 7))), 0);
  const bump = taps.reduce((m, t) => Math.max(m, Math.sin(Math.PI * clamp01((f - t - 2) / 8))), 0);
  const p = { ...idle(f, 1180, 600, 760, "teal", -22) };
  const card = (
    <Box w={SCR_W} h={150}>
      <Notif
        k="reminders"
        app="Mementouri"
        title="Montează dulapul"
        body={`Amânat de ${12 + k} ori`}
        style={{ top: 0, transform: `scale(${1 + 0.03 * bump})` }}
        action={
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {["Amână 1 oră", "Gata"].map((b, i) => (
              <div key={b} style={{ flex: 1, height: 38, borderRadius: 19, background: `rgba(255,255,255,${i === 0 ? 0.2 + 0.35 * press : 0.1})`, transform: i === 0 ? `scale(${1 - 0.06 * press})` : undefined, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600 }}>
                {b}
              </div>
            ))}
          </div>
        }
      />
    </Box>
  );
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen: <LockScreen f={f} time="23:59">{<div style={{ position: "absolute", top: 268, left: 0, width: SCR_W }}>{card}</div>}</LockScreen> }]} />
      <PopOut p={p} sx={200} sy={343} w={SCR_W} h={150} at={a0 - 2} to={{ x: 620, y: 520, s: 2.0, r: -2 }} dur={18}>
        <div style={{ position: "relative", width: SCR_W, height: 150 }}>
          <div style={{ position: "absolute", inset: -14, borderRadius: 36, background: "linear-gradient(180deg,#0b1530,#070a17)" }} />
          {card}
          {taps.map((t, i) => (
            <Touch key={i} x={108} y={128} at={t} />
          ))}
        </div>
      </PopOut>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · and you hope it fixes itself (nothing to show: the words alone)
export const G5: React.FC = () => {
  const f = useCurrentFrame();
  const S = vo("speri"), C = vo("cumva"), G = vo("singur");
  const toks = W2T([...S, ...C, ...G], [5]);
  return (
    <AbsoluteFill>
      <LightBg />
      <RefText toks={toks.slice(0, 4)} size={92} y={470} out={S5_END - 12} />
      <RefText toks={toks.slice(4)} size={92} y={590} out={S5_END - 10} />
      <div style={{ display: "none" }}>{f}</div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 6 · nobody to call — the search bar lifts out, the answer stays empty
export const G6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S5_END;
  const q = "meșter de încredere";
  const t0 = w("lumea", 2), t1 = w("lumea", 7) + 4;
  const n = Math.round(q.length * r01(f, t0, t1, (u) => u));
  const none = r01(f, t1 + 2, t1 + 12);
  const p = idle(f, 960, 610, 780, "teal", -6);
  const field = (
    <div style={{ width: 368, height: 42, borderRadius: 12, background: "#eeeef0", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 18, fontFamily: OUTFIT, boxSizing: "border-box", color: INK }}>
      <Sym n="search" size={18} color="#8e8e93" />
      <span>{q.slice(0, n)}</span>
      <span style={{ width: 2, height: 22, background: "#0a84ff", opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0, marginLeft: -6 }} />
    </div>
  );
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen: <ContactsScreen f={f} query={q.slice(0, n)} caret={Math.floor(f / 8) % 2 === 0} none={none} list={1 - r01(f, t0, t0 + 8)} /> }]} />
      <PopOut p={p} sx={200} sy={137} w={368} h={42} at={a0 + 6} to={{ x: 960, y: 170, s: 2.4 }}>
        <div style={{ boxShadow: "0 0 0 8px rgba(255,255,255,0.9)", borderRadius: 12, background: "#fff" }}>{field}</div>
      </PopOut>
      <PopOut p={p} sx={200} sy={350} w={300} h={70} at={t1 + 10} to={{ x: 960, y: 930, s: 1.9 }}>
        <div style={{ width: 300, height: 70, borderRadius: 35, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", fontFamily: OUTFIT, fontSize: 26, fontWeight: 600, color: INK, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <Sym n="search" size={24} color="#ff3b30" /> Niciun rezultat
        </div>
      </PopOut>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7 · searching, calling, haggling — a tunnel of phones, the words in the middle
export const G7: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S6_END;
  const O = vo("obositor");
  const t = (f - a0) / 30;
  const walls: Array<{ x: number; y: number; rx: number; ry: number; rz: number }> = [
    { x: 960 + 560, y: 540, rx: 0, ry: -64, rz: 0 },
    { x: 960 - 560, y: 540, rx: 0, ry: 64, rz: 0 },
    { x: 960, y: 540 - 400, rx: 66, ry: 0, rz: 90 },
    { x: 960, y: 540 + 400, rx: -66, ry: 0, rz: 90 },
  ];
  const screens = [
    <SearchScreen key="s" f={f} n={6} scroll={60} />,
    <CallScreen key="c" f={f} name="Electrician NON-STOP" status={Math.floor(f / 20) % 2 ? "Apel nereușit" : "Se apelează…"} failed={Math.floor(f / 20) % 2} />,
    <MessagesScreen key="m" f={f} name="Meseriași Rapid" bubbles={[{ t: "Cât ar costa o priză?", me: true, at: 0 }, { t: "500 + deplasarea", at: 0 }, { t: "E cam mult…", me: true, at: 0 }, { t: "Ultimul preț 450. Doar cash.", at: 0 }]} />,
  ];
  const slots = [] as { p: P3; screen: React.ReactNode; shadow: boolean }[];
  const DEPTH = 4200;
  for (let i = 0; i < 12; i++) {
    const wall = walls[i % 4];
    const z = -DEPTH + (((Math.floor(i / 4) * DEPTH) / 3 + t * 900) % DEPTH);
    const fade = clamp01((z + DEPTH) / 600) * clamp01((900 - z) / 500);
    if (fade <= 0) continue;
    slots.push({ p: { x: wall.x, y: wall.y, z, rx: wall.rx, ry: wall.ry, rz: wall.rz, h: 820, color: (["white", "black", "teal"] as PhoneColor[])[i % 3], opacity: fade }, screen: screens[i % 3], shadow: false });
  }
  const verbs: Tok[] = [
    { t: "Cauți.", at: O[4][1], accent: true },
    { t: "Suni.", at: O[6][1], accent: false },
    { t: "Negociezi.", at: O[8][1], accent: true },
  ];
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={slots} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 30% 30% at 50% 50%, rgba(243,245,248,0.95) 0%, rgba(243,245,248,0) 100%)" }} />
      <RefText toks={W2T(capT(O.slice(0, 3)))} size={84} out={O[4][1] - 10} />
      <RefText toks={verbs} size={84} out={S7_END - 10} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 8 · the advance — and the number that vanishes
export const G8: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S7_END;
  const bank = w("rogi", 5) - 8, gone = w("rogi", 11) - 2;
  const glitch = f >= gone && f < gone + 12 ? (Math.floor(f / 2) % 2 ? 1 : -1) * (1 - (f - gone) / 12) : 0;
  const base = idle(f, 960, 580, 800, "black", -8);
  const p = { ...base, x: base.x + glitch * 14 };
  const scam = "Meșter Ionel";
  const back = w("rogi", 8);
  const screen =
    f < back ? (
      <MessagesScreen f={f} name={scam} bubbles={[{ t: "Pot veni mâine dimineață.", at: a0 + 2 }, { t: "Trimite-mi un avans de 400 lei pentru piese.", at: a0 + 12 }, { t: "Ok, ți-l trimit acum.", me: true, at: a0 + 22 }]} />
    ) : (
      <MessagesScreen
        f={f}
        name={scam}
        bubbles={[
          { t: "Trimite-mi un avans de 400 lei pentru piese.", at: 0 },
          { t: "Ok, ți-l trimit acum.", me: true, at: 0 },
          { t: "Gata, ți-am trimis. Vii mâine?", me: true, at: back + 2 },
          { t: "Alo?", me: true, at: back + 16 },
        ]}
        status="Nelivrat"
        statusAt={gone}
        blocked={r01(f, gone + 4, gone + 14)}
      />
    );
  return (
    <AbsoluteFill>
      <LightBg />
      <Phones slots={[{ p, screen }]} />
      <PopOut p={p} sx={200} sy={430} w={300} h={300} at={bank} to={{ x: 470, y: 470, s: 1.5, r: -4 }}>
        <div style={{ width: 300, height: 300, borderRadius: 36, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: -50, top: -200, width: 400, height: 863 }}>
            <BankScreen f={f} sent={r01(f, bank + 10, bank + 20)} to={scam} amount="400 lei" />
          </div>
        </div>
      </PopOut>
      <PopOut p={p} sx={200} sy={735} w={360} h={84} at={gone + 6} to={{ x: 1440, y: 700, s: 1.9, r: 2 }}>
        <div style={{ width: 360, height: 84, borderRadius: 22, background: "#fff2f1", border: "2px solid rgba(255,59,48,0.35)", fontFamily: OUTFIT, fontSize: 21, fontWeight: 600, color: "#ff3b30", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 18px", boxSizing: "border-box" }}>
          Acest număr nu mai este disponibil.
        </div>
      </PopOut>
      {glitch !== 0 && <AbsoluteFill style={{ background: "rgba(255,59,48,0.12)", mixBlendMode: "multiply" }} />}
      <AbsoluteFill style={{ background: "#03100a", opacity: r01(f, A10_END - 6, A10_END) }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9 · over the start of the charge: Handly on the home screen, a tap, and we dive into the icon
export const G9: React.FC<{ from: number }> = ({ from }) => {
  const f = useCurrentFrame();
  const tap = from + 9;
  if (f > tap + 20) return null;
  const dive = r01(f, tap + 2, tap + 18, (u) => u * u * u);
  const h0 = 820, h = h0 * (1 + 10 * dive);
  const k = (h * 0.95557) / SCR_H;
  const ix = HANDLY_ICON.x, iy = HANDLY_ICON.y;
  const p: P3 = { x: 960 - (ix - SCR_W / 2) * k * dive, y: 560 - (iy - SCR_H / 2) * k * dive, rx: 0, ry: 0, rz: 0, h, color: "green" };
  const inP = outExpo(clamp01((f - from) / 8));
  return (
    <AbsoluteFill style={{ opacity: 1 - r01(f, tap + 14, tap + 20, (u) => u) }}>
      <DarkBg />
      <Phones dark slots={[{ p: { ...p, y: p.y + (1 - inP) * 80 }, screen: <><HomeScreen f={f} glow={clamp01((f - from) / 6)} press={Math.sin(Math.PI * clamp01((f - tap + 3) / 8))} others={1 - dive} /><Touch x={ix} y={iy} at={tap} /></> }]} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${dive}) 0%, rgba(0,60,30,${dive}) 40%, rgba(0,0,0,${dive * 0.8}) 80%)` }} />
    </AbsoluteFill>
  );
};
