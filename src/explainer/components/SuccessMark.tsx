import React from "react";
import { LiquidGlass } from "./Glass";
import { Orb } from "./Orb";
import { clamp01, ease, lerp, pop } from "../lib/anim";

/**
 * The "Se rezolvă!" mark: three drops of light spiral in and melt together, the drop wobbles like
 * liquid into a perfect circle, a liquid-glass lens settles over it (refracting the core and the
 * shockwaves), the check draws itself, and a double ripple + spark burst rolls out.
 */
export const SuccessMark: React.FC<{ frame: number; at: number; size: number }> = ({ frame, at, size: cs }) => {
  const t = frame - at;
  if (t < 0) return <div style={{ width: cs, height: cs }} />;
  const box = cs * 4;
  const c = box / 2;

  // 1. three drops spiral in and merge
  const gather = ease.inOutCubic(clamp01(t / 10));
  const drops = [0, 1, 2].map((i) => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2 + gather * 2.2;
    const rad = (1 - gather) * cs * 1.15;
    return { x: c + Math.cos(a) * rad, y: c + Math.sin(a) * rad, r: lerp(cs * 0.09, cs * 0.3, gather) };
  });
  const merged = t >= 9;

  // 2. the merged drop wobbles like liquid into a circle
  const core = pop(frame, at + 8, 9, 190);
  const wob = Math.max(0, 1 - (t - 8) / 16);
  const k = Math.sin((t - 8) * 0.9) * wob;
  const radius = `${50 + 12 * k}% ${50 - 12 * k}% ${50 + 9 * k}% ${50 - 9 * k}% / ${50 - 10 * k}% ${50 + 10 * k}% ${50 - 8 * k}% ${50 + 8 * k}%`;

  // 3. glass lens, check, ripples, sparks
  const lens = ease.outCubic(clamp01((t - 10) / 10));
  const check = ease.outCubic(clamp01((t - 12) / 12));
  const ripple = (d: number) => clamp01((t - 9 - d) / 22);
  const flash = clamp01((t - 8) / 3) * (1 - clamp01((t - 11) / 10));

  return (
    <div style={{ position: "relative", width: cs, height: cs }}>
      <div style={{ position: "absolute", left: cs / 2 - c, top: cs / 2 - c, width: box, height: box, pointerEvents: "none" }}>
        {/* slow light rays fanning out behind the badge */}
        <div
          style={{
            position: "absolute",
            inset: box * 0.12,
            borderRadius: "50%",
            background: `repeating-conic-gradient(from ${t * 1.6}deg, rgba(185,255,214,0.32) 0deg 5deg, rgba(185,255,214,0) 5deg 22deg)`,
            WebkitMaskImage: "radial-gradient(circle, transparent 14%, #000 22%, transparent 62%)",
            maskImage: "radial-gradient(circle, transparent 14%, #000 22%, transparent 62%)",
            opacity: ease.outCubic(clamp01((t - 9) / 10)) * 0.9,
          }}
        />
        {/* flash bloom */}
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(185,255,214,0.9) 0%, rgba(0,230,118,0.35) 18%, rgba(0,0,0,0) 45%)", opacity: flash }} />
        {/* shockwaves */}
        <svg width={box} height={box} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {[0, 5].map((d) => {
            const p = ripple(d);
            if (p <= 0 || p >= 1) return null;
            const e = ease.outCubic(p);
            return <circle key={d} cx={c} cy={c} r={cs * (0.5 + 1.0 * e)} fill="none" stroke="#2be38a" strokeWidth={(1 - e) * cs * 0.06 + 1} opacity={(1 - p) * 0.8} />;
          })}
          {/* sparks */}
          {Array.from({ length: 12 }, (_, i) => {
            const p = clamp01((t - 9) / 18);
            if (p <= 0 || p >= 1) return null;
            const a = (i / 12) * Math.PI * 2 + 0.2;
            const e = ease.outCubic(p);
            const d0 = cs * 0.55;
            const d1 = cs * (1.25 + 0.35 * ((i * 7) % 3) / 2);
            const r0 = lerp(d0, d1, e);
            const len = cs * 0.12 * (1 - p);
            return (
              <line
                key={i}
                x1={c + Math.cos(a) * r0}
                y1={c + Math.sin(a) * r0}
                x2={c + Math.cos(a) * (r0 + len)}
                y2={c + Math.sin(a) * (r0 + len)}
                stroke="#b9ffd6"
                strokeWidth={cs * 0.03}
                strokeLinecap="round"
                opacity={1 - p}
              />
            );
          })}
        </svg>
        {/* drops melting together */}
        {!merged || t < 13 ? (
          <div style={{ position: "absolute", inset: 0, opacity: merged ? 1 - clamp01((t - 9) / 4) : 1 }}>
            <Orb blobs={drops} size={box} glow={0.9} gooRadius={cs * 0.08} />
          </div>
        ) : null}
      </div>

      {/* liquid core */}
      {merged && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: "radial-gradient(circle at 35% 28%, #b9ffd6 0%, #2be38a 45%, #00a352 100%)",
            boxShadow: `0 0 ${cs * 0.6}px rgba(43,227,138,0.55)`,
            transform: `scale(${core})`,
          }}
        />
      )}
      {/* glass lens over the core */}
      {lens > 0 && (
        <div style={{ position: "absolute", left: -cs * 0.08, top: -cs * 0.08, transform: `scale(${0.7 + 0.3 * lens})`, opacity: lens }}>
          <LiquidGlass width={Math.round(cs * 1.16)} height={Math.round(cs * 1.16)} radius={Math.round(cs * 0.58)} tone="dark" strength={cs * 0.45} frost={1} tint={0.06} sheen={lerp(-0.4, 1.3, clamp01((t - 14) / 14))} />
        </div>
      )}
      {/* a light streak sweeps across the badge */}
      {merged && (
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden", transform: `scale(${core})` }}>
          <div
            style={{
              position: "absolute",
              top: -cs * 0.5,
              bottom: -cs * 0.5,
              width: cs * 0.28,
              left: `${lerp(-60, 160, clamp01((t - 16) / 12))}%`,
              transform: "rotate(24deg)",
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      )}
      {/* the check draws itself */}
      {merged && (
        <svg width={cs} height={cs} viewBox="0 0 70 70" style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.6))" }}>
          <path d="M19 36 L30 47 L52 23" fill="none" stroke="#fff" strokeWidth={7.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - check} />
        </svg>
      )}
    </div>
  );
};
