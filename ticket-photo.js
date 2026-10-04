/* Optional screenshot OCR. Pixels stay on this device; only reviewed totals are saved. */
(function(root){
 'use strict';
 let loading;
 function load(){
  if(root.Tesseract)return Promise.resolve(root.Tesseract);
  if(!loading)loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js';script.crossOrigin='anonymous';
   script.integrity='sha384-r1ru3tcf6FhnCFR4B7pIFG+BhFF9LlFtz/P1y4pblWn3AGs9y3lBx5SKLNf4+rED';
   const timer=setTimeout(()=>{script.remove();loading=null;reject(Error('Photo reader did not load. Try again or enter the totals below.'));},20000);
   script.onload=()=>{clearTimeout(timer);resolve(root.Tesseract);};
   script.onerror=()=>{clearTimeout(timer);script.remove();loading=null;reject(Error('Photo reader is unavailable. You can still enter the totals below.'));};document.head.append(script);
  });return loading;
 }
 async function read(file,onProgress=()=>{}){
  if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPG or WebP screenshot.');
  if(file.size>15*1024*1024)throw Error('Choose a screenshot smaller than 15 MB.');
  const engine=await load();let worker,timer,expired=false;
  const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;worker?.terminate();reject(Error('Photo reading timed out. Try a tighter crop or enter the totals below.'));},90000);});
  const work=(async()=>{
   worker=await engine.createWorker('eng',1,{workerPath:'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',corePath:'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int',logger:m=>{if(!expired&&m.status==='recognizing text')onProgress(Math.round(m.progress*100));}});
   if(expired){await worker.terminate();throw Error('Photo reading timed out.');}
   const {data}=await worker.recognize(file);return root.LeagueTicketValues.parse(data.text);
  })();
  try{return await Promise.race([work,timeout]);}finally{clearTimeout(timer);if(worker)try{await worker.terminate();}catch{}}
 }
 root.LeagueTicketPhoto={read};
})(globalThis);
