/* NEXUS user account adapter. Supabase Auth v2 browser SDK, database RLS required.
   Public URL + publishable key are not secret; never use service_role in browser.
   Projects are NOT synchronized unless the user selects a cloud action. */
(function(root,factory){ const api=factory(root); if(typeof module==='object'&&module.exports)module.exports=api; root.NexusAccounts=api; })(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
let client=null;
const LIMIT=1_000_000;
function configuration(){return root.NEXUS_PUBLIC_CONFIG||{};}
function configured(){const c=configuration();return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(c.SUPABASE_URL||'').trim()) && /^sb_publishable_|^eyJ/.test(String(c.SUPABASE_PUBLISHABLE_KEY||''));}
function getClient(){
  if(!configured())throw Error('Accounts are not configured. Set the public Supabase URL and publishable key; see setup guide.');
  if(client)return client;
  if(!root.supabase||typeof root.supabase.createClient!=='function')throw Error('Authentication library is unavailable. Check your network connection.');
  const c=configuration();
  client=root.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:'pkce'}});
  return client;
}
function rejectError(result){if(result.error)throw Error(result.error.message||'The account operation could not be completed.');return result.data;}
async function currentUser(){const db=getClient();const out=await db.auth.getUser();return rejectError(out)?.user||null;}
async function sendEmailLink(email,createAccount){
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||'').trim()))throw Error('Enter a valid email address.');
  const db=getClient();const to=new URL('workspace.html',root.location.href);
  return rejectError(await db.auth.signInWithOtp({email:String(email).trim(),options:{emailRedirectTo:to.href,shouldCreateUser:!!createAccount}}));
}
async function signOut(){const db=getClient();return rejectError(await db.auth.signOut());}
function cleanProjectId(v){const id=String(v||'').trim().toUpperCase();if(!/^[A-Z0-9][A-Z0-9_-]{2,49}$/.test(id))throw Error('Invalid project ID.');return id;}
function validateProject(raw){
  if(!raw||raw.schema!=='nexus-project-v1'||typeof raw.modules!=='object'||Array.isArray(raw.modules)||!Array.isArray(raw.qc))throw Error('Not a NEXUS v1 project document.');
  const id=cleanProjectId(raw.id);
  // Normalization uses the same allowlist as the guest Project Hub, stripping unexpected fields.
  if(!root.NexusBridge||typeof root.NexusBridge.normalize!=='function')throw Error('Project validator is not loaded.');
  const document=root.NexusBridge.normalize(raw);
  const bytes=new TextEncoder().encode(JSON.stringify(document)).length;
  if(bytes>LIMIT)throw Error('This project exceeds the 1 MB cloud pilot limit. Export locally instead.');
  if(document.id!==id)throw Error('Project identifier changed while parsing.');
  return document;
}
async function ensureUser(){const user=await currentUser();if(!user)throw Error('Please sign in before accessing cloud projects.');return user;}
async function listProjects(){
  const user=await ensureUser();const {data,error}=await getClient().from('nexus_projects').select('project_id,name,created_at,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(100);
  return rejectError({data,error})||[];
}
async function saveProject(raw){
  const user=await ensureUser();const doc=validateProject(raw);
  const record={user_id:user.id,project_id:doc.id,name:doc.name,document:doc,updated_at:new Date().toISOString()};
  const {data,error}=await getClient().from('nexus_projects').upsert(record,{onConflict:'user_id,project_id'}).select('project_id,name,updated_at').single();
  return rejectError({data,error});
}
async function loadProject(id){
  const user=await ensureUser();const result=await getClient().from('nexus_projects').select('document').eq('user_id',user.id).eq('project_id',cleanProjectId(id)).single();
  const data=rejectError(result);return validateProject(data.document);
}
async function deleteProject(id){
  const user=await ensureUser();const {error}=await getClient().from('nexus_projects').delete().eq('user_id',user.id).eq('project_id',cleanProjectId(id));
  rejectError({error});return true;
}
return {configured,getClient,currentUser,sendEmailLink,signOut,cleanProjectId,validateProject,listProjects,saveProject,loadProject,deleteProject,LIMIT};
});
