import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { A12 } from "./charge";
import { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "./introTimes";
import { A10_END, A12_END } from "./scenes";
import { Win } from "./kit";
import { ACT2T } from "./toon/act2";
import { ACT3T } from "./toon/act3";
import { T1, T2, T3, T4, T5, T6, T7, T8, T9 } from "./toon/act1";

/** the same film, its first act told as an animated short */
export const HandlyLaunchToon: React.FC = () => {
  const ready = useExplainerFonts();
  if (!ready) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win still from={0} to={S1_END}><T1 /></Win>
      <Win still from={S1_END} to={S2_END}><T2 /></Win>
      <Win still from={S2_END} to={S3_END}><T3 /></Win>
      <Win still from={S3_END} to={S4_END}><T4 /></Win>
      <Win still from={S4_END} to={S5_END}><T5 /></Win>
      <Win still from={S5_END} to={S6_END}><T6 /></Win>
      <Win still from={S6_END} to={S7_END}><T7 /></Win>
      <Win still from={S7_END} to={A10_END}><T8 end={A10_END} /></Win>
      <Win from={A10_END} to={A12_END}><A12 /></Win>
      <Win still from={A10_END} to={A10_END + 32}><T9 from={A10_END} /></Win>
      <ACT2T />
      <ACT3T />
      <Audio src={staticFile("audio/launch-mix.mp3")} />
    </AbsoluteFill>
  );
};
