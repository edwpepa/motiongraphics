import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AppleLine, AWord, GREEN_L, lineWidth, wordGrow } from "../components/AppleText";
import { LiquidGlass } from "../components/Glass";
import { Orb } from "../components/Orb";
import { DirBlur } from "../lib/Blur";
import { clamp01, ease, lerp, pop } from "../lib/anim";
import { useLayout } from "../layout";
import { BOLD, FONT } from "../theme";
import { f, MUSIC_LIFT_FRAME, VO } from "../timing";

/**
 * The whole problem half is one object changing shape, Google-Drive-reference style:
 *   a green dot blooms → opens into a glowing "thinking" pill where the thought is spelled out →
 *   the pill becomes a calendar where the day keeps slipping → the calendar becomes a to-do list,
 *   the camera leaning in on each chore as it's written → the three empty checkboxes fly together
 *   into one green drop that opens the dark half on the drop.
 */

const LEAD = 3;
const hw = (i: number) => f(VO.hook[i][1]) - LEAD;

const PILL: { words: AWord[]; out: number; dots?: number }[] = [
  { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: hw(i) })), out: hw(3) - 5 },
  { words: [3, 4, 5, 6].map((i) => ({ text: VO.hook[i][0], at: hw(i), color: i === 6 ? GREEN_L : undefined })), out: hw(7) - 5 },
  { words: [{ text: "prin", at: hw(7) }, { text: "casă", at: hw(8) }], out: f(VO.hookEnd) - 6, dots: hw(8) + 7 },
];

const CAL0 = f(VO.hookEnd) - 5; // pill → calendar
const LIST0 = f(VO.postponeEnd) + 1; // calendar → list
const HOPS = VO.postponeSyllables.map((s) => f(s));
const FIRST = 16;

const CHORES: { title: [string, number][]; days: number }[] = [
  { title: [["Robinet", 5.55], ["care", 5.95], ["curge", 6.2]], days: 14 },
  { title: [["Dulap", 7.13], ["de", 7.5], ["montat", 7.62]], days: 31 },
  { title: [["Perete", 8.65], ["de", 9.05], ["zugrăvit", 9.18]], days: 92 },
];
const arrive = (i: number) => f(VO.chores[i]) - LEAD;
const END = f(VO.choresEnd);
const DROP = MUSIC_LIFT_FRAME;
const FLY = END + 4;

const exitT = (frame: number, out: number) => ease.inOutCubic(clamp01((frame - out) / 7));

