'use strict';
// Published examples exercise the same data-driven detail and donation components.
(() => {
 if(new URLSearchParams(location.search).get('workbenchPreview')==='1')return;
 document.querySelectorAll('.plate').forEach(plate=>plate.querySelectorAll('.phone').forEach((phone,index)=>{if(!phone.id)phone.id='screen-'+plate.id+'-'+index;}));
 const shared={groupQr:'assets/group-qr-demo.svg',previewKind:'activity',kind:'项目活动',organization:{name:'善行公益基金会'},parentProject:{name:'乡村阅读计划'},start:'2026-12-12T14:00',end:'2026-12-12T16:00',deadline:'2026-12-11T18:00',location:'公益交流中心',contact:'林晓',contactPhone:'13800000000',capacity:100,enrolled:12,donationOptions:'50,100,200',drawMin:1,drawMax:100};
 const examples={
  'screen-project-activity-detail-0':{template:'报名类',name:'企业公益共建',amountModes:['preset','random','custom']},
  'action-detail':{previewKind:'action',kind:'公益行动',template:'报名类',name:'周末阅读志愿者招募',amountModes:['preset','random','custom']},
  'activity-news':{template:'宣发类',name:'阅读活动回顾',amountModes:['preset','custom'],donationOptions:'10,30,50'},
  'action-news':{previewKind:'action',kind:'公益行动',template:'宣发类',name:'周末阅读行动回顾',amountModes:['random','custom'],drawMin:2,drawMax:20},
  'screen-conference-0':{template:'捐赠参会类',name:'公益伙伴交流会',amountModes:['preset']},
  'conference-random':{template:'捐赠参会类',name:'社区公益同行会',amountModes:['random']},
  'conference-custom':{template:'捐赠参会类',name:'企业公益共创会',amountModes:['custom']},
  'conference-multiple':{template:'捐赠参会类',name:'公益资源交流会',amountModes:['preset','random','custom']}
 };
 let rendering=false;
 function activate(phone){
  if(rendering||!phone)return;
  const example=examples[phone.id];if(!example){ClientContentActions.close();return;}
  if(!phone.contentExample){
   const root=ClientContentDetail.bodyRoot(phone);
   phone.contentExample={...shared,...example,bodyHtml:root?.innerHTML||'',format:'线下'};
  }
  rendering=true;
  try{ClientContentDetail.render(phone,phone.contentExample);ClientContentActions.set(phone,phone.contentExample);}finally{rendering=false;}
 }
 window.addEventListener('experience:screen',({detail})=>activate(detail.phone));
 // Each amount example is reachable from the original conference detail.
 const original=document.getElementById('screen-conference-0');
 if(original){const links=document.createElement('section');links.className='panel';links.innerHTML='<h3>更多公益交流会</h3>';
 for(const id of ['conference-random','conference-custom','conference-multiple']){const a=document.createElement('a');a.className='row';a.href='#'+id;a.textContent=examples[id].name+' ›';links.append(a);}original.querySelector('.content').append(links);}
 const action=document.getElementById('action-detail');if(action){const a=document.createElement('a');a.href='#action-news';a.className='panel linked-project';a.textContent='周末阅读行动回顾 ›';action.querySelector('.content').append(a);}
 for(const id of Object.keys(examples))activate(document.getElementById(id));
 const native=document.getElementById('conference-signup'),sample=document.getElementById('screen-conference-0')?.contentExample;
 if(native&&sample)ClientContentActions.conferenceAmounts(native,native.closest('.phone'),sample);
 const active=document.querySelector('.phone.current-phone');activate(active||document.getElementById(location.hash.slice(1)));
})();
