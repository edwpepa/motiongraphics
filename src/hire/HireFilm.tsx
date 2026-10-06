import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BrainCam, SPARK_P, drawBrain } from "../edw/act1";
import { BuildScene, CityScene } from "../edw/act2";
import { DevicesScene, NetworkScene } from "../edw/act4";
import { BAR_H, CUES, CanvasScene, FONT, Grade, H, Logo, W, clamp01, ease, flare, glow, lerp, rng01, useT } from "../edw/kit";
import { LogoClip } from "../edw/logoClip";
import { END as EDW_END_SHOTS, FIN as EDW_FIN } from "../edw/logoShots";
import { VO } from "./type";
import { Browser } from "./ui";

export const HIRE_END = 50.2;
const LOGO_AT = 43.95; // the form whites out into the 3D mark
const MARK_AT = 33.45; // the minimal mark between the two halves

/** the brand film's scenes, re-timed: each of their cues is mapped from its place in that film to ours */
const REMAP: Record<string, [number, number, number, number]> = {
  room: [46.6, 51.25, 0.5, 5.6],
  build: [46.6, 51.25, 0.5, 5.6],
  comfort: [13.75, 18.6, 13.65, 16.95],
  calm: [13.75, 18.6, 13.65, 16.95],
  applause: [21.05, 25.6, 17.4, 24.25],
  finished: [21.05, 25.6, 17.4, 24.25],
  history: [25.6, 29.4, 24.25, 29.75],
  apps: [51.25, 56.7, 29.75, 33.5],
};
const remap = (key: string, _i: number, t: number) => {
  const m = REMAP[key];
  return m ? m[2] + ((t - m[0]) * (m[3] - m[2])) / (m[1] - m[0]) : t;
};

const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT();
  return t >= from && t < to ? <>{children}</> : null;
};

/** the brain of light: sharp minds, firing; at "breathe" the whole thing breathes */
const Brain: React.FC<{ from: number; to: number; spark?: boolean }> = ({ from, to, spark }) => (
  <CanvasScene
    draw={(ctx, T) => {
      const t = T - from;
      const fade = rng01(t, 0, 0.6, ease.outCubic) * (1 - rng01(T, to - 0.4, to));
      const sharp = rng01(T, VO.sharp.words[6][1] - 0.3, VO.sharp.words[7][1] + 0.3);
      const breathe = rng01(T, VO.sharp.words[17][1] - 0.6, VO.sharp.words[17][1]);
      const br = breathe * Math.sin(((T - VO.sharp.words[17][1]) / 3.0) * Math.PI * 2);
      const cam: BrainCam = {
        ry: -1.1 + 0.16 * t,
        rx: 0.14,
        scale: lerp(300, 380, ease.inOutSine(t / (to - from))) * (1 + 0.035 * br),
        cx: W / 2,
        cy: H / 2 - 10,
        dist: 4,
        alpha: fade * (0.75 + 0.15 * br),
        rate: spark ? 0.6 : 0.1 + 1.8 * sharp * (1 - 0.5 * breathe) + 0.6 * breathe * Math.max(0, br),
        spark: spark ? rng01(t, 0.2, 0.8) : sharp * 0.8,
      };
      drawBrain(ctx, T, cam);
      if (sharp > 0 && sharp < 1) {
        ctx.globalCompositeOperation = "lighter";
        flare(ctx, W / 2, H / 2, Math.sin(Math.PI * sharp) * 0.35, 900, 40);
        ctx.globalCompositeOperation = "source-over";
      }
      void SPARK_P;
    }}
  />
);

/** the mark, minimal: written out of the dark by a line of light, then a slow glint */
const MinimalMark: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const t = useT();
  if (t < from || t > to) return null;
  const reveal = ease.inOut(clamp01((t - from - 0.25) / 1.0));
  const o = 1 - clamp01((t - (to - 0.35)) / 0.35);
  const wd = 460;
  const x = lerp(-8, 108, reveal);
  return (
    <AbsoluteFill>
      <CanvasScene
        draw={(ctx, T) => {
          ctx.globalCompositeOperation = "lighter";
          const lx = W / 2 - wd / 2 + (wd * x) / 100;
          if (reveal > 0 && reveal < 1) {
            ctx.fillStyle = "rgba(255,255,255,0.9)";
            ctx.fillRect(lx - 1, H / 2 - 120, 2, 240);
            glow(ctx, lx, H / 2, 140, 0.35);
          }
          flare(ctx, W / 2, H / 2, Math.exp(-Math.max(0, T - from - 1.25) / 0.4) * (T > from + 1.25 ? 0.7 : 0), 1300, 70);
          glow(ctx, W / 2, H / 2, 600, 0.05 * reveal * o);
          ctx.globalCompositeOperation = "source-over";
        }}
      />
      <div style={{ position: "absolute", left: W / 2 - wd / 2, top: H / 2 - (wd * 650) / 1792 / 2, opacity: o, WebkitMaskImage: `linear-gradient(90deg, black ${x - 6}%, transparent ${x}%)`, maskImage: `linear-gradient(90deg, black ${x - 6}%, transparent ${x}%)`, transform: `scale(${1.04 - 0.04 * reveal})` }}>
        <Logo width={wd} white sweep={rng01(t, from + 1.3, to - 0.2, ease.inOut)} />
      </div>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the script, word for word, in the middle of the screen
const KEY = new Set(["growing,", "three", "sharp", "breathe,", "calmly", "percentage", "yours.", "anywhere", "remotely", "person,", "build", "website,", "hiring", "form.", "built", "solved,", "there."]);
type Chunk = { words: [string, number][]; end: number };
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  const keys = Object.keys(VO);
  keys.forEach((k, pi) => {
    const ws = VO[k].words.map(([wd, at]) => [k === "growing" && wd === "EDW" ? "EDW" : wd, at] as [string, number]);
    let cur: [string, number][] = [];
    ws.forEach((x, i) => {
      cur.push(x);
      const last = i === ws.length - 1;
      const comma = /[,.]$/.test(x[0]) && cur.length >= 3;
      if (last || comma || cur.length >= 6) {
        out.push({ words: cur, end: 0 });
        cur = [];
      }
    });
    void pi;
  });
  for (let i = 0; i < out.length; i++) {
    const next = out[i + 1]?.words[0][1] ?? 99;
    const lastWord = out[i].words[out[i].words.length - 1][1];
    // no words over the marks: lines finish before the minimal mark and before the 3D mark
    const cap = [MARK_AT + 0.05, LOGO_AT + 0.05].find((m) => out[i].words[0][1] < m) ?? 99;
    out[i].end = Math.min(next - 0.08, lastWord + 1.1, cap);
  }
  return out;
})();

