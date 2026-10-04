import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BrainScene, SparkScene } from "./act1";
import { BuildScene, CityScene, RoadScene } from "./act2";
import { LogoScene } from "./act3";
import { LogoClip } from "./logoClip";
import { END, END_FRAMES, MID, MID_END, MID_FRAMES, R, REVEAL } from "./logoShots";
import { IdeaScene, MessageScene } from "./act5";
import { DareScene, DevicesScene, NetworkScene, ScopeScene, SplitScene } from "./act4";
import { Captions, CornerLogo, FPS, Grade, LAYOUT, w } from "./kit";

/** mounts children for [from, to) seconds */
export const Shot: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from || t >= to) return null;
  return <>{children}</>;
};

const MSG = w("write", 0) + 0.25;
const FIN = w("yours", 0) - 0.05;
export const CAPTION_MUTE: [number, number][] = [[29.35, w("roof", 0) + 0.5], [FIN - 0.15, 71]];

export const EdwEnterprise: React.FC<{ audio?: boolean; reel?: boolean }> = ({ audio = true, reel = false }) => {
  LAYOUT.reel = reel;
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
      <LogoClip src="video/edw-logo-mid.mp4" frames={MID_FRAMES} shots={MID} hit={R} fade={[29.4, 29.8, MID_END - 0.45, MID_END]} />
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
      <LogoClip src="video/edw-logo-end.mp4" frames={END_FRAMES} shots={END} hit={REVEAL} fade={[FIN, FIN + 0.05, 69.0, 69.9]} />
      {!reel && <Grade />}
      {!reel && <CornerLogo />}
      {!reel && <Captions hide={["edw", "yours"]} mute={CAPTION_MUTE} />}
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/edw-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
