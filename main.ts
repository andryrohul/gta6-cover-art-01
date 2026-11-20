// main.ts — the entrypoint: hands the app in.
//
// It copies app/ and screenshots/ from this repository into the output
// directory and writes dossier.json there with buildDossier from
// vendor/makefun-app.ts, the kit's library. The grader runs this program
// twice in a fresh container (no network, read-only repository, writable
// output) and both runs must write the same bytes, so everything here is
// deterministic: no timestamps, no random data, no environment sniffing
// beyond the output directory itself.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The build this program belongs to. It is printed in the run summary so a
// stale output directory is easy to spot; it never enters the dossier.
const ENTRY_VERSION = 'vice-city-sunset-v5';

// The gate's caps, as RULES.txt states them: the dossier text is capped at
// 160 KiB, screenshots at 4 images of 256 KiB each, app/ at 993 entries
// and 48 MiB, and every path at 1,000 UTF-8 bytes.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
} as const;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), {
  recursive: true,
});

const dossier = buildDossier(outDir, DOSSIER_CAPS);
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);

// Verify the hand-in before reporting success: the dossier must read back
// as JSON, and the output must hold the app and the screenshots that went
// into it. A silent half-written output is worse than a loud failure.
const parsed = JSON.parse(readFileSync(dossierPath, 'utf-8'));
if (!parsed || typeof parsed !== 'object') {
  throw new Error('main.ts: dossier.json did not parse back as JSON');
}
const countFiles = (dir: string): number => {
  let total = 0;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    total += statSync(path).isDirectory() ? countFiles(path) : 1;
  }
  return total;
};
const appFiles = countFiles(join(outDir, 'app'));
const shotFiles = countFiles(join(outDir, 'screenshots'));

console.log(
  `Vice City Sunset — Cover Maker ${ENTRY_VERSION}: ` +
    `wrote dossier.json (${dossier.length} bytes, ${appFiles} app files, ` +
    `${shotFiles} screenshots) to ${outDir}`,
);
