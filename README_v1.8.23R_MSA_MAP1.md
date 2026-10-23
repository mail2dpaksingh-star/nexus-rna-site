# NEXUS RNA BioSolutions — Plasmid Map & IUPAC MSA Patch

**Status: deployment candidate, not deployed.** Derived by modifying the exact v1.8.23R recovery ZIP.

## Fixes
- `advanced.html`: uses the existing Workbench SVG renderer rather than the older circle-only renderer. Switch circular / linear in the library and assembled construct; open full annotation editor.
- Clearly marked 4.2 kb synthetic teaching vector demonstrates origin, resistance marker, promoter, insert/GOI, terminator and MCS with direction arrows and sequence-derived restriction recognition sites. Official pUC19 M77789.2 remains unaltered and unannotated where annotations were not in the saved data.
- Virtual assembled plasmid map shows an insert arrow and coordinate-shifted previously annotated vector features. Feature interruptions are labelled as parts, for visualization only.
- `workbench.html` MSA: 16-pixel fixed column grid for every sequence and the consensus. Distinctive color-coded A/C/G/T and all IUPAC degeneracies R/Y/S/W/K/M/B/D/H/V/N and gap. Hover a character for its interpretation.
- MSA now accepts ambiguity codes in input, not only ACGT, using the existing exact-symbol pairwise reference-centered algorithm. Note: ambiguous symbols are scored as literal mismatches unless exactly identical; this is not a statistically validated ambiguity-aware aligner.
- All preexisting NEXUS pages and scripts retained. Local projects remain in their existing browser origin; export backups before changes.

## Safe deployment
1. Keep the current v1.8.23R website and GitHub repository intact as your rollback point. Export locally stored research projects from browser.
2. First test the two updated pages locally or on a *Cloudflare preview branch*.
3. When ready, extract this ZIP and replace the *same Cloudflare build-output folder* used by v1.8.23R (repository root versus dist differs by configuration). Do not nest the ZIP inside a folder.
4. Commit and push through GitHub Desktop after you have verified the target directory and branch. Cloudflare deployment is not performed by this ZIP.
5. After deployment: confirm `/_nexus_release.json`, `/tools/seqfold/advanced.html`, `/tools/seqfold/workbench.html#msa`. Use the teaching vector and the sample FASTA inputs.

## Scope / scientific limitations
Browser research prototype. This release does not validate cloning, restriction chemistry, primer specificity, MSA accuracy, GMP, Part 11, cybersecurity or clinical use. Synthetic demo is illustrative. Imported GenBank metadata coverage remains limited. The current star alignment remains reference-centered; precise biologically defensible multiple alignment requires validation in an established tool.

- Clustal-style export now uses the same sequence-column offset for the consensus row as every aligned FASTA record (previously off by one).
