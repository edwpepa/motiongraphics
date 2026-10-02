import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Avatar } from "../components/Avatar";
import { Pill } from "../components/Pill";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { C, FONT } from "../theme";
import { f, VO } from "../timing";

const RING_STARTS = [f(VO.taskerii) - 1, f(VO.taskerii) + 17, f(VO.vad) + 1];
const RING_DUR = 50;
const RING_MAX = 1000;

const ringRadius = (frame: number, start: number) => 40 + (RING_MAX - 40) * ease.outCubic(clamp01((frame - start) / RING_DUR));

const TASKERS = [
  { emoji: "👨‍🔧", x: -520, y: -215, km: "1,2 km" },
  { emoji: "👷", x: 430, y: -255, km: "0,8 km" },
  { emoji: "🧑‍🔧", x: -330, y: 240, km: "2,1 km" },
  { emoji: "👩‍🔧", x: 560, y: 175, km: "1,5 km" },
  { emoji: "🧑‍🎨", x: -770, y: 30, km: "3 km" },
  { emoji: "👨‍🔧", x: 195, y: 320, km: "0,5 km" },
];

/** Frame at which the first radar ring reaches a point at `dist` px. */
const litFrame = (dist: number) => {
  for (let fr = RING_STARTS[0]; fr < RING_STARTS[0] + RING_DUR; fr++) {
    if (ringRadius(fr, RING_STARTS[0]) >= dist) return fr;
  }
  return RING_STARTS[0] + RING_DUR;
};

const Pin: React.FC = () => (
  <svg width={86} height={110} viewBox="0 0 86 110" style={{ overflow: "visible" }}>
    <ellipse cx={43} cy={106} rx={20} ry={6} fill="rgba(0,0,0,0.45)" />
    <path d="M43 104 C 43 104 6 62 6 40 A 37 37 0 0 1 80 40 C 80 62 43 104 43 104 Z" fill={C.green} />
    <circle cx={43} cy={40} r={15} fill="#fff" />
  </svg>
);

// "Taskerii din zona ta văd task-ul"
export const S5Radar: React.FC = () => {
  const frame = useCurrentFrame();
  const exitStart = 474;

  const camScale = keys(frame, [
    [398, 1.16],
    [exitStart, 1.0],
  ], ease.outCubic);
  const exitX = -900 * ease.inCubic(clamp01((frame - exitStart) / 14));
  const exitXPrev = -900 * ease.inCubic(clamp01((frame - 1 - exitStart) / 14));
  const exitFade = 1 - clamp01((frame - exitStart - 4) / 10);

  const lits = TASKERS.map((t) => litFrame(Math.hypot(t.x, t.y)));
  const seen = lits.filter((l) => frame >= l + 3).length;
  const label = pop(frame, f(VO.vad) - 6, 13, 150);

  const pinDrop = pop(frame, 404, 11, 140);

  return (
    <AbsoluteFill style={{ opacity: exitFade }}>
      <DirBlur x={Math.abs(exitX - exitXPrev) * 0.35} style={{ position: "absolute", inset: 0, transform: `translateX(${exitX}px)` }}>
        <AbsoluteFill style={{ transform: `scale(${camScale}) rotate(${drift(frame, 0.6, 200)}deg)` }}>
          {/* map floor: dot grid + a few streets, fading out to the edges */}
          <AbsoluteFill
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.11) 1.7px, transparent 2px)",
              backgroundSize: "38px 38px",
              backgroundPosition: `${drift(frame, 8, 160)}px ${drift(frame, 6, 190)}px`,
              WebkitMaskImage: "radial-gradient(ellipse 60% 62% at 50% 50%, #000 30%, transparent 100%)",
              maskImage: "radial-gradient(ellipse 60% 62% at 50% 50%, #000 30%, transparent 100%)",
            }}
          />
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
            <path d="M-50 760 C 400 640, 900 860, 1980 600" stroke="rgba(255,255,255,0.06)" strokeWidth={26} fill="none" />
            <path d="M560 -40 L 820 1120" stroke="rgba(255,255,255,0.05)" strokeWidth={18} fill="none" />
            <path d="M1460 -40 L 1300 1120" stroke="rgba(255,255,255,0.05)" strokeWidth={14} fill="none" />
            <path d="M-40 300 L 1960 380" stroke="rgba(255,255,255,0.045)" strokeWidth={12} fill="none" />
          </svg>

          {/* radar rings */}
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="pulseFill">
                <stop offset="0%" stopColor="rgba(0,191,99,0)" />
                <stop offset="85%" stopColor="rgba(0,191,99,0.10)" />
                <stop offset="100%" stopColor="rgba(0,191,99,0.22)" />
              </radialGradient>
            </defs>
            {RING_STARTS.map((s, i) => {
              if (frame < s) return null;
              const t = clamp01((frame - s) / RING_DUR);
              const r = ringRadius(frame, s);
              return (
                <g key={i} opacity={(1 - t) * (i === 2 ? 0.7 : 1)}>
                  <circle cx={960} cy={540} r={r} fill="url(#pulseFill)" />
                  <circle cx={960} cy={540} r={r} fill="none" stroke={C.green} strokeWidth={3.5 - 2 * t} />
                </g>
              );
            })}
            <circle cx={960} cy={540} r={130 + drift(frame, 6, 40)} fill="rgba(0,191,99,0.10)" />
          </svg>

          {/* taskers nearby */}
          {TASKERS.map((t, i) => {
            const appear = pop(frame, 403 + i * 2, 14, 150);
            const lit = clamp01((frame - lits[i]) / 6);
            const bump = 1 + 0.14 * Math.sin(clamp01((frame - lits[i]) / 9) * Math.PI);
            const badge = pop(frame, lits[i] + 3, 11, 190);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 960 + t.x,
                  top: 540 + t.y + drift(frame, 5, 70 + i * 11, i),
                  transform: `translate(-50%, -50%) scale(${appear * bump})`,
                  opacity: clamp01(appear * 2) * (0.55 + 0.45 * lit),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Avatar emoji={t.emoji} size={104} lit={lit} />
                  <div
                    style={{
                      position: "absolute",
                      right: -8,
                      bottom: -4,
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: C.green,
                      border: `3px solid ${C.night}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      transform: `scale(${badge})`,
                    }}
                  >
                    👀
                  </div>
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 22, color: C.nightInkSoft }}>{t.km}</div>
              </div>
            );
          })}

          {/* the posted task */}
          <div style={{ position: "absolute", left: 960, top: 540, transform: `translate(-50%, -88%) scale(${pinDrop})` }}>
            <Pin />
          </div>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 540 - 150,
              transform: `translate(-50%, -100%) scale(${pop(frame, 410, 12, 160)})`,
            }}
          >
            <Pill emoji="💧" label="Robinet care curge" size={30} />
          </div>
        </AbsoluteFill>
      </DirBlur>

      {/* live counter */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 92,
          transform: `translateX(-50%) translateY(${(1 - label) * -30}px) scale(${0.9 + 0.1 * label})`,
          opacity: clamp01(label * 2) * (1 - clamp01((frame - exitStart + 2) / 8)),
        }}
      >
        <Pill dark emoji="👀" label={`${Math.max(1, seen)} taskeri din zona ta au văzut task-ul`} size={30} />
      </div>
    </AbsoluteFill>
  );
};
