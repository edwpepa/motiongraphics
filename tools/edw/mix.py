"""Mix for the EDW ENTERPRISE film: the assembled voiceover (tools/edw/align.py) + an original dark,
Zimmer-style score in D minor at 100 bpm (ticking, string ostinato, taiko, braams, choir) + cinematic SFX.
Writes public/audio/edw-mix.mp3."""
import json, math, os, subprocess, sys, tempfile
import numpy as np
import scipy.io.wavfile as wavfile

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "audio"))
sys.path.insert(0, os.path.join(HERE, "..", "launch"))
import compose as C  # noqa: E402
import score as S  # noqa: E402
import sfx as X  # noqa: E402

ROOT = C.ROOT
SR = C.SR
END = 70.0
N = int(END * SR)
W = json.load(open(os.path.join(ROOT, "src/edw/vo-words.json")))
T = lambda key, i=0: W[key]["words"][min(i, len(W[key]["words"]) - 1)][1]  # noqa: E731
R = T("edw") - 0.02  # the BRAAM: "At EDW ENTERPRISE"
BEAT = 0.6
BAR = 4 * BEAT
FINAL = T("yours") - 0.05
rng = np.random.default_rng(7)

# D minor: Dm, Bb, Gm, A
PROG = [(38, [50, 53, 57]), (34, [50, 53, 58]), (31, [50, 55, 58]), (33, [49, 52, 57])]


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, peak=0.9):
    return x * (peak / (np.max(np.abs(x)) + 1e-9))


# ------------------------------------------------------------------ instruments
def braam(root, dur=3.2):
    """The brass foghorn: stacked detuned saws, driven, a filter that opens and closes."""
    n = int(dur * SR)
    t = tt(dur)
    y = np.zeros(n)
    for m, g in ((root - 12, 1.0), (root, 0.8), (root + 7, 0.45), (root + 12, 0.3)):
        for d in (-0.008, -0.003, 0.0, 0.004, 0.009):
            y += g * S.fsaw(S.mtof(m) * (1 + d), n, rng.random())
    y = np.tanh(y * 0.35)
    nb = int(math.ceil(n / 256))
    tb = np.arange(nb) * 256 / SR
    fc = 120 + 1500 * np.clip(tb / 0.18, 0, 1) * np.exp(-np.maximum(0, tb - 0.18) / 0.9)
    y = C.swept(y, "lowpass", np.maximum(80, fc), order=2)
    sub = np.sin(2 * np.pi * S.mtof(root - 12) * t) * 0.8
    env = np.clip(t / 0.03, 0, 1) * np.exp(-t / 1.4) * np.clip((dur - t) / 0.4, 0, 1)
    return np.tanh(norm(y + sub * 0.5) * env * 1.5)


def taiko(m=36):
    n = int(1.2 * SR)
    t = tt(1.2)
    f = S.mtof(m) * (1 + 0.5 * np.exp(-t / 0.04))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35)
    skin = C.filt(rng.standard_normal(n), "lowpass", 900) * np.exp(-t / 0.03) * 0.6
    return np.tanh((body + skin) * 1.6)


def stac(m, dur=0.13):
    n = int((dur + 0.05) * SR)
    f = S.mtof(m)
    y = S.fsaw(f * 1.003, n, rng.random()) + S.fsaw(f * 0.997, n, rng.random())
    y = C.filt(y, "lowpass", 2600, 2)
    return y * S.adsr(n, 0.004, 0.07, 0.35, 0.04) * 0.4


def drone(notes, dur, cutoff=700, attack=2.0):
    p = S.pad(notes, dur, attack=attack, release=1.5, cutoff=cutoff)
    t = tt(p.shape[1] / SR)
    lfo = 0.8 + 0.2 * np.sin(2 * np.pi * 0.15 * t)
    return p * lfo[None, :]


def thunder():
    d = 4.0
    t = tt(d)
    crack = C.filt(rng.standard_normal(len(t)), "highpass", 1200) * np.exp(-t / 0.08) * 0.7
    rumble = C.filt(rng.standard_normal(len(t)), "lowpass", 160, 2) * (np.clip(t / 0.15, 0, 1) * np.exp(-t / 1.3)) * 3.0
    rumble *= 0.7 + 0.3 * np.sin(2 * np.pi * 3 * t + np.sin(2 * np.pi * 0.7 * t))
    return X.verb(norm(crack + rumble) * 0.9, 0.4)


