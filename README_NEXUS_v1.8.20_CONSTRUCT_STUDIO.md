# NEXUS RNA BioSolutions v1.8.20 — Program 04 robustness release

## Changes
- New `tools/construct-studio/review.html`: a complete modality-aware **research construct QA** workbench; not a GMP release or biological potency test.
- Verifies RNA input integrity; single FASTA record; nucleotide alphabet; 5′ UTR/CDS/3′ UTR component length and 1-based boundaries; CDS reading frame, AUG initiation, terminal stop and internal premature stops; upstream AUG and selected 3′ UTR motifs; runs of identical bases.
- Differentiates **delivered IVT linear RNA** from **mammalian DNA-driven RNA expression** with distinct capping and polyadenylation processing records.
- Provides conceptual and experimental review of circular RNA, miRNA, siRNA, small activating RNA (RNAa) and self-amplifying RNA (replicon) without pretending they share conventional mRNA architecture.
- Accepts JSON records from existing Full RNA Design Pro, Circular RNA and CDS/UTR Studio; detects inconsistent component sequences versus exported sequence.
- Adds local one-click QA handoff from the Full Construct Architect and Circular RNA Studio; this uses browser-only sessionStorage. Also allows manual input and JSON import.
- Exports sequence FASTA and review JSON. Can save the latest review to the local NEXUS Project Hub under `constructQA` without overwriting other modules.
- Creates a dedicated homepage tool card and Program 04 launch link, without new top-level navigation tabs.

## What this does **not** claim
- No prediction of expression yield, RNA stability, molecular targeting, toxicity, immune activity, potency, or therapeutic effectiveness.
- No sequence model or assay qualifies a batch for GMP release, clinical use, or a regulated quality decision.
- No automatically downloaded or verified promoter, UTR or codon-use reference library is bundled.
- No backend storage or actual user-account verification is activated by this update; local research records remain browser-local unless the user manually exports or later configures the separately developed cloud workspace.

## How to try it
1. Unzip and deploy **all** files to GitHub/Cloudflare Pages, replacing the older site while preserving directory structure.
2. Open `tools/construct-studio/review.html` and select **Load synthetic example**; inspect 1-based boundaries and review findings.
3. Open `tools/construct-studio/pro.html` → **Full Construct Architect** → **Synthetic example** and then **Review construct quality**. The design will hand off to the review page without an upload.
4. Repeat with `tools/construct-studio/circular.html` → **Synthetic example** → **Review circular RNA quality**.
5. Save the result with the same project ID and confirm it appears in `tools/project-hub/index.html`.
6. Export JSON and FASTA; verify imported design documents are distinguished from experimentally qualified constructs.

## Verification performed in the development environment
- **95 existing and new `.test.cjs` tests passed**, including 11 new construct QA unit tests.
- Isolated Chromium desktop/mobile render tests passed, including sample audit, JSON export, local mock save, miRNA annotation and mobile horizontal-overflow check.
- Browser-to-local HTTP navigation is restricted in the test environment; actual multi-page handoff via click needs confirmation after Cloudflare deployment.
- All local HTML file references were scanned for missing paths.
- ThermoFold code, previous LNP/QC/DOE/SeqFold computation engines and deployed Cloudflare account configuration were not modified.

## Next rigorous engineering steps
1. Per-candidate version IDs, signed study provenance and input/output hashes (with real user storage once enabled).
2. Experimental expression/QC evidence linking by construct and sample ID, not just project ID.
3. Confidence-qualified external sequence reference data, annotated start sites and UTRs.
4. Independent protein sequence/topology characterization and empirical stability/translation benchmarks.
5. Scientific verification of project migration, data privacy, authentication and cloud-backed permissions before any paid product launch.
