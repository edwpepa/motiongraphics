import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp01, ease, lerp, seeded } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { AText, Cam, outExpo, outQuart, r01 } from "../apple";
import { C10, C7, C8, C9 } from "../act3";
import { Explosion } from "../fx";
import { Logo, Win } from "../kit";
import { C1_END, C2_END, C3_END, C4_END, C5_END, C8_END, C9_END, HEARTBEATS, SPLIT } from "../scenes";
import { Slam } from "../slam";
import { BREAK, BRIDGE, END, F, FINAL, w } from "../timeline";
import { W2 } from "./act1";
import { C, Dust, Grade, Halftone, Head, MiniFace, Rays, SpeedLines, TapHand, ToonPhone } from "./kit";

const INK = "#1d1d1f";
const WHITE = "#f6f3ee";
const GREEN_TXT = "#00a852";
const card: React.CSSProperties = { position: "absolute", borderRadius: 34, background: "rgba(255,255,255,0.97)", boxShadow: "0 30px 70px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(0,0,0,0.04)", fontFamily: FONT, color: INK, overflow: "hidden" };
const pill = (bg: string, fg: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 999, background: bg, color: fg, fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em" });
const Check: React.FC<{ size: number; color?: string; bg?: string }> = ({ size, color = "#fff", bg = C.green }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx={12} cy={12} r={12} fill={bg} />
    <path d="M7 12.4l3.2 3.1L17 8.8" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const rise = (f: number, at: number, d = 16) => {
  const p = outExpo(clamp01((f - at) / d));
  return { opacity: clamp01(p * 1.6), transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`, filter: p < 1 ? `blur(${(1 - p) * 12}px)` : undefined } as React.CSSProperties;
};
const BottomShade: React.FC<{ a?: number }> = ({ a = 0.7 }) => <AbsoluteFill style={{ background: `linear-gradient(0deg, rgba(0,0,0,${a}) 0%, rgba(0,0,0,${a * 0.5}) 16%, rgba(0,0,0,0) 34%)` }} />;
const CutFlash: React.FC<{ at: number; f: number }> = ({ at, f }) => {
  const t = (f - at) / 5;
  if (t < 0 || t > 1) return null;
  return <AbsoluteFill style={{ background: `rgba(255,255,255,${0.7 * (1 - t) ** 2})` }} />;
};

// ------------------------------------------------------------------ V1: we follow Mihai out of Andrei's block; the camera swings round to his face
const MihaiBack: React.FC<{ f: number }> = ({ f }) => (
  <svg width={760} height={900} viewBox="0 0 760 900" style={{ overflow: "visible" }}>
    {/* torso, green tee from behind, rim-lit by the doorway */}
    <path d="M90 900 C96 640 170 540 380 530 C590 540 664 640 670 900 Z" fill="#163d2c" stroke={C.ink} strokeWidth={9} />
    <path d="M110 900 C116 660 180 560 380 548" fill="none" stroke="#ffb565" strokeWidth={9} opacity={0.8} />
    <path d="M650 900 C644 660 580 560 380 548" fill="none" stroke="#7fd8ff" strokeWidth={7} opacity={0.6} />
    <path d="M380 560 L380 900" stroke="#0e2a1e" strokeWidth={6} opacity={0.6} />
    {/* the toolbox swinging in his right hand */}
    <g transform={`rotate(${Math.sin(f / 7) * 4} 700 700)`}>
      <path d="M690 650 L700 760" stroke={C.ink} strokeWidth={30} strokeLinecap="round" />
      <rect x={600} y={760} width={220} height={130} rx={16} fill="#c0392b" stroke={C.ink} strokeWidth={8} />
      <path d="M660 760 C660 724 760 724 760 760" fill="none" stroke={C.ink} strokeWidth={10} />
    </g>
    {/* neck, ears, the back of his head */}
    <path d="M320 470 L318 556 L442 556 L440 470 Z" fill={C.skinShade} />
    <ellipse cx={262} cy={360} rx={22} ry={40} fill={C.skinShade} stroke={C.ink} strokeWidth={5} />
    <ellipse cx={498} cy={360} rx={22} ry={40} fill={C.skinShade} stroke={C.ink} strokeWidth={5} />
    <path d="M262 330 C258 210 312 150 380 150 C448 150 502 210 498 330 C496 420 452 486 380 490 C308 486 264 420 262 330 Z" fill={C.hair} stroke={C.ink} strokeWidth={6} />
    <path d="M270 300 C276 220 320 168 380 162" fill="none" stroke="#ffb565" strokeWidth={7} opacity={0.75} />
  </svg>
);
export const V1: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = BRIDGE;
  const whip = w("dar", 6) - 4;
  const L = W2("dar");
  const seg = r01(f, C1_END - 34, C1_END - 22, outQuart);
  const flip = r01(f, C1_END - 16, C1_END - 6);
  const SW = 780;
  if (f < whip) {
    const walk = r01(f, a0, whip, (t) => t);
    const bob = Math.abs(Math.sin(f / 7)) * 14;
    return (
      <AbsoluteFill style={{ background: "#0b1416", overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1 + 0.03 * Math.sin(fr / 14), x: fr >= whip - 6 ? -(((fr - (whip - 6)) / 6) ** 2) * 1600 : 0, y: 0 })} blur={1.4}>
          {/* the hallway closing in, the doorway to the evening ahead */}
          <div style={{ position: "absolute", left: 960, top: 520, width: 0, height: 0, transform: `scale(${lerp(0.75, 1.5, walk)})` }}>
            <div style={{ position: "absolute", left: -1400, top: -900, width: 2800, height: 1800, background: "linear-gradient(90deg,#122428,#1d3a40 30%,#1d3a40 70%,#122428)" }} />
            <div style={{ position: "absolute", left: -260, top: -380, width: 520, height: 760, background: "linear-gradient(180deg,#2f5f7a 0%,#e78a5a 62%,#ffcf8a 76%,#3a2a24 100%)", border: `18px solid #0d1a1d`, boxShadow: "0 0 160px rgba(255,170,100,0.45)" }}>
              <div style={{ position: "absolute", left: 30, top: 230, width: 140, height: 250, background: "#1d2230" }} />
              <div style={{ position: "absolute", left: 320, top: 180, width: 160, height: 300, background: "#232a3a" }} />
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} style={{ position: "absolute", left: 50 + (i % 3) * 40 + (i > 5 ? 290 : 0), top: 260 + Math.floor((i % 6) / 3) * 60, width: 18, height: 18, background: "#ffd38a" }} />
              ))}
            </div>
            <div style={{ position: "absolute", left: -1400, top: 380, width: 2800, height: 600, background: "linear-gradient(180deg,#0e1b1e,#071012)" }} />
            <div style={{ position: "absolute", left: -260, top: 380, width: 520, height: 600, background: "linear-gradient(180deg, rgba(255,180,110,0.35), rgba(255,180,110,0))", clipPath: "polygon(0 0, 100% 0, 140% 100%, -40% 100%)" }} />
          </div>
          <div style={{ position: "absolute", left: 960 - 380 + Math.sin(f / 14) * 10, top: 300 + bob, transform: `rotate(${Math.sin(f / 14) * 1.2}deg)` }}>
            <MihaiBack f={f} />
          </div>
        </Cam>
        <Dust f={f} n={26} color="255,210,160" />
        <BottomShade />
        <AText words={L.slice(0, 5)} size={80} x={120} y={870} align="left" color={WHITE} hi={{ 1: C.greenLight }} />
        <Grade vignette={0.65} warm={0.4} />
      </AbsoluteFill>
    );
  }
  const land = outExpo(clamp01((f - whip) / 10));
  const orbit = r01(f, whip, C1_END, (t) => t);
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#24435a 0%,#7a5a72 40%,#f0905c 68%,#2a2020 100%)", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.04, x: (1 - outExpo(clamp01((fr - whip) / 10))) * 1600, y: 0 })} blur={1.4}>
        {/* the block behind him, its windows coming on */}
        <div style={{ position: "absolute", left: -200 - orbit * 160, top: 120, width: 1400, height: 900, background: "#2a2c3c", border: `8px solid ${C.ink}`, filter: "blur(5px) brightness(0.7)" }}>
          {Array.from({ length: 70 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: 40 + (i % 10) * 135, top: 40 + Math.floor(i / 10) * 120, width: 70, height: 60, background: seeded(i, 3) > 0.45 ? "#ffcf7a" : "#3a4258", opacity: 0.9 }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 1500 - orbit * 260, top: 160, width: 30, height: 900, background: "#141418" }} />
        <div style={{ position: "absolute", left: 1440 - orbit * 260, top: 150, width: 150, height: 30, borderRadius: 15, background: "#141418", boxShadow: "60px 30px 80px rgba(255,200,120,0.6)" }} />
        <div style={{ position: "absolute", left: 1010 + orbit * 40, top: 270 }}>
          <Head who="mihai" width={660} l={{ side: 1, key: "#ffb565", rim: "#ffcf8a", shade: 0.85 }} e={{ open: 0.9, brow: 0.15, mouth: "smile", gx: -6 }} f={f} />
        </div>
      </Cam>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 50%)" }} />
      <AText words={L.slice(0, 5)} size={80} x={120} y={640} align="left" color={WHITE} hi={{ 1: C.greenLight }} />
      <AText words={L.slice(5)} size={80} x={120} y={735} align="left" color={WHITE} />
      <div style={{ position: "absolute", left: 120, top: 820, width: SW, height: 92, borderRadius: 999, background: "rgba(240,242,241,0.95)", boxShadow: "0 20px 50px rgba(0,0,0,0.35)", opacity: seg, transform: `translateY(${(1 - seg) * 30}px) scale(${0.96 + 0.04 * seg})`, filter: seg < 1 ? `blur(${(1 - seg) * 14}px)` : undefined, fontFamily: FONT }}>
        <div style={{ position: "absolute", top: 8, bottom: 8, left: 8 + flip * (SW / 2 - 8), width: SW / 2 - 8, borderRadius: 999, background: flip > 0.5 ? C.green : "#fff", boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }} />
        {["Am nevoie de ajutor", "Vreau să câștig"].map((t, i) => (
          <div key={t} style={{ position: "absolute", top: 0, bottom: 0, left: i * (SW / 2), width: SW / 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em", color: i === 1 ? (flip > 0.5 ? "#fff" : "#7c837f") : flip > 0.5 ? "#7c837f" : INK }}>
            {t}
          </div>
        ))}
      </div>
      <Grade vignette={0.5} warm={0.5 * land} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ V2: Mihai's workshop — the tools on the wall, caught in a shaft of light
const Tools: React.FC = () => (
  <svg width={1600} height={800} viewBox="0 0 1600 800" style={{ overflow: "visible" }}>
    <defs>
      <Halftone id="toolHt" color="#1a0f08" opacity={0.4} />
    </defs>
    {/* hammer */}
    <g transform="translate(120 80) rotate(-8)">
      <rect x={60} y={80} width={46} height={420} rx={14} fill="#c98a4a" stroke={C.ink} strokeWidth={8} />
      <path d="M0 40 L180 40 L200 70 L180 110 L0 110 Z" fill="#8a9196" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M10 50 L170 50" stroke="#e6ebee" strokeWidth={8} />
    </g>
    {/* wrench */}
    <g transform="translate(380 60) rotate(6)">
      <path d="M60 60 C20 60 0 100 20 140 L50 120 L80 140 L70 180 C110 190 140 160 140 120 L150 600 C150 630 110 630 110 600 Z" fill="#a9b1b6" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d="M130 200 L136 580" stroke="#eef2f4" strokeWidth={8} />
    </g>
    {/* saw */}
    <g transform="translate(600 120)">
      <path d="M0 40 L420 0 L440 160 L0 200 Z" fill="#c3cacd" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <path d={Array.from({ length: 20 }, (_, i) => `${i === 0 ? "M" : "L"}${i * 22} ${200 - i * 2} L${i * 22 + 11} ${216 - i * 2}`).join(" ")} fill="none" stroke={C.ink} strokeWidth={5} />
      <path d="M420 0 L560 -10 C600 -10 610 40 600 90 L590 170 L440 160 Z" fill="#d98a3a" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <ellipse cx={530} cy={80} rx={34} ry={44} fill="#3a2a1c" stroke={C.ink} strokeWidth={6} />
    </g>
    {/* screwdrivers */}
    {[0, 1, 2, 3].map((k) => (
      <g key={k} transform={`translate(${1280 + k * 70} ${70 + (k % 2) * 30})`}>
        <rect x={0} y={0} width={44} height={150} rx={18} fill={["#e8463a", "#ffb547", "#00bf63", "#3f8bd9"][k]} stroke={C.ink} strokeWidth={7} />
        <rect x={16} y={150} width={12} height={170 + k * 20} fill="#b8bec2" stroke={C.ink} strokeWidth={5} />
      </g>
    ))}
    {/* level */}
    <g transform="translate(620 430)">
      <rect x={0} y={0} width={620} height={80} rx={14} fill="#ffcf4a" stroke={C.ink} strokeWidth={8} />
      <rect x={270} y={18} width={80} height={44} rx={22} fill="#bff0c0" stroke={C.ink} strokeWidth={5} />
      <circle cx={310} cy={40} r={10} fill="#fff" />
    </g>
    {/* drill */}
    <g transform="translate(1260 470)">
      <path d="M0 0 L240 0 C270 0 280 30 270 60 L240 90 L0 90 Z" fill="#00a856" stroke={C.ink} strokeWidth={8} strokeLinejoin="round" />
      <rect x={60} y={90} width={90} height={190} rx={20} fill="#1f2a25" stroke={C.ink} strokeWidth={8} />
      <rect x={270} y={30} width={90} height={26} fill="#b8bec2" stroke={C.ink} strokeWidth={5} />
      <rect x={40} y={270} width={130} height={60} rx={12} fill="#00a856" stroke={C.ink} strokeWidth={8} />
    </g>
    {/* pliers */}
    <g transform="translate(160 580) rotate(-70)">
      <path d="M0 0 L60 10 L180 -20 L190 0 L70 40 L0 30 Z" fill="#a9b1b6" stroke={C.ink} strokeWidth={7} />
      <path d="M0 30 L60 20 L180 60 L170 80 L60 50 L0 60 Z" fill="#e8463a" stroke={C.ink} strokeWidth={7} />
    </g>
    <rect x={0} y={0} width={1600} height={800} fill="url(#toolHt)" opacity={0.5} />
  </svg>
);
const Pegboard: React.FC<{ blur?: number }> = ({ blur = 0 }) => (
  <AbsoluteFill style={{ background: "#8a5a34", backgroundImage: "radial-gradient(circle, #3a2414 0 5px, rgba(0,0,0,0) 6px)", backgroundSize: "48px 48px", filter: blur ? `blur(${blur}px) brightness(0.8)` : undefined }} />
);
export const V2: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C1_END;
  const L = W2("daca");
  return (
    <AbsoluteFill style={{ background: "#1a110a", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.0 + 0.1 * r01(fr, a0, C2_END, (t) => t), x: lerp(30, -30, r01(fr, a0, C2_END, (t) => t)), y: 0 })}>
        <Pegboard />
        <div style={{ position: "absolute", left: 160, top: 120 }}>
          <Tools />
        </div>
        <AbsoluteFill style={{ background: "linear-gradient(115deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 40%, rgba(255,200,130,0.18) 55%, rgba(0,0,0,0.55) 80%)" }} />
      </Cam>
      <Rays x={900} f={f} a={0.3} />
      <Dust f={f} n={50} color="255,214,160" area={[500, 0, 900, 1080]} />
      <BottomShade a={0.75} />
      <AText words={L} size={120} y={920} color={WHITE} hi={{ 1: C.amber, 2: C.amber, 3: C.amber }} />
      <Grade vignette={0.6} warm={0.6} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ V3: five smash cuts, one per word — skilled hands at work
const Sleeve: React.FC<{ x: number; y: number; r: number; len?: number }> = ({ x, y, r, len = 520 }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`, transformOrigin: "0% 50%" }}>
    <div style={{ position: "absolute", left: 0, top: -60, width: len, height: 120, borderRadius: 60, background: C.skin, border: `7px solid ${C.ink}` }} />
    <div style={{ position: "absolute", left: len - 140, top: -72, width: 260, height: 144, borderRadius: 40, background: "#1d4a35", border: `7px solid ${C.ink}` }} />
    <div style={{ position: "absolute", left: -90, top: -88, width: 180, height: 176, borderRadius: "46% 54% 50% 50%", background: C.skin, border: `7px solid ${C.ink}` }}>
      {[0, 1, 2].map((k) => <div key={k} style={{ position: "absolute", left: 18, top: 44 + k * 38, width: 60, height: 5, borderRadius: 3, background: C.skinDeep, opacity: 0.6 }} />)}
      <div style={{ position: "absolute", left: 70, top: -30, width: 90, height: 64, borderRadius: 32, background: C.skinLit, border: `6px solid ${C.ink}` }} />
    </div>
  </div>
);
export const V3: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = [C2_END, w("skills", 2) - 3, w("skills", 3) - 3, w("skills", 4) - 3, w("skills", 5) - 3];
  const k = cuts.filter((c) => f >= c).length - 1;
  const a = cuts[k];
  const t = f - a;
  const ws = W2("skills");
  const word = k === 0 ? ws.slice(0, 2) : [ws[k + 1]];
  const BG = ["#f3b25c", "#6fc6b0", "#3f8bd9", "#9ad0f0", "#e8735a"];
  let shot: React.ReactNode = null;
  if (k === 0) {
    // an Allen key turning in a cabinet panel
    const turn = t * 9;
    shot = (
      <>
        <div style={{ position: "absolute", left: -200, top: 260, width: 2400, height: 560, background: "linear-gradient(180deg,#e9c48c,#d4a868)", border: `10px solid ${C.ink}`, transform: "rotate(-8deg)" }}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ position: "absolute", left: 0, right: 0, top: 50 + i * 64, height: 4, background: "rgba(140,90,40,0.25)" }} />)}
        </div>
        <div style={{ position: "absolute", left: 900, top: 500, width: 90, height: 90, borderRadius: "50%", background: "#b8bec2", border: `7px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 945, top: 545, transform: `rotate(${turn}deg)` }}>
          <div style={{ position: "absolute", left: -12, top: -12, width: 24, height: 360, borderRadius: 8, background: "#2b2f33", border: `5px solid ${C.ink}` }} />
          <div style={{ position: "absolute", left: -12, top: 330, width: 140, height: 24, borderRadius: 8, background: "#2b2f33", border: `5px solid ${C.ink}` }} />
        </div>
        <Sleeve x={1060 + Math.cos((turn * Math.PI) / 180) * 120} y={720 + Math.sin((turn * Math.PI) / 180) * 60} r={20} />
      </>
    );
  } else if (k === 1) {
    // the roller pulls a fresh stripe of colour down the wall
    const p = clamp01(t / 30);
    shot = (
      <>
        <AbsoluteFill style={{ background: "#c9c2b2" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 760, height: 1080, background: "#6fd6b2" }} />
        <div style={{ position: "absolute", left: 760, top: 0, width: 380, height: 1080 * p + 40, background: "#6fd6b2", borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }} />
        <div style={{ position: "absolute", left: 740, top: 1080 * p - 120, width: 420, height: 130, borderRadius: 30, background: "#5cc8a2", border: `8px solid ${C.ink}`, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 8px, rgba(0,0,0,0) 8px 20px)" }} />
        <div style={{ position: "absolute", left: 940, top: 1080 * p, width: 26, height: 500, background: "#8a9196", border: `5px solid ${C.ink}` }} />
        <Sleeve x={960} y={1080 * p + 420} r={70} len={420} />
      </>
    );
  } else if (k === 2) {
    // a wrench tightens the nut; the drip stops
    const r = -30 + 50 * outQuart(clamp01(t / 10));
    const drop = t * 30;
    shot = (
      <>
        <AbsoluteFill style={{ background: "#2f6f8a", backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 3px, transparent 3px), linear-gradient(90deg, rgba(255,255,255,0.08) 3px, transparent 3px)", backgroundSize: "120px 120px" }} />
        <div style={{ position: "absolute", left: -100, top: 420, width: 2200, height: 130, background: "linear-gradient(180deg,#e6ebee,#9aa3a8)", border: `9px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 880, top: 380, width: 160, height: 210, background: "linear-gradient(90deg,#c9a24a,#f2d27a,#b08a3a)", border: `8px solid ${C.ink}`, borderRadius: 10 }} />
        {t < 8 && <div style={{ position: "absolute", left: 950, top: 590 + drop, width: 26, height: 36, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "#bfe9ff", border: `4px solid ${C.ink}` }} />}
        <div style={{ position: "absolute", left: 960, top: 485, transform: `rotate(${r}deg)`, transformOrigin: "0px 0px" }}>
          <div style={{ position: "absolute", left: -110, top: -110, width: 220, height: 220, borderRadius: "50%", border: `46px solid #a9b1b6`, borderRightColor: "transparent", boxSizing: "border-box", outline: "none" }} />
          <div style={{ position: "absolute", left: 60, top: 40, width: 620, height: 70, borderRadius: 30, background: "linear-gradient(180deg,#d3d9dc,#8c9499)", border: `8px solid ${C.ink}`, transform: "rotate(30deg)", transformOrigin: "0% 50%" }} />
        </div>
        <Sleeve x={1460} y={850} r={-20} len={480} />
      </>
    );
  } else if (k === 3) {
    // a squeegee wipes the window clean
    const p = outQuart(clamp01(t / 16));
    shot = (
      <>
        <AbsoluteFill style={{ background: "linear-gradient(180deg,#8fd0f5,#e6f6ff)" }} />
        <div style={{ position: "absolute", left: 200, top: 600, width: 500, height: 300, background: "#9fcf9a", borderRadius: "50% 50% 0 0" }} />
        <div style={{ position: "absolute", left: 1100, top: 500, width: 600, height: 400, background: "#b3dcae", borderRadius: "50% 50% 0 0" }} />
        <div style={{ position: "absolute", left: 1920 * p, top: 0, right: 0, bottom: 0, background: "rgba(150,120,80,0.55)", backgroundImage: "radial-gradient(circle at 30% 40%, rgba(90,70,40,0.4) 0 30px, transparent 31px), radial-gradient(circle at 70% 70%, rgba(90,70,40,0.35) 0 50px, transparent 51px)" }} />
        <div style={{ position: "absolute", left: 1920 * p - 40, top: 160, width: 60, height: 760, borderRadius: 20, background: "#2b2f33", border: `7px solid ${C.ink}` }} />
        <Sleeve x={1920 * p + 10} y={540} r={0} len={560} />
        {[0, 1, 2].map((i) => {
          const q = clamp01((t - 6 - i * 2) / 8);
          return q > 0 && q < 1 ? <div key={i} style={{ position: "absolute", left: 400 + i * 380, top: 260 + i * 120, width: 90, height: 90, transform: `scale(${Math.sin(q * Math.PI)}) rotate(45deg)`, background: "#fff", clipPath: "polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%)" }} /> : null;
        })}
      </>
    );
  } else {
    // a big box carried past, fast
    const x = lerp(-700, 700, outQuart(clamp01(t / 30)));
    shot = (
      <>
        <AbsoluteFill style={{ background: "#e8735a" }} />
        <SpeedLines x={960} y={540} a={0.35} f={f} />
        <div style={{ position: "absolute", left: 960 - 330 + x, top: 260, width: 660, height: 520, background: "linear-gradient(135deg,#d9ad72,#b98a52)", border: `10px solid ${C.ink}`, borderRadius: 10, transform: `rotate(${-3 + Math.sin(t / 3) * 1.5}deg)` }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 230, height: 70, background: "rgba(255,240,200,0.5)" }} />
          <div style={{ position: "absolute", left: 40, top: 40, fontFamily: FONT, fontWeight: 700, fontSize: 56, color: "#7a4a1c", letterSpacing: "0.08em" }}>FRAGIL</div>
          <div style={{ position: "absolute", right: 40, bottom: 40, fontFamily: FONT, fontWeight: 700, fontSize: 70, color: "#7a4a1c" }}>↑↑</div>
        </div>
        <Sleeve x={960 - 330 + x - 520} y={560} r={0} />
        <div style={{ position: "absolute", left: 960 + 330 + x - 60, top: 470, width: 180, height: 140, borderRadius: 60, background: C.skin, border: `7px solid ${C.ink}` }} />
      </>
    );
  }
  return (
    <AbsoluteFill style={{ background: BG[k], overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.08 - 0.06 * clamp01((fr - a) / 20), x: 0, y: 0 })}>{shot}</Cam>
      <CutFlash at={a} f={f} />
      <BottomShade a={0.55} />
      <AText words={word} size={130} y={920} color={WHITE} />
      <Grade vignette={0.35} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ V4: at his bench, Mihai makes his tasker profile — and the earnings start to climb
const SKILLS = ["Montaj mobilă", "Electrice", "Instalații", "Zugrăveli"];
export const V4: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C3_END;
  const L = W2("cont");
  const name = "Mihai D.";
  const typed = Math.round(name.length * r01(f, w("cont", 1), w("cont", 3), (t) => t));
  const ver = ease.outBack(clamp01((f - w("cont", 4)) / 12));
  const ready = ease.outBack(clamp01((f - w("cont", 7)) / 12));
  const earnAt = w("cont", 11) - 6;
  const money = Math.round(2450 * r01(f, earnAt + 4, w("cont", 17), (t) => 1 - (1 - t) ** 2));
  return (
    <AbsoluteFill style={{ background: "#1a110a", overflow: "hidden" }}>
      <Cam at={(fr) => ({ s: 1.03 - 0.03 * r01(fr, a0, C4_END, (t) => t), x: 0, y: 0 })}>
        <Pegboard blur={6} />
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 50% 60% at 70% 40%, rgba(255,190,120,0.35), rgba(0,0,0,0.5) 80%)" }} />
        <div style={{ position: "absolute", left: 1080, top: 270 }}>
          <Head who="mihai" width={660} l={{ side: -1, key: "#ffcf8a", rim: "#ffcf8a", under: C.greenLight, underAmt: 0.8, shade: 0.8 }} e={{ open: 0.85, gy: 10, gx: -10, mouth: f > earnAt ? "grin" : "smile", brow: 0.05 }} f={f} />
        </div>
        <div style={{ position: "absolute", left: -100, top: 930, width: 2200, height: 200, background: "linear-gradient(180deg,#a8743e,#7a5028)", borderTop: `10px solid ${C.ink}` }} />
        <div style={{ position: "absolute", left: 1170, top: 820, transform: "rotate(-12deg)" }}>
          <div style={{ width: 220, height: 300, borderRadius: 36, background: "linear-gradient(160deg,#2c3238,#14181b)", border: `6px solid ${C.ink}`, boxShadow: "0 -40px 90px rgba(93,240,165,0.4)" }} />
          <div style={{ position: "absolute", left: -30, top: 90, width: 70, height: 140, borderRadius: 34, background: C.skin, border: `5px solid ${C.ink}` }} />
        </div>
      </Cam>
      {/* the profile, filling in */}
      <div style={{ ...card, left: 130, top: 110, width: 700, padding: 30, boxSizing: "border-box", ...rise(f, a0 + 4) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <MiniFace who="mihai" size={130} ring={ver > 0.5 ? C.green : undefined} />
          <div>
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: "-0.03em", minHeight: 56 }}>
              {name.slice(0, typed)}
              {typed < name.length && <span style={{ opacity: Math.floor(f / 6) % 2 ? 1 : 0, color: C.green }}>|</span>}
            </div>
            <div style={{ ...pill("rgba(0,191,99,0.12)", GREEN_TXT), marginTop: 10, transform: `scale(${ver})`, transformOrigin: "0% 50%" }}>
              <Check size={22} /> Tasker verificat
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
          {SKILLS.map((s, i) => {
            const p = ease.outBack(clamp01((f - w("cont", 5) - i * 4) / 10));
            return (
              <div key={s} style={{ ...pill("#eef2ef", INK), fontSize: 24, transform: `scale(${p})`, opacity: clamp01(p * 2) }}>
                {s}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 22, ...pill(C.green, "#fff"), transform: `scale(${ready})`, transformOrigin: "0% 50%" }}>Cont gata · 3 min</div>
      </div>
      {/* earnings */}
      {f >= earnAt && (
        <div style={{ ...card, left: 130, top: 560, width: 700, padding: 30, boxSizing: "border-box", ...rise(f, earnAt) }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: "#8a8f8d" }}>CÂȘTIGURI LUNA ASTA</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 }}>
            <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.04em", color: GREEN_TXT, fontVariantNumeric: "tabular-nums" }}>{money.toLocaleString("ro-RO")} lei</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110 }}>
              {[0.3, 0.45, 0.4, 0.6, 0.7, 0.85, 1].map((h, i) => (
                <div key={i} style={{ width: 22, height: 110 * h * outQuart(clamp01((f - earnAt - 6 - i * 3) / 12)), borderRadius: 6, background: i === 6 ? C.green : "rgba(0,191,99,0.35)" }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <BottomShade a={0.6} />
      <AText words={L.slice(0, 8)} size={60} y={1000} color={WHITE} out={w("cont", 8) - 6} hi={{ 2: C.greenLight, 4: C.greenLight }} />
      <AText words={L.slice(8)} size={60} y={1000} color={WHITE} hi={{ 3: C.greenLight }} />
      <Grade vignette={0.5} warm={0.4} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ V5: "you choose" ×3 — his hours at sunrise, the task he wants, the afternoon with his kid
export const V5: React.FC = () => {
  const f = useCurrentFrame();
  const c1 = C4_END, c2 = w("taskurile", 0) - 4, c3 = w("muncesti", 0) - 4;
  const shot = f < c2 ? 0 : f < c3 ? 1 : 2;
  if (shot === 0) {
    const L = W2("program");
    const slide = outQuart(clamp01((f - w("program", 2) + 2) / 14));
    const days = ["L", "M", "M", "J", "V", "S", "D"];
    return (
      <AbsoluteFill style={{ background: "linear-gradient(180deg,#ffb48a 0%,#ffd9a8 50%,#f6efe4 100%)", overflow: "hidden" }}>
        <Cam at={(fr) => ({ s: 1.04 - 0.03 * clamp01((fr - c1) / 60), x: 0, y: 0 })}>
          <div style={{ position: "absolute", left: 120, top: 80, width: 820, height: 640, borderRadius: 16, background: "linear-gradient(180deg,#ff9a6a,#ffd28a 70%,#fff2d6)", border: `10px solid ${C.ink}`, overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 500, top: 140, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,#fff6d8,#ffd27a 60%,rgba(255,200,120,0))" }} />
            <div style={{ position: "absolute", left: 0, top: 500, width: 820, height: 140, background: "#c77a5a" }} />
            <div style={{ position: "absolute", left: 405, top: 0, width: 10, height: 640, background: C.ink }} />
          </div>
          <div style={{ position: "absolute", left: 1000, top: 290 }}>
            <Head who="mihai" width={640} l={{ side: -1, key: "#ffd28a", rim: "#fff2d6", shade: 0.6 }} e={{ open: 0.9, mouth: "smile", gx: -8, gy: 4 }} f={f} />
          </div>
        </Cam>
        <div style={{ ...card, left: 160, top: 520, width: 700, padding: 30, boxSizing: "border-box", ...rise(f, c1 + 4) }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.08em", color: "#8a8f8d" }}>PROGRAMUL TĂU</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {days.map((d, i) => {
              const on = i < 5 && f > c1 + 10 + i * 3;
              return <div key={i} style={{ width: 70, height: 70, borderRadius: 35, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, background: on ? C.green : "#eef2ef", color: on ? "#fff" : "#8a8f8d" }}>{d}</div>;
            })}
          </div>
          <div style={{ marginTop: 26, fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em" }}>
            07:00 – {lerp(18, 13, slide) >= 13.5 ? `${Math.round(lerp(18, 13, slide))}:00` : "13:00"}
          </div>
          <div style={{ position: "relative", marginTop: 18, height: 12, borderRadius: 6, background: "#eef2ef" }}>
            <div style={{ position: "absolute", left: "10%", width: `${lerp(80, 45, slide)}%`, height: 12, borderRadius: 6, background: C.green }} />
            <div style={{ position: "absolute", left: `calc(${10 + lerp(80, 45, slide)}% - 18px)`, top: -12, width: 36, height: 36, borderRadius: 18, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }} />
          </div>
        </div>
        <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 26%)" }} />
        <AText words={L} size={120} y={960} color={INK} hi={{ 2: GREEN_TXT }} />
        <Grade vignette={0.25} warm={0.5} />
      </AbsoluteFill>
    );
  }
  if (shot === 1) {
    const L = W2("taskurile");
    const tap = w("taskurile", 2) - 2;
    const ok = ease.outBack(clamp01((f - tap) / 10));
    const press = Math.sin(Math.PI * clamp01((f - tap + 4) / 8));
    const TASKS: Array<[string, string, string]> = [
      ["Montaj dulap", "2,1 km · azi", "180 lei"],
      ["Schimbat robinet", "3,4 km · mâine", "120 lei"],
      ["Zugrăvit hol", "5,0 km · sâmbătă", "450 lei"],
    ];
    return (
      <AbsoluteFill style={{ background: "#0f1d18", overflow: "hidden" }}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 70% at 50% 45%, #1e4a3a, #08110d 80%)" }} />
        <Cam at={(fr) => ({ s: 1.06 - 0.04 * clamp01((fr - c2) / 50), x: 0, y: 0, r: -3 })}>
          <div style={{ position: "absolute", left: 960 - 270, top: 40 }}>
            <ToonPhone w={540} glow="rgba(93,240,165,0.35)">
              <div style={{ position: "absolute", inset: 0, background: "#f3f5f4", fontFamily: FONT, padding: "90px 26px 0", boxSizing: "border-box" }}>
                <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", color: INK }}>Taskuri lângă tine</div>
                {TASKS.map(([t, d, p], i) => (
                  <div key={i} style={{ marginTop: 18, padding: 22, borderRadius: 26, background: i === 0 && ok > 0 ? "rgba(0,191,99,0.12)" : "#fff", boxShadow: "0 8px 20px rgba(0,0,0,0.06)", border: i === 0 && ok > 0 ? `3px solid ${C.green}` : "3px solid transparent", ...rise(f, c2 + 2 + i * 3, 12) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 700, color: INK }}>
                      <span>{t}</span>
                      <span style={{ color: GREEN_TXT }}>{p}</span>
                    </div>
                    <div style={{ fontSize: 21, color: "#8a8f8d", fontWeight: 600, marginTop: 6 }}>{d}</div>
                    {i === 0 && (
                      <div style={{ marginTop: 14, ...pill(C.green, "#fff"), fontSize: 24, transform: `scale(${1 - 0.08 * press})` }}>
                        {ok > 0 ? <><Check size={22} bg="#fff" color={C.green} /> Acceptat</> : "Accept"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ToonPhone>
          </div>
          <div style={{ position: "absolute", left: 718, top: 268 + (1 - press) * 50 + (1 - outQuart(clamp01((f - c2) / 12))) * 500, transform: "rotate(-14deg)" }}>
            <TapHand width={300} lit={C.greenLight} />
          </div>
        </Cam>
        <BottomShade a={0.75} />
        <AText words={L} size={120} y={960} color={WHITE} hi={{ 2: C.greenLight }} />
        <Grade vignette={0.5} />
      </AbsoluteFill>
    );
  }
  // golden afternoon: Mihai walks home early, his kid's hand in his
  const L = W2("muncesti");
  const tt = f - c3;
  const step = (k: number) => Math.abs(Math.sin(tt / 6 + k)) * 10;
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#5a6a9a 0%,#e88a6a 45%,#ffcf8a 62%,#5a4a3a 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - 160, top: 470, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,#fffbe8,#ffe2a0 45%,rgba(255,200,120,0))" }} />
      <Cam at={(fr) => ({ s: 1.0 + 0.06 * clamp01((fr - c3) / 60), x: 0, y: 0 })}>
        {/* trees either side of the path */}
        {[[120, 260, 1.2], [420, 360, 0.9], [1500, 300, 1.1], [1760, 220, 1.3]].map(([x, y, s], i) => (
          <div key={i} style={{ position: "absolute", left: x, top: y, transform: `scale(${s})` }}>
            <div style={{ position: "absolute", left: 60, top: 220, width: 40, height: 420, background: "#2a1e1a" }} />
            <div style={{ position: "absolute", left: -60, top: 0, width: 280, height: 300, borderRadius: "50%", background: "#3a3a2a", boxShadow: "inset -30px -20px 0 rgba(255,180,100,0.25)" }} />
          </div>
        ))}
        <div style={{ position: "absolute", left: 0, top: 760, width: 1920, height: 320, background: "linear-gradient(180deg,#6a5a3a,#3a2e22)" }} />
        <div style={{ position: "absolute", left: 760, top: 760, width: 400, height: 320, background: "linear-gradient(180deg,#e8c28a,#b08a5a)", clipPath: "polygon(45% 0, 55% 0, 100% 100%, 0 100%)" }} />
        {/* the two of them, from behind, in silhouette with a warm rim */}
        <svg width={600} height={700} viewBox="0 0 600 700" style={{ position: "absolute", left: 960 - 300, top: 260 - tt * 0.6, transform: `scale(${1 - tt * 0.0012})`, transformOrigin: "50% 100%", overflow: "visible" }}>
          {/* long shadows towards us */}
          <path d="M200 680 L120 900 L260 900 L250 680 Z M380 680 L400 820 L470 820 L410 680 Z" fill="rgba(20,10,5,0.45)" />
          {/* Mihai */}
          <g transform={`translate(0 ${-step(0) * 0.4})`}>
            <path d="M170 700 L190 470 L250 470 L262 700 Z" fill="#1a1412" />
            <path d="M120 480 C124 330 160 290 220 288 C282 290 318 330 322 480 Z" fill="#163d2c" />
            <circle cx={222} cy={236} r={58} fill="#1a1412" />
            <path d="M164 236 C166 196 190 180 222 178" fill="none" stroke="#ffcf8a" strokeWidth={7} />
            <path d="M124 470 C126 340 160 300 214 294" fill="none" stroke="#ffcf8a" strokeWidth={7} opacity={0.8} />
            <path d="M310 350 C340 400 352 430 360 470" stroke="#1a1412" strokeWidth={34} strokeLinecap="round" fill="none" />
          </g>
          {/* the kid */}
          <g transform={`translate(0 ${-step(1.5) * 0.4})`}>
            <path d="M380 700 L388 590 L430 590 L436 700 Z" fill="#1a1412" />
            <path d="M360 600 C362 520 384 500 412 500 C442 500 462 520 464 600 Z" fill="#e8463a" />
            <circle cx={412} cy={462} r={40} fill="#1a1412" />
            <path d="M372 462 C374 436 390 424 412 422" fill="none" stroke="#ffcf8a" strokeWidth={6} />
            <path d="M370 540 C364 510 362 490 360 472" stroke="#1a1412" strokeWidth={22} strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </Cam>
      <Rays x={960} f={f} a={0.25} />
      <Dust f={f} n={40} color="255,220,170" />
      <BottomShade a={0.7} />
      <AText words={L} size={120} y={960} color={WHITE} hi={{ 2: C.amber, 3: C.amber }} />
      <Grade vignette={0.5} warm={0.8} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ V6: slow motion — Andrei's hand meets Mihai's; the grip becomes the Handly mark
const Hand: React.FC<{ sleeve: string; cuff: string; flip?: boolean }> = ({ sleeve, cuff, flip }) => (
  <svg width={1100} height={420} viewBox="0 0 1100 420" style={{ overflow: "visible", transform: flip ? "scaleX(-1)" : undefined }}>
    <defs>
      <linearGradient id={`skH${flip ? 1 : 0}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.skinLit} />
        <stop offset="0.5" stopColor={C.skin} />
        <stop offset="1" stopColor={C.skinShade} />
      </linearGradient>
    </defs>
    {/* sleeve and forearm */}
    <path d="M-300 120 L420 150 L430 300 L-300 330 Z" fill={sleeve} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
    <path d="M380 140 L460 146 L470 304 L390 310 Z" fill={cuff} stroke={C.ink} strokeWidth={9} />
    <path d="M460 160 C560 150 660 150 720 160 L730 300 C660 320 560 320 470 300 Z" fill={`url(#skH${flip ? 1 : 0})`} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    {/* palm and fingers reaching forward */}
    <path d="M700 150 C790 146 900 156 960 176 C996 190 1000 290 966 304 C900 318 800 322 730 316 L720 300 Z" fill={`url(#skH${flip ? 1 : 0})`} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M800 212 L972 220 M800 248 L978 254 M800 282 L968 286" stroke={C.skinDeep} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
    {/* thumb, up and over */}
    <path d="M720 160 C760 110 820 80 870 86 C900 90 900 120 876 130 C840 140 800 160 780 186 Z" fill={C.skinLit} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
    <path d="M730 152 C780 104 830 84 868 88" fill="none" stroke="#ffcf8a" strokeWidth={8} opacity={0.85} />
  </svg>
);
export const V6: React.FC = () => {
  const f = useCurrentFrame();
  const a0 = C5_END;
  const L = BREAK - a0;
  const x = clamp01((f - a0) / L);
  const meet = ease.inOutCubic(clamp01((f - a0) / (L * 0.42)));
  const grip = clamp01((f - a0 - L * 0.42) / 10);
  const mark = clamp01((f - a0 - L * 0.72) / (L * 0.2));
  const flash = clamp01((f - (BREAK - 7)) / 7);
  const hb = HEARTBEATS.reduce((m, h) => Math.max(m, f >= h ? Math.exp(-(f - h) / 4) : 0), 0);
  const shake = x > 0.75 ? Math.sin(f * 2.3) * (x - 0.75) * 16 : 0;
  return (
    <AbsoluteFill style={{ background: "#050807", overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 50% 45% at 50% 50%, rgba(255,190,120,${0.25 + 0.3 * x}) 0%, rgba(0,191,99,${0.12 + 0.3 * x}) 40%, rgba(0,0,0,0) 75%)` }} />
      <Cam at={(fr) => ({ s: (1.0 + 0.22 * clamp01((fr - a0) / L)) * (1 + 0.012 * hb), x: shake, y: 0 })}>
        <div style={{ position: "absolute", left: lerp(-1100, 120, meet) + grip * 80, top: 380 - grip * 10, opacity: 1 - mark }}>
          <Hand sleeve={C.hoodie} cuff={C.hoodieShade} />
        </div>
        <div style={{ position: "absolute", left: lerp(1920, 700, meet) - grip * 80, top: 370 + grip * 10, opacity: 1 - mark }}>
          <Hand sleeve="#1d4a35" cuff="#0f2c20" flip />
        </div>
        {/* Andrei's thumb closes over the back of Mihai's hand */}
        {grip > 0 && (
          <svg width={1100} height={420} viewBox="0 0 1100 420" style={{ position: "absolute", left: lerp(-1100, 120, meet) + grip * 80, top: 380 - grip * 10, overflow: "visible", opacity: grip * (1 - mark) }}>
            <path d={`M760 170 C820 ${120 + 40 * grip} 900 ${110 + 50 * grip} 960 ${140 + 40 * grip} C990 ${156 + 40 * grip} 980 ${190 + 30 * grip} 950 ${196 + 30 * grip} C900 ${200 + 20 * grip} 840 200 800 214 Z`} fill={C.skinLit} stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />
            <path d={`M770 166 C830 ${120 + 40 * grip} 900 ${112 + 50 * grip} 956 ${142 + 40 * grip}`} fill="none" stroke="#ffcf8a" strokeWidth={8} opacity={0.85} />
          </svg>
        )}
        {/* the rim of light along the two hands, growing */}
        <AbsoluteFill style={{ background: `radial-gradient(ellipse 18% 16% at 50% 50%, rgba(255,250,235,${0.55 * grip + 0.3 * mark}), rgba(0,0,0,0) 70%)`, mixBlendMode: "screen" }} />
        {/* the mark forming where the hands meet */}
        <div style={{ position: "absolute", left: 960 - 210, top: 540 - 210, opacity: mark, transform: `scale(${0.85 + 0.15 * mark})`, filter: `drop-shadow(0 0 ${40 + 80 * mark}px rgba(93,240,165,0.9))` }}>
          <Logo size={420} tone="white" />
        </div>
      </Cam>
      <SpeedLines x={960} y={540} a={0.25 * Math.max(0, x - 0.6) * 2.5} f={f} color="200,255,225" />
      <Dust f={f} n={40} color="255,230,190" />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.35 + 0.25 * hb}) 100%)` }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #ffffff 0%, #b9ffd6 40%, #00bf63 100%)", opacity: flash }} />
      <Grade vignette={0.4} />
    </AbsoluteFill>
  );
};

/** act III: new animated shots up to the handshake, then the kept break, final drop and end card */
export const ACT3T: React.FC = () => (
  <>
    <Win still from={BRIDGE} to={C1_END}><V1 /></Win>
    <Win still from={C1_END} to={C2_END}><V2 /></Win>
    <Win still from={C2_END} to={C3_END}><V3 /></Win>
    <Win still from={C3_END} to={C4_END}><V4 /></Win>
    <Win still from={C4_END} to={C5_END}><V5 /></Win>
    <Win still from={C5_END} to={BREAK}><V6 /></Win>
    <Win from={BREAK} to={FINAL}><C7 /></Win>
    <Win from={FINAL} to={SPLIT}>
      <Slam from={FINAL} shakeAt={FINAL} />
      <Explosion at={FINAL} cx={960} cy={540} />
    </Win>
    <Win from={SPLIT} to={C8_END}><C8 /></Win>
    <Win from={C8_END} to={C9_END}><C9 /></Win>
    <Win from={C9_END} to={F(END)}><C10 /></Win>
  </>
);
