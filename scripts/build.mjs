import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, flattenStrings, localeDirectories, readJson, sha256, stableJson } from './lib.mjs';

const validation = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'validate.mjs')], { stdio: 'inherit' });
if (validation.status !== 0) process.exit(validation.status ?? 1);

const manifests = [];
for (const dir of await localeDirectories()) {
  const manifest = await readJson(path.join(ROOT, 'locales', dir, 'manifest.json'));
  if (manifest.publishable) manifests.push(manifest);
}

const dist = path.join(ROOT, 'dist');
await rm(path.join(dist, 'packs'), { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let sourceFlat = null;
let sourceRevision = null;
let messageContractVersion = null;

if (manifests.length > 0) {
  const source = await readJson(path.join(ROOT, 'source', 'en.json'));
  sourceFlat = flattenStrings(source);
  sourceRevision = 'sha256:' + sha256(stableJson(source));
  const versions = new Set(manifests.map((m) => m.messageContractVersion));
  if (versions.size !== 1) throw new Error('Registry build requires one active messageContractVersion');
  messageContractVersion = [...versions][0];
}

const languages = [];
for (const manifest of manifests.sort((a, b) => a.locale.localeCompare(b.locale))) {
  const translations = await readJson(path.join(ROOT, 'locales', manifest.locale, 'translations.json'));
  const pack = {
    schemaVersion: 1,
    messageContractVersion: manifest.messageContractVersion,
    locale: manifest.locale,
    nativeName: manifest.nativeName,
    direction: manifest.direction,
    translations
  };
  const body = stableJson(pack) + '\n';
  const digest = sha256(body);
  const relative = `packs/${manifest.locale}/${digest}.json`;
  const output = path.join(dist, ...relative.split('/'));
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, body);

  const targetFlat = flattenStrings(translations);
  const covered = [...sourceFlat.keys()].filter((key) => targetFlat.has(key)).length;
  languages.push({
    locale: manifest.locale,
    nativeName: manifest.nativeName,
    direction: manifest.direction,
    coverage: Number((covered / sourceFlat.size).toFixed(6)),
    messageContractVersion: manifest.messageContractVersion,
    sourceRevision,
    artifact: relative,
    sha256: digest,
    size: Buffer.byteLength(body)
  });
}

await writeFile(path.join(dist, 'catalog.json'), JSON.stringify({
  schemaVersion: 1,
  messageContractVersion,
  sourceRevision,
  languages
}, null, 2) + '\n');

console.log(`built Registry catalog with ${languages.length} publishable locale(s)`);
