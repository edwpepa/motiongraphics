"""Mix for the EDW reel about simulated minds: the voiceover (tools/reel/align.py) + an original, quiet score in D minor
(a soft piano, warm pads, a glass pulse for "the process", choir for the big questions) written on the film's timeline,
and sound design that follows the picture. The day-ticks under "exponentially faster" are placed where the sun of the
simulated world completes each quarter turn (same formula as src/reel/sceneC.tsx). Writes public/audio/reel-mix.mp3."""
import json, math, os, subprocess, sys, tempfile
import numpy as np
import scipy.io.wavfile as wavfile

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "edw"))
import mix as M  # noqa: E402  (the brand film's instruments and sound design)

C, S, X = M.C, M.S, M.X
ROOT, SR = C.ROOT, C.SR
END = 74.5
N = int(END * SR)
W = json.load(open(os.path.join(ROOT, "src/reel/vo-words.json")))
T = lambda key, i=0: W[key]["words"][min(i, len(W[key]["words"]) - 1)][1]  # noqa: E731
rng = np.random.default_rng(29)
tt, norm = M.tt, M.norm

# i – VI – III – VII in D minor, voiced warm and open
DM9 = (38, [50, 57, 64, 65], [62, 69, 74, 76, 77, 76, 74, 69])
BBM7 = (34, [50, 53, 57, 62], [58, 65, 69, 72, 74, 72, 69, 65])
FM7A = (33, [53, 57, 60, 64], [57, 64, 65, 69, 72, 69, 65, 64])
CG = (31, [52, 55, 60, 62], [55, 62, 64, 67, 72, 67, 64, 62])
FMAJ = (41, [53, 57, 60, 64, 69], [65, 69, 72, 76, 77, 76, 72, 69])
BBLYD = (34, [58, 62, 65, 69, 76], [70, 74, 76, 81, 82, 81, 76, 74])


