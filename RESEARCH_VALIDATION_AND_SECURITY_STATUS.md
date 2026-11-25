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
