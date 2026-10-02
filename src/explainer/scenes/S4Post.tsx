import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../components/AppScreen";
import { Phone, PHONE_H, PHONE_W } from "../components/Phone";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { GlassPill } from "../components/Pill";
import { ACCENT, PhraseSeq } from "../components/Phrase";
import { useLayout } from "../layout";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { BOLD, FONT } from "../theme";
import { f, VO } from "../timing";

const ENTER = 330;
const TYPE_START = f(VO.postezi) + 1;
// the whole posting flow plays out; "Task postat" lands about three quarters of the way through
const CATEGORY = TYPE_START + 25;
const LOCATION = CATEGORY + 10;
const PRICE_SEL = LOCATION + 10;
const PRESS = PRICE_SEL + 10;
const SUCCESS = PRESS + 14;
const SECONDS_CHIP = f(VO.cateva) - 2;
const EXIT = 436;

type ChipDef = { icon: GlyphName; tile: TileColor; label: string; at: number; pos: [number, number]; vpos: [number, number]; z: number; size?: number };
const CHIPS: ChipDef[] = [
  { icon: "wrench", tile: "blue", label: "Instalații", at: CATEGORY + 3, pos: [-360, -320], vpos: [-200, -545], z: 120 },
  { icon: "pin", tile: "red", label: "În zona ta", at: LOCATION + 3, pos: [370, -200], vpos: [225, -470], z: 90 },
  { icon: "check", tile: "green", label: "Task postat", at: SUCCESS + 12, pos: [370, 250], vpos: [230, 470], z: 140 },
  { icon: "timer", tile: "orange", label: "Gata în câteva secunde", at: Math.max(SECONDS_CHIP, SUCCESS + 15), pos: [-470, 330], vpos: [-95, 565], z: 170, size: 34 },
];

const phoneMotion = (frame: number, vertical: boolean) => {
  const inT = ease.outExpo(clamp01((frame - ENTER) / 20));
  const outT = ease.inCubic(clamp01((frame - EXIT) / 13));
  // a full turn as it rises in from depth, a calm hold, then half a turn away on the exit
  const spin = ease.outCubic(clamp01((frame - ENTER) / 30));
  const rotY = -360 * (1 - spin) - 12 + 4 * Math.sin((frame - ENTER) / 30) - 180 * outT;
  return {
    x: 0,
    rotY,
    rotX: 5 + 22 * (1 - inT) + 20 * outT,
    rotZ: -6 * (1 - inT),
    y: (vertical ? 900 : 700) * (1 - inT) + 120 * outT + drift(frame, 7, 120),
    scale: (vertical ? 1.12 : 0.92) * (1.6 - 0.6 * inT) * (1 - 0.18 * outT) * keys(frame, [[SUCCESS + 2, 1], [SUCCESS + 16, vertical ? 0.8 : 0.76]], ease.inOutCubic),
    opacity: 1 - clamp01((frame - EXIT - 6) / 7),
  };
};

/**
 * Thin orbit rings around the phone, tilted in real 3D so they pass behind and in front of it: each
 * draws itself on, then turns slowly with a few glowing beads riding along it.
 */
