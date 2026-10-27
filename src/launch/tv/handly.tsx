import React from "react";
import { Img, staticFile } from "remotion";
import { Avatar, Person } from "../../explainer/components/Avatar";
import { clamp01, lerp } from "../../explainer/lib/anim";
import { FONT } from "../../explainer/theme";
import { GreenCheck, HomeBar, StatusBar, SW, Sym, SymName } from "./ios";
import { GREEN, outExpo } from "./kit";

// ------------------------------------------------------------------ the Handly app, screen by screen (white, green, bold)
const INK = "#141816";
const MUTED = "#7b8480";
const SOFT = "#eef2ef";
const SANS = FONT;

export const Head: React.FC<{ title: string; sub?: string; back?: boolean }> = ({ title, sub, back }) => (
  <>
    <div style={{ position: "absolute", left: 22, top: 62, display: "flex", alignItems: "center", gap: 8 }}>
      {back ? <Sym n="chevL" size={26} color={INK} w={2.6} /> : <Img src={staticFile("images/logo.webp")} style={{ width: 30, height: 30 }} />}
      <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>{back ? "" : "handly.ro"}</span>
    </div>
    <div style={{ position: "absolute", left: 22, top: 104, fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>{title}</div>
    {sub && <div style={{ position: "absolute", left: 22, top: 144, fontSize: 15, fontWeight: 600, color: MUTED }}>{sub}</div>}
  </>
);
const Base: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = "#fbfcfb" }) => (
  <div style={{ position: "absolute", inset: 0, background: bg, fontFamily: SANS, color: INK }}>
    <StatusBar />
    {children}
    <HomeBar />
  </div>
);
export const Verified: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d="M12 1.5l2.6 2 3.3-.2.9 3.2 2.8 1.8-1.2 3.1 1.2 3.1-2.8 1.8-.9 3.2-3.3-.2-2.6 2-2.6-2-3.3.2-.9-3.2-2.8-1.8 1.2-3.1-1.2-3.1 2.8-1.8.9-3.2 3.3.2z" fill={GREEN} />
    <path d="M8 12.2l2.7 2.7 5.3-5.6" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Stars: React.FC<{ n?: number; size?: number; fill?: number }> = ({ n = 5, size = 14, fill = 5 }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {Array.from({ length: n }, (_, i) => (
      <Sym key={i} n="star" size={size} color={i < fill ? "#ffb800" : "#d9dedb"} fill={i < fill ? "#ffb800" : "#d9dedb"} w={1} />
    ))}
  </div>
);
export const Btn: React.FC<{ label: React.ReactNode; y: number; press?: number; done?: number; dark?: boolean }> = ({ label, y, press = 0, done = 0, dark }) => (
  <div style={{ position: "absolute", left: 24, top: y, width: SW - 48, height: 60, borderRadius: 18, background: dark ? INK : `linear-gradient(180deg, #14cf75 0%, ${GREEN} 100%)`, boxShadow: dark ? undefined : "0 14px 28px rgba(0,191,99,0.3)", transform: `scale(${1 - 0.05 * press})`, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#fff", fontSize: 18, fontWeight: 700 }}>
    {done > 0.5 ? <Sym n="check" size={22} color="#fff" w={3} /> : null}
    {label}
  </div>
);

// ------------------------------------------------------------------ map tiles
export const MapBg: React.FC<{ w: number; h: number; f: number; dark?: boolean }> = ({ w, h, dark }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
    <rect width={w} height={h} fill={dark ? "#1b2421" : "#e9efea"} />
    <path d={`M-20 ${h * 0.62} C ${w * 0.3} ${h * 0.5}, ${w * 0.6} ${h * 0.78}, ${w + 20} ${h * 0.55}`} stroke={dark ? "#2a3632" : "#fff"} strokeWidth={18} fill="none" />
    <path d={`M${w * 0.32} -10 L ${w * 0.4} ${h + 10}`} stroke={dark ? "#2a3632" : "#fff"} strokeWidth={13} fill="none" />
    <path d={`M${w * 0.76} -10 L ${w * 0.68} ${h + 10}`} stroke={dark ? "#2a3632" : "#fff"} strokeWidth={10} fill="none" />
    <path d={`M-10 ${h * 0.2} L ${w + 10} ${h * 0.26}`} stroke={dark ? "#2a3632" : "#fff"} strokeWidth={8} fill="none" />
    {Array.from({ length: 14 }, (_, i) => (
      <rect key={i} x={(i * 97) % (w - 40) + 6} y={((i * 61) % (h - 50)) + 8} width={40 + (i % 3) * 18} height={26 + (i % 4) * 10} rx={6} fill={dark ? "#222c29" : "#dde7df"} />
    ))}
    <path d={`M${w * 0.05} ${h * 0.85} q ${w * 0.15} -${h * 0.1} ${w * 0.3} 0 t ${w * 0.2} ${h * 0.05}`} stroke={dark ? "#24433a" : "#cfe8d6"} strokeWidth={26} fill="none" strokeLinecap="round" />
  </svg>
);

// ------------------------------------------------------------------ offers coming in
export type Offer = { p: Person; name: string; rating: string; reviews: number; dist: string; price: string; at: number };
export const OffersScreen: React.FC<{ f: number; offers: Offer[]; pick?: number; pickAt?: number }> = ({ f, offers, pick = -1, pickAt = 0 }) => {
  const sel = clamp01((f - pickAt) / 8);
  return (
    <Base>
      <Head title="Oferte pentru tine" sub="Priză stricată · Azi, 18:00" />
      <div style={{ position: "absolute", left: 18, top: 178, width: SW - 36, height: 150, borderRadius: 20, overflow: "hidden" }}>
        <MapBg w={SW - 36} h={150} f={f} />
        {[[180, 80], [70, 40], [300, 104], [250, 30]].map(([x, y], i) => {
          const p = outExpo(clamp01((f - (offers[i]?.at ?? 0) + 6) / 10));
          return i < offers.length ? (
            <div key={i} style={{ position: "absolute", left: x - 18, top: y - 18, transform: `scale(${p})`, opacity: p }}>
              <div style={{ borderRadius: "50%", boxShadow: `0 0 0 4px #fff, 0 6px 14px rgba(0,0,0,0.25)` }}>
                <Avatar person={offers[i].p} size={36} dark={false} ring="#fff" />
              </div>
            </div>
          ) : null;
        })}
        <div style={{ position: "absolute", left: (SW - 36) / 2 - 9, top: 66, width: 18, height: 18, borderRadius: 9, background: GREEN, boxShadow: `0 0 0 ${6 + 4 * Math.sin(f / 6)}px rgba(0,191,99,0.22), 0 0 0 3px #fff` }} />
      </div>
      {offers.map((o, i) => {
        const p = outExpo(clamp01((f - o.at) / 12));
        if (p <= 0) return null;
        const chosen = i === pick && sel > 0;
        return (
          <div key={i} style={{ position: "absolute", left: 18, right: 18, top: 344 + i * 118, height: 106, borderRadius: 22, background: "#fff", boxShadow: chosen ? `0 0 0 ${3 * sel}px ${GREEN}, 0 12px 30px rgba(0,60,30,0.16)` : "0 8px 22px rgba(0,40,20,0.08)", display: "flex", alignItems: "center", gap: 14, padding: "0 16px", transform: `translateY(${(1 - p) * 60}px) scale(${1 + 0.03 * Math.sin(Math.PI * sel) * (chosen ? 1 : 0)})`, opacity: clamp01(p * 2) * (pick >= 0 && !chosen ? 1 - 0.55 * sel : 1) }}>
            <Avatar person={o.p} size={62} dark={false} ring="#fff" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 18, fontWeight: 700 }}>
                {o.name} <Verified />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 13.5, color: MUTED, fontWeight: 600 }}>
                <Stars size={12} /> {o.rating} ({o.reviews}) · {o.dist}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: GREEN, letterSpacing: "-0.02em" }}>{o.price}</div>
              <div style={{ marginTop: 6, padding: "6px 12px", borderRadius: 999, background: chosen ? GREEN : SOFT, color: chosen ? "#fff" : INK, fontSize: 13, fontWeight: 700 }}>{chosen ? "Ales" : "Vezi"}</div>
            </div>
          </div>
        );
      })}
    </Base>
  );
};

