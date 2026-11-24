'use strict';
// Hosts the real foundation application; no separate content renderer or editor.
(() => {
 const params=new URLSearchParams(location.search),role=params.get('systemRole');
 const enabled=['super','foundation'].includes(role),pages=['projects','activities','actions','applications'];
 const roleName=()=>role==='super'?'系统超级管理员':'系统基金会管理员';
 window.WorkbenchSystemHost={pages,roleName,
  organizations:data=>enabled?data.organizations.filter(o=>o.role==='foundation'&&o.status==='已入驻'):[],
  member:org=>enabled&&window.WorkbenchData.organizations.some(o=>o.id===org&&o.role==='foundation'&&o.status==='已入驻')?{id:'system-platform',accountKey:'system-platform',org,name:'平台管理员',role:roleName(),permissions:pages}:null};
 let editing=false,editItem='',scheduled=false,last='';
 function emit(){
  const api=window.WorkbenchFoundationContent;if(!api)return;
  const form=document.querySelector('#edit-form');
  const hasEditor=Boolean(form?.querySelector('.project-carousel-editor'));
  if(!hasEditor){editing=false;editItem='';}
  const s=api.state,route={project:s.project,activity:s.activity,section:s.activity?s.activityTab:s.projectTab,application:document.querySelector('[data-route-application]')?.dataset.routeApplication||''};
  if(route.section==='基本信息')route.section='';
  if(hasEditor&&editItem){if(s.page==='projects')route.project=editItem;else route.activity=editItem;}
  const payload={type:'shanji-foundation-content',page:s.page,org:s.org,route,edit:hasEditor};
  const signature=JSON.stringify(payload)+sessionStorage.getItem('shanxing-content-edits-v1');
  if(signature===last)return;last=signature;
  parent.postMessage(payload,location.origin==='null'?'*':location.origin);
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;emit();});}
 document.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(!b)return;if(['project-edit','activity-edit','project-new','activity-new'].includes(b.dataset.action)){editing=true;editItem=b.dataset.id||'';}schedule();},true);
 document.addEventListener('submit',schedule);
 addEventListener('DOMContentLoaded',()=>{
  if(!enabled){document.querySelector('#app').textContent='当前系统角色无权管理公益内容';return;}
  const api=window.WorkbenchFoundationContent;if(!api)return;
  api.state.demoAccount='system-platform';
  if(params.get('activity'))api.state.activityTab=params.get('section')||'基本信息';
  api.render();
  if(params.get('edit')==='1'){
   editing=true;editItem=params.get('activity')||params.get('project')||'';
   if(api.state.page==='projects')api.projectEditor(params.get('project')||undefined);
   else if(params.get('activity'))api.activityEditor(params.get('activity'));
   else document.querySelector('[data-action=activity-new]')?.click();
  }
  new MutationObserver(schedule).observe(document.querySelector('#app'),{childList:true,subtree:true});
  new MutationObserver(schedule).observe(document.querySelector('#overlay'),{childList:true,subtree:true});
  emit();
 });
})();
