import React from "react";
import { Img, staticFile } from "remotion";
import { clamp01, ease, mixColor } from "../lib/anim";
import { BOLD, C, FONT } from "../theme";
import { Avatar, Person } from "./Avatar";
import { Glyph, GlyphName } from "./Icons";

export type AppState = {
  typed: number;
  caret: boolean;
  focus: number;
  category: number;
  press: number;
  loading: number;
  success: number;
  check: number;
  /** frames since the success state started (drives the live check animation) */
  since?: number;
};

export const TASK_TEXT = "Robinet care curge";

const Label: React.FC<{ y: number; children: React.ReactNode }> = ({ y, children }) => (
  <div style={{ position: "absolute", left: 24, top: y, fontSize: 13, fontWeight: BOLD, color: "#7b8480", letterSpacing: "0.01em" }}>{children}</div>
);

const StatusBar: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: 54 }}>
    <div style={{ position: "absolute", left: 38, top: 19, fontSize: 16, fontWeight: BOLD, color: C.ink }}>9:41</div>
    <svg style={{ position: "absolute", right: 30, top: 21 }} width={74} height={14} viewBox="0 0 74 14">
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 5} y={10 - i * 3} width={3.4} height={4 + i * 3} rx={1} fill={C.ink} />
      ))}
      <path d="M30 5.2a9 9 0 0 1 12 0M32.3 7.8a5.6 5.6 0 0 1 7.4 0M34.6 10.4a2.2 2.2 0 0 1 2.8 0" stroke={C.ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <rect x={48} y={1.5} width={22} height={11} rx={3.2} stroke={C.ink} strokeOpacity={0.45} strokeWidth={1.2} fill="none" />
      <rect x={50} y={3.5} width={16} height={7} rx={1.8} fill={C.ink} />
      <rect x={71} y={5} width={1.8} height={4} rx={0.9} fill={C.ink} fillOpacity={0.45} />
    </svg>
  </div>
);

const MiniMap: React.FC<{ y: number }> = ({ y }) => (
  <div style={{ position: "absolute", left: 24, top: y, width: 352, height: 108, borderRadius: 16, overflow: "hidden", background: "#e8efe9" }}>
    <svg width={352} height={108} viewBox="0 0 352 108">
      <path d="M-10 70 C 80 40, 160 95, 360 52" stroke="#fff" strokeWidth={12} fill="none" />
      <path d="M120 -10 L 150 120" stroke="#fff" strokeWidth={9} fill="none" />
      <path d="M250 -10 L 228 120" stroke="#fff" strokeWidth={7} fill="none" />
      <path d="M-10 22 L 360 30" stroke="#fff" strokeWidth={5} fill="none" />
      <rect x={20} y={36} width={70} height={22} rx={5} fill="#d6e6da" />
      <rect x={270} y={66} width={60} height={30} rx={5} fill="#d6e6da" />
      <circle cx={190} cy={62} r={30} fill="rgba(0,191,99,0.16)" />
      <circle cx={190} cy={62} r={9} fill={C.green} stroke="#fff" strokeWidth={3} />
    </svg>
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: 10,
        padding: "5px 10px",
        borderRadius: 999,
        background: "#fff",
        fontSize: 12.5,
        fontWeight: BOLD,
        color: C.ink,
        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <Glyph name="pin" size={14} color={C.green} weight={2.6} />
        În zona ta
      </span>
    </div>
  </div>
);

