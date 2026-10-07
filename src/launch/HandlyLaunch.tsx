import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { A12 } from "./charge";
import { S1, S1_END, S2, S2_END, S3, S3_END, S4, S4_END, S5, S5_END, S6, S6_END, S7, S7_END, S8 } from "./intro";
import { A10_END, A12_END } from "./scenes";
import { Win } from "./kit";
import { ACT2 } from "./act2";
import { ACT3 } from "./act3";

export const HandlyLaunch: React.FC = () => {
  const ready = useExplainerFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win still from={0} to={S1_END}><S1 /></Win>
      <Win still from={S1_END} to={S2_END}><S2 /></Win>
      <Win still from={S2_END} to={S3_END}><S3 /></Win>
      <Win still from={S3_END} to={S4_END}><S4 /></Win>
      <Win still from={S4_END} to={S5_END}><S5 /></Win>
      <Win still from={S5_END} to={S6_END}><S6 /></Win>
      <Win still from={S6_END} to={S7_END}><S7 /></Win>
      <Win still from={S7_END} to={A10_END}><S8 end={A10_END} /></Win>
      <Win from={A10_END} to={A12_END}><A12 /></Win>
      <ACT2 />
      <ACT3 />
      <Audio src={staticFile("audio/launch-mix.mp3")} />
    </AbsoluteFill>
  );
};
