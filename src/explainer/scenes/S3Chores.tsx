import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { KineticText } from "../components/KineticText";
import { Pill } from "../components/Pill";
import { Streaks } from "../components/Streaks";
import { DirBlur } from "../lib/Blur";
import { clamp01, drift, ease, keys, pop } from "../lib/anim";
import { C, FONT } from "../theme";
import { f, VO } from "../timing";

const ROW_Y0 = 120;
const ROW_GAP = 128;
const LEAD = 3;

const ITEMS = [
  { emoji: "💧", words: [["Robinet", 4.95], ["care", 5.4], ["curge", 5.74]], tag: "de 2 săptămâni" },
  { emoji: "🪛", words: [["Dulap", 6.62], ["de", 6.98], ["montat", 7.08]], tag: "de o lună" },
  { emoji: "🖌️", words: [["Perete", 8.24], ["de", 8.62], ["zugrăvit", 8.74]], tag: "din primăvară" },
] as const;

const Item: React.FC<{ index: number; frame: number }> = ({ index, frame }) => {
  const item = ITEMS[index];
  const start = f(VO.chores[index]) - LEAD;
  const box = pop(frame, start);
  const lastWord = f(item.words[item.words.length - 1][1]);
  const tag = pop(frame, lastWord + 7, 12, 150);

  return (
    <div style={{ position: "absolute", left: 0, top: ROW_Y0 + index * ROW_GAP, display: "flex", alignItems: "center", gap: 30, height: 80 }}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "3.5px solid #b3bbb6",
          transform: `scale(${box})`,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 58, lineHeight: 1, transform: `scale(${box}) rotate(${(1 - box) * -30}deg)`, display: "inline-block", fontFamily: FONT }}>
        {item.emoji}
      </span>
      <KineticText words={item.words.map(([text, sec]) => ({ text, at: f(sec) - LEAD }))} fontSize={60} weight={600} />
      <div style={{ transform: `scale(${tag})`, transformOrigin: "0% 50%", opacity: clamp01(tag * 2), marginLeft: 10 }}>
        <Pill emoji="⏳" label={item.tag} size={28} style={{ background: "rgba(255,255,255,0.75)", boxShadow: "0 6px 18px rgba(20,24,22,0.08)", color: C.inkSoft }} />
      </div>
    </div>
  );
};

// "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit."
export const S3Chores: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = 148;
  const exitStart = 291;

  const focus = (i: number) => ROW_Y0 + i * ROW_GAP + 40;
  // camera: close on each chore as it's named, then pull back to the whole pile-up
  const camY = keys(frame, [
    [enter, focus(0)],
    [f(VO.chores[1]) - 8, focus(0)],
    [f(VO.chores[1]) + 4, focus(1)],
    [f(VO.chores[2]) - 8, focus(1)],
    [f(VO.chores[2]) + 4, focus(2)],
    [f(VO.chores[2]) + 19, focus(2)],
    [exitStart - 2, 250],
  ], ease.inOutCubic);
  const camX = keys(frame, [
    [enter, 380],
    [f(VO.chores[2]) + 19, 430],
    [exitStart - 2, 490],
  ], ease.inOutCubic);
  const scale = keys(frame, [
    [enter, 1.42],
    [f(VO.chores[2]) + 19, 1.36],
    [exitStart - 2, 1.0],
  ], ease.inOutCubic);

  const enterY = 1300 * (1 - ease.outExpo(clamp01((frame - enter) / 12)));
  const enterYPrev = 1300 * (1 - ease.outExpo(clamp01((frame - 1 - enter) / 12)));
  const exitX = -2000 * ease.inExpo(clamp01((frame - exitStart) / 10));
  const exitXPrev = -2000 * ease.inExpo(clamp01((frame - 1 - exitStart) / 10));

  return (
    <AbsoluteFill>
      <DirBlur
        x={Math.abs(exitX - exitXPrev) * 0.4}
        y={Math.abs(enterY - enterYPrev) * 0.4}
        style={{ position: "absolute", inset: 0, transform: `translate(${exitX}px, ${enterY}px)` }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `scale(${scale}) translate(${-camX + drift(frame, 4, 170)}px, ${-camY + drift(frame, 3, 210, 1)}px)`,
          }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, fontFamily: FONT }}>
            <KineticText words={[{ text: "De", at: enter + 2 }, { text: "făcut", at: enter + 4 }, { text: "prin", at: enter + 6 }, { text: "casă", at: enter + 8 }]} fontSize={44} weight={700} />
            {ITEMS.map((_, i) => (frame >= f(VO.chores[i]) - LEAD - 1 ? <Item key={i} index={i} frame={frame} /> : null))}
          </div>
        </div>
      </DirBlur>
      <Streaks start={enter - 3} dur={14} />
    </AbsoluteFill>
  );
};