// ------------------------------------------------------------------ his profile
export const ProfileScreen: React.FC<{ f: number; press: number }> = ({ f, press }) => (
  <Base>
    <div style={{ position: "absolute", left: 0, top: 0, width: SW, height: 300, overflow: "hidden" }}>
      <Img src={staticFile("images/people/mihai.webp")} style={{ width: SW, height: 300, objectFit: "cover", objectPosition: "50% 30%", transform: `scale(${1.08 - 0.04 * clamp01(f / 200)})` }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(251,252,251,1) 100%)" }} />
    </div>
    <div style={{ position: "absolute", left: 22, top: 268, display: "flex", alignItems: "center", gap: 8, fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em" }}>
      Mihai Dumitru <Verified size={26} />
    </div>
    <div style={{ position: "absolute", left: 22, top: 312, fontSize: 15, fontWeight: 600, color: MUTED }}>Electrician · Instalator · 6 ani experiență</div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 350, display: "flex", gap: 10 }}>
      {[["4,9", "rating"], ["312", "task-uri"], ["98%", "la timp"]].map(([v, l]) => (
        <div key={l} style={{ flex: 1, height: 76, borderRadius: 18, background: "#fff", boxShadow: "0 6px 16px rgba(0,40,20,0.06)", textAlign: "center", paddingTop: 12, boxSizing: "border-box" }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{v}</div>
          <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>{l}</div>
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 444, padding: 16, borderRadius: 18, background: "#fff", boxShadow: "0 6px 16px rgba(0,40,20,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Avatar person="radu" size={34} dark={false} ring="#fff" />
        <div style={{ fontSize: 15, fontWeight: 700 }}>Radu S.</div>
        <Stars size={12} />
      </div>
      <div style={{ fontSize: 15, color: "#3d4541", marginTop: 8, lineHeight: 1.4 }}>„A venit la ora stabilită, a lăsat totul curat. Recomand!”</div>
    </div>
    <div style={{ position: "absolute", left: 22, top: 600, display: "flex", gap: 8, flexWrap: "wrap", right: 22 }}>
      {["Prize și întrerupătoare", "Corpuri de iluminat", "Tablouri electrice"].map((t) => (
        <div key={t} style={{ padding: "8px 12px", borderRadius: 999, background: SOFT, fontSize: 13.5, fontWeight: 700 }}>{t}</div>
      ))}
    </div>
    <Btn label="Alege-l pe Mihai" y={742} press={press} />
  </Base>
);

// ------------------------------------------------------------------ the chat
export type Msg = { t: string; me?: boolean; at: number };
export const ChatScreen: React.FC<{ f: number; msgs: Msg[] }> = ({ f, msgs }) => (
  <Base bg="#f6f8f7">
    <div style={{ position: "absolute", left: 0, top: 50, width: SW, height: 86, background: "#fff", borderBottom: "1px solid #e8ece9", display: "flex", alignItems: "center", gap: 12, padding: "0 18px", boxSizing: "border-box" }}>
      <Sym n="chevL" size={24} color={INK} w={2.6} />
      <Avatar person="mihai" size={48} dark={false} ring="#fff" />
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 18, fontWeight: 700 }}>
          Mihai D. <Verified size={16} />
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: GREEN }}>online</div>
      </div>
      <div style={{ marginLeft: "auto" }}>
        <Sym n="phone" size={22} color={GREEN} />
      </div>
    </div>
    <div style={{ position: "absolute", left: 14, right: 14, top: 160, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ alignSelf: "center", fontSize: 12.5, fontWeight: 700, color: MUTED, background: "#e9eeeb", padding: "6px 12px", borderRadius: 999 }}>Priză stricată · 150 lei</div>
      {msgs.map((m, i) => {
        const p = outExpo(clamp01((f - m.at) / 10));
        if (p <= 0) return null;
        return (
          <div key={i} style={{ alignSelf: m.me ? "flex-end" : "flex-start", maxWidth: 280, padding: "12px 16px", borderRadius: 22, borderBottomRightRadius: m.me ? 6 : 22, borderBottomLeftRadius: m.me ? 22 : 6, background: m.me ? GREEN : "#fff", color: m.me ? "#fff" : INK, boxShadow: m.me ? "none" : "0 4px 12px rgba(0,40,20,0.06)", fontSize: 18, fontWeight: 600, lineHeight: 1.3, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: m.me ? "100% 100%" : "0% 100%", opacity: clamp01(p * 2) }}>
            {m.t}
          </div>
        );
      })}
    </div>
    <div style={{ position: "absolute", left: 14, right: 14, bottom: 34, height: 48, borderRadius: 24, background: "#fff", boxShadow: "0 4px 12px rgba(0,40,20,0.06)", display: "flex", alignItems: "center", padding: "0 18px", fontSize: 16, color: "#a9b0ac", fontWeight: 600 }}>Scrie un mesaj…</div>
  </Base>
);

