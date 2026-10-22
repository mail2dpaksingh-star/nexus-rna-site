# NEXUS Advanced RNA Design Pro — Scientific and product guide (v1.8.3)

**Status:** browser-only research pilot. No subscription payments or authenticated accounts. Do not use with patient identifiers, confidential customer sequences, clinical therapeutic decisions, or GMP release data until a validated secure service exists.

## Commercial proposition
The first premium product is **Advanced RNA Design Pro**, initially offered as an openly accessible design-partner pilot. Product differentiation should come from reproducible comparative reports, versioned research projects, evidence integration and well-described uncertainty—not promising a single 'best RNA' prediction.

## Current implemented functionality
- Import one complete coding transcript with start and stop codons, or a protein sequence; include user-provided 5′ and 3′ UTRs.
- Generate up to 120 combinatorial comparison hypotheses from existing NEXUS CDS, 5′ UTR and 3′ UTR algorithms. These heuristics are inherited from v1.6 and are not measured optimization models.
- Check protein-sequence identity, relative GC content, long repeated-nucleotide runs, upstream AUGs, start-codon context and 3′ UTR AU-rich motifs.
- Sort/filter results without interpreting the sorting as a quantitative ranking of RNA expression or half-life.
- Export individual candidates in FASTA, campaign matrices in CSV and complete research records in JSON. Dossier saves are local to the active NEXUS Project Hub ID.
- **Promoter Engineering:** separate DNA-template worksheet. Supports IVT (T7, SP6, T3) motif matching and cellular DNA promoter context (CMV, EF1α, CAG, PGK, U6 and custom), descriptive sequence features and up to 20 user-specified substitutions. This does not calculate or predict promoter strength.
- Export promoter comparison reports and combined dossiers.

## Critical biological distinctions
1. A **T7/SP6/T3 promoter** is a DNA-template element used with a matching bacteriophage RNA polymerase during in vitro transcription. It is generally not part of the final purified mRNA sequence.
2. **CMV, EF1α, CAG, PGK** are DNA expression-vector promoter contexts relevant to eukaryotic transcription. Adding them to a manufactured mature mRNA does not increase translation in the recipient cell. Cellular expression depends on vector, enhancer, cell identity, copy number and regulatory elements.
3. **U6** operates in a different small-RNA RNA polymerase III expression context and is not a substitute for protein-coding mRNA Pol II expression.
4. **Promoter motif matches do not establish promoter identity, active transcription start, directionality, expression strength or specificity.**
5. The RNA candidate sequence excludes cap chemistry, poly(A) tail, modified nucleosides, LNP, and translation initiation/termination validation beyond annotations.

## Validation gates before charging for software
1. Curated and licensed host-specific codon usage / experimentally measured expression benchmarks.
2. Benchmark peptide-preserving translation against independent tools for random and real-world cases.
3. Transcript-feature analysis benchmarked using approved, human-reviewed 5′ and 3′ UTR annotations and cell-specific expression measurements.
4. Promoter worksheet verified against authenticated DNA-template sequences, TSS annotations and relevant polymerase manufacturers' guidance.
5. Prospective blinded test datasets and predefined acceptance criteria; version-controlled algorithms and uncertainty reporting.
6. Authentication, permissions, encryption, backups, logging, secure multi-tenant data storage, customer licensing and billing before real subscriptions.
7. Commercial IP and open-source license review, including any reference databases, and scientific claims review.

## Proposed paid roadmap
- **Research Pro (future, proposed $39/month):** authenticated private projects, multi-campaign history, versioned data reports, expanded batch workflows, comparison dashboards.
- **Laboratory Teams (future, proposed $249/month):** permissions, collaboration, multi-assay study records, controlled shared reporting and audit support.
- **Enterprise (quote):** private deployments, supported instrument connectors, negotiated service levels and enterprise privacy controls.

These prices are test hypotheses, not activated plans; this pilot remains accessible for free.

## References
- Addgene promoter reference: https://www.addgene.org/mol-bio-reference/promoters/
- Addgene comparison of DNA expression contexts: https://blog.addgene.org/plasmids-101-the-promoter-region
- NEB T7 RNA synthesis overview: https://www.neb.com/en-us/protocols/protocol-for-standard-rna-synthesis-using-t7-rna-polymerase-neb-m0251-m0460
- NCBI/PMC T7 promoter sequence study: https://pmc.ncbi.nlm.nih.gov/articles/PMC7668259/

Use official references only as external literature, not as NEXUS-certified validation.
