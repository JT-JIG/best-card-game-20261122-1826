// Aether Duel — the hand-in program for the best card game bounty.
//
// The game lives beside this file as plain static files (game/) and the
// screenshots live in screenshots/. This program's only job is to place
// them where the gate reads them and write the dossier the judge reads:
// it copies game/ and screenshots/ into the output directory, then
// writes dossier.json with make.fun's own dossier library.
//
// Node 22, standard library only; nothing is installed before it runs.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from: string, to: string): void {
  if (!existsSync(from)) {
    throw new Error(`Aether Duel: missing ${from} — the game folder must sit beside main.ts`);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));

// The scorer's own caps for this bounty: the dossier's text budget and
// the limits on screenshots and game files. buildDossier refuses an
// entry the scorer would refuse, so a bad hand-in fails here, loudly,
// instead of silently there.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// A successful copy is not proof the hand-in is complete: after the
// dossier is written, verify the entry the gate will see — the game
// entry point and at least three screenshots — and fail loudly if
// anything is missing, so a silent partial copy never ships.
const gameEntry = join(outputDir, 'game', 'index.html');
if (!existsSync(gameEntry)) {
  throw new Error('Aether Duel: game/index.html did not land in the output');
}
const shotCount = readdirSync(join(outputDir, 'screenshots')).length;
if (shotCount < 3) {
  throw new Error(`Aether Duel: only ${shotCount} screenshots in the output, need at least 3`);
}

console.log(`Aether Duel handed in: game/, ${shotCount} screenshots and dossier.json written.`);
