# Deploy NEXUS v1.8.18 / Independent ThermoFold v0.9

1. Unzip the complete `NEXUS_RNA_BioSolutions_v1.8.18_Independent_ThermoFold_v0.9.zip` archive.
2. Upload the extracted website contents (not the ZIP itself) to the existing GitHub Pages/Cloudflare-connected repository or deploy through the configured Cloudflare Pages Direct Upload workflow.
3. Keep paths intact: `tools/seqfold/thermofold.html` and neighboring `.js` files must remain together. The existing SeqFold, Project Hub, accounts and other NEXUS workbenches are retained.
4. Open `tools/seqfold/thermofold.html`. Run synthetic hairpin `GGGAAACCC` and inspect model ΔG and dot-bracket export. Optionally upload a separately vetted Turner parameter-pack JSON. The page will show how many table entries have been loaded and warn when coverage is incomplete.
5. Test desktop and mobile browsers. Parameter packs are not auto-saved after refresh.
6. **DO NOT market this release as ViennaRNA-equivalent**. Genuine RNAfold/RNAstructure benchmark comparison remains blocked until reference executables are installed. Experimental RNA structure validation remains blocked until verified CT files are supplied.

See `THERMOFOLD_v0.9_PARAMETER_IMPORT_AND_VALIDATION.md` for instructions, mandatory source attribution and completeness gates, plus the external reference/CT comparison scripts.
