import React from "react";
import { Img, staticFile } from "remotion";
import { Avatar, Person } from "../../explainer/components/Avatar";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { GREEN, INK, outExpo } from "./kit";

// ------------------------------------------------------------------ iOS, faithfully: the screens anyone recognises at a glance
export const SW = 400;
export const SH = 854;
export const BLUE = "#0a84ff";
export const RED_IOS = "#ff3b30";
export const ORANGE = "#ff9500";
const SYS = `${FONT}`;

const P: Record<string, string> = {
  zap: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  plug: "M12 22v-5 M9 8V2 M15 8V2 M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z",
  leaf: "M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12",
  box: "M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z M12 22V12 M3.3 7l8.7 5 8.7-5",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  msg: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  search: "M21 21l-4.3-4.3 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  cal: "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  cart: "M8 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
  bank: "M3 22h18 M6 18v-7 M10 18v-7 M14 18v-7 M18 18v-7 M12 2 20 7H4z",
  lock: "M7 11V7a5 5 0 0 1 10 0v4 M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
  shield: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
  check: "M20 6 9 17l-5-5",
  x: "M18 6 6 18 M6 6l12 12",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2",
  user: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  pin: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z",
  hammer: "m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9 M18 15l4-4 M21.5 11.5l-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5",
  roller: "M4 2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 16h2a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z",
  drop: "M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z",
  sparkles: "M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z",
  truck: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2 M15 18H9 M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14 M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  cash: "M2 6h20v12H2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 12h.01 M18 12h.01",
  card: "M2 5h20v14H2z M2 10h20",
  bell: "M10.268 21a2 2 0 0 0 3.464 0 M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",
  house: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8 M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  alert: "M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  chevR: "M9 18l6-6-6-6",
  chevL: "M15 18l-6-6 6-6",
  flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7",
  star: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v3",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  speaker: "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z M16 9a5 5 0 0 1 0 6 M19.364 18.364a9 9 0 0 0 0-12.728",
  camera: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  mail: "M2 4h20v16H2z M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",
  map: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z M15 5.764v15 M9 3.236v15",
  gear: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41",
  note: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z M14 2v4a2 2 0 0 0 2 2h4 M10 9H8 M16 13H8 M16 17H8",
  music: "M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  timer: "M10 2h4 M12 14l3-3 M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
  trend: "M22 7 13.5 15.5 8.5 10.5 2 17 M16 7h6v6",
};
export type SymName = keyof typeof P;
export const Sym: React.FC<{ n: SymName | string; size: number; color?: string; w?: number; fill?: string; style?: React.CSSProperties }> = ({ n, size, color = "currentColor", w = 2, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, ...style }}>
    <path d={P[n]} />
  </svg>
);

