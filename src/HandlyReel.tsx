import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { Scene1 } from "./scenes/Scene1";
import { Scene2 } from "./scenes/Scene2";
import { Scene3 } from "./scenes/Scene3";
import { Scene4 } from "./scenes/Scene4";
import { Scene5 } from "./scenes/Scene5";
import { Scene6 } from "./scenes/Scene6";
import { useInterFont } from "./font";

export const HandlyReel: React.FC = () => {
  useInterFont();

  return (
    <AbsoluteFill style={{ backgroundColor: "#fafbfa" }}>
      <Scene1 />
      <Scene2 />
      <Scene3 />
      <Scene4 />
      <Scene5 />
      <Scene6 />

      {/* Single mixed track: re-paced voiceover + original happy/major music bed,
          ducked and tonally muffled under the voice, bright between phrases. */}
      <Audio src={staticFile("audio/mix.mp3")} />
    </AbsoluteFill>
  );
};