def rain(dur):
    n = int(dur * SR)
    a = C.filt(rng.standard_normal(n), "bandpass", (1800, 9000), 2)
    b = C.filt(rng.standard_normal(n), "bandpass", (1800, 9000), 2)
    drops = (rng.random(n) < 0.0009) * rng.standard_normal(n) * 6
    drops = C.filt(drops, "bandpass", (2000, 6000), 2)
    return np.stack([a + drops * 0.5, b + np.roll(drops, 300) * 0.5]) * 0.15


def rumble(dur):
    t = tt(dur)
    y = C.filt(rng.standard_normal(len(t)), "lowpass", 90, 2) * 2.5 + np.sin(2 * np.pi * 36.7 * t) * 0.3
    return y * np.clip(t / 0.6, 0, 1) * np.clip((dur - t) / 0.2, 0, 1)


def ping(m=88):
    return X.verb(X.st(norm(C.bell(m, 0.9, ratio=2.0, index=0.5, tau=0.25)) * 0.35, rng.uniform(-0.5, 0.5)), 0.5)


def buzz(dur):
    t = tt(dur)
    y = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.3 + C.filt(rng.standard_normal(len(t)), "bandpass", (500, 3000)) * 0.5
    return y * np.clip(t / 0.05, 0, 1) * np.clip((dur - t) / 0.05, 0, 1)


def tone(f, dur):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * np.clip(t / 0.01, 0, 1) * np.exp(-t / (dur * 0.5))


