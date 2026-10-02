import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease } from "../lib/anim";
import { INK, INK_DARK, KineticText, KWord, SHADOW, SHADOW_DARK } from "./KineticText";

export const ACCENT: [string, string] = ["#b9ffd6", "#00c46a"];
export const ACCENT_LIGHT: [string, string] = ["#2be38a", "#00964d"];

export type PhraseDef = {
  words: KWord[];
  /** frame the phrase starts leaving (blur + scale back) */
  out: number;
  breaks?: number[];
};

/**
 * A few big words at a time, centred: they rise in letter by letter, then leave with an Apple-style
 * blur + slight scale back before the next phrase lands in the same spot.
 */
export const PhraseSeq: React.FC<{ phrases: PhraseDef[]; fontSize: number; y?: number; dur?: number; light?: boolean }> = ({ phrases, fontSize, y = 0, dur = 14, light = false }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {phrases.map((p, i) => {
        const start = p.words[0].at - 2;
        // leave before the next phrase lands so two lines never overlap
        const next = phrases[i + 1];
        const out = next ? Math.min(p.out, next.words[0].at - 9) : p.out;
        if (frame < start || frame > out + 8) return null;
        const t = clamp01((frame - out) / 7);
        return (
          <AbsoluteFill
            key={i}
            style={{
              justifyContent: "center",
              alignItems: "center",
              transform: `translateY(${y - 30 * ease.inCubic(t)}px) scale(${1 - 0.08 * ease.inCubic(t)})`,
              opacity: 1 - ease.inCubic(t),
              filter: t > 0 ? `blur(${18 * t}px)` : undefined,
            }}
          >
            <KineticText words={p.words} fontSize={fontSize} breaks={p.breaks} ink={light ? INK : INK_DARK} tint={light ? ACCENT_LIGHT : ACCENT} shadow={light ? SHADOW : SHADOW_DARK} dur={dur} style={{ letterSpacing: "-0.035em", textAlign: "center" }} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

export type TrackDef = PhraseDef & { suffix?: (frame: number) => React.ReactNode };

/**
 * Camera-tracked phrases: each phrase is laid out at its own spot in a larger "world" and a virtual
 * camera whips from one to the next (ease in/out, slight roll, pull-back mid-move, motion blur along
 * the travel). Phrases that fall behind the camera fade and blur away; the last one leaves on `out`.
 */
export const TrackPhrases: React.FC<{
  phrases: TrackDef[];
  fontSize: number;
  y?: number;
  light?: boolean;
  /** world spacing as a fraction of the frame [x, y] */
  spread?: [number, number];
  width: number;
  height: number;
  dur?: number;
}> = ({ phrases, fontSize, y = 0, light = false, spread = [0.85, 0.32], width, height, dur = 14 }) => {
  const frame = useCurrentFrame();
  const sx = width * spread[0];
  const sy = height * spread[1];
  const pos = phrases.map((_, i) => [i * sx, i === 0 ? 0 : (i % 2 ? -1 : 0.6) * sy] as [number, number]);
  const starts = phrases.map((p) => p.words[0].at - 2);
  const MOVE = 10;

  const cam = (fr: number) => {
    let x = pos[0][0];
    let yy = pos[0][1];
    let bump = 0;
    let roll = 0;
    for (let i = 1; i < phrases.length; i++) {
      const t = clamp01((fr - (starts[i] - 6)) / MOVE);
      const e = ease.inOutQuart(t);
      x += (pos[i][0] - pos[i - 1][0]) * e;
      yy += (pos[i][1] - pos[i - 1][1]) * e;
      bump = Math.max(bump, Math.sin(Math.PI * t));
      roll += (i % 2 ? -1 : 1) * 2.2 * Math.sin(Math.PI * t);
    }
    return { x, y: yy, bump, roll };
  };
  const c = cam(frame);
  const cp = cam(frame - 1);
  const vx = Math.abs(c.x - cp.x);
  const vy = Math.abs(c.y - cp.y);
  // slow push-in while a phrase holds
  const cur = starts.filter((s) => frame >= s - 6).length - 1;
  const hold = clamp01((frame - starts[Math.max(0, cur)]) / 60);
  const zoom = (1 + 0.035 * hold) * (1 - 0.1 * c.bump);

  const last = phrases[phrases.length - 1];
  const outT = clamp01((frame - last.out) / 8);

  return (
    <AbsoluteFill style={{ perspective: 1600 }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${y}px) scale(${zoom}) rotate(${c.roll}deg)`,
          opacity: 1 - ease.inCubic(outT),
          filter: outT > 0 ? `blur(${18 * outT}px)` : undefined,
        }}
      >
        <DirBlur x={Math.min(34, vx * 0.22)} y={Math.min(34, vy * 0.22)} style={{ position: "absolute", inset: 0 }}>
          {phrases.map((p, i) => {
            if (frame < starts[i]) return null;
            const dx = pos[i][0] - c.x;
            const dy = pos[i][1] - c.y;
            const dist = Math.hypot(dx / sx, dy / (sy || 1) * 0.5);
            const vis = 1 - clamp01((dist - 0.25) / 0.45);
            if (vis <= 0) return null;
            return (
              <AbsoluteFill
                key={i}
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  transform: `translate(${dx}px, ${dy}px)`,
                  opacity: vis,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <KineticText words={p.words} fontSize={fontSize} breaks={p.breaks} ink={light ? INK : INK_DARK} tint={light ? ACCENT_LIGHT : ACCENT} shadow={light ? SHADOW : SHADOW_DARK} dur={dur} style={{ letterSpacing: "-0.035em", textAlign: "center" }} />
                  {p.suffix?.(frame)}
                </div>
              </AbsoluteFill>
            );
          })}
        </DirBlur>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** "…" as three dots that hop up one after another in a loop, like a typing indicator. */
export const WaveDots: React.FC<{ frame: number; at: number; size: number; light?: boolean }> = ({ frame, at, size, light }) => {
  const local = frame - at;
  if (local < 0) return null;
  return (
    <div style={{ display: "flex", gap: size * 0.11, marginLeft: size * 0.08, paddingBottom: size * 0.2 }}>
      {[0, 1, 2].map((i) => {
        const appear = ease.outCubic(clamp01((local - i * 3) / 6));
        const ph = ((local - i * 4) / 18) * Math.PI * 2;
        const hop = local - i * 4 > 0 ? Math.max(0, Math.sin(ph)) : 0;
        return (
          <div
            key={i}
            style={{
              width: size * 0.13,
              height: size * 0.13,
              borderRadius: "50%",
              background: light ? "linear-gradient(180deg, #34463d, #050a07)" : "linear-gradient(180deg, #ffffff, #b4c4bb)",
              opacity: appear,
              transform: `translateY(${-hop * size * 0.22}px) scale(${0.4 + 0.6 * appear})`,
            }}
          />
        );
      })}
    </div>
  );
};
