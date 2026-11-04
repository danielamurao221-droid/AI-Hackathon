// Prints every audio file the game looks for, with the text to record (tab-separated).
//   npm run audio:list                   -> print to the terminal
//   npm run audio:list > audio-list.tsv  -> save a recording checklist (opens in Excel / Sheets)
//   node scripts/list-audio.mjs --json   -> JSON list (used by npm run audio:generate)
// Files that already exist in public/audio are marked "have".
import { build } from 'esbuild';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'bq-audio-'));
const outfile = join(dir, 'manifest.mjs');
await build({
  entryPoints: ['src/content/audioManifest.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile,
  define: { 'import.meta.env.BASE_URL': '"/"' },
  logLevel: 'error',
});
const { audioManifest } = await import(pathToFileURL(outfile).href);
rmSync(dir, { recursive: true, force: true });

const files = audioManifest();
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(files, null, 1));
  process.exit(0);
}
console.log('status\tfile\ttext');
for (const f of files) console.log(`${existsSync(f.path) ? 'have' : 'missing'}\t${f.path}\t${f.text}`);
console.error(`${files.length} files (${files.filter((f) => existsSync(f.path)).length} present)`);
