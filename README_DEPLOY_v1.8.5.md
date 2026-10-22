# NEXUS RNA BioSolutions v1.8.5 — User Accounts & Research Workspace

This release is based on the v1.8.4 site with **unchanged scientific engines**. The new account pages provide real Supabase Auth email-link integration and private user-owned research documents behind row-level security, once the NEXUS administrator completes provider setup. Guest tools are available without account setup.

## Published routes
- `/account/sign-in.html` — secure email link login / account creation
- `/account/workspace.html` — authenticated private project dashboard
- `/tools/project-hub/index.html` — existing local research workspace with optional cloud handoff links

## Activate accounts (required)
Read **`SETUP_ACCOUNTS_v1.8.5.md`**. In short: create a Supabase project, enable email Auth, configure redirect URLs, run the SQL migration in `supabase/migrations/`, and put **only the PUBLIC** Supabase URL and publishable key in `account/config.js`. Deploy the extracted website to Cloudflare Pages. This package does not contain a service key or automatically provision a Supabase account.

## Files and storage
- Existing NEXUS Project Hub data remains in browser `localStorage`. Sign-out does not erase it.
- Signed-in users may explicitly save or import normalized project JSON to a cloud database table protected by PostgreSQL RLS; the maximum pilot size is 1 MB per project and the dashboard lists at most 100 projects.
- Deleting a cloud project does not delete the local copy; restoring to local requires confirmation on ID collision.
- No automatic real-time synchronization, Pro billing, team access, backend compute, or HIPAA/GMP/Part 11 compliance is claimed.

## Deployment
1. Unzip, upload the extracted site into the existing GitHub repository or Cloudflare Pages project, preserving paths.
2. Ensure deployed files include `account/`, `supabase/migrations/` (migration for admin reference), and homepage. The SQL file is **not executed automatically** by deployment.
3. Verify guest tools and project files work **without account setup**.
4. Complete the Supabase setup and redeploy `account/config.js` with public values.
5. Verify a sign-in link works and signed-in owner can create, update, export, restore and delete projects.
6. Run the two-user privacy/RLS test before allowing outside registrations.

## Commercial release gates
Add account lifecycle and deletion procedures, email deliverability/rate limits, consent and privacy notices, retention/backups, incident response, instrument-data qualification, vulnerability scanning, TLS/CSP review, and server-side subscription authorization. Do not collect sensitive or patient-identifiable information in the pilot. Subscription payment buttons must remain inactive.