// ------------------------------------------------------------------ paying safely
export const PayScreen: React.FC<{ f: number; scan: number; paid: number; cashX?: number }> = ({ f, scan, paid, cashX = 0 }) => (
  <Base>
    <Head title="Plată" sub="Priză stricată · Mihai D." back />
    <div style={{ position: "absolute", left: 18, right: 18, top: 182, padding: 20, borderRadius: 22, background: "#fff", boxShadow: "0 8px 22px rgba(0,40,20,0.07)" }}>
      {[["Manoperă", "150 lei"], ["Taxă serviciu", "0 lei"]].map(([a, b]) => (
        <div key={a} style={{ display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 600, color: MUTED, marginBottom: 10 }}>
          <span>{a}</span>
          <span>{b}</span>
        </div>
      ))}
      <div style={{ height: 1, background: "#e8ece9", margin: "6px 0 12px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 800 }}>
        <span>Total</span>
        <span>150 lei</span>
      </div>
    </div>
    <div style={{ position: "absolute", left: 22, top: 372, fontSize: 13, fontWeight: 700, color: MUTED, letterSpacing: "0.02em" }}>METODĂ DE PLATĂ</div>
    {([
      ["card", "Card · plată în aplicație", true],
      ["cash", "Numerar", false],
    ] as [SymName, string, boolean][]).map(([ic, t, on], i) => (
      <div key={t} style={{ position: "absolute", left: 18, right: 18, top: 396 + i * 70, height: 60, borderRadius: 18, background: "#fff", border: `2px solid ${on ? GREEN : "#e8ece9"}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", opacity: on ? 1 : 1 - 0.5 * cashX }}>
        <Sym n={ic} size={24} color={on ? GREEN : MUTED} />
        <span style={{ fontSize: 17, fontWeight: 700, position: "relative" }}>
          {t}
          {!on && <span style={{ position: "absolute", left: -2, top: "52%", height: 3, width: `${104 * cashX}%`, background: "#e8463a", borderRadius: 2 }} />}
        </span>
        <span style={{ marginLeft: "auto" }}>{on ? <Sym n="check" size={22} color={GREEN} w={3} /> : cashX > 0.5 ? <span style={{ fontSize: 13, fontWeight: 700, color: "#e8463a" }}>Indisponibil</span> : null}</span>
      </div>
    ))}
    <div style={{ position: "absolute", left: 18, right: 18, top: 548, padding: 16, borderRadius: 18, background: "rgba(0,191,99,0.08)", display: "flex", gap: 12, alignItems: "center" }}>
      <Sym n="shield" size={30} color={GREEN} fill="rgba(0,191,99,0.18)" />
      <div style={{ fontSize: 15, fontWeight: 600, color: "#2c4a3a", lineHeight: 1.35 }}>Banii ajung la Mihai doar după ce confirmi că lucrarea e gata.</div>
    </div>
    {/* Face ID, then paid */}
    {scan > 0 && (
      <div style={{ position: "absolute", left: SW / 2 - 60, top: 650, width: 120, height: 120, opacity: clamp01(scan * 3) * (1 - paid) }}>
        <svg width={120} height={120} viewBox="0 0 120 120">
          {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => (
            <path key={i} d={`M${a ? 96 : 24} ${b ? 80 : 40} V${b ? 96 : 24} H${a ? 80 : 40}`} fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" transform={a ? "" : ""} />
          ))}
          <circle cx={48} cy={52} r={3.5} fill={GREEN} />
          <circle cx={72} cy={52} r={3.5} fill={GREEN} />
          <path d="M60 52 V66 H55" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
          <path d="M48 78 Q60 86 72 78" fill="none" stroke={GREEN} strokeWidth={4} strokeLinecap="round" />
        </svg>
      </div>
    )}
    {paid > 0 && (
      <div style={{ position: "absolute", left: 0, top: 640, width: SW, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <GreenCheck size={110} t={paid} />
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, opacity: clamp01((paid - 0.5) * 3) }}>Plată protejată</div>
      </div>
    )}
    <div style={{ display: "none" }}>{f}</div>
  </Base>
);

// ------------------------------------------------------------------ live tracking
export const TrackScreen: React.FC<{ f: number; t: number; step: number; done: number }> = ({ f, t, step, done }) => {
  const W = SW, H = 470;
  const path = (u: number) => {
    // a route through the streets: a quadratic chain
    const pts: [number, number][] = [
      [40, 420], [120, 330], [220, 320], [260, 220], [330, 150],
    ];
    const seg = Math.min(pts.length - 2, Math.floor(u * (pts.length - 1)));
    const k = u * (pts.length - 1) - seg;
    return [lerp(pts[seg][0], pts[seg + 1][0], k), lerp(pts[seg][1], pts[seg + 1][1], k)] as const;
  };
  const [vx, vy] = path(clamp01(t));
  const STEPS = ["Acceptat", "Pe drum", "A ajuns", "În lucru", "Gata"];
  const eta = Math.max(0, Math.round(lerp(8, 0, clamp01(t))));
  return (
    <Base>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, overflow: "hidden" }}>
        <MapBg w={W} h={H} f={f} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <polyline points="40,420 120,330 220,320 260,220 330,150" fill="none" stroke="rgba(0,191,99,0.25)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="40,420 120,330 220,320 260,220 330,150" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 14" strokeDashoffset={-f * 1.2} />
          <circle cx={330} cy={150} r={12} fill="#fff" stroke={INK} strokeWidth={4} />
        </svg>
        <div style={{ position: "absolute", left: vx - 22, top: vy - 22, width: 44, height: 44, borderRadius: 22, boxShadow: `0 0 0 ${5 + 3 * Math.sin(f / 5)}px rgba(0,191,99,0.25), 0 6px 14px rgba(0,0,0,0.25)` }}>
          <Avatar person="mihai" size={44} dark={false} ring="#fff" />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: H - 30, width: SW, bottom: 0, borderRadius: "28px 28px 0 0", background: "#fff", boxShadow: "0 -10px 30px rgba(0,0,0,0.08)" }}>
        <div style={{ position: "absolute", left: SW / 2 - 20, top: 8, width: 40, height: 5, borderRadius: 3, background: "#dfe4e1" }} />
        <div style={{ position: "absolute", left: 22, top: 26, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>{done > 0.5 ? "Gata! Priza merge." : step >= 3 ? "Mihai lucrează" : eta > 0 ? `Mihai ajunge în ${eta} min` : "Mihai a ajuns"}</div>
        <div style={{ position: "absolute", left: 22, right: 22, top: 76, display: "flex", alignItems: "center" }}>
          {STEPS.map((s, i) => {
            const on = step >= i;
            return (
              <React.Fragment key={s}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: on ? GREEN : "#e8ece9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: `scale(${on && step === i ? 1.15 : 1})` }}>{on && <Sym n="check" size={15} color="#fff" w={3.2} />}</div>
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 4, margin: "0 4px", borderRadius: 2, background: step > i ? GREEN : "#e8ece9" }} />}
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 10, right: 10, top: 110, display: "flex", justifyContent: "space-between" }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ width: 70, textAlign: "center", fontSize: 12, fontWeight: 700, color: step >= i ? INK : MUTED }}>{s}</div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 18, right: 18, top: 160, height: 76, borderRadius: 18, background: SOFT, display: "flex", alignItems: "center", gap: 12, padding: "0 14px" }}>
          <Avatar person="mihai" size={48} dark={false} ring="#fff" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              Mihai D. <Verified size={15} />
            </div>
            <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>Dacia Dokker · B 123 HND</div>
          </div>
          <div style={{ marginLeft: "auto", width: 42, height: 42, borderRadius: 21, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sym n="msg" size={20} color={GREEN} />
          </div>
        </div>
        {done > 0 && (
          <div style={{ position: "absolute", inset: 0, borderRadius: "28px 28px 0 0", background: `rgba(255,255,255,${done})`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
            <GreenCheck size={110} t={done} />
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10, opacity: clamp01((done - 0.4) * 3) }}>Task finalizat</div>
            <div style={{ marginTop: 10, opacity: clamp01((done - 0.6) * 3) }}>
              <Stars size={26} fill={Math.round(5 * clamp01((done - 0.6) * 2.5))} />
            </div>
          </div>
        )}
      </div>
    </Base>
  );
};

// ------------------------------------------------------------------ the other side: Mihai's app
export const ModeScreen: React.FC<{ f: number; flip: number }> = ({ flip }) => {
  const dark = flip > 0.5;
  return (
    <div style={{ position: "absolute", inset: 0, background: dark ? "#0b1410" : "#fbfcfb", fontFamily: SANS, color: dark ? "#fff" : INK }}>
      <StatusBar dark={dark} />
      <div style={{ position: "absolute", left: 0, top: 80, width: SW, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar person="mihai" size={110} dark={dark} ring={dark ? GREEN : "#fff"} />
        <div style={{ fontSize: 26, fontWeight: 800, marginTop: 14, letterSpacing: "-0.02em" }}>Mihai Dumitru</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: dark ? "#8fa79a" : MUTED, marginTop: 4 }}>București · Sector 3</div>
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, top: 300, height: 58, borderRadius: 29, background: dark ? "#1a2620" : "#e9eeeb", padding: 5, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", top: 5, bottom: 5, left: 5 + flip * ((SW - 36) / 2 - 5), width: (SW - 36) / 2 - 5, borderRadius: 24, background: dark ? GREEN : "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }} />
        {["Am nevoie de ajutor", "Vreau să câștig"].map((t, i) => (
          <div key={t} style={{ position: "absolute", top: 0, bottom: 0, left: i * ((SW - 36) / 2), width: (SW - 36) / 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: i === 1 ? (dark ? "#fff" : MUTED) : dark ? "#8fa79a" : INK }}>
            {t}
          </div>
        ))}
      </div>
      {(dark
        ? [["Câștiguri", "trend"], ["Task-uri lângă tine", "pin"], ["Programul meu", "cal"], ["Abilitățile mele", "wrench"]]
        : [["Task-urile mele", "note"], ["Plăți", "card"], ["Adrese", "house"], ["Setări", "gear"]]
      ).map(([t, ic], i) => (
        <div key={t} style={{ position: "absolute", left: 18, right: 18, top: 390 + i * 74, height: 64, borderRadius: 18, background: dark ? "#14201a" : "#fff", boxShadow: dark ? "none" : "0 6px 16px rgba(0,40,20,0.05)", display: "flex", alignItems: "center", gap: 14, padding: "0 16px", fontSize: 17, fontWeight: 700 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: dark ? "rgba(0,191,99,0.18)" : SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sym n={ic as SymName} size={20} color={dark ? GREEN : INK} />
          </div>
          {t}
          <span style={{ marginLeft: "auto" }}>
            <Sym n="chevR" size={18} color={dark ? "#5e7468" : "#a9b0ac"} w={2.4} />
          </span>
        </div>
      ))}
      <HomeBar dark={dark} />
    </div>
  );
};

export const SKILLS: [SymName, string][] = [
  ["box", "Montaj mobilă"],
  ["roller", "Zugrăveli"],
  ["wrench", "Reparații"],
  ["sparkles", "Curățenie"],
  ["truck", "Mutări"],
  ["zap", "Electrice"],
  ["drop", "Instalații"],
  ["leaf", "Grădinărit"],
];
export const SkillsScreen: React.FC<{ f: number; on: number[] }> = ({ on }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
    <StatusBar dark />
    <div style={{ position: "absolute", left: 22, top: 70, fontSize: 14, fontWeight: 700, color: GREEN, letterSpacing: "0.04em" }}>PASUL 1 DIN 3</div>
    <div style={{ position: "absolute", left: 22, top: 96, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Ce știi să faci?</div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 160, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {SKILLS.map(([ic, t], i) => {
        const p = clamp01(on[i] ?? 0);
        return (
          <div key={t} style={{ height: 112, borderRadius: 22, background: p > 0.5 ? GREEN : "#14201a", border: `2px solid ${p > 0.5 ? GREEN : "#22322a"}`, padding: 16, boxSizing: "border-box", position: "relative", transform: `scale(${1 + 0.06 * Math.sin(Math.PI * p)})` }}>
            <Sym n={ic} size={30} color={p > 0.5 ? "#fff" : GREEN} />
            <div style={{ position: "absolute", left: 16, bottom: 14, fontSize: 17, fontWeight: 700 }}>{t}</div>
            {p > 0.5 && (
              <div style={{ position: "absolute", right: 12, top: 12, width: 26, height: 26, borderRadius: 13, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sym n="check" size={16} color={GREEN} w={3.2} />
              </div>
            )}
          </div>
        );
      })}
    </div>
    <HomeBar dark />
  </div>
);

export const SetupScreen: React.FC<{ f: number; typed: number; ver: number; ready: number }> = ({ typed, ver, ready }) => {
  const name = "Mihai Dumitru";
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
      <StatusBar dark />
      <div style={{ position: "absolute", left: 22, top: 70, fontSize: 14, fontWeight: 700, color: GREEN, letterSpacing: "0.04em" }}>PASUL 3 DIN 3</div>
      <div style={{ position: "absolute", left: 22, top: 96, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Profilul tău</div>
      <div style={{ position: "absolute", left: 0, top: 170, width: SW, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <Avatar person="mihai" size={140} dark ring={ver > 0.5 ? GREEN : "#22322a"} lit={ver} />
          <div style={{ position: "absolute", right: 0, bottom: 4, transform: `scale(${outExpo(ver)})` }}>
            <Verified size={40} />
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, top: 342, height: 60, borderRadius: 16, background: "#14201a", border: "2px solid #22322a", display: "flex", alignItems: "center", padding: "0 16px", fontSize: 19, fontWeight: 700 }}>
        {name.slice(0, Math.round(name.length * clamp01(typed)))}
        {typed < 1 && <span style={{ width: 2, height: 22, background: GREEN, marginLeft: 2 }} />}
      </div>
      {[["Identitate verificată", 0.2], ["Telefon confirmat", 0.5], ["Abilități adăugate", 0.8]].map(([t, k], i) => {
        const on = ver > (k as number);
        return (
          <div key={i} style={{ position: "absolute", left: 22, top: 430 + i * 50, display: "flex", alignItems: "center", gap: 12, fontSize: 17, fontWeight: 700, color: on ? "#fff" : "#5e7468" }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: on ? GREEN : "#22322a", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <Sym n="check" size={15} color="#fff" w={3.2} />}</div>
            {t}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 24, top: 742, width: SW - 48, height: 60, borderRadius: 18, background: ready > 0.5 ? GREEN : "#22322a", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 18, fontWeight: 800, transform: `scale(${1 + 0.05 * Math.sin(Math.PI * clamp01(ready))})` }}>
        {ready > 0.5 && <Sym n="check" size={22} color="#fff" w={3} />}
        {ready > 0.5 ? "Cont activ · 3 min" : "Finalizează"}
      </div>
      <HomeBar dark />
    </div>
  );
};

export const EarnScreen: React.FC<{ f: number; amount: number; bars: number; pings: number[] }> = ({ f, amount, bars, pings }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
    <StatusBar dark />
    <div style={{ position: "absolute", left: 22, top: 70, fontSize: 16, fontWeight: 700, color: "#8fa79a" }}>Câștiguri · octombrie</div>
    <div style={{ position: "absolute", left: 22, top: 96, fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
      {Math.round(amount).toLocaleString("ro-RO")} <span style={{ fontSize: 30, color: GREEN }}>lei</span>
    </div>
    <div style={{ position: "absolute", left: 22, top: 176, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "rgba(0,191,99,0.16)", color: GREEN, fontSize: 14, fontWeight: 700 }}>
      <Sym n="trend" size={16} color={GREEN} /> +38% față de septembrie
    </div>
    <div style={{ position: "absolute", left: 22, right: 22, top: 226, height: 190, display: "flex", alignItems: "flex-end", gap: 10 }}>
      {[0.32, 0.45, 0.4, 0.58, 0.52, 0.74, 0.66, 0.88, 0.8, 1].map((h, i) => (
        <div key={i} style={{ flex: 1, height: `${100 * h * outExpo(clamp01(bars * 10 - i))}%`, borderRadius: 8, background: i === 9 ? GREEN : "rgba(0,191,99,0.32)" }} />
      ))}
    </div>
    {([
      ["Montaj dulap", "+180 lei", "box"],
      ["Priză bucătărie", "+150 lei", "zap"],
      ["Zugrăvit hol", "+450 lei", "roller"],
    ] as [string, string, SymName][]).map(([t, v, ic], i) => {
      const p = outExpo(clamp01((f - pings[i]) / 10));
      return (
        <div key={t} style={{ position: "absolute", left: 18, right: 18, top: 446 + i * 78, height: 66, borderRadius: 18, background: "#14201a", display: "flex", alignItems: "center", gap: 12, padding: "0 14px", opacity: p, transform: `translateX(${(1 - p) * 60}px)` }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,191,99,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sym n={ic} size={20} color={GREEN} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t}</div>
          <div style={{ marginLeft: "auto", fontSize: 18, fontWeight: 800, color: GREEN }}>{v}</div>
        </div>
      );
    })}
    <HomeBar dark />
  </div>
);

export const ScheduleScreen: React.FC<{ f: number; days: number; end: number }> = ({ days, end }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
    <StatusBar dark />
    <div style={{ position: "absolute", left: 22, top: 96, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Programul meu</div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 170, display: "flex", justifyContent: "space-between" }}>
      {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => {
        const on = i < 5 && days > i;
        return <div key={i} style={{ width: 46, height: 46, borderRadius: 23, background: on ? GREEN : "#14201a", border: `2px solid ${on ? GREEN : "#22322a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: on ? "#fff" : "#5e7468" }}>{d}</div>;
      })}
    </div>
    <div style={{ position: "absolute", left: 22, top: 260, fontSize: 15, fontWeight: 700, color: "#8fa79a" }}>Ore disponibile</div>
    <div style={{ position: "absolute", left: 22, top: 286, fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>08:00 – {String(Math.round(lerp(20, 14, end))).padStart(2, "0")}:00</div>
    <div style={{ position: "absolute", left: 22, right: 22, top: 380, height: 12, borderRadius: 6, background: "#14201a" }}>
      <div style={{ position: "absolute", left: "15%", width: `${lerp(70, 35, end)}%`, height: 12, borderRadius: 6, background: GREEN }} />
      {[15, 15 + lerp(70, 35, end)].map((x, i) => (
        <div key={i} style={{ position: "absolute", left: `calc(${x}% - 16px)`, top: -10, width: 32, height: 32, borderRadius: 16, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }} />
      ))}
    </div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 440, padding: 18, borderRadius: 18, background: "#14201a", fontSize: 16, fontWeight: 600, color: "#cfe0d6", lineHeight: 1.45 }}>După ora {Math.round(lerp(20, 14, end))}:00 nu primești task-uri. Timpul tău rămâne al tău.</div>
    <HomeBar dark />
  </div>
);

export const TasksScreen: React.FC<{ f: number; acc: number; press: number }> = ({ f, acc, press }) => {
  const T: [string, string, string, SymName][] = [
    ["Montaj dulap", "1,4 km · azi, 16:00", "180 lei", "box"],
    ["Schimbat robinet", "2,8 km · mâine", "120 lei", "drop"],
    ["Zugrăvit hol", "4,1 km · sâmbătă", "450 lei", "roller"],
    ["Mutat o canapea", "3,2 km · duminică", "200 lei", "truck"],
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
      <StatusBar dark />
      <div style={{ position: "absolute", left: 22, top: 96, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Lângă tine</div>
      {T.map(([t, d, p, ic], i) => {
        const a = outExpo(clamp01((f % 100000 >= 0 ? 1 : 0)));
        const chosen = i === 0;
        return (
          <div key={t} style={{ position: "absolute", left: 18, right: 18, top: 160 + i * 132, height: 118, borderRadius: 22, background: chosen && acc > 0.5 ? "rgba(0,191,99,0.16)" : "#14201a", border: `2px solid ${chosen && acc > 0.5 ? GREEN : "#22322a"}`, padding: 16, boxSizing: "border-box", opacity: a }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Sym n={ic} size={22} color={GREEN} />
              <div style={{ fontSize: 18, fontWeight: 800 }}>{t}</div>
              <div style={{ marginLeft: "auto", fontSize: 19, fontWeight: 800, color: GREEN }}>{p}</div>
            </div>
            <div style={{ fontSize: 14, color: "#8fa79a", fontWeight: 600, marginTop: 6 }}>{d}</div>
            {chosen && (
              <div style={{ position: "absolute", right: 14, bottom: 12, padding: "8px 16px", borderRadius: 999, background: GREEN, fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", gap: 6, transform: `scale(${1 - 0.08 * press})` }}>
                {acc > 0.5 && <Sym n="check" size={16} color="#fff" w={3.2} />}
                {acc > 0.5 ? "Acceptat" : "Acceptă"}
              </div>
            )}
          </div>
        );
      })}
      <HomeBar dark />
    </div>
  );
};

export const HoursScreen: React.FC<{ f: number; hours: number }> = ({ hours }) => (
  <div style={{ position: "absolute", inset: 0, background: "#0b1410", fontFamily: SANS, color: "#fff" }}>
    <StatusBar dark />
    <div style={{ position: "absolute", left: 22, top: 96, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Cât vrei să muncești?</div>
    <div style={{ position: "absolute", left: 0, top: 200, width: SW, textAlign: "center" }}>
      <div style={{ fontSize: 110, fontWeight: 800, letterSpacing: "-0.05em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.round(hours)}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#8fa79a", marginTop: 6 }}>ore pe săptămână</div>
    </div>
    <div style={{ position: "absolute", left: 30, right: 30, top: 420, height: 12, borderRadius: 6, background: "#14201a" }}>
      <div style={{ width: `${(hours / 40) * 100}%`, height: 12, borderRadius: 6, background: GREEN }} />
      <div style={{ position: "absolute", left: `calc(${(hours / 40) * 100}% - 18px)`, top: -12, width: 36, height: 36, borderRadius: 18, background: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }} />
    </div>
    <div style={{ position: "absolute", left: 18, right: 18, top: 486, padding: 20, borderRadius: 20, background: "#14201a", textAlign: "center" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#8fa79a" }}>Câștig estimat</div>
      <div style={{ fontSize: 40, fontWeight: 800, color: GREEN, letterSpacing: "-0.03em", marginTop: 4 }}>≈ {(Math.round((hours * 55 * 4.3) / 50) * 50).toLocaleString("ro-RO")} lei / lună</div>
    </div>
    <HomeBar dark />
  </div>
);
