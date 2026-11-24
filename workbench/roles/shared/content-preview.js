'use strict';
// Content snapshots sent to the actual client pages.
(() => {
 const snapshots=new WeakMap();
 let current=null;
 let detailObserver=null;
 const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,src:reader.result,type:file.type});reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
 function snapshot(){
  if(!current?.form.isConnected)return null;
  const {form,base,context,media}=current,values=Object.fromEntries(new FormData(form));
  delete values.activityImages;
  const originalCarousel=new Set((base.carouselMedia||[...(base.images||[]),...(base.videos||[])]).map(file=>file.src));
  const retained=key=>(base[key]||[]).filter(file=>!originalCarousel.has(file.src));
  return {...base,...values,...(context.kind==='activity'&&values.format==='线上'?{location:''}:{}),...(context.kind==='activity'&&values.template==='捐款类'?{start:'',end:'',location:''}:{}),...(form.elements.amountModes?window.WorkbenchRules.donationSnapshot(values):{}),carouselMedia:media,images:[...retained('images'),...media.filter(file=>!file.type?.startsWith('video/'))],videos:[...retained('videos'),...media.filter(file=>file.type?.startsWith('video/'))],donate:context.kind==='project'||!!form.elements.donate?.checked,experience:!!form.querySelector('[name=experience]:checked'),skills:!!form.querySelector('[name=skills]:checked'),previewPublishedAt:context.previewPublishedAt,previewKind:context.kind,organization:context.organization,parentProject:context.parentProject,relatedActivities:context.relatedActivities,relatedProducts:context.relatedProducts,raised:context.raised||0,participants:context.participants||0,enrolled:context.enrolled||0};
 }
 function phone(data){
  const frame=document.createElement('iframe');
  frame.dataset.contentClientPreview='';frame.title='客户端内容预览';
  if(data){frame.dataset.contentPreviewMode='detail';snapshots.set(frame,structuredClone(data));}
  frame.addEventListener('load',()=>{if(!data)update();send(frame);});
  frame.src=new URL('../../../play.html?workbenchPreview=1&previewKind=content#project-detail',location.href).href;
  const shell=document.createElement('div');shell.className='pe-client-frame';shell.append(frame);
  return shell;
 }
 function send(frame){const data=snapshots.get(frame);if(data)frame.contentWindow?.postMessage({type:'workbench:content-preview',content:data},'*');}
 function update(){
  const data=snapshot();if(!data)return;
  document.querySelectorAll('iframe[data-content-client-preview]:not([data-content-preview-mode=detail])').forEach(frame=>{snapshots.set(frame,data);send(frame);});
 }
 function renderCarousel(state){
  const list=state.form.querySelector('[data-project-carousel-list]');if(!list)return;
  const input=state.form.querySelector('[data-content-media]');
  list.replaceChildren();
  state.form.querySelector('[data-project-carousel-count]').textContent='已上传 '+state.media.length+' 项，首项作为封面；支持图片和视频，拖拽或选中后按方向键调整顺序。';
  const commit=()=>{renderCarousel(state);update();};
  const move=(from,to)=>{if(current!==state||state.loading||from===to||to<0||to>=state.media.length)return;const [file]=state.media.splice(from,1);state.media.splice(to,0,file);commit();list.children[to]?.focus();};
  state.media.forEach((file,index)=>{
   const card=document.createElement('div');card.className='pe-media-item project-carousel-item';card.draggable=true;card.tabIndex=0;card.setAttribute('aria-label','轮播素材 '+(index+1)+'，'+file.name);
   const tile=document.createElement('div');tile.className='pe-image-tile pe-image-button';
   const video=file.type?.startsWith('video/'),media=document.createElement(video?'video':'img');media.src=file.src;media.draggable=false;
   if(video){media.muted=true;media.preload='metadata';}else media.alt=file.name||'轮播图片';
   const remove=document.createElement('button');remove.type='button';remove.className='pe-image-delete';remove.textContent='×';remove.setAttribute('aria-label','删除'+(video?'视频':'图片'));
   remove.addEventListener('click',()=>{if(current!==state||state.loading)return;state.media.splice(index,1);commit();});
   const overlay=document.createElement('div');overlay.className='pe-image-overlay';
   const preview=document.createElement('button');preview.type='button';preview.className='pe-image-operation';preview.textContent='预览';
   preview.addEventListener('click',()=>{
    const dialog=document.createElement('dialog');dialog.className='project-media-lightbox';
    const close=document.createElement('button');close.type='button';close.className='btn';close.textContent='关闭预览';close.addEventListener('click',()=>dialog.close());
    const full=media.cloneNode();if(video){full.controls=true;full.muted=false;}
    dialog.append(full,close);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
   });
   const replace=document.createElement('button');replace.type='button';replace.className='pe-image-operation';replace.textContent='更换';replace.addEventListener('click',()=>{input.dataset.replaceIndex=index;input.click();});
   overlay.append(preview,replace);tile.append(media,remove,overlay);card.append(tile);
   if(index===0){const badge=document.createElement('span');badge.className='pe-cover';badge.textContent='封面';card.append(badge);}
   if(video){const badge=document.createElement('span');badge.className='project-video-badge';badge.textContent='视频';card.append(badge);}
   card.addEventListener('dragstart',event=>{state.dragIndex=index;event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',String(index));});
   card.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';});
   card.addEventListener('drop',event=>{event.preventDefault();if(Number.isInteger(state.dragIndex))move(state.dragIndex,index);state.dragIndex=null;});
   card.addEventListener('dragend',()=>state.dragIndex=null);
   card.addEventListener('keydown',event=>{if(event.target!==card||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();move(index,index+(event.key==='ArrowLeft'?-1:1));});
   list.append(card);
  });
  const upload=document.createElement('button');upload.type='button';upload.className='pe-upload';upload.innerHTML='<span>＋</span>上传图片 / 视频';upload.addEventListener('click',()=>{delete input.dataset.replaceIndex;input.click();});list.append(upload);
 }
 function mount(context){
  current?.resizeObserver?.disconnect();
  const form=document.querySelector('#edit-form'),panel=form.closest('.dialog'),fields=form.querySelector(':scope>.form-grid');
  context.previewPublishedAt=new Date().toLocaleString('sv-SE');
  current={form,context,base:structuredClone(context.base||{}),media:structuredClone(context.base?.carouselMedia||[...(context.base?.images||[]),...(context.base?.videos||[])]),revision:0,loading:false};
  window.WorkbenchContentEditor.mount(form,context);
  renderCarousel(current);
  panel.classList.add('content-editor');panel.dataset.contentKind=context.kind;
  const body=document.createElement('div');body.className='content-editor-layout';
  const aside=document.createElement('aside');aside.className='content-mobile-preview';aside.setAttribute('aria-label','客户端实时预览');
  aside.innerHTML='<div class="pe-mobile-preview-head"><strong>客户端预览</strong><button type="button" class="link" data-content-preview-refresh>刷新</button></div><div class="content-preview-viewport"></div><p class="pe-mobile-preview-note">随填写内容自动更新</p>';
  aside.querySelector('.content-preview-viewport').append(phone());
  fields.replaceWith(body);body.append(fields,aside);
  const viewport=aside.querySelector('.content-preview-viewport');
  const observer=new ResizeObserver(()=>{const scale=Math.min(1,viewport.clientWidth/390);viewport.firstElementChild.style.transform='scale('+scale+')';viewport.style.height=Math.ceil(844*scale)+'px';});
  observer.observe(viewport);current.resizeObserver=observer;
  form.addEventListener('input',update);
  form.addEventListener('submit',event=>{if(current?.form===form&&current.loading){event.preventDefault();event.stopPropagation();document.querySelector('#form-error').textContent='素材正在读取，请稍候再提交。';}},true);
  form.addEventListener('change',async event=>{
   const state=current;if(!state||state.form!==form)return;
   if(event.target.type==='file'&&(event.target.name==='activityImages'||event.target.hasAttribute('data-content-media'))){
    if(state.loading){event.target.value='';return;}
    const input=event.target,isCarousel=input.hasAttribute('data-content-media');
    const revision=++state.revision;state.loading=true;
    try{const files=await Promise.all([...input.files].filter(file=>file.type.startsWith('image/')||(isCarousel&&file.type.startsWith('video/'))).map(readFile));
     if(current!==state||revision!==state.revision||!form.isConnected)return;
     if(isCarousel){const replace=input.dataset.replaceIndex;if(replace!==undefined&&files.length)state.media.splice(Number(replace),1,...files);else state.media.push(...files);delete input.dataset.replaceIndex;}
     else state.media=files;
     state.loading=false;input.value='';renderCarousel(state);
    }catch{if(current===state&&form.isConnected){state.loading=false;document.querySelector('#form-error').textContent='素材读取失败，请重新选择。';}}
   }
   queueMicrotask(update);
  });
  aside.querySelector('[data-content-preview-refresh]').addEventListener('click',()=>{update();const frame=aside.querySelector('iframe');frame.src=frame.src;});
  // Template fields are installed by the editor next.
  queueMicrotask(update);
 }
 function mountExpanded(root){root.append(phone());update();}
 function mountDetail(root,context){
  detailObserver?.disconnect();detailObserver=null;
  if(!root||!context)return;
  const {base,kind,...details}=context;
  const layout=document.createElement('div');layout.className='content-detail-layout';
  const aside=document.createElement('aside');aside.className='content-mobile-preview content-detail-preview';aside.setAttribute('aria-label','客户端预览');
  aside.innerHTML='<div class="pe-mobile-preview-head"><strong>客户端预览</strong></div><div class="content-preview-viewport"></div>';
  const viewport=aside.querySelector('.content-preview-viewport');
  viewport.append(phone({...base,...details,previewKind:kind}));
  root.replaceWith(layout);layout.append(root,aside);
  detailObserver=new ResizeObserver(()=>{const scale=Math.min(1,viewport.clientWidth/390);viewport.firstElementChild.style.transform='scale('+scale+')';viewport.style.height=Math.ceil(844*scale)+'px';});
  detailObserver.observe(viewport);
 }
 window.addEventListener('message',event=>{
  if(event.data?.type!=='client:content-preview-ready')return;
  document.querySelectorAll('iframe[data-content-client-preview]').forEach(frame=>{if(event.source===frame.contentWindow)send(frame);});
 });
 function close(){current?.resizeObserver?.disconnect();current=null;}
 window.WorkbenchContentPreview={mount,mountExpanded,mountDetail,update,snapshot,close};
})();
