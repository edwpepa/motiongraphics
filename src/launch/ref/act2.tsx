import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Avatar, Person } from "../../explainer/components/Avatar";
import { AppScreen } from "../../explainer/components/AppScreen";
import { clamp01, lerp, seeded } from "../../explainer/lib/anim";
import { ChatScreen, PayScreen, TrackScreen, Verified } from "../tv/handly";
import { Sym } from "../tv/ios";
import { Device, Pose, mixPose } from "../tv/kit";
import { GREEN, io3, outExpo, spring } from "../tv3d/kit3d";
import { GATA, MAP_IN, PHONE_BACK, PHONE_IN, PICK, STOP_F, SWOOSH, V, pEnd } from "./marks";
import { RefLine } from "./type";
import { cardShadow, CheckCircle, Cursor, IOSC, IOSGroup, IOSIcon, PillBtn, ProgressBar, Shards, Stack, UI } from "./ui";

const RED = "#ff3b30";

// ------------------------------------------------------------------ the phone: on while the app is shown, it leaves by leaning back and fading
const T_PAY = V("alegi", 11) - 8;
const T_TRACK = V("urmaresti", 0) - 8;
const idle = (f: number, x: number, s = 0.98): Pose => ({ x: x + Math.sin(f / 97) * 10, y: 548 + Math.sin(f / 61) * 8, s: s * (1 + 0.012 * Math.sin(f / 73)), rx: 4 + 2.5 * Math.sin(f / 83), ry: (x < 960 ? 12 : x > 960 ? -12 : 0) + 5 * Math.sin(f / 71), rz: 1.2 * Math.sin(f / 113) });
/** coming in: from below, settling with a spring */
const enterFrom = (p: Pose, f: number, at: number): Pose => {
  const e = spring(clamp01((f - at) / 28));
  return { ...p, y: p.y + (1 - e) * 900, rx: p.rx + (1 - e) * 40, rz: p.rz + (1 - e) * -8 };
};
/** going away: it leans back on its spine, sinks a little and fades */
export const leanBack = (p: Pose, f: number, at: number, len = 14): [Pose, number] => {
  const u = io3(clamp01((f - at) / len));
  return [{ ...p, rx: p.rx + 62 * u, y: p.y - 40 * u, s: p.s * (1 - 0.12 * u) }, 1 - u];
};
const phoneAt = (f: number): [Pose, number] => {
  if (f < PHONE_BACK - 2) {
    let p = enterFrom(idle(f, 800), f, PHONE_IN);
    return leanBack(p, f, MAP_IN);
  }
  let p = idle(f, 640);
  p = mixPose(p, idle(f, 960, 1.02), io3(clamp01((f - T_TRACK) / 16)));
  p = enterFrom(p, f, PHONE_BACK);
  return leanBack(p, f, SWOOSH - 8, 10);
};

const appState = (f: number) => {
  const t0 = V("postezi", 0) + 2;
  const pressAt = V("postezi", 9) - 12;
  return {
    typed: clamp01((f - t0) / 22) * 15,
    caret: Math.floor(f / 8) % 2 === 0,
    focus: clamp01((f - (t0 - 6)) / 6),
    category: clamp01((f - (t0 + 26)) / 8),
    press: clamp01((f - pressAt) / 10),
    loading: clamp01((f - pressAt - 4) / 10),
    success: f > pressAt + 12 ? 1 : 0,
    check: clamp01((f - pressAt - 12) / 12),
    location: 1,
    priceSel: clamp01((f - (t0 + 34)) / 8),
    since: Math.max(0, f - pressAt - 12),
  };
};

