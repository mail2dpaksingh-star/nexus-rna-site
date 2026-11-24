importScripts('thermofold-core.js');
self.onmessage=function(event){
  try{
    self.NexusThermoFold.setParameterPack(event.data?.parameterPack||null);
    const sequence=event.data?.sequence||'';
    const result=event.data?.mode==='windowed'
      ?self.NexusThermoFold.foldWindowed(sequence,{onProgress:info=>self.postMessage({progress:info})})
      :self.NexusThermoFold.fold(sequence);
    self.postMessage({ok:true,result});
  }catch(error){
    self.postMessage({ok:false,error:String(error.message||error)});
  }
};
