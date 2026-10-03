"""Mix for the Timișoara spot: voiceover + an original score in the launch film's style
(G minor, 125 bpm, same hook) + a few paper/pencil sounds. Writes public/audio/tm-mix.mp3."""
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
OFF = 0.6
END = 42.0
N = int(END * SR)
D = 17.75
BEAT = 0.4799
BAR = 4 * BEAT
W = json.load(open(os.path.join(ROOT, "src/tm/vo-words.json")))
T = lambda key, i=0: W[key]["words"][i][1] + OFF  # noqa: E731


def load(path):
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "x.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "2", "-ar", str(SR), wav], check=True)
        _, x = wavfile.read(wav)
    return x.astype(np.float64).T / 32768


# ------------------------------------------------------------------ a feel-good score: D major, ukulele, claps, a whistled hook
CHORDS = [(38, [50, 57, 62, 66, 69]), (33, [52, 57, 61, 64, 69]), (35, [54, 59, 62, 66, 71]), (31, [50, 55, 59, 62, 67])]  # D A Bm G
HOOK = [
    [(0, 78, 0.5), (0.5, 81, 0.5), (1, 78, 0.5), (1.5, 76, 0.5), (2, 74, 1), (3, 76, 0.5), (3.5, 78, 0.5)],
    [(0, 76, 1.5), (1.5, 73, 0.5), (2, 76, 1), (3, 78, 1)],
    [(0, 78, 0.5), (0.5, 81, 0.5), (1, 83, 0.5), (1.5, 81, 0.5), (2, 78, 1), (3, 76, 0.5), (3.5, 74, 0.5)],
    [(0, 74, 1.5), (1.5, 76, 0.5), (2, 79, 1), (3, 78, 1)],
]
STRUM = [(0, 1, 1.0), (1, 1, 0.8), (1.5, -1, 0.6), (2.5, -1, 0.6), (3, 1, 0.85), (3.5, -1, 0.6)]


def uke(notes, down=1):
    """a ukulele-ish strum: bright plucks rolled across the strings"""
    order = notes if down > 0 else notes[::-1]
    out = np.zeros(int(0.9 * SR))
    for j, m in enumerate(order):
        p = C.pluck(m + 12, 0.8, tau=0.16, bright=1.4)
        i0 = int(j * 0.011 * SR)
        out[i0 : i0 + len(p)] += p[: len(out) - i0]
    return C.filt(out, "highpass", 180) / len(notes) * 2.2


def whistle(m, dur):
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    f = C.midi(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.08) / 0.1, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.08 * np.sin(2 * ph)
    breath = C.filt(np.random.default_rng(int(m * 10 + dur * 100)).standard_normal(n), "bandpass", (1800, 5200), 2) * 0.05
    env = np.clip(t / 0.035, 0, 1) * np.clip((dur + 0.1 - t) / 0.09, 0, 1)
    return (y + breath) * env * 0.5


def snap():
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    return C.filt(np.random.default_rng(3).standard_normal(n), "bandpass", (1800, 7000), 2) * np.exp(-t / 0.008) + np.sin(2 * np.pi * 2100 * t) * np.exp(-t / 0.004) * 0.4


def glock(m):
    return C.bell(m, 1.2, ratio=2.76, index=0.5, tau=0.5)


