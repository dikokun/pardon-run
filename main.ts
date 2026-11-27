// Hand-in program for PARDON RUN (Node 22, standard library only).
// The game itself is the static site under game/ — index.html plus its
// ES modules, no vendored code and no assets. This program copies
// game/ and screenshots/ into the output directory and writes
// dossier.json with the kit's buildDossier. Run locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps passed to buildDossier below mirror the gate's own limits,
// so a local run refuses what the scorer would refuse: at most 4
// screenshots of 256 KiB, at most 993 files and 48 MiB under game/.

writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game: { max_files: 993, max_bytes: 50331648, max_path_bytes: 1000 },
  }),
);
console.log(`PARDON RUN handed in to ${outDir}`);
