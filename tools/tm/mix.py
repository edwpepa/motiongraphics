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


# ------------------------------------------------------------------ electro-pop: A minor, electric piano, plucks, vocal chops
CHORDS = [(33, [57, 60, 64, 67]), (29, [53, 57, 60, 64]), (36, [55, 60, 64, 67]), (31, [55, 59, 62, 67])]  # Am7 Fmaj7 C G
HOOK = [
    [(0, 76, 0.5), (0.75, 79, 0.25), (1, 81, 0.5), (2, 79, 0.5), (2.5, 76, 0.5), (3, 74, 1)],
    [(0, 72, 0.5), (0.5, 74, 0.5), (1, 76, 1), (2.5, 74, 0.5), (3, 72, 1)],
    [(0, 76, 0.5), (0.75, 79, 0.25), (1, 84, 0.5), (2, 81, 0.5), (2.5, 79, 0.5), (3, 76, 1)],
    [(0, 74, 0.5), (0.5, 76, 0.5), (1, 79, 1.5), (3, 74, 0.5), (3.5, 71, 0.5)],
]


def epiano(notes, dur):
    """a warm electric piano: FM bell tine over a sine body, with a little tremolo"""
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for m in notes:
        f = C.midi(m)
        idx = 1.6 * np.exp(-t / 0.25)
        out += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * np.exp(-t / 1.4)
        out += 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.5 * t)
    env = np.clip(t / 0.004, 0, 1) * np.clip((dur + 0.6 - t) / 0.4, 0, 1)
    return out * trem * env / len(notes)


def chop(m, dur):
    """a vocal chop singing "ah": a bright source through vowel formants, with a tiny scoop"""
    n = int((dur + 0.08) * SR)
    t = np.arange(n) / SR
    f = C.midi(m) * (1 - 0.03 * np.exp(-t / 0.03)) * (1 + 0.004 * np.sin(2 * np.pi * 6 * t))
    src = S.fsaw(f, n) + 0.5 * S.fsaw(f * 1.005, n, 0.4)
    y = C.filt(src, "bandpass", (700, 950), 2) * 1.0 + C.filt(src, "bandpass", (1100, 1350), 2) * 0.7 + C.filt(src, "bandpass", (2600, 3000), 2) * 0.25
    env = np.clip(t / 0.01, 0, 1) * np.clip((dur + 0.08 - t) / 0.06, 0, 1)
    return np.tanh(y * env * 2.0) * 0.6