const dayAt = (frame: number, dur: number, lag = 0) => {
  let d = FIRST;
  for (const h of HOPS) d += ease.inOutCubic(clamp01((frame - lag - h) / dur));
  return d;
};

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;

  // ---------------------------------------------------------------- sizes
  const FS = V ? 66 : 78; // pill text
  const PH = V ? 136 : 156;
  const D = V ? 128 : 140;
  const CW = V ? 940 : 980;
  const CH = V ? 290 : 300;
  const LW = V ? 940 : 1000;
  const LH = V ? 700 : 560;
  const TF = V ? 50 : 52;
  const LINE = V ? 170 : 128;
  const lineY = (i: number) => -LH / 2 + (V ? 230 : 180) + i * LINE;
  const padX = V ? 56 : 64;

  // ---------------------------------------------------------------- the pill's text and width
  const dotsW = FS * 0.7;
  const geom = (fr: number) => {
    let textW = 0;
    PILL.forEach((p) => {
      // the pill only starts closing once the old words have mostly faded
      const keep = 1 - ease.inOutCubic(clamp01((fr - p.out - 2) / 8));
      // the pill opens a beat ahead of each word so nothing ever pokes out of it
      textW += lineWidth(p.words, FS, fr + 5) * keep;
      if (p.dots) textW += dotsW * wordGrow(fr + 5, p.dots) * keep;
    });
    const pillW = Math.max(PH, textW + PH * 0.9);
    const tp = ease.inOutCubic(clamp01((fr - 9) / 12));
    const tc = ease.inOutCubic(clamp01((fr - CAL0) / 14));
    const tl = ease.inOutCubic(clamp01((fr - LIST0) / 14));
    let gw = lerp(D, pillW, tp);
    let gh = lerp(D, PH, tp);
    gw = lerp(gw, CW, tc);
    gh = lerp(gh, CH, tc);
    gw = lerp(gw, LW, tl);
    gh = lerp(gh, LH, tl);
    return { w: gw, h: gh, tc, tl };
  };

  // ---------------------------------------------------------------- container morph
  const birth = pop(frame, 1, 12, 150);
  const open = ease.outCubic(clamp01((frame - 7) / 12));
  const fade = ease.inOutCubic(clamp01((frame - (END + 4)) / 10));
  const G = geom(frame);
  const { w, h } = G;
  const toCal = G.tc;
  const toList = G.tl;
  // liquid squash & stretch: the pill bulges along the way it's growing, then settles
  const dw = (G.w - geom(frame - 2).w) / 2;
  const squash = Math.max(-1, Math.min(1, dw / 45)) * (1 - toCal);
  const r = lerp(lerp(h / 2, 46, toCal), 44, toList);
  const boxY = lerp(lerp(0, V ? 90 : 70, toCal), 0, toList);
  const ring = 1 - toCal;

  // ---------------------------------------------------------------- camera over the list
  type Cam = { s: number; x: number; y: number };
  const Z = V ? 1.5 : 1.7;
  const fx = V ? -110 : -106;
  const moves: [number, number, Cam][] = [
    [arrive(0) - 4, 12, { s: Z, x: fx, y: lineY(0) + 18 }],
    [arrive(1) - 8, 11, { s: Z, x: fx, y: lineY(1) + 18 }],
    [arrive(2) - 8, 11, { s: Z, x: fx, y: lineY(2) + 18 }],
    [END - 8, 14, { s: 1, x: 0, y: 0 }],
  ];
  const camAt = (fr: number): Cam => {
    const c = { s: 1, x: 0, y: 0 };
    for (const [start, dur, to] of moves) {
      const e = ease.inOutCubic(clamp01((fr - start) / dur));
      c.s = lerp(c.s, to.s, e);
      c.x = lerp(c.x, to.x, e);
      c.y = lerp(c.y, to.y, e);
    }
    return c;
  };
  const cam = camAt(frame);
  const camPrev = camAt(frame - 1);
  const camBlur = Math.min(26, Math.abs(cam.y - camPrev.y) * cam.s * 0.35);

  // ---------------------------------------------------------------- bloom behind the thinking pill
  const bloom = (0.55 + 0.45 * Math.max(0, 1 - frame / 22)) * birth * ring;
  const angle = frame * 4;
  // conic fill cut down to a ring (content-box punched out)
  const ringMask: React.CSSProperties = {
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    maskComposite: "exclude",
  };
  const conic = `conic-gradient(from ${angle}deg, #00e676, #b9ffd6, #00c46a, #7dffb4, #00a352, #d4ffe6, #00e676)`;

  // ---------------------------------------------------------------- pill text
  const pillText = PILL.map((p, i) => {
    const t = ease.inOutCubic(clamp01((frame - p.out) / 5));
    if (frame < p.words[0].at - 2 || t >= 1) return null;
    const lw = lineWidth(p.words, FS, frame);
    const dg = p.dots ? wordGrow(frame, p.dots) : 0;
    const shift = -(dotsW * dg) / 2;
    return (
      <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: 1 - t, filter: t > 0 ? `blur(${t * 14}px)` : undefined, transform: `translateY(${-t * 16}px)` }}>
        <div style={{ position: "absolute", left: shift, top: 0 }}>
          <AppleLine words={p.words} fontSize={FS} light />
        </div>
        {p.dots && frame >= p.dots - 1 && (
          <div style={{ position: "absolute", left: shift + lw / 2 + FS * 0.12, top: FS * 0.12, display: "flex", gap: FS * 0.1 }}>
            {[0, 1, 2].map((k) => {
              const local = frame - p.dots! - k * 3;
              const a = ease.outCubic(clamp01(local / 6));
              const hop = local > 4 ? Math.max(0, Math.sin(((local - 4) / 16) * Math.PI * 2)) : 0;
              return (
                <div
                  key={k}
                  style={{
                    width: FS * 0.13,
                    height: FS * 0.13,
                    borderRadius: "50%",
                    background: "#0b1410",
                    opacity: a,
                    transform: `translateY(${-hop * FS * 0.2}px) scale(${0.3 + 0.7 * a})`,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  });

  // ---------------------------------------------------------------- calendar
  const calIn = ease.outCubic(clamp01((frame - (CAL0 + 8)) / 9)) * (1 - ease.inCubic(clamp01((frame - (LIST0 - 2)) / 7)));
  const cell = CW / 7.4;
  const day = dayAt(frame, 5);
  const camDay = dayAt(frame, 8, 2);
  const vel = Math.abs(day - dayAt(frame - 1, 5)) * cell;
  const calendar = calIn > 0 && (
    <div
      style={{
        position: "absolute",
        left: -w / 2,
        top: -h / 2,
        width: w,
        height: h,
        overflow: "hidden",
        borderRadius: r,
        opacity: calIn,
        filter: calIn < 1 ? `blur(${(1 - calIn) * 10}px)` : undefined,
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)",
        maskImage: "linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%)",
      }}
    >
      <div style={{ position: "absolute", left: w / 2 - (camDay - FIRST) * cell, top: h / 2 }}>
        {Array.from({ length: 18 }, (_, i) => {
          const d = 12 + i;
          const near = Math.max(0, 1 - Math.abs(d - day) / 1.1);
          const past = d < day - 0.5;
          return (
            <div key={d} style={{ position: "absolute", left: (d - FIRST) * cell - cell / 2, top: -h / 2, width: cell, height: h, fontFamily: FONT, fontWeight: BOLD, textAlign: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.2, fontSize: 26, color: "rgba(16,22,19,0.4)" }}>{WEEK[(d + 3) % 7]}</div>
              <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.5, fontSize: 52, lineHeight: 1, letterSpacing: "-0.03em", color: `rgba(16,22,19,${past ? 0.22 : 0.75})`, opacity: 1 - near }}>{d}</div>
            </div>
          );
        })}
        <DirBlur x={vel * 0.4} style={{ position: "absolute", left: (day - FIRST) * cell - 52, top: h * 0.5 - h / 2 + 26 - 52 }}>
          <div
            style={{
              width: 104,
              height: 104,
              borderRadius: "50%",
              background: "linear-gradient(180deg, #19d67c 0%, #00a352 100%)",
              boxShadow: "0 10px 26px rgba(0,163,82,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT,
              fontWeight: BOLD,
              fontSize: 52,
              letterSpacing: "-0.03em",
              color: "#fff",
            }}
          >
            {Math.round(day)}
          </div>
        </DirBlur>
      </div>
    </div>
  );

  // ---------------------------------------------------------------- to-do list
  const listIn = ease.outCubic(clamp01((frame - (LIST0 + 8)) / 9));
  const flown = frame >= FLY;
  const list = listIn > 0 && (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, opacity: listIn * (1 - fade), fontFamily: FONT, fontWeight: BOLD }}>
      <div style={{ position: "absolute", left: padX, top: V ? 70 : 54, fontSize: V ? 46 : 40, letterSpacing: "-0.03em", color: "#0b1410" }}>De făcut</div>
      <div style={{ position: "absolute", left: padX, right: padX, top: V ? 150 : 118, height: 2, background: "rgba(16,22,19,0.07)" }} />
      {CHORES.map((c, i) => {
        const a = arrive(i);
        if (frame < a - 4) return null;
        const y = lineY(i) + h / 2;
        const cp = pop(frame, a - 4, 13, 170);
        const count = Math.round(1 + (c.days - 1) * ease.outCubic(clamp01((frame - a - 10) / 22)));
        const sub = ease.outCubic(clamp01((frame - a - 10) / 10));
        return (
          <React.Fragment key={i}>
            {!flown && (
              <div
                style={{
                  position: "absolute",
                  left: padX,
                  top: y - 26,
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  border: "4px solid rgba(16,22,19,0.22)",
                  boxSizing: "border-box",
                  transform: `scale(${cp})`,
                }}
              />
            )}
            <div style={{ position: "absolute", left: padX + 84, top: y - 4 }}>
              <AppleLine words={c.title.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={TF} light align="left" />
            </div>
            <div style={{ position: "absolute", left: padX + 84, top: y + TF * 0.55, fontSize: V ? 28 : 26, color: "rgba(16,22,19,0.42)", opacity: sub, transform: `translateY(${(1 - sub) * 10}px)` }}>
              Amânat de <span style={{ color: "#00a352" }}>{count} zile</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  // ---------------------------------------------------------------- the three checkboxes become one drop
  const size = 900;
  const cOrb = size / 2;
  const fly = ease.inOutCubic(clamp01((frame - FLY) / 14));
  const charge = clamp01((frame - (FLY + 8)) / (DROP - FLY - 8));
  const dissolve = ease.inOutCubic(clamp01((frame - (DROP - 12)) / 14));
  const pulse = 1 + 0.06 * Math.sin(frame / 2.2) * charge;
  const blobs = CHORES.map((_, i) => {
    const sx = -LW / 2 + padX + 26;
    const sy = lineY(i);
    const arc = Math.sin(Math.PI * fly) * (i - 1) * 60;
    return { x: cOrb + lerp(sx, 0, fly) + arc, y: cOrb + lerp(sy, 0, fly), r: lerp(22, 30 + 40 * charge, fly) * pulse };
  });

  return (
    <AbsoluteFill>
      {/* soft bloom under the pill (the only colour on the white set) */}
      <div
        style={{
          position: "absolute",
          left: L.cx - 700,
          top: L.cy - 700,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,214,108,0.20) 0%, rgba(0,214,108,0.08) 30%, rgba(0,214,108,0) 62%)",
          opacity: bloom,
          transform: `scale(${0.6 + 0.4 * birth + 0.25 * Math.max(0, 1 - frame / 22)})`,
        }}
      />

      {/* caption while the calendar is up */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `translateY(${boxY - CH / 2 - (V ? 130 : 110)}px)` }}>
        {frame >= CAL0 && frame < LIST0 + 10 && (
          <div style={{ opacity: 1 - exitT(frame, LIST0 - 3), filter: frame > LIST0 - 3 ? `blur(${exitT(frame, LIST0 - 3) * 12}px)` : undefined }}>
            <AppleLine words={VO.postpone.map(([text, sec]) => ({ text, at: f(sec) - LEAD, color: text.startsWith("amâni") ? GREEN_L : undefined }))} fontSize={V ? 64 : 60} light />
          </div>
        )}
      </AbsoluteFill>

      {/* the morphing object, under a camera that leans in on the list */}
      {fade < 1 && (
        <DirBlur y={camBlur} style={{ position: "absolute", inset: 0, opacity: 1 - fade, filter: fade > 0 ? `blur(${fade * 16}px)` : undefined }}>
          <div style={{ position: "absolute", left: L.cx, top: L.cy + boxY, transform: `scale(${cam.s * birth}) translate(${-cam.x}px, ${-cam.y}px)` }}>
            {/* glow ring */}
            {ring > 0 && (
              <>
                <div style={{ position: "absolute", left: -w / 2 - 16, top: -h / 2 - 16, width: w + 32, height: h + 32, borderRadius: r + 16, padding: 18, boxSizing: "border-box", background: conic, ...ringMask, filter: "blur(18px)", opacity: 0.85 * ring }} />
                <div style={{ position: "absolute", left: -w / 2 - 3, top: -h / 2 - 3, width: w + 6, height: h + 6, borderRadius: r + 3, padding: 5, boxSizing: "border-box", background: conic, ...ringMask, opacity: ring }} />
              </>
            )}
            {/* body: liquid glass that refracts the grid and the green glow behind it */}
            <LiquidGlass
              width={Math.round(w)}
              height={Math.round(h)}
              radius={Math.min(r, Math.round(h) / 2)}
              tone="light"
              strength={lerp(70, 46, toCal)}
              frost={lerp(3, 16, toCal)}
              tint={lerp(0.3, 0.72, toCal)}
              bezel={lerp(Math.min(h / 2, 60), 44, toCal)}
              style={{
                position: "absolute",
                left: -Math.round(w) / 2,
                top: -Math.round(h) / 2,
                transform: `scale(${(toCal > 0 ? 1 : open) * (1 + 0.05 * squash)}, ${(toCal > 0 ? 1 : open) * (1 - 0.07 * squash)})`,
              }}
            />
            {/* pill text, clipped to the pill */}
            <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, borderRadius: r, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: w / 2, top: h / 2 }}>{pillText}</div>
            </div>
            {calendar}
            {list}
          </div>
        </DirBlur>
      )}

      {frame >= FLY && dissolve < 1 && (
        <div
          style={{
            position: "absolute",
            left: L.cx - size / 2,
            top: L.cy - size / 2,
            width: size,
            height: size,
            transform: `scale(${1 + 1.4 * dissolve})`,
            opacity: 1 - dissolve,
            filter: dissolve > 0 ? `blur(${dissolve * 36}px)` : undefined,
          }}
        >
          <Orb blobs={blobs} size={size} glow={0.4 + 0.8 * charge} gooRadius={16} />
        </div>
      )}
    </AbsoluteFill>
  );
};
