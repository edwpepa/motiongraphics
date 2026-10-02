// Bundles src/launch/cues.ts and writes tools/launch/cues.json (frames → seconds).
import { buildSync } from "esbuild";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const out = path.join(root, "tools/launch/.cues.bundle.mjs");
buildSync({ entryPoints: [path.join(root, "src/launch/cues.ts")], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const m = await import(pathToFileURL(out).href);
const cues = m.cues().map((c) => ({ t: c.f / 30, k: c.k, g: c.g ?? 1 }));
fs.writeFileSync(path.join(root, "tools/launch/cues.json"), JSON.stringify({ cues, marks: m.marks() }, null, 1));
fs.rmSync(out);
console.log(`${cues.length} cues`);
