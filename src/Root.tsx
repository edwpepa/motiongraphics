import { Composition } from "remotion";
import { HandlyReel } from "./HandlyReel";
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
    </>
  );
};
