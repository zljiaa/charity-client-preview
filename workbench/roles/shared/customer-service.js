/* Shared customer-service routing for workbench prototypes. */
(function(root){
 'use strict';
 const config=()=>root.WorkbenchData.customerService;
 const accounts=()=>config().accounts;
 const account=id=>accounts().find(a=>a.id===id);
 const available=a=>Boolean(config().corpId&&!a?.removed&&a?.enabled&&a.servicers?.length&&validUrl(a.url));
 function validUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='work.weixin.qq.com'&&/^\/(?:kf|kfid)\/[^/]+/.test(u.pathname);}catch{return false;}}
 const staff=a=>(a?.servicers||[]).map((name,i)=>name+(a.servicerIds?.[i]?'（'+a.servicerIds[i]+'）':'')).join('、');
 function copyAccount(remote,previous){return {...remote,servicers:[...(remote.servicers||[])],servicerIds:[...(remote.servicerIds||[])],enabled:previous?.enabled??remote.enabled!==false,removed:false};}
 function syncState(){return config().sync||(config().sync={intervalMs:300000,lastSuccessAt:'',status:'等待同步',error:''});}
 function remoteDirectory(){
  if(config().directoryError)throw new Error('暂时无法连接企业微信，请稍后重试。');
  if(!Array.isArray(config().directory))throw new Error('客服账号目录读取失败，请稍后重试。');
  return config().directory.filter(a=>!a.corpId||a.corpId===config().corpId);
 }
 function verify(value){
  const id=String(value||'').trim();if(!id)return {error:'请填写客服账号 ID（open_kfid）。'};
  if(!/^[a-zA-Z0-9_-]+$/.test(id))return {error:'客服账号 ID 格式不正确。'};
  let source;try{source=remoteDirectory();}catch(e){return {error:e.message};}
  const remote=source.find(a=>a.id===id);
  if(!remote)return {error:'客服账号不存在、不属于平台企业或未获接口授权，请核对 ID。'};
  const candidate=copyAccount(remote,account(id));
  if(!candidate.enabled)return {error:'该客服账号已停用，请联系平台管理员。'};
  if(!validUrl(candidate.url))return {error:'该客服账号缺少有效的客服链接。'};
  if(!candidate.servicers.length)return {error:'该客服账号尚未配置接待人员。'};
  const index=accounts().findIndex(a=>a.id===id);if(index<0)accounts().push(candidate);else accounts()[index]=candidate;
  return {account:candidate};
 }
 function refresh(now=Date.now()){
  const sync=syncState();sync.lastAttemptAt=new Date(now).toISOString();
  try{
   const source=remoteDirectory(),previous=accounts(),next=source.map(a=>copyAccount(a,account(a.id)));
   for(const a of previous)if(!source.some(remote=>remote.id===a.id))next.push({...a,removed:true});
   config().accounts=next;Object.assign(sync,{lastSuccessAt:sync.lastAttemptAt,status:'正常',error:''});
  }catch(e){Object.assign(sync,{status:'同步异常',error:e.message});}
  root.dispatchEvent(new CustomEvent('workbench-customer-service-sync'));
  return sync;
 }
 const syncLabel=()=>{const s=syncState();return '每 '+Math.round(s.intervalMs/60000)+' 分钟自动同步 · '+s.status+' · 最近成功：'+(s.lastSuccessAt?new Date(s.lastSuccessAt).toLocaleString('zh-CN',{hour12:false}):'尚未同步');};
 function resolve(product,shop){
  const id=product?.customerServiceId||shop?.customerServiceId||config().fallbackId;
  const requested=account(id),fallback=account(config().fallbackId);
  return {account:available(requested)?requested:available(fallback)?fallback:null,fallback:!available(requested),requestedId:id};
 }
 root.WorkbenchCustomerService={config,accounts,account,available,resolve,validUrl,staff,verify,refresh,syncState,syncLabel};
 root.setInterval(()=>refresh(),syncState().intervalMs);
})(window);
