/* NEXUS DNA Cloning Export — isolated presentation / sequence export extension.
 * Does not alter the existing coding design algorithms, RNA assembly or exports.
 * Local-only sequence processing. User-supplied sequence annotations remain unverified.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.install(root.document, root);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LIMIT = 150000;
  function dna(raw, label, max = LIMIT) {
    const value = String(raw || '').replace(/\s+/g, '').toUpperCase().replace(/U/g, 'T');
    if (value.length > max) throw Error(label + ' exceeds the ' + max + ' bp limit.');
    if (/[^ACGT]/.test(value)) throw Error(label + ' must contain only A, C, G, T (U is converted to T).');
    return value;
  }
  function positiveInt(value, label, limit = 250) {
    const str = String(value === undefined ? '0' : value).trim();
    if (!/^\d+$/.test(str) || Number(str) > limit) throw Error(label + ' must be a whole number between 0 and ' + limit + '.');
    return Number(str);
  }
  function reverseComplement(seq) {
    return seq.split('').reverse().map(ch => ({ A: 'T', C: 'G', G: 'C', T: 'A' }[ch])).join('');
  }
  function motifCount(seq, motif) {
    let count = 0;
    for (let index = seq.indexOf(motif); index !== -1; index = seq.indexOf(motif, index + 1)) count++;
    return count;
  }
  function build(design, options = {}) {
    if (!design || !design.components || !design.transcript) throw Error('Generate and select a construct in Section 3 first.');
    const left = dna(options.left || '', '5′ cloning flank', 500);
    const promoter = dna(options.promoter || '', 'User-supplied promoter', 10000);
    const u5 = dna(design.components.utr5, '5′ UTR');
    const cds = dna(design.components.cds, 'CDS');
    const u3 = dna(design.components.utr3, '3′ UTR');
    const polya = 'A'.repeat(positiveInt(options.polyA === undefined ? 0 : options.polyA, 'Encoded poly(A) tract'));
    const right = dna(options.right || '', '3′ cloning flank', 500);
    if (!u5 || !cds || !u3) throw Error('A 5′ UTR, CDS and 3′ UTR are required.');
    const template = u5 + cds + u3;
    if (template !== dna(design.transcript, 'Selected RNA transcript')) throw Error('Selected components do not match the assembled RNA transcript.');
    if (cds.length % 3 || !cds.startsWith('ATG') || !['TAA', 'TGA', 'TAG'].includes(cds.slice(-3))) throw Error('Selected CDS is not a complete annotated ORF.');
    const components = [
      ['left', '5′ cloning flank', left, 'misc_feature'],
      ['promoter', 'User-supplied promoter (unverified)', promoter, 'promoter'],
      ['utr5', '5′ UTR', u5, '5\'UTR'],
      ['cds', 'Protein-coding region / CDS', cds, 'CDS'],
      ['utr3', '3′ UTR', u3, '3\'UTR'],
      ['polyA', 'DNA-encoded poly(A) tract', polya, 'misc_feature'],
      ['right', '3′ cloning flank', right, 'misc_feature']
    ];
    let pos = 1;
    const features = [];
    for (const [key, label, sequence, type] of components) {
      if (!sequence) continue;
      features.push({ key, label, type, start: pos, end: pos + sequence.length - 1, strand: '+', sequence });
      pos += sequence.length;
    }
    const sequence = features.map(f => f.sequence).join('');
    if (sequence.length > LIMIT) throw Error('DNA insert exceeds the export limit.');
    const warnings = [
      'This is a linear DNA insert, NOT a complete plasmid. Vector backbone, replication origin, selection marker, insertion site and orientation must be established independently.',
      'NEXUS does not infer or add CMV/T7 promoters, cloning sites or other regulatory elements. Any supplied promoter or flank has not been validated.',
      'The transcribed RNA would match the selected RNA hypothesis only if the actual transcription start, termination, splicing and processing preserve these boundaries; optional flanks/promoters are outside that comparison.',
      'DNA-encoded A bases are not an experimentally verified RNA poly(A) tail. No RNA cap, chemical modifications or expression outcome is supplied.',
      'Verify assembly strategy, restriction-site uniqueness, cloning overhangs, vector compatibility, sequence identity and orientation before use.'
    ];
    // Alert to (rather than automatically correct) duplicate flank recognition motifs.
    for (const f of features.filter(f => f.key === 'left' || f.key === 'right')) {
      if (f.sequence.length < 4) continue;
      const rc = reverseComplement(f.sequence);
      const n = motifCount(template, f.sequence) + (rc === f.sequence ? 0 : motifCount(template, rc));
      if (n) warnings.push('User-supplied ' + f.label + ' sequence (or reverse complement) also occurs ' + n + ' time(s) in the UTR–CDS–UTR insert. Review internal restriction/assembly sites.');
    }
    return {
      format: 'nexus-dna-cloning-insert-v1', type: 'linear DNA insert', length: sequence.length,
      sequence, coreSequence: template, protein: design.protein, features, warnings,
      selection: design.selection || null,
      notes: 'Local export from selected NEXUS RNA design; no plasmid backbone, expression validation or in-silico cloning is implied.'
    };
  }
  function fasta(record) {
    const lines = record.sequence.match(/.{1,70}/g) || [];
    return '>NEXUS_linear_DNA_cloning_insert_' + record.length + 'bp\n' + lines.join('\n') + '\n';
  }
  function flatGenBank(record, opts = {}) {
    const seq = record.sequence;
    if (!/^[ACGT]+$/.test(seq)) throw Error('Invalid DNA bases.');
    const d = new Date();
    const date = String(d.getUTCDate()).padStart(2, '0') + '-' +
      ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getUTCMonth()] + '-' + d.getUTCFullYear();
    const name = 'NEXUS_DNA_INS';
    const clean = str => String(str).replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/"/g, "'").trim();
    const tag = (key, value) => {
      const prefix = key.padEnd(12, ' '), lead = ' '.repeat(12);
      const chunks = clean(value).split(' '); const out=[]; let current=prefix;
      for (const word of chunks) {
        if (current.length > 12 && current.length + 1 + word.length > 79) { out.push(current); current=lead; }
        current += (current.length > 12 ? ' ' : '') + word;
      }
      out.push(current);return out;
    };
    const qualifier = (key, val) => {
      const prefix = ' '.repeat(21);
      const words = ('/' + key + '="' + clean(val).slice(0, 600) + '"').split(' ');
      let current=prefix;const out=[];
      for (const word of words) {
        if (current.length > 21 && current.length + 1 + word.length > 79) {out.push(current); current=prefix;}
        current+=(current.length>21?' ':'')+word;
      }
      out.push(current);return out;
    };
    const lines = [
      `LOCUS       ${name.padEnd(16)} ${String(seq.length).padStart(11)} bp    DNA     linear   SYN ${date}`,
      ...tag('DEFINITION', 'NEXUS selected coding and UTR sequence converted from RNA to a linear DNA cloning insert; experimental status unverified.'),
      'ACCESSION   .', 'VERSION     .', 'KEYWORDS    .',
      ...tag('SOURCE', 'synthetic construct'), ...tag('  ORGANISM', 'synthetic construct'),
      '            other sequences; artificial sequences.',
      ...tag('COMMENT', 'No public accession assigned. This linear insert excludes the vector backbone. Features and added segments are user-supplied or computationally derived; not experimentally confirmed.'),
      'FEATURES             Location/Qualifiers',
      `     source          1..${seq.length}`,
      ...qualifier('organism','synthetic construct'), ...qualifier('mol_type','other DNA'),
      ...qualifier('note','Local research insert. Not a verified expression plasmid.')
    ];
    for (const feature of record.features) {
      lines.push('     ' + feature.type.padEnd(15) + ' ' + feature.start + '..' + feature.end,
        ...qualifier('label', feature.label));
      if (feature.key === 'cds') {
        lines.push('                     /codon_start=1', '                     /transl_table=1');
        if (record.protein && /^[ACDEFGHIKLMNPQRSTVWY*]+$/.test(record.protein)) {
          lines.push(...qualifier('translation',record.protein.replace(/\*$/, '')));
        }
        lines.push(...qualifier('note','Protein translation computationally verified by selected NEXUS design; no experimental expression evidence.'));
      } else if (feature.key === 'promoter') lines.push(...qualifier('note','User-supplied promoter sequence; identity, direction and functionality not verified.'));
      else if (feature.key === 'polyA') lines.push(...qualifier('note','DNA-encoded poly(A) tract; not an experimentally verified RNA poly(A) tail.'));
      else if (feature.key === 'left' || feature.key === 'right') lines.push(...qualifier('note','User-supplied assembly flank; restriction/overhang compatibility not verified.'));
      else lines.push(...qualifier('note','Selected research-design component.'));
    }
    lines.push('ORIGIN');
    for(let i=0;i<seq.length;i+=60) {
      const groups=(seq.slice(i,i+60).toLowerCase().match(/.{1,10}/g)||[]).join(' ');
      lines.push(String(i+1).padStart(9,' ')+' '+groups);
    }
    lines.push('//');
    return lines.join('\n')+'\n';
  }
  function install(doc, root) {
    if (doc.getElementById('nexus-dna-export-panel')) return;
    const source = doc.getElementById('transcript');
    if (!source || !root.NexusUTR) return;
    const css = doc.createElement('link');css.rel='stylesheet';css.href='dna-cloning-export.css';doc.head.appendChild(css);
    const panel = doc.createElement('section');panel.id='nexus-dna-export-panel';panel.className='panel nexus-dna-panel';
    panel.innerHTML = `<h2>5. DNA construct for plasmid cloning</h2>
      <p>Export the <strong>selected 5′ UTR + CDS + 3′ UTR as DNA (T in place of U)</strong>. Add only the promoter, assembly flanks or DNA-encoded poly(A) tract required by your chosen vector workflow. This is a <strong>linear DNA insert, not an entire plasmid</strong>.</p>
      <div class="nexus-dna-form">
       <div><label for="nexus-dna-left">Optional 5′ cloning flank (DNA)</label><input id="nexus-dna-left" placeholder="User-supplied assembly site / flank" spellcheck="false"><small>Do not assume restriction-site uniqueness or orientation.</small></div>
       <div><label for="nexus-dna-promoter">Optional upstream promoter (DNA)</label><textarea id="nexus-dna-promoter" rows="2" placeholder="Paste verified promoter sequence, if your vector does not already supply it" spellcheck="false"></textarea><small>No CMV/T7 promoter is silently added.</small></div>
       <div><label for="nexus-dna-polyA">Optional DNA-encoded poly(A) length (A residues)</label><input id="nexus-dna-polyA" type="number" min="0" max="250" step="1" value="0"><small>Default 0. This is a DNA template feature, not a manufactured RNA tail.</small></div>
       <div><label for="nexus-dna-right">Optional 3′ cloning flank (DNA)</label><input id="nexus-dna-right" placeholder="User-supplied assembly site / flank" spellcheck="false"><small>Confirm overhangs, reading frame and compatible vector sites.</small></div>
      </div>
      <div class="nexus-dna-head"><strong>Selected DNA insert · 5′ → 3′</strong><span id="nexus-dna-length">Generate a construct above</span></div>
      <div id="nexus-dna-features" class="nexus-dna-features"></div>
      <pre id="nexus-dna-sequence" class="seq-preview nexus-dna-seq">No DNA insert generated yet.</pre>
      <div class="actions nexus-dna-actions"><button type="button" class="button" id="nexus-dna-fasta" disabled>Export DNA FASTA</button><button type="button" class="button secondary" id="nexus-dna-gb" disabled>Export annotated GenBank</button><button type="button" class="button secondary" id="nexus-dna-json" disabled>Export DNA insert JSON</button></div>
      <p class="nexus-dna-message" role="status" id="nexus-dna-status">Generate an RNA candidate in Section 3, then export its corresponding DNA insert here.</p>
      <details class="nexus-dna-details"><summary>Cloning and biological limitations</summary><ul id="nexus-dna-warnings"></ul></details>
      <p class="nexus-dna-link">The plasmid backbone and vector features are not part of this exported insert. <a href="../seqfold/workbench.html">Open NEXUS Plasmid Workbench</a> to inspect/import a compatible construct and annotate its vector features.</p>`;
    source.insertAdjacentElement('afterend', panel);
    const $=id=>doc.getElementById(id);
    let current=null;
    function getDesign() {
      if ($('assembled').hidden) throw Error('Generate and select a complete RNA candidate first.');
      const pick = id => $(id).value;
      const args={
        coding:pick('coding'),inputType:pick('coding-type'),codonWeights:pick('codon-weights'),
        utr5:pick('utr5'),utr3:pick('utr3'),codingIndex:pick('choose-coding'),
        utr5Index:pick('choose-5'),utr3Index:pick('choose-3')
      };
      const candidate=root.NexusUTR.fullDesign(args);
      const displayed=$('transcript-seq').textContent.replace(/\s+/g,'').toUpperCase();
      if (candidate.transcript!==displayed) throw Error('Current selections do not match the displayed RNA construct. Regenerate candidates.');
      return candidate;
    }
    function refresh() {
      const status=$('nexus-dna-status');
      try {
        current=build(getDesign(),{
          left:$('nexus-dna-left').value,
          promoter:$('nexus-dna-promoter').value,
          polyA:$('nexus-dna-polyA').value,
          right:$('nexus-dna-right').value
        });
        $('nexus-dna-length').textContent=current.length.toLocaleString()+' bp · linear DNA insert';
        $('nexus-dna-sequence').textContent=(current.sequence.match(/.{1,80}/g)||[]).join('\n');
        const track=$('nexus-dna-features');track.replaceChildren();
        for (const f of current.features) {
          const tag=doc.createElement('span');tag.textContent=f.label+' · '+f.start+'–'+f.end;tag.className='nexus-dna-feature';track.appendChild(tag);
        }
        const warnings=$('nexus-dna-warnings');warnings.replaceChildren();
        for(const msg of current.warnings){const item=doc.createElement('li');item.textContent=msg;warnings.appendChild(item);}
        for (const id of ['nexus-dna-fasta','nexus-dna-gb','nexus-dna-json']) $(id).disabled=false;
        status.classList.remove('error');status.textContent='DNA insert is current for the selected CDS/UTR design. Verify sequence, sites and vector orientation before cloning.';
      } catch(e) {
        current=null;
        $('nexus-dna-length').textContent='DNA insert unavailable';$('nexus-dna-sequence').textContent='No current DNA insert.';
        $('nexus-dna-features').replaceChildren();$('nexus-dna-warnings').replaceChildren();
        for (const id of ['nexus-dna-fasta','nexus-dna-gb','nexus-dna-json']) $(id).disabled=true;
        status.textContent=e.message;status.classList.add('error');
      }
    }
    function save(filename,content,type){
      if(!current)return;
      const a=doc.createElement('a'),url=root.URL.createObjectURL(new root.Blob([content],{type}));
      a.href=url;a.download=filename;doc.body.appendChild(a);a.click();a.remove();
      root.setTimeout(()=>root.URL.revokeObjectURL(url),3000);
    }
    $('nexus-dna-fasta').addEventListener('click',()=>save('NEXUS_DNA_Cloning_Insert.fasta',fasta(current),'text/plain'));
    $('nexus-dna-gb').addEventListener('click',()=>save('NEXUS_DNA_Cloning_Insert.gb',flatGenBank(current),'text/plain'));
    $('nexus-dna-json').addEventListener('click',()=>save('NEXUS_DNA_Cloning_Insert.json',JSON.stringify(current,null,2)+'\n','application/json'));
    for (const id of ['nexus-dna-left','nexus-dna-promoter','nexus-dna-polyA','nexus-dna-right']) $(id).addEventListener('input',refresh);
    for (const id of ['choose-coding','choose-5','choose-3','coding','coding-type','utr5','utr3','codon-weights']) $(id).addEventListener('change',refresh);
    for (const id of ['coding','utr5','utr3','codon-weights']) $(id).addEventListener('input',refresh);
    for(const id of ['generate','example','clear']) $(id).addEventListener('click',()=>root.setTimeout(refresh,0));
    refresh();
  }
  return Object.freeze({dna,build,fasta,flatGenBank,install});
});
