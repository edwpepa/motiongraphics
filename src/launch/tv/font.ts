import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

/** Outfit, the free stand-in for Matter: one variable file per subset (weights 100–900), latin + latin-ext for ă â î ș ț */
export const OUTFIT = "Outfit, Inter, sans-serif";
const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

let loading: Promise<unknown> | null = null;
const loadOutfit = () => {
  if (loading) return loading;
  const faces = [
    new FontFace("Outfit", `url(${staticFile("fonts/outfit/outfit-latin.woff2")}) format('woff2')`, { weight: "100 900", unicodeRange: LATIN }),
    new FontFace("Outfit", `url(${staticFile("fonts/outfit/outfit-latin-ext.woff2")}) format('woff2')`, { weight: "100 900", unicodeRange: LATIN_EXT }),
  ];
  loading = Promise.all(faces.map((face) => face.load().then((f) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(f))));
  return loading;
};

/** blocks rendering until Outfit is in, so measured layouts use the real metrics */
export const useOutfit = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Outfit"));
  useEffect(() => {
    loadOutfit()
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => {
        console.error(err);
        continueRender(handle);
      });
  }, [handle]);
  return ready;
};
