import { Composition } from "remotion";
import { HandlyReel } from "./HandlyReel";
import { HandlyExplainer } from "./explainer/HandlyExplainer";
import * as EX from "./explainer/timing";
import { HandlyLaunch } from "./launch/HandlyLaunch";
import { EdwEnterprise } from "./edw/EdwEnterprise";
import { EdwLogoFilm } from "./edw/EdwLogoFilm";
import { EdwReel } from "./edw/EdwReel";
import { HireFilm } from "./hire/HireFilm";
import { HandlyTimisoara } from "./tm/HandlyTimisoara";
import { HandlyTimisoaraIso } from "./tm/HandlyTimisoaraIso";
import { HandlyTimisoaraLaunch } from "./tm/HandlyTimisoaraLaunch";
import * as TMT from "./tm/timeline";
import * as LA from "./launch/timeline";
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
        durationInFrames={EX.TOTAL_FRAMES}
        fps={EX.FPS}
        width={EX.WIDTH}
        height={EX.HEIGHT}
      />
      <Composition
        id="HandlyExplainerReel"
        component={HandlyExplainer}
        durationInFrames={EX.TOTAL_FRAMES}
        fps={EX.FPS}
        width={1080}
        height={1920}
      />
      <Composition id="HandlyTimisoaraSketch" component={HandlyTimisoara} durationInFrames={TMT.TOTAL} fps={TMT.FPS} width={1920} height={1080} />
      <Composition id="HandlyTimisoara" component={HandlyTimisoaraLaunch} durationInFrames={TMT.TOTAL} fps={TMT.FPS} width={1920} height={1080} />
      <Composition id="HandlyTimisoaraCity" component={HandlyTimisoaraIso} durationInFrames={TMT.TOTAL} fps={TMT.FPS} width={1920} height={1080} />
      <Composition id="EdwEnterprise" component={EdwEnterprise} durationInFrames={70 * 30} fps={30} width={1920} height={1080} defaultProps={{ audio: false }} />
      <Composition id="EdwEnterpriseClean" component={EdwEnterprise} durationInFrames={70 * 30} fps={30} width={1920} height={1080} defaultProps={{ audio: false, reel: true }} />
      <Composition id="EdwReel" component={EdwReel} durationInFrames={70 * 30} fps={30} width={1080} height={1920} defaultProps={{ audio: false }} />
      <Composition id="EdwHiring" component={HireFilm} durationInFrames={Math.round(50.2 * 30)} fps={30} width={1920} height={1080} defaultProps={{ audio: false }} />
      <Composition id="EdwLogoFilm" component={EdwLogoFilm} durationInFrames={70 * 30} fps={30} width={1920} height={1080} />
      <Composition id="HandlyLaunch" component={HandlyLaunch} durationInFrames={LA.TOTAL} fps={LA.FPS} width={LA.WIDTH} height={LA.HEIGHT} />
    </>
  );
};
