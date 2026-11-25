const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
test('Cloudflare static security response headers exist',()=>{
 const text=readFileSync(path.join(root,'_headers'),'utf8');
 for(const pattern of ['X-Content-Type-Options: nosniff','X-Frame-Options: SAMEORIGIN','Referrer-Policy:','Permissions-Policy:','Content-Security-Policy:','Strict-Transport-Security:','/account/*','Cache-Control: no-store'])assert.ok(text.includes(pattern),pattern);
});
test('public browser account config exposes only publishable Supabase key',()=>{
 const config=readFileSync(path.join(root,'account/config.js'),'utf8');
 const auth=readFileSync(path.join(root,'account/auth-client.js'),'utf8');
 assert.match(config,/SUPABASE_PUBLISHABLE_KEY/);
 assert.doesNotMatch(config,/sb_secret_[a-zA-Z0-9_-]+/);
 assert.doesNotMatch(config,/service_role:\s*["'][^"']+/);
 assert.match(auth,/auth\.getUser\(\)/);
});
test('security hardening is a baseline, not a claim of complete cybersecurity',()=>{
 const headers=readFileSync(path.join(root,'_headers'),'utf8');
 assert.ok(headers.includes("base-uri 'self'"));
 assert.ok(headers.includes("object-src 'none'"));
});
