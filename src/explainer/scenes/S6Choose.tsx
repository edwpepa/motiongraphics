import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Person } from "../components/Avatar";
import { Glyph, GlyphName } from "../components/Icons";
import { CARD_H, CARD_W, TaskerCard } from "../components/TaskerCard";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { Layout, useLayout } from "../layout";
import { BOLD, C, FONT } from "../theme";
import { PhraseSeq } from "../components/Phrase";
import { f, VO } from "../timing";

const IN = 514;
const SELECT = f(VO.lucrezi) - 3;
const SPLIT = f(VO.laPretul) - 3;
const PRICE = f(VO.stabilit);
const DEAL = f(VO.voiDoi);

const TASKERS: { person: Person; name: string; role: string; roleIcon: GlyphName; rating: string; jobs: string; km: string }[] = [
  { person: "andrei", name: "Andrei P.", role: "Instalator", roleIcon: "wrench", rating: "4,9", jobs: "42 task-uri", km: "1,2 km" },
  { person: "mihai", name: "Mihai D.", role: "Instalator", roleIcon: "wrench", rating: "5,0", jobs: "67 task-uri", km: "0,8 km" },
  { person: "radu", name: "Radu C.", role: "Meșter", roleIcon: "hammer", rating: "4,8", jobs: "31 task-uri", km: "2,1 km" },
];
const CHOSEN = 1;

type Pose = { x: number; y: number; rotY: number; scale: number; opacity: number };

// 16:9: a row of three that splits left/right. Reel: a carousel whose chosen card rises while "Tu" comes up from below.
const cardPose = (i: number, frame: number, vertical: boolean): Pose => {
  const slot = vertical ? 430 : 470;
  const start = IN + i * 5;
  const t = ease.outExpo(clamp01((frame - start) / 20));
  let x = (i - 1) * slot + 1500 * (1 - t);
  let y = vertical ? -40 : 0;
  let rotY = -38 * (1 - t) - 5;
  let scale = vertical ? 0.95 : 1;
  let opacity = clamp01((frame - start) / 6);

  const sel = ease.outCubic(clamp01((frame - SELECT) / 10));
  const split = ease.inOutCubic(clamp01((frame - SPLIT) / 16));
  if (i === CHOSEN) {
    scale *= 1 + 0.06 * sel - 0.06 * split;
    if (vertical) y += -360 * split;
    else x += -400 * split;
    rotY += 13 * split;
  } else {
    scale *= 1 - 0.06 * sel;
    opacity *= 1 - 0.6 * sel;
    const away = ease.inCubic(clamp01((frame - SPLIT) / 12));
    x += (i < CHOSEN ? -1 : 1) * 1700 * away;
    opacity *= 1 - away;
  }
  return { x, y: y + drift(frame, 6, 95 + i * 13, i), rotY, scale, opacity };
};

const youPose = (frame: number, vertical: boolean): Pose => {
  const t = ease.outExpo(clamp01((frame - (SPLIT + 4)) / 18));
  const opacity = clamp01((frame - SPLIT - 4) / 6);
  return vertical
    ? { x: 0, y: 400 + 1100 * (1 - t) + drift(frame, 6, 110, 2), rotY: -8, scale: 0.94, opacity }
    : { x: 400 + 1300 * (1 - t), y: drift(frame, 6, 110, 2), rotY: -8 - 30 * (1 - t), scale: 0.94, opacity };
};

