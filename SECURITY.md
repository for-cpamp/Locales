# Security

Language Packs are non-executable presentation data.

A contribution must not introduce JavaScript, CSS, external assets, network
endpoints, route hooks, or executable behavior. Publishable packs are checked
for dangerous object keys and message-contract violations.

A valid SHA-256 proves artifact integrity relative to the Registry catalog; it
is not an independent trust signature.

For vulnerabilities affecting CPAMP runtime behavior rather than translation
wording, report them to the main CPAMP project.
