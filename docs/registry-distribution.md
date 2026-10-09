# Registry distribution

The CPAMP Community Language Registry has two outputs from every accepted
`main` revision.

## 1. Auditable Actions artifact

Every push to `main` validates and deterministically builds `dist/`, then
uploads an Actions artifact named:

```text
cpamp-locales-registry-<commit-sha>
```

The artifact is retained for 90 days and is intended for acceptance review,
debugging, and audit. It is **not** the runtime download endpoint.

## 2. Production GitHub Pages Registry

The same already-validated `dist/` directory is uploaded as a GitHub Pages
artifact and deployed through the protected `github-pages` environment.

Expected production paths:

```text
https://for-cpamp.github.io/Locales/catalog.json
https://for-cpamp.github.io/Locales/packs/<locale>/<sha256>.json
```

Only manifests with `publishable: true` are emitted into the catalog. During
the I18N-A bootstrap period, `zh-TW` and `ru` remain legacy seeds and the
production catalog is intentionally empty.

## Repository setup requirement

GitHub Pages must be enabled once in repository settings with:

```text
Settings → Pages → Build and deployment → Source: GitHub Actions
```

No personal access token or deployment secret is required. The deployment job
uses GitHub's OIDC flow with `pages: write` and `id-token: write`.

## Release model

Locale wording changes do not create GitHub Releases. A merge to `main`
creates a new Registry deployment.

Pack artifacts are content-addressed:

```text
packs/<locale>/<sha256>.json
```

A changed pack gets a new path. Existing SHA-addressed pack paths are immutable.
The mutable entry point is only `catalog.json`, which points clients to the
current immutable pack artifact.

## Runtime trust boundary

SHA-256 verifies that a downloaded pack matches the catalog. It is an integrity
check, not an independent signature. Repository governance, required CI, and
the fixed Registry origin are the trust root.

Before CPAMP enables the production Registry endpoint, acceptance must verify
from a real browser origin that GitHub Pages serves `catalog.json` and pack
JSON with CORS behavior compatible with both Full Web and Panel Lite.
