import { BEATS, BREAK, DROP, F, FINAL, pEnd, pStart, w } from "./timeline";

// Scene boundaries (frames), shared by the picture and the sound design.
export const A1_END = pStart("robinet") - 4;
export const A2_END = pStart("perete") - 3;
export const A3_END = w("situ", 0) - 2;
export const A4_END = w("nici1", 0) - 3;
export const A5_END = w("amani", 0) - 2;
export const A6_END = w("speri1", 0) - 3;
export const A7_END = pStart("lumea") - 8;
export const A8_END = pStart("obositor") - 2;
export const A9_END = w("rogi", 0) - 3;
export const A10_END = pEnd("rogi") + 14;
export const A12_END = F(DROP);
export const B1_END = pStart("postezi") - 6;
export const B2_END = pStart("taskeri") - 4;
export const B3_END = pStart("alegi") - 4;
export const B4_END = pStart("cash") - 4;
export const B5_END = pStart("urmaresti") - 4;
export const B6_END = pStart("fara1") - 4;
export const B7_END = pEnd("fara2") + 8;
export const C1_END = pStart("daca") - 4;
export const C2_END = pStart("skills") - 3;
export const C3_END = pStart("cont") - 4;
export const C4_END = pStart("program") - 4;
export const C5_END = pEnd("muncesti") + 10;
export const C8_END = pStart("cta") - 6;
export const C9_END = pEnd("cta") + 12;
/** the brand switch on the final drop lasts four beats, then the split screen */
export const SPLIT = Math.round(FINAL + 4 * BEATS);
/** beat-montage: shapes for five beats, then the brand switch until the bridge */
export const MONTAGE_SHAPES = 5;
export const C9_START = C8_END;
export const C10_START = C9_END;

/** suspense heartbeats (frames): slow to racing, from the end of "Tu alegi" to the break */
export const HEARTBEATS = (() => {
  const out: number[] = [];
  const a = C5_END + 4;
  const b = BREAK - 14;
  let f = a;
  while (f < b) {
    out.push(Math.round(f));
    const k = (f - a) / (b - a);
    f += 30 * (0.95 - 0.68 * k);
  }
  return out;
})();
/** "se rezolvă singur": the loader gives up, becomes a heart monitor, three fading beats, then flat */
export const ECG_FAIL = w("speri3", 0) - 6;
export const ECG_BEATS = [ECG_FAIL + 26, ECG_FAIL + 44, ECG_FAIL + 64];
export const ECG_FLAT = ECG_FAIL + 78;