def build_score():
    B = {k: np.zeros((2, N)) for k in ("drums", "bass", "keys", "lead", "fx")}
    chain = np.ones(N)

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.6, tau=0.1):
        i = int(at * SR)
        if 0 <= i < N:
            dip = 1 - depth * np.exp(-np.arange(int(0.3 * SR)) / SR / tau)
            j = min(N, i + len(dip))
            chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    bar = lambda k: D + k * BAR  # noqa: E731
    kick = C.kick()
    clap = C.clap()
    sn = snap()

    def groove(t0, chord, full):
        root, notes = chord
        for b, d, g in STRUM:
            place("keys", uke(notes, d), t0 + b * BEAT, g * (0.9 if full else 0.7), pan=0.15 * d)
        for b in (1, 3):
            place("drums", sn, t0 + b * BEAT, 0.5, pan=-0.3)
            if full:
                place("drums", clap, t0 + b * BEAT, 0.7)
        for b in ((0, 1, 2, 3) if full else (0, 2)):
            place("drums", kick, t0 + b * BEAT, 0.8 if full else 0.45)
            duck(t0 + b * BEAT, 0.55 if full else 0.3)
        for s16 in range(16 if full else 8):
            step = BEAT / (4 if full else 2)
            place("drums", C.shaker(), t0 + s16 * step, (0.07 + 0.05 * (s16 % 2)) * (1 if full else 0.8), pan=0.35)
        # bouncing bass: root and fifth
        for q in range(8):
            mm = root + (7 if q in (3, 7) else 0) + 12
            place("bass", C.bass_note(mm, BEAT / 2 - 0.05, attack=0.006, release=0.06), t0 + q * BEAT / 2, 0.75 if full else 0.5)

    # intro under the story
    k0 = -int(D // BAR)
    for k in range(k0, 0):
        t0 = bar(k)
        if t0 < 0.05:
            continue
        groove(t0, CHORDS[(k - k0) % 4], False)
        if (k - k0) % 2 == 1:
            place("lead", glock(86), t0 + 3.5 * BEAT, 0.25)
    tb = bar(-1)
    for j in range(16):
        place("drums", C.shaker(), tb + j * BEAT / 4, 0.1 + 0.3 * j / 16)
        if j >= 8:
            place("drums", clap, tb + j * BEAT / 4, 0.1 + 0.4 * (j - 8) / 8)
    place("fx", C.riser(BAR, 400, 10000), tb, 0.35)

    # the drop: full groove, the whistled hook, glockenspiel doubling the second half
    for k in range(8):
        t0 = bar(k)
        groove(t0, CHORDS[k % 4], True)
        for b, m, L in HOOK[k % 4]:
            place("lead", whistle(m, L * BEAT * 0.9), t0 + b * BEAT, 0.75)
            if k >= 4:
                place("lead", glock(m + 12), t0 + b * BEAT, 0.18)
        if k % 4 == 0:
            place("fx", C.crash(2.0), t0, 0.25)
    # lift into "Handly."
    for j in range(8):
        tbb = bar(8) + j * BEAT
        x = j / 8
        place("keys", uke(CHORDS[3 if j < 4 else 1][1], 1), tbb, 0.6 + 0.3 * x)
        place("keys", uke(CHORDS[3 if j < 4 else 1][1], -1), tbb + BEAT / 2, 0.5 + 0.3 * x)
        for q in range(2 if x < 0.5 else 4):
            place("drums", kick, tbb + q * BEAT / (2 if x < 0.5 else 4), 0.5 + 0.3 * x)
        place("drums", clap, tbb + BEAT / 2, 0.3 + 0.4 * x)
    place("fx", C.riser(2 * BAR, 300, 12000), bar(8), 0.45)

    hit = bar(10)
    ring = END - hit
    place("keys", uke(CHORDS[0][1], 1), hit, 1.0)
    place("keys", S.pad([62, 66, 69, 74, 78], ring - 0.8, attack=0.01, release=1.4, cutoff=4000), hit, 0.5)
    place("bass", C.bass_note(38, ring - 0.5, attack=0.005, release=1.5), hit, 0.8)
    place("drums", kick, hit, 1.0)
    place("drums", clap, hit, 0.8)
    place("fx", C.crash(3.5), hit, 0.45)
    for j, m in enumerate((74, 78, 81, 86, 90)):
        place("lead", glock(m), hit + 0.08 * j, 0.3)
    for k in range(int(ring / BAR)):
        t0 = hit + (k + 1) * BAR
        if t0 + BAR > END:
            break
        for b, d, g in STRUM[:3]:
            place("keys", uke(CHORDS[0][1], d), t0 + b * BEAT, g * 0.45)

    B["bass"] *= chain[None, :]
    B["keys"] *= chain[None, :] ** 0.5
    wet = C.reverb(B["keys"] * 0.25 + B["lead"] * 0.35 + B["drums"] * 0.08 + B["fx"] * 0.3, C.IR_HALL)[:, :N]
    delay = C.delay_pingpong(B["lead"], BEAT * 0.75, feedback=0.28, taps=3)[:, :N]
    mix = B["drums"] * 0.85 + B["bass"] * 0.7 + B["keys"] * 0.75 + B["lead"] * 0.7 + delay * 0.15 + B["fx"] * 0.5 + wet * 0.3
    return np.tanh(mix * 1.1) / 1.1, hit


def main():
    vo_src = load(os.path.join(ROOT, "public/audio/tm-vo.mp3"))
    vo = np.zeros((2, N))
    C.place(vo, vo_src, OFF, 1.0)
    mus, hit = build_score()
    t = np.arange(N) / SR
    mus *= np.interp(t, [0, 0.4, END - 2.0, END - 0.05], [0, 1, 1, 0])[None, :]

    # a few paper/pencil touches
    sfx = np.zeros((2, N))
    scenes = [T("orice") - 0.3, T("s0") - 0.15, T("tot") - 0.15, T("alegi") - 0.2, T("daca") - 0.2, T("pornit") - 0.2]
    for at in scenes:
        C.place(sfx, X.whoosh(), at, 0.35)
    for key in ("s0", "s1", "s2", "s3", "s4", "s5"):
        C.place(sfx, X.pop(), T(key) - 0.1, 0.35)
    C.place(sfx, X.pop(), T("s6", 3) - 0.2, 0.35)
    C.place(sfx, X.suck(), T("tot") + 0.1, 0.4)
    C.place(sfx, X.drop(), D, 0.9)
    for i in range(3):
        C.place(sfx, X.notif(), T("oferte", 6) - 0.2 + i * 0.2, 0.3)
    C.place(sfx, X.lock(), T("platesti") + 0.1, 0.35)
    C.place(sfx, X.success(), T("urmaresti", 1) + 1.0, 0.35)
    for i in range(5):
        C.place(sfx, X.coin(), T("castigi") - 0.2 + i * 0.13, 0.4)
    for i in range(9):
        C.place(sfx, X.pop(), T("curand", 3) - 0.2 + 0.1 * i + 0.33, 0.22)
    C.place(sfx, X.end(), hit, 0.8)

    vo *= 10 ** ((-15.5 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-15.5 - C.lufs(mus)) / 20)
    sfx *= 10 ** ((-23.0 - C.lufs(sfx)) / 20)
    env = C.follower(vo[0], 0.03, 0.45)
    env /= np.max(env) + 1e-9
    mus *= (10 ** (np.where(t < D, -8.0, -10.0) * np.clip(env * 4.0, 0, 1) / 20))[None, :]
    mus *= np.interp(t, [0, D - 0.01, D], [0.7, 0.7, 1.0])[None, :]
    mix = vo + mus + sfx
    mix *= 10 ** ((-14.0 - C.lufs(mix)) / 20)
    mix = C.soft_limit(mix, 0.89)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public/audio/tm-mix.mp3")], check=True)
    print(f"mix {C.lufs(mix):.1f} LUFS, hit at {hit:.2f}s")


if __name__ == "__main__":
    main()
