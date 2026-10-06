import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { useExplainerFonts } from "../explainer/fonts";
import { BAR_H, Grade, Logo, clamp01, useT } from "../edw/kit";
import { Atmos, K, MarkStage } from "./stage";
import { Big, Kicker, w } from "./type";
import { Browser, Toggle } from "./ui";

export const HIRE_END = 49;

/** the small mark, top left, while the big one is not on screen */
const Corner: React.FC = () => {
  const t = useT();
  const win: [number, number][] = [
    [6.4, 17.2],
    [K.toGlobe + 0.3, K.back - 0.2],
    [K.away + 0.2, K.rectAt - 0.3],
  ];
  const o = win.reduce((m, [a, b]) => Math.max(m, clamp01((t - a) / 0.5) * clamp01((b - t) / 0.4)), 0);
  if (o <= 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 64, top: BAR_H + 36, opacity: o }}>
      <Logo width={104} white />
    </div>
  );
};

/** every line of type, in the middle of the screen */
const Words: React.FC = () => (
  <>
    <Kicker text="[ INCOMING TRANSMISSION ]" at={0.15} out={1.25} y={540} />
    <Big text="IS GROWING." at={w("growing", 3)} out={K.toSlots - 0.2} size={64} y={690} tracking="0.02em" />
    <Big text="THREE OPEN SPOTS." at={w("growing", 7)} out={K.slotsOut - 0.1} size={96} y={300} box={0} boxAt={w("growing", 8)} />
    <Big text="NOT MANY." at={w("many", 1)} out={K.one - 0.3} size={180} y={540} />
    <Big text="ONLY THE ONES" at={K.one} out={w("sharp", 6) - 0.3} size={92} y={640} />
    <Big text="SERIOUSLY SHARP." at={w("sharp", 6)} out={w("sharp", 9) - 0.3} size={130} y={640} box={1} boxAt={w("sharp", 7)} />
    <Big text="SOLVING PROBLEMS" at={w("sharp", 9)} out={w("sharp", 14) - 0.3} size={88} y={540} />
    <Big text="LIKE BREATHING." at={w("sharp", 14)} out={w("calm", 0) - 0.3} size={112} y={540} />
    <Big text="CALM." at={w("calm", 0)} out={w("calm", 2) - 0.3} size={230} y={540} />
    <Big text="NO ONE PUSHES THEM." at={w("calm", 2)} out={16.35} size={86} y={540} />
    <Kicker text="[ TRANSMISSION ENDS ]" at={16.6} out={17.35} y={540} />
    <Kicker text="[ 01 — EQUITY ]" at={w("share", 0)} out={K.toGlobe - 0.1} y={220} />
    <Big text="EVERYONE WHO JOINS" at={w("share", 0) + 0.1} out={w("share", 5) - 0.3} size={70} y={760} />
    <Big text="OWNS A PIECE" at={w("share", 5)} out={w("create", 0) - 0.3} size={96} y={760} box={2} boxAt={w("share", 6)} />
    <Big text="OF WHAT WE CREATE." at={w("create", 0)} out={w("yours", 0) - 0.3} size={80} y={760} />
    <Big text="PARTLY YOURS." at={w("yours", 0)} out={K.toGlobe} size={120} y={760} box={1} boxAt={w("yours", 2)} />
    <Kicker text="[ 02 — LOCATION ]" at={w("anywhere", 0)} out={w("build", 0) - 0.2} y={180} />
    <Big text="ANYWHERE." at={w("anywhere", 4)} out={w("remote", 0) - 0.3} size={190} y={470} />
    <Toggle at={w("remote", 0) - 0.15} out={w("rest", 5) + 0.3} flipAt={w("remote", 2)} y={470} />
    <Big text="WE'LL FIGURE OUT THE REST." at={w("rest", 0)} out={w("build", 0) - 0.3} size={64} y={640} tracking="0em" />
    <Kicker text="[ 03 — WHAT MATTERS ]" at={w("build", 0)} out={K.back - 0.1} y={300} />
    <Big text="WHAT YOU BUILD." at={w("build", 4)} out={K.back - 0.05} size={140} y={480} box={2} boxAt={w("build", 7)} />
    <Big text="NOT WHERE YOU SIT." at={w("sit", 1)} out={K.back - 0.05} size={64} y={640} strike={-1} strikeAt={w("sit", 5)} dim={0.6} />
    <Big text="SOUNDS LIKE YOU?" at={w("you", 2)} out={K.away - 0.2} size={110} y={640} />
    <Kicker text="[ WEBSITE  →  HIRING  →  FORM ]" at={K.away + 0.1} out={K.rectAt - 0.3} y={175} size={18} />
    <Kicker text="WE'RE HIRING" at={K.rectAt + 1.25} out={HIRE_END - 0.9} y={655} size={26} opacity={0.95} />
    <Kicker text="[ 3 OPEN SPOTS ]" at={K.rectAt + 1.7} out={HIRE_END - 0.9} y={705} size={16} opacity={0.6} />
  </>
);

export const HireFilm: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  useExplainerFonts();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Atmos />
      <MarkStage />
      <Browser />
      <Words />
      <Grade />
      <Corner />
      {audio && (
        <Sequence>
          <Audio src={staticFile("audio/hire-mix.mp3")} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
