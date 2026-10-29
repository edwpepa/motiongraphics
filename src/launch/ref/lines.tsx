import React from "react";
import { Img, staticFile } from "remotion";
import { iWords } from "../introTimes";
import { words } from "../timeline";
import type { Line, RW } from "./type";

// every line of on-screen text, word by word on the voice (the picture and the "bop" under each word read these)
type PK = Parameters<typeof words>[0];
const LEAD = 2;
const cap = (t: string) => t.charAt(0).toLocaleUpperCase("ro-RO") + t.slice(1);
/** words of intro phrases, in order */
const intro = (...keys: string[]): RW[] => keys.flatMap((k) => iWords(k, LEAD).map(([t, at]) => ({ t, at })));
/** words of voice-over phrases (optionally a slice) */
const vo = (key: PK, from = 0, to?: number): RW[] => words(key).slice(from, to).map(([t, at]) => ({ t, at: at - LEAD }));
const accent = (ws: RW[], ...which: string[]) => ws.map((w) => (w.t && which.includes(w.t.replace(/[.,?]/g, "")) ? { ...w, acc: true } : w));
const first = (ws: RW[]) => ws.map((w, i) => (i === 0 && w.t ? { ...w, t: cap(w.t) } : w));
const mark = (at: number, size: number): RW => ({ at, w: size * 1.05, node: () => <Img src={staticFile("images/logo.webp")} style={{ width: size, height: size, display: "block" }} /> });
const withMark = (ws: RW[], before: string, size: number): RW[] => ws.flatMap((w) => (w.t === before ? [mark(w.at - 2, size), w] : [w]));

export const LINES = {
  probleme: (): Line => ({ size: 88, breaks: [2], words: accent(intro("probleme"), "bătăi", "de", "cap") }),
  timpul: (): Line => ({ size: 80, breaks: [6], words: first(accent(intro("timpul", "sculele", "nervii"), "timpul", "sculele", "nervii")) }),
  speri: (): Line => ({ size: 88, breaks: [3], words: accent(intro("speri", "cumva", "singur"), "singur") }),
  obositor: (): Line => ({ size: 84, breaks: [2], words: accent(vo("obositor"), "cauți", "suni", "negociezi") }),
  rogi: (): Line => ({ size: 82, breaks: [4], words: first(accent(vo("rogi", 4), "păcălește")) }),
  aici: (): Line => ({ size: 88, maxW: 1600, words: withMark(accent(vo("aici"), "Handly"), "Handly.", 92) }),
  gata: (): Line => ({ size: 96, y: 400, words: [{ t: "Gata", at: vo("urmaresti", 8)[0].at, acc: true }] }),
  fara: (): Line => ({ size: 80, y: 400, maxW: 1500, words: accent([...vo("fara1"), ...vo("fara2")], "bătaie", "de", "cap", "stres") }),
  dar: (): Line => ({ size: 84, breaks: [5], dark: true, words: withMark(accent(vo("dar"), "Handly", "ajutor"), "Handly", 84) }),
  daca: (): Line => ({ size: 92, maxW: 1600, dark: true, words: accent(vo("daca"), "ceva") }),
  ajutor: (): Line => ({ size: 100, y: 470, maxW: 1700, words: accent(vo("ajutor"), "Ajutor") }),
  bani: (): Line => ({ size: 100, y: 610, maxW: 1700, words: accent(vo("bani"), "Bani") }),
};
export type LineKey = keyof typeof LINES;
