# NEXUS RNA BioSolutions v1.8 — Clear Platform Redesign

## Release summary
Homepage presentation and navigation upgrade only. All 63 other files from the v1.7 website-only deployment package are copied without modification (cryptographic SHA-256 checked). The original v1.7 homepage is retained as `homepage_v1.7_backup.html` for rollback. The new homepage is `index.html`.

## New homepage
- Clear headline: From RNA sequence to research evidence.
- Four pathways: RNA design, LNP & DOE, analytical QC, DBTL.
- Searchable directory of 17 existing research tools, with functional category filters.
- Direct Project Hub launch and illustrative project workflow.
- Services and applications clearly separated from research-stage software.
- Mobile navigation, keyboard-friendly links and reduced-motion CSS.

## Scope and limitations
No computational engines, existing tools, data storage or saved project schemas have been modified. This is a communication and usability release. The email contact form retains the previously configured address; configure a business contact address before publicity. Instrument-data import accepts export tables, not proprietary raw instrument files. DBTL uses local, descriptive analysis and manual structure import; it is not a validated end-to-end AI RNA optimizer. No patient or confidential research sequence data should be submitted through the website contact form.

## Deploy with Cloudflare Pages
Option A: Git-linked Pages — extract the ZIP and commit the entire folder contents into the root of the connected GitHub repository. Preserve all `tools/` subfolders. Avoid uploading the ZIP as a single repo file.
Option B: Direct Upload Pages — upload the ZIP as a deployment to the **existing** Direct Upload project. Cloudflare's two project modes are distinct; if the project uses Git integration, deploy through Git instead.
Do not add an extra top-level folder containing `index.html` and `tools/`.

## Verification checklist
1. Load `/` and confirm new headline and four pathways.
2. Select each category and search "ddPCR", "UTR" and "DOE"; confirm expected cards.
3. Open the qPCR/ddPCR designer: `/tools/seqfold/qpcr.html`.
4. Open Coding/UTR: `/tools/construct-studio/utr.html`.
5. Open DBTL: `/tools/construct-studio/dbtl.html`.
6. Open Instrument Import: `/tools/instrument-import/index.html`.
7. Open Project Hub: `/tools/project-hub/index.html` and verify a local test project can be saved.
8. Verify on a phone; the top navigation becomes a Menu control.
9. Review user-facing "research-use" and contact form language before public launch.

Keep the v1.7 ZIP as an offline backup. Previous v1.7 science modules and local project storage keys were not edited.
