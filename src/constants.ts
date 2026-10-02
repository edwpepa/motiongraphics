export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COLORS = {
  green: "#00bf63",
  greenDark: "#00572c",
  greenPanel: "#063d22", // the app's dark-green hero-panel tone
  greenPanelDeep: "#02190e",
  greenTint: "#e6f7ee", // light green icon-circle fill, like the real app
  black: "#000000",
  white: "#ffffff",
  ink: "#10151a", // near-black text on light backgrounds
  gray: "#6b7280",
};

// The single mixed audio track (re-paced voice + original music bed, ducked/muffled
// under the voice) already contains its own 0.2s lead-in, so it starts at frame 0.
export const T = {
  s1: { start: 6, end: 137 }, // "Te tot gândești la treaba aia obositoare prin casă... pe care o tot amâni?"
  s1Beat: 101, // "pe care o tot amâni?"

  s2: { start: 146, end: 278 }, // "Un robinet care curge. Un dulap de montat. Un perete de zugrăvit."
  s2Beats: [146, 192, 235],

  s3: { start: 287, end: 384 }, // "Postezi task-ul pe handly.ro — durează câteva secunde."
  s3Beat: 334,

  s4: { start: 393, end: 572 }, // "Taskerii din zona ta văd task-ul, tu alegi cu cine lucrezi, la prețul stabilit chiar de voi doi."
  s4Beat: 464,

  s5: { start: 581, end: 678 }, // "Fără tarife de firmă. Fără intermediari."
  s5Beats: [581, 660, 678],

  s6: { start: 686, end: 738 }, // "Handly. Postezi. Se rezolvă."
  s6Beats: [686, 702, 738],

  musicHit: 742, // the composed music's riser/stab arrival — sync confetti + brand flash to this
  outroEnd: 784,
};

export const DURATION_IN_FRAMES = 800;
