import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { Phone } from "../../explainer/components/Phone";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { iWords } from "../introTimes";
import { words } from "../timeline";
import { OUTFIT } from "./font";

// ------------------------------------------------------------------ the TV spot's shared language: a keynote stage, Outfit headlines, one iPhone that never stops moving
export const INK = "#1d1d1f";
export const GREY = "#86868b";
export const GREEN = "#00bf63";
export const MINT = "#5df0a5";
export const RED = "#ff453a";
export type W = [string, number];

export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const outQuart = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
export const inOut = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
};
export const io3 = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const r01 = (f: number, a: number, b: number, fn: (t: number) => number = inOut) => fn(clamp01((f - a) / (b - a)));
export const pulse = (f: number, at: number, len = 8) => (f < at || f > at + len ? 0 : Math.sin(((f - at) / len) * Math.PI));

/** words of a voice-over phrase, a few frames early so each lands on its syllable */
const INTRO = new Set(["probleme", "priza", "iarba", "dulap", "timpul", "sculele", "nervii", "amani", "speri", "cumva", "singur"]);
export const vo = (key: string, lead = 3): W[] => (INTRO.has(key) ? iWords(key, lead) : words(key as "lumea").map(([t, f]) => [t, f - lead] as W));
export const cap = (ws: W[]): W[] => ws.map(([t, f], i) => [i === 0 ? t.charAt(0).toLocaleUpperCase("ro-RO") + t.slice(1) : t, f]);
/** a free-standing headline word list: same timing, own text */
export const say = (text: string, at: number, gap = 3): W[] => text.split(" ").map((t, i) => [t, at + i * gap]);

