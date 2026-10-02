import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../components/AppScreen";
import { Phone, PHONE_H, PHONE_W } from "../components/Phone";
import { Pill } from "../components/Pill";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { f, VO } from "../timing";

const ENTER = 287;
const TYPE_START = f(VO.postezi) + 1;
const CATEGORY = f(VO.taskul) + 9;
const PRESS = f(VO.peHandly) + 4;
const SUCCESS = PRESS + 10;
const SECONDS_CHIP = f(VO.cateva) - 2;
const EXIT = 397;

type ChipDef = { emoji: string; label: string; at: number; x: number; y: number; z: number; size?: number };
const CHIPS: ChipDef[] = [
  { emoji: "🔧", label: "Instalații", at: CATEGORY + 4, x: -470, y: -250, z: 120 },
  { emoji: "📍", label: "În zona ta", at: PRESS + 2, x: 450, y: -175, z: 90 },
  { emoji: "✅", label: "Task postat", at: SUCCESS + 5, x: 470, y: 225, z: 140 },
  { emoji: "⏱️", label: "Gata în câteva secunde", at: SECONDS_CHIP, x: -520, y: 205, z: 170, size: 34 },
];

const phoneMotion = (frame: number) => {
  const inT = ease.outExpo(clamp01((frame - ENTER) / 24));
  const outT = ease.inCubic(clamp01((frame - EXIT) / 13));
  const rotY = keys(frame, [
    [ENTER, 82],
    [ENTER + 24, -16],
    [EXIT, 9],
  ], ease.outCubic) - 26 * outT;
  return {
    x: 950 * (1 - inT),
    rotY,
    rotX: 5 + 60 * outT,
    y: 300 * outT + drift(frame, 7, 120),
    scale: (0.8 + 0.06 * inT) * (1 - 0.18 * outT),
    opacity: 1 - clamp01((frame - EXIT - 9) / 5),
  };
};

// "Postezi task-ul pe handly.ro — durează câteva secunde."
export const S4Post: React.FC = () => {
  const frame = useCurrentFrame();
  const m = phoneMotion(frame);
  const mp = phoneMotion(frame - 1);

  const app = {
    typed: clamp01((frame - TYPE_START) / 16) * TASK_TEXT.length,
    caret: Math.floor(frame / 7) % 2 === 0 || (frame > TYPE_START && frame < TYPE_START + 18),
    focus: clamp01((frame - (TYPE_START - 4)) / 4) * (1 - clamp01((frame - CATEGORY) / 4)),
    category: ease.outCubic(clamp01((frame - CATEGORY) / 6)),
    press: clamp01((frame - PRESS) / 9),
    loading: clamp01((frame - (PRESS + 3)) / 12),
    success: ease.outCubic(clamp01((frame - SUCCESS) / 9)),
    check: clamp01((frame - (SUCCESS + 4)) / 12),
  };

  // camera: push in on the input while the task is typed, ease back out for the post + confirmation
  const zoom = keys(frame, [
    [TYPE_START - 4, 1],
    [TYPE_START + 6, 1.55],
    [CATEGORY - 3, 1.55],
    [CATEGORY + 9, 1],
  ], ease.inOutCubic);
  const zoomK = (zoom - 1) / 0.55;
  const camY = 150 * zoomK;

  // smear while it spins in / drops out
  const blurX = Math.min(28, Math.abs(m.x - mp.x) * 0.3 + Math.abs(m.rotY - mp.rotY) * 1.3);
  const blurY = Math.min(28, Math.abs(m.y - mp.y) * 0.35);

  return (
    <AbsoluteFill style={{ opacity: m.opacity }}>
      <DirBlur x={blurX} y={blurY} style={{ position: "absolute", inset: 0, perspective: 1900 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) translateY(${camY}px) translate(${m.x}px, ${m.y}px) scale(${m.scale}) rotateX(${m.rotX}deg) rotateY(${m.rotY}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: -PHONE_W / 2, top: -PHONE_H / 2, transformStyle: "preserve-3d" }}>
            <Phone glare={clamp01((frame - ENTER) / 110)}>
              <AppScreen s={app} />
            </Phone>
          </div>

          {CHIPS.map((c, i) => {
            const p = pop(frame, c.at, 12, 160);
            if (p <= 0.001) return null;
            const fly = ease.inCubic(clamp01((frame - (EXIT - 2 + i * 2)) / 10));
            const flyPrev = ease.inCubic(clamp01((frame - 1 - (EXIT - 2 + i * 2)) / 10));
            return (
              <DirBlur
                key={c.label}
                y={(fly - flyPrev) * 900 * 0.3}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate3d(${c.x * (0.55 + 0.45 * p)}px, ${c.y * (0.55 + 0.45 * p) - 1000 * fly + drift(frame, 6, 90 + i * 17, i)}px, ${c.z}px) translate(-50%, -50%) scale(${p * 1.08}) rotateY(${-m.rotY * 0.6}deg)`,
                  opacity: clamp01(p * 3),
                }}
              >
                <Pill emoji={c.emoji} label={c.label} size={c.size ?? 30} />
              </DirBlur>
            );
          })}
        </div>
      </DirBlur>
    </AbsoluteFill>
  );
};
