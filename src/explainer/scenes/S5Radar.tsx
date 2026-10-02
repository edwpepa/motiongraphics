import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Avatar, Person } from "../components/Avatar";
import { Glyph, IconTile } from "../components/Icons";
import { GlassPill } from "../components/Pill";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, C, FONT } from "../theme";
import { PhraseSeq } from "../components/Phrase";
import { f, VO } from "../timing";

const RING_STARTS = [f(VO.taskerii) - 1, f(VO.taskerii) + 17, f(VO.vad) + 1];
const RING_DUR = 50;
const RING_MAX = 1000;

const ringRadius = (frame: number, start: number) => 40 + (RING_MAX - 40) * ease.outCubic(clamp01((frame - start) / RING_DUR));

// Same distances in both formats (so the "seen" blips in the soundtrack line up), different angles.
const TASKERS: { person?: Person; pos: [number, number]; vpos: [number, number]; km: string }[] = [
  { person: "andrei", pos: [-520, -215], vpos: [-300, -476], km: "1,2 km" },
  { person: "mihai", pos: [430, -255], vpos: [300, -400], km: "0,8 km" },
  { person: "radu", pos: [-330, 240], vpos: [-330, 240], km: "2,1 km" },
  { pos: [560, 175], vpos: [330, 485], km: "1,5 km" },
  { pos: [-770, 30], vpos: [-200, 745], km: "3 km" },
  { pos: [195, 320], vpos: [195, 320], km: "0,5 km" },
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
  const L = useLayout();
  const exitStart = 512;

  const camScale = keys(frame, [
    [436, 1.16],
    [exitStart, 1.0],
  ], ease.outCubic);
  const exitX = -L.W * 0.47 * ease.inCubic(clamp01((frame - exitStart) / 14));
  const exitXPrev = -L.W * 0.47 * ease.inCubic(clamp01((frame - 1 - exitStart) / 14));
  const exitFade = 1 - clamp01((frame - exitStart - 4) / 10);

  const positions = TASKERS.map((t) => (L.vertical ? t.vpos : t.pos));
  const lits = positions.map(([x, y]) => litFrame(Math.hypot(x, y)));
  
  const pinDrop = pop(frame, 442, 11, 140);

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
          <svg width={L.W} height={L.H} viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.55 }}>
            <path d="M-50 760 C 400 640, 900 860, 1980 600" stroke="rgba(255,255,255,0.06)" strokeWidth={26} fill="none" />
            <path d="M560 -40 L 820 1120" stroke="rgba(255,255,255,0.05)" strokeWidth={18} fill="none" />
            <path d="M1460 -40 L 1300 1120" stroke="rgba(255,255,255,0.05)" strokeWidth={14} fill="none" />
            <path d="M-40 300 L 1960 380" stroke="rgba(255,255,255,0.045)" strokeWidth={12} fill="none" />
          </svg>

          {/* radar rings */}
          <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0 }}>
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
                  <circle cx={L.cx} cy={L.cy} r={r} fill="url(#pulseFill)" />
                  <circle cx={L.cx} cy={L.cy} r={r} fill="none" stroke={C.green} strokeWidth={3.5 - 2 * t} />
                </g>
              );
            })}
            <circle cx={L.cx} cy={L.cy} r={130 + drift(frame, 6, 40)} fill="rgba(0,191,99,0.10)" />
          </svg>

          {/* taskers nearby */}
          {TASKERS.map((t, i) => {
            const [x, y] = positions[i];
            const appear = pop(frame, 441 + i * 2, 14, 150);
            const lit = clamp01((frame - lits[i]) / 6);
            const bump = 1 + 0.14 * Math.sin(clamp01((frame - lits[i]) / 9) * Math.PI);
            const badge = pop(frame, lits[i] + 3, 11, 190);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: L.cx + x,
                  top: L.cy + y + drift(frame, 5, 70 + i * 11, i),
                  transform: `translate(-50%, -50%) scale(${appear * bump})`,
                  opacity: clamp01(appear * 2) * (0.55 + 0.45 * lit),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ position: "relative" }}>
                  <Avatar person={t.person} size={108} lit={lit} />
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
                      transform: `scale(${badge})`,
                    }}
                  >
                    <Glyph name="eye" size={22} color="#ffffff" weight={2.6} />
                  </div>
                </div>
                <div style={{ fontFamily: FONT, fontWeight: BOLD, fontSize: 22, color: C.nightInkSoft }}>{t.km}</div>
              </div>
            );
          })}

          {/* the posted task */}
          <div style={{ position: "absolute", left: L.cx, top: L.cy, transform: `translate(-50%, -88%) scale(${pinDrop})` }}>
            <Pin />
          </div>
          <div
            style={{
              position: "absolute",
              left: L.cx,
              top: L.cy - 150,
              transform: `translate(-50%, -100%) scale(${pop(frame, 448, 12, 160)})`,
            }}
          >
            <GlassPill tone="dark" icon={<IconTile name="droplet" color="blue" size={44} />} label="Robinet care curge" size={30} />
          </div>
        </AbsoluteFill>
      </DirBlur>

      <PhraseSeq
        phrases={[
          { words: [{ text: "Taskerii", at: f(VO.taskerii) - 3 }, { text: "din", at: f(VO.dinZona) - 3 }, { text: "zona", at: f(VO.dinZona) }, { text: "ta", at: f(VO.dinZona) + 3 }], out: f(VO.vad) - 4 },
          { words: [{ text: "văd", at: f(VO.vad) - 3 }, { text: "task-ul", at: f(VO.vadTaskul) - 3 }], out: exitStart },
        ]}
        fontSize={L.vertical ? 96 : 80}
        y={L.vertical ? -720 : -415}
      />
    </AbsoluteFill>
  );
};
