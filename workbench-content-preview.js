'use strict';
// Transport only: client components own rendering and interactions.
(() => {
 if(window.parent===window||new URLSearchParams(location.search).get('previewKind')!=='content')return;
 const style=document.createElement('style');
 style.textContent='html,body.experience{margin:0;padding:0;background:#fff;overflow:hidden}.experience .studio{display:none}.experience .plate{padding:0}.experience .pair>.current-screen,.experience .phone{width:100%;max-width:390px;margin:auto}.experience .phone{height:100dvh;border:0;border-radius:0;box-shadow:none}';
 document.head.append(style);
 let renderedContent='';
 window.addEventListener('message',event=>{
  if(event.source!==window.parent||event.data?.type!=='workbench:content-preview')return;
  const p=event.data.content;if(!p||typeof p!=='object')return;
  const signature=JSON.stringify(p);if(signature===renderedContent)return;
  const phone=ClientContentDetail.select(p);if(!phone)return;renderedContent=signature;
  ClientContentActions.set(phone,p,{preview:true});ClientContentDetail.render(phone,p);
  if(location.hash!=='#'+phone.id)location.hash=phone.id;
  document.documentElement.dataset.workbenchPreview='ready';document.documentElement.dataset.contentPreview=p.previewKind;document.documentElement.dataset.contentTemplate=p.template||'project';
 });
 window.parent.postMessage({type:'client:content-preview-ready'},'*');
})();
