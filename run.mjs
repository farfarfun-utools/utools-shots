import fs from 'node:fs';
import path from 'node:path';

const APPS_DIR = path.join(import.meta.dirname, 'apps');
const available = fs
  .readdirSync(APPS_DIR)
  .filter((file) => file.endsWith('.mjs'))
  .map((file) => file.slice(0, -4))
  .sort();

const name = process.argv[2];
if (!name || !available.includes(name)) {
  console.error(`Usage: node run.mjs <${available.join('|')}>`);
  process.exit(2);
}

const mod = await import(`./apps/${name}.mjs`);
await mod.default();
