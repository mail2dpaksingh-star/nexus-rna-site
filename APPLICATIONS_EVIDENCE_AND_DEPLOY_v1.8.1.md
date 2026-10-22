# NEXUS RNA BioSolutions v1.8.1 — Oncology and Hematology Applications

## Release scope
A communications and research-navigation update built from the v1.8 complete website. Two new standalone application pages with pathway launch links are reachable from the homepage `#applications` section and each other. No existing tool scripts, calculation engines, storage schemas or contact-form behaviors are modified.

### New pages
- `/applications/oncology.html` — neoantigen vaccine, immune microenvironment and mRNA-encoded protein research directions with GDC/TCGA, pVACtools, IEDB and direct NEXUS tool links.
- `/applications/hematology.html` — in vivo CAR immune-cell research, HSPC/marrow delivery and hematologic malignancy research with NCI TARGET, trial registry and direct NEXUS tool links.

The application descriptions are summaries of research fields, not automated genomics integration, assay qualification, evidence of therapeutic efficacy, clinical decision support or commercial services.

## Core external scientific references
- Wang Y et al. (2026). *The advances and challenges of mRNA-LNP application in fields of hematology and oncology therapeutics*. *J Hematol Oncol* 19:87. DOI 10.1186/s13045-026-01857-9. https://link.springer.com/article/10.1186/s13045-026-01857-9
- NCI TCGA: https://www.cancer.gov/ccg/research/genome-sequencing/tcga
- NCI GDC: https://gdc.cancer.gov/about-gdc
- NCI TARGET: https://www.cancer.gov/ccg/research/genome-sequencing/target
- pVACtools: https://pvactools.readthedocs.io/en/stable/
- ClinicalTrials.gov: https://clinicaltrials.gov/
- Targeted LNP preclinical CAR engineering paper: https://pubmed.ncbi.nlm.nih.gov/40659448/ (uses minicircle DNA and transposase mRNA, not mRNA-only CAR expression).

## Important boundaries
- Laboratory and patient-related findings require independent validation. Public resources may be limited to research use or include controlled-access datasets.
- No promise of tumor-targeted delivery, predicted clinical benefit, validated in vivo CAR engineering or marrow tropism.
- NEXUS does not currently implement genomic neoantigen prediction internally: external URLs are links, not server integrations.
- Browser-local Project Hub is not a HIPAA-secure or Part 11-compliant storage system. Do not store identifiable patient records or proprietary regulated datasets.
- Founder profile stays excluded. Existing site contact email is unchanged; replace with a dedicated NEXUS account prior to broad publication.

## Deployment
Extract the ZIP and upload its contents into the existing Cloudflare Pages build root, retaining directory structure and `index.html` at root. Git-connected deployments should commit extracted files to the connected production branch; Direct Upload uses the existing project's upload flow.

## Smoke-test steps
1. Home → Applications; open Oncology then return.
2. Open Hematology from homepage; follow cross-link to Oncology.
3. On each application page open internal RNA Construct, LNP, QC, Immune Assay, DBTL and Project Hub links.
4. Test external scientific references and mobile menu.
5. Confirm the existing SeqFold and instrument import workflows still function, and no founder card appears.
