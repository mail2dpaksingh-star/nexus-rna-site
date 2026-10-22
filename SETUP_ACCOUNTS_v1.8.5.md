# NEXUS v1.8.5 — Account Setup and First-Use Verification

This release integrates real **Supabase Auth email magic links** and a **Postgres research project store with row-level security (RLS)**. It ships with empty public configuration because the NEXUS owner must create and control the provider account. It will **not** create working users until the following steps are completed. Billing and Research Pro entitlements are not active.

## 1. Supabase project (administrator)

1. Create a Supabase project at https://supabase.com/dashboard and make sure that data region, pricing, terms, retention and privacy controls are suitable for your intended users. Do not use patient-identifiable records or regulated GMP data in this pilot.
2. Under **Authentication > Providers > Email**, enable email/passwordless (OTP / magic link) and email confirmation as supported by your plan. For public launches, arrange production SMTP and abuse protection; default email sending may have limits.
3. In **Authentication > URL Configuration**, set **Site URL** to `https://nexus-rna-site.pages.dev` (or the final production domain), and add `https://nexus-rna-site.pages.dev/account/workspace.html` to **Redirect URLs**. Add your custom-domain redirect separately if used. For local testing, add only the specific localhost development URL needed.
4. In **SQL Editor**, execute `supabase/migrations/20261021_nexus_research_projects.sql` once. The migration creates a private `nexus_projects` table, user ownership constraints, and explicit `select/insert/update/delete` RLS policies. Check that the table is exposed to the Supabase Data API and that `authenticated` has the stated permissions.
5. Under **Project Settings > API**, obtain the project URL (`https://<project-ref>.supabase.co`) and **publishable key** (`sb_publishable_...`) or legacy `anon` public key (`eyJ...`). These are designed for client use when RLS is configured. NEVER place `service_role`, `sb_secret_...`, personal access tokens, JWT secrets, or database credentials in the website.
6. Fill in these **two public values** in `account/config.js` before deploying:

   ```js
   window.NEXUS_PUBLIC_CONFIG = Object.freeze({
     SUPABASE_URL: 'https://YOUR-PROJECT-REF.supabase.co',
     SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_YOUR_PUBLIC_KEY'
   });
   ```

7. Redeploy the website using GitHub/Cloudflare Pages. In the published `/account/sign-in.html`, verify the **Create free account** and **Sign in** options appear. Both use email-link authentication; users never enter a password in the NEXUS website.

## 2. Account workflow for researchers

- Users can always open free tools as **guests** and use the local Project Hub without signing in.
- A user selects **Create free account**, enters email, follows the sign-in link, and reaches `/account/workspace.html`.
- If a signed-in user opens an existing guest project on the same browser, clicking **Save active project to cloud** uploads a normalized research document (up to 1 MB). This is a **manual, explicit transfer** and can replace a cloud project after confirmation.
- The authenticated dashboard lists private projects, and lets the owner **restore to browser**, **download JSON**, or **delete cloud copy**. Restoring asks confirmation before replacing a local copy with the same ID.
- Existing scientific tools still save results **locally**. Returning those changes to cloud requires another explicit save from the account dashboard. No live sync is advertised or implemented.
- Signing out of a Supabase account **does not clear guest localStorage**. Anyone sharing that browser profile may see local project data. Do not use shared computers for sensitive research, and manually clear browser site data as needed.

## 3. Mandatory two-user privacy verification

Use two distinct test email accounts in separate private-browser profiles after applying SQL:

1. Create Account A. Save sample `TEST-A01` to cloud. Verify A can list, download, restore and delete its own project.
2. Create Account B in a different browser profile. Confirm `TEST-A01` does not appear. Use Supabase API or browser network tools to attempt querying, updating and deleting A's `project_id` while authenticated as B; confirm no rows are visible or modified. Also attempt an insert claiming A's `user_id` and confirm policy rejection.
3. Sign out and verify no cloud project can be accessed anonymously. Confirm guest tools remain available.
4. Test invalid project IDs, malformed JSON, oversized imports, expired email links, email delivery errors, and both cloud/local overwrite confirmations.
5. Review and document account-deletion and data-export handling, email provider, incident procedures, abuse/rate limits, backups, privacy notices and retention before public recruitment.

## 4. Deployment, billing and scientific restrictions

- This is a **pilot**, not a full LIMS, ELN, compliant electronic-record system or 21 CFR Part 11 validated service.
- Do not upload clinical patient information, restricted research sequences, regulated results, or customer-confidential data unless additional risk, privacy, security, contract and infrastructure controls are verified.
- The **Free** account has cloud pilot capabilities. The **Research Pro / Laboratory Team** plans and `Sign in with Google` are **not activated** and should not be advertised as available.
- Protect paid functionality on a trusted backend using server-enforced, verified entitlements after authentication. Hiding a Pro feature in a static HTML page is not access control.
- This project deliberately does **not** enable automatic migration of local projects or automatically upload users' sequence data.
- Public CDN delivery of the browser auth SDK is a runtime dependency. Consider self-hosting a version-pinned, SRI-verified library before production; verify your Content Security Policy and network availability.

Official references: https://supabase.com/docs/reference/javascript/auth-signinwithotp ; https://supabase.com/docs/guides/database/postgres/row-level-security ; https://supabase.com/docs/guides/auth/redirect-urls .