/** something that pops out of the phone's glass and lands where it belongs */
const Pop: React.FC<{ at: number; from: [number, number]; to: [number, number]; out?: number; children: React.ReactNode; tilt?: number }> = ({ at, from, to, out, children, tilt = 0 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const e = outExpo(clamp01((f - at) / 18));
  const s = spring(clamp01((f - at) / 24));
  let op = clamp01((f - at) / 4), blur = 0, sc = 0.35 + 0.65 * s;
  if (out !== undefined && f >= out) {
    const u = clamp01((f - out) / 8);
    blur = 14 * u;
    op *= 1 - u;
    sc *= 1 + 0.05 * u;
    if (op <= 0.003) return null;
  }
  return (
    <div style={{ position: "absolute", left: lerp(from[0], to[0], e), top: lerp(from[1], to[1], e) + Math.sin((f - at) / 23) * 6, transform: `translate(-50%, -50%) scale(${sc}) rotate(${(1 - e) * tilt}deg)`, opacity: op, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {children}
    </div>
  );
};

const Bubble: React.FC<{ t: string; me?: boolean }> = ({ t, me }) => (
  <div style={{ maxWidth: 680, padding: "22px 32px", borderRadius: 40, borderBottomLeftRadius: me ? 40 : 12, borderBottomRightRadius: me ? 12 : 40, background: me ? IOSC.green : "#e9e9eb", color: me ? "#fff" : "#000", fontFamily: UI, fontSize: 37, letterSpacing: "-0.01em", boxShadow: cardShadow(0.6) }}>{t}</div>
);

/** the app walk-through: posting, then (after the map) talking, paying, following */
export const AppShot: React.FC = () => {
  const f = useCurrentFrame();
  const inA = f >= PHONE_IN - 2 && f < MAP_IN + 16;
  const inB = f >= PHONE_BACK - 2 && f < SWOOSH + 12;
  if (!inA && !inB) return null;
  const [pose, op] = phoneAt(f);
  const s = appState(f);
  const pressAt = V("postezi", 9) - 12;
  const paid = V("alegi", 14);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: op }}>
        <Device pose={pose} dark={false}>
          <Stack
            screens={[
              { at: 0, node: <AppScreen s={s} text="Montez un dulap" placeholder="ex: Montez un dulap" cats={[["hammer", "Montaj"], ["wrench", "Reparații"], ["roller", "Zugrăveli"]]} /> },
              { at: PHONE_BACK - 14, node: <ChatScreen f={f} msgs={[{ t: "Bună! Pot veni mâine la 10.", at: V("alegi", 5) }, { t: "Perfect, te aștept!", me: true, at: V("alegi", 8) }]} /> },
              { at: T_PAY, node: <PayScreen f={f} scan={clamp01((f - (V("alegi", 13) - 4)) / 10)} paid={clamp01((f - (paid + 2)) / 14)} cashX={clamp01((f - V("cash", 1)) / 8)} /> },
              { at: T_TRACK, node: <TrackScreen f={f} t={clamp01((f - T_TRACK) / 60)} step={f > T_TRACK + 30 ? 2 : 1} done={0} /> },
            ]}
          />
        </Device>
      </AbsoluteFill>

      {/* posting: under a minute */}
      <Pop at={V("postezi", 4) - 2} from={[820, 520]} to={[1390, 500]} out={MAP_IN - 2}>
        <IOSGroup
          w={800}
          k={2.05}
          header="Task nou"
          rows={[
            { icon: <IOSIcon n="timer" color={IOSC.orange} size={58} />, title: "Timp de postare", value: `0:${String(Math.min(48, Math.round(48 * clamp01((f - V("postezi", 4)) / 30)))).padStart(2, "0")}` },
            { icon: <IOSIcon n="check" color={IOSC.green} size={58} />, title: "Task postat", sub: "Montaj dulap · azi, 18:00", acc: "chevron", at: pressAt + 12 },
          ]}
        />
      </Pop>

      {/* talk in the app */}
      <Pop at={V("alegi", 5)} from={[640, 400]} to={[1300, 420]} out={T_PAY - 4}>
        <Bubble t="Bună! Pot veni mâine la 10." />
      </Pop>
      <Pop at={V("alegi", 8)} from={[640, 500]} to={[1400, 560]} out={T_PAY - 4}>
        <Bubble t="Perfect, te aștept!" me />
      </Pop>

      {/* pay safely */}
      <Pop at={T_PAY + 4} from={[640, 420]} to={[1330, 500]} out={V("cash", 0) - 2}>
        <div style={{ width: 780 }}>
          <IOSGroup
            w={780}
            k={2.05}
            header="Plată"
            rows={[
              { icon: <IOSIcon n="box" color={IOSC.orange} size={58} />, title: "Montaj dulap", value: "150 lei" },
              { icon: <IOSIcon n="shield" color={IOSC.green} size={58} />, title: "Plată protejată", acc: "toggle", on: clamp01((f - (T_PAY + 14)) / 8) },
            ]}
          />
          <div style={{ marginTop: 22 }}>
            <PillBtn label={f > paid + 2 ? "Plătit" : "Plătește"} icon={f > paid + 2 ? "check" : "lock"} w={780} h={100} size={34} press={f >= paid - 3 && f <= paid + 5 ? Math.sin((Math.PI * (f - paid + 3)) / 8) : 0} on={clamp01((f - paid) / 6)} />
          </div>
        </div>
      </Pop>
      <Cursor keys={[{ f: T_PAY + 10, x: 1750, y: 980 }, { f: paid - 3, x: 1370, y: 790 }, { f: V("cash", 0), x: 1440, y: 900 }]} clicks={[paid]} hideAt={V("cash", 0) - 6} />

      {/* no cash that vanishes */}
      <Cash />

      {/* live */}
      <Pop at={V("urmaresti", 2) - 2} from={[960, 420]} to={[1440, 330]} out={SWOOSH - 2}>
        <IOSGroup w={720} k={2.05} rows={[{ icon: <IOSIcon n="pin" color={IOSC.blue} size={58} />, title: "Mihai ajunge", value: "în 4 min", acc: <div style={{ width: 16, height: 16, borderRadius: 8, background: RED, opacity: 0.6 + 0.4 * Math.sin(f / 4) }} /> }]} />
      </Pop>
    </AbsoluteFill>
  );
};

