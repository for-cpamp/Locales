# CPAMP Locales

Community-maintained localization registry for [CPA Manager Plus](https://github.com/seakee/CPA-Manager-Plus).

## Scope

CPAMP v2 keeps only **Simplified Chinese (`zh-CN`)** and **English (`en`)** in the core product bundle. Other languages are distributed as declarative CPAMP Language Packs.

This repository is the community contribution and registry source for those external languages.

- `zh-TW` and `ru` start from translations previously shipped with CPAMP.
- They are migrated here as **Community** languages, not long-term seakee-maintained official locales.
- Future languages use the same Language Pack format and review path.
- Users may also import compatible custom Language Packs without contributing them here.

## Bootstrap state

This repository is initialized before CPAMP's I18N-A message-contract cleanup is complete.

The imported Traditional Chinese and Russian resources are therefore stored as **legacy seeds** and are intentionally **not publishable Language Pack v1 artifacts yet**. They preserve existing translation work while the main CPAMP repository removes fixed four-language branches, array-valued messages, and freezes `messageContractVersion: 1`.

Until that contract is ready:

- legacy seeds are not advertised as installable Registry artifacts;
- generated `dist/` contains only locales explicitly marked `publishable: true`;
- CI rejects publishable locales that do not satisfy Language Pack v1.

## Repository model

```text
schema/                 Language Pack / catalog schemas
contract/               Message-contract metadata
source/                 Canonical English baseline after I18N-A
locales/<locale>/       Community locale source and manifest
scripts/                Validation/build/sync tooling
dist/                   Generated registry output
.github/                CI and contribution templates
```

Runtime distribution is separate from source layout:

```text
Community repository
        ↓ CI
Distribution Registry
        ├─ catalog.json
        └─ packs/<locale>/<sha256>.json
```

Pack paths are content-addressed. An artifact at a given SHA-256 path is immutable.

## Automated distribution

Every accepted push to `main` uses the same deterministic `dist/` build for
two outputs:

1. a 90-day GitHub Actions artifact for audit and acceptance;
2. the production GitHub Pages Registry used by CPAMP clients.

Expected Registry endpoint:

```text
https://for-cpamp.github.io/Locales/catalog.json
```

The Pages deployment requires a one-time repository setting:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.

See [docs/registry-distribution.md](docs/registry-distribution.md) for the
distribution and trust model.

## Language tiers

| Tier | Examples | Maintenance |
|---|---|---|
| Built-in | `zh-CN`, `en` | CPAMP core |
| Community | `zh-TW`, `ru`, future locales | Community |
| Custom | User-created valid packs | User |

Community translation freshness is not a CPAMP release blocker. Missing community messages fall back to English in the CPAMP client.

## Security boundary

A Language Pack is presentation data, not a plugin. It cannot add JavaScript, CSS, network hooks, routes, assets, or executable behavior. Rich text is allowed only for message keys whose CPAMP message contract explicitly whitelists components.

SHA-256 in the Registry provides artifact **integrity**, not an independent signature of trust. Trust in community packs comes from repository governance, review, required CI, and distribution permissions.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Do not hand-edit generated `dist/` output.

## License

MIT. Existing CPAMP translations retain their original MIT notice; see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md).
