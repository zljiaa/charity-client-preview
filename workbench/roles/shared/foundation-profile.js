/* Foundation onboarding and organization profiles share the same classification fields. */
(function(){
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const levels=['民政部登记的基金会','省级民政机关登记的基金会','其他依法由地方民政机关登记的基金会'];
const fields=['教育类','医疗健康类','儿童与青少年类','养老助老类','助残类','环保与生态保护类','乡村发展类','社会救助与灾害援助类','文化与科学发展类','综合类'];
const ratings=['5A','4A','3A','2A','1A','暂无有效评估等级'];
const qualifications=['具有公开募捐资格','不具有公开募捐资格'];
const labels={registrationLevel:'登记管理层级',registrationAuthority:'登记管理机关',evaluationRating:'社会组织评估等级',evaluationDate:'评估时间',evaluationValidUntil:'评估有效期至',evaluationAuthority:'评估机关',evaluationEvidence:'评估公告链接或证明',publicQualification:'公开募捐资格',publicQualificationNumber:'公开募捐资格证书编号',publicQualificationAuthority:'公开募捐资格发证机关',publicQualificationDate:'公开募捐资格证载日期',foundationFields:'主要公益领域',foundationCertificate:'基金会登记证书',publicQualificationProof:'公开募捐资格证书'};
const fileKeys=['foundationCertificate','publicQualificationProof'];
const keys=Object.keys(labels);
const groups={registration:['registrationLevel','registrationAuthority','foundationCertificate'],evaluation:['evaluationRating','evaluationAuthority','evaluationDate','evaluationValidUntil','evaluationEvidence'],qualification:['publicQualification','publicQualificationNumber','publicQualificationAuthority','publicQualificationDate','publicQualificationProof']};
const section=(title,body)=>'<fieldset class="foundation-classification"><legend>'+title+'</legend><div class="foundation-profile-grid">'+body+'</div></fieldset>';
const input=(key,p,type='text',required=true)=>'<label>'+labels[key]+'<input name="'+key+'" type="'+type+'" value="'+esc(p[key])+'"'+(required?' required':'')+(key==='registrationAuthority'&&p.registrationLevel===levels[0]?' readonly':'')+'></label>';
const select=(key,options,p)=>'<label>'+labels[key]+'<select name="'+key+'" required><option value="">请选择</option>'+options.map(v=>'<option'+(p[key]===v?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>';
const file=(key,p)=>'<label>'+labels[key]+'<input name="'+key+'" type="file" accept="image/png,image/jpeg,application/pdf" data-foundation-upload="'+key+'"><span class="foundation-file-status" data-foundation-file="'+key+'">'+esc(p[key]?.name||'支持 JPG、PNG、PDF，最大 5 MB')+'</span></label>';
function renderFields(p={}){return '<div class="foundation-fields-editor">'+section('主要公益领域（可多选）','<div class="foundation-field-options">'+fields.map((v,i)=>'<label class="foundation-field-option"><input type="checkbox" name="foundationField-'+i+'" value="'+esc(v)+'"'+((p.foundationFields||[]).includes(v)?' checked':'')+'><span>'+esc(v)+'</span></label>').join('')+'</div>')+'</div>';}
function render(p={},options={}){if(p.registrationLevel===levels[0])p={...p,registrationAuthority:'民政部'};return '<div class="foundation-profile full wide">'+
 (options.includeRegistration===false?'':section('登记管理信息',select('registrationLevel',levels,p)+input('registrationAuthority',p)+file('foundationCertificate',p)+'<p class="foundation-hint">按登记证书及公开信息填写登记机关；登记层级表示登记管理关系。</p>'))+
 (options.includeEvaluation===false?'':section('社会组织评估',select('evaluationRating',ratings,p)+'<div class="foundation-conditional" data-foundation-condition="evaluation">'+input('evaluationAuthority',p)+input('evaluationDate',p,'date')+input('evaluationValidUntil',p,'date')+input('evaluationEvidence',p)+'</div><p class="foundation-hint">评估机关默认沿用登记管理机关，可修改。填写当前有效的评估结果；尚未参评或等级已过期，可选择“暂无有效评估等级”。评估等级作为合作参考，具体能力以项目及合作记录确认。</p>'))+
 (options.includeQualification===false?'':section('公开募捐资格',select('publicQualification',qualifications,p)+'<div class="foundation-conditional" data-foundation-condition="qualification">'+input('publicQualificationNumber',p)+input('publicQualificationAuthority',p)+input('publicQualificationDate',p,'date')+file('publicQualificationProof',p)+'</div>'))+
 (options.includeFields===false?'':renderFields(p))+'</div>';}
function bind(form,base={}){
 const root=form,files=Object.fromEntries(fileKeys.map(k=>[k,base[k]||null]));
 let reading=0;const failures={};
 const authority=form.elements.registrationAuthority,evaluationAuthority=form.elements.evaluationAuthority;
 let evaluationEdited=!!base.evaluationAuthority?.trim();
 let previousLevel=form.elements.registrationLevel.value;
 let localAuthority=previousLevel===levels[0]?'':authority.value;
 const sync=()=>{
  const ministry=form.elements.registrationLevel.value===levels[0];
  if(ministry){if(previousLevel!==levels[0])localAuthority=authority.value;authority.value='民政部';}
  else if(previousLevel===levels[0])authority.value=localAuthority;
  authority.readOnly=ministry;previousLevel=form.elements.registrationLevel.value;
  if(!evaluationEdited&&ratings.slice(0,5).includes(form.elements.evaluationRating.value))evaluationAuthority.value=authority.value;
  for(const [condition,active] of [['evaluation',ratings.slice(0,5).includes(form.elements.evaluationRating.value)],['qualification',form.elements.publicQualification.value===qualifications[0]]]){
   const group=root.querySelector('[data-foundation-condition="'+condition+'"]');group.hidden=!active;
   group.querySelectorAll('input').forEach(el=>{el.disabled=!active;el.required=active&&el.type!=='file';});
  }
 };
 root.addEventListener('input',event=>{if(event.target===evaluationAuthority)evaluationEdited=true;else if(event.target===authority)sync();});
 root.addEventListener('change',event=>{if(event.target===evaluationAuthority)evaluationEdited=true;sync();});sync();
 root.querySelectorAll('[data-foundation-upload]').forEach(el=>el.addEventListener('change',()=>{
  const key=el.dataset.foundationUpload,selected=el.files[0],status=root.querySelector('[data-foundation-file="'+key+'"]');
  if(!selected)return;
  if(!['image/png','image/jpeg','application/pdf'].includes(selected.type)||selected.size>5*1024*1024){failures[key]=labels[key]+'请选择 5 MB 以内的 JPG、PNG 或 PDF 文件。';status.textContent=failures[key];el.value='';return;}
  delete failures[key];reading++;status.textContent='读取中…';const reader=new FileReader();
  reader.onload=()=>{files[key]={name:selected.name,type:selected.type,size:selected.size,data:reader.result};status.textContent=selected.name;};
  reader.onerror=()=>{failures[key]=labels[key]+'读取失败，请重试。';status.textContent=failures[key];};
  reader.onloadend=()=>{reading--;};reader.readAsDataURL(selected);
 }));
 return {snapshot(){const data=new FormData(form),p={};
  for(const key of keys.filter(k=>!fileKeys.includes(k)&&k!=='foundationFields'))p[key]=String(data.get(key)||'').trim();
  if(p.registrationLevel===levels[0])p.registrationAuthority='民政部';
  p.foundationFields=fields.filter((v,i)=>data.has('foundationField-'+i));
  p.foundationCertificate=files.foundationCertificate;
  p.publicQualificationProof=p.publicQualification===qualifications[0]?files.publicQualificationProof:null;return p;
 },issue(){return reading?'基金会证明材料正在读取，请稍候。':Object.entries(failures).find(([key])=>key==='foundationCertificate'||form.elements.publicQualification.value===qualifications[0])?.[1]||'';}};
}
function registrationError(p={}){
 if(!levels.includes(p.registrationLevel))return '请选择登记管理层级。';
 for(const key of ['registrationAuthority'])if(!p[key]?.trim())return '请填写'+labels[key]+'。';
 if(p.registrationLevel===levels[0]&&p.registrationAuthority!=='民政部')return '民政部登记的基金会，其登记管理机关应为民政部。';
 if(!p.foundationCertificate?.data)return '请上传基金会登记证书。';
 return '';
}
function evaluationError(p={},today=new Date().toLocaleDateString('sv-SE')){
 if(!ratings.includes(p.evaluationRating))return '请选择社会组织评估等级。';
 if(p.evaluationRating!==ratings[5]){
  for(const key of ['evaluationAuthority','evaluationDate','evaluationValidUntil','evaluationEvidence'])if(!p[key]?.trim())return '请填写'+labels[key]+'。';
  if(p.evaluationDate>today)return '评估时间不能晚于今天。';
  if(p.evaluationValidUntil<p.evaluationDate)return '评估有效期至不能早于评估时间。';
  if(p.evaluationValidUntil<today)return '评估等级已过有效期，请更新评估信息或选择“暂无有效评估等级”。';
 }
 return '';
}
function qualificationError(p={},today=new Date().toLocaleDateString('sv-SE')){
 if(!qualifications.includes(p.publicQualification))return '请选择公开募捐资格。';
 if(p.publicQualification===qualifications[0]){
  for(const key of ['publicQualificationNumber','publicQualificationAuthority','publicQualificationDate'])if(!p[key]?.trim())return '请填写'+labels[key]+'。';
  if(p.publicQualificationDate>today)return '公开募捐资格证载日期不能晚于今天。';
  if(!p.publicQualificationProof?.data)return '请上传公开募捐资格证书。';
 }
 return '';
}
function error(p,today=new Date().toLocaleDateString('sv-SE')){return registrationError(p)||evaluationError(p,today)||qualificationError(p,today)||fieldsError(p);}

function fieldsError(p={}){return !p.foundationFields?.length||p.foundationFields.some(v=>!fields.includes(v))?'请至少选择一项主要公益领域。':'';}
function rows(p={},options={}){
 const expired=p.evaluationRating&&p.evaluationRating!==ratings[5]&&p.evaluationValidUntil&&p.evaluationValidUntil<new Date().toLocaleDateString('sv-SE');
 const value=key=>[labels[key],p[key]||'—'];
 return [
  [labels.registrationLevel,p.registrationLevel||'待完善'],
  [labels.registrationAuthority,p.registrationLevel===levels[0]?'民政部':p.registrationAuthority||'待完善'],
  [labels.foundationCertificate,p.foundationCertificate?.name||'未上传'],
  [labels.evaluationRating,expired?'暂无有效评估等级（原等级已过期）':p.evaluationRating||'待完善'],
  ...(p.evaluationRating&&p.evaluationRating!==ratings[5]?['evaluationAuthority','evaluationDate','evaluationValidUntil','evaluationEvidence'].map(value):[]),
  [labels.publicQualification,p.publicQualification||'待完善'],
  ...(p.publicQualification===qualifications[0]?[...['publicQualificationNumber','publicQualificationAuthority','publicQualificationDate'].map(value),[labels.publicQualificationProof,p.publicQualificationProof?.name||'未上传']]:[]),
  ...(options.includeFields===false?[]:[[labels.foundationFields,(p.foundationFields||[]).join('、')||'待完善']])
 ].filter(([label])=>Object.entries(groups).every(([group,groupKeys])=>options['include'+group[0].toUpperCase()+group.slice(1)]!==false||!groupKeys.some(key=>labels[key]===label)));
}
function normalize(p={}){return {...p,...Object.fromEntries(keys.map(k=>[k,p[k]??(fileKeys.includes(k)?null:k==='foundationFields'?[]:'')]))};}
window.FoundationProfile={render,renderFields,bind,error,registrationError,evaluationError,qualificationError,fieldsError,rows,normalize,keys,groups,labels,levels,fields,ratings,qualifications};
})();
