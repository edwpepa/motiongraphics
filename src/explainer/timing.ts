// Timeline for the 16:9 explainer, driven by the provided ElevenLabs voiceover.
//
// Word onsets are in seconds of the *original* voiceover file and were measured from its
// waveform/spectrogram (silence gaps + energy dips per syllable). `f()` converts them to
// composition frames, including the short lead-in before the voice starts.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** Seconds of picture before the voiceover's first sample. */
export const VO_OFFSET = 0.4;

/** Voiceover-file seconds → composition frame. */
export const f = (sec: number) => Math.round((sec + VO_OFFSET) * FPS);

export type TimedWord = [text: string, sec: number];

export const VO = {
  // "Te tot gândești / la treaba aia / obositoare / prin casă..."
  hook: [
    ["Te", 0.1],
    ["tot", 0.37],
    ["gândești", 0.52],
    ["la", 1.34],
    ["treaba", 1.4],
    ["aia", 1.6],
    ["obositoare", 1.95],
    ["prin", 2.83],
    ["casă...", 2.95],
  ] as TimedWord[],
  hookEnd: 3.6,

  // "pe care o tot amâni?" — one calendar hop per syllable
  postpone: [
    ["pe", 3.69],
    ["care", 3.8],
    ["o", 4.0],
    ["tot", 4.2],
    ["amâni?", 4.37],
  ] as TimedWord[],
  postponeSyllables: [3.69, 3.8, 4.0, 4.2, 4.37, 4.55],
  postponeEnd: 4.77,

  chores: [5.41, 7.01, 8.52],
  choresEnd: 9.87,

  // [long pause] → the energetic half
  postezi: 10.79,
  taskul: 11.36,
  peHandly: 11.6,
  handlyWord: 11.78,
  postEnd: 12.35,
  dureaza: 12.7,
  cateva: 13.17,
  secunde: 13.73,
  secundeEnd: 14.03,

  taskerii: 14.42,
  dinZona: 14.85,
  vad: 15.41,
  vadTaskul: 15.95,
  radarEnd: 16.39,

  tuAlegi: 16.67,
  cuCine: 17.15,
  lucrezi: 17.63,
  laPretul: 18.14,
  stabilit: 18.38,
  chiar: 19.37,
  voiDoi: 19.7,
  doi: 19.9,
  pretEnd: 20.17,

  noFees: [
    ["Fără", 20.47],
    ["tarife", 20.75],
    ["de", 21.1],
    ["firmă.", 21.2],
  ] as TimedWord[],
  noMiddlemen: [
    ["Fără", 21.75],
    ["intermediari.", 22.05],
  ] as TimedWord[],
  noMiddlemenEnd: 23.0,

  handly: 23.39,
  postezi2: 24.12,
  seRezolva: 24.88,
  rezolva: 25.05,
  voEnd: 25.71,
};

// Score: 124 BPM; the drop lands on "Postează" (frame 336), the logo hit 8 bars later.
export const BPM = 124;
export const MUSIC_LIFT_FRAME = 336;
export const LOGO_HIT_FRAME = 800;

/** end card: the logo steps up and the store badges land */
export const CTA_FRAME = 864;

export const DURATION_IN_FRAMES = 1000;

/** cold open (radar + glass spheres) before the voiceover's timeline starts */
export const PRE_ROLL = 10;
export const TOTAL_FRAMES = DURATION_IN_FRAMES + PRE_ROLL;
