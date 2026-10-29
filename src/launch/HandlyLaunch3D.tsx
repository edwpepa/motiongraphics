import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { A12 } from "./charge";
import { S1_END, S2_END, S3_END, S4_END, S5_END, S6_END, S7_END } from "./introTimes";
import { A10_END, A12_END } from "./scenes";
import { Win } from "./kit";
import { ACT2_3D } from "./tv3d/act2";
import { ACT3_3D } from "./tv3d/act3";
import { PremiumDrop } from "./tv3d/drop";
import { B1_END } from "./scenes";
import { DROP, F } from "./timeline";
import { useOutfit } from "./tv/font";
import { G1, G2, G3, G4, G5, G6, G7, G8, G9 } from "./tv3d/act1";

/** the launch ad with the real iPhone: light stage, the app alive on the glass, splashes of green on the beat */
export const HandlyLaunch3D: React.FC = () => {
  const ready = useExplainerFonts();
  const outfit = useOutfit();
  if (!ready || !outfit) return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Win still from={0} to={S1_END}><G1 /></Win>
      <Win still from={S1_END} to={S2_END}><G2 /></Win>
      <Win still from={S2_END} to={S3_END}><G3 /></Win>
      <Win still from={S3_END} to={S4_END}><G4 /></Win>
      <Win still from={S4_END} to={S5_END}><G5 /></Win>
      <Win still from={S5_END} to={S6_END}><G6 /></Win>
      <Win still from={S6_END} to={S7_END}><G7 /></Win>
      <Win still from={S7_END} to={A10_END}><G8 /></Win>
      <Win from={A10_END} to={A12_END}><A12 /></Win>
      <Win still from={A10_END} to={A10_END + 32}><G9 from={A10_END} /></Win>
      <Win still from={F(DROP)} to={B1_END}><PremiumDrop from={F(DROP)} zoomOutAt={B1_END - 8} /></Win>
      <ACT2_3D />
      <ACT3_3D />
      <Audio src={staticFile("audio/launch-mix-id.mp3")} />
    </AbsoluteFill>
  );
};
