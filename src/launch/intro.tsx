import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Glyph } from "../explainer/components/Icons";
import { Phone, PHONE_H, PHONE_W } from "../explainer/components/Phone";
import { clamp01, lerp, seeded } from "../explainer/lib/anim";
import { FONT } from "../explainer/theme";
import { AText, AW, Brackets, Cam, Dark, enter, GREEN, iEnd, INK, INK2, inOutQuint, iw, iWords, Light, MINT, outExpo, outQuart, r01 } from "./apple";
import { w, words } from "./timeline";

import { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "./introTimes";
export { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END };

const measure = (() => {
  let c: CanvasRenderingContext2D | null = null;
  return (t: string, size: number, weight = 600, track = -0.035) => {
    if (!c) c = document.createElement("canvas").getContext("2d");
    if (!c) return t.length * size * 0.55;
    c.font = `${weight} ${size}px Inter`;
    return c.measureText(t).width + Array.from(t).length * track * size;
  };
})();
const wordsOf = (key: string, lead = 3) => words(key as "lumea").map(([t, f]) => [t, f - lead] as AW);
const RED = "#ff453a";

// ------------------------------------------------------------------ S1: "Probleme prin casă care îți dau bătăi de cap?"
export const S1: React.FC = () => {
  const f = useCurrentFrame();
  const W = iWords("probleme");
  const SZ = 132;
  const full = W.map(([t]) => t).join(" ");
  const wAll = measure(full, SZ);
  const wA = measure("Probleme prin casă", SZ);
  const aC = -wAll / 2 + wA / 2;
  const pull = r01(f, iw("probleme", 3) - 8, iw("probleme", 3) + 20);
  const fit = Math.min(1, 1480 / wAll);
  const through = r01(f, S1_END - 13, S1_END, (t) => t * t * t);
  const bx = -wAll / 2 + measure("Probleme prin casă care îți dau ", SZ) + measure("bătăi de cap?", SZ) / 2;
  const cam = (fr: number) => {
    const pl = r01(fr, iw("probleme", 3) - 8, iw("probleme", 3) + 20);
    const th = r01(fr, S1_END - 13, S1_END, (t) => t * t * t);
    const s = lerp(1 + 0.03 * clamp01(fr / 60), fit * (1 + 0.04 * clamp01((fr - iw("probleme", 3)) / 60)), pl) * (1 + 5 * th);
    return { s, x: lerp(lerp(aC, 0, pl), bx, th), y: Math.sin(fr / 50) * 4 };
  };
  return (
    <AbsoluteFill>
      <Light />
      <Cam at={cam}>
        <Brackets x={960 + bx} y={540} w={measure("bătăi de cap?", SZ) + 50} h={SZ * 1.3} p={r01(f, iw("probleme", 6) - 4, iw("probleme", 6) + 12, outExpo)} />
        <AText words={W} size={SZ} hi={{ 6: pull > 0.5 ? "#00a852" : INK, 7: "#00a852", 8: "#00a852" }} />
      </Cam>
      <AbsoluteFill style={{ background: "#020303", opacity: through * through }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S2: a broken socket, an uncut lawn, a cabinet still in its box
const glyphs: Record<string, (f: number) => React.ReactNode> = {
  socket: (f) => (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="9.3" cy="12" r="1.25" />
      <circle cx="14.7" cy="12" r="1.25" />
      <path d="M15.5 3.5 13.6 6.6l1.9 1.1-1.6 2.6" stroke={GREEN} />
      <circle cx="17.2" cy="6" r={0.5 + 0.35 * Math.abs(Math.sin(f / 3))} fill={GREEN} stroke="none" />
    </>
  ),
  grass: (f) => (
    <>
      {[[3, 9, -0.6], [6, 4, 0.4], [9, 7, -0.3], [12, 2, 0.5], [15, 6, -0.4], [18, 3, 0.6], [21, 8, -0.2]].map(([x, top, bend], i) => (
        <path key={i} d={`M${x} 20 Q ${x + bend * 2 + Math.sin(f / 14 + i) * 0.6} ${(20 + top) / 2} ${x + bend * 3 + Math.sin(f / 12 + i) * 0.9} ${top}`} />
      ))}
      <path d="M1.5 20.5h21" />
    </>
  ),
  box: () => (
    <>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
      <path d="M12 22V12" />
      <path d="m3.3 7 7.7 4.73a2 2 0 0 0 2 0L20.7 7" />
      <path d="m7.5 4.6 8.9 5.1" stroke={GREEN} />
    </>
  ),
};
const Tile: React.FC<{ g: string; size: number; f: number }> = ({ g, size, f }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.235,
      background: "linear-gradient(160deg, #2b302e 0%, #151817 55%, #0c0e0d 100%)",
      boxShadow: `0 ${size * 0.18}px ${size * 0.4}px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.14), inset 0 0 0 1px rgba(255,255,255,0.06)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${115 + Math.sin(f / 40) * 10}deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.07) 48%, rgba(255,255,255,0) 62%)` }} />
    <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#f5f7f6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {glyphs[g](f)}
    </svg>
  </div>
);
const TILE_X = [0, 760, 1520];
export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S1_END;
  const t1 = iw("iarba", 0) - 7, t2 = iw("dulap", 0) - 7, back = iw("dulap", 6) + 4;
  const cam = (fr: number) => {
    const p1 = r01(fr, t1, t1 + 11), p2 = r01(fr, t2, t2 + 11), pb = r01(fr, back, back + 22);
    const intro = r01(fr, a0 - 2, a0 + 14, outExpo);
    const s = lerp(1.6, 1, intro) * lerp(1 + 0.03 * clamp01((fr - a0) / 120), 0.56, pb);
    return { s, x: lerp(lerp(TILE_X[0] + p1 * 760 + p2 * 760, 760, pb), 0, 0), y: lerp(-40, 40, pb) };
  };
  const out = r01(f, S2_END - 10, S2_END, (t) => t * t);
  const days = Math.max(1, Math.round(30 * r01(f, iw("dulap", 2), iw("dulap", 6) + 2, (t) => t)));
  const labels: [string, AW[]][] = [["socket", iWords("priza")], ["grass", iWords("iarba")], ["box", iWords("dulap")]];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 20}px)` : undefined }}>
      <Dark />
      <Cam at={cam} blur={1.2}>
        {labels.map(([g, ws], i) => {
          const at = ws[0][1] - 4;
          return (
            <React.Fragment key={g}>
              <div style={{ position: "absolute", left: 960 + TILE_X[i] - 170, top: 430 - 170, ...enter(f, at, 18) }}>
                <Tile g={g} size={340} f={f} />
              </div>
              <AText words={ws} size={64} x={960 + TILE_X[i]} y={700} color="#f5f7f6" out={i < 2 ? back - 6 : undefined} />
            </React.Fragment>
          );
        })}
        {/* the cabinet's been waiting: a calendar counting the days */}
        <div style={{ position: "absolute", left: 960 + 1520 + 230, top: 430 - 120, width: 200, height: 230, borderRadius: 44, background: "#f5f6f5", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", overflow: "hidden", ...enter(f, iw("dulap", 1), 16) }}>
          <div style={{ height: 56, background: RED, color: "#fff", fontFamily: FONT, fontWeight: 600, fontSize: 24, letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center" }}>ZILE</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 112, letterSpacing: "-0.05em", color: INK, textAlign: "center", lineHeight: "170px", fontVariantNumeric: "tabular-nums" }}>{days}</div>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S3: no time, no tools, no nerves left
const Widget: React.FC<{ children: React.ReactNode; label: string; value: string; bad: number }> = ({ children, label, value, bad }) => (
  <div style={{ width: 380, height: 380, borderRadius: 72, background: "#ffffff", boxShadow: "0 40px 90px rgba(20,40,30,0.12), 0 2px 6px rgba(0,0,0,0.04)", position: "relative", fontFamily: FONT }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 40, display: "flex", justifyContent: "center" }}>{children}</div>
    <div style={{ position: "absolute", left: 44, bottom: 84, fontSize: 28, fontWeight: 500, color: INK2, letterSpacing: "-0.01em" }}>{label}</div>
    <div style={{ position: "absolute", left: 44, bottom: 34, fontSize: 46, fontWeight: 600, letterSpacing: "-0.03em", color: bad > 0.5 ? RED : INK, transform: `scale(${1 + 0.12 * Math.sin(Math.PI * clamp01(bad))})`, transformOrigin: "0% 50%" }}>{value}</div>
  </div>
);
export const S3: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S2_END;
  const ats = [iw("timpul", 3) - 6, iw("sculele", 0) - 6, iw("nervii", 0) - 6];
  const cam = (fr: number) => ({ s: lerp(1.12, 1.0, r01(fr, a0, a0 + 24, outExpo)) * (1 + 0.04 * clamp01((fr - a0) / 130)) * (1 - 0.06 * r01(fr, iw("nervii", 3), iw("nervii", 4) + 10)), x: Math.sin(fr / 60) * 8, y: 20 });
  const out = r01(f, S3_END - 10, S3_END, (t) => t * t);
  const L1 = [...iWords("timpul"), ...iWords("sculele")];
  const L2 = iWords("nervii");
  const xs = [-450, 0, 450];
  const bad = (i: number) => r01(f, ats[i] + 14, ats[i] + 26);
  const ang = f * 0.42;
  const pulse = Array.from({ length: 48 }, (_, i) => {
    const x = i * 5.5;
    const ph = (i + f * 1.2) % 24;
    const y = ph > 10 && ph < 14 ? (ph < 12 ? -36 : 30) * (1 - bad(2) * 0.3) : Math.sin(i * 0.9 + f / 4) * 3;
    return `${i ? "L" : "M"}${x},${60 + y}`;
  }).join(" ");
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 18}px)` : undefined }}>
      <Light />
      <Cam at={cam}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ position: "absolute", left: 960 + xs[i] - 190, top: 420 - 190, ...enter(f, ats[i], 18) }}>
            {i === 0 && (
              <Widget label="Timp liber" value="0 min" bad={bad(0)}>
                <svg width={170} height={170} viewBox="-50 -50 100 100">
                  <circle r="46" fill="none" stroke="#e6e8e7" strokeWidth="2" />
                  {Array.from({ length: 12 }, (_, k) => (
                    <line key={k} x1={Math.sin((k / 12) * 6.283) * 38} y1={-Math.cos((k / 12) * 6.283) * 38} x2={Math.sin((k / 12) * 6.283) * 43} y2={-Math.cos((k / 12) * 6.283) * 43} stroke={INK} strokeWidth="2" strokeLinecap="round" />
                  ))}
                  <line x1="0" y1="0" x2={Math.sin(ang / 12) * 22} y2={-Math.cos(ang / 12) * 22} stroke={INK} strokeWidth="4" strokeLinecap="round" />
                  <line x1="0" y1="0" x2={Math.sin(ang) * 34} y2={-Math.cos(ang) * 34} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
                  <circle r="3" fill={GREEN} />
                </svg>
              </Widget>
            )}
            {i === 1 && (
              <Widget label="Scule" value="Lipsă" bad={bad(1)}>
                <div style={{ display: "flex", gap: 18, marginTop: 24, opacity: 1 - 0.55 * bad(1) }}>
                  <Glyph name="wrench" size={104} color={INK} weight={1.6} />
                  <Glyph name="hammer" size={104} color={INK} weight={1.6} />
                </div>
              </Widget>
            )}
            {i === 2 && (
              <Widget label="Nervi" value="3%" bad={bad(2)}>
                <svg width={270} height={130}>
                  <path d={pulse} fill="none" stroke={bad(2) > 0.5 ? RED : GREEN} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Widget>
            )}
          </div>
        ))}
        <AText words={L1} size={60} y={760} dim={0} />
        <AText words={L2} size={60} y={840} hi={{ 3: INK, 4: INK }} />
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S4: and you keep putting it off — snooze, snooze, snooze
const CHORES = [
  { t: "Repară priza", b: "Amânat de 14 ori" },
  { t: "Tunde iarba", b: "Amânat de 9 ori" },
  { t: "Montează dulapul", b: "Amânat de 30 de zile" },
];
const RemIcon: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "center", gap: size * 0.09, padding: size * 0.18, boxSizing: "border-box" }}>
    {["#ff9f0a", "#0a84ff", GREEN].map((c) => (
      <div key={c} style={{ display: "flex", alignItems: "center", gap: size * 0.08 }}>
        <div style={{ width: size * 0.13, height: size * 0.13, borderRadius: "50%", background: c }} />
        <div style={{ flex: 1, height: size * 0.05, borderRadius: 4, background: "#d6d8d7" }} />
      </div>
    ))}
  </div>
);
const Banner: React.FC<{ t: string; b: string; press: number; light?: boolean; scale?: number }> = ({ t, b, press, light, scale = 1 }) => (
  <div
    style={{
      width: 860 * scale,
      height: 168 * scale,
      borderRadius: 46 * scale,
      background: light ? "rgba(255,255,255,0.96)" : "rgba(44,47,46,0.94)",
      boxShadow: light ? "0 24px 60px rgba(20,40,30,0.12)" : "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
      display: "flex",
      alignItems: "center",
      gap: 26 * scale,
      padding: `0 ${30 * scale}px`,
      boxSizing: "border-box",
      fontFamily: FONT,
    }}
  >
    <RemIcon size={84 * scale} />
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21 * scale, fontWeight: 600, letterSpacing: "0.06em", color: light ? INK2 : "#9a9e9c" }}>
        <span>MEMENTOURI</span>
        <span style={{ letterSpacing: 0 }}>acum</span>
      </div>
      <div style={{ fontSize: 34 * scale, fontWeight: 600, letterSpacing: "-0.02em", color: light ? INK : "#fff", marginTop: 4 * scale }}>{t}</div>
      <div style={{ fontSize: 26 * scale, fontWeight: 500, color: light ? INK2 : "#a7aba9", marginTop: 2 * scale }}>{b}</div>
    </div>
    {!light && (
      <div style={{ padding: `${14 * scale}px ${26 * scale}px`, borderRadius: 999, background: `rgba(255,255,255,${0.12 + 0.2 * press})`, color: "#fff", fontSize: 27 * scale, fontWeight: 600, transform: `scale(${1 - 0.08 * press})` }}>Amână</div>
    )}
  </div>
);
export const S4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S3_END;
  const arr = [a0 + 2, iw("amani", 1) - 2, iw("amani", 2) + 3];
  const cam = (fr: number) => ({ s: lerp(1.08, 1.0, r01(fr, a0, a0 + 20, outExpo)) * (1 + 0.05 * clamp01((fr - a0) / 50)), x: 0, y: Math.sin(fr / 30) * 4 });
  const out = r01(f, S4_END - 8, S4_END, (t) => t * t);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Dark glow={0.7} />
      <Cam at={cam}>
        {CHORES.map((c, i) => {
          const p = outQuart((f - arr[i]) / 14);
          if (f < arr[i]) return null;
          const depth = arr.filter((a, j) => j > i && f >= a).reduce((d, a) => d + outQuart((f - a) / 12), 0);
          const press = i < 2 ? Math.sin(Math.PI * clamp01((f - (arr[i + 1] - 7)) / 7)) : 0;
          const y = lerp(-180, 360, p) + depth * 34;
          const sc = 1 - depth * 0.06;
          const b = (1 - p) * 22 + depth * 2.5;
          return (
            <div key={i} style={{ position: "absolute", left: 960 - 430, top: y, zIndex: 10 + i, opacity: clamp01(p * 2) * (1 - depth * 0.28), transform: `scale(${sc})`, transformOrigin: "50% 0%", filter: b > 0.3 ? `blur(${b}px)` : undefined }}>
              <Banner t={c.t} b={c.b} press={press} />
              {press > 0.05 && <div style={{ position: "absolute", right: 70, top: 84 - 40, width: 80, height: 80, borderRadius: "50%", background: `rgba(255,255,255,${0.35 * press})`, transform: `scale(${0.4 + press})` }} />}
            </div>
          );
        })}
        <AText words={iWords("amani")} size={72} y={820} color="#f5f7f6" />
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S5: and you hope it sorts itself out — the reminders drift away
const FLOAT = ["Repară priza", "Tunde iarba", "Montează dulapul", "Sună instalatorul", "Vopsește gardul", "Schimbă becul din hol", "Desfundă chiuveta", "Repară robinetul", "Fixează raftul", "Montează TV-ul", "Curăță centrala", "Repară ușa", "Mută canapeaua", "Siliconul la cadă", "Gresia crăpată", "Jaluzelele", "Lustra din sufragerie", "Yala de la intrare"];
export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S4_END;
  const suck = r01(f, iw("singur", 2) - 4, iw("singur", 2) + 16, (t) => t * t * (3 - 2 * t));
  const cam = (fr: number) => ({ s: (1 + 0.06 * clamp01((fr - a0) / 100)) * (1 - 0.1 * r01(fr, S5_END - 14, S5_END, (t) => t * t)), x: 0, y: 0 });
  const out = r01(f, S5_END - 10, S5_END, (t) => t * t);
  const T = (f - a0) / 30;
  const items = FLOAT.map((t, i) => {
    const r = seeded(i, 3), q = seeded(i, 8), z0 = seeded(i, 13);
    let z = 2.4 - ((z0 * 2.2 + T * 0.32) % 2.2);
    const wx = (r - 0.5) * 2600, wy = (q - 0.5) * 1500;
    const x = 960 + (wx / z) * (1 - suck), y = 540 + (wy / z) * (1 - suck);
    const s = (0.75 / z) * (1 - suck * 0.9);
    const dof = Math.abs(z - 1.05) * 9 + suck * 14;
    z = Math.max(0.2, z);
    return { t, x, y, s, dof, z, a: clamp01((2.4 - z) * 2) * clamp01((z - 0.35) * 3) * (1 - suck) * clamp01((f - a0 - i * 1.2) / 10) };
  });
  const W = [...iWords("speri"), ...iWords("cumva"), ...iWords("singur")];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : undefined }}>
      <Light />
      <Cam at={cam}>
        {items
          .sort((a, b) => b.z - a.z)
          .map((it, i) => (
            <div key={i} style={{ position: "absolute", left: it.x - 430 * it.s, top: it.y - 84 * it.s, opacity: it.a, filter: it.dof > 0.4 ? `blur(${it.dof.toFixed(1)}px)` : undefined }}>
              <Banner t={it.t} b="Amânat" press={0} light scale={it.s} />
            </div>
          ))}
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 34% 16% at 50% 50%, rgba(255,255,255,${0.85 * clamp01((f - iw("speri", 0)) / 10)}) 0%, rgba(255,255,255,0) 100%)` }} />
        <AText words={W} size={70} y={540} hi={{ 6: suck > 0.3 ? "#00a852" : INK }} />
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S6: not everyone has someone trustworthy a phone call away
const CONTACTS = ["Adi", "Andreea", "Bogdan", "Mama", "Radu – vecin", "Tata", "Vlad", "Zsolt"];
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S5_END;
  const cam = (fr: number) => ({ s: lerp(1.15, 1, r01(fr, a0, a0 + 26, outExpo)) * (1 + 0.04 * clamp01((fr - a0) / 120)), x: lerp(60, 0, r01(fr, a0, a0 + 40)), y: 0 });
  const out = r01(f, S6_END - 9, S6_END, (t) => t * t);
  const L = wordsOf("lumea");
  const query = "meșter de încredere";
  const typed = Math.round(query.length * r01(f, w("lumea", 3), w("lumea", 7), (t) => t));
  const none = r01(f, w("lumea", 10) - 2, w("lumea", 10) + 10, outQuart);
  const filt = r01(f, w("lumea", 5), w("lumea", 9));
  const rot = lerp(-24, -8, r01(f, a0, a0 + 40, outExpo)) + Math.sin(f / 40) * 2;
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : undefined }}>
      <Dark />
      <Cam at={cam}>
        <AText words={L.slice(0, 6)} size={64} x={150} y={440} align="left" color="#f5f7f6" />
        <AText words={L.slice(6, 9)} size={64} x={150} y={530} align="left" color="#f5f7f6" hi={{ 1: MINT }} />
        <AText words={L.slice(9)} size={64} x={150} y={620} align="left" color="#f5f7f6" />
        <div style={{ position: "absolute", left: 1400 - PHONE_W / 2, top: 540 - PHONE_H / 2, perspective: 2400, ...enter(f, a0 + 2, 22) }}>
          <div style={{ transform: `rotateY(${rot}deg) rotateX(4deg) scale(0.92)`, transformStyle: "preserve-3d" }}>
            <Phone glare={0.3}>
              <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: FONT, padding: "110px 34px 0", boxSizing: "border-box" }}>
                <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: "-0.03em", color: INK }}>Contacte</div>
                <div style={{ marginTop: 18, height: 54, borderRadius: 16, background: "#eeefef", display: "flex", alignItems: "center", padding: "0 18px", fontSize: 25, color: typed ? INK : "#9a9d9b", gap: 10 }}>
                  <span>{typed ? query.slice(0, typed) : "Caută"}</span>
                  {Math.floor(f / 8) % 2 === 0 && <span style={{ width: 2.5, height: 30, background: GREEN, marginLeft: -6 }} />}
                </div>
                <div style={{ marginTop: 16 }}>
                  {CONTACTS.map((c, i) => {
                    const gone = clamp01(filt * 2.2 - i * 0.15);
                    return (
                      <div key={c} style={{ height: 70, borderBottom: "1px solid #ececec", display: "flex", alignItems: "center", gap: 16, opacity: 1 - gone, transform: `translateX(${-gone * 30}px)`, filter: gone > 0.05 ? `blur(${gone * 6}px)` : undefined }}>
                        <div style={{ width: 46, height: 46, borderRadius: "50%", background: "linear-gradient(160deg,#c9cdcb,#9ea4a1)", color: "#fff", fontSize: 21, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{c[0]}</div>
                        <div style={{ fontSize: 27, fontWeight: 500, color: INK }}>{c}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ position: "absolute", left: 0, right: 0, top: 380, textAlign: "center", opacity: none, transform: `translateY(${(1 - none) * 20}px)`, filter: none < 1 ? `blur(${(1 - none) * 10}px)` : undefined }}>
                  <div style={{ fontSize: 34, fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>Niciun rezultat</div>
                  <div style={{ fontSize: 23, fontWeight: 500, color: INK2, marginTop: 8 }}>pentru „{query}”</div>
                </div>
              </div>
            </Phone>
          </div>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S7: searching, calling, haggling — exhausting
const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ width: 760, height: 500, borderRadius: 56, background: "#fff", boxShadow: "0 50px 110px rgba(20,40,30,0.14), 0 2px 6px rgba(0,0,0,0.04)", overflow: "hidden", position: "relative", fontFamily: FONT }}>{children}</div>
);
export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = S6_END;
  const c1 = w("obositor", 4) - 8, c2 = w("obositor", 6) - 7, c3 = w("obositor", 8) - 7;
  const cam = (fr: number) => {
    const p2 = r01(fr, c2, c2 + 10), p3 = r01(fr, c3, c3 + 10);
    return { s: lerp(1.1, 1, r01(fr, a0, a0 + 22, outExpo)) * (1 + 0.03 * clamp01((fr - a0) / 100)), x: (p2 + p3) * 900, y: 0 };
  };
  const out = r01(f, S7_END - 9, S7_END, (t) => t * t);
  const L = wordsOf("obositor");
  const scroll = r01(f, c1 + 6, c2, (t) => t) * 210;
  const ring = (f - c2) / 30;
  const noAns = r01(f, c2 + 22, c2 + 32, outQuart);
  const msgs: [string, boolean, number][] = [["Cât costă montajul?", true, c3 + 4], ["450 lei + deplasarea", false, c3 + 11], ["Cam mult…", true, c3 + 18], ["Hai 400, ultimul preț", false, c3 + 25]];
  return (
    <AbsoluteFill style={{ opacity: 1 - out, filter: out > 0 ? `blur(${out * 16}px)` : undefined }}>
      <Light />
      <AText words={L} size={60} y={190} hi={{ 4: "#00a852", 6: "#00a852", 8: "#00a852" }} />
      <Cam at={cam} blur={1.3}>
        <div style={{ position: "absolute", left: 960 - 380, top: 590 - 250, ...enter(f, c1, 16) }}>
          <Card>
            <div style={{ margin: "34px 36px 0", height: 60, borderRadius: 18, background: "#f0f1f0", display: "flex", alignItems: "center", padding: "0 22px", fontSize: 27, color: INK }}>meșter priză urgent</div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 112, bottom: 0, overflow: "hidden" }}>
            <div style={{ transform: `translateY(${-scroll}px)`, padding: "0 36px" }}>
              {["Electrician Non-Stop", "Meșter Priză 24/7", "Instalații & Electrice", "Reparații Rapide SRL", "Electrician Ionuț", "Meseriași de Top"].map((t, i) => (
                <div key={t} style={{ height: 96, borderBottom: "1px solid #eee", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>{t}</div>
                  <div style={{ fontSize: 22, color: INK2, marginTop: 4 }}>{"★".repeat(3 + (i % 3))}<span style={{ color: "#d0d2d1" }}>{"★".repeat(2 - (i % 3))}</span> · {12 + i * 7} recenzii</div>
                </div>
              ))}
            </div>
            </div>
          </Card>
        </div>
        <div style={{ position: "absolute", left: 960 + 900 - 380, top: 590 - 250, ...enter(f, c2 - 2, 14) }}>
          <Card>
            <div style={{ position: "absolute", left: 380 - 70, top: 120 - 70, width: 140, height: 140, borderRadius: "50%", background: "linear-gradient(160deg,#c9cdcb,#9ea4a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 56, fontWeight: 600 }}>MI</div>
            {[0, 1].map((k) => {
              const u = (ring + k * 0.5) % 1;
              return <div key={k} style={{ position: "absolute", left: 380 - 70, top: 50, width: 140, height: 140, borderRadius: "50%", border: `3px solid ${GREEN}`, opacity: (1 - u) * 0.6 * (1 - noAns), transform: `scale(${1 + u * 0.7})` }} />;
            })}
            <div style={{ position: "absolute", top: 230, width: "100%", textAlign: "center", fontSize: 40, fontWeight: 600, color: INK, letterSpacing: "-0.02em" }}>Meșter Ionel</div>
            <div style={{ position: "absolute", top: 290, width: "100%", textAlign: "center", fontSize: 28, fontWeight: 500, color: noAns > 0.5 ? RED : INK2 }}>{noAns > 0.5 ? "Nu răspunde" : "Se apelează…"}</div>
            <div style={{ position: "absolute", bottom: 44, left: 380 - 46, width: 92, height: 92, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 44, height: 16, borderRadius: 8, background: "#fff", transform: "rotate(-8deg)" }} />
            </div>
          </Card>
        </div>
        <div style={{ position: "absolute", left: 960 + 1800 - 380, top: 590 - 250, ...enter(f, c3 - 2, 14) }}>
          <Card>
            <div style={{ padding: "40px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
              {msgs.map(([t, me, at], i) => {
                const p = outQuart((f - at) / 10);
                return (
                  <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: 520, padding: "18px 26px", borderRadius: 30, background: me ? GREEN : "#eceeed", color: me ? "#fff" : INK, fontSize: 29, fontWeight: 500, opacity: clamp01((f - at) / 4), transform: `translateY(${(1 - p) * 24}px) scale(${0.9 + 0.1 * p})`, transformOrigin: me ? "100% 100%" : "0% 100%" }}>
                    {t}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </Cam>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ S8: and pray you don't run into someone who cons you
export const S8: React.FC<{ end: number }> = ({ end }) => {
  const f = useCurrentFrame();
  const a0 = S7_END;
  const fall = w("rogi", 8);
  const con = w("rogi", 11) - 2;
  const cam = (fr: number) => ({ s: lerp(1.1, 1, r01(fr, a0, a0 + 24, outExpo)) * (1 + 0.06 * clamp01((fr - a0) / 100)) * (1 + 0.6 * r01(fr, end - 12, end, (t) => t * t * t)), x: 0, y: -20 });
  const L = wordsOf("rogi");
  const glitch = f >= con && f < con + 12 ? 1 : 0;
  const warn = r01(f, con + 6, con + 18, outQuart);
  const gj = (k: number) => (glitch ? (seeded(f * 7 + k, 2) - 0.5) * 40 : 0);
  const out = r01(f, end - 8, end, (t) => t * t);
  const card = (dx: number, tint?: string) => (
    <div style={{ position: "absolute", left: 960 - 330 + dx, top: 400 - 190, width: 660, height: 380, borderRadius: 56, background: "linear-gradient(160deg,#262b29,#121514)", boxShadow: "0 50px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)", fontFamily: FONT, overflow: "hidden", mixBlendMode: tint ? "screen" : undefined, filter: tint ? `drop-shadow(0 0 0 ${tint})` : undefined, opacity: tint ? 0.6 : 1 }}>
      <div style={{ position: "absolute", left: 48, top: 52, width: 110, height: 110, borderRadius: "50%", background: "linear-gradient(160deg,#5a625e,#2b302e)", color: "#fff", fontSize: 44, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>MI</div>
      <div style={{ position: "absolute", left: 190, top: 64, fontSize: 42, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>Meșter Ionel</div>
      <div style={{ position: "absolute", left: 190, top: 120, fontSize: 26, fontWeight: 500, color: "#9ea4a1" }}>„Fac orice, ieftin, azi”</div>
      <div style={{ position: "absolute", left: 48, top: 214, display: "flex", gap: 14 }}>
        {[0, 1, 2, 3, 4].map((k) => {
          const u = r01(f, fall + k * 4, fall + k * 4 + 16, (t) => t * t);
          return (
            <div key={k} style={{ fontSize: 58, color: GREEN, transform: `translateY(${u * 260}px) rotate(${u * (k % 2 ? 50 : -40)}deg)`, opacity: 1 - u, filter: u > 0.05 ? `blur(${u * 6}px)` : undefined }}>★</div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 48, right: 48, bottom: 40, height: 76, borderRadius: 24, background: `rgba(255,69,58,${0.16 * warn})`, color: RED, fontSize: 28, fontWeight: 600, display: "flex", alignItems: "center", padding: "0 26px", opacity: warn }}>
        Avans trimis: 400 lei · Nu mai răspunde
      </div>
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <Dark glow={1 - warn * 0.6} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 50% at 50% 40%, rgba(255,69,58,${0.1 * warn}) 0%, rgba(0,0,0,0) 70%)` }} />
      <Cam at={cam}>
        <div style={{ position: "absolute", inset: 0, ...enter(f, a0 + 2, 18) }}>
          {glitch ? card(gj(1), "rgba(255,0,60,1)") : null}
          {card(gj(2))}
          {glitch ? card(gj(3) * -1, "rgba(0,200,255,1)") : null}
        </div>
        <AText words={L.slice(0, 8)} size={60} y={760} color="#f5f7f6" />
        <AText words={L.slice(8)} size={60} y={840} color="#f5f7f6" hi={{ 3: RED }} />
      </Cam>
    </AbsoluteFill>
  );
};