/** banknotes that are crossed out, then crumble away */
const Cash: React.FC = () => {
  const f = useCurrentFrame();
  const at = V("cash", 0) - 4;
  if (f < at || f > V("urmaresti", 0)) return null;
  const e = spring(clamp01((f - at) / 22));
  const strike = io3(clamp01((f - V("cash", 1)) / 8));
  const crumble = clamp01((f - V("cash", 3)) / 22);
  return (
    <div style={{ position: "absolute", left: 1320 - 230, top: 540 - 140 + (1 - e) * 120, width: 460, height: 280, opacity: clamp01((f - at) / 4) }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ position: "absolute", left: 30 + i * 16, top: 40 - i * 12, width: 380, height: 190, borderRadius: 16, transform: `rotate(${-8 + i * 6}deg) translate(${crumble * crumble * (300 + i * 80)}px, ${-crumble * 90 * (i - 1)}px)`, opacity: 1 - crumble, filter: crumble > 0 ? `blur(${crumble * 10}px)` : undefined, background: "linear-gradient(135deg, #cfe9d6 0%, #a9d7b7 100%)", boxShadow: "0 8px 20px rgba(0,0,0,0.1), inset 0 0 0 6px rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 26px", boxSizing: "border-box", fontFamily: UI }}>
          <div style={{ width: 92, height: 92, borderRadius: 46, border: "4px solid rgba(40,110,70,0.35)" }} />
          <div style={{ fontSize: 64, fontWeight: 700, color: "rgba(30,100,60,0.55)", letterSpacing: "-0.03em" }}>100</div>
        </div>
      ))}
      {crumble > 0 &&
        Array.from({ length: 34 }, (_, i) => {
          const sx = 60 + seeded(i, 3) * 360, sy = 60 + seeded(i, 4) * 170;
          const d = crumble * (200 + seeded(i, 5) * 500);
          return <div key={i} style={{ position: "absolute", left: sx + d, top: sy - d * (0.2 + seeded(i, 6) * 0.5), width: 6 + seeded(i, 7) * 10, height: 6 + seeded(i, 7) * 10, borderRadius: 3, background: "#b6dcc2", opacity: (1 - crumble) * 1.2, transform: `rotate(${crumble * 300 * seeded(i, 8)}deg)` }} />;
        })}
      <svg width={460} height={280} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: 1 - crumble }}>
        <path d="M30 240 L430 40" stroke={RED} strokeWidth={14} strokeLinecap="round" strokeDasharray={450} strokeDashoffset={450 * (1 - strike)} />
      </svg>
    </div>
  );
};

