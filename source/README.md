# Canonical English source

Publishable Community Language Packs are compared against the canonical English
source exported from an explicitly reviewed CPAMP source after I18N-A.

During repository bootstrap, `legacy-en.json` is retained only as migration
evidence from `1ea181093df14a4297c12a3ea3050acd84849cdc`. It is **not** the frozen Language Pack v1
message source.

After I18N-A:

1. run the upstream sync workflow with an explicit CPAMP ref;
2. review the generated `source/en.json`;
3. freeze the message contract;
4. convert Community legacy seeds to `translations.json`;
5. only then mark them publishable.
