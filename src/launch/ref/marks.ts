import { iw } from "../introTimes";
import { BEATS, BREAK, BRIDGE, DROP, END_HIT, F, FINAL, TOTAL, pEnd, pStart, w } from "../timeline";

// the cut list of the reference-style film (frames), shared by the picture and the sound cue sheet
type PK = Parameters<typeof w>[0];
export const I = (k: string, i = 0) => iw(k, i) - 2;
export const V = (k: PK, i = 0) => w(k, i) - 2;
export const D0 = F(DROP);
export const bt = (k: number) => Math.round(D0 + k * BEATS);

export const R1_END = I("priza", 0) - 4;
export const R2_END = I("timpul", 3) - 6;
export const R3_END = I("amani", 0) - 8;
export const R4_END = I("speri", 0) - 4;
export const R5_END = pStart("lumea") - 6;
export const R6_END = pStart("obositor") - 4;
export const R7_END = V("rogi", 0) - 2;
export const R8_END = V("aici", 0) - 4;
export const DROP_END = bt(4) - 9;
export const PHONE_IN = DROP_END;
export const SWOOSH = V("urmaresti", 4) + 6;
export const GATA = V("urmaresti", 8);
export const B_END = BRIDGE;
export const C1_END = V("daca", 0) - 4;
export const C2_END = V("skills", 0) - 6;
export const C3_END = V("cont", 0) - 4;
export const BUILD = pEnd("muncesti") + 6;
export const BREAK_F = BREAK;
export const FINAL_F = FINAL;
export const F1_START = bt(Math.round((FINAL - D0) / BEATS) + 2) - 4;
export const CTA = V("cta", 0) - 8;
export const STAR = V("cta", 3);
export const END_FLY = END_HIT - 26;
export { BRIDGE, END_HIT, TOTAL, pEnd, pStart, w };
