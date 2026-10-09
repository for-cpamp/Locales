import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  ROOT, BUILTIN_LOCALES, MAX_PACK_BYTES, canonicalLocale, countLegacyArrays,
  flattenStrings, localeDirectories, readJson, validateInterpolation,
  validatePluralFamilies, validateRichMessages
} from './lib.mjs';

const exists = async (file) => access(file).then(() => true, () => false);
const dirs = await localeDirectories();
let publishableCount = 0;

for (const dir of dirs) {
  const base = path.join(ROOT, 'locales', dir);
  const manifest = await readJson(path.join(base, 'manifest.json'));
  if (manifest.schemaVersion !== 1) throw new Error(`${dir}: manifest schemaVersion must be 1`);
  const canonical = canonicalLocale(manifest.locale);
  if (canonical !== manifest.locale) throw new Error(`${dir}: locale must be canonical (${canonical})`);
  if (manifest.locale !== dir) throw new Error(`${dir}: directory and manifest locale differ`);
  if (!manifest.nativeName?.trim()) throw new Error(`${dir}: nativeName is required`);
  if (!['ltr', 'rtl'].includes(manifest.direction)) throw new Error(`${dir}: invalid direction`);
  if (BUILTIN_LOCALES.has(manifest.locale)) throw new Error(`${dir}: built-in locale cannot be Community`);

  if (!manifest.publishable) {
    const legacyFile = path.join(base, 'legacy.json');
    if (!(await exists(legacyFile))) throw new Error(`${dir}: non-publishable legacy seed requires legacy.json`);
    const legacy = await readJson(legacyFile);
    if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) throw new Error(`${dir}: legacy root must be object`);
    console.log(`legacy seed ${dir}: preservation only; arrays=${countLegacyArrays(legacy)}`);
    continue;
  }

  publishableCount += 1;
  if (manifest.status !== 'community') throw new Error(`${dir}: publishable locale must use status=community`);
  if (!Number.isInteger(manifest.messageContractVersion) || manifest.messageContractVersion < 1) throw new Error(`${dir}: messageContractVersion required`);
  if (manifest.direction !== 'ltr') throw new Error(`${dir}: RTL is not production-supported yet`);

  const translationsFile = path.join(base, 'translations.json');
  if (!(await exists(translationsFile))) throw new Error(`${dir}: translations.json required`);
  if (Buffer.byteLength(await readFile(translationsFile)) > MAX_PACK_BYTES) throw new Error(`${dir}: translations.json exceeds ${MAX_PACK_BYTES} bytes`);

  const sourceFile = path.join(ROOT, 'source', 'en.json');
  const contractFile = path.join(ROOT, 'contract', `message-contract-v${manifest.messageContractVersion}.json`);
  if (!(await exists(sourceFile))) throw new Error(`${dir}: source/en.json is not frozen`);
  if (!(await exists(contractFile))) throw new Error(`${dir}: message contract missing`);

  const source = flattenStrings(await readJson(sourceFile));
  const target = flattenStrings(await readJson(translationsFile));
  const contract = await readJson(contractFile);
  if (contract.messageContractVersion !== manifest.messageContractVersion) throw new Error(`${dir}: contract version mismatch`);

  validateInterpolation(source, target);
  validatePluralFamilies(manifest.locale, source, target);
  validateRichMessages(contract, target);

  const covered = [...source.keys()].filter((key) => target.has(key)).length;
  console.log(`publishable ${dir}: ${target.size} messages, exact-key coverage ${covered}/${source.size}`);
}

const status = await readJson(path.join(ROOT, 'contract', 'status.json'));
if (publishableCount > 0 && status.status !== 'active') throw new Error('publishable locales exist while message contract is inactive');

console.log(`validation complete: ${dirs.length} locale directories, ${publishableCount} publishable`);
