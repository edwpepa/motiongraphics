"""Estimate word onsets for the launch voiceover: each phrase span was measured from silence gaps;
inside a phrase, words are spread by syllable count and snapped to the nearest energy dip."""
import json, os, re, subprocess, tempfile
import numpy as np
from scipy.io import wavfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PHRASES = [
    ("sigh", 0.08, 0.70, "[oftat]"),
    ("of", 0.84, 1.48, "Of..."),
    ("cap", 1.92, 3.28, "câte avem pe cap, nu?"),
    ("robinet", 4.32, 6.84, "Robinetul care curge de două săptămâni."),
    ("perete", 7.34, 9.81, "Peretele care are nevoie de o mână de vopsea"),
    ("situ", 10.23, 10.78, "și tu."),
    ("nici1", 11.22, 13.66, "care n-ai nici timpul, nici sculele,"),
    ("nici2", 13.87, 15.74, "nici nervii pentru toate astea."),
    ("amani", 16.33, 17.61, "Și tot amâni."),
    ("speri1", 18.09, 18.88, "Și speri că,"),
    ("speri2", 19.10, 19.65, "cumva,"),
    ("speri3", 19.90, 20.98, "se rezolvă singur."),
    ("lumea", 22.13, 25.74, "Nu toată lumea are pe cineva de încredere la un telefon distanță."),
    ("obositor", 26.12, 29.77, "Și e obositor să cauți, să suni, să negociezi,"),
    ("rogi", 30.06, 33.40, "și să te rogi să nu dai peste cineva care te păcălește."),
    ("aici", 34.07, 36.05, "Aici intervine Handly."),
    ("postezi", 36.65, 39.41, "Postezi ce ai nevoie, în mai puțin de un minut."),
    ("taskeri", 39.77, 42.86, "Taskeri verificați din orașul tău îți trimit oferte."),
    ("alegi", 43.20, 48.52, "Tu alegi pe cine vrei, vorbești cu el direct în aplicație, și plătești în siguranță"),
    ("cash", 48.74, 50.78, "fără cash care dispare în neștire."),
    ("urmaresti", 51.16, 54.43, "Urmărești tot, în timp real, până task-ul e gata."),
    ("fara1", 55.05, 56.26, "Fără bătaie de cap."),
    ("fara2", 56.53, 57.38, "Fără stres."),
    ("dar", 58.18, 61.63, "Dar Handly nu e doar pentru cei care au nevoie de ajutor."),
    ("daca", 62.18, 63.71, "Dacă știi să faci ceva"),
    ("skills", 63.96, 67.67, "montezi mobilă, zugrăvești, repari, cureți, muți"),
    ("cont", 67.92, 73.31, "îți faci cont de tasker în câteva minute, și începi să câștigi din ce știi deja să faci."),
    ("program", 73.70, 74.80, "Tu alegi programul."),
    ("taskurile", 75.07, 76.24, "Tu alegi task-urile."),
    ("muncesti", 76.54, 78.00, "Tu alegi cât muncești."),
    ("handly", 78.54, 79.05, "Handly."),
    ("ajutor", 79.39, 80.82, "Ajutor când ai nevoie."),
    ("bani", 81.01, 82.42, "Bani când ai timp."),
    ("cta", 82.90, 85.45, "Descarcă aplicația și hai să rezolvăm."),
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
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(ROOT, "public/audio/launch-vo.mp3"), "-ac", "1", "-ar", "16000", wav], check=True)
        sr, x = wavfile.read(wav)
    x = x.astype(float) / 32768
    hop = int(sr * 0.01)
    e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    db = 20 * np.log10(e + 1e-9)
    out = {}
    OVERRIDE = {"cap": [1.92, 2.18, 2.54, 2.74, 3.0]}
    for key, a, b, text in PHRASES:
        words = text.split()
        if key == "sigh":
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
    json.dump(out, open(os.path.join(ROOT, "src/launch/vo-words.json"), "w"), ensure_ascii=False, indent=1)
    for k, v in out.items():
        print(k, " ".join(f"{w}@{s}" for w, s in v["words"]))


if __name__ == "__main__":
    main()
