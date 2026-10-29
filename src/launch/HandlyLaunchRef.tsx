import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { Win } from "./kit";
import { R1, R2, R3, R4, R5, R6, R7, R8, R9 } from "./ref/act1";
import { AppShot, Bridge, Done, Track } from "./ref/act2";
import { Break, C1, C2, C3, Cta, F1, TaskerShot } from "./ref/act3";
import { useInter400 } from "./ref/font";
import { B_END, BREAK_F, C1_END, C2_END, C3_END, CTA, D0, DROP_END, END_FLY, END_HIT, F1_START, FINAL_F, GATA, PHONE_IN, R1_END, R2_END, R3_END, R4_END, R5_END, R6_END, R7_END, R8_END, SWOOSH, TOTAL } from "./ref/marks";
import { BG, RefBg } from "./ref/ui";
import { DarkBg } from "./tv3d/kit3d";
import { EndCard, PremiumDrop } from "./tv3d/drop";

/** the launch ad, the reference's way: a light stage, centred type, UI cards and a cursor; the phone only while the app is shown */
export const HandlyLaunchRef: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const inter = useExplainerFonts();
  const inter4 = useInter400();
  const f = useCurrentFrame();
  if (!inter || !inter4) return <AbsoluteFill style={{ background: BG }} />;
  return (
    <AbsoluteFill style={{ background: BG }}>
      {/* act I · the problem, light */}
      {f < D0 && <RefBg />}
      <Win from={0} to={R1_END + 2}><R1 /></Win>
      <Win from={R1_END - 2} to={R2_END + 4}><R2 /></Win>
      <Win from={R2_END - 6} to={R3_END + 2}><R3 /></Win>
      <Win from={R3_END - 6} to={R4_END + 2}><R4 /></Win>
      <Win from={R4_END - 4} to={R5_END + 2}><R5 /></Win>
      <Win from={R5_END - 8} to={R6_END + 2}><R6 /></Win>
      <Win from={R6_END - 4} to={R7_END + 2}><R7 /></Win>
      <Win from={R7_END - 2} to={R8_END + 2}><R8 /></Win>
      <Win from={R8_END - 2} to={D0}><R9 /></Win>
      {/* the drop */}
      <Win still from={D0} to={DROP_END}><PremiumDrop from={D0} zoomOutAt={DROP_END - 8} /></Win>
      {/* act II · the app, light; then the slow night */}
      {f >= DROP_END && f < GATA && <RefBg />}
      {f >= GATA && f < B_END && <Bridge />}
      <Win still from={PHONE_IN - 2} to={SWOOSH + 14}><AppShot /></Win>
      <Win from={SWOOSH - 2} to={GATA + 4}><Track /></Win>
      <Win from={GATA} to={B_END}><Done /></Win>
      {/* act III · the other side, dark */}
      {f >= B_END && f < BREAK_F && <DarkBg />}
      <Win from={B_END} to={C1_END + 2}><C1 /></Win>
      <Win from={C1_END - 2} to={C2_END + 2}><C2 /></Win>
      <Win from={C2_END - 2} to={C3_END + 4}><C3 /></Win>
      <Win still from={C3_END - 14} to={BREAK_F}><TaskerShot /></Win>
      <Win still from={BREAK_F} to={FINAL_F}><Break /></Win>
      <Win still from={FINAL_F} to={F1_START}><PremiumDrop from={FINAL_F} zoomOutAt={F1_START - 8} /></Win>
      {/* the close, light again */}
      {f >= F1_START && f < END_FLY && <RefBg />}
      <Win from={F1_START} to={CTA + 4}><F1 /></Win>
      <Win still from={CTA - 2} to={END_FLY + 2}><Cta /></Win>
      <Win still from={END_FLY} to={TOTAL}><EndCard from={END_FLY} hit={END_HIT} end={TOTAL} bg={BG} /></Win>
      {audio && <Audio src={staticFile("audio/launch-mix-ref.mp3")} />}
    </AbsoluteFill>
  );
};
