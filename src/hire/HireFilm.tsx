import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BAR_H, FONT, Grade, H, Logo, clamp01, ease, useT } from "../edw/kit";
import { VO } from "./type";
import { Browser } from "./ui";
import { BigBang, Blueprint, City, Crowd, Earth, Maze, Roof, Storm, Team, Z } from "./world";

export const HIRE_END = Z.end;

const Win: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useT();
  return t >= from && t < to ? <>{children}</> : null;
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
    const cap = [Z.signal - 0.1].find((m) => out[i].words[0][1] < m) ?? 99;
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
          const rise = ease.outExpo(clamp01((t - t0 - i * 0.035) / 0.6));
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
                  letterSpacing: `${-0.03 + 0.12 * (1 - rise)}em`,
                  color: isBox && bu > 0.5 ? "#050506" : "#f4f5f7",
                  opacity: isBox && bu > 0.5 ? 1 : 0.22 + 0.78 * lit,
                  transform: `translateY(${(1 - rise) * 100}%)`,
                  filter: `blur(${(1 - rise) * 8}px)`,
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

/** the small mark, top left */
const Corner: React.FC = () => {
  const t = useT();
  const o = clamp01((t - 3.8) / 0.5) * (1 - clamp01((t - (Z.signal - 0.6)) / 0.4));
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: BAR_H + 36, opacity: o }}>
      <Logo width={104} white />
    </div>
  );
};

/** the closing line under the signal */
const Hiring: React.FC = () => {
  const t = useT();
  const a = clamp01((t - (Z.signal + 0.5)) / 0.8);
  const b = clamp01((t - (Z.signal + 1.0)) / 0.8);
  const o = 1 - clamp01((t - (Z.end - 0.9)) / 0.8);
  if (a <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 640, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: o }}>
      <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: `${0.02 + 0.3 * (1 - ease.outExpo(a))}em`, color: "#f4f5f7", opacity: a, filter: `blur(${(1 - a) * 10}px)` }}>WE'RE HIRING.</div>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 20, letterSpacing: "0.45em", color: "rgba(236,238,242,0.7)", opacity: b, marginRight: "-0.45em" }}>THREE OPEN SPOTS</div>
    </div>
  );
};

/** the website, floating in the storm at an angle */
const Site: React.FC = () => (
  <AbsoluteFill style={{ transform: "perspective(1900px) rotateX(9deg) rotateY(-11deg) scale(0.86) translateY(30px)" }}>
    <Browser />
  </AbsoluteFill>
);

export const HireFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win from={0} to={Z.team}>
        <BigBang />
      </Win>
      <Win from={Z.team} to={Z.crowd}>
        <Team />
      </Win>
      <Win from={Z.crowd} to={Z.maze}>
        <Crowd />
      </Win>
      <Win from={Z.maze} to={Z.roof}>
        <Maze />
      </Win>
      <Win from={Z.roof} to={Z.black}>
        <Roof />
      </Win>
      <Win from={Z.city} to={Z.earth}>
        <City />
      </Win>
      <Win from={Z.earth} to={Z.blue}>
        <Earth />
      </Win>
      <Win from={Z.blue} to={Z.storm}>
        <Blueprint />
      </Win>
      <Win from={Z.storm} to={Z.end}>
        <Storm />
      </Win>
      <Site />
      <Grade />
      <Corner />
      <Center />
      <Hiring />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/hire-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
