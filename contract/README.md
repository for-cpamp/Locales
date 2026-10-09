# Message contract

The Language Pack envelope and the CPAMP message contract are versioned separately.

- `schemaVersion` versions the JSON pack envelope.
- `messageContractVersion` versions message shapes, interpolation variables,
  plural families, and allowed rich-message components.

The first message contract is intentionally not frozen during repository
bootstrap. When CPAMP I18N-A is accepted, this directory will gain the canonical
v1 contract and `contract/status.json` will move out of `pending-i18n-a`.
