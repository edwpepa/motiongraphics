import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CARD_H, CARD_W, TaskerCard } from "../components/TaskerCard";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { C, FONT } from "../theme";
import { f, VO } from "../timing";

const IN = 476;
const SELECT = f(VO.lucrezi) - 3;
const SPLIT = f(VO.laPretul) - 3;
const PRICE = f(VO.stabilit);
const DEAL = f(VO.voiDoi);

const TASKERS = [
  { emoji: "👨‍🔧", name: "Andrei P.", role: "Instalator", rating: "4,9", jobs: "42 task-uri", km: "1,2 km" },
  { emoji: "👷", name: "Mihai D.", role: "Instalator", rating: "5,0", jobs: "67 task-uri", km: "0,8 km" },
  { emoji: "🧑‍🔧", name: "Radu C.", role: "Meșter", rating: "4,8", jobs: "31 task-uri", km: "2,1 km" },
];
const CHOSEN = 1;
const SLOT = 470;

type Pose = { x: number; y: number; rotY: number; scale: number; opacity: number };

const cardPose = (i: number, frame: number): Pose => {
  const start = IN + i * 5;
  const t = ease.outExpo(clamp01((frame - start) / 20));
  let x = (i - 1) * SLOT + 1500 * (1 - t);
  let rotY = -38 * (1 - t) - 5;
  let scale = 1;
  let opacity = clamp01((frame - start) / 6);

  const sel = ease.outCubic(clamp01((frame - SELECT) / 10));
  const split = ease.inOutCubic(clamp01((frame - SPLIT) / 16));
  if (i === CHOSEN) {
    scale *= 1 + 0.06 * sel - 0.06 * split;
    x += -400 * split;
    rotY += 5 * split + 8 * split;
  } else {
    scale *= 1 - 0.06 * sel;
    opacity *= 1 - 0.6 * sel;
    const away = ease.inCubic(clamp01((frame - SPLIT) / 12));
    x += (i < CHOSEN ? -1 : 1) * 1700 * away;
    opacity *= 1 - away;
  }
  return { x, y: drift(frame, 6, 95 + i * 13, i), rotY, scale, opacity };
};

const youPose = (frame: number): Pose => {
  const t = ease.outExpo(clamp01((frame - (SPLIT + 4)) / 18));
  return { x: 400 + 1300 * (1 - t), y: drift(frame, 6, 110, 2), rotY: -8 - 30 * (1 - t), scale: 0.94, opacity: clamp01((frame - SPLIT - 4) / 6) };
};

const Placed: React.FC<{ pose: Pose; prev: Pose; children: React.ReactNode }> = ({ pose, prev, children }) => (
  <DirBlur
    x={Math.min(40, Math.abs(pose.x - prev.x) * 0.3)}
    style={{
      position: "absolute",
      left: 960 - CARD_W / 2,
      top: 540 - CARD_H / 2 + 30,
      opacity: pose.opacity,
      transform: `translate(${pose.x}px, ${pose.y}px) rotateY(${pose.rotY}deg) scale(${pose.scale})`,
    }}
  >
    {children}
  </DirBlur>
);

// "tu alegi cu cine lucrezi, la prețul stabilit chiar de voi doi."
export const S6Choose: React.FC = () => {
  const frame = useCurrentFrame();
  const sel = ease.outCubic(clamp01((frame - SELECT) / 10));
  const deal = ease.outCubic(clamp01((frame - DEAL) / 8));
  const badge = pop(frame, SELECT + 2, 11, 180);

  const line = ease.inOutCubic(clamp01((frame - (PRICE - 8)) / 12));
  const price = pop(frame, PRICE, 11, 170);
  const caption = clamp01((frame - (PRICE + 8)) / 10);
  const hand = pop(frame, DEAL - 1, 10, 180);

  const camShift = keys(frame, [
    [IN, 60],
    [SPLIT, 0],
  ], ease.outCubic);

  return (
    <AbsoluteFill style={{ perspective: 2000, transform: `translateX(${camShift}px)` }}>
      {/* heading like a tiny UI label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 118,
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 30,
          fontWeight: 600,
          color: C.nightInkSoft,
          opacity: clamp01((frame - IN - 8) / 8) * (1 - clamp01((frame - SPLIT) / 8)),
        }}
      >
        Alege cu cine lucrezi
      </div>

      {TASKERS.map((t, i) => {
        const pose = cardPose(i, frame);
        if (pose.opacity <= 0.01) return null;
        return (
          <Placed key={t.name} pose={pose} prev={cardPose(i, frame - 1)}>
            <TaskerCard {...t} selected={i === CHOSEN ? Math.max(sel, deal) : 0} />
            {i === CHOSEN && (
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: -22,
                  padding: "10px 18px",
                  borderRadius: 999,
                  background: C.green,
                  color: "#fff",
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 24,
                  boxShadow: "0 10px 30px rgba(0,191,99,0.45)",
                  transform: `scale(${badge})`,
                }}
              >
                ✓ Ales
              </div>
            )}
          </Placed>
        );
      })}

      {frame >= SPLIT + 4 && (
        <Placed pose={youPose(frame)} prev={youPose(frame - 1)}>
          <TaskerCard
            emoji="🙋"
            name="Tu"
            role="💧 Robinet care curge"
            note="Postat acum 1 min"
            selected={deal}
            avatarBg="radial-gradient(circle at 35% 30%, #2f4a3d 0%, #18261f 70%)"
          />
        </Placed>
      )}

      {/* the agreement between the two of you */}
      {frame >= PRICE - 8 && (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
            <line
              x1={960 - 175}
              y1={570}
              x2={960 - 175 + 350 * line}
              y2={570}
              stroke={deal > 0 ? C.green : "rgba(255,255,255,0.35)"}
              strokeWidth={3}
              strokeDasharray="10 12"
              strokeDashoffset={-frame * 1.2}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 570,
              transform: `translate(-50%, -50%) scale(${price})`,
              padding: "16px 30px",
              borderRadius: 999,
              background: C.green,
              color: "#fff",
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 44,
              letterSpacing: "-0.02em",
              boxShadow: `0 16px 40px rgba(0,191,99,${0.35 + 0.3 * deal})`,
              whiteSpace: "nowrap",
            }}
          >
            150 lei
          </div>
          <div
            style={{
              position: "absolute",
              left: 960,
              top: 570 - 112,
              transform: `translate(-50%, -50%) scale(${hand}) rotate(${(1 - hand) * -25}deg)`,
              fontSize: 64,
            }}
          >
            🤝
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 650,
              textAlign: "center",
              fontFamily: FONT,
              fontWeight: 600,
              fontSize: 30,
              color: C.nightInkSoft,
              opacity: caption,
              transform: `translateY(${(1 - caption) * 12}px)`,
            }}
          >
            Preț stabilit de <span style={{ color: deal > 0.5 ? C.green : C.nightInk }}>voi doi</span>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