def build_score():
    B = {k: np.zeros((2, N)) for k in ("drums", "bass", "keys", "lead", "fx")}
    chain = np.ones(N)

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.8, tau=0.12):
        i = int(at * SR)
        if 0 <= i < N:
            dip = 1 - depth * np.exp(-np.arange(int(0.3 * SR)) / SR / tau)
            j = min(N, i + len(dip))
            chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    bar = lambda k: D + k * BAR  # noqa: E731
    kick, clap = C.kick(), C.clap()

    def section(t0, chord, k, full):
        root, notes = chord
        place("keys", epiano(notes, BAR), t0, 0.8 if full else 0.65)
        for s16 in range(16):
            m = notes[[0, 1, 2, 3, 2, 1, 3, 2][s16 % 8]] + 12
            place("keys", C.pluck(m, 0.3, tau=0.08, bright=1.3), t0 + s16 * BEAT / 4, (0.16 if full else 0.1) * (1.3 if s16 % 4 == 0 else 1), pan=(-0.45, 0.45)[s16 % 2])
        if full:
            for b in range(4):
                place("drums", kick, t0 + b * BEAT, 0.95)
                duck(t0 + b * BEAT)
                place("drums", C.hat(open_=True), t0 + (b + 0.5) * BEAT, 0.2, pan=0.2)
            for b in (1, 3):
                place("drums", clap, t0 + b * BEAT, 0.75)
            for s16 in range(16):
                place("drums", C.hat(), t0 + s16 * BEAT / 4, 0.05 + 0.04 * (s16 % 2), pan=-0.25)
            for b in range(4):
                place("bass", C.bass_note(root + 12, BEAT / 2 - 0.04, attack=0.005, release=0.05), t0 + (b + 0.5) * BEAT, 0.9)
                place("bass", C.bass_note(root, BEAT / 2 - 0.04, attack=0.005, release=0.05), t0 + b * BEAT, 0.5)
            for b, m, L in HOOK[k % 4]:
                place("lead", chop(m, L * BEAT * 0.85), t0 + b * BEAT, 0.7, pan=0.05)
                if k >= 4:
                    place("lead", chop(m - 12, L * BEAT * 0.85), t0 + b * BEAT, 0.3)
            if k % 4 == 0:
                place("fx", C.crash(2.2), t0, 0.3)
        else:
            place("drums", kick, t0, 0.4)
            place("drums", kick, t0 + 2 * BEAT, 0.3)
            duck(t0, 0.35)
            for b in (1, 3):
                place("drums", C.shaker(), t0 + b * BEAT, 0.18)
            place("bass", C.bass_note(root + 12, BAR - 0.1, attack=0.2, release=0.3), t0, 0.35)

    k0 = -int(D // BAR)
    for k in range(k0, 0):
        t0 = bar(k)
        if t0 < 0.05:
            continue
        section(t0, CHORDS[(k - k0) % 4], k - k0, False)
    tb = bar(-1)
    for j in range(16):
        place("drums", clap, tb + j * BEAT / 4, 0.08 + 0.5 * (j / 16) ** 1.5)
    place("fx", C.riser(BAR, 300, 12000), tb, 0.5)
    place("lead", chop(81, BEAT * 0.9), tb + 3 * BEAT, 0.5)

    for k in range(8):
        section(bar(k), CHORDS[k % 4], k, True)
    place("fx", C.crash(3.0), bar(0), 0.45)

    for j in range(8):
        tbb = bar(8) + j * BEAT
        x = j / 8
        place("keys", epiano(CHORDS[3][1] if j >= 4 else CHORDS[1][1], BEAT), tbb, 0.5 + 0.2 * x)
        for q in range(2 if x < 0.5 else 4):
            place("drums", kick, tbb + q * BEAT / (2 if x < 0.5 else 4), 0.5 + 0.4 * x)
            duck(tbb + q * BEAT / (2 if x < 0.5 else 4), 0.5, 0.08)
        place("drums", clap, tbb + BEAT / 2, 0.25 + 0.4 * x)
    place("fx", C.riser(2 * BAR, 300, 13000), bar(8), 0.5)

    hit = bar(10)
    ring = END - hit
    place("keys", epiano([57, 60, 64, 69, 72, 76], ring - 0.6), hit, 1.0)
    place("keys", S.pad([57, 64, 69, 72, 76], ring - 0.8, attack=0.01, release=1.4, cutoff=4500), hit, 0.45)
    place("bass", C.bass_note(33, ring - 0.5, attack=0.005, release=1.5), hit, 0.85)
    place("drums", kick, hit, 1.1)
    place("drums", clap, hit, 0.8)
    place("fx", C.crash(3.5), hit, 0.45)
    place("lead", chop(81, 0.9), hit, 0.6)
    place("lead", chop(76, 0.9), hit + 0.03, 0.4)

    B["bass"] *= chain[None, :]
    B["keys"] *= chain[None, :] ** 0.5
    wet = C.reverb(B["keys"] * 0.3 + B["lead"] * 0.4 + B["drums"] * 0.1 + B["fx"] * 0.3, C.IR_HALL)[:, :N]
    delay = C.delay_pingpong(B["lead"], BEAT * 0.75, feedback=0.3, taps=4)[:, :N]
    mix = B["drums"] * 0.9 + B["bass"] * 0.75 + B["keys"] * 0.7 + B["lead"] * 0.65 + delay * 0.2 + B["fx"] * 0.5 + wet * 0.3
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
