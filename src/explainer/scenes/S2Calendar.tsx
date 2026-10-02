import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconTile } from "../components/Icons";
import { Pill } from "../components/Pill";
import { useLayout } from "../layout";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, keys, lerp } from "../lib/anim";
import { BOLD, C, FONT } from "../theme";
import { f, VO } from "../timing";

const CELL_W = 250;
const CELL_H = 205;
const COLS = 7;
const FIRST_DAY = 15;
const HOP_DUR = 4;
const HOPS = VO.postponeSyllables.map((s) => f(s));
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const cellCenter = (day: number) => {
  const i = day - 1;
  return { x: (i % COLS) * CELL_W + CELL_W / 2, y: Math.floor(i / COLS) * CELL_H + CELL_H / 2 };
};

/** Fractional "day" the red marker sits on: hops one day per syllable of "pe care o tot amâni?". */
const markerDay = (frame: number) => {
  let day = FIRST_DAY;
  for (const h of HOPS) day += ease.inOutCubic(clamp01((frame - h) / HOP_DUR));
  return day;
};

const markerPos = (frame: number) => {
  const d = markerDay(frame);
  const a = cellCenter(Math.floor(d));
  const b = cellCenter(Math.floor(d) + 1);
  const t = d - Math.floor(d);
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
};

const Numbers: React.FC<{ color?: string; muted?: string }> = ({ color = C.ink, muted = "#c8cdca" }) => (
  <>
    {Array.from({ length: 35 }, (_, i) => {
      const day = i + 1;
      const label = day > 31 ? day - 31 : day;
      const { x, y } = cellCenter(day);
      return (
        <div
          key={day}
          style={{
            position: "absolute",
            left: x - CELL_W / 2,
            top: y - CELL_H / 2,
            width: CELL_W,
            height: CELL_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT,
            fontWeight: BOLD,
            fontSize: 112,
            letterSpacing: "-0.04em",
            color: day > 31 ? muted : color,
          }}
        >
          {label}
        </div>
      );
    })}
  </>
);

// "pe care o tot amâni?" — the chore keeps sliding to tomorrow on a tilted calendar
export const S2Calendar: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const enter = 98;
  const exitStart = 147;

  const m = markerPos(frame);
  const mPrev = markerPos(frame - 1);
  const markerVel = Math.abs(m.x - mPrev.x);

  // camera trails the marker a few frames behind so each hop reads as a jolt
  const cam = markerPos(frame - 3);
  const chip = markerPos(frame - 1.5);
  const enterX = L.W * 0.9 * (1 - ease.outExpo(clamp01((frame - enter) / 12)));
  const enterXPrev = L.W * 0.9 * (1 - ease.outExpo(clamp01((frame - 1 - enter) / 12)));
  // exit: the camera dives through the calendar — it swells, softens and dissolves (no streaks)
  const out = ease.inCubic(clamp01((frame - exitStart) / 9));
  const zoomOut = 1 + 0.75 * out;
  const scale = keys(frame, [
    [enter, 1.5],
    [HOPS[5] + 6, 1.32],
    [exitStart, 1.18],
  ], ease.inOutCubic) * (L.vertical ? 0.78 : 1) * zoomOut;
  const rotY = keys(frame, [
    [enter, -26],
    [exitStart, -12],
  ], ease.outCubic);

  const gridW = COLS * CELL_W;
  // reel: aim a little right of the marker so the chore tag riding on it stays in frame
  const tx = -cam.x + gridW / 2 - (L.vertical ? 190 : 0);
  const ty = -cam.y + CELL_H * 0.2;

  const R = 92;
  const lift = 1 - clamp01(markerVel / 30) * 0.06;

  return (
    <AbsoluteFill>
      <DirBlur
        x={Math.abs(enterX - enterXPrev) * 0.35}
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateX(${enterX}px)`,
          opacity: 1 - out,
          filter: out > 0.01 ? `blur(${26 * out}px)` : undefined,
        }}
      >
        <AbsoluteFill style={{ perspective: 2200, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              transformStyle: "preserve-3d",
              transform: `scale(${scale}) rotateX(18deg) rotateY(${rotY}deg) rotateZ(-5deg)`,
            }}
          >
            <div style={{ position: "absolute", transform: `translate(${tx - gridW / 2}px, ${ty}px)` }}>
              {/* the sheet extends well past the frame so the tilt never shows an edge */}
              <div style={{ position: "absolute", left: -1600, top: -1400, width: gridW + 3200, height: 5 * CELL_H + 2800, background: "#f4f5f4" }} />
              {WEEKDAYS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: i * CELL_W,
                    top: -110,
                    width: CELL_W,
                    textAlign: "center",
                    fontFamily: FONT,
                    fontWeight: BOLD,
                    fontSize: 44,
                    color: "#a5aca8",
                  }}
                >
                  {d}
                </div>
              ))}
              <div style={{ position: "absolute", left: 0, top: -150, width: gridW, height: 2, background: "#e1e5e2" }} />
              <Numbers />

              {/* red day marker, smeared along its hop */}
              <DirBlur x={markerVel * 0.55} style={{ position: "absolute", left: m.x - R, top: m.y - R }}>
                <div style={{ width: R * 2, height: R * 2, borderRadius: "50%", background: C.red, transform: `scale(${lift})`, boxShadow: "0 18px 40px rgba(255,59,48,0.35)" }} />
              </DirBlur>
              {/* the same numbers in white, clipped to the marker */}
              <div style={{ position: "absolute", left: 0, top: 0, clipPath: `circle(${R * lift}px at ${m.x}px ${m.y}px)` }}>
                <Numbers color={C.white} muted={C.white} />
              </div>

              {/* the chore riding along with the marker */}
              <div
                style={{
                  position: "absolute",
                  left: chip.x + 38,
                  top: chip.y - 172,
                  transform: `rotate(${(m.x - chip.x) * -0.08}deg)`,
                  transformOrigin: "0% 100%",
                  opacity: clamp01((frame - enter - 6) / 6),
                }}
              >
                <Pill icon={<IconTile name="wrench" color="blue" size={58} />} label="Repară robinetul" size={40} />
              </div>
            </div>
          </div>
        </AbsoluteFill>
      </DirBlur>
    </AbsoluteFill>
  );
};