# ------------------------------------------------------------------ instruments
def piano(m, dur=3.6, vel=0.5):
    """A soft felt piano: stiff-string partials, two strings per note, prompt sound and aftersound, a little hammer."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = C.midi(m)
    B = 0.00011 * (f0 / 261.6) ** 1.2 + 0.00003
    tau0 = 3.4 * (261.6 / f0) ** 0.55
    y = np.zeros(n)
    for k in range(1, 18):
        fk = k * f0 * math.sqrt(1 + B * k * k)
        if fk > 10000:
            break
        amp = k ** -1.2 * vel ** (0.3 + 0.12 * k)
        tau = tau0 / (1 + 0.6 * (k - 1))
        env = 0.55 * np.exp(-t / (0.2 * tau)) + 0.45 * np.exp(-t / tau)
        ph = rng.uniform(0, 6.28)
        y += amp * env * (np.sin(2 * np.pi * fk * t + ph) + 0.75 * np.sin(2 * np.pi * fk * 1.0007 * t + ph * 1.7)) / 1.75
    hn = int(0.025 * SR)
    lo, hi = min(f0 * 2, 3000), min(f0 * 9, 11000)
    y[:hn] += C.filt(rng.standard_normal(hn), "bandpass", (lo, hi), 2) * np.exp(-np.arange(hn) / SR / 0.005) * 0.05 * vel
    # felt: a gentle low-pass that opens with velocity
    y = C.filt(y, "lowpass", 1800 + 5200 * vel, 1)
    y *= np.clip(t / 0.003, 0, 1) * np.clip((dur - t) / 0.35, 0, 1)
    return C.stereo(y * 0.5, float(np.clip((m - 64) / 36, -0.6, 0.6)))


def warm(notes, dur, attack=1.6, release=2.2, bright=0.5):
    """An organ-like sine pad: pure, slow, a slight chorus between the ears."""
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for m in notes:
        f = C.midi(m)
        for ch, d in ((0, -0.0022), (1, 0.0022)):
            vib = 1 + 0.0016 * np.sin(2 * np.pi * (0.19 + 0.04 * ch) * t + m)
            ph = 2 * np.pi * np.cumsum(f * (1 + d) * vib) / SR + rng.uniform(0, 6.28)
            out[ch] += np.sin(ph) + bright * 0.42 * np.sin(2 * ph) + bright ** 2 * 0.18 * np.sin(3 * ph) + bright ** 3 * 0.07 * np.sin(4 * ph)
    env = np.minimum(np.clip(t / attack, 0, 1), np.clip((dur + release - t) / release, 0, 1)) ** 1.6
    return out * env[None, :] / len(notes)


def strings(notes, dur, attack=1.2, release=1.8, cutoff=1400):
    return S.pad(notes, dur, attack=attack, release=release, cutoff=cutoff)


def glint(m, vel=0.5, tau=0.16):
    """The glass pulse: a short, pure pluck."""
    d = 0.7
    t = tt(d)
    f = C.midi(m)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / tau) + 0.32 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / (tau * 0.45)) + 0.1 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t / (tau * 0.25))
    return y * np.clip(t / 0.003, 0, 1) * vel


def sub(m, dur, attack=0.5, release=1.4):
    t = tt(dur + release)
    f = C.midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(np.clip(t / attack, 0, 1), np.clip((dur + release - t) / release, 0, 1))
    return np.tanh(y * env * 1.1)


def bellnote(m, vel=0.4, tau=1.4):
    return C.bell(m, tau * 2.5, ratio=3.5, index=0.9, tau=tau) * vel


def air(d, f0=500, f1=7000, peak=0.85):
    """A long breath of air rising to a crest."""
    n = int(d * SR)
    xb = np.linspace(0, 1, int(math.ceil(n / 256)))
    y = C.swept(rng.standard_normal(n), "bandpass", [(f0 * (f1 / f0) ** k * 0.6, min(18000, f0 * (f1 / f0) ** k * 1.6)) for k in xb])
    x = np.arange(n) / n
    env = np.where(x < peak, (x / peak) ** 2, 1 - (x - peak) / (1 - peak)) ** 1.2
    return C.stereo_sweep(norm(y * env) * 0.6, -0.3, 0.3)


# ------------------------------------------------------------------ the day-ticks: the sun of the simulated world (sceneC.tsx)
T_SUN, T_ACC, W0, K, WMAX = 37.35, 38.85, 1.4, 1.85, 120.0
T_CAP = T_ACC + math.log(WMAX / W0) / K


def phi(t):
    if t <= T_SUN:
        return 0.0
    if t <= T_ACC:
        return W0 * (t - T_SUN)
    a = W0 * (T_ACC - T_SUN)
    if t <= T_CAP:
        return a + W0 / K * (math.exp(K * (t - T_ACC)) - 1)
    return a + W0 / K * (math.exp(K * (T_CAP - T_ACC)) - 1) + WMAX * (t - T_CAP)


def omega(t):
    return 0.0 if t <= T_SUN else W0 if t <= T_ACC else min(WMAX, W0 * math.exp(K * (t - T_ACC)))


# ------------------------------------------------------------------ the score
def score():
    B = {k: np.zeros((2, N)) for k in ("piano", "pad", "pulse", "low", "choir", "bell")}

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def chord(ch, at, dur, g=1.0, cutoff=1300, bright=0.45, attack=1.4, release=2.0, low=True):
        root, tones, _ = ch
        place("pad", warm(tones, dur, attack, release, bright), at, 0.55 * g)
        place("pad", strings(tones, dur, attack * 0.9, release, cutoff), at, 0.4 * g)
        if low:
            place("low", sub(root, dur, attack * 0.6, release), at, 0.38 * g)

    def pn(m, at, vel=0.45, dur=4.0):
        place("piano", piano(m, dur, vel), at)

    def arps(timeline, a, b, step, v0, v1, octave=0):
        """8th-note broken chords following a chord timeline [(start, chord), ...]"""
        k = 0
        t = a
        while t < b - 0.01:
            ch = [c for s, c in timeline if s <= t + 1e-6][-1]
            m = ch[2][k % 8] + octave
            x = (t - a) / max(0.01, b - a)
            pn(m, t, v0 + (v1 - v0) * x, 2.4)
            k += 1
            t += step

    # A. people (0 – 20.2): rubato, the piano alone over pads; broken chords once the tree grows
    A = [(0.0, DM9), (4.6, BBM7), (9.3, FM7A), (11.3, CG), (14.6, DM9), (16.0, BBM7), (18.0, FM7A)]
    ends = [s for s, _ in A[1:]] + [20.15]
    for (s, ch), e in zip(A, ends):
        chord(ch, s, e - s + 0.3, 0.75 if s < 11 else 0.9, cutoff=900 if s < 11 else 1300, attack=2.5 if s == 0 else 1.2)
    place("low", sub(26, 4.6, 2.0, 1.5), 0.0, 0.3)
    for m, at, v in ((69, 0.9, 0.32), (50, 0.9, 0.25), (77, 2.05, 0.38), (76, 2.75, 0.33), (74, 3.6, 0.4), (58, T("laugh", 0), 0.3), (74, T("laugh", 0), 0.38),
                     (72, T("laugh", 6), 0.36), (69, T("laugh", 11), 0.34), (65, T("laugh", 16), 0.3), (69, T("laugh", 16) + 0.02, 0.3), (57, T("genes", 0), 0.28),
                     (76, T("genes", 0), 0.34), (72, T("genes", 6), 0.33), (55, 11.4, 0.3), (74, 11.4, 0.36), (76, T("parents", 7), 0.36), (74, T("parents", 9), 0.34),
                     (62, T("place", 0), 0.3), (77, T("place", 0), 0.38), (74, T("idea", 1), 0.36), (77, T("idea", 2), 0.4), (76, T("idea", 5), 0.38), (72, T("idea", 12), 0.36), (69, T("idea", 12) + 0.03, 0.3)):
        pn(m, at, v)
    arps(A, 11.4, 20.1, 0.375, 0.12, 0.24)

    # B. the process (20.2 – 35.2): a glass pulse at 80 bpm, the world and its minds
    G0, BAR = 20.2, 3.0
    Bc = [(G0, DM9), (G0 + BAR, BBM7), (G0 + 2 * BAR, FM7A), (G0 + 3 * BAR, CG), (G0 + 4 * BAR, DM9)]
    for i, (s, ch) in enumerate(Bc):
        x = i / 4
        chord(ch, s, BAR + 0.2 if i < 4 else 2.9, 0.9 + 0.3 * x, cutoff=1000 + 1800 * x, bright=0.4 + 0.25 * x, attack=0.9, release=1.6 if i < 4 else 0.35)
    for i in range(int((35.15 - G0) / 0.1875)):
        at = G0 + i * 0.1875
        ch = [c for s, c in Bc if s <= at + 1e-6][-1]
        tones = sorted(ch[1])
        pat = [tones[0] + 24, tones[2] + 12, tones[1] + 24, tones[2] + 12, tones[3] + 12, tones[2] + 12, tones[1] + 24, tones[2] + 12]
        x = (at - G0) / (35.15 - G0)
        place("pulse", glint(pat[i % 8], (0.09 + 0.2 * x) * (1.0 if i % 4 == 0 else 0.7)), at, 1.0, pan=(-0.35, 0.35)[i % 2])
    arps(Bc, T("world", 0), 35.1, 0.375, 0.14, 0.28)
    for m, at, v in ((74, T("imagine", 2), 0.36), (38, T("imagine", 7) - 0.02, 0.55), (50, T("imagine", 7) - 0.02, 0.45), (77, T("imagine", 8), 0.4), (81, T("imagine", 8) + 0.04, 0.32),
                     (74, T("world", 2), 0.38), (77, T("world", 5), 0.38), (76, T("world", 10), 0.36), (72, T("forms", 0), 0.38), (67, T("matures", 1), 0.34), (69, T("matures", 1) + 0.37, 0.34),
                     (72, T("matures", 5), 0.36), (74, T("alike", 0), 0.4), (76, T("alike", 5), 0.42), (77, T("alike", 7), 0.44)):
        pn(m, at, v)
    # the glyph's rings, one bell each
    for k, m in enumerate((81, 84, 86, 89, 93)):
        place("bell", bellnote(m, 0.18, 0.9), 28.95 + k * 0.2, 1.0, pan=(-0.4, 0.4)[k % 2])
    place("choir", S.choir([62, 69, 74], 3.0, attack=1.6), 32.2, 0.5)
    # C. "the part that changes everything" (36.18 – 46): a low D, the first sunrise, then the days racing
    chord(DM9, 36.25, 2.7, 0.75, cutoff=800, attack=1.6)
    place("bell", bellnote(86, 0.35, 1.6), T_SUN - 0.05, 1.0)
    Cc = [(38.8, BBM7), (41.0, FM7A), (43.0, CG)]
    for i, (s, ch) in enumerate(Cc):
        e = Cc[i + 1][0] if i + 1 < len(Cc) else 45.62
        chord(ch, s, e - s + 0.2, 0.8 + 0.35 * i, cutoff=1100 + 900 * i, bright=0.45 + 0.15 * i, attack=0.6, release=0.6 if i == 2 else 1.4)
    # a note at every quarter turn of their sun, until the turns blur
    k, last = 1, 0.0
    t = T_SUN
    while t < 45.5:
        if phi(t) >= k * math.pi / 2:
            gap = t - last
            if gap < 0.075:
                break
            ch = [c for s, c in [(36.0, DM9)] + Cc if s <= t][-1]
            tones = sorted(ch[1])
            m = tones[k % 4] + 24 + (12 if t > 40.0 else 0)
            place("pulse", glint(m, 0.22 + 0.12 * min(1, (t - T_SUN) / 4), tau=0.12), t, 1.0, pan=(-0.4, 0.4)[k % 2])
            last = t
            k += 1
        t += 0.002
    tb = t
    # past that, the days are a shimmer: a glass chord trembling at the rate the sun goes round
    d = 45.62 - tb
    tm = tt(d)
    rate = np.array([min(9.0, omega(tb + x) / (2 * np.pi)) for x in tm[::256]])
    rate = np.repeat(rate, 256)[: len(tm)]
    ph = 2 * np.pi * np.cumsum(rate) / SR
    trem = 0.65 + 0.35 * np.sin(ph)
    shim = sum(np.sin(2 * np.pi * C.midi(m) * tm + rng.uniform(0, 6)) for m in (84, 88, 91, 96)) / 4
    env = np.clip(tm / 0.4, 0, 1) * (0.5 + 0.5 * tm / d) * np.clip((d - tm) / 0.05, 0, 1)
    place("pulse", C.stereo_sweep(shim * trem * env * 0.35, -0.3, 0.3), tb, 1.0)
    arps([(36, DM9)] + Cc, T("days", 1), 45.55, 0.1875, 0.12, 0.3, 12)
    place("choir", S.choir([62, 69, 74, 77], 2.6, attack=2.0), 43.0, 0.45)
    # "... in a matter of days": arrival, the relative major, wide and warm
    DAYS = T("days", 13)
    chord(FMAJ, DAYS - 0.02, 4.4, 1.2, cutoff=2600, bright=0.6, attack=0.08, release=2.6)
    place("choir", S.choir([65, 69, 72, 77], 3.6, attack=0.15), DAYS - 0.02, 0.6)
    pn(41, DAYS - 0.02, 0.55, 5.0)
    pn(53, DAYS - 0.02, 0.45, 5.0)
    pn(81, DAYS + 0.02, 0.4, 4.0)

    # D. the questions (46.3 – 57.2): space, three planets, a god, things we can't picture
    chord(BBM7, 48.0, 3.2, 0.8, cutoff=1100)
    chord(DM9, 51.1, 1.45, 0.75, cutoff=1000)
    for m, at, v in ((74, T("lead", 0), 0.34), (72, T("lead", 3), 0.34), (69, T("rockets", 3), 0.34), (72, T("rockets", 7), 0.34), (77, T("rockets", 9), 0.36), (76, T("rockets", 12), 0.33)):
        pn(m, at, v)
    for m, at in ((86, T("rockets", 3) + 1.05), (89, T("rockets", 7) + 1.05), (93, T("rockets", 9) + 1.05)):
        place("bell", bellnote(m, 0.22, 1.1), at, 1.0, pan=0.3)
    # a god: the choir gathers and opens on the word
    place("choir", S.choir([62, 65, 69], 1.3, attack=0.9), T("god", 0), 0.55)
    GOD = T("god", 6)
    place("choir", S.choir([58, 62, 65, 70], 2.2, attack=0.12), GOD - 0.03, 0.75)
    chord((34, [46, 58, 62, 65], BBM7[2]), GOD - 0.03, 1.4, 1.0, cutoff=2000, bright=0.6, attack=0.1, release=1.6)
    # invention: Bb lydian, bells drifting through a ping-pong delay
    chord(BBLYD, 53.2, 3.9, 0.85, cutoff=1500, bright=0.55, attack=0.8, release=1.2)
    seq = [76, 81, 74, 82, 77, 86, 81, 88, 76, 82, 86, 93]
    bells = np.zeros((2, int(4.4 * SR)))
    for i, m in enumerate(seq):
        C.place(bells, C.stereo(bellnote(m, 0.2, 0.7), (-0.5, 0.5)[i % 2]), i * 0.32, 1.0)
    place("bell", C.delay_pingpong(bells, 0.48, 0.45, 4), T("invent", 3), 1.0)
    place("bell", bellnote(93, 0.3, 1.4), T("invent", 14), 1.0)
    place("bell", bellnote(98, 0.25, 1.4), T("invent", 16), 1.0)

    # E. twenty times greater (57.4 – 61.4): a slow climb and a wide arrival
    chord(DM9, 57.45, 1.3, 0.8, cutoff=900, attack=0.6, release=0.6)
    chord(BBM7, T("greater", 3), 1.2, 0.95, cutoff=1500, attack=0.3, release=0.6)
    chord(CG, T("greater", 5), 0.85, 1.05, cutoff=2100, attack=0.2, release=0.5)
    for i in range(10):
        at = 57.6 + i * 0.75 * (1 - 0.035 * i)
        if at > T("greater", 7) - 0.15:
            break
        place("low", M.taiko(29) * 0.5, at, 0.3 + 0.05 * i)
    GR = T("greater", 7)
    chord((34, [46, 53, 58, 62, 65, 70], BBM7[2]), GR - 0.03, 2.6, 1.3, cutoff=2600, bright=0.65, attack=0.05, release=2.0)
    place("choir", S.choir([58, 65, 70, 74], 2.8, attack=0.08), GR - 0.03, 0.7)
    place("low", sub(22, 2.0, 0.02, 1.6), GR - 0.03, 0.55)
    pn(34, GR - 0.03, 0.6, 5.0)
    pn(46, GR - 0.03, 0.5, 5.0)

    # F. something of theirs, falling into our world (61.75 – 65)
    chord(DM9, 61.6, 1.6, 0.75, cutoff=1000)
    chord(BBM7, 63.0, 1.2, 0.75, cutoff=1100)
    chord(FMAJ, T("today", 13) - 0.02, 1.4, 0.85, cutoff=1500, attack=0.3)
    for m, at, v in ((77, T("today", 1), 0.36), (76, T("today", 2), 0.34), (74, T("today", 5), 0.36), (72, T("today", 7), 0.34), (69, T("today", 12), 0.34), (65, T("today", 13), 0.36), (72, T("today", 13) + 0.02, 0.34)):
        pn(m, at, v)

    # G. the peak (65.2 – 68): the choir climbs and stays open
    chord(BBM7, 65.1, 1.0, 0.8, cutoff=1300)
    chord(CG, 66.1, 1.9, 0.95, cutoff=1800, bright=0.55)
    place("choir", S.choir([62, 67, 72], 2.6, attack=0.8), 65.2, 0.55)
    place("choir", S.choir([67, 72, 74], 1.6, attack=0.4), T("peak", 4), 0.4)
    pn(79, T("peak", 4), 0.38)
    pn(74, T("peak", 7), 0.34)
    pn(76, T("peak", 9), 0.34)

    # H. the bet, and the mark (68 – 74.5)
    chord(DM9, 68.0, 3.7, 0.7, cutoff=1000, attack=1.0)
    for m, at, v in ((74, T("comments", 0), 0.34), (77, T("comments", 4), 0.36), (76, T("comments", 7), 0.34), (72, T("bet", 1), 0.33), (69, T("bet", 4), 0.33)):
        pn(m, at, v)
    for i in range(4):
        place("pulse", glint((81, 84, 86, 89)[i], 0.22, tau=0.2), T("bet", 2) - 0.1 + i * 0.27, 1.0, pan=(-0.4, 0.4, -0.4, 0.4)[i])
    FIN = 71.9
    chord((26, [50, 57, 62, 64, 65, 69], DM9[2]), FIN, END - FIN - 1.4, 0.95, cutoff=1500, bright=0.5, attack=0.4, release=2.2)
    for m, v in ((26, 0.5), (38, 0.45), (57, 0.38), (64, 0.34), (69, 0.36), (81, 0.3)):
        pn(m, FIN, v, END - FIN)

    def master():
        wet = C.reverb(B["piano"] * 0.55 + B["pad"] * 0.35 + B["pulse"] * 0.6 + B["choir"] * 0.6 + B["bell"] * 0.6, C.IR_HALL)[:, :N]
        return B["piano"] * 0.9 + B["pad"] * 0.6 + B["pulse"] * 0.55 + B["low"] * 0.62 + B["choir"] * 0.5 + B["bell"] * 0.6 + wet * 0.5

    mix = master()
    # the breath before "And here's ...": everything drops away, then one note hangs in the air and a low D answers
    t = np.arange(N) / SR
    mix *= np.interp(t, [0, 35.15, 35.5, 36.05, 36.7, END], [1, 1, 0.2, 0.2, 1, 1])[None, :]
    for k in B:
        B[k][:] = 0
    place("bell", C.stereo(C.bell(81, 3.2, ratio=2.0, index=0.3, tau=1.6) * 0.3), 35.18, 1.0)
    pn(26, T("changes", 0) - 0.02, 0.6, 5.0)
    pn(38, T("changes", 0) - 0.02, 0.5, 5.0)
    place("low", sub(26, 2.6, 0.05, 1.5), T("changes", 0) - 0.02, 0.5)
    mix += master()
    mix = np.stack([C.filt(mix[c], "highpass", 32, 2) for c in range(2)])
    return np.tanh(mix * 1.05) / 1.05


def sfx():
    s = np.zeros((2, N))
    P = lambda x, at, g=1.0: C.place(s, x if x.ndim == 2 else C.stereo(x), at, g)  # noqa: E731
    # the planet, the sunrise, the dive
    P(M.air_swell(2.4), 0.0, 0.45)
    P(X.shimmer(), 2.7, 0.3)
    P(M.suck_in(0.9), 3.85, 0.5)
    P(M.soft_pass(1.0, (-0.3, 0.3)), 4.3, 0.45)
    # people: soft lights on eat, laugh, think, act; everyone on "people"
    for i, k in enumerate((4, 6, 11, 13)):
        P(M.ping(int((86, 89, 91, 93)[i])), T("laugh", k), 0.22)
    P(X.sparkle(), T("laugh", 16), 0.25)
    # the helix, the seed, the tree
    P(M.soft_pass(1.0, (0.4, -0.4)), 9.0, 0.4)
    P(M.soft_pass(0.9, (-0.4, 0.4)), 11.0, 0.35)
    P(X.shimmer(), 16.4, 0.25)
    # the scan: a fine digital rain of bits, then the vortex into the cube, the glass closing
    n = int(1.2 * SR)
    bits = np.zeros(n)
    for _ in range(140):
        i = rng.integers(0, n - 400)
        bits[i : i + 200] += np.sin(2 * np.pi * rng.choice([2400, 3200, 4100, 5200]) * np.arange(200) / SR) * np.exp(-np.arange(200) / 60) * rng.uniform(0.2, 1)
    P(C.stereo_sweep(norm(bits) * 0.25, -0.5, 0.5), 20.2, 0.5)
    P(C.whoosh(1.2, 300, 4200, 0.7, (0.6, -0.6), air=0.8, low=0.3), 21.35, 0.45)
    P(M.shing(), 22.45, 0.3)
    P(X.ignite(), T("imagine", 7) - 0.04, 0.55)
    P(M.bloom_hit(2.2), T("imagine", 8) - 0.03, 0.4)
    # the world rises; its people appear
    P(M.rumble(1.4) * 0.5, 24.3, 0.45)
    for i in range(14):
        P(M.ping(int(rng.choice([93, 96, 98, 100]))), T("world", 5) - 0.05 + i * 0.065, 0.08)
    for i in range(6):
        P(C.stereo(C.tick(3400) * 0.5, (-0.4, 0.4)[i % 2]), T("world", 8) + i * 0.035, 0.18)
    # the dive into one of them
    P(M.suck_in(0.75), 28.2, 0.55)
    P(X.ignite(), 28.9, 0.3)
    # the environment, the pull back to the wall, the collapse into a point
    P(air(1.6, 200, 2000, 0.6), 30.4, 0.3)
    P(M.soft_pass(1.3, (-0.5, 0.5)), 32.5, 0.45)
    P(M.suck_in(0.8), 35.1, 0.5)
    # the cube opens; the first sunrise of that world
    P(M.shing(), 36.5, 0.25)
    P(M.bloom_hit(2.4), T_SUN - 0.08, 0.45)
    # time racing: a rising wind, then arrival
    P(air(DAYS_ - 38.9, 300, 9000, 0.97), 38.9, 0.55)
    P(C.reverse_swell(1.2), DAYS_ - 1.2, 0.5)
    P(M.bloom_hit(3.2), DAYS_ - 0.03, 0.42)
    # where would it lead: out into space; three flights; arrivals
    P(M.air_swell(1.6), 45.9, 0.3)
    for k in (3, 7, 9):
        P(M.glide_pass(1.2, (-0.3, 0.6)), T("rockets", k) - 0.08, 0.4)
    # a god
    P(air(1.4, 400, 5000, 0.8), T("god", 0), 0.35)
    P(M.bloom_hit(2.2), T("god", 6) - 0.03, 0.4)
    # the tesseract unfolding
    P(M.shing(), 53.5, 0.3)
    P(X.shimmer(), T("invent", 3), 0.3)
    # the climb, and arrival at the top
    P(M.soft_pass(0.9, (0.3, -0.3)), 57.1, 0.4)
    P(M.rumble(2.6) * 0.6, 57.6, 0.45)
    P(air(T("greater", 7) - 57.9, 200, 8000, 0.98), 57.9, 0.45)
    P(M.bloom_hit(3.0), T("greater", 7) - 0.03, 0.4)
    P(M.thud(), T("greater", 7) - 0.03, 0.16)
    for k in range(2):
        P(C.stereo(C.tick(2600) * 0.6, (-0.3, 0.3)[k]), T("greater", 7) + 0.3 + k * 0.12, 0.2)
    # their gift: forms, crosses the glass, falls, lands
    P(X.sparkle(), 61.9, 0.3)
    P(M.shing(), 62.7, 0.3)
    P(M.glide_pass(1.5, (0.0, 0.2)), 62.6, 0.35)
    P(M.bloom_hit(2.6), T("today", 13) - 0.03, 0.5)
    # the peak: light rising
    P(M.soft_pass(0.8, (-0.2, 0.2)), 64.95, 0.35)
    P(air(1.2, 600, 9000, 0.85), 65.2, 0.4)
    # the four futures appear
    for i in range(4):
        P(M.ping(int((86, 89, 93, 96)[i])), T("comments", 0) - 0.2 + i * 0.16, 0.14)
    # the mark
    P(M.air_swell(1.4), 70.5, 0.3)
    P(M.bloom_hit(END - 71.88), 71.88, 0.42)
    return s


DAYS_ = T("days", 13)


def main():
    subprocess.run([sys.executable, os.path.join(HERE, "align.py")], check=True, stdout=subprocess.DEVNULL)
    _, v = wavfile.read(os.path.join(ROOT, "public/audio/reel-vo.wav"))
    v = v.astype(np.float64) / 32768
    if v.ndim == 2:
        v = v.mean(axis=1)
    vo = np.zeros((2, N))
    C.place(vo, v[:N], 0.0, 1.0)
    vo = np.stack([C.filt(vo[c], "highpass", 70, 2) for c in range(2)])
    mus = score()
    t = np.arange(N) / SR
    mus *= np.interp(t, [0, 0.2, END - 0.8, END - 0.02], [0, 1, 1, 0])[None, :]
    fx = sfx()
    vo *= 10 ** ((-15.0 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-17.5 - C.lufs(mus)) / 20)
    fx *= 10 ** ((-23.0 - C.lufs(fx)) / 20)
    env = C.follower(vo[0], 0.04, 0.5)
    env /= np.max(env) + 1e-9
    mus *= (10 ** (-6.5 * np.clip(env * 4.0, 0, 1) / 20))[None, :]
    mix = vo + mus + fx
    mix *= 10 ** ((-14.0 - C.lufs(mix)) / 20)
    mix = C.soft_limit(mix, 0.89)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public/audio/reel-mix.mp3")], check=True)
        if os.environ.get("STEMS"):
            for name, x in (("vo", vo), ("mus", mus), ("fx", fx)):
                wavfile.write(os.path.join(os.environ["STEMS"], f"{name}.wav"), SR, (np.clip(x, -1, 1).T * 32767).astype(np.int16))
    print(f"mix {C.lufs(mix):.1f} LUFS")


if __name__ == "__main__":
    main()