// ------------------------------------------------------------------ the map: verified taskers around you, the offers flying in
const MW = 2800, MH = 1900;
const ME: [number, number] = [1400, 980];
type Pin = { p: Person | null; at: number; x: number; y: number; price: string; name: string };
const PINS: Pin[] = [
  { p: "mihai", name: "Mihai D.", at: V("taskeri", 0), x: 1180, y: 760, price: "150 lei" },
  { p: "andrei", name: "Andrei P.", at: V("taskeri", 0) + 5, x: 1720, y: 820, price: "170 lei" },
  { p: "radu", name: "Radu S.", at: V("taskeri", 1), x: 1520, y: 1230, price: "160 lei" },
  { p: null, name: "", at: V("taskeri", 1) + 6, x: 980, y: 1180, price: "" },
  { p: null, name: "", at: V("taskeri", 2), x: 1900, y: 1130, price: "" },
];
const MapArt: React.FC = () => (
  <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{ position: "absolute", inset: 0 }}>
    <rect width={MW} height={MH} fill="#f5f2ec" />
    {/* parks and a river */}
    <path d="M0 1500 C 500 1380, 900 1650, 1400 1560 S 2300 1420, 2800 1520 L2800 1900 L0 1900 Z" fill="#b9dcf5" />
    <path d="M0 1520 C 500 1400, 900 1670, 1400 1580 S 2300 1440, 2800 1540" fill="none" stroke="#a6d0ef" strokeWidth={6} />
    <rect x={260} y={300} width={520} height={380} rx={60} fill="#d3ebc6" />
    <rect x={2000} y={420} width={460} height={520} rx={70} fill="#d3ebc6" />
    <circle cx={1650} cy={420} r={150} fill="#d3ebc6" />
    {/* blocks */}
    {Array.from({ length: 22 }, (_, r) =>
      Array.from({ length: 30 }, (_, c) => {
        const x = c * 96 + 10 + (r % 2) * 20, y = r * 74 + 8;
        if ((x > 250 && x < 790 && y > 290 && y < 690) || (x > 1990 && x < 2470 && y > 410 && y < 950) || y > 1440) return null;
        return <rect key={`${r}-${c}`} x={x} y={y} width={72 - (seeded(r * 31 + c, 2) * 18)} height={54 - seeded(r * 17 + c, 3) * 14} rx={6} fill={seeded(r * 7 + c, 4) > 0.82 ? "#ebe6dd" : "#efebe4"} />;
      })
    )}
    {/* streets, then the boulevards (Apple's warm yellow) */}
    {[200, 520, 840, 1160, 1380].map((y, i) => <path key={`h${i}`} d={`M-20 ${y} L${MW + 20} ${y + (i % 2 ? 30 : -20)}`} stroke="#ffffff" strokeWidth={16} />)}
    {[300, 820, 1300, 1840, 2350].map((x, i) => <path key={`v${i}`} d={`M${x} -20 L${x + (i % 2 ? 40 : -30)} ${MH + 20}`} stroke="#ffffff" strokeWidth={16} />)}
    <path d={`M-20 980 C 700 940, 1100 1010, 1600 960 S 2400 900, ${MW + 20} 940`} stroke="#ead7a0" strokeWidth={34} fill="none" />
    <path d={`M-20 980 C 700 940, 1100 1010, 1600 960 S 2400 900, ${MW + 20} 940`} stroke="#fde7a6" strokeWidth={26} fill="none" />
    <path d={`M1050 -20 C 1100 500, 1000 900, 1150 1400 S 1200 1800, 1180 ${MH + 20}`} stroke="#ead7a0" strokeWidth={30} fill="none" />
    <path d={`M1050 -20 C 1100 500, 1000 900, 1150 1400 S 1200 1800, 1180 ${MH + 20}`} stroke="#fde7a6" strokeWidth={22} fill="none" />
  </svg>
);
export const MapShot: React.FC = () => {
  const f = useCurrentFrame();
  const out = PHONE_BACK - 4;
  if (f < MAP_IN - 2 || f > out + 14) return null;
  const e = io3(clamp01((f - MAP_IN) / 22));
  const leave = io3(clamp01((f - out) / 12));
  const pick = io3(clamp01((f - PICK) / 26));
  // camera: comes down onto the map, drifts, then leans toward Mihai when he's picked
  const th = (lerp(58, 42, e) + 6 * leave) * (Math.PI / 180);
  const z = lerp(0.62, 0.78, e) + 0.0004 * (f - MAP_IN) + 0.18 * pick + 0.25 * leave;
  const cx = lerp(ME[0], lerp(ME[0], PINS[0].x, 0.6), pick), cy = lerp(ME[1], lerp(ME[1], PINS[0].y, 0.6), pick);
  const P = 1800;
  const proj = (mx: number, my: number): [number, number, number] => {
    const u = (mx - cx) * z, v = (my - cy) * z;
    const y1 = v * Math.cos(th), z1 = v * Math.sin(th);
    const k = P / (P - z1);
    return [960 + u * k, 600 + y1 * k, k];
  };
  const [ux, uy, uk] = proj(ME[0], ME[1]);
  const offersAt = V("taskeri", 6) - 4;
  const zone = io3(clamp01((f - (V("taskeri", 2) - 2)) / 18));
  const nOff = PINS.filter((p, i) => p.p && f > offersAt + i * 5 + 16).length;
  const sheet = spring(clamp01((f - (PICK + 6)) / 22));
  return (
    <AbsoluteFill style={{ opacity: clamp01((f - MAP_IN + 2) / 6) * (1 - leave), filter: leave > 0 ? `blur(${leave * 10}px)` : undefined, overflow: "hidden", background: "#f5f2ec" }}>
      <AbsoluteFill style={{ perspective: P, perspectiveOrigin: "960px 600px" }}>
        <div style={{ position: "absolute", left: 960 - (cx - 0) , top: 600 - cy, width: MW, height: MH, transformOrigin: `${cx}px ${cy}px`, transform: `rotateX(${(th * 180) / Math.PI}deg) scale(${z})` }}>
          <MapArt />
          {/* the area around you */}
          <div style={{ position: "absolute", left: ME[0] - 520 * zone, top: ME[1] - 520 * zone, width: 1040 * zone, height: 1040 * zone, borderRadius: "50%", background: "rgba(0,122,255,0.07)", border: "4px solid rgba(0,122,255,0.25)" }} />
          {/* the routes of the offers */}
          <svg width={MW} height={MH} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            {PINS.map((p, i) => {
              if (!p.p) return null;
              const t = clamp01((f - (offersAt + i * 5)) / 16);
              if (t <= 0) return null;
              const mx = (p.x + ME[0]) / 2, my = Math.min(p.y, ME[1]) - 180;
              return <path key={i} d={`M${p.x} ${p.y} Q ${mx} ${my} ${ME[0]} ${ME[1]}`} fill="none" stroke={IOSC.blue} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 20" pathLength={1000} strokeDashoffset={-f * 3} opacity={0.8 * (1 - clamp01((f - (offersAt + 40)) / 14))} />;
            })}
          </svg>
        </div>
      </AbsoluteFill>
      {/* you */}
      <div style={{ position: "absolute", left: ux, top: uy, transform: "translate(-50%, -50%)" }}>
        <div style={{ position: "absolute", left: -60 * uk, top: -60 * uk, width: 120 * uk, height: 120 * uk, borderRadius: "50%", background: "rgba(0,122,255,0.18)", transform: `scale(${0.6 + 0.4 * ((f % 40) / 40)})`, opacity: 1 - (f % 40) / 40 }} />
        <div style={{ width: 34 * uk, height: 34 * uk, borderRadius: "50%", background: IOSC.blue, border: `${6 * uk}px solid #fff`, boxShadow: "0 3px 10px rgba(0,0,0,0.25)" }} />
        {nOff > 0 && <div style={{ position: "absolute", left: 22 * uk, top: -40 * uk, minWidth: 40, height: 40, padding: "0 12px", borderRadius: 20, background: RED, color: "#fff", fontFamily: UI, fontWeight: 600, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${spring(clamp01((f - (offersAt + 16)) / 12))})`, whiteSpace: "nowrap" }}>{nOff} {nOff === 1 ? "ofertă" : "oferte"}</div>}
      </div>
      {/* the taskers: Find My–style pins, standing up off the map */}
      {PINS.map((p, i) => {
        if (f < p.at) return null;
        const [x, y, k] = proj(p.x, p.y);
        const d = spring(clamp01((f - p.at) / 20));
        const sel = i === 0 ? pick : 0;
        const ver = spring(clamp01((f - (V("taskeri", 1) + i * 2)) / 14));
        const S = (p.p ? 128 : 52) * k * (1 + 0.25 * sel);
        const offT = clamp01((f - (V("taskeri", 6) - 4 + i * 5)) / 16);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
            <div style={{ position: "absolute", left: -S * 0.4, top: -6, width: S * 0.8, height: 14, borderRadius: "50%", background: "rgba(0,0,0,0.18)", filter: "blur(4px)", transform: `scale(${d})` }} />
            <div style={{ position: "absolute", left: -S / 2, top: -S - 18 * k - (1 - d) * 160, width: S, height: S, opacity: clamp01((f - p.at) / 3) }}>
              {p.p ? (
                <>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", boxShadow: sel > 0 ? `0 0 0 ${6 * sel}px ${GREEN}, 0 8px 18px rgba(0,0,0,0.22)` : "0 8px 18px rgba(0,0,0,0.22)" }} />
                  <div style={{ position: "absolute", left: 7 * k, top: 7 * k }}>
                    <Avatar person={p.p} size={S - 14 * k} dark={false} ring="#fff" />
                  </div>
                  <div style={{ position: "absolute", left: S / 2 - 11 * k, top: S - 6 * k, width: 0, height: 0, borderLeft: `${11 * k}px solid transparent`, borderRight: `${11 * k}px solid transparent`, borderTop: `${16 * k}px solid #fff` }} />
                  <div style={{ position: "absolute", right: -6 * k, top: -6 * k, transform: `scale(${ver})` }}>
                    <Verified size={36 * k} />
                  </div>
                  {/* the offer: a price bubble that goes off toward you */}
                  {offT > 0 && offT < 1 && (
                    <div style={{ position: "absolute", left: S / 2 + (ux - x) * io3(offT), top: -50 * k + (uy - y + S) * io3(offT) - Math.sin(Math.PI * offT) * 120, transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * spring(clamp01(offT * 3))) * (1 - 0.6 * offT * offT)})`, padding: "10px 18px", borderRadius: 20, background: "#fff", boxShadow: cardShadow(0.8), fontFamily: UI, fontSize: 26, fontWeight: 600, color: "#000", whiteSpace: "nowrap", display: "flex", gap: 8, alignItems: "center" }}>
                      <Sym n="msg" size={22} color={IOSC.blue} w={2.4} /> {p.price}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#fff", boxShadow: "0 6px 14px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "62%", height: "62%", borderRadius: "50%", background: "linear-gradient(180deg, #a5abb6 0%, #858b96 100%)" }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {/* the search bar, Apple Maps–style */}
      <div style={{ position: "absolute", left: 960 - 380, top: 60 - (1 - e) * 140, width: 760, height: 84, borderRadius: 26, background: "rgba(255,255,255,0.96)", boxShadow: cardShadow(1), display: "flex", alignItems: "center", gap: 16, padding: "0 26px", boxSizing: "border-box", fontFamily: UI, fontSize: 29, color: "#000" }}>
        <Sym n="search" size={30} color="#8a8a8e" w={2.4} />
        Taskeri verificați lângă tine
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: IOSC.green, fontSize: 24, fontWeight: 600 }}>
          <Verified size={28} /> {Math.min(5, PINS.filter((p) => f >= p.at).length)}
        </div>
      </div>
      {/* picking Mihai: an iOS sheet comes up */}
      {sheet > 0 && (
        <div style={{ position: "absolute", left: 960 - 480, top: 1080 - 300 * sheet, width: 960, height: 340, borderRadius: "40px 40px 0 0", background: "#fff", boxShadow: "0 -8px 30px rgba(0,0,0,0.12)", fontFamily: UI, padding: "16px 36px", boxSizing: "border-box" }}>
          <div style={{ width: 60, height: 7, borderRadius: 4, background: "#d1d1d6", margin: "0 auto 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Avatar person="mihai" size={96} dark={false} ring="#fff" />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>Mihai D. <Verified size={32} /></div>
              <div style={{ fontSize: 24, color: "#8a8a8e", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Sym n="star" size={22} color="#ff9f0a" fill="#ff9f0a" w={1} /> 4,9 · 312 recenzii · 1,2 km
              </div>
            </div>
            <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em" }}>150 lei</div>
          </div>
          <div style={{ marginTop: 26, height: 80, borderRadius: 18, background: IOSC.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 600, transform: `scale(${1 - 0.04 * Math.sin(Math.PI * clamp01((f - (PICK + 20)) / 8))})` }}>Alege-l pe Mihai</div>
        </div>
      )}
      <Cursor keys={[{ f: PICK - 20, x: 1650, y: 980 }, { f: PICK - 3, x: proj(PINS[0].x, PINS[0].y)[0] + 10, y: proj(PINS[0].x, PINS[0].y)[1] - 70 }, { f: PICK + 18, x: 960, y: 1000 }]} clicks={[PICK, PICK + 20]} hideAt={PICK + 30} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the swoosh that becomes the progress bar, then "Gata" ✓ + confetti
export const Track: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SWOOSH - 2) return null;
  const sw = clamp01((f - SWOOSH) / 12);
  const fill = io3(clamp01((f - (SWOOSH + 8)) / (GATA - SWOOSH - 10)));
  const pct = Math.round(lerp(38, 100, fill));
  const gone = clamp01((f - GATA) / 4);
  const th = lerp(560, 92, outExpo(sw));
  const len = lerp(200, 1500, outExpo(sw));
  return (
    <AbsoluteFill>
      {f < GATA + 4 && (
        <AbsoluteFill style={{ opacity: 1 - gone }}>
          {sw < 1 && <div style={{ position: "absolute", left: -60 - (1 - sw) * 600, top: 600 - th / 2, width: len + 200, height: th, borderRadius: th / 2, background: `linear-gradient(90deg, rgba(0,191,99,0) 0%, #4fdc98 30%, ${GREEN} 70%, #63e7ad 100%)`, filter: `blur(${(1 - sw) * 18}px)`, opacity: 0.9 }} />}
          {sw > 0.6 && (
            <>
              <ProgressBar x={-60} y={600} w={1770} h={92} p={lerp(0.38, 1, fill)} />
              <div style={{ position: "absolute", right: 1920 - 1710, top: 340, fontFamily: UI, fontWeight: 500, fontSize: 150, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "baseline" }}>
                <span style={{ backgroundImage: `linear-gradient(90deg, #00ae59 0%, #4ade9a 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{pct}</span>
                <span style={{ color: "#cfd5d2" }}>/100</span>
              </div>
            </>
          )}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/** "Gata" ✓, then "Fără bătaie de cap. Fără stres." over the check — until everything stops dead */
export const Done: React.FC = () => {
  const f = useCurrentFrame();
  if (f < GATA || f >= STOP_F) return null;
  const t = clamp01((f - GATA) / 22);
  return (
    <AbsoluteFill>
      <RefLine size={92} y={400} words={[{ t: "Gata", at: GATA, acc: true }]} out={V("fara1", 0) - 6} exit="blur" drift={-0.02} />
      <RefLine
        size={80}
        y={400}
        words={[
          { t: "Fără", at: V("fara1", 0) },
          { t: "bătaie", at: V("fara1", 1), acc: true },
          { t: "de", at: V("fara1", 2), acc: true },
          { t: "cap.", at: V("fara1", 3), acc: true },
          { t: "Fără", at: V("fara2", 0) },
          { t: "stres.", at: V("fara2", 1), acc: true },
        ]}
        drift={0.015}
      />
      <div style={{ position: "absolute", left: 960 - 85, top: 640 - 85 }}>
        <CheckCircle size={170} t={t} />
      </div>
      <Shards at={GATA} x={960} y={600} n={44} />
    </AbsoluteFill>
  );
};
export { pEnd };
