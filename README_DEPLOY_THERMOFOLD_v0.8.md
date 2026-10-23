# NEXUS RNA BioSolutions v1.8.17 — Independent ThermoFold v0.8

The complete site is based on NEXUS v1.8.16 and preserves older research workbenches. New features are located on the existing `/tools/seqfold/thermofold-ensemble.html` and `/tools/seqfold/thermofold.html` pages.

## Changes
- Centroid stem–loop depiction and ensemble uncertainty indicators in the Ensemble Lab.
- Per-structure missing-parameter audit with MFE result export.
- Additional numeric verification tests and scientific benchmark guide.
- No payment, authentication, scientific model validation or external reference engine is newly activated.

## Deployment

1. Keep a backup of the currently published website and locally stored research projects.
2. Extract the ZIP; upload the **contents**, maintaining relative directories, to the GitHub repository connected to Cloudflare Pages, or use the existing direct-upload workflow.
3. When published, open `/tools/seqfold/thermofold-ensemble.html`. Load `GGGAAACCC`, click **Calculate**, confirm centroid hairpin and diversity values appear, and export the JSON report.
4. Open `/tools/seqfold/thermofold.html` and confirm the hairpin ΔG breakdown now includes qualitative model-coverage flags.
5. Test mobile browser, privacy links and login workflows on the deployed origin. Browser tests against a simulated local document do not replace a real HTTPS deployment test.

## Scientific limits

NEXUS ThermoFold is **not RNAfold-equivalent**. The 125-case external comparison gate remains BLOCKED until versioned, authentic reference records are executed. See `THERMOFOLD_v0.8_INDEPENDENT_VALIDATION.md`.