# ------------------------------------------------------------------ score
def build_score():
    B = {k: np.zeros((2, N)) for k in ("perc", "low", "str", "brass", "pad", "choir", "fx")}
    chain = np.ones(N)

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.6, tau=0.12):
        i = int(at * SR)
        if 0 <= i < N:
            dip = 1 - depth * np.exp(-np.arange(int(0.4 * SR)) / SR / tau)
            j = min(N, i + len(dip))
            chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    tick = C.tick(2900)
    tock = C.tick(2100)
    grid = lambda i: R + i * BEAT / 2  # noqa: E731  8ths on the main grid

    # I. the mind (0 – 13.7): a drone, a clock that never stops, a low heartbeat
    place("pad", drone([38, 45, 50], 13.6, cutoff=500, attack=3.0), 0.0, 0.9)
    place("low", np.sin(2 * np.pi * 36.7 * tt(13.6)) * np.clip(tt(13.6) / 3, 0, 1) * 0.5, 0.0, 1.0)
    i0 = math.ceil((0.8 - R) / (BEAT / 2))
    i1 = math.floor((13.45 - R) / (BEAT / 2))
    for i in range(i0, i1 + 1):
        at = grid(i)
        g = 0.12 + 0.22 * (at / 13.4)
        place("perc", tick if i % 2 == 0 else tock, at, g, pan=0.35 if i % 2 else -0.35)
    for b in range(math.ceil((1.4 - R) / BAR), math.floor((13.4 - R) / BAR) + 1):
        place("low", X.heart()[0] * 1.2, R + b * BAR, 0.8)
    place("pad", drone([50, 57, 62, 69], 6.0, cutoff=2400, attack=2.0), 6.6, 0.35)  # the neuron
    place("fx", C.reverse_swell(1.2), T("spark", 2) - 1.2, 0.5)
    place("fx", X.impact(1.0, 0.6), T("spark", 2), 0.8)
    place("fx", X.shimmer(), T("spark", 2) + 0.05, 0.6)
    place("choir", S.choir([62, 69, 74], 2.6, attack=0.4), T("spark", 2), 0.35)
    place("fx", C.reverse_swell(0.5), 13.25, 0.5)

    # II. the night (13.75 – 29.3): ostinato wakes, taiko joins, the build counter ticks, the world swells
    i0 = math.ceil((13.8 - R) / (BEAT / 4))
    i1 = math.floor((29.0 - R) / (BEAT / 4))
    for i in range(i0, i1 + 1):
        at = R + i * BEAT / 4
        bar = math.floor((at - R) / BAR)
        root, tones = PROG[bar % 4]
        s16 = i % 4
        m = [root + 24, root + 36, root + 31, root + 36][s16]
        x = (at - 13.8) / (29.0 - 13.8)
        place("str", stac(m), at, (0.10 + 0.45 * x) * (1.0 if s16 == 0 else 0.7), pan=(-0.3, 0.3)[s16 % 2])
    for b in range(math.ceil((13.8 - R) / BAR), math.floor((29.0 - R) / BAR) + 1):
        root, tones = PROG[b % 4]
        at = R + b * BAR
        x = (at - 13.8) / (29.0 - 13.8)
        place("pad", drone([n - 12 for n in tones], BAR, cutoff=600 + 1600 * x, attack=0.6), at, 0.5 + 0.3 * x)
        place("low", C.bass_note(root, BAR - 0.1, attack=0.02, release=0.3), at, 0.45 + 0.3 * x)
        place("perc", taiko(36), at, 0.5 + 0.4 * x)
        duck(at, 0.35)
        if at > 21:
            place("perc", taiko(43), at + 1.5 * BEAT, 0.35 + 0.3 * x)
            place("perc", taiko(36), at + 2.5 * BEAT, 0.35 + 0.3 * x)
        if at > 25:
            for q in range(4):
                place("perc", tick, at + q * BEAT + BEAT / 2, 0.25)
    place("fx", thunder(), 13.75, 1.0)
    place("fx", rain(4.9) * np.clip(tt(4.9) / 0.3, 0, 1)[None, :] * np.clip((4.9 - tt(4.9)) / 0.6, 0, 1)[None, :], 13.75, 1.0)
    place("choir", S.choir([62, 65, 69, 74], 3.5, attack=1.6), T("history", 0) - 0.5, 0.5)
    place("brass", braam(38, 3.0), T("finished", 7) + 0.15, 0.6)
    place("fx", C.riser(2.4, 200, 9000), T("history", 12) - 2.2, 0.35)

    # III. the dark before the name (29.3 – R): everything stops; only a rumble, then the inhale
    place("low", rumble(R - 29.25), 29.25, 0.8)
    place("fx", C.reverse_swell(1.3), R - 1.3, 0.8)
    place("fx", C.riser(1.4, 120, 6000), R - 1.4, 0.4)

    # IV. EDW ENTERPRISE (R – 55.8): the full machine
    bars = int((55.8 - R) // BAR)
    for k in range(bars):
        at = R + k * BAR
        root, tones = PROG[k % 4]
        x = k / max(1, bars - 1)
        if k % 2 == 0:
            place("brass", braam(root, 2 * BAR), at, 0.55 if k else 1.0)
        place("pad", drone([n for n in tones], BAR, cutoff=1800 + 1200 * x, attack=0.05), at, 0.45)
        place("choir", S.choir([n + 12 for n in tones], BAR, attack=0.3), at, 0.25 + 0.2 * x)
        place("low", C.bass_note(root, BAR - 0.05, attack=0.01, release=0.2), at, 0.7)
        for s16 in range(16):
            m = [root + 24, root + 36, root + 31, root + 36][s16 % 4]
            place("str", stac(m), at + s16 * BEAT / 4, 0.5 if s16 % 4 == 0 else 0.35, pan=(-0.35, 0.35)[s16 % 2])
        # taiko pattern
        for b, m, g in ((0, 36, 1.0), (1.5, 43, 0.6), (2, 36, 0.8), (2.75, 43, 0.5), (3, 36, 0.7), (3.5, 41, 0.6)):
            place("perc", taiko(m), at + b * BEAT, g)
        for b in (1, 3):
            place("perc", S.bigclap(), at + b * BEAT, 0.25)
            duck(at + b * BEAT, 0.25)
        duck(at, 0.5)
        for q in range(8):
            place("perc", tick, at + q * BEAT / 2, 0.18, pan=0.4)
    place("fx", C.crash(4.0), R, 0.8)
    place("perc", taiko(31), R, 1.4)
    place("fx", X.impact(1.3, 1.0, 2.4), R, 1.2)

    # V. the invitation (55.8 – FINAL): back to the clock and the heartbeat, then the last braam
    tail = FINAL - 55.8
    place("pad", drone([38, 45, 50, 57], tail + 0.5, cutoff=900, attack=0.8), 55.8, 0.7)
    place("low", np.sin(2 * np.pi * 36.7 * tt(tail)) * 0.4, 55.8, 1.0)
    for i in range(int(tail / (BEAT / 2))):
        at = 55.8 + i * BEAT / 2
        place("perc", tick if i % 2 == 0 else tock, at, 0.18 + 0.15 * (i * BEAT / 2) / tail, pan=0.35 if i % 2 else -0.35)
    for b in range(int(tail / BAR) + 1):
        place("low", X.heart()[0], 55.8 + b * BAR, 0.8)
    for i in range(int((FINAL - 60.0) / (BEAT / 4))):
        at = 60.0 + i * BEAT / 4
        x = (at - 60) / (FINAL - 60)
        place("str", stac([50, 62, 57, 62][i % 4]), at, 0.08 + 0.4 * x, pan=(-0.3, 0.3)[i % 2])
    place("fx", C.reverse_swell(1.6), FINAL - 1.6, 0.9)
    place("fx", C.riser(2.5, 150, 9000), FINAL - 2.5, 0.4)

    ring = END - FINAL
    place("brass", braam(38, 5.0), FINAL, 1.1)
    place("perc", taiko(31), FINAL, 1.5)
    place("perc", taiko(36), FINAL + 0.02, 0.8)
    place("fx", C.crash(4.5), FINAL, 0.7)
    place("fx", X.impact(1.4, 1.0, 2.6), FINAL, 1.1)
    place("choir", S.choir([62, 69, 74, 77], ring - 1.0, attack=0.15), FINAL, 0.75)
    place("pad", drone([38, 50, 57, 62, 65], ring - 0.5, cutoff=2600, attack=0.05), FINAL, 0.7)
    place("low", C.bass_note(26, ring - 0.5, attack=0.005, release=2.0), FINAL, 0.9)

    for k in ("low", "pad", "str", "choir"):
        B[k] *= chain[None, :] ** 0.7
    wet = C.reverb(B["perc"] * 0.25 + B["str"] * 0.35 + B["brass"] * 0.3 + B["pad"] * 0.3 + B["choir"] * 0.6 + B["fx"] * 0.3, C.IR_HALL)[:, :N]
    mix = B["perc"] * 0.85 + B["low"] * 0.8 + B["str"] * 0.6 + B["brass"] * 0.8 + B["pad"] * 0.55 + B["choir"] * 0.55 + B["fx"] * 0.6 + wet * 0.4
    return np.tanh(mix * 1.1) / 1.1


# ------------------------------------------------------------------ sound design over the picture
def build_sfx():
    s = np.zeros((2, N))
    P = lambda x, at, g=1.0: C.place(s, x if x.ndim == 2 else C.stereo(x), at, g)  # noqa: E731
    # synapses firing in the brain
    for i in range(14):
        at = 2.6 + i * 0.27 + rng.uniform(0, 0.12)
        P(ping(rng.choice([86, 88, 91, 93])), at, 0.25)
    P(X.whoosh(), 6.3, 0.5)  # into the spark
    P(C.whoosh(0.9, 200, 2600, 0.5, (-0.4, 0.4), air=0.6, low=0.3), T("away", 5) - 0.1, 0.5)  # the shockwave
    P(X.whoosh(), 18.45, 0.6)  # out of the window
    P(X.verb(X.st(norm(tone(1320, 1.4)) * 0.25), 0.6), 18.8, 0.6)  # the beacon
    P(X.whoosh(), 20.95, 0.5)
    # the build: little electric ticks as the edges join
    for i in range(36):
        at = 21.3 + i * (T("finished", 7) - 21.3) / 36
        P(X.click(), at, 0.18)
    P(X.lock(), T("finished", 7) + 0.15, 0.6)
    P(X.shimmer(), T("history", 12) + 0.15, 0.6)  # the moon
    # tech
    P(X.whoosh(), 36.6, 0.5)
    for i in range(22):
        P(X.key(), T("specialists", 0) + i * 0.115 + rng.uniform(0, 0.03), 0.3)
    P(X.zip(), T("specialists", 2) - 0.05, 0.4)
    P(X.whoosh(), 39.65, 0.5)
    P(buzz(T("technicians", 5) - 39.8), 39.8, 0.12)
    P(X.verb(X.st(norm(tone(880, 0.9)) * 0.3), 0.3), T("technicians", 6) - 0.05, 0.7)
    P(X.whoosh(), 42.35, 0.5)
    P(X.bubble(), T("dare", 4) - 0.05, 0.5)
    P(C.whoosh(1.1, 150, 3000, 0.7, (0.3, 0.0), air=0.8, low=0.5), T("dare", 8) - 0.5, 0.8)
    P(X.impact(0.8, 0.6), T("dare", 8) + 0.5, 0.5)
    P(X.whoosh(), 46.5, 0.5)
    for i in range(27):
        P(ping(rng.choice([84, 86, 89, 91, 93, 96])), T("room", 0) + i * (T("room", 9) - T("room", 0)) / 27, 0.2)
    P(X.lock(), T("build", 5) + 0.1, 0.5)
    P(X.whoosh(), 51.15, 0.5)
    for k in (1, 4, 7):
        P(X.select(), T("apps", k) - 0.05, 0.5)
    P(C.whoosh(1.0, 400, 6000, 0.5, (-0.6, 0.6), air=0.6), T("apps", 10), 0.4)
    # the idea, the message
    P(C.whoosh(1.0, 300, 2500, 0.5, (-0.5, 0.5), air=0.5, low=0.2), 57.3, 0.3)
    P(C.whoosh(1.0, 300, 2500, 0.5, (0.5, -0.5), air=0.5, low=0.2), 58.5, 0.3)
    P(C.reverse_swell(0.5), T("write", 0) - 0.3, 0.5)
    P(X.impact(0.6, 0.8), T("write", 0) + 0.2, 0.5)
    msg = "I have an idea I can't get out of my head."
    t0, t1 = 59.95 + 0.35, T("best", 6)
    for i, ch in enumerate(msg):
        if ch != " ":
            P(X.key(), t0 + (t1 - t0) * i / len(msg), 0.25)
    P(X.click(), T("best", 8) + 0.2, 0.7)
    P(X.sent(), T("best", 8) + 0.25, 0.7)
    return s


def main():
    subprocess.run([sys.executable, os.path.join(HERE, "align.py")], check=True, stdout=subprocess.DEVNULL)
    _, v = wavfile.read(os.path.join(ROOT, "public/audio/edw-vo.wav"))
    v = v.astype(np.float64) / 32768
    vo = np.zeros((2, N))
    C.place(vo, v[:N], 0.0, 1.0)
    vo = np.stack([C.filt(vo[c], "highpass", 70, 2) for c in range(2)])
    mus = build_score()
    t = np.arange(N) / SR
    mus *= np.interp(t, [0, 0.3, END - 1.2, END - 0.05], [0, 1, 1, 0])[None, :]
    sfx = build_sfx()

    vo *= 10 ** ((-15.0 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-15.5 - C.lufs(mus)) / 20)
    sfx *= 10 ** ((-22.0 - C.lufs(sfx)) / 20)
    env = C.follower(vo[0], 0.03, 0.45)
    env /= np.max(env) + 1e-9
    mus *= (10 ** (-9.0 * np.clip(env * 4.0, 0, 1) / 20))[None, :]
    # the silence before the name
    mus *= np.interp(t, [29.1, 29.5, R - 1.4, R - 0.01, R], [1, 0.35, 0.35, 1.0, 1.0])[None, :]
    mix = vo * 1.0 + mus + sfx
    mix *= 10 ** ((-14.0 - C.lufs(mix)) / 20)
    mix = C.soft_limit(mix, 0.89)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public/audio/edw-mix.mp3")], check=True)
    print(f"mix {C.lufs(mix):.1f} LUFS, braam at {R:.2f}s, final at {FINAL:.2f}s")


if __name__ == "__main__":
    main()
