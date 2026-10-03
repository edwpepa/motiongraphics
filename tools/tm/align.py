"""Estimate word onsets for the launch voiceover: each phrase span was measured from silence gaps;
inside a phrase, words are spread by syllable count and snapped to the nearest energy dip."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PHRASES = [
    ("tm", 0.07, 0.81, "Timișoara…"),
    ("veste", 1.18, 2.43, "avem o veste bună."),
    ("orice", 3.55, 5.15, "Orice ai nevoie prin casă,"),
    ("loc", 5.25, 7.59, "de acum se rezolvă dintr-un singur loc."),
    ("s0", 7.99, 8.75, "Instalații."),
    ("s1", 8.97, 9.90, "Montat mobilă."),
    ("s2", 10.05, 10.60, "Zugrăvit."),
    ("s3", 10.85, 11.55, "Curățenie."),
    ("s4", 11.70, 12.45, "Tuns iarba."),
    ("s5", 12.60, 13.15, "Mutat."),
    ("s6", 13.35, 15.13, "Ba chiar și plimbat cățelul."),
    ("tot", 15.59, 15.94, "Tot."),
    ("pe", 16.26, 16.88, "Pe Handly."),
    ("postezi", 17.22, 19.58, "Postezi ce ai nevoie în mai puțin de un minut,"),
    ("oferte", 19.76, 22.86, "iar taskeri verificați din Timișoara îți trimit oferte."),
    ("alegi", 23.20, 23.78, "Tu alegi,"),
    ("platesti", 23.97, 25.12, "plătești în siguranță"),
    ("urmaresti", 25.29, 27.26, "și urmărești totul din aplicație."),
    ("daca", 27.63, 29.22, "Și dacă știi să faci ceva,"),
    ("castigi", 29.42, 30.50, "câștigi din asta,"),
    ("timp", 30.72, 31.53, "când ai tu timp."),
    ("pornit", 31.97, 33.47, "Am pornit din Timișoara."),
    ("curand", 33.76, 35.66, "În curând, în toate orașele."),
    ("handly", 36.12, 36.60, "Handly."),
    ("cta", 36.90, 39.39, "Descarcă aplicația și hai să rezolvăm."),
]

VOW = "aeiouăâîy"


def syll(w):
    w = re.sub(r"[^a-zăâîșțA-ZĂÂÎȘȚ]", "", w.lower())
    groups = re.findall(f"[{VOW}]+", w)
    n = 0
    for g in groups:
        n += 1 if len(g) < 3 else 2
    if w.endswith("i") and len(groups) > 1 and not w.endswith("ii"):
        n -= 0.5  # short final -i (verificați, cureți)
    return max(1.0, n)


def main():
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "v.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public/audio/tm-vo.mp3"), "-ac", "1", "-ar", "16000", wav], check=True)
        sr, x = wavfile.read(wav)
    x = x.astype(float) / 32768
    hop = int(sr * 0.01)
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(e + 1e-9)
    out = {}
    OVERRIDE = {}
    for key, a, b, text in PHRASES:
        words = text.split()
        if False:
            out[key] = {"start": a, "end": b, "text": text, "words": []}
            continue
        ws = [syll(w) for w in words]
        tot = sum(ws)
        dur = b - a
        t = a
        res = []
        for i, w in enumerate(words):
            on = t
            if i > 0:
                # snap to the deepest dip within ±90 ms
                lo, hi = int((on - 0.09) * 100), int((on + 0.09) * 100)
                lo = max(lo, int(a * 100) + 1)
                seg = db[lo:hi]
                if len(seg):
                    on = (lo + int(np.argmin(seg))) / 100 + 0.02
            res.append([w, round(on, 2)])
            t += dur * ws[i] / tot
        if key in OVERRIDE:
            res = [[w, t] for (w, _), t in zip(res, OVERRIDE[key])]
        out[key] = {"start": a, "end": b, "text": text, "words": res}
    json.dump(out, open(os.path.join(ROOT, "src/tm/vo-words.json"), "w"), ensure_ascii=False, indent=1)
    for k, v in out.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
