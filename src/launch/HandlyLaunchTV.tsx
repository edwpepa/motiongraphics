import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { A12 } from "./charge";
import { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "./introTimes";
import { A10_END, A12_END } from "./scenes";
import { Win } from "./kit";
import { ACT2TV } from "./tv/act2";
import { ACT3TV } from "./tv/act3";
import { A1, A2, A3, A4, A5, A6, A7, A8, A9 } from "./tv/act1";
import { useOutfit } from "./tv/font";

/** the launch film as a TV spot: the story told on one iPhone, keynote stage, Outfit type */
export const HandlyLaunchTV: React.FC = () => {
  const ready = useExplainerFonts();
  const outfit = useOutfit();
  if (!ready || !outfit) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win still from={0} to={S1_END}><A1 /></Win>
      <Win still from={S1_END} to={S2_END}><A2 /></Win>
      <Win still from={S2_END} to={S3_END}><A3 /></Win>
      <Win still from={S3_END} to={S4_END}><A4 /></Win>
      <Win still from={S4_END} to={S5_END}><A5 /></Win>
      <Win still from={S5_END} to={S6_END}><A6 /></Win>
      <Win still from={S6_END} to={S7_END}><A7 /></Win>
      <Win still from={S7_END} to={A10_END}><A8 /></Win>
      <Win from={A10_END} to={A12_END}><A12 /></Win>
      <Win still from={A10_END} to={A10_END + 30}><A9 from={A10_END} /></Win>
      <ACT2TV />
      <ACT3TV />
      <Audio src={staticFile("audio/launch-mix.mp3")} />
    </AbsoluteFill>
  );
};
