import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { Explosion } from "./fx";
import { Win } from "./kit";
import { R1, R2, R3, R4, R5, R6, R7, R8, R9 } from "./ref/act1";
import { AppShot, Done, MapShot, Track } from "./ref/act2";
import { Break, C1, C2, C3, Cta, F1, TaskerShot } from "./ref/act3";
import { Finale } from "./ref/finale";
import { useInter400 } from "./ref/font";
import { BREAK_F, BRIDGE, C1_END, C2_END, C3_END, CTA, D0, DROP_END, F1_START, STAR, FINAL_F, GATA, MAP_IN, PHONE_BACK, PHONE_IN, R1_END, R2_END, R3_END, R4_END, R5_END, R6_END, R7_END, R8_END, STOP_F, SWOOSH, TOTAL } from "./ref/marks";
import { BG, RefBg } from "./ref/ui";
import { Slam } from "./slam";
import { BEATS } from "./timeline";
import { DarkBg } from "./tv3d/kit3d";

/** the launch ad, the reference's way: a light stage, centred type on the voice, iOS-native UI, the phone only while
 * the app is shown, the two brand drops, a dead stop before "Dar Handly", the heart that becomes the mark */
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
      {/* the first drop: the brand, flipping colour on every beat */}
      <Win from={D0} to={DROP_END}>
        <Slam from={D0} ro zoomOutAt={DROP_END - 8} shakeAt={D0} />
        <Explosion at={D0} cx={960} cy={560} />
      </Win>
      {/* act II · the app, light */}
      {f >= DROP_END && f < STOP_F && <RefBg />}
      <Win still from={PHONE_IN - 2} to={SWOOSH + 14}><AppShot /></Win>
      <Win still from={MAP_IN - 2} to={PHONE_BACK + 14}><MapShot /></Win>
      <Win from={SWOOSH - 2} to={GATA + 4}><Track /></Win>
      <Win from={GATA} to={STOP_F}><Done /></Win>
      {/* everything stops dead: black, silence */}
      {f >= STOP_F && f < BRIDGE && <AbsoluteFill style={{ background: "#000" }} />}
      {/* act III · the other side, dark */}
      {f >= BRIDGE && f < BREAK_F && (
        <AbsoluteFill style={{ opacity: Math.min(1, (f - BRIDGE) / 8) }}>
          <DarkBg />
        </AbsoluteFill>
      )}
      <Win from={BRIDGE} to={C1_END + 2}><C1 /></Win>
      <Win from={C1_END - 2} to={C2_END + 2}><C2 /></Win>
      <Win from={C2_END - 2} to={C3_END + 4}><C3 /></Win>
      <Win still from={C3_END - 14} to={BREAK_F}><TaskerShot /></Win>
      <Win still from={BREAK_F} to={FINAL_F}><Break /></Win>
      {/* the final drop */}
      <Win from={FINAL_F} to={F1_START}>
        <Slam from={FINAL_F} ro zoomOutAt={F1_START - 8} shakeAt={FINAL_F} grid={{ d0: BRIDGE, beats: BEATS }} />
        <Explosion at={FINAL_F} cx={960} cy={560} />
      </Win>
      {/* the close, light again */}
      {f >= F1_START && <RefBg />}
      <Win from={F1_START} to={CTA + 4}><F1 /></Win>
      <Win still from={CTA - 2} to={STAR + 8}><Cta /></Win>
      <Win still from={STAR - 4} to={TOTAL}><Finale /></Win>
      {audio && <Audio src={staticFile("audio/launch-mix-ref.mp3")} />}
    </AbsoluteFill>
  );
};
