'use strict';
importScripts('thermofold-core.js','thermofold-benchmark-core.js');
self.onmessage=evt=>{
 try{
  const records=evt.data.records;if(!Array.isArray(records)||!records.length||records.length>50)throw Error('Choose 1–50 reference records.');
  const results=[];
  for(let i=0;i<records.length;i++){
   const record=NexusFoldBenchmark.validateRecord(records[i]);
   if(record.sequence.length>NexusThermoFold.MAX)throw Error(record.id+': exceeds the 280-nt verified benchmark engine limit.');
   const prediction=NexusThermoFold.fold(record.sequence);
   const comparison=NexusFoldBenchmark.compareRecord(record,prediction);
   results.push(comparison);
   if((i+1)%3===0||i+1===records.length)self.postMessage({progress:i+1,total:records.length});
  }
  self.postMessage({ok:true,rows:results,summary:NexusFoldBenchmark.summarize(results)});
 }catch(e){self.postMessage({ok:false,error:e.message});}
};
