"""Mix for the EDW hiring film: the assembled voiceover (tools/hire/align.py) + an original score in the same
dark D-minor language as the brand film (clock, ostinato, taiko, braams) + sound design for the logo morphs,
the transmission and the website. Writes public/audio/hire-mix.mp3."""
import json, math, os, subprocess, sys, tempfile
import numpy as np
import scipy.io.wavfile as wavfile

HERE = os.path.dirname(__file__)
sys.path.insert(0, os.path.join(HERE, "..", "edw"))
import mix as M  # noqa: E402  (the brand film's instruments and sound design)

C, S, X = M.C, M.S, M.X
ROOT, SR = C.ROOT, C.SR
END = 49.5
N = int(END * SR)
W = json.load(open(os.path.join(ROOT, "src/hire/vo-words.json")))
T = lambda key, i=0: W[key]["words"][min(i, len(W[key]["words"]) - 1)][1]  # noqa: E731
HIT = 34.3
FINAL = 44.8  # the signal lights up in the clouds
BEAT, BAR = 0.6, 2.4
PROG = M.PROG
tt, norm, rng = M.tt, M.norm, M.rng


def score():
    B = {k: np.zeros((2, N)) for k in ("perc", "low", "str", "brass", "pad", "choir", "fx")}
    chain = np.ones(N)

    def place(bus, x, at, g=1.0, pan=0.0):
        C.place(B[bus], x if x.ndim == 2 else C.stereo(x, pan), at, g)

    def duck(at, depth=0.5, tau=0.12):
        i = int(at * SR)
        if 0 <= i < N:
            dip = 1 - depth * np.exp(-np.arange(int(0.4 * SR)) / SR / tau)
            j = min(N, i + len(dip))
            chain[i:j] = np.minimum(chain[i:j], dip[: j - i])

    tick, tock = C.tick(2900), C.tick(2100)
    bar = lambda k: HIT + k * BAR  # noqa: E731

    # I. the transmission (0 – 16.6): drone, the clock, a heartbeat; strings creep in from "only the ones"
    place("pad", M.drone([38, 45, 50], 16.6, cutoff=520, attack=2.5), 0.0, 0.85)
    place("low", np.sin(2 * np.pi * 36.7 * tt(16.6)) * np.clip(tt(16.6) / 2, 0, 1) * 0.45, 0.0, 1.0)
    for i in range(int(1.0 / (BEAT / 2)), int(16.4 / (BEAT / 2))):
        at = i * BEAT / 2
        place("perc", tick if i % 2 == 0 else tock, at, 0.1 + 0.18 * at / 16.4, pan=0.35 if i % 2 else -0.35)
    for k in range(1, 7):
        place("low", X.heart()[0], k * BAR, 0.7)
    for i in range(int(7.8 / (BEAT / 4)), int(16.3 / (BEAT / 4))):
        at = i * BEAT / 4
        k = int(at // BAR)
        root = PROG[k % 4][0]
        x = (at - 7.8) / 8.5
        place("str", M.stac([root + 24, root + 36, root + 31, root + 36][i % 4]), at, 0.08 + 0.3 * x, pan=(-0.3, 0.3)[i % 2])
    # the music breathes with the ring
    br0 = T("sharp", 14) - 0.3
    for k in range(3):
        place("pad", M.drone([50, 57, 62], 3.2, cutoff=1800, attack=1.4), br0 + k * 3.2, 0.28)
    place("fx", M.bloom_hit(2.5), T("calm", 0) - 0.02, 0.5)

    # II. the offer (17.6 – 33.4): the full machine
    k0 = math.ceil((17.6 - HIT) / BAR)
    for k in range(k0, 0):
        at = bar(k)
        if at < 17.55:
            continue
        root, tones = PROG[k % 4]
        x = (at - 17.6) / (HIT - 17.6)
        if k % 2 == 0:
            place("brass", M.braam(root, 2 * BAR), at, 0.35 + 0.25 * x)
        place("pad", M.drone(tones, BAR, cutoff=1400 + 1600 * x, attack=0.1), at, 0.4)
        place("low", C.bass_note(root, BAR - 0.05, attack=0.01, release=0.2), at, 0.6)
        if x > 0.4:
            place("choir", S.choir([n + 12 for n in tones], BAR, attack=0.3), at, 0.2 + 0.2 * x)
        for s16 in range(16):
            place("str", M.stac([root + 24, root + 36, root + 31, root + 36][s16 % 4]), at + s16 * BEAT / 4, 0.42 if s16 % 4 == 0 else 0.3, pan=(-0.35, 0.35)[s16 % 2])
        for b, m, g in ((0, 36, 1.0), (1.5, 43, 0.55), (2, 36, 0.75), (3, 36, 0.6), (3.5, 41, 0.55)):
            place("perc", M.taiko(m), at + b * BEAT, g * (0.7 + 0.3 * x))
        for b in (1, 3):
            place("perc", S.bigclap(), at + b * BEAT, 0.18)
        duck(at, 0.45)
        for q in range(8):
            place("perc", tick, at + q * BEAT / 2, 0.14, pan=0.4)
    place("perc", M.taiko(31), 17.62, 1.2)
    place("brass", M.braam(38, 4.0), 17.62, 0.8)
    place("fx", C.reverse_swell(1.0), HIT - 1.0, 0.9)
    place("fx", C.riser(1.6, 150, 8000), HIT - 1.6, 0.35)

    # III. the hit, then the website (HIT – 44): lighter, a pulse and the clock
    place("brass", M.braam(38, 5.0), HIT, 1.0)
    place("perc", M.taiko(31), HIT, 1.4)
    place("fx", C.crash(4.0), HIT, 0.6)
    place("choir", S.choir([62, 69, 74], 4.0, attack=0.1), HIT, 0.5)
    tail = 43.9 - (HIT + 1.2)
    place("pad", M.drone([38, 45, 50, 57], tail + 1.0, cutoff=1100, attack=1.0), HIT + 1.2, 0.6)
    for i in range(int(tail / (BEAT / 2))):
        at = HIT + 1.2 + i * BEAT / 2
        place("perc", tick if i % 2 == 0 else tock, at, 0.16, pan=0.35 if i % 2 else -0.35)
        if i % 4 == 0:
            place("low", X.heart()[0], at, 0.6)
    for i in range(int((43.9 - 38.6) / (BEAT / 4))):
        at = 38.6 + i * BEAT / 4
        x = (at - 38.6) / 5.3
        place("str", M.stac([50, 62, 57, 62][i % 4]), at, 0.06 + 0.3 * x, pan=(-0.3, 0.3)[i % 2])
    place("fx", C.reverse_swell(1.2), FINAL - 1.2, 0.8)

    # IV. the mark, and the ring-out
    ring = END - FINAL
    place("brass", M.braam(38, ring), FINAL, 1.0)
    place("perc", M.taiko(31), FINAL, 1.3)
    place("choir", S.choir([62, 69, 74, 77], ring - 0.8, attack=0.15), FINAL, 0.7)
    place("pad", M.drone([38, 50, 57, 62, 65], ring - 0.4, cutoff=2600, attack=0.05), FINAL, 0.65)
    place("low", C.bass_note(26, ring - 0.4, attack=0.005, release=2.0), FINAL, 0.85)

    for k in ("low", "pad", "str", "choir"):
        B[k] *= chain[None, :] ** 0.7
    wet = C.reverb(B["perc"] * 0.25 + B["str"] * 0.35 + B["brass"] * 0.3 + B["pad"] * 0.3 + B["choir"] * 0.6 + B["fx"] * 0.3, C.IR_HALL)[:, :N]
    mix = B["perc"] * 0.85 + B["low"] * 0.8 + B["str"] * 0.6 + B["brass"] * 0.8 + B["pad"] * 0.55 + B["choir"] * 0.55 + B["fx"] * 0.6 + wet * 0.4
    return np.tanh(mix * 1.1) / 1.1


def sfx():
    s = np.zeros((2, N))
    P = lambda x, at, g=1.0: C.place(s, x if x.ndim == 2 else C.stereo(x), at, g)  # noqa: E731
    bang = T("growing", 0)
    # the transmission opens and closes
    P(M.tx_in(1250, 1850, 0.22), bang - 0.6, 0.9)
    P(M.tx_out(1500, 1000, 0.3), 16.62, 1.0)
    # the map: Romania lights with the transmission, the world opens, routes fly out and land
    P(M.air_swell(1.9), 0.7, 0.55)
    for i in range(16):
        st = 1.2 + i * 0.085
        P(C.whoosh(0.5, 600, 5000, 0.7, (-0.2, 0.6 if i % 2 else -0.6), air=0.35), st, 0.22)
        P(M.ping(int(rng.choice([84, 86, 89, 91, 93, 96]))), st + 0.75, 0.16)
    # the team: three lights switching on over the empty places
    P(M.soft_pass(0.8, (-0.4, 0.4)), 3.05, 0.5)
    for k in range(3):
        P(M.thud(), T("growing", 7) + k * 0.16, 0.45)
    # the crowd murmurs; one lights up; the mind turns sharp
    P(M.rumble(2.0) * 0.6, 5.9, 0.6)
    P(M.bloom_hit(2.5), T("sharp", 0) - 0.02, 0.55)
    P(X.shimmer(), T("sharp", 7), 0.5)
    # the maze solves itself
    P(C.whoosh(1.2, 400, 6000, 0.7, (-0.6, 0.6), air=0.8), T("sharp", 9) - 0.1, 0.5)
    P(X.success(), T("sharp", 13), 0.35)
    # the roof: thunder and rain
    P(M.thunder(), 13.55 + 0.45, 0.85)
    P(M.rain(3.3) * np.clip(tt(3.3) / 0.3, 0, 1)[None, :] * np.clip((3.3 - tt(3.3)) / 0.6, 0, 1)[None, :], 13.55, 0.8)
    # the city rises; one tower is yours
    P(M.rumble(5.5) * 0.7, 17.6, 0.6)
    for i in range(24):
        P(X.click(), 17.9 + i * 0.22, 0.12)
    P(M.bloom_hit(2.5), T("yours", 2) - 0.02, 0.6)
    # sunrise over the world
    P(M.air_swell(1.6), T("anywhere", 4) - 1.4, 0.5)
    P(X.shimmer(), T("anywhere", 4) + 0.1, 0.45)
    # the blueprint, the chair blown to dust
    P(M.soft_pass(1.0, (-0.5, 0.5)), 29.6, 0.45)
    P(C.whoosh(0.9, 300, 3000, 0.6, (-0.3, 0.8), air=0.9), T("sit", 5) - 0.05, 0.6)
    # the storm; the searchlight bangs on
    P(M.thunder(), 33.5, 0.9)
    # the website
    P(M.soft_pass(0.8, (0.4, -0.4)), 36.4, 0.5)
    P(X.click(), T("hiring", 2), 0.8)
    P(X.expand(), T("hiring", 2) + 0.05, 0.4)
    for a, b, txt in ((T("hiring", 5) - 0.1, T("hiring", 8) + 0.2, "Alex Morgan"), (T("tell", 0), T("tell", 4) + 0.1, "A real-time engine that runs 2M devices."), (T("tell", 5), T("tell", 9) + 0.1, "Cut latency 10x on a system nobody could fix.")):
        for i, ch in enumerate(txt):
            if ch != " ":
                P(X.key(), a + (b - a) * i / len(txt), 0.18)
    P(X.click(), T("there", 0) - 0.05, 0.8)
    # sent: the page fades, the mark appears in space
    P(M.air_swell(FINAL - T("there", 0)), T("there", 0), 0.7)
    P(M.bloom_hit(END - FINAL), FINAL - 0.02, 0.9)
    return s


def main():
    subprocess.run([sys.executable, os.path.join(HERE, "align.py")], check=True, stdout=subprocess.DEVNULL)
    _, v = wavfile.read(os.path.join(ROOT, "public/audio/hire-vo.wav"))
    v = v.astype(np.float64) / 32768
    vo = np.zeros((2, N))
    C.place(vo, v[:N], 0.0, 1.0)
    vo = np.stack([C.filt(vo[c], "highpass", 70, 2) for c in range(2)])
    mus = score()
    t = np.arange(N) / SR
    mus *= np.interp(t, [0, 0.3, END - 1.0, END - 0.05], [0, 1, 1, 0])[None, :]
    fx = sfx()
    vo *= 10 ** ((-15.0 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-15.5 - C.lufs(mus)) / 20)
    fx *= 10 ** ((-21.0 - C.lufs(fx)) / 20)
    env = C.follower(vo[0], 0.03, 0.45)
    env /= np.max(env) + 1e-9
    mus *= (10 ** (-9.0 * np.clip(env * 4.0, 0, 1) / 20))[None, :]
    mus *= np.interp(t, [16.5, 16.8, 17.5, 17.62, HIT - 0.9, HIT - 0.6, HIT - 0.01, HIT], [1, 0.3, 0.3, 1, 1, 0.4, 0.4, 1])[None, :]
    mix = vo + mus + fx
    mix *= 10 ** ((-14.0 - C.lufs(mix)) / 20)
    mix = C.soft_limit(mix, 0.89)
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public/audio/hire-mix.mp3")], check=True)
    print(f"mix {C.lufs(mix):.1f} LUFS")


if __name__ == "__main__":
    main()
