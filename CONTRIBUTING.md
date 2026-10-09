# Contributing translations

CPAMP core maintains only `zh-CN` and `en`. This repository accepts
Community Language Packs.

## Rules

1. Use a canonical BCP-47 locale identifier.
2. Do not add JavaScript, CSS, assets, remote URLs, executable hooks, routes, or menus through translation data.
3. Preserve interpolation variables such as `{{count}}`.
4. Rich-message components are allowed only when the active message contract explicitly lists them.
5. Do not include credentials, tokens, private URLs, or request contents.

## Bootstrap state

`zh-TW` and `ru` are legacy seeds with `publishable: false`.
Do not make them publishable until CPAMP I18N-A freezes the English source and
`messageContractVersion: 1`.

After the contract is active, a publishable locale uses:

```text
locales/<locale>/
  manifest.json
  translations.json
```

Run:

```bash
npm run validate
npm run build
git diff --exit-code -- dist
```

Coverage below 100% is allowed because missing messages fall back to English.
Generated `dist/` output must not be hand-edited.
