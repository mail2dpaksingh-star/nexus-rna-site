# NEXUS RNA BioSolutions v1.8.8 — SeqFold UX and science cleanup

## Changes

1. One **Sequence Converter** at `tools/seqfold/convert.html`: DNA → RNA (coding-strand substitution), RNA → DNA (cDNA coding sequence), RNA → protein (selected frame) and protein → DNA (one possible synonymous back-translation; NOT recovery of original gene). Redundant visible Protein/ORF/folding tabs are suppressed on SeqFold home. Advanced codon design remains a distinct scientific optimization tool.
2. **RNA structure** in `tools/seqfold/precision.html`: short-RNA profile selection, short complementary duplex review, conventional *representative* stem–loop schematic, and user-imported thermodynamic ΔG in kcal/mol. No fabricated ΔG. Current NEXUS heuristic remains nonthermodynamic; 3,000 nt is supported only by windowed folding; no interwindow pairing or true full-transcript ΔG. For RNAfold MFE, run independently in ViennaRNA and paste the dot-bracket+ΔG. External tools may have their own privacy/licensing rules.
3. **Plasmid workbench**: colored forward/reverse directional arrows, origin/marker/promoter/GOI labels when annotated, mapped restriction motif hits and circular/linear views. An optional synthetic annotated teaching vector demonstrates components. The public pUC19 starter record is not altered or assigned invented annotations.
4. **Validation**: removed the RNAfold comparison tab and interface. Primer specificity, Sanger assembly and AB1 checks remain available.
5. **Multiple-sequence alignment**: fixed-column display with colored A/C/G/T and IUPAC degenerate base calls (R/Y/S/W/K/M/B/D/H/V/N) and explicit aligned consensus; exports remain text-based and unaffected. Star/reference-centered algorithm remains approximate and must be checked independently for rigorous MSA.
6. **Legal and privacy**: linked Privacy Statement at `/privacy.html`, site-wide copyright notices at the ends of current user-facing pages; open-source code/third-party license distinctions remain.
7. Home directory and local search include Sequence Converter.

## Deployment

1. Save any local browser projects/export JSON backups before publishing.
2. Extract the ZIP at the repository root, replacing the prior pages and preserving `tools/`, `assets/`, `account/`, `applications/` and `supabase/` folder structures.
3. Deploy through existing Cloudflare Pages connection. No authentication credentials are bundled; Supabase email-link/cloud storage remains disabled until owner configuration and database migrations are applied.
4. Verify these pages after live deployment:
   - `/tools/seqfold/convert.html`
   - `/tools/seqfold/precision.html#fold`
   - `/tools/seqfold/workbench.html`
   - `/tools/seqfold/validation.html`
   - `/privacy.html`
5. Use the synthetic plasmid example on the plasmid workbench and import/export an annotated GenBank record. Confirm signed-in data privacy and cloud storage separately before public account access.

## Scientific scope and limitations

This is research-stage software, not GMP, clinical or validated RNAfold MFE software. Do not treat imported ΔG as calculated by NEXUS. miRNA/siRNA guide comparisons do not establish targets or knockdown. Annotated plasmid map coordinates derive from imported/user annotations. Mature RNA secondary structure for a full 3,000-nt molecule still requires proper thermodynamic folding on a validated backend or independent tool. Copyright is attributed to NEXUS original content only, not third-party resources or open-source code.
