import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useExplainerFonts } from "../../explainer/fonts";
import { LockScreen, Notif } from "../tv/ios";
import { Phones } from "./phone3d";

export const Test3D: React.FC = () => {
  const f = useCurrentFrame();
  const ok = useExplainerFonts();
  if (!ok) return null;
  return (
    <AbsoluteFill style={{ background: "#f4f5f9" }}>
      <Phones
        slots={[
          { p: { x: 760, y: 540, rx: 8, ry: -30 + f * 1.5, rz: 4, h: 880, color: "teal" }, screen: <LockScreen f={f} time="23:47"><Notif k="reminders" app="Mementouri" title="Repară priza" body="Întârziat de 3 săptămâni" style={{ top: 300 }} /></LockScreen> },
          { p: { x: 1360, y: 560, z: -300, rx: -10, ry: 30 - f * 2, rz: -8, h: 780, color: "green" }, screen: <LockScreen f={f} time="9:41" /> },
        ]}
      />
    </AbsoluteFill>
  );
};
