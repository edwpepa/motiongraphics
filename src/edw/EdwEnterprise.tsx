import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BrainScene, SparkScene } from "./act1";
import { BuildScene, CityScene, RoadScene } from "./act2";
import { LogoScene } from "./act3";
import { EndScene, IdeaScene, MessageScene } from "./act5";
import { DareScene, DevicesScene, NetworkScene, ScopeScene, SplitScene } from "./act4";
import { Captions, CornerLogo, FPS, Grade } from "./kit";

/** mounts children for [from, to) seconds */
export const Shot: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const t = useCurrentFrame() / FPS;
  if (t < from || t >= to) return null;
  return <>{children}</>;
};

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
      <Shot from={29.4} to={36.7}>
        <LogoScene from={29.4} to={36.7} />
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
      <Shot from={56.7} to={59.95}>
        <IdeaScene from={56.7} to={59.95} />
      </Shot>
      <Shot from={59.95} to={63.75}>
        <MessageScene from={59.95} to={63.75} />
      </Shot>
      <Shot from={63.75} to={70}>
        <EndScene from={63.75} />
      </Shot>
      <Grade />
      <CornerLogo />
      <Captions hide={["edw", "yours"]} />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/edw-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
