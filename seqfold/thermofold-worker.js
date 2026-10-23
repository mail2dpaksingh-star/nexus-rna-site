importScripts('thermofold-core.js');
self.onmessage=function(event){
  try {self.NexusThermoFold.setParameterPack(event.data?.parameterPack||null);const result=self.NexusThermoFold.fold(event.data?.sequence||'');self.postMessage({ok:true,result});}
  catch(error){self.postMessage({ok:false,error:String(error.message||error)});}
};
