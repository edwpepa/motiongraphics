import React from "react";
import { AbsoluteFill } from "remotion";
import { PhraseSeq } from "../components/Phrase";
import { useLayout } from "../layout";
import { f, VO } from "../timing";

const LEAD = 3;

// "Fără tarife de firmă. Fără intermediari." — one statement at a time, big and centred
export const S7NoFees: React.FC = () => {
  const L = useLayout();
  const V = L.vertical;
  return (
    <AbsoluteFill>
      <PhraseSeq
        phrases={[
          { words: VO.noFees.map(([text, sec]) => ({ text, at: f(sec) - LEAD })), out: f(VO.noMiddlemen[0][1]) - LEAD - 3, breaks: V ? [1] : [] },
          { words: VO.noMiddlemen.map(([text, sec]) => ({ text, at: f(sec) - LEAD })), out: f(VO.handly) - LEAD - 2, breaks: V ? [0] : [] },
        ]}
        fontSize={V ? 120 : 130}
      />
    </AbsoluteFill>
  );
};
