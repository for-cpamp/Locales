# Locale source layout

Each locale owns one directory under `locales/`.

## Legacy seed

```text
locales/<locale>/
  manifest.json
  legacy.json
```

A legacy seed uses `publishable: false` and is never emitted into
`dist/catalog.json`.

## Publishable Community locale

```text
locales/<locale>/
  manifest.json
  translations.json
```

A publishable locale must satisfy Language Pack v1 and the active message
contract. CPAMP v2 initially publishes only LTR Community packs; RTL metadata is
reserved for later UI acceptance.
