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
    for(const b of rowsOf(region.sequence,annotations)){
      head.push(`Position ${String(b.start).padStart(6)}..${String(b.end).padEnd(6)}`,`Sequence    ${b.sequence}`);
      for(const row of b.rows)head.push(`${row.label.slice(0,22).padEnd(22)} ${row.track} (${row.strand===-1?'-':'+'}; ${row.origin})`);
      head.push('');
    }
    head.push('ANNOTATIONS');
    annotations.forEach(a=>head.push(`${a.start}..${a.end}\t${a.strand===-1?'-':'+'}\t${a.type}\t${a.label}\t${a.origin||'user'}${a.partial?'\tpartial':''}`));
    return head.join('\n')+'\n';
  }
  function genbankFeatures(annotations,len){return annotations.map(a=>{let f=cleanAnnotation(a,len);const whitelist=new Set(['promoter','regulatory','CDS','gene','rep_origin','misc_feature','terminator','protein_bind','RBS','5UTR','3UTR']);return {start:f.start,end:f.end,strand:f.strand,type:whitelist.has(f.type)&&!['RBS','5UTR','3UTR'].includes(f.type)?f.type:'misc_feature',label:f.label};});}
  return Object.freeze({maxLength,reverseComplement,chooseRegion,chooseFeatureSpan,cleanAnnotation,projectFeatures,rowsOf,annotatedText,genbankFeatures});
});