const Placed: React.FC<{ L: Layout; pose: Pose; prev: Pose; children: React.ReactNode }> = ({ L, pose, prev, children }) => (
  <DirBlur
    x={Math.min(40, Math.abs(pose.x - prev.x) * 0.3)}
    y={Math.min(40, Math.abs(pose.y - prev.y) * 0.3)}
    style={{
      position: "absolute",
      left: L.cx - CARD_W / 2,
      top: L.cy - CARD_H / 2 + 30,
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
  const L = useLayout();
  const V = L.vertical;
  const sel = ease.outCubic(clamp01((frame - SELECT) / 10));
  const deal = ease.outCubic(clamp01((frame - DEAL) / 8));
  const badge = pop(frame, SELECT + 2, 11, 180);

  const line = ease.inOutCubic(clamp01((frame - (PRICE - 8)) / 12));
  const price = pop(frame, PRICE, 11, 170);
  const hand = pop(frame, DEAL - 1, 10, 180);

  const camShift = keys(frame, [
    [IN, 60],
    [SPLIT, 0],
  ], ease.outCubic);

  // the agreement sits in the gap between the two cards
  const pillX = L.cx;
  const pillY = L.cy + 30;
  const handPos = V ? { x: pillX - 185, y: pillY } : { x: pillX, y: pillY - 112 };

  return (
    <AbsoluteFill style={{ perspective: 2000, transform: `translateX(${camShift}px)` }}>
      <PhraseSeq
        phrases={[
          { words: [{ text: "Tu", at: f(VO.tuAlegi) - 3 }, { text: "alegi", at: f(VO.tuAlegi) + 1 }, { text: "cu", at: f(VO.cuCine) - 3 }, { text: "cine", at: f(VO.cuCine) }, { text: "lucrezi", at: f(VO.lucrezi) - 3 }], out: f(VO.laPretul) - 4, breaks: V ? [1] : [] },
          { words: [{ text: "Prețul", at: f(VO.laPretul) - 2 }, { text: "stabilit", at: f(VO.stabilit) - 3 }, { text: "de", at: f(VO.voiDoi) - 4 }, { text: "voi", at: f(VO.voiDoi) - 2 }, { text: "doi", at: f(VO.doi) - 3 }], out: 618, breaks: V ? [1] : [] },
        ]}
        fontSize={V ? 80 : 68}
        y={V ? -740 : -410}
      />

      {TASKERS.map((t, i) => {
        const pose = cardPose(i, frame, V);
        if (pose.opacity <= 0.01) return null;
        return (
          <Placed key={t.name} L={L} pose={pose} prev={cardPose(i, frame - 1, V)}>
            <TaskerCard {...t} selected={i === CHOSEN ? Math.max(sel, deal) : 0} />
            {i === CHOSEN && (
              <div
                style={{
                  position: "absolute",
                  right: -18,
                  top: -22,
                  padding: "10px 18px 10px 14px",
                  borderRadius: 999,
                  background: C.green,
                  color: "#fff",
                  fontFamily: FONT,
                  fontWeight: BOLD,
                  fontSize: 24,
                  boxShadow: "0 10px 30px rgba(0,191,99,0.45)",
                  transform: `scale(${badge})`,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Glyph name="check" size={24} color="#fff" weight={3} />
                Ales
              </div>
            )}
          </Placed>
        );
      })}

      {frame >= SPLIT + 4 && (
        <Placed L={L} pose={youPose(frame, V)} prev={youPose(frame - 1, V)}>
          <TaskerCard person="tu" name="Tu" role="Robinet care curge" roleIcon="droplet" note="Postat acum 1 min" selected={deal} />
        </Placed>
      )}

      {/* the agreement between the two of you */}
      {frame >= PRICE - 8 && (
        <>
          <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0 }}>
            <line
              x1={V ? pillX : pillX - 175}
              y1={V ? pillY - 170 : pillY}
              x2={V ? pillX : pillX - 175 + 350 * line}
              y2={V ? pillY - 170 + 340 * line : pillY}
              stroke={deal > 0 ? C.green : "rgba(255,255,255,0.35)"}
              strokeWidth={3}
              strokeDasharray="10 12"
              strokeDashoffset={-frame * 1.2}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              left: pillX,
              top: pillY,
              transform: `translate(-50%, -50%) scale(${price})`,
              padding: "16px 30px",
              borderRadius: 999,
              background: C.green,
              color: "#fff",
              fontFamily: FONT,
              fontWeight: BOLD,
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
              left: handPos.x,
              top: handPos.y,
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(180deg, #2fe08a 0%, #00b35c 100%)",
              boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3), 0 12px 30px rgba(0,191,99,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `translate(-50%, -50%) scale(${hand}) rotate(${(1 - hand) * -25}deg)`,
            }}
          >
            <Glyph name="handshake" size={50} color="#ffffff" weight={2.1} />
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};
