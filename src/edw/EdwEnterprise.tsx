import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BrainScene, SparkScene } from "./act1";
import { BuildScene, CityScene, RoadScene } from "./act2";
import { LogoScene } from "./act3";
import { Logo3D, Shot as Cam } from "./logo3d";
import { IdeaScene, MessageScene } from "./act5";
import { DareScene, DevicesScene, NetworkScene, ScopeScene, SplitScene } from "./act4";
import { Captions, CornerLogo, FPS, Grade, w } from "./kit";

/** mounts children for [from, to) seconds */
export const Shot: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from || t >= to) return null;
  return <>{children}</>;
};

const MSG = w("write", 0) + 0.25;
const R = w("edw", 0) - 0.02;
const MID_END = w("roof", 0) + 0.45;
/** the middle reveal: three macro passes along the metal in the silence, the whole mark on the BRAAM */
const MID: Cam[] = [
  { from: 29.4, to: 30.25, cam: [[-8.6, 4.5, 1.3], [-4.0, 4.5, 1.5]], look: [[-2.5, 3.0, 0.2], [1.8, 3.0, 0.2]], light: [[-10, 4.6, 1.6], [2, 4.6, 1.6]], fov: 34 },
  { from: 30.25, to: 31.05, cam: [[6.8, -4.7, 2.3], [4.6, -4.3, 2.8]], look: [[4.4, 0.4, 0.1], [4.4, 0.7, 0.1]], light: [[10, -1.5, 2.5], [1, -1.5, 2.5]], fov: 34 },
  { from: 31.05, to: R, cam: [[-10.6, -1.3, 1.9], [-8.2, -0.6, 2.3]], look: [[-5.5, 0.5, 0], [-4.4, 0.7, 0]], light: [[-12, 1.2, 1.4], [-3, 1.2, 1.4]], fov: 34 },
  { from: R, to: MID_END + 0.5, cam: [[2.6, -1.4, 32], [0, -0.3, 29.5]], look: [[0, -0.2, 0], [0, -0.1, 0]], light: [[-15, 2.5, 5], [15, 2.5, 5]], fov: 30, exposure: 1.3 },
];
const FIN = w("yours", 0) - 0.05;
const REVEAL = FIN + 1.83;
/** the closing reveal: three fast passes cut on the music, then the whole mark held to the end */
const END_SHOTS: Cam[] = [
  { from: FIN, to: FIN + 0.63, cam: [[2.6, -2.4, 1.6], [1.6, -2.2, 2.0]], look: [[0.2, 0.0, 0.2], [0.4, 0.2, 0.2]], light: [[4, -3, 2], [-1, 2, 2]], fov: 34 },
  { from: FIN + 0.63, to: FIN + 1.23, cam: [[-8.2, 5.4, 2.6], [-7.2, 5.0, 3.0]], look: [[-5.0, 2.6, 0.2], [-4.6, 2.4, 0.2]], light: [[-9, 6, 2], [-3, 6, 2]], fov: 34 },
  { from: FIN + 1.23, to: REVEAL, cam: [[-4.5, -4.3, 1.6], [3.5, -4.3, 1.6]], look: [[-3.0, -2.9, 0], [5.0, -2.9, 0]], light: [[-6, -3.5, 1.8], [6, -3.5, 1.8]], fov: 34 },
  { from: REVEAL, to: 70.5, cam: [[-3, -1.8, 24], [0, -0.3, 29.5]], look: [[0, -0.4, 0], [0, -0.1, 0]], light: [[-15, 3, 5], [15, 3, 5]], fov: 30, exposure: 1.3 },
];

export const EdwEnterprise: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Shot from={0} to={6.55}>
        <BrainScene />
      </Shot>
      <Shot from={6.55} to={13.75}>
        <SparkScene from={6.55} />
      </Shot>
      <Shot from={13.75} to={18.6}>
        <CityScene from={13.75} to={18.6} />
      </Shot>
      <Shot from={18.6} to={21.05}>
        <RoadScene from={18.6} to={21.05} />
      </Shot>
      <Shot from={21.05} to={29.4}>
        <BuildScene from={21.05} to={29.4} />
      </Shot>
      <Shot from={29.4} to={MID_END}>
        <Logo3D shots={MID} hit={R} fadeIn={29.4} fadeOut={[MID_END - 0.45, MID_END]} />
      </Shot>
      <Shot from={MID_END} to={36.7}>
        <LogoScene from={MID_END} to={36.7} roofOnly />
      </Shot>
      <Shot from={36.7} to={39.75}>
        <SplitScene from={36.7} to={39.75} />
      </Shot>
      <Shot from={39.75} to={42.45}>
        <ScopeScene from={39.75} to={42.45} />
      </Shot>
      <Shot from={42.45} to={46.6}>
        <DareScene from={42.45} to={46.6} />
      </Shot>
      <Shot from={46.6} to={51.25}>
        <NetworkScene from={46.6} to={51.25} />
      </Shot>
      <Shot from={51.25} to={56.7}>
        <DevicesScene from={51.25} to={56.7} />
      </Shot>
      <Shot from={56.7} to={MSG}>
        <IdeaScene from={56.7} to={MSG} />
      </Shot>
      <Shot from={MSG} to={FIN}>
        <MessageScene from={MSG} to={FIN} />
      </Shot>
      <Shot from={FIN} to={70}>
        <Logo3D shots={END_SHOTS} hit={REVEAL} fadeIn={FIN} fadeOut={[69.0, 69.9]} />
      </Shot>
      <Grade />
      <CornerLogo />
      <Captions hide={["edw", "yours"]} mute={[[29.35, w("roof", 0) + 0.5], [FIN - 0.15, 71]]} />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/edw-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
