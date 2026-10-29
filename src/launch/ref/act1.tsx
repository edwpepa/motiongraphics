import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { Sym } from "../tv/ios";
import { GREEN, io3, outExpo, Sparkle, spring } from "../tv3d/kit3d";
import { I, R1_END, R2_END, R3_END, R4_END, R5_END, R6_END, R7_END, R8_END, V, D0, pEnd } from "./marks";
import { RefLine } from "./type";
import { Card, cardShadow, Cursor, IOSBanner, PillBtn, UI } from "./ui";

const MUTE = "#7c8481";
const RED = "#ff453a";

// ------------------------------------------------------------------ 1 · "Probleme prin casă [⌂] … Bătăi de cap?"
export const R1: React.FC = () => {
  const big = I("probleme", 6);
  return (
    <>
      <RefLine
        size={84}
        words={[
          { t: "Probleme", at: I("probleme", 0), acc: true },
          { t: "prin", at: I("probleme", 1) },
          { t: "casă", at: I("probleme", 2) },
        ]}
        out={big - 8}
      />
      <RefLine size={128} words={[{ t: "Bătăi", at: big, acc: true }, { t: "de", at: I("probleme", 7) }, { t: "cap?", at: I("probleme", 8) }]} out={R1_END - 6} exit="blur" drift={-0.05} />
    </>
  );
};

