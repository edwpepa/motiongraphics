import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { StoreBadge } from "../../explainer/components/StoreBadge";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { BEATS } from "../timeline";
import { OUTFIT } from "../tv/font";
import { bt, D0, GREEN, GREEN2, INK, outExpo, r01, Sparkle, Splash, spring } from "./kit3d";
import { Heart } from "../ref/ui";
import { measure } from "../ref/type";

// ------------------------------------------------------------------ the drop: on every beat a new colour floods in as paint; the mark rides the beat, sparkles around it
const PAL = [
  { bg: GREEN, splash: GREEN, light: GREEN2, logo: "white", word: "#ffffff", spark: "#ffffff" },
  { bg: "#04130b", splash: "#04130b", light: "#0b2a19", logo: "green", word: "#ffffff", spark: GREEN },
  { bg: "#f3f5f8", splash: "#f3f5f8", light: "#ffffff", logo: "green", word: INK, spark: GREEN },
  { bg: "#0d3b24", splash: "#0d3b24", light: "#155a37", logo: "white", word: "#ffffff", spark: GREEN2 },
] as const;
const beatIdx = (f: number) => Math.floor((f - D0) / BEATS + 1e-6);

export const Mark: React.FC<{ size: number; logo: string; word: string; gap?: number }> = ({ size, logo, word, gap = 0.3 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * gap }}>
    <Img src={staticFile("images/logo.webp")} style={{ width: size, height: size, filter: logo === "white" ? "brightness(0) invert(1)" : undefined }} />
    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: size * 1.08, letterSpacing: "-0.05em", color: word, lineHeight: 1, transform: `translateY(${-size * 0.06}px)` }}>handly</div>
  </div>
);

