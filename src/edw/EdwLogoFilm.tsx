import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Logo3D } from "./logo3d";
import { END, END_FRAMES, MID, MID_FRAMES } from "./logoShots";

/** only the 3D logo shots, for pre-rendering to video (see tools/edw/render_logo.sh) */
export const EdwLogoFilm: React.FC = () => {
  const f = useCurrentFrame();
  const inMid = f >= MID_FRAMES[0] && f <= MID_FRAMES[1];
  const inEnd = f >= END_FRAMES[0] && f <= END_FRAMES[1];
  return <AbsoluteFill style={{ background: "#000" }}>{inMid ? <Logo3D shots={MID} /> : inEnd ? <Logo3D shots={END} /> : null}</AbsoluteFill>;
};
