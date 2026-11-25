# RNA Construct Strategy Studio — Research Integrity & Security Status

Updated: 2026-11-25

## Implemented
- Modality-specific research validation planning matrices with purpose, measurement scope, controls, evidence output, and study-specific acceptance-criteria prompts (not executable SOPs or assay validation).
- NK-specific planning for CAR-NK, non-CAR receptor/trafficking and immune-support mRNA concepts.
- Four individually linked example NK-cell mRNA studies with bibliographic identifiers, approximate research-group identification, and topical summaries.
- Optional public-keyword screening against curated study metadata; labels only **topic overlap**. Never claims identical research, originality, patentability or freedom to operate.
- User-initiated PubMed, ClinicalTrials.gov and patent search links. No confidential research text is automatically submitted to these services.
- Studio JSON export includes the study's validation and reference-review plan.
- Cloudflare Pages `_headers`: MIME sniffing prevention, frame protection, referrer/permissions restrictions, partial CSP, HSTS and no-store on account pages. Must be verified after deployment.
- Supabase project `veirjzgdllnipvwbffmf` security inspection on 2026-11-25: the research-project table has RLS enabled; ownership predicates are present on SELECT/INSERT/UPDATE/DELETE. Supabase security advisors returned no lint findings at audit time.
- Automated GitHub regression testing: `.github/workflows/research-integrity-checks.yml`, including a static security baseline check.

## Important limits
- **Not full validation protocols:** Assay acceptance values, standard operating instructions, qualified methods, statistics and biological replication must be defined and reviewed by the research team. No expression/efficacy predictions are made.
- **Not an exhaustive prior-art or exact-duplication engine:** Curated references and a keyword comparison cannot account for all journal articles, preprints, posters, unpublished work, company disclosures, or patent claims. Novelty and legal FTO require independent review.
- **Not a comprehensive cybersecurity guarantee:** Static-site security headers and browser-side checks do not replace secure authentication configuration, strict CSP, continuous vulnerability monitoring, penetration testing, access logging, recovery procedures, or appropriate data handling.
- **No production deployment claim:** GitHub commits and CI success do not independently confirm Cloudflare deployed the updated site. Cloudflare HTTP response headers and UI should be checked on the real domain.
- **Sensitive data:** Do not enter unpublished proprietary sequences, IP-sensitive details, or identifiable clinical data into the public keyword field. Browser-local saved projects are not equivalent to a secured, encrypted enterprise research repository.

## Recommended next technical gates
1. Introduce opt-in server-mediated PubMed/ClinicalTrials.gov search with pagination, validated citations and date-stamped provenance; maintain provenance for trials and company sources.
2. Require study-dimension matching (target, disease, mRNA chemistry, cell source, delivery route, readouts, date) before presenting probable duplication. Label results as human-review required.
3. Extend modality-specific protocol templates to measured data acceptance records with sample traceability, orthogonal readouts and reviewer sign-off where applicable.
4. Audit frontend dependencies and inline scripts, then deploy an enforced restrictive CSP after browser compatibility testing.
5. Review Supabase Auth settings, MFA choices, storage/session risks, Cloudflare WAF/rate limiting, recovery, logging and incident response. Run authenticated security testing before handling confidential research data.


## 2026-11-25 — Source-backed landscape v2
- Added on-demand, public-only research retrieval via Cloudflare Pages Function `/api/research-landscape?q=...`. Sources are official PubMed E-utilities and ClinicalTrials.gov v2. The endpoint returns at most eight publication and eight registry records per request, with publication identifier, title, date, first authors where available, clinical sponsor, trial status, original URLs and source-availability diagnostics. The API has bounded inputs, request timeouts, response-size limits and no credentials, proprietary data or sequences.
- New Strategy Studio UI requires an explicit user click. Only publicly entered keywords, target, indication and delivery terms are sent. Model and readout comparisons are browser-local. Metadata comparisons label shared terms, never exact study duplication or proven novelty. Search results and retrieval timestamps can be exported in research strategy JSON.
- Added a monthly public reference snapshot `assets/nexus-research-landscape.json` using `.github/workflows/research-landscape-refresh.yml` and `scripts/update_research_landscape.py`. Runs on the fifth of each month and optionally via GitHub workflow dispatch. It refreshes from fixed public search topics only; no user input is collected. A partial or failed live request uses this snapshot as a clearly labeled fallback, never as a falsely current search.
- First GitHub scheduled-index workflow run: successful on 2026-11-25. Initial snapshot holds 19 source records, PubMed and ClinicalTrials.gov available, no source-query errors. Snapshot data may be superseded by subsequent scheduled refreshes.
- Added regression tests in `tests/research-landscape.test.cjs` for rejects, source parsing, partial outage handling, safe opt-in, and snapshot provenance. CI includes these tests.
- Deployment limitation: a GitHub push does not prove Cloudflare Pages has enabled its Functions runtime or deployed the latest build. Public endpoint `https://nexus-rna-site.pages.dev/api/research-landscape?q=CAR%20NK%20mRNA` must return JSON with schema `nexus-live-landscape-v1` on the real public deployment. Confirm the UI at `/tools/construct-studio/index.html` and check browser console/Cloudflare Functions logs.
- The live search is subject to upstream public API availability and rate limits; anonymous production rate limiting/WAF, monitoring, site CSP hardening and security tests remain operator-level gates. Results are not an exhaustive systematic review and patent search remains an external user-initiated link, not a validated FTO engine.