// ------------------------------------------------------------------ app icons
export type AppKind = "reminders" | "calendar" | "phone" | "messages" | "safari" | "health" | "contacts" | "bank" | "shop" | "handly" | "camera" | "mail" | "maps" | "settings" | "photos" | "weather" | "clock" | "notes" | "music";
const GRAD: Partial<Record<AppKind, [string, string]>> = {
  phone: ["#6ef08c", "#1fc63f"],
  messages: ["#6ef08c", "#1fc63f"],
  safari: ["#5ac8fa", "#0a6cff"],
  contacts: ["#c7c9cf", "#8e9199"],
  bank: ["#2a5bd7", "#0a2a7a"],
  shop: ["#ff9f45", "#ff5e1f"],
  handly: ["#16d679", "#00a856"],
  camera: ["#d4d6db", "#8e9198"],
  mail: ["#5ac8fa", "#147efb"],
  maps: ["#7bd87a", "#3aa0e8"],
  settings: ["#b5b8bf", "#7b7f88"],
  weather: ["#5ac8fa", "#1a6fe0"],
  clock: ["#2a2a2c", "#000000"],
  notes: ["#ffe36a", "#ffc800"],
  music: ["#ff6b7d", "#fa233b"],
};
const GLYPH: Partial<Record<AppKind, SymName>> = { phone: "phone", messages: "msg", safari: "search", contacts: "user", bank: "bank", shop: "cart", camera: "camera", mail: "mail", maps: "map", settings: "gear", weather: "sun", clock: "clock", notes: "note", music: "music" };
export const AppIcon: React.FC<{ k: AppKind; size: number; glow?: number }> = ({ k, size, glow = 0 }) => {
  const r = size * 0.225;
  const g = GRAD[k];
  const base: React.CSSProperties = { width: size, height: size, borderRadius: r, position: "relative", overflow: "hidden", flexShrink: 0, boxShadow: glow ? `0 0 ${size * 0.6 * glow}px rgba(0,191,99,${0.8 * glow}), 0 0 0 ${size * 0.04 * glow}px rgba(255,255,255,${0.6 * glow})` : "0 1px 2px rgba(0,0,0,0.25)" };
  if (k === "reminders")
    return (
      <div style={{ ...base, background: "#fff" }}>
        {[ORANGE, BLUE, RED_IOS].map((c, i) => (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: size * 0.17, top: size * (0.2 + i * 0.22), width: size * 0.15, height: size * 0.15, borderRadius: "50%", background: c }} />
            <div style={{ position: "absolute", left: size * 0.4, top: size * (0.26 + i * 0.22), width: size * 0.44, height: size * 0.04, borderRadius: 2, background: "#d1d1d6" }} />
          </React.Fragment>
        ))}
      </div>
    );
  if (k === "calendar")
    return (
      <div style={{ ...base, background: "#fff", fontFamily: SYS, textAlign: "center" }}>
        <div style={{ marginTop: size * 0.1, fontSize: size * 0.16, fontWeight: 600, color: RED_IOS, letterSpacing: "0.02em" }}>LUNI</div>
        <div style={{ fontSize: size * 0.5, fontWeight: 400, color: "#111", lineHeight: 1, marginTop: size * 0.01 }}>27</div>
      </div>
    );
  if (k === "health")
    return (
      <div style={{ ...base, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Sym n="heart" size={size * 0.5} color="#ff2d55" fill="#ff2d55" w={1.5} />
      </div>
    );
  if (k === "photos")
    return (
      <div style={{ ...base, background: "#fff" }}>
        {["#ff9500", "#ffcc00", "#34c759", "#5ac8fa", "#007aff", "#af52de", "#ff2d55", "#ff3b30"].map((c, i) => (
          <div key={i} style={{ position: "absolute", left: size * 0.36, top: size * 0.14, width: size * 0.28, height: size * 0.36, borderRadius: size * 0.14, background: c, opacity: 0.85, transformOrigin: `50% ${size * 0.36}px`, transform: `rotate(${i * 45}deg)`, mixBlendMode: "multiply" }} />
        ))}
      </div>
    );
  if (k === "handly")
    return (
      <div style={{ ...base, background: `linear-gradient(160deg, ${g![0]}, ${g![1]})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Img src={staticFile("images/logo.webp")} style={{ width: size * 0.66, height: size * 0.66, filter: "brightness(0) invert(1)" }} />
      </div>
    );
  return (
    <div style={{ ...base, background: g ? `linear-gradient(180deg, ${g[0]}, ${g[1]})` : "#888", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Sym n={GLYPH[k] ?? "grid"} size={size * 0.52} color="#fff" w={k === "phone" || k === "messages" ? 0 : 2} fill={k === "phone" || k === "messages" ? "#fff" : "none"} />
    </div>
  );
};

// ------------------------------------------------------------------ chrome
export const StatusBar: React.FC<{ dark?: boolean; time?: string }> = ({ dark = false, time = "9:41" }) => {
  const c = dark ? "#fff" : "#000";
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 54, fontFamily: SYS, zIndex: 5 }}>
      <div style={{ position: "absolute", left: 40, top: 18, fontSize: 17, fontWeight: 600, color: c, letterSpacing: "-0.01em" }}>{time}</div>
      <svg style={{ position: "absolute", right: 30, top: 21 }} width={74} height={14} viewBox="0 0 74 14">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={10 - i * 3} width={3.4} height={4 + i * 3} rx={1} fill={c} />
        ))}
        <path d="M30 5.2a9 9 0 0 1 12 0M32.3 7.8a5.6 5.6 0 0 1 7.4 0M34.6 10.4a2.2 2.2 0 0 1 2.8 0" stroke={c} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <rect x={48} y={1.5} width={22} height={11} rx={3.2} stroke={c} strokeOpacity={0.45} strokeWidth={1.2} fill="none" />
        <rect x={50} y={3.5} width={11} height={7} rx={1.8} fill={c} />
      </svg>
    </div>
  );
};
export const HomeBar: React.FC<{ dark?: boolean }> = ({ dark }) => <div style={{ position: "absolute", left: SW / 2 - 70, bottom: 9, width: 140, height: 5, borderRadius: 3, background: dark ? "#fff" : "#000", zIndex: 6 }} />;

/** a night wallpaper: deep blue fading to black, a soft aurora */
export const Wallpaper: React.FC<{ f: number; dim?: number }> = ({ f, dim = 0 }) => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0b1530 0%, #070a17 55%, #020205 100%)" }}>
    <div style={{ position: "absolute", left: -120 + Math.sin(f / 80) * 20, top: 300, width: 640, height: 420, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(80,110,255,0.5) 0%, rgba(80,110,255,0) 70%)", filter: "blur(20px)" }} />
    <div style={{ position: "absolute", left: 120 + Math.cos(f / 90) * 20, top: 520, width: 420, height: 380, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(160,80,255,0.38) 0%, rgba(160,80,255,0) 70%)", filter: "blur(24px)" }} />
    <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${dim})` }} />
  </div>
);

/** the lock screen at night; children are the notifications */
export const LockScreen: React.FC<{ f: number; time: string; date?: string; children?: React.ReactNode; dim?: number }> = ({ f, time, date = "Luni, 27 octombrie", children, dim = 0 }) => (
  <div style={{ position: "absolute", inset: 0, fontFamily: SYS, color: "#fff" }}>
    <Wallpaper f={f} dim={dim} />
    <StatusBar dark time="" />
    <div style={{ position: "absolute", top: 18, left: 40 }}>
      <Sym n="lock" size={16} color="#fff" w={2.4} />
    </div>
    <div style={{ position: "absolute", top: 84, width: SW, textAlign: "center", fontSize: 21, fontWeight: 600, opacity: 0.85 }}>{date}</div>
    <div style={{ position: "absolute", top: 106, width: SW, textAlign: "center", fontSize: 112, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{time}</div>
    {children}
    <div style={{ position: "absolute", left: 44, bottom: 52, width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Sym n="zap" size={22} color="#fff" />
    </div>
    <div style={{ position: "absolute", right: 44, bottom: 52, width: 50, height: 50, borderRadius: 25, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Sym n="camera" size={22} color="#fff" />
    </div>
    <HomeBar dark />
  </div>
);

/** a notification platter (iOS frosted glass) */
export const Notif: React.FC<{ k: AppKind; app: string; title: string; body: string; time?: string; dark?: boolean; style?: React.CSSProperties; action?: React.ReactNode; badge?: string }> = ({ k, app, title, body, time = "acum", dark = true, style, action, badge }) => (
  <div
    style={{
      position: "absolute",
      left: 12,
      width: SW - 24,
      borderRadius: 26,
      padding: "14px 16px",
      boxSizing: "border-box",
      background: dark ? "rgba(52,52,60,0.62)" : "rgba(255,255,255,0.86)",
      boxShadow: dark ? "inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(0,0,0,0.12)",
      backdropFilter: "blur(30px) saturate(1.6)",
      fontFamily: SYS,
      color: dark ? "#fff" : "#000",
      display: "flex",
      gap: 12,
      ...style,
    }}
  >
    <div style={{ position: "relative" }}>
      <AppIcon k={k} size={40} />
      {badge && <div style={{ position: "absolute", right: -6, top: -6, minWidth: 20, height: 20, borderRadius: 10, background: RED_IOS, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{badge}</div>}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 500, opacity: 0.6, letterSpacing: "0.01em" }}>
        <span>{app.toUpperCase()}</span>
        <span>{time}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 400, opacity: 0.85, marginTop: 1, lineHeight: 1.3 }}>{body}</div>
      {action}
    </div>
  </div>
);

// ------------------------------------------------------------------ Reminders
export type Rem = { t: string; s: string; late?: boolean };
export const RemindersScreen: React.FC<{ items: Rem[]; hi: number[]; title?: string; appear?: number[]; f: number; gone?: number[] }> = ({ items, hi, title = "Acasă", appear, f, gone }) => (
  <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SYS, color: "#000" }}>
    <StatusBar time="23:48" />
    <div style={{ position: "absolute", left: 18, top: 62, display: "flex", alignItems: "center", gap: 2, color: BLUE, fontSize: 17 }}>
      <Sym n="chevL" size={24} color={BLUE} w={2.6} /> Liste
    </div>
    <div style={{ position: "absolute", left: 22, top: 104, fontSize: 36, fontWeight: 700, color: ORANGE, letterSpacing: "-0.02em" }}>{title}</div>
    <div style={{ position: "absolute", right: 22, top: 112, fontSize: 30, fontWeight: 700, color: ORANGE }}>{items.length}</div>
    {items.map((it, i) => {
      const a = appear ? clamp01((f - appear[i]) / 8) : 1;
      const g = gone ? clamp01((f - gone[i]) / 8) : 0;
      const h = hi[i] ?? 0;
      return (
        <div key={i} style={{ position: "absolute", left: 0, top: 168 + i * 92, width: SW, height: 92, opacity: a * (1 - g), transform: `translateX(${(1 - outExpo(a)) * 40 - g * 400}px)`, background: `rgba(255,149,0,${0.1 * h})` }}>
          <div style={{ position: "absolute", left: 22, top: 18, width: 26, height: 26, borderRadius: 13, border: `2px solid ${h > 0.5 ? ORANGE : "#c7c7cc"}` }} />
          <div style={{ position: "absolute", left: 62, top: 16, right: 20, fontSize: 18, fontWeight: h > 0.5 ? 600 : 400, letterSpacing: "-0.01em", transform: `scale(${1 + 0.04 * h})`, transformOrigin: "0% 50%" }}>{it.t}</div>
          <div style={{ position: "absolute", left: 62, top: 44, fontSize: 15, color: it.late ? RED_IOS : "#8e8e93", fontWeight: it.late ? 500 : 400 }}>{it.s}</div>
          {h > 0.3 && (
            <div style={{ position: "absolute", right: 22, top: 22, opacity: h }}>
              <Sym n="flag" size={20} color={ORANGE} fill={ORANGE} w={1.5} />
            </div>
          )}
          <div style={{ position: "absolute", left: 62, right: 0, bottom: 0, height: 1, background: "#e5e5ea" }} />
        </div>
      );
    })}
    <div style={{ position: "absolute", left: 22, bottom: 40, display: "flex", alignItems: "center", gap: 8, color: ORANGE, fontSize: 18, fontWeight: 600 }}>
      <div style={{ width: 26, height: 26, borderRadius: 13, background: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, lineHeight: 1 }}>+</div>
      Memento nou
    </div>
    <HomeBar />
  </div>
);

// ------------------------------------------------------------------ Calendar: a week with no room left
const EVT = ["#0a84ff", "#af52de", "#ff9500", "#34c759", "#ff2d55", "#5ac8fa"];
const WEEK = ["L", "M", "M", "J", "V", "S", "D"];
export const CalendarScreen: React.FC<{ f: number; fill: number; banner: number }> = ({ f, fill, banner }) => {
  const names = ["Ședință", "Proiect", "Livrare", "Call client", "Raport", "Prezentare", "Termen", "Sală", "Copii", "Cumpărături", "Mama", "Training"];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SYS, color: "#000" }}>
      <StatusBar time="23:49" />
      <div style={{ position: "absolute", left: 18, top: 62, color: RED_IOS, fontSize: 17, display: "flex", alignItems: "center" }}>
        <Sym n="chevL" size={24} color={RED_IOS} w={2.6} /> Octombrie
      </div>
      <div style={{ position: "absolute", left: 0, top: 100, width: SW, display: "flex", paddingLeft: 44, boxSizing: "border-box" }}>
        {WEEK.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#8e8e93", fontWeight: 600 }}>{d}</div>
            <div style={{ margin: "4px auto 0", width: 32, height: 32, borderRadius: 16, background: i === 0 ? RED_IOS : "transparent", color: i === 0 ? "#fff" : "#000", fontSize: 18, fontWeight: 600, lineHeight: "32px" }}>{[27, 28, 29, 30, 31, 1, 2][i]}</div>
          </div>
        ))}
      </div>
      {Array.from({ length: 13 }, (_, h) => (
        <div key={h} style={{ position: "absolute", left: 0, top: 170 + h * 48, width: SW, height: 1, background: "#eeeef0" }}>
          <div style={{ position: "absolute", left: 8, top: -8, fontSize: 11, color: "#8e8e93" }}>{String(8 + h).padStart(2, "0")}</div>
        </div>
      ))}
      {Array.from({ length: 7 * 6 }, (_, k) => {
        const col = k % 7, row = Math.floor(k / 7);
        const at = (k * 7) % 42;
        const p = clamp01(fill * 46 - at);
        if (p <= 0) return null;
        const colW = (SW - 48) / 7;
        const top = 172 + row * 98 + (k % 3) * 6;
        return (
          <div key={k} style={{ position: "absolute", left: 46 + col * colW, top, width: colW - 3, height: 90 * outExpo(p), borderRadius: 6, background: EVT[(k * 5) % 6], opacity: 0.9, padding: "4px 4px", boxSizing: "border-box", fontSize: 9.5, fontWeight: 600, color: "#fff", overflow: "hidden", lineHeight: 1.15 }}>
            {names[k % names.length]}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: SW / 2 - 130, bottom: 40, width: 260, height: 48, borderRadius: 24, background: "rgba(255,59,48,0.95)", color: "#fff", fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transform: `translateY(${(1 - outExpo(banner)) * 90}px)`, opacity: clamp01(banner * 3), boxShadow: "0 10px 30px rgba(255,59,48,0.35)" }}>
        <Sym n="clock" size={20} color="#fff" /> Nicio oră liberă
      </div>
      <div style={{ display: "none" }}>{f}</div>
    </div>
  );
};

// ------------------------------------------------------------------ a shop: the tools you would have to buy
export const ShopScreen: React.FC<{ f: number; n: number; total: number }> = ({ n, total }) => {
  const items: [string, string, SymName][] = [
    ["Trusă scule 108 piese", "649 lei", "wrench"],
    ["Bormașină cu acumulator", "899 lei", "zap"],
    ["Mașină de tuns iarba", "1.149 lei", "leaf"],
    ["Set șurubelnițe izolate", "189 lei", "plug"],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#f2f2f7", fontFamily: SYS, color: "#000" }}>
      <StatusBar time="23:50" />
      <div style={{ position: "absolute", left: 16, top: 60, right: 16, height: 42, borderRadius: 12, background: "#fff", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 17, color: "#000" }}>
        <Sym n="search" size={18} color="#8e8e93" /> scule reparații casă
      </div>
      <div style={{ position: "absolute", left: 18, top: 118, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Coșul tău</div>
      {items.map(([t, p, ic], i) => {
        const a = clamp01(n - i);
        return (
          <div key={i} style={{ position: "absolute", left: 16, right: 16, top: 164 + i * 104, height: 92, borderRadius: 18, background: "#fff", display: "flex", alignItems: "center", gap: 14, padding: "0 14px", opacity: a, transform: `translateY(${(1 - outExpo(a)) * 30}px)` }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, background: "#f2f2f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sym n={ic} size={34} color="#3a3a3c" w={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{t}</div>
              <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 3 }}>Livrare în 3–5 zile</div>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{p}</div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 16, right: 16, bottom: 34, height: 96, borderRadius: 22, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.6 }}>Total</div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{Math.round(total).toLocaleString("ro-RO")} lei</div>
        </div>
        <div style={{ padding: "12px 20px", borderRadius: 999, background: "rgba(255,255,255,0.16)", fontSize: 16, fontWeight: 600 }}>Plătește</div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ Health: the heart rate climbing
export const HeartScreen: React.FC<{ f: number; bpm: number; t: number }> = ({ f, bpm, t }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const x = 20 + i * 6;
    const k = i / 60;
    const level = lerp(70, bpm, Math.min(1, k / Math.max(0.05, t)) * (k <= t ? 1 : 0)) || 70;
    const v = (k <= t ? level : 70) + Math.sin(i * 1.7 + f / 3) * 4 * (0.4 + k);
    pts.push(`${x},${300 - (v - 50) * 2.2}`);
  }
  return (
    <div style={{ position: "absolute", inset: 0, background: "#000", fontFamily: SYS, color: "#fff" }}>
      <StatusBar dark time="23:51" />
      <div style={{ position: "absolute", left: 22, top: 70, fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>Ritm cardiac</div>
      <div style={{ position: "absolute", left: 22, top: 130, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 86, fontWeight: 700, letterSpacing: "-0.04em", color: "#ff375f", fontVariantNumeric: "tabular-nums" }}>{Math.round(bpm)}</span>
        <span style={{ fontSize: 22, color: "#8e8e93", fontWeight: 600 }}>BPM</span>
      </div>
      <div style={{ position: "absolute", left: 22, top: 236, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(255,55,95,0.18)", color: "#ff375f", fontSize: 16, fontWeight: 600, opacity: clamp01((bpm - 95) / 10) }}>
        <Sym n="alert" size={18} color="#ff375f" /> Nivel de stres ridicat
      </div>
      <svg width={SW} height={360} style={{ position: "absolute", left: 0, top: 330 }}>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={20} x2={380} y1={60 + i * 70} y2={60 + i * 70} stroke="#2c2c2e" strokeWidth={1} />
        ))}
        <polyline points={pts.join(" ")} fill="none" stroke="#ff375f" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: 22, bottom: 60, right: 22, fontSize: 15, color: "#8e8e93", lineHeight: 1.4 }}>Ritmul tău e peste nivelul obișnuit de repaus.</div>
      <HomeBar dark />
    </div>
  );
};

// ------------------------------------------------------------------ Contacts: searching for someone you can trust
export const ContactsScreen: React.FC<{ f: number; query: string; caret: boolean; none: number; list: number }> = ({ query, caret, none, list }) => {
  const people: [string, Person | undefined][] = [
    ["Adi Serviciu", undefined],
    ["Bianca", undefined],
    ["Cristi Sală", undefined],
    ["Mama", undefined],
    ["Radu Vecin", "radu"],
    ["Tata", undefined],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SYS, color: "#000" }}>
      <StatusBar time="23:52" />
      <div style={{ position: "absolute", left: 22, top: 62, fontSize: 36, fontWeight: 700, letterSpacing: "-0.02em" }}>Contacte</div>
      <div style={{ position: "absolute", left: 16, right: 16, top: 116, height: 42, borderRadius: 12, background: "#eeeef0", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 18 }}>
        <Sym n="search" size={18} color="#8e8e93" />
        <span style={{ color: query ? "#000" : "#8e8e93" }}>{query || "Caută"}</span>
        <span style={{ width: 2, height: 22, background: BLUE, opacity: caret ? 1 : 0, marginLeft: -6 }} />
      </div>
      <div style={{ opacity: list }}>
        {people.map(([n, p], i) => (
          <div key={n} style={{ position: "absolute", left: 22, right: 0, top: 182 + i * 64, height: 64, display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid #e5e5ea", fontSize: 18 }}>
            <Avatar person={p} size={42} dark={false} ring="#fff" />
            {n}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, top: 300, width: SW, textAlign: "center", opacity: none, transform: `translateY(${(1 - outExpo(none)) * 20}px)` }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Sym n="search" size={64} color="#c7c7cc" w={1.6} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 18, letterSpacing: "-0.02em" }}>Niciun rezultat</div>
        <div style={{ fontSize: 16, color: "#8e8e93", marginTop: 8 }}>pentru „{query.trim()}”</div>
      </div>
      <HomeBar />
    </div>
  );
};

// ------------------------------------------------------------------ Safari: the search results nobody trusts
export const SearchScreen: React.FC<{ f: number; n: number; scroll: number }> = ({ n, scroll }) => {
  const res: [string, string, string, number, boolean][] = [
    ["Electrician NON-STOP 24/7", "Venim în 15 minute! Cel mai mic preț!!!", "2,1", 187, true],
    ["Meseriași Rapid București", "Orice lucrare. Plata doar cash.", "2,4", 96, true],
    ["Reparații ieftine — sună acum", "Deplasare gratuită*", "1,9", 312, true],
    ["Forum: cine știe un electrician serios?", "„Am dat avans și nu mai răspunde…”", "", 0, false],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SYS, color: "#000" }}>
      <StatusBar time="23:53" />
      <div style={{ transform: `translateY(${-scroll}px)` }}>
        <div style={{ position: "absolute", left: 22, top: 66, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>
          <span style={{ color: "#4285f4" }}>C</span>
          <span style={{ color: "#ea4335" }}>a</span>
          <span style={{ color: "#fbbc05" }}>u</span>
          <span style={{ color: "#4285f4" }}>t</span>
          <span style={{ color: "#34a853" }}>ă</span>
        </div>
        {res.map(([t, d, r, c, ad], i) => {
          const a = clamp01(n - i);
          return (
            <div key={i} style={{ position: "absolute", left: 18, right: 18, top: 120 + i * 132, opacity: a, transform: `translateY(${(1 - outExpo(a)) * 24}px)` }}>
              {ad && <div style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>Sponsorizat</div>}
              <div style={{ fontSize: 19, color: "#1a0dab", marginTop: 4, fontWeight: 500, letterSpacing: "-0.01em" }}>{t}</div>
              <div style={{ fontSize: 15, color: "#4d5156", marginTop: 4 }}>{d}</div>
              {r && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 14, color: "#70757a" }}>
                  {r}
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Sym key={s} n="star" size={14} color={s < 2 ? "#fbbc05" : "#dadce0"} fill={s < 2 ? "#fbbc05" : "#dadce0"} w={1} />
                  ))}
                  <span>({c})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 26, height: 50, borderRadius: 25, background: "rgba(240,240,244,0.95)", boxShadow: "0 6px 20px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16 }}>
        <Sym n="search" size={16} color="#3c3c43" /> electrician urgent bucurești
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ a call nobody picks up
export const CallScreen: React.FC<{ f: number; name: string; status: string; failed: number; person?: Person }> = ({ f, name, status, failed, person }) => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#3a3f4b,#16181d)", fontFamily: SYS, color: "#fff", textAlign: "center" }}>
    <StatusBar dark time="23:54" />
    <div style={{ marginTop: 130, display: "flex", justifyContent: "center" }}>
      <div style={{ transform: `scale(${1 + 0.03 * Math.sin(f / 6) * (1 - failed)})` }}>
        <Avatar person={person} size={120} dark ring="rgba(255,255,255,0.2)" />
      </div>
    </div>
    <div style={{ fontSize: 32, fontWeight: 600, marginTop: 22, letterSpacing: "-0.02em" }}>{name}</div>
    <div style={{ fontSize: 19, marginTop: 8, color: failed > 0.5 ? "#ff6961" : "rgba(255,255,255,0.65)" }}>{status}</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: 470, display: "flex", justifyContent: "center", gap: 34 }}>
      {(["speaker", "mic", "grid"] as SymName[]).map((s) => (
        <div key={s} style={{ width: 76, height: 76, borderRadius: 38, background: "rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sym n={s} size={30} color="#fff" />
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: SW / 2 - 40, bottom: 80, width: 80, height: 80, borderRadius: 40, background: RED_IOS, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(135deg)" }}>
      <Sym n="phone" size={34} color="#fff" fill="#fff" w={0} />
    </div>
    <HomeBar dark />
  </div>
);

// ------------------------------------------------------------------ Messages
export type Bub = { t: string; me?: boolean; at: number; red?: boolean };
export const MessagesScreen: React.FC<{ f: number; name: string; person?: Person; bubbles: Bub[]; status?: string; statusAt?: number; blocked?: number; color?: string }> = ({ f, name, person, bubbles, status, statusAt = 0, blocked = 0, color = BLUE }) => {
  const shown = bubbles.filter((b) => f >= b.at);
  const H = shown.reduce((h, b) => h + (b.t.length > 24 ? 74 : 52) + 8, 0);
  const lift = Math.max(0, H - 520);
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", fontFamily: SYS, color: "#000" }}>
      <StatusBar time="23:55" />
      <div style={{ position: "absolute", left: 0, top: 50, width: SW, height: 100, borderBottom: "1px solid #e5e5ea", background: "rgba(249,249,249,0.95)", zIndex: 3, textAlign: "center" }}>
        <div style={{ position: "absolute", left: 14, top: 26 }}>
          <Sym n="chevL" size={26} color={BLUE} w={2.6} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
          <Avatar person={person} size={52} dark={false} ring="#fff" />
        </div>
        <div style={{ fontSize: 13, marginTop: 4, display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
          {name} <Sym n="chevR" size={12} color="#8e8e93" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: 170, width: SW, bottom: 90, overflow: "hidden" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "0 14px", transform: `translateY(${-lift}px)` }}>
          {shown.map((b, i) => {
            const p = outExpo(clamp01((f - b.at) / 10));
            return (
              <div key={i} style={{ alignSelf: b.me ? "flex-end" : "flex-start", maxWidth: 270, padding: "11px 15px", borderRadius: 20, background: b.me ? color : b.red ? "#ffe5e3" : "#e9e9eb", color: b.me ? "#fff" : b.red ? RED_IOS : "#000", fontSize: 19, lineHeight: 1.28, transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 20}px)`, transformOrigin: b.me ? "100% 100%" : "0% 100%", opacity: clamp01(p * 2) }}>
                {b.t}
              </div>
            );
          })}
          {status && f >= statusAt && <div style={{ alignSelf: "flex-end", fontSize: 12, color: RED_IOS, fontWeight: 500, marginTop: -2, display: "flex", alignItems: "center", gap: 4, opacity: clamp01((f - statusAt) / 6) }}>
            <Sym n="alert" size={13} color={RED_IOS} /> {status}
          </div>}
        </div>
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 34, height: 40, borderRadius: 20, border: "1px solid #d1d1d6", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 16, color: "#c7c7cc" }}>iMessage</div>
      {blocked > 0 && (
        <div style={{ position: "absolute", left: 16, right: 16, bottom: 96, padding: "16px 16px", borderRadius: 18, background: "#fff2f1", color: RED_IOS, fontSize: 18, fontWeight: 600, textAlign: "center", opacity: blocked, transform: `translateY(${(1 - outExpo(blocked)) * 20}px)`, boxShadow: "0 0 0 1px rgba(255,59,48,0.25)" }}>
          Acest număr nu mai este disponibil.
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------ the bank: the advance, sent
export const BankScreen: React.FC<{ f: number; sent: number; to: string; amount: string }> = ({ sent, to, amount }) => (
  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#0b2a7a,#0a1840)", fontFamily: SYS, color: "#fff" }}>
    <StatusBar dark time="23:57" />
    <div style={{ position: "absolute", left: 22, top: 74, fontSize: 18, opacity: 0.7 }}>Transfer către</div>
    <div style={{ position: "absolute", left: 22, top: 100, fontSize: 28, fontWeight: 700 }}>{to}</div>
    <div style={{ position: "absolute", left: 0, top: 220, width: SW, textAlign: "center", fontSize: 76, fontWeight: 700, letterSpacing: "-0.03em" }}>{amount}</div>
    <div style={{ position: "absolute", left: 0, top: 316, width: SW, textAlign: "center", fontSize: 17, opacity: 0.7 }}>Detalii: „avans materiale”</div>
    <div style={{ position: "absolute", left: SW / 2 - 70, top: 420, width: 140, height: 140, borderRadius: 70, background: `rgba(52,199,89,${sent})`, border: `4px solid rgba(255,255,255,${0.25 * (1 - sent)})`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.7 + 0.3 * outExpo(sent)})` }}>
      {sent > 0.3 && <Sym n="check" size={70} color="#fff" w={3} />}
    </div>
    <div style={{ position: "absolute", left: 0, top: 590, width: SW, textAlign: "center", fontSize: 26, fontWeight: 700, opacity: sent }}>Trimis</div>
    <HomeBar dark />
  </div>
);

// ------------------------------------------------------------------ the home screen, Handly waiting on it
const GRID: [AppKind, string][] = [
  ["calendar", "Calendar"], ["photos", "Poze"], ["camera", "Cameră"], ["weather", "Vremea"],
  ["mail", "Mail"], ["notes", "Notițe"], ["reminders", "Mementouri"], ["clock", "Ceas"],
  ["maps", "Hărți"], ["health", "Sănătate"], ["handly", "Handly"], ["bank", "Banca"],
  ["shop", "Magazin"], ["music", "Muzică"], ["contacts", "Contacte"], ["settings", "Setări"],
];
export const HANDLY_ICON = { x: 52 + 2 * 92 + 31, y: 96 + 2 * 104 + 31 };
export const HomeScreen: React.FC<{ f: number; glow: number; press: number; others?: number }> = ({ f, glow, press, others = 1 }) => (
  <div style={{ position: "absolute", inset: 0, fontFamily: SYS }}>
    <Wallpaper f={f} />
    <StatusBar dark time="23:58" />
    {GRID.map(([k, label], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const me = k === "handly";
      return (
        <div key={k} style={{ position: "absolute", left: 52 + col * 92 - 14, top: 96 + row * 104, width: 90, textAlign: "center", opacity: me ? 1 : others, transform: me ? `scale(${1 - 0.1 * press + 0.06 * glow})` : undefined }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <AppIcon k={k} size={62} glow={me ? glow : 0} />
          </div>
          <div style={{ fontSize: 12, color: "#fff", marginTop: 6, fontWeight: 500 }}>{label}</div>
        </div>
      );
    })}
    <div style={{ position: "absolute", left: 14, right: 14, bottom: 22, height: 96, borderRadius: 34, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 12px", opacity: others }}>
      {(["phone", "safari", "messages", "music"] as AppKind[]).map((k) => (
        <AppIcon key={k} k={k} size={62} />
      ))}
    </div>
  </div>
);

export const GreenCheck: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <svg width={size} height={size} viewBox="0 0 128 128">
    <circle cx={64} cy={64} r={58 * outExpo(clamp01(t * 1.6))} fill={GREEN} />
    <path d="M40 66 L56 81 L89 47" fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - clamp01((t - 0.35) / 0.5)} />
  </svg>
);
export { INK };
