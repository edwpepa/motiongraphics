"""Launch film mix: re-paced voiceover + edited, ducked song + a few synced hits.
Reads src/launch/timeline.json and src/launch/vo-words.json; writes public/audio/launch-mix.mp3."""
import json, math, os, subprocess, sys, tempfile
import numpy as np
import scipy.io.wavfile as wavfile
from scipy import signal

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "audio"))
import compose as C  # noqa: E402  (synth helpers)

ROOT = C.ROOT
SR = C.SR
TL = json.load(open(os.path.join(ROOT, "src/launch/timeline.json")))
WORDS = json.load(open(os.path.join(ROOT, "src/launch/vo-words.json")))
D = TL["drop"]
END = TL["end"]
N = int(END * SR)


def load(path):
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "x.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "2", "-ar", str(SR), wav], check=True)
        _, x = wavfile.read(wav)
    return x.astype(np.float64).T / 32768


def fade(x, a=0.006, b=0.03):
    n = x.shape[1]
    e = np.ones(n)
    na, nb = int(a * SR), int(b * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nb: e[-nb:] = np.minimum(e[-nb:], np.linspace(1, 0, nb))
    return x * e[None, :]


def at_of(spec):
    if isinstance(spec, (int, float)):
        return float(spec)
    if spec == "drop":
        return D
    return D + float(spec.split("+")[1])


def main():
    vo_src = load(os.path.join(ROOT, "public/audio/launch-vo.mp3"))
    song = load(os.path.join(ROOT, "public/audio", TL["songFile"]))

    # ---- voice
    vo = np.zeros((2, N))
    for c in TL["pre"]:
        a, b = c["vo"]
        place_clip(vo, fade(vo_src[:, int(a * SR):int(b * SR)], 0.01, 0.06), c["at"])
    for key, r in TL["post"].items():
        p = WORDS[key]
        a, b = p["start"] - 0.1, p["end"] + 0.18
        place_clip(vo, fade(vo_src[:, int(a * SR):int(b * SR)], 0.01, 0.08), D + r - 0.1)

    # ---- song edit
    mus = np.zeros((2, N))
    for s in TL["song"]:
        at = at_of(s["at"])
        clip = song[:, int(s["from"] * SR):int(s["to"] * SR)].copy()
        if s.get("muffle"):
            n = clip.shape[1]
            nb = int(math.ceil(n / 256))
            k = np.linspace(0, 1, nb)
            fcs = 420 * (1000 / 420) ** (k ** 2)
            clip = np.stack([C.swept(clip[ch], "lowpass", fcs, order=2) for ch in range(2)]) * 1.25
            clip = fade(clip, 1.2, 0.8)
        else:
            clip = fade(clip, 0.004, 0.02)
        place_clip(mus, clip, at)
    # tail of the song fades out by END
    t = np.arange(N) / SR
    mus *= np.interp(t, [END - 2.5, END - 0.05], [1, 0])[None, :]

    # ---- sfx
    sfx = np.zeros((2, N))
    C.place(sfx, C.reverse_swell(2.2), D - 2.2, 0.55)
    C.place(sfx, C.riser(2.4, 300, 7000), D - 2.4, 0.22)
    for at, g in ((D, 1.0), (D + TL["finalR"], 0.9)):
        C.place(sfx, C.sub_drop(2.0), at, 0.9 * g)
        C.place(sfx, C.reverb(C.crash(2.8)), at, 0.35 * g)
    C.place(sfx, C.sub_drop(2.4), D + TL["endHitR"], 0.8)
    C.place(sfx, C.reverse_swell(1.2), D + TL["breakR"] - 1.0, 0.3)
    # a soft impact under "Handly." in the break
    C.place(sfx, C.reverb(C.bell(76, 2.4, ratio=2.0, index=1.0, tau=1.2)), D + TL["post"]["handly"], 0.18)

    # ---- level + duck
    vo *= 10 ** ((-15.5 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-15.0 - C.lufs(mus)) / 20)
    sfx *= 10 ** ((-24.0 - C.lufs(sfx)) / 20)
    env = C.follower(vo[0], 0.03, 0.45)
    env /= np.max(env) + 1e-9
    depth = np.where(t < D, -7.0, -10.0)
    duck = depth * np.clip(env * 4.0, 0, 1)
    mus *= (10 ** (duck / 20))[None, :]
    # pre-drop bed sits low under the story
    mus *= np.interp(t, [0, D - 0.01, D], [0.62, 0.62, 1.0])[None, :]

    mix = vo + mus + sfx
    mix *= 10 ** ((-14.0 - C.lufs(mix)) / 20)
    mix = C.soft_limit(mix, 0.89)
    print(f"vo {C.lufs(vo):.1f} | music {C.lufs(mus):.1f} | sfx {C.lufs(sfx):.1f} | mix {C.lufs(mix):.1f}")
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "mix.wav")
        wavfile.write(wav, SR, (np.clip(mix, -1, 1).T * 32767).astype(np.int16))
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(ROOT, "public/audio/launch-mix.mp3")], check=True)
    print("wrote public/audio/launch-mix.mp3")


def place_clip(bus, x, at):
    i = int(round(at * SR))
    n = min(x.shape[1], bus.shape[1] - i)
    if n > 0:
        bus[:, i:i + n] += x[:, :n]


if __name__ == "__main__":
    main()
