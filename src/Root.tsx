import { Composition } from "remotion";
import { HandlyReel } from "./HandlyReel";
import { HandlyExplainer } from "./explainer/HandlyExplainer";
import * as EX from "./explainer/timing";
import { DURATION_IN_FRAMES, FPS, HEIGHT, WIDTH } from "./constants";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="HandlyReel"
        component={HandlyReel}
        durationInFrames={DURATION_IN_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="HandlyExplainer"
        component={HandlyExplainer}
        durationInFrames={EX.DURATION_IN_FRAMES}
        fps={EX.FPS}
        width={EX.WIDTH}
        height={EX.HEIGHT}
      />
      <Composition
        id="HandlyExplainerReel"
        component={HandlyExplainer}
        durationInFrames={EX.DURATION_IN_FRAMES}
        fps={EX.FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
