# NEXUS v1.8.4 — Advanced RNA Design Pro and Circular RNA (Program 04)

**Scope:** browser-local, research-stage design/annotation system. No user accounts or payment enforcement. The generated sequences are computational design hypotheses; no expression, capping, localization, stability or clinical performance is experimentally established by NEXUS.

## Advanced RNA Design Pro — complete construct worksheet

Open `/tools/construct-studio/pro.html`, **1 · Full Construct Architect**.

- **IVT versus mammalian DNA expression:** Choose IVT with T7/SP6/T3 or a mammalian DNA-driven context (CMV, EF1α, CAG, PGK, U6 annotation). The DNA promoter remains distinct from the mature RNA. U6 is a Pol III small-RNA context and is not a substitute for protein-coding Pol II transcription.
- **Promoter DNA:** Supply a user-controlled promoter region; inspect reference matches and downstream bases. No promoter-activity prediction is provided. For precise transcription start, vector architecture and context matter.
- **Capping:** Compare co-transcriptional, post-transcriptional or uncapped IVT research plans. Record intended Cap 0/Cap 1 chemistry and reagent class. When choosing a CleanCap AG-type workflow, check T7/AG initiation compatibility against the **specific reagent manufacturer's protocol**. A match is not evidence of actual incorporation. Capping efficiency and structure require qualified analytical confirmation.
- **Protein coding sequence:** Accept complete CDS or protein; compare reference and synonymous GC-oriented coding hypotheses. Amino acid translation is checked. No cell-line-specific codon dataset is presumed; user-provided codon weights need provenance and validation.
- **Kozak context:** Retain user sequence or generate a canonical-like initiation context variant for comparison. No ribosome-binding-efficiency claims.
- **UTRs:** Use supplied 5′/3′ RNA sequences, inspect upstream AUGs and selected AU-rich or repeat features. No guaranteed increase in stability or translation.
- **Protein targeting:** Optionally append/prepend user-supplied encoded peptide segments for signal-peptide or membrane-anchor design hypotheses. The signal segment must begin with initiating M. The native start-M in the core protein is removed when prepending a signal peptide; the N-terminus and cleavage require experimental confirmation. Sequence analysis is NOT a membrane-topology predictor.
- **Poly(A):** For IVT, record nominal tail length and template-encoded vs post-transcriptional strategy. An exported `A` tract is a design target, not an experimentally measured distribution. For mammalian DNA expression, plan the vector polyadenylation-processing cassette; NEXUS does not simply append a mature poly(A) tail to DNA.
- **Results:** Download transcript FASTA and complete JSON, review quality flags and save a research dossier under your browser-local NEXUS Project Hub ID.

**Full-construct design does not perform:** true thermodynamic mRNA folding, experimentally trained UTR or codon expression prediction, promoter activity prediction, reagent-specific capping incorporation calculations, cell targeting validation, protein localization prediction, or reagent/procedure qualification.

## Program 04 Circular RNA

Open `/tools/construct-studio/circular.html`, also linked from Program 04. Circular RNA is a separate modality, not a linear capped/polyadenylated transcript.

- Accept CDS or protein input, generate synonyms and annotate a user-supplied internal initiation element and junction/spacer region.
- Produce a linearized sequence *representation* of the intended circle and show the junction formed by joining the end to the beginning.
- Export FASTA and JSON with RNA identity, structure/translation and product quality requirements.
- Verify genuine covalent circularity and purity using orthogonal methods, confirm junction sequence, residual linear RNA, expression and innate response experimentally.
- A drawn junction and sequence record are not a circularized product. The module does not provide validated IRES sequences, back-splicing constructs, ribozyme circularization methods or quantitative circRNA translational predictions.

## Qualification and commercial readiness gates

1. Establish secure sign-in, server-enforced authorization, audited team access, encrypted storage, secure project handling and billing before accepting paid accounts or confidential client data.
2. Build curated, legally licensed and experimentally characterized UTR/promoter libraries, documented reference sequences, version provenance and independently verified coding-weight datasets.
3. Validate algorithmic input limits, independent test sets, model accuracy and sample/cell-type specificity; report calibration and uncertainty.
4. Connect IVT and circular RNA QC evidence (capping efficiency by appropriate LC–MS, poly(A) distribution, purity, expression and localization) to construct version IDs.
5. Conduct IP/FTO and dependency-license review before representing novel design features as proprietary or commercially unrestricted.
6. Maintain research-use-only language until intended use and actual validations justify stronger claims. GMP suitability, 21 CFR Part 11 compliance and clinical decision use are not established.

## References

- NEB, *Co-transcriptional Cap-1 mRNA Synthesis using CleanCap AG* (T7 initiation context): https://www.neb.com/en-us/protocols/co-transcriptional-cap-1-mrna-synthesis-protocol-using-the-hiscribe-t7-mrna-kit-with-cleancap-reagent-ag-neb-e2080
- NEB, *Mind Your Caps and Poly(A) Tails*: https://www.neb.com/en-de/tools-and-resources/feature-articles/mind-your-caps-and-poly-a-tails-strategies-for-synthesizing-in-vitro-transcribed-ivt-mrna
- Hwang & Kim, *Molecular mechanisms of circular RNA translation* (2024): https://www.nature.com/articles/s12276-024-01220-3
- O'Leary et al., *The therapeutic potential of circular RNAs* (2025): https://www.nature.com/articles/s41576-024-00806-x

© NEXUS RNA BioSolutions — Research software development guide.
