import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Background } from "./components/Background";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { T } from "./constants";
import { useInterFont } from "./font";

const Sfx: React.FC<{ src: string; at: number; volume?: number }> = ({ src, at, volume = 1 }) => (
  <Sequence from={at} durationInFrames={60} layout="none">
    <Audio src={staticFile(src)} volume={volume} />
  </Sequence>
);

export const HandlyReel: React.FC = () => {
  useInterFont();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Background />

      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
      <Scene6 />

      {/* Voiceover */}
      <Sequence from={T.audioStart} layout="none">
        <Audio src={staticFile("audio/voiceover.mp3")} />
      </Sequence>

      {/* Scene-transition whooshes */}
      <Sfx src="audio/sfx/whoosh.mp3" at={T.s2.start} volume={0.8} />
      <Sfx src="audio/sfx/whoosh.mp3" at={T.s3.start} volume={0.8} />
      <Sfx src="audio/sfx/whoosh.mp3" at={T.s4.start} volume={0.8} />
      <Sfx src="audio/sfx/whoosh.mp3" at={T.s5.start} volume={0.8} />
      <Sfx src="audio/sfx/whoosh.mp3" at={T.s6.start} volume={0.9} />

      {/* UI pops */}
      <Sfx src="audio/sfx/pop.mp3" at={T.s2Beats[1]} volume={0.7} />
      <Sfx src="audio/sfx/pop.mp3" at={T.s2Beats[2] - 20} volume={0.7} />
      <Sfx src="audio/sfx/pop.mp3" at={T.s3Beat} volume={0.8} />
      <Sfx src="audio/sfx/pop.mp3" at={T.s4Beat + 14} volume={0.7} />
      <Sfx src="audio/sfx/pop.mp3" at={T.s5Beats[0] + 34} volume={0.7} />
      <Sfx src="audio/sfx/pop.mp3" at={T.s5Beats[1] + 18} volume={0.7} />

      {/* Brand reveal + confetti */}
      <Sfx src="audio/sfx/ding.mp3" at={T.s6.start} volume={0.9} />
      <Sfx src="audio/sfx/confetti.mp3" at={T.s6Beats[2] - 8} volume={1} />
    </AbsoluteFill>
  );
};
