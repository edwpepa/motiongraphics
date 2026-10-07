import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Logo, ease, rng01 } from "../edw/kit";
import { Captions, ReelGrade, TopMark, Win, useT } from "./rk";
import { EarthOpen } from "./sceneA";
import { Spire } from "./sceneD";
import { Crowd, Digitize, Genes, Grow, Simworld } from "./story1";
import { Alike, Clocks, Faith, History, Ideas, Invent, Phone, Rockets, Rooftop, Summit } from "./story2";

/** the end: the mark alone in the middle, then black */
const EndMark: React.FC = () => {
  const t = useT();
  const a = rng01(t, 71.9, 72.9, ease.outCubic);
  if (a <= 0) return null;
  const o = a * (1 - rng01(t, 73.55, 74.35));
  return (
    <div style={{ position: "absolute", left: 540 - 140, top: 880 - 51, opacity: o, transform: `scale(${0.97 + 0.03 * a})`, filter: `blur(${(1 - a) * 5}px)` }}>
      <Logo width={280} white sweep={rng01(t, 72.5, 73.7, (x) => x)} />
    </div>
  );
};
const Black: React.FC = () => {
  const t = useT();
  const o = rng01(t, 73.7, 74.45);
  return o > 0 ? <AbsoluteFill style={{ background: "#000", opacity: o }} /> : null;
};

const SCENES: [number, number, React.FC][] = [
  [0, 4.8, EarthOpen],
  [4.5, 9.65, Crowd],
  [9.3, 11.65, Genes],
  [11.25, 20.85, Grow],
  [20.2, 24.45, Digitize],
  [24.0, 28.96, Simworld],
  [28.85, 32.85, Ideas],
  [32.5, 36.2, Alike],
  [36.1, 42.35, Clocks],
  [42.0, 46.45, History],
  [46.2, 51.4, Rockets],
  [51.0, 53.45, Faith],
  [53.1, 57.6, Invent],
  [57.4, 61.95, Spire],
  [61.6, 65.4, Rooftop],
  [65.0, 68.35, Summit],
  [67.9, 72.1, Phone],
];

export const ReelFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => (
  <AbsoluteFill style={{ background: "#030304" }}>
    {SCENES.map(([a, b, S], i) => (
      <Win key={i} from={a} to={b}>
        <S />
      </Win>
    ))}
    <ReelGrade />
    <TopMark until={71.4} />
    <Captions until={71.85} />
    <EndMark />
    <Black />
    {audio ? <Audio src={staticFile("audio/reel-mix.mp3")} /> : null}
  </AbsoluteFill>
);