const Orbits: React.FC<{ frame: number; a: number; boost: number }> = ({ frame, a, boost }) => {
  const rings = [
    { r: 560, tx: 74, ty: -16, sp: 0.55, beads: [0, 0.55], delay: 0 },
    { r: 700, tx: 70, ty: 14, sp: -0.4, beads: [0.25, 0.8], delay: 4 },
    { r: 840, tx: 78, ty: -4, sp: 0.3, beads: [0.6], delay: 8 },
  ];
  return (
    <>
      {rings.map((g, i) => {
        const draw = ease.inOutCubic(clamp01((frame - ENTER - 6 - g.delay) / 22));
        const D = g.r * 2;
        return (
          <div key={i} style={{ position: "absolute", left: -g.r, top: -g.r, width: D, height: D, transformStyle: "preserve-3d", transform: `rotateX(${g.tx}deg) rotateY(${g.ty}deg) rotateZ(${(frame - ENTER) * g.sp}deg)`, opacity: a }}>
            <svg width={D} height={D} viewBox={`${-g.r} ${-g.r} ${D} ${D}`} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
              <defs>
                <linearGradient id={`orb${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#b9ffd6" stopOpacity={0.9} />
                  <stop offset="50%" stopColor="#00c46a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#b9ffd6" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <circle r={g.r - 2} fill="none" stroke={`url(#orb${i})`} strokeWidth={2.2 + 1.5 * boost} pathLength={1} strokeDasharray={`${draw} 1`} transform="rotate(-90)" />
              {g.beads.map((b, k) => {
                const ang = (b * 360 - 90) * (Math.PI / 180);
                const vis = draw > b ? 1 : 0;
                return (
                  <g key={k} opacity={vis}>
                    <circle cx={Math.cos(ang) * (g.r - 2)} cy={Math.sin(ang) * (g.r - 2)} r={16} fill="#2be38a" opacity={0.35} style={{ filter: "blur(8px)" }} />
                    <circle cx={Math.cos(ang) * (g.r - 2)} cy={Math.sin(ang) * (g.r - 2)} r={6} fill="#e9fff2" />
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })}
    </>
  );
};

// "Postezi task-ul pe handly.ro — durează câteva secunde."
export const S4Post: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const m = phoneMotion(frame, L.vertical);
  const mp = phoneMotion(frame - 1, L.vertical);

  const app = {
    typed: clamp01((frame - TYPE_START) / 20) * TASK_TEXT.length,
    caret: Math.floor(frame / 7) % 2 === 0 || (frame > TYPE_START && frame < TYPE_START + 22),
    focus: clamp01((frame - (TYPE_START - 4)) / 4) * (1 - clamp01((frame - CATEGORY) / 4)),
    category: ease.outCubic(clamp01((frame - CATEGORY) / 6)),
    location: clamp01((frame - LOCATION) / 12),
    priceSel: ease.outCubic(clamp01((frame - PRICE_SEL) / 8)),
    press: clamp01((frame - PRESS) / 9),
    loading: clamp01((frame - (PRESS + 3)) / 12),
    success: ease.outCubic(clamp01((frame - SUCCESS) / 9)),
    check: clamp01((frame - (SUCCESS + 4)) / 12),
    since: frame - SUCCESS,
  };

  // camera: lean in on the form and follow it down field by field, then ease out for the confirmation
  const Z = L.vertical ? 1.4 : 1.55;
  const zoom = keys(frame, [
    [TYPE_START - 4, 1],
    [TYPE_START + 6, Z],
    [PRESS + 2, Z],
    [SUCCESS + 2, 1],
  ], ease.inOutCubic);
  const focus = keys(frame, [
    [TYPE_START + 6, 261],
    [CATEGORY - 4, 261],
    [CATEGORY + 2, 354],
    [LOCATION - 4, 354],
    [LOCATION + 2, 470],
    [PRICE_SEL - 4, 470],
    [PRICE_SEL + 2, 593],
    [PRESS - 5, 593],
    [PRESS + 1, 740],
  ], ease.inOutCubic);
  const zoomK = (zoom - 1) / (Z - 1);
  const camY = (442 - focus) * (L.vertical ? 1.05 : 0.83) * zoomK;

  // smear while it spins in / drops out
  const blurX = Math.min(28, Math.abs(m.x - mp.x) * 0.3 + Math.abs(m.rotY - mp.rotY) * 1.3);
  const blurY = Math.min(28, Math.abs(m.y - mp.y) * 0.35);

  const V = L.vertical;
  // on the wide cut the phone sits right and the line sits beside it
  const OX = V ? 0 : 430;
  const OY = 0;
  const ribbonA = ease.outCubic(clamp01((frame - (ENTER + 6)) / 14)) * (1 - clamp01((frame - EXIT) / 6));
  const ribbonBoost = Math.max(0, 1 - Math.abs(frame - SUCCESS) / 14);
  const phoneShrink = keys(frame, [[SUCCESS + 6, 1], [SUCCESS + 24, 0.85]], ease.inOutCubic);
  const halo = clamp01((frame - ENTER) / 10) * (1 - clamp01((frame - EXIT) / 10)) * (1 + 0.6 * Math.max(0, 1 - (frame - ENTER - 6) / 14));
  return (
    <AbsoluteFill>
      {!V && (
        <AbsoluteFill style={{ transform: "translateX(-480px)" }}>
          <PhraseSeq
            fontSize={96}
            phrases={[
              { words: [{ text: "Postezi", at: f(VO.postezi) - 3 }, { text: "task-ul", at: f(VO.taskul) - 3 }, { text: "pe", at: f(VO.peHandly) - 3 }, { text: "handly.ro", at: f(VO.handlyWord) - 3, color: ACCENT }], out: f(VO.dureaza) - 6, breaks: [1] },
              { words: [{ text: "Durează", at: f(VO.dureaza) - 3 }, { text: "câteva", at: f(VO.cateva) - 3 }, { text: "secunde.", at: f(VO.secunde) - 3, color: ACCENT }], out: EXIT - 2, breaks: [0] },
            ]}
          />
        </AbsoluteFill>
      )}
      {/* one soft pool of green light under the phone (Google reference) */}
      <div
        style={{
          position: "absolute",
          left: L.cx + OX - 760,
          top: L.cy - 760 + (m.y - drift(frame, 7, 120)) * 0.6,
          width: 1520,
          height: 1520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,100,0.30) 0%, rgba(0,170,85,0.12) 32%, rgba(0,0,0,0) 62%)",
          opacity: Math.min(1, halo),
          transform: `scale(${(L.vertical ? 1 : 0.85) * phoneShrink})`,
        }}
      />
    <AbsoluteFill style={{ opacity: m.opacity, transform: `translate(${OX}px, ${OY}px)` }}>
      {/* orbit rings on their own 3D layer behind the phone (sharing its camera, never cutting through it) */}
      <div style={{ position: "absolute", inset: 0, perspective: 1900 }}>
        <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `scale(${zoom}) translateY(${camY}px) translate(${m.x}px, ${m.y}px) scale(${m.scale}) translateZ(-120px)` }}>
          <Orbits frame={frame} a={ribbonA} boost={ribbonBoost} />
        </div>
      </div>
      <DirBlur x={blurX} y={blurY} style={{ position: "absolute", inset: 0, perspective: 1900 }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transformStyle: "preserve-3d",
            transform: `scale(${zoom}) translateY(${camY}px) translate(${m.x}px, ${m.y}px) scale(${m.scale}) rotateX(${m.rotX}deg) rotateY(${m.rotY}deg) rotateZ(${m.rotZ}deg)`,
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
