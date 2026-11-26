/* Cloudflare Pages inquiry endpoint. Secrets are configured in Cloudflare, never in browser source. */
const MAX_BYTES = 6000;
const TOPICS = new Set([
  'RNA Construct & Analytical Review',
  'RNA–LNP Feasibility & DOE',
  'Integrated RNA Development Pilot',
  'General research consultation'
]);
const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};
function respond(status, message) {
  return new Response(JSON.stringify({ ok: status === 200, message }), { status, headers });
}
function clean(value, max) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max + 1)
    : '';
}
function validEmail(value) {
  return value.length <= 180 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin !== url.origin) return respond(403, 'Invalid request origin.');
  const size = Number(request.headers.get('Content-Length') || 0);
  if (size > MAX_BYTES) return respond(413, 'Inquiry is too large.');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return respond(415, 'Please submit using the inquiry form.');
  }
  let raw;
  try {
    const body = await request.text();
    if (body.length > MAX_BYTES) return respond(413, 'Inquiry is too large.');
    raw = JSON.parse(body);
  } catch {
    return respond(400, 'The inquiry could not be read.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return respond(400, 'Invalid inquiry.');
  // Honeypot: return success to bots without emailing; real users never see this field.
  if (raw.website) return respond(200, 'Inquiry submitted.');
  const name = clean(raw.name, 120);
  const email = clean(raw.email, 180);
  const organization = clean(raw.organization, 140);
  const topic = clean(raw.topic, 110);
  const question = clean(raw.question, 1500);
  if (name.length < 2 || name.length > 120 || !validEmail(email) ||
      organization.length > 140 || !TOPICS.has(topic) ||
      question.length < 10 || question.length > 1500) {
    return respond(400, 'Please check your name, email, topic and inquiry.');
  }
  if (!env.RESEND_API_KEY || !env.INQUIRY_FROM_EMAIL || !env.INQUIRY_TO_EMAIL) {
    return respond(503, 'The inquiry service is not yet configured. Please contact us by email using the link below.');
  }
  const text = [
    'RNA BioSolutions website inquiry', '',
    'Name: ' + name, 'Email: ' + email,
    'Organization: ' + (organization || 'Not specified'), 'Topic: ' + topic, '',
    'Nonconfidential research objective:', question
  ].join('\n');
  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.INQUIRY_FROM_EMAIL,
        to: [env.INQUIRY_TO_EMAIL],
        reply_to: email,
        subject: 'RNA BioSolutions inquiry — ' + topic,
        text
      }),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    return respond(502, 'The inquiry service is temporarily unavailable. Please try again or email us directly.');
  }
  if (!response.ok) {
    console.error('Inquiry email provider rejected request', response.status);
    return respond(502, 'The inquiry could not be sent. Please try again or email us directly.');
  }
  return respond(200, 'Your inquiry was submitted successfully. We will review it and reply by email.');
}
export function onRequestGet() {
  return respond(405, 'Use the inquiry form to submit a request.');
}
