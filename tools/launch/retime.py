"""Pace the launch voice-over: the read keeps its natural speed; only the pauses go — long silences inside a phrase
shrink to a breath, phrases follow each other closely, the musical moments (charge, drop, the dead stop before
"Dar Handly", build, break, end) are trimmed and snapped to the beat grid. After the dead stop the song restarts on
"Dar", so everything from there on lives on a second grid that starts at bridgeR.
Rewrites src/launch/timeline.json: tempo, intro.chunks (intro file) and pre (launch-vo.mp3), where every chunk is
{vo: [a, b] in source-file seconds, at: output seconds}; the chunk plays sped up, so it lasts (b - a) / tempo."""
import json, math, os, subprocess, tempfile
import numpy as np
import scipy.io.wavfile as wavfile

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
TLp = os.path.join(ROOT, "src/launch/timeline.json")
TL = json.load(open(os.path.join(ROOT, "src/launch/timeline_v6.json")))
IW = json.load(open(os.path.join(ROOT, "src/launch/intro-words.json")))
W = json.load(open(os.path.join(ROOT, "src/launch/vo-words.json")))
TEMPO = 1.0
BEAT = 0.4799
SR = 22050
BREATH = 0.24  # longest silence left inside a phrase (output seconds)


def load(p):
    with tempfile.TemporaryDirectory() as td:
        o = os.path.join(td, "x.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", p, "-ac", "1", "-ar", str(SR), o], check=True)
        _, x = wavfile.read(o)
    return x.astype(float) / 32768


A_INTRO = load(os.path.join(ROOT, "public/audio", TL["intro"]["file"]))
A_VO = load(os.path.join(ROOT, "public/audio/launch-vo.mp3"))


def pieces(audio, a, b, min_sil):
    """split [a, b] (source seconds) at its inner silences longer than min_sil; keeps 60 ms of air at each cut"""
    hop = int(0.01 * SR)
    seg = audio[int(a * SR):int(b * SR)]
    n = len(seg) // hop
    if n < 3:
        return [(a, b)]
    rms = np.array([np.sqrt(np.mean(seg[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    db = 20 * np.log10(rms + 1e-9)
    thr = max(np.percentile(db, 90) - 32, -52)
    quiet = db < thr
    out, start, i = [], a, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            s0, s1 = a + i * 0.01, a + j * 0.01
            if s1 - s0 >= min_sil and s0 > a + 0.15 and s1 < b - 0.15:
                out.append((start, s0 + 0.06))
                start = s1 - 0.06
            i = j
        else:
            i += 1
    out.append((start, b))
    return out


def lay(audio, a, b, start_out):
    """place source [a, b] (a holds 80 ms of air) so its speech starts at start_out; returns chunks, speech end"""
    ch = []
    t = start_out - 0.08 / TEMPO
    # a silence longer than BREATH (in output time) gets cut down to BREATH
    for k, (x0, x1) in enumerate(pieces(audio, a, b, (BREATH + 0.12) * TEMPO)):
        if k > 0:
            t += BREATH - 0.12 / TEMPO
        ch.append({"vo": [round(x0, 3), round(x1, 3)], "at": round(t, 3)})
        t += (x1 - x0) / TEMPO
    return ch, t - 0.16 / TEMPO


intro = []
def ph_i(keys, start_out):
    ch, end = lay(A_INTRO, IW[keys[0]]["start"] - 0.08, IW[keys[-1]]["end"] + 0.16, start_out)
    intro.extend(ch)
    return end


pre = []
post = {}
def ph(key, start_out, drop=None):
    ch, end = lay(A_VO, W[key]["start"] - 0.08, W[key]["end"] + 0.16, start_out)
    pre.extend(ch)
    if drop is not None:
        post[key] = round(start_out - drop, 3)
    return end


G = 0.3
e = ph_i(["probleme"], 0.6)
e = ph_i(["priza", "iarba", "dulap"], e + G)
e = ph_i(["timpul", "sculele", "nervii"], e + G)
e = ph_i(["amani"], e + G)
e = ph_i(["speri", "cumva", "singur"], e + G)
e = ph("lumea", e + G)
e = ph("obositor", e + 0.26)
e = ph("rogi", e + 0.24)
e = ph("aici", e + 0.75)  # the song has melted away; the calm bed
drop = round(e + 1.2, 3)  # the charge
D = drop
snapB = lambda x: math.ceil(x / BEAT - 1e-6) * BEAT
e = ph("postezi", D + 4 * BEAT, D)
for k in ("taskeri", "alegi", "cash", "urmaresti", "fara1"):
    e = ph(k, e + G, D)
e = ph("fara2", e + 0.24, D)
stop = snapB(e - D + 0.3)  # everything stops dead, on a beat
dar = stop + 0.8  # black, silence
bridge = dar - 0.06  # the song comes back with "Dar", on its own grid
e = ph("dar", D + dar, D)
for k in ("daca", "skills", "cont", "program", "taskurile", "muncesti"):
    e = ph(k, e + G, D)
snap2 = lambda x: bridge + math.ceil((x - bridge) / BEAT - 1e-6) * BEAT
build = snap2(e - D + 0.15)
brk = build + 4 * BEAT
final = brk + 4 * BEAT
ph("handly", D + brk + 0.17, D)
e = ph("ajutor", D + final + 3 * BEAT, D)
e = ph("bani", e + G, D)
e = ph("cta", e + 0.3, D)
end_hit = snap2(e - D + 0.5)
total = D + end_hit + 2.8

out = dict(TL)
out["tempo"] = TEMPO
out["intro"] = {"file": TL["intro"]["file"], "chunks": intro}
out["pre"] = pre
out["drop"] = D
out["post"] = {}
out["postStart"] = post
out["bridgeR"] = round(bridge, 3)
out["stopR"] = round(stop, 3)
out["buildR"] = round(build, 3)
out["bassBackR"] = round(post["cont"] - 0.4, 3)
out["quietR"] = round(post["program"] - 0.4, 3)
out["breakR"] = round(brk, 3)
out["finalR"] = round(final, 3)
out["endHitR"] = round(end_hit, 3)
out["end"] = round(total, 3)
out.pop("song", None)
json.dump(out, open(TLp, "w"), indent=1, ensure_ascii=False)
print(f"intro chunks {len(intro)}, vo chunks {len(pre)}")
print(json.dumps({"drop": D, "stop": D + stop, "bridge": D + bridge, "dar": D + post["dar"], "build": D + build, "break": D + brk, "final": D + final, "ajutor": D + post["ajutor"], "endHit": D + end_hit, "end": total}))
print(post)
