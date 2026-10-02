import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ACCENT_LIGHT, TrackPhrases, WaveDots } from "../components/Phrase";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;
const at = (i: number) => f(VO.hook[i][1]) - LEAD;

// White opening over soft morphing shapes: a camera tracks from phrase to phrase; "casă" trails off
// into three dots hopping like a typing indicator.
export const S1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const L = useLayout();
  const V = L.vertical;
  const fs = V ? 124 : 150;
  const casa = VO.hook[8][0].replace(/[.…]+$/, "");

  return (
    <AbsoluteFill>
      <TrackPhrases
        width={L.W}
        height={L.H}
        light
        fontSize={fs}
        y={V ? -40 : -20}
        spread={V ? [1.0, 0.18] : [0.8, 0.3]}
        phrases={[
          { words: [0, 1, 2].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: 9999, breaks: V ? [1] : [] },
          { words: [3, 4, 5].map((i) => ({ text: VO.hook[i][0], at: at(i) })), out: 9999 },
          { words: [{ text: VO.hook[6][0], at: at(6), color: ACCENT_LIGHT }], out: 9999 },
          {
            words: [
              { text: VO.hook[7][0], at: at(7) },
              { text: casa, at: at(8) },
            ],
            out: f(VO.hookEnd) - 4,
            suffix: (fr) => <WaveDots frame={fr} at={at(8) + 8} size={fs} light />,
          },
        ]}
      />
    </AbsoluteFill>
  );
};
