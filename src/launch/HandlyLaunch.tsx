import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { A1, A10, A12, A2, A3, A4, A5, A6, A7, A8, A9 } from "./act1";
import { A1_END, A10_END, A12_END, A2_END, A3_END, A4_END, A5_END, A6_END, A7_END, A8_END, A9_END } from "./scenes";
import { Win } from "./kit";
import { ACT2 } from "./act2";
import { ACT3 } from "./act3";

export const HandlyLaunch: React.FC = () => {
  const ready = useExplainerFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win from={0} to={A1_END}><A1 /></Win>
      <Win from={A1_END} to={A2_END}><A2 /></Win>
      <Win from={A2_END} to={A3_END}><A3 /></Win>
      <Win from={A3_END} to={A4_END}><A4 /></Win>
      <Win from={A4_END} to={A5_END}><A5 /></Win>
      <Win from={A5_END} to={A6_END}><A6 /></Win>
      <Win from={A6_END} to={A7_END}><A7 /></Win>
      <Win from={A7_END} to={A8_END}><A8 /></Win>
      <Win from={A8_END} to={A9_END}><A9 /></Win>
      <Win from={A9_END} to={A10_END}><A10 /></Win>
      <Win from={A10_END} to={A12_END}><A12 /></Win>
      <ACT2 />
      <ACT3 />
      <Audio src={staticFile("audio/launch-mix.mp3")} />
    </AbsoluteFill>
  );
};
