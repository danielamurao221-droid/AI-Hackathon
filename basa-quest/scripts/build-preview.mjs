// Builds ONE self-contained HTML file (CSS + JS inlined) for quick previews,
// e.g. a private claude.ai Artifact or opening the file from a USB stick.
// Routes use "#teacher" instead of "/teacher". Audio files are not included.
//   npm run build:preview   ->   preview/basa-quest.html
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = 'dist-preview';
execSync(`npx vite build --mode single --base ./ --outDir ${out} --emptyOutDir`, {
  stdio: 'inherit',
  env: { ...process.env, VITE_HASH_ROUTES: '1' },
});

const assets = join(out, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');

const html = `<title>Basa Quest</title>
<meta name="robots" content="noindex">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
mkdirSync('preview', { recursive: true });
writeFileSync('preview/basa-quest.html', html);
rmSync(out, { recursive: true, force: true });
console.log(`preview/basa-quest.html  ${(html.length / 1024).toFixed(0)} KB`);