export const PremiumDrop: React.FC<{ from: number; offset?: number; zoomOutAt?: number; hit?: boolean; fadeTo?: number }> = ({ from, offset = 0, zoomOutAt, hit = true, fadeTo }) => {
  const f = useCurrentFrame();
  const k0 = beatIdx(from - 1) + 1;
  const k = Math.max(k0 - 1, beatIdx(f));
  const n = k - k0;
  const cur = PAL[(((n + 1 + offset) % 4) + 4) % 4];
  const prev = PAL[((n + offset) % 4 + 4) % 4];
  const tb = k >= k0 ? bt(k) : from;
  const ts = clamp01((f - tb) / 10);
  const ox = 960 + (seeded(k, 7) - 0.5) * 440, oy = 540 + (seeded(k, 8) - 0.5) * 260;
  // the mark takes the new colours only once the paint has run over it
  const covered = k >= k0 && ts > 0 && 1500 * outExpo(ts) * 0.9 > Math.hypot(ox - 960, oy - 540) + 330;
  const pal = k < k0 ? PAL[offset % 4] : covered ? cur : prev;
  const pop = spring(clamp01((f - tb) / 16));
  const sc = (1 + 0.07 * (1 - pop) * (k >= k0 ? 1 : 0)) * (1 + 0.05 * clamp01((f - from) / 90));
  const zo = zoomOutAt === undefined ? 0 : r01(f, zoomOutAt, zoomOutAt + 10, (u) => u * u * u);
  const hitT = clamp01((f - from) / 14);
  return (
    <AbsoluteFill style={{ background: k < k0 ? PAL[offset % 4].bg : prev.bg, overflow: "hidden" }}>
      {k >= k0 && <Splash x={ox} y={oy} t={ts} R={1500} color={cur.splash} light={cur.light} seed={k * 3 + 1} rot={seeded(k, 9) * 360} drops={18} />}
      {/* the first hit: a burst of green from the middle, a flash */}
      {hit && f - from < 16 && <Splash x={960} y={540} t={hitT} R={900} color={GREEN2} light="#bff5d8" seed={11} drops={26} opacity={1 - hitT} />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${sc * (1 + 2.5 * zo)}) rotate(${Math.sin(f / 9) * 0.6}deg)`, opacity: 1 - zo, filter: zo > 0 ? `blur(${zo * 18}px)` : undefined }}>
        <Mark size={128} logo={pal.logo} word={pal.word} />
      </AbsoluteFill>
      {/* sparkles twinkling around the mark, one lighting on each beat */}
      {Array.from({ length: 7 }, (_, j) => {
        const kk = k - ((((k - j) % 7) + 7) % 7);
        const t = (f - bt(kk)) / (BEATS * 2.2);
        if (t < 0 || t > 1 || k < k0) return null;
        const a = seeded(kk, 13 + j) * Math.PI * 2;
        const r = 330 + seeded(kk, 17) * 220;
        const s = Math.sin(Math.PI * t);
        return <Sparkle key={j} x={960 + Math.cos(a) * r * 1.5} y={540 + Math.sin(a) * r * 0.8} size={34 + 40 * seeded(kk, 19)} t={s} rot={t * 120} color={pal.spark === "#ffffff" ? "#ffffff" : GREEN} color2={pal.spark === "#ffffff" ? "#e8fff2" : GREEN2} opacity={s} />;
      })}
      <AbsoluteFill style={{ background: "#fff", opacity: hit ? Math.max(0, 0.7 - (f - from) / 8) : 0 }} />
      {fadeTo !== undefined && <AbsoluteFill style={{ background: "#030605", opacity: r01(f, fadeTo - 14, fadeTo) }} />}
    </AbsoluteFill>
  );
};

const io = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
// ------------------------------------------------------------------ the end: the heart flies in, lands, and becomes the Handly mark; handly.ro opens beside it
export const EndCard: React.FC<{ from: number; hit: number; end: number; bg?: string; heartFrom?: [number, number, number] }> = ({ from, hit, end, bg = "#f3f5f8", heartFrom }) => {
  const f = useCurrentFrame();
  const fly = r01(f, from, hit - 6, (u) => 1 - Math.pow(1 - u, 3));
  const [hx, hy, hs] = heartFrom ?? [1500, 860, 48];
  const sx = lerp(hx, 960, fly), sy = lerp(hy, 540, fly) - (heartFrom ? 0 : Math.sin(fly * Math.PI) * 120);
  const morph = r01(f, hit - 6, hit + 6, (u) => u);
  const land = spring(clamp01((f - hit) / 22));
  const word = r01(f, hit + 4, hit + 24, (u) => 1 - Math.pow(1 - u, 4));
  const badges = r01(f, hit + 16, hit + 36, (u) => 1 - Math.pow(1 - u, 3));
  const drift = 1 + 0.035 * clamp01((f - hit) / (end - hit));
  const LOGO = 120;
  // the whole wordmark, measured, so the reveal never clips it
  const WORD = Math.ceil(measure("handly.ro", 132, 700, -0.05)) + 16;
  const groupW = LOGO + (LOGO * 0.3 + WORD) * word;
  const lx = 960 - groupW / 2;
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 50% at 50% 45%, #ffffff 0%, rgba(255,255,255,0) 70%)" }} />
      <Splash x={960} y={540} t={clamp01((f - hit) / 16)} R={260} color={GREEN} light={GREEN2} seed={29} drops={20} opacity={Math.max(0, 1 - (f - hit) / 22)} />
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {/* the heart on its way in */}
        {morph < 1 && <Heart x={sx} y={sy} size={lerp(hs, 70, io(fly)) * (1 - 0.3 * morph)} rot={heartFrom ? 0 : Math.sin(fly * Math.PI * 2) * 12} opacity={1 - morph} pulse={0.04 * Math.sin((f - from) / 5)} />}
        {f < hit && !heartFrom &&
          [0.06, 0.12, 0.18].map((d, i) => {
            const u = Math.max(0, fly - d);
            return <Heart key={i} x={lerp(1500, 960, u)} y={lerp(860, 540, u) - Math.sin(u * Math.PI) * 120} size={12 - i * 3} opacity={0.45 - i * 0.12} />;
          })}
        {/* the mark */}
        {morph > 0 && (
          <div style={{ position: "absolute", left: lx, top: 540 - LOGO / 2 - 50 * badges, width: groupW + 10, height: LOGO, display: "flex", alignItems: "center" }}>
            <Img src={staticFile("images/logo.webp")} style={{ width: LOGO, height: LOGO, transform: `scale(${(0.6 + 0.4 * land) * (morph < 1 ? morph : 1)}) rotate(${(1 - land) * -20}deg)`, opacity: morph }} />
            <div style={{ overflow: "hidden", marginLeft: LOGO * 0.3 * word, width: WORD * word, flexShrink: 0 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 132, letterSpacing: "-0.05em", color: INK, lineHeight: 1, transform: `translateX(${(1 - word) * -120}px) translateY(-6px)`, whiteSpace: "nowrap", paddingRight: 8 }}>handly.ro</div>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, width: 1920, top: 540 + 90, display: "flex", justifyContent: "center", gap: 22, opacity: badges, transform: `translateY(${(1 - badges) * 30}px)` }}>
          <StoreBadge store="apple" h={80} shine={clamp01((f - hit - 22) / 20)} />
          <StoreBadge store="google" h={80} shine={clamp01((f - hit - 28) / 20)} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: bg, opacity: r01(f, end - 16, end) }} />
    </AbsoluteFill>
  );
};
