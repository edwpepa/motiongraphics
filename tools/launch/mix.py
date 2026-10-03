"""Launch film mix: re-paced voiceover + edited, ducked song + a few synced hits.
Reads src/launch/timeline.json and src/launch/vo-words.json; writes public/audio/launch-mix.mp3."""
import json, math, os, subprocess, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
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
    import score
    mus = score.build()
    # tail of the song fades out by END
    t = np.arange(N) / SR
    mus *= np.interp(t, [END - 2.5, END - 0.05], [1, 0])[None, :]
    M0 = json.load(open(os.path.join(ROOT, "tools/launch/cues.json")))["marks"]
    # the muffled bed melts away before the bell; quieter under the tasker sign-up;
    # silent through the "we can't" section (only the charging), back on the final drop
    pf = np.clip((t - M0["preFadeFrom"]) / (M0["preFadeTo"] - M0["preFadeFrom"]), 0, 1)
    env = np.where(t < D, (1 - pf) ** 2, 1.0)
    env *= np.interp(t, [M0["contFrom"], M0["contFrom"] + 0.6, M0["contTo"] - 0.4, M0["contTo"]], [1, 0.8, 0.8, 1])
    # suspense: the music stops dead while the shapes gather, until the final chorus
    env *= np.interp(t, [M0["suspense"] - 0.25, M0["suspense"], M0["final"] - 0.03, M0["final"]], [1, 0, 0, 1])
    mus *= env[None, :]
    # from the end of the chorus to the final drop the song plays as if from inside a box:
    # band-limited, a small boxy room, and lower — then it bursts back open on the final chorus
    box = np.stack([C.filt(C.filt(mus[ch], "lowpass", 650, 4), "highpass", 140, 2) for ch in range(2)])
    box = box * 1.9 + C.reverb(box, C.IR_ROOM)[:, :N] * 0.35
    m = np.interp(t, [M0["bridge"] - 0.15, M0["bridge"] + 0.25, M0["final"] - 0.02, M0["final"]], [0, 1, 1, 0])
    mus = mus * (1 - m)[None, :] + box * (m * 0.62)[None, :]

    # ---- sfx (cue sheet exported from the picture: node tools/launch/cues.mjs)
    import sfx as X
    CUES = json.load(open(os.path.join(ROOT, "tools/launch/cues.json")))
    M = CUES["marks"]
    sfx = np.zeros((2, N))
    beds = np.zeros((2, N))
    cache = {}
    for cue in CUES["cues"]:
        k = cue["k"]
        if k == "charge":
            clip, off = X.charge(M["brk"] - cue["t"]), 0.0
        elif k == "calm":
            clip, off = X.calm(D - cue["t"]), 0.0
        elif k == "roll":
            clip, off = X.roll(D - cue["t"]), 0.0
        else:
            if k not in cache or k in ("fall", "bubble", "coin", "drip", "key"):
                r = X.KINDS[k]()
                cache[k] = r if isinstance(r, tuple) else (r, 0.0)
            clip, off = cache[k]
        C.place(beds if k in ("calm", "roll", "charge") else sfx, clip, cue["t"] + off, X.GAIN.get(k, 0.5) * cue["g"])

    # ---- level + duck
    vo *= 10 ** ((-15.5 - C.lufs(vo)) / 20)
    mus *= 10 ** ((-15.0 - C.lufs(mus)) / 20)
    g_sfx = 10 ** ((-21.5 - C.lufs(sfx)) / 20)
    sfx *= g_sfx
    beds *= g_sfx
    env = C.follower(vo[0], 0.03, 0.45)
    env /= np.max(env) + 1e-9
    depth = np.where(t < D, -7.0, -10.0)
    duck = depth * np.clip(env * 4.0, 0, 1)
    mus *= (10 ** (duck / 20))[None, :]
    # pre-drop bed sits low under the story
    mus *= np.interp(t, [0, D - 0.01, D], [0.62, 0.62, 1.0])[None, :]

    # charge / roll beds tuck under the voice too
    beds *= (10 ** (np.clip(env * 4.0, 0, 1) * -7.0 / 20))[None, :]
    mix = vo + mus + sfx + beds
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