// ------------------------------------------------------------------ 2 · the three photos, as cards in a carousel
const PH = [
  { src: "images/photos/socket.jpg", title: "Priză stricată", sub: "de 2 săptămâni", key: ["priza", 1] as const },
  { src: "images/photos/grass.jpg", title: "Iarbă netunsă", sub: "crește întruna", key: ["iarba", 0] as const },
  { src: "images/photos/cabinet.jpg", title: "Dulap nemontat", sub: "în cutie", key: ["dulap", 0] as const },
];
export const R2: React.FC = () => {
  const f = useCurrentFrame();
  const at = PH.map((p) => I(p.key[0], p.key[1]) - 5);
  const c = io3(clamp01((f - at[1]) / 14)) * 0.5 + io3(clamp01((f - at[2]) / 14)) * 0.5 + (f - at[0]) * 0.0012;
  const lift = spring(clamp01((f - I("dulap", 3)) / 20));
  const days = clamp01((f - I("dulap", 4)) / 16);
  return (
    <AbsoluteFill>
      {PH.map((p, i) => {
        if (f < at[i]) return null;
        const e = spring(clamp01((f - at[i]) / 24));
        const o = clamp01((f - at[i]) / 5);
        const x = 960 + (i - c) * 560;
        const u = clamp01((f - (R2_END - 12 + i * 2)) / 8);
        const hi = i === 2 ? lift : 0;
        return (
          <div key={i} style={{ position: "absolute", left: x - 250, top: 540 - 220 + (1 - e) * 140 - hi * 16, width: 500, opacity: o * (1 - u), transform: `perspective(1400px) rotateY(${(1 - e) * -18 + (x - 960) * -0.012}deg) rotateZ(${(1 - e) * 6}deg) scale(${(0.82 + 0.18 * e) * (1 + 0.05 * hi) * (1 - 0.06 * u)})`, filter: u > 0 ? `blur(${u * 14}px)` : undefined }}>
            <Card w={500} r={30} pad={12} style={{ boxShadow: cardShadow(1 + hi * 0.4) }}>
              <div style={{ width: 476, height: 330, borderRadius: 18, overflow: "hidden", position: "relative" }}>
                <Img src={staticFile(p.src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.18 - 0.1 * e + 0.0006 * (f - at[i])})` }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "16px 8px 6px", gap: 10 }}>
                <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>{p.title}</div>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: RED }} />
              </div>
              <div style={{ padding: "0 8px 8px", fontSize: 21, fontWeight: 500, color: MUTE }}>{p.sub}</div>
              {i === 2 && days > 0 && (
                <div style={{ position: "absolute", right: -26, top: -26, padding: "12px 18px", borderRadius: 18, background: "#fff", boxShadow: cardShadow(0.8), display: "flex", alignItems: "center", gap: 10, transform: `scale(${spring(days)}) rotate(${(1 - days) * 10}deg)`, fontSize: 24, fontWeight: 600, color: RED }}>
                  <Sym n="cal" size={26} color={RED} w={2.2} />
                  {Math.max(1, Math.round(30 * io3(days)))} de zile
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 3 · "Nici timpul. Nici sculele. Nici nervii."
export const R3: React.FC = () => (
  <RefLine
    size={78}
    words={[
      { t: "Nici", at: I("timpul", 3) },
      { t: "timpul.", at: I("timpul", 4), acc: true, accOff: I("sculele", 1) },
      { t: "Nici", at: I("sculele", 0) },
      { t: "sculele.", at: I("sculele", 1), acc: true, accOff: I("nervii", 1) },
      { t: "Nici", at: I("nervii", 0) },
      { t: "nervii.", at: I("nervii", 1), acc: true },
    ]}
    out={R3_END - 8}
    drift={0.02}
  />
);

// ------------------------------------------------------------------ 4 · "Și tot amâni…" — the reminder row and its black button
export const R4: React.FC = () => {
  const f = useCurrentFrame();
  const in0 = R3_END - 4;
  const e = outExpo(clamp01((f - in0) / 16));
  const c1 = I("amani", 2) - 1, c2 = c1 + 14;
  const u = clamp01((f - (R4_END - 7)) / 7);
  const dates = ["Azi, 18:00", "Mâine", "Săptămâna viitoare"];
  const di = f >= c2 ? 2 : f >= c1 ? 1 : 0;
  const flip = clamp01((f - (di === 2 ? c2 : c1)) / 6);
  const BX = 960 + 520 - 150, BY = 540;
  const zoom = 1.2 + 0.14 * io3(clamp01((f - in0) / 40));
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${(BX + 960) / 2}px ${BY}px` }}>
      <div style={{ position: "absolute", left: 960 - 520 + (1 - e) * -260, top: 540 - 66, opacity: clamp01((f - in0) / 4) * (1 - u), filter: e < 1 || u > 0 ? `blur(${(1 - e) * 16 + u * 14}px)` : undefined }}>
        <Card w={1040} h={132} r={30} pad={0} style={{ display: "flex", alignItems: "center", padding: "0 24px", gap: 22 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, border: "2.5px solid #d4d9d7" }} />
          <div style={{ width: 84, height: 84, borderRadius: 18, overflow: "hidden" }}>
            <Img src={staticFile("images/photos/cabinet.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Montează dulapul
              {f >= c2 && <span style={{ fontSize: 17, fontWeight: 600, color: RED, padding: "5px 11px", borderRadius: 99, background: "rgba(255,69,58,0.1)", transform: `scale(${spring(clamp01((f - c2) / 14))})` }}>amânat ×7</span>}
            </div>
            <div style={{ position: "relative", height: 30, marginTop: 6, overflow: "hidden", fontSize: 21, fontWeight: 500, color: di > 0 ? RED : MUTE }}>
              <div style={{ position: "absolute", top: (1 - io3(flip)) * 30 * (di > 0 ? 1 : 0) }}>{dates[di]}</div>
              {di > 0 && flip < 1 && <div style={{ position: "absolute", top: -30 * io3(flip), color: MUTE }}>{dates[di - 1]}</div>}
            </div>
          </div>
          <PillBtn label="Amână" w={200} h={68} press={Math.max(...[c1, c2].map((c) => (f >= c - 3 && f <= c + 5 ? Math.sin((Math.PI * (f - c + 3)) / 8) : 0)))} icon="clock" />
        </Card>
      </div>
      <Cursor keys={[{ f: in0 + 6, x: 1500, y: 900 }, { f: c1 - 3, x: BX + 10, y: BY + 12 }, { f: c2 - 5, x: BX - 6, y: BY + 4 }, { f: R4_END, x: BX + 60, y: BY + 140 }]} clicks={[c1, c2]} hideAt={R4_END - 8} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 5 · "Și speri că, cumva, / se rezolvă singur. ✦"
export const R5: React.FC = () => (
  <>
    <RefLine size={84} words={[{ t: "Și", at: I("speri", 0) }, { t: "speri", at: I("speri", 1), acc: true }, { t: "că,", at: I("speri", 2) }, { t: "cumva,", at: I("cumva", 0) }]} out={I("singur", 0) - 8} />
    <RefLine
      size={92}
      words={[
        { t: "se", at: I("singur", 0) },
        { t: "rezolvă", at: I("singur", 1) },
        { t: "singur.", at: I("singur", 2), acc: true },
        { at: I("singur", 2) + 6, w: 60, node: (_p, k) => <div style={{ position: "relative", width: 60, height: 60, transform: "translateY(-22px)" }}><Sparkle x={30} y={30} size={30} t={clamp01(k / 10)} rot={k * 4} /></div> },
      ]}
      out={R5_END - 6}
      exit="blur"
    />
  </>
);

// ------------------------------------------------------------------ 6 · nobody to call: the contacts window finds no one
const CONTACTS = [
  ["M", "Mama", "mobil"],
  ["A", "Andrei · vecin", "mobil"],
  ["B", "Bogdan · service auto", "serviciu"],
  ["C", "Cristina · colegă", "mobil"],
  ["D", "Dentist", "programări"],
];
export const R6: React.FC = () => {
  const f = useCurrentFrame();
  const in0 = R5_END - 6;
  const e = outExpo(clamp01((f - in0) / 26));
  const q = "meșter de încredere";
  const t0 = V("lumea", 4), t1 = V("lumea", 7) + 10;
  const typed = Math.floor(q.length * clamp01((f - t0) / (t1 - t0)));
  const gone = (i: number) => clamp01((f - (t0 + 6 + i * 5)) / 6);
  const empty = clamp01((f - (V("lumea", 10) - 4)) / 14);
  const push = clamp01((f - (R6_END - 10)) / 10);
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div style={{ position: "absolute", left: 960 - 450, top: 540 - 310 + (1 - e) * 560, width: 900, height: 620, transform: `rotateX(${(1 - e) * 38 + 6 + Math.sin(f / 40) * 1.5}deg) rotateZ(${(1 - e) * -10 - 2}deg) rotateY(${Math.sin(f / 50) * 3}deg) scale(${(1.14 + 0.04 * clamp01((f - in0) / 100)) * (1 + push * push * 0.9)})`, opacity: 1 - push * push, filter: push > 0 ? `blur(${push * push * 16}px)` : undefined }}>
        <Card w={900} h={620} r={30} pad={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: "28px 28px 0", fontSize: 46, fontWeight: 700, letterSpacing: "-0.02em" }}>Contacte</div>
          <div style={{ margin: "16px 28px 8px", height: 60, borderRadius: 16, background: "#eeeef0", display: "flex", alignItems: "center", gap: 12, padding: "0 18px", fontSize: 27, fontWeight: 400 }}>
            <Sym n="search" size={26} color="#8a8a8e" w={2.4} />
            {typed === 0 ? <span style={{ color: "#8a8a8e" }}>Caută</span> : <span>{q.slice(0, typed)}</span>}
            <span style={{ width: 2.5, height: 30, background: GREEN, marginLeft: -10, opacity: Math.floor(f / 8) % 2 || typed < q.length ? 1 : 0 }} />
          </div>
          {CONTACTS.map(([ini, name, sub], i) => {
            const g = gone(i);
            return (
              <div key={name} style={{ height: 78, margin: "0 28px", display: "flex", alignItems: "center", gap: 18, borderBottom: "1px solid #e3e3e8", opacity: 1 - g, transform: `translateX(${g * -40}px)`, filter: g > 0 ? `blur(${g * 6}px)` : undefined }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(180deg, #a5abb6 0%, #858b96 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#fff" }}>{ini}</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 400 }}>{name}</div>
                  <div style={{ fontSize: 18, fontWeight: 400, color: "#8a8a8e" }}>{sub}</div>
                </div>
              </div>
            );
          })}
          {empty > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", flexDirection: "column", alignItems: "center", opacity: empty, transform: `translateY(${(1 - outExpo(empty)) * 30}px)` }}>
              <div style={{ width: 120, height: 120, borderRadius: 60, background: "#f2f4f3", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring(empty)})` }}>
                <Sym n="user" size={56} color="#b9c0bd" w={2} />
              </div>
              <div style={{ marginTop: 22, fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em" }}>Niciun rezultat</div>
              <div style={{ marginTop: 8, fontSize: 21, fontWeight: 500, color: MUTE }}>pentru „{q}”</div>
            </div>
          )}
        </Card>
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 7 · "E obositor. / Cauți. Suni. Negociezi."
export const R7: React.FC = () => (
  <>
    <RefLine size={96} words={[{ t: "E", at: V("obositor", 1) }, { t: "obositor.", at: V("obositor", 2), acc: true }]} out={V("obositor", 4) - 8} />
    <RefLine
      size={80}
      words={[
        { t: "Cauți.", at: V("obositor", 4), acc: true, accOff: V("obositor", 6) },
        { t: "Suni.", at: V("obositor", 6), acc: true, accOff: V("obositor", 8) },
        { t: "Negociezi.", at: V("obositor", 8), acc: true },
      ]}
      out={R7_END - 8}
      drift={0.025}
    />
  </>
);

// ------------------------------------------------------------------ 8 · the people who let you down float around: "te păcălește."
const BAD = [
  { x: 540, y: 290, r: -7, kind: "review", t: "A luat avansul și a dispărut." },
  { x: 1390, y: 270, r: 6, kind: "msg", t: "Vin mâine, sigur." },
  { x: 520, y: 800, r: 5, kind: "msg", t: "Mai trebuie 300 lei pentru piese." },
  { x: 1400, y: 810, r: -6, kind: "call", t: "Apel nepreluat (4)" },
];
export const R8: React.FC = () => {
  const f = useCurrentFrame();
  const go = R8_END - 10;
  const shake = f > V("rogi", 11) && f < V("rogi", 11) + 10 ? Math.sin(f * 2.4) * 5 * (1 - (f - V("rogi", 11)) / 10) : 0;
  return (
    <AbsoluteFill>
      {BAD.map((b, i) => {
        const at = V("rogi", 0) + i * 9;
        if (f < at) return null;
        const e = outExpo(clamp01((f - at) / 20));
        const fx = 960 + (b.x - 960) * 2.6, fy = 540 + (b.y - 540) * 2.6;
        const u = clamp01((f - go) / 10);
        const x = lerp(fx, b.x, e) + (b.x - 960) * u * u * 1.4 + Math.sin(f / 31 + i) * 10;
        const y = lerp(fy, b.y, e) + (b.y - 540) * u * u * 1.4 + Math.cos(f / 27 + i * 2) * 8;
        return (
          <div key={i} style={{ position: "absolute", left: x + shake, top: y, transform: `translate(-50%, -50%) perspective(1200px) rotateY(${(b.x < 960 ? 1 : -1) * (14 + 6 * Math.sin(f / 40 + i))}deg) rotateZ(${b.r + (1 - e) * b.r * 2}deg) scale(${lerp(1.9, 1, e) * (1 + u * u * 0.6)})`, opacity: clamp01((f - at) / 5) * (1 - u), filter: e < 0.85 || u > 0 ? `blur(${(1 - e) * 18 + u * 12}px)` : undefined }}>
            <IOSBanner app={b.kind === "call" ? "phone" : "messages"} title={b.kind === "call" ? "Apel nepreluat" : b.kind === "review" ? "Recenzie: 1 din 5" : "Meșter"} body={b.kind === "msg" ? `„${b.t}”` : b.kind === "call" ? "Meșter · de 4 ori" : b.t} time={b.kind === "msg" ? "ieri" : "acum"} w={600} scale={1.25} />
          </div>
        );
      })}
      <RefLine size={104} words={[{ t: "te", at: V("rogi", 10) }, { t: "păcălește.", at: V("rogi", 11), acc: true }]} out={go} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 9 · "Aici intervine [mark] Handly." — and the charge into the drop
export const R9: React.FC = () => {
  const f = useCurrentFrame();
  const ch = clamp01((f - (pEnd("aici") + 2)) / Math.max(1, D0 - pEnd("aici") - 2));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(0,191,99,${0.22 * ch * ch}) 0%, rgba(0,191,99,0) ${30 + 40 * ch}%)` }} />
      <RefLine
        size={88}
        words={[
          { t: "Aici", at: V("aici", 0) },
          { t: "intervine", at: V("aici", 1) },
          { at: V("aici", 2) - 3, w: 96, node: (p, k) => <div style={{ transform: `scale(${0.3 + 0.7 * spring(clamp01(k / 18))}) rotate(${(1 - p) * -30}deg)` }}><Img src={staticFile("images/logo.webp")} style={{ width: 92, height: 92, display: "block" }} /></div> },
          { t: "Handly.", at: V("aici", 2), acc: true },
        ]}
        out={pEnd("aici") + 2}
        exit="push"
        exitLen={D0 - pEnd("aici") - 2}
        drift={0.03}
      />
      {Array.from({ length: 10 }, (_, i) => {
        const a = seeded(i, 81) * Math.PI * 2;
        const r = lerp(700, 40, ch * ch);
        return ch > 0 ? <Sparkle key={i} x={960 + Math.cos(a + ch * 2) * r * 1.4} y={540 + Math.sin(a + ch * 2) * r * 0.8} size={14 + 14 * seeded(i, 82)} t={1} rot={f * 6} opacity={ch} /> : null;
      })}
    </AbsoluteFill>
  );
};
export { UI };
