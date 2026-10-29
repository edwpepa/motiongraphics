import { iw } from "../introTimes";
import { BEATS, BREAK, BRIDGE, BUILD, DROP, END_HIT, F, FINAL, STOP, TOTAL, pEnd, pStart, w } from "../timeline";

// the cut list of the reference-style film (frames), shared by the picture and the sound cue sheet
type PK = Parameters<typeof w>[0];
export const I = (k: string, i = 0) => iw(k, i) - 2;
export const V = (k: PK, i = 0) => w(k, i) - 2;
export const D0 = F(DROP);
/** beat k of the first half (the drop is beat 0) */
export const bt = (k: number) => Math.round(D0 + k * BEATS);
/** beat k of the second half (the song restarts on "Dar") */
export const bt2 = (k: number) => Math.round(BRIDGE + k * BEATS);
/** the grid a frame lives on */
const grid = (f: number) => (f >= STOP ? BRIDGE : D0);
/** a cut moves back onto the beat just before it, if that beat is close */
export const onBeat = (f: number, reach = 6) => {
  const g = grid(f);
  const b = Math.round(g + Math.floor((f - g) / BEATS + 1e-6) * BEATS);
  return f - b <= reach ? b : f;
};
/** 1 on every beat while the song plays, decaying (nothing in the charge, the dead stop or the break) */
export const PRE_SILENT = pStart("aici") - 6;
export const beatPulse = (f: number, len = 7) => {
  if ((f >= PRE_SILENT && f < D0) || (f >= STOP && f < BRIDGE) || (f >= BREAK && f < FINAL) || f >= END_HIT) return 0;
  const g = grid(f);
  const k = Math.floor((f - g) / BEATS);
  const t = (f - (g + k * BEATS)) / len;
  return t >= 0 && t < 1 ? (1 - t) ** 2 : 0;
};

export const R1_END = onBeat(I("priza", 0) - 4);
export const R2_END = onBeat(I("timpul", 3) - 6);
export const R3_END = onBeat(I("amani", 0) - 8);
export const R4_END = onBeat(I("speri", 0) - 4);
export const R5_END = onBeat(pStart("lumea") - 6);
export const R6_END = onBeat(pStart("obositor") - 4);
export const R7_END = onBeat(V("rogi", 0) - 2);
export const R8_END = onBeat(V("aici", 0) - 4);
export const DROP_END = bt(4) - 9;
export const PHONE_IN = DROP_END;
export const MAP_IN = onBeat(V("taskeri", 0) - 8);
export const PICK = V("alegi", 1);
export const PHONE_BACK = onBeat(V("alegi", 5) - 10);
export const SWOOSH = V("urmaresti", 4) + 6;
export const GATA = V("urmaresti", 8);
export const STOP_F = STOP;
export const B_END = BRIDGE;
export const C1_END = onBeat(V("daca", 0) - 4);
export const C2_END = onBeat(V("skills", 0) - 6);
export const C3_END = onBeat(V("cont", 0) - 4);
export { BUILD };
export const BREAK_F = BREAK;
export const FINAL_F = FINAL;
export const F1_START = V("ajutor", 0) - 4;
export const CTA = V("cta", 0) - 8;
export const STAR = V("cta", 3);
export const END_FLY = END_HIT - 26;
export { BRIDGE, END_HIT, TOTAL, pEnd, pStart, w };
