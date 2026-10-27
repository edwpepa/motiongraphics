import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { inOutQuint, outExpo, outQuart, r01 } from "../apple";
import { Logo } from "../kit";
import { OUTFIT, useOutfit } from "./font";
import { GlassStage, Pane } from "./glass";

/** words rising out of a mask, one after another, Apple keynote style */
export const Rise: React.FC<{ text: string; at: number; size: number; x: number; y: number; color?: string; weight?: number; stagger?: number; out?: number; tracking?: string }> = ({ text, at, size, x, y, color = "#fff", weight = 600, stagger = 3, out, tracking = "-0.045em" }) => {
  const f = useCurrentFrame();
  const ws = text.split(" ");
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex", flexWrap: "nowrap", whiteSpace: "nowrap", fontFamily: OUTFIT, fontWeight: weight, fontSize: size, letterSpacing: tracking, lineHeight: 1.02, color }}>
      {ws.map((w, i) => {
        const p = outExpo(clamp01((f - at - i * stagger) / 22));
        const q = out === undefined ? 0 : r01(f, out + i * 1.5, out + i * 1.5 + 12, (t) => t * t);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.18, marginBottom: -size * 0.18, marginRight: size * 0.24 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - p) * 135 - q * 135}%)`, filter: p < 1 || q > 0 ? `blur(${(1 - p) * size * 0.05 + q * size * 0.05}px)` : undefined }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

export const StyleFrame: React.FC = () => {
  const ready = useOutfit();
  const f = useCurrentFrame();
  if (!ready) return null;
  // the lens glides across the headline, becomes a notification, becomes the app icon
  const m1 = r01(f, 92, 112, inOutQuint);
  const m2 = r01(f, 158, 180, inOutQuint);
  const lensX = lerp(1560, 300, r01(f, 6, 92, (t) => 0.5 - 0.5 * Math.cos(Math.PI * t)));
  const lens = { x: lensX, y: 360, w: 400, h: 400, r: 200 };
  const pill = { x: 960 - 470, y: 250, w: 940, h: 150, r: 75 };
  const icon = { x: 960 - 170, y: 250, w: 340, h: 340, r: 84 };
  const g = m2 > 0 ? { x: lerp(pill.x, icon.x, m2), y: lerp(pill.y, icon.y, m2), w: lerp(pill.w, icon.w, m2), h: lerp(pill.h, icon.h, m2), r: lerp(pill.r, icon.r, m2) } : { x: lerp(lens.x, pill.x, m1), y: lerp(lens.y, pill.y, m1), w: lerp(lens.w, pill.w, m1), h: lerp(lens.h, pill.h, m1), r: lerp(lens.r, pill.r, m1) };
  const green = r01(f, 166, 196, outQuart);
  const cam = 1 + 0.06 * (f / 240);
  const drift = Math.sin(f / 50) * 14;
  const under = (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,191,99,${0.55 * green}) 0%, rgba(0,60,32,${0.6 * green}) 45%, rgba(0,0,0,0) 80%)` }} />
      <AbsoluteFill style={{ transform: `scale(${cam}) translateX(${drift}px)` }}>
        <Rise text="Probleme prin casă" at={4} size={190} x={120} y={500} out={96} />
        <Rise text="care îți dau bătăi de cap?" at={14} size={70} x={126} y={720} color="rgba(255,255,255,0.72)" out={100} />
        <Rise text="Și tot amâni." at={112} size={150} x={120} y={600} out={160} />
        <Rise text="Aici intervine Handly." at={182} size={120} x={960 - 640} y={660} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
  const notif = (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 34px", gap: 24, fontFamily: OUTFIT, color: "#fff", opacity: clamp01((m1 - 0.6) / 0.4) * (1 - clamp01(m2 * 3)) }}>
      <div style={{ width: 84, height: 84, borderRadius: 22, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke="#ffd166" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 500, opacity: 0.6, letterSpacing: "0.04em" }}>MEMENTO · ACUM</div>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>Repară priza</div>
      </div>
      <div style={{ padding: "14px 30px", borderRadius: 999, background: `rgba(255,255,255,${0.16 + 0.2 * Math.sin(Math.PI * clamp01((f - 134) / 8))})`, fontSize: 30, fontWeight: 600 }}>Amână</div>
    </div>
  );
  const logo = (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: clamp01((m2 - 0.5) / 0.5) }}>
      <Logo size={200} tone="white" />
    </div>
  );
  const panes: Pane[] = [
    {
      x: g.x, y: g.y, w: g.w, h: g.h, radius: g.r, tone: "dark", zoom: lerp(1.1, 1.0, m1),
      refract: lerp(130, 60, m1), bezel: lerp(130, 60, m1) , frost: lerp(0.4, 6, m1),
      tint: m2 > 0 ? `rgba(0,191,99,${0.55 * m2})` : undefined,
      content: m1 < 0.5 ? null : m2 < 0.5 ? notif : logo,
    },
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <GlassStage under={under} panes={panes} />
    </AbsoluteFill>
  );
};
