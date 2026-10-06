import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BAR_H, FONT, Grade, H, Logo, W, clamp01, ease, useT } from "../edw/kit";
import { VO } from "./type";
import { Browser } from "./ui";
import { Blueprint, City, Crowd, Earth, Maze, Roof, WorldMap, Space, Storm, Team, Z } from "./world";

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
    const cap = [Z.send + 0.7].find((m) => out[i].words[0][1] < m) ?? 99;
    out[i].end = Math.min(next - 0.08, lastWord + 1.1, cap);
  }
  return out;
})();

const Center: React.FC = () => {
  const t = useT();
  const c = CHUNKS.find((x) => t >= x.words[0][1] - 0.18 && t < x.end && x.words[0][1] >= Z.team - 0.05);
  if (!c) return null;
  const t0 = c.words[0][1] - 0.18;
  const o = clamp01((c.end - t) / 0.18);
  const boxed = -1;
  const lead = c.words[0][0] === "EDW";
  const site = c.words[0][1] >= Z.ui;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 140, right: 140, top: site ? 880 : H / 2, transform: `translateY(-50%) scale(${site ? 0.82 : 1})`, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 20, rowGap: 4, opacity: o }}>
        {c.words.map(([wd, at], i) => {
          const rise = ease.outExpo(clamp01((t - t0 - i * 0.035) / 0.6));
          const lit = ease.outCubic(clamp01((t - at + 0.06) / 0.22));
          const isBox = i === boxed;
          const bu = isBox ? ease.outExpo(clamp01((t - at) / 0.4)) : 0;
          const text = i === 0 ? wd.charAt(0).toUpperCase() + wd.slice(1) : wd;
          // the company is the mark itself, not its name typed out
          if (wd === "Enterprise" && c.words[i - 1]?.[0] === "EDW") return null;
          if (wd === "EDW" && c.words[i + 1]?.[0] === "Enterprise")
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", opacity: lead ? 0.22 + 0.78 * lit : 1, transform: `translateY(${(1 - rise) * 30}px)`, filter: `blur(${(1 - rise) * 8}px)`, marginRight: 6 }}>
                <Logo width={250} white />
              </div>
            );
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
                  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
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
  const o = clamp01((t - 3.8) / 0.5) * (1 - clamp01((t - (Z.send + 0.2)) / 0.4));
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: BAR_H + 36, opacity: o }}>
      <Logo width={104} white />
    </div>
  );
};

/** the end: the mark alone, white, in space — it fades in, holds, and the whole screen fades away */
const EndMark: React.FC = () => {
  const t = useT();
  const at = Z.send + 0.75;
  if (t < at) return null;
  const a = ease.inOut(clamp01((t - at) / 1.4));
  const sc = 1.0 + 0.04 * clamp01((t - at) / 4.5);
  return (
    <div style={{ position: "absolute", left: W / 2, top: H / 2, transform: `translate(-50%, -50%) scale(${sc})`, opacity: a, filter: `blur(${(1 - a) * 10}px)` }}>
      <Logo width={520} white />
    </div>
  );
};

/** everything fades out together at the very end */
const FadeOut: React.FC = () => {
  const t = useT();
  const o = ease.inOut(clamp01((t - (Z.end - 1.6)) / 1.5));
  return o > 0 ? <AbsoluteFill style={{ background: "#000", opacity: o }} /> : null;
};

export const HireFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win from={0} to={Z.team}>
        <WorldMap />
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
      <Win from={Z.ui - 0.4} to={Z.end}>
        <Space />
      </Win>
      <Win from={Z.storm} to={Z.ui + 0.7}>
        <Storm />
      </Win>
      <AbsoluteFill style={{ transform: "translateY(-80px) scale(0.82)" }}>
        <Browser />
      </AbsoluteFill>
      <EndMark />
      <Grade />
      <Corner />
      <Center />
      <FadeOut />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/hire-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
