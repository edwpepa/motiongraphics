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


def build_score():
    B = {k: np.zeros((2, N)) for k in ("drums", "bass", "pad", "lead", "choir", "pluck", "fx")}
    chain = np.ones(N)

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.8, tau=0.11):
        i = int(at * SR)
        if 0 <= i < N:
            dip = 1 - depth * np.exp(-np.arange(int(0.35 * SR)) / SR / tau)
            j = min(N, i + len(dip))
            chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    bar = lambda k: D + k * BAR  # noqa: E731
    stomp, clap, kick, hey = S.stomp(), S.bigclap(), S.hard_kick(), S.hey()

    # ---- intro: a light, friendly pulse under the story, building into the drop
    k0 = -int(D // BAR)
    for k in range(k0, 0):
        t0 = bar(k)
        if t0 < 0.05:
            continue
        name, root, tones = S.PROG[(k - k0) % 4]
        late = k >= -3
        place("pad", S.pad(tones, BAR, attack=0.4, release=0.6, cutoff=1800 + 600 * late), t0, 0.45)
        place("bass", C.bass_note(root, BAR - 0.05, attack=0.05, release=0.2), t0, 0.4)
        for s in range(8):
            m = tones[[0, 2, 1, 3, 2, 1, 3, 2][s]] + 12
            place("pluck", S.pluck(m, 0.45, 0.14), t0 + s * BEAT / 2, 0.22 + 0.06 * late, pan=(-0.4, 0.4)[s % 2])
        for b in (0, 2):
            place("drums", stomp * 0.7, t0 + b * BEAT, 0.55)
            duck(t0 + b * BEAT, 0.4)
        for b in (1, 3):
            place("drums", clap, t0 + b * BEAT, 0.28)
        for s in range(8):
            place("drums", C.shaker(), t0 + s * BEAT / 2, 0.07 + 0.04 * (s % 2), pan=0.3)
    # build: last bar before the drop
    tb = bar(-1)
    for j in range(16):
        place("drums", S.bigclap(), tb + j * BEAT / 4, 0.12 + 0.45 * j / 16)
    place("fx", C.riser(BAR, 300, 12000), tb, 0.55)

    # ---- chorus: 8 bars from the drop
    for k in range(8):
        t0 = bar(k)
        name, root, tones = S.PROG[k % 4]
        for b in range(4):
            place("drums", kick, t0 + b * BEAT, 0.95)
            duck(t0 + b * BEAT, 0.85, 0.12)
        for b in (0, 2):
            place("drums", stomp, t0 + b * BEAT, 0.45)
        for b in (1, 3):
            place("drums", clap, t0 + b * BEAT, 0.8)
        for s in range(8):
            place("drums", C.hat(open_=(s % 2 == 1)), t0 + s * BEAT / 2, 0.2 if s % 2 else 0.09, pan=0.25)
        if k % 2 == 1:
            place("drums", hey, t0 + 3 * BEAT, 0.45)
        if k % 4 == 0:
            place("fx", C.crash(2.4), t0, 0.4)
        for s in range(16):
            place("bass", S.dbass(root + (12 if s % 4 == 2 else 0), BEAT / 4 - 0.02), t0 + s * BEAT / 4, 0.65 if s % 4 else 0.42)
        place("pad", S.pad([n + 12 for n in tones], BAR, attack=0.01, release=0.2, cutoff=5000), t0, 0.5)
        for b, m, L in S.HOOK[k % 4]:
            place("lead", S.lead(m, L * BEAT * 0.92), t0 + b * BEAT, 0.6)
            place("lead", S.lead(m + 12, L * BEAT * 0.92), t0 + b * BEAT, 0.22)
        if k >= 4:
            place("choir", S.choir([tones[0] + 12, tones[1] + 12, tones[2] + 12], BAR), t0, 0.7)
    place("fx", C.crash(3.0), bar(0), 0.5)

    # ---- "Am pornit din Timișoara…": a two-bar build into the last hit on "Handly."
    for j in range(8):
        tbb = bar(8) + j * BEAT
        x = j / 8
        div = 2 if x < 0.5 else 4
        for q in range(div):
            place("drums", kick, tbb + q * BEAT / div, 0.5 + 0.4 * x)
            duck(tbb + q * BEAT / div, 0.5, 0.08)
        for q in range(4):
            place("pluck", S.pluck([67, 70, 74, 79][q] + 12 * (j // 4), 0.25, 0.08), tbb + q * BEAT / 4, 0.3 + 0.3 * x)
        place("bass", S.dbass(31, BEAT - 0.03), tbb, 0.5 + 0.3 * x)
    place("fx", C.riser(2 * BAR, 250, 14000), bar(8), 0.6)
    place("pad", S.pad([43, 50, 55, 58, 62], 2 * BAR, attack=1.6, release=0.05, cutoff=3000), bar(8), 0.5)

    # ---- the hit and a gentle ring-out under the call to action
    hit = bar(10)
    ring = END - hit
    place("pad", S.pad([55, 58, 62, 67, 70, 74], ring - 0.8, attack=0.01, release=1.4, cutoff=4200), hit, 0.85)
    place("choir", S.choir([67, 70, 74], ring - 0.8, attack=0.05), hit, 0.8)
    place("bass", C.bass_note(31, ring - 0.5, attack=0.005, release=1.6), hit, 0.85)
    place("drums", stomp, hit, 1.1)
    place("drums", clap, hit, 0.7)
    place("fx", C.crash(4.0), hit, 0.6)
    for k in range(int(ring / BAR)):
        for s in range(8):
            place("pluck", S.pluck([67, 74, 70, 79, 74, 70, 67, 62][s] + 12, 0.4, 0.12), hit + k * BAR + s * BEAT / 2, 0.16, pan=(-0.4, 0.4)[s % 2])

    for k in ("bass", "pad", "choir", "pluck"):
        B[k] *= chain[None, :] ** (1.0 if k == "bass" else 0.6)
    wet = C.reverb(B["drums"] * 0.15 + B["pad"] * 0.35 + B["lead"] * 0.35 + B["choir"] * 0.6 + B["pluck"] * 0.5 + B["fx"] * 0.4, C.IR_HALL)[:, :N]
    delay = C.delay_pingpong(B["lead"], BEAT * 0.75, feedback=0.32, taps=4)[:, :N]
    mix = B["drums"] * 0.9 + B["bass"] * 0.7 + B["pad"] * 0.55 + B["lead"] * 0.6 + delay * 0.18 + B["choir"] * 0.55 + B["pluck"] * 0.5 + B["fx"] * 0.5 + wet * 0.3
    return np.tanh(mix * 1.15) / 1.15, hit


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
