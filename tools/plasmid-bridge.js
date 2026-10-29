/* NEXUS DNA insert -> Plasmid Workbench virtual assembly.
 * Browser-local; no external requests. 1-based feature coordinates; insertion boundary 0..n.
 * No scientific algorithm in SeqFold or Construct Studio is replaced.
 */
(function (root, make) {
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.install(root.document, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TRANSFER_KEY = 'nexus-dna-plasmid-transfer-v1';
  const MAX_BP = 150000;
  const COLORS = ['#dcece5','#e6f0f9','#fbe9d4'];
  function asDNA(raw, label) {
    const s = String(raw || '').replace(/\s/g, '').toUpperCase();
    if (!s.length || s.length > MAX_BP || /[^ACGT]/.test(s)) throw Error(label + ' must have 1–150,000 DNA bases (A/C/G/T).');
    return s;
  }
  function integer(n,label,low,high) {
    if (!/^\d+$/.test(String(n))) throw Error(label + ' must be a whole number.');
    n = Number(n);
    if (n < low || n > high) throw Error(label + ' must be between ' + low + ' and ' + high + '.');
    return n;
  }
  function rc(s) { return s.replace(/./g,c=>({A:'T',T:'A',C:'G',G:'C'}[c])).split('').reverse().join(''); }
  function normalizeFeature(f, size) {
    if (!f || typeof f !== 'object') throw Error('Invalid annotation.');
    const start = integer(f.start, 'Feature start', 1, size), end = integer(f.end, 'Feature end', start, size);
    const label = String(f.label || f.type || 'DNA feature').replace(/[<>\r\n\t]/g,' ').slice(0,100).trim();
    const key = String(f.key || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,30);
    const type = String(f.type || 'misc_feature').replace(/[^A-Za-z0-9_]/g,'').slice(0,30);
    const strand = f.strand === -1 || f.strand === '-' || f.strand === '-1' ? -1 : 1;
    return {start,end,label,type:type||'misc_feature',key,strand};
  }
  function insertFromRecord(raw) {
    if (!raw || typeof raw !== 'object') throw Error('No DNA insert supplied.');
    const seq=asDNA(raw.sequence,'DNA insert');
    if (raw.length != null && Number(raw.length)!==seq.length) throw Error('DNA insert length does not match its sequence.');
    const features=(Array.isArray(raw.features)?raw.features:[]).slice(0,200).map(f=>{
      const x=normalizeFeature(f,seq.length);
      if (f.sequence !== undefined && asDNA(f.sequence,'Annotated component')!==seq.slice(x.start-1,x.end)) throw Error('Feature '+x.label+' does not match the DNA sequence.');
      return x;
    });
    if (raw.format === 'nexus-dna-cloning-insert-v1' && raw.coreSequence && !seq.includes(asDNA(raw.coreSequence,'Core DNA sequence'))) throw Error('Core DNA sequence is not present in the insert.');
    return {format:'nexus-dna-cloning-insert-v1', sequence:seq,length:seq.length, features, source:String(raw.format || raw.source || 'Imported DNA').slice(0,120)};
  }
  function backboneFromRecord(raw) {
    if (!raw || typeof raw !== 'object') throw Error('Load a plasmid reference or import your own backbone first.');
    const seq=asDNA(raw.sequence,'Plasmid backbone');
    if (raw.circular !== true) throw Error('Choose a circular plasmid backbone in the existing Workbench first.');
    return {name:String(raw.name||'Plasmid backbone').replace(/[<>\r\n]/g,' ').slice(0,75),sequence:seq,circular:true,source:String(raw.source||'Selected Workbench record').slice(0,110),accession:String(raw.accession||''),features:(Array.isArray(raw.features)?raw.features:[]).slice(0,200).map(f=>normalizeFeature(f,seq.length)).filter(f=>!(f.type==='source' && f.start===1 && f.end===seq.length))};
  }
  function checkFeatureMap(features, length) {
    if(features.length>200) throw Error('Over 200 annotations; reduce features for this Workbench.');
    for(const f of features) if(f.start<1 || f.end>length || f.end<f.start) throw Error('Assembled feature coordinate is out of bounds: '+f.label);
  }
  function siteScreen(sequence) {
    const motifs={EcoRI:'GAATTC',BamHI:'GGATCC',HindIII:'AAGCTT',XhoI:'CTCGAG',NotI:'GCGGCCGC',PstI:'CTGCAG'};
    const n=sequence.length;
    return Object.entries(motifs).map(([name,motif])=>{
      const wrapped=sequence+sequence.slice(0,motif.length-1);
      const positions=[];
      for(let i=0;i<n;i++) if(wrapped.slice(i,i+motif.length)===motif) positions.push(i+1);
      return {name,motif,count:positions.length,positions:positions.slice(0,100)};
    });
  }
  function build(backbone, insert, settings={}) {
    const base=backboneFromRecord(backbone), ins=insertFromRecord(insert);
    const mode=settings.mode || 'insert', flip=settings.orientation === 'reverse';
    if (!['insert','replace'].includes(mode)) throw Error('Unsupported cloning mode.');
    const n=base.sequence.length;
    let cut,deletion=0,deletedStart=0,deletedEnd=0;
    if(mode==='insert') cut=integer(settings.after,'Insertion boundary',0,n);
    else {
      deletedStart=integer(settings.start,'Replacement start',1,n);
      deletedEnd=integer(settings.end,'Replacement end',deletedStart,n);
      cut=deletedStart-1;deletion=deletedEnd-deletedStart+1;
    }
    const inserted=flip?rc(ins.sequence):ins.sequence;
    const seq=base.sequence.slice(0,cut)+inserted+base.sequence.slice(cut+deletion);
    if(seq.length>MAX_BP) throw Error('Assembled plasmid exceeds the 150,000 bp limit.');
    if(seq.length!==n-deletion+inserted.length || seq.slice(cut,cut+inserted.length)!==inserted) throw Error('Virtual junction sequence verification failed.');
    const warnings=[];
    const features=[]; let removed=[];
    for (const f of base.features) {
      if(mode==='insert') {
        if(f.start<=cut && f.end>cut) {
          if(/\bMCS\b|polylinker|multiple.cloning/i.test(f.label) && f.type==='misc_feature') {
            if(f.start<=cut)features.push({...f,end:cut,label:f.label+' (upstream segment)'});
            if(cut+1<=f.end)features.push({...f,start:cut+inserted.length+1,end:f.end+inserted.length,label:f.label+' (downstream segment)'});
            warnings.push('The MCS annotation was divided by the inserted DNA. Any remaining recognition sites must be re-scanned from the assembled sequence.');
            continue;
          }
          throw Error('Insertion splits backbone annotation "'+f.label+'". Choose a different boundary or redefine the annotation.');
        }
        features.push(f.start>cut?{...f,start:f.start+inserted.length,end:f.end+inserted.length}:{...f});
      } else {
        if(f.end<deletedStart) features.push({...f});
        else if(f.start>deletedEnd) features.push({...f,start:f.start-deletion+inserted.length,end:f.end-deletion+inserted.length});
        else if(f.start>=deletedStart && f.end<=deletedEnd) removed.push(f.label);
        else if(/\bMCS\b|polylinker|multiple.cloning/i.test(f.label) && f.type==='misc_feature') {
          if(f.start<deletedStart)features.push({...f,end:deletedStart-1,label:f.label+' (upstream segment)'});
          if(f.end>deletedEnd)features.push({...f,start:deletedEnd+1-deletion+inserted.length,end:f.end-deletion+inserted.length,label:f.label+' (downstream segment)'});
          warnings.push('Only the MCS interval was adjusted during replacement. Re-scan the final DNA for surviving restriction motifs.');
        } else throw Error('Replacement partially overlaps annotation "'+f.label+'". Select a boundary that does not truncate a feature.');
      }
    }
    for(const f of ins.features) {
      const start=flip?ins.length-f.end+1:f.start;
      const end=flip?ins.length-f.start+1:f.end;
      const safeTypes={CDS:'CDS',promoter:'promoter',terminator:'terminator',gene:'gene',rep_origin:'rep_origin',misc_feature:'misc_feature'};
      const type=safeTypes[f.type] || 'misc_feature';
      features.push({...f,type,start:cut+start,end:cut+end,strand:flip?-f.strand:f.strand,label:f.label});
    }
    // Always add an explicit inserted interval, including FASTA-only records without source annotations.
    features.push({type:'misc_feature',label:'NEXUS DNA insert ('+(flip?'reverse':'forward')+')',start:cut+1,end:cut+inserted.length,strand:flip?-1:1,key:'insert'});
    features.sort((a,b)=>a.start-b.start || a.end-b.end);
    checkFeatureMap(features,seq.length);
    if(removed.length) warnings.push('Annotations wholly inside the replaced interval were removed: '+removed.join(', ')+'.');
    if(!features.some(f=>f.type==='rep_origin')) warnings.push('No replication-origin annotation was found in the assembled record; verify backbone identity independently.');
    if(!features.some(f=>/resistan|select|marker/i.test(f.label))) warnings.push('No selectable-marker annotation was found; verify backbone selection and vector functionality independently.');
    const restrictionSites=siteScreen(seq);
    if(restrictionSites.some(s=>s.count>1)) warnings.push('Some screened restriction motifs occur multiple times. Review site specificity before selecting any restriction-based assembly.');
    warnings.push('This is a computational sequence assembly only. It does NOT verify restriction compatibility, ligation, recombination, expression, molecular stability, or biological function.');
    warnings.push('Junction strings reflect exact concatenation of the submitted sequences; they do not establish assembly feasibility.');
    const left=seq.slice(Math.max(0,cut-16),cut),right=seq.slice(cut+inserted.length,cut+inserted.length+16);
    const junctions={fivePrime:(left+'|'+inserted.slice(0,16)),threePrime:(inserted.slice(-16)+'|'+right),verified:true};
    return {name:'NEXUS_'+base.name.replace(/[^A-Za-z0-9_-]/g,'_').slice(0,45)+'_assembled',sequence:seq,circular:true,source:'Virtual assembly of '+base.name+' and NEXUS DNA insert; research only',features,accession:'',length:seq.length,insertStart:cut+1,insertEnd:cut+inserted.length,orientation:flip?'reverse':'forward',mode,deletedBp:deletion,removedAnnotations:removed,backboneLength:n,insertLength:inserted.length,junctions,restrictionSites,warnings};
  }
  function fastA(record){return '>'+record.name.replace(/\s+/g,'_')+'\n'+(record.sequence.match(/.{1,70}/g)||[]).join('\n')+'\n';}
  function genBank(record) {
    const seq=asDNA(record.sequence,'Plasmid'), feats=record.features||[];
    const date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).replace(/ /g,'-').toUpperCase();
    const name='NEXUS_ASSEMBLY';
    const sanitize=str=>String(str).replace(/[\r\n\t\"]/g,' ').replace(/\s+/g,' ').trim();
    const wrap=(prefix,content)=>{const lines=[],words=sanitize(content).split(' ');let line=prefix;for(const word of words){if(line.length>prefix.length && line.length+word.length+1>78){lines.push(line);line=' '.repeat(prefix.length);}line+=(line.length===prefix.length?'':' ')+word;}lines.push(line);return lines;};
    const q=(key,v)=>wrap(' '.repeat(21),'/'+key+'="'+sanitize(v).slice(0,600)+'"');
    const head=[`LOCUS       ${name.padEnd(16)} ${String(seq.length).padStart(11)} bp    DNA     circular SYN ${date}`,
      ...wrap('DEFINITION  ','NEXUS virtual plasmid assembly, computational research construct.'),'ACCESSION   .','VERSION     .','KEYWORDS    .',
      ...wrap('SOURCE      ','synthetic construct'),...wrap('  ORGANISM  ','synthetic construct'),'            other sequences; artificial sequences.',
      ...wrap('COMMENT     ','Sequence assembled virtually from user-selected backbone and DNA insert; functionality, cloning junctions and regulatory elements are not experimentally verified.'),
      'FEATURES             Location/Qualifiers',`     source          1..${seq.length}`,...q('organism','synthetic construct'),...q('mol_type','other DNA')];
    for(const f of feats){
      const type=/^(CDS|promoter|terminator|gene|rep_origin|misc_feature)$/.test(f.type)?f.type:'misc_feature';
      const range=f.start+'..'+f.end,loc=f.strand===-1?'complement('+range+')':range;
      head.push('     '+type.padEnd(15)+' '+loc,...q('label',f.label));
      if(type==='CDS') head.push('                     /codon_start=1','                     /transl_table=1',...q('note','Computationally annotated; sequence and expression require independent verification.'));
    }
    head.push('ORIGIN');for(let i=0;i<seq.length;i+=60)head.push(String(i+1).padStart(9)+' '+(seq.slice(i,i+60).toLowerCase().match(/.{1,10}/g)||[]).join(' '));head.push('//');
    return head.join('\n')+'\n';
  }
  function download(doc, root, filename,contents,mime){const u=root.URL.createObjectURL(new root.Blob([contents],{type:mime||'text/plain'}));const a=doc.createElement('a');a.href=u;a.download=filename;doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(u),3000);}
  function install(doc,root){
    const css=doc.createElement('link');css.rel='stylesheet';css.href='../plasmid-bridge.css';doc.head.appendChild(css);
    if(doc.getElementById('nexus-dna-export-panel')) installSender(doc,root);
    else if(doc.getElementById('plasmid-svg') && typeof root.NEXUS_GET_CURRENT_RECORD==='function') installReceiver(doc,root);
  }
  function installSender(doc,root){
    const panel=doc.getElementById('nexus-dna-export-panel'),actions=panel.querySelector('.nexus-dna-actions');if(!actions || doc.getElementById('nexus-send-plasmid'))return;
    const btn=doc.createElement('button');btn.type='button';btn.className='button nexus-bridge-primary';btn.id='nexus-send-plasmid';btn.textContent='Send DNA insert to Plasmid Workbench';actions.appendChild(btn);
    const msg=doc.createElement('p');msg.className='nexus-bridge-message';msg.setAttribute('role','status');actions.after(msg);
    btn.addEventListener('click',()=>{try{
      if(typeof root.NEXUS_GET_CURRENT_DNA_INSERT !== 'function') throw Error('DNA insert unavailable. Generate the selected RNA construct first.');
      const insert=insertFromRecord(root.NEXUS_GET_CURRENT_DNA_INSERT());
      if(!root.sessionStorage) throw Error('Browser session storage unavailable. Download DNA insert JSON and import it in the Workbench.');
      root.sessionStorage.setItem(TRANSFER_KEY,JSON.stringify(insert));
      root.location.assign('../seqfold/workbench.html#nexus-plasmid-assembly');
    }catch(e){msg.textContent=e.message;}});
  }
  function installReceiver(doc,root){
    const anchor=doc.getElementById('plasmid-svg');if(!anchor||doc.getElementById('nexus-plasmid-assembly'))return;
    const box=doc.createElement('section');box.id='nexus-plasmid-assembly';box.className='nexus-bridge-box';
    box.innerHTML=`<h2>DNA insert → Virtual plasmid assembly</h2><p>Use the <strong>current circular plasmid</strong> as the backbone. Import a DNA insert JSON/FASTA/GenBank or transfer it from Coding + UTR Studio. Set insertion coordinates and orientation, then generate an annotated circular assembly.</p>
     <div class="nexus-bridge-controls"><div><strong>DNA insert</strong><p id="nexus-bridge-insert" class="nexus-bridge-message">No DNA insert received.</p><label class="btn" for="nexus-bridge-file">Import DNA insert file</label><input type="file" id="nexus-bridge-file" accept=".json,.fasta,.fa,.fna,.gb,.gbk,.txt" class="sr-only"></div>
     <div><strong>Backbone</strong><p id="nexus-bridge-backbone" class="nexus-bridge-message">Select or import a circular plasmid above.</p><button class="btn" id="nexus-bridge-use-backbone" type="button">Use current plasmid</button></div></div>
     <div class="nexus-bridge-controls"><div class="field"><label for="nexus-bridge-mode">Assembly operation</label><select id="nexus-bridge-mode"><option value="insert">Insert after selected base</option><option value="replace">Replace selected interval</option></select></div><div class="field"><label for="nexus-bridge-orientation">Insert orientation</label><select id="nexus-bridge-orientation"><option value="forward">Forward (+)</option><option value="reverse">Reverse complement (−)</option></select></div></div>
     <div class="nexus-bridge-controls"><div class="field" id="nexus-bridge-insert-coord"><label for="nexus-bridge-after">Insert after backbone base (0 = before base 1)</label><input type="number" min="0" step="1" id="nexus-bridge-after" value="0"></div><div id="nexus-bridge-replace-coord" class="nexus-bridge-controls" hidden><div class="field"><label for="nexus-bridge-start">Replace from (1-based)</label><input type="number" min="1" id="nexus-bridge-start" value="1"></div><div class="field"><label for="nexus-bridge-end">Through (inclusive)</label><input type="number" min="1" id="nexus-bridge-end" value="1"></div></div></div>
     <div class="actions"><button class="btn primary" id="nexus-bridge-run" type="button">Simulate plasmid assembly</button><button class="btn" id="nexus-bridge-open" type="button" disabled>Open assembled plasmid on map</button></div>
     <p id="nexus-bridge-status" class="nexus-bridge-message" role="status">Assembly is not run. No current plasmid has been changed.</p>
     <div id="nexus-bridge-output" hidden><div id="nexus-bridge-metrics" class="nexus-bridge-metrics"></div><div class="map" id="nexus-bridge-map"></div>
     <h3>Simulated junctions (base pairs, 5′→3′)</h3><pre class="nexus-bridge-code" id="nexus-bridge-junctions"></pre><h3>Common restriction motif screen (circular DNA)</h3><p id="nexus-bridge-sites" class="nexus-bridge-message"></p>
     <details><summary>Assembly assumptions and review notes</summary><ul id="nexus-bridge-warnings"></ul></details>
     <div class="actions"><button class="btn" id="nexus-bridge-fasta">Export complete plasmid FASTA</button><button class="btn" id="nexus-bridge-genbank">Export annotated circular GenBank</button><button class="btn" id="nexus-bridge-json">Export plasmid JSON</button><button class="btn" id="nexus-bridge-svg">Export plasmid map SVG</button></div></div>`;
    anchor.insertAdjacentElement('beforebegin',box);
    const $=id=>doc.getElementById(id);
    let insert=null,backbone=null,built=null;
    function status(text,bad){$('nexus-bridge-status').textContent=text;$('nexus-bridge-status').classList.toggle('nexus-bridge-error',!!bad);}
    function received(x){insert=insertFromRecord(x);$('nexus-bridge-insert').textContent=insert.length+' bp · '+insert.features.length+' annotated components · '+insert.source;built=null;$('nexus-bridge-output').hidden=true;$('nexus-bridge-open').disabled=true;status('Insert loaded. Choose a backbone and simulation parameters.');}
    function useBackbone(){backbone=backboneFromRecord(root.NEXUS_GET_CURRENT_RECORD());$('nexus-bridge-backbone').textContent=backbone.name+' · '+backbone.sequence.length+' bp · '+backbone.features.length+' features';$('nexus-bridge-after').max=String(backbone.sequence.length);$('nexus-bridge-end').max=String(backbone.sequence.length);built=null;$('nexus-bridge-output').hidden=true;$('nexus-bridge-open').disabled=true;status('Backbone snapshot selected. Changes to Workbench map do not silently alter this selection.');}
    async function readFile(file){if(file.size>2000000)throw Error('File exceeds the 2 MB import limit.');const raw=await file.text();const ext=file.name.toLowerCase();let data;
      if(ext.endsWith('.json')){data=JSON.parse(raw);if(data.format !== 'nexus-dna-cloning-insert-v1' && !data.sequence)throw Error('JSON does not contain a DNA insert sequence.');}
      else if(/^LOCUS\s/m.test(raw)){data=root.NexusWorkbench.readGenBank(raw);data.format='Imported GenBank DNA insert';}
      else if(/^>/m.test(raw)){const lines=raw.trim().split(/\r?\n/),header=lines.shift();if(lines.some(x=>x.startsWith('>')))throw Error('Select one FASTA insert sequence per file.');data={sequence:lines.join(''),features:[],format:'Imported FASTA '+header.slice(1,40)};}
      else throw Error('Unsupported insert file. Use DNA JSON, FASTA or GenBank.');received(data);
    }
    $('nexus-bridge-file').addEventListener('change',async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;try{await readFile(f);}catch(err){status(err.message,true);}});
    $('nexus-bridge-use-backbone').addEventListener('click',()=>{try{useBackbone();}catch(e){status(e.message,true);}});
    $('nexus-bridge-mode').addEventListener('change',()=>{const rep=$('nexus-bridge-mode').value==='replace';$('nexus-bridge-insert-coord').hidden=rep;$('nexus-bridge-replace-coord').hidden=!rep;});
    $('nexus-bridge-run').addEventListener('click',()=>{try{
      if(!insert)throw Error('Import or transfer a DNA insert first.');if(!backbone)throw Error('Click Use current plasmid to confirm the backbone.');
      built=build(backbone,insert,{mode:$('nexus-bridge-mode').value,after:$('nexus-bridge-after').value,start:$('nexus-bridge-start').value,end:$('nexus-bridge-end').value,orientation:$('nexus-bridge-orientation').value});
      $('nexus-bridge-output').hidden=false;$('nexus-bridge-open').disabled=false;
      $('nexus-bridge-metrics').textContent=`${built.length.toLocaleString()} bp · circular · ${built.features.length} annotations · insert ${built.insertStart}–${built.insertEnd} (${built.orientation})`;
      $('nexus-bridge-map').innerHTML=root.NexusWorkbench.mapSVG(built);
      $('nexus-bridge-junctions').textContent='Upstream | Insert: '+built.junctions.fivePrime+'\nInsert | Downstream: '+built.junctions.threePrime+'\nExact sequence concatenation and coordinate checks: passed';
      $('nexus-bridge-sites').textContent=built.restrictionSites.map(s=>s.name+': '+s.count+' site(s)').join('  ·  ');
      $('nexus-bridge-warnings').replaceChildren();for(const w of built.warnings){const li=doc.createElement('li');li.textContent=w;$('nexus-bridge-warnings').appendChild(li);}
      status('Virtual assembly generated. Review exact sequence, annotations and junctions before using the exports.');
    }catch(e){built=null;$('nexus-bridge-output').hidden=true;$('nexus-bridge-open').disabled=true;status(e.message,true);}});
    $('nexus-bridge-open').addEventListener('click',()=>{try{if(!built)throw Error('Generate an assembly first.');if(typeof root.NEXUS_LOAD_ASSEMBLED_PLASMID!=='function')throw Error('Workbench cannot load the assembled map.');root.NEXUS_LOAD_ASSEMBLED_PLASMID(built);status('Assembled circular DNA opened in the existing Plasmid Workbench. Save or export it to retain a copy.');}catch(e){status(e.message,true);}});
    const safe=(id,fn)=>$(id).addEventListener('click',()=>{try{if(!built)throw Error('Generate an assembly first.');fn();}catch(e){status(e.message,true);}});
    safe('nexus-bridge-fasta',()=>download(doc,root,'NEXUS_complete_plasmid.fasta',fastA(built)));
    safe('nexus-bridge-genbank',()=>download(doc,root,'NEXUS_complete_plasmid.gb',genBank(built)));
    safe('nexus-bridge-json',()=>download(doc,root,'NEXUS_complete_plasmid.json',JSON.stringify(built,null,2)+'\n','application/json'));
    safe('nexus-bridge-svg',()=>download(doc,root,'NEXUS_complete_plasmid_map.svg',root.NexusWorkbench.mapSVG(built),'image/svg+xml'));
    try{const tmp=root.sessionStorage&&root.sessionStorage.getItem(TRANSFER_KEY);if(tmp){root.sessionStorage.removeItem(TRANSFER_KEY);received(JSON.parse(tmp));}}catch(e){status('Direct transfer could not be read. Use Import DNA insert file. '+e.message,true);}
    if(root.location.hash==='#nexus-plasmid-assembly') { root.setTimeout(()=>box.scrollIntoView({block:'start',behavior:'auto'}),100); }
  }
  return Object.freeze({TRANSFER_KEY,asDNA,rc,insertFromRecord,backboneFromRecord,siteScreen,build,fastA,genBank,install});
});
