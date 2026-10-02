export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  green: "#00bf63",
  greenDark: "#00572c",
  black: "#000000",
  white: "#ffffff",
};

// Pre-roll before the voiceover starts (silent beat for the first element to "breathe in")
export const PRE_ROLL = 6; // 0.2s @ 30fps

// Scene timing derived from silence-detection analysis of the ElevenLabs voiceover
// (public/audio/voiceover.mp3, total 24.686s). All values are frame numbers at 30fps,
// offset by PRE_ROLL so audio starts at frame PRE_ROLL.
export const T = {
  audioStart: PRE_ROLL,

  s1: { start: 6, end: 141 }, // "Te tot gândești la treaba aia obositoare prin casă... pe care o tot amâni?"
  s1Beat: 92, // ellipsis pause

  s2: { start: 141, end: 292 }, // "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit."
  s2Beats: [141, 194, 241, 292], // robinet / dulap / perete

  s3: { start: 292, end: 399 }, // "Postezi task-ul pe Handly — durează câteva secunde."
  s3Beat: 346, // dash pause

  s4: { start: 399, end: 581 }, // "Taskerii din zona ta văd task-ul, tu alegi cu cine lucrezi, la prețul stabilit chiar de voi doi."
  s4Beat: 471, // comma pause

  s5: { start: 581, end: 689 }, // "Fără tarife de firmă. Fără intermediari."
  s5Beats: [581, 664, 689],

  s6: { start: 689, end: 747 }, // "Handly. Postezi. Se rezolvă."
  s6Beats: [689, 715, 747],

  outroEnd: 792, // final hold with confetti settle
};

export const DURATION_IN_FRAMES = 810; // 27s @ 30fps
