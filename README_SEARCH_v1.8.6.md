# NEXUS RNA BioSolutions v1.8.6 — Header Search

This release is based on v1.8.5 User Accounts & Research Workspace.

## What's new

- A prominent search bar directly below the homepage's top navigation.
- Live matches for research tools, oncology/hematology application pages, services, sign-in and workspace.
- Click a result to open the target page; press Enter to open the top match.
- Arrow keys cycle through matches; Escape dismisses suggestions; Ctrl+K / Command+K focuses search.
- A “Browse all research tools” action also fills the existing tool-directory search field.

## Scope and privacy

Search matches locally against navigation links and descriptions built into the static website. It does not upload research sequences, submit queries to a search provider, or search inside private cloud projects. It is a navigation search, not a full-text scientific literature or project-record search.

Only homepage `index.html` has changed; the new `assets/site-search.js` powers the search. All other v1.8.5 files remain unchanged.

## Publish

Extract the ZIP and upload its contents at the website's root, preserving `index.html`, `assets/site-search.js`, `account/`, `applications/` and `tools/`. Deploy through the existing Cloudflare Pages process. If the homepage is cached, hard-refresh after deployment.

## Verification performed

- JavaScript syntax validation with Node.
- Browser checks at 1440px, 1100px, 780px and 390px widths.
- Tests for promoter, AlphaFold, hematology and ddPCR terms; unknown queries; Arrow, Escape and Ctrl+K navigation.
- All local HTML links and asset references verified on the deployment package.

The website has not been deployed to the live Cloudflare account from this environment.
