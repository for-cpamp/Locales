import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BUILTIN_LOCALES = new Set(['zh-CN', 'en']);
export const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export const MAX_PACK_BYTES = 2 * 1024 * 1024;
export const MAX_DEPTH = 8;
export const MAX_MESSAGES = 20_000;

export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export function canonicalLocale(locale) {
  const values = Intl.getCanonicalLocales(locale);
  if (values.length !== 1 || values[0].length > 64) throw new Error(`invalid locale: ${locale}`);
  return values[0];
}

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}
export const stableJson = (value) => JSON.stringify(stable(value));
export const sha256 = (data) => createHash('sha256').update(data).digest('hex');

export function flattenStrings(value, prefix = '', out = new Map(), state = { count: 0 }) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`translation object expected at ${prefix || '<root>'}`);
  }
  const walk = (node, keyPath, depth) => {
    if (depth > MAX_DEPTH) throw new Error(`translation depth exceeds ${MAX_DEPTH}: ${keyPath}`);
    for (const [key, child] of Object.entries(node)) {
      if (DANGEROUS_KEYS.has(key)) throw new Error(`dangerous key is forbidden: ${keyPath ? keyPath + '.' : ''}${key}`);
      const next = keyPath ? `${keyPath}.${key}` : key;
      if (typeof child === 'string') {
        out.set(next, child);
        state.count += 1;
        if (state.count > MAX_MESSAGES) throw new Error(`message count exceeds ${MAX_MESSAGES}`);
      } else if (child && typeof child === 'object' && !Array.isArray(child)) {
        walk(child, next, depth + 1);
      } else {
        throw new Error(`Language Pack v1 allows only object/string values: ${next}`);
      }
    }
  };
  walk(value, prefix, 1);
  return out;
}

export function interpolationVariables(message) {
  const vars = new Set();
  for (const match of message.matchAll(/{{\s*([^{}]+?)\s*}}/g)) {
    const name = match[1].split(',')[0].trim();
    if (name) vars.add(name);
  }
  return [...vars].sort();
}

const sameArray = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

export function validateInterpolation(source, target) {
  for (const [key, targetMessage] of target.entries()) {
    const sourceMessage = source.get(key);
    if (sourceMessage === undefined) continue;
    const a = interpolationVariables(sourceMessage);
    const b = interpolationVariables(targetMessage);
    if (!sameArray(a, b)) throw new Error(`interpolation mismatch at ${key}: source=[${a}] target=[${b}]`);
  }
}

export function validatePluralFamilies(locale, source, target) {
  const families = new Set();
  for (const key of source.keys()) {
    if (key.endsWith('_one') && source.has(key.slice(0, -4) + '_other')) families.add(key.slice(0, -4));
  }
  const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  for (const base of families) {
    const targetHasAny = [...target.keys()].some((key) => key.startsWith(base + '_'));
    if (!targetHasAny) continue;
    for (const category of categories) {
      if (!target.has(`${base}_${category}`)) throw new Error(`plural family ${base} is partial for ${locale}; missing _${category}`);
    }
  }
}

function richTags(message) {
  return [...message.matchAll(/<\/?([A-Za-z][A-Za-z0-9_-]*)\s*>/g)].map((match) => ({
    name: match[1],
    closing: match[0].startsWith('</')
  }));
}

export function validateRichMessages(contract, target) {
  for (const [key, spec] of Object.entries(contract?.richMessages ?? {})) {
    const message = target.get(key);
    if (message === undefined) continue;
    const allowed = new Set(spec.components ?? []);
    const balance = new Map();
    for (const tag of richTags(message)) {
      if (!allowed.has(tag.name)) throw new Error(`rich component <${tag.name}> not allowed at ${key}`);
      balance.set(tag.name, (balance.get(tag.name) ?? 0) + (tag.closing ? -1 : 1));
      if ((balance.get(tag.name) ?? 0) < 0) throw new Error(`unbalanced rich component at ${key}`);
    }
    for (const [name, count] of balance) if (count !== 0) throw new Error(`unbalanced rich component <${name}> at ${key}`);
  }
}

export async function localeDirectories() {
  const entries = await readdir(path.join(ROOT, 'locales'), { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export function countLegacyArrays(value) {
  let arrays = 0;
  const walk = (node) => {
    if (Array.isArray(node)) { arrays += 1; node.forEach(walk); }
    else if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(value);
  return arrays;
}
