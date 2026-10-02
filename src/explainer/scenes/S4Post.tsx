import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../components/AppScreen";
import { Phone, PHONE_H, PHONE_W } from "../components/Phone";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { GlassPill } from "../components/Pill";
import { useLayout } from "../layout";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { ACCENT, PhraseSeq } from "../components/Phrase";
import { f, VO } from "../timing";

const ENTER = 330;
const TYPE_START = f(VO.postezi) + 1;
const CATEGORY = f(VO.taskul) + 4;
const PRESS = f(VO.handlyWord) + 2;
const SUCCESS = PRESS + 10;
const SECONDS_CHIP = f(VO.cateva) - 2;
const EXIT = 436;

type ChipDef = { icon: GlyphName; tile: TileColor; label: string; at: number; pos: [number, number]; vpos: [number, number]; z: number; size?: number };
const CHIPS: ChipDef[] = [
  { icon: "wrench", tile: "blue", label: "Instalații", at: CATEGORY + 4, pos: [-330, -330], vpos: [-200, -545], z: 120 },
  { icon: "pin", tile: "red", label: "În zona ta", at: PRESS + 2, pos: [340, -200], vpos: [225, -470], z: 90 },
  { icon: "check", tile: "green", label: "Task postat", at: SUCCESS + 5, pos: [330, 250], vpos: [230, 470], z: 140 },
  { icon: "timer", tile: "orange", label: "Gata în câteva secunde", at: SECONDS_CHIP, pos: [-300, 360], vpos: [-95, 565], z: 170, size: 34 },
];

const phoneMotion = (frame: number, vertical: boolean) => {
  const inT = ease.outExpo(clamp01((frame - ENTER) / 16));
  const outT = ease.inCubic(clamp01((frame - EXIT) / 13));
  const rotY = keys(frame, [
    [ENTER, 160],
    [ENTER + 16, -16],
    [EXIT, 9],
  ], ease.outCubic) - 26 * outT;
  return {
    x: (vertical ? 800 : 950) * (1 - inT),
    rotY,
    rotX: 5 + 60 * outT,
    y: 300 * outT + drift(frame, 7, 120),
    scale: (vertical ? 1.12 : 0.86) * (1.6 - 0.6 * inT) * (1 - 0.18 * outT),
    opacity: 1 - clamp01((frame - EXIT - 9) / 5),
  };
};

// "Postezi task-ul pe handly.ro — durează câteva secunde."
export const S4Post: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const m = phoneMotion(frame, L.vertical);
  const mp = phoneMotion(frame - 1, L.vertical);

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
    [TYPE_START + 6, L.vertical ? 1.4 : 1.55],
    [CATEGORY - 3, L.vertical ? 1.4 : 1.55],
    [CATEGORY + 9, 1],
  ], ease.inOutCubic);
  const zoomK = (zoom - 1) / (L.vertical ? 0.4 : 0.55);
  const camY = (L.vertical ? 190 : 150) * zoomK;

  // smear while it spins in / drops out
  const blurX = Math.min(28, Math.abs(m.x - mp.x) * 0.3 + Math.abs(m.rotY - mp.rotY) * 1.3);
  const blurY = Math.min(28, Math.abs(m.y - mp.y) * 0.35);

  const V = L.vertical;
  const OX = V ? 0 : 430;
  const OY = V ? 170 : 20;
  const halo = clamp01((frame - ENTER) / 10) * (1 - clamp01((frame - EXIT) / 10)) * (1 + 0.6 * Math.max(0, 1 - (frame - ENTER - 6) / 14));
  const phrases = [
    { words: [{ text: "Postează", at: f(VO.postezi) - 3 }, { text: "task-ul", at: f(VO.taskul) - 3 }], out: f(VO.peHandly) - 4 },
    { words: [{ text: "pe", at: f(VO.peHandly) - 3 }, { text: "handly.ro", at: f(VO.handlyWord) - 3, color: ACCENT }], out: f(VO.dureaza) - 4 },
    {
      words: [
        { text: "Durează", at: f(VO.dureaza) - 3 },
        { text: "câteva", at: f(VO.cateva) - 3 },
        { text: "secunde", at: f(VO.secunde) - 3 },
      ],
      out: EXIT - 2,
      breaks: [0],
    },
  ];

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${V ? 0 : -470}px)` }}>
        <PhraseSeq phrases={phrases} fontSize={V ? 108 : 96} y={V ? -700 : 0} />
      </div>
      {/* glow behind the phone */}
      <div
        style={{
          position: "absolute",
          left: L.cx + OX - 520,
          top: L.cy + OY - 520,
          width: 1040,
          height: 1040,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,230,118,0.55) 0%, rgba(0,191,99,0.25) 35%, rgba(0,0,0,0) 68%)",
          opacity: halo,
          transform: `scale(${0.9 + 0.1 * Math.sin(frame / 18)})`,
        }}
      />
    <AbsoluteFill style={{ opacity: m.opacity, transform: `translate(${OX}px, ${OY}px)` }}>
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
            const [cx, cy] = L.vertical ? c.vpos : c.pos;
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
                  transform: `translate3d(${cx * (0.55 + 0.45 * p)}px, ${cy * (0.55 + 0.45 * p) - 1000 * fly + drift(frame, 6, 90 + i * 17, i)}px, ${c.z}px) translate(-50%, -50%) scale(${p * 1.08}) rotateY(${-m.rotY * 0.6}deg)`,
                  opacity: clamp01(p * 3),
                }}
              >
                <GlassPill tone="dark" icon={<IconTile name={c.icon} color={c.tile} size={(c.size ?? 30) * 1.45} />} label={c.label} size={c.size ?? 30} />
              </DirBlur>
            );
          })}
        </div>
      </DirBlur>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};
