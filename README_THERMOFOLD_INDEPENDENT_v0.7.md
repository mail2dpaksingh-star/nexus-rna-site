# NEXUS Independent ThermoFold v0.7 — Deployment

This ZIP is a complete NEXUS website based on v1.8.15 with a new independently implemented structural ensemble lab.

## Files and entry points

- `tools/seqfold/thermofold-ensemble.html`: new interactive ensemble analysis.
- `tools/seqfold/thermofold-ensemble-core.js`: original inside/outside partition function and base-pair probabilities.
- `tools/seqfold/thermofold-ensemble-ui.js`: dot plot, reports, FASTA input and CSV/JSON/SVG exports.
- `tests/thermofold-ensemble-v07.test.cjs` and `tests/thermofold-ensemble-random-v07.test.cjs`: numerical and independent-enumeration tests.
- `THERMOFOLD_INDEPENDENT_ENSEMBLE_v0.7.md`: mathematical scope and scientific limitations.

## Publish with GitHub + Cloudflare Pages

1. Keep a copy of your currently published site. Unzip this release locally.
2. Upload the **contents** of the extracted directory, not the ZIP alone, to the existing GitHub website repository, retaining nested paths.
3. Commit and wait for the connected Cloudflare Pages deployment to complete, or use your existing Cloudflare Direct Upload workflow if Git is not connected.
4. Verify `/tools/seqfold/thermofold-ensemble.html` loads, compute the built-in synthetic hairpin, export its results, and confirm the links back to the main ThermoFold and the homepage.
5. Do not expose or upload confidential customer RNA sequences until security requirements for the hosting environment are independently assessed. No additional account/billing setup is required for this guest-access, browser-local tool.

## Version and calculation limits

- New independent ensemble: ≤110 nt, fixed 37°C, unmodified A/C/G/U.
- Restricted global MFE: ≤280 nt.
- Segmented explorer: ≤3,000 nt with no global inter-segment interactions.
- No full ViennaRNA energetics or external scientific benchmark parity claimed.

For future professional software deployments, prioritize completed thermodynamic parameterization, independent model validation, secure accounts and a documented software quality system.
