# RNA BioSolutions website inquiry: deployment checklist

The public form is `/services.html#quote`. It submits JSON to `POST /api/inquiry` (Cloudflare Pages Function in `functions/api/inquiry.js`). It no longer launches a local email app or redirects users to localhost.

## Required one-time email setup

1. Sign in to Resend and verify a domain that you own for sending email. The `pages.dev` domain is not a substitute for a domain you control. Resend requires a verified sending domain for general production delivery.
2. Create a Resend API key with send-email permissions. Never paste that key into source files, GitHub commits, or the public website.
3. In Cloudflare dashboard open Workers & Pages → your `nexus-rna-site` Pages project → Settings → Variables and Secrets (Production). Configure:
   - `RESEND_API_KEY` = secret Resend API key (encrypted)
   - `INQUIRY_FROM_EMAIL` = a sender on the verified domain, for example `inquiries@yourdomain.example`
   - `INQUIRY_TO_EMAIL` = the inbox that receives inquiries, for example `singhbddeepak@gmail.com`
4. Redeploy the Pages project if required for the new bindings to be applied.
5. On a phone not signed in as the admin, load `https://nexus-rna-site.pages.dev/services.html#quote` and submit a test with a real reply-to email. Confirm the on-page success message **and** that the message arrives in the destination inbox (including spam/junk). Reply to the test message to check reply-to.
6. Confirm errors are clear if sending is temporarily unavailable. A successful Pages deployment does not prove email provider credentials have been configured.

Without all three bindings, the endpoint intentionally returns HTTP 503 and the page offers a manual email link. It does not falsely report successful delivery.

## Operational notes

- The form sends name, email, organization, subject category and a nonconfidential message to the email service. It does not save submissions to a website database.
- The endpoint requires a same-origin browser request, validates required fields, limits payload size, has a honeypot and returns a generic error on upstream failures.
- For sustained public use, enable a Cloudflare rate-limiting/WAF rule on `POST /api/inquiry`, and consider Turnstile for stronger bot protection.
- Do not send patient data, proprietary sequences or confidential research in an initial inquiry.
- Email API acceptance is not the same as guaranteed inbox delivery; monitor Resend delivery logs and verify real inbound tests.
