import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Logo, ease, rng01 } from "../edw/kit";
import { Captions, ReelGrade, TopMark, Win, useT } from "./rk";
import { EarthOpen, Helix, People, Tree } from "./sceneA";
import { Minds, Sim } from "./sceneB";
import { Fast, Futures } from "./sceneC";
import { Bet, Gift, Peak, Spire } from "./sceneD";

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

export const ReelFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => (
  <AbsoluteFill style={{ background: "#030304" }}>
    <Win from={0} to={4.8}>
      <EarthOpen />
    </Win>
    <Win from={4.5} to={9.65}>
      <People />
    </Win>
    <Win from={9.3} to={12.0}>
      <Helix />
    </Win>
    <Win from={11.25} to={21.35}>
      <Tree />
    </Win>
    <Win from={21.35} to={28.96}>
      <Sim />
    </Win>
    <Win from={28.85} to={36.2}>
      <Minds />
    </Win>
    <Win from={36.1} to={46.3}>
      <Fast />
    </Win>
    <Win from={46.2} to={57.6}>
      <Futures />
    </Win>
    <Win from={57.4} to={61.95}>
      <Spire />
    </Win>
    <Win from={61.6} to={65.4}>
      <Gift />
    </Win>
    <Win from={65.0} to={68.35}>
      <Peak />
    </Win>
    <Win from={67.9} to={72.1}>
      <Bet />
    </Win>
    <ReelGrade />
    <TopMark until={71.4} />
    <Captions until={71.85} />
    <EndMark />
    <Black />
    {audio ? <Audio src={staticFile("audio/reel-mix.mp3")} /> : null}
  </AbsoluteFill>
);