// ------------------------------------------------------------------ stages
/** the keynote dark: black, one soft key light, a floor that catches the phone */
export const DarkStage: React.FC<{ hue?: string; glow?: number; x?: number; y?: number }> = ({ hue = "60,120,255", glow = 0.16, x = 66, y = 48 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 42% 60% at ${x + Math.sin(f / 90) * 2}% ${y}%, rgba(${hue},${glow}) 0%, rgba(${hue},0) 70%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(40,40,46,0.55) 0%, rgba(0,0,0,0) 70%)" }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", backgroundPosition: `${(f * 37) % 512}px ${(f * 53) % 512}px`, opacity: 0.05, mixBlendMode: "overlay" }} />
    </AbsoluteFill>
  );
};
/** the keynote light: Apple grey-white, a soft pool of light */
export const LightStage: React.FC<{ tint?: string; x?: number; y?: number }> = ({ tint = "0,191,99", x = 68, y = 46 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#f5f5f7" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 45% 60% at ${x + Math.sin(f / 90) * 2}% ${y}%, rgba(${tint},0.10) 0%, rgba(${tint},0) 70%), radial-gradient(ellipse 80% 80% at 50% 40%, #ffffff 0%, rgba(255,255,255,0) 75%)` }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("images/grain.png")})`, backgroundSize: "512px 512px", opacity: 0.025, mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ type: Outfit 600, words rising out of a mask and resolving out of blur
export type Line = { w: W[]; size: number; color?: string; weight?: number; tracking?: string; hi?: Record<number, string> };
export const Headline: React.FC<{ lines: Line[]; x?: number; y: number; out?: number; align?: "left" | "center"; gap?: number; dur?: number }> = ({ lines, x = 120, y, out, align = "left", gap = 0.06, dur = 20 }) => {
  const f = useCurrentFrame();
  let top = y;
  let k = 0;
  return (
    <>
      {lines.map((ln, li) => {
        const t0 = top;
        top += ln.size * (1.02 + gap);
        if (!ln.w.length || f < ln.w[0][1] - 1) return null;
        return (
          <div
            key={li}
            style={{
              position: "absolute",
              left: align === "center" ? 0 : x,
              width: align === "center" ? 1920 : undefined,
              top: t0,
              display: "flex",
              justifyContent: align === "center" ? "center" : "flex-start",
              whiteSpace: "nowrap",
              fontFamily: OUTFIT,
              fontWeight: ln.weight ?? 600,
              fontSize: ln.size,
              letterSpacing: ln.tracking ?? (ln.size > 100 ? "-0.045em" : "-0.025em"),
              lineHeight: 1.02,
              color: ln.color ?? "#fff",
            }}
          >
            {ln.w.map(([t, at], i) => {
              const p = outExpo(clamp01((f - at) / dur));
              const q = out === undefined ? 0 : r01(f, out + k * 0.8, out + k * 0.8 + 11, (u) => u * u);
              k++;
              return (
                <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: `0 ${ln.size * 0.02}px ${ln.size * 0.2}px`, margin: `0 ${ln.size * 0.22 - ln.size * 0.04}px ${-ln.size * 0.2}px 0` }}>
                  <span style={{ display: "inline-block", color: ln.hi?.[i], transform: `translateY(${(1 - p) * 120 - q * 120}%)`, filter: p < 1 || q > 0 ? `blur(${((1 - p) + q) * ln.size * 0.06}px)` : undefined, opacity: p > 0 ? 1 : 0 }}>{t}</span>
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
};

// ------------------------------------------------------------------ the phone, in 3D, on one continuous path
export type Pose = { x: number; y: number; s: number; rx: number; ry: number; rz: number };
/** the idle drift every scene shares, so a cut never stops the phone mid-move */
export const drift = (f: number, x = 1370, y = 548, s = 1.12): Pose => ({
  x: x + Math.sin(f / 97) * 12,
  y: y + Math.sin(f / 61) * 9,
  s: s * (1 + 0.012 * Math.sin(f / 73)),
  rx: 5 + 3 * Math.sin(f / 83),
  ry: -15 + 7 * Math.sin(f / 71),
  rz: 1.3 * Math.sin(f / 113),
});
export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), rx: lerp(a.rx, b.rx, t), ry: lerp(a.ry, b.ry, t), rz: lerp(a.rz, b.rz, t) });
export const addPose = (a: Pose, d: Partial<Pose>): Pose => ({ x: a.x + (d.x ?? 0), y: a.y + (d.y ?? 0), s: a.s * (d.s ?? 1), rx: a.rx + (d.rx ?? 0), ry: a.ry + (d.ry ?? 0), rz: a.rz + (d.rz ?? 0) });

export const Device: React.FC<{ pose: Pose; children: React.ReactNode; glow?: string; dark?: boolean; blur?: number }> = ({ pose, children, glow, dark = true, blur = 0 }) => {
  const { x, y, s, rx, ry, rz } = pose;
  const glare = clamp01(0.5 + ry / 60);
  return (
    <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: `${x}px ${y}px` }}>
      {/* floor shadow and the screen's light spilling round the phone */}
      <div style={{ position: "absolute", left: x - 260 * s, top: y + 420 * s, width: 520 * s, height: 80 * s, borderRadius: "50%", background: `radial-gradient(ellipse, rgba(0,0,0,${dark ? 0.7 : 0.22}) 0%, rgba(0,0,0,0) 70%)`, filter: `blur(${14 * s}px)` }} />
      {glow && <div style={{ position: "absolute", left: x - 420 * s, top: y - 560 * s, width: 840 * s, height: 1120 * s, borderRadius: "50%", background: `radial-gradient(ellipse, ${glow} 0%, rgba(0,0,0,0) 65%)` }} />}
      <div
        style={{
          position: "absolute",
          left: x - 215,
          top: y - 442,
          width: 430,
          height: 884,
          transformStyle: "preserve-3d",
          transform: `scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
        }}
      >
        <Phone glare={glare}>{children}</Phone>
      </div>
    </AbsoluteFill>
  );
};

/** everything in a scene rides one camera that never stops: a slow push and a breath of drift */
export const Rig: React.FC<{ children: React.ReactNode; from: number; to: number; push?: number; x?: number; y?: number }> = ({ children, from, to, push = 0.035, x = 0, y = 0 }) => {
  const f = useCurrentFrame();
  const t = clamp01((f - from) / Math.max(1, to - from));
  const s = 1 + push * t;
  const dx = x * t + Math.sin(f / 53) * 4;
  const dy = y * t + Math.cos(f / 67) * 3;
  return <AbsoluteFill style={{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>;
};

/** a soft white flash on a hard cut */
export const CutFlash: React.FC<{ at: number; a?: number; len?: number; color?: string }> = ({ at, a = 0.5, len = 6, color = "255,255,255" }) => {
  const f = useCurrentFrame();
  const t = (f - at) / len;
  if (t < 0 || t > 1) return null;
  return <AbsoluteFill style={{ background: `rgba(${color},${a * (1 - t) ** 2})`, pointerEvents: "none" }} />;
};