/** The handly.ro "post a task" flow, rendered inside the phone. */
export const AppScreen: React.FC<{ s: AppState }> = ({ s }) => {
  const typed = TASK_TEXT.slice(0, Math.max(0, Math.min(TASK_TEXT.length, Math.floor(s.typed))));
  const btnScale = 1 - 0.045 * Math.sin(clamp01(s.press) * Math.PI);
  const spin = s.loading * 360 * 1.6;
  const checkLen = ease.outCubic(clamp01(s.check));

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT, color: C.ink, background: "#fbfcfb" }}>
      <StatusBar />

      {/* app header */}
      <div style={{ position: "absolute", left: 24, top: 66, display: "flex", alignItems: "center", gap: 9 }}>
        <Img src={staticFile("images/logo.webp")} style={{ width: 34, height: 34 }} />
        <span style={{ fontSize: 22, fontWeight: BOLD, letterSpacing: "-0.03em" }}>
          handly.ro
        </span>
      </div>
      <div style={{ position: "absolute", right: 24, top: 64 }}>
        <Avatar person="tu" size={40} dark={false} ring="#ffffff" />
      </div>

      <div style={{ position: "absolute", left: 24, top: 124, fontSize: 29, fontWeight: BOLD, letterSpacing: "-0.03em" }}>Postează un task</div>
      <div style={{ position: "absolute", left: 24, top: 164, fontSize: 15, fontWeight: BOLD, color: "#7b8480" }}>Spune-ne ce ai nevoie</div>

      <Label y={210}>CE TREBUIE FĂCUT?</Label>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 232,
          width: 352,
          height: 58,
          borderRadius: 14,
          background: "#fff",
          border: `2px solid ${mixColor("#e1e6e3", C.green, s.focus)}`,
          boxShadow: `0 0 0 ${4 * s.focus}px rgba(0,191,99,0.12)`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontSize: 18,
          fontWeight: BOLD,
        }}
      >
        {typed.length === 0 && s.focus < 0.5 ? <span style={{ color: "#a9b0ac" }}>ex: Robinet care curge</span> : <span>{typed}</span>}
        <span style={{ width: 2, height: 22, marginLeft: 1, background: C.green, opacity: s.caret && s.focus > 0.5 ? 1 : 0 }} />
      </div>

      <Label y={312}>CATEGORIE</Label>
      <div style={{ position: "absolute", left: 24, top: 334, display: "flex", gap: 8 }}>
        {(
          [
            ["wrench", "Instalații"],
            ["roller", "Zugrăveli"],
            ["hammer", "Montaj"],
          ] as [GlyphName, string][]
        ).map(([g, label], i) => {
          const on = i === 0 ? s.category : 0;
          return (
            <div
              key={label}
              style={{
                height: 40,
                padding: "0 14px",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14.5,
                fontWeight: BOLD,
                background: mixColor("#eef2ef", C.green, on),
                color: mixColor(C.ink, "#ffffff", on),
                transform: `scale(${1 + 0.08 * Math.sin(clamp01(on) * Math.PI)})`,
              }}
            >
              <Glyph name={g} size={16} color={mixColor(C.ink, "#ffffff", on)} weight={2.4} />
              {label}
            </div>
          );
        })}
      </div>

      <Label y={394}>UNDE?</Label>
      <MiniMap y={416} />

      <Label y={544}>PREȚ</Label>
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 566,
          width: 352,
          height: 54,
          borderRadius: 14,
          background: "#f0f4f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          fontSize: 15.5,
          fontWeight: BOLD,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
          <Glyph name="handshake" size={20} color={C.green} weight={2.2} />
          Îl stabiliți împreună
        </span>
        <Glyph name="chevron" size={18} color="#9aa39e" weight={2.6} />
      </div>

      {/* CTA */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 742,
          width: 352,
          height: 62,
          borderRadius: 18,
          background: `linear-gradient(180deg, #14cf75 0%, ${C.green} 100%)`,
          boxShadow: "0 14px 28px rgba(0,191,99,0.32)",
          transform: `scale(${btnScale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          color: "#fff",
          fontSize: 18,
          fontWeight: BOLD,
        }}
      >
        {s.loading > 0 && s.success < 0.5 ? (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.35)",
              borderTopColor: "#fff",
              transform: `rotate(${spin}deg)`,
            }}
          />
        ) : (
          "Postează task-ul"
        )}
      </div>
      {/* tap ripple */}
      {s.press > 0 && s.press < 1 && (
        <div
          style={{
            position: "absolute",
            left: 200 - 90,
            top: 773 - 90,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.45)",
            transform: `scale(${0.2 + s.press})`,
            opacity: 1 - s.press,
          }}
        />
      )}
      <div style={{ position: "absolute", left: 130, bottom: 10, width: 140, height: 5, borderRadius: 3, background: C.ink }} />

      {/* success state */}
      {s.success > 0 && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(251,252,251,${s.success})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", marginTop: 250, width: 128, height: 128 }}>
            {/* ripples keep rolling out of the badge */}
            {[0, 1, 2].map((k) => {
              const t = (s.since ?? 0) - 6 - k * 9;
              const p = t > 0 ? (t % 30) / 30 : 0;
              if (t <= 0) return null;
              return <div key={k} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `${3 * (1 - p)}px solid ${C.green}`, transform: `scale(${1 + 1.1 * ease.outCubic(p)})`, opacity: (1 - p) * 0.7 }} />;
            })}
            {/* sparks once the check lands */}
            {Array.from({ length: 10 }, (_, k) => {
              const t = (s.since ?? 0) - 12;
              const p = clamp01(t / 16);
              if (p <= 0 || p >= 1) return null;
              const a = (k / 10) * Math.PI * 2;
              const d = 70 + 60 * ease.outCubic(p);
              return <div key={`s${k}`} style={{ position: "absolute", left: 64 + Math.cos(a) * d - 4, top: 64 + Math.sin(a) * d - 4, width: 8, height: 8, borderRadius: "50%", background: k % 2 ? C.green : "#9dffc9", opacity: 1 - p, transform: `scale(${1 - 0.6 * p})` }} />;
            })}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                overflow: "hidden",
                background: "radial-gradient(circle at 35% 30%, #5cf0a6 0%, #00c46a 55%, #00a352 100%)",
                boxShadow: "0 18px 40px rgba(0,191,99,0.35)",
                transform: `scale(${ease.outBack(clamp01(s.success)) * (1 + 0.04 * Math.sin(((s.since ?? 0) / 30) * Math.PI * 2) * clamp01(((s.since ?? 0) - 20) / 10))})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={70} height={70} viewBox="0 0 70 70">
                <path d="M18 36 L30 48 L53 22" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - checkLen} />
              </svg>
              {/* a light sweep across the badge */}
              <div style={{ position: "absolute", top: -40, bottom: -40, width: 34, left: `${-40 + 180 * clamp01(((s.since ?? 0) - 14) / 14)}%`, transform: "rotate(22deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))" }} />
            </div>
          </div>
          <div style={{ marginTop: 34, fontSize: 30, fontWeight: BOLD, letterSpacing: "-0.03em", opacity: clamp01(s.success * 1.4 - 0.3) }}>Task postat!</div>
          <div style={{ marginTop: 10, width: 280, textAlign: "center", fontSize: 16, fontWeight: BOLD, color: "#7b8480", lineHeight: 1.4, opacity: clamp01(s.success * 1.4 - 0.5) }}>
            Taskerii din zona ta au fost anunțați
          </div>
          <div style={{ marginTop: 28, display: "flex", opacity: clamp01(s.check * 1.5 - 0.4) }}>
            {(["andrei", "mihai", "radu"] as Person[]).map((p, i) => (
              <div key={p} style={{ marginLeft: i === 0 ? 0 : -12 }}>
                <Avatar person={p} size={50} dark={false} ring="#ffffff" />
              </div>
            ))}
            <div style={{ marginLeft: 10, alignSelf: "center", fontSize: 15, fontWeight: BOLD, color: C.green }}>+3</div>
          </div>
        </div>
      )}
    </div>
  );
};
