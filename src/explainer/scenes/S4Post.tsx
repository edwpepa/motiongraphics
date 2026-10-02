import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppScreen, TASK_TEXT } from "../components/AppScreen";
import { Phone, PHONE_H, PHONE_W } from "../components/Phone";
import { GlyphName, IconTile, TileColor } from "../components/Icons";
import { blobPath } from "../components/MorphShapes";
import { GlassPill } from "../components/Pill";
import { useLayout } from "../layout";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
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
  { icon: "wrench", tile: "blue", label: "Instalații", at: SUCCESS + 12, pos: [-360, -320], vpos: [-200, -545], z: 120 },
  { icon: "pin", tile: "red", label: "În zona ta", at: SUCCESS + 16, pos: [370, -200], vpos: [225, -470], z: 90 },
  { icon: "check", tile: "green", label: "Task postat", at: SUCCESS + 20, pos: [370, 250], vpos: [230, 470], z: 140 },
  { icon: "timer", tile: "orange", label: "Gata în câteva secunde", at: Math.max(SECONDS_CHIP, SUCCESS + 24), pos: [-470, 330], vpos: [-95, 565], z: 170, size: 34 },
];

const phoneMotion = (frame: number, vertical: boolean) => {
  const inT = ease.outExpo(clamp01((frame - ENTER) / 20));
  const outT = ease.inCubic(clamp01((frame - EXIT) / 13));
  const rotY = keys(frame, [
    [ENTER, -4],
    [ENTER + 22, -14],
    [EXIT, 9],
  ], ease.outCubic) - 26 * outT;
  // rises out of the bottom of the frame, tilted back like a phone lifted in your hand, then squares up
  return {
    x: 0,
    rotY,
    rotX: 5 + 42 * (1 - inT) + 60 * outT,
    rotZ: -8 * (1 - inT),
    y: (vertical ? 1500 : 1150) * (1 - inT) + 300 * outT + drift(frame, 7, 120),
    scale: (vertical ? 1.12 : 0.92) * (1.6 - 0.6 * inT) * (1 - 0.18 * outT) * keys(frame, [[SUCCESS + 6, 1], [SUCCESS + 24, vertical ? 0.78 : 0.74]], ease.inOutCubic),
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
  const OX = 0;
  const OY = 0;
  const phoneShrink = keys(frame, [[SUCCESS + 6, 1], [SUCCESS + 24, 0.85]], ease.inOutCubic);
  const halo = clamp01((frame - ENTER) / 10) * (1 - clamp01((frame - EXIT) / 10)) * (1 + 0.6 * Math.max(0, 1 - (frame - ENTER - 6) / 14));
  return (
    <AbsoluteFill>
      {/* morphing liquid shapes behind the phone */}
      <svg width={L.W} height={L.H} style={{ position: "absolute", inset: 0, opacity: Math.min(1, halo), filter: "blur(26px)" }}>
        <defs>
          <radialGradient id="ph1" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#7dffb4" />
            <stop offset="55%" stopColor="#00c866" />
            <stop offset="100%" stopColor="#004d27" />
          </radialGradient>
          <radialGradient id="ph2" cx="60%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#2bff95" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#00592d" stopOpacity={0.6} />
          </radialGradient>
        </defs>
        {[
          { dx: -0.16, dy: -0.1, r: 0.3, g: "ph1", sd: 3 },
          { dx: 0.17, dy: 0.12, r: 0.24, g: "ph2", sd: 7 },
          { dx: 0.02, dy: 0.24, r: 0.16, g: "ph2", sd: 11 },
        ].map((b, i) => {
          const R = Math.min(L.W, L.H) * b.r * (0.7 + 0.3 * clamp01((frame - ENTER) / 18)) * phoneShrink;
          const t = frame / 30;
          const ox = (b.dx + 0.05 * Math.sin(t * 0.9 + i * 2)) * Math.min(L.W, L.H) * 1.3 * phoneShrink;
          const oy = (b.dy + 0.05 * Math.cos(t * 0.7 + i)) * Math.min(L.W, L.H) * 1.3 * phoneShrink;
          return <path key={i} d={blobPath(L.cx + ox, L.cy + oy, R, t * 1.4, b.sd, 0.24)} fill={`url(#${b.g})`} opacity={0.55} />;
        })}
      </svg>
    <AbsoluteFill style={{ opacity: m.opacity, transform: `translate(${OX}px, ${OY}px)` }}>
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
