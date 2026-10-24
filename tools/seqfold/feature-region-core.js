/* NEXUS — local-only annotated region selection / export helpers.
 * 1-based inclusive genomic and region-relative coordinates. No motif-based feature inference.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NexusRegion = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const complement = {A:'T',T:'A',C:'G',G:'C',R:'Y',Y:'R',S:'S',W:'W',K:'M',M:'K',B:'V',V:'B',D:'H',H:'D',N:'N'};
  const maxLength = 25000;
  const reverseComplement = seq => [...seq].reverse().map(b => complement[b] || 'N').join('');
  function chooseRegion(record, start, end, strand = 1) {
    if (!record || typeof record.sequence !== 'string') throw Error('Choose a sequence-backed plasmid first.');
    const sequence = record.sequence.toUpperCase().replace(/\s+/g,'').replace(/U/g,'T');
    if (!/^[ACGTRYSWKMBDHVN]+$/.test(sequence)) throw Error('The selected record contains characters outside the supported DNA/IUPAC alphabet.');
    const n = sequence.length;
    start = Number(start); end = Number(end);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < 1 || start > n || end > n) throw Error(`Start and end must be whole numbers from 1 to ${n}.`);
    if (start > end && record.circular !== true) throw Error('A region crossing the origin requires a circular plasmid.');
    const len = start <= end ? end - start + 1 : n - start + 1 + end;
    if (len > maxLength) throw Error(`Select at most ${maxLength.toLocaleString()} nucleotides per annotated region.`);
    const orientation = Number(strand) === -1 ? -1 : 1;
    const forwardPositions = Array.from({length:len}, (_,i) => (start - 1 + i) % n + 1);
    const positions = orientation === -1 ? [...forwardPositions].reverse() : forwardPositions;
    const forward = forwardPositions.map(p => sequence[p-1]).join('');
    const selectedSequence = orientation === -1 ? reverseComplement(forward) : forward;
    return {name:String(record.name || 'Untitled plasmid').slice(0,100),source:String(record.source || ''),recordId:String(record.id||''),start,end,orientation,wrapped:start>end,positions,sequence:selectedSequence,length:len,recordLength:n,circular:Boolean(record.circular)};
  }
  // Select a complete transcribed interval by two annotated features, inclusive.
  // The caller chooses feature order explicitly: 5′ start feature to 3′ end feature.
  // For minus-strand features, coordinates are reversed before reverse-complementing.
  function chooseFeatureSpan(record, startFeatureIndex, endFeatureIndex) {
    if (!record || !Array.isArray(record.features)) throw Error('Choose an annotated plasmid first.');
    const firstIndex=Number(startFeatureIndex),lastIndex=Number(endFeatureIndex);
    if(!Number.isInteger(firstIndex)||!Number.isInteger(lastIndex)||firstIndex<0||lastIndex<0||firstIndex>=record.features.length||lastIndex>=record.features.length) throw Error('Select valid start and end features.');
    const first=record.features[firstIndex],last=record.features[lastIndex],n=record.sequence?.length||0;
    function check(f){
      const a=Number(f.start),b=Number(f.end);
      if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b>n)throw Error('A selected feature has invalid reference coordinates.');
      return {start:a,end:b,strand:Number(f.strand)===-1?-1:1,label:String(f.label||f.type||'Feature')};
    }
    const a=check(first),b=check(last);
    if(a.strand!==b.strand)throw Error('The two feature arrows are on opposite strands. Select features in the same 5′→3′ orientation, or use manual coordinates.');
    const forward=a.strand===1;
    const region=chooseRegion(record,forward?a.start:b.start,forward?b.end:a.end,a.strand);
    return {...region,startLabel:a.label,endLabel:b.label,startFeatureIndex:firstIndex,endFeatureIndex:lastIndex};
  }
  function cleanAnnotation(annotation, len) {
    const start=Number(annotation.start),end=Number(annotation.end);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>len)throw Error(`Annotation coordinates must be 1–${len}, 1-based and inclusive.`);
    const label=String(annotation.label||'').replace(/[\r\n\t<>]/g,' ').trim().slice(0,90);
    if(!label)throw Error('Enter an annotation label.');
    const type=String(annotation.type||'misc_feature').replace(/[^A-Za-z0-9_]/g,'').slice(0,32)||'misc_feature';
    return {start,end,label,type,strand:Number(annotation.strand)===-1?-1:1,origin:annotation.origin==='reference'?'reference':'user',partial:Boolean(annotation.partial)};
  }
  function projectFeatures(record, region) {
    const feats=Array.isArray(record.features)?record.features:[],result=[];
    for(const f of feats.slice(0,200)){
      const a=Number(f.start),b=Number(f.end);
      if(!Number.isInteger(a)||!Number.isInteger(b)||a<1||b<a||b>region.recordLength)continue;
      const hits=[];
      for(let i=0;i<region.positions.length;i++)if(region.positions[i]>=a && region.positions[i]<=b)hits.push(i+1);
      if(!hits.length)continue;
      // Regions crossing a circular origin can produce multiple disjoint pieces.
      let lo=hits[0],prev=lo,sections=[];
      for(const p of hits.slice(1)){if(p!==prev+1){sections.push([lo,prev]);lo=p;}prev=p;}sections.push([lo,prev]);
      sections.forEach(([start,end],i)=>result.push(cleanAnnotation({start,end,label:String(f.label||f.type||'Feature')+(sections.length>1?` (part ${i+1})`:''),type:f.type||'misc_feature',strand:(Number(f.strand)===-1?-1:1)*region.orientation,origin:'reference',partial:(hits.length < b-a+1)||sections.length>1},region.length)));
    }
    return result.slice(0,100);
  }
  const rowsOf = (sequence,annotations,width=60) => {
    const ann=annotations.map(a=>cleanAnnotation(a,sequence.length));let output=[];
    for(let off=0;off<sequence.length;off+=width){const part=sequence.slice(off,off+width);const rows=[];
      for(const f of ann){if(f.end<=off||f.start>off+part.length)continue;
        let mark=Array(part.length).fill(' ');for(let j=0;j<part.length;j++)if(off+j+1>=f.start&&off+j+1<=f.end)mark[j]='=';
        const arrowIndex=f.strand===-1?Math.max(f.start,off+1)-off-1:Math.min(f.end,off+part.length)-off-1;
        mark[arrowIndex]=f.strand===-1?'<':'>';
        rows.push({label:f.label,track:mark.join(''),type:f.type,strand:f.strand,origin:f.origin});
      }
      output.push({start:off+1,end:off+part.length,sequence:part,rows});
    }
    return output;
  };
  function annotatedText(region,annotations) {
    let head=[`NEXUS annotated DNA region · 5' → 3'`,`Reference: ${region.name}`,`Reference coordinates: ${region.start}..${region.end}${region.wrapped?' (crosses origin)':''}; selected strand: ${region.orientation===-1?'- (reverse-complemented)':'+'}`,`Length: ${region.length} nt`,`Annotations are user-entered or imported reference features; no promoter/RBS/UTR identity is automatically inferred.`,`Region-relative annotation coordinates are 1-based inclusive.`, `Source: ${region.source||'Not specified'}`, ''];
    // Align every feature track to the exact first base of the Sequence row.
    // A common prefix width is essential for monospaced TXT viewers (Notepad).
    const labelWidth = Math.max('Sequence'.length, ...annotations.map(a => String(a.label || '').length));
    for(const b of rowsOf(region.sequence,annotations)){
      head.push(`Position ${String(b.start).padStart(6)}..${String(b.end).padEnd(6)}`,`${'Sequence'.padEnd(labelWidth)} ${b.sequence}`);
      for(const row of b.rows)head.push(`${row.label.padEnd(labelWidth)} ${row.track} (${row.strand===-1?'-':'+'}; ${row.origin})`);
      head.push('');
    }
    head.push('ANNOTATIONS');
    annotations.forEach(a=>head.push(`${a.start}..${a.end}\t${a.strand===-1?'-':'+'}\t${a.type}\t${a.label}\t${a.origin||'user'}${a.partial?'\tpartial':''}`));
    return head.join('\n')+'\n';
  }
  // GenBank flat-file writer for exported selected DNA regions only. Other plasmid
  // exporters remain unchanged. This is a LOCAL research file, not an INSDC submission.
  function selectedRegionGenBank(region, annotations, options = {}) {
    if (!region || typeof region.sequence !== 'string') throw Error('Select a DNA region first.');
    const seq = region.sequence.toUpperCase().replace(/\s+/g, '').replace(/U/g, 'T');
    if (!seq || !/^[ACGTRYSWKMBDHVN]+$/.test(seq) || seq.length !== region.length)
      throw Error('Selected region has invalid sequence characters or length.');
    if (!Array.isArray(annotations) || annotations.length > 100) throw Error('Unsupported number of annotations.');
    const ann = annotations.map(a => cleanAnnotation(a, seq.length));
    const synthetic = Boolean(options.synthetic);
    const date = String(options.date || (() => {
      const d = new Date();
      return `${String(d.getUTCDate()).padStart(2,'0')}-${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getUTCMonth()]}-${d.getUTCFullYear()}`;
    })());
    if (!/^\d{2}-[A-Z]{3}-\d{4}$/.test(date)) throw Error('Invalid GenBank date.');
    const locus = String(options.locus || ('NEXUS_' + region.start + '_' + region.end))
      .replace(/[^A-Za-z0-9_]/g,'_').slice(0,16) || 'NEXUS_REGION';
    const rawName=String(region.name || 'Selected region');
    const clean = v => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g,' ').trim();
    function wrapTag(tag, value) {
      const text = clean(value);const lead = tag.padEnd(12,' ');const continuation=' '.repeat(12);
      if (!text) return [lead];
      const out=[];let line=lead, atStart=true;
      for(const word of text.split(' ')) {
        if (line.length + word.length + (atStart?0:1) > 79 && !atStart) {out.push(line);line=continuation;atStart=true;}
        if(!atStart)line+=' ';
        line+=word;atStart=false;
      }
      out.push(line);return out;
    }
    function qualifier(name,value) {
      // Escape quotes, and prevent untrusted user names from injecting new flat-file lines.
      const text=clean(value).replace(/"/g,"'").slice(0,600);
      const prefix=' '.repeat(21);
      const words=('/'+name+'="'+text+'"').split(' ');
      const out=[];let line=prefix;
      for(const word of words){if(line.length+word.length+(line===prefix?0:1)>79 && line!==prefix){out.push(line);line=prefix;}
        if(line!==prefix)line+=' ';line+=word;}
      out.push(line);return out;
    }
    const organism=synthetic ? 'synthetic construct' : clean(options.organism || 'unidentified');
    const divisions=synthetic?'SYN':'UNA';
    const def=`${rawName} selected region ${region.start}..${region.end}${region.wrapped?' crossing circular origin':''}, exported locally by NEXUS SeqFold (research use).`;
    const header=`LOCUS       ${locus.padEnd(16)} ${String(seq.length).padStart(11)} bp    DNA     linear   ${divisions} ${date}`;
    const lines=[header,...wrapTag('DEFINITION',def),'ACCESSION   .','VERSION     .','KEYWORDS    .',...wrapTag('SOURCE',organism),...wrapTag('  ORGANISM',organism),synthetic?'            other sequences; artificial sequences.':'            .',
      ...wrapTag('COMMENT',`Local selected-region export; no public accession assigned. Reference coordinates: ${region.start}..${region.end}; selected strand: ${region.orientation===-1?'- reverse complement':'+'}; original reference: ${rawName}.`),
      ...wrapTag('COMMENT',`Annotation labels are supplied by user/imported source and are not inferred or scientifically validated by NEXUS. ${synthetic?'Synthetic teaching demonstration; NOT a verified biological plasmid.': 'Original source provenance must be verified separately.'}`),
      'FEATURES             Location/Qualifiers',`     source          1..${seq.length}`,...qualifier('organism',organism),...qualifier('mol_type','other DNA')];
    if (synthetic) lines.push(...qualifier('note','Illustrative synthetic sequence, not a verified biological vector'));
    for (const a of ann) {
      const originalType=a.type;
      const allowed=new Set(['promoter','regulatory','gene','rep_origin','misc_feature','terminator','protein_bind','CDS']);
      // We have no verified translation/product evidence in these simplified annotations.
      // A synthetic or unverified CDS must not be exported as an established coding region.
      const unverifiedCDS=originalType==='CDS';
      let type=allowed.has(originalType)&&!unverifiedCDS ? originalType : 'misc_feature';
      const location=`${a.partial?'<':''}${a.start}..${a.partial?'>':''}${a.end}`;
      lines.push(`     ${type.padEnd(15)} ${a.strand===-1?'complement('+location+')':location}`,...qualifier('label',a.label));
      const meta=[];
      if(unverifiedCDS)meta.push('Originally labeled CDS; protein-coding identity, reading frame and product have not been validated. Exported as misc_feature.');
      if(!allowed.has(originalType))meta.push('Original annotation type: '+originalType+'.');
      if(a.partial)meta.push('Feature clipped by selected-region boundary or origin-crossing split.');
      if(a.origin==='user')meta.push('Manually entered annotation; not sequence-validated.');
      if(meta.length)lines.push(...qualifier('note',meta.join(' ')));
    }
    lines.push('ORIGIN');
    for(let i=0;i<seq.length;i+=60){const chunk=seq.slice(i,i+60).toLowerCase();
      lines.push(String(i+1).padStart(9,' ')+' '+(chunk.match(/.{1,10}/g)||[]).join(' '));}
    lines.push('//');
    return lines.join('\n')+'\n';
  }
  function genbankFeatures(annotations,len){return annotations.map(a=>{let f=cleanAnnotation(a,len);const whitelist=new Set(['promoter','regulatory','CDS','gene','rep_origin','misc_feature','terminator','protein_bind','RBS','5UTR','3UTR']);return {start:f.start,end:f.end,strand:f.strand,type:whitelist.has(f.type)&&!['RBS','5UTR','3UTR'].includes(f.type)?f.type:'misc_feature',label:f.label};});}
  return Object.freeze({maxLength,reverseComplement,chooseRegion,chooseFeatureSpan,cleanAnnotation,projectFeatures,rowsOf,annotatedText,genbankFeatures,selectedRegionGenBank});
});