const Center: React.FC = () => {
  const t = useT();
  const c = CHUNKS.find((x) => t >= x.words[0][1] - 0.18 && t < x.end);
  if (!c) return null;
  const t0 = c.words[0][1] - 0.18;
  const o = clamp01((c.end - t) / 0.18);
  const boxed = c.words.findIndex(([wd]) => KEY.has(wd.toLowerCase()));
  const band = ease.outCubic(clamp01((t - t0) / 0.25)) * o;
  const feather = "linear-gradient(transparent 0%, black 30%, black 70%, transparent 100%)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* a band of smoked glass behind the words: whatever is behind stays, softened */}
      <div style={{ position: "absolute", left: 0, right: 0, top: H / 2 - 150, height: 300, backdropFilter: "blur(14px) brightness(0.42)", WebkitBackdropFilter: "blur(14px) brightness(0.42)", WebkitMaskImage: feather, maskImage: feather, opacity: band }} />
      <div style={{ position: "absolute", left: 140, right: 140, top: H / 2, transform: "translateY(-50%)", display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 20, rowGap: 4, opacity: o }}>
        {c.words.map(([wd, at], i) => {
          const rise = ease.outExpo(clamp01((t - t0 - i * 0.03) / 0.5));
          const lit = ease.outCubic(clamp01((t - at + 0.06) / 0.22));
          const isBox = i === boxed;
          const bu = isBox ? ease.outExpo(clamp01((t - at) / 0.4)) : 0;
          const text = i === 0 ? wd.charAt(0).toUpperCase() + wd.slice(1) : wd;
          return (
            <div key={i} style={{ position: "relative", overflow: "hidden", padding: isBox ? "2px 14px" : "2px 0", lineHeight: 1.12 }}>
              {isBox && <div style={{ position: "absolute", inset: 0, background: "#f4f5f7", transform: `scaleX(${bu})`, transformOrigin: "left" }} />}
              <div
                style={{
                  position: "relative",
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 72,
                  letterSpacing: "-0.03em",
                  color: isBox && bu > 0.5 ? "#050506" : "#f4f5f7",
                  opacity: isBox && bu > 0.5 ? 1 : 0.22 + 0.78 * lit,
                  transform: `translateY(${(1 - rise) * 100}%)`,
                  whiteSpace: "nowrap",
                }}
              >
                {text}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** the small mark, top left, while no big mark is on screen */
const Corner: React.FC = () => {
  const t = useT();
  const win: [number, number][] = [
    [1.0, MARK_AT - 0.2],
    [35.7, LOGO_AT - 0.3],
  ];
  const o = win.reduce((m, [a, b]) => Math.max(m, clamp01((t - a) / 0.5) * clamp01((b - t) / 0.4)), 0);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: BAR_H + 36, opacity: o }}>
      <Logo width={104} white />
    </div>
  );
};

const d = LOGO_AT - EDW_FIN;
const LOGO_SHOTS = EDW_END_SHOTS.map((s) => ({ ...s, from: s.from + d, to: s.to + d }));
const LOGO_FRAMES: [number, number] = [Math.round(LOGO_AT * 30), Math.round(LOGO_AT * 30) + 182];

export const HireFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  CUES.remap = remap;
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win from={0.3} to={6.05}>
        <NetworkScene from={0.3} to={6.05} holes={3} />
      </Win>
      <Win from={6.0} to={13.75}>
        <Brain from={6.0} to={13.75} />
      </Win>
      <Win from={13.65} to={16.95}>
        <CityScene from={13.65} to={16.95} />
      </Win>
      <Win from={17.4} to={29.75}>
        <BuildScene from={17.4} to={29.75} />
      </Win>
      <Win from={29.75} to={33.5}>
        <DevicesScene from={29.75} to={33.5} />
      </Win>
      <MinimalMark from={MARK_AT} to={35.55} />
      <Win from={35.3} to={36.8}>
        <Brain from={35.3} to={36.8} spark />
      </Win>
      <Browser />
      <LogoClip src="video/edw-logo-end.mp4" frames={LOGO_FRAMES} shots={LOGO_SHOTS} hit={LOGO_SHOTS[3].from} fade={[LOGO_AT, LOGO_AT + 0.05, HIRE_END - 1.0, HIRE_END - 0.1]} />
      <Grade />
      <Corner />
      <Center />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/hire-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
