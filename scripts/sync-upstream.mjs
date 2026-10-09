import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, countLegacyArrays, sha256, stableJson } from './lib.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--ref');
const ref = i >= 0 ? args[i + 1] : null;
if (!ref) {
  console.error('usage: node scripts/sync-upstream.mjs --ref <explicit CPAMP tag/commit/ref>');
  process.exit(2);
}

const api = new URL('https://api.github.com/repos/seakee/CPA-Manager-Plus/contents/apps/web/src/i18n/locales/en.json');
api.searchParams.set('ref', ref);
const response = await fetch(api, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'for-cpamp-locales-sync' } });
if (!response.ok) throw new Error(`upstream fetch failed: HTTP ${response.status}`);
const payload = await response.json();
if (!payload.content || payload.encoding !== 'base64') throw new Error('unexpected GitHub contents response');
const raw = Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
const parsed = JSON.parse(raw);
const arrays = countLegacyArrays(parsed);
if (arrays > 0) throw new Error(`upstream English still contains ${arrays} array-valued message(s); I18N-A is not complete`);

await writeFile(path.join(ROOT, 'source', 'en.json'), JSON.stringify(parsed, null, 2) + '\n');
console.log(`synced English source from ${ref}; revision=sha256:${sha256(stableJson(parsed))}`);
