'use strict';
(() => {
const R=window.WorkbenchRules, CS=window.WorkbenchCustomerService;
const D=window.WorkbenchData, role=document.body.dataset.role, isMerchant=role==='merchant';
for(const item of D.activities)if(item.status==='已下线')item.status='已停止报名';
const activityOngoing=item=>Boolean(item&&['已发布','已停止报名'].includes(item.status));
const canCancelActivity=item=>activityOngoing(item)&&item.template!=='捐赠参会类';
const isOrderPage=document.body.dataset.page==='order',orderParams=new URLSearchParams(location.search),orderWindows=new Map();
const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>'¥'+Number(v||0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2});
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
const paths={copy:'M9 8h11v13H9zM15 8V3H4v13h5',leaf:'M20 4C10 2 3 6 4 14c1 6 9 7 12 2 2-3 3-7 4-12ZM6 18 16 8M9 15v-5m3 2h5',shop:'M3 10h18M5 10v11h14V10M2 10l3-7h14l3 7M9 21v-7h6v7',box:'m12 3 9 5-9 5-9-5 9-5Zm-9 5v10l9 5 9-5V8M12 13v10',file:'M14 2H5v20h14V7l-5-5v5h5M8 12h8m-8 4h8',org:'M4 21V7l8-4 8 4v14M2 21h20M8 9h1m6 0h1m-8 4h1m6 0h1m-5 8v-4h2v4',people:'M16 21v-3c0-5-12-5-12 0v3M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M18 5a4 4 0 0 1 0 7m2 3 1 6',coin:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M8 8l4 4 4-4M8 12h8m-8 3h8m-4-3v6',check:'M9 3H5v18h14V3h-4M9 2h6v4H9zM8 13l3 3 5-6',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18m0 4v6l4 2',close:'m6 6 12 12M6 18 18 6',menu:'M4 6h16M4 12h16M4 18h16',plus:'M12 4v16M4 12h16',arrow:'m14 6-6 6 6 6M8 12h12',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m5 12 6 6',expand:'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',shield:'m12 2 8 4v6c0 6-8 10-8 10S4 18 4 12V6l8-4Zm-4 10 3 3 5-6'};
paths.chart='M4 3v18h18M8 16v-5m5 5V6m5 10V9';
paths.edit='M4 20h4L20 8l-4-4L4 16v4Zm10-14 4 4M3 22h18';
paths.trash='M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7';
const icon=k=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(paths[k]||paths.file)+'"/></svg>';
const btn=(text,action,id='',cls='btn')=>(isMerchant&&C&&(!C.canAction(action,id)||action==='ship'&&!canShipOrder(id))?'':'<button type="button" class="'+cls+'"'+({close:' aria-label="关闭"',widen:' aria-label="切换宽面板"',mobile:' aria-label="展开导航"','secondary-close':' aria-label="关闭预览并返回"'}[action]||'')+' data-action="'+action+'" data-id="'+esc(id)+'">'+text+'</button>');
const link=(text,a,id)=>btn(esc(text),a,id,'link');
const badge=s=>'<span class="status '+(/待|暂停|处理中|退款中|运输中/.test(s)?'pending':/异常|失败|驳回|拒绝/.test(s)?'red':/草稿|售罄|下线|下架|停止报名|撤回|撤销|取消|终止|已关闭|未/.test(s)?'gray':'')+'">'+esc(s)+'</span>';
const tabs=(names,active,a='tab')=>'<div class="tabs">'+names.map(x=>btn(esc(x),a,x,'tab'+(x===active?' active':''))).join('')+'</div>';
const tr=values=>'<tr>'+values.map(v=>'<td>'+v+'</td>').join('')+'</tr>';
const table=(heads,rows,showFooter=true,renderHead=h=>'<th>'+esc(h)+'</th>')=>'<div class="table-wrap" tabindex="0" aria-label="数据列表"><table><thead><tr>'+heads.map(renderHead).join('')+'</tr></thead><tbody>'+(rows.length?rows.join(''):'<tr><td colspan="'+heads.length+'"><div class="empty">'+icon('search')+'<p>暂无符合条件的记录</p><span class="tiny muted">请调整筛选条件，或切换当前组织。</span></div></td></tr>')+'</tbody></table></div>'+(showFooter?'<div class="table-footer"><span>共 '+rows.length+' 条记录</span><span>全部记录已展示</span></div>':'');
const kv=items=>'<dl class="kv">'+items.map(([k,v,html])=>'<div><dt>'+esc(k)+'</dt><dd>'+(html?v:esc(v??'—'))+'</dd></div>').join('')+'</dl>';
const input=(label,name,value='',type='text',extra='')=>'<label class="field">'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+extra+'></label>';
const field=(label,name,value='',type='text',required=true,full=false)=>'<label class="form-field'+(full?' full':'')+'"><span>'+esc(label)+(required?' <span class="required-tip">*</span>':'')+'</span>'+(type==='textarea'?'<textarea name="'+name+'" '+(required?'required':'')+'>'+esc(value)+'</textarea>':'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(required?'required':'')+(type==='number'?' step="0.01" min="0"':'')+'>')+'</label>';
const select=(label,name,options,value='',filter=false)=>'<label class="'+(filter?'field':'form-select')+'">'+esc(label)+'<select name="'+name+'">'+(filter?'<option value="">全部</option>':'')+options.map(x=>{const [v,t]=Array.isArray(x)?x:[x,x];return '<option value="'+esc(v)+'"'+(String(v)===String(value)?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select></label>';
const checkbox=(label,name,checked=false)=>'<label class="checkbox full"><input type="checkbox" name="'+name+'"'+(checked?' checked':'')+'>'+esc(label)+'</label>';
const heading=(title,desc,actions='')=>'<div class="page-head"><div><p class="eyebrow">'+(isMerchant?'MERCHANT WORKSPACE':'FOUNDATION WORKSPACE')+'</p><h1>'+esc(title)+'</h1><p class="description">'+esc(desc)+'</p></div><div class="inline-actions">'+actions+'</div></div>';
const stat=(label,value,note='',accent=false)=>'<div class="stat'+(accent?' accent':'')+'"><div class="label">'+label+'</div><span class="stat-icon">'+icon('coin')+'</span><div class="value mono">'+value+'</div><div class="note">'+esc(note)+'</div></div>';
const section=t=>'<div class="form-section">'+t+'</div>';
const org=()=>D.organizations.find(o=>o.id===S.org), product=id=>D.products.find(p=>p.id===id), project=id=>D.projects.find(p=>p.id===id), activity=id=>D.activities.find(a=>a.id===id);
const S={org:isMerchant?'M001':'F001',shop:'',member:false,page:isMerchant?'orders':'projects',tab:isMerchant?'订单清单':'项目列表',project:'',product:'',activity:'',projectTab:'基本信息',activityTab:'基本信息',filters:{},quick:'全部订单',order:'',wide:false,menu:false,expanded:'',origin:null};
let C;
let permissionActionContext=null;
S.demoAccount=orderParams.get('demoAccount')||(isMerchant?(orderParams.get('member')==='1'?'chen':'lin'):(orderParams.get('member')==='1'?'song':'zhou'));
let formHandler=null, priorFocus=null, drawerReturn=null, toastTimer,orderProductContext=null;
function currentMember(){return D.members.find(m=>m.org===S.org&&m.accountKey===S.demoAccount);}
function authorizedOrganizations(){return D.organizations.filter(o=>D.members.some(m=>m.org===o.id&&m.accountKey===S.demoAccount));}
function authorizedShops(){const m=currentMember();return D.shops.filter(s=>s.org===S.org&&(C?C.inShop(m,{shop:s.id}):m?.role==='组织管理员'||m?.shopIds?.includes('*')||m?.shopIds?.includes(s.id)));}
function canUse(page){const m=currentMember();return Boolean(m&&(m.role==='组织管理员'||(['orders','products'].includes(page)&&C?C.hasPage(page):isMerchant&&['analytics','shop'].includes(page)&&C?C.canFeature(page):m.permissions?.includes(page))));}
function hasBusinessAccess(){return ['orders','products','analytics','shop'].some(canUse);}
function syncMembership(){S.member=currentMember()?.role!=='组织管理员';}
function currentAccountName(){return currentMember()?.name||'账号未关联';}
function canManageMembers(){return !S.member&&currentMember()?.role==='组织管理员';}
const myProjects=()=>currentMember()?D.projects.filter(p=>p.org===S.org):[];
const myProducts=()=>hasBusinessAccess()?D.products.filter(p=>p.shop===currentShop()?.id&&(!C||C.canReadProduct(p)||C.canReadOrder({product:p.id,shop:p.shop,org:S.org}))):[];
const availableShop=()=>authorizedShops()[0];
const currentShop=()=>authorizedShops().find(s=>s.id===S.shop)||availableShop();
function shopContext(){return '<div class="subtitle-row scope-caption">'+icon('shop')+'<span>'+esc(currentShop()?.name||'暂无自营店铺')+'</span></div>';}
function contextShops(organization){const member=D.members.find(m=>m.org===organization.id&&m.accountKey===S.demoAccount);return D.shops.filter(shop=>shop.org===organization.id&&(C?C.inShop(member,{shop:shop.id}):member?.role==='组织管理员'||member?.shopIds?.includes('*')||member?.shopIds?.includes(shop.id)));}
function workspaceContext(){
 const organizations=authorizedOrganizations(),organization=org(),shops=isMerchant?authorizedShops():[],shop=currentShop();
 const chevron='<svg class="context-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';
 const summary=(label,name,kind)=>'<summary><span class="context-picker-caption"><span>当前'+label+'</span><span class="context-switch-label">切换'+label+chevron+'</span></span><span class="context-current-name">'+icon(kind)+'<span>'+esc(name)+'</span></span></summary>';
 const organizationChoices=organizations.map(o=>{
  const selected=o.id===S.org,member=D.members.find(m=>m.org===o.id&&m.accountKey===S.demoAccount);
  return '<li>'+btn(icon('org')+'<span class="context-name">'+esc(o.name)+'<small>'+esc(member.role)+'</small></span>'+(selected?'<span class="context-current">当前</span>':''),'context-org',o.id,'context-node context-org'+(selected?' selected':''))+'</li>';
 }).join('');
 const organizationPicker='<details class="context-picker" data-context-picker="organization">'+summary('组织',organization.name,'org')+'<div class="context-picker-panel"><div class="context-picker-heading">可访问的组织<small>'+organizations.length+' 个</small></div><ul class="context-picker-options">'+organizationChoices+'</ul>'+'<div class="context-picker-footer">'+btn(icon('plus')+'<span>添加组织</span>','context-add-organization','','context-node context-add')+'</div>'+'</div></details>';
 const shopChoices=shops.map(item=>'<li>'+btn(icon('shop')+'<span class="context-name">'+esc(item.name)+'</span>'+(item.id===shop?.id?'<span class="context-current">当前</span>':''),'context-shop',S.org+'|'+item.id,'context-node context-shop'+(item.id===shop?.id?' selected':''))+'</li>').join('');
 const shopPicker=isMerchant?'<details class="context-picker context-shop-picker" data-context-picker="shop">'+summary('店铺',shop?.name||'暂无店铺','shop')+'<div class="context-picker-panel"><div class="context-picker-heading">当前组织的店铺<small>'+shops.length+' 家</small></div><ul class="context-picker-options">'+(shopChoices||'<li class="context-empty">当前组织暂无可访问的店铺</li>')+'</ul>'+(canManageMembers()&&organization.status==='已入驻'?'<div class="context-picker-footer">'+btn(icon('plus')+'<span>添加店铺</span>','context-add-shop',S.org,'context-node context-add')+'</div>':'')+'</div></details>':'';
 return '<section class="workspace-context" aria-label="'+(isMerchant?'组织与店铺':'组织')+'">'+organizationPicker+shopPicker+'</section>';
}
function closeContextPickers(returnFocus=false){
 for(const picker of document.querySelectorAll('.context-picker[open]')){picker.open=false;if(returnFocus)picker.querySelector('summary').focus();}
}
function switchWorkspace(orgId,shopId){
 const target=authorizedOrganizations().find(o=>o.id===orgId);if(!target)return;
 closeContextPickers();
 if(shopId&&!contextShops(target).some(shop=>shop.id===shopId))return;
 if(target.role!==role||isOrderPage){const url=new URL(target.role==='merchant'?'../02-merchant/index.html':'../03-foundation/index.html',location.href);url.search=new URLSearchParams({org:target.id,demoAccount:S.demoAccount,...(shopId?{shop:shopId}:{})});location.href=url.href;return;}
 if(S.org===orgId&&(!shopId||currentShop()?.id===shopId))return;
 const changed=S.org!==orgId;S.org=orgId;S.shop=shopId||(changed?'':S.shop);S.taskShop='';S.accountId='';syncMembership();S.filters={};S.project='';S.product='';S.activity='';S.origin=null;S.quick='全部订单';closeOverlay();
 if(changed||!navItems().some(n=>n[0]===S.page))navigate(navItems()[0]?.[0]||'organization');else render();
}
const merchantOpen=()=>Boolean(hasBusinessAccess()&&currentShop()?.status==='已开通');
function allowedOrder(o){return isMerchant?canUse('orders')&&o.org===S.org&&o.shop===currentShop()?.id&&(!C||C.canReadOrder(o)):Boolean(currentMember()&&o.project&&project(o.project)?.org===S.org);}
function myOrders(){return D.orders.filter(o=>allowedOrder(o)&&(!isMerchant||o.shop===currentShop()?.id));}
function scopedProject(id){const p=project(id);return p?.org===S.org?p:null;}
function scopedProduct(id){const p=product(id);return p&&(isMerchant?hasBusinessAccess()&&p.shop===currentShop()?.id&&(!C||C.canReadProduct(p)):myProjects().some(j=>j.id===p.project)||myOrders().some(o=>o.product===p.id))?p:null;}
function filterKey(){if(!isMerchant&&['activities','actions'].includes(S.page))return S.page;return [S.page,S.project,S.projectTab,S.product,S.activity,S.tab].join('|');}
function f(){return S.filters[filterKey()]||{};}
function matching(row,query){return !query||JSON.stringify(row).toLowerCase().includes(query.toLowerCase());}
function filterBar(extra='',placeholder='搜索名称 / 编号',groupActions=false,searchLabel='关键词'){const actions=btn(icon('search')+'查询','apply-filter','','btn primary')+btn('重置','reset-filter');return '<form class="filters" id="filter-form">'+input(searchLabel,'q',f().q||'','search','placeholder="'+esc(placeholder)+'"')+extra+(groupActions?'<div class="query-actions">'+actions+'</div>':actions)+'</form>';}
function amountRows(rows){return {paid:round(rows.reduce((a,o)=>a+o.paid,0)),refund:round(rows.reduce((a,o)=>a+o.refund,0)),qty:rows.reduce((a,o)=>a+o.qty,0),refundQty:rows.reduce((a,o)=>a+o.refundedQty,0),due:round(rows.reduce((a,o)=>a+(isMerchant?o.paid-o.refund:R.fundDue(o)),0)),settled:round(rows.reduce((a,o)=>a+(isMerchant?o.settled:o.fundSettled),0)),contribution:round(rows.reduce((a,o)=>a+o.fundSettled,0))};}
function metrics(rows,full=false){
 const a=amountRows(rows),net=round(a.paid-a.refund);
 const sales=stat('商品实付金额',money(a.paid),'当前筛选范围内的商品实付总额')+stat('退款金额',money(a.refund),'已成功退款 · '+a.refundQty+' 件');
 const cards=isMerchant?sales+stat('商品交易净额',money(net),'商品实付金额 − 退款金额')+stat('已到账公益款',money(a.contribution),'已到账的基金会份额'):sales+(full?stat('支付商品件数',a.qty,'退款件数 '+a.refundQty)+stat('项目应收分账',money(a.due),'扣除退款后的项目公益份额'):'')+stat('项目已到账分账',money(a.settled),'项目公益份额中已核验到账的金额')+stat('项目待结算分账',money(round(a.due-a.settled)),'项目应收分账 − 项目已到账分账');
 const note=isMerchant?'商品实付金额 − 退款金额 = 商品交易净额。已到账公益款是上述订单中已到账的基金会份额，与交易净额不相加。':'商品实付金额 − 退款金额 = 商品交易净额；项目公益份额按订单分账计划计算。项目应收分账 = 项目已到账分账 + 项目待结算分账。此处仅统计商品订单，项目总贡献另含已支付的直接捐款。';
 return '<div class="stats'+(full&&!isMerchant?' six':'')+'">'+cards+'</div><p class="metrics-note">'+note+'</p>';
}
function summary(rows){const a=amountRows(rows);return '<div class="summary-line"><span>实付<strong>'+money(a.paid)+'</strong></span><span>退款<strong>'+money(a.refund)+'</strong></span><span>'+(isMerchant?'应分':'本项目应收')+'<strong>'+money(a.due)+'</strong></span><span>'+(isMerchant?'已分':'本项目已到账')+'<strong>'+money(a.settled)+'</strong></span></div>';}
const auditSnapshots=new Map();
function auditSnapshot(entity){
 if(!entity)return {};
 const keys=['name','intro','category','status','delivery','after','split','stock','skus','price','fund','association','university','splitRecipients','amount','qty','customerServiceId','returnAddress','remark','orderRemark','merchantRemark','text','color','reason','contactName','contact','address','bank','service','donationAgreement','shippingHours','shippingTemplateId','operatingQualifications','carouselImages','detailImages','specs','parameters','logo','shopLogo','categoryProof','donationAgreementFile','shipmentRemark'];
 const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>['id','name','stock','price','fund','association','university','amount','splitRecipients','category','validUntil','longTerm','source','text','color','file','type','size','values','value','merchantCode','key','image','withImages'].includes(k)).map(([k,v])=>[k,clean(v)])):value;
 return Object.fromEntries(keys.filter(k=>entity[k]!==undefined).map(k=>[k,k==='logo'?(entity[k]?'已设置图片':'未设置'):k==='bank'?paymentAccountText(entity[k]):k==='contact'?String(entity[k]).replace(/(\d{3})\d{4}(\d{4})/g,'$1****$2'):clean(entity[k])]));
}
function auditEntity(object){return [...D.orders,...D.products,...D.shops,...D.organizations,...D.projects,...D.activities,...D.members].find(o=>(o.id===object||o.name===object)&&(o.org===S.org||o.id===S.org||D.shops.some(s=>s.id===o.shop&&s.org===S.org)));}
function record(object,action,projectId='',result='成功',change=null){
 const order=D.orders.find(o=>o.id===object&&o.org===S.org);if(order)syncAftersale(order);
 const entity=auditEntity(object),key=entity?.id,before=change?auditSnapshot(change.before):auditSnapshots.get(key),after=auditSnapshot(change?change.after:entity);
 const modified=before&&Object.keys({...before,...after}).filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));
 const diff=modified?.length?{before:Object.fromEntries(modified.map(k=>[k,before[k]??null])),after:Object.fromEntries(modified.map(k=>[k,after[k]??null]))}:{};
 D.logs.unshift({id:Date.now(),org:S.org,object,objectName:entity?.name,action,project:projectId,result,who:currentAccountName(),memberId:currentMember()?.id,role:S.member?'组织成员':'组织管理员',shop:entity?.shop||D.shops.find(s=>s.id===key)?.id,product:D.products.some(p=>p.id===key)?key:undefined,date:new Date().toLocaleString('sv-SE'),...diff});
 if(entity)auditSnapshots.set(key,auditSnapshot(entity));if(order)C?.persist();publishOrderChange();
}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
let analyticsState=window.MerchantAnalytics?.defaults()||{};
let routeReady=false,restoringRoute=false;
const workspaceDefaultTab=page=>({orders:'订单清单',products:'商品列表',organization:'基本资料',applications:'全部',approvals:'待审批',logs:'操作记录',projects:'项目列表',activities:'项目活动',actions:'公益行动',settlement:'分账对账',analytics:'经营总览'})[page];
function syncWorkspaceRoute(replace=false){
 if(!routeReady||restoringRoute||isOrderPage||orderProductContext)return;
 const url=new URL(location.href),panel=$('#overlay .merchant-page-panel'),application=$('#overlay [data-route-application]');
 for(const key of ['view','org','shop','member','demoAccount','taskShop','tab','product','edit','application','project','activity','section','goods','range','from','to','metric','query','sort','trend','sub','productId','region','columns','detailRange','detailFrom','detailTo','regionRange','afterTodo'])url.searchParams.delete(key);
 url.searchParams.set('view',S.page);url.searchParams.set('org',S.org);if(isMerchant&&currentShop())url.searchParams.set('shop',currentShop().id);url.searchParams.set('demoAccount',S.demoAccount);if(S.taskShop)url.searchParams.set('taskShop',S.taskShop);
 if(S.member)url.searchParams.set('member','1');
 if(S.tab&&S.tab!==workspaceDefaultTab(S.page))url.searchParams.set('tab',S.tab);
 if(S.page==='analytics')for(const [key,value] of Object.entries(analyticsState))if(value)url.searchParams.set(key,value);
 if(S.project){url.searchParams.set('project',S.project);if(S.projectTab&&S.projectTab!=='基本信息')url.searchParams.set('section',S.projectTab);if(!isMerchant&&S.product)url.searchParams.set('goods',S.product);}
 if(S.activity)url.searchParams.set('activity',S.activity);
 if(isMerchant&&S.page==='orders'&&f().afterTodo)url.searchParams.set('afterTodo',f().afterTodo);
 if(isMerchant&&panel?.dataset.merchantPage?.startsWith('product')&&productEditState?.productId){url.searchParams.set('product',productEditState.productId);if(panel.dataset.merchantPage==='product-editor')url.searchParams.set('edit','1');}
 if(application)url.searchParams.set('application',application.dataset.routeApplication);
 if(url.href!==location.href)history[replace?'replaceState':'pushState'](null,'',url.href);
}
function restoreWorkspaceRoute(){
 if(isOrderPage){render();return;}
 restoringRoute=true;
 try{
  const params=new URLSearchParams(location.search),requestedOrg=authorizedOrganizations().find(o=>o.id===params.get('org')&&o.role===role);
  S.org=requestedOrg?.id||authorizedOrganizations().find(o=>o.role===role)?.id||S.org;
  S.shop=authorizedShops().find(s=>s.id===params.get('shop'))?.id||availableShop()?.id||'';S.taskShop=params.get('taskShop')||'';syncMembership();
  S.page=navItems().some(n=>n[0]===params.get('view'))?params.get('view'):(navItems()[0]?.[0]||'organization');
  if(S.page==='analytics'){analyticsState=window.MerchantAnalytics.defaults();for(const key of Object.keys(analyticsState))if(params.has(key))analyticsState[key]=params.get(key);if(!params.has('range')&&!['经营总览','交易数据','商品数据','公益数据'].includes(params.get('tab')))analyticsState.range='昨日';if(!window.MerchantAnalytics.range(analyticsState,'2026-11-02 15:00'))analyticsState=window.MerchantAnalytics.defaults();if(!window.MerchantAnalytics.pages.includes(params.get('tab')))params.delete('tab');}
  S.tab=params.get('tab')||workspaceDefaultTab(S.page);S.project='';S.product='';S.activity='';S.projectTab=params.get('section')||'基本信息';
  if(isMerchant&&params.get('view')==='alerts'){S.page='orders';S.tab='订单清单';}
  if(isMerchant&&S.page==='orders'){const afterTodo=afterQuick.includes(params.get('afterTodo'))?params.get('afterTodo'):'';if(afterTodo)S.quick='退款/售后';S.filters[filterKey()]={...f(),afterTodo};}
  if(!isMerchant&&params.get('project')&&scopedProject(params.get('project')))S.project=params.get('project');
  if(!isMerchant&&S.project&&scopedProduct(params.get('goods'))?.project===S.project)S.product=params.get('goods');
  if(params.get('view')==='settlement'&&params.get('order')){S.page=isMerchant?'orders':'settlement';S.tab=workspaceDefaultTab(S.page);S.filters[filterKey()]=isMerchant?{q:params.get('order')}:settlementOrderFilter(params.get('order'));}
  if(!isMerchant&&params.get('activity')&&scopedProject(activity(params.get('activity'))?.project))S.activity=params.get('activity');
  if(!isMerchant){
   const item=activity(S.activity),kind=item?.kind;
   if(item&&['projects','activities','actions'].includes(S.page)){
    S.page=kind==='公益行动'?'actions':'activities';S.tab=workspaceDefaultTab(S.page);
   }
   if(['activities','actions'].includes(S.page)){S.projectTab='基本信息';S.product='';S.activityTab='基本信息';}
  }
  closeOverlay();render();
  if(isMerchant&&['products','analytics'].includes(S.page)&&params.get('product')){if(params.get('edit')==='1'&&canUse('products'))productEditor(params.get('product')==='new'?undefined:params.get('product'));else productDetail(params.get('product'));}
  if(params.get('application'))applicationDialog(params.get('application'));
 }finally{restoringRoute=false;}
}
window.addEventListener('popstate',restoreWorkspaceRoute);
function navItems(){if(!currentMember())return [];if(!isMerchant)return [['projects','项目管理','leaf'],['activities','项目活动','people'],['actions','公益行动','leaf'],['settlement','分账对账','coin'],['organization','组织管理','org'],['applications','我的申请','check'],...(!S.member?[['approvals','审批中心','people']]:[]),['logs','操作记录','clock']];const items=hasBusinessAccess()?[['orders','订单查询','file'],['analytics','数据中心','chart'],['products','商品管理','box'],['shop','店铺管理','shop']]:[];for(let i=items.length-1;i>=0;i--)if(!canUse(items[i][0]))items.splice(i,1);if(canManageMembers())items.push(['organization','组织管理','org']);items.push(['applications','我的申请','check']);if(!S.member)items.push(['approvals','审批中心','people']);items.push(['logs','操作记录','clock']);return items;}

function navigate(page){if(!navItems().some(n=>n[0]===page))return;if(isOrderPage){const url=new URL('index.html',location.href);url.search=new URLSearchParams({view:page,org:S.org,shop:currentShop()?.id||'',demoAccount:S.demoAccount});location.href=url.href;return;}S.page=page;S.tab=page==='analytics'?'经营总览':page==='orders'?'订单清单':page==='organization'?'基本资料':page==='approvals'?'待审批':page==='logs'?'操作记录':page==='products'?'商品列表':workspaceDefaultTab(page)||'项目列表';S.project='';S.product='';S.activity='';closeOverlay();render();window.scrollTo(0,0);}
function render(){closeSplitPlanHover();closeLogisticsHover();for(const o of myOrders()){const shipping=R.advanceShipping(o,demoNow.getTime());if(shipping.events.length)Object.assign(o,shipping.order);const next=R.advanceAftersale(o,demoNow.getTime());if(next.events.length){Object.assign(o,next.order);o.afterEvents=[...(o.afterEvents||[]),...next.events];}else if(next.order.afterException)o.afterException=next.order.afterException;syncAftersale(o);}if(R.splitPartialOrders(D.orders))C?.persist();refreshMerchantAlerts();if(isOrderPage){openOrder(orderParams.get('id'),orderParams.get('section'));return;}renderWorkspace(pageBody());}
function renderWorkspace(content){const nav=navItems(),label=nav.find(x=>x[0]===S.page)?.[1]||'';
$('#app').innerHTML='<div class="mobile-cover" data-action="mobile-close"></div><aside class="sidebar"><div class="brand"><div class="brandmark">'+icon('leaf')+'</div><div><div class="brand-title">善集</div><div class="brand-sub">GOODNESS IN EVERYDAY</div></div></div>'+workspaceContext()+'<div class="nav-label">工作空间</div><nav>'+nav.map(([id,text,i])=>btn(icon(i)+'<span>'+text+'</span>'+(id==='orders'?'<span class="count">'+orderGroupCount(myOrders().filter(o=>orderStatus(o)==='待发货'))+'</span>':id==='approvals'?'<span class="count">'+D.joins.filter(j=>j.org===S.org&&j.status==='待审批').length+'</span>':''),'nav',id,'nav-item'+(S.page===id?' active':''))+(id==='analytics'&&S.page==='analytics'?'<div class="analytics-subnav">'+window.MerchantAnalytics.menuPages.map(name=>btn(esc(name),'analytics-page',name,(name===S.tab||name==='服务数据'&&['售后数据','客服数据'].includes(S.tab))?'active':'')).join('')+'</div>':'')).join('')+'</nav><div class="sidebar-foot"><span>SHANJI WORKSPACE</span><span>v0.98</span></div></aside><div class="workspace"><header class="topbar">'+btn(icon('menu'),'mobile','','icon-btn mobile-menu')+'<span class="workspace-title">'+(isMerchant?'商家工作台':'基金会工作台')+'</span>'+btn('<span>'+esc(org().name)+'</span>'+(isMerchant?'<small>'+esc(currentShop()?.name||'暂无自营店铺')+'</small>':'')+'<span class="mobile-context-hint">'+(isMerchant?'切换组织 / 店铺':'切换组织')+' ▾</span>','mobile','','mobile-context')+'<span class="spacer"></span>'+'<span class="desktop-date">2026 年 11 月 2 日　星期一</span><div class="account">'+btn('<span class="avatar">'+esc(currentAccountName().slice(0,1))+'</span><span class="account-copy"><span class="account-name">'+esc(currentAccountName())+'</span><small class="account-role">'+esc(currentMember()?.role||'')+'</small></span>','account','','account-trigger identity')+(S.menu?'<div class="account-menu">'+btn('账号信息','account-info')+btn('修改密码','password')+btn('我的协议','my-agreements')+'</div>':'')+'</div></header><main class="main" id="main">'+content+'<div class="footer-note">'+icon('shield')+'<span>善集 · 让每一份善意有所抵达</span><span class="spacer"></span><span>交互原型 · 示例数据</span></div></main></div>';
document.title=label+' · '+(isMerchant?'商家':'基金会')+'工作台 · 善集';setupWorkspaceHeader();setupWorkspaceSticky();setupOrganizationScroll();syncWorkspaceRoute();const analyticsDialog=$('.analytics-data-dialog');if(analyticsDialog){document.body.style.overflow='hidden';analyticsDialog.querySelector('button')?.focus();}else if(!$('#overlay').children.length)document.body.style.overflow='';}
function pageBody(){if(isMerchant&&['orders','products','analytics','shop'].includes(S.page)&&!canUse(S.page))return heading('暂无访问权限','请联系组织管理员配置当前店铺的功能或商品权限。');if(!currentMember())return heading('无权访问当前组织','请使用已有成员关系的账号，或切换至已加入的组织。');if(isMerchant&&!merchantOpen()&&['orders','products','analytics'].includes(S.page))return heading(S.page==='analytics'?'数据中心':S.page==='orders'?'订单管理':'商品管理',org().name+'的经营功能将在店铺开通后开放。')+'<section class="card"><div class="empty">'+icon('shop')+'<p>当前组织尚未开通店铺</p>'+btn('前往店铺管理','nav','shop','btn primary')+'</div></section>';return ({analytics:merchantAnalyticsPage,orders:ordersPage,products:productsPage,shop:shopPage,organization:organizationPage,applications:applicationsPage,approvals:approvalsPage,logs:logsPage,projects:projectsPage,activities:foundationActivitiesPage,actions:foundationActivitiesPage,settlement:settlementPage}[S.page]||projectsPage)();}
function merchantPausedFund(o){if(!activeAfter(o))return 0;const refunded=new Set(R.refundedIndexes(o)),settled=new Set(R.settledIndexes(o)),remaining=Array.from({length:o.qty},(_,i)=>i).filter(i=>!refunded.has(i)),affected=o.afterUnitIndexes||remaining.slice(0,o.afterQty||0);return affected.filter(i=>!refunded.has(i)&&!settled.has(i)).reduce((n,i)=>n+R.cents(o.fundUnitAmounts?.[i]??o.fund??0),0)/100;}
const analyticsOrders=()=>canUse('analytics')?D.orders.filter(o=>o.org===S.org&&o.shop===currentShop()?.id):[];
const analyticsProducts=()=>canUse('analytics')?D.products.filter(p=>p.shop===currentShop()?.id):[];
function merchantAnalyticsContext(){return {page:S.tab,state:analyticsState,now:'2026-11-02 15:00',orders:analyticsOrders(),products:analyticsProducts(),esc,money,btn,table,tr,tabs,heading:merchantHeading,productEntity,activeAfter,afterStage,fundDue:R.fundDue,pausedFund:merchantPausedFund,splitStatus:orderSplitStatus};}
function merchantAnalyticsPage(){if(!canUse('analytics'))return heading('数据中心','当前店铺未授予数据中心权限。');return window.MerchantAnalytics.render(merchantAnalyticsContext());}
function productEntity(p){return '<div class="entity"><div class="product-art art-'+p.art+'">'+['本','杯','袋'][p.art%3]+'</div><div>'+(link(p.name,isMerchant?'product-detail':'project-product',p.id)||esc(p.name))+'<small>'+esc(p.id)+'</small></div></div>';}
const productSaleState=p=>p.status==='在售'&&p.skus.length>0&&p.skus.every(s=>Number(s.stock)===0)?'已售罄':p.status;
const productReviewState=p=>isMerchant&&p.review==='已撤回'?'草稿':p.review;
const productState=p=>['草稿','待审批','已撤回','已驳回'].includes(p.review)?productReviewState(p):productSaleState(p);
const productStateView=p=>(p.version>0?badge(productSaleState(p)):badge(productState(p)))+(p.version>0&&['待审批','草稿','已驳回','已撤回'].includes(p.review)?'<div class="product-review-note">修改'+esc(productReviewState(p))+'</div>':'');
const inProductState=(p,state)=>!state||(['在售','已售罄','已下架'].includes(state)?productSaleState(p)===state&&p.version>0:productReviewState(p)===state);
function merchantHeading(title,actions=''){return '<div class="page-head merchant-list-head"><h1>'+esc(title)+'</h1>'+shopContext()+'<span class="spacer"></span>'+actions+'</div>';}
function productActions(p){
 const app=pending(p.id),share=p.version>0?link('二维码/链接','product-share',p.id):'<button type="button" class="link" disabled title="审批通过后可获取商品二维码和链接">二维码/链接</button>';
 const primary=app?link('查看申请','application-object',p.id):link('编辑','product-edit',p.id)+(['草稿','已驳回','已撤回'].includes(p.review)?'':link(p.status==='在售'?'下架':'上架','product-toggle',p.id));
 return '<div class="product-action-line">'+primary+'</div><div class="product-action-line">'+link('预览','preview-product',p.id)+share+'</div>';
}
function productShareLink(p){return 'https://shanxing.example/goods/'+encodeURIComponent(p.id);}
function productShareSvg(p){
 const qr=qrcodegen.QrCode.encodeText(productShareLink(p),qrcodegen.QrCode.Ecc.MEDIUM),border=4,size=qr.size+border*2,modules=[];
 for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))modules.push('M'+(x+border)+','+(y+border)+'h1v1h-1z');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="商品二维码" style="stroke:none" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+modules.join('')+'" fill="#000"/></svg>';
}
function productShare(id,anchor){
 const p=scopedProduct(id);if(!isMerchant||!p||p.version<=0)return;
 dialog('商品二维码/链接','<div class="product-share"><p class="product-share-name" title="'+esc(p.name)+'">'+esc(p.name)+'</p><div class="product-share-qr">'+productShareSvg(p)+'</div><p>扫码查看商品详情</p>'+btn('保存二维码','product-share-save',p.id)+'<label class="product-share-link">商品链接（原型示例）<div><input id="product-share-url" aria-label="商品链接" readonly value="'+esc(productShareLink(p))+'">'+btn('复制链接','product-share-copy',p.id,'btn primary')+'</div></label></div>');
 $('#overlay .dialog').classList.add('product-share-dialog');
 anchorOrderDialog(anchor);
}

function productCharitySummary(p){if(isMerchant&&!C.canProduct(p,'productSplitView'))return esc(project(p.project)?.name||'未关联');const funds=p.skus.map(s=>s.fund);return esc(project(p.project)?.name||'未关联')+'<small class="product-charity-note">'+(p.donationMode==='random'?'随机随单捐':funds.length&&funds.every(n=>n===funds[0])?'每件公益款 '+money(funds[0]):'固定金额捐 · 按规格配置')+'</small>';}

const productPrice=p=>{const prices=p.skus.map(s=>s.price),min=Math.min(...prices),max=Math.max(...prices);return money(min)+(min===max?'':' ～ '+money(max));};
function productsPage(){
 const q=f(),base=myProducts().filter(p=>!isMerchant||C.canReadProduct(p)),rows=base.filter(p=>(!q.q||includesText(p.name,q.q)||includesText(p.id,q.q)||p.skus.some(k=>includesText(k.merchantCode,q.q)))&&inProductState(p,q.productState)&&(!q.collaboratorName||includesText(p.collaboratorName||'',q.collaboratorName)));
 const statuses='<div class="status-nav product-status-tabs">'+['','在售','已售罄','已下架','待审批','已驳回','草稿'].map(v=>btn(esc(v||'全部')+'<b>'+base.filter(p=>inProductState(p,v)).length+'</b>','product-status',v,'quick-chip'+((q.productState||'')===v?' active':''))).join('')+'</div>';
 const content=statuses+filterBar('<input type="hidden" name="productState" value="'+esc(q.productState||'')+'">'+field('协作方名称','collaboratorName',q.collaboratorName||'','text',false),'商品名称 / 商品编号 / 规格编码',true,'商品查询')+resultStrip(rows.length,'件商品')+(rows.length?table(['商品信息','价格（元）','总库存','公益项目 / 承诺','协作方名称','商品状态','操作'],rows.map(p=>{
 const priceAction=pending(p.id)?link('查看申请','application-object',p.id):p.review==='草稿'&&p.version===0?link('编辑价格','product-edit',p.id):link('修改价格','product-price',p.id);
 const row=tr([productEntity(p),productPrice(p)+'<div>'+priceAction+'</div>',p.skus.reduce((n,k)=>n+k.stock,0)+'<div>'+link('修改库存','inventory',p.id)+'</div>',productCharitySummary(p),esc(p.collaboratorName||'—'),productStateView(p),'<div class="product-row-actions">'+productActions(p)+(C.canManageProduct(p)?link('人员权限','cp-product',p.id):'')+'</div>']);
 return row;
 })):listEmpty(base,'商品'));
 return merchantHeading('商品管理',btn(icon('plus')+'发布新商品','product-new','','btn primary')+(C.manage()?btn('批量配置人员权限','cp-products'):''))+'<section class="card merchant-list-card">'+tabs(['商品列表','申请记录'],S.tab)+(S.tab==='申请记录'?applicationTable(D.applications.filter(a=>a.org===S.org&&a.type.includes('商品')&&C.canAction('application',a.id))):content)+'</section>';
}
function resultStrip(count,unit='笔订单'){
 const labels={collaboratorName:'协作方名称',q:isMerchant&&S.page==='orders'?'订单编号':'关键词',productName:'商品名称',productId:'商品 ID',receiverName:'收件人姓名',receiverPhone:'收件人手机号',waybill:'快递单号',pickup:'是否现场领取',shippingWindow:'承诺发货时间',delivery:'交付',afterStatus:'售后状态',orderStatus:'订单状态',afterShipping:'发货状态',timeRange:'下单时间',afterTimeRange:'申请时间',afterFrom:'申请开始',afterTo:'申请结束',issue:'异常类型',split:'分账',afterType:'售后类型',after:'售后处理',payment:'支付',from:'下单开始',to:'下单结束',status:'经营状态',review:'审批进度',productState:'商品状态',remarkColor:'标记',remarkPresence:'备注',afterTodo:'售后待办'};
 const conditions=Object.entries(f()).filter(([k,v])=>v&&k!=='productId'&&!(isMerchant&&S.page==='orders'&&k==='issue')).map(([k,v])=>'<span class="condition">'+esc(labels[k]||k)+'：'+esc(k==='remarkColor'?remarkName({org:S.org,shop:currentShop()?.id},v):k==='remarkPresence'?(v==='yes'?'有备注':'无备注'):v)+'</span>').join('');
 const quick=S.page==='orders'&&S.tab==='订单清单'&&S.quick!=='全部订单'?'<span class="condition">待办：'+esc(S.quick)+'</span>':'';
 return '<div class="results-strip" role="status"><strong>当前筛选共 '+count+' '+unit+'</strong><div class="conditions">'+quick+conditions+'</div>'+((quick||conditions)?btn('清空筛选','clear-list','','link'):'')+'</div>';
}
function listEmpty(base,kind){return '<div class="empty">'+icon(base.length?'search':kind==='商品'?'box':'file')+'<p>'+(base.length?'当前筛选无匹配'+kind:'当前店铺暂无'+kind)+'</p><p class="tiny muted">'+(base.length?'调整条件后重新查询。':kind==='商品'?'新建商品并提交审批，审批通过后上架。':'订单产生后，可在此处理发货与售后。')+'</p>'+(base.length?btn('清空筛选','clear-list','','btn primary'):kind==='商品'?btn('新建商品','product-new','','btn primary'):btn('前往商品管理','nav','products','btn primary'))+'</div>';}
const orderQuick=['全部订单','待发货','待收货','退款/售后'];
const afterQuick=['待商家处理','审核即将超期','审核超期自动通过','待买家退货','待收货验收','待确认退款','验收即将超期','验收超期自动退款','退款处理中'];
function inAfterQuick(o,value){
 if(!value)return true;
 if(value==='待商家处理')return afterStage(o)==='待商家处理';
 if(value==='审核即将超期'){const due=R.time(o.afterSubmittedAt)+48*R.HOUR,now=demoNow.getTime();return afterStage(o)==='待商家处理'&&now<due&&now>=due-(D.merchantAlertConfig?.reviewWarningHours??4)*R.HOUR;}
 if(value==='审核超期自动通过')return orderReminders(o).some(a=>a.code==='review-auto');
 if(value==='待买家退货')return afterStage(o)==='待买家退货';
 if(['待收货验收','待确认退款'].includes(value))return afterStage(o)===value;
 if(value==='验收即将超期'){const timing=R.acceptanceTiming(o),now=demoNow.getTime();return timing.waiting&&now<timing.deadline&&now>=timing.deadline-(D.merchantAlertConfig?.acceptanceWarningHours??4)*R.HOUR;}
 if(value==='验收超期自动退款')return syncAftersale(o).some(a=>!!a.afterAcceptanceAutoAt);
 if(value==='退款处理中')return o.after==='退款处理中';
 return false;
}
function afterQuickFilters(rows){return '<div class="after-quick-filters" role="group" aria-label="售后快速筛选"><span>快速筛选售后</span><div>'+afterQuick.map(name=>'<button type="button" data-action="after-quick" data-id="'+esc(name)+'" aria-pressed="'+(f().afterTodo===name)+'">'+esc(name)+'<b>'+orderGroupCount(rows.filter(o=>inAfterQuick(o,name)))+'</b></button>').join('')+'</div></div>';}

const afterStates=['待商家处理','待买家退货','待收货验收','待确认退款','退款中','已退款','已拒绝','已取消'];
function currentInspection(o){const inspection=o.collaborationInspection;return inspection&&inspection.afterId===(o.afterId||o.afterNo||'')?inspection:null;}
function afterStage(o){if(['待验收','待商家收货','待商家收货确认','待收货验收','待确认退款'].includes(o.after))return currentInspection(o)?'待确认退款':'待收货验收';return ({无售后:'',待处理:'待商家处理',退款处理中:'退款中',退款异常:'退款中',已退款:'已退款',极速退款已完成:'已退款',已取消:'已取消',已撤销:'已取消',已关闭:'已取消'})[o.after]??o.after;}
const activeAfter=o=>['待商家处理','待买家退货','待收货验收','待确认退款','退款中'].includes(afterStage(o));
const noAfter=o=>o.after==='无售后'&&!o.aftersales?.length;
function orderStatus(o){return R.orderStatus(o);}
function orderGroupId(o){return o.parentOrderId||o.id;}
function orderGroupCount(rows){return new Set(rows.map(orderGroupId)).size;}
function orderGroupRows(rows){const groups=new Set(rows.map(orderGroupId));return myOrders().filter(o=>groups.has(orderGroupId(o)));}
function inQuick(o,q){return q==='全部订单'||['待发货','待收货'].includes(q)&&orderStatusParts(o).some(part=>partOrderStatus(o,part)===q)||q==='退款/售后'&&!noAfter(o);}
function inAfterStatus(o,status){return !status||afterStage(o)===status;}
const demoNow=new Date('2026-11-02T15:00:00');
function dateValue(date){const pad=n=>String(n).padStart(2,'0');return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'T'+pad(date.getHours())+':'+pad(date.getMinutes())+':'+pad(date.getSeconds());}
function orderDateRange(period){
 const end=new Date(demoNow),start=new Date(end);start.setHours(0,0,0,0);
 if(period==='今日'){end.setHours(23,59,59,0);}else if(period==='昨日'){start.setDate(start.getDate()-1);end.setDate(end.getDate()-1);end.setHours(23,59,59,0);}else if(period==='本周'||period==='上周'){start.setDate(start.getDate()-(start.getDay()+6)%7);if(period==='上周'){end.setTime(start.getTime()-1000);start.setDate(start.getDate()-7);}}else if(period==='近24小时'){start.setTime(end.getTime()-24*60*60*1000);}else if(/^近(7|30|90)日$/.test(period)){start.setTime(end.getTime()-Number(period.match(/\d+/)[0])*24*60*60*1000);}else return {from:'',to:''};
 return {from:dateValue(start),to:dateValue(end)};
}
function includesText(value,query){return !query?.trim()||String(value||'').toLowerCase().includes(query.trim().toLowerCase());}
function merchantProductChoices(){const choices=new Map(myProducts().map(p=>[p.id,{id:p.id,name:p.name}]));for(const o of myOrders())if(!choices.has(o.product))choices.set(o.product,{id:o.product,name:o.productName||product(o.product)?.name||o.product});return [...choices.values()];}
function productNameFilter(){const q=f();return '<div class="field product-name-filter"><label for="order-product-name">商品名称</label><div class="product-combobox"><input id="order-product-name" name="productName" type="search" role="combobox" aria-autocomplete="list" aria-controls="order-product-options" aria-expanded="false" autocomplete="off" placeholder="输入或选择商品名称" value="'+esc(q.productName||'')+'"><input type="hidden" name="productId" value="'+esc(q.productId||'')+'">'+'<button type="button" data-action="product-options" class="product-options-toggle" aria-label="展开商品选项"><svg class="dropdown-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>'+'</div><div id="order-product-options" class="product-options" role="listbox" aria-label="商品名称" hidden>'+btn('全部商品','filter-product','','product-option')+merchantProductChoices().map(p=>'<button type="button" class="product-option" role="option" aria-selected="'+(q.productId===p.id)+'" data-action="filter-product" data-id="'+esc(p.id)+'" data-label="'+esc(p.name)+'">'+esc(p.name)+'<small>'+esc(p.id)+'</small></button>').join('')+'<span class="product-options-empty" hidden>暂无匹配商品</span></div></div>';}
function closeProductOptions(){const list=$('#order-product-options');if(list)list.hidden=true;$('#order-product-name')?.setAttribute('aria-expanded','false');}
function openProductOptions(filter=false){const list=$('#order-product-options'),input=$('#order-product-name');if(!list||!input)return;const term=filter?input.value.trim():'';for(const option of list.querySelectorAll('.product-option'))option.hidden=Boolean(term&&!includesText(option.dataset.label||'全部商品',term));list.querySelector('.product-options-empty').hidden=Boolean([...list.querySelectorAll('.product-option')].some(o=>!o.hidden));list.hidden=false;input.setAttribute('aria-expanded','true');}
function inAfterShipping(o,value,records=syncAftersale(o)){
 if(!value)return true;
 const shippedStates=['已发货','已收货','已领取'];
 const shipments=(o.shipments||[]).filter(s=>Array.isArray(s.unitIndexes));
 return records.some(a=>{
  const indexes=a.afterUnitIndexes;
  if(o.method==='快递配送'&&shipments.length&&Array.isArray(indexes)&&indexes.length){
   const shipped=new Set(shipments.flatMap(s=>s.unitIndexes));
   return indexes.some(i=>(shipped.has(i)?'已发货':'未发货')===value);
  }
  return (shippedStates.includes(a.afterDelivery||o.delivery)?'已发货':'未发货')===value;
 });
}
function inAfterQuery(o,q){
 if(S.quick!=='退款/售后')return true;
 const range=q.afterTimeRange==='自定义'?{from:q.afterFrom,to:q.afterTo}:orderDateRange(q.afterTimeRange);
 return syncAftersale(o).some(a=>{
  const at=R.time(a.afterSubmittedAt);
  return (!q.afterType||a.afterType===q.afterType)&&inAfterStatus(a,q.afterStatus)&&inAfterShipping(o,q.afterShipping,[a])&&(!q.returnWaybill?.trim()||[a.returnWaybill,...(a.returnShipments||[]).map(s=>s.waybill)].some(n=>includesText(n,q.returnWaybill.trim())))&&(!range.from||at>=R.time(range.from))&&(!range.to||at<=R.time(range.to));
 });
}
function partMatchesOrderQuery(o,part,q){
 const status=partOrderStatus(o,part),after=part.after||'',afterTab=S.quick==='退款/售后';
 const split=after==='已退款'?'分账取消':after&&activeAfter({after})?'售后暂停':o.split==='售后暂停'&&!after?'待分账':orderSplitStatus(o);
 return (!['待发货','待收货'].includes(S.quick)||status===S.quick)&&(!q.orderStatus||status===q.orderStatus)&&(!q.split||split===q.split)&&(afterTab||(!q.afterStatus||after===q.afterStatus)&&(!q.afterType||Boolean(after)&&part.type===q.afterType));
}
function inOrderPartQuery(o,q){return orderStatusParts(o).some(part=>partMatchesOrderQuery(o,part,q));}
function filteredOrders(rows,q=f()){const range=isMerchant&&S.quick==='退款/售后'?{}:isMerchant?(q.timeRange==='自定义'?{from:q.from,to:q.to}:orderDateRange(q.timeRange||'近90日')):S.page==='settlement'?settlementPeriod(q):q;return rows.filter(o=>(isMerchant?(includesText(o.id,q.q)||includesText(o.parentOrderId,q.q)):matching({...o,name:product(o.product)?.name},q.q))&&(!isMerchant||includesText((o.receiver||'').split('\n')[0],q.receiverName)&&includesText((o.receiver||'').split('\n')[1],q.receiverPhone)&&includesText(o.waybills,q.waybill)&&(!q.productId?includesText(o.productName||product(o.product)?.name,q.productName):o.product===q.productId))&&(!isMerchant||(!q.remarkColor||o.merchantRemark?.color===q.remarkColor)&&(!q.remarkPresence||(q.remarkPresence==='yes')===Boolean(o.merchantRemark?.text?.trim())))&&(!isMerchant||R.inShippingWindow(o,q.shippingWindow,demoNow.getTime()))&&(!isMerchant||inAfterQuick(o,q.afterTodo))&&(!isMerchant||inOrderPartQuery(o,q))&&(!isMerchant||inAfterQuery(o,q))&&(isMerchant||inAfterStatus(o,q.afterStatus))&&(!q.pickup||(q.pickup==='yes')===(o.method!=='快递配送'))&&(!q.delivery||o.delivery===q.delivery)&&(isMerchant||!q.split||orderSplitStatus(o)===q.split)&&(isMerchant||!q.afterType||o.afterType===q.afterType)&&(!q.after||(q.after==='无售后'?noAfter(o):afterStage(o)===q.after))&&(!q.payment||o.payment===q.payment)&&(isMerchant||!q.issue||R.orderIssueTypes(o,demoNow.getTime()).includes(q.issue))&&(!range.from||new Date(o.date.replace(' ','T')).getTime()>=new Date(range.from).getTime())&&(!range.to||new Date(o.date.replace(' ','T')).getTime()<=new Date(range.to.length===10?range.to+'T23:59:59':range.to).getTime()));}
function orderLabelFilters(){
 const q=f(),context={org:S.org,shop:currentShop()?.id};
 const menu=(key,title,options)=>'<details class="order-label-menu" name="order-label-menu"><summary>'+title+'</summary><div class="order-label-options" role="group" aria-label="'+(key==='remarkColor'?'标记':'备注')+'筛选">'+options.map(([value,label])=>'<button type="button" data-action="filter-label" data-id="'+key+':'+value+'" aria-pressed="'+((q[key]||'')===value)+'">'+(key==='remarkColor'&&value?remarkFlag(value):'')+esc(label)+'</button>').join('')+'</div></details>';
 return '<div class="order-label-filters" aria-label="标签筛选"><strong>标签</strong><input type="hidden" name="remarkColor" value="'+esc(q.remarkColor||'')+'"><input type="hidden" name="remarkPresence" value="'+esc(q.remarkPresence||'')+'"><button type="button" class="order-label-all'+(!q.remarkColor&&!q.remarkPresence?' active':'')+'" data-action="filter-label" data-id="all" aria-pressed="'+(!q.remarkColor&&!q.remarkPresence)+'">全部</button><span class="order-label-divider" aria-hidden="true"></span>'+menu('remarkColor',q.remarkColor?remarkFlag(q.remarkColor)+esc(remarkName(context,q.remarkColor)):'标记',remarkColors.map(([color])=>[color,remarkName(context,color)]).concat([['','全部']]))+menu('remarkPresence',q.remarkPresence==='yes'?'有备注':q.remarkPresence==='no'?'无备注':'备注',[['yes','有备注'],['no','无备注'],['','全部']])+'</div>';
}
function orderFilters(){
 const q=f(),pickup=select('是否现场领取','pickup',[['yes','是'],['no','否']],q.pickup,true),split=select('分账状态','split',isMerchant?['待分账','处理中','分账成功','售后暂停','分账异常','分账取消']:['待分账','分账成功','售后暂停','分账异常'],q.split,true);
 if(!isMerchant&&S.page==='settlement')return filterBar(split+'<input type="hidden" name="settlementOrg" value="'+esc(q.settlementOrg||'')+'"><input type="hidden" name="settlementProduct" value="'+esc(q.settlementProduct||'')+'"><input type="hidden" name="settlementRange" value="'+esc(q.settlementRange||'实时')+'"><input type="hidden" name="from" value="'+esc(settlementPeriod(q).from)+'"><input type="hidden" name="to" value="'+esc(settlementPeriod(q).to)+'">','搜索订单号 / 商品');
 if(!isMerchant)return filterBar(pickup+select('交付状态','delivery',['待发货','已发货','已收货','待领取','已关闭'],q.delivery,true)+split+'<details><summary class="tiny muted">更多条件</summary><div class="flex wrap" style="padding-top:10px">'+select('支付状态','payment',['支付成功','待付款'],q.payment,true)+select('售后类型','afterType',['退货退款','退款（无需退货）',['极速退款','未发货极速退款']],q.afterType,true)+select('处理状态','after',[...afterStates,'无售后'],q.after,true)+input('下单开始','from',q.from||'','date')+input('下单结束','to',q.to||'','date')+'</div></details>','搜索订单号 / 商品');
 const range=q.timeRange==='自定义'?q:orderDateRange(q.timeRange||'近90日');
 const time=window.MerchantDateRange.field('订单下单时间','timeRange','from','to',q.timeRange||'近90日',range.from,range.to,dateValue(demoNow));
 const isAfterTab=S.quick==='退款/售后';
 const afterRange=q.afterTimeRange==='自定义'?{from:q.afterFrom,to:q.afterTo}:orderDateRange(q.afterTimeRange);
 const afterTime=isAfterTab?window.MerchantDateRange.field('申请时间','afterTimeRange','afterFrom','afterTo',q.afterTimeRange,afterRange.from,afterRange.to,dateValue(demoNow)):'';
 const receiverFilters=isAfterTab?'':input('收件人姓名','receiverName',q.receiverName||'','text','placeholder="请输入收件人姓名"')+input('收件人手机号','receiverPhone',q.receiverPhone||'','tel','placeholder="请输入手机号"');
 const afterTypeFilter=select('售后类型','afterType',['退货退款','退款（无需退货）',['极速退款','未发货极速退款']],q.afterType,true);
 const statusFilter=isAfterTab?afterTypeFilter:select('订单状态','orderStatus',['待付款','待发货','待收货','已完成','已取消','退款成功'],q.orderStatus,true);
 const waybillFilter=input('快递单号','waybill',q.waybill||'','text','placeholder="请输入快递单号"');
 const fields=input('订单编号','q',q.q||'','search','placeholder="请输入订单编号"')+statusFilter+select('售后状态','afterStatus',afterStates,q.afterStatus,true)+(isAfterTab?select('发货状态','afterShipping',['未发货','已发货'],q.afterShipping,true):'')+(isAfterTab?input('退货快递单号','returnWaybill',q.returnWaybill||'','text','placeholder="请输入退货快递单号"')+waybillFilter:'')+productNameFilter()+receiverFilters+(isAfterTab?'':waybillFilter)+pickup+(isAfterTab?'':select('承诺发货时间','shippingWindow',['已过承诺发货时间','12小时内需要发货或揽收','今天需要发货或揽收','三天内需要发货或揽收','三天外需要发货或揽收'],q.shippingWindow,true));
 const advanced=split+(isAfterTab?'':afterTypeFilter);
 const open=Boolean(!isAfterTab&&q.afterType||q.split);
 return '<div class="order-query pdd-query"><form class="filters merchant-order-filters" id="filter-form"><input type="hidden" name="afterTodo" value="'+esc(q.afterTodo||'')+'">'+fields+(isAfterTab?'':time)+afterTime+'<div class="query-actions">'+btn('查询','apply-filter','','btn primary')+btn('重置','reset-filter')+'<button type="button" class="link" data-action="toggle-query" aria-expanded="'+open+'">'+(open?'收起筛选条件':'展开所有筛选项')+'</button></div><div class="merchant-advanced-fields"'+(open?'':' hidden')+'>'+advanced+'</div>'+orderLabelFilters()+'</form></div>';
}
function alertRemaining(value){
 const deadline=R.time(value);if(!Number.isFinite(deadline))return '';
 const diff=deadline-demoNow.getTime(),minutes=Math.ceil(Math.abs(diff)/60000),hours=Math.floor(minutes/60);
 return (diff<=0?'已超期 ':'剩余 ')+hours+' 小时 '+minutes%60+' 分钟';
}
function wechatDeadlineInfo(o){
 if(!isMerchant||o.payment!=='支付成功'||R.normalPendingCount(o)<=0)return '';
 const deadline=R.channelDeadline(o),remaining=deadline-demoNow.getTime();
 const text=Number.isFinite(deadline)?R.stamp(deadline)+' · '+(remaining<=0?'已超期，请联系系统管理员':alertRemaining(o.wechatSplitDeadline)):'待核实，请联系系统管理员';
 return '<span class="wechat-split-deadline" data-wechat-split-deadline>微信支付分账截止时间：'+esc(text)+'</span>';
}
function refreshMerchantAlerts(){
 if(!isMerchant)return;
 const now=demoNow.getTime(),orders=myOrders(),scope=new Set(orders.map(o=>o.id));
 D.merchantAlertRecords??=[];
 const fresh=orders.flatMap(o=>R.merchantAlerts(o,now,D.merchantAlertConfig)),keys=new Set(fresh.map(a=>a.key));
 for(const a of D.merchantAlertRecords)if(scope.has(a.order)&&a.active&&!keys.has(a.key)){a.active=false;a.resolvedAt=R.stamp(now);}
 for(const alert of fresh){
  const existing=D.merchantAlertRecords.find(a=>a.key===alert.key),active=!['review-auto','acceptance-auto'].includes(alert.code);
  if(existing){Object.assign(existing,alert,{active});continue;}
  D.merchantAlertRecords.push({...alert,active,createdAt:R.stamp(now),resolvedAt:active?'':R.stamp(now),channel:'企业微信',notificationStatus:'待接入',notificationAttempts:[]});
 }
}
function currentAlertRecords(){return (D.merchantAlertRecords||[]).filter(a=>a.org===S.org&&a.shop===currentShop()?.id);}
function adminHandledAlert(a){return ['channel-overdue','channel-unknown','split-delayed','after-exception','refund-failed','refund-unknown','refund-processing-overdue','split-exception','notification-failed'].includes(a.code);}
function orderReminders(o){
 const records=currentAlertRecords().filter(a=>a.order===o.id&&(a.active||['review-auto','acceptance-auto'].includes(a.code)));
 for(const a of syncAftersale(o))if((a.afterEvents||[]).includes('申请满48小时自动通过')&&!records.some(r=>r.code==='review-auto'&&r.afterId===a.id))records.push({code:'review-auto',title:'售后审核超期，已自动通过',order:o.id,afterId:a.id,section:'售后信息',active:false,deadline:a.afterApprovedAt,quantity:a.afterQty||0,severity:'info',message:'申请满 48 小时未处理，系统已自动通过；请跟进退款或买家退货进度。'});
 return records.sort((a,b)=>({danger:0,warning:1,info:2}[a.severity]??2)-({danger:0,warning:1,info:2}[b.severity]??2));
}
function adminIssueSummary(o){return ['订单：'+o.id,'商家：'+org().name,'店铺：'+currentShop().name,...currentAlertRecords().filter(a=>a.active&&a.order===o.id&&adminHandledAlert(a)).map(a=>a.title+'：'+a.message),'分账状态：'+o.split,'售后状态：'+o.after].join('\n');}
function contactSystemAdmin(id){const o=myOrders().find(o=>o.id===id);if(!isMerchant||!o)return;subdialog('联系系统管理员','<p>请复制问题信息，通过企业微信群联系系统管理员处理。</p><pre class="alert-message">'+esc(adminIssueSummary(o))+'</pre>'+btn('复制问题信息','copy-admin-issue',o.id,'btn primary'),'关闭');}
function ordersPage(){const base=myOrders(),matched=filteredOrders(base).filter(o=>inQuick(o,S.quick)),rows=orderGroupRows(matched);return merchantHeading('订单查询')+'<section class="card merchant-list-card"><div class="quick-filters order-status-tabs">'+orderQuick.map(q=>btn(esc(q)+'<b>'+orderGroupCount(base.filter(o=>inQuick(o,q)))+'</b>','quick',q,'quick-chip'+(S.quick===q?' active':''))).join('')+'</div>'+(S.quick==='退款/售后'?afterQuickFilters(base.filter(o=>inQuick(o,'退款/售后'))):'')+'<p class="scope-note">按子单筛选，展示命中订单及全部子单。</p>'+orderFilters()+resultStrip(orderGroupCount(rows))+(rows.length?merchantOrderTable(rows,new Set(matched.map(o=>o.id))):listEmpty(base,'订单'))+'</section>';}
function receiverInfo(o){return '<div class="receiver-info">'+(o.method==='快递配送'&&o.receiver?'<button type="button" class="receiver-copy" data-action="copy-receiver" data-id="'+esc(o.id)+'" title="复制收货信息" aria-label="复制收货信息">'+icon('copy')+'</button>':'')+(o.receiver?o.receiver.split('\n'):['现场交付','等待用户确认领取']).map(t=>'<div class="receiver-line">'+esc(t)+'</div>').join('')+'</div>';}
function orderStateMarkup(o,part){return '<span class="order-state-line">'+badge(part?partOrderStatus(o,part):orderStatus(o))+'</span>';}
function afterTypeLabel(type){return ({'极速退款':'未发货极速退款','退款（无需退货）':'仅退款'})[type]||type;}
function childOrderNumber(o){return esc(o.id)+' <button type="button" class="order-number-copy" data-action="copy-child-order" data-id="'+esc(o.id)+'" title="复制子单号" aria-label="复制子单号 '+esc(o.id)+'">'+icon('copy')+'</button>';}
function afterDisplay(o){return ['已退款','极速退款已完成'].includes(o.after)?'已退款':afterStage(o);}
function orderStatusParts(o){
 const refunded=Math.min(o.qty,Math.max(0,o.refundedQty||0)),completed=['已退款','极速退款已完成'].includes(o.after),afterQty=o.after==='无售后'||completed?0:Math.min(o.qty-refunded,Math.max(0,o.afterQty||0));
 const parts=[],normal=o.qty-refunded-afterQty;
 if(normal>0)parts.push({qty:normal,after:''});
 if(afterQty>0)parts.push({qty:afterQty,after:afterDisplay(o),type:o.afterType});
 if(refunded>0)parts.push({qty:refunded,after:'已退款',type:o.afterType});
 return parts.length?parts:[{qty:o.qty,after:o.after==='无售后'?'':completed?'已退款':afterDisplay(o),type:o.afterType}];
}
function partOrderStatus(o,part){if(part.after==='已退款')return '退款成功';if(part.after&&activeAftersale(o.after)&&part.after!=='已退款'&&!['已收货','已领取'].includes(o.delivery))return orderStatus({...o,delivery:o.afterDelivery||o.delivery});return orderStatus(o);}
function partAfter(o,part){
 if(!part.after)return '';
 const type=afterTypeLabel(part.type);
 const label=type&&part.after!=='已退款'?type+' · '+part.after:part.after;
 if(isMerchant&&!C.canAfter(o))return badge(label);
 return '<button type="button" class="item-after-link" data-action="order-after" data-id="'+esc(o.id)+'" aria-label="查看售后详情" aria-haspopup="dialog" title="查看售后详情">'+badge(label)+(R.cancellationReason(o,'after')?'<span class="tiny muted" data-cancellation-reason="after">'+esc(R.cancellationReason(o,'after'))+'</span>':'')+'<span class="after-detail-hint">查看详情 <span aria-hidden="true">›</span></span>'+'</button>';
}
const remarkColors=[['red','红色'],['yellow','黄色'],['green','绿色'],['blue','蓝色'],['purple','紫色']];
let orderRemarkEditor=null;
function remarkPreferences(o){const key=o.org+'|'+o.shop;D.merchantRemarkPreferences??={};return D.merchantRemarkPreferences[key]??={names:{},recent:[]};}
function remarkName(o,color){return remarkPreferences(o).names[color]||remarkColors.find(([value])=>value===color)?.[1]||'';}
function remarkFlag(color){const label=remarkColors.find(([value])=>value===color)?.[1];return label?'<span class="order-remark-flag remark-'+color+'" role="img" aria-label="'+label+'标记"></span>':'';}
function orderRemarkSummary(o,detail=false){
 const remark=o.merchantRemark||{},hasRemark=Boolean(remark.text||remark.color);
 if(!hasRemark&&!detail)return '';
 const summary=hasRemark?'<button type="button" class="order-remark-summary" data-action="order-remark" data-id="'+esc(o.id)+'" title="'+esc(remark.text||remarkName(o,remark.color))+'">'+(remark.color?'<span class="remark-summary-label">'+remarkFlag(remark.color)+esc(remarkName(o,remark.color))+'</span>':'')+(remark.text?'<span class="order-remark-text">'+esc(remark.text)+'</span>':'')+'</button>':'';
 return detail?'<div class="order-remark-detail"><strong>商家备注</strong>'+link(hasRemark?'修改备注':'添加备注','order-remark',o.id)+(summary||'<span class="muted">暂无备注</span>')+'</div>':summary;
}
function updateRemarkEditor(){
 if(!orderRemarkEditor)return;
 const color=$('#edit-form [name=remarkColor]:checked')?.value||'',name=orderRemarkEditor.names[color]||remarkColors.find(([value])=>value===color)?.[1]||'';
 for(const el of document.querySelectorAll('.remark-tag'))el.classList.toggle('selected',el.dataset.color===color);
 $('#remark-selected').innerHTML=color?'<span class="remark-selected-tag">'+remarkFlag(color)+'<span>'+esc(name)+'</span>'+'<button type="button" data-action="remark-remove-color" class="remark-tag-remove" aria-label="移除颜色标记">×</button>'+'</span>':'';
 const text=$('#edit-form [name=remarkText]').value;$('#remark-count').textContent=text.length+'/300';
 $('#remark-clear-text').hidden=!text;
}
function renderRecentRemarks(){
 if(!orderRemarkEditor)return;
 $('#remark-recent-items').innerHTML=orderRemarkEditor.recent.length?orderRemarkEditor.recent.map((text,i)=>'<button type="button" class="remark-recent-item" data-action="remark-reuse" data-id="'+i+'" title="'+esc(text)+'">'+esc(text)+'</button>').join(''):'<span class="remark-recent-empty">暂无最近备注</span>';
 $('#remark-clear-recent').disabled=!orderRemarkEditor.recent.length;
}
function finishRemarkName(input,cancel=false){
 if(!orderRemarkEditor||!input?.isConnected||input.dataset.finishing)return;
 input.dataset.finishing='true';
 const color=input.dataset.remarkLabel,value=input.value.trim(),fallback=remarkColors.find(([v])=>v===color)?.[1]||'';
 if(!cancel)orderRemarkEditor.names[color]=value||fallback;
 const name=orderRemarkEditor.names[color]||fallback,host=input.closest('.remark-name-editor');host.outerHTML='<span class="remark-color-name" data-remark-name="'+color+'">'+esc(name)+'</span>';updateRemarkEditor();
}
function editOrderRemark(id,anchor){
 const o=myOrders().find(x=>x.id===id);if(!isMerchant||!o)return;
 const remark=o.merchantRemark||{},prefs=remarkPreferences(o),fromDetail=Boolean($('.order-detail')),section=$('#overlay .order-detail')?'订单信息':'';
 orderRemarkEditor={id,names:{...prefs.names},recent:[...prefs.recent]};
 const colors=remarkColors.map(([value,label])=>{const name=prefs.names[value]||label;return '<div class="remark-tag'+(remark.color===value?' selected':'')+'" data-color="'+value+'"><label class="remark-choice"><input type="radio" name="remarkColor" value="'+value+'"'+(remark.color===value?' checked':'')+'>'+remarkFlag(value)+'<span class="remark-color-name" data-remark-name="'+value+'">'+esc(name)+'</span></label>'+btn(icon('edit'),'remark-edit-name',value,'remark-name-edit')+'</div>';}).join('');
 form('备注','<div class="remark-marks"><span class="remark-marks-title">标记</span><div class="order-remark-colors" role="radiogroup" aria-label="备注标记">'+colors+'</div></div><div class="remark-textarea-wrap"><div id="remark-selected"></div><div class="remark-textarea-inner"><textarea id="remark-text" name="remarkText" maxlength="300" rows="4" aria-label="备注内容" placeholder="仅平台客服和商家可见">'+esc(remark.text||'')+'</textarea><button type="button" id="remark-clear-text" data-action="remark-clear-text" aria-label="清空备注内容">×</button></div><output id="remark-count" for="remark-text">'+(remark.text||'').length+'/300</output></div><section class="remark-recent"><div class="remark-recent-head"><span>最近备注</span><button type="button" id="remark-clear-recent" data-action="remark-clear-recent" aria-label="清空最近备注" title="清空最近备注">'+icon('trash')+'</button></div><div id="remark-recent-items"></div></section>',data=>{
  if(!C.canProduct(product(o.product),'remark'))return '人员权限已更新。';
  const text=(data.remarkText||'').trim(),color=data.remarkColor||'',editor=orderRemarkEditor;
  if(text.length>300)return '备注最多填写 300 字。';
  if(color&&!remarkColors.some(([value])=>value===color))return '请选择有效的标记颜色。';
  for(const input of document.querySelectorAll('[data-remark-label]'))finishRemarkName(input);
  prefs.names={...editor.names};prefs.recent=text?[text,...editor.recent.filter(item=>item!==text)].slice(0,10):[...editor.recent];
  if(text||color)o.merchantRemark={text,color,who:S.member?'陈星':org().admin,updatedAt:R.stamp(Date.now())};else delete o.merchantRemark;
  record(o.id,text||color?'修改订单备注':'清空订单备注',o.project);closeOverlay();render();if(fromDetail&&!isOrderPage)openOrder(id,'订单信息');toast(text||color?'备注已保存':'备注已清空');
 },'保存');
 const panel=$('#overlay .dialog');panel.classList.add('order-remark-dialog');
 if(section)panel.dataset.returnSection=section;
 for(const button of panel.querySelectorAll('.remark-name-edit'))button.setAttribute('aria-label','编辑'+remarkName(o,button.dataset.id)+'标签名称');
 updateRemarkEditor();renderRecentRemarks();panel.querySelector('[name=remarkText]').focus();if(anchor?.closest('.merchant-orders'))anchorOrderDialog(anchor);
}
function merchantOrderTable(rows,matchedIds){
 const heads=['商品信息','订单状态','售后状态','数量','商品实付（元）','收货信息','操作'];
 const row=(cells,cls,id)=>'<tr class="'+cls+'" data-order="'+esc(id)+'">'+cells.map((v,i)=>'<td data-label="'+heads[i]+'"'+(i===1?' class="order-state-cell"':i===2?' class="after-state-cell"':i===3?' class="qty-cell"':'')+'>'+v+'</td>').join('')+'</tr>';
 const groupHeads=new Set();
 const body=rows.map(o=>{
  const groupId=orderGroupId(o),firstInGroup=!groupHeads.has(groupId);groupHeads.add(groupId);
  const p=product(o.product),pending=['待商家处理','待收货验收','待确认退款'].includes(afterStage(o)),parts=orderStatusParts(o),mixed=parts.length>1;
  const goods='<div class="order-goods"><div class="product-art art-'+p.art+'">'+['本','杯','袋'][p.art%3]+'</div><div>'+currentOrderProductLink(o,o.productName||p.name,'order-goods-name order-product-link')+'<small>商品 ID：'+esc(o.product)+'</small>'+(o.parentOrderId?'<small>子单号：'+childOrderNumber(o)+'</small>':'')+'<small>'+esc(o.sku||'—')+'</small>'+(C.canFullOrder(o)?'<small class="order-unit-price">'+money(o.unitPrice??o.paid/o.qty)+'</small>':'')+'<small>'+orderProductSnapshotLink(o)+'</small></div></div>';
  const header=firstInGroup?'<tr class="order-header-row" data-order-group="'+esc(groupId)+'"><td colspan="7"><div class="order-header"><span>订单编号：'+link(groupId,'order',o.id)+' '+link('复制','copy-order',o.id)+'</span><span class="spacer"></span><span class="tiny muted">下单时间：'+esc(o.date)+'</span></div></td></tr>':'';
  const quantity=String(o.qty);
  const actions='<div class="order-actions">'+(o.delivery==='待发货'?btn('发货','ship',o.id,'btn primary compact'):'')+(pending?(afterStage(o)==='待收货验收'?btn('收货验收','cp-inspect',o.id,'btn primary compact'):afterStage(o)==='待确认退款'?btn('确认退款','refund',o.id,'btn primary compact'):btn(C.canProduct(p,'afterApprove')?'处理售后':'查看售后','order-after',o.id,'btn primary compact')):'')+(o.method!=='快递配送'?'<span class="pickup-order-note">现场领取</span>':'')+link('查看详情','order',o.id)+'<div class="order-remark-action">'+link(o.merchantRemark?.text||o.merchantRemark?.color?'修改备注':'添加备注','order-remark',o.id)+orderRemarkSummary(o)+'</div></div>';
  const main=row([goods+(matchedIds&&!matchedIds.has(o.id)?'<small class="order-unmatched-note">非当前筛选条件</small>':''),mixed?'':orderStateMarkup(o),mixed?'':partAfter(o,parts[0]),quantity,C.canFullOrder(o)?money(o.paid):'—',C.canReceiver(o)?receiverInfo(o):'—',actions],'order-detail-row',o.id);
  const details=mixed?parts.map(part=>row(['',orderStateMarkup(o,part)+(matchedIds&&matchedIds.has(o.id)&&!partMatchesOrderQuery(o,part,f())?'<small class="order-unmatched-note">非当前筛选条件</small>':''),partAfter(o,part),String(part.qty),C.canFullOrder(o)?money(round(o.paid/o.qty*part.qty)):'—','',''],'order-status-part-row',o.id)).join(''):'';
  const packages=o.shipments||[],latest=packages.flatMap(pkg=>(pkg.events||[]).map(event=>({...event,pkg}))).sort((a,b)=>String(b.time).localeCompare(String(a.time)))[0];
  const logistics=packages.length&&C.canReceiver(o)?'<tr class="order-logistics-row" data-order="'+esc(o.id)+'"><td colspan="7"><div class="order-logistics-summary"><strong>物流信息</strong><span>'+esc((latest?.pkg||packages[0]).carrier)+' '+esc((latest?.pkg||packages[0]).waybill)+' '+link('复制','copy-waybill',(latest?.pkg||packages[0]).waybill)+'</span><span class="logistics-latest">'+esc(latest?.text||'已登记发货，等待物流更新')+'</span><time>'+esc(latest?.time||'')+'</time>'+link(packages.length>1?'查看 '+packages.length+' 个包裹':'查看物流','order-logistics',o.id)+'</div></td></tr>':'';
  return header+main+details+logistics;
 }).join('');
 return '<div class="merchant-orders"><div class="table-wrap" tabindex="0" aria-label="订单列表"><table><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div><div class="table-footer"><span>共 '+orderGroupCount(rows)+' 笔订单</span><span>全部记录已展示</span></div></div>';
}
function orderTable(rows){if(isMerchant)return merchantOrderTable(rows);return table(['订单 / 商品','实付 / 下单时间','支付 / 交付','售后情况','分账状态','操作'],rows.map(o=>tr([link(o.id,'order',o.id)+'<div class="tiny muted" style="margin-top:7px">'+esc(product(o.product)?.name||'商品快照')+' × '+o.qty+'</div>',money(o.paid)+'<div class="tiny muted" style="margin-top:7px">'+o.date+'</div>',badge(o.payment)+'<div style="margin-top:7px">'+badge(o.delivery)+'</div>',badge(o.after),badge(orderSplitStatus(o)),link('详情','order',o.id)])));}
function settlementTable(rows){return table(['订单号 / 商品','商家 / 店铺','实付金额','退款金额',isMerchant?'应分金额':'本组织应收',isMerchant?'已分金额':'本组织已到账','分账状态','明细'],rows.map(o=>tr([link(o.id,'order',o.id)+'<div class="tiny muted" style="margin-top:7px">'+esc(product(o.product)?.name)+'</div>',esc(D.organizations.find(x=>x.id===o.org)?.name)+'<div class="tiny muted">'+esc(D.shops.find(x=>x.id===o.shop)?.name)+'</div>',money(o.paid),money(o.refund),money(isMerchant?o.paid-o.refund:R.fundDue(o)),money(isMerchant?o.settled:o.fundSettled),badge(orderSplitStatus(o)),link(S.expanded===o.id?'收起':'展开','expand',o.id)])+(S.expanded===o.id?'<tr class="subrow"><td colspan="8">'+splitTable(o)+'</td></tr>':'')));}
function activeAftersale(after){return R.activeAftersale(after);}
function shippingUnitIndexes(o){return R.shippingUnitIndexes(o);}
function canShipOrder(id){const o=D.orders.find(o=>o.id===id);return Boolean(o&&o.method==='快递配送'&&shippingUnitIndexes(o).length);}
function deliveryQuantity(o){
 if(o.delivery==='待发货'||o.delivery==='待领取')return shippingUnitIndexes(o).length;
 const shipments=o.shipments||[];
 return shipments.length&&shipments.every(s=>Number.isInteger(s.qty))?shipments.reduce((sum,s)=>sum+s.qty,0):Math.max(0,o.qty-(o.refundedQty||0));
}
function orderSplitStatus(o){const status=activeAftersale(o.after)&&!['分账成功','分账处理中','结果待确认',...(isMerchant?['处理中','分账异常','需另行结算']:[])].includes(o.split)?'售后暂停':o.split;return isMerchant?R.splitCategory(status):status;}
function splitDeadlineLabel(after){return activeAftersale(after)?'原分账截止时间':'分账截止时间';}
function orderSplitPlan(o){
 const p=o.splitPlanSnapshot;
 return p&&p.product===o.product&&p.productVersionId===o.productVersionId&&p.version===o.plan&&p.skus?.some(s=>s.name===o.sku)?p:null;
}
function orderSplitPlanLink(o){if(isMerchant&&!C.canReadSplit(o))return '';
 const p=orderSplitPlan(o);
 return p?'<button type="button" class="link order-split-version-link" data-action="order-split-plan" data-id="'+esc(o.id)+'" aria-haspopup="true" aria-label="分账版本 '+esc(p.version)+'，悬浮预览，点击查看商品快照分账计划">'+esc(p.version)+'</button>':'<span class="tiny muted">版本快照待核实</span>';
}
function orderSplitVersion(o){return '<div class="order-split-version">分账版本：'+orderSplitPlanLink(o)+'</div>';}
function splitPlanAmount(plan,r){return plan.mode==='random'?(r.role==='foundation'?'按金额池逐件取数':'商品单价扣除每件公益金额'):money(r.amount);}
function splitPlanRecipientTable(plan,sku){return table(['接收方','每件金额'],sku.recipients.map(r=>tr([esc(splitOrganizationLabel(r)),esc(splitPlanAmount(plan,r))])),false);}
function orderSplitRows(o,indexes){
 const p=orderSplitPlan(o),sku=p?.skus.find(s=>s.name===o.sku);if(!sku)return null;
 const refunded=new Set(R.refundedIndexes(o)),settled=new Set(R.settledIndexes(o)),legacy=R.recipientPaid(o);
 return sku.recipients.map(r=>{
  const allocation=o.splitAllocations?.find(a=>a.recipientId===r.id),amounts=allocation?.unitAmounts;
  const unitCents=i=>Array.isArray(amounts)?R.cents(amounts[i]):p.mode==='fixed'?R.cents(r.amount):NaN;
  const planned=indexes.reduce((sum,i)=>sum+unitCents(i),0),due=indexes.filter(i=>!refunded.has(i)).reduce((sum,i)=>sum+unitCents(i),0);
  const result=o.splitRecipientResults?.find(x=>x.recipientId===r.id);
  let paid=0;
  if(Array.isArray(result?.unitAmounts))paid=indexes.reduce((sum,i)=>sum+R.cents(result.unitAmounts[i]||0),0);
  else{
   const total=R.cents(result?.paid??(allocation?.paidSource!=null?legacy[allocation.paidSource]:0));
   const candidates=Array.from({length:o.qty},(_,i)=>i).filter(i=>!refunded.has(i));
   const weights=candidates.map(i=>({i,weight:settled.size&&!settled.has(i)?0:unitCents(i)})),sum=weights.reduce((n,x)=>n+x.weight,0);
   const shares=weights.map(x=>{const value=sum?total*x.weight/sum:0;return {i:x.i,cents:Math.floor(value),fraction:value-Math.floor(value)};});
   let remainder=total-shares.reduce((n,x)=>n+x.cents,0);
   if(sum)[...shares].sort((a,b)=>b.fraction-a.fraction).forEach(x=>{if(remainder>0){x.cents++;remainder--;}});
   paid=shares.filter(x=>indexes.includes(x.i)).reduce((n,x)=>n+x.cents,0);
  }
  return {...r,planned:planned/100,due:due/100,paid:paid/100,status:result?.status,units:p.mode==='random'?indexes.map(i=>({index:i,amount:unitCents(i)/100})):[]};
 });
}
function splitRecipientStatus(r,status){return status==='分账取消'?status:r.paid>0?(r.paid>=r.due?'分账成功':'部分到账'):status==='售后暂停'?status:r.status||status;}
function splitRecipientRows(rows,status){return rows.map(r=>tr([esc(splitOrganizationLabel(r)),(Number.isFinite(r.due)?money(r.due):'待核实')+(r.planned!==r.due?'<div class="tiny muted">原计划：'+(Number.isFinite(r.planned)?money(r.planned):'待核实')+'</div>':'')+(r.units?.length?'<div class="tiny muted">'+r.units.map(u=>'第 '+(u.index+1)+' 件计划：'+(Number.isFinite(u.amount)?money(u.amount):'待核实')).join('；')+'</div>':''),badge(R.splitCategory(splitRecipientStatus(r,status)))]));}
function partialSplitTable(o){
 const count=Math.max(0,Number(o.refundedQty||0)),refunded=new Set(o.refundedUnitIndexes||Array.from({length:count},(_,i)=>o.qty-1-i)),units=R.unitTimelines(o,demoNow.getTime());
 const active=activeAftersale(o.after),remaining=units.map(u=>u.index),affected=new Set(active?(o.afterUnitIndexes||remaining.slice(0,o.afterQty||0)):[]);
 // Retain a separate aftersale group for resolved/cancelled applications too.
 if(!active&&!refunded.size)remaining.slice(0,o.afterQty||0).forEach(i=>affected.add(i));
 const groups=[{name:'正常商品',indexes:remaining.filter(i=>!affected.has(i)),after:false},{name:'售后商品',indexes:remaining.filter(i=>affected.has(i)),after:true},{name:'售后商品',indexes:[...refunded],after:true,refunded:true}].filter(g=>g.indexes.length);
 groups.forEach(g=>{g.rows=orderSplitRows(o,g.indexes)||[];});
 return groups.map(g=>{
  const timing=R.timeline({...o,qty:g.indexes.length,refundedQty:0,after:g.after?o.after:'无售后',split:o.split==='售后暂停'&&!g.after?'待分账':o.split},demoNow.getTime());
  const rawStatus=g.refunded?'分账取消':g.after&&active?'售后暂停':g.rows.reduce((a,r)=>a+r.paid,0)>0?(round(g.rows.reduce((a,r)=>a+r.paid,0))>=round(g.rows.reduce((a,r)=>a+r.due,0))?'分账成功':'部分到账'):o.split==='售后暂停'?'待分账':o.split;
  const status=R.splitCategory(rawStatus);
  const refundRefs=g.refunded?(o.aftersales||[]).filter(a=>['已退款','极速退款已完成','退款成功'].includes(a.after)&&(a.afterUnitIndexes||(a.id===o.afterId?[...refunded]:[])).some(i=>g.indexes.includes(i))).map(a=>a.id):[];
  const detail=g.refunded?kv([['对应商品',g.indexes.map(i=>'第 '+(i+1)+' 件').join('、')],['取消原因',R.cancellationReason(o,'split')],...(refundRefs.length?[['关联退款售后',refundRefs.join('、')]]:[])]):kv([['公益模式',o.donationMode==='random'?'随机随单捐':'固定份额'],[splitDeadlineLabel(g.after?o.after:'无售后'),timing.splitAt||'等待有效收货记录']]);
  return '<section class="order-split-group" data-split-group="'+(g.refunded?'refunded':g.after?'after':'normal')+'"><h4>'+g.name+' · '+g.indexes.length+' 件 '+badge(status)+(!g.after&&!g.refunded?wechatDeadlineInfo(o):'')+'</h4>'+detail+table(['接收方','应收金额','执行情况'],splitRecipientRows(g.rows,status),false)+'</section>';
 }).join('');
}
function splitExceptionInfo(o){return isMerchant&&['分账异常','结果待确认','需另行结算'].includes(o.split)?'<p class="notice" data-split-exception>分账类别：'+esc(R.splitCategory(o.split))+'；'+(o.split==='分账异常'?'请联系系统管理员处理。':esc(o.split)+'，请联系系统管理员核实处理。')+' '+link('联系系统管理员','contact-system-admin',o.id)+'</p>':'';}
function splitTable(o){if(isMerchant&&!C.canReadSplit(o))return '';
 if(o.payment!=='支付成功')return '<p class="muted">暂无分账记录</p>';
 if(isMerchant&&!orderSplitPlan(o))return orderSplitVersion(o)+'<p class="hint">订单分账版本及接收方快照待核实，请联系系统管理员。</p>';
 if(isMerchant&&(o.refundedQty>0||o.after!=='无售后'&&Number(o.afterQty||0)>0&&Number(o.afterQty||0)<o.qty))return orderSplitVersion(o)+splitExceptionInfo(o)+partialSplitTable(o);
 const n=o.qty-o.refundedQty,fund=R.fundDue(o),random=o.donationMode==='random';
 const recipients=[[org().name,fund,o.fundSettled]];
 const timing=R.timeline(o,demoNow.getTime());
 const title=isMerchant?'<h4 class="order-split-heading">'+(o.after==='无售后'?'正常商品':'售后商品')+' · '+(n||o.qty)+' 件 '+badge(orderSplitStatus(o))+wechatDeadlineInfo(o)+'</h4>':'<h3 class="section-title">订单快照 · 分账计划 '+esc(o.plan)+'</h3>';
 const details=kv([['公益模式',random?'随机随单捐':'固定份额'],[isMerchant?splitDeadlineLabel(o.after):'原分账截止时间',timing.splitAt||'等待有效收货记录'],...(isMerchant?[]:[['分账条件',timing.paused?'对应数量待处理，原截止时间继续计时':timing.canSplit?'已满足时间条件，待分账':'等待原截止时间']])]);
 const heads=isMerchant?['接收方','应收金额','执行情况']:['接收方','应收金额','已到账','待结算','执行情况'];
 const savedRows=isMerchant?orderSplitRows(o,Array.from({length:o.qty},(_,i)=>i)):null;
 const rows=isMerchant?splitRecipientRows(savedRows||[],orderSplitStatus(o)):recipients.map(([name,due,paid])=>tr([splitOrganizationView(name),money(due),money(paid),money(round(due-paid)),badge(paid?(paid>=due?'分账成功':'部分到账'):orderSplitStatus(o))]));
 return (isMerchant?orderSplitVersion(o):'')+splitExceptionInfo(o)+title+details+table(heads,rows,!isMerchant);
}

const settlementRanges=['实时','昨日','7日','30日','周','月','自定义'];
const settlementExpanded=new Set(),settlementInitialized=new Set();
const settlementGroupKey=(orgId,productId='')=>[S.org,orgId,productId].filter(Boolean).join(':');
function settlementPeriod(query=f()){
 const mode=query.settlementRange||'实时';
 if(mode==='自定义')return {from:query.from||'',to:query.to||''};
 const end=new Date(demoNow),start=new Date(demoNow);start.setHours(0,0,0,0);
 if(mode!=='实时'){
  end.setDate(end.getDate()-1);end.setHours(23,59,59,999);start.setTime(end.getTime());start.setHours(0,0,0,0);
  if(mode==='7日'||mode==='30日')start.setDate(start.getDate()-(mode==='7日'?6:29));
  if(mode==='周'){end.setTime(demoNow.getTime());end.setHours(23,59,59,999);end.setDate(end.getDate()-(end.getDay()+6)%7-1);start.setTime(end.getTime());start.setHours(0,0,0,0);start.setDate(start.getDate()-6);}
  if(mode==='月'){end.setTime(demoNow.getTime());end.setDate(0);end.setHours(23,59,59,999);start.setTime(end.getTime());start.setDate(1);start.setHours(0,0,0,0);}
 }
 return {from:dateValue(start).slice(0,10),to:mode==='实时'?dateValue(end):dateValue(end).slice(0,10)};
}
function settlementOrderFilter(id){const order=myOrders().find(o=>o.id===id),date=order?.date.slice(0,10);if(order){settlementExpanded.add(settlementGroupKey(order.org));settlementExpanded.add(settlementGroupKey(order.org,order.product));}return date?{q:id,settlementRange:'自定义',from:date,to:date}:{q:id};}
function settlementScopedRows(rows){const query=f();return rows.filter(o=>(!query.settlementOrg||o.org===query.settlementOrg)&&(!query.settlementProduct||o.product===query.settlementProduct));}
function settlementScopeFilters(){
 const query=f(),orders=myOrders(),organizations=[...new Set(orders.map(o=>o.org))],products=new Map();
 for(const o of orders)if(!query.settlementOrg||o.org===query.settlementOrg)products.set(o.product,o.productName||product(o.product)?.name||o.product);
 return '<form id="settlement-scope-form" class="settlement-scope-filters" aria-label="分账统计范围">'+select('组织','settlementOrg',organizations.map(id=>[id,D.organizations.find(o=>o.id===id)?.name||id]),query.settlementOrg,true)+select('商品','settlementProduct',[...products],query.settlementProduct,true)+btn('查看全部','settlement-scope','','link')+'</form>';
}
function applySettlementScope(orgId='',productId=''){
 const orders=myOrders();if(productId){const order=orders.find(o=>o.product===productId&&(!orgId||o.org===orgId));if(!order)return;orgId=order.org;}
 if(orgId&&!orders.some(o=>o.org===orgId))return;
 S.filters[filterKey()]={...f(),settlementOrg:orgId,settlementProduct:productId};
 if(orgId)settlementExpanded.add(settlementGroupKey(orgId));render();
}
function settlementHierarchy(rows){
 if(!settlementInitialized.has(S.org)){for(const order of myOrders())settlementExpanded.add(settlementGroupKey(order.org));settlementInitialized.add(S.org);}
 const groups=new Map(),body=[];
 for(const o of rows){if(!groups.has(o.org))groups.set(o.org,new Map());const products=groups.get(o.org);if(!products.has(o.product))products.set(o.product,[]);products.get(o.product).push(o);}
 const amounts=orders=>{const a=amountRows(orders);return [money(a.paid),money(a.refund),money(a.due),money(a.settled),money(round(a.due-a.settled))];};
 const groupRow=(orgId,productId,orders,label,note)=>{
  const key=settlementGroupKey(orgId,productId),open=settlementExpanded.has(key),level=productId?'product':'organization';
  const toggle='<button type="button" class="settlement-tree-toggle" data-action="settlement-group" data-id="'+esc(key)+'" aria-expanded="'+open+'" aria-label="'+(open?'收起':'展开')+esc(label)+'"><svg class="context-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>';
  const choose='<span class="settlement-tree-name">'+esc(label)+'</span>';
  const first='<div class="settlement-tree-label">'+toggle+'<div>'+choose+'<div class="tiny muted">'+esc(note)+'</div></div></div>';
  return tr([first,...amounts(orders),'']).replace('<tr>','<tr class="settlement-group-row settlement-'+level+'-row" data-settlement-org="'+esc(orgId)+'" data-settlement-product="'+esc(productId)+'" data-settlement-level="'+level+'" data-settlement-group="'+esc(key)+'">');
 };
 for(const [orgId,products]of groups){
  const orders=[...products.values()].flat(),organization=D.organizations.find(o=>o.id===orgId);
  body.push(groupRow(orgId,'',orders,organization?.name||orgId,products.size+' 款商品 · '+orders.length+' 笔订单'));
  if(!settlementExpanded.has(settlementGroupKey(orgId)))continue;
  for(const [productId,orders]of products){
   body.push(groupRow(orgId,productId,orders,orders[0].productName||product(productId)?.name||productId,orders.length+' 笔订单'));
   if(!settlementExpanded.has(settlementGroupKey(orgId,productId)))continue;
   for(const o of orders){
    body.push(tr(['<div class="settlement-order-label">'+link(o.id,'order',o.id)+'<div class="tiny muted">'+esc(o.date)+' · '+esc(D.shops.find(s=>s.id===o.shop)?.name||o.shop)+'</div></div>',...amounts([o]),badge(orderSplitStatus(o))+'<div class="settlement-order-actions">'+btn(S.expanded===o.id?'收起分账':'展开分账','expand',o.id,'link')+'</div>']).replace('<tr>','<tr data-settlement-org="'+esc(orgId)+'" data-settlement-product="'+esc(productId)+'" data-settlement-level="order" data-settlement-order="'+esc(o.id)+'">'));
    if(S.expanded===o.id)body.push('<tr class="subrow settlement-split-row" data-settlement-org="'+esc(orgId)+'" data-settlement-product="'+esc(productId)+'" data-settlement-order="'+esc(o.id)+'"><td colspan="7">'+splitTable(o)+'</td></tr>');
   }
  }
 }
 return '<div class="settlement-tree">'+table(['组织 / 商品 / 订单','实付金额','退款金额','本组织应收','本组织已到账','待结算','状态 / 操作'],body,false)+'</div><div class="table-footer"><span>共 '+groups.size+' 个组织 · '+[...groups.values()].reduce((n,g)=>n+g.size,0)+' 款商品 · '+rows.length+' 笔订单</span></div>';
}
function settlementTrend(rows){
 const period=settlementPeriod(),start=new Date(period.from.slice(0,10)+'T00:00:00'),end=new Date(period.to.slice(0,10)+'T00:00:00'),days=Math.round((end-start)/86400000)+1;
 const hourly=days===1,monthly=days>90,yearStep=Math.max(1,Math.ceil((end.getFullYear()-start.getFullYear()+1)/60)),yearly=days>3660,points=[];
 const key=date=>hourly?date.slice(0,13):yearly?String(start.getFullYear()+Math.floor((Number(date.slice(0,4))-start.getFullYear())/yearStep)*yearStep):monthly?date.slice(0,7):date.slice(0,10);
 if(hourly){const hours=(f().settlementRange||'实时')==='实时'?demoNow.getHours()+1:24;for(let i=0;i<hours;i++){const hour=String(i).padStart(2,'0');points.push({key:period.from.slice(0,10)+'T'+hour,label:hour+':00',orders:[]});}}
 else{const date=new Date(start);if(monthly)date.setDate(1);if(yearly)date.setMonth(0,1);while(date<=end){const value=dateValue(date),label=yearly?String(date.getFullYear()):monthly?value.slice(0,7):value.slice(5,10);points.push({key:key(value),label,orders:[]});if(yearly)date.setFullYear(date.getFullYear()+yearStep);else if(monthly)date.setMonth(date.getMonth()+1);else date.setDate(date.getDate()+1);}}
 const buckets=new Map(points.map(p=>[p.key,p]));for(const o of rows)buckets.get(key(o.date.replace(' ','T')))?.orders.push(o);
 for(const point of points){const a=amountRows(point.orders);point.due=a.due;point.settled=a.settled;point.pending=round(a.due-a.settled);}
 const series=[['due','应收分账','#267457'],['settled','已到账分账','#4789c0'],['pending','待结算分账','#bc883d']],values=points.flatMap(p=>series.map(([k])=>p[k])),minimum=Math.min(0,...values),maximum=Math.max(1,...values),span=maximum-minimum;
 const x=i=>84+(points.length===1?438:i/(points.length-1)*876),y=value=>224-(value-minimum)/span*188,axis=value=>Math.abs(value)>=10000?(value/10000).toFixed(1)+'万':value.toLocaleString('zh-CN',{maximumFractionDigits:2});
 const grid=Array.from({length:5},(_,i)=>{const value=minimum+span*i/4,py=y(value);return '<line x1="84" x2="960" y1="'+py+'" y2="'+py+'" class="settlement-gridline"/><text x="74" y="'+(py+4)+'" text-anchor="end">'+esc(axis(value))+'</text>';}).join('');
 const curves=series.map(([name,label,color],seriesIndex)=>'<g class="settlement-trend-series" data-series="'+name+'" style="--series-color:'+color+'"><polyline fill="none" stroke="'+color+'" stroke-width="2"'+(seriesIndex===2?' stroke-dasharray="6 4"':'')+' points="'+points.map((p,i)=>x(i)+','+y(p[name])).join(' ')+'"/>'+points.map((p,i)=>'<circle cx="'+x(i)+'" cy="'+y(p[name])+'" r="3" fill="'+color+'" tabindex="0" data-value="'+p[name]+'" aria-label="'+esc(p.key.replace('T',' ')+' '+label+' '+money(p[name]))+'"><title>'+esc(p.key.replace('T',' ')+' '+label+'：'+money(p[name]))+'</title></circle>').join('')+'</g>').join('');
 const labels=[...new Set(Array.from({length:Math.min(7,points.length)},(_,i)=>Math.round(i*(points.length-1)/Math.max(1,Math.min(7,points.length)-1))))].map(i=>'<text x="'+x(i)+'" y="252" text-anchor="middle">'+esc(points[i].label)+'</text>').join('');
 return '<section class="card settlement-trend"><div class="settlement-trend-head"><div><h2>分账趋势</h2><p class="tiny muted">按下单时间'+(hourly?'分小时':yearly?'每 '+yearStep+' 年':monthly?'分月':'分日')+'汇总订单当前分账金额 · 单位：元</p></div><div class="settlement-chart-legend">'+series.map(([name,label,color])=>'<span><i style="background:'+color+'"></i>'+label+'</span>').join('')+'</div></div>'+(!rows.length?'<p class="settlement-chart-empty">当前筛选范围暂无订单</p>':'')+'<div class="settlement-chart-scroll"><svg class="settlement-chart" viewBox="0 0 1000 270" role="img" aria-label="应收、已到账及待结算分账金额趋势"><title>分账趋势</title>'+grid+curves+labels+'</svg></div></section>';
}
function settlementDatebar(){
 const query=f(),mode=query.settlementRange||'实时',period=settlementPeriod(query),today=dateValue(demoNow).slice(0,10);
 return '<section class="card settlement-overview"><div class="settlement-overview-head"><h2>分账概况</h2><span class="tiny muted">统计时间：'+esc(dateValue(demoNow).replace('T',' ').slice(0,16))+'</span></div><div class="settlement-time-row"><span class="tiny muted">下单时间：'+esc(period.from)+' 至 '+esc(period.to.replace('T',' '))+'</span><div class="settlement-datebar" role="group" aria-label="分账对账时间筛选">'+settlementRanges.map(name=>'<button type="button" class="btn'+(name===mode?' selected':'')+'" data-action="settlement-range" data-id="'+name+'" aria-pressed="'+(name===mode)+'">'+name+'</button>').join('')+'</div></div>'+(mode==='自定义'?'<form id="settlement-date-form" class="settlement-custom-dates"><label>开始日期<input type="date" name="from" aria-label="下单开始日期" value="'+esc(period.from.slice(0,10))+'" max="'+today+'" required></label><span>至</span><label>结束日期<input type="date" name="to" aria-label="下单结束日期" value="'+esc(period.to.slice(0,10))+'" max="'+today+'" required></label><button class="btn primary" type="submit">查询</button><span class="settlement-date-error" role="alert"></span></form>':'')+settlementScopeFilters()+'</section>';
}
function settlementPage(){const query=f(),period={settlementRange:query.settlementRange,from:query.from,to:query.to},scoped=settlementScopedRows(filteredOrders(myOrders(),period)),rows=settlementScopedRows(filteredOrders(myOrders()));return heading('分账对账','查询本基金会关联订单、应收份额与到账记录。')+settlementDatebar()+metrics(scoped,true)+settlementTrend(scoped)+'<section class="card settlement-details"><div class="card-head"><div><h2>分账明细</h2><p class="subtitle">按组织、商品逐层展开，查看订单及分账记录。</p></div></div>'+orderFilters()+summary(rows)+settlementHierarchy(rows)+'</section>';}
function customerServiceDescription(p,shop=D.shops.find(s=>s.id===p?.shop)||currentShop()){
 const result=CS.resolve(p,shop),a=result.account;
 return a?esc(a.name)+'<span class="tiny muted"> · 账号 ID：'+esc(a.id)+' · 接待人员：'+esc(a.servicers.join('、'))+(result.fallback?' · 使用平台兜底客服':'')+'</span>':'<span class="danger-note">暂无可用客服，请联系平台管理员配置。</span>';
}
function customerServiceTest(id=''){
 if(!isMerchant||!currentShop())return;
 const p=id?scopedProduct(id):null;if(id&&!p)return;
 const edit=$('#edit-form [name=customerServiceId]'),shopId=currentShop().id,owner=S.org;
 const requestedId=()=>edit?edit.value.trim():p?.customerServiceId||currentShop()?.customerServiceId||CS.config().fallbackId;
 let verifiedId='',verifiedAccount=null;
 subdialog('客服账号测试','<div class="customer-test"><p class="tiny muted">原型演示：账号验证与消息送达回执使用示例数据。</p><section class="customer-test-step"><div class="customer-test-step-head"><h3>1. 验证账号</h3><button type="button" class="btn" id="customer-test-verify">验证账号</button></div><p class="tiny muted">获取客服账号信息，确认账号存在且可用。</p><div id="customer-test-account" aria-live="polite"></div></section><section class="customer-test-step"><div class="customer-test-step-head"><h3>2. 测试消息送达</h3><button type="button" class="btn" id="customer-test-open" disabled>打开客户端客服页</button></div><p class="tiny muted">验证账号后，进入客户端客服页发送消息并查看送达回执。</p><div id="customer-test-client" hidden><div class="customer-test-client-head"></div><div class="customer-test-messages" role="log" aria-live="polite"></div><label for="customer-test-message" class="tiny">测试消息</label><div class="shop-customer-input"><input id="customer-test-message" maxlength="200" placeholder="请输入测试消息"><button type="button" class="btn primary" id="customer-test-send">发送</button></div></div><p id="customer-test-result" class="tiny" role="status"></p></section></div>','关闭');
 const panel=$('#secondary'),account=panel.querySelector('#customer-test-account'),open=panel.querySelector('#customer-test-open'),client=panel.querySelector('#customer-test-client'),result=panel.querySelector('#customer-test-result');
 const clear=()=>{verifiedId='';verifiedAccount=null;open.disabled=true;client.hidden=true;client.querySelector('.customer-test-messages').replaceChildren();client.querySelector('input').value='';result.textContent='';};
 const current=()=>S.org===owner&&currentShop()?.id===shopId&&(!edit||edit.isConnected);
 panel.querySelector('#customer-test-verify').addEventListener('click',()=>{
  clear();if(!current()){account.textContent='当前店铺已变化，请重新打开测试。';return;}
  const checked=CS.verify(requestedId());
  if(checked.error){account.textContent=checked.error;return;}
  verifiedAccount=checked.account;verifiedId=verifiedAccount.id;
  account.innerHTML='<p class="customer-test-success">账号验证通过（示例数据）</p>'+kv([['接待客服',verifiedAccount.name],['客服账号 ID（open_kfid）',verifiedAccount.id],['接待人员',CS.staff(verifiedAccount)],['客服链接',verifiedAccount.url]]);open.disabled=false;
 });
 open.addEventListener('click',()=>{
  if(!current()||!verifiedAccount||requestedId()!==verifiedId){clear();account.textContent='账号或店铺已变化，请重新验证。';return;}
  client.hidden=false;client.querySelector('.customer-test-client-head').textContent='客户端客服页 · '+verifiedAccount.name;client.querySelector('input').focus();
 });
 const send=()=>{
  if(!current()||!verifiedAccount||requestedId()!==verifiedId){clear();account.textContent='账号或店铺已变化，请重新验证。';return;}
  const checked=CS.verify(verifiedId);if(checked.error){clear();account.textContent=checked.error;return;}
  const input=client.querySelector('input'),message=input.value.trim();if(!message){result.textContent='请输入测试消息。';return;}
  const bubble=document.createElement('div');bubble.className='customer-test-message';
  const text=document.createElement('p'),receipt=document.createElement('span');text.textContent=message;receipt.className='tiny customer-test-success';receipt.textContent='已送达（模拟回执）';bubble.append(text,receipt);client.querySelector('.customer-test-messages').appendChild(bubble);
  input.value='';result.textContent='消息已送达 '+verifiedAccount.name+'（原型演示）。';
 };
 panel.querySelector('#customer-test-send').addEventListener('click',send);
 panel.querySelector('#customer-test-message').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();send();}});
 if(edit){const changed=()=>{clear();account.textContent='账号已修改，请重新验证。';};edit.addEventListener('input',changed);panel.onSecondaryClose=()=>edit.removeEventListener('input',changed);}
}

function customerServiceDirectory(){
 if(!isMerchant||!currentShop())return;
 subdialog('客服账号与接待人员','<p>平台企业 ID：'+esc(CS.config().corpId)+'</p><p class="tiny muted">平台管理员在企业微信后台创建微信客服账号，并将负责此店铺的成员添加为接待人员。工作台每 5 分钟自动更新，填写账号 ID 提交时即时校验。</p>'+table(['客服名称','客服账号 ID（open_kfid）','接待人员（成员 UserID）','客服链接'],CS.accounts().filter(a=>CS.available(a)).map(a=>tr([esc(a.name),esc(a.id),esc(CS.staff(a)),esc(a.url)])),false),'关闭');
 $('#secondary .dialog').classList.add('customer-directory-dialog');
}
function updateProductCustomerService(){const select=$('#pe-customer-service'),summary=$('#pe-customer-service-summary');if(select&&summary){const id=select.value.trim();summary.innerHTML=id&&!CS.account(id)?'提交时校验账号并读取客服名称、链接及接待人员。':customerServiceDescription({customerServiceId:id});}}
function shopPage(){
 const s=currentShop();
 if(!s)return heading('店铺管理','')+'<section class="card"><div class="empty">'+icon('shop')+'<p>当前商家尚未开通店铺</p>'+(C.manage()?btn('立即开店','shop-draft','','btn primary'):'')+'</div></section>';
 const names=['基本信息','经营资质','客服配置','捐赠协议'];
 S.tab=names.includes(S.tab)?S.tab:'基本信息';
 const edit=()=>'';
 const row=(label,value,action='',raw=false)=>'<div class="shop-info-row"><dt>'+esc(label)+'</dt><dd><div class="shop-info-value">'+(raw?value:esc(value||'未填写'))+'</div>'+(action?'<div class="shop-info-action">'+action+'</div>':'')+'</dd></div>';
 const group=(title,rows,extra='')=>'<section class="shop-info-group">'+(title?'<h2>'+esc(title)+'</h2>':'')+'<dl>'+rows+'</dl>'+extra+'</section>';
 const bodies={};
 bodies['基本信息']=group('基础信息',row('店铺名称',s.name,edit('修改','name'))+row('店铺编号',s.id)+row('开店时间',s.openedAt||'2026-10-20')+row('店铺类型',s.kind)+row('主营类目',s.category,edit('修改','category'))+row('店铺 logo',s.logo?'<img class="shop-logo" src="'+esc(s.logo)+'" alt="店铺 logo">':'未上传','',true)+row('店铺简介',s.intro,edit(s.intro?'修改':'添加简介','intro')));
 {
  const a=CS.account(s.customerServiceId);
  bodies['客服配置']=group('',row('客服账号 ID（open_kfid）',s.customerServiceId||'未配置',a&&a.id!==CS.config().fallbackId?btn('测试咨询','customer-service-test','','link'):'')+row('客服链接',a?.url)+row('接待人员（成员 UserID）',a?CS.staff(a):'未配置'),'<p class="tiny muted shop-customer-note">各店铺共用平台企业 ID。平台在企业微信后台创建各店铺客服账号并添加接待成员，填写账号 ID 后提交校验；商品可另行填写接待客服 ID。</p>'+btn('查看客服账号与接待人员','customer-service-directory','','link'))+group('退换货信息',row('退换货地址',s.returnAddress||D.products.find(p=>p.shop===s.id)?.returnAddress,edit('修改','return')));
 }
 bodies['经营资质']=shopQualificationSection(s);
 bodies['捐赠协议']=shopDonationSection(s);
 return merchantHeading('店铺管理',btn('编辑','shop-module-edit','all','btn primary')+(C.manage()?btn('开设新店铺','shop-draft') :''))+'<section class="card shop-info-card organization-page">'+
 '<nav class="tabs organization-section-nav" aria-label="店铺资料分区">'+names.map((name,i)=>'<button type="button" data-action="tab" data-id="'+name+'" aria-controls="shop-section-'+i+'"'+(S.tab===name?' class="tab active" aria-current="location"':' class="tab"')+'>'+name+'</button>').join('')+'</nav>'+
 '<div class="organization-sections">'+names.map((name,i)=>'<section class="organization-section" id="shop-section-'+i+'" data-organization-section="'+name+'" aria-labelledby="shop-section-title-'+i+'"><div class="organization-section-head"><h2 id="shop-section-title-'+i+'">'+name+'</h2>'+btn('编辑','shop-module-edit',({'基本信息':'basic','经营资质':'qualifications','客服配置':'customer','捐赠协议':'donation'})[name],'link')+'</div><div class="organization-section-body">'+bodies[name]+'</div></section>').join('')+'</div></section>';
}
function shopQualificationInfo(q,live=true){
 if(q.source!=='organization'||!live)return q;
 const o=D.organizations.find(o=>o.id===q.organizationId&&o.id===S.org);if(!o)return q;
 return {...q,name:'营业执照',file:o.licenseFile,longTerm:!!o.licenseLongTerm,validUntil:o.licenseLongTerm?'':o.licenseValidUntil||'2030-12-31',organizationVersion:o.version||1};
}
function shopQualificationSection(s){
 const o=org();
 const today=new Date().toLocaleDateString('sv-SE');
 const info=(label,value)=>'<div class="shop-info-row"><dt>'+esc(label)+'</dt><dd>'+value+'</dd></div>';
 const effective=s.operatingQualifications||[];
 const inherited=s.inheritOrganizationLicense??effective.some(q=>q.source==='organization');
 const inheritanceOptions='<span class="shop-license-switch-label">'+(inherited?'继承':'不继承')+'</span>';
 const rows=effective.filter(q=>q.source!=='organization').map(item=>{
  const q=shopQualificationInfo(item),status=!q.longTerm&&q.validUntil<today?'已过期':'已通过';
  const fileSource=s.id+'|effective|after|'+q.id;
  return '<article class="shop-qualification-item" aria-label="'+esc(q.category||'经营资质')+'资质"><div class="shop-qualification-item-head"><h3>'+esc(q.category||'未选择品类')+'</h3>'+badge(status)+'</div><dl>'+info('证明材料',q.file?btn(esc(q.file.name),'shop-qualification-file',fileSource,'link'):'未上传')+info('有效期',esc(q.longTerm?'长期':q.validUntil||'未填写'))+'</dl></article>';
 });
 return '<section class="shop-info-group"><div class="shop-qualification-heading"><div class="shop-license-title"><h2>组织营业执照</h2>'+inheritanceOptions+'</div>'+btn(S.member?'查看组织资质':'前往组织维护','shop-qualification-organization','','link')+'</div><p class="tiny muted shop-qualification-note">营业执照由所属组织统一维护，选择继承后使用组织当前生效资料。</p><dl>'+info('所属组织',esc(o.name))+info('引用版本','v'+esc(o.version||1)+' · 当前生效')+info('营业执照','<span>'+esc(o.licenseFile?.name||o.licenseName||'示例营业执照 · 已核验')+'</span>'+btn('查看营业执照','shop-license','','link'))+info('有效期',esc(o.licenseLongTerm?'长期':o.licenseValidUntil||'2030-12-31'))+'</dl></section><section class="shop-info-group"><h2>本店经营资质</h2><p class="tiny muted shop-qualification-note">本店经营类目：'+esc(s.category)+'。按需添加本店所需资质，审批通过后生效。</p><div class="shop-qualification-list">'+(rows.length?rows.join(''):'<p class="tiny muted">尚未添加经营资质</p>')+'</div></section>';

}
function shopLicenseInheritance(value){
 if(!isMerchant||!canUse('shop'))return;const shop=currentShop();if(!shop||!ensureEditable(shop))return;
 const saved=D.applications.find(a=>a.org===S.org&&a.object===shop.id&&['店铺经营资质变更','店铺资料变更'].includes(a.type)&&['草稿','已撤回','已驳回'].includes(a.status));
 const inherited=value==='true',current=saved?.snapshot.inheritOrganizationLicense??shop.inheritOrganizationLicense??(saved?.snapshot.operatingQualifications||shop.operatingQualifications||[]).some(q=>q.source==='organization');if(inherited===current)return;
 const snapshot={...saved?.snapshot,operatingQualifications:saved?.snapshot.operatingQualifications||shop.operatingQualifications||[],inheritOrganizationLicense:inherited};
 const error=submitApplication(saved?.type||'店铺经营资质变更',shop,snapshot,'draft');if(error){toast(error);return;}if(saved)saved.status='已替代';render();toast('继承设置已保存草稿，提交审批后生效');
}
function shopQualificationSubmit(id){
 if(!isMerchant||!canUse('shop'))return;const shop=currentShop(),saved=D.applications.find(a=>a.id===id&&a.org===S.org&&a.object===shop?.id&&a.type==='店铺经营资质变更'&&['草稿','已撤回','已驳回'].includes(a.status));if(!shop||!saved||!ensureEditable(shop))return;
 const items=(saved.snapshot.operatingQualifications||[]).filter(q=>q.source!=='organization');
 if(items.some(q=>!q.category||!q.file||!q.longTerm&&(!q.validUntil||q.validUntil<new Date().toLocaleDateString('sv-SE')))){toast('请补全各项资质材料及有效期后提交');return;}
 if(saved.snapshot.inheritOrganizationLicense){const o=org();if(!o.licenseLongTerm&&(o.licenseValidUntil||'2030-12-31')<new Date().toLocaleDateString('sv-SE')){toast('组织营业执照已过期，请先更新');return;}}
 const error=submitApplication('店铺经营资质变更',shop,saved.snapshot);if(error){toast(error);return;}saved.status='已替代';closeOverlay();render();toast('经营资质已提交审批');
}
function shopQualificationEditor(id='',application){
 if(!isMerchant||!canUse('shop'))return;const s=currentShop();if(!s||!ensureEditable(s))return;
 const owner=S.org,shopId=s.id,account=S.demoAccount,baseline=JSON.stringify(s.operatingQualifications||[]);
 const saved=application||D.applications.find(a=>a.org===owner&&a.object===shopId&&a.type==='店铺经营资质变更'&&['草稿','已撤回','已驳回'].includes(a.status));
 if(saved&&(saved.org!==owner||saved.object!==shopId||saved.type!=='店铺经营资质变更'||!['草稿','已撤回','已驳回'].includes(saved.status)))return;
 const savedStatus=saved?.status,items=JSON.parse(JSON.stringify(saved?.snapshot?.operatingQualifications||s.operatingQualifications||[]));
 const editingId=id||(application?.qualificationId||''),q=items.find(q=>q.id===editingId)||{id:'Q'+Date.now(),name:'',category:'',validUntil:'',longTerm:false};
 if(editingId&&(!items.some(q=>q.id===editingId)||q.source==='organization'))return;
 const categories=[...new Set(String(s.category||'').split(/[/、,，]/).map(x=>x.trim()).filter(Boolean))];
 const organizationVersion=org().version||1;
 const body=select('适用品类','category',[['','请选择本店经营品类'],...new Set([...categories,...(q.category?[q.category]:[])])],q.category)+field('有效期至','validUntil',q.validUntil,'date',!q.longTerm)+checkbox('长期有效','longTerm',q.longTerm)+'<label class="full">证明材料<input name="qualificationFile" type="file" accept="image/png,image/jpeg,application/pdf"><span class="local-file-note" data-upload-note="qualificationFile">'+esc(q.file?.name||'支持 JPG、PNG、PDF，最大 10 MB')+'</span></label>';
 let upload;
 form(editingId?'修改经营资质':'添加经营资质',body,(data,intent)=>{
  if(S.org!==owner||S.demoAccount!==account||currentShop()?.id!==shopId||!canUse('shop'))return '人员权限或当前店铺已更新，请重新打开后操作。';
  if(JSON.stringify(s.operatingQualifications||[])!==baseline||saved&&saved.status!==savedStatus)return '资质版本已更新，请重新打开后操作。';
  const inherited=false;
  if((inherited||items.some(item=>item.source==='organization'))&&(org().version||1)!==organizationVersion)return '组织营业执照版本已更新，请重新打开后操作。';
  if(!inherited&&upload.reading())return '文件读取中，请稍候。';if(!inherited&&upload.error())return upload.error();
  const next=inherited?shopQualificationInfo({id:q.id,category:data.category,source:'organization',organizationId:owner}):{id:q.id,source:'upload',category:data.category,longTerm:!!data.longTerm,validUntil:data.longTerm?'':data.validUntil||'',file:upload.files.qualificationFile};
  if(intent!=='draft'){
   if(!categories.includes(next.category)||!next.file&&!inherited||!next.longTerm&&!next.validUntil)return '请选择本店适用品类、上传材料并填写有效期。';
   if(!next.longTerm&&next.validUntil<new Date().toLocaleDateString('sv-SE'))return '资质已过期，请上传有效材料。';
  }
  const updated=(items.some(item=>item.id===q.id)?items.map(item=>item.id===q.id?next:item):[...items,next]).map(item=>shopQualificationInfo(item));
  if(intent!=='draft'&&updated.filter(item=>item.source!=='organization').some(item=>!categories.includes(item.category)||!item.file&&item.source!=='organization'||item.source==='organization'&&item.organizationId!==owner||!item.longTerm&&(!item.validUntil||item.validUntil<new Date().toLocaleDateString('sv-SE'))))return '请补全草稿中的各项资质，并更新已过期材料后提交。';
  const error=submitApplication('店铺经营资质变更',s,{...(saved&&Object.hasOwn(saved.snapshot,'inheritOrganizationLicense')?{inheritOrganizationLicense:saved.snapshot.inheritOrganizationLicense}:{}),operatingQualifications:updated},intent);if(error)return error;
  D.applications[0].qualificationId=q.id;D.applications[0].baseline.operatingQualifications=JSON.parse(JSON.stringify((s.operatingQualifications||[]).map(item=>shopQualificationInfo(item))));if(saved)saved.status='已替代';closeOverlay();render();toast(intent==='draft'?'经营资质草稿已保存':'经营资质已提交审批');
 },'提交审批',true);
 upload=bindShopUploads(['qualificationFile'],{qualificationFile:q.source==='organization'?undefined:q.file},10,['png','jpg','jpeg','pdf']);
 const check=$('#edit-form [name=longTerm]'),date=$('#edit-form [name=validUntil]'),sync=()=>{date.disabled=check.checked;date.required=!check.checked;};check.addEventListener('change',sync);sync();
}
function shopQualificationFile(source){
 if(!isMerchant||!canUse('shop'))return;const [shopId,applicationId,side,id]=source.split('|'),s=currentShop();if(!s||s.id!==shopId||!['before','after'].includes(side))return;
 const application=applicationId==='effective'?null:D.applications.find(a=>a.id===applicationId&&a.org===S.org&&a.object===s.id&&['店铺经营资质变更','店铺资料变更'].includes(a.type));
 if(applicationId!=='effective'&&!application)return;
 const items=application?(side==='before'?application.baseline:application.snapshot)?.operatingQualifications:s.operatingQualifications;
 const item=items?.find(q=>q.id===id);if(!item)return;const q=shopQualificationInfo(item,applicationId==='effective');
 if(q.source==='organization'&&q.organizationId!==S.org)return;
 if(q.file?.data)previewShopFile(q.file);else if(q.source==='organization')subdialog('组织营业执照','<img class="shop-file-image" src="../shared/assets/business-license.svg" alt="营业执照示例">','关闭');
}
function shopQualificationDiff(before,after,application){
 const describe=(q,side)=>q?'来源：'+(q.source==='organization'?'继承组织营业执照 · v'+esc(q.organizationVersion):'自行上传')+'<br>适用品类：'+esc(q.category||'未选择')+'<br>有效期：'+esc(q.longTerm?'长期':q.validUntil||'未填写')+'<br>证明材料：'+(q.file||q.source==='organization'?esc(q.file?.name||'营业执照')+(application?' '+btn('查看文件','shop-qualification-file',application.object+'|'+application.id+'|'+side+'|'+q.id,'link'):''):'未上传'):'—';
 const old=before||[],next=after||[];return [...new Set([...old,...next].map(q=>q.id))].flatMap(id=>{const a=old.find(q=>q.id===id),b=next.find(q=>q.id===id);return JSON.stringify(a)===JSON.stringify(b)?[]:[tr(['经营资质 · '+esc(b?.name||a?.name||'未命名'),describe(a,'before'),describe(b,'after')])];});
}
function shopLogoRulesLink(){return btn('店铺 logo 上传规则','shop-logo-rules','','link shop-logo-rules-link');}
function shopLogoBasicPreview(shop){
 const image=shop.logo?'<img src="'+esc(shop.logo)+'" alt="店铺 logo">':'<span class="shop-logo-placeholder">'+icon('shop')+'</span>';
 const card=btn('<span class="shop-logo-basic-image">'+image+'</span><span class="shop-logo-change">修改</span>','shop-config','logo','shop-logo-basic-card');
 return '<div class="shop-logo-basic">'+(card||'<span class="shop-logo-basic-card"><span class="shop-logo-basic-image">'+image+'</span></span>')+shopLogoRulesLink()+'</div>';
}
function shopLogoUploadField(name,label,note,required=false){
 return '<div class="full shop-logo-upload"><span class="shop-logo-field-title">'+esc(label)+' <span class="required-tip">*</span></span><div class="shop-logo-field-content"><label class="shop-logo-picker"><input name="'+name+'" type="file" accept="image/png,image/jpeg,image/webp" aria-label="'+esc(label)+'，上传或修改图片" aria-describedby="'+name+'-note"'+(required?' required':'')+'><div class="media-preview"><span class="shop-logo-placeholder">上传图片</span></div><span class="shop-logo-change">修改</span></label><div class="shop-logo-actions">'+shopLogoRulesLink()+'<button type="button" class="link" data-logo-generate="'+name+'">按店铺名称生成</button></div><span class="local-file-note" id="'+name+'-note" data-upload-note="'+name+'">'+esc(note)+'</span></div></div>';
}
function createShopNameLogo(name){
 const text=String(name||'').trim();if(!text)throw new Error('请先填写店铺名称。');
 const canvas=document.createElement('canvas');canvas.width=300;canvas.height=300;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,300,300);ctx.fillStyle='#e8751a';ctx.textAlign='center';ctx.textBaseline='middle';
 const chars=Array.from(text),lineCount=chars.length<=4?1:chars.length<=10?2:chars.length<=18?3:4,perLine=Math.ceil(chars.length/lineCount),lines=[];
 for(let i=0;i<chars.length;i+=perLine)lines.push(chars.slice(i,i+perLine).join(''));
 let size=64;const setFont=()=>{ctx.font='600 '+size+'px "PingFang SC","Microsoft YaHei",sans-serif';};setFont();
 while(size>1&&(Math.max(...lines.map(line=>ctx.measureText(line).width))>248||lines.length*size*1.25>240)){size--;setFont();}
 lines.forEach((line,i)=>ctx.fillText(line,150,150+(i-(lines.length-1)/2)*size*1.25,248));
 const data=canvas.toDataURL('image/png'),sizeBytes=atob(data.split(',')[1]).length;
 if(!data.startsWith('data:image/png;')||!sizeBytes||sizeBytes>2*1024*1024)throw new Error('标志生成失败，请重试。');
 return {name:'店铺名称标志.png',type:'image/png',size:sizeBytes,data};
}
function bindShopLogoGenerator(input,apply){
 const trigger=$('[data-logo-generate="'+input.name+'"]');if(!trigger)return;
 trigger.addEventListener('click',()=>{
  const name=String($('#edit-form [name=name]')?.value||input.dataset.shopName||'').trim();
  if(!name){$('#form-error').textContent='请先填写店铺名称。';$('#edit-form [name=name]')?.focus();return;}
  let file;try{file=createShopNameLogo(name);}catch{$('#form-error').textContent='标志生成失败，请重试。';return;}
  if($('#secondary'))closeSecondary();
  subdialog('根据店铺名称生成 logo','<div class="shop-name-logo-preview"><img src="'+esc(file.data)+'" alt="'+esc(name)+'的店铺标志"><p>'+esc(name)+'</p><p class="tiny muted">300 × 300 像素 · PNG</p></div>','取消');
  const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary';confirm.textContent='使用此标志';$('#secondary .dialog-foot').prepend(confirm);
  confirm.addEventListener('click',()=>{if(input.isConnected)apply(file);closeSecondary();});confirm.focus();
 });
}

function shopLogoRules(){
 subdialog('店铺 logo 上传规则','<div class="shop-logo-rules"><h3>图片要求</h3><ul><li>成图为 300 × 300 像素；原图宽高均至少 300 像素，超出时可裁剪，支持拖动及缩放。</li><li>支持 JPG、PNG、WebP 静态图片，文件不超过 2 MB。</li><li>图案及文字清晰可辨，与店铺名称或品牌保持一致。</li></ul><h3>内容要求</h3><ul><li>内容符合平台规范，不得包含违法违规、歧视侮辱或损害公共利益的信息。</li><li>不得冒用国家机关、国际组织及其标志，或使用不适宜的政治、宗教内容。</li><li>使用商标、品牌标识或人物肖像须具备相应授权，不得侵犯他人权益。</li><li>不得冒充平台、其他店铺或其他电商平台，不得使用容易引起混淆的名称和标识。</li><li>不得包含虚假宣传、夸大承诺及其他可能误导用户的信息。</li><li>不得包含电话、邮箱、网址、二维码或社交账号等站外联系方式。</li></ul></div>','我知道了');
}
function shopLogoImageIssue(file,context={isCurrent:()=>true}){
 return new Promise(resolve=>{
  try{
   const bytes=Uint8Array.from(atob(file.data.split(',')[1]),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
   const chunkName=i=>String.fromCharCode(...bytes.slice(i,i+4));
   if(bytes[0]===137&&chunkName(1)==='PNG\r')for(let i=8;i+12<=bytes.length;){const length=view.getUint32(i);if(chunkName(i+4)==='acTL'){resolve('店铺 logo 仅支持静态图片，请重新上传。');return;}i+=length+12;}
   if(chunkName(0)==='RIFF'&&chunkName(8)==='WEBP')for(let i=12;i+8<=bytes.length;){const length=view.getUint32(i+4,true);if(['ANIM','ANMF'].includes(chunkName(i))){resolve('店铺 logo 仅支持静态图片，请重新上传。');return;}i+=8+length+(length%2);}
  }catch{resolve('图片读取失败，请重新选择有效图片。');return;}
  const image=new Image();image.onload=async()=>{if(!context.isCurrent()){resolve({cancelled:true});return;}if(image.naturalWidth<300||image.naturalHeight<300){resolve('店铺 logo 宽高均须至少 300 像素，请重新选择。');return;}if(image.naturalWidth===300&&image.naturalHeight===300){resolve('');return;}try{resolve(await cropShopLogo(file,image));}catch{resolve('图片裁剪失败，请重新选择。');}};image.onerror=()=>resolve('图片无法识别，请重新选择有效图片。');image.src=file.data;
 });
}
function shopLogoCropRect(width,height,zoom=1,x=width/2,y=height/2){
 const side=Math.min(width,height)/Math.max(1,Math.min(zoom,Math.min(width,height)/300));
 return {x:Math.max(0,Math.min(width-side,x-side/2)),y:Math.max(0,Math.min(height-side,y-side/2)),side};
}
function cropShopLogo(file,image){
 return new Promise(resolve=>{
  if($('#secondary'))closeSecondary();
  subdialog('裁剪（300 × 300 像素）','<div class="shop-logo-crop"><p>拖动图片调整位置，缩放选择保留的区域。</p><canvas width="300" height="300" tabindex="0" aria-label="裁剪区域，可拖动图片或使用方向键调整"></canvas><label>缩放<input type="range" min="1" max="'+Math.min(image.naturalWidth,image.naturalHeight)/300+'" step="0.01" value="1" aria-label="图片缩放"></label><p class="tiny muted">裁剪后为 300 × 300 像素</p><p class="error" role="alert" data-crop-error></p></div>','取消');
  const panel=$('#secondary'),canvas=panel.querySelector('canvas'),slider=panel.querySelector('input'),ctx=canvas.getContext('2d');
  panel.classList.add('shop-logo-crop-overlay');
  const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary';confirm.textContent='确认';panel.querySelector('.dialog-foot').prepend(confirm);
  let x=image.naturalWidth/2,y=image.naturalHeight/2,zoom=1,drag=null,done=false;
  const draw=()=>{const r=shopLogoCropRect(image.naturalWidth,image.naturalHeight,zoom,x,y);x=r.x+r.side/2;y=r.y+r.side/2;ctx.clearRect(0,0,300,300);ctx.drawImage(image,r.x,r.y,r.side,r.side,0,0,300,300);};
  const finish=result=>{if(done)return;done=true;observer.disconnect();resolve(result);};
  panel.onSecondaryClose=()=>finish({cancelled:true});
  const observer=new MutationObserver(()=>{if(!panel.isConnected)finish({cancelled:true});});observer.observe($('#overlay'),{childList:true,subtree:true});
  slider.addEventListener('input',()=>{zoom=Number(slider.value);draw();});
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const ratio=shopLogoCropRect(image.naturalWidth,image.naturalHeight,zoom,x,y).side/canvas.getBoundingClientRect().width;x-=(e.clientX-drag.x)*ratio;y-=(e.clientY-drag.y)*ratio;drag={x:e.clientX,y:e.clientY};draw();});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;});
  canvas.addEventListener('keydown',e=>{const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();const step=shopLogoCropRect(image.naturalWidth,image.naturalHeight,zoom,x,y).side/30;x+=delta[0]*step;y+=delta[1]*step;draw();});
  confirm.addEventListener('click',()=>{try{const data=canvas.toDataURL('image/png'),size=atob(data.split(',')[1]).length;if(size>2*1024*1024)throw new Error('size');Object.assign(file,{name:file.name.replace(/\.[^.]+$/,'')+'-300x300.png',type:'image/png',size,data});finish('');closeSecondary();}catch{panel.querySelector('[data-crop-error]').textContent='图片裁剪失败，请重新选择图片。';}});
  draw();confirm.focus();
 });
}

function shopModuleEditor(scope='all',application=null){
 if(!isMerchant||!canUse('shop'))return;
 const shop=currentShop();if(!shop||!ensureEditable(shop))return;
 const labels={basic:'基本信息',qualifications:'经营资质',customer:'客服配置',donation:'捐赠协议',all:'店铺资料'};if(!labels[scope])return;
 const owner=S.org,shopId=shop.id,account=S.demoAccount,baseline=JSON.stringify(shop);
 const saved=application||D.applications.find(a=>a.org===owner&&a.object===shopId&&a.snapshot?.configSection==='module:'+scope&&['草稿','已撤回','已驳回'].includes(a.status));
 if(saved&&(saved.org!==owner||saved.object!==shopId||!['草稿','已撤回','已驳回'].includes(saved.status)))return;
 const base={...shop,...saved?.snapshot},includes=key=>scope==='all'||scope===key,uploads=[];
 const uploadField=(label,name,file,accept,note)=>'<label class="full">'+label+'<input type="file" name="'+name+'" accept="'+accept+'"><span class="local-file-note" data-upload-note="'+name+'">'+esc(file?.name||note)+'</span></label>';
 const group=(key,body)=>'<section class="shop-module-edit-group full" data-shop-edit-section="'+key+'">'+(scope==='all'?'<h2>'+labels[key]+'</h2>':'')+'<div class="form-grid">'+body+'</div></section>';
 let content='';
 if(includes('basic'))content+=group('basic',field('店铺名称','name',base.name)+field('主营类目','category',base.category)+field('店铺简介','intro',base.intro||'','textarea',true,true)+shopLogoUploadField('shopLogoFile','店铺 logo','300 × 300 像素，JPG、PNG、WebP，最大 2 MB。'));
 if(includes('qualifications'))content+=group('qualifications','<label class="full shop-module-inherit"><span>继承组织营业执照</span><span class="shop-module-switch-control"><input type="checkbox" role="switch" name="inheritOrganizationLicense"'+((base.inheritOrganizationLicense??base.operatingQualifications?.some(q=>q.source==='organization'))?' checked':'')+'><span class="shop-module-switch" aria-hidden="true"></span></span></label><div class="full" id="shop-module-qualifications"></div><button type="button" class="shop-module-add" id="shop-module-add-qualification"><span aria-hidden="true">＋</span> 添加经营资质</button>');
 if(includes('customer'))content+=group('customer','<div class="full shop-module-customer-account"><label for="shop-module-customer-id">客服账号 ID（open_kfid） <span class="required-tip">*</span></label><div class="shop-customer-input"><input id="shop-module-customer-id" name="customerServiceId" value="'+esc(base.customerServiceId||'')+'" required autocomplete="off">'+btn('测试账号','customer-service-test','','btn')+'</div></div>'+field('退换货地址','returnAddress',base.returnAddress||'','textarea',true,true));
 if(includes('donation'))content+=group('donation',uploadField('原始协议文件','donationAgreementFile',base.donationAgreementFile,'.pdf,.doc,.docx,.png,.jpg,.jpeg','支持 PDF、Word、JPG、PNG，最大 20 MB')+field('每单捐协议正文（展示在客户端）','donationAgreement',base.donationAgreement||'','textarea',false,true));
 const qualificationRows=[];let qualificationIndex=0;
 const qualificationCategories=()=>[...new Set(String($('#edit-form [name=category]')?.value??base.category??'').split(/[/、,，]/).map(x=>x.trim()).filter(Boolean))];
 form('编辑'+labels[scope],content,(data,intent)=>{
  if(S.org!==owner||currentShop()?.id!==shopId||S.demoAccount!==account||!canUse('shop'))return '当前店铺或操作权限已变化，请重新打开。';
  if(JSON.stringify(shop)!==baseline||saved&&!['草稿','已撤回','已驳回'].includes(saved.status))return '店铺资料版本已变化，请重新打开。';
  for(const upload of uploads){if(upload.reading())return '文件读取中，请稍候。';if(upload.error())return upload.error();}
  const snapshot={configSection:'module:'+scope};
  if(includes('basic')){for(const key of ['name','category','intro'])snapshot[key]=String(data[key]||'').trim();snapshot.logo=logoUpload.files.shopLogoFile?.data||base.logo||'';}
  if(includes('customer')){snapshot.customerServiceId=String(data.customerServiceId||'').trim();snapshot.returnAddress=String(data.returnAddress||'').trim();if(intent!=='draft'){const result=CS.verify(snapshot.customerServiceId);if(result.error)return result.error;}}
  if(includes('donation')){snapshot.donationAgreement=String(data.donationAgreement||'');snapshot.donationAgreementFile=agreementUpload.files.donationAgreementFile;}
  if(includes('qualifications')){
   snapshot.inheritOrganizationLicense=!!data.inheritOrganizationLicense;
   snapshot.operatingQualifications=qualificationRows.map(row=>({id:row.id,source:'upload',category:String(data[row.prefix+'category']||'').trim(),longTerm:!!data[row.prefix+'longTerm'],validUntil:data[row.prefix+'longTerm']?'':data[row.prefix+'validUntil']||'',file:row.upload.files[row.prefix+'file']}));
   if(intent!=='draft'){
    const categories=String(snapshot.category??shop.category).split(/[/、,，]/).map(x=>x.trim());
    for(const [i,q] of snapshot.operatingQualifications.entries()){
     const label='经营资质 '+(i+1)+'：';
     if(!q.category)return label+'请选择适用品类。';
     if(!categories.includes(q.category))return label+'适用品类须为本店主营类目（'+categories.join('、')+'），请重新选择。';
     if(!q.file)return label+'请上传证明材料。';
     if(!q.longTerm&&!q.validUntil)return label+'请填写有效期或勾选长期有效。';
     if(!q.longTerm&&q.validUntil<new Date().toLocaleDateString('sv-SE'))return label+'材料已过期，请更新有效期及材料。';
    }
    if(snapshot.inheritOrganizationLicense&&!org().licenseLongTerm&&(org().licenseValidUntil||'2030-12-31')<new Date().toLocaleDateString('sv-SE'))return '组织营业执照已过期，请先更新。';
   }
  }
  const error=submitApplication('店铺资料变更',shop,snapshot,intent);if(error)return error;replaceSavedApplication(saved);closeOverlay();render();toast(intent==='draft'?'店铺资料草稿已保存':'店铺资料变更已提交审批');
 },'提交审批',true);
 $('#overlay .dialog').classList.add('shop-module-editor');
 if(scope==='customer')$('#overlay .dialog').classList.add('shop-customer-editor');
 let logoUpload,agreementUpload;
 if(includes('basic')){logoUpload=bindShopUploads(['shopLogoFile'],{},2,['png','jpg','jpeg','webp'],shopLogoImageIssue);uploads.push(logoUpload);const input=$('#edit-form [name=shopLogoFile]');input.dataset.shopName=base.name||'';if(base.logo)input.closest('label').querySelector('.media-preview').innerHTML='<img class="application-change-image" src="'+esc(base.logo)+'" alt="店铺 logo">';}
 if(includes('donation')){agreementUpload=bindShopUploads(['donationAgreementFile'],base,20,['pdf','doc','docx','png','jpg','jpeg']);uploads.push(agreementUpload);}
 if(includes('customer')){
  const input=$('#shop-module-customer-id'),test=$('#edit-form [data-action=customer-service-test]');
  const syncTest=()=>{test.hidden=!input.value.trim()||input.value.trim()===CS.config().fallbackId;};
  input.addEventListener('input',syncTest);syncTest();
 }
 if(includes('qualifications')){
  const add=q=>{const index=qualificationIndex++,prefix='moduleQ'+index+'_',id=q?.id||'Q'+Date.now()+'_'+index;
   const container=$('#shop-module-qualifications');
   container.insertAdjacentHTML('beforeend','<div class="shop-module-qualification" data-qualification-row="'+prefix+'"><div class="shop-module-qualification-head"><h3>经营资质 <span data-qualification-number>'+(qualificationRows.length+1)+'</span></h3><button type="button" class="link shop-module-remove">删除</button></div><div class="shop-module-qualification-fields">'+select('适用品类',prefix+'category',[['','请选择本店经营品类'],...new Set([...qualificationCategories(),...(q?.category?[q.category]:[])])],q?.category||'')+'<div class="shop-module-validity">'+field('有效期至',prefix+'validUntil',q?.validUntil||'','date',false)+checkbox('长期有效',prefix+'longTerm',q?.longTerm)+'</div></div><div class="shop-module-material"><span>证明材料</span><label class="shop-module-upload"><input type="file" name="'+prefix+'file" accept=".png,.jpg,.jpeg,.pdf"><span class="shop-module-upload-button">上传材料</span></label><span class="local-file-note" data-upload-note="'+prefix+'file">'+esc(q?.file?.name||'JPG、PNG、PDF，最大 10 MB')+'</span></div></div>');
   const card=container.lastElementChild,upload=bindShopUploads([prefix+'file'],{[prefix+'file']:q?.file},10,['png','jpg','jpeg','pdf']),row={id,prefix,upload};
   uploads.push(upload);qualificationRows.push(row);
   card.querySelector('.shop-module-remove').addEventListener('click',()=>{qualificationRows.splice(qualificationRows.indexOf(row),1);uploads.splice(uploads.indexOf(upload),1);card.remove();container.querySelectorAll('[data-qualification-number]').forEach((el,i)=>{el.textContent=i+1;});$('#form-error').textContent='';});
   const check=$('#edit-form [name='+prefix+'longTerm]'),date=$('#edit-form [name='+prefix+'validUntil]'),sync=()=>{date.disabled=check.checked;};check.addEventListener('change',sync);sync();
  };
  const syncCategories=()=>{for(const row of qualificationRows){const input=$('#edit-form [name='+row.prefix+'category]'),value=input.value,categories=qualificationCategories();input.innerHTML=[['','请选择本店经营品类'],...categories.map(x=>[x,x]),...(value&&!categories.includes(value)?[[value,value+'（非本店主营类目）']]:[])].map(([v,t])=>'<option value="'+esc(v)+'"'+(v===value?' selected':'')+'>'+esc(t)+'</option>').join('');}};
  $('#edit-form [name=category]')?.addEventListener('input',syncCategories);
  for(const q of base.operatingQualifications||[])if(q.source!=='organization')add(q);
  $('#shop-module-add-qualification').addEventListener('click',()=>add());
 }
}
function shopConfigEditor(kind,application=null){
 if(kind?.startsWith('module:'))return shopModuleEditor(kind.slice(7),application);
 if(!isMerchant)return;const s=currentShop();if(!s||!ensureEditable(s))return;
 const saved=application?editableApplication('店铺资料变更',s.id,application):D.applications.find(a=>a.org===S.org&&a.object===s.id&&a.type==='店铺资料变更'&&a.snapshot?.configSection===kind&&['草稿','已撤回','已驳回'].includes(a.status)),base={...s,...saved?.snapshot};
 const definitions={name:['修改店铺名称',field('店铺名称','name',base.name)],category:['修改主营类目',field('主营类目','category',base.category)],intro:['修改店铺简介',field('店铺简介','intro',base.intro||'','textarea',true,true)],logo:['修改店铺 logo',shopLogoUploadField('shopLogoFile','店铺 logo','成图 300 × 300 像素，超出可裁剪；JPG、PNG、WebP 静态图片，最大 2 MB。',true)],service:['修改店铺默认客服','<label class="full"><span>客服账号 ID（open_kfid） <span class="required-tip">*</span></span><input name="customerServiceId" required value="'+esc(base.customerServiceId||'')+'" placeholder="请输入微信客服账号 ID" autocomplete="off"></label><p class="full tiny muted">填写在平台企业微信中创建的客服账号 ID。提交时校验企业归属、接口权限、客服链接及接待人员；账号与人员信息每 5 分钟自动更新。</p>'],return:['修改退换货地址',field('退换货地址','returnAddress',base.returnAddress||D.products.find(p=>p.shop===s.id)?.returnAddress||'','textarea',true,true)]};
 const definition=definitions[kind];if(!definition)return;let logo=base.logo||'',logoUpload;const owner=S.org,shopId=s.id;
 form(definition[0],definition[1],(data,intent)=>{
  if(S.org!==owner||currentShop()?.id!==shopId||!canUse('shop'))return '当前店铺或操作权限已变化，请重新操作。';
  if(kind==='service'){data.customerServiceId=data.customerServiceId.trim();if(intent!=='draft'){const result=CS.verify(data.customerServiceId);if(result.error)return result.error;}}
  if(kind==='logo'){if(logoUpload.reading())return '图片校验中，请稍候。';if(logoUpload.error())return logoUpload.error();logo=logoUpload.files.shopLogoFile?.data||logo;if(intent!=='draft'&&!logo)return '请选择有效的店铺 logo。';}
  const snapshot={...data,configSection:kind};delete snapshot.shopLogoFile;if(kind==='logo')snapshot.logo=logo;
  const error=submitApplication('店铺资料变更',s,snapshot,intent);if(error)return error;replaceSavedApplication(saved);closeOverlay();render();toast(intent==='draft'?'店铺资料草稿已保存':'店铺资料变更已提交审批');
 },'提交审批',true);
 if(kind==='logo'&&logo){const input=$('#edit-form [name=shopLogoFile]');input.required=false;input.closest('label').querySelector('.media-preview').innerHTML='<img class="application-change-image" src="'+esc(logo)+'" alt="已保存的店铺标识">';}
 if(kind==='service'){
  const picker=$('#edit-form [name=customerServiceId]');
  picker.closest('label').insertAdjacentHTML('afterend','<div class="full" id="shop-service-account-detail"></div>');
  const update=()=>{const a=CS.account(picker.value);$('#shop-service-account-detail').innerHTML=a?kv([['客服名称',a.name],['企业 ID（CorpID）',CS.config().corpId],['客服账号 ID（open_kfid）',a.id],['客服链接',a.url],['接待人员（成员 UserID）',CS.staff(a)]]):'<p class="tiny muted">提交时校验账号并读取客服名称、链接及接待人员。</p>';};
  picker.addEventListener('input',update);update();
 }
 if(kind==='logo'){$('#edit-form [name=shopLogoFile]').dataset.shopName=base.name||'';logoUpload=bindShopUploads(['shopLogoFile'],{},2,['png','jpg','jpeg','webp'],shopLogoImageIssue);}
}
const merchantBusinessRoles=['厂家','经销商','代理商','品牌商'];
function merchantQualifications(){
 const o=org();
 const row=(label,value,action='')=>'<div class="shop-info-row"><dt>'+esc(label)+'</dt><dd><div class="shop-info-value">'+esc(value||'未填写')+'</div>'+(action?'<div class="shop-info-action">'+action+'</div>':'')+'</dd></div>';
 const group=(title,rows)=>'<section class="shop-info-group"><h2>'+esc(title)+'</h2><dl>'+rows+'</dl></section>';
 return group('主体信息',row('业务身份',(o.businessRoles||[]).join('、')))+
 group('入驻人证件信息',row('入驻人姓名',maskSubjectName(o.entrantName))+row('入驻人身份证号',maskSubjectId(o.entrantIdentity),btn('查看姓名 / 身份证号','shop-identity','','link'))+row('入驻人身份证有效期',o.identityLongTerm?'长期':o.identityValidUntil)+row('入驻人身份证',o.identityFront||o.identityBack?'已上传':'示例证件 · 已核验',btn('查看证件','shop-identity-material','','link')))+
 group('营业执照信息',row('营业执照',o.licenseFile?.name||o.licenseName||'示例营业执照 · 已核验',btn('查看营业执照','shop-license','','link'))+row('统一社会信用代码',o.code)+row('营业执照有效期',o.licenseLongTerm?'长期':o.licenseValidUntil||'2030-12-31')+row('注册地址',o.registeredAddress||o.address))+
 '<div class="shop-subject-actions">'+btn('审核记录','shop-subject-history','','link')+'</div>';
}
function openOrganizationQualifications(edit=false){
 if(!isMerchant||!canManageMembers())return;
 navigate('organization');scrollOrganizationSection('资质材料');
 if(edit)organizationQualificationEditor();
}
function maskSubjectName(name){return name?name.slice(0,1)+'*'.repeat(Math.max(1,name.length-1)):'未填写';}
function maskSubjectId(id){return id?id.slice(0,2)+'*'.repeat(Math.max(4,id.length-4))+id.slice(-2):'未填写';}
function organizationQualificationEditor(application=null){orgEditor('资质材料',application);}
function organizationQualificationFields(o,example=false){
 const validity=(label,name,value,longName,long)=>'<label class="subject-edit-row"><span>'+label+' <span class="required-tip">*</span></span><div class="subject-validity"><input type="date" name="'+name+'" value="'+esc(value||'')+'" '+(long?'disabled':'required')+'><span class="checkbox"><input type="checkbox" name="'+longName+'"'+(long?' checked':'')+'>长期</span></div></label>';
 const uploadCard=(label,key,file,example=false)=>'<div><label class="subject-upload">'+icon('plus')+'<span>'+(file||example?'重新上传':'上传图片')+'</span><input type="file" name="'+key+'" accept="image/png,image/jpeg" aria-label="'+label+'" aria-required="true"'+(file?.data?'':' required')+'><div class="media-preview"></div></label><div class="local-file-note" data-upload-note="'+key+'">'+esc(file?.name||(example?'示例材料 · 已上传':'支持 JPG、PNG，最大 10 MB'))+'</div></div>';
 const upload=(label,key,file,example=false)=>'<div class="subject-edit-row"><span>'+label+' <span class="required-tip">*</span></span>'+uploadCard(label,key,file,example)+'</div>';
 const editable=(label,name,value,type='text')=>'<div class="subject-edit-row">'+field(label,name,value,type)+'</div>';
 return '<section class="subject-edit-group"><h2>主体信息</h2>'+editable('组织名称','name',o.name)+'</section><section class="subject-edit-group"><h2>入驻人身份信息</h2>'+editable('入驻人姓名','entrantName',o.entrantName)+editable('入驻人身份证件号','entrantIdentity',o.entrantIdentity)+validity('入驻人身份证件有效期','identityValidUntil',o.identityValidUntil,'identityLongTerm',o.identityLongTerm)+'<div class="subject-edit-row"><span>入驻人身份证 <span class="required-tip">*</span></span><div class="subject-identity-uploads"><div><div>人像面</div>'+uploadCard('身份证人像面','identityFront',o.identityFront,example)+'</div><div><div>国徽面</div>'+uploadCard('身份证国徽面','identityBack',o.identityBack,example)+'</div></div></div>'+'</section><section class="subject-edit-group"><h2>营业执照信息</h2>'+upload('营业执照','licenseFile',o.licenseFile,example)+editable('统一社会信用代码','code',o.code)+validity('营业执照有效期','licenseValidUntil',o.licenseValidUntil,'licenseLongTerm',o.licenseLongTerm) +editable('注册地址','registeredAddress',o.registeredAddress,'textarea')+'</section><section class="subject-edit-group"><h2>业务资料</h2><div class="subject-edit-row"><span>业务身份 <span class="required-tip">*</span></span><div class="subject-business-roles">'+merchantBusinessRoles.map(role=>'<label class="checkbox"><input type="checkbox" name="businessRole-'+role+'"'+((o.businessRoles||[]).includes(role)?' checked':'')+'>'+role+'</label>').join('')+'<span class="tiny muted">至少选择一项，可多选</span></div></div></section>';
}
function shopSubjectHistory(){
 if(!isMerchant)return;const rows=D.applications.filter(a=>a.org===S.org&&a.object===org().id&&(a.type==='组织主体资料变更'||a.type==='组织资料变更'&&a.snapshot?.orgSections?.includes('资质材料'))&&a.status!=='已替代');
 dialog('主体信息修改审核记录',table(['申请编号','申请时间','审核状态','操作'],rows.map(a=>tr([esc(a.id),esc(a.date),badge(a.status),link('查看详情','application',a.id)])),false),btn('关闭','close'));
}
const shopMaterialLabels={identityFront:'身份证人像面',identityBack:'身份证国徽面',licenseFile:'营业执照'};
function shopMaterialSource(key){
 const file=org()[key];if(file?.type?.startsWith('image/')&&file.data)return file.data;
 const examples={identityFront:'identity-front',identityBack:'identity-back',licenseFile:'business-license'};
 return '../shared/assets/'+examples[key]+'.svg';
}
function shopMaterialImages(keys){return '<div class="shop-material-images">'+keys.map(key=>'<figure><figcaption>'+shopMaterialLabels[key]+'</figcaption><button type="button" class="shop-material-image" data-action="shop-material-preview" data-id="'+key+'" aria-label="放大查看'+shopMaterialLabels[key]+'"><img src="'+esc(shopMaterialSource(key))+'" alt="'+shopMaterialLabels[key]+'"></button></figure>').join('')+'</div>';}
function shopMaterialPreview(key){if(!isMerchant||!shopMaterialLabels[key])return;subdialog(shopMaterialLabels[key],'<img class="shop-file-image" src="'+esc(shopMaterialSource(key))+'" alt="'+shopMaterialLabels[key]+'">','关闭');}
function shopIdentity(material=false){
 if(!isMerchant)return;const o=org();
 const body=material?shopMaterialImages(['identityFront','identityBack']):kv([['入驻人姓名',o.entrantName||'未填写'],['入驻人身份证号',o.entrantIdentity||'未填写']]);
 dialog(material?'入驻人身份证':'入驻人身份信息',body,btn('关闭','close'),material);
}
function shopLicense(){if(!isMerchant)return;dialog('营业执照',shopMaterialImages(['licenseFile']),btn('关闭','close'));}
function bindShopUploads(keys,base,maxMB,extensions,validateFile=null){
 const state={files:{},pending:new Set(),errors:{}};for(const key of keys)if(base[key])state.files[key]=base[key];
 const types={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
 for(const key of keys){const input=$('#edit-form [name='+key+']');if(!input)continue;let revision=0;const managedLogo=validateFile===shopLogoImageIssue;if(managedLogo)input.dataset.managedPreview='true';const originalRequired=input.required,originalNote=$('[data-upload-note="'+key+'"]')?.textContent||'',originalLogo=input.closest('label')?.querySelector('img')?.src||'';
 const showLogo=file=>{if(!managedLogo)return;const label=input.closest('label');let preview=label.querySelector('.media-preview');if(!preview){preview=document.createElement('div');preview.className='media-preview';label.appendChild(preview);}label.querySelectorAll('img.application-change-image').forEach(img=>img.remove());preview.replaceChildren();if(file?.data||originalLogo){const img=document.createElement('img');img.className='application-change-image';img.src=file?.data||originalLogo;img.alt='店铺标识预览';preview.appendChild(img);}input.required=originalRequired&&!state.files[key];};
 if(managedLogo)bindShopLogoGenerator(input,file=>{revision++;state.pending.delete(key);delete state.errors[key];state.files[key]=file;input.value='';showLogo(file);const note=$('[data-upload-note="'+key+'"]');if(note)note.textContent=file.name;$('#form-error').textContent='';});
 input.addEventListener('change',()=>{const token=++revision,file=input.files[0],note=$('[data-upload-note="'+key+'"]');delete state.errors[key];state.pending.delete(key);if(!file)return;
  const ext=file.name.split('.').pop().toLowerCase();if(!extensions.includes(ext)||file.size>maxMB*1024*1024||!file.size){state.errors[key]='请选择有效的 '+extensions.join(' / ').toUpperCase()+' 文件，最大 '+maxMB+' MB。';input.value='';$('#form-error').textContent=state.errors[key];return;}
  state.pending.add(key);if(note)note.textContent='文件读取中…';const reader=new FileReader();reader.onload=async()=>{if(token!==revision||!input.isConnected)return;const next={name:file.name,size:file.size,type:types[ext],data:reader.result};let issue='';try{if(validateFile)issue=await validateFile(next,{isCurrent:()=>token===revision&&input.isConnected});}catch{issue='文件校验失败，请重新选择。';}if(token!==revision)return;state.pending.delete(key);if(!input.isConnected)return;if(issue?.cancelled){input.value='';showLogo(state.files[key]);if(note)note.textContent=state.files[key]?.name||originalNote;$('#form-error').textContent='';return;}if(issue){state.errors[key]=issue;input.value='';input.closest('label')?.querySelector('.media-preview')?.replaceChildren();if(note)note.textContent=issue;$('#form-error').textContent=issue;return;}state.files[key]=next;showLogo(next);$('#form-error').textContent='';if(note)note.textContent=next.name;};reader.onerror=()=>{if(token!==revision||!input.isConnected)return;state.pending.delete(key);state.errors[key]='文件读取失败，请重新选择。';$('#form-error').textContent=state.errors[key];};reader.readAsDataURL(file);
 });}
 return {files:state.files,reading:()=>state.pending.size>0,error:()=>Object.values(state.errors)[0]};
}
function shopFile(source){
 const parts=source.split(':'),key=parts.pop();if(!isMerchant&&!['foundationCertificate','publicQualificationProof'].includes(key))return;if(!['donationAgreementFile','identityFront','identityBack','licenseFile','shopLogo','categoryProof','foundationCertificate','publicQualificationProof'].includes(key))return;
 const application=parts.length?D.applications.find(a=>a.id===parts[0]&&a.org===S.org):null;
 const file=parts.length?application?.snapshot?.[key]:(key==='donationAgreementFile'?currentShop()?.[key]:org()[key]);if(file?.data)previewShopFile(file);
}
function previewShopFile(file){
 try{const bytes=Uint8Array.from(atob(file.data.split(',')[1]),c=>c.charCodeAt(0)),url=URL.createObjectURL(new Blob([bytes],{type:file.type}));previewUrls.push(url);
 const preview=file.type.startsWith('image/')?'<img class="shop-file-image" src="'+url+'" alt="'+esc(file.name)+'">':file.type==='application/pdf'?'<object class="shop-file-pdf" data="'+url+'" type="application/pdf"><p>可下载查看原始文件。</p></object>':'<p>下载后查看原始协议文件。</p>';
 subdialog(file.name,preview+'<p><a class="link" href="'+url+'" download="'+esc(file.name)+'">下载原始文件</a></p>','关闭');
 }catch{toast('文件读取失败，请重新上传');}
}
function shopDonationSection(s){
 const pendingFile=D.applications.find(a=>a.org===S.org&&a.object===s.id&&a.type==='店铺捐赠协议变更'&&['草稿','已撤回','已驳回','待审批'].includes(a.status));
 const file=s.donationAgreementFile;
 return '<section class="shop-info-group"><h2>原始协议</h2><dl><div class="shop-info-row"><dt>原始协议文件</dt><dd><div class="shop-info-value">'+(file?btn(esc(file.name),'shop-file','donationAgreementFile','link'):'未上传')+'</div><div class="shop-info-action">'+''+'</div></dd></div></dl>'+(pendingFile?'<p class="shop-agreement-pending">'+badge(pendingFile.status)+' '+link(pendingFile.snapshot.donationAgreementFile?.name||'协议文件草稿','application',pendingFile.id)+'</p>':'')+'</section><section class="shop-info-group shop-donation-inline" aria-label="每单捐协议客户端展示"><p class="tiny muted">每单捐协议展示在客户端。</p>'+shopDonationPreviewContent(s.donationAgreement||'尚未发布每单捐协议')+'</section>';
}
function shopDonationUpload(application){
 if(!isMerchant)return;const s=currentShop();if(!s||!ensureEditable(s))return;const saved=application||D.applications.find(a=>a.org===S.org&&a.object===s.id&&a.type==='店铺捐赠协议变更'&&['草稿','已撤回','已驳回'].includes(a.status)),base={...s,...saved?.snapshot};let upload;
 form('上传捐赠协议','<label class="full">原始协议文件 <span class="required-tip">*</span><input type="file" name="donationAgreementFile" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"><div class="media-preview"></div><span class="local-file-note" data-upload-note="donationAgreementFile">'+esc(base.donationAgreementFile?.name||'支持 PDF、Word、JPG、PNG，最大 20 MB')+'</span></label>',(data,intent)=>{if(upload.reading())return '文件读取中，请稍候。';if(upload.error())return upload.error();if(intent!=='draft'&&!upload.files.donationAgreementFile)return '请上传原始协议文件。';const error=submitApplication('店铺捐赠协议变更',s,{...upload.files},intent);if(error)return error;if(saved)saved.status='已替代';closeOverlay();render();toast(intent==='draft'?'捐赠协议草稿已保存':'捐赠协议已提交审批');},'提交审批',true);
 upload=bindShopUploads(['donationAgreementFile'],base,20,['pdf','doc','docx','png','jpg','jpeg']);
}
function shopDonationPreviewContent(text){return '<div class="preview-phone"><div class="phone-body"><h2>每单捐协议</h2><div class="document-text shop-donation-text" data-donation-live-preview>'+esc(text||'请填写协议正文')+'</div></div></div>';}
function shopDonationPreview(){if(!isMerchant||!currentShop())return;const text=$('#edit-form [name=donationAgreement]')?.value??currentShop().donationAgreement??'';subdialog('每单捐协议 · 客户端预览',shopDonationPreviewContent(text),'关闭');}
function shopDonationEditor(application){
 if(!isMerchant)return;const s=currentShop();if(!s||!ensureEditable(s))return;
 const saved=application||D.applications.find(a=>a.org===S.org&&a.object===s.id&&a.type==='店铺每单捐协议变更'&&['草稿','已撤回','已驳回'].includes(a.status)),text=saved?.snapshot?.donationAgreement??s.donationAgreement??'';
 form('编辑每单捐协议','<div class="hint full">编辑客户端展示的每单捐协议，审批通过后发布。</div><div class="shop-donation-editor-layout full"><div class="shop-donation-editor-input">'+field('协议正文','donationAgreement',text,'textarea',true,true)+'</div><aside class="shop-donation-editor-preview" aria-label="客户端实时预览"><h3>客户端预览</h3>'+shopDonationPreviewContent(text)+'</aside></div>',(data,intent)=>{
  if(intent!=='draft'&&!data.donationAgreement?.trim())return '请填写协议正文。';const error=submitApplication('店铺每单捐协议变更',s,{donationAgreement:data.donationAgreement},intent);if(error)return error;if(saved)saved.status='已替代';closeOverlay();render();toast(intent==='draft'?'每单捐协议草稿已保存':'每单捐协议变更已提交审批');
 },'提交审批',true);
 $('#overlay .dialog').classList.add('shop-donation-editor');
 $('#edit-form [name=donationAgreement]').addEventListener('input',e=>{$('#edit-form [data-donation-live-preview]').textContent=e.target.value||'请填写协议正文';});
}
function organizationInfo(rows){
 return '<dl class="organization-info">'+rows.map(([label,value])=>'<div class="shop-info-row"><dt>'+esc(label)+'</dt><dd><div class="shop-info-value">'+esc(value||'未填写')+'</div></dd></div>').join('')+'</dl>';
}
function organizationPage(){
 if(isMerchant&&!canManageMembers())return heading('暂无访问权限','组织管理仅组织管理员可见。');
 const o=org(),names=['基本资料',...(hasBusinessAccess()||!isMerchant?['资质材料','收款资料']:[]),...(!S.member?['成员管理']:[])];
 const changes=canManageMembers()?organizationChanges():null,review=pending(o.id);
 S.tab=names.includes(S.tab)?S.tab:'基本资料';
 const bodies={
  '基本资料':organizationInfo([['组织名称',o.name],['组织类型',isMerchant?'商家':'基金会'],['入驻状态',o.status],['联系人',o.contactName||o.admin],['联系电话',o.contact],['办公地址',o.address],['组织管理员',o.admin],...(!isMerchant?[['机构宗旨',o.mission||'待完善'],['主要公益领域',(o.foundationFields||[]).join('、')||'待完善']]:[['邀请方',o.inviter]])])
 };
 if(names.includes('资质材料'))bodies['资质材料']=isMerchant?merchantQualifications():organizationInfo([['统一社会信用代码',o.code],...window.FoundationProfile.rows(o,{includeFields:false})]);
 if(names.includes('收款资料'))bodies['收款资料']='<p class="organization-section-note">'+(isMerchant?'本组织账户用于接收商品订单分账。':'本机构直接接收项目捐赠，并接收商品订单公益分账。')+'接收方全称引用组织名称，变更账户时核对。</p>'+organizationInfo([...(!isMerchant?[['分账接收方全称',o.name]]:[]),['微信商户号',paymentAccountText(o.bank,false)],...(isMerchant?[['商品订单收款主体',D.paymentCollection.name]]:[])]);
 if(names.includes('成员管理'))bodies['成员管理']=table(['姓名','手机号','组织身份','授权店铺 / 功能','备注','操作'],D.members.filter(m=>m.org===S.org).map(m=>tr([esc(m.name)+(m.permissionExample?'<div class="member-permission-example">'+esc(m.permissionExample)+'</div>':''),esc(m.phone),badge(m.role),m.role==='组织管理员'?'本组织全部店铺及功能':isMerchant?C.memberSummary(m):esc((m.permissions||[]).join('、')),'<div class="member-remark">'+(m.remark?'<span>'+esc(m.remark)+'</span>':'<span class="muted">—</span>')+(canManageMembers()?link(m.remark?'修改备注':'添加备注','member-remark',m.id):'')+'</div>',m.role==='组织成员'&&canManageMembers()?'<span class="organization-member-actions">'+(isMerchant?link('设置权限','cp-member',m.id):'')+link('删除成员','member-remove',m.id)+'</span>':'—'])))+'<p class="description">成员加入申请在审批中心处理。</p>';
 return heading('组织管理','查看组织资料、分账接收账户及成员。',canManageMembers()?(review?btn('查看待审变更','application',review.id):btn('编辑','org-edit',S.tab,'btn primary')):'')+(changes?.applications.length&&!review?'<div class="organization-change-summary" role="status">已保存修改：'+esc(changes.sections.join('、'))+'。可继续编辑，统一提交后审批生效。</div>':'')+'<section class="card organization-page">'+
 '<nav class="tabs organization-section-nav" aria-label="组织资料分区">'+names.map((name,i)=>'<button type="button" data-action="tab" data-id="'+name+'" aria-controls="organization-section-'+i+'"'+(S.tab===name?' class="tab active" aria-current="location"':' class="tab"')+'>'+name+'</button>').join('')+'</nav>'+
 '<div class="organization-sections">'+names.map((name,i)=>'<section class="organization-section" id="organization-section-'+i+'" data-organization-section="'+name+'" aria-labelledby="organization-section-title-'+i+'"><div class="organization-section-head"><h2 id="organization-section-title-'+i+'">'+name+'</h2>'+(name==='成员管理'?'<div class="inline-actions">'+(isMerchant&&canManageMembers()?btn('角色权限设置','cp-roles'):'')+btn('查看加入申请','nav','approvals')+(canManageMembers()?btn('编辑','org-members-edit','','link'):'')+'</div>':canManageMembers()?(review?btn('查看待审变更','application',review.id,'link'):btn('编辑','org-section-edit',name,'link')):'')+'</div><div class="organization-section-body">'+bodies[name]+'</div></section>').join('')+'</div></section>';
}
let organizationScrollCleanup=()=>{},organizationScrollTarget=null;
function organizationScrollOffset(){
 const nav=$('.organization-section-nav');
 return nav?(parseFloat(nav.style.getPropertyValue('--workspace-sticky-top'))||0)+nav.getBoundingClientRect().height+12:0;
}
function activateOrganizationSection(name,replace=true){
 const nav=$('.organization-section-nav');if(!nav)return;
 for(const button of nav.querySelectorAll('button')){
  const active=button.dataset.id===name;button.classList.toggle('active',active);
  if(active){button.setAttribute('aria-current','location');if(button.offsetLeft<nav.scrollLeft||button.offsetLeft+button.offsetWidth>nav.scrollLeft+nav.clientWidth)nav.scrollTo({left:button.offsetLeft-(nav.clientWidth-button.offsetWidth)/2});}
  else button.removeAttribute('aria-current');
 }
 if(S.tab!==name){S.tab=name;syncWorkspaceRoute(replace);}
}
function scrollOrganizationSection(name){
 const section=[...document.querySelectorAll('[data-organization-section]')].find(el=>el.dataset.organizationSection===name);
 if(!['organization','shop'].includes(S.page)||!section)return;
 activateOrganizationSection(name,false);
 window.scrollTo({top:Math.max(0,window.scrollY+section.getBoundingClientRect().top-organizationScrollOffset()),behavior:'instant'});
 organizationScrollTarget={section,y:window.scrollY};
}
function setupOrganizationScroll(){
 organizationScrollCleanup();
 const nav=$('.organization-section-nav');if(!['organization','shop'].includes(S.page)||!nav)return;
 const sections=[...document.querySelectorAll('[data-organization-section]')],initial=S.tab;
 const container=nav.parentElement.querySelector('.organization-sections'),basePadding=container?parseFloat(getComputedStyle(container).paddingBottom)||0:0;
 const reserveScrollSpace=()=>{if(container&&sections.length)container.style.paddingBottom=(basePadding+Math.max(0,window.innerHeight-organizationScrollOffset()-sections.at(-1).getBoundingClientRect().height))+'px';};
 reserveScrollSpace();
 let frame=0,initialFrame=0;
 const update=()=>{
  frame=0;if(!nav.isConnected)return;
  // A short final section may share the same maximum scroll position as its predecessor.
  if(organizationScrollTarget&&Math.abs(window.scrollY-organizationScrollTarget.y)<1){activateOrganizationSection(organizationScrollTarget.section.dataset.organizationSection);return;}
  organizationScrollTarget=null;
  const offset=organizationScrollOffset()+2;
  let current=sections[0];
  for(const section of sections)if(section.getBoundingClientRect().top<=offset)current=section;
  if(window.scrollY>0&&window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2)current=sections[sections.length-1];
  if(current)activateOrganizationSection(current.dataset.organizationSection);
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const resize=()=>{reserveScrollSpace();schedule();};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',resize);
 initialFrame=requestAnimationFrame(()=>{if(!nav.isConnected)return;if(initial!==sections[0]?.dataset.organizationSection)scrollOrganizationSection(initial);update();});
 organizationScrollCleanup=()=>{organizationScrollTarget=null;window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);cancelAnimationFrame(frame);cancelAnimationFrame(initialFrame);};
}
for(const a of D.applications)if(a.status==='已撤回'){a.withdrawnAt=a.withdrawnAt||a.date;a.approvalStages=a.approvalStages||String(a.stage||'').split(' → ');a.status='草稿';a.stage='未提交';}
function ownApplication(a){return a.accountKey?a.accountKey===S.demoAccount:a.who===currentAccountName();}
const applicationSort={key:'date',direction:'desc'};
const applicationSortKeys=['title','type','status','stage','date'];
const applicationStatusOrder=['草稿','待审核','待审批','已通过','已入驻','已驳回','已替代'];
function applicationsPage(){
 const q=f(),business=D.applications.filter(a=>a.org===S.org&&ownApplication(a)&&(!isMerchant||hasBusinessAccess()&&C.canAction('application',a.id))),onboarding=myMerchantOnboarding().map(a=>({...a,title:a.snapshot.name||'未命名组织',onboarding:true})),all=[...onboarding,...business].sort((a,b)=>String(b.date).localeCompare(String(a.date))),rows=all.filter(a=>matching(a,q.q)&&(!q.status||a.status===q.status)&&(!q.type||a.type===q.type));
 return heading('我的申请',isMerchant?'查看本人新组织入驻及当前组织业务申请的资料、办理进度与历史记录。':'查看本人提交版本的审批进度、意见及历史记录。')+'<section class="card">'+filterBar(select('申请类型','type',[...new Set(all.map(a=>a.type))],q.type,true)+select('申请状态','status',applicationStatusOrder,q.status,true))+applicationTable(rows,true)+'</section>';
}
function applicationTable(rows,sortable=false){
 const heads=['申请内容','类型 / 版本','状态','当前办理环节','更新时间','操作'];
 const compareText=(a,b)=>String(a||'').localeCompare(String(b||''),'zh-CN',{numeric:true});
 const sorted=sortable?[...rows].sort((a,b)=>{
  const key=applicationSort.key,rank=status=>{const index=applicationStatusOrder.indexOf(status);return index<0?applicationStatusOrder.length:index;};
  const value=key==='status'?rank(a.status)-rank(b.status):compareText(a[key],b[key]);
  const primary=value||(key==='type'?Number(a.version||0)-Number(b.version||0):0);
  return primary*(applicationSort.direction==='asc'?1:-1)||compareText(b.date,a.date)||compareText(a.id,b.id);
 }):rows;
 const renderHead=(label,index)=>{
  const key=applicationSortKeys[index];if(!sortable||!key)return '<th>'+esc(label)+'</th>';
  const active=applicationSort.key===key,ascending=active&&applicationSort.direction==='asc',next=active&&!ascending?'升序':active?'降序':key==='date'?'降序':'升序';
  return '<th aria-sort="'+(active?(ascending?'ascending':'descending'):'none')+'"><button type="button" class="application-sort'+(active?' active':'')+'" data-action="application-sort" data-id="'+key+'" title="按'+esc(label)+next+'排列">'+esc(label)+'<span aria-hidden="true">'+(active?(ascending?'↑':'↓'):'↕')+'</span></button></th>';
 };
 return table(heads,sorted.map(a=>{const action=a.onboarding?'context-onboarding-detail':'application';return tr([link(a.title,action,a.id)+'<div class="tiny muted" style="margin-top:5px">'+a.id+'</div>',esc(a.type)+' · v'+a.version,badge(a.status),esc(a.stage),a.date,link('查看详情',action,a.id)]);}),true,renderHead);
}
function approvalsPage(){if(S.member)return '';const q=f(),rows=D.joins.filter(j=>j.org===S.org&&(S.tab==='已处理'?j.status!=='待审批':j.status==='待审批')&&matching(j,q.q));return heading('审批中心','审批本组织的成员加入申请。')+'<section class="card">'+tabs(['待审批','已处理'],S.tab)+filterBar('','搜索申请人姓名 / 手机号')+table(['申请人','手机号','申请类型','当前环节','状态','提交时间','操作'],rows.map(j=>tr([j.name,j.phone,'成员加入','组织管理员审批',badge(j.status),j.date,link(j.status==='待审批'?'去审批':'查看详情','join',j.id)])))+'</section>';}
function logsFor(projectId=''){return [...D.logs,...(isMerchant?C.auditLogs():[])].filter(l=>l.org===S.org&&(!S.member||l.who===currentAccountName())&&(!projectId||l.project===projectId)&&matching(l,f().q)&&(!f().memberId||l.memberId===f().memberId)&&(!f().shop||l.shop===f().shop)&&(!f().product||l.product===f().product)&&(S.tab!=='审批记录'||/审批|录取|驳回/.test(l.action))).sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
function logTable(rows){return table(['操作时间','执行账号 / 身份','操作对象','操作内容','结果'],rows.map(l=>tr([l.date,esc(l.who)+'<div class="tiny muted">'+esc(l.role)+'</div>',esc(l.objectName?l.objectName+'（'+l.object+'）':l.object)+(l.shop?'<div class="tiny muted">'+esc(D.shops.find(s=>s.id===l.shop)?.name||l.shop)+'</div>':''),esc(l.action)+(l.before!==undefined?'<details class="audit-change"><summary>查看变更前后</summary><div class="audit-change-content">'+table(['修改项','变更前','变更后'],auditChangeRows(l.before,l.after),false)+'</div></details>':''),badge(l.result)])));}
function auditChangeRows(before,after,prefix=''){
 if(JSON.stringify(before)===JSON.stringify(after))return [];
 const labels={delivery:'订单状态',after:'售后状态',split:'分账状态',merchantRemark:'订单备注',text:'内容',color:'标记',access:'访问权限',features:'功能权限'};
 if(Array.isArray(before)&&Array.isArray(after)&&[...before,...after].some(v=>v&&typeof v==='object'))return Array.from({length:Math.max(before.length,after.length)},(_,i)=>auditChangeRows(before[i],after[i],prefix+' · '+(after[i]?.name||before[i]?.name||String(i+1)))).flat();
 if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>auditChangeRows(before[k],after[k],(prefix?prefix+' · ':'')+(applicationFieldNames[k]||labels[k]||k)));
 return [tr([esc(prefix||'配置'),esc(auditValue(before)),esc(auditValue(after))])];
}
function auditValue(v){if(v==null)return '—';if(typeof v!=='object')return String(v);if(!Array.isArray(v)&&!('access' in v))return Object.entries(v).map(([k,value])=>(applicationFieldNames[k]||({delivery:'订单状态',after:'售后状态',split:'分账状态',remark:'备注',orderRemark:'备注',merchantRemark:'订单备注',text:'内容',color:'标记'}[k])||k)+'：'+auditValue(value)).join('；');return Array.isArray(v)?v.map(k=>typeof k==='object'?auditValue(k):C.accessCatalog.find(x=>x[0]===k)?.[1]||k).join('、')||'无':(v.access?'可访问':'无访问')+' / '+(v.features||[]).map(k=>({analytics:'数据中心',shop:'店铺管理'})[k]||k).join('、');}
function logsPage(){const q=f();return heading('操作记录','按业务对象追溯本组织的操作与审批。')+'<section class="card">'+tabs(['操作记录','审批记录'],S.tab)+filterBar(isMerchant?select('人员','memberId',D.members.filter(m=>m.org===S.org).map(m=>[m.id,m.name]),q.memberId,true)+select('店铺','shop',authorizedShops().map(s=>[s.id,s.name]),q.shop,true)+select('商品','product',D.products.filter(p=>D.shops.some(s=>s.id===p.shop&&s.org===S.org)).map(p=>[p.id,p.name]),q.product,true):'','搜索业务对象 / 项目 / 操作人')+logTable(logsFor())+'</section>';}
function projectOrders(id){return myOrders().filter(o=>o.project===id);}
function projectProducts(id){return D.products.filter(p=>p.project===id||projectOrders(id).some(o=>o.product===p.id));}
function directDonations(id){return D.donations.filter(d=>d.project===id&&d.status==='支付成功').reduce((n,d)=>n+d.amount,0);}
function donationsTable(rows){return table(['捐赠编号','捐赠人','来源','金额','支付状态','记录时间'],rows.map(d=>tr([esc(d.id),esc(d.name),esc(activity(d.action||d.activity)?.name||'项目直接捐赠')+'<div class="tiny muted">'+(d.action?'公益行动':d.activity?'项目活动':'项目直接捐赠')+'</div>',money(d.amount),badge(d.status),d.date])));}
function projectsPage(){if(S.activity)return activityPage();if(S.project)return projectPage();const q=f(),rows=myProjects().filter(p=>matching(p,q.q)&&(!q.status||p.status===q.status));return heading('项目管理','让公益进展清晰可见，让每一份支持有所回响。',btn(icon('plus')+'新建项目','project-new','','btn primary'))+'<section class="card"><div class="card-head"><div><h2>公益项目</h2><p class="subtitle">'+esc(org().name)+' · '+rows.length+' 个项目</p></div><span class="tiny muted">点击项目名称查看详情</span></div>'+filterBar(select('项目状态','status',['已发布','待审批','已下线','永久下线','已结束','草稿'],q.status,true),'搜索项目名称 / 编号')+table(['项目','状态 / 版本','商品销售 / 退款','分账应收 / 已到账','项目总贡献','操作'],rows.map(p=>{const a=amountRows(projectOrders(p.id));return tr(['<div class="entity"><div class="project-cover">'+(p.id==='J002'?'温暖陪伴':'一起阅读')+'</div><div>'+link(p.name,'project',p.id)+'<small>'+p.id+' · '+esc(p.location)+'<br>截止 '+p.end.slice(0,10)+'</small></div></div>',badge(p.status)+'<div class="tiny muted" style="margin-top:6px">生效 v'+p.version+(D.applications.some(a=>a.object===p.id&&a.status==='待审批')?' · 新版本待审批':'')+'</div>',money(a.paid)+'<div class="tiny muted">退款 '+money(a.refund)+'</div>',money(a.due)+'<div class="tiny muted">已到账 '+money(a.settled)+'</div>',money(a.contribution+directDonations(p.id))+'<div class="progress"><i style="width:'+Math.min(100,(a.contribution+directDonations(p.id))/p.target*100)+'%"></i></div><span class="tiny muted">目标 '+money(p.target)+'</span>',link('查看项目','project',p.id)+' · '+link('编辑','project-edit',p.id)]);}))+'</section>';}
const projectTabs=['基本信息','进展与公示','贡献明细','关联商品','项目活动','公益行动','操作记录'];
function projectPage(){const p=scopedProject(S.project);if(!p){S.project='';return projectsPage();}const rows=projectOrders(p.id);let content='';if(S.projectTab==='基本信息')content='<div class="card-body basic-info-content">'+kv([['项目名称',p.name],['项目简介',p.intro],['项目状态',p.status],['主办方 / 捐赠接收机构',org().name],['承办方','平台公司'],['联合主办方',p.cohost],['组办方',p.organizer],['执行地',p.location],['联系人',projectContactParts(p).contact],['联系电话',projectContactParts(p).contactPhone],['开始时间',p.start?.replace('T',' ')||'—'],['结束时间',p.end.replace('T',' ')],['筹款目标',money(p.target)],['当前生效版本','v'+p.version],['捐赠金额',donationDescription(p)]])+'<div class="divider"></div><h3 class="section-title">项目介绍</h3><p class="document-text">'+esc(p.body)+'</p><div class="divider"></div><div class="inline-actions">'+btn('编辑','project-edit',p.id,'btn primary')+(p.status==='已发布'?btn('项目下线','project-offline',p.id,'btn danger'):p.status==='已下线'?btn('恢复项目','project-restore',p.id):'')+'</div></div>';
if(S.projectTab==='进展与公示')content=projectProgress(p,rows);
if(S.projectTab==='贡献明细')content='<div class="card-body"><div class="summary-line"><span>商品公益款<strong>'+money(amountRows(rows).contribution)+'</strong></span><span>个人捐赠<strong>'+money(directDonations(p.id))+'</strong></span><span>总贡献<strong>'+money(amountRows(rows).contribution+directDonations(p.id))+'</strong></span></div><h3 class="section-title" style="margin-top:25px">个人捐赠记录</h3>'+donationsTable(D.donations.filter(d=>d.project===p.id))+'<div style="margin-top:20px">'+btn('查看商品贡献来源','project-tab','关联商品')+'</div></div>';
if(S.projectTab==='关联商品')content=projectGoods(p);
if(['项目活动','公益行动'].includes(S.projectTab))content=activitiesList(p,S.projectTab);
if(S.projectTab==='操作记录')content=logTable(logsFor(p.id));
return '<div class="breadcrumbs">'+link('项目管理','projects-back','')+'<span>／</span><span>'+esc(p.name)+'</span>'+(S.product?'<span>／</span><span>'+esc(product(S.product)?.name)+'</span>':'')+'</div>'+heading(p.name,'项目 '+p.id+' · '+p.location+' · 当前生效 v'+p.version)+'<div class="subtitle-row">'+badge(p.status)+'<span>所属基金会：'+esc(org().name)+'</span></div>'+metrics(S.product?filteredOrders(rows.filter(o=>o.product===S.product)):S.projectTab==='关联商品'?rows.filter(o=>projectProducts(p.id).some(g=>g.id===o.product&&matching(g,f().q)&&(!f().merchant||D.shops.find(s=>s.id===g.shop)?.org===f().merchant)&&(!f().shop||g.shop===f().shop))):rows,true)+'<section class="card">'+tabs(projectTabs,S.projectTab,'project-tab')+content+'</section>';}
function projectGoods(p){const q=f();if(S.product){const goods=scopedProduct(S.product);const rows=filteredOrders(projectOrders(p.id).filter(o=>o.product===S.product));return '<div class="toolbar-line">'+btn(icon('arrow')+'返回关联商品','goods-back')+'<strong>'+esc(goods?.name)+'</strong></div>'+orderFilters()+summary(rows)+settlementTable(rows);}
const goods=projectProducts(p.id).filter(x=>matching(x,q.q)&&(!q.merchant||D.shops.find(s=>s.id===x.shop)?.org===q.merchant)&&(!q.shop||x.shop===q.shop));return filterBar(select('商家','merchant',D.organizations.filter(o=>o.role==='merchant').map(o=>[o.id,o.name]),q.merchant,true)+select('店铺','shop',D.shops.map(s=>[s.id,s.name]),q.shop,true),'搜索关联商品 / 编号')+summary(projectOrders(p.id).filter(o=>goods.some(g=>g.id===o.product)))+table(['关联商品','所属商家 / 店铺','支付 / 退款件数','实付 / 退款金额','项目应收分账','已到账 / 待结算','操作'],goods.map(g=>{const a=amountRows(projectOrders(p.id).filter(o=>o.product===g.id)),shop=D.shops.find(s=>s.id===g.shop);return tr([productEntity(g),esc(D.organizations.find(o=>o.id===shop.org)?.name)+'<div class="tiny muted">'+esc(shop.name)+'</div>',a.qty+' / '+a.refundQty,money(a.paid)+'<div class="tiny muted">退款 '+money(a.refund)+'</div>',money(a.due),money(a.settled)+'<div class="tiny muted">待结算 '+money(a.due-a.settled)+'</div>',link('查看订单','project-product',g.id)]);}));}
function foundationActivityKind(){return S.page==='actions'?'公益行动':'项目活动';}
function openFoundationActivities(kind,projectId='',draw=true){
 S.page=kind==='公益行动'?'actions':'activities';S.tab=workspaceDefaultTab(S.page);S.project=scopedProject(projectId)?.id||'';S.projectTab='基本信息';S.product='';S.activity='';
 delete S.filters[filterKey()];if(draw){closeOverlay();render();window.scrollTo(0,0);}
}
function foundationActivitiesPage(){
 if(S.activity)return activityPage();
 const kind=foundationActivityKind(),p=scopedProject(S.project);
 return heading(kind,'管理本基金会各项目下的'+kind+'。')+'<section class="card">'+activitiesList(p,kind)+'</section>';
}
function activityCancelLabel(a){return a.kind==='公益行动'?'取消行动':'取消活动';}
function activityListActions(a){return '<div class="activity-row-actions">'+link('查看详情','activity',a.id)+link('编辑','activity-edit',a.id)+(a.status==='已发布'?link('停止报名','activity-stop-registration',a.id):'')+(canCancelActivity(a)?link(activityCancelLabel(a),'activity-cancel',a.id):'')+'</div>';}
function activityTodos(a){
 if(!activityOngoing(a))return [];
 const todos=[],pending=D.registrations.filter(r=>r.activity===a.id&&r.status==='待审核').length;
 if(a.template==='报名类'&&pending)todos.push({type:'registration',label:'报名待审核',count:pending,section:'报名管理'});
 if(a.template==='捐赠参会类'&&!a.meetingPublished)todos.push({type:'meeting',label:'参会信息待发布',section:'参会管理'});
 return todos;
}
function activityTodoLinks(a){const todos=activityTodos(a);return todos.length?todos.map(t=>btn(badge(t.label+(t.count?' '+t.count+' 条':'')),'activity-todo',a.id+':'+t.type,'link')).join(' '):'<span class="muted">—</span>';}
function activityMatchesIssue(a,issue){return !issue||activityTodos(a).some(t=>issue==='yes'||t.type===issue);}
function activityQuickFilters(rows,kind){
 const active=f().issue||'',options=[['','全部'+(kind==='公益行动'?'行动':'活动')],['yes','待处理'],['registration','报名待审核'],...(kind==='项目活动'?[['meeting','参会信息待发布']]:[])];
 return '<div class="quick-filters activity-quick-filters" role="group" aria-label="'+esc(kind)+'快捷筛选">'+options.map(([value,label])=>'<button type="button" class="quick-chip'+(active===value?' active':'')+'" data-action="activity-quick" data-id="'+value+'" aria-pressed="'+(active===value)+'">'+label+'<b>'+rows.filter(a=>activityMatchesIssue(a,value)).length+'</b></button>').join('')+'</div>';
}
function activitiesList(p,kind){const q=f(),rows=D.activities.filter(a=>scopedProject(a.project)&&(!p||a.project===p.id)&&a.kind===kind&&matching(a,q.q)&&(!q.template||a.template===q.template)&&(!q.status||a.status===q.status)),filtered=rows.filter(a=>activityMatchesIssue(a,q.issue));return activityQuickFilters(rows,kind)+'<div class="toolbar-line"><span class="tiny muted">'+esc(p?p.name:org().name)+' / '+kind+'</span>'+btn(icon('plus')+'新建'+kind,'activity-new',kind,'btn primary')+'</div>'+filterBar((!isMerchant&&['activities','actions'].includes(S.page)?select('所属项目','activityProject',myProjects().map(p=>[p.id,p.name]),S.project,true):'')+select('模板类型','template',kind==='公益行动'?['报名类','宣发类']:['报名类','捐款类','捐赠参会类','宣发类'],q.template,true)+select('状态','status',['草稿','待审批','已发布','已停止报名','已结束','已取消'],q.status,true)+select('待处理','issue',[['yes','仅看待处理'],['registration','报名待审核'],...(kind==='项目活动'?[['meeting','参会信息待发布']]:[])],q.issue,true),(kind==='项目活动'?'搜索活动名称':'搜索行动名称'))+table(['标题 / 类型','所属项目','状态 / 版本','参与情况','开始 / 结束时间','待处理','操作'],filtered.map(a=>{const regs=D.registrations.filter(r=>r.activity===a.id);return tr([link(a.name,'activity',a.id)+'<div class="tiny muted">'+esc(a.template)+' · '+a.id+'</div>',link(scopedProject(a.project)?.name||a.project,'project',a.project),badge(a.status)+'<div class="tiny muted">v'+a.version+'</div>',a.template==='捐款类'?money(D.donations.filter(d=>d.activity===a.id&&d.status==='支付成功').reduce((n,d)=>n+d.amount,0)):regs.length+' 人',a.template==='捐款类'?'—':esc(a.start?.replace('T',' ')||'—')+'<div class="tiny muted">至 '+(a.end?.replace('T',' ')||'—')+'</div>',activityTodoLinks(a),activityListActions(a)]);}));}
function activityTabs(a){return ['基本信息',...(a.template==='报名类'?['报名管理','捐赠记录']:a.template==='捐款类'?['捐赠记录']:a.template==='捐赠参会类'?['捐赠记录','参会管理']:['参与信息','捐赠记录']),...(a.status==='已结束'?['资讯记录']:[]),'通知记录','操作记录'];}
function registrationGroupDetail(a){
  if(!['报名类','捐赠参会类'].includes(a.template))return '';
  return '<div class="registration-group registration-group-detail"><strong>组织者微信群二维码</strong>'+(a.groupQr?'<img src="'+esc(a.groupQr)+'" alt="微信群二维码" width="112" height="112">':'<p class="muted">未上传</p>')+'</div>';
}
function activityPage(){const a=activity(S.activity),p=scopedProject(a?.project);if(!a||!p){S.activity='';return projectsPage();}const regs=D.registrations.filter(r=>r.activity===a.id);let body='';if(S.activityTab==='基本信息')body='<div class="card-body basic-info-content">'+kv([['所属项目',p.name],['归属类型',a.kind],['模板',a.template],['生效版本','v'+a.version],...(['宣发类','捐款类'].includes(a.template)?[]:[['开始时间',a.start?.replace('T',' ')],['结束时间',a.end?.replace('T',' ')]]),...(['报名类','捐赠参会类'].includes(a.template)?[['报名截止时间',a.deadline?.replace('T',' ')]]:[]),...(['宣发类','捐款类'].includes(a.template)?[]:a.template==='捐赠参会类'&&a.format==='线上'?[['参会形式','线上']]:[[a.kind==='公益行动'?'行动地点':'活动地点',a.location]]),['主办组织',org().name],...(a.template==='宣发类'?[]:[['联系人',projectContactParts(a).contact],['联系电话',projectContactParts(a).contactPhone]]),['名额',a.capacity+' 人'],['捐赠金额',donationDescription(a)]])+registrationGroupDetail(a)+'<div class="divider"></div><p class="document-text">'+esc(a.intro)+'</p><div class="divider"></div><div class="inline-actions">'+btn('编辑','activity-edit',a.id,'btn primary')+(['已发布'].includes(a.status)?btn('停止报名','activity-stop-registration',a.id,'btn danger'):'')+(a.template==='捐赠参会类'&&activityOngoing(a)?btn('延期','activity-postpone',a.id):'')+(canCancelActivity(a)?btn(activityCancelLabel(a),'activity-cancel',a.id,'btn danger'):'')+'</div></div>';
if(S.activityTab==='报名管理')body='<div class="summary-line"><span>报名<strong>'+regs.length+' 人</strong></span><span>已录取<strong>'+regs.filter(r=>r.status==='已录取').length+' 人</strong></span><span>录取名额<strong>'+a.capacity+' 人</strong></span></div>'+table(['报名人','联系电话','报名版本','状态','提交时间','操作'],regs.map(r=>tr([esc(r.name)+(r.company?'<div class="tiny muted">'+esc(r.company)+(r.position?' · '+esc(r.position):'')+'</div>':''),r.phone,r.version,badge(r.status),r.date,link('查看资料','registration',r.id)])));
if(S.activityTab==='捐赠记录')body=donationsTable(D.donations.filter(d=>d.activity===a.id||d.action===a.id));
if(S.activityTab==='参会管理')body='<div class="card-body"><div class="hint">有效资格 '+regs.filter(r=>r.status==='资格有效').length+' 人 · 付款名额保留 '+(a.held||0)+' 人 · 总名额 '+a.capacity+' 人</div><div class="inline-actions">'+btn(a.meetingPublished?'变更具体参会信息':'发布具体参会信息','meeting',a.id,'btn primary')+btn('查看腾讯会议导入名单','meeting-list',a.id)+'</div><p class="description">'+(a.meetingPublished?'具体参会信息已发布，通知已记录。':'具体参会信息尚未发布，请于活动开始前发布。')+'</p></div>'+table(['参会人','联系电话','资格','名单处理','操作'],regs.map(r=>tr([r.name,r.phone,badge(r.status),r.imported?'已手动导入':'待手动导入',r.status==='资格有效'?link(a.format==='线下'?'登记签到':r.imported?'查看导入记录':'记录已导入','meeting-import',r.id)+' · '+link('取消资格','revoke',r.id):'—'])));
if(S.activityTab==='参与信息'){const related=D.registrations.filter(r=>r.activity===a.related&&['已录取','资格有效'].includes(r.status));body='<div class="card-body">'+kv([['关联同项目活动',activity(a.related)?.name||'未配置'],['参与人数',related.length+' 人']])+'</div>'+table(['参与人','所属企业','状态'],related.map(r=>tr([esc(r.name),esc(r.company||'—'),badge(r.status)])));}
if(S.activityTab==='通知记录')body=notificationTable(a);
if(S.activityTab==='资讯记录')body=activityNews(a);
if(S.activityTab==='操作记录')body=logTable(logsFor(p.id).filter(l=>l.object===a.name||l.object===a.id));
return '<div class="breadcrumbs">'+link('项目管理','projects-back','')+'<span>／</span>'+link(a.kind,'activity-back','')+'<span>／</span><span>'+esc(a.name)+'</span></div>'+heading(a.name,p.name+' · '+a.template)+'<div class="subtitle-row">'+badge(a.status)+'<span>当前生效 v'+a.version+'</span></div><section class="card">'+tabs(activityTabs(a),S.activityTab,'activity-tab')+body+'</section>';}
function notificationTable(a){const sent=a.meetingPublished||a.status==='已停止报名'||a.notice;return '<div class="card-body">'+(sent?table(['渠道','通知内容','发送结果','最近发送','操作'],[tr(['微信订阅消息',esc(a.notice||'参会信息发布 / 变更通知'),badge(a.noticePending?'等待回执':'发送成功'),'2026-10-30 14:00',link('重新通知','notify-activity',a.id)])]):'<div class="empty"><p>暂无通知记录</p><span class="tiny muted">业务发布或变更后将在此保留通知结果。</span></div>')+'</div>';}
function dialog(title,body,foot='',wide=false){priorFocus=document.activeElement;$('#overlay').innerHTML='<div class="overlay-shade"><section class="dialog '+(wide?'wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="dialog-head"><h2>'+esc(title)+'</h2>'+'<button type="button" class="icon-btn" data-action="close" aria-label="关闭弹窗">'+icon('close')+'</button></div><div class="dialog-body">'+body+'</div>'+(foot?'<div class="dialog-foot">'+foot+'</div>':'')+'</section></div>';document.body.style.overflow='hidden';($('#overlay').querySelector('input:not([type=hidden]),select,textarea')||$('#overlay').querySelector('button'))?.focus();}
function closeOverlay(){closeSecondary();window.MerchantDateRange?.close();window.WorkbenchContentPreview?.close();closeSplitPlanHover();orderRemarkEditor=null;document.body.classList.remove('merchant-subpage-open');for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls.length=0;$('#overlay').innerHTML='';formHandler=null;S.order='';document.body.style.overflow=$('.analytics-data-dialog')?'hidden':'';if(priorFocus?.isConnected)priorFocus.focus();syncWorkspaceRoute();}
const previewUrls=[];
function cancelOverlay(){if(orderProductContext){const context=orderProductContext;orderProductContext=null;closeOverlay();if(context.returnAction)openOrderAction(context.returnAction.id,context.returnAction.kind,context.returnAction.anchor,context.returnAction.sourceIndex);else if(!context.fromList)openOrder(context.id,context.section||'订单信息');context.focus?.isConnected&&context.focus.focus();window.scrollTo(0,context.scrollY);return;}const panel=$('#overlay .dialog'),context=panel?.returnActionContext,id=panel?.dataset.returnOrder,section=panel?.dataset.returnSection;closeOverlay();if(context)openOrderAction(context.id,context.kind,context.anchor,context.sourceIndex);else if(id)openOrder(id,section);}
function form(title,body,handler,button='确认提交',draft=false){
 const parentOrder=$('#overlay .order-detail')?S.order:'',parentAction=orderActionContext(),sourceAnchor=$('#overlay .order-action-popover')?.sourceAnchor;
 const context=permissionActionContext;formHandler=(...args)=>{if(isMerchant&&context&&!C.canAction(context.action,context.id))return '人员权限已更新，请关闭后重新操作。';return handler(...args);};const primary='<button type="submit" class="btn primary" name="intent" value="submit">'+esc(button)+'</button>',secondary=btn('取消','close'),save=draft?'<button type="submit" class="btn" name="intent" value="draft" formnovalidate>保存草稿</button>':'';
 dialog(title,'<form id="edit-form"><div class="form-grid">'+body+'</div><div class="form-error" role="alert" aria-live="polite" id="form-error"></div><div class="dialog-foot">'+(isMerchant?primary+save+secondary:secondary+save+primary)+'</div></form>');
 C?.bindMatrix();
 if(parentAction){const panel=$('#overlay .dialog');panel.returnActionContext=parentAction;panel.classList.add('order-action-form');anchorOrderDialog(sourceAnchor);}
 if(isMerchant&&parentOrder){const panel=$('#overlay .dialog');panel.dataset.returnOrder=parentOrder;panel.dataset.returnSection=/售后|退款/.test(title)?'售后信息':'发货与物流';}
}

function reasonDialog(title,explanation,done,context='',submitLabel='确认提交'){form(title,context+'<p class="full danger-note">'+esc(explanation)+'</p>'+field('原因','reason','','textarea',true,true),data=>{if(!data.reason?.trim())return '请填写原因。';const error=done(data.reason.trim());if(error)return error;closeOverlay();render();toast('处理结果已记录');},submitLabel);if(isMerchant)$('#overlay .dialog').classList.add('merchant-confirm');}
function consent(text='我已阅读并同意适用协议'){return '<div class="full"><div class="inline-actions tiny" style="margin-bottom:10px">'+btn('阅读适用协议','read-agreement','','link')+'</div>'+checkbox(text,'agreement')+'</div>';}
function pending(object){return D.applications.find(a=>a.org===S.org&&a.object===object&&a.status==='待审批');}
function submitApplication(type,obj,snapshot,intent='submit'){if(isMerchant&&type.includes('商品')&&type!=='商品下架'){const issue=productSplitIssue({...obj,...snapshot});if(issue)return issue;if(intent!=='draft'&&snapshot.status!=='已下架'){const qualificationIssue=productOperatingQualificationIssue({...obj,...snapshot});if(qualificationIssue)return qualificationIssue;}}const existing=pending(obj.id);if(existing)return '该对象已有待审批版本，请先在“我的申请”撤回。';const version=Math.max(obj.version||0,...D.applications.filter(a=>a.object===obj.id).map(a=>a.version))+1;D.applications.unshift({id:'AP'+Date.now(),org:S.org,type,object:obj.id,title:snapshot.name||obj.name||org().name,status:intent==='draft'?'草稿':'待审批',stage:intent==='draft'?'未提交':isMerchant?(org().inviter==='平台自营'?'系统商家管理员审批':'商协会初审 → 系统商家管理员终审'):'系统基金会管理员审批',version,date:new Date().toLocaleString('sv-SE'),baseline:JSON.parse(JSON.stringify(obj)),snapshot:JSON.parse(JSON.stringify(snapshot)),who:currentAccountName(),accountKey:S.demoAccount});if(type.includes('商品')&&product(obj.id))product(obj.id).review=intent==='draft'?'草稿':'待审批';record(obj.id||obj.name||org().name,(intent==='draft'?'保存草稿':'提交审批')+' · '+type,obj.project||(!isMerchant&&project(obj.id)?obj.id:''),'成功',{before:obj,after:{...obj,...snapshot}});return '';}
function merchantSubpage(kind){
 if(!isMerchant)return;
 const shade=$('#overlay .overlay-shade'),panel=shade?.querySelector('.dialog,.drawer');if(!panel)return;
 document.body.classList.add('merchant-subpage-open');shade.classList.add('merchant-page-shade');panel.classList.add('merchant-page-panel');panel.dataset.merchantPage=kind;syncWorkspaceRoute();
 const head=panel.querySelector('.dialog-head,.drawer-head'),close=head?.querySelector('[data-action=close]');
 if(close){close.className='link merchant-page-back';close.innerHTML='‹ 返回'+(kind.startsWith('product')?(S.page==='analytics'?'数据中心':'商品管理'):kind.startsWith('shop')?'店铺管理':kind.startsWith('organization')?('组织管理'):'订单查询');close.setAttribute('aria-label',close.textContent.trim());}
 if(kind==='product-editor'||kind==='product-detail'){
 const sections=[...panel.querySelectorAll('.pe-section')];sections.forEach((section,i)=>section.dataset.merchantEditorSection=i);
 panel.querySelector('.dialog-body').insertAdjacentHTML('afterbegin','<nav class="merchant-editor-nav" aria-label="商品信息分区">'+sections.map((section,i)=>'<button type="button" data-action="pe-jump" data-id="'+i+'">'+esc(section.querySelector('h3').innerText)+'</button>').join('')+'</nav>');
 }
}
function ensureEditable(obj){if(pending(obj.id)){applicationDialog(pending(obj.id).id);toast('已有待审版本，可撤回后修改');return false;}return true;}
let productEditState=null,productValueSort=null,draggedSpecValue=null;
const peImage=(src,name)=>({src,name});
const peSpecKey=()=> 'spec-'+Date.now()+'-'+Math.random().toString(36).slice(2);
const peRequirement=required=>required?'<span class="required-tip" aria-label="必填" title="必填">*</span>':'';
function productMediaPanel(key,title,required=false){return '<div class="pe-field"><div class="pe-label">'+title+peRequirement(required)+'</div><div>'+(key==='carousel'?'<p class="pe-field-note">图片要求：宽高比例为1:1或3:4，且宽高均大于480px，大小3M内。</p>':'')+'<div class="pe-field-note" data-media-count="'+key+'"></div><div class="pe-media-list" data-media-list="'+key+'"></div></div></div>';}
function shippingTemplateBrief(template){return template.rules.map(r=>r.regions.join('、')+'：'+r.firstCount+'件内'+money(r.firstFee)+(Number(r.extraFee)?'，每增加'+r.extraCount+'件加'+money(r.extraFee):'')).join('；')+'；其他地区不配送';}
function renderShippingTemplate(){
 const state=productEditState,select=$('#pe-shipping-template');if(!select)return;
 select.innerHTML=state.shippingTemplates.map(t=>'<option value="'+esc(t.id)+'"'+(t.id===state.shippingTemplateId?' selected':'')+'>'+esc(t.name)+'</option>').join('');
 const t=state.shippingTemplates.find(t=>t.id===state.shippingTemplateId);if(!t)return;
 const unavailable=ShippingTemplates.regions.filter(region=>!t.rules.some(r=>r.regions.includes(region)));
 const priceLine=r=>'<div class="pe-shipping-price-line"><span>'+r.firstCount+' 件内 '+Number(r.firstFee).toFixed(2)+' 元</span><span>每增加 '+r.extraCount+' 件，增加运费 '+Number(r.extraFee).toFixed(2)+' 元</span></div>';
 $('#pe-shipping-summary').innerHTML='<div class="pe-shipping-table-wrap"><table class="pe-shipping-table"><thead><tr><th>配送地区</th><th>配送费用</th></tr></thead><tbody>'+t.rules.map(r=>'<tr><td>'+esc(r.regions.join('、'))+'</td><td>'+priceLine(r)+'</td></tr>').join('')+'<tr><td>'+esc([...unavailable,'其他地区'].join('、'))+'</td><td>不配送</td></tr></tbody></table></div>';
}
function readShippingDraft(){
 const state=productEditState;if(!$('#secondary [name=shippingTemplateName]'))return;
 state.shippingDraft.name=$('#secondary [name=shippingTemplateName]').value.trim();
 $('#secondary').querySelectorAll('[data-shipping-field]').forEach(input=>{const [i,key]=input.dataset.shippingField.split(':');state.shippingDraft.rules[+i][key]=input.value===''?'':Number(input.value);});
}
function openShippingTemplate(){
 const t=productEditState.shippingDraft;closeSecondary();
 const amount=(r,i,key,label,whole)=>'<input aria-label="'+label+' '+(i+1)+'" data-shipping-field="'+i+':'+key+'" type="number" min="'+(whole?1:0)+'" step="'+(whole?1:'0.01')+'" value="'+esc(String(r[key]))+'" required>';
 subdialog(t.id===productEditState.shippingTemplateId?'编辑运费模板':'新建运费模板','<div class="pe-shipping-editor"><label class="pe-shipping-name">模板名称'+peRequirement(true)+'<input name="shippingTemplateName" value="'+esc(t.name)+'" maxlength="40" placeholder="请输入模板名称" required></label><p class="pe-field-note">按件数计费，按收货地区匹配运费。</p><div class="pe-shipping-table-wrap"><table class="pe-shipping-table"><thead><tr><th>配送地区'+peRequirement(true)+'</th><th>配送费用'+peRequirement(true)+'</th><th>操作</th></tr></thead><tbody>'+t.rules.map((r,i)=>'<tr><td><div class="pe-shipping-region-text">'+esc(r.regions.join('、')||'请选择地区')+'</div>'+btn('编辑地区','pe-shipping-regions',String(i),'link')+'</td><td><div class="pe-shipping-price-line"><span>'+amount(r,i,'firstCount','首件数量',true)+'件内'+amount(r,i,'firstFee','首件运费')+'元</span><span>每增加'+amount(r,i,'extraCount','续件数量',true)+'件，增加运费'+amount(r,i,'extraFee','续件运费')+'元</span></div></td><td>'+btn('删除','pe-shipping-rule-remove',String(i),'link')+'</td></tr>').join('')+'</tbody></table></div>'+btn('＋ 添加地区运费','pe-shipping-rule-add','','link')+'<p class="pe-field-note pe-shipping-unavailable">不配送地区：'+esc([...ShippingTemplates.regions.filter(region=>!t.rules.some(r=>r.regions.includes(region))),'其他地区'].join('、'))+'</p><p id="pe-shipping-error" class="form-error" role="alert"></p></div>','取消');
 $('#secondary .dialog').classList.add('pe-shipping-dialog');
 $('#secondary .dialog-foot').innerHTML=btn('确认','pe-shipping-save','','btn primary')+btn('取消','secondary-close');
}
function openShippingRegions(index){
 const state=productEditState,t=state.shippingDraft,selected=t.rules[index].regions;
 state.shippingRegionIndex=index;const used=new Set(t.rules.flatMap((r,i)=>i===index?[]:r.regions));
 const groups=[['ABCFG',['北京','安徽','重庆','福建','甘肃','广东','广西','贵州','澳门']],['HJ',['海南','河北','河南','黑龙江','湖北','湖南','吉林','江苏','江西']],['LNQS',['辽宁','内蒙古','宁夏','青海','山东','山西','陕西','上海','四川']],['TXYZ',['天津','西藏','新疆','云南','浙江','香港','台湾']]];
 closeSecondary();subdialog('选择配送地区','<div class="pe-region-picker"><div class="pe-region-toolbar">'+btn('全选可选地区','pe-shipping-regions-all','','link')+'<span>已选 <b id="pe-region-count">'+selected.length+'</b> 个地区</span></div>'+groups.map(([name,regions])=>'<div class="pe-region-group"><strong>'+name+'</strong><div>'+regions.map(region=>'<label><input type="checkbox" data-shipping-region value="'+region+'"'+(selected.includes(region)?' checked':'')+(used.has(region)?' disabled':'')+'>'+region+'</label>').join('')+'</div></div>').join('')+'</div>','返回模板');
 $('#secondary .dialog').classList.add('pe-shipping-regions-dialog');
 $('#secondary .dialog-foot').innerHTML=btn('确认地区','pe-shipping-regions-confirm','','btn primary')+btn('取消','pe-shipping-regions-cancel');
}
function shippingTemplateAction(action,id){
 const state=productEditState;
 if(action==='pe-shipping-new'||action==='pe-shipping-edit'){
  const selected=state.shippingTemplates.find(t=>t.id===state.shippingTemplateId);
  state.shippingDraft=action==='pe-shipping-new'?{id:'FT-'+Date.now(),org:org().id,name:'',rules:[]}:ShippingTemplates.clone(selected);openShippingTemplate();return;
 }
 if(!state.shippingDraft)return;
 if(action==='pe-shipping-regions-all'){
  const choices=[...$('#secondary').querySelectorAll('[data-shipping-region]:not(:disabled)')],all=choices.every(el=>el.checked);choices.forEach(el=>el.checked=!all);$('#pe-region-count').textContent=choices.filter(el=>el.checked).length;return;
 }
 if(action==='pe-shipping-regions-confirm'){
  state.shippingDraft.rules[state.shippingRegionIndex].regions=[...$('#secondary').querySelectorAll('[data-shipping-region]:checked')].map(el=>el.value);openShippingTemplate();return;
 }
 if(action==='pe-shipping-regions-cancel'){openShippingTemplate();return;}
 readShippingDraft();
 if(action==='pe-shipping-regions'){openShippingRegions(+id);return;}
 if(action==='pe-shipping-rule-add'){state.shippingDraft.rules.push({regions:[],firstCount:1,firstFee:'',extraCount:1,extraFee:0});openShippingTemplate();return;}
 if(action==='pe-shipping-rule-remove'){state.shippingDraft.rules.splice(+id,1);openShippingTemplate();return;}
 if(action==='pe-shipping-save'){
  const error=ShippingTemplates.error(state.shippingDraft);if(error){$('#pe-shipping-error').textContent=error;return;}
  const at=state.shippingTemplates.findIndex(t=>t.id===state.shippingDraft.id),template=ShippingTemplates.clone(state.shippingDraft);
  if(at<0)state.shippingTemplates.push(template);else state.shippingTemplates[at]=template;
  state.shippingTemplateId=template.id;closeSecondary();renderShippingTemplate();updateProductMobilePreview();state.shippingDraft=null;
 }
}

function productEditor(id,readOnly=false,historicalProduct=null){
 if(!readOnly&&(!isMerchant||!canUse('products')||!merchantOpen()))return;
 const existing=historicalProduct||(id?scopedProduct(id):null);if(id&&!existing)return;if(!readOnly&&existing&&!C.canProduct(existing,'edit'))return;if(existing&&!readOnly&&!ensureEditable(existing))return;
 const draft=D.applications.find(a=>a.object===id&&['草稿','已撤回','已驳回'].includes(a.status));
 const base=existing||{id:'P'+Date.now(),name:'',shop:currentShop().id,project:'J001',promise:'',promisor:org().name,plan:'',returnAddress:'',pickupAfter:true,skus:[{name:'默认规格',price:68,stock:0,fund:10,association:3,university:2}],status:'未上架',version:0,art:0};
 const p={...base,...(!readOnly&&draft?.snapshot||{})};
 productEditState=JSON.parse(JSON.stringify({carousel:p.carouselImages||[],details:p.detailImages||[],specs:p.specs||[],skus:p.skus,parameters:p.parameters||["品牌","产地","发货地","类型","材质"].map(name=>({name,value:""}))}));
 productEditState.permissionBaseline=JSON.parse(JSON.stringify(p));productEditState.readOnly=readOnly;productEditState.productId=id||'new';productEditState.historicalProduct=historicalProduct;
 const templateOrg=D.shops.find(s=>s.id===p.shop)?.org||org().id;
 productEditState.shippingTemplates=ShippingTemplates.clone((D.shippingTemplates||[]).filter(t=>t.org===templateOrg));
 if(!productEditState.shippingTemplates.length)productEditState.shippingTemplates=[ShippingTemplates.defaultTemplate(templateOrg)];
 const bound=p.shippingTemplate||productEditState.shippingTemplates.find(t=>t.id===p.shippingTemplateId)||productEditState.shippingTemplates[0];
 productEditState.shippingTemplateId=bound.id;
 const boundIndex=productEditState.shippingTemplates.findIndex(t=>t.id===bound.id);if(boundIndex>=0)productEditState.shippingTemplates[boundIndex]=ShippingTemplates.clone(bound);else productEditState.shippingTemplates.push(ShippingTemplates.clone(bound));
 const combinations=productSkuCombinations();productEditState.skus.forEach(s=>s.specKey=combinations.find(c=>c.name===s.name)?.specKey||s.specKey||'');
 productEditState.splitPlans=JSON.parse(JSON.stringify(p.splitPlans||null));
 productEditState.stockBaseline=Object.fromEntries(productEditState.skus.map(s=>[s.specKey,Number(base.skus.find(k=>(k.specKey&&k.specKey===s.specKey)||k.name===s.name)?.stock)||0]));
 const body='<section class="pe-section" id="pe-basic"><h3><span>1</span>基本信息</h3><div class="pe-basic-layout"><div class="pe-basic-fields">'+productMediaPanel('carousel','商品轮播图',true)+'<div class="pe-field"><label class="pe-label" for="pe-title">商品标题'+peRequirement(true)+'</label><input id="pe-title" name="name" value="'+esc(p.name)+'" placeholder="请输入商品标题" required></div><div class="pe-field"><div class="pe-label">商品参数'+peRequirement(false)+'</div><div><p class="pe-field-note">填写品牌、产地、发货地、类型、材质等，可添加其他参数。</p><div id="pe-parameters"></div>'+btn('＋ 添加参数','pe-parameter-add','','link')+'</div></div><div class="pe-field"><div class="pe-label">商品详情图'+peRequirement(true)+'</div><div><p class="pe-field-note">上传详情图片，拖拽调整展示顺序。</p><div class="pe-detail-layout"><div class="pe-detail-edit">'+productMediaPanel('details','快捷编辑')+'</div></div></div></div><div class="pe-field"><div class="pe-label">商品规格'+peRequirement(false)+'</div><div class="pe-spec-area"><p class="pe-field-note">最多添加 2 个商品规格类型</p><div id="pe-specs"></div>'+btn('＋ 添加规格类型','pe-spec-add','','btn')+'</div></div></div><aside class="pe-mobile-preview" aria-label="商品手机预览"><div class="pe-mobile-preview-head"><strong>手机预览</strong>'+btn('刷新','pe-mobile-refresh','','link')+'</div><div id="pe-mobile-preview"></div><p class="pe-mobile-preview-note">沿用客户端商品详情，实时预览当前内容</p></aside></div></section>'+
 '<section class="pe-section" id="pe-inventory"><h3><span>2</span>价格与库存</h3><div class="pe-field"><div class="pe-label">价格及库存'+peRequirement(true)+'</div><div class="pe-stock-area"><div class="pe-stock-tools"><p class="pe-field-note">请如实填写库存信息，确保商品可以在承诺发货时间内发出。</p>'+btn('Excel 批量编辑规格','pe-sheet','','link')+btn('全屏编辑','pe-fullscreen','','link')+'</div><div class="pe-sku-scroll"><div class="pe-batch"><div id="pe-batch-scopes"></div><div class="pe-stock-input"><input id="pe-batch-mode" type="hidden" value="add">'+peStockButtons('batch','add')+'<input id="pe-batch-stock" type="number" min="0" step="1" placeholder="库存" aria-label="批量库存"></div><div class="pe-price-input"><input id="pe-batch-price" type="number" min="0.01" step="0.01" placeholder="售价" aria-label="批量售价"><span>元</span></div>'+btn('批量设置','pe-batch','','btn')+'</div><table class="pe-sku-table"><thead class="pe-sku-head"></thead><tbody id="sku-rows"></tbody></table></div><p class="pe-field-note pe-code-note">规格编码用于对应商家自己的商品 ID。</p><div class="pe-sku-summary" id="pe-sku-summary" aria-live="polite"></div></div></div></section>'+
 '<section class="pe-section" id="pe-charity"><h3><span>3</span>公益分账配置</h3><div class="pe-config-grid"><div class="full pe-field-note">商品订单收款主体：'+esc(D.paymentCollection.name)+'（平台统一收款）</div>'+select('关联项目','project',historicalProduct?[[p.project,p.projectName||p.project]]:D.projects.map(j=>[j.id,j.name]),p.project)+'<div class="full pe-split-config"><p class="pe-field-note">按全部规格、单一规格值或完整规格组合配置。可直接改选范围，调整期间保留各套金额，提交前须补齐规格并消除重复。每件金额，比例按对应售价计算。</p><div class="pe-split-scroll"><table class="pe-split-table pe-grouped-split" id="pe-split-table"><thead><tr><th>规格</th><th>分账对象</th><th>每件金额（元）</th><th class="pe-split-operation">操作</th></tr></thead></table></div>'+btn('＋ 添加规格分账','pe-plan-add','','btn')+'<p class="pe-field-note" id="pe-split-coverage" role="status"></p><p class="pe-field-note" id="split-preview" aria-live="polite"></p></div>'+field('贡献承诺主体','promisor',p.promisor)+field('公益承诺','promise',p.promise,'textarea',true,true)+'</div></section>'+
 '<section class="pe-section" id="pe-service"><h3><span>4</span>服务与承诺</h3><div class="pe-config-grid">'+'<div class="full pe-customer-service"><label class="pe-label" for="pe-customer-service">接待客服账号 ID（open_kfid）</label><div class="pe-shipping-tools"><input id="pe-customer-service" name="customerServiceId" aria-label="接待客服 ID" value="'+esc(p.customerServiceId||'')+'" placeholder="留空使用店铺客服，填写 open_kfid 指定客服" autocomplete="off">'+btn('测试咨询','customer-service-test',existing?.id||'','link')+'</div><p class="pe-field-note" id="pe-customer-service-summary">'+customerServiceDescription(p)+'</p></div><div class="full pe-shipping-config"><label class="pe-label" for="pe-shipping-template">运费模板'+peRequirement(true)+'</label><div class="pe-shipping-tools"><select id="pe-shipping-template" name="shippingTemplateId" aria-label="运费模板" required></select>'+btn('新建模板','pe-shipping-new','','link')+btn('编辑模板','pe-shipping-edit','','link')+'</div><div id="pe-shipping-summary"></div></div><div class="full pe-dispatch-promise"><span id="pe-dispatch-label">承诺发货时间</span><input type="hidden" name="shippingHours" value="48"><span>付款后48小时内发货；满7天未发货自动退款。</span></div><div class="full pe-service-promises"><span class="pe-label">服务承诺</span><div>'+checkbox('现场领取后支持售后','pickupAfter',p.pickupAfter)+checkbox('退货免审批','returnAuto',p.returnAuto)+checkbox('7天无理由退货','sevenDayReturn',p.sevenDayReturn)+'</div></div>'+field('退货地址、联系人及电话','returnAddress',p.returnAddress,'textarea',true,true)+consent()+'</div></section>'+(!historicalProduct&&isMerchant?'<section class="pe-section" id="pe-collaboration"><h3><span>5</span>人员权限与协作</h3><div class="pe-config-grid">'+C.editorField(p,readOnly,readOnly||!C.canManageProduct(p))+'</div></section>':'');
 form(readOnly?'商品详情':id?'编辑商品':'新建商品',body,(data,intent)=>{
  if((existing?!canUse('products'):!canManageMembers())||base.shop!==currentShop()?.id||!C.canProduct(base,'edit'))return '商品权限或店铺已更新，请重新打开商品。';
  Object.keys(data).filter(key=>key.startsWith('peStockMode')).forEach(key=>delete data[key]);
  const skus=readProductSkus(),state=productEditState,parameters=readProductParameters().filter(p=>p.value||!["品牌","产地","发货地","类型","材质"].includes(p.name));
  if(existing&&!C.canProduct(existing,'stock')&&(skus.some(s=>Number(s.stock)!==Number(existing.skus.find(k=>(k.specKey&&k.specKey===s.specKey)||k.name===s.name)?.stock||0))||existing.skus.some(k=>k.stock>0&&!skus.some(s=>(k.specKey&&k.specKey===s.specKey)||k.name===s.name))))return '没有调整库存权限，请保留原库存或联系有权限的人员。';
  if(existing){
   const baseline=state.permissionBaseline,structure=items=>JSON.stringify(items.map(g=>({name:g.name,values:g.values.map(v=>v.name)})));
   if(!(C.canProduct(existing,'stock')&&C.canProduct(existing,'price'))&&(structure(state.specs)!==structure(baseline.specs||[])||skus.length!==baseline.skus.length))return '变更规格结构需要商品资料、库存及价格分账修改权限。';
   const amountSignature=items=>JSON.stringify(items.map(s=>({price:Number(s.price),fund:Number(s.fund),recipients:productSplitRecipients(s).map(r=>[r.id,Number(r.amount)]),randomMin:s.randomMin==null?null:Number(s.randomMin),randomMax:s.randomMax==null?null:Number(s.randomMax)})));
   if(!C.canProduct(existing,'price')){
    const fields=['project','donationMode','donationRatio'];for(const key of fields)if(data[key]===undefined)data[key]=baseline[key]??(key==='donationMode'?'fixed':key==='donationRatio'?'':baseline.project);
    if(amountSignature(skus)!==amountSignature(baseline.skus)||fields.some(key=>String(data[key]??'')!==String(baseline[key]??(key==='donationMode'?'fixed':''))))return '没有调整价格及分账权限，请保留原配置。';
   }
   if(!C.canProduct(existing,'publish')&&skus.some((sku,i)=>(sku.published!==false)!==(baseline.skus[i]?.published!==false)))return '没有上下架权限，请保留原规格状态。';
  }
  if(parameters.some(p=>(p.name||p.value)&&(!p.name||!p.value)))return "请完整填写参数名称和参数值，或删除该参数。";
  const filledParameters=parameters.filter(p=>p.name&&p.value);
  if(new Set(filledParameters.map(p=>p.name)).size!==filledParameters.length)return "商品参数名称不能重复。";
  data.collaboratorName=(data.collaboratorName||'').trim();
  const people=C.canManageProduct(base)?C.readPersonPermissions(base):null;
  if(people){const error=C.validatePeople(base,null,people);if(error)return error;}
  if(!data.name.trim())return '请填写商品标题。';
  if(state.specs.some(g=>!g.name.trim()||!g.values.some(v=>v.name.trim())))return '请填写规格类型及规格值。';
  if(state.specs.some(g=>new Set(g.values.filter(v=>v.name.trim()).map(v=>v.name.trim())).size!==g.values.filter(v=>v.name.trim()).length)||new Set(state.specs.map(g=>g.name.trim())).size!==state.specs.length)return '规格类型及同类型的规格值不能重复。';
  const shippingTemplate=state.shippingTemplates.find(t=>t.id===state.shippingTemplateId);
  if(!shippingTemplate||ShippingTemplates.error(shippingTemplate))return '请选择有效的运费模板。';
  data.customerServiceId=(data.customerServiceId||'').trim();if(data.customerServiceId){const result=CS.verify(data.customerServiceId);if(result.error)return result.error;}
  if(Number(data.shippingHours)!==48)return '请选择承诺发货时间。';
  const coverageIssue=productSplitCoverageIssue();if(coverageIssue&&intent!=='draft')return coverageIssue;
  const splitSkus=[...skus,...state.splitPlans.flatMap((plan,index)=>{const config=productSplitConfig(plan.config),indices=productSplitPlanIndices(index);return (indices.length?indices:[0]).filter(i=>skus[i]).map(i=>({...skus[i],...config,fund:Number(config.fund),splitRecipients:config.splitRecipients.map(r=>({...r,amount:r.amount===''?'':Number(r.amount)}))}));})];
  const randomDonation=data.donationMode==='random';
  if(randomDonation&&(!Number.isFinite(Number(data.donationRatio))||Number(data.donationRatio)<=0||Number(data.donationRatio)>100||Math.abs(Number(data.donationRatio)*100-Math.round(Number(data.donationRatio)*100))>0.00001))return '请填写大于 0 且不超过 100 的目标捐赠比例，最多两位小数。';
  if(randomDonation&&splitSkus.some(s=>productSplitExtra(s)!==0))return '随机随单捐模式下，其他接收方固定份额须为零。';
  if(randomDonation&&splitSkus.some(s=>s.randomMin==null||s.randomMax==null||!R.moneyValid(s.randomMin)||!R.moneyValid(s.randomMax)||R.cents(s.randomMax)>R.cents(s.price)||R.cents(s.randomMax)<R.cents(s.randomMin)))return '请按规格填写随机金额上下限，下限不大于上限，上限不高于售价，随机金额包含上下限。';
  if(randomDonation){const plan=R.randomPlan(data,skus);if(plan.error)return plan.error;}
  if(splitSkus.some(s=>s.splitRecipients.some(r=>r.amount===''||!productSplitCatalog().some(o=>o.id===r.id)||!Number.isFinite(r.amount)||r.amount<0||Math.abs(r.amount*100-Math.round(r.amount*100))>0.00001)||new Set(s.splitRecipients.map(r=>r.id)).size!==s.splitRecipients.length))return '请选择有效且不重复的分账对象，金额为非负数且最多两位小数。';
  if(!skus.length||splitSkus.some(s=>!Number.isFinite(s.price)||!Number.isInteger(s.stock)||s.stock<0||s.price<=0||(!randomDonation&&s.fund<=0)||s.association<0||s.university<0||(!randomDonation&&round(s.fund+productSplitExtra(s))>s.price)))return '请检查 SKU：售价和公益份额须大于零、库存为非负整数，各方金额合计不能超过售价。';
  if(splitSkus.some(s=>[s.price,s.fund,s.association,s.university].some(v=>!Number.isFinite(v)||Math.abs(v*100-Math.round(v*100))>0.00001)))return '金额最多保留两位小数。';
  if(intent==='submit'&&!state.carousel.length)return '请上传商品轮播图。';
  if(intent==='submit'&&!state.details.length)return '请上传商品详情图片。';
  if(intent==='submit'&&!data.agreement)return '请阅读并主动同意适用协议。';
  if(intent==='submit'&&(!data.promise.trim()||!data.returnAddress.trim()))return '请补全公益承诺及退货资料。';
  const splitIssue=productSplitIssue({...base,...data,skus:splitSkus});if(splitIssue)return splitIssue;
  if(intent!=='draft'){const qualificationIssue=productOperatingQualificationIssue({...base,...data,skus});if(qualificationIssue)return qualificationIssue;}
  const {personPermission,personShop,...commercialData}=data;
  const snapshot={...commercialData,name:data.name.trim(),donationMode:data.donationMode||'fixed',donationRatio:randomDonation?Number(data.donationRatio):null,planStock:randomDonation?skus.reduce((n,s)=>n+s.stock,0):null,parameters:filledParameters,carouselImages:state.carousel,detailImages:state.details,splitPlans:state.splitPlans.map(p=>({scope:p.scope,...(coverageIssue?{config:productSplitConfig(p.config)}:{})})),specs:state.specs.map(g=>({...g,name:g.name.trim(),values:g.values.filter(v=>v.name.trim()).map(v=>({...v,name:v.name.trim()}))})),skus,pickupAfter:!!data.pickupAfter,returnAuto:!!data.returnAuto,sevenDayReturn:!!data.sevenDayReturn,shippingHours:Number(data.shippingHours),shippingTemplateId:shippingTemplate.id,shippingTemplate:ShippingTemplates.clone(shippingTemplate)};
  D.shippingTemplates=[...(D.shippingTemplates||[]).filter(t=>t.org!==org().id),...ShippingTemplates.clone(state.shippingTemplates)];
  if(!existing)D.products.push({...base,...snapshot,review:intent==='draft'?'草稿':'待审批'});
  const error=submitApplication('商品资料变更',existing||base,snapshot,intent);if(error)return error;
  const savedProduct=existing||D.products.find(p=>p.id===base.id);savedProduct.collaboratorName=data.collaboratorName;
  if(C.canManageProduct(base)){C.savePeople(savedProduct,null,people);}else C.persist();
  closeOverlay();render();toast(intent==='draft'?'商品草稿已保存':'新版本已提交审批');
 },'提交审批',true);
 $('#overlay .dialog').classList.add('product-editor');
 $('#pe-customer-service').addEventListener('input',updateProductCustomerService);
 $('#edit-form [name=project]').required=true;
 for(const option of $('#edit-form [name=project]').options){const o=D.organizations.find(o=>o.id===project(option.value)?.org),issue=splitQualificationIssue(o);if(issue){option.disabled=true;option.textContent+=' · '+issue;}}
 $('#edit-form').querySelectorAll('.pe-config-grid label').forEach(label=>{
  const input=label.querySelector('input,select,textarea');if(!input||input.type==='radio')return;
  const required=input.required||input.name==='agreement';let caption=label.querySelector('span');
  if(!caption&&input.type!=='checkbox'){caption=document.createElement('span');[...label.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>caption.appendChild(node));label.prepend(caption);}
  label.querySelectorAll('.required-tip').forEach(marker=>marker.remove());
  (caption||label).insertAdjacentHTML('beforeend',peRequirement(required));
 });
 $('#edit-form').insertAdjacentHTML('afterbegin','<p class="pe-form-note">'+peRequirement(true)+' 为必填项。</p>');
 $('#overlay .dialog-head').insertAdjacentHTML('beforeend','<span class="pe-product-id">商品编号：'+(existing?esc(existing.id):'保存后自动生成')+'</span>');
 $('#edit-form').insertAdjacentHTML('beforeend','<input type="file" id="pe-file" accept="image/*" multiple hidden>');
 $('#edit-form').insertAdjacentHTML('afterbegin','<label class="field full"><span>公益分配模式</span><select name="donationMode" aria-label="公益分配模式"><option value="fixed">固定份额</option><option value="random">随机随单捐 · 按上下限取数</option></select></label><p class="full tiny muted">随机随单捐由商家承担；订单生成时锁定金额，抽签仅揭晓，不含运费。启用时其他固定接收方份额须为零。</p>');
  $('#edit-form [name=donationMode]').value=p.donationMode||'fixed';
  $('#edit-form [name=donationMode]').addEventListener('change',updateSplitPreview);
  addEditorPreview('product');renderShippingTemplate();renderProductParameters();renderProductMedia();renderProductSpecs();renderProductSkus();const donationControl=$('#edit-form [name=donationMode]').closest('label'),donationNote=donationControl.nextElementSibling;donationControl.className='full';$('#pe-charity .pe-config-grid').prepend(donationControl,donationNote);donationNote.insertAdjacentHTML('afterend','<label class="full pe-donation-target"><span>目标捐赠比例（%）'+peRequirement(true)+'</span><input type="number" name="donationRatio" min="0.01" max="100" step="0.01" value="'+esc(String(p.donationRatio??''))+'" placeholder="请输入总的目标比例"><small id="pe-donation-plan" class="pe-field-note"></small></label>');updateSplitPreview();merchantSubpage(readOnly?'product-detail':'product-editor');
 applyProductFieldPermissions();if(readOnly)lockProductDetail(p);
}
function productFieldPermission(key){const p=D.products.find(p=>p.id===productEditState?.productId);return !isMerchant||!p||C.canProduct(p,key);}
function productStructurePermission(){return productFieldPermission('edit')&&productFieldPermission('stock')&&productFieldPermission('price');}
function productSplitControl(input){return Boolean(input.closest('.pe-split-config')||input.matches('[name=project],[name=donationMode],[name=donationRatio]'));}
function applyProductFieldPermissions(){
 const state=productEditState,panel=$('#overlay .product-editor');if(!isMerchant||!state||!panel)return;
 const freeze=(selector)=>panel.querySelectorAll(selector).forEach(input=>{if(input.matches('input:not([type=checkbox]),textarea'))input.readOnly=true;else input.disabled=true;input.dataset.permissionLocked='1';});
 if(!productFieldPermission('stock'))freeze('#sku-rows [data-sku=stock],#sku-rows [data-pe-stock-delta],#sku-rows [data-pe-stock-mode],#pe-batch-stock,#pe-inventory [data-pe-batch-mode]');
 if(!productFieldPermission('price')){freeze('#sku-rows [data-sku=price],#pe-batch-price,.pe-split-config input,.pe-split-config select,.pe-split-config button,[name=project],[name=donationMode],[name=donationRatio]');panel.querySelectorAll('[data-action=pe-plan-add]').forEach(button=>button.disabled=true);}
 if(!productFieldPermission('publish'))freeze('#sku-rows [data-sku=published]');
 if(!productStructurePermission()){freeze('#pe-specs input,#pe-specs select,#pe-specs button,[data-action=pe-spec-add]');}
 if(!productFieldPermission('productSplitView')){panel.querySelectorAll('.pe-split-config,[name=donationRatio]').forEach(el=>{const target=el.matches('input')?el.closest('label'):el;target.hidden=true;target.setAttribute('aria-hidden','true');});}
}
function lockProductDetail(p){
 const panel=$('#overlay .product-editor'),form=panel.querySelector('#edit-form');
 panel.classList.add('product-readonly');formHandler=null;
 panel.querySelector('.pe-product-id').insertAdjacentHTML('beforebegin','<div class="pe-product-status">'+productStateView(p)+'<span>'+(productEditState.historicalProduct?'下单时版本 v':'当前版本 v')+p.version+'</span></div>');
 form.querySelector('.dialog-foot').innerHTML=btn('客户端预览','preview-product',p.id)+(productEditState.historicalProduct?btn('返回订单','close','','btn primary'):isMerchant?btn(pending(p.id)?'查看申请':'编辑商品',pending(p.id)?'application-object':'product-edit',p.id,'btn primary'):'');
 form.querySelectorAll('[data-action]').forEach(button=>{
  const action=button.dataset.action;
  if(productEditState.historicalProduct&&action==='customer-service-test'){button.remove();return;}
  if(action.startsWith('pe-')&&!['pe-image','pe-mobile-refresh'].includes(action))button.remove();
 });
 form.querySelectorAll('.pe-batch,.pe-move-actions,.pe-value-actions,.pe-form-note,#pe-file').forEach(el=>el.remove());
 const stockHeaders=form.querySelector('.pe-sku-head tr');
 const stockColumn=productSkuGroups().length||1;
 stockHeaders.children[stockColumn].remove();stockHeaders.children[stockColumn].remove();
 stockHeaders.children[stockColumn].innerHTML='库存'+peRequirement(true);
 form.querySelectorAll('#sku-rows tr').forEach(row=>{
  row.querySelector('.pe-current-stock')?.remove();row.querySelector('.pe-stock-delta')?.closest('td').remove();
  const status=row.querySelector('.pe-sku-status');if(status)status.replaceWith(status.querySelector('[data-pe-sku-status]'));
 });
 form.querySelectorAll('.pe-split-operation').forEach(el=>el.remove());
 const agreement=form.querySelector('[name=agreement]');if(agreement)agreement.closest('.full').remove();
 form.querySelectorAll('[draggable]').forEach(el=>el.removeAttribute('draggable'));
 form.querySelectorAll('input,textarea').forEach(input=>{
  if(['checkbox','radio'].includes(input.type))input.disabled=true;else input.readOnly=true;
  input.removeAttribute('placeholder');
 });
 form.querySelectorAll('select').forEach(input=>input.disabled=true);
 form.querySelectorAll('[data-media-count]').forEach(el=>{
  const key=el.dataset.mediaCount;el.textContent='共 '+productEditState[key].length+' 张'+(key==='carousel'?'，首张为封面。':'');
 });
 if(isMerchant&&!productFieldPermission('productSplitView')){form.querySelectorAll('.pe-split-config,.pe-donation-target,#pe-donation-plan').forEach(el=>el.remove());}
 const detailNote=panel.querySelector('.pe-detail-layout')?.parentElement.querySelector('.pe-field-note');if(detailNote)detailNote.textContent='按展示顺序查看商品详情图片。';
 const detailLabel=panel.querySelector('.pe-detail-edit .pe-label');if(detailLabel)detailLabel.textContent='详情图片';
 const parameterNote=panel.querySelector('#pe-parameters')?.parentElement.querySelector('.pe-field-note');if(parameterNote)parameterNote.textContent='商品参数';
 const specNote=panel.querySelector('.pe-spec-area>.pe-field-note');if(specNote)specNote.textContent='共 '+productEditState.specs.length+' 个规格类型';
 if(!productEditState.specs.length)$('#pe-specs').textContent='默认规格';
 form.querySelectorAll('[data-media-list]').forEach(el=>{if(!el.children.length)el.textContent='暂无图片';});
 form.querySelectorAll('.pe-image-overlay').forEach(el=>{if(!el.children.length)el.remove();});
 panel.querySelector('.merchant-page-back')?.focus();
}
function readProductParameters(){return [...document.querySelectorAll('#pe-parameters .pe-parameter-row')].map(row=>({name:row.querySelector('[data-pe-parameter-name]').value.trim(),value:row.querySelector('[data-pe-parameter-value]').value.trim()}));}
const productParameterNames=['品牌','产地','发货地','类型','材质'];
function renderProductParameters(){
 $('#pe-parameters').innerHTML='<div class="pe-parameter-head"><span>参数名称（请选择）</span><span>参数值</span></div>'+productEditState.parameters.map((p,i)=>{
 const custom=p.custom||Boolean(p.name&&!productParameterNames.includes(p.name));
 return '<div class="pe-parameter-row"><div class="pe-parameter-name"><select aria-label="参数名称选项" data-pe-parameter-choice="'+i+'"'+(custom?'':' data-pe-parameter-name')+'><option value="">请选择参数名称</option>'+productParameterNames.map(name=>'<option value="'+name+'"'+(!custom&&p.name===name?' selected':'')+'>'+name+'</option>').join('')+'<option value="__custom__"'+(custom?' selected':'')+'>自定义参数</option></select>'+(custom?'<input aria-label="自定义参数名称" data-pe-parameter-name value="'+esc(p.name)+'" placeholder="请输入自定义参数名称">':'')+'</div><input aria-label="参数值" data-pe-parameter-value value="'+esc(p.value)+'" placeholder="请输入参数值">'+btn('删除','pe-parameter-remove',String(i),'link')+'</div>';
 }).join('');
}
function productParametersView(parameters){const rows=(parameters||[]).filter(p=>p.name&&p.value);return rows.length?'<section class="pe-client-parameters"><h3>商品参数</h3><dl>'+rows.map(p=>'<div><dt>'+esc(p.name)+'</dt><dd>'+esc(p.value)+'</dd></div>').join('')+'</dl></section>':'';}
function peImageView(file,action,id,cls=''){
 const classes='pe-image-tile '+(cls||'pe-image-button');
 if(!file)return '<button type="button" class="'+classes+' pe-empty-image" data-action="pe-upload" data-id="'+esc(id)+'" aria-label="上传图片">＋</button>';
 const [group,i,j]=id.split('.'),remove=group==='spec'?'pe-spec-image-remove':group==='sku'?'pe-sku-image-remove':'pe-remove',removeId=group==='spec'?i+'.'+j:group==='sku'?i:id;
 return '<div class="'+classes+'"><img src="'+esc(file.src)+'" alt="'+esc(file.name)+'" draggable="false"><button type="button" class="pe-image-delete" data-action="'+remove+'" data-id="'+esc(removeId)+'" aria-label="删除图片" title="删除图片">'+icon('close')+'</button><div class="pe-image-overlay">'+btn('预览','pe-image',id,'pe-image-operation')+btn('更换','pe-upload',id,'pe-image-operation')+'</div></div>';
}
function renderProductMedia(){
 for(const key of ['carousel','details']){
  const files=productEditState[key],list=$('[data-media-list="'+key+'"]');
  $('[data-media-count="'+key+'"]').textContent='已上传 '+files.length+' 张'+(key==='carousel'?'，首张作为封面；拖拽调整顺序。':'');
  list.innerHTML=files.map((file,i)=>'<div class="pe-media-item" draggable="true" data-pe-drag="'+key+'.'+i+'">'+peImageView(file,'pe-image',key+'.'+i)+(key==='carousel'&&i===0?'<span class="pe-cover">封面</span>':'')+'</div>').join('')+btn('<span>＋</span>上传图片','pe-upload',key,'pe-upload');
 }
 updateProductMobilePreview();
}
// Embed the reviewed client page; snapshots stay in this preview frame only.
const productPreviewSnapshots=new WeakMap(),productPreviewPending=new WeakMap(),productPreviewImages=new Map();
function productPreviewSnapshot(p){
 const shop=D.shops.find(s=>s.id===p.shop)||currentShop();
 return {...p,projectName:p.projectName??project(p.project)?.name??'',shopName:shop?.name||'',shopIntro:shop?.intro||'',shopKind:shop?.kind||'',
  carouselImages:(p.carouselImages||[]).map(f=>({...f,src:new URL(f.src,location.href).href})),
  detailImages:(p.detailImages||[]).map(f=>({...f,src:new URL(f.src,location.href).href})),
  skus:(p.skus||[]).map(s=>({...s,image:s.image?.src?{...s.image,src:new URL(s.image.src,location.href).href}:s.image}))};
}
function sendProductPreview(frame){const snapshot=productPreviewSnapshots.get(frame);if(snapshot)frame.contentWindow?.postMessage({type:'workbench:product-preview',product:snapshot},'*');}
function bindProductPreview(frame,p){
 const snapshot=productPreviewSnapshot(p),images=[...snapshot.carouselImages,...snapshot.detailImages,...snapshot.skus.map(s=>s.image).filter(f=>f?.src)];
 productPreviewPending.set(frame,snapshot);productPreviewSnapshots.delete(frame);
 const publish=()=>{if(productPreviewPending.get(frame)!==snapshot)return;productPreviewSnapshots.set(frame,snapshot);sendProductPreview(frame);};
 if(!images.some(image=>image.src.startsWith('blob:'))){publish();return;}
 // Local file frames have separate opaque origins: transfer image contents, not parent blob URLs.
 Promise.all(images.map(async image=>{
  if(!image.src.startsWith('blob:'))return;
  if(!productPreviewImages.has(image.src))productPreviewImages.set(image.src,fetch(image.src).then(response=>response.blob()).then(blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);})));
  image.src=await productPreviewImages.get(image.src);
 })).then(publish).catch(error=>console.error('商品预览图片读取失败',error));
}
window.addEventListener('message',event=>{
 if(event.data?.type!=='client:product-preview-ready')return;
 document.querySelectorAll('iframe[data-product-client-preview]').forEach(frame=>{if(event.source===frame.contentWindow)sendProductPreview(frame);});
});
function currentProductPreview(){
 const form=$('#edit-form'),data=Object.fromEntries(new FormData(form)),state=productEditState,skus=readProductSkus();
 return {...(state.historicalProduct||product(state.productId)),...data,shop:state.historicalProduct?.shop||product(state.productId)?.shop||currentShop()?.id,parameters:readProductParameters().filter(p=>p.name&&p.value),
  carouselImages:state.carousel,detailImages:state.details,specs:state.specs,skus:skus.length?skus:state.skus,shippingHours:form.querySelector('[name=shippingHours]').value,donationMode:form.querySelector('[name=donationMode]').value,project:form.querySelector('[name=project]').value,
  shippingTemplate:state.shippingTemplates.find(t=>t.id===state.shippingTemplateId),
  pickupAfter:form.querySelector('[name=pickupAfter]').checked,returnAuto:form.querySelector('[name=returnAuto]').checked,sevenDayReturn:form.querySelector('[name=sevenDayReturn]').checked};
}
function updateProductMobilePreview(){
 const host=$('#pe-mobile-preview');if(!productEditState||!host)return;
 if(!host.querySelector('iframe'))host.innerHTML=productPhone();
 bindProductPreview(host.querySelector('iframe'),currentProductPreview());
}

function peMoveButtons(kind,index,length,id){return '<div class="pe-move-actions">'+['up','down'].map(direction=>'<button type="button" class="link" data-action="pe-'+kind+'-'+direction+'" data-id="'+id+'"'+((direction==='up'?index===0:index===length-1)?' disabled':'')+'>'+(direction==='up'?'上移':'下移')+'</button>').join('')+'</div>';}
const peSpecTypes=['款式','尺寸','型号','器型','材质','口味','色号','适用人群','颜色','容量','花型','尺码','地点','包装方式','香型','货号','组合','成份','版本','度数','运营商','属性','重量','地区','套餐','类别','适用年龄','功效','品类','时间'];
function renderProductSpecs(){
 const state=productEditState;
 $('#pe-specs').innerHTML=state.specs.map((g,i)=>'<section class="pe-spec-group"><div class="pe-spec-top"><label class="pe-spec-input"><span class="sr-only">规格类型</span>'+peRequirement(true)+'<select aria-label="规格类型" data-pe-spec="'+i+'" required><option value="">请选择规格类型'+(i+1)+'</option>'+[...new Set([...peSpecTypes,...state.specs.map(x=>x.name).filter(Boolean)])].map(name=>'<option value="'+esc(name)+'"'+(name===g.name?' selected':'')+(state.specs.some((x,j)=>j!==i&&x.name===name)?' disabled':'')+'>'+esc(name)+'</option>').join('')+'</select></label><label class="pe-spec-check"><input type="checkbox" data-pe-spec-images="'+i+'"'+(g.withImages?' checked':'')+'>添加图片'+peRequirement(false)+'</label><span class="spacer"></span>'+peMoveButtons('spec',i,state.specs.length,String(i))+btn('删除规格类型','pe-spec-remove',String(i),'link')+'</div><div class="pe-spec-values">'+g.values.map((v,j)=>'<div class="pe-spec-value"><label class="pe-spec-input"><span class="sr-only">规格值</span>'+peRequirement(true)+'<input value="'+esc(v.name)+'" placeholder="请输入规格名称" aria-label="规格名称" data-pe-value="'+i+'.'+j+'" required></label>'+(g.withImages?peImageView(v.image,v.image?'pe-image':'pe-upload','spec.'+i+'.'+j,'pe-spec-image'):'')+btn('删除','pe-value-remove',i+'.'+j,'link')+'</div>').join('')+'<div class="pe-value-actions">'+btn('开始排序','pe-value-sort',String(i),'link')+btn('＋ 添加规格值','pe-value-add',String(i),'link')+'</div></div></section>').join('');
 $('[data-action=pe-spec-add]').disabled=state.specs.length>=2;
}
function productSplitCatalog(){return [...D.organizations.filter(o=>o.role==='merchant'&&o.id!==S.org),...(D.splitRecipients||[])];}
function splitQualificationIssue(o){
 if(!o)return '组织不存在';
 if(o.status!=='已入驻')return '组织尚未完成入驻';
 if(!o.verified)return '收款配置未核验通过';
 const q=o.splitQualification;
 if(!q||q.payment!=='已核验')return '收款配置'+(q?.payment||'待核验');
 if(q.agreement!=='有效')return '分账协议'+(q.agreement||'待确认');
 if(q.channel!=='有效')return '渠道分账资格'+(q.channel||'待核验');
 if(!q.validUntil||q.validUntil<new Date().toLocaleDateString('sv-SE'))return '分账资格已失效';
 return '';
}
function productSplitIssue(p){
 const foundation=D.organizations.find(o=>o.id===project(p.project)?.org),merchant=D.organizations.find(o=>o.id===(D.shops.find(s=>s.id===p.shop)?.org||S.org));
 for(const o of [merchant,foundation,...(p.skus||[]).flatMap(s=>(s.splitRecipients||[{id:'A001'},{id:'U001'}]).map(r=>[...D.organizations,...(D.splitRecipients||[])].find(o=>o.id===r.id)))]){const error=splitQualificationIssue(o);if(error)return (o?splitOrganizationLabel(o):'分账对象')+'：'+error+'，请更新后再保存或提交。';}
 return '';
}
function productOperatingQualificationIssue(p){
 const shop=D.shops.find(s=>s.id===p.shop),inherited=shop?.inheritOrganizationLicense??(shop?.operatingQualifications||[]).some(q=>q.source==='organization'),items=(shop?.operatingQualifications||[]).filter(q=>q.source!=='organization');
 if(inherited)items.push(shopQualificationInfo({source:'organization',organizationId:shop.org,category:shop.category}));
 if(!items.length)return '请先在店铺管理完善并核验经营资质。';
 for(const item of items){const q=shopQualificationInfo(item);if(!q.category||!q.file&&q.source!=='organization'||q.source==='organization'&&q.organizationId!==shop.org||!q.longTerm&&(!q.validUntil||q.validUntil<new Date().toLocaleDateString('sv-SE'))||q.status&&q.status!=='已通过')return '店铺经营资质不完整、未核验或已到期，请更新后提交。';}
 return '';
}
function splitQualificationNote(o){const issue=splitQualificationIssue(o);return issue?'<small class="form-error">'+esc(issue)+'</small>':'';}
function splitOrganizationLabel(o){return o?o.name+'（'+o.id+'）':'';}
function splitOrganizationView(name){const o=[...D.organizations,...(D.splitRecipients||[])].find(o=>o.name===name);return esc(splitOrganizationLabel(o)||name);}
function productSplitRecipients(s){
 if(!s.splitRecipients)s.splitRecipients=[{id:'A001',amount:s.association||0},{id:'U001',amount:s.university||0}];
 return s.splitRecipients;
}
function productSplitExtra(s){return s.splitRecipients?s.splitRecipients.reduce((sum,r)=>sum+Number(r.amount),0):Number(s.association||0)+Number(s.university||0);}
function readProductSkus(){return [...$('#sku-rows').children].map((el,i)=>{
 const s=productEditState.skus[i],recipients=productSplitRecipients(s).map(r=>({...r,amount:r.amount===''?'':Number(r.amount)})),catalog=productSplitCatalog();
 const forRole=role=>round(recipients.filter(r=>catalog.find(o=>o.id===r.id)?.role===role).reduce((sum,r)=>sum+Number(r.amount),0));
 return {...s,published:el.querySelector('[data-sku=published]')?.checked??(s.published!==false),name:el.querySelector('[data-sku=name]').value,merchantCode:el.querySelector('[data-sku=merchantCode]').value.trim(),price:Number(el.querySelector('[data-sku=price]').value),stock:Number(el.querySelector('[data-sku=stock]').value),fund:Number(s.fund),association:forRole('association'),university:forRole('university'),splitRecipients:recipients};
 });}
function productSplitScopes(){
 const state=productEditState,skus=state.skus,options=[{key:'all',label:'全部规格',indices:skus.map((s,i)=>i)}];
 for(const g of productSkuGroups())for(const v of g.values.filter(v=>v.name.trim()))options.push({key:'dim:'+g.key+':'+v.key,label:g.name+'：'+v.name,indices:skus.flatMap((s,i)=>s.specKey.split('|').includes(g.key+':'+v.key)?[i]:[])});
 return [...options,...skus.map((s,i)=>({key:'sku:'+s.specKey,label:s.name,indices:[i]}))];
}
function nextProductSplitScope(){
 const state=productEditState,options=productSplitScopes(),used=new Set(state.splitPlans.flatMap((p,i)=>productSplitPlanIndices(i)));
 const available=options.filter(o=>o.indices.length&&o.indices.every(i=>!used.has(i))),first=state.splitPlans[0]?.scope;
 const group=productSkuGroups().find(g=>first?.startsWith('dim:'+g.key+':'));
 return (group&&available.find(o=>o.key.startsWith('dim:'+group.key+':')))||available.find(o=>o.key.startsWith('sku:'));
}
function productSplitSignature(s){return JSON.stringify([Number(s.fund),productSplitRecipients(s),s.randomMin??'',s.randomMax??'']);}
function ensureProductSplitPlans(){
 const state=productEditState;
 if(!state.splitPlans)state.splitPlans=state.skus.every(s=>productSplitSignature(s)===productSplitSignature(state.skus[0]))?[{scope:'all'}]:state.skus.map(s=>({scope:'sku:'+s.specKey}));
 if(!state.splitPlansChecked){state.splitPlansChecked=true;state.splitPlans=state.splitPlans.flatMap((p,i)=>{const indices=productSplitPlanIndices(i);return !p.config&&indices.some(j=>productSplitSignature(state.skus[j])!==productSplitSignature(state.skus[indices[0]]))?indices.map(j=>({scope:'sku:'+state.skus[j].specKey})):[p];});}
 state.splitPlans.forEach((plan,i)=>{if(!plan.config)plan.config=productSplitConfig(state.skus[productSplitPlanIndices(i)[0]]||state.skus[0]);});
}
function productSplitConfig(source){return {fund:source?.fund??'',splitRecipients:(source?productSplitRecipients(source):[]).map(r=>({...r})),randomMin:source?.randomMin,randomMax:source?.randomMax};}
function productSplitPlanSku(index=productEditState.activeSplitPlan||0){
 const state=productEditState,plan=state.splitPlans[index],sku=state.skus[productSplitPlanIndices(index)[0]]||state.skus[0];
 if(!plan||!sku)return sku;
 if(!plan.config)plan.config=productSplitConfig(sku);
 return Object.assign(plan.config,{price:sku.price,name:sku.name});
}
function productSplitPlanIndices(index){return productSplitScopes().find(o=>o.key===productEditState.splitPlans[index]?.scope)?.indices||[];}
function productSplitCoverageIssue(){
 ensureProductSplitPlans();const counts=productEditState.skus.map(()=>0);
 productEditState.splitPlans.forEach((p,i)=>productSplitPlanIndices(i).forEach(j=>counts[j]++));
 if(productEditState.splitPlans.some((p,i)=>!productSplitPlanIndices(i).length))return '请调整已失效的规格分账范围。';
 const missing=productEditState.skus.filter((s,i)=>!counts[i]),repeated=productEditState.skus.filter((s,i)=>counts[i]>1);
 return [repeated.length?'分账范围重复：'+repeated.map(s=>s.name).join('、')+'，请调整范围。':'',missing.length?'请配置以下规格的分账计划：'+missing.map(s=>s.name).join('、'):''].filter(Boolean).join('；');
}
function splitQuery(selector){return document.querySelector('#pe-split-table [data-pe-plan="'+(productEditState.activeSplitPlan||0)+'"]')?.querySelector(selector);}
function applyProductSplitPlan(){
 const state=productEditState;
 state.splitPlans.forEach((plan,index)=>{const source=productSplitPlanSku(index);if(!source)return;for(const i of productSplitPlanIndices(index))Object.assign(state.skus[i],productSplitConfig(source));});
}
function renderProductSplitTable(){
 if(!$('#pe-split-table'))return;ensureProductSplitPlans();applyProductSplitPlan();
 const table=$('#pe-split-table');table.querySelectorAll('tbody').forEach(el=>el.remove());
 productEditState.splitPlans.forEach((plan,i)=>{const sku=productSplitPlanSku(i);if(sku)table.append(renderProductSplitPlan(sku,i));});
}
function renderProductSplitPlan(sku,planIndex){
 const state=productEditState,body=document.createElement('tbody');body.dataset.pePlan=planIndex;

 const catalog=productSplitCatalog(),recipients=productSplitRecipients(sku),foundation=D.organizations.find(o=>o.id===project($('#edit-form [name=project]').value)?.org);
 const amount=(value,attrs)=>'<input type="number" min="0" step="0.01" value="'+esc(String(value))+'" '+attrs+' required>';
 const ratio=key=>'<small data-pe-split-ratio="'+key+'"></small>';
 body.innerHTML='<tr><td><div class="pe-split-party"><span>'+esc(splitOrganizationLabel(org()))+'</span><small>商家 · 扣除其他分账后的金额</small></div>'+splitQualificationNote(org())+'</td><td><strong data-pe-merchant></strong>'+ratio('merchant')+'</td><td class="pe-split-operation"></td></tr>'+
 '<tr><td><div class="pe-split-party"><span>'+esc(splitOrganizationLabel(foundation)||'请选择关联项目')+'</span><small>公益机构 · 关联项目</small></div>'+splitQualificationNote(foundation)+'</td><td>'+amount(sku.fund,'data-pe-split-fund aria-label="公益机构每件金额"')+'<span data-pe-split-random hidden>随机</span>'+ratio('fund')+'</td><td class="pe-split-operation"></td></tr>'+
 recipients.map((r,i)=>{const selected=catalog.find(o=>o.id===r.id),role=selected?.role;return '<tr><td><div class="pe-recipient-combo"><input class="pe-recipient-search" data-pe-split-recipient="'+i+'" role="combobox" aria-expanded="false" aria-controls="pe-recipient-options-'+planIndex+'-'+i+'" aria-autocomplete="list" aria-label="分账对象 '+(i+1)+'" placeholder="搜索组织名称或编号" autocomplete="off" value="'+esc(splitOrganizationLabel(selected))+'" required>'+(!state.readOnly?'<button type="button" class="pe-recipient-clear" data-action="pe-recipient-clear" data-id="'+i+'" aria-label="清除分账对象 '+(i+1)+'"'+(!selected?' hidden':'')+'><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><path d="m6 6 4 4m0-4-4 4"/></svg></button><button type="button" class="pe-recipient-toggle" data-action="pe-recipient-toggle" data-id="'+i+'" aria-label="选择分账对象 '+(i+1)+'"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button><div class="pe-recipient-options" popover="manual" role="listbox" id="pe-recipient-options-'+planIndex+'-'+i+'">'+catalog.filter(o=>!recipients.some((other,j)=>j!==i&&other.id===o.id)).map(o=>'<button type="button" role="option"'+(splitQualificationIssue(o)?' disabled aria-disabled="true"':'')+' aria-selected="'+(o.id===r.id)+'" data-action="pe-recipient-pick" data-id="'+i+':'+o.id+'">'+esc(splitOrganizationLabel(o))+(splitQualificationIssue(o)?' · '+esc(splitQualificationIssue(o)):'')+'</button>').join('')+'<span class="pe-recipient-empty" hidden>无匹配组织</span></div>':'')+'</div>'+(r.id?splitQualificationNote(selected):'')+'</td><td>'+amount(r.amount,'data-pe-split-amount="'+i+'" aria-label="分账金额 '+(i+1)+'"'+(['association','university'].includes(role)?' name="'+role+'"':''))+ratio(i)+'</td><td class="pe-split-operation">'+btn('删除','pe-split-remove',String(i),'link')+'</td></tr>';}).join('');
 const indices=productSplitPlanIndices(planIndex),scope=state.splitPlans[planIndex].scope;
 const cell=document.createElement('td');cell.className='pe-plan-scope';cell.rowSpan=body.rows.length+2;
 cell.innerHTML='<select data-pe-plan-scope aria-label="分账适用规格 '+(planIndex+1)+'"'+(state.readOnly?' disabled':'')+'>'+(!productSplitScopes().some(o=>o.key===scope)?'<option value="'+esc(scope)+'">规格已移除，请重新选择</option>':'')+productSplitScopes().map(o=>'<option value="'+esc(o.key)+'"'+(o.key===scope?' selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select><small>'+indices.map(i=>esc(state.skus[i].name)).join('<br>')+'</small><small>覆盖 '+indices.length+' 个规格</small><div data-pe-random-bounds><label>随机下限（元）<input type="number" min="0" step="0.01" data-pe-random-bound="randomMin" aria-label="随机公益金额下限" value="'+esc(String(sku.randomMin??''))+'"></label><label>随机上限（元）<input type="number" min="0" step="0.01" data-pe-random-bound="randomMax" aria-label="随机公益金额上限" value="'+esc(String(sku.randomMax??''))+'"></label></div>'+(!state.readOnly?btn('删除此规格分账','pe-plan-remove',String(planIndex),'link'):'');
 body.rows[0].prepend(cell);
 body.insertAdjacentHTML('beforeend','<tr><td colspan="3" class="pe-plan-tools">'+(!state.readOnly?btn('＋ 添加分账对象','pe-split-add','','link'):'')+'</td></tr><tr class="pe-plan-total"><th>分账总额（每件）</th><td colspan="2"><strong data-pe-total></strong><small data-pe-total-ratio></small></td></tr>');
 if(!indices.length){body.querySelectorAll('input,button:not([data-action=pe-plan-remove])').forEach(el=>el.disabled=true);}
 if(state.readOnly){body.querySelector('.pe-plan-tools').closest('tr').remove();cell.rowSpan--;body.querySelector('.pe-plan-total td').colSpan=1;body.querySelectorAll('input').forEach(el=>el.readOnly=true);body.querySelectorAll('select').forEach(el=>el.disabled=true);body.querySelectorAll('.pe-split-operation').forEach(el=>el.remove());}
 return body;
}

function closeRecipientOptions(){
 document.querySelectorAll('.pe-recipient-options:popover-open').forEach(el=>el.hidePopover());
 document.querySelectorAll('[data-pe-split-recipient]').forEach(el=>el.setAttribute('aria-expanded','false'));
}
function openRecipientOptions(input,filter=false){
 if(input.readOnly)return;
 const list=document.getElementById(input.getAttribute('aria-controls'));if(!list)return;
 closeRecipientOptions();const query=filter?input.value.trim().toLowerCase():'';
 const options=[...list.querySelectorAll('[role=option]')];
 options.forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(query);el.classList.remove('active');});
 list.querySelector('.pe-recipient-empty').hidden=options.some(el=>!el.hidden);
 positionRecipientOptions(input,list);
 list.showPopover();input.setAttribute('aria-expanded','true');
}

function positionRecipientOptions(input,list){
 const rect=input.closest('.pe-recipient-combo').getBoundingClientRect();
 list.style.width=rect.width+'px';list.style.left=rect.left+'px';
 const below=innerHeight-rect.bottom;list.style.maxHeight=Math.min(220,Math.max(below,rect.top)-12)+'px';
 list.style.top=below>=160?rect.bottom+4+'px':'auto';list.style.bottom=below>=160?'auto':innerHeight-rect.top+4+'px';
}

function productSkuCombinations(){
 let combos=[{names:[],keys:[],image:null}];
 const groups=productEditState.specs.filter(g=>g.values.some(v=>v.name.trim()));
 for(const g of groups){g.key=g.key||peSpecKey();for(const v of g.values)v.key=v.key||peSpecKey();combos=combos.flatMap(c=>g.values.filter(v=>v.name.trim()).map(v=>({names:[...c.names,v.name.trim()],keys:[...c.keys,g.key+':'+v.key],image:c.image||(g.withImages?v.image:null)})));}
 return combos.map(c=>({name:c.names.join(' / ')||'默认规格',specKey:[...c.keys].sort().join('|'),image:c.image}));
}
function syncProductSkus(){
 const old=readProductSkus();
 productEditState.skus=productSkuCombinations().map(c=>{const previous=old.find(s=>s.specKey===c.specKey)||old.find(s=>s.name===c.name);if(previous)return {...previous,name:c.name,specKey:c.specKey,image:previous.imageOverride?previous.image:c.image};const plan=productEditState.splitPlans?.find(p=>p.scope==='all'||p.scope.startsWith('dim:')&&c.specKey.split('|').includes(p.scope.slice(4))),source=plan&&old.find(s=>plan.scope==='all'||s.specKey.split('|').includes(plan.scope.slice(4)));return {price:'',stock:'',fund:source?.fund??'',splitRecipients:source?productSplitRecipients(source).map(r=>({...r})):[],randomMin:source?.randomMin,randomMax:source?.randomMax,name:c.name,specKey:c.specKey,image:c.image};});
 renderProductSkus();
}
function productSkuGroups(){return productEditState.specs.filter(g=>g.values.some(v=>v.name.trim()));}
function productSkuValues(s){const groups=productSkuGroups();return groups.length?groups.map((g,i)=>g.values.find(v=>s.specKey.split('|').includes(g.key+':'+v.key))?.name||s.name.split(' / ')[i]||'—'):['默认规格'];}
function peStockButtons(scope,mode){return '<div class="pe-stock-mode" role="group" aria-label="库存增减">'+['add','subtract'].map(value=>'<button type="button" data-action="pe-stock-mode" data-id="'+scope+':'+value+'" '+(scope==='batch'?'data-pe-batch-mode':'data-pe-stock-mode')+' value="'+value+'" aria-pressed="'+(mode===value)+'">'+(value==='add'?'增':'减')+'</button>').join('')+'</div>';}
function skuRow(s,i=0){
 const state=productEditState,values=productSkuValues(s),previous=i?productSkuValues(state.skus[i-1]):[],base=state.stockBaseline[s.specKey]??0,diff=s.stock===''?'':Number(s.stock)-base;
 const specCells=values.map((value,j)=>{if(i&&values.slice(0,j+1).every((v,k)=>v===previous[k]))return '';let span=1;while(i+span<state.skus.length&&productSkuValues(state.skus[i+span]).slice(0,j+1).every((v,k)=>v===values[k]))span++;return '<td class="pe-sku-dimension" rowspan="'+span+'">'+esc(value)+'</td>';}).join('');
 return '<tr class="sku-line" data-sku-index="'+i+'" data-stock-base="'+base+'">'+specCells+'<td class="pe-current-stock">'+base+'</td><td><div class="pe-stock-delta pe-stock-input">'+peStockButtons(i,diff<0?'subtract':'add')+'<input aria-label="库存调整数量" data-pe-stock-delta type="number" min="0" step="1" value="'+(diff===''?'':Math.abs(diff)||'')+'" placeholder="数量"></div></td><td><input data-sku="name" aria-label="SKU 规格" value="'+esc(s.name)+'" readonly hidden><input aria-label="SKU 库存" data-sku="stock" type="number" min="0" step="1" value="'+s.stock+'" required></td><td><div class="pe-price-input"><input aria-label="SKU 售价" data-sku="price" type="number" min="0.01" step="0.01" value="'+s.price+'" required><span>元</span></div></td><td class="pe-sku-image">'+peImageView(s.image,'pe-image','sku.'+i)+'</td><td><input aria-label="规格编码" data-sku="merchantCode" value="'+esc(s.merchantCode||'')+'" placeholder="规格编码"></td><td><label class="pe-sku-status"><span data-pe-sku-status>'+(s.published===false?'已下架':'已上架')+'</span><input type="checkbox" role="switch" aria-label="'+esc(s.name)+'上架状态" data-sku="published"'+(s.published===false?'':' checked')+'><span class="pe-sku-switch" aria-hidden="true"></span></label></td></tr>';
}
function renderProductSkus(){
 const groups=productSkuGroups();
 $('#pe-inventory .pe-sku-head').innerHTML='<tr>'+[...(groups.length?groups.map(g=>esc(g.name)):['规格']),'当前库存','库存增减','改后库存'+peRequirement(true),'售价（元）'+peRequirement(true),'预览图'+peRequirement(false),'规格编码'+peRequirement(false),'状态'].map(h=>'<th>'+h+'</th>').join('')+'</tr>';
 $('#sku-rows').innerHTML=productEditState.skus.map(skuRow).join('');
 const current=D.products.find(p=>p.id===productEditState.productId);if(current&&!C.canProduct(current,'stock')){document.querySelectorAll('#sku-rows [data-sku=stock],#sku-rows [data-pe-stock],#sku-rows [data-pe-stock-mode],#sku-rows [data-pe-stock-delta]').forEach(input=>input.disabled=true);$('#pe-batch-stock').disabled=true;}
 renderProductSplitTable();
 $('#pe-batch-scopes').innerHTML=groups.map((g,i)=>'<select id="pe-batch-scope'+(i?'-'+i:'')+'" data-pe-batch-group="'+i+'" aria-label="批量选择'+esc(g.name)+'"><option value="">全部'+esc(g.name)+'</option>'+g.values.filter(v=>v.name.trim()).map(v=>'<option value="'+esc(v.name)+'">'+esc(v.name)+'</option>').join('')+'</select>').join('');
 updateSplitPreview();updateProductMobilePreview();applyProductFieldPermissions();
}
function updateProductStock(target){
 const row=target.closest('.sku-line');if(!row||productEditState.readOnly)return;
 const result=row.querySelector('[data-sku=stock]'),delta=row.querySelector('[data-pe-stock-delta]'),mode=row.querySelector('[data-pe-stock-mode][aria-pressed=true]'),base=Number(row.dataset.stockBase);
 if(target===result){const diff=Number(result.value)-base;row.querySelectorAll('[data-pe-stock-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.value===(diff<0?'subtract':'add'))));delta.value=result.value===''?'':Math.abs(diff);}
 else if(target===delta||target===mode)result.value=delta.value===''?base:base+(mode.value==='subtract'?-1:1)*Number(delta.value);
 updateSplitPreview();
}
function peInventoryFullscreen(enable){const area=$('#pe-inventory .pe-stock-area');area.classList.toggle('pe-stock-fullscreen',enable);$('#overlay .merchant-page-shade')?.classList.toggle('pe-stock-expanded',enable);const button=area.querySelector('[data-action=pe-fullscreen]');button.textContent=enable?'退出全屏':'全屏编辑';button.setAttribute('aria-pressed',String(enable));if(enable){area.setAttribute('role','dialog');area.setAttribute('aria-modal','true');area.setAttribute('aria-label','库存全屏编辑');}else{area.removeAttribute('role');area.removeAttribute('aria-modal');area.removeAttribute('aria-label');}button.focus();}
function openProductSheet(){
 const skus=readProductSkus();productEditState.skus=skus;
 subdialog('Excel 批量编辑规格','<p class="pe-field-note">可在下表逐项编辑，或从 Excel 复制“库存、售价、规格编码”三列，粘贴到对应起始单元格。空白单元格保留原值。</p><div class="pe-sheet-scroll"><table class="pe-sheet-table"><thead><tr><th>规格</th><th>库存'+peRequirement(true)+'</th><th>售价（元）'+peRequirement(true)+'</th><th>规格编码'+peRequirement(false)+'</th></tr></thead><tbody>'+skus.map((s,i)=>'<tr><td>'+esc(s.name)+'</td>'+['stock','price','merchantCode'].map((key,j)=>'<td><input aria-label="'+esc(s.name)+' '+key+'" data-pe-sheet="'+i+'.'+j+'" value="'+esc(String(s[key]??''))+'"></td>').join('')+'</tr>').join('')+'</tbody></table></div><p id="pe-sheet-error" role="alert"></p>');
 $('#secondary').querySelectorAll('[data-pe-sheet]').forEach(input=>{const column=Number(input.dataset.peSheet.split('.')[1]);if(column===0&&!productFieldPermission('stock')||column===1&&!productFieldPermission('price')){input.readOnly=true;input.dataset.permissionLocked='1';}});
 $('#secondary .dialog').classList.add('pe-sheet-dialog');$('#secondary .dialog-foot').innerHTML=btn('确认','pe-sheet-confirm','','btn primary')+btn('取消','secondary-close');
}
function applyProductSheet(){
 const skus=readProductSkus().map((s,i)=>{const values=[0,1,2].map(j=>$('#secondary [data-pe-sheet="'+i+'.'+j+'"]').value.trim());return {...s,stock:values[0]===''?NaN:Number(values[0]),price:values[1]===''?NaN:Number(values[1]),merchantCode:values[2]};});
 const before=readProductSkus();if(skus.some((s,i)=>!productFieldPermission('stock')&&s.stock!==before[i].stock||!productFieldPermission('price')&&s.price!==before[i].price)){$('#pe-sheet-error').textContent='没有对应字段的修改权限。';return;}
 if(skus.some(s=>!Number.isSafeInteger(s.stock)||s.stock<0||!Number.isFinite(s.price)||s.price<=0||Math.abs(s.price*100-Math.round(s.price*100))>0.00001)){$('#pe-sheet-error').textContent='库存须为非负整数，售价须为有效金额，最多两位小数。';return;}
 productEditState.skus=skus;closeSecondary();renderProductSkus();toast('已填入规格表格');
}
function updateSplitPreview(){if(!$('#split-preview'))return;
 const random=$('#edit-form [name=donationMode]')?.value==='random',state=productEditState,skus=readProductSkus(),prices=skus.map(s=>s.price);
 if($('#pe-sku-summary'))$('#pe-sku-summary').textContent='总库存 '+skus.reduce((n,s)=>n+s.stock,0)+' 件　售价 '+money(Math.min(...prices))+(Math.min(...prices)!==Math.max(...prices)?' ～ '+money(Math.max(...prices)):'');
 const ratioControl=$('#edit-form [name=donationRatio]');if(ratioControl){ratioControl.closest('label').hidden=!random;ratioControl.disabled=!random;ratioControl.required=random;if(random){const plan=R.randomPlan({donationRatio:ratioControl.value},skus);$('#pe-donation-plan').textContent=plan.error||'计划库存 '+plan.stock+' 件 · 计划公益总额 '+money(plan.total/100)+'；本版本计划库存全部完成有效销售并结算后核对目标比例。';}}
 document.querySelectorAll('#pe-split-table tbody').forEach(body=>{
  const index=Number(body.dataset.pePlan),indices=productSplitPlanIndices(index),config=productSplitPlanSku(index),planSkus=skus.map(s=>({...s,...productSplitConfig(config)})),sku=planSkus[indices[0]]||config;if(!sku)return;
  const query=selector=>body.querySelector(selector),fund=query('[data-pe-split-fund]');fund.disabled=random;fund.required=!random;fund.hidden=random;if(document.activeElement!==fund)fund.value=sku.fund;
  query('[data-pe-split-random]').hidden=!random;
  const bounds=query('[data-pe-random-bounds]');bounds.hidden=!random;bounds.querySelectorAll('input').forEach(input=>{input.disabled=!random;input.required=random;});
  const extras=productSplitExtra(sku),merchant=round(sku.price-sku.fund-extras),percent=value=>sku.price>0?(value/sku.price*100).toFixed(2)+'%':'—';
  const multi=indices.some(i=>planSkus[i].price!==sku.price),perSku=fn=>indices.map(i=>planSkus[i].name+'：'+fn(planSkus[i])).join('；'),ratioFor=(s,value)=>s.price>0?(value/s.price*100).toFixed(2)+'%':'—';
  query('[data-pe-merchant]').textContent=random?'按订单实际公益金额计算':multi?perSku(s=>money(round(s.price-s.fund-productSplitExtra(s)))):money(merchant);
  query('[data-pe-split-ratio="merchant"]').textContent=random?'—':multi?perSku(s=>ratioFor(s,s.price-s.fund-productSplitExtra(s))):percent(merchant);
  query('[data-pe-split-ratio="fund"]').textContent=random?'':multi?perSku(s=>ratioFor(s,s.fund)):percent(sku.fund);
  sku.splitRecipients.forEach((r,i)=>{const el=query('[data-pe-split-ratio="'+i+'"]');if(el)el.textContent=multi?perSku(s=>ratioFor(s,Number(s.splitRecipients[i]?.amount||0))):percent(r.amount);});
  query('[data-pe-total]').textContent=multi?perSku(s=>money(s.price)):money(sku.price);query('[data-pe-total-ratio]').textContent='100.00%';
  body.classList.toggle('pe-split-invalid',!random&&indices.some(i=>planSkus[i].price-planSkus[i].fund-productSplitExtra(planSkus[i])<0));
 });
 const issue=productSplitCoverageIssue(),coverage=$('#pe-split-coverage');coverage.textContent=issue||'已覆盖全部 '+skus.length+' 个规格';coverage.classList.toggle('form-error',!!issue);
 $('#split-preview').textContent=random?'商家承担随机公益款，各规格按对应上下限取数。':document.querySelector('#pe-split-table .pe-split-invalid')?'各方分账金额合计不能超过对应规格售价，请调整金额。':'';applyProductFieldPermissions();
}
function renderSpecValueSort(){
 const group=productEditState.specs[productValueSort.group];
 $('#pe-value-sort-list').innerHTML=productValueSort.order.map((index,pos)=>'<li draggable="true" tabindex="0" data-pe-sort-position="'+pos+'" data-pe-sort-value="'+index+'" aria-label="'+esc(group.values[index].name||'未命名规格')+'，第 '+(pos+1)+' 项" title="拖动排序，或使用左右方向键">'+esc(group.values[index].name||'未命名规格')+'</li>').join('');
}
function moveSpecValue(from,to){
 if(!productValueSort||from===to||from<0||to<0||to>=productValueSort.order.length)return;
 const [value]=productValueSort.order.splice(from,1);productValueSort.order.splice(to,0,value);renderSpecValueSort();
 $('#pe-value-sort-list [data-pe-sort-position="'+to+'"]').focus();
}
function openSpecValueSort(index){
 const group=productEditState.specs[index];if(!group)return;
 productValueSort={group:index,order:group.values.map((_,i)=>i)};
 subdialog('排序','<p class="pe-sort-help">你可以直接通过拖动调节顺序</p><ol id="pe-value-sort-list" aria-label="规格排序"></ol>');
 $('#secondary .dialog').classList.add('pe-sort-dialog');
 $('#secondary .dialog-foot').innerHTML=btn('确认','pe-value-sort-confirm','','btn primary')+btn('取消','secondary-close');
 renderSpecValueSort();
}
function peGetImage(key){const [group,i,j]=key.split('.');return group==='spec'?productEditState.specs[+i]?.values[+j]?.image:group==='sku'?productEditState.skus[+i]?.image:productEditState[group]?.[+i];}
function productEditorAction(a,id){
 if(a==='pe-jump'){$('[data-merchant-editor-section="'+id+'"]')?.scrollIntoView({block:'start',behavior:'smooth'});return;}
 const state=productEditState;if(!state||!$('#overlay .product-editor')||(state.readOnly&&!['pe-image','pe-mobile-refresh'].includes(a)))return;
 if(a.startsWith('pe-')&&((['pe-plan-add','pe-plan-remove','pe-split-add','pe-split-remove','pe-recipient-toggle','pe-recipient-clear','pe-recipient-pick'].includes(a)&&!productFieldPermission('price'))||(['pe-spec-add','pe-spec-remove','pe-spec-up','pe-spec-down','pe-value-add','pe-value-remove','pe-value-sort','pe-value-sort-confirm'].includes(a)&&!productStructurePermission())||(a==='pe-stock-mode'&&!productFieldPermission('stock')))){toast('没有对应字段的修改权限');return;}
 if(a==='pe-stock-mode'){
  const [scope,value]=id.split(':'),container=scope==='batch'?$('#pe-inventory .pe-batch'):$('#sku-rows [data-sku-index="'+scope+'"]');
  if(!container)return;
  const button=container.querySelector('[data-action=pe-stock-mode][value="'+value+'"]');if(!button||button.disabled)return;
  container.querySelectorAll('[data-action=pe-stock-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  if(scope==='batch')$('#pe-batch-mode').value=value;else updateProductStock(button);
  return;
 }

 if(a.startsWith('pe-shipping-')){shippingTemplateAction(a,id);return;}
 if(a==='pe-mobile-refresh'){updateProductMobilePreview();return;}
 if(a==='pe-plan-add'||a==='pe-plan-remove'){
  state.skus=readProductSkus();if(a==='pe-plan-remove')state.splitPlans.splice(Number(id),1);else{const option=nextProductSplitScope();if(!option){toast('全部规格均已配置，可调整现有规格范围');return;}state.splitPlans.push({scope:option.key});}
  state.activeSplitPlan=0;state.splitIndex=productSplitPlanIndices(0)[0]||0;renderProductSplitTable();updateSplitPreview();return;
 }
 if(a==='pe-recipient-toggle'){const input=splitQuery('[data-pe-split-recipient="'+id+'"]'),opened=input.getAttribute('aria-expanded')==='true';closeRecipientOptions();input.focus({preventScroll:true});if(!opened)openRecipientOptions(input);return;}
 if(a==='pe-recipient-clear'||a==='pe-recipient-pick'){
  const [index,choice]=id.split(':'),recipients=productSplitRecipients(productSplitPlanSku());
  if(choice&&(!productSplitCatalog().some(o=>o.id===choice&&!splitQualificationIssue(o))||recipients.some((r,i)=>i!==+index&&r.id===choice)))return;
  recipients[+index].id=choice||'';applyProductSplitPlan();closeRecipientOptions();renderProductSplitTable();updateSplitPreview();
  splitQuery('[data-pe-split-recipient="'+index+'"]').focus({preventScroll:true});return;
 }
 if(a==='pe-split-add'||a==='pe-split-remove'){
  state.skus=readProductSkus();const recipients=productSplitRecipients(productSplitPlanSku());
  if(a==='pe-split-add')recipients.push({id:'',amount:''});else recipients.splice(+id,1);
  applyProductSplitPlan();renderProductSplitTable();updateSplitPreview();if(a==='pe-split-add')splitQuery('[data-pe-split-recipient="'+(recipients.length-1)+'"]').focus();return;
 }
 if(a==='pe-value-sort'){openSpecValueSort(+id);return;}
 if(a==='pe-value-sort-confirm'){if(!productValueSort)return;const {group,order}=productValueSort,values=state.specs[group].values;state.specs[group].values=order.map(i=>values[i]);closeSecondary();renderProductSpecs();syncProductSkus();return;}
 if(a==='pe-parameter-add'||a==='pe-parameter-remove'){state.parameters=readProductParameters();if(a==='pe-parameter-add')state.parameters.push({name:'',value:''});else state.parameters.splice(+id,1);renderProductParameters();updateProductMobilePreview();if(a==='pe-parameter-add')$('#pe-parameters .pe-parameter-row:last-of-type input').focus();return;}
 if(a==='pe-upload'){state.upload=id;const input=$('#pe-file');input.multiple=!id.includes('.');input.value='';input.click();return;}
 if(a==='pe-image'){const file=peGetImage(id);if(file)subdialog('图片预览','<div class="evidence-preview"><img src="'+esc(file.src)+'" alt="'+esc(file.name)+'"></div>',state.readOnly?'返回商品详情':'返回商品编辑');return;}
 if(a==='pe-remove'){const [group,index]=id.split('.');state[group].splice(+index,1);renderProductMedia();return;}
 if(a==='pe-fullscreen'){peInventoryFullscreen(!$('#pe-inventory .pe-stock-fullscreen'));return;}
 if(a==='pe-sheet'){openProductSheet();return;}
 if(a==='pe-sheet-confirm'){applyProductSheet();return;}
 if(a==='pe-batch'){
  const stock=$('#pe-batch-stock'),price=$('#pe-batch-price'),mode=$('#pe-batch-mode').value,filters=[...document.querySelectorAll('[data-pe-batch-group]')].map(e=>e.value);
  if(stock.value!==''&&!productFieldPermission('stock')||price.value!==''&&!productFieldPermission('price')){toast('没有对应字段的修改权限');return;}
  if([stock,price].every(e=>e.value==='')){toast('请填写库存或售价');return;}
  if((stock.value!==''&&(!Number.isSafeInteger(Number(stock.value))||Number(stock.value)<0))||[price].some(e=>e.value!==''&&(!Number.isFinite(Number(e.value))||Number(e.value)<=0||Math.abs(Number(e.value)*100-Math.round(Number(e.value)*100))>0.00001))){toast('库存为非负整数，金额大于零且最多两位小数');return;}
  const rows=[...$('#sku-rows').children].filter((row,i)=>filters.every((value,j)=>!value||productSkuValues(productEditState.skus[i])[j]===value));
  const changes=rows.map(row=>({row,next:stock.value===''?null:mode==='set'?Number(stock.value):Number(row.dataset.stockBase)+(mode==='subtract'?-1:1)*Number(stock.value)}));
  if(changes.some(x=>x.next!==null&&(!Number.isSafeInteger(x.next)||x.next<0))){toast('改后库存须为非负整数');return;}
  for(const {row,next} of changes){if(next!==null){row.querySelector('[data-sku=stock]').value=next;updateProductStock(row.querySelector('[data-sku=stock]'));}if(price.value!=='')row.querySelector('[data-sku=price]').value=price.value;}
  updateSplitPreview();toast('已填入对应规格');return;
 }
 state.skus=readProductSkus();
 if(a==='pe-sku-image-remove'){state.skus[+id].image=null;state.skus[+id].imageOverride=true;renderProductSkus();return;}
 if(a==='pe-spec-image-remove'){const [i,j]=id.split('.');delete state.specs[+i].values[+j].image;}
 if(['pe-spec-up','pe-spec-down'].includes(a)){
  const items=state.specs,index=Number(id),next=index+(a.endsWith('-up')?-1:1);
  if(next<0||next>=items.length)return;
  [items[index],items[next]]=[items[next],items[index]];
 }
 if(a==='pe-spec-add'){if(state.specs.length>=2)return;state.specs.push({name:'',withImages:false,values:[{name:''}]});}
 if(a==='pe-spec-remove')state.specs.splice(+id,1);
 if(a==='pe-value-add')state.specs[+id].values.push({name:''});
 if(a==='pe-value-remove'){const [i,j]=id.split('.');state.specs[+i].values.splice(+j,1);}
 renderProductSpecs();syncProductSkus();
}
async function productEditorChange(target){
 const state=productEditState;if(!state||!$('#overlay .product-editor'))return;
 if(target.id==='pe-shipping-template'&&!state.readOnly){state.shippingTemplateId=target.value;renderShippingTemplate();updateProductMobilePreview();return;}
 if(target.hasAttribute('data-pe-plan-scope')){
  if(state.readOnly)return;state.skus=readProductSkus();const index=Number(target.closest('[data-pe-plan]').dataset.pePlan),option=productSplitScopes().find(o=>o.key===target.value);
  if(!option||!option.indices.length){renderProductSplitTable();updateSplitPreview();return;}
  state.splitPlans[index].scope=target.value;state.activeSplitPlan=index;
  state.splitIndex=option.indices[0];renderProductSplitTable();updateSplitPreview();return;
 }
 if(state.readOnly)return;
 if((productSplitControl(target)&&!productFieldPermission('price'))||(target.matches('[data-pe-spec],[data-pe-value],[data-pe-spec-images]')&&!productStructurePermission())){toast('没有对应字段的修改权限');return;}
 if(target.hasAttribute('data-pe-parameter-choice')){
  const index=Number(target.dataset.peParameterChoice);state.parameters=readProductParameters();
  state.parameters[index].name=target.value==='__custom__'?'':target.value;state.parameters[index].custom=target.value==='__custom__';
  renderProductParameters();updateProductMobilePreview();const row=$('#pe-parameters').querySelectorAll('.pe-parameter-row')[index];row.querySelector(target.value==='__custom__'?'input[data-pe-parameter-name]':'select').focus();return;
 }
 if(target.hasAttribute('data-pe-split-recipient')){
  const recipients=productSplitRecipients(productSplitPlanSku()),index=Number(target.dataset.peSplitRecipient);
  const catalog=productSplitCatalog(),value=target.value.trim(),choice=catalog.find(o=>[o.id,o.name,splitOrganizationLabel(o)].includes(value));
  if(value&&!choice){target.value=splitOrganizationLabel(catalog.find(o=>o.id===recipients[index].id));toast('请搜索并选择已入驻的分账组织');return;}
  if(choice&&splitQualificationIssue(choice)){toast(splitQualificationIssue(choice));target.value=splitOrganizationLabel(catalog.find(o=>o.id===recipients[index].id));return;}
  if(choice&&recipients.some((r,i)=>i!==index&&r.id===choice.id)){target.value=splitOrganizationLabel(catalog.find(o=>o.id===recipients[index].id));toast('分账对象不能重复');return;}
  recipients[index].id=choice?.id||'';applyProductSplitPlan();renderProductSplitTable();updateSplitPreview();return;
 }
 if(target.name==='project'){state.skus=readProductSkus();renderProductSplitTable();updateSplitPreview();}
 if(target.matches('[data-sku=published]')){target.closest('.pe-sku-status').querySelector('[data-pe-sku-status]').textContent=target.checked?'已上架':'已下架';state.skus=readProductSkus();updateProductMobilePreview();}

 if(target.id==='pe-file'){
  const key=state.upload,[group,i,j]=key.split('.'),files=[...target.files];state.skus=readProductSkus();
  for(const file of files){if(!file.type.startsWith('image/')){toast('请选择图片文件');continue;}const src=URL.createObjectURL(file);try{await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=src;});}catch{URL.revokeObjectURL(src);toast('图片无法读取，请重新选择');continue;}
   const image=peImage(src,file.name);
   if(group==='spec')state.specs[+i].values[+j].image=image;else if(group==='sku'){state.skus[+i].image=image;state.skus[+i].imageOverride=true;}else if(i!==undefined)state[group][+i]=image;else state[group].push(image);
  }
  renderProductMedia();renderProductSpecs();if(group==='spec')syncProductSkus();else if(group==='sku')renderProductSkus();return;
 }
 if(target.hasAttribute('data-pe-spec')){const i=+target.dataset.peSpec;if(state.specs.some((g,j)=>j!==i&&g.name===target.value)){target.value=state.specs[i].name;toast('规格类型不能重复');return;}state.skus=readProductSkus();state.specs[i].name=target.value;renderProductSpecs();renderProductSkus();}
 if(target.hasAttribute('data-pe-value')){const [i,j]=target.dataset.peValue.split('.');state.specs[+i].values[+j].name=target.value;syncProductSkus();}
 if(target.hasAttribute('data-pe-spec-images')){state.specs[+target.dataset.peSpecImages].withImages=target.checked;state.skus=readProductSkus();renderProductSpecs();syncProductSkus();}
}
function productDetail(id){productEditor(id,true);}
function currentOrderProductLink(o,name,className='order-product-link'){
 if(isMerchant&&!C.canReadProduct(product(o.product)))return '<span class="'+className+'">'+esc(name)+'</span>';
 const url=new URL('index.html',location.href);url.search=new URLSearchParams({view:'products',product:o.product,org:S.org,shop:o.shop,demoAccount:S.demoAccount});
 return '<a class="'+className+'" href="'+esc(url.href)+'" target="_blank" rel="noopener">'+esc(name)+'</a>';
}
function orderProductSnapshotLink(o){if(isMerchant&&!C.canAction('order-product-detail',o.id))return '';const version=orderProductVersion(o);return version?link('查看商品快照（v'+version.version+'）','order-product-detail',o.id):'<span class="tiny muted">商品快照暂不可查看</span>';}
function orderProductVersion(o){return (D.productVersions||[]).find(v=>v.id===o.productVersionId&&v.product===o.product&&v.version===o.productVersion&&v.snapshot?.id===o.product&&v.snapshot?.shop===o.shop&&v.snapshot?.version===v.version&&v.snapshot?.project===o.project);}
function openOrderProduct(id,section='订单信息'){
 const o=D.orders.find(o=>o.id===id);if(!o||!allowedOrder(o))return;
 if(isMerchant&&section==='分账计划'&&C.canReadSplit(o)&&(!C.canFullOrder(o)||!C.canReadProduct(product(o.product)))){const plan=orderSplitPlan(o),sku=plan?.skus.find(s=>s.name===o.sku);if(plan&&sku)dialog('分账计划 '+esc(plan.version),splitPlanRecipientTable(plan,sku),btn('关闭','close'));return;}
 if(isMerchant&&(!C.canFullOrder(o)||!C.canReadProduct(product(o.product))))return;
 const version=orderProductVersion(o);if(!version){toast('该订单的商品历史版本暂不可查看');return;}
 orderProductContext={id,section:section==='分账计划'?'分账记录':'订单信息',returnAction:orderActionContext(),focus:document.activeElement,scrollY:window.scrollY,fromList:!isOrderPage&&!$('#overlay .order-detail')};
 productEditor(o.product,true,JSON.parse(JSON.stringify(version.snapshot)));
 const panel=$('#overlay .product-editor');panel.dataset.orderProductSnapshot=o.id;
 panel.querySelector('.dialog-head h2').textContent='商品快照（v'+version.version+'）';
 const returnLabel=orderProductContext.fromList?'返回订单列表':'返回订单';
 const back=panel.querySelector('.merchant-page-back');if(back){back.textContent='‹ '+returnLabel;back.setAttribute('aria-label',returnLabel);}
 panel.querySelector('#edit-form .dialog-foot [data-action=close]').textContent=returnLabel;
 panel.querySelector('.dialog-head').insertAdjacentHTML('beforeend','<p class="order-snapshot-note">以下为本订单下单时的商品信息，保留当时的商品资料、服务与承诺。</p>');
 panel.querySelector('.pe-product-status').insertAdjacentHTML('beforeend','<span>订单 '+esc(o.id)+'</span>');
 panel.querySelector('#edit-form>.form-grid').scrollLeft=0;
 if(orderSplitPlan(o))renderOrderSplitPlanSnapshot(o);
 if(section==='分账计划')panel.querySelector('#pe-charity').scrollIntoView({block:'start'});
}

function merchantProductSummary(p){const image=p.carouselImages?.[0];return '<div class="modal-product full">'+(image?'<img src="'+esc(image.src)+'" alt="'+esc(p.name)+'">':'<div class="product-art art-'+p.art+'">'+['本','杯','袋'][p.art%3]+'</div>')+'<div><strong>'+esc(p.name)+'</strong><small>商品 ID：'+esc(p.id)+' · 当前生效 v'+p.version+'</small></div></div>';}
function priceSplitFields(p,sku,index){
 const amount=(label,key,value)=>'<label>'+esc(label)+'<input type="number" min="0" step="0.01" required name="'+key+'" value="'+esc(String(value??''))+'" data-price-split><small data-price-ratio></small></label>';
 if(p.donationMode==='random')return '<div class="price-split-fields">'+amount('随机金额下限','randomMin'+index,sku.randomMin)+amount('随机金额上限','randomMax'+index,sku.randomMax)+'<small>商家金额＝售价－每件随机公益金额</small></div>';
 const foundation=D.organizations.find(o=>o.id===project(p.project)?.org);
 return '<div class="price-split-fields">'+amount(foundation?.name||'公益机构','fund'+index,sku.fund)+productSplitRecipients(sku).map((r,j)=>amount(productSplitCatalog().find(o=>o.id===r.id)?.name||r.id,'split'+index+'_'+j,r.amount)).join('')+'<label>商家每件金额<strong data-price-merchant></strong><small data-merchant-ratio></small></label><small>分账合计：<span data-price-split-total></span></small></div>';
}
function skuModalBody(p,base,kind){
 const stock=kind==='stock',unit=stock?'件':'元';
 const batch='<div class="sku-batch full"><strong>批量修改</strong><div class="sku-batch-controls"><label><span class="sr-only">适用规格</span><select data-sku-batch-scope><option value="all">全部规格</option>'+base.skus.map((x,i)=>'<option value="'+i+'">'+esc(x.name)+'</option>').join('')+'</select></label><label><span class="sr-only">修改方式</span><select data-sku-batch-mode><option value="set">设为</option><option value="add">加</option><option value="subtract">减</option></select></label><label class="sku-batch-value"><span class="sr-only">批量修改数值</span><input type="number" min="0" step="'+(stock?'1':'0.01')+'" placeholder="请输入" data-sku-batch-value aria-label="批量修改数值"><span>'+unit+'</span></label>'+btn('批量修改','sku-modal-batch')+'</div><small>选择规格后填写数值，再点击批量修改；提交前可逐项调整。</small></div>';
 const rows=base.skus.map((k,i)=>{const current=p.skus.find(x=>x.name===k.name)||k;return '<tr data-sku-modal-row="'+i+'" data-current="'+current[kind]+'"><td><strong>'+esc(k.name)+'</strong><small>规格编码：'+esc(k.merchantCode||'未填写')+'</small></td><td>'+money(current.price)+'</td>'+(stock?'<td>'+current.stock+'</td><td><div class="sku-delta"><select aria-label="'+esc(k.name)+'库存加减" data-stock-mode><option value="add">加</option><option value="subtract">减</option></select><input type="number" step="1" min="0" placeholder="请输入" aria-label="'+esc(k.name)+'库存变动数量" data-stock-delta></div></td>':'')+'<td><input aria-label="'+esc(k.name)+(stock?'改后库存':'修改后售价')+'" name="'+kind+i+'" type="number" required min="0" step="'+(stock?'1':'0.01')+'" value="'+k[kind]+'" data-sku-result></td>'+(stock?'':'<td>'+priceSplitFields(base,k,i)+'</td>')+'</tr>';}).join('');
 return '<div class="hint full">'+(stock?'请按实际可发货数量填写库存，提交后立即生效。':'同步调整各规格售价和分账计划，商家金额及比例实时更新，一起审批后生效。')+'</div>'+merchantProductSummary(p)+(base.donationMode==='random'&&!stock?field('目标捐赠比例（%）','donationRatio',base.donationRatio,'number'):'' )+batch+'<div class="sku-modal-table full" tabindex="0" aria-label="规格修改表"><table><thead><tr>'+(stock?['规格信息','售价（元）','当前库存','库存加减','改后库存']:['规格信息','当前售价（元）','修改后售价（元）','分账计划（每件 / 元）']).map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div><div class="sku-modal-summary full" aria-live="polite"></div>';
}
function setupSkuModal(kind){const panel=$('#overlay .dialog');panel.classList.add('sku-modal');panel.dataset.skuKind=kind;updateSkuModal();}
function updateSkuModal(target){
 const panel=$('#overlay .sku-modal');if(!panel)return;const stock=panel.dataset.skuKind==='stock',row=target?.closest('[data-sku-modal-row]');
 if(stock&&row){const result=row.querySelector('[data-sku-result]'),delta=row.querySelector('[data-stock-delta]'),mode=row.querySelector('[data-stock-mode]'),current=Number(row.dataset.current);
  if(target===result){if(result.value!==''){const diff=Number(result.value)-current;mode.value=diff<0?'subtract':'add';delta.value=String(Math.abs(diff));}else delta.value='';}
  else if(delta.value!=='')result.value=String(current+(mode.value==='subtract'?-1:1)*Number(delta.value));else result.value=String(current);
 }
 if(!stock)for(const item of panel.querySelectorAll('[data-sku-modal-row]')){
  const price=Number(item.querySelector('[data-sku-result]').value),fields=[...item.querySelectorAll('[data-price-split]')];
  fields.forEach(input=>{input.nextElementSibling.textContent=price>0?(Number(input.value)/price*100).toFixed(2)+'%':'';});
  const merchant=item.querySelector('[data-price-merchant]');
  if(merchant){const extra=fields.reduce((n,x)=>n+Number(x.value),0),balance=round(price-extra);merchant.textContent=money(balance);item.querySelector('[data-merchant-ratio]').textContent=price>0?(balance/price*100).toFixed(2)+'%':'';item.querySelector('[data-price-split-total]').textContent=money(price);}
 }
 const values=[...panel.querySelectorAll('[data-sku-result]')].map(x=>x.value===''?NaN:Number(x.value));
 panel.querySelector('.sku-modal-summary').textContent=values.some(x=>!Number.isFinite(x)||x<0)?'请检查修改后的数值。':stock?'总库存：'+values.reduce((n,x)=>n+x,0)+' 件':'修改后售价：'+money(Math.min(...values))+(Math.max(...values)!==Math.min(...values)?' ～ '+money(Math.max(...values)):'');
}
function batchSkuModal(){
 const panel=$('#overlay .sku-modal');if(!panel)return;const input=panel.querySelector('[data-sku-batch-value]'),value=Number(input.value),stock=panel.dataset.skuKind==='stock',error=$('#form-error');
 if(input.value===''||!Number.isFinite(value)||value<0||(stock?!Number.isSafeInteger(value):Math.abs(value*100-Math.round(value*100))>0.00001)){error.textContent=stock?'批量修改数量须为非负整数。':'批量修改金额须为非负数，最多保留两位小数。';input.focus();return;}
 const scope=panel.querySelector('[data-sku-batch-scope]').value,mode=panel.querySelector('[data-sku-batch-mode]').value,rows=[...panel.querySelectorAll('[data-sku-modal-row]')].filter(x=>scope==='all'||x.dataset.skuModalRow===scope);
 const changes=rows.map(row=>({row,next:mode==='set'?value:round(Number(row.dataset.current)+(mode==='subtract'?-value:value))}));
 if(changes.some(x=>stock?x.next<0||!Number.isSafeInteger(x.next):x.next<=0)){error.textContent=stock?'修改后库存须为非负整数。':'修改后售价须大于零。';return;}
 for(const {row,next} of changes){const result=row.querySelector('[data-sku-result]');result.value=String(next);updateSkuModal(result);}
 error.textContent='';
}
function priceEditor(id){
 const p=scopedProduct(id);if(!isMerchant||!merchantOpen()||!p||!C.canProduct(p,'price')||!ensureEditable(p))return;
 const draft=D.applications.find(a=>a.object===id&&['草稿','已撤回','已驳回'].includes(a.status));
 const base=JSON.parse(JSON.stringify({...p,...(draft?.snapshot||{})}));
 form('修改价格',skuModalBody(p,base,'price'),data=>{
  const skus=base.skus.map((s,i)=>{const recipients=productSplitRecipients(s).map((r,j)=>({...r,amount:Number(data['split'+i+'_'+j])}));const roleAmount=role=>round(recipients.filter(r=>productSplitCatalog().find(o=>o.id===r.id)?.role===role).reduce((n,r)=>n+r.amount,0));return {...s,price:Number(data['price'+i]),fund:base.donationMode==='random'?s.fund:Number(data['fund'+i]),splitRecipients:recipients,association:roleAmount('association'),university:roleAmount('university'),...(base.donationMode==='random'?{randomMin:Number(data['randomMin'+i]),randomMax:Number(data['randomMax'+i])}:{})};});
  if(base.skus.some((s,i)=>data['price'+i]==='')||skus.some(s=>!Number.isFinite(s.price)||s.price<=0||Math.abs(s.price*100-Math.round(s.price*100))>0.00001))return '售价须大于零，最多保留两位小数。';
  if(skus.some(s=>[s.fund,...s.splitRecipients.map(r=>r.amount)].some(v=>!R.moneyValid(v)))||base.donationMode!=='random'&&skus.some(s=>s.fund<=0))return '分账金额须有效，公益份额须大于零，最多两位小数。';
  if(base.donationMode==='random'){const plan=R.randomPlan({...base,donationRatio:data.donationRatio},skus);if(plan.error)return plan.error;}
  if(base.donationMode!=='random'&&skus.some(s=>round(s.fund+productSplitExtra(s))>s.price))return '各方分账金额合计不能超过售价。';
  const error=submitApplication('商品价格变更',p,{...base,skus,...(base.donationMode==='random'?{donationRatio:Number(data.donationRatio)}:{})});if(error)return error;
  closeOverlay();render();toast('价格及分账计划变更已提交审批');
 },'提交改价申请');setupSkuModal('price');
}
function inventory(id){const p=scopedProduct(id);if(!isMerchant||!p)return;form('修改库存',skuModalBody(p,p,'stock'),data=>{for(let i=0;i<p.skus.length;i++)if(data['stock'+i]===''||!Number.isSafeInteger(Number(data['stock'+i]))||Number(data['stock'+i])<0)return '库存须为非负整数。';const changes=p.skus.filter((s,i)=>s.stock!==Number(data['stock'+i])).map(s=>{const i=p.skus.indexOf(s);return s.name+' '+s.stock+' → '+Number(data['stock'+i]);});p.skus.forEach((s,i)=>s.stock=Number(data['stock'+i]));record(p.id,'调整库存'+(changes.length?'：'+changes.join('；'):''));D.logs[0].product=p.id;closeOverlay();render();toast('库存已更新');},'提交');setupSkuModal('stock');$('#edit-form .dialog-foot').insertAdjacentHTML('afterbegin',btn('查看修改记录','inventory-history',id,'link'));}

function donationFields(a){
 const modes=R.donationAmountModes(a),options=a.amountMode==='fixed'?a.amount:a.donationOptions||a.options||'1,10,50';
 const choices=[
  ['preset','预设金额','',field('金额档位 / 元（逗号分隔）','donationOptions',options)],
  ['random','随机（随缘捐）','',field('金额下限 / 元','drawMin',a.drawMin||1,'number')+field('金额上限 / 元','drawMax',a.drawMax||100,'number')],
  ['custom','自定义','捐赠者填写金额，不设限','']
 ];
 return section('捐赠方式')+'<div class="full donation-settings" data-donation-settings><p class="donation-settings-label">金额方式 <span>可多选</span></p><input type="hidden" name="amountModes" value="'+esc(modes.join(','))+'">'+choices.map(([mode,label,hint,inputs])=>'<div class="donation-option" data-donation-card="'+mode+'"><label class="donation-option-heading"><input type="checkbox" data-donation-mode="'+mode+'"'+(modes.includes(mode)?' checked':'')+'><span><strong>'+label+'</strong>'+(hint?'<small>'+hint+'</small>':'')+'</span></label><div class="donation-option-fields form-grid" data-donation-inputs="'+mode+'">'+inputs+'</div></div>').join('')+'</div>';
}
function syncDonationRequirements(){const form=$('#edit-form');if(!form?.elements.amountModes)return;const modes=[...form.querySelectorAll('[data-donation-mode]:checked')].map(input=>input.dataset.donationMode);form.elements.amountModes.value=modes.join(',');form.querySelectorAll('[data-donation-inputs]').forEach(group=>{const active=modes.includes(group.dataset.donationInputs);group.closest('[data-donation-card]')?.classList.toggle('is-selected',active);group.hidden=!active;group.style.display=active?'':'none';group.querySelectorAll('input').forEach(input=>{input.disabled=!active;input.required=active;});});window.WorkbenchContentPreview?.update();}
function donationDescription(a){return R.donationAmountModes(a).map(mode=>mode==='preset'?'预设金额：'+(a.amountMode==='fixed'?money(a.amount):a.donationOptions||a.options||'—'):mode==='random'?'随机（随缘捐）：'+money(a.drawMin)+' ～ '+money(a.drawMax):'自定义：不设金额限制').join('；');}
function projectProgress(p,orders){const acts=D.activities.filter(a=>a.project===p.id),paid=D.donations.filter(d=>d.project===p.id&&d.status==='支付成功'),goods=amountRows(orders).contribution,total=round(goods+directDonations(p.id));const category=kind=>{const ids=new Set(acts.filter(a=>a.kind===kind).map(a=>a.id));const regs=D.registrations.filter(r=>ids.has(r.activity)&&['已录取','资格有效'].includes(r.status));return [ids.size,regs.length,paid.filter(d=>ids.has(d.action||d.activity)).reduce((sum,d)=>sum+d.amount,0)];};const target=Number(p.target)||0;return '<div class="card-body">'+kv([['筹款目标',target?money(target):'未设目标'],['已筹金额',money(total)],['项目直接捐赠',money(paid.filter(d=>!d.action&&!d.activity).reduce((sum,d)=>sum+d.amount,0))]])+(target?'<div class="progress"><i style="width:'+Math.min(100,total/target*100)+'%"></i></div>':'')+table(['来源','商品数 / 场次','购买 / 参与人数','金额'],[tr(['公益商品',new Set(orders.map(o=>o.product)).size,new Set(orders.filter(o=>o.payment==='支付成功').map(o=>o.buyerId||o.receiver||o.id)).size,money(goods)]),...['项目活动','公益行动'].map(kind=>{const [count,people,amount]=category(kind);return tr([link(kind,'project-tab',kind),count,people,money(amount)]);})])+'</div>';}
function activityNews(a){const rows=D.activities.filter(x=>x.related===a.id&&x.template==='宣发类');return '<div class="card-body">'+btn('发布图文资讯','activity-news',a.id,'btn primary')+'<p class="description">'+(rows.some(x=>x.status==='已发布')?'已发布资讯展示在原事项入口。':'尚无已发布资讯，客户端保留原报名内容并标记已结束。')+'</p></div>'+table(['资讯','状态','操作'],rows.map(x=>tr([esc(x.name),badge(x.status),link('查看资讯','activity',x.id)])));}

function contentCarouselField(title,kind){return '<div class="full project-carousel-editor"><strong>'+esc(title)+'</strong><p class="pe-field-note" data-project-carousel-count></p><div data-project-carousel-list class="pe-media-list"></div><input type="file" data-content-media accept="image/*,video/*" multiple aria-label="添加'+esc(kind)+'轮播素材" hidden></div>';}
function projectContactParts(p){const contact=String(p.contact||'').trim();if(p.contactPhone!==undefined)return {contact,contactPhone:p.contactPhone};const match=contact.match(/^(.*?)\s+([+\d][\d ()-]*)$/);return {contact:match?match[1]:contact,contactPhone:match?match[2]:''};}
function projectEditor(id){if(isMerchant)return;const original=id?scopedProject(id):null;if(id&&!original)return;if(original&&!ensureEditable(original))return;const saved=D.applications.find(a=>a.object===id&&['草稿','已撤回','已驳回'].includes(a.status));const base=original||{id:'J'+Date.now(),org:S.org,name:'',intro:'',body:'',location:'',start:'2026-11-20T09:00',end:'2027-06-30T18:00',target:0,status:'草稿',version:0,cohost:'向善企业商会（会长单位）',organizer:'明川大学',contact:org().admin,contactPhone:org().contact,donate:false,options:'10,50,100',publication:0};const p={...base,...(saved?.snapshot||{})};Object.assign(p,projectContactParts(p));const body=section('项目基本信息')+field('项目名称','name',p.name)+field('执行地','location',p.location)+field('联系人','contact',p.contact)+field('联系电话','contactPhone',p.contactPhone,'tel')+field('简介','intro',p.intro,'textarea',true,true)+contentCarouselField('项目轮播图','项目')+field('项目介绍','body',p.body,'textarea',true,true)+window.MerchantDateRange.editorField('项目时间','start','end',p.start,p.end,dateValue(demoNow))+field('筹款目标（选填）','target',p.target,'number',false)+section('参与方与捐赠配置')+'<div class="full hint">主办方与接收机构：'+esc(org().name)+'；承办方：平台公司。</div>'+select('联合主办方（会长单位，仅一家）','cohost',['向善企业商会（会长单位）'],p.cohost)+field('组办方（商协会 / 高校 / 专项基金）','organizer',p.organizer,'text',false)+donationFields({...p,donationOptions:p.donationOptions||p.options},false)+checkbox('启用项目直接捐赠入口','donate',p.donate)+consent();form(original?'编辑项目 · 当前生效 v'+original.version:'新建公益项目',body,(data,intent)=>{if(!data.name.trim())return '请填写项目名称。';if(intent==='submit'){if(!data.contact.trim()||!data.contactPhone.trim())return '请填写联系人和联系电话。';if(!data.agreement)return '请阅读并同意项目适用协议。';if((!data.body.trim()&&!/<(?:img|video)[ >]/.test(data.bodyHtml||''))||!data.intro.trim()||!data.location.trim())return '请补全项目介绍、简介及执行地。';const timeIssue=contentTimeError(data);if(timeIssue)return timeIssue;if(new Date(data.end)<=new Date('2026-10-30T00:00'))return '项目结束时间须晚于当前演示时间。';if(data.donate&&!org().qualified)return '当前机构未取得有效公开募捐资格，无法启用直接捐赠。';if(D.activities.some(a=>a.project===p.id&&new Date(a.end)>new Date(data.end)))return '有关联活动或行动结束时间晚于该时间，请先调整关联内容。';}const donationIssue=R.donationError(data);if(data.donate&&donationIssue)return donationIssue;const media=window.WorkbenchContentPreview?.snapshot();const snapshot={...data,...R.donationSnapshot(data),carouselMedia:media?.carouselMedia||p.carouselMedia||[],images:media?.images||p.images||[],videos:media?.videos||p.videos||[],target:Number(data.target||0),donate:!!data.donate};if(!original)D.projects.push({...base,...snapshot,status:intent==='draft'?'草稿':'待审批'});const error=submitApplication('项目资料变更',original||base,snapshot,intent);if(error)return error;closeOverlay();render();toast(intent==='draft'?'项目草稿已保存':'已提交系统基金会管理员审批，生效内容保留原版本');},'提交审批',true);addEditorPreview('project',p);syncDonationRequirements();}
function activityEditor(id,kind){const p=scopedProject(id?activity(id)?.project:S.project);if(!p)return;const original=id?activity(id):null;if(original&&(!scopedProject(original.project)||!ensureEditable(original)))return;const saved=D.applications.find(a=>a.object===id&&['草稿','已撤回','已驳回'].includes(a.status));const base=original||{id:'A'+Date.now(),project:p.id,kind:kind||(['activities','actions'].includes(S.page)?foundationActivityKind():S.projectTab),template:'报名类',name:'',intro:'',start:'2026-11-20T14:00',end:'2026-11-20T17:00',deadline:'2026-11-18T18:00',capacity:20,limit:30,amount:50,contact:[p.contact,p.contactPhone].filter(Boolean).join(' '),location:'',status:'草稿',version:0,format:'线上'};const a={...base,...(saved?.snapshot||{})};Object.assign(a,projectContactParts(a));const body='<div class="hint full">所属项目：'+esc(p.name)+' · 归属：'+esc(a.kind)+'</div>'+select('模板','template',a.kind==='公益行动'?['报名类','宣发类']:['报名类','捐款类','捐赠参会类','宣发类'],a.template)+contentCarouselField(a.kind==='公益行动'?'行动轮播图':'活动轮播图',a.kind)+field('标题','name',a.name)+'<div id="template-fields" class="full"></div>'+field('介绍','intro',a.intro,'textarea',true,true)+'<div id="registration-fields" class="full" hidden></div>'+consent();form(id?'编辑'+a.kind:'新建'+a.kind,body,(data,intent)=>{if($('#edit-form').groupQrReader)return '微信群二维码正在读取，请稍候。';if(!data.name.trim())return '请填写标题。';if(intent==='submit'){if(['报名类','捐赠参会类'].includes(data.template)&&data.skills==='on'&&data.skillsInput==='select'&&!String(data.skillsOptions||'').trim())return '请为专项技能选择框至少添加一个选项。';if(data.template!=='宣发类'&&(!data.contact?.trim()||!data.contactPhone?.trim()))return '请填写联系人和联系电话。';if(!data.agreement)return '请阅读并主动确认适用协议。';if(!data.intro.trim()&&!/<(?:img|video)[ >]/.test(data.bodyHtml||''))return '请填写图文介绍。';if(!['宣发类','捐款类'].includes(data.template)){const timeIssue=contentTimeError(data);if(timeIssue)return timeIssue;if(new Date(data.end)>new Date(p.end))return '结束时间不能晚于所属项目结束时间。';if(new Date(data.end)<=new Date('2026-10-30T00:00'))return '结束时间须晚于当前演示时间。';}if(!org().qualified)return '当前机构公开募捐资格未通过，不能提交该模板。';if(['报名类','捐赠参会类'].includes(data.template)&&(!Number.isInteger(Number(data.capacity))||Number(data.capacity)<1))return '录取 / 参会名额须为正整数。';if(data.template==='报名类'&&Number(data.limit)<Number(data.capacity))return '报名上限不得小于录取名额。';if(data.template==='捐赠参会类'&&Number(data.capacity)<D.registrations.filter(r=>r.activity===a.id&&r.status==='资格有效').length+(a.held||0))return '总名额不能少于有效资格人数与付款保留人数之和。';}if(intent==='submit'&&['报名类','捐赠参会类'].includes(data.template)&&!data.groupQr)return '请上传组织者微信群二维码。';const issue=R.donationError(data,a.kind==='公益行动');if(issue)return issue;const media=window.WorkbenchContentPreview?.snapshot();const snapshot={...data,...(data.template==='捐款类'?{start:'',end:''}:{}),location:data.format==='线上'?'':data.location||'',carouselMedia:media?.carouselMedia||a.carouselMedia||[],images:media?.images||a.images||[],videos:media?.videos||a.videos||[],...R.donationSnapshot(data,a.kind==='公益行动'),experience:['报名类','捐赠参会类'].includes(data.template)&&data.experience==='on',skills:['报名类','捐赠参会类'].includes(data.template)&&data.skills==='on',skillsInput:data.skillsInput||'text',skillsOptions:data.skillsOptions||'',capacity:Number(data.capacity||0),limit:Number(data.limit||0)};if(!original)D.activities.push({...base,...snapshot,status:intent==='draft'?'草稿':'待审批'});const error=submitApplication(a.kind+'发布 / 变更',original||base,snapshot,intent);if(error)return error;closeOverlay();render();toast(intent==='draft'?'草稿已保存':'内容已提交审批，保留原生效版本');},'提交审批',true);addEditorPreview('activity',a,p);renderTemplateFields(a);syncDonationRequirements();}
function registrationGroupField(a){
 return '<div class="full registration-group"><strong>组织者微信群二维码</strong><p class="registration-settings-hint">请先建立微信群并上传群二维码，报名通过后向用户提供。</p><input type="hidden" name="groupQr" value="'+esc(a.groupQr||'')+'"><input type="file" data-group-qr data-managed-preview="true" accept="image/png,image/jpeg,image/webp" aria-label="上传微信群二维码"><div data-group-qr-preview>'+(a.groupQr?'<img src="'+esc(a.groupQr)+'" alt="微信群二维码" width="112" height="112">':'')+'</div><p class="registration-settings-hint" data-group-qr-status role="status">'+(a.groupQr?'已上传，可重新选择图片替换。':'支持 PNG、JPG、WebP 图片。')+'</p></div>';
}
function setupRegistrationGroup(){
 const editor=$('#edit-form'),input=editor?.querySelector('[data-group-qr]');if(!input)return;
 input.addEventListener('change',()=>{
  const file=input.files[0],status=editor.querySelector('[data-group-qr-status]');if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status.textContent='请选择 PNG、JPG 或 WebP 图片。';input.value='';return;}
  const reader=new FileReader();editor.groupQrReader=reader;status.textContent='二维码读取中…';
  reader.onload=()=>{if(editor.groupQrReader!==reader)return;editor.groupQrReader=null;if(!editor.isConnected)return;editor.registrationFields={...editor.registrationFields,groupQr:reader.result};if(editor.elements.groupQr){editor.elements.groupQr.value=reader.result;const image=document.createElement('img');image.src=reader.result;image.alt='微信群二维码';image.width=image.height=112;editor.querySelector('[data-group-qr-preview]').replaceChildren(image);editor.querySelector('[data-group-qr-status]').textContent='已上传，可重新选择图片替换。';}input.value='';window.WorkbenchContentPreview?.update();};
  reader.onerror=()=>{if(editor.groupQrReader===reader)editor.groupQrReader=null;if(input.isConnected)status.textContent='二维码读取失败，请重新上传。';};reader.readAsDataURL(file);
 });
}
function registrationFields(a){
 const enterprise=(a.registrationTarget||(a.kind==='项目活动'?'enterprise':'personal'))==='enterprise';
 const fixed=enterprise?['企业名称','本人姓名','手机号','职务']:['姓名','手机号'];
 const enabled=value=>value===true||value==='on';
 const choice=(name,label,checked,disabled=false)=>'<label'+(disabled?' class="is-fixed"':'')+'><input type="checkbox"'+(name?' name="'+name+'"':'')+(checked?' checked':'')+(disabled?' disabled':'')+'><span>'+esc(label)+'</span></label>';
 return '<fieldset class="registration-settings full"><legend>报名需填写的信息</legend>'+select('报名对象','registrationTarget',[['personal','个人'],['enterprise','企业']],a.registrationTarget||(a.kind==='项目活动'?'enterprise':'personal'))+'<p class="registration-settings-hint">'+(enterprise?'企业参会人员各自在客户端报名。':'')+'固定必填项已勾选，可多选需填写的补充资料。</p><div class="registration-options">'+fixed.map(label=>choice('',label,true,true)).join('')+[['experience','公益经历（文本框）'],['skills','专项技能']].map(([name,label])=>choice(name,label,enabled(a[name]))).join('')+'</div><div class="registration-skills-config form-grid" data-skills-config>'+select('专项技能填写方式','skillsInput',[['text','文本框'],['select','选择框']],a.skillsInput||'text')+'<div class="full" data-skills-options><span class="skills-options-label">专项技能选项</span><input type="hidden" name="skillsOptions" value="'+esc(a.skillsOptions||'')+'"><div class="skills-option-tags" data-skills-tags></div><div class="skills-option-add"><input type="text" data-skill-option placeholder="输入选项，按回车添加" aria-label="新的专项技能选项"><button type="button" class="btn" data-skill-add>添加选项</button></div><p class="registration-settings-hint" data-skills-hint role="status">由发起人添加选项，报名人员从中选择。</p></div></div></fieldset>'+registrationGroupField(a);
}
function renderRegistrationFields(a){
 const editor=$('#edit-form'),root=$('#registration-fields');
 root.hidden=!['报名类','捐赠参会类'].includes(editor.elements.template.value);
 root.innerHTML=root.hidden?'':registrationFields(a);setupSkillOptions();setupRegistrationGroup();syncRegistrationRequirements();
 const target=editor.elements.registrationTarget;if(!target)return;
 target.addEventListener('change',()=>{
  const values=Object.fromEntries(new FormData(editor)),experience=editor.elements.experience.checked,skills=editor.elements.skills.checked;
  renderRegistrationFields({...a,...values,experience,skills});editor.elements.registrationTarget.focus();window.WorkbenchContentPreview?.update();
 });
}
function syncActivityLocation(){
 const editor=$('#edit-form');if(!editor?.querySelector('#template-fields'))return;
 const input=editor.elements.location;if(!input)return;const online=editor.elements.format?.value==='线上';
 input.closest('label').hidden=online;input.disabled=online;input.required=!online;
}
function contentTimeError(data){
 if(!data.start)return '请填写开始时间。';
 if(!Number.isFinite(Date.parse(data.start)))return '开始时间格式无效，请重新选择。';
 if(!data.end)return '请填写结束时间。';
 if(!Number.isFinite(Date.parse(data.end)))return '结束时间格式无效，请重新选择。';
 if(new Date(data.start)>=new Date(data.end))return '结束时间必须晚于开始时间。';
 if(['报名类','捐赠参会类'].includes(data.template)){
  if(!data.deadline)return '请填写报名截止时间。';
  if(!Number.isFinite(Date.parse(data.deadline)))return '报名截止时间格式无效，请重新选择。';
  if(new Date(data.deadline)>new Date(data.start))return '报名截止时间不能晚于开始时间。';
 }
 return '';
}
function setupSkillOptions(){
 const editor=$('#edit-form'),root=editor.querySelector('[data-skills-options]');if(!root)return;
 const input=root.querySelector('[data-skill-option]'),hidden=editor.elements.skillsOptions,list=root.querySelector('[data-skills-tags]'),hint=root.querySelector('[data-skills-hint]');
 const read=()=>[...new Set(hidden.value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean))];
 const draw=()=>{list.replaceChildren(...read().map((value,index)=>{const chip=document.createElement('span');chip.className='skills-option-tag';const text=document.createElement('span');text.textContent=value;const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','删除选项：'+value);remove.addEventListener('click',()=>{hidden.value=read().filter((_,i)=>i!==index).join('\n');draw();window.WorkbenchContentPreview?.update();});chip.append(text,remove);return chip;}));};
 const add=()=>{const value=input.value.trim();if(!value)return;const options=read();if(options.includes(value)){hint.textContent='该选项已存在。';input.focus();return;}hidden.value=[...options,value].join('\n');input.value='';hint.textContent='由发起人添加选项，报名人员从中选择。';draw();window.WorkbenchContentPreview?.update();};
 root.querySelector('[data-skill-add]').addEventListener('click',add);input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();add();}});input.addEventListener('change',add);draw();
}
function syncRegistrationRequirements(){
 const editor=$('#edit-form'),config=editor?.querySelector('[data-skills-config]');if(!config)return;
 config.hidden=!editor.elements.skills.checked;
 const options=editor.querySelector('[data-skills-options]');options.hidden=editor.elements.skillsInput.value!=='select';
}
function renderTemplateFields(a){
 window.MerchantDateRange?.close();
 const editor=$('#edit-form');
 if(editor.elements.amountModes)editor.activityDonation=R.donationSnapshot(Object.fromEntries(new FormData(editor)));
 if(editor.querySelector('.registration-settings'))editor.registrationFields={...Object.fromEntries(['experience','skills'].map(name=>[name,editor.querySelector('[name="'+name+'"]').checked])),skillsInput:editor.elements.skillsInput.value,skillsOptions:editor.elements.skillsOptions.value,registrationTarget:editor.elements.registrationTarget.value,groupQr:editor.elements.groupQr.value};
 editor.activityBasics={...editor.activityBasics,...Object.fromEntries(['start','end','deadline','location','format','contact','contactPhone','related'].filter(name=>editor.elements[name]).map(name=>[name,editor.elements[name].value]))};
 a={...a,...editor.activityBasics,...editor.registrationFields,...editor.activityDonation};Object.assign(a,projectContactParts(a));
 const t=$('#edit-form [name=template]').value,registration=['报名类','捐赠参会类'].includes(t);
 let h=registration?field(t==='捐赠参会类'?'参会名额':'录取名额','capacity',a.capacity,'number'):'';
 if(!['宣发类','捐款类'].includes(t))h+=window.MerchantDateRange.editorField(a.kind==='公益行动'?'行动时间':'活动时间','start','end',a.start,a.end,dateValue(demoNow));
 if(t==='捐赠参会类')h+=select('参会形式','format',['线上','线下'],a.format||'线上');
 if(!['宣发类','捐款类'].includes(t))h+=field(a.kind==='公益行动'?'行动地点':'活动地点','location',a.location);
 if(registration)h+=field('报名截止时间','deadline',a.deadline,'datetime-local');
 if(t!=='宣发类')h+=field('联系人','contact',a.contact)+field('联系电话','contactPhone',a.contactPhone,'tel');
 if(t==='报名类')h+=field('报名上限','limit',a.limit,'number');
 renderRegistrationFields(a);
 h+=donationFields(a);
 if(t==='宣发类')h+=select(a.kind==='公益行动'?'关联行动':'关联同项目活动','related',D.activities.filter(x=>x.project===a.project&&x.kind===a.kind&&['报名类','捐赠参会类'].includes(x.template)).map(x=>[x.id,x.name]),a.related);
 $('#template-fields').innerHTML='<div class="form-grid">'+h+'</div>';syncActivityLocation();syncDonationRequirements();window.WorkbenchContentPreview?.update();
}
function orderNotificationTable(o){
 if(!o.notificationRecords){
  const receiver=(o.receiver||'').split('\n'),phone=(receiver[1]||'').replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2');
  const message=['订单编号：'+o.id,'商品：'+o.productName,'规格：'+o.sku,'数量：'+o.qty+' 件','商品金额：'+money(o.paid),'配送运费：'+money(o.shippingFee||0),'订单金额：'+money(round(o.paid+(o.shippingFee||0))),'交付方式：'+o.method,...(o.method==='快递配送'?['收件人：'+(receiver[0]?receiver[0].slice(0,1)+'**':'—')+' '+phone]:[]),'请登录商家工作台查看并处理订单。'].join('\n');
  o.notificationRecords=[{type:o.payment==='支付成功'?'新订单提醒':'订单状态提醒',channel:'飞书群',group:(D.organizations.find(x=>x.id===o.org)?.name||'商家')+' · 订单通知群（示例）',message,status:o.notify,reason:o.notify==='发送失败'?'群机器人配置失效，消息未送达':'',date:o.date,attempt:'首次发送'}];
 }
 return table(['通知类型','接收群 / 渠道','通知内容','发送时间','发送结果','失败原因','操作'],o.notificationRecords.map(n=>tr([esc(n.type)+'<div class="tiny muted">'+esc(n.attempt)+'</div>',esc(n.group)+'<div class="tiny muted">'+esc(n.channel)+'</div>','<div class="order-notification-message">'+esc(n.message)+'</div>',esc(n.date),badge(n.status),esc(n.reason||'—'),isMerchant&&n.status==='发送失败'?link('联系系统管理员','contact-system-admin',o.id):'—'])))+'<p class="description">通知失败不影响订单处理；每次重试单独保留记录，发送结果以渠道回执为准。</p>';
}
function orderDetailTable(heads,rows,kind){return '<div class="table-wrap detail-table '+kind+'" tabindex="0" aria-label="'+(kind==='order-goods-table'?'订单商品':'售后记录')+'"><table><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(values=>'<tr>'+values.map((value,i)=>'<td data-label="'+esc(heads[i])+'">'+value+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function logisticsTimeline(shipments,compact=false){
 return shipments.length?shipments.map(pkg=>{
  const events=[...(pkg.events||[])].sort((a,b)=>b.time.localeCompare(a.time));
  const timeline=events.length?'<ol class="logistics-timeline">'+events.map((event,i)=>'<li'+(compact&&i>1?' hidden':'')+' class="'+(event.issue?'issue':i===0?'latest':'')+'"><span>'+esc(event.text)+'</span><time>'+esc(event.time)+'</time></li>').join('')+'</ol>'+(compact&&events.length>2?'<button type="button" class="logistics-toggle" data-action="toggle-logistics" aria-expanded="false">展开更多物流信息<svg class="dropdown-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>':''):'<p class="muted logistics-empty">暂无物流轨迹，等待快递公司更新。</p>';
  return '<section class="logistics-package"><div class="logistics-package-info"><h4>包裹信息</h4>'+kv([['快递公司',pkg.carrier||'快递'],['快递单号',esc(pkg.waybill)+(isMerchant?' '+link('复制','copy-waybill',pkg.waybill):''),true],['快递电话',pkg.carrierPhone||'—']])+'</div><div class="logistics-package-tracking"><h4>物流轨迹</h4>'+timeline+'</div></section>';
 }).join(''):'<p class="muted logistics-empty">暂无物流轨迹</p>';
}
function returnLogistics(o){return (o.returnShipments||[]).length?'<div class="shipping-track return-logistics"><h4>退回物流</h4>'+logisticsTimeline(o.returnShipments,true)+'</div>':'';}
function previewEvidence(source){const [id,afterId]=source.split('|'),o=D.orders.find(x=>x.id===id);if(!o||!allowedOrder(o))return;const a=afterId?syncAftersale(o).find(a=>a.id===afterId):o;if(!a?.evidence?.length)return;subdialog('图片凭证预览','<div class="evidence-preview">'+a.evidence.map(file=>'<figure><img src="'+esc(file.src)+'" alt="'+esc(file.name)+'"><figcaption>'+esc(file.name)+'</figcaption></figure>').join('')+'</div>',orderActionContext()?'返回售后处理':'返回订单详情');}
function orderPageUrl(id,section){const url=new URL('order.html',location.href);url.search=new URLSearchParams({id,org:S.org,shop:currentShop()?.id||'',demoAccount:S.demoAccount,...(section?{section}:{})});return url.href;}
function openOrderPage(id,section){const o=D.orders.find(x=>x.id===id)||D.orders.find(x=>x.parentOrderId===id||x.splitSourceOrderId===id);if(!o||!allowedOrder(o))return;id=o.id;const child=window.open(orderPageUrl(id,section),'_blank');if(child)orderWindows.set(child,{id,org:S.org,shop:currentShop()?.id||'',demoAccount:S.demoAccount,member:S.member});else toast('请允许浏览器打开订单详情新标签页');}
function publishOrderChange(){if(!isOrderPage||!window.opener)return;const o=D.orders.find(x=>x.id===orderParams.get('id'));if(o&&allowedOrder(o))window.opener.postMessage({type:'workbench-order-updated',order:JSON.parse(JSON.stringify(o)),remarkPreferences:JSON.parse(JSON.stringify(D.merchantRemarkPreferences||{}))},'*');}
window.addEventListener('message',event=>{
 if(isOrderPage){
  if(event.source!==window.opener||event.data?.type!=='workbench-order-snapshot'||event.data.role!==role)return;
  if(event.data.demoAccount!==S.demoAccount)return;Object.assign(D,event.data.data);S.org=event.data.org;S.shop=event.data.shop||'';syncMembership();render();document.body.dataset.orderReady='true';return;
 }
 const context=orderWindows.get(event.source);if(!context)return;
 if(event.data?.type==='workbench-order-ready')event.source.postMessage({type:'workbench-order-snapshot',role,org:context.org,shop:context.shop,demoAccount:context.demoAccount,member:context.member,data:JSON.parse(JSON.stringify(D))},'*');
 if(event.data?.type==='workbench-order-updated'&&event.data.order?.id===context.id){const o=D.orders.find(x=>x.id===context.id);if(o&&(isMerchant?o.org===context.org:project(o.project)?.org===context.org)){delete o.merchantRemark;Object.assign(o,event.data.order);if(isMerchant&&event.data.remarkPreferences){const key=o.org+'|'+o.shop,prefs=event.data.remarkPreferences[key];if(prefs){D.merchantRemarkPreferences??={};D.merchantRemarkPreferences[key]=prefs;}}if(isMerchant&&S.page==='orders'&&!$('#overlay').children.length)render();}}
});
// Measure each header row so wrapped mobile headings and multiple tab rows stack correctly.
let workspaceHeaderObserver,workspaceStickyObserver;
function setupWorkspaceHeader(){workspaceHeaderObserver?.disconnect();const header=$('.topbar');if(!header)return;const update=()=>document.documentElement.style.setProperty('--workspace-header-height',Math.ceil(header.getBoundingClientRect().height)+'px');workspaceHeaderObserver=new ResizeObserver(update);workspaceHeaderObserver.observe(header);update();}
function setupWorkspaceSticky(){
 workspaceStickyObserver?.disconnect();
 const main=$('#main'),topbar=$('.topbar'),heading=main?.querySelector(':scope > .page-head');
 if(!heading)return;
 heading.classList.add('workspace-sticky-heading');
 const cards=[...main.querySelectorAll(':scope > .card')];
 const card=cards.find(el=>el.querySelector(':scope > .tabs, :scope > .order-status-tabs, :scope > .product-status-tabs'));
 const bars=card?[...card.querySelectorAll(':scope > .tabs, :scope > .order-status-tabs, :scope > .product-status-tabs')]:[];
 if(card)card.classList.add('workspace-sticky-card');
 bars.forEach((bar,i)=>{bar.classList.add('workspace-sticky-tabs');bar.style.zIndex=String(18-i);});
 const update=()=>{
  const top=topbar?.getBoundingClientRect().height||0;
  heading.style.setProperty('--workspace-sticky-top',top+'px');
  // Include the main content's top spacing in the sticky box from the first pixel.
  heading.style.setProperty('--workspace-heading-inset',getComputedStyle(main).paddingTop);
  const gap=parseFloat(getComputedStyle(heading).marginBottom)||0;
  heading.style.setProperty('--workspace-heading-gap',gap+'px');
  let offset=top+heading.getBoundingClientRect().height+gap;
  for(const bar of bars){bar.style.setProperty('--workspace-sticky-top',offset+'px');offset+=bar.getBoundingClientRect().height;}
 };
 workspaceStickyObserver=new ResizeObserver(update);
 [topbar,heading,...bars].filter(Boolean).forEach(el=>workspaceStickyObserver.observe(el));
 update();
}

let orderSummaryResizeObserver;
function setupOrderSummarySticky(){
 orderSummaryResizeObserver?.disconnect();
 if(!isMerchant)return;
 const summary=$('.order-page .order-status-summary'),header=$('.order-page .drawer-head'),topbar=$('.topbar');if(!summary)return;
 const update=()=>{
  const topHeight=Math.ceil(topbar?.getBoundingClientRect().height||0),headerHeight=Math.ceil(header?.getBoundingClientRect().height||0);
  document.documentElement.style.setProperty('--order-sticky-top',topHeight+'px');
  document.documentElement.style.setProperty('--order-header-height',headerHeight+'px');
  document.documentElement.style.setProperty('--order-summary-offset',Math.ceil(summary.getBoundingClientRect().height+topHeight+headerHeight+12)+'px');
  const canvas=summary.querySelector('.order-timeline-canvas');if(!canvas)return;
  const fork=Number(canvas.style.getPropertyValue('--after-fork')),nodes=canvas.querySelectorAll('.order-event-timeline .order-event-dot'),first=nodes[0]?.getBoundingClientRect(),next=nodes[1]?.getBoundingClientRect(),branch=canvas.querySelector('.order-aftersale-timeline .order-event-dot')?.getBoundingClientRect(),box=canvas.getBoundingClientRect();
  if(first&&branch){const width=next?next.left-first.left:nodes[0].closest('li').getBoundingClientRect().width;canvas.style.setProperty('--fork-left',first.left-box.left+first.width/2+fork*width+'px');canvas.style.setProperty('--fork-top',first.top-box.top+first.height/2+'px');canvas.style.setProperty('--fork-height',branch.top-first.top+'px');}
 };
 orderSummaryResizeObserver=new ResizeObserver(update);orderSummaryResizeObserver.observe(summary);if(header)orderSummaryResizeObserver.observe(header);if(topbar)orderSummaryResizeObserver.observe(topbar);update();
}
function orderSummary(o){
 const status=orderStatus(o),pickup=o.method!=='快递配送',closed=o.delivery==='已关闭';
 let title=status==='待发货'?(pickup?'待领取':'待发货'):status==='已完成'?(pickup?'已领取，订单已完成':'已收货，订单已完成'):status;
 const steps=[{label:'提交订单',time:o.date,done:true}];
 const paid=o.payment==='支付成功';
 if(paid||!closed)steps.push({label:paid?'付款成功':'等待付款',time:o.paidAt,done:paid});
 if(paid&&!closed){
  if(!pickup){const shipped=!!o.shippedAt||['已发货','已收货','已完成'].includes(o.delivery);steps.push({label:shipped?'已发货':'等待发货',time:o.shippedAt||(shipped?'等待物流回传':''),done:shipped});}
  steps.push({label:o.received?(pickup?'已领取':'确认收货'):(pickup?'等待领取':'等待收货'),time:o.received,done:!!o.received});
 }
 if(closed)steps.push({label:status,time:o.closedAt,done:true});
 const afterQty=Number(o.afterQty||o.refundedQty||0),hasAfter=o.after&&o.after!=='无售后',partialAfter=isMerchant&&hasAfter&&afterQty>0&&afterQty<o.qty;
 const normalQty=partialAfter?o.qty-afterQty:o.qty-(o.refundedQty||0);
 const splitStatus=partialAfter?(o.split==='售后暂停'?'待分账':isMerchant?R.splitCategory(o.split):o.split):orderSplitStatus(o);
 const splitLabel=splitStatus==='待分账'?'等待分账':splitStatus;
 const splitStep=isMerchant&&C.canReadSplit(o)&&paid&&!closed&&normalQty>0?{label:splitLabel,time:splitStatus==='分账成功'?o.settledAt:'',done:splitStatus==='分账成功'}:null;

 const afterSteps=[];
 if(hasAfter){
  const cancelled=['已取消','已撤销','已关闭'].includes(o.after),rejected=o.after==='已拒绝',refunded=['已退款','极速退款已完成'].includes(o.after),returning=o.afterType==='退货退款';
  afterSteps.push({label:'申请售后'+(partialAfter?'（'+afterQty+'/'+o.qty+'件）':''),time:o.afterSubmittedAt,done:true});
  if(o.afterApprovedAt)afterSteps.push({label:returning?'同意退货':'同意退款',time:o.afterApprovedAt,done:true});
  if(o.returnCollectedAt)afterSteps.push({label:'买家寄回',time:o.returnCollectedAt,done:true});
  if(o.returnReceivedAt)afterSteps.push({label:'退货验收',time:o.returnReceivedAt,done:true});
  if(o.refundSubmittedAt)afterSteps.push({label:'确认并发起退款',time:o.refundSubmittedAt,done:true});
  if(cancelled||rejected)afterSteps.push({label:cancelled?'售后已取消（'+R.cancellationReason(o,'after')+'）':'售后已拒绝',time:o.afterCancelledAt||o.afterClosedAt||o.afterRejectedAt,done:true});
  else if(refunded)afterSteps.push({label:'退款完成',time:o.refundedAt,done:true});
  else afterSteps.push({label:({'待处理':'等待商家处理','待商家处理':'等待商家处理','待买家退货':'等待买家寄回','待验收':afterStage(o)==='待确认退款'?'等待运营确认退款':'等待退货验收','待商家收货':'等待退货验收','待收货验收':'等待退货验收','待确认退款':'等待运营确认退款','退款处理中':'退款处理中','退款异常':'退款异常'})[o.after]||afterDisplay(o),time:o.refundSubmittedAt,done:false});
 }
 const renderEvents=(items,cls,label)=>{const pending=items.findIndex(step=>!step.done),latest=pending<0?items.length-1:pending;return '<ol class="'+cls+'" aria-label="'+label+'">'+items.map((step,i)=>'<li class="'+(step.done?'done':'pending')+(i===latest?' current':'')+'"><span class="order-event-dot" aria-hidden="true"></span><span class="order-event-label">'+esc(step.label)+'</span>'+(step.time?'<time>'+esc(step.time.replace('T',' '))+'</time>':'')+'</li>').join('')+'</ol>';};
 let timeline;
 if(partialAfter){
  const submitted=R.time(o.afterSubmittedAt);let fork=0;
  const timed=steps.map((step,i)=>({i,time:R.time(step.time)})).filter(step=>Number.isFinite(step.time));
  if(Number.isFinite(submitted)){
   const before=timed.filter(step=>step.time<=submitted).at(-1),after=timed.find(step=>step.time>submitted);
   if(before&&after)fork=before.i+(after.i-before.i)*(submitted-before.time)/(after.time-before.time);
   else if(before)fork=before.i+(submitted>before.time?0.5:0);
  }
  const normalSteps=splitStep?[...steps,splitStep]:steps,normalStart=Math.min(Math.floor(fork)+1,normalSteps.length-1);
  const normalEvents=normalSteps.map((step,i)=>i===normalStart?{...step,label:step.label+'（'+normalQty+'/'+o.qty+'件）'}:step);
  timeline='<div class="order-timeline-tree" aria-label="部分售后分支时间轴"><div class="order-timeline-canvas" style="--after-fork:'+fork+'">'+renderEvents(normalEvents,'order-event-timeline','订单时间轴')+'<div class="order-aftersale-branch">'+renderEvents(afterSteps,'order-aftersale-timeline','部分售后时间轴：'+afterQty+' / '+o.qty+' 件')+'</div></div></div>';
 }else{
  const continuing=!hasAfter||['已取消','已撤销','已关闭','已拒绝'].includes(o.after),main=continuing?steps:steps.filter(step=>step.done);
  const events=[...main,...afterSteps].map((step,i)=>({...step,index:i})).sort((a,b)=>{if(a.done!==b.done)return a.done?-1:1;const ta=R.time(a.time),tb=R.time(b.time);return Number.isFinite(ta)&&Number.isFinite(tb)?ta-tb:a.index-b.index;});
  if(splitStep)events.push(splitStep);
  timeline='<div class="order-timeline-tree">'+renderEvents(events,'order-event-timeline','订单时间轴')+'</div>';
 }
 const after=o.after&&o.after!=='无售后'?'<div class="order-summary-after"><span>'+(partialAfter?'部分售后':'售后')+'</span><strong>'+esc((afterTypeLabel(o.afterType)||'售后')+' · '+afterDisplay(o)+(partialAfter?'（'+afterQty+' / '+o.qty+' 件）':''))+'</strong>'+btn('售后详情','order-after-anchor',o.id,'btn compact')+'</div>':'';
 return '<section class="order-status-summary" aria-label="订单状态概览"><div class="order-summary-top"><h2 class="order-status-title">'+icon(closed?'close':pickup?'shop':'box')+'<span>'+esc(title)+'</span></h2>'+timeline+'</div>'+after+'</section>';
}
function renderOrderSplitPlanSnapshot(o,skuName=o.sku){
 const plan=orderSplitPlan(o),host=$('#overlay .product-editor #pe-charity');if(!plan||!host||isMerchant&&!(C.canReadSplit(o)||C.canFullOrder(o)&&C.canProduct(product(o.product),'productSplitView')))return;
 const sku=plan.skus.find(s=>s.name===skuName)||plan.skus[0];
 host.dataset.orderSplitSnapshot=o.id;
 host.innerHTML='<h3><span>3</span>分账计划 '+esc(plan.version)+'</h3>'+kv([['计划名称',plan.name],['关联项目',plan.projectName],['公益模式',plan.mode==='random'?'随机随单捐':'固定份额']])+'<label class="order-plan-sku">适用规格<select data-order-plan-sku data-id="'+esc(o.id)+'" aria-label="分账适用规格">'+plan.skus.map(s=>'<option value="'+esc(s.name)+'"'+(s.name===sku.name?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label>'+splitPlanRecipientTable(plan,sku)+'<p class="tiny muted">商品单价 '+money(sku.price)+(plan.mode==='random'?' · 本单逐件金额保存在订单分账记录中。':' · 每件分账总额 '+money(round(sku.recipients.reduce((sum,r)=>sum+Number(r.amount),0))))+'</p>';
}
let splitPlanHoverTimer,splitPlanHoverCloseTimer,splitPlanHoverAnchor;
function closeSplitPlanHover(){clearTimeout(splitPlanHoverTimer);clearTimeout(splitPlanHoverCloseTimer);splitPlanHoverAnchor?.removeAttribute('aria-describedby');splitPlanHoverAnchor=null;$('#order-split-plan-hover')?.remove();}
function scheduleSplitPlanHoverClose(){clearTimeout(splitPlanHoverTimer);clearTimeout(splitPlanHoverCloseTimer);splitPlanHoverCloseTimer=setTimeout(closeSplitPlanHover,180);}
function showSplitPlanHover(anchor){
 const o=D.orders.find(x=>x.id===anchor.dataset.id),plan=o&&orderSplitPlan(o);
 if(!isMerchant||!o||!allowedOrder(o)||!C.canReadSplit(o)||!plan||!anchor.isConnected||$('#overlay .product-editor'))return;
 closeSplitPlanHover();splitPlanHoverAnchor=anchor;
 const sku=plan.skus.find(s=>s.name===o.sku),panel=document.createElement('section');
 panel.id='order-split-plan-hover';panel.className='order-logistics-hover order-split-plan-hover';panel.setAttribute('role','region');panel.setAttribute('aria-label','分账版本预览');
 panel.innerHTML='<header><strong>分账版本 '+esc(plan.version)+'</strong><span>'+esc(sku.name)+' · '+(plan.mode==='random'?'随机随单捐':'固定份额')+'</span></header><div class="logistics-hover-scroll" tabindex="0" aria-label="滚动查看分账版本">'+splitPlanRecipientTable(plan,sku)+'</div><footer>点击版本查看商品快照中的分账计划</footer>';
 document.body.append(panel);anchor.setAttribute('aria-describedby',panel.id);
 const r=anchor.getBoundingClientRect(),gap=8,pad=12,below=innerHeight-r.bottom-gap-pad,above=r.top-gap-pad,down=below>=Math.min(panel.offsetHeight,280)||below>=above;
 panel.style.maxHeight=Math.max(0,down?below:above)+'px';panel.style.left=Math.max(pad,Math.min(r.left,innerWidth-panel.offsetWidth-pad))+'px';
 panel.style.top=down?r.bottom+gap+'px':'auto';panel.style.bottom=down?'auto':innerHeight-r.top+gap+'px';
 panel.addEventListener('mouseenter',()=>clearTimeout(splitPlanHoverCloseTimer));panel.addEventListener('mouseleave',scheduleSplitPlanHoverClose);
}
function queueSplitPlanHover(anchor){clearTimeout(splitPlanHoverCloseTimer);clearTimeout(splitPlanHoverTimer);if(splitPlanHoverAnchor===anchor)return;splitPlanHoverTimer=setTimeout(()=>showSplitPlanHover(anchor),160);}
let logisticsHoverTimer,logisticsHoverCloseTimer,logisticsHoverAnchor;
function closeLogisticsHover(){clearTimeout(logisticsHoverTimer);clearTimeout(logisticsHoverCloseTimer);logisticsHoverAnchor?.removeAttribute('aria-describedby');logisticsHoverAnchor=null;$('#order-logistics-hover')?.remove();}
function scheduleLogisticsHoverClose(){clearTimeout(logisticsHoverTimer);clearTimeout(logisticsHoverCloseTimer);logisticsHoverCloseTimer=setTimeout(closeLogisticsHover,180);}
function showLogisticsHover(anchor){
 const o=D.orders.find(x=>x.id===anchor.dataset.id);if(!isMerchant||!o||(!allowedOrder(o)||!C.canReceiver(o))||!anchor.isConnected||$('#overlay').children.length)return;
 closeLogisticsHover();logisticsHoverAnchor=anchor;
 const panel=document.createElement('section');panel.id='order-logistics-hover';panel.className='order-logistics-hover anchored-shipping';panel.setAttribute('role','region');panel.setAttribute('aria-label','物流预览');
 panel.innerHTML='<header><strong>物流信息</strong></header><div class="logistics-hover-scroll" tabindex="0" aria-label="滚动查看物流轨迹">'+(o.fulfillmentIssue?'<p class="hint">'+esc(o.fulfillmentIssue)+'</p>':'')+logisticsTimeline(o.shipments||[])+'</div>';
 document.body.append(panel);anchor.setAttribute('aria-describedby',panel.id);
 const r=anchor.getBoundingClientRect(),gap=8,pad=12,below=innerHeight-r.bottom-gap-pad,above=r.top-gap-pad,down=below>=Math.min(panel.offsetHeight,280)||below>=above;
 panel.style.maxHeight=Math.max(0,down?below:above)+'px';panel.style.left=Math.max(pad,Math.min(r.right-panel.offsetWidth,innerWidth-panel.offsetWidth-pad))+'px';
 panel.style.top=down?r.bottom+gap+'px':'auto';panel.style.bottom=down?'auto':innerHeight-r.top+gap+'px';panel.classList.toggle('shipping-below',down);panel.style.setProperty('--shipping-arrow-left',Math.max(18,Math.min(r.left+r.width/2-parseFloat(panel.style.left),panel.offsetWidth-18))+'px');
 panel.addEventListener('mouseenter',()=>clearTimeout(logisticsHoverCloseTimer));panel.addEventListener('mouseleave',scheduleLogisticsHoverClose);
}
function queueLogisticsHover(anchor){clearTimeout(logisticsHoverCloseTimer);clearTimeout(logisticsHoverTimer);if(logisticsHoverAnchor===anchor)return;logisticsHoverTimer=setTimeout(()=>showLogisticsHover(anchor),180);}
function anchorOrderDialog(anchor){
 const panel=$('#overlay .dialog');if(!panel||!anchor?.isConnected||innerWidth<=800)return;
 const r=anchor.getBoundingClientRect(),gap=12,padding=16,above=r.top-gap-padding,below=innerHeight-r.bottom-gap-padding;
 const placeAbove=above>=panel.offsetHeight||above>below;
 panel.classList.add('anchored-shipping');panel.classList.toggle('shipping-below',!placeAbove);
 panel.style.maxHeight=Math.max(0,placeAbove?above:below)+'px';
 const width=panel.offsetWidth,left=Math.max(padding,Math.min(r.right-width,innerWidth-width-padding));
 panel.style.left=left+'px';panel.style.top=placeAbove?'auto':r.bottom+gap+'px';panel.style.bottom=placeAbove?innerHeight-r.top+gap+'px':'auto';
 panel.style.setProperty('--shipping-arrow-left',Math.max(18,Math.min(r.left+r.width/2-left,width-18))+'px');
 $('#overlay .overlay-shade').classList.add('shipping-shade');
}
function orderActionContext(){return $('#overlay .order-action-popover')?.actionContext||$('#overlay .dialog')?.returnActionContext;}
function collaborationInspectionSummary(o,orderId=o.id){
 const a=currentInspection(o);if(!a)return '';
 const failed=R.failedInspection(a),proofError=R.inspectionProofError(a);
 const proofs=(a.proofs||[]).map((file,i)=>'<button type="button" class="inspection-proof" data-action="inspection-proof" data-id="'+esc(orderId+'|'+a.afterId+'|'+i)+'" title="点击查看验收凭证">'+(file.type==='application/pdf'?'<span>PDF</span>':'<img src="'+esc(file.src||file.data)+'" alt="'+esc(file.name)+'">')+'<span>'+esc(file.name)+'</span></button>').join('');
 return '<div data-inspection-order="'+esc(orderId)+'" data-inspection-after="'+esc(a.afterId)+'" class="collab-inspection'+(failed?' inspection-failed':'')+'"'+(failed?' role="alert"':'')+'><div class="inspection-copy"><div class="inspection-heading"><strong>退货验收</strong><span>'+esc(a.result)+'</span></div><div class="inspection-meta">'+esc(a.actor)+' · '+esc(a.date?.replace('T',' ').slice(0,19)||'—')+'</div><p>'+esc(a.note||'')+'</p>'+(proofError?'<p class="inspection-warning">异常验收缺少图片，无法确认退款。</p>':'')+(!proofs&&(a.proofNames||[]).length?'<small>'+esc(a.proofNames.join('、'))+'（原记录仅保存文件名）</small>':'')+'</div><div class="inspection-proofs">'+(proofs||'<span class="inspection-empty">未上传验收凭证</span>')+'</div></div>';
}
function previewInspectionProof(source){
 const [id,afterId,index]=source.split('|'),o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!o||isMerchant&&!C.canAfter(o))return;
 const a=syncAftersale(o).find(x=>x.id===afterId),inspection=afterId===o.afterId?currentInspection(o):a&&currentInspection(a),file=inspection?.proofs?.[Number(index)];if(!file)return;
 if(file.type==='application/pdf'){previewShopFile(file);return;}
 subdialog('验收图片预览','<div class="evidence-preview"><figure><img src="'+esc(file.src||file.data)+'" alt="'+esc(file.name)+'"><figcaption>'+esc(file.name)+'</figcaption></figure></div>','返回');
}
function aftersaleActions(o){
 if(!isMerchant)return '';
 if(afterStage(o)==='待商家处理')return (o.afterType==='退款（无需退货）'?btn('同意退款','refund',o.id,'btn primary'):btn('同意寄回','after-accept',o.id,'btn primary'))+(C.canAction('after-reject',o.id)?'<button type="button" class="btn danger" data-action="after-reject" data-id="'+esc(o.id)+'"'+(D.features?.merchantAfterReject===true?'':' disabled title="暂未开放"')+'>不通过</button>':'');
 return afterStage(o)==='待收货验收'?btn('收货验收','cp-inspect',o.id,'btn primary'):afterStage(o)==='待确认退款'?btn('确认退款','refund',o.id,'btn primary'):'';
}
function afterItemStrip(o){return '<div class="after-item-strip full"><span class="after-item-sku" title="'+esc(o.sku||'—')+'">'+esc(o.sku||'—')+'</span><span class="after-item-qty">'+(o.afterQty||0)+' 件</span><span class="after-item-amount"><small>退款</small><strong>'+money(round(o.paid/o.qty*(o.afterQty||0)))+'</strong></span></div>';}
function afterTimeDetails(o){
 const timing=R.acceptanceTiming(o);
 const deadline=['待处理','待商家处理'].includes(o.after)&&o.afterSubmittedAt?['处理截止',R.stamp(R.time(o.afterSubmittedAt)+48*R.HOUR)]:o.after==='待买家退货'&&o.afterApprovedAt?['寄回截止',R.stamp(R.time(o.afterApprovedAt)+7*R.DAY)]:null;
 return '<div class="after-time-row">'+kv([['申请时间',o.afterSubmittedAt||'—'],...(deadline?[deadline]:[]),...(o.returnSignedAt?[['退货签收',o.returnSignedAt]]:[]),...(Number.isFinite(timing.deadline)?[['验收截止',R.stamp(timing.deadline)]]:[]),...(o.afterAcceptanceAutoAt?[['自动确认并发起退款',o.afterAcceptanceAutoAt]]:[])])+'</div>';
}
function orderShippingTimeout(o){return R.orderIssueTypes(o,demoNow.getTime()).includes('发货超时')?'<div class="hint">发货超时 · 原承诺交寄截止 '+esc(o.shippingDeadline)+'，请核实交寄情况并处理。</div>':'';}
function openOrderAction(id,kind,anchor,sourceIndex=0){
 const o=D.orders.find(x=>x.id===id);if(!isMerchant||!o||!allowedOrder(o)||kind==='split'&&!C.canReadSplit(o)||kind==='after'&&!C.canAfter(o)||kind==='notifications'&&!C.canFullOrder(o)||kind==='logistics'&&!C.canReceiver(o))return;
 const titles={after:'售后详情',logistics:'物流信息',split:'分账记录',notifications:'订单通知'};
 const context={id,kind,action:({after:'order-after',logistics:'order-logistics',split:'order-split',notifications:'order-notifications'})[kind]};
 const sources=[...document.querySelectorAll('.merchant-orders [data-action="'+context.action+'"][data-id="'+id+'"]')];
 anchor=anchor?.isConnected?anchor:sources[sourceIndex]||sources[0];context.anchor=anchor;context.sourceIndex=Math.max(0,sources.indexOf(anchor));
 if(kind==='after'&&anchor?.closest('.order-actions'))titles.after='售后处理';
 let content='',actions='';
 if(kind==='after'){
  const qty=o.afterQty||0,reason=R.cancellationReason(o,'after');
  content=o.after==='无售后'?'<p class="muted">暂无售后记录</p>':afterItemStrip(o)+'<div class="order-after-meta">'+kv([['售后单号',o.afterId||'AS'+o.id.slice(2)]])+afterTimeDetails(o)+kv([['售后类型',afterTypeLabel(o.afterType)],['售后状态',afterDisplay(o)]])+'</div>'+kv([['售后原因',o.afterReason||'商品损坏 / 协商退款（示例）'],...(reason?[['取消原因',reason]]:[]),...(o.returnAddress?[['退货地址',o.returnAddress]]:[]),...(o.afterException||o.returnLogisticsUnknown||(o.afterEvents||[]).length?[['处理记录',o.afterException||(o.returnLogisticsUnknown?'退回物流待核实':(o.afterEvents||[]).join('；'))]]:[])])+((o.evidence||[]).length?'<button type="button" class="evidence-thumb" data-action="after-evidence" data-id="'+esc(id)+'" aria-label="预览图片凭证"><img src="'+esc(o.evidence[0].src)+'" alt="'+esc(o.evidence[0].name)+'"><span>图片凭证</span></button>':'')+returnLogistics(o);
  actions=aftersaleActions(o);
  content+=collaborationInspectionSummary(o)+aftersaleRecordBody(o)+aftersaleHistory(o,true);
  if(o.after!=='无售后')actions+=btn('登记处理结论','after-note',o.id+'|'+o.afterId);
 }else if(kind==='logistics'){
  content=orderShippingTimeout(o)+(o.fulfillmentIssue?'<div class="hint">'+esc(o.fulfillmentIssue)+'</div>':'')+((o.shipments||[]).length?logisticsTimeline(o.shipments,true):'<p class="muted">'+(o.method==='快递配送'?'尚未登记快递运单':'现场领取，无快递物流')+'</p>');
 }else if(kind==='split'){
  content=splitTable(o);
 }else if(kind==='notifications'){
  orderNotificationTable(o);
  content='<div data-order-notifications>'+o.notificationRecords.map(n=>'<article class="order-notice-card">'+kv([['通知类型',n.type+' · '+n.attempt],['接收群',n.group],['渠道',n.channel],['发送时间',n.date],['发送结果',n.status],...(n.reason?[['失败原因',n.reason]]:[])])+'<details><summary>通知内容</summary><div class="order-notification-message">'+esc(n.message)+'</div></details></article>').join('')+'</div>';
  actions=btn('联系系统管理员','contact-system-admin',id,'btn primary');
 }
 if(kind==='after'&&!C.canMoney(o)){content=taskAfterBody(o);actions='';}
 dialog(titles[kind],content,actions+btn('关闭','close'));
 const panel=$('#overlay .dialog');panel.classList.add('order-action-popover');panel.dataset.orderAction=kind;panel.actionContext=context;panel.sourceAnchor=anchor;anchorOrderDialog(anchor);
}
function showOrderAction(id,kind,anchor){
 if(isMerchant&&!isOrderPage&&anchor?.closest('.merchant-orders'))openOrderAction(id,kind,anchor);
 else openOrder(id,({after:'售后信息',logistics:'发货与物流',split:'分账记录',notifications:'订单通知记录'})[kind]);
}
function refreshOrderAction(id,section,context){closeOverlay();render();if(context)openOrderAction(id,context.kind,context.anchor,context.sourceIndex);else openOrder(id,section);}
function taskAfterBody(o){return kv([['售后单号',o.afterId||'—'],['商品',o.productName||product(o.product)?.name||'—'],['规格 / 数量',(o.sku||'—')+' · '+(o.afterQty||0)+' 件'],['售后状态',afterDisplay(o)],['售后原因',o.afterReason||'—'],['退回地址',o.returnAddress||'—']])+((o.evidence||[]).length?'<button type="button" class="evidence-thumb" data-action="after-evidence" data-id="'+esc(o.id+'|'+o.afterId)+'"><img src="'+esc(o.evidence[0].src)+'" alt="'+esc(o.evidence[0].name)+'"><span>图片凭证</span></button>':'')+returnLogistics(o)+collaborationInspectionSummary(o)+(afterStage(o)==='待收货验收'?btn('收货验收','cp-inspect',o.id,'btn primary'):'');}
function taskOrderBody(o){
 const module=(title,body)=>'<section class="order-detail-section" data-order-section="'+title+'"><h3>'+title+'</h3>'+body+'</section>';
 const info=kv([['商品',o.productName||product(o.product)?.name||'—'],['规格',o.sku||'—'],['数量',o.qty+' 件'],['订单状态',orderStatus(o)]]);
 const shipping=C.canReceiver(o)?module('收货信息',receiverInfo(o))+module('发货与物流',((o.shipments||[]).length?logisticsTimeline(o.shipments,true):'<p>尚未登记快递运单</p>')+(o.delivery==='待发货'?btn('登记发货','ship',o.id,'btn primary'):'')):'';
 const after=C.canAfter(o)?module('售后信息',C.canMoney(o)?aftersaleHistory(o)+aftersaleActions(o):taskAfterBody(o)):'';
 return '<p class="scope-note">按当前人员权限展示任务所需信息。</p><div class="order-detail-grid">'+module('商品与任务',info)+shipping+after+(C.canProduct(product(o.product),'remark')?module('订单备注',orderRemarkSummary(o,true)+btn('添加备注','order-remark',o.id)):'')+(C.canReadSplit(o)?module('分账记录',splitTable(o)):'')+'</div>';
}
function openOrder(id,section){const o=D.orders.find(x=>x.id===id)||D.orders.find(x=>x.parentOrderId===id||x.splitSourceOrderId===id);if(o&&isOrderPage&&id!==o.id){id=o.id;orderParams.set('id',id);const url=new URL(location.href);url.searchParams.set('id',id);history.replaceState(null,'',url);}if(!o||!allowedOrder(o)){if(isOrderPage){document.title='订单不可查看';renderWorkspace('<div class="order-page order-unavailable"><h1>订单不可查看</h1><p>订单不存在或当前账号无权查看。</p>'+btn('关闭此页','close-order-page')+'</div>');document.title='订单不可查看';}return;}S.order=id;if(!$('#overlay [role=dialog]'))priorFocus=document.activeElement;
const siblings=myOrders().filter(x=>orderGroupId(x)===orderGroupId(o));
const childNav=isMerchant&&o.parentOrderId?'<nav class="order-child-navigation" aria-label="子订单">'+siblings.map(x=>'<a class="'+(x.id===o.id?'active':'')+'" href="'+esc(orderPageUrl(x.id))+'">'+esc(x.id)+' · '+esc(orderStatus(x))+'</a>').join('')+'</nav><p class="tiny muted">当前子单：'+childOrderNumber(o)+'</p>':'';
const notifications=isMerchant?'<details class="order-notifications" data-order-notifications'+(section==='订单通知记录'?' open':'')+'><summary>订单通知记录</summary>'+orderNotificationTable(o)+'</details>':'';
const version=orderProductVersion(o),p=version?.snapshot||product(o.product)||{name:o.productName,art:0};
const goods='<div class="detail-goods"><div class="product-art art-'+p.art+'">'+['本','杯','袋'][p.art%3]+'</div><div><strong>'+(isMerchant?currentOrderProductLink(o,o.productName||p.name):esc(o.productName||p.name))+'</strong><div class="tiny muted">商品 ID：'+esc(o.product)+' · '+esc(o.sku||'—')+'</div><div class="tiny muted">'+orderProductSnapshotLink(o)+'</div></div></div>';
const info=(isMerchant&&isOrderPage?(o.refundedQty?kv([['已退款数量',o.refundedQty+' 件']]):''):kv([['订单编号',o.id],['下单时间',o.date],['支付状态',o.payment],[isMerchant?'订单状态':'交付状态',isMerchant?orderStatus(o):o.delivery],...(o.refundedQty?[['已退款数量',o.refundedQty+' 件']]:[])]))+orderDetailTable(['商品快照','商品单价','数量','关联项目','商品实付金额','运费',o.payment==='待付款'?'订单金额':'订单实付合计'],[[goods,money(o.unitPrice??o.paid/o.qty),o.qty+' 件',esc(o.projectName||p.projectName||project(o.project)?.name||'—'),money(o.paid),money(o.shippingFee||0),money(o.orderAmount??round(o.paid+(o.shippingFee||0)))]],'order-goods-table')+(isMerchant?orderRemarkSummary(o,true):'')+notifications;
const receiver=isMerchant?receiverInfo(o):'<span>林** · 138****9901（已脱敏）</span>';
const shipping=orderShippingTimeout(o)+(o.fulfillmentIssue?'<div class="hint">'+esc(o.fulfillmentIssue)+'</div>':'')+kv([['交付方式',o.method],...(isMerchant&&isOrderPage?[[o.method==='快递配送'?'发货数量':'领取数量',deliveryQuantity(o)+' 件'],...(o.received&&(o.delivery==='已关闭'||o.payment!=='支付成功')?[['收货时间',o.received]]:[]),...(o.signedAt?[['物流签收时间',o.signedAt]]:[])]:[['数量',deliveryQuantity(o)+' 件'],['收货时间',o.received||'等待用户确认'],['物流签收时间',o.signedAt||'—']])])+(o.method==='快递配送'?'<div class="shipping-track"><h4>物流轨迹</h4>'+((o.shipments||[]).length?logisticsTimeline(o.shipments,true):'<p class="muted logistics-empty">尚未登记快递运单</p>')+'</div>':'<p class="description">'+(o.delivery==='已领取'?'已现场领取':'等待现场领取')+'</p>')+(isMerchant&&o.delivery==='待发货'?'<div class="divider"></div><div class="inline-actions">'+btn('登记发货','ship',id,'btn primary')+btn('缺货 / 拒单退款','reject-order',id,'btn danger')+'</div>':'');
const after=collaborationInspectionSummary(o)+aftersaleHistory(o);
const module=(title,content)=>'<section class="order-detail-section" data-order-section="'+title+'" aria-label="'+title+'"><h3 class="section-title">'+title+'</h3>'+content+'</section>';
const body=isMerchant&&!C.canFullOrder(o)?taskOrderBody(o):'<div class="order-detail-grid">'+module('订单信息',info)+module('收货信息',receiver)+module('发货与物流',shipping)+module('售后信息',after)+(!isMerchant||C.canReadSplit(o)?module('分账记录',splitTable(o)):'')+'</div>';
if(isOrderPage){
 document.title='订单 '+id+' · '+(isMerchant?'商家':'基金会')+'工作台 · 善集';
 S.page=isMerchant?'orders':'projects';
 renderWorkspace('<div class="order-page"><section class="drawer order-detail order-page-document" aria-label="订单详情"><header class="drawer-head"><div class="flex"><div class="spacer"><p class="eyebrow">'+esc(org().name)+' · 订单详情</p><h1>'+esc(orderGroupId(o))+'</h1></div>'+btn('关闭此页','close-order-page')+'</div></header>'+childNav+(isMerchant&&!C.canFullOrder(o)?'<section class="order-status-summary" aria-label="任务状态"><h2 class="order-status-title">'+esc(orderStatus(o))+'</h2></section>':orderSummary(o))+'<div class="drawer-body">'+body+'</div>'+(isMerchant?'':'<footer class="drawer-foot">'+btn('查看订单对账','order-settlement',id)+'</footer>')+'</section></div>');
 document.title='订单 '+id+' · '+(isMerchant?'商家':'基金会')+'工作台 · 善集';
 document.body.style.overflow='';setupOrderSummarySticky();if(section){const target=section==='订单通知记录'?$('[data-order-notifications]'):$('[data-order-section="'+section+'"]');target?.scrollIntoView({block:'start'});}return;
}
$('#overlay').innerHTML='<div class="overlay-shade drawer-shade"><section class="drawer order-detail '+(S.wide?'wide':'')+'" role="dialog" aria-modal="true" aria-label="订单详情"><div class="drawer-head"><div class="flex"><div class="spacer"><p class="eyebrow">ORDER DETAILS</p><h2>'+esc(id)+'</h2></div>'+btn(icon('expand'),'widen','','icon-btn')+btn(icon('close'),'close','','icon-btn')+'</div><p class="description">'+esc(D.shops.find(s=>s.id===o.shop)?.name)+' · '+esc(o.date)+'</p></div><div class="status-banner">'+badge(o.payment)+badge(isMerchant?orderStatus(o):o.delivery)+'<span class="spacer"></span><span class="mono">'+(!isMerchant||C.canFullOrder(o)?'实付 '+money(o.paid):'')+'</span></div><div class="drawer-body">'+body+'</div><div class="drawer-foot">'+(o.split==='分账异常'?'<span class="tiny muted">分账异常由系统商家管理员处理</span>':'')+'<span class="spacer"></span>'+(isMerchant?'':btn('查看订单对账','order-settlement',id))+'</div></section></div>';document.body.style.overflow='hidden';$('#overlay').querySelector('button')?.focus();merchantSubpage('order-detail');if(section){const target=section==='订单通知记录'?$('#overlay [data-order-notifications]'):$('#overlay [data-order-section="'+section+'"]');target?.scrollIntoView({block:'start'});}}
function syncAftersale(o){
 o.aftersales??=[];
 if(!o.after||o.after==='无售后')return o.aftersales;
 if(!o.afterId)o.afterId='AS'+o.id.slice(2)+'-'+String(o.aftersales.length+1).padStart(2,'0');
 let item=o.aftersales.find(a=>a.id===o.afterId);
 if(!item){item={id:o.afterId};o.aftersales.push(item);}
 const snapshot=Object.fromEntries(Object.entries(o).filter(([key])=>key.startsWith('after')&&key!=='aftersales'||['collaborationInspection','evidence','returnAddress','returnShipments','returnWaybill','returnCarrier','returnCollectedAt','returnLogisticsUnknown','returnSignedAt','returnReceivedAt','refundSubmittedAt'].includes(key)));
 Object.assign(item,JSON.parse(JSON.stringify(snapshot)));
 return o.aftersales;
}
function beginAftersale(o,fields){
 if(!R.timeline(o,demoNow.getTime()).canApply)return R.completedOrder(o)?'已完成的订单不能再申请售后。':'当前订单状态不支持申请售后。';
 syncAftersale(o);
 if(activeAftersale(o.after))return '已有处理中售后，请先处理当前申请。';
 for(const key of Object.keys(o))if(key.startsWith('after')&&key!=='aftersales')delete o[key];
 delete o.collaborationInspection;
 for(const key of ['evidence','returnShipments','returnWaybill','returnCarrier','returnCollectedAt','returnLogisticsUnknown','returnSignedAt','returnReceivedAt','refundSubmittedAt'])delete o[key];
 Object.assign(o,{afterRecords:[],afterSubmittedAt:R.stamp(demoNow.getTime())},fields);syncAftersale(o);return '';
}
function addAftersaleRecord(o,conclusion,evidence=[]){
 o.afterRecords??=[];o.afterRecords.push({time:R.stamp(Date.now()),who:currentAccountName(),conclusion,evidence});syncAftersale(o);
}
function aftersaleRecordBody(a){
 const notes=(a.afterRecords||[]).slice().reverse().map(n=>'<article class="aftersale-record aftersale-note">'+kv([['处理人',n.who],['时间',n.time],['处理结论',n.conclusion]])+(n.evidence||[]).map(f=>'<a href="'+esc(f.data)+'" download="'+esc(f.name)+'"><img class="aftersale-evidence" src="'+esc(f.data)+'" alt="'+esc(f.name)+'"></a>').join('')+'</article>').join('');
 return notes+((a.afterEvents||[]).length?kv([['自动处理记录',a.afterEvents.join('；')]]):'');
}
function aftersaleHistory(o,excludeCurrent=false){
 const items=syncAftersale(o).filter(a=>!excludeCurrent||a.id!==o.afterId).slice().reverse();
 if(!items.length)return excludeCurrent?'':'<div class="empty"><p>该订单暂无售后记录</p></div>';
 const heads=['售后单号','售后类型','申请数量','退款金额 / 元','售后原因','售后状态','申请时间','图片凭证','操作'];
 const rows=items.map(a=>{
  const source=o.id+'|'+a.id,current=a.id===o.afterId;
  const actions=current?aftersaleActions({...a,id:o.id}):'';
  const endReason=R.cancellationReason(a,'after');
  const evidence=a.evidence?.length?'<button type="button" class="evidence-thumb" data-action="after-evidence" data-id="'+esc(source)+'" aria-label="预览图片凭证" title="点击预览图片凭证"><img src="'+esc(a.evidence[0].src)+'" alt="'+esc(a.evidence[0].name)+'"></button>':'—';
  const fields=[
   ...(endReason?[['取消原因',endReason]]:[]),
   ...(a.after==='待处理'&&a.afterSubmittedAt?[['处理截止时间',R.stamp(R.time(a.afterSubmittedAt)+48*R.HOUR)]]:[]),
   ...(a.after==='待买家退货'&&a.afterApprovedAt?[['寄回截止时间',R.stamp(R.time(a.afterApprovedAt)+7*R.DAY)]]:[]),
   ...(a.returnSignedAt?[['退货签收时间',a.returnSignedAt]]:[]),
   ...(Number.isFinite(R.acceptanceTiming(a).deadline)?[['验收截止时间',R.stamp(R.acceptanceTiming(a).deadline)]]:[]),
   ...(a.afterAcceptanceAutoAt?[['自动确认并发起退款时间',a.afterAcceptanceAutoAt]]:[]),
   ...(a.afterException||a.returnLogisticsUnknown?[['异常记录',a.afterException||'退回物流待核实']]:[]),
   ...(a.returnAddress&&/退货/.test(a.afterType)?[['退回地址',a.returnAddress]]:[])
  ];
  const extra=(!current?collaborationInspectionSummary(a,o.id):'')+(fields.length?kv(fields):'')+aftersaleRecordBody(a)+returnLogistics(a);
  const values=[esc(a.id),esc(afterTypeLabel(a.afterType)),(a.afterQty||0)+' 件',money(a.afterRefundAmount??round(o.paid/o.qty*(a.afterQty||0))),esc(a.afterReason||'—'),badge(afterDisplay(a))+(endReason?'<div class="tiny muted" data-cancellation-reason="after">'+esc(endReason)+'</div>':''),esc(a.afterSubmittedAt||'—'),evidence,'<div class="inline-actions">'+actions+(isMerchant?btn('登记处理结论','after-note',source):'—')+'</div>'];
  return '<tr data-aftersale-id="'+esc(a.id)+'">'+values.map((v,i)=>'<td data-label="'+esc(heads[i])+'">'+v+'</td>').join('')+'</tr>'+(extra?'<tr class="after-extra-row"><td colspan="9">'+extra+'</td></tr>':'');
 }).join('');
 return (excludeCurrent?'<h4>历史售后记录 · '+items.length+' 笔</h4>':'')+orderDetailTable(heads,[],'order-after-table').replace('<tbody></tbody>','<tbody>'+rows+'</tbody>');
}
function scopedAftersale(source){
 const [id,afterId]=source.split('|'),o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o)return {};
 syncAftersale(o);return {o,a:o.aftersales.find(a=>a.id===afterId)};
}
function editAftersaleRecord(source){
 const {o,a}=scopedAftersale(source);if(!a)return;
 closeSecondary();const afterId=a.id;
 const extra=select('记录类型','kind',[...(C.canProduct(product(o.product),'afterApprove')?['审批结果']:[]),...(C.canProduct(product(o.product),'inspect')?['收货验收结论']:[]),'客服协商结论'],'客服协商结论')+'<label class="full">图片凭证<input name="merchantEvidence" type="file" accept="image/png,image/jpeg"></label>';
 let upload;
 form('登记售后处理结论',kv([['售后单号',a.id]])+extra+field('处理结论','conclusion','','textarea',true,true),data=>{
  if(!['客服协商结论',...(C.canProduct(product(o.product),'afterApprove')?['审批结果']:[]),...(C.canProduct(product(o.product),'inspect')?['收货验收结论']:[])].includes(data.kind))return '没有该记录类型的操作权限。';
  if(!data.conclusion.trim())return '请填写处理结论。';
  syncAftersale(o);const target=o.aftersales.find(x=>x.id===afterId);if(!target)return '售后记录已更新，请重新打开。';
  if(upload.reading())return '图片正在读取，请稍后保存。';if(upload.error())return upload.error();
  target.afterRecords??=[];target.afterRecords.push({conclusion:data.kind+'：'+data.conclusion.trim(),evidence:Object.values(upload.files),who:currentAccountName(),time:R.stamp(Date.now())});
  if(o.afterId===afterId)o.afterRecords=target.afterRecords;
  record(o.id,'登记售后结论 · '+afterId,o.project);closeOverlay();render();if(!isOrderPage)openOrder(o.id,'售后信息');toast('售后记录已保存');
 },'保存');
 upload=bindShopUploads(['merchantEvidence'],{},10,['png','jpg','jpeg']);
}
function rejectUnshippedOrder(id){
 const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o||o.delivery!=='待发货'||o.method!=='快递配送')return;
 if(activeAftersale(o.after)){toast('已有处理中售后，请先处理当前申请。');return;}
 const indexes=shippingUnitIndexes(o),amount=indexes.reduce((sum,i)=>sum+R.unitPaidCents(o,i),0)/100;
 if(!indexes.length){toast('当前没有可停止发货的数量。');return;}
 reasonDialog('缺货 / 拒单退款','本次停止剩余 '+indexes.length+' 件发货，将按整件实付金额 '+money(amount)+' 申请原路退款。',reason=>{
  if(!allowedOrder(o)||!canUse('orders')||!C.canAction('refund',id))return '订单或退款权限已更新，请关闭弹窗。';
  if(o.delivery!=='待发货'||activeAftersale(o.after))return '订单或售后状态已变化，请关闭弹窗后重新查看。';
  const latest=shippingUnitIndexes(o),latestAmount=latest.reduce((sum,i)=>sum+R.unitPaidCents(o,i),0)/100;if(latest.join(',')!==indexes.join(',')||latestAmount!==amount)return '可退款数量或金额已变化，请关闭弹窗后重新确认。';
  if(latest.some(i=>R.settledIndexes(o).includes(i))||['分账处理中','结果待确认'].includes(o.split))return '对应数量的分账状态不允许退款，请核实后处理。';
  if(R.cents(amount)>R.cents(o.paid)-R.cents(o.refund||0))return '退款金额超过订单剩余可退金额，请重新核对。';
  const error=beginAftersale(o,{after:'退款处理中',afterType:'缺货拒单',afterQty:indexes.length,afterUnitIndexes:indexes,afterRefundAmount:amount,afterReason:reason,afterDelivery:o.delivery});if(error)return error;
  o.delivery='已关闭';o.split='售后暂停';addAftersaleRecord(o,'缺货拒单：'+reason+'；已申请退款 '+money(amount));record(id,'缺货拒单：'+reason+'；退款处理中',o.project);
 },'<div class="modal-order-id full">订单 '+esc(o.id)+' · '+esc(o.productName||product(o.product)?.name)+'</div>','确认并申请退款');
}
function shipOrder(id,anchor){
 const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o||o.delivery!=='待发货')return;
 if(!shippingUnitIndexes(o).length){toast('退款中的商品不能发货，当前没有可发货商品。');return;}
 if(!C.canAction('ship',id))return;
 const shippingOrders=()=>D.orders.filter(x=>orderGroupId(x)===orderGroupId(o)&&x.org===o.org&&x.shop===o.shop&&x.delivery==='待发货'&&shippingUnitIndexes(x).length);
 const shippingSnapshot=()=>shippingOrders().map(x=>({order:x,indexes:shippingUnitIndexes(x)}));
 const fromList=Boolean(anchor?.closest('.merchant-orders'));
 const address=o.returnAddress||product(o.product)?.returnAddress||'';
 let batch=shippingSnapshot(),unitIndexes=batch.flatMap(x=>x.indexes);
 if(batch.some(x=>!allowedOrder(x.order)||!C.canAction('ship',x.order.id))){toast('请核对全部待发货子单的发货权限。');return;}
 const body='<div class="shipping-quantity" role="status" aria-live="polite"><span class="shipping-product">商品名称 <span data-shipping-product>'+esc(o.productName||product(o.product)?.name||'—')+'</span></span><span class="shipping-spec">规格 <span data-shipping-sku>'+esc(o.sku||'—')+'</span></span><span class="shipping-count">数量 <span data-shipping-qty>'+unitIndexes.length+'</span> 件</span></div>'+field('快递单号','waybill')+select('快递公司','carrier',[['','请选择快递公司'],'顺丰速运','中通快递','圆通速递'],'')+select('退货地址','returnAddress',address?[[address,address]]:[['','请先配置退货地址']],'');
 form('自己联系物流发货',body,data=>{
  if(!allowedOrder(o)||!canUse('orders')||!C.canProduct(product(o.product),'ship'))return '订单或发货权限已更新，请关闭弹窗。';
  if(o.delivery!=='待发货')return '订单状态已更新，请关闭弹窗后重新查看。';
  const latest=shippingSnapshot(),signature=rows=>JSON.stringify(rows.map(x=>[x.order.id,x.indexes])),changed=signature(latest)!==signature(batch);
  if(latest.some(x=>!allowedOrder(x.order)||!C.canAction('ship',x.order.id)))return '订单访问权限已更新，请关闭弹窗。';
  batch=latest;unitIndexes=batch.flatMap(x=>x.indexes);$('#overlay [data-shipping-qty]').textContent=String(unitIndexes.length);
  if(!unitIndexes.length)return '当前可发货数量为 0 件，请待售后处理后重新查看。';
  if(changed)return '可发货数量已更新，请核对数量后再次确认发货。';
  const waybill=data.waybill.trim();
  if(!/^[A-Za-z0-9-]{6,30}$/.test(waybill))return '请填写一个有效快递单号，6 至 30 位字母、数字或连字符。';if(!data.carrier)return '请选择快递公司。';if(!data.returnAddress)return '请先在商品资料中配置退货地址。';
  for(const item of batch){const target=item.order;if(activeAftersale(target.after))target.afterDelivery=target.delivery;target.delivery='已发货';target.shippedAt='';target.waybills=data.carrier+' '+waybill;target.shipments=[{carrier:data.carrier,waybill,qty:item.indexes.length,unitIndexes:[...item.indexes],events:[]}];target.returnAddress=data.returnAddress;record(target.id,'登记发货 '+item.indexes.length+' 件',target.project);}closeOverlay();render();if(!fromList)openOrder(id,'发货与物流');toast('发货记录已保存');
 },'确认发货');
 const panel=$('#overlay .dialog');panel.classList.add('shipping-dialog');const waybill=panel.querySelector('[name=waybill]');waybill.placeholder='请输入快递单号';waybill.maxLength=30;waybill.autocomplete='off';for(const name of ['carrier','returnAddress']){const input=panel.querySelector('[name='+name+']');input.setAttribute('aria-required','true');const label=input.closest('label'),text=label.firstChild;const span=document.createElement('span');span.textContent=text.textContent+' ';span.insertAdjacentHTML('beforeend','<span class="required-tip">*</span>');text.replaceWith(span);}
 if(anchor?.closest('.order-actions'))anchorOrderDialog(anchor);
}
function updateRefundInspectionGuard(o){
 const form=$('#edit-form');if(!form?.querySelector('[data-refund-reminder]'))return;
 const error=o.afterType==='退货退款'?R.inspectionProofError(currentInspection(o)):'';
 const submit=form.querySelector('button[type=submit]');if(submit){submit.disabled=!!error;submit.title=error;}
}
function refund(id){
 const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o||!C.canAction('refund',id))return;
 if(afterStage(o)!=='待确认退款'&&!(afterStage(o)==='待商家处理'&&o.afterType==='退款（无需退货）'))return;
 syncAftersale(o);const afterId=o.afterId,expectedState=o.after,initial=R.refundRequest(o);if(initial.error){toast(initial.error);return;}
 const fromList=Boolean(document.activeElement?.closest('.merchant-orders .order-actions'));
 let request=initial,upload;
 const acceptance=o.afterType==='退货退款';
 if(acceptance&&!currentInspection(o)){toast('请先由有验收权限的人员完成退货收货与验收');return;}
 form('确认退款',(acceptance?'<div class="full">'+collaborationInspectionSummary(o)+'</div>':'')+'<div class="full" data-refund-reminder>'+afterItemStrip(o)+'</div>'+field('审批结果','conclusion','','textarea',false,true)+'<label class="full">图片凭证<input name="merchantEvidence" type="file" accept="image/png,image/jpeg"></label>',data=>{
  if(!allowedOrder(o)||!canUse('orders')||!C.canAction('refund',id))return '订单或退款权限已更新，请关闭弹窗。';
  if(acceptance&&(afterStage(o)!=='待确认退款'||!currentInspection(o)))return '请先完成当前售后单的收货验收。';
  if(acceptance&&R.inspectionProofError(currentInspection(o)))return R.inspectionProofError(currentInspection(o));
  if(o.afterId!==afterId||o.after!==expectedState)return '售后状态已变化，请关闭弹窗后重新查看。';
  const latest=R.refundRequest(o);if(latest.error)return latest.error;
  if(latest.amount!==request.amount||latest.indexes.join(',')!==request.indexes.join(',')){request=latest;$('#overlay [data-refund-reminder]').innerHTML=afterItemStrip(o);return '退款数量或金额已变化，请核对后再次确认。';}
  if(upload.reading())return '图片正在读取，请稍后保存。';if(upload.error())return upload.error();
  o.after='退款处理中';o.refundSubmittedAt=R.stamp(demoNow.getTime());if(!acceptance)o.afterApprovedAt=o.refundSubmittedAt;o.afterUnitIndexes=[...request.indexes];o.afterRefundAmount=request.amount;o.split='售后暂停';
  addAftersaleRecord(o,'审批结果：'+(data.conclusion.trim()||'同意退款'),Object.values(upload.files));
  record(o.id,'确认退款 '+money(request.amount)+'，等待渠道核验',o.project);C.persist();if(fromList||orderActionContext()){closeOverlay();render();}else refreshOrderAction(id,'售后信息');toast('退款申请已记录，当前为处理中');
 },'确认并发起退款');$('#overlay .dialog').classList.add('merchant-confirm');upload=bindShopUploads(['merchantEvidence'],{},10,['png','jpg','jpeg']);updateRefundInspectionGuard(o);
}
const applicationFieldNames={logo:'店铺标识',shopLogo:'店铺标识文件',categoryProof:'经营资质证明',inheritOrganizationLicense:'继承组织营业执照',qualificationSource:'资质来源',qualificationCategory:'适用品类',qualificationValidUntil:'资质有效期',qualificationLongTerm:'资质长期有效',name:'名称',intro:'简介',body:'介绍',location:'执行地',end:'结束时间',start:'开始时间',deadline:'报名截止时间',experience:'报名资料：公益经历',skills:'报名资料：专项技能',skillsInput:'专项技能填写方式',skillsOptions:'专项技能选项',promise:'公益承诺',promisor:'贡献承诺主体',target:'筹款目标',contact:'联系人',contactPhone:'联系电话',service:'客服配置',customerServiceId:'接待客服',donationAgreement:'每单捐协议正文',donationAgreementFile:'捐赠协议原始文件',entrantName:'入驻人姓名',entrantIdentity:'入驻人身份证号',identityFront:'身份证人像面',identityBack:'身份证国徽面',identityValidUntil:'身份证有效期',identityLongTerm:'身份证长期有效',licenseFile:'营业执照',licenseName:'营业执照文件名',licenseValidUntil:'营业执照有效期',licenseLongTerm:'营业执照长期有效',code:'统一社会信用代码',registeredAddress:'注册地址',businessRoles:'业务身份',contactName:'联系人',price:'售价',stock:'库存',fund:'公益金额',association:'商协会分账金额',university:'高校分账金额',merchantCode:'规格编码',parameters:'商品参数',carouselMedia:'项目轮播素材',videos:'视频',carouselImages:'商品轮播图',detailImages:'商品详情图',specs:'商品规格',skus:'规格',splitRecipients:'分账对象',amount:'每件金额',project:'关联项目',returnAddress:'退货地址',donationMode:'公益分配模式',donationRatio:'目标捐赠比例（%）',planStock:'计划库存',randomMin:'随机公益金额下限',randomMax:'随机公益金额上限',category:'经营类目',admin:'联系人',address:'办公地址',bank:'微信支付商户号',bankAccountName:'分账接收方全称',mission:'机构宗旨',format:'参会形式',capacity:'名额',limit:'报名上限',options:'捐赠金额',donationOptions:'捐赠金额',drawMin:'心意签金额下限',drawMax:'心意签金额上限',minimum:'最低捐赠金额',minimumMode:'最低金额方式',amountModes:'金额方式',amountMode:'金额方式',allowCustom:'自定义金额',cohost:'协办方',organizer:'承办方',images:'图片',minimumDonation:'最低捐赠金额',shippingFee:'运费',shippingTemplateId:'运费模板',shippingTemplate:'运费模板',shippingHours:'承诺发货时间（小时）',sevenDayReturn:'7天无理由退货',rules:'地区计费规则',regions:'配送地区',firstCount:'首件数量',firstFee:'首件运费',extraCount:'续件数量',extraFee:'续件运费',pickupAfter:'现场领取后支持售后',returnAuto:'退货免审批',image:'规格图片',values:'规格值',value:'参数值',phone:'手机号',donate:'接受捐赠',publication:'发布设置',limit:'报名上限'};
function applicationDiffRows(before,after,prefix=''){
 const ignored=new Set(['qualificationName','agreement','sms','orgSection','orgSections','configSection','specKey','imageOverride','withImages','id','org','shop','art','review','status','version','key','imageOverride','custom']);
 const value=v=>v==null||v===''?'—':typeof v==='boolean'?(v?'是':'否'):esc(v);
 const rows=[];
 for(const [key,next] of Object.entries(after||{})){
  if(ignored.has(key))continue;
  let prev=before?.[key];if(prev==null&&key==='donationMode')prev='fixed';if(prev==null&&['pickupAfter','returnAuto'].includes(key))prev=false;if(prev==null&&key==='splitRecipients')prev=[{id:'A001',amount:before?.association||0},{id:'U001',amount:before?.university||0}];if(JSON.stringify(prev)===JSON.stringify(next)||((prev==null||prev==='')&&(next==null||next==='')))continue;
  const label=prefix+(applicationFieldNames[key]||key);
  if(key==='operatingQualifications'){const app=D.applications.find(a=>a.org===S.org&&a.type==='店铺经营资质变更'&&a.snapshot?.operatingQualifications===next);rows.push(...shopQualificationDiff(prev,next,app));continue;}
  if(['donationAgreementFile','identityFront','identityBack','licenseFile','shopLogo','categoryProof','foundationCertificate','publicQualificationProof'].includes(key)){const app=D.applications.find(a=>a.org===S.org&&a.snapshot?.[key]===next);const fileValue=(file,source)=>file?esc(file.name)+' · '+Math.ceil(file.size/1024)+' KB'+(source?' '+btn('查看文件','shop-file',source+':'+key,'link'):''):'—';rows.push(tr([esc(label),fileValue(prev),fileValue(next,app?.id)]));continue;}
  if(key==='logo'){const image=v=>v?'<img class="application-change-image" src="'+esc(v)+'" alt="店铺标识">':'—';rows.push(tr([esc(label),image(prev),image(next)]));continue;}
  if(key==='image'){const image=v=>v?.src?'<img class="application-change-image" src="'+esc(v.src)+'" alt="'+esc(v.name||'图片')+'">':'—';rows.push(tr([esc(label),image(prev),image(next)]));continue;}
  if(Array.isArray(next)){
   if(key==='splitRecipients'){
    const old=Array.isArray(prev)?prev:[],catalog=productSplitCatalog();
    const describe=r=>r?esc(splitOrganizationLabel(catalog.find(o=>o.id===r.id))||r.id)+' · '+money(r.amount):'—';
    for(let i=0;i<Math.max(old.length,next.length);i++)if(JSON.stringify(old[i])!==JSON.stringify(next[i]))rows.push(tr([esc(label+' · '+(i+1)),describe(old[i]),describe(next[i])]));
    continue;
   }
   if(['carouselImages','detailImages','images','videos','carouselMedia'].includes(key)){
    const media=items=>(items||[]).map(x=>(x.type?.startsWith('video/')?'<video class="application-change-image" controls src="'+esc(x.src)+'"></video>':'<img class="application-change-image" src="'+esc(x.src)+'" alt="'+esc(x.name||'图片')+'">')).join('')||'—';
    rows.push(tr([esc(label),media(prev),media(next)]));continue;
   }
   const old=Array.isArray(prev)?prev:[];
   for(let i=0;i<Math.max(old.length,next.length);i++){
    const item=next[i],prior=old[i],itemLabel=label+' · '+(item?.name||prior?.name||String(i+1));
    if(JSON.stringify(prior)===JSON.stringify(item))continue;
    if(item&&typeof item==='object'){
     const matched=key==='skus'?old.find(x=>x.name===item.name)||prior:prior;
     rows.push(...applicationDiffRows(matched||{},item,itemLabel+' / '));
    }else if(!item&&prior&&typeof prior==='object')rows.push(...applicationDiffRows({},prior,itemLabel+' / ').map(row=>row.replace(/<td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/, '<td>$1</td><td>$3</td><td>—</td>')));
    else rows.push(tr([esc(itemLabel),value(prior),value(item)]));
   }
  }else if(next&&typeof next==='object')rows.push(...applicationDiffRows(prev||{},next,label+' / '));
  else if(key==='customerServiceId')rows.push(tr([esc(label),esc(prev?CS.account(prev)?.name||prev:'使用店铺客服'),esc(next?CS.account(next)?.name||next:'使用店铺客服')]));
  else if(key==='project')rows.push(tr([esc(label),value(project(prev)?.name||prev),value(project(next)?.name||next)]));
  else rows.push(tr([esc(label),['price','fund','association','university','amount'].includes(key)&&prev!=null?money(prev):value(prev),['price','fund','association','university','amount'].includes(key)?money(next):value(next)]));
 }
 return rows;
}
function applicationTimeline(a){
 const stages=(a.approvalStages||(a.stage||'').split(' → ')).filter(x=>!['未提交','已完成'].includes(x));
 const nodes=a.approvalNodes||stages.map((name,i)=>({name,status:a.status==='待审批'?(i===0?'审批中':'待审批'):a.status==='已通过'?'已通过':a.status==='已驳回'?(i===0?'已驳回':'未开始'):'未开始'}));
 return '<div class="timeline application-timeline"><div class="timeline-item"><strong>'+(a.status==='草稿'&&!a.submittedAt?'保存草稿':'提交申请')+'</strong><small>'+esc(a.submittedAt||a.date)+' · '+esc(a.who)+'</small></div>'+nodes.map(node=>'<div class="timeline-item"><strong>'+esc(node.name)+'</strong> '+badge(node.status)+'<small>'+esc([node.time,node.operator].filter(Boolean).join(' · ')||'—')+'</small>'+(node.opinion?'<p>'+esc(node.opinion)+'</p>':node.status==='已驳回'&&a.reason?'<p>'+esc(a.reason)+'</p>':'')+'</div>').join('')+(a.withdrawnAt||a.status==='已撤回'?'<div class="timeline-item"><strong>撤回申请</strong><small>'+esc(a.withdrawnAt||'—')+' · '+esc(a.who)+'</small></div>':'')+'</div>';
}
function shopOpeningMedia(a,key){
 const s=a.snapshot||{};
 if(key==='logo')return s.shopLogo||s.logo;
 if(key==='categoryProof')return s.categoryProof;
 const match=/^qualification-(\d+)$/.exec(key);
 return match?s.operatingQualifications?.[Number(match[1])]?.file:null;
}
function shopOpeningMediaValue(a,key,label){
 const file=shopOpeningMedia(a,key),src=typeof file==='string'?file:file?.data||file?.src;
 if(!src)return '未上传';
 const image=typeof file==='string'||file.type?.startsWith('image/')||/\.(png|jpe?g|svg|webp)(?:[?#]|$)/i.test(src);
 return btn((image?'<img src="'+esc(src)+'" alt="'+esc(label)+'">':'')+'<span>'+esc(file.name||label)+'</span><span class="tiny">'+(image?'查看大图':'预览文件')+'</span>','application-media',a.id+':'+key,'link application-media-preview');
}
function shopOpeningDetails(a){
 const s=a.snapshot||{},items=[['店铺名称',s.name||a.title],['经营类目',s.category],['店铺简介',s.intro],['店铺标识',shopOpeningMediaValue(a,'logo','店铺标识'),true],['默认客服账号',s.customerServiceId||s.service]];
 const qualifications=s.operatingQualifications||[];
 if(qualifications.length)qualifications.forEach((q,index)=>{const label=qualifications.length>1?'经营资质 '+(index+1)+' · ':'';
  items.push([label+'资质来源',q.source==='organization'?'继承组织营业执照':'自行上传'],[label+'适用品类',q.category]);
  if(q.source==='organization')items.push([label+'组织版本',q.organizationVersion?'v'+q.organizationVersion:'—']);
  items.push([label+'证明材料',shopOpeningMediaValue(a,'qualification-'+index,q.name||'经营资质证明'),true],[label+'有效期',q.longTerm?'长期':q.validUntil]);
 });
 else{
  const inherited=s.qualificationSource==='organization';
  items.push(['资质来源',inherited?'继承组织营业执照':s.qualificationSource==='upload'?'自行上传':'—'],['适用品类',s.qualificationCategory]);
  if(!inherited)items.push(['经营资质证明',shopOpeningMediaValue(a,'categoryProof','经营资质证明'),true],['资质有效期',s.qualificationLongTerm?'长期':s.qualificationValidUntil]);
 }
 return kv(items);
}
function applicationMedia(source){
 const split=source.lastIndexOf(':'),a=D.applications.find(a=>a.id===source.slice(0,split)&&a.org===S.org&&a.type==='店铺开通');
 if(!a||isMerchant&&!C.canAction('application',a.id))return;
 const file=shopOpeningMedia(a,source.slice(split+1)),src=typeof file==='string'?file:file?.data||file?.src;
 if(!src)return;
 if(typeof file!=='string'&&file.type==='application/pdf'&&file.data){previewShopFile(file);return;}
 subdialog(file.name||'图片预览','<img class="shop-file-image" src="'+esc(src)+'" alt="'+esc(file.name||'店铺申请图片')+'">','关闭');
}
function applicationDialog(id){
 const a=D.applications.find(x=>x.id===id&&x.org===S.org);if(!a||isMerchant&&!C.canAction('application',id))return;
 const current=product(a.object)||project(a.object)||activity(a.object)||D.shops.find(x=>x.id===a.object)||D.organizations.find(x=>x.id===a.object),rows=a.type==='店铺开通'?[]:applicationDiffRows(a.baseline||current||{},a.snapshot||{});
 dialog('申请详情 · '+a.id,'<div class="flex wrap"><h2>'+esc(a.title)+'</h2>'+badge(a.status)+'</div><div class="divider"></div>'+kv([['申请类型',a.type],['本次提交版本','v'+a.version],['当前生效版本',current?'v'+(current.version||1):'—'],['申请人',a.who]])+'<div class="divider"></div><h3 class="section-title">审批时间轴</h3>'+applicationTimeline(a)+'<div class="divider"></div><h3 class="section-title">'+(a.type==='店铺开通'?'开店资料':'修改内容')+'</h3>'+(a.type==='店铺开通'?shopOpeningDetails(a):rows.length?table(['修改项','修改前','修改后'],rows):'<p class="muted">暂无修改内容</p>'),(a.object.startsWith('J')?btn('预览提交内容','preview-application',a.id):'')+(a.status==='待审批'?btn('撤回修改','withdraw',a.id):['已撤回','已驳回','草稿'].includes(a.status)?btn('修改并重提','resubmit',a.id,'btn primary'):btn('关闭','close')),true);
 if(a.type==='店铺开通'||a.type==='成员加入'||a.type==='组织成员申请')$('#overlay .dialog').classList.add('application-detail-single');
 $('#overlay .dialog').dataset.routeApplication=a.id;syncWorkspaceRoute();
}
function editMemberRemark(id){
 if(!canManageMembers())return;
 const member=D.members.find(m=>m.id===id&&m.org===S.org);if(!member)return;
 const context={org:S.org,actor:currentMember()?.id};
 form((member.remark?'修改备注':'添加备注')+' · '+member.name,field('成员备注','remark',member.remark||'','textarea',false,true),data=>{
  if(S.org!==context.org||currentMember()?.id!==context.actor||!canManageMembers())return '当前组织或管理员权限已变化，请重新操作。';
  const target=D.members.find(m=>m.id===id&&m.org===context.org);if(!target)return '成员信息已变更，请刷新后重试。';
  const remark=data.remark.trim();if(remark===(target.remark||'')){closeOverlay();return;}
  target.remark=remark;record(target.id,remark?'更新成员备注':'清空成员备注');C.persist();closeOverlay();render();toast('成员备注已保存');
 },'保存');
}
function removeMember(id){
 if(!canManageMembers())return;const member=D.members.find(m=>m.id===id&&m.org===S.org&&m.role==='组织成员');if(!member)return;
 form('删除成员','<p class="full">确认将 '+esc(member.name)+'（'+esc(member.phone)+'）移出本组织？删除后该成员将无法访问本组织工作台。</p>',()=>{if(!canManageMembers())return '当前账号无成员管理权限。';const index=D.members.findIndex(m=>m.id===id&&m.org===S.org&&m.role==='组织成员');if(index<0)return '成员信息已变更，请刷新后重试。';record(member.name,'删除组织成员');D.members.splice(index,1);closeOverlay();render();toast('成员已删除');},'确认删除');
}
function transferAdministrator(){toast('组织管理员由对应系统管理员指定或更换。');}
function joinDialog(id){const j=D.joins.find(x=>x.id===id&&x.org===S.org);if(!j||S.member)return;dialog('成员加入申请',kv([['申请人',j.name],['手机号',j.phone],['申请组织',org().name],['申请时间',j.date],['当前状态',j.status],['审批环节','组织管理员审批'],['申请备注',j.remark||'—']])+(j.reason?'<div class="notice">'+esc(j.reason)+'</div>':''),j.status==='待审批'?btn('驳回','join-reject',id,'btn danger')+btn('审批通过','join-approve',id,'btn primary'):btn('关闭','close'));$('#overlay .dialog').classList.add('application-detail-single');}
function registrationDialog(id){const r=D.registrations.find(x=>x.id===id),a=activity(r?.activity);if(!r||!scopedProject(a?.project))return;dialog('报名资料 · '+r.id,kv([['报名人',r.name],...(r.company?[['所属企业',r.company],['职务',r.position||'—']]:[]),['联系方式',r.phone],['报名版本',r.version],['报名状态',r.status],['公益经历 / 企业资料','已提交基本资料（示例）']]),r.status==='待审核'&&activityOngoing(a)?btn('未通过','registration-reject',id,'btn danger')+btn('录取','registration-approve',id,'btn primary'):btn('关闭','close'));}
function productPhone(){const url=new URL('../../../play.html?workbenchPreview=1#screen-sale-1',location.href);return '<div class="pe-client-frame"><iframe data-product-client-preview title="客户端商品详情预览" src="'+esc(url.href)+'"></iframe></div>';}
function mountProductPreview(root,p){const frame=root.querySelector('iframe[data-product-client-preview]');if(frame)bindProductPreview(frame,p);}

function clientProjectSections(p){const list=kind=>{const rows=D.activities.filter(a=>a.project===p.id&&a.kind===kind&&['已发布','已停止报名','已结束'].includes(a.status));const item=a=>{const news=a.status==='已结束'?D.activities.find(n=>n.related===a.id&&n.template==='宣发类'&&n.status==='已发布'):null;return '<article class="preview-event"><strong>'+esc(news?.name||a.name)+'</strong><p>'+esc(news?.intro||a.intro)+'</p><small>'+esc(news?'活动资讯':a.status)+'</small></article>';};return '<section><h3>'+kind+'</h3>'+rows.slice(0,8).map(item).join('')+(rows.length>8?'<details><summary>查看更多（'+(rows.length-8)+'）</summary>'+rows.slice(8).map(item).join('')+'</details>':'')+'</section>';};return '<div class="client-project-sections">'+list('项目活动')+list('公益行动')+'<h3>公益商品</h3><div class="preview-goods-grid">'+projectProducts(p.id).filter(g=>g.status==='在售').map(g=>'<article><div class="product-art art-'+g.art+'">善</div><strong>'+esc(g.name)+'</strong><p>'+productPrice(g)+'</p></article>').join('')+'</div></div>';}
function preview(kind,id,source){const p=source||(kind==='project'?scopedProject(id):kind==='activity'?activity(id):scopedProduct(id));if(!p)return;if(kind==='product'){if($('#overlay .merchant-page-panel'))subdialog('客户端效果预览',productPhone(p),'返回商品详情');else dialog('客户端效果预览',productPhone(p),btn('关闭预览','close'));mountProductPreview($('#secondary')||$('#overlay'),p);return;}dialog('客户端效果预览','<div class="preview-phone"><div class="project-art"><strong>'+esc(p.name)+'</strong></div><div class="phone-body"><p class="eyebrow">SHANJI · 与善同行</p><h2>'+esc(p.name)+'</h2><p>'+esc(p.body||p.intro||p.promise)+'</p>'+(p.images||[]).map(x=>'<img style="max-width:100%" src="'+esc(x.src)+'" alt="'+esc(x.name)+'">').join('')+'<div class="divider"></div>'+kv([['所属机构',org().name],['执行地 / 地点',p.location],['结束时间',p.end?.replace('T',' ')],...(p.drawMin?[['心意签范围',money(p.drawMin)+' ～ '+money(p.drawMax)],['最低捐赠金额',p.minimumMode==='limited'?money(p.minimum):'不限制']]:[])])+(kind==='project'?clientProjectSections(p):'<p>'+esc(p.status==='已结束'?'已结束':p.status||'编辑预览')+'</p>')+'</div></div>',btn('关闭预览','close'));}
function paymentAccountText(value,withLabel=true){const account=String(value||'');return /^[0-9]{8,10}$/.test(account)?(withLabel?'微信商户号 ':'')+account:account||'待完善';}
function editableApplication(type,object,application=null,section=''){
 const saved=application||D.applications.find(a=>a.org===S.org&&a.object===object&&a.type===type&&(!section||(a.snapshot?.orgSection||(a.snapshot?.bank!=null?'收款资料':'基本资料'))===section)&&['草稿','已撤回','已驳回'].includes(a.status));
 return saved&&saved.org===S.org&&saved.object===object&&saved.type===type&&['草稿','已撤回','已驳回'].includes(saved.status)?saved:null;
}
function replaceSavedApplication(saved){if(saved)saved.status='已替代';}
if(!isMerchant)Object.assign(applicationFieldNames,window.FoundationProfile.labels);
const organizationSectionFields={
 '基本资料':['contactName','contact','address','mission'],
 '资质材料':['name','entrantName','entrantIdentity','code','registeredAddress','businessRoles','identityLongTerm','identityValidUntil','licenseLongTerm','licenseValidUntil','identityFront','identityBack','licenseFile','licenseName'],
 '收款资料':['bank','bankAccountName']
};
if(!isMerchant){
 organizationSectionFields['基本资料'].unshift('name');
 organizationSectionFields['基本资料'].push('foundationFields');
 organizationSectionFields['资质材料']=organizationSectionFields['资质材料'].filter(key=>key!=='name');
 organizationSectionFields['资质材料'].push(...window.FoundationProfile.groups.registration,...window.FoundationProfile.groups.evaluation,...window.FoundationProfile.groups.qualification);
}
function organizationChanges(application=null){
 const applications=D.applications.filter(a=>a.org===S.org&&a.object===org().id&&['组织资料变更','组织主体资料变更'].includes(a.type)&&a.who===currentAccountName()&&['草稿','已撤回','已驳回'].includes(a.status));
 const drafts=applications.filter(a=>a.status==='草稿'),sources=[...(drafts.length?drafts:[applications[0]].filter(Boolean))];
 if(application&&applications.includes(application)&&!sources.includes(application))sources.push(application);
 const snapshot={},sections=new Set();
 for(const a of sources.slice().reverse()){
  for(const name of a.snapshot.orgSections||[a.snapshot.orgSection||(a.type==='组织主体资料变更'?'资质材料':a.snapshot.bank!=null?'收款资料':'基本资料')])if(organizationSectionFields[name])sections.add(name);
  for(const key of new Set(Object.values(organizationSectionFields).flat()))if(Object.hasOwn(a.snapshot,key))snapshot[key]=a.snapshot[key];
 }
 if(!isMerchant&&Object.keys(snapshot).length){
  sections.clear();
  for(const [section,keys] of Object.entries(organizationSectionFields))if(keys.some(key=>key!=='bankAccountName'&&Object.hasOwn(snapshot,key)))sections.add(section);
 }
 return {applications:sources,snapshot,sections:[...sections]};
}
function organizationEditorContext(application=null){
 if(!canManageMembers())return null;
 const original=org();if(!ensureEditable(original))return null;
 const changes=organizationChanges(application);
 return {original,actor:currentMember().id,changes,base:{...original,...changes.snapshot}};
}
function organizationChangeIssue(changes){
 const o={...org(),...changes.snapshot};
 if(changes.sections.includes('基本资料')){
  if(!isMerchant&&!o.name?.trim())return '请填写基本资料中的组织名称。';
  if(!isMerchant&&JSON.stringify(o.foundationFields||[])!==JSON.stringify(org().foundationFields||[])){const issue=window.FoundationProfile.fieldsError(o);if(issue)return issue;}
  if(!o.contactName?.trim()||!o.address?.trim())return '请补全基本资料中的联系人及办公地址。';
  if(!/^1[0-9]{10}$/.test(o.contact||''))return '请在基本资料填写有效的 11 位联系手机号。';
 }
 if(!isMerchant){
  const profile=window.FoundationProfile,previous=profile.normalize(org());
  for(const [group,keys] of Object.entries(profile.groups))if(keys.some(key=>JSON.stringify(Object.hasOwn(o,key)?o[key]:previous[key])!==JSON.stringify(previous[key]))){
   const issue=profile[group+'Error'](o);if(issue)return issue;
  }
 }
 if(changes.sections.includes('资质材料')){
  if(isMerchant&&!o.name?.trim())return '请补全资质材料中的组织名称和信用代码。';
  if(!o.code?.trim())return '请填写资质材料中的统一社会信用代码。';
  if(isMerchant){
   if(!o.entrantName?.trim()||!o.entrantIdentity?.trim()||!o.registeredAddress?.trim()||!o.identityLongTerm&&!o.identityValidUntil||!o.licenseLongTerm&&!o.licenseValidUntil)return '请补全资质材料中的入驻人、注册地址及证件有效期。';
   if(!o.businessRoles?.length)return '请在资质材料中至少选择一项业务身份。';
   const missing=['identityFront','identityBack','licenseFile'].filter(key=>!o[key]?.data);
   if(missing.length)return '请上传'+missing.map(key=>shopMaterialLabels[key]).join('、')+'。';
  }
 }
 if(changes.sections.includes('收款资料')&&!/^[0-9]{8,10}$/.test(o.bank||''))return '请在收款资料填写完整的 8～10 位数字微信支付商户号。';
 return '';
}
function organizationSubmit(application=null){orgEditor(S.tab,application);}
function orgEditor(tab=S.tab,application=null,sectionOnly=false){
 const context=organizationEditorContext(application);if(!context)return;
 const effective=JSON.parse(JSON.stringify(context.original)),phone=currentMember().phone,signature=JSON.stringify(context.changes);
 const normalized=o=>({...(!isMerchant?window.FoundationProfile.normalize(o):o),contactName:o.contactName||o.admin||'',mission:o.mission||'',registeredAddress:o.registeredAddress||o.address||'',licenseValidUntil:o.licenseLongTerm?'':o.licenseValidUntil||'2030-12-31',identityValidUntil:o.identityLongTerm?'':o.identityValidUntil||'',identityLongTerm:!!o.identityLongTerm,licenseLongTerm:!!o.licenseLongTerm,businessRoles:merchantBusinessRoles.filter(role=>(o.businessRoles||[]).includes(role))});
 const baseline=normalized(effective),base={...baseline,...context.changes.snapshot},allNames=['基本资料',...(hasBusinessAccess()||!isMerchant?['资质材料','收款资料']:[])],names=sectionOnly?allNames.filter(name=>name===tab):allNames;
 if(!names.length)return;
 const group=(name,body)=>'<section class="organization-editor-section" id="org-editor-'+names.indexOf(name)+'" data-editor-section="'+name+'"><h2>'+name+'</h2>'+body+'</section>';
 const basic=(!isMerchant?field('组织名称','name',base.name):'')+field('联系人','contactName',base.contactName)+field('联系电话','contact',base.contact,'tel')+field('办公地址','address',base.address)+(!isMerchant?field('机构宗旨','mission',base.mission,'textarea',false,true)+window.FoundationProfile.renderFields(base):'');
 const qualification=isMerchant?organizationQualificationFields(base):field('统一社会信用代码','code',base.code)+window.FoundationProfile.render(base,{includeFields:false});
 const payment='<div class="organization-payment-summary">'+kv([['分账接收方全称',base.name],['微信商户号',paymentAccountText(effective.bank,false)]])+'<p class="tiny muted">接收方全称来源于本页组织名称，须与微信支付开户主体一致。</p></div>'+field('新微信商户号','bank',context.changes.snapshot.bank||'','text',false,true)+'<p class="tiny muted">填写完整的 8～10 位数字；留空保留当前账户。</p>';
 let uploads,foundationProfile;
 form(sectionOnly?'编辑'+tab:'编辑组织资料','<nav class="organization-editor-nav" aria-label="编辑资料分区">'+names.map((name,i)=>'<button type="button" class="tab" data-editor-target="'+i+'">'+name+'</button>').join('')+'</nav><div class="organization-editor-sections">'+names.map(name=>group(name,name==='基本资料'?basic:name==='资质材料'?qualification:payment)).join('')+'</div>',(data,intent)=>{
  const contextError=checkContext();if(contextError)return contextError;
  if(uploads?.reading())return '文件读取中，请稍候。';if(uploads?.error())return uploads.error();
  if(foundationProfile?.issue())return foundationProfile.issue();
  const values={...context.changes.snapshot};
  if(names.includes('基本资料')){
   Object.assign(values,{contactName:data.contactName.trim(),contact:data.contact.trim(),address:data.address.trim()});
   if(!isMerchant)Object.assign(values,{name:data.name.trim(),mission:data.mission.trim(),foundationFields:window.FoundationProfile.fields.filter((value,i)=>data['foundationField-'+i])});
  }
  if(names.includes('资质材料')){
   if(isMerchant)values.name=data.name.trim();values.code=data.code.trim();
   if(foundationProfile){const profile=foundationProfile.snapshot();for(const key of organizationSectionFields['资质材料'])if(Object.hasOwn(profile,key))values[key]=profile[key];}
   if(isMerchant)Object.assign(values,{entrantName:data.entrantName.trim(),entrantIdentity:data.entrantIdentity.trim(),registeredAddress:data.registeredAddress.trim(),businessRoles:merchantBusinessRoles.filter(role=>data['businessRole-'+role]),identityLongTerm:!!data.identityLongTerm,identityValidUntil:data.identityLongTerm?'':data.identityValidUntil,licenseLongTerm:!!data.licenseLongTerm,licenseValidUntil:data.licenseLongTerm?'':data.licenseValidUntil,...uploads.files});
  }
  if(names.includes('收款资料')&&data.bank.trim())values.bank=data.bank.trim();
  const snapshot={},sections=[];
  for(const name of allNames)for(const key of organizationSectionFields[name])if(Object.hasOwn(values,key)&&JSON.stringify(values[key])!==JSON.stringify(baseline[key])){snapshot[key]=values[key];if(!sections.includes(name))sections.push(name);}
  if(snapshot.licenseFile)snapshot.licenseName=snapshot.licenseFile.name;
  if(!sections.length)return '修改内容与生效资料一致，无需提交。';
  if(snapshot.bank||snapshot.name)snapshot.bankAccountName=snapshot.name||effective.name;
  const changes={snapshot,sections};
  if(intent!=='draft'){
   // Validate against the normalized effective version without treating display defaults as edits.
   const issue=organizationChangeIssue({snapshot:{...baseline,...snapshot},sections});if(issue)return issue;
  }
  if(intent==='draft')return commit(changes,'draft');
  confirm(changes);
 },'提交审批',true);
 const panel=$('#overlay .dialog'),shade=panel.parentElement,formEl=$('#edit-form');
 panel.classList.add('organization-editor-page','shop-subject-editor','merchant-page-panel');shade.classList.add('organization-editor-shade');formEl.noValidate=true;
 merchantSubpage('organization-editor');
 const back=panel.querySelector('[data-action=close]');back.className='link merchant-page-back';back.textContent='‹ 返回'+('组织管理');back.setAttribute('aria-label',back.textContent.slice(2));
 const bank=formEl.elements.bank;if(bank){bank.inputMode='numeric';bank.autocomplete='off';bank.placeholder='请输入 8～10 位数字';}
 if(isMerchant&&names.includes('资质材料')){
  uploads=bindShopUploads(['identityFront','identityBack','licenseFile'],base,10,['png','jpg','jpeg']);
  for(const [check,date] of [['identityLongTerm','identityValidUntil'],['licenseLongTerm','licenseValidUntil']])formEl.elements[check].addEventListener('change',e=>{formEl.elements[date].disabled=e.target.checked;});
 }
 if(!isMerchant&&names.includes('资质材料'))foundationProfile=window.FoundationProfile.bind(formEl,base);
 const recipient=panel.querySelector('.organization-payment-summary dd');
 formEl.elements.name?.addEventListener('input',e=>{if(recipient)recipient.textContent=e.target.value.trim()||'未填写';});
 const scroll=panel.querySelector('.organization-editor-sections'),buttons=[...panel.querySelectorAll('[data-editor-target]')],sections=[...scroll.children];
 const activate=i=>buttons.forEach((b,j)=>{b.classList.toggle('active',i===j);b.setAttribute('aria-current',i===j?'location':'false');});
 const jump=i=>{scroll.scrollTop=sections[i].offsetTop-sections[0].offsetTop;activate(i);};
 buttons.forEach((b,i)=>b.addEventListener('click',()=>jump(i)));
 scroll.addEventListener('scroll',()=>{let index=0;sections.forEach((el,i)=>{if(el.offsetTop-sections[0].offsetTop<=scroll.scrollTop+20)index=i;});activate(index);});
 requestAnimationFrame(()=>jump(Math.max(0,names.indexOf(tab))));
 function checkContext(){
  if(org().id!==effective.id||currentMember()?.id!==context.actor||!canManageMembers()||currentMember()?.phone!==phone)return '当前组织、管理员权限或绑定手机号已变化，请返回后重新操作。';
  if(JSON.stringify(org())!==JSON.stringify(effective)||JSON.stringify(organizationChanges(application))!==signature)return '组织资料或草稿已变化，请返回后重新核对。';
  if(pending(org().id))return '该组织已有待审批版本，请先撤回后重新提交。';
  return '';
 }
 function commit(changes,intent='submit'){
  const issue=checkContext();if(issue)return issue;
  const error=submitApplication('组织资料变更',org(),{...changes.snapshot,orgSections:changes.sections},intent);if(error)return error;
  context.changes.applications.forEach(replaceSavedApplication);closeOverlay();render();toast(intent==='draft'?'组织资料草稿已保存':'组织资料变更已提交审批');
 }
 function confirm(changes){
  const sensitive=Object.hasOwn(changes.snapshot,'name')||!isMerchant&&[...window.FoundationProfile.groups.evaluation,...window.FoundationProfile.groups.qualification].some(key=>Object.hasOwn(changes.snapshot,key))||changes.sections.some(name=>name==='资质材料'||name==='收款资料');let sentAt=0;
  const display=(key,v)=>v==null||v===''?'—':key==='bank'?paymentAccountText(v,false):key==='entrantIdentity'?maskSubjectId(v):key==='entrantName'?maskSubjectName(v):v?.name||(Array.isArray(v)?v.join('、'):typeof v==='boolean'?(v?'是':'否'):String(v));
  const rows=Object.entries(changes.snapshot).filter(([key])=>key!=='bankAccountName').map(([key,v])=>tr([esc(applicationFieldNames[key]||key),esc(display(key,baseline[key])),esc(display(key,v))]));
  subdialog('提交组织资料变更','<form id="organization-confirm-form"><p>本次修改：'+esc(changes.sections.join('、'))+'，统一提交审批。</p>'+table(['修改项','修改前','修改后'],rows,false)+(sensitive?'<p>管理员验证手机号：'+esc(String(phone||'未绑定').replace(/^(\d{3})\d{4}(\d{4})$/,'$1****$2'))+'</p><p class="tiny muted">来源：当前组织管理员账号绑定手机号。</p><div class="organization-sms-row">'+field('短信验证码','sms','','text',false)+'<button type="button" class="btn" id="organization-send-code">获取验证码</button></div><p class="tiny muted">原型演示验证码 123456，不发送真实短信。</p>':'')+checkbox('我已阅读并同意适用协议','agreement')+'<div id="organization-confirm-error" class="form-error" role="alert"></div></form>','返回修改');
  const secondary=$('#secondary'),confirmForm=secondary.querySelector('form'),error=secondary.querySelector('#organization-confirm-error');secondary.querySelector('.dialog').classList.add('organization-submit-dialog');
  secondary.querySelector('.dialog-foot').innerHTML='<button class="btn primary" type="submit" form="organization-confirm-form">'+(sensitive?'验证并提交':'提交审批')+'</button>'+btn('返回修改','secondary-close');
  if(sensitive){
   const sms=confirmForm.elements.sms;sms.inputMode='numeric';sms.autocomplete='one-time-code';sms.maxLength=6;
   secondary.querySelector('#organization-send-code').addEventListener('click',e=>{
    const issue=checkContext();if(issue){error.textContent=issue;return;}
    if(!phone){error.textContent='管理员账号尚未绑定手机号，请先维护账号信息。';return;}
    if(sentAt&&Date.now()-sentAt<60000){error.textContent='验证码已获取，请在 60 秒后重试。';return;}
    sentAt=Date.now();e.target.textContent='重新获取验证码';error.textContent='';sms.focus();toast('演示验证码已生成：123456');
   });
  }
  confirmForm.addEventListener('submit',e=>{
   e.preventDefault();const issue=checkContext();if(issue){error.textContent=issue;return;}
   if(!confirmForm.elements.agreement.checked){error.textContent='请主动确认适用协议。';return;}
   if(sensitive){
    if(!sentAt){error.textContent='请先获取管理员手机验证码。';return;}
    if(Date.now()-sentAt>5*60*1000){error.textContent='验证码已过期，请重新获取。';return;}
    if(confirmForm.elements.sms.value.trim()!=='123456'){error.textContent='短信验证码错误，演示验证码为 123456。';return;}
   }
   const result=commit(changes);if(result)error.textContent=result;else sentAt=0;
  });
 }
}
function foundationOnboardingEditor(id=''){
 const saved=id?myMerchantOnboarding().find(a=>a.id===id):null;
 if(id&&(!saved||!['草稿','已撤回','已驳回'].includes(saved.status)))return;
 const base=saved?.snapshot||{},account=S.demoAccount,applicationId=saved?.id||'FON'+Date.now();let profile;
 const body='<p class="full tiny muted">组织类型：基金会。提交后由系统基金会管理员或系统超级管理员审核。</p>'+section('基本资料')+field('基金会名称','name',base.name)+field('统一社会信用代码','code',base.code)+field('联系人','contactName',base.contactName)+field('联系电话','contact',base.contact,'tel')+field('办公地址','address',base.address)+field('机构宗旨与业务介绍','mission',base.mission,'textarea',true,true)+window.FoundationProfile.render(base)+section('微信收款资料')+field('微信支付商户号','bank',base.bank)+consent('我已阅读并同意《组织入驻及合作协议》');
 form('添加组织 · 基金会入驻',body,(data,intent)=>{
  if(account!==S.demoAccount)return '当前账号已切换，请重新打开申请。';
  const latest=myMerchantOnboarding().find(a=>a.id===applicationId);
  if(latest&&!['草稿','已撤回','已驳回'].includes(latest.status))return '该申请已提交，请返回查看审批进度。';
  if(profile.issue())return profile.issue();
  const snapshot={...profile.snapshot()};
  for(const key of ['name','code','contactName','contact','address','mission','bank'])snapshot[key]=String(data[key]||'').trim();
  if(intent!=='draft'){
   for(const [key,label] of [['name','基金会名称'],['code','统一社会信用代码'],['contactName','联系人'],['address','办公地址'],['mission','机构宗旨与业务介绍']])if(!snapshot[key])return '请填写'+label+'。';
   if(!/^1[0-9]{10}$/.test(snapshot.contact))return '请填写有效的 11 位联系电话。';
   if(!/^[0-9]{8,10}$/.test(snapshot.bank))return '微信支付商户号须为 8～10 位数字。';
   const issue=window.FoundationProfile.error(snapshot);if(issue)return issue;
   if(D.organizations.some(o=>o.code===snapshot.code)||myMerchantOnboarding().some(a=>a.id!==applicationId&&a.status==='待审核'&&a.snapshot.code===snapshot.code))return '该组织已入驻或已有待审核申请，请核对统一社会信用代码。';
   if(!data.agreement)return '请阅读并确认《组织入驻及合作协议》。';
  }
  const date=new Date().toLocaleString('sv-SE'),application={...saved,id:applicationId,accountKey:account,kind:'foundation',type:'组织入驻',who:currentAccountName(),snapshot,status:intent==='draft'?'草稿':'待审核',stage:intent==='draft'?'未提交':'系统基金会管理员 / 系统超级管理员审批',version:(saved?.version||0)+(intent==='draft'?0:1),date,history:[...(latest?.history||[]),{date,action:intent==='draft'?'保存草稿':'提交申请'}]};
  if(intent!=='draft')application.consent={title:'组织入驻及合作协议',version:'原型示例 v1',accountKey:account,date};
  const issue=saveMerchantOnboarding(application);if(issue)return issue;
  closeOverlay();merchantOnboarding();toast(intent==='draft'?'入驻草稿已保存':'基金会入驻申请已提交');
 },'提交入驻申请',true);
 profile=window.FoundationProfile.bind($('#edit-form'),base);
}
function foundationOnboardingDetail(id){
 const a=myMerchantOnboarding().find(a=>a.id===id);if(!a)return;const s=a.snapshot;
 dialog('基金会入驻申请详情',kv([['申请编号',a.id],['基金会名称',s.name],['申请状态',a.status],['当前环节',a.stage],['联系人',s.contactName],['联系电话',s.contact],['办公地址',s.address],['统一社会信用代码',s.code],['机构宗旨与业务介绍',s.mission],...window.FoundationProfile.rows(s),['微信支付商户号',s.bank],['协议确认',a.consent?a.consent.title+' · '+a.consent.date:'待确认'],['审批意见',a.reason||'—']])+section('申请记录')+(a.history||[]).map(h=>'<p class="tiny">'+esc(h.date+' · '+h.action)+'</p>').join(''),(['草稿','已撤回','已驳回'].includes(a.status)?btn('继续填写','context-onboarding-edit',a.id,'btn primary'):'')+(a.status==='待审核'?btn('撤回申请','context-onboarding-withdraw',a.id):'')+btn('返回我的申请','context-onboarding-list'));
}
const merchantOnboardingKey=isMerchant?'shanxing-merchant-onboarding-demo-v1':'shanxing-foundation-onboarding-demo-v1';
function merchantOnboardingRecords(){
 const examples=JSON.parse(JSON.stringify(isMerchant?(D.merchantOnboardingApplications||[]):[]));
 let saved=[];try{const records=JSON.parse(sessionStorage.getItem(merchantOnboardingKey)||'[]');if(Array.isArray(records))saved=records;}catch{}
 return [...saved,...examples.filter(example=>!saved.some(a=>a.id===example.id&&a.accountKey===example.accountKey))].map(a=>({...a,type:'组织入驻',...(a.status==='已撤回'?{status:'草稿',stage:'未提交'}:{})}));
}
function myMerchantOnboarding(){return merchantOnboardingRecords().filter(a=>a.accountKey===S.demoAccount);}
function saveMerchantOnboarding(record){
 const records=merchantOnboardingRecords(),index=records.findIndex(a=>a.id===record.id&&a.accountKey===S.demoAccount);
 if(index>=0)records[index]=record;else records.unshift(record);
 try{sessionStorage.setItem(merchantOnboardingKey,JSON.stringify(records));return '';}catch{return '浏览器无法保存申请，请减少材料大小或检查浏览器存储设置后重试。';}
}
function merchantOnboarding(){
 navigate('applications');S.filters[filterKey()]={type:'组织入驻'};render();
}
function merchantOnboardingEditor(id=''){
 if(!isMerchant)return foundationOnboardingEditor(id);
 const saved=id?myMerchantOnboarding().find(a=>a.id===id):null;
 if(id&&(!saved||!['草稿','已撤回','已驳回'].includes(saved.status)))return;
 const account=S.demoAccount,base=saved?.snapshot||{entrantName:currentAccountName()},applicationId=saved?.id||'ON'+Date.now();let upload;
 const uploadKeys=['identityFront','identityBack','licenseFile'];
 const body='<p class="full tiny muted">组织类型：商家。填写新组织资料，提交后由系统商家管理员或系统超级管理员审批。</p>'+section('基本资料')+field('联系人','contactName',base.contactName)+field('联系电话','contact',base.contact,'tel')+field('办公地址','address',base.address,'textarea',true,true)+'<div class="full onboarding-qualification">'+organizationQualificationFields(base,false)+'</div>'+section('微信收款资料')+'<p class="full tiny muted">分账接收方全称引用上方组织名称。</p>'+field('微信支付商户号','bank',base.bank)+consent('我已阅读并同意《组织入驻及合作协议》')+'<div class="full">'+btn('在我的申请中查看','context-onboarding-list','','link')+'</div>';
 form('添加组织 · 商家入驻',body,(data,intent)=>{
  if(account!==S.demoAccount)return '当前账号已切换，请重新打开申请。';
  const latest=myMerchantOnboarding().find(a=>a.id===applicationId);
  if(latest&&!['草稿','已撤回','已驳回'].includes(latest.status))return '该申请已提交，请返回查看审批进度。';
  if(upload.reading())return '材料读取中，请稍候。';if(upload.error())return upload.error();
  const snapshot={};for(const key of ['name','contactName','contact','address','entrantName','entrantIdentity','identityValidUntil','code','licenseValidUntil','registeredAddress','bank'])snapshot[key]=String(data[key]||'').trim();
  snapshot.identityLongTerm=!!data.identityLongTerm;snapshot.licenseLongTerm=!!data.licenseLongTerm;
  snapshot.businessRoles=merchantBusinessRoles.filter(role=>data['businessRole-'+role]);Object.assign(snapshot,upload.files);
  if(intent!=='draft'){
   if(['name','contactName','contact','address','entrantName','entrantIdentity','code','registeredAddress','bank'].some(key=>!snapshot[key]))return '请补全组织、联系、资质及微信收款资料。';
   if(!/^1\d{10}$/.test(snapshot.contact))return '请填写有效的 11 位联系电话。';
   if(!/^\d{6,20}$/.test(snapshot.bank))return '微信支付商户号须为 6 至 20 位数字。';
   if(!snapshot.businessRoles.length)return '请至少选择一项业务身份。';
   if(uploadKeys.some(key=>!snapshot[key]?.data))return '请上传身份证人像面、国徽面及营业执照。';
   const today=new Date().toLocaleDateString('sv-SE');
   for(const [key,long] of [['identityValidUntil','identityLongTerm'],['licenseValidUntil','licenseLongTerm']])if(!snapshot[long]&&(!snapshot[key]||snapshot[key]<today))return '请填写有效证件期限，长期有效请勾选长期。';
   if(D.organizations.some(o=>o.code===snapshot.code)||myMerchantOnboarding().some(a=>a.id!==applicationId&&a.status==='待审核'&&a.snapshot.code===snapshot.code))return '该组织已入驻或已有待审核申请，请核对统一社会信用代码。';
   if(!data.agreement)return '请阅读并确认《组织入驻及合作协议》。';
  }
  const application={...saved,id:applicationId,accountKey:account,type:'组织入驻',who:currentAccountName(),snapshot,status:intent==='draft'?'草稿':'待审核',stage:intent==='draft'?'未提交':'系统商家管理员 / 系统超级管理员审批',version:(saved?.version||0)+(intent==='draft'?0:1),date:new Date().toLocaleString('sv-SE')};
  application.history=[...(latest?.history||[]),{action:intent==='draft'?'保存草稿':'提交申请',date:application.date}];
  if(intent!=='draft')application.consent={title:'组织入驻及合作协议',version:'原型示例 v1',accountKey:account,date:application.date};
  const error=saveMerchantOnboarding(application);if(error)return error;
  closeOverlay();merchantOnboarding();toast(intent==='draft'?'入驻草稿已保存':'入驻申请已提交');
 },'提交入驻申请',true);
 upload=bindShopUploads(uploadKeys,base,10,['png','jpg','jpeg']);
 const panel=$('#edit-form');
 for(const [key,long] of [['identityValidUntil','identityLongTerm'],['licenseValidUntil','licenseLongTerm']])panel.elements[long].addEventListener('change',()=>{panel.elements[key].disabled=panel.elements[long].checked;panel.elements[key].required=!panel.elements[long].checked;});
 for(const key of uploadKeys)if(base[key]?.data)panel.querySelector('[name='+key+']').closest('.subject-upload').querySelector('.media-preview').innerHTML='<img class="application-change-image" src="'+esc(base[key].data)+'" alt="'+esc(base[key].name)+'">';
}
function merchantOnboardingDetail(id){
 if(!isMerchant)return foundationOnboardingDetail(id);
 const a=myMerchantOnboarding().find(a=>a.id===id);if(!a)return;const s=a.snapshot;
 dialog('组织入驻申请详情',kv([['申请编号',a.id],['组织类型','商家'],['组织名称',s.name],['申请状态',a.status],['当前环节',a.stage],['联系人',s.contactName],['联系电话',s.contact],['办公地址',s.address],['统一社会信用代码',s.code],['业务身份',(s.businessRoles||[]).join('、')],['注册地址',s.registeredAddress],['入驻人姓名',maskSubjectName(s.entrantName)],['入驻人身份证号',maskSubjectId(s.entrantIdentity)],['身份证有效期',s.identityLongTerm?'长期':s.identityValidUntil],['营业执照有效期',s.licenseLongTerm?'长期':s.licenseValidUntil],['分账接收方全称',s.name],['微信支付商户号',paymentAccountText(s.bank)],['协议确认',a.consent?a.consent.title+' · '+a.consent.version+' · '+a.consent.date:'待确认'],['审批意见',a.reason||'—']])+['identityFront','identityBack','licenseFile'].filter(key=>s[key]?.data).map(key=>'<div class="onboarding-material"><p>'+esc(shopMaterialLabels[key])+'</p><img class="application-change-image" src="'+esc(s[key].data)+'" alt="'+esc(s[key].name)+'"></div>').join('')+section('申请记录')+(a.history||[]).map(h=>'<p class="tiny">'+esc([h.date,h.operator,h.action].filter(Boolean).join(' · '))+'</p>').join(''),(['草稿','已撤回','已驳回'].includes(a.status)?btn('继续填写','context-onboarding-edit',a.id,'btn primary'):'')+(a.status==='待审核'?btn('撤回申请','context-onboarding-withdraw',a.id):'')+btn('返回我的申请','context-onboarding-list'));
 $('#overlay .dialog').classList.add('onboarding-detail');
}
function merchantOnboardingWithdraw(id){
 const a=myMerchantOnboarding().find(a=>a.id===id&&a.status==='待审核');if(!a)return;
 reasonDialog('撤回入驻申请','确认撤回该组织的入驻申请？',reason=>{const latest=myMerchantOnboarding().find(a=>a.id===id&&a.status==='待审核');if(!latest)return '申请状态已变化，请重新查看。';const date=new Date().toLocaleString('sv-SE');return saveMerchantOnboarding({...latest,status:'草稿',stage:'未提交',date,history:[...(latest.history||[]),{date,operator:currentAccountName(),action:'撤回申请：'+reason}]});});
}

function shopEditor(opening=false,application=null){
 if(!isMerchant||!C.manage())return;
 const owner=S.org,saved=opening?(application||D.applications.find(a=>a.org===owner&&a.type==='店铺开通'&&ownApplication(a)&&['草稿','已撤回','已驳回'].includes(a.status))):editableApplication('店铺资料变更',currentShop()?.id,application);
 if(saved&&(saved.org!==owner||!ownApplication(saved)||!['草稿','已撤回','已驳回'].includes(saved.status)))return;
 const s=(!opening&&currentShop())||{id:saved?.object||'SHOP'+Date.now(),org:owner,name:'',intro:'',category:'文具 / 家居',customerServiceId:''},base={...s,...saved?.snapshot};let upload;
 const logo=shopLogoUploadField('shopLogo','店铺标识图片',base.shopLogo?.name||'成图 300 × 300 像素，超出可裁剪；JPG、PNG、WebP 静态图片，最大 2 MB');
 const proof='<label class="full">经营资质证明材料<input name="categoryProof" type="file" accept="image/png,image/jpeg,application/pdf"><span class="local-file-note" data-upload-note="categoryProof">'+esc(base.categoryProof?.name||'自行上传时必填；支持 JPG、PNG、PDF，最大 10 MB')+'</span></label>';
 form(opening?'开设店铺':'店铺资料变更',field('店铺名称','name',base.name)+field('经营类目','category',base.category)+field('店铺简介','intro',base.intro,'textarea',true,true)+logo+field('客服账号 ID（open_kfid）','customerServiceId',base.customerServiceId||'')+section('经营资质')+select('资质来源','qualificationSource',[['organization','继承组织营业执照'],['upload','自行上传']],base.qualificationSource||'organization')+select('资质适用品类','qualificationCategory',String(base.category).split(/[/、,，]/).map(x=>x.trim()).filter(Boolean),base.qualificationCategory)+proof+field('资质有效期至','qualificationValidUntil',base.qualificationValidUntil||'','date',false)+checkbox('资质长期有效','qualificationLongTerm',base.qualificationLongTerm)+'<p class="full tiny muted" data-inherited-qualification>材料及有效期引用本组织生效营业执照。</p>'+'<div class="hint full">商品订单收款主体：'+esc(D.paymentCollection.name)+'；分账接收账户：'+esc(paymentAccountText(org().bank))+'</div>'+consent('我已阅读并同意开店协议、经营协议'),(data,intent)=>{
  if(S.org!==owner||!C.manage())return '人员权限或当前组织已更新，请重新操作。';
  if(upload.reading())return '文件读取中，请稍候。';if(upload.error())return upload.error();
  const snapshot={...data,...upload.files};delete snapshot.agreement;delete snapshot.qualificationName;
  if(data.qualificationSource==='organization')for(const key of ['qualificationName','categoryProof','qualificationValidUntil','qualificationLongTerm'])delete snapshot[key];
  if(intent!=='draft'){
   if(!data.agreement)return '请主动确认适用协议。';
   for(const key of ['name','category','intro','customerServiceId']){snapshot[key]=String(data[key]||'').trim();if(!snapshot[key])return '请完整填写店铺资料。';}
   const issue=splitQualificationIssue(org());if(issue)return issue;
   const service=CS.verify(snapshot.customerServiceId);if(service.error)return service.error;
   if(!snapshot.shopLogo)return '请上传店铺标识图片。';
   if(!String(data.qualificationCategory||'').trim()||!String(data.category).split(/[/、,，]/).map(x=>x.trim()).includes(data.qualificationCategory.trim()))return '请选择经营类目内的资质适用品类。';
   if(data.qualificationSource==='upload'&&(!snapshot.categoryProof||!data.qualificationLongTerm&&!data.qualificationValidUntil))return '请上传证明材料并填写有效期。';
   const inherited=data.qualificationSource==='organization',validUntil=inherited?(org().licenseValidUntil||'2030-12-31'):data.qualificationValidUntil,longTerm=inherited?org().licenseLongTerm:!!data.qualificationLongTerm;
   if(!longTerm&&validUntil<new Date().toLocaleDateString('sv-SE'))return '经营资质已过期，请更新材料。';
   snapshot.operatingQualifications=[inherited?shopQualificationInfo({id:'Q'+s.id,category:data.qualificationCategory,source:'organization',organizationId:owner}):{id:'Q'+s.id,source:'upload',category:data.qualificationCategory,longTerm:!!data.qualificationLongTerm,validUntil:data.qualificationLongTerm?'':data.qualificationValidUntil,file:snapshot.categoryProof}];
   snapshot.logo=snapshot.shopLogo.data;snapshot.service=service.account?.name||CS.account(snapshot.customerServiceId)?.name||snapshot.customerServiceId;
  }
  if(opening&&intent!=='draft'){
   if(org().status!=='已入驻')return '请先完成商家入驻。';
   if(D.shops.some(shop=>shop.id===s.id))return '店铺已开通，请关闭后查看。';
   D.shops.push({...s,...snapshot,status:'已开通',seller:org().name,kind:org().inviter==='平台自营'?'平台自营':'商家店铺',openedAt:new Date().toLocaleDateString('sv-SE')});
   const date=new Date().toLocaleString('sv-SE');
   D.applications.unshift({id:'AP'+Date.now(),org:owner,type:'店铺开通',object:s.id,title:snapshot.name,status:'已通过',stage:'已开通',version:Math.max(1,saved?.version||0),date,baseline:JSON.parse(JSON.stringify(s)),snapshot:JSON.parse(JSON.stringify(snapshot)),who:currentAccountName(),accountKey:S.demoAccount,approvalNodes:[{name:'校验通过，店铺已开通',status:'已完成',time:date,operator:'系统'}]});
   S.shop=s.id;S.tab='基本信息';S.filters={};replaceSavedApplication(saved);record(s.id,'开通店铺');
  }else{const error=submitApplication(opening?'店铺开通':'店铺资料变更',s,snapshot,intent);if(error)return error;replaceSavedApplication(saved);}
  closeOverlay();render();toast(intent==='draft'?'店铺草稿已保存':opening?'店铺已开通':'店铺变更已提交，原生效资料继续有效');
 },opening?'立即开店':'提交审批',true);
 $('#edit-form').classList.add('shop-editor-form');
 const logoUpload=bindShopUploads(['shopLogo'],base,2,['jpg','jpeg','png','webp'],shopLogoImageIssue),proofUpload=bindShopUploads(['categoryProof'],base,10,['jpg','jpeg','png','pdf']);upload={get files(){return {...logoUpload.files,...proofUpload.files};},reading:()=>logoUpload.reading()||proofUpload.reading(),error:()=>logoUpload.error()||proofUpload.error()};
 $('#edit-form [name=category]').addEventListener('change',()=>{const choice=$('#edit-form [name=qualificationCategory]');choice.innerHTML=String($('#edit-form [name=category]').value).split(/[/、,，]/).map(x=>x.trim()).filter(Boolean).map(x=>'<option>'+esc(x)+'</option>').join('');});
 for(const key of ['shopLogo','categoryProof'])if(base[key]?.data){const el=$('#edit-form [name='+key+']');if(key==='shopLogo'){el.closest('label').querySelector('.media-preview').innerHTML='<img class="application-change-image" src="'+esc(base[key].data)+'" alt="'+esc(base[key].name)+'">';continue;}el.insertAdjacentHTML('afterend',base[key].type==='application/pdf'&&saved?btn('查看 '+esc(base[key].name),'shop-file',saved.id+':'+key,'link'):'<img class="application-change-image" src="'+esc(base[key].data)+'" alt="'+esc(base[key].name)+'">');}
 const sync=()=>{const inherited=$('#edit-form [name=qualificationSource]').value==='organization',longTerm=$('#edit-form [name=qualificationLongTerm]').checked;for(const key of ['categoryProof','qualificationValidUntil','qualificationLongTerm']){const el=$('#edit-form [name='+key+']'),label=el.closest('label');label.hidden=inherited;el.disabled=inherited||key==='qualificationValidUntil'&&longTerm;el.required=!inherited&&key!=='qualificationLongTerm'&&(key!=='qualificationValidUntil'||!longTerm)&&(key!=='categoryProof'||!upload.files.categoryProof);label.querySelector('.required-tip')?.remove();if(!inherited&&key!=='qualificationLongTerm'&&(key!=='qualificationValidUntil'||!longTerm))(label.querySelector('span')||label).insertAdjacentHTML('beforeend',' <span class="required-tip">*</span>');}$('#edit-form [data-inherited-qualification]').hidden=!inherited;};$('#edit-form [name=qualificationSource]').addEventListener('change',sync);$('#edit-form [name=qualificationLongTerm]').addEventListener('change',sync);sync();
}
function meetingForm(id){const a=activity(id);if(!a||!scopedProject(a.project))return;form('具体参会信息',field('会议链接 / 详细地址','meetingUrl',a.meetingUrl||'')+field('会议号','meetingNumber',a.meetingNumber||'')+field('会议密码','meetingPassword',a.meetingPassword||'')+field('参会指引','guide',a.guide||'','textarea',true,true),data=>{Object.assign(a,data,{meetingPublished:true,noticePending:true,issue:'',notice:'具体参会信息发布 / 变更通知'});record(a.name,'发布具体参会信息（凭证仅向有效资格用户展示）',a.project);closeOverlay();render();toast('已发布并记录通知');},'发布并通知');}
function addEditorPreview(kind,base,parentProject){
 if(kind==='product')$('#edit-form .dialog-foot').insertAdjacentHTML('afterbegin',btn('客户端预览','editor-preview',kind));
 if(kind==='product'||!window.WorkbenchContentPreview)return;
 const p=kind==='project'?base:parentProject,orders=projectOrders(p.id),activities=D.activities.filter(a=>a.project===p.id&&['已发布','已停止报名','已结束'].includes(a.status));
 window.WorkbenchContentPreview.mount({kind,base,organization:org(),parentProject:p,relatedActivities:activities,relatedProducts:projectProducts(p.id).filter(p=>p.status==='在售'),raised:round(amountRows(orders).contribution+directDonations(p.id)),participants:D.registrations.filter(r=>activities.some(a=>a.id===r.activity)&&['已录取','资格有效'].includes(r.status)).length,enrolled:D.registrations.filter(r=>r.activity===base.id&&['已录取','资格有效'].includes(r.status)).length});
}
function editorPreview(kind){if(kind==='product'){subdialog('当前编辑内容预览',productPhone(),'返回商品编辑');mountProductPreview($('#secondary'),currentProductPreview());return;}if(!window.WorkbenchContentPreview)return;subdialog('当前编辑内容预览','<div id="content-expanded-preview"></div>','返回编辑');window.WorkbenchContentPreview.mountExpanded($('#content-expanded-preview'));}
function closeSecondary(){productValueSort=null;draggedSpecValue=null;specSortTouch=null;const panel=$('#secondary');const focus=panel?.returnFocus;panel?.onSecondaryClose?.();panel?.remove();if(focus?.isConnected)focus.focus();}
function subdialog(title,body,returnLabel='已阅读，返回填写'){const panel=document.createElement('div');panel.returnFocus=document.activeElement;panel.id='secondary';panel.className='overlay-shade';panel.style.zIndex=$('.pe-stock-fullscreen')?'130':'100';panel.innerHTML='<section class="dialog" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="dialog-head"><h2>'+esc(title)+'</h2>'+'<button type="button" class="icon-btn" data-action="secondary-close" aria-label="关闭弹窗">'+icon('close')+'</button></div><div class="dialog-body">'+body+'</div><div class="dialog-foot">'+btn(returnLabel,'secondary-close','','btn primary')+'</div></section>';$('#overlay').appendChild(panel);panel.querySelector('button').focus();}
async function handle(a,id,el){
if(isMerchant&&C&&!C.canAction(a,id)){toast('没有该商品的操作权限');return;}
permissionActionContext={action:a,id};queueMicrotask(()=>{permissionActionContext=null;});
if(isMerchant){const orderWrites=['ship','refund','reject-order','after-accept','after-reject','after-note','notify-order','order-remark','remark-remove-color','remark-clear-text','remark-reuse','remark-clear-recent','remark-edit-name'];const productWrites=['product-new','product-edit','product-price','inventory','sku-modal-batch','product-toggle','analytics-edit-product'];if((orderWrites.includes(a)&&!canUse('orders'))||(productWrites.includes(a)&&!canUse('products'))||(a.startsWith('shop-')&&!canUse('shop'))){toast('当前账号没有此功能权限');return;}}
if(a.startsWith('pe-')){if(!isMerchant||canUse('products'))productEditorAction(a,id);return;}
if(a.startsWith('cp-')){C.action(a,id);return;}
if(isMerchant&&!hasBusinessAccess()&&!['nav','close','secondary-close','account','account-info','password','my-agreements','mobile','mobile-close','close-order-page','tab','context-org','context-shop','context-add-shop','context-add-organization','context-onboarding-list','context-onboarding-edit','context-onboarding-detail','context-onboarding-withdraw','application-sort','apply-filter','reset-filter','read-agreement','org-edit'].includes(a)){toast('当前账号没有此功能权限');return;}
switch(a){
case 'context-add-shop':{
 closeContextPickers();
 const target=authorizedOrganizations().find(o=>o.id===id&&o.role==='merchant'&&o.status==='已入驻');
 const member=D.members.find(m=>m.org===id&&m.accountKey===S.demoAccount);
 if(!isMerchant||!target||member?.role!=='组织管理员'){toast('仅该组织管理员可添加店铺');break;}
 switchWorkspace(id);navigate('shop');shopEditor(true);break;
}
case 'context-add-organization':closeContextPickers();merchantOnboardingEditor();break;
case 'context-onboarding-list':merchantOnboarding();break;
case 'context-onboarding-edit':merchantOnboardingEditor(id);break;
case 'context-onboarding-detail':merchantOnboardingDetail(id);break;
case 'context-onboarding-withdraw':merchantOnboardingWithdraw(id);break;
case 'context-org':switchWorkspace(id);break;
case 'context-shop':{const [orgId,shopId]=id.split('|');switchWorkspace(orgId,shopId);break;}
case 'nav':navigate(id);break;
case 'contact-system-admin':contactSystemAdmin(id);break;
case 'copy-admin-issue':{const o=myOrders().find(o=>o.id===id);if(!isMerchant||!o)break;try{await navigator.clipboard.writeText(adminIssueSummary(o));toast('问题信息已复制，请发送给系统管理员');}catch{const pre=$('#secondary .alert-message');if(pre){const range=document.createRange();range.selectNodeContents(pre);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);}toast('请复制已选中的问题信息');}break;}
case 'analytics-page':if(isMerchant&&window.MerchantAnalytics.pages.includes(id)){S.page='analytics';S.tab=id;Object.assign(analyticsState,{sub:'',productId:'',region:'',metric:'',range:['经营总览','交易数据','商品数据','公益数据'].includes(id)?'实时':'昨日'});closeOverlay();render();window.scrollTo(0,0);}break;
case 'settlement-group':{if(isMerchant||S.page!=='settlement'||!id.startsWith(S.org+':'))break;if(settlementExpanded.has(id))settlementExpanded.delete(id);else settlementExpanded.add(id);render();[...document.querySelectorAll('[data-action=settlement-group]')].find(button=>button.dataset.id===id)?.focus({preventScroll:true});break;}
case 'settlement-scope':{if(isMerchant||S.page!=='settlement')break;const [orgId='',productId='']=id.split(':');applySettlementScope(orgId,productId);break;}
case 'settlement-range':{if(isMerchant||S.page!=='settlement'||!settlementRanges.includes(id))break;const query={...f()},period=settlementPeriod(query);S.filters[filterKey()]={...query,settlementRange:id,from:period.from.slice(0,10),to:period.to.slice(0,10)};render();if(id==='自定义')$('#settlement-date-form [name=from]')?.focus();break;}
case 'analytics-range':{if(!isMerchant||S.page!=='analytics')break;const detail=id.startsWith('detail:'),regional=id.startsWith('region:'),name=detail||regional?id.slice(7):id;if(!window.MerchantAnalytics.ranges.includes(name))break;const key=regional?'regionRange':detail?'detailRange':'range',from=detail?'detailFrom':'from',to=detail?'detailTo':'to';if(name==='自定义'){const period=window.MerchantAnalytics.range({range:analyticsState[key],from:analyticsState[from],to:analyticsState[to]},'2026-11-02 15:00');analyticsState[from]=period.from;analyticsState[to]=period.to;}analyticsState[key]=name;render();if(name==='自定义')$(detail?(analyticsState.productId?'#analytics-product-date-form [name=from]':'#analytics-detail-date-form [name=from]'):'#analytics-date-form [name=from]')?.focus();break;}
case 'analytics-metric':{if(!isMerchant||S.page!=='analytics')break;const [page,metric]=id.split('|');if(!window.MerchantAnalytics.pages.includes(page))break;const changed=S.tab!==page;S.tab=page;if(changed){analyticsState.sub='';analyticsState.productId='';analyticsState.region='';analyticsState.range=['经营总览','交易数据','商品数据','公益数据'].includes(page)?'实时':'昨日';}analyticsState.metric=metric;render();if(changed)window.scrollTo(0,0);break;}
case 'analytics-refresh':if(isMerchant&&S.page==='analytics'){render();toast('数据已刷新');}break;
case 'analytics-goods':if(isMerchant&&S.page==='analytics'&&analyticsProducts().some(p=>p.id===id)){S.tab='商品数据';analyticsState.productId=id;render();window.scrollTo(0,0);}break;
case 'analytics-pilot-reset':if(isMerchant&&S.page==='analytics'){analyticsState.pilotIds='';analyticsState.pilotName='';render();}break;
case 'analytics-goods-reset':if(isMerchant&&S.page==='analytics'){analyticsState.query='';analyticsState.sort='favorites';render();}break;
case 'analytics-product':if(isMerchant&&S.page==='analytics'&&analyticsProducts().some(p=>p.id===id))productDetail(id);break;
case 'analytics-control':{if(!isMerchant||S.page!=='analytics')break;const [key,...parts]=id.split('|'),value=parts.join('|');if(!['trend','sort','sub','productId','region'].includes(key))break;if(key==='productId'&&value&&!analyticsProducts().some(p=>p.id===value))break;const returnProduct=key==='productId'&&!value?analyticsState.productId:'';if(key==='sort')analyticsState.direction=analyticsState.sort===value&&analyticsState.direction!=='asc'?'asc':'desc';if(key==='sub'&&(S.tab==='经营总览'||['售后数据','客服数据'].includes(S.tab)&&['成长层级','综合体验星级','商品领航员','消费者体验指标'].includes(value)))S.tab='服务数据';analyticsState[key]=value;render();if(returnProduct)$('#main [data-action=analytics-goods][data-id="'+returnProduct+'"]')?.focus();break;}
case 'analytics-edit-product':if(isMerchant&&S.page==='analytics'&&analyticsProducts().some(p=>p.id===id))productEditor(id);break;
case 'analytics-goals':{if(!isMerchant||S.page!=='analytics')break;const ctx=merchantAnalyticsContext();form('设置目标成交额',window.MerchantAnalytics.goalTable(ctx),values=>{try{window.MerchantAnalytics.saveGoals(ctx,Object.fromEntries(Object.entries(values).filter(([k])=>/^\d{4}-\d{2}$/.test(k))));}catch(error){return error.message;}closeOverlay();render();toast('经营目标已保存');},'确认设置');$('#overlay .dialog').classList.add('analytics-goals-dialog');$('#overlay .dialog-foot [data-action=close]').setAttribute('aria-label','取消');break;}
case 'analytics-order':if(isMerchant&&S.page==='analytics'&&myOrders().some(o=>o.id===id))openOrderPage(id,({'售后数据':'售后信息','物流数据':'发货与物流','公益数据':'分账记录'})[S.tab]||'订单信息');break;
case 'tab':if(['organization','shop'].includes(S.page)){scrollOrganizationSection(id);break;}S.tab=id;render();break;
case 'project-tab':S.projectTab=id;S.product='';render();break;
case 'activity-tab':S.activityTab=id;render();break;
case 'filter-label':{if(!isMerchant||S.page!=='orders')break;const query={...f()};if(id==='all'){delete query.remarkColor;delete query.remarkPresence;}else{const [key,value]=id.split(':');if(!['remarkColor','remarkPresence'].includes(key))break;query[key]=value;}S.filters[filterKey()]=query;render();break;}
case 'application-sort':if(S.page==='applications'&&applicationSortKeys.includes(id)){applicationSort.direction=applicationSort.key===id?(applicationSort.direction==='asc'?'desc':'asc'):id==='date'?'desc':'asc';applicationSort.key=id;render();$('#main [data-action=application-sort][data-id='+id+']')?.focus({preventScroll:true});}break;
case 'apply-filter':$('#filter-form').requestSubmit();break;
case 'reset-filter':if(!isMerchant&&S.page==='settlement'){const query=f();S.filters[filterKey()]=Object.fromEntries(['settlementOrg','settlementProduct','settlementRange','from','to'].filter(key=>query[key]!==undefined).map(key=>[key,query[key]]));render();break;}delete S.filters[filterKey()];if(!isMerchant&&['activities','actions'].includes(S.page))S.project='';if(isMerchant&&S.page==='orders')S.quick='全部订单';render();break;
case 'toggle-query':{const expanded=el.getAttribute('aria-expanded')!=='true';el.setAttribute('aria-expanded',String(expanded));el.textContent=expanded?'收起筛选条件':'展开所有筛选项';$('.merchant-advanced-fields').hidden=!expanded;break;}
case 'product-options':{const list=$('#order-product-options');if(list?.hidden){openProductOptions();$('#order-product-name')?.focus();}else closeProductOptions();break;}
case 'filter-product':{const input=$('#order-product-name'),field=$('#filter-form [name=productId]');if(!input||!field)break;input.value=el.dataset.label||'';field.value=id;closeProductOptions();input.focus();break;}
case 'after-quick':if(isMerchant&&S.page==='orders'&&S.quick==='退款/售后'&&afterQuick.includes(id)){S.filters[filterKey()]={...f(),afterTodo:f().afterTodo===id?'':id};render();}break;
case 'activity-quick':{if(!['','yes','registration','meeting'].includes(id))break;S.filters[filterKey()]={...f(),issue:id};render();break;}
case 'quick':{if(!orderQuick.includes(id))break;S.quick=id;const query={...f(),afterStatus:'',issue:'',afterTodo:''};delete query.orderStatus;delete query.afterShipping;delete query.returnWaybill;delete query.afterTimeRange;delete query.afterFrom;delete query.afterTo;if(id==='退款/售后'){delete query.receiverName;delete query.receiverPhone;delete query.shippingWindow;delete query.timeRange;delete query.from;delete query.to;}S.filters[filterKey()]=query;render();break;}
case 'clear-list':delete S.filters[filterKey()];if(S.page==='orders')S.quick='全部订单';render();break;
case 'product-status':{if(!isMerchant||S.page!=='products'||!['','在售','已售罄','已下架','待审批','已驳回','草稿'].includes(id))break;const query=$('#filter-form [name=q]')?.value||'';S.filters[filterKey()]={q:query,collaboratorName:$('#filter-form [name=collaboratorName]')?.value||'',productState:id};render();break;}
case 'account':S.menu=!S.menu;render();break;
case 'mobile':$('.sidebar').classList.add('open');$('.mobile-cover').classList.add('visible');break;
case 'mobile-close':$('.sidebar').classList.remove('open');$('.mobile-cover').classList.remove('visible');break;
case 'close-order-page':window.close();break;
case 'order-after-anchor':$('[data-order-section="售后信息"]')?.scrollIntoView({block:'start',behavior:'smooth'});break;
case 'close':cancelOverlay();break;
case 'toggle-logistics':{const expanded=el.getAttribute('aria-expanded')!=='true';el.setAttribute('aria-expanded',String(expanded));el.innerHTML=(expanded?'收起物流信息':'展开更多物流信息')+'<svg class="dropdown-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>';el.closest('.logistics-package-tracking').querySelectorAll('.logistics-timeline li').forEach((node,i)=>node.hidden=!expanded&&i>1);break;}
case 'secondary-close':closeSecondary();break;
case 'editor-preview':editorPreview(id);break;
case 'read-agreement':subdialog('适用协议 · 原型示例','<div class="document-text">组织合作 / 商品经营 / 公益项目合作协议（示例占位）\n\n请在正式提交前阅读适用协议并主动确认。协议版本与本次申请关联保存。具体协议正文待业务与法务确认。</div>');break;
case 'account-info':dialog('账号信息',kv([['姓名',currentAccountName()],['手机号',currentMember()?.phone||org().contact],['当前组织',org().name],['当前身份',S.member?'组织成员':'组织管理员']]),btn('关闭','close'));break;
case 'my-agreements':dialog('我的协议',table(['协议','版本','确认场景','确认时间'],[tr(['组织入驻及合作协议','v1','组织入驻','2026-10-01 10:00']),tr([isMerchant?'经营协议':'公益机构及项目合作协议','v1',isMerchant?'店铺开通':'项目发布','2026-10-10 10:00'])]),btn('阅读协议正文','read-agreement'));break;
case 'password':form('修改密码',field('原密码','old','','password')+field('新密码','next','','password')+field('确认新密码','confirm','','password'),data=>{if(data.next!==data.confirm)return '两次输入的新密码不一致。';if(data.next.length<8||!/[A-Za-z]/.test(data.next)||!/[0-9]/.test(data.next))return '新密码至少 8 位，包含字母和数字。';closeOverlay();dialog('密码修改演示完成','<div class="hint">真实系统修改密码后原会话失效，需重新登录。原型未连接账号服务，未存储输入的密码。</div>',btn('返回工作台','close','','btn primary'));},'修改密码');break;
case 'product-new':productEditor();break;
case 'product-edit':closeOverlay();productEditor(id);break;
case 'product-detail':productDetail(id);break;
case 'order-product-detail':openOrderProduct(id);break;
case 'order-split-plan':closeSplitPlanHover();openOrderProduct(id,'分账计划');break;
case 'product-share':productShare(id,el);break;
case 'product-share-copy':{const p=scopedProduct(id);if(!isMerchant||!p||p.version<=0)break;const input=$('#product-share-url');try{await navigator.clipboard.writeText(productShareLink(p));toast('商品链接已复制');}catch{if(input){input.focus();input.select();toast('请复制已选中的商品链接');}}break;}
case 'product-share-save':{const p=scopedProduct(id);if(!isMerchant||!p||p.version<=0)break;const url=URL.createObjectURL(new Blob([productShareSvg(p)],{type:'image/svg+xml;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=p.id+'-商品二维码.svg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}

case 'product-price':priceEditor(id);break;
case 'inventory':inventory(id);break;
case 'sku-modal-batch':batchSkuModal();break;
case 'inventory-history':{const p=scopedProduct(id);if(!isMerchant||!p)break;subdialog('库存修改记录',logTable(D.logs.filter(l=>l.org===S.org&&(l.product===id||(!l.product&&l.object===p.name))&&l.action.startsWith('调整库存'))),'返回修改库存');$('#secondary .dialog').classList.add('inventory-history');break;}
case 'product-toggle':{const p=scopedProduct(id);if(!isMerchant||!p||!ensureEditable(p))break;reasonDialog(p.status==='在售'?'申请商品下架':'申请商品上架','审批通过后变更商品上架状态。',reason=>submitApplication(p.status==='在售'?'商品下架':'商品上架',p,{reason,status:p.status==='在售'?'已下架':'在售'}),merchantProductSummary(p),'提交申请');break;}
case 'customer-service-test':customerServiceTest(id);break;
case 'customer-service-directory':customerServiceDirectory();break;
case 'shop-donation-edit':shopDonationEditor();break;
case 'shop-donation-preview':shopDonationPreview();break;
case 'shop-module-edit':shopModuleEditor(id);break;
case 'shop-config':shopConfigEditor(id);break;

case 'shop-qualification-submit':shopQualificationSubmit(id);break;
case 'shop-qualification-add':shopQualificationEditor();break;
case 'shop-qualification-edit':shopQualificationEditor(id);break;
case 'shop-qualification-file':shopQualificationFile(id);break;
case 'shop-qualification-organization':openOrganizationQualifications();break;
case 'shop-subject-history':shopSubjectHistory();break;
case 'shop-identity':shopIdentity();break;
case 'shop-identity-material':shopIdentity(true);break;
case 'shop-file':shopFile(id);break;
case 'shop-logo-rules':shopLogoRules();break;
case 'application-media':applicationMedia(id);break;
case 'shop-donation-upload':shopDonationUpload();break;
case 'shop-license':shopLicense();break;
case 'shop-material-preview':shopMaterialPreview(id);break;
case 'member-remark':editMemberRemark(id);break;
case 'member-remove':removeMember(id);break;
case 'member-transfer':transferAdministrator();break;
case 'shop-edit':shopEditor();break;
case 'shop-draft':shopEditor(true);break;
case 'org-edit':orgEditor(id||S.tab);break;
case 'org-section-edit':orgEditor(id,null,true);break;
case 'org-members-edit':{if(!canManageMembers())break;const section=el.closest('[data-organization-section]');if(!section)break;const editing=section.classList.toggle('organization-members-edit');el.textContent=editing?'完成':'编辑';el.setAttribute('aria-pressed',String(editing));break;}
case 'org-submit':organizationSubmit();break;
case 'order':openOrderPage(id);break;
case 'order-remark':editOrderRemark(id,el);break;
case 'remark-remove-color':if(orderRemarkEditor){for(const input of document.querySelectorAll('[name=remarkColor]'))input.checked=false;updateRemarkEditor();}break;
case 'remark-clear-text':if(orderRemarkEditor){$('#remark-text').value='';updateRemarkEditor();$('#remark-text').focus();}break;
case 'remark-reuse':if(orderRemarkEditor){const text=orderRemarkEditor.recent[Number(id)];if(text!==undefined){$('#remark-text').value=text;updateRemarkEditor();$('#remark-text').focus();}}break;
case 'remark-clear-recent':if(orderRemarkEditor){orderRemarkEditor.recent=[];renderRecentRemarks();}break;
case 'remark-edit-name':if(orderRemarkEditor){const color=id,host=$('[data-remark-name="'+color+'"]');if(!host)break;const value=orderRemarkEditor.names[color]||remarkColors.find(([v])=>v===color)?.[1]||'';host.outerHTML='<span class="remark-name-editor"><input data-remark-label="'+color+'" aria-label="标签名称" maxlength="3" value="'+esc(value)+'"><span class="remark-name-count">'+value.length+'/3</span></span>';const input=$('[data-remark-label="'+color+'"]');input.focus();input.select();}break;
case 'after-evidence':previewEvidence(id);break;
case 'after-note':editAftersaleRecord(id);break;
case 'order-after':if(isMerchant)showOrderAction(id,'after',el);break;
case 'order-logistics':if(isMerchant){closeLogisticsHover();if(!isOrderPage&&el?.closest('.merchant-orders'))openOrderPage(id,'发货与物流');else showOrderAction(id,'logistics',el);}break;
case 'order-notifications':if(isMerchant)showOrderAction(id,'notifications',el);break;
case 'order-split':showOrderAction(id,'split',el);break;
case 'copy-waybill':{const permitted=D.orders.some(o=>allowedOrder(o)&&[...(C.canReceiver(o)?o.shipments||[]:[]),...(C.canAfter(o)?o.returnShipments||[]:[])].some(pkg=>pkg.waybill===id));if(!isMerchant||!permitted)break;try{await navigator.clipboard.writeText(id);toast('快递单号已复制');}catch{const body=field('快递单号','copyWaybill',id,'text',false);if($('#overlay').children.length)subdialog('复制快递单号',body,'返回');else dialog('复制快递单号',body,btn('关闭','close'));}break;}

case 'inspection-proof':previewInspectionProof(id);break;
case 'copy-child-order':{const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!o?.parentOrderId)break;try{await navigator.clipboard.writeText(o.id);toast('子单号已复制');}catch{dialog('复制子单号',field('子单号','childOrderNumber',o.id,'text',false),btn('关闭','close'));}break;}
case 'copy-order':{const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!o)break;try{await navigator.clipboard.writeText(orderGroupId(o));toast('订单编号已复制');}catch{dialog('复制订单编号',field('订单编号','orderNumber',orderGroupId(o),'text',false),btn('关闭','close'));}break;}

case 'widen':S.wide=!S.wide;openOrder(S.order);break;
case 'ship':shipOrder(id,el);break;
case 'refund':refund(id);break;
case 'copy-receiver':{const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o?.receiver||!C.canReceiver(o))break;const text=o.receiver;try{await navigator.clipboard.writeText(text);record(id,'复制收货信息',o.project);toast('收货信息已复制');}catch{dialog('收货信息',field('可选中并复制','receiver',o.receiver,'textarea',false,true),btn('关闭','close'));}break;}
case 'reject-order':rejectUnshippedOrder(id);break;
case 'after-accept':{const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o||o.after!=='待处理')break;if(!o.returnAddress){toast('请先补全退货地址');break;}o.after='待买家退货';o.afterApprovedAt=R.stamp(demoNow.getTime());addAftersaleRecord(o,'审批结果：同意寄回，已保存退货地址快照');record(id,'同意寄回，保存退货地址快照',o.project);refreshOrderAction(id,'售后信息',orderActionContext());toast('已同意寄回，等待买家退货');break;}
case 'after-reject':{if(D.features?.merchantAfterReject!==true){toast('售后不通过暂未开放');break;}const o=D.orders.find(x=>x.id===id&&allowedOrder(x));if(!isMerchant||!o||o.after!=='待处理')break;const afterId=o.afterId;reasonDialog('拒绝售后','填写拒绝原因，处理意见随售后单保存。',reason=>{if(D.features?.merchantAfterReject!==true)return '售后不通过暂未开放';if(!allowedOrder(o)||o.after!=='待处理'||o.afterId!==afterId)return '售后状态已变化，请刷新后处理。';o.after='已拒绝';o.afterCloseReason=reason;o.split='待分账';addAftersaleRecord(o,'审批结果：拒绝售后；'+reason);record(id,'拒绝售后：'+reason,o.project);},'','确认拒绝');break;}
case 'notify-order':{if(isMerchant)contactSystemAdmin(id);break;}
case 'expand':S.expanded=S.expanded===id?'':id;render();break;
case 'order-settlement':{if(isMerchant){openOrder(id,'分账记录');break;}if(isOrderPage){const url=new URL('index.html',location.href);url.search=new URLSearchParams({view:'settlement',order:id,org:S.org,demoAccount:S.demoAccount});location.href=url.href;break;}const o=D.orders.find(x=>x.id===id);if(!o||!allowedOrder(o))break;S.origin={page:S.page,tab:S.tab,project:S.project,projectTab:S.projectTab,product:S.product,activity:S.activity,quick:S.quick,filters:JSON.parse(JSON.stringify(S.filters))};closeOverlay();S.page=isMerchant?'orders':'settlement';S.tab='分账对账';S.project='';S.product='';S.activity='';S.filters[filterKey()]=isMerchant?{q:id}:settlementOrderFilter(id);render();$('#main').insertAdjacentHTML('afterbegin',btn(icon('arrow')+'返回来源列表','settlement-back','','back'));break;}
case 'settlement-back':{if(S.origin){const origin=S.origin;Object.assign(S,origin);S.origin=null;render();}break;}
case 'application':applicationDialog(id);break;
case 'application-object':{const application=D.applications.find(x=>x.object===id&&x.org===S.org);if(application)applicationDialog(application.id);break;}
case 'withdraw':{const a=D.applications.find(x=>x.id===id&&x.org===S.org);if(a?.status!=='待审批')break;a.approvalStages=a.approvalStages||a.stage.split(' → ');a.submittedAt=a.submittedAt||a.date;a.withdrawnAt=R.stamp(Date.now());a.date=a.withdrawnAt;a.status='草稿';a.stage='未提交';if(product(a.object))product(a.object).review='草稿';record(a.title,'撤回申请 v'+a.version);closeOverlay();render();toast('已撤回并恢复草稿，可继续修改');break;}
case 'resubmit':{const a=D.applications.find(x=>x.id===id&&x.org===S.org);if(!a||!['草稿','已撤回','已驳回'].includes(a.status)||a.who!==currentAccountName())break;closeOverlay();if(product(a.object)&&/商品上架|商品下架/.test(a.type)){const p=product(a.object);reasonDialog(a.type,'审批通过后变更商品上架状态。',reason=>submitApplication(a.type,p,{reason,status:a.snapshot.status}),merchantProductSummary(p),'提交申请');}else if(product(a.object)&&a.type==='商品价格变更')priceEditor(a.object);else if(product(a.object))productEditor(a.object);else if(project(a.object))projectEditor(a.object);else if(activity(a.object)){S.project=activity(a.object).project;activityEditor(a.object);}else if(a.snapshot?.orgSections&&a.type==='组织资料变更'){navigate('organization');orgEditor(a.snapshot.orgSections[0],a);}else if(a.type==='组织主体资料变更'){navigate('organization');orgEditor('资质材料',a);}else if(a.type.includes('组织'))orgEditor(a.snapshot?.orgSection||(a.snapshot?.bank!=null?'收款资料':'基本资料'),a);else if(a.type==='店铺经营资质变更'){if(Object.hasOwn(a.snapshot,'inheritOrganizationLicense')&&!a.qualificationId)shopQualificationSubmit(a.id);else shopQualificationEditor('',a);}else if(a.type==='店铺捐赠协议变更')shopDonationUpload(a);else if(a.type==='店铺每单捐协议变更')shopDonationEditor(a);else if(a.type==='店铺资料变更'&&a.snapshot?.configSection)shopConfigEditor(a.snapshot.configSection,a);else if(a.type.includes('店铺'))shopEditor(a.type==='店铺开通',a);break;}
case 'join':joinDialog(id);break;
case 'join-approve':{const j=D.joins.find(x=>x.id===id&&x.org===S.org);if(S.member||j?.status!=='待审批')break;j.status='已通过';D.members.push({id:'U'+Date.now(),org:S.org,name:j.name,phone:j.phone,role:'组织成员',accountKey:'joined-'+j.id,shopIds:[],permissions:[],remark:j.remark||''});record(j.name,'成员加入审批通过');C.persist();closeOverlay();render();toast('已通过，成员可使用本组织授权功能');break;}
case 'join-reject':{const j=D.joins.find(x=>x.id===id&&x.org===S.org);if(S.member||j?.status!=='待审批')break;reasonDialog('驳回成员申请','请填写驳回原因。',reason=>{j.status='已驳回';j.reason=reason;C.persist();record(j.name,'成员加入审批驳回：'+reason);});break;}
case 'project':if(!scopedProject(id))break;S.page='projects';S.tab=workspaceDefaultTab(S.page);S.project=id;S.projectTab='基本信息';S.product='';S.activity='';render();break;
case 'projects-back':S.page='projects';S.tab=workspaceDefaultTab(S.page);S.project='';S.product='';S.activity='';render();break;
case 'project-new':projectEditor();break;
case 'project-edit':projectEditor(id);break;
case 'project-product':if(!S.project||!scopedProduct(id))break;S.product=id;S.projectTab='关联商品';render();break;
case 'goods-back':S.product='';render();break;
case 'project-offline':{const p=scopedProject(id);if(!p||p.status!=='已发布')break;reasonDialog('项目下线','项目及其所属活动、行动停止公开展示与新参与；已有报名及参会按原安排执行。',reason=>{p.status='已下线';p.reason=reason;D.activities.filter(a=>a.project===id&&activityOngoing(a)).forEach(a=>{a.projectHidden=true;});record(p.name,'项目下线：'+reason,p.id);});break;}
case 'project-restore':{const p=scopedProject(id);if(p?.status!=='已下线')break;if(p.end<'2026-10-30'){toast('项目已超过有效期，无法恢复新参与');break;}p.status='已发布';D.activities.filter(a=>a.project===id).forEach(a=>a.projectHidden=false);record(p.name,'恢复项目展示',p.id);render();toast('已按项目及关联活动有效期恢复展示');break;}
case 'activity-new':{
 if(!S.project&&['activities','actions'].includes(S.page)){
  const projects=myProjects();if(!projects.length){toast('请先新建项目');break;}
  form('选择所属项目',select('所属项目','project',projects.map(p=>[p.id,p.name])),data=>{if(!scopedProject(data.project))return '请选择所属项目。';S.project=data.project;closeOverlay();render();activityEditor('',id);},'继续');
 }else activityEditor('',id);break;
}
case 'activity-news':{const item=activity(id);if(!item||!scopedProject(item.project)||item.status!=='已结束')break;S.project=item.project;activityEditor('',item.kind);$('#edit-form [name=template]').value='宣发类';renderTemplateFields({...item,template:'宣发类',related:id,end:'2026-12-01T18:00'});$('#edit-form [name=name]').value=item.name+' · 活动资讯';window.WorkbenchContentPreview?.update();break;}
case 'activity-edit':activityEditor(id);break;
case 'activity':{const a=activity(id);if(!a||!scopedProject(a.project))break;if(!['activities','actions'].includes(S.page))openFoundationActivities(a.kind,a.project,false);S.activity=id;S.activityTab='基本信息';render();break;}
case 'activity-todo':{const [activityId,type]=id.split(':'),a=activity(activityId);if(!a||!scopedProject(a.project))break;const todo=activityTodos(a).find(t=>t.type===type);if(!todo)break;if(!['activities','actions'].includes(S.page))openFoundationActivities(a.kind,a.project,false);S.activity=a.id;S.activityTab=todo.section;render();break;}
case 'activity-back':S.activity='';render();break;
case 'activity-stop-registration':{const obj=activity(id);if(!obj||!scopedProject(obj.project)||obj.status!=='已发布')break;reasonDialog('停止报名','停止新增报名，活动 / 行动照常举行；已报名人员的资料与参与资格保留，已有报名继续审核。',reason=>{if(obj.status!=='已发布')return '状态已变化，请刷新后处理。';obj.status='已停止报名';obj.registrationStopReason=reason;obj.noticePending=true;obj.notice='报名已停止，活动 / 行动照常举行，已有参与资格保留';record(obj.name,'停止报名：'+reason,obj.project);},'','确认停止报名');break;}
case 'activity-cancel':{const obj=activity(id);if(!obj||!scopedProject(obj.project)||!canCancelActivity(obj))break;reasonDialog(activityCancelLabel(obj),'停止新参与，保留已有记录，并通知受影响用户。',reason=>{if(!canCancelActivity(obj))return '当前活动无法取消，请刷新后处理。';obj.status='已取消';obj.noticePending=true;obj.notice=obj.status+'通知';record(obj.name,obj.status+'：'+reason,obj.project);});break;}
case 'activity-postpone':{const obj=activity(id),p=scopedProject(obj?.project);if(!obj||!p)break;form('捐赠参会活动延期',window.MerchantDateRange.editorField('延期后的活动时间','start','end',obj.start,obj.end,dateValue(demoNow))+field('延期原因','reason','','textarea',true,true)+consent(),data=>{if(!data.start||!data.end||new Date(data.start)<=new Date(obj.start))return '延期后的开始时间必须晚于原开始时间。';if(new Date(data.start)>=new Date(data.end)||new Date(data.end)>new Date(p.end))return '开始须早于结束，且结束不得晚于项目结束时间。';if(!data.agreement)return '请确认适用协议。';const error=submitApplication('项目活动延期',obj,data);if(error)return error;closeOverlay();render();toast('延期版本已提交审批，原参会资格保留');},'提交延期审批');break;}
case 'registration':registrationDialog(id);break;
case 'registration-approve':{const r=D.registrations.find(x=>x.id===id),obj=activity(r?.activity);if(!r||!scopedProject(obj?.project)||!activityOngoing(obj)||r.status!=='待审核')break;if(D.registrations.filter(x=>x.activity===obj.id&&x.status==='已录取').length>=obj.capacity){toast('剩余录取名额不足');break;}r.status='已录取';record(obj.name,'报名审核录取 '+r.name,obj.project);closeOverlay();render();toast('录取成功，结果已记录');break;}
case 'registration-reject':{const r=D.registrations.find(x=>x.id===id),obj=activity(r?.activity);if(!r||!scopedProject(obj?.project)||!activityOngoing(obj)||r.status!=='待审核')break;reasonDialog('报名未通过','请填写未通过原因，保留报名与审核记录。',reason=>{r.status='未通过';r.reason=reason;record(obj.name,'报名审核未通过 '+r.name+'：'+reason,obj.project);});break;}
case 'meeting':meetingForm(id);break;
case 'meeting-list':{const a=activity(id);if(!a||!scopedProject(a.project))break;dialog('腾讯会议手动导入名单',table(['姓名','腾讯会议账号绑定手机号','资格','导入情况'],D.registrations.filter(r=>r.activity===id&&r.status==='资格有效').map(r=>tr([r.name,r.meetingPhone,badge(r.status),r.imported?'已记录导入':'待手动导入'])))+'<p class="description">使用以上腾讯会议账号绑定手机号，在腾讯会议商业版 / 企业版手动导入。本原型不调用腾讯会议。</p>',btn('关闭','close'));break;}
case 'meeting-import':{const r=D.registrations.find(x=>x.id===id),a=activity(r?.activity);if(!r||!scopedProject(a?.project)||r.status!=='资格有效')break;r.imported=true;record(a.name,'记录手动导入 / 签到 '+r.name,a.project);render();toast('已记录名单处理结果');break;}
case 'revoke':{const r=D.registrations.find(x=>x.id===id),obj=activity(r?.activity);if(!r||!scopedProject(obj?.project)||r.status!=='资格有效')break;reasonDialog('取消参会资格','取消后释放名额，线上名单需同步手动移除；捐赠记录保留。',reason=>{r.status='资格已取消';r.imported=false;obj.noticePending=true;obj.notice='参会资格取消通知';record(obj.name,'取消资格 '+r.name+'：'+reason,obj.project);});break;}
case 'notify-activity':{const a=activity(id);if(!a||!scopedProject(a.project))break;a.noticePending=true;a.notice='重新通知已提交，等待渠道回执';record(a.name,'重新通知',a.project);render();toast('已记录通知重试');break;}
case 'preview-project':preview('project',id);break;
case 'preview-product':preview('product',id,productEditState?.historicalProduct);break;
case 'preview-application':{const a=D.applications.find(x=>x.id===id&&x.org===S.org);if(a)preview('project',a.object,{...project(a.object),...a.snapshot});break;}
}
}
document.addEventListener('pointerover',e=>{const anchor=e.target.closest('[data-action="order-split-plan"]');if(anchor&&e.pointerType!=='touch'&&!anchor.contains(e.relatedTarget))queueSplitPlanHover(anchor);});
document.addEventListener('pointerout',e=>{const anchor=e.target.closest('[data-action="order-split-plan"]');if(anchor&&!anchor.contains(e.relatedTarget))scheduleSplitPlanHoverClose();});
document.addEventListener('focusin',e=>{const anchor=e.target.closest('[data-action="order-split-plan"]');if(anchor)queueSplitPlanHover(anchor);if(e.target.closest('#order-split-plan-hover'))clearTimeout(splitPlanHoverCloseTimer);});
document.addEventListener('focusout',e=>{if(e.target.closest('[data-action="order-split-plan"],#order-split-plan-hover')&&!e.relatedTarget?.closest('#order-split-plan-hover'))scheduleSplitPlanHoverClose();});
window.addEventListener('resize',closeSplitPlanHover);
document.addEventListener('scroll',e=>{if(e.target.closest?.('#order-split-plan-hover'))return;const anchor=document.querySelector('[data-action="order-split-plan"]:hover');closeSplitPlanHover();if(anchor)queueSplitPlanHover(anchor);},true);
document.addEventListener('change',e=>{if(!e.target.matches('[data-order-plan-sku]'))return;const o=D.orders.find(o=>o.id===e.target.dataset.id);if(o&&allowedOrder(o)){renderOrderSplitPlanSnapshot(o,e.target.value);$('[data-order-plan-sku]')?.focus();}});
document.addEventListener('pointerover',e=>{const anchor=e.target.closest('.merchant-orders [data-action="order-logistics"]');if(anchor&&e.pointerType!=='touch'&&!anchor.contains(e.relatedTarget))queueLogisticsHover(anchor);});
document.addEventListener('pointerout',e=>{const anchor=e.target.closest('.merchant-orders [data-action="order-logistics"]');if(anchor&&!anchor.contains(e.relatedTarget))scheduleLogisticsHoverClose();});
document.addEventListener('focusin',e=>{const anchor=e.target.closest('.merchant-orders [data-action="order-logistics"]');if(anchor)queueLogisticsHover(anchor);if(e.target.closest('#order-logistics-hover'))clearTimeout(logisticsHoverCloseTimer);});
document.addEventListener('focusout',e=>{if(e.target.closest('.merchant-orders [data-action="order-logistics"],#order-logistics-hover')&&!e.relatedTarget?.closest('#order-logistics-hover'))scheduleLogisticsHoverClose();});
document.addEventListener('toggle',e=>{if(!e.target.matches?.('.context-picker')||!e.target.open)return;for(const picker of document.querySelectorAll('.context-picker[open]'))if(picker!==e.target)picker.open=false;},true);
document.addEventListener('click',e=>{if(!e.target.closest('.context-picker'))closeContextPickers();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.context-picker[open]')){e.preventDefault();e.stopImmediatePropagation();closeContextPickers(true);return;}if(e.key==='Escape')closeLogisticsHover();});
document.addEventListener('scroll',e=>{if($('#order-logistics-hover')&&!e.target.closest?.('#order-logistics-hover'))closeLogisticsHover();},true);
window.addEventListener('resize',closeLogisticsHover);
document.addEventListener('input',e=>{if(!e.target.matches('.analytics-goal-table input'))return;const inputs=[...document.querySelectorAll('.analytics-goal-table input')],value=Number(e.target.value),progress=document.querySelector('[data-goal-progress="'+e.target.name+'"]');progress.textContent=e.target.value!==''&&Number.isFinite(value)&&value>0?(Number(e.target.dataset.goalPaid)/value*100).toFixed(2)+'%':'--';const total=inputs.reduce((n,input)=>n+(input.value!==''&&input.validity.valid?Number(input.value):0),0),summary=document.querySelector('[data-goal-total-progress]');document.querySelector('[data-goal-total]').textContent=total.toFixed(2);summary.textContent=total?(Number(summary.dataset.goalTotalPaid)/total*100).toFixed(2)+'%':'--';});
document.addEventListener('change',e=>{if(!isMerchant||S.page!=='analytics')return;if(e.target.matches('[data-analytics-day]')){const next={range:'自定义',from:e.target.value,to:e.target.value};if(!window.MerchantAnalytics.range(next,'2026-11-02 15:00')){toast('请选择有效日期');return;}Object.assign(analyticsState,next);render();}if(e.target.matches('[data-analytics-metric]')){analyticsState.metric=e.target.value;render();}if(e.target.matches('[data-analytics-column]')){const columns=[...document.querySelectorAll('[data-analytics-column]:checked')].map(el=>el.dataset.analyticsColumn);if(!columns.length){e.target.checked=true;toast('请至少保留一个数据指标');return;}analyticsState.columns=columns.join(',');render();}});
document.addEventListener('input',e=>{if(e.target.matches('#pe-title,[data-pe-parameter-name],[data-pe-parameter-value],[data-sku=price],[name=shippingHours]'))updateProductMobilePreview();});
document.addEventListener('pointerdown',e=>{if(e.target.closest('.pe-recipient-combo button'))e.preventDefault();else if(!e.target.closest('.pe-recipient-combo'))closeRecipientOptions();});
 document.addEventListener('input',e=>{if(e.target.matches('[data-pe-split-recipient]')){const clear=e.target.parentElement.querySelector('.pe-recipient-clear');if(clear)clear.hidden=!e.target.value;openRecipientOptions(e.target,true);}});
 document.addEventListener('keydown',e=>{
  const input=e.target.closest('[data-pe-split-recipient]');if(!input||input.readOnly)return;
  const list=document.getElementById(input.getAttribute('aria-controls'));if(!list)return;
  if(e.key==='Escape'&&input.getAttribute('aria-expanded')==='true'){e.preventDefault();e.stopImmediatePropagation();closeRecipientOptions();return;}
  if(['ArrowDown','ArrowUp'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();if(input.getAttribute('aria-expanded')!=='true')openRecipientOptions(input);
   const options=[...list.querySelectorAll('[role=option]')].filter(o=>!o.hidden&&!o.disabled),index=options.findIndex(o=>o.classList.contains('active'));
   options.forEach(o=>o.classList.remove('active'));const next=options[index<0?(e.key==='ArrowDown'?0:options.length-1):(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length];
   if(next){next.classList.add('active');next.scrollIntoView({block:'nearest'});}return;
  }
  if(e.key==='Enter'&&input.getAttribute('aria-expanded')==='true'){e.preventDefault();e.stopImmediatePropagation();const option=list.querySelector('.active')||[...list.querySelectorAll('[role=option]')].find(o=>!o.hidden&&!o.disabled);option?.click();}
  if(e.key==='Tab')closeRecipientOptions();
 },true);
 window.addEventListener('resize',closeRecipientOptions);
 document.addEventListener('scroll',e=>{if(e.target.closest?.('.pe-recipient-options'))return;document.querySelectorAll('.pe-recipient-options:popover-open').forEach(list=>{const input=document.querySelector('[aria-controls="'+list.id+'"]'),rect=input.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)closeRecipientOptions();else positionRecipientOptions(input,list);});},true);
document.addEventListener('click',e=>{if(!e.target.closest('.product-name-filter'))closeProductOptions();for(const menu of document.querySelectorAll('.order-label-menu[open]'))if(!menu.contains(e.target))menu.open=false;const el=e.target.closest('[data-action]'); if(el)handle(el.dataset.action,el.dataset.id,el).then(publishOrderChange).catch(err=>{console.error(err);toast('操作未完成，请检查当前输入');});});
document.addEventListener('input',e=>{if(e.target.matches('[name=remarkText]')&&$('#remark-count'))updateRemarkEditor();if(e.target.matches('[data-remark-label]'))e.target.parentElement.querySelector('.remark-name-count').textContent=e.target.value.length+'/3';});
document.addEventListener('change',e=>{if(e.target.matches('[name=remarkColor]'))updateRemarkEditor();});
document.addEventListener('blur',e=>{if(e.target.matches('[data-remark-label]'))finishRemarkName(e.target);},true);
document.addEventListener('change',e=>{
 if(isMerchant||S.page!=='settlement'||!e.target.closest('#settlement-scope-form'))return;
 const form=e.target.closest('form');applySettlementScope(form.elements.settlementOrg.value,e.target.name==='settlementOrg'?'':form.elements.settlementProduct.value);
});
document.addEventListener('submit',e=>{if(e.target.id!=='settlement-scope-form')return;e.preventDefault();if(!isMerchant&&S.page==='settlement')applySettlementScope(e.target.elements.settlementOrg.value,e.target.elements.settlementProduct.value);});
document.addEventListener('submit',e=>{
 if(e.target.id!=='settlement-date-form'||isMerchant||S.page!=='settlement')return;
 e.preventDefault();const values=Object.fromEntries(new FormData(e.target)),valid=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00'))&&dateValue(new Date(value+'T00:00:00')).slice(0,10)===value;
 let error='';if(!valid(values.from)||!valid(values.to))error='请选择完整、有效的开始和结束日期';else if(values.from>values.to)error='开始日期不能晚于结束日期';else if(values.to>dateValue(demoNow).slice(0,10))error='结束日期不能晚于统计日期';
 if(error){e.target.querySelector('.settlement-date-error').textContent=error;return;}
 S.filters[filterKey()]={...f(),settlementRange:'自定义',from:values.from,to:values.to};render();
});
document.addEventListener('submit',e=>{if(e.target.id==='filter-form'){e.preventDefault();const query=Object.fromEntries(new FormData(e.target));if(query.from&&query.to&&query.from>query.to){toast('开始时间不能晚于结束时间');return;}if(query.afterFrom&&query.afterTo&&query.afterFrom>query.afterTo){toast('申请开始时间不能晚于结束时间');return;}if(!isMerchant&&['activities','actions'].includes(S.page)){S.project=scopedProject(query.activityProject)?.id||'';delete query.activityProject;}S.filters[filterKey()]=query;render();return;}if(e.target.id!=='edit-form')return;e.preventDefault();const handler=formHandler;if(!handler)return;const data=Object.fromEntries(new FormData(e.target)),intent=e.submitter?.value||'submit';const error=handler(data,intent);if(error&&$('#form-error')){$('#form-error').textContent=error;$('#form-error').scrollIntoView({block:'nearest'});}});
document.addEventListener('submit',e=>{
 if(!isMerchant||S.page!=='analytics'||!['analytics-date-form','analytics-detail-date-form','analytics-product-date-form','analytics-goods-form','analytics-pilot-form'].includes(e.target.id))return;
 e.preventDefault();const values=Object.fromEntries(new FormData(e.target));
 if(e.target.id==='analytics-pilot-form'){const ids=(values.pilotIds||'').trim().split(/[\s,，]+/).filter(Boolean);if(ids.length>10){toast('商品ID最多输入10个');return;}Object.assign(analyticsState,{pilotIds:values.pilotIds.trim(),pilotName:values.pilotName.trim()});render();return;}
 if(e.target.id!=='analytics-goods-form'){const detail=['analytics-detail-date-form','analytics-product-date-form'].includes(e.target.id),next={range:'自定义',from:values.from,to:values.to};if(!window.MerchantAnalytics.range(next,'2026-11-02 15:00')){toast('请选择有效日期，开始日期不能晚于结束日期，范围最多 366 天。');return;}Object.assign(analyticsState,detail?{detailRange:'自定义',detailFrom:values.from,detailTo:values.to}:next);}
 else analyticsState.query=values.query;render();
});
document.addEventListener('change',async e=>{if(e.target.name==='format'&&e.target.closest('#edit-form')){syncActivityLocation();window.WorkbenchContentPreview?.update();}if(e.target.closest('#registration-fields')&&['skills','skillsInput'].includes(e.target.name))syncRegistrationRequirements();if(e.target.matches('[name=shippingHours],[name=sevenDayReturn],[name=pickupAfter],[name=returnAuto],[name=donationMode],[name=project]'))updateProductMobilePreview();if(e.target.matches('[data-shipping-region]'))$('#pe-region-count').textContent=$('#secondary').querySelectorAll('[data-shipping-region]:checked').length;if(e.target.matches('[data-stock-mode]'))updateSkuModal(e.target);if(e.target.closest('.product-editor'))productEditorChange(e.target).catch(err=>{console.error(err);toast('图片处理失败，请重新选择');});if(e.target.name==='afterTimeRange'){const range=orderDateRange(e.target.value),form=e.target.closest('form');if(e.target.value!=='自定义'){form.elements.afterFrom.value=range.from;form.elements.afterTo.value=range.to;}}if(['afterFrom','afterTo'].includes(e.target.name)&&e.target.closest('.time-filter'))e.target.closest('form').elements.afterTimeRange.value='自定义';if(e.target.name==='timeRange'){const range=orderDateRange(e.target.value),form=e.target.closest('form');if(e.target.value!=='自定义'){form.elements.from.value=range.from;form.elements.to.value=range.to;}}if(['from','to'].includes(e.target.name)&&e.target.closest('.time-filter'))e.target.closest('form').elements.timeRange.value='自定义';if(e.target.id==='task-shop'){S.taskShop=e.target.value;render();}if(e.target.id==='shop-select'){if(!authorizedShops().some(s=>s.id===e.target.value))return;S.shop=e.target.value;S.filters={};S.project='';S.product='';S.quick='全部订单';if(isOrderPage){navigate('orders');return;}closeOverlay();render();}if(e.target.id==='org-select'){const targetOrg=authorizedOrganizations().find(o=>o.id===e.target.value);if(!targetOrg)return;if(targetOrg.role!==role){const url=new URL(targetOrg.role==='merchant'?'../02-merchant/index.html':'../03-foundation/index.html',location.href);url.search=new URLSearchParams({org:targetOrg.id,demoAccount:S.demoAccount});location.href=url.href;return;}S.accountId='';S.org=e.target.value;S.shop='';S.taskShop='';syncMembership();S.filters={};S.origin=null;S.quick='全部订单';navigate(navItems()[0][0]);}if(e.target.matches('[data-donation-mode]'))syncDonationRequirements();if(e.target.name==='template'&&$('#template-fields')){const a=window.WorkbenchContentPreview?.snapshot()||activity(S.activity)||{project:S.project,kind:!isMerchant&&['activities','actions'].includes(S.page)?foundationActivityKind():S.projectTab,start:'2026-11-20T14:00',end:'2026-11-20T17:00',deadline:'2026-11-18T18:00',capacity:20,limit:30,contact:org().admin,location:'',amount:50};const values=Object.fromEntries(new FormData($('#edit-form')));renderTemplateFields({...a,...values});}if(e.target.name==='pickup'&&e.target.closest('#filter-form'))e.target.closest('form').requestSubmit();if(e.target.name==='activityImages'){activityMedia=await Promise.all([...e.target.files].map(file=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve({name:file.name,src:reader.result});reader.readAsDataURL(file);})));}if(e.target.type==='file'&&!e.target.dataset.managedPreview){const preview=e.target.parentElement.querySelector('.media-preview');if(preview){preview.innerHTML='';for(const file of e.target.files){if(!file.type.startsWith('image/'))continue;const url=URL.createObjectURL(file);previewUrls.push(url);const img=document.createElement('img');img.src=url;img.alt=file.name;preview.appendChild(img);}}}});
document.addEventListener('input',e=>{if(e.target.hasAttribute('data-pe-random-bound')){productSplitPlanSku()[e.target.dataset.peRandomBound]=e.target.value;applyProductSplitPlan();updateSplitPreview();}if(e.target.name==='donationRatio')updateSplitPreview();if(e.target.closest('.sku-modal'))updateSkuModal(e.target);if(e.target.id==='order-product-name'){$('#filter-form [name=productId]').value='';openProductOptions(true);}if(e.target.closest('#sku-rows'))updateProductStock(e.target);else if(e.target.hasAttribute('data-pe-split-amount')){const sku=productSplitPlanSku();productSplitRecipients(sku)[Number(e.target.dataset.peSplitAmount)].amount=e.target.value;applyProductSplitPlan();updateSplitPreview();}else if(e.target.hasAttribute('data-pe-split-fund')){productSplitPlanSku().fund=e.target.value;applyProductSplitPlan();updateSplitPreview();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#order-split-plan-hover')){e.preventDefault();closeSplitPlanHover();return;}const labelMenu=$('.order-label-menu[open]');if(e.key==='Escape'&&labelMenu&&!$('#overlay').children.length){e.preventDefault();labelMenu.open=false;labelMenu.querySelector('summary').focus();return;}if(e.target.matches('[data-remark-label]')&&['Enter','Escape'].includes(e.key)){e.preventDefault();finishRemarkName(e.target,e.key==='Escape');return;}const combo=e.target.closest('.product-name-filter');if(combo){const list=$('#order-product-options');if(e.key==='Escape'&&!list.hidden){e.preventDefault();closeProductOptions();$('#order-product-name').focus();return;}if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();if(list.hidden)openProductOptions(true);const options=[...list.querySelectorAll('.product-option')].filter(o=>!o.hidden);if(options.length){const index=options.indexOf(document.activeElement);options[index<0?(e.key==='ArrowDown'?0:options.length-1):(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length].focus();}return;}}if(e.key==='Escape'){if($('.pe-stock-fullscreen')&&!$('#secondary')){peInventoryFullscreen(false);return;}if($('#secondary'))closeSecondary();else if($('#overlay').children.length)cancelOverlay();else if($('.analytics-data-dialog')){analyticsState.productId='';analyticsState.region='';render();}else if($('.sidebar.open')){ $('.sidebar').classList.remove('open');$('.mobile-cover').classList.remove('visible');}return;}if(e.key!=='Tab')return;const overlay=$('#secondary')||$('.pe-stock-fullscreen')||$('#overlay [role=dialog]')||$('.analytics-data-dialog');if(!overlay)return;const items=[...overlay.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&x.getClientRects().length),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}});
function finishSpecValueDrag(){
 if(draggedSpecValue?.element)draggedSpecValue.element.classList.remove('is-dragging');
 $('#pe-value-sort-list')?.classList.remove('is-sorting');draggedSpecValue=null;
}
function beginSpecValueDrag(item){
 draggedSpecValue={element:item,lastX:NaN,lastY:NaN};item.classList.add('is-dragging');$('#pe-value-sort-list').classList.add('is-sorting');
}
function previewSpecValueSort(x,y){
 const list=$('#pe-value-sort-list'),drag=draggedSpecValue;
 if(!productValueSort||!list||!drag?.element)return;
 if(Math.abs(x-drag.lastX)<3&&Math.abs(y-drag.lastY)<3)return;
 drag.lastX=x;drag.lastY=y;
 const source=drag.element,items=[...list.children],hit=document.elementFromPoint(x,y)?.closest('[data-pe-sort-value]');
 if(hit===source)return;
 if(hit&&hit.parentElement===list){
  const from=items.indexOf(source),to=items.indexOf(hit);list.insertBefore(source,from<to?hit.nextSibling:hit);
 }else{
  const bounds=list.getBoundingClientRect();if(x<bounds.left||x>bounds.right||y<bounds.top||y>bounds.bottom)return;
  const next=items.filter(item=>item!==source).find(item=>{const box=item.getBoundingClientRect();return y<box.top||y<=box.bottom&&x<box.left+box.width/2;});
  list.insertBefore(source,next||null);
 }
 productValueSort.order=[...list.children].map((item,pos)=>{item.dataset.peSortPosition=pos;item.setAttribute('aria-label',item.textContent+'，第 '+(pos+1)+' 项');return Number(item.dataset.peSortValue);});
}
document.addEventListener('dragstart',e=>{
 const item=e.target.closest('[data-pe-sort-position]');if(!item)return;
 beginSpecValueDrag(item);e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',item.dataset.peSortValue);
});
document.addEventListener('dragover',e=>{
 if(!draggedSpecValue?.element||!e.target.closest('#pe-value-sort-list'))return;
 e.preventDefault();e.dataTransfer.dropEffect='move';previewSpecValueSort(e.clientX,e.clientY);
});
document.addEventListener('drop',e=>{
 if(!draggedSpecValue?.element||!e.target.closest('#pe-value-sort-list'))return;
 e.preventDefault();const source=draggedSpecValue.element;finishSpecValueDrag();source.focus();
});
document.addEventListener('dragend',finishSpecValueDrag);
let specSortTouch=null;
document.addEventListener('pointerdown',e=>{
 const item=e.target.closest('[data-pe-sort-position]');if(!item||e.pointerType==='mouse')return;
 specSortTouch={item,id:e.pointerId,x:e.clientX,y:e.clientY};item.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove',e=>{
 if(!specSortTouch||specSortTouch.id!==e.pointerId)return;
 if(!draggedSpecValue&&Math.hypot(e.clientX-specSortTouch.x,e.clientY-specSortTouch.y)<5)return;
 e.preventDefault();if(!draggedSpecValue)beginSpecValueDrag(specSortTouch.item);previewSpecValueSort(e.clientX,e.clientY);
});
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,e=>{
 if(!specSortTouch||specSortTouch.id!==e.pointerId)return;finishSpecValueDrag();specSortTouch=null;
});
document.addEventListener('keydown',e=>{const item=e.target.closest('[data-pe-sort-position]');if(!item||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const index=Number(item.dataset.peSortPosition);moveSpecValue(index,index+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1));});
let draggedProductImage='';
document.addEventListener('dragstart',e=>{const item=e.target.closest('[data-pe-drag]');if(item){draggedProductImage=item.dataset.peDrag;e.dataTransfer.setData('text/plain',draggedProductImage);}});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-pe-drag]'))e.preventDefault();});
document.addEventListener('drop',e=>{const item=e.target.closest('[data-pe-drag]');if(!item||!draggedProductImage)return;e.preventDefault();const [group,from]=draggedProductImage.split('.'),[toGroup,to]=item.dataset.peDrag.split('.');if(group===toGroup){const [file]=productEditState[group].splice(+from,1);productEditState[group].splice(+to,0,file);renderProductMedia();}draggedProductImage='';});
C=window.WorkbenchCollaboration.create({D,S,esc,btn,link,table,tr,badge,form,field,select,checkbox,heading,toast,render,closeOverlay,record,dialog,merchantHeading,currentMember,currentShop,currentAccountName,myProducts,shippingUnitIndexes,activeAfter,afterStage,syncAftersale,remarkOrder:()=>orderRemarkEditor?.id});
R.splitPartialOrders(D.orders);C.persist();
for(const entity of [...D.orders,...D.products,...D.shops,...D.organizations,...D.projects,...D.activities,...D.members])auditSnapshots.set(entity.id,auditSnapshot(entity));
if(isOrderPage){S.org=authorizedOrganizations().find(o=>o.id===orderParams.get('org')&&o.role===role)?.id||authorizedOrganizations().find(o=>o.role===role)?.id||S.org;S.shop=authorizedShops().find(s=>s.id===orderParams.get('shop'))?.id||availableShop()?.id||'';syncMembership();render();}else{restoreWorkspaceRoute();routeReady=true;syncWorkspaceRoute(true);}
if(isOrderPage&&window.opener)window.opener.postMessage({type:'workbench-order-ready'},'*');else if(isOrderPage)document.body.dataset.orderReady='true';

document.addEventListener('paste',e=>{
 const input=e.target.closest('[data-pe-sheet]');if(!input||productEditState?.readOnly)return;const text=e.clipboardData?.getData('text/plain');if(!text||!/[\t\n]/.test(text))return;e.preventDefault();
 const [row,col]=input.dataset.peSheet.split('.').map(Number),lines=text.replace(/\r/g,'').replace(/\n$/,'').split('\n').map(line=>line.split('\t'));
 if(row+lines.length>productEditState.skus.length||lines.some(line=>col+line.length>3)){$('#pe-sheet-error').textContent='粘贴内容超出规格行数或三个可编辑列，请检查起始单元格。';return;}
 lines.forEach((line,i)=>line.forEach((value,j)=>{if(value.trim()!=='')$('#secondary [data-pe-sheet="'+(row+i)+'.'+(col+j)+'"]').value=value.trim();}));$('#pe-sheet-error').textContent='';
});

window.addEventListener('workbench-customer-service-sync',()=>{if(S.page==='shop'&&S.tab==='客服配置'&&!$('#overlay').children.length)render();else updateProductCustomerService();});

// Resolve the plan before delegated editor actions and input handlers run.
for(const type of ['click','input','change','focusin'])document.addEventListener(type,event=>{
 const body=event.target.closest?.('#pe-split-table [data-pe-plan]');if(!body||!productEditState)return;
 const index=Number(body.dataset.pePlan);productEditState.activeSplitPlan=index;productEditState.splitIndex=productSplitPlanIndices(index)[0]||0;
},true);

})();
