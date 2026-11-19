'use strict';
// Shared client actions for published examples and workbench previews.
(() => {
 const style=document.createElement('style');
 style.textContent='.phone>.donation-shade[data-preview-donation]{z-index:130}.phone>.donation-sheet[data-preview-donation]{z-index:131}.phone>.heart-fortune-overlay[data-preview-donation]{z-index:140}.preview-registration{position:absolute;inset:0;z-index:120;background:#fff;display:flex;flex-direction:column}.preview-registration>header{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #e8ebe4;flex:none}.preview-registration-content{flex:1;overflow:auto;min-height:0}.preview-registration .signup-summary{padding:18px 16px}.preview-registration h2{font-size:17px}.preview-registration .signup-summary p{margin-top:8px;font-size:12px;color:#7e8d73}.preview-registration select{flex:1;min-width:0;padding:10px 6px;border:1px solid #e8ebe4;border-radius:4px;background:#fff;font:inherit}.preview-registration textarea{flex:1;min-width:0;min-height:72px;margin:12px 0;padding:8px;border:1px solid #e8ebe4;border-radius:4px;font:inherit;resize:vertical}.preview-registration .signup-actions{padding-top:16px}';
 document.head.append(style);
 let current=null,closeDonation=()=>{},closeRegistration=()=>{};
 function renderGroup(root,p,status){
  if(!root)return;let group=root.querySelector('.group-join');
  const allowed=['报名类','捐赠参会类'].includes(p.template)&&['已通过','已录取','资格有效','passed'].includes(status)&&!!p.groupQr;
  if(!group&&allowed){group=document.createElement('section');group.className='group-join panel';(root.querySelector('.preview-registration-content,.content')||root).append(group);}
  if(!group)return;group.hidden=!allowed;group.replaceChildren();if(!allowed)return;
  const heading=document.createElement('h3'),image=document.createElement('img'),note=document.createElement('p');heading.textContent='扫码加入微信群';image.src=p.groupQr;image.alt='组织者微信群二维码';image.width=image.height=160;note.textContent='长按保存二维码，在微信中识别加群。';group.append(heading,image,note);
 }
 function prepareRegistration(form,p){
  for(const [name,value] of Object.entries({groupQr:p.groupQr||'',registrationTemplate:p.template})){let input=form.elements.namedItem(name);if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.append(input);}input.value=value;}
 }
 function conferenceAmounts(form,phone,p){
  const donation=form.querySelector('.conference-donation');if(!donation)return;
  donation.querySelector('[data-conference-amounts]')?.remove();
  donation.querySelectorAll('b')[0].textContent=p.organization?.name||'基金会';
  const controls=document.createElement('div');controls.dataset.conferenceAmounts='';
  const source=document.querySelector('.donation-sheet:not([data-preview-donation])');
  for(const selector of ['.donation-custom','.donation-presets','.donation-random-hint','.donation-error'])controls.append(source.querySelector(selector).cloneNode(true));
  controls.querySelectorAll('input').forEach(input=>{input.removeAttribute('name');input.setAttribute('aria-label','自定义捐赠金额');});
  donation.append(controls);const value=donation.querySelectorAll('b')[1];value.dataset.conferenceSelectedAmount='';
  const picker=amountPicker(controls,phone,p,{onChange(amount,valid){value.textContent=valid?'¥'+amount.toFixed(2):'待选择金额';}});
  form.conferenceAmountPicker=picker;
  form.addEventListener('reset',()=>{picker.closeFortune();queueMicrotask(()=>conferenceAmounts(form,phone,p));},{once:true});
  return picker;
 }
 function openRegistration(trigger){
  if(!current||!['报名类','捐赠参会类'].includes(current.p.template))return;
  closeDonation();closeRegistration();
  const {phone,p}=current,preview=current.preview,conference=p.template==='捐赠参会类',enterprise=(p.registrationTarget||(p.kind==='项目活动'?'enterprise':'personal'))==='enterprise';
  const source=document.getElementById(conference?'conference-signup':enterprise?'enterprise-signup':'volunteer-signup');if(!source)return;
  const page=document.createElement('section');page.dataset.previewRegistration='';page.className='preview-registration';page.setAttribute('role','dialog');page.setAttribute('aria-modal','true');page.setAttribute('aria-label',preview?'报名预览':'报名信息');
  page.innerHTML='<header><button type="button" class="sheet-close" aria-label="返回详情">‹</button><b>报名信息</b></header><div class="preview-registration-content"><section class="signup-summary"><h2></h2><p></p></section></div>';
  page.querySelector('h2').textContent=p.name||'待填写标题';page.querySelector('.signup-summary p').textContent=(p.start||'待填写时间').replace('T',' ')+' · '+(p.template==='捐赠参会类'&&p.format==='线上'?'线上参会':p.location||'待填写地点');
  const form=source.cloneNode(true);form.removeAttribute('id');form.replaceChildren(source.querySelector('.signup-form-heading').cloneNode(true));
  const fields=enterprise?[['company','企业名称'],['name','本人姓名'],['phone','手机号'],['position','职务']]:[['name','姓名'],['phone','手机号']];
  for(const name of ['experience','skills'])if(p[name]===true||p[name]==='on')fields.push([name,name==='experience'?'公益经历':'专项技能']);
  for(const [name,title] of fields){
   const label=document.createElement('label');label.className='signup-field';const text=document.createElement('span');text.textContent=title;const star=document.createElement('em');star.textContent='*';text.append(star);
   const dropdown=name==='skills'&&p.skillsInput==='select';
   const input=document.createElement(dropdown?'select':['experience','skills'].includes(name)?'textarea':'input');input.name=name;input.required=true;input.placeholder='请填写'+title;
   if(dropdown){const options=[...new Set(String(p.skillsOptions||'').split(/\r?\n/).map(value=>value.trim()).filter(Boolean))];input.add(new Option('请选择专项技能',''));options.forEach(value=>input.add(new Option(value,value)));if(!options.length)input.firstElementChild.textContent='请先在编辑页配置技能选项';}
   if(input.tagName==='INPUT'){input.type=name==='phone'?'tel':'text';if(name==='phone'){input.pattern='1[0-9]{10}';input.maxLength=11;input.title='请填写11位手机号';}}
   label.append(text,input);form.append(label);
  }
  if(conference){
   if(p.format==='线上'){
    const meeting=source.querySelector('.conference-meeting-phone')?.cloneNode(true),hint=source.querySelector('.conference-phone-hint')?.cloneNode(true);
    if(meeting){const number=meeting.querySelector('[name="meeting-phone"]');number.value='';let edited=false;number.addEventListener('input',()=>edited=true);form.elements.phone.addEventListener('input',()=>{if(!edited)number.value=form.elements.phone.value;});form.append(meeting);if(hint)form.append(hint);}
   }
   form.append(source.querySelector('.conference-donation').cloneNode(true));
   conferenceAmounts(form,phone,p);
  }
  const agreement=source.querySelector('.signup-agreement')?.cloneNode(true);if(agreement){agreement.querySelector('input').checked=false;form.append(agreement);}
  const result=document.createElement('p');result.className='signup-hint';result.setAttribute('role','status');result.textContent=conference?'填写本人资料并完成捐赠后获得报名资格。取消报名后，已捐赠款项不会退回。':preview?'当前为预览体验，提交后可查看报名结果。':'每人以本人账号单独报名，提交后等待审核。';form.append(result);
  const actions=document.createElement('div');actions.className='signup-actions';actions.innerHTML='<button type="button">返回详情</button><button type="submit"></button>';actions.lastElementChild.textContent=conference?'填写资料并捐赠':preview?'提交报名预览':'确认报名';form.append(actions);page.querySelector('.preview-registration-content').append(form);
  const background=[...phone.children],inert=background.map(node=>node.inert);
  const onKey=event=>{
   if(phone.querySelector('.donation-sheet[data-preview-donation]'))return;
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(form.conferenceAmountPicker?.fortune)form.conferenceAmountPicker.closeFortune();else closeRegistration();}
   if(event.key==='Tab'){const root=form.conferenceAmountPicker?.fortune||page,items=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')].filter(node=>!node.closest('[hidden]'));if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}}
  };
  closeRegistration=()=>{form.conferenceAmountPicker?.closeFortune();page.remove();background.forEach((node,index)=>node.inert=inert[index]);document.removeEventListener('keydown',onKey,true);closeRegistration=()=>{};if(trigger.isConnected)trigger.focus();};
  page.querySelector('header button').addEventListener('click',()=>closeRegistration());actions.firstElementChild.addEventListener('click',()=>closeRegistration());
  form.addEventListener('submit',event=>{
   event.preventDefault();event.stopImmediatePropagation();if(!form.reportValidity())return;
   const complete=amount=>{
    if(conference&&Number.isFinite(amount))form.conferenceAmountPicker.setAmount(amount);
    if(preview){renderGroup(page,p,conference?'资格有效':'待审核');result.textContent=conference?'预览完成：捐赠成功后获得本人报名资格，未发起实际支付或报名。':'预览完成：报名资料已填写完整，未提交实际报名。';return;}
    const values=Object.fromEntries(new FormData(form));closeRegistration();
    const native=document.getElementById(conference?'conference-signup':enterprise?'enterprise-signup':'volunteer-signup');
    for(const [name,value] of Object.entries(values)){const input=native.elements.namedItem(name);if(input){if(input.type==='checkbox')input.checked=true;else input.value=value;}}
    native.closest('.signup-page').querySelector('h2').textContent=p.name;
    prepareRegistration(native,p);
    native.contentDonationConfirmed=conference;try{native.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}finally{native.contentDonationConfirmed=false;}
    renderGroup(document.getElementById('enrollment-success'),p,conference?'资格有效':'待审核');
    if(conference)document.querySelectorAll('#attendance .phone').forEach(root=>renderGroup(root,p,'资格有效'));
   };
   if(conference){const picker=form.conferenceAmountPicker;if(!picker.valid()){picker.update();form.querySelector('.donation-error').scrollIntoView({block:'nearest'});return;}openDonation(actions.lastElementChild,complete,{initialAmount:picker.amount});}else complete();
  });
  background.forEach(node=>node.inert=true);phone.append(page);document.addEventListener('keydown',onKey,true);page.querySelector('input')?.focus();
 }
 function amountPicker(sheet,phone,p,options={}){
  const modes=Array.isArray(p.amountModes)?p.amountModes:[p.amountMode==='fixed'?'preset':p.amountMode||'custom'];
  const presets=modes.includes('preset')?String(p.amountMode==='fixed'?p.amount:p.donationOptions||p.options||'').split(/[,，]/).map(Number).filter(n=>Number.isFinite(n)&&n>0&&Math.abs(n*100-Math.round(n*100))<1e-8):[];
  const low=Math.ceil(Number(p.drawMin)*100),high=Math.floor(Number(p.drawMax)*100),randomValid=Number.isSafeInteger(low)&&low>0&&Number.isSafeInteger(high)&&high>=low;
  const custom=sheet.querySelector('.donation-custom input'),random=sheet.querySelector('.donation-random'),presetList=sheet.querySelector('.donation-presets'),error=sheet.querySelector('.donation-error');
  const note=sheet.querySelector('.donation-random-hint');
  let amount=Number(options.initialAmount)||presets[0]||0,fortune=null,drawSequence=0;
  let surface=sheet,previousInert=false;
  custom.value=modes.includes('custom')&&amount&&!presets.includes(amount)?String(amount):'';custom.min='0.01';custom.step='0.01';custom.removeAttribute('max');
  custom.closest('label').hidden=!modes.includes('custom');custom.disabled=!modes.includes('custom');
  random.hidden=!modes.includes('random');random.disabled=!randomValid;
  sheet.querySelector('.donation-custom').hidden=!modes.some(mode=>['random','custom'].includes(mode));
  note.hidden=true;
  const valid=()=>Number.isFinite(amount)&&amount>0&&Math.abs(amount*100-Math.round(amount*100))<1e-8;
  const update=()=>{
   const ok=valid();sheet.querySelectorAll('[data-donation-amount]').forEach(node=>node.textContent=ok?amount.toFixed(2):'—');const submit=sheet.querySelector('.donation-submit');if(submit)submit.disabled=!ok;options.onChange?.(amount,ok);
   error.hidden=ok;error.textContent=ok?'':'请选择或输入有效金额，最多保留两位小数';
   presetList.querySelectorAll('button').forEach(button=>{const selected=Number(button.dataset.donationPreset)===amount&&!custom.value;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  };
  presetList.replaceChildren(...presets.map(value=>{const button=document.createElement('button');button.type='button';button.dataset.donationPreset=value;button.textContent=value+'元';button.addEventListener('click',()=>{amount=value;custom.value='';note.hidden=true;update();});return button;}));presetList.hidden=!presets.length;
  custom.addEventListener('input',()=>{amount=Number(custom.value);note.hidden=true;update();});
  const closeFortune=()=>{drawSequence++;if(!fortune)return;window.stopFortuneLayers?.(fortune.querySelector('.fortune-animation'));fortune.remove();fortune=null;surface.inert=previousInert;random.focus();};
  const draw=()=>{
   const sequence=++drawSequence,overlay=fortune,animation=overlay.querySelector('.fortune-animation'),result=overlay.querySelector('.heart-fortune'),drawButton=overlay.querySelector('.fortune-draw');
   const drawn=(low+Math.floor(Math.random()*(high-low+1)))/100;
   window.stopFortuneLayers?.(animation);animation.hidden=false;result.hidden=true;drawButton.disabled=true;overlay.querySelector('.fortune-use').hidden=true;
   overlay.classList.remove('fortune-result-live','fortune-thumbs-result');overlay.classList.add('fortune-drawing');
   overlay.querySelector('[data-fortune-amount]').textContent=drawn.toFixed(2);overlay.querySelector('[data-layer-amount]').textContent=drawn.toFixed(2);overlay.dataset.amount=drawn;
   const finish=()=>{if(sequence!==drawSequence||fortune!==overlay)return;const retained=window.settleFortuneLayers?.(animation);overlay.classList.toggle('fortune-result-live',!!retained);animation.hidden=!retained;result.hidden=false;drawButton.disabled=false;overlay.querySelector('.fortune-use').hidden=false;overlay.classList.remove('fortune-drawing');overlay.classList.add('fortune-thumbs-result');overlay.querySelector('.fortune-use').focus();};
   try{if(matchMedia('(prefers-reduced-motion: reduce)').matches||!window.playFortuneLayers)finish();else window.playFortuneLayers(animation,random).finished.then(finish,finish);}catch{finish();}
  };
  random.addEventListener('click',()=>{
   if(!randomValid)return;
   const source=document.querySelector('.heart-fortune-overlay:not([data-preview-donation])');if(!source)return;
   fortune=source.cloneNode(true);fortune.dataset.previewDonation='';fortune.hidden=false;surface=sheet.closest('[data-preview-registration],.signup-page')||sheet;previousInert=surface.inert;surface.inert=true;
   fortune.querySelectorAll('[data-close-fortune]').forEach(button=>button.addEventListener('click',closeFortune));
   const manual=fortune.querySelector('.fortune-manual');manual.hidden=!modes.includes('custom');manual.addEventListener('click',()=>{closeFortune();custom.focus();});
   fortune.querySelector('.fortune-draw').addEventListener('click',draw);
   fortune.querySelector('.fortune-use').addEventListener('click',()=>{amount=Number(fortune.dataset.amount);custom.value=modes.includes('custom')?amount.toFixed(2):'';update();note.textContent='这次的心意是 ¥'+amount.toFixed(2);note.hidden=false;closeFortune();});
   fortune.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeFortune();}
    if(event.key==='Tab'){const items=[...fortune.querySelectorAll('button:not(:disabled)')].filter(node=>!node.closest('[hidden]'));if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}}
   });
   phone.append(fortune);draw();
  });
  update();
  return {get amount(){return amount;},setAmount(value){amount=Number(value);custom.value=modes.includes('custom')&&!presets.includes(amount)?String(amount):'';update();},valid,update,closeFortune,get fortune(){return fortune;}};
 }
 function openDonation(trigger,onSuccess,options={}){
  if(!current)return;
  if(!onSuccess)closeRegistration();closeDonation();
  const {phone,p}=current,preview=current.preview,template=document.querySelector('.donation-sheet:not([data-preview-donation])');
  if(!template)return;
  const sheet=template.cloneNode(true),shade=document.createElement('div');
  sheet.dataset.previewDonation='';sheet.dataset.donationMode='preview';sheet.hidden=false;
  sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label',preview?'心意捐赠预览':'捐赠支持');
  shade.className='shade donation-shade';shade.dataset.previewDonation='';
  sheet.querySelector('[data-donation-title]').textContent=p.name||'待填写标题';
  sheet.querySelector('.donation-summary small').textContent='接收机构：'+(p.organization?.name||'基金会');
  const picture=(p.carouselMedia||p.images||[]).find(file=>!file.type?.startsWith('video/')&&file.src);
  if(picture){const image=document.createElement('img');image.src=picture.src;image.alt=p.name||'捐赠封面';image.style.cssText='width:100%;height:100%;object-fit:cover';sheet.querySelector('.donation-thumb').replaceChildren(image);}
  const submit=sheet.querySelector('.donation-submit'),error=sheet.querySelector('.donation-error'),agreement=sheet.querySelector('.donation-agreement input');
  agreement.checked=false;sheet.querySelector('.donation-anonymous input').checked=false;
  sheet.querySelector('.donation-notice').textContent=preview?'当前为预览体验，不会发起实际支付。':'原型体验：确认后模拟捐赠成功。';
  const picker=amountPicker(sheet,phone,p,options),valid=picker.valid,closeFortune=picker.closeFortune;
  const background=[...phone.children],inert=background.map(node=>node.inert);
  const onKey=event=>{
   if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(picker.fortune)closeFortune();else closeDonation();}
   if(event.key==='Tab'){
    const root=picker.fortune||sheet,items=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')].filter(node=>!node.closest('[hidden]'));
    if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}else if(!event.shiftKey&&document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
   }
  };
  closeDonation=()=>{closeFortune();sheet.remove();shade.remove();background.forEach((node,index)=>node.inert=inert[index]);document.removeEventListener('keydown',onKey,true);closeDonation=()=>{};if(trigger.isConnected)trigger.focus();};
  sheet.querySelector('.donation-close').addEventListener('click',()=>closeDonation());shade.addEventListener('click',()=>closeDonation());
  submit.addEventListener('click',()=>{
   if(!valid())return;const amount=picker.amount;error.hidden=false;
   if(!agreement.checked){error.textContent='请阅读并同意捐赠须知及适用协议';return;}
   if(preview){error.textContent='预览完成：捐赠金额 ¥'+amount.toFixed(2)+'，未发起实际支付。';if(onSuccess){closeDonation();onSuccess(amount);}return;}
   document.dispatchEvent(new CustomEvent('content:donated',{detail:{amount,project:p.parentProject?.name||p.name,activity:p.previewKind==='project'?'':p.name,conference:!!onSuccess}}));
   closeDonation();if(onSuccess)onSuccess(amount);else location.hash='personal-donation';
  });
  background.forEach(node=>node.inert=true);phone.append(shade,sheet);document.addEventListener('keydown',onKey,true);picker.update();sheet.querySelector('.donation-close').focus();
 }
 renderGroup(document.getElementById('enrollment-success'),{},'待审核');
 window.ClientContentActions={
  renderGroup,conferenceAmounts,
  set(phone,p,options={}){closeDonation();closeRegistration();document.getElementById('conference-signup')?.conferenceAmountPicker?.closeFortune();current={phone,p,preview:!!options.preview};},
  close(){closeDonation();closeRegistration();document.getElementById('conference-signup')?.conferenceAmountPicker?.closeFortune();}
 };
 // Keep the original standalone conference form behind the same donation gate.
 document.addEventListener('submit',event=>{
  const form=event.target;if(form.id!=='conference-signup'||form.contentDonationConfirmed)return;
  event.preventDefault();event.stopImmediatePropagation();if(!form.reportValidity())return;
  const p=document.getElementById('screen-conference-0')?.contentExample;if(!p)return;
  current={phone:form.closest('.phone'),p,preview:false};
  const picker=form.conferenceAmountPicker;if(picker&&!picker.valid()){picker.update();return;}
  openDonation(document.querySelector('button[type=submit][form=conference-signup]')||form,()=>{prepareRegistration(form,p);form.contentDonationConfirmed=true;try{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}finally{form.contentDonationConfirmed=false;}},{initialAmount:picker?.amount});
 },true);
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-preview-donation],[data-preview-registration]'))return;
  const examplePhone=event.target.closest('.phone');if(!document.body.classList.contains('experience')&&examplePhone?.contentExample&&examplePhone!==current?.phone){current={phone:examplePhone,p:examplePhone.contentExample,preview:false};}
  if(!current?.phone.contains(event.target))return;
  const registration=event.target.closest('.activity-apply,a[href="#registration"],a[href="#enterprise-signup-page"],a[href="#conference"]');
  if(registration){event.preventDefault();event.stopImmediatePropagation();openRegistration(registration);return;}
  const donation=event.target.closest('.project-donation-bar>.button,[data-open-activity-donation],a[href="#donate"],a[href="#action-donate"],a[href="#community-donate"]');
  if(donation){event.preventDefault();event.stopImmediatePropagation();openDonation(donation);return;}
  if(current.preview&&event.target.closest('a,button,[data-action]')&&!event.target.closest('.project-tabs,.project-cover-dots')){event.preventDefault();event.stopImmediatePropagation();}
 },true);
})();
