import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, Grade, Head, TapHand } from "./kit";

export const ToonTest: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 40%, #2a4a52, ${C.night})` }}>
      <div style={{ position: "absolute", left: 40, top: 60 }}><Head l={{ side: -1, underAmt: 1 }} e={{ tired: 1, open: 0.7, brow: 0.6 }} f={f} /></div>
      <div style={{ position: "absolute", left: 500, top: 60 }}><Head l={{ side: 1 }} e={{ mouth: "tight", clench: 1, brow: 1 }} f={f} /></div>
      <div style={{ position: "absolute", left: 960, top: 60 }}><Head who="mihai" l={{ side: -1, key: C.warm }} e={{ mouth: "smile" }} f={f} /></div>
      <div style={{ position: "absolute", left: 1420, top: 60 }}><Head l={{ side: -1, rim: C.greenLight, key: C.green }} e={{ mouth: "grin", brow: -0.4 }} f={f} /></div>
      <div style={{ position: "absolute", left: 1500, top: 600, transform: "rotate(-20deg)" }}><TapHand width={200} /></div>
      <Grade />
    </AbsoluteFill>
  );
};
