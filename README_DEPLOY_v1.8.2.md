# NEXUS RNA BioSolutions v1.8.2 — commercial launch UI and RNA → protein

## Summary
- Refined homepage ribbon: Platform | Research tools | Applications | Services & pricing; Sign in; Open workspace.
- Added `services.html` with proposed scoped consulting offers and provisional Free/Pro/Lab/Enterprise software roadmap.
- Added `account/sign-in.html`, a transparent sign-in introduction with working guest path and early-access email CTA. **No credential fields or server-side accounts exist yet.**
- Added `tools/construct-studio/rna-protein.html` for coding RNA translation, protein FASTA, official AlphaFold DB link by manually verified UniProt accession, and local PDB summary. Moved the AlphaFold interface out of DBTL; retained DBTL RNA folding and evidence tracker.
- New `rnaProtein` project module is browser-local and exportable through the Project Hub. No server account sync.
- Oncology/Hematology, prior SeqFold tools, LNP, QC, DOE, instrument import etc remain in place.

## Publish
1. Download and extract the full ZIP.
2. Back up the currently deployed Cloudflare Pages site and repo first.
3. Upload **all extracted website files with their folder paths preserved** to GitHub; do not upload the ZIP file into the repository as a single binary and do not accidentally nest an extra top-level folder.
4. If your Pages project is a direct-upload project, use Cloudflare's Pages deployment workflow instead of assuming Git commit redeploys.
5. Confirm `/`, `/services.html`, `/account/sign-in.html`, `/tools/construct-studio/rna-protein.html`, `/tools/construct-studio/dbtl.html` and existing tool pages all open.
6. Test guest project locally, CSV/FASTA downloads, AlphaFold DB outbound link, quote email client, and narrow mobile navigation.

## Account boundary
The sign-in page is **not an operational login**. There is no credential collection. The existing Project Hub uses localStorage and is not a private synchronized database. Do not use it for sensitive sequences, personal health information, confidential client data, GMP records or Part 11 records. Before activating paid subscriptions, build server-side identity, email verification/passwordless OAuth, HTTPS session handling, role-based authorization, per-tenant permissions, encrypted backups, monitoring, incident response, payment processing and legal review.

## Paid feature roadmap (not implemented)
- Keep basic public tools free: SeqFold, CDS/UTR heuristics, cloning/primer tools, basic DOE/LNP/QC calculations and guest workspaces.
- Research Pro: secure persistent projects, batch analyses, evidence-backed reports, advanced multi-run QC and DOE/DBTL review.
- Laboratory Team: collaboration, role-based project sharing, instrument-export pipelines, study-level reporting, provenance and change review.
- Enterprise: custom integrations, SSO/private hosting, independent security and method qualification engagements. Do not claim GMP/Part 11 compliance until demonstrated and audited.

## Scientific limits
RNA-to-protein translation assumes a known coding region and standard genetic code; no ORF detection or UniProt matching occurs automatically. PDB confidence and sequence comparisons are exploratory. AlphaFold DB is an external protein model database under CC BY 4.0 (attribution required). AlphaFold Server is a separate noncommercial inference service, not integrated here. Avoid asserting that predicted protein structures rank synonymous RNA construct performance.

## Commercial boundaries
Prices displayed are **nonbinding proposals**; no checkouts, subscriptions or customer accounts are live. The quote form prepares a mailto draft; it is not a hosted lead database. Confirm business inbox before broad marketing. Service engagements require individual scope, confidential information handling agreements, IP ownership review and qualified partner contracts as applicable.
