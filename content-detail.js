'use strict';
// Update data in the client's own detail components; previews use this same renderer.
(() => {
 const set=(root,selector,value)=>{const el=root.querySelector(selector);if(el)el.textContent=value??'';};
 const money=value=>Number(value||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
 const date=value=>String(value||'待填写').replace('T',' ');
 const panel=(root,title)=>[...root.querySelectorAll('section')].find(el=>el.querySelector(':scope>h3')?.textContent.trim()===title);
 function bodyRoot(phone){
  let root=phone.querySelector('[data-content-body]');if(root)return root;
  const section=panel(phone,'项目介绍')||panel(phone,'行动介绍')||panel(phone,'活动介绍')||phone.querySelector('.activity-detail>.panel');
  if(!section)return null;
  root=section.querySelector(':scope>.project-richtext');
  if(!root){root=document.createElement('div');const heading=section.querySelector(':scope>h3');let next=heading?.nextSibling;while(next){const current=next;next=next.nextSibling;root.append(current);}section.append(root);}
  root.dataset.contentBody='';root.classList.add('client-article-body');return root;
 }
 function media(root,files,project=false){
  if(!root)return;
  const key=JSON.stringify(files.map(file=>[file.src,file.type]));if(root.dataset.contentMedia===key)return;root.dataset.contentMedia=key;
  const targets=project?root.querySelectorAll('.project-cover-slide'):[];
  const fill=(target,file)=>{target.replaceChildren();if(!file)return;const el=document.createElement(file.type?.startsWith('video/')?'video':'img');el.src=file.src;el.alt=file.name||'封面';if(el.tagName==='VIDEO')el.controls=true;el.style.cssText='display:block;width:100%;height:100%;object-fit:cover';if(file.caption){const hero=document.createElement('div');hero.className='hero';const caption=document.createElement('span');caption.textContent=file.caption;hero.append(el,caption);target.append(hero);}else target.append(el);};
  if(project){const track=root.querySelector('.project-cover-track'),template=targets[0]?.cloneNode(true);if(!track||!template)return;track.replaceChildren(...(files.length?files:[null]).map(file=>{const slide=template.cloneNode(true);fill(slide,file);return slide;}));track.scrollLeft=0;const dots=root.querySelector('.project-cover-dots');if(dots)dots.replaceChildren(...files.map((file,index)=>{const dot=document.createElement('button');dot.type='button';dot.dataset.bannerIndex=index;dot.setAttribute('aria-label','查看第 '+(index+1)+' 张');dot.setAttribute('aria-pressed',String(index===0));dot.addEventListener('click',()=>track.scrollTo({left:track.clientWidth*index,behavior:'smooth'}));return dot;}));track.onscroll=()=>{const active=Math.round(track.scrollLeft/track.clientWidth);dots?.querySelectorAll('button').forEach((dot,index)=>dot.setAttribute('aria-pressed',String(index===active)));};}
  else fill(root,files[0]);
 }
 function fact(phone,label,value){for(const row of phone.querySelectorAll('.activity-fact,.enrollment-info-row')){const name=row.querySelector('span:last-of-type'),target=row.querySelector('b');if(name?.textContent.trim()===label&&target)target.textContent=value;}}
 function totals(phone,p){
  const target=Number(p.target)||0,raised=Number(p.raised)||0,percent=target?Math.min(100,raised/target*100):0;
  phone.querySelectorAll('.fundraising-summary').forEach(summary=>{set(summary,'.fundraising-percent',target?percent.toFixed(1)+'%':'未设筹款目标');const values=[target?money(target):'未设目标',money(raised),String(p.participants||0)];summary.querySelectorAll('.fundraising-totals strong').forEach((el,index)=>el.textContent=values[index]);const progress=summary.querySelector('.progress');if(progress){progress.hidden=!target;progress.setAttribute('aria-valuemax',String(target));progress.setAttribute('aria-valuenow',String(raised));progress.firstElementChild.style.width=percent+'%';}});
 }
 function related(list,items,goods=false){
  const template=list.contentRowTemplate||list.querySelector(goods?'.project-goods-card':'.project-activity-cell');if(!template)return;
  if(!list.contentRowTemplate)list.contentRowTemplate=template.cloneNode(true);
  list.querySelectorAll(goods?'.project-goods-card':'.project-activity-cell').forEach(el=>el.remove());
  for(const item of items){const row=list.contentRowTemplate.cloneNode(true);set(row,goods?'.project-goods-info>b':'b',item.name);set(row,goods?'.project-goods-info>small':'p',item.status||'');if(goods)set(row,'strong','¥'+money(item.price));const image=item.images?.[0];if(image)media(row.querySelector(goods?'.project-goods-image':'.project-cell-cover'),[image]);list.append(row);}
 }
 function render(phone,p){
  const isProject=p.previewKind==='project';
  if(isProject){
   set(phone,'.project-overview h3',p.name||'请输入项目名称');set(phone,'.project-subtitle',p.intro||'请输入项目简介');totals(phone,p);
   media(phone.querySelector('.project-cover-carousel'),p.carouselMedia||[...(p.images||[]),...(p.videos||[])],true);
   const names={'主办方':p.organization?.name,'承办方':'平台公司','联合主办方':p.cohost,'组办方':p.organizer};
   phone.querySelectorAll('.institution-row').forEach(row=>{const role=row.querySelector('.institution-identity p')?.textContent.trim();row.hidden=!names[role];if(names[role])set(row,'.institution-identity b',names[role]);});
   phone.querySelectorAll('.project-activity-list').forEach(list=>related(list,(p.relatedActivities||[]).filter(item=>item.kind===list.querySelector('h3')?.textContent.trim())));
   const goods=phone.querySelector('.project-goods-grid');if(goods)related(goods,p.relatedProducts||[],true);
   const donation=phone.querySelector('.project-donation-bar>.button');if(donation)donation.hidden=!p.donate;
  }else{
   const news=p.template==='宣发类',conference=p.template==='捐赠参会类';
   const footer=phone.querySelector('footer');
   if(footer&&footer.dataset.contentActionsKey!==p.template+'|'+p.kind){
    footer.dataset.contentActionsKey=p.template+'|'+p.kind;
    footer.querySelectorAll(':scope>.button,[data-content-primary-actions]').forEach(el=>{if(!(news&&el.getAttribute('href')==='#activity-ended'))el.remove();});
    const button=(label,donation)=>{const a=document.createElement('a');a.className='button'+(donation&&p.template==='报名类'?' secondary':'');a.href=donation?'#donate':conference?'#conference':p.kind==='项目活动'?'#enterprise-signup-page':'#registration';a.textContent=label;if(donation)a.dataset.openActivityDonation='';else a.classList.add('activity-apply');a.dataset.contentPrimaryActions='';footer.append(a);};
    if(p.template==='报名类'){button('捐款支持',true);button('我要报名',false);}
    else if(news)button('捐赠支持',true);
    else if(conference)button('填写资料并捐赠',false);
    else button('捐赠支持',true);
   }

   set(phone,'.activity-overview h2',p.name||'请输入标题');
   if(conference)set(phone,'.content>.panel>h3',p.name||'请输入标题');
   if(news){
    const title=phone.querySelector('.activity-detail>.panel>h3');if(title){
     title.textContent=p.name||'请输入标题';let published=title.nextElementSibling;
     if(!published?.matches('[data-content-published-at]')){published=document.createElement('time');published.dataset.contentPublishedAt='';published.className='content-published-at';title.after(published);}
     const value=p.publishedAt||p.previewPublishedAt||phone.contentPreviewPublishedAt||(phone.contentPreviewPublishedAt=new Date().toLocaleString('sv-SE'));
     published.textContent='发布时间：'+String(value).replace('T',' ');published.dateTime=String(value).replace(' ','T');
    }
   }
   set(phone,'.linked-project b',(p.parentProject?.name||'所属项目')+' ›');
   set(phone,'.activity-organizer h3',p.organization?.name||'');set(phone,'.activity-organizer p','活动联系人：'+([p.contact,p.contactPhone].filter(Boolean).join(' ')||'待填写'));
   for(const [label,value] of [['总招募人数',(p.capacity||0)+' 人'],['已招募',(p.enrolled||0)+' 人'],['活动时间',date(p.start)+'—'+date(p.end)],['举办时间',date(p.start)+'—'+date(p.end)],['活动地点',p.location||'待填写'],['报名截止时间',date(p.deadline)],['参会方式',p.template==='捐赠参会类'&&p.format==='线上'?'线上参会':'线下参会']])fact(phone,label,value);
   for(const row of phone.querySelectorAll('.activity-fact,.enrollment-info-row')){
    const label=row.querySelector('span:last-of-type')?.textContent.trim();
    if(['活动时间','行动时间','举办时间','开始时间','结束时间','活动地点','行动地点'].includes(label))row.hidden=['宣发类','捐款类'].includes(p.template)||(['活动地点','行动地点'].includes(label)&&conference&&p.format==='线上');
   }
   phone.querySelectorAll('.activity-donation-rule').forEach(row=>row.remove());
   const cover=phone.querySelector('.activity-cover')||phone.querySelector('.content>.hero');
   if(cover&&(p.carouselMedia||p.images||p.videos)&&!cover.querySelector('.project-cover-track')){cover.classList.add('project-cover-carousel');cover.innerHTML='<div class="project-cover-track"><div class="project-cover-slide"></div></div><div class="project-cover-dots"></div>';}
   if(p.carouselMedia||p.images||p.videos)media(cover,p.carouselMedia||[...(p.images||[]),...(p.videos||[])],true);
  }
  const root=bodyRoot(phone);if(root)ContentBody.render(root,p.bodyHtml===undefined?ContentBody.fromText(isProject?p.body:p.intro):p.bodyHtml);
  if(document.body.classList.contains('experience'))window.dispatchEvent(new CustomEvent('experience:screen',{detail:{id:phone.id,phone}}));
 }
 function screens(){return {project:document.getElementById('project-detail'),action:document.getElementById('action-detail'),activity:document.getElementById('screen-project-activity-detail-0'),donation:document.getElementById('activity-one-yuan'),news:document.getElementById('activity-news'),conference:document.getElementById('screen-conference-0')};}
 function select(p){const all=screens();return p.previewKind==='project'?all.project:p.template==='宣发类'?all.news:p.template==='捐款类'?all.donation:p.template==='捐赠参会类'?all.conference:p.kind==='公益行动'?all.action:all.activity;}
 for(const phone of Object.values(screens()))if(phone)bodyRoot(phone);
 window.ClientContentDetail={render,select,bodyRoot};
})();
