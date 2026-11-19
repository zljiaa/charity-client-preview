'use strict';
(function (root) {
 const DAY=86400000,HOUR=3600000;
 const cents=value=>Math.round(Number(value)*100);
 const time=value=>value?new Date(String(value).replace(' ','T')).getTime():NaN;
 const stamp=value=>Number.isFinite(value)?new Date(value).toLocaleString('sv-SE').slice(0,16):'';
 const moneyValid=value=>value!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Math.abs(Number(value)*100-cents(value))<0.000001;
 const activeAftersale=state=>['待处理','待商家处理','待买家退货','待验收','待商家收货','待商家收货确认','待收货验收','待确认退款','退款处理中','退款异常','退款中'].includes(state);
 const completedOrder=order=>['已收货','已领取','已完成'].includes(order.delivery)||order.status==='已完成';
 const failedInspection=inspection=>/不通过|异常|不合格/.test(inspection?.result||'');
 function inspectionProofError(inspection){
  return failedInspection(inspection)&&!(inspection.proofs||[]).some(f=>/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type||'')&&typeof(f.data||f.src)==='string'&&(f.data||f.src).length>0)?'验收存在异常，请至少上传一张验收图片。':'';
 }
 function orderStatus(order){
  if(Number(order.qty)>0&&Number(order.refundedQty)===Number(order.qty)&&order.payment==='支付成功')return '退款成功';
  if(order.delivery==='已关闭')return '已取消';
  if(order.payment==='待付款')return '待付款';
  if(activeAftersale(order.after)&&completedOrder(order))return '待收货';
  return ({待领取:'待发货',已发货:'待收货',已收货:'已完成',已领取:'已完成'})[order.delivery]||order.delivery;
 }
 function aftersaleUnits(order,record){
  if(Array.isArray(record.afterUnitIndexes)&&record.afterUnitIndexes.length)return record.afterUnitIndexes.filter(i=>Number.isInteger(i)&&i>=0&&i<order.qty);
  if(['已退款','极速退款已完成','退款成功'].includes(record.after))return refundedIndexes(order).slice(0,record.afterQty||order.qty);
  const remaining=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refundedIndexes(order).includes(i));
  return remaining.slice(0,record.afterQty>0?record.afterQty:activeAftersale(record.after)?remaining.length:0);
 }
 function shippingUnitIndexes(order){
  if(order.payment!=='支付成功'||!['待发货','待领取'].includes(order.delivery))return [];
  const blocked=new Set([...refundedIndexes(order),...(order.shipments||[]).flatMap(s=>s.unitIndexes||[])]);
  const records=[...(order.aftersales||[]).filter(a=>!order.afterId||a.id!==order.afterId),order];
  for(const a of records)if(activeAftersale(a.after))for(const i of aftersaleUnits(order,a))blocked.add(i);
  if(['已退款','极速退款已完成','退款成功'].includes(order.after))for(const i of order.afterUnitIndexes||Array.from({length:order.afterQty||order.qty},(_,i)=>i))blocked.add(i);
  return Array.from({length:order.qty},(_,i)=>i).filter(i=>!blocked.has(i));
 }
 // Split quantity branches into persistent trade records; unit indexes are local to each child.
 function splitPartialOrders(orders){
  let changed=false;
  for(const order of [...orders]){
   if(order.qty<2)continue;
   const refunded=new Set(refundedIndexes(order)),settled=new Set(settledIndexes(order));
   const records=[...(order.aftersales||[]).filter(a=>a.id!==order.afterId)];
   if(order.after&&order.after!=='无售后')records.push({...order,id:order.afterId||'AS'+order.id+'-01'});
   const groups=new Map();
   for(let i=0;i<order.qty;i++){
    const record=records.slice().reverse().find(a=>aftersaleUnits(order,a).includes(i));
    const key=(refunded.has(i)?'refunded:'+(record?.id||'legacy'):record?'after:'+record.id:'normal')+(settled.has(i)?':settled':'');
    if(!groups.has(key))groups.set(key,{indexes:[],record,refunded:refunded.has(i)});
    groups.get(key).indexes.push(i);
   }
   if(groups.size<2)continue;
   const root=order.parentOrderId||order.id,source=order.id,reserved=new Set(orders.map(o=>o.id));
   const take=(total,indexes,pool=Array.from({length:order.qty},(_,i)=>i))=>{const amount=cents(total||0),base=Math.floor(amount/(pool.length||1)),rest=amount-base*pool.length;return indexes.reduce((sum,i)=>{const n=pool.indexOf(i);return sum+(n<0?0:base+(n<rest?1:0));},0)/100;};
   const children=[...groups.values()].map((group,n)=>{
    const indexes=group.indexes,child=JSON.parse(JSON.stringify(order));
    let id=order.parentOrderId&&n===0?order.id:'';
    if(!id){let seq=1;while(reserved.has(root+'-'+String(seq).padStart(2,'0')))seq++;id=root+'-'+String(seq).padStart(2,'0');reserved.add(id);}
    Object.assign(child,{id,parentOrderId:root,splitSourceOrderId:order.splitSourceOrderId||source,qty:indexes.length,paid:indexes.reduce((sum,i)=>sum+unitPaidCents(order,i),0)/100,goodsAmount:take(order.goodsAmount??order.paid,indexes),shippingFee:n===0?order.shippingFee||0:0,refund:take(order.refund,indexes,[...refunded]),settled:take(order.settled,indexes,[...settled]),fundSettled:take(order.fundSettled,indexes,[...settled])});
    const local=values=>(values||[]).map(i=>indexes.indexOf(i)).filter(i=>i>=0);
    child.refundedUnitIndexes=local([...refunded]);child.refundedQty=child.refundedUnitIndexes.length;child.settledUnitIndexes=local([...settled]);
    child.orderAmount=child.goodsAmount+child.shippingFee;
    for(const key of ['fundUnitAmounts'])if(Array.isArray(order[key]))child[key]=indexes.map(i=>order[key][i]);
    if(order.unitReceipts)child.unitReceipts=Object.fromEntries(indexes.map((i,j)=>[j,order.unitReceipts[i]]).filter(([,v])=>v));
    if(order.processingUnitIndexes)child.processingUnitIndexes=local(order.processingUnitIndexes);
    if(order.splitAllocations)child.splitAllocations=order.splitAllocations.map(a=>({...a,unitAmounts:indexes.map(i=>a.unitAmounts[i])}));
    child.shipments=(order.shipments||[]).map(s=>{const units=local(s.unitIndexes||Array.from({length:order.qty},(_,i)=>i));return {...s,qty:units.length,quantity:units.length,unitIndexes:units};}).filter(s=>s.qty);
    for(const key of Object.keys(child))if(key.startsWith('after')||key.startsWith('return')&&key!=='returnAddress'||['evidence','refundSubmittedAt','collaborationInspection'].includes(key))delete child[key];
    const mapRecord=a=>{const units=local(aftersaleUnits(order,a));return {...JSON.parse(JSON.stringify(a)),afterQty:units.length,afterUnitIndexes:units,afterRefundAmount:units.reduce((sum,j)=>sum+unitPaidCents(order,indexes[j]),0)/100};};
    child.aftersales=records.filter(a=>aftersaleUnits(order,a).some(i=>indexes.includes(i))).map(a=>{const clean=Object.fromEntries(Object.entries(a).filter(([k])=>k.startsWith('after')&&k!=='aftersales'||['id','evidence','returnAddress','returnShipments','returnWaybill','returnCarrier','returnCollectedAt','returnSignedAt','returnReceivedAt','returnLogisticsUnknown','refundSubmittedAt','collaborationInspection'].includes(k)));return mapRecord(clean);});
    const current=child.aftersales.find(a=>a.id===group.record?.id);
    Object.assign(child,current?Object.fromEntries(Object.entries(current).filter(([k])=>k!=='id')):{after:'无售后',afterQty:0});
    if(current)child.afterId=current.id;
    if(group.refunded){child.after='已退款';child.split='分账取消';}
    else if(settled.has(indexes[0]))child.split='分账成功';
    else if(!activeAftersale(child.after)&&child.split==='售后暂停')child.split='待分账';
    if(order.afterDelivery&&!group.refunded&&!child.shipments.length)child.delivery=order.afterDelivery;
    return child;
   });
   orders.splice(orders.indexOf(order),1,...children);changed=true;
  }
  return changed;
 }
 function cancellationReason(order,scope='order'){
  if(scope==='after'){
   if(!['已取消','已撤销','已关闭'].includes(order.after))return '';
   return order.afterCloseReason||(order.after==='已撤销'?'买家主动取消':'取消原因待核实');
  }
  if(scope==='split')return Number(order.refundedQty)>0?'对应商品退款成功':'';
  if(order.delivery!=='已关闭')return '';
  const reason=order.cancelReason||order.closeReason||'取消原因待核实';
  return ({买家主动取消:'用户取消',用户主动取消:'用户取消',支付超时自动取消:'超时未支付',支付超时:'超时未支付'})[reason]||reason;
 }
 function randomPlan(data,skus){
  const ratio=Number(data.donationRatio);
  if(data.donationRatio===''||!Number.isFinite(ratio)||ratio<=0||ratio>100||Math.abs(ratio*100-Math.round(ratio*100))>0.000001)return {error:'目标捐赠比例须大于 0 且不超过 100，最多两位小数。'};
  let sales=0,minimum=0,maximum=0,stock=0;
  for(const s of skus){
   if(!moneyValid(s.price)||Number(s.price)<=0||!Number.isSafeInteger(s.stock)||s.stock<0)return {error:'请先填写有效的规格售价及库存。'};
   if(s.randomMin==null||s.randomMax==null||!moneyValid(s.randomMin)||!moneyValid(s.randomMax)||cents(s.randomMax)>cents(s.price)||cents(s.randomMax)<cents(s.randomMin))return {error:'请按规格填写随机金额上下限，下限不大于上限，上限不高于售价，随机金额包含上下限。'};
   sales+=cents(s.price)*s.stock;stock+=s.stock;
   minimum+=cents(s.randomMin)*s.stock;maximum+=cents(s.randomMax)*s.stock;
  }
  if(!stock)return {error:'随机计划库存须大于零。'};
  const total=Math.round(sales*Math.round(ratio*100)/10000);
  if(![sales,minimum,maximum,total].every(Number.isSafeInteger))return {error:'计划金额超出可计算范围。'};
  if(total<minimum||total>maximum)return {error:'目标公益总额不在随机上下限可生成的总额范围内，请调整比例或上下限。'};
  return {stock,sales,total,minimum,maximum};
 }
 function fundAllocation(order){
  if(!Array.isArray(order.fundUnitAmounts)||order.fundUnitAmounts.length!==order.qty||!order.fundUnitAmounts.every(moneyValid))return null;
  const refunded=new Set(refundedIndexes(order)),settled=new Set(settledIndexes(order));
  const units=order.fundUnitAmounts.map((value,index)=>({index,cents:cents(value),refunded:refunded.has(index),settled:settled.has(index)}));
  return {units,locked:units.reduce((n,u)=>n+u.cents,0),cancelled:units.filter(u=>u.refunded).reduce((n,u)=>n+u.cents,0),remaining:units.filter(u=>!u.refunded).reduce((n,u)=>n+u.cents,0)};
 }
 function fundDue(order){
  const amounts=order.fundUnitAmounts;
  if(Array.isArray(amounts)){
   const refunded=new Set(order.refundedUnitIndexes||Array.from({length:order.refundedQty||0},(_,i)=>order.qty-1-i));
   return amounts.reduce((sum,value,i)=>sum+(refunded.has(i)?0:cents(value)),0)/100;
  }
  return cents(order.fund||0)*(order.qty-(order.refundedQty||0))/100;
 }
 function donationAmountModes(data){const allowed=['preset','random','custom'];if(data.amountModes!==undefined){const values=Array.isArray(data.amountModes)?data.amountModes:String(data.amountModes).split(',');return allowed.filter(mode=>values.includes(mode));}return [allowed.includes(data.amountMode)?data.amountMode:data.amountMode==='fixed'?'preset':data.donationOptions||data.options?'preset':'custom'];}
 function donationAmountMode(data){return donationAmountModes(data)[0];}
 function donationError(data){
  const positive=v=>v!==''&&v!=null&&moneyValid(v)&&Number(v)>0,modes=donationAmountModes(data);
  if(!modes.length)return '请至少选择一种捐赠金额方式。';
  if(modes.includes('preset')){const options=String(data.donationOptions??data.options??(data.amountMode==='fixed'?data.amount:'')??'').split(/[,，]/);if(!options.length||!options.every(v=>positive(v.trim())))return '请填写预设金额，每个金额须大于零且最多保留两位小数。';}
  if(modes.includes('random')&&(!positive(data.drawMin)||!positive(data.drawMax)||Number(data.drawMax)<Number(data.drawMin)))return '随缘捐金额须大于零、最多两位小数，上限不得小于下限。';
  return '';
 }
 function donationSnapshot(data){const amountModes=donationAmountModes(data),donationOptions=amountModes.includes('preset')?String(data.donationOptions??data.options??(data.amountMode==='fixed'?data.amount:'')??'').split(/[,，]/).map(v=>v.trim()).join(','):'';return {amountModes,amountMode:amountModes.length===1?amountModes[0]:'multiple',amount:0,donationOptions,options:donationOptions,allowCustom:amountModes.includes('custom'),minimumMode:'unlimited',minimum:0,drawMin:amountModes.includes('random')?Number(data.drawMin||0):0,drawMax:amountModes.includes('random')?Number(data.drawMax||0):0};}
 function timeline(order,now){
  const signed=time(order.signedAt),actual=time(order.received),auto=Number.isFinite(signed)?signed+7*DAY:NaN;
  const pickup=['现场交付','现场领取'].includes(order.method);
  const base=pickup?actual:order.receiptMode==='auto'?auto:Number.isFinite(actual)?Math.min(actual,auto||actual):auto;
  const splitAt=base+7*DAY;
  const paused=['待处理','待商家处理','待买家退货','待验收','待商家收货','待商家收货确认','待收货验收','待确认退款','退款处理中','退款异常'].includes(order.after)||!!order.fulfillmentIssue;
  const valid=order.payment==='支付成功'&&order.qty>(order.refundedQty||0);
  const blocked=['分账处理中','结果待确认','分账成功'].includes(order.split);
  return {autoAt:pickup?'':stamp(auto),splitAt:stamp(splitAt),paused,canConfirm:valid&&!pickup&&!paused&&!Number.isFinite(actual)&&Number.isFinite(auto)&&now>=auto,canSplit:valid&&!paused&&!blocked&&Number.isFinite(splitAt)&&now>=splitAt,canApply:valid&&!blocked&&!completedOrder(order)&&order.delivery!=='已关闭'};
 }
 function unitTimelines(order,now){
  const refunded=new Set(order.refundedUnitIndexes||Array.from({length:order.refundedQty||0},(_,i)=>order.qty-1-i));
  const active=['待处理','待商家处理','待买家退货','待验收','待商家收货','待商家收货确认','待收货验收','待确认退款','退款处理中','退款异常'].includes(order.after);
  const candidates=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refunded.has(i));
  const affected=new Set(active?(order.afterUnitIndexes||candidates.slice(0,order.afterQty||candidates.length)):[]);
  return candidates.map(index=>({index,...timeline({...order,qty:1,refundedQty:0,after:affected.has(index)?order.after:'无售后',...(order.unitReceipts?.[index]||{}),split:order.settledUnitIndexes?.includes(index)?'分账成功':order.split},now)}));
 }
 function acceptanceTiming(order){
  const signed=time(order.returnSignedAt);
  return {signedAt:stamp(signed),deadline:order.afterType==='退货退款'&&!order.returnLogisticsUnknown&&Number.isFinite(signed)?signed+7*DAY:NaN,
   waiting:['待验收','待商家收货','待商家收货确认','待收货验收','待确认退款'].includes(order.after)};
 }
 function advanceAftersale(order,now){
  const result={...order},events=[];
  const approved=time(result.afterApprovedAt),submitted=time(result.afterSubmittedAt);
  if(['待处理','待商家处理'].includes(result.after)&&Number.isFinite(submitted)&&now>=submitted+48*HOUR){
   if(result.afterType==='退货退款'&&!result.returnAddress){result.afterException='请补全退货地址后核实自动通过';return {order:result,events};}
   result.afterApprovedAt=stamp(submitted+48*HOUR);
   result.after=result.afterType==='退款（无需退货）'?'退款处理中':'待买家退货';if(result.after==='退款处理中')result.refundSubmittedAt=result.afterApprovedAt;events.push('申请满48小时自动通过');
  }
  const approval=Number.isFinite(approved)?approved:time(result.afterApprovedAt),deadline=approval+7*DAY,collected=time(result.returnCollectedAt);
  if(result.after==='待买家退货'&&Number.isFinite(deadline)){
   if(Number.isFinite(collected)&&collected<=deadline){result.after='待收货验收';events.push('已核验按期揽收');}
   else if(now>=deadline&&!result.returnLogisticsUnknown){result.after='已关闭';result.afterCloseReason='退货超时：'+(Number.isFinite(collected)?'实际揽收超过寄回截止时间':result.returnWaybill||result.returnShipments?.length?'已填写运单但未有效揽收':'未填写寄回信息');events.push(result.afterCloseReason);}
  }
  const acceptance=acceptanceTiming(result);
  if(acceptance.waiting&&Number.isFinite(acceptance.deadline)&&now>=acceptance.deadline){
   const request=refundRequest(result);
   if(request.error){result.afterException=request.error;return {order:result,events};}
   const at=stamp(now);
   Object.assign(result,{after:'退款处理中',returnReceivedAt:result.returnReceivedAt||at,afterAcceptanceAutoAt:at,refundSubmittedAt:at,
    afterUnitIndexes:[...request.indexes],afterRefundAmount:request.amount,split:'售后暂停'});
   result.afterRecords=[...(result.afterRecords||[]),{time:at,who:'系统',conclusion:'退货签收满7天未确认，自动确认验收并发起退款',evidence:[]}];
   events.push('验收超期自动退款');
  }
  return {order:result,events};
 }
 function refundedIndexes(order){return order.refundedUnitIndexes||Array.from({length:order.refundedQty||0},(_,i)=>order.qty-1-i);}
 function settledIndexes(order){
  if(Array.isArray(order.settledUnitIndexes))return order.settledUnitIndexes;
  const candidates=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refundedIndexes(order).includes(i));
  const count=order.paid?Math.min(candidates.length,Math.floor(cents(order.settled||0)/(cents(order.paid)/order.qty)+0.00001)):0;
  return candidates.slice(candidates.length-count);
 }
 function unitPaidCents(order,index){const total=cents(order.paid),base=Math.floor(total/order.qty);return base+(index<total%order.qty?1:0);}
 function refundRequest(order){
  const remaining=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refundedIndexes(order).includes(i));
  const indexes=order.afterUnitIndexes||remaining.slice(0,order.afterQty||0);
  if(!indexes.length||indexes.length!==order.afterQty||new Set(indexes).size!==indexes.length||indexes.some(i=>!remaining.includes(i)))return {error:'售后数量已变化，请重新核对当前售后记录。'};
  if(indexes.some(i=>settledIndexes(order).includes(i)))return {error:'对应数量已分账，不能发起新退款。'};
  if(['分账处理中','结果待确认'].includes(order.split)&&(!order.processingUnitIndexes||indexes.some(i=>order.processingUnitIndexes.includes(i))))return {error:'对应数量的分账结果待核实，请稍后处理。'};
  const amount=indexes.reduce((sum,i)=>sum+unitPaidCents(order,i),0)/100;
  if(cents(amount)>cents(order.paid)-cents(order.refund||0))return {error:'退款金额超过订单剩余可退金额，请重新核对。'};
  return {indexes,amount};
 }
 function recipientPaid(order){
  const count=settledIndexes(order).length,association=cents(order.association||0)*count/100,university=cents(order.university||0)*count/100;
  return [(cents(order.settled||0)-cents(order.fundSettled||0)-cents(association)-cents(university))/100,order.fundSettled||0,association,university];
 }
 // Channel deadlines are supplied by the payment integration, never inferred from a generic duration.
 function channelDeadline(order){return time(order.wechatSplitDeadline);}
 function normalPendingCount(order){
  const refunded=new Set(refundedIndexes(order)),settled=new Set(settledIndexes(order));
  const active=['待处理','待商家处理','待买家退货','待验收','待商家收货','待商家收货确认','待收货验收','待确认退款','退款处理中','退款异常'].includes(order.after);
  const available=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refunded.has(i));
  const affected=new Set(active?(order.afterUnitIndexes||available.slice(0,order.afterQty||0)):[]);
  return available.filter(i=>!settled.has(i)&&!affected.has(i)).length;
 }
 function needsShipping(order){
  return order.payment==='支付成功'&&order.method==='快递配送'&&['待发货','已发货'].includes(order.delivery)&&!Number.isFinite(time(order.shippedAt))&&normalPendingCount(order)>0;
 }
 function shippingTiming(order){
  const paid=time(order.paidAt);
  return {deadline:paid+48*HOUR,refundAt:paid+7*DAY};
 }
 function advanceShipping(order,now){
  const result={...order},events=[],timing=shippingTiming(order);
  if(order.payment!=='支付成功'||order.method!=='快递配送'||!Number.isFinite(timing.refundAt)||now<timing.refundAt||order.shippingRefundAt)return {order:result,events};
  if(['退款处理中','退款异常'].includes(order.after))return {order:result,events};
  const shipments=(order.shipments||[]).filter(s=>Number.isFinite(time(s.collectedAt||s.shippedAt))||s.events?.some(e=>/揽收/.test(e.text)&&Number.isFinite(time(e.time))));
  const shipped=new Set(shipments.flatMap(s=>s.unitIndexes||[]));
  if(Number.isFinite(time(order.shippedAt))&&!shipments.some(s=>Array.isArray(s.unitIndexes)))return {order:result,events};
  const refunded=new Set(refundedIndexes(order)),settled=new Set(settledIndexes(order));
  const indexes=Array.from({length:order.qty},(_,i)=>i).filter(i=>!refunded.has(i)&&!settled.has(i)&&!shipped.has(i));
  if(!indexes.length)return {order:result,events};
  const at=stamp(now),amount=indexes.reduce((sum,i)=>sum+unitPaidCents(order,i),0)/100;
  if(order.after&&order.after!=='无售后'){
   const current=Object.fromEntries(Object.entries(order).filter(([key])=>key.startsWith('after')&&key!=='aftersales'||['returnWaybill','returnShipments','returnCollectedAt','returnSignedAt'].includes(key)));
   const history=(order.aftersales||[]).filter(a=>a.id!==order.afterId);
   result.aftersales=[...history,{...current,id:order.afterId||'AS'+order.id+'-previous',after:'已取消',afterCloseReason:'未发货超期，系统已转自动退款',afterClosedAt:at}];
  }
  result.afterId='AS'+order.id+'-shipping-timeout';
  for(const key of ['returnShipments','returnWaybill','returnCollectedAt','returnSignedAt','returnReceivedAt','afterCloseReason','afterCancelledAt','afterClosedAt','afterRejectedAt'])result[key]=undefined;
  Object.assign(result,{after:'退款处理中',afterType:'退款（无需退货）',afterQty:indexes.length,afterUnitIndexes:indexes,afterSubmittedAt:at,afterApprovedAt:at,refundSubmittedAt:at,afterRefundAmount:amount,afterReason:'付款满7天未发货，系统自动退款',shippingRefundAt:at,split:'售后暂停'});
  result.afterRecords=[{time:at,who:'系统',conclusion:'付款满7天未发货，自动发起退款',evidence:[]}];
  events.push('未发货超期自动退款');return {order:result,events};
 }
 function inShippingWindow(order,window,now){
  if(!window)return true;
  const deadline=shippingTiming(order).deadline;
  if(!needsShipping(order)||!Number.isFinite(deadline)||!Number.isFinite(now))return false;
  if(window==='已过承诺发货时间')return deadline<=now;
  if(deadline<=now)return false;
  if(window==='12小时内需要发货或揽收')return deadline<=now+12*HOUR;
  if(window==='今天需要发货或揽收'){
   const tomorrow=new Date(now);tomorrow.setHours(24,0,0,0);
   return deadline<tomorrow.getTime();
  }
  if(window==='三天内需要发货或揽收')return deadline<=now+3*DAY;
  if(window==='三天外需要发货或揽收')return deadline>now+3*DAY;
  return false;
 }
 function splitCategory(status){return ({分账处理中:'处理中',结果待确认:'处理中',需另行结算:'分账异常'})[status]||status;}
 function orderIssueTypes(order,now){
  const types=[];
  if(order.fulfillmentIssue)types.push('发货/物流异常');
  if(merchantAlerts(order,now).some(a=>a.code==='shipping-overdue'))types.push('发货超时');
  if(order.afterException||order.returnLogisticsUnknown)types.push('售后自动处理异常');
  if(order.after==='退款异常')types.push('退款异常');
  if(splitCategory(order.split)==='分账异常')types.push('分账异常');
  if(order.notify==='发送失败')types.push('通知失败');
  return types;
 }
 function merchantAlerts(order,now,config={}){
  const cfg={channelWarningHours:24,shippingWarningHours:4,reviewWarningHours:4,acceptanceWarningHours:4,splitGraceHours:1,refundProcessingHours:24,...config};
  const alerts=[],remaining=order.qty-(order.refundedQty||0),pending=remaining-settledIndexes(order).length;
  const add=(code,title,section,deadline,message,severity='warning',quantity=remaining)=>alerts.push({key:order.id+':'+(section==='售后信息'?(order.afterId||order.afterSubmittedAt||'')+':':'')+code+':'+(Number.isFinite(deadline)?deadline:''),order:order.id,afterId:section==='售后信息'?(order.afterId||''):'',org:order.org,shop:order.shop,code,title,section,deadline:Number.isFinite(deadline)?stamp(deadline):'',message,severity,quantity});
  const due=(code,title,section,deadline,hours,message,quantity)=>{
   if(!Number.isFinite(deadline)||now<deadline-hours*HOUR)return;
   add(code+(now>=deadline?'-overdue':'-soon'),title+(now>=deadline?'已超期':'即将超期'),section,deadline,message,now>=deadline?'danger':'warning',quantity);
  };
  if(order.payment==='支付成功'&&pending>0){
   const channel=channelDeadline(order);
   if(Number.isFinite(channel))due('channel','微信支付分账','分账记录',channel,cfg.channelWarningHours,'请及时完成履约及售后处理；渠道超期或分账异常请联系系统管理员。',pending);
   else add('channel-unknown','微信支付分账期限待核实','分账记录',NaN,'请联系系统管理员核实支付渠道期限。','warning',pending);
   const normal=normalPendingCount(order),timing=timeline({...order,after:'无售后'},now),split=time(timing.splitAt);
   if(normal>0&&!order.fulfillmentIssue&&Number.isFinite(split)&&now>=split+cfg.splitGraceHours*HOUR&&!['分账处理中','结果待确认','分账异常','需另行结算'].includes(order.split))add('split-delayed','分账执行超时','分账记录',split,'正常商品已满足分账时间仍未完成，请联系系统管理员核实。','danger',normal);
   if(needsShipping(order))due('shipping','发货','发货与物流',shippingTiming(order).deadline,cfg.shippingWarningHours,'付款后48小时内发货；满7天未发货将自动发起退款。',normal);
  }
  if(['待处理','待商家处理'].includes(order.after))due('review','售后审核','售后信息',time(order.afterSubmittedAt)+48*HOUR,cfg.reviewWarningHours,'请在截止前提交处理结果，满 48 小时将自动通过；仅退款进入退款处理，退货退款进入待买家退货。',order.afterQty);
  if((order.afterEvents||[]).includes('申请满48小时自动通过'))add('review-auto','售后审核超期，已自动通过','售后信息',time(order.afterApprovedAt),'申请满 48 小时未处理，系统已自动通过；请跟进退款或买家退货进度。','info',order.afterQty);
  const acceptance=acceptanceTiming(order);
  if(acceptance.waiting&&Number.isFinite(acceptance.deadline)&&now<acceptance.deadline)due('acceptance','退货验收','售后信息',acceptance.deadline,cfg.acceptanceWarningHours,'请在截止前完成仓库验收及运营确认退款；签收满 7 天未发起退款将按规则自动处理。',order.afterQty);
  if(order.afterAcceptanceAutoAt)add('acceptance-auto','验收超期自动退款','售后信息',time(order.afterAcceptanceAutoAt),'退货签收满 7 天未确认，系统已自动确认验收并发起退款；退款结果以渠道核验为准。','info',order.afterQty);
  if(order.afterException||order.returnLogisticsUnknown)add('after-exception','售后自动处理 / 物流核验异常','售后信息',NaN,'请核实售后资料或物流情况，并联系系统管理员处理。','danger',order.afterQty);
  if(order.refundStatus==='结果待确认')add('refund-unknown','退款结果待确认','售后信息',NaN,'请联系系统管理员核实退款结果。','danger',order.afterQty);
  if(order.after==='退款异常')add('refund-failed','退款异常','售后信息',NaN,'请联系系统管理员核实退款结果。','danger',order.afterQty);
  if(order.after==='退款处理中')due('refund-processing','退款处理','售后信息',time(order.refundSubmittedAt||order.afterApprovedAt)+cfg.refundProcessingHours*HOUR,0,'退款处理超时，请联系系统管理员核实，结果不明时先查证。',order.afterQty);
  if(['分账异常','结果待确认','需另行结算'].includes(order.split)&&pending>0)add('split-exception',order.split,'分账记录',NaN,'请联系系统管理员处理。','danger',pending);
  if(order.fulfillmentIssue&&remaining>0)add('logistics','履约 / 物流异常','发货与物流',NaN,order.fulfillmentIssue,'danger');
  if(order.notify==='发送失败'||(order.notificationRecords||[]).some((n,i,records)=>n.status==='发送失败'&&!n.resolvedAt&&!records.slice(0,i).some(newer=>newer.type===n.type&&newer.channel===n.channel&&newer.group===n.group)))add('notification-failed','订单通知失败','订单通知记录',NaN,'请联系系统管理员核实通知配置及发送结果。','danger');
  return alerts;
 }
 const api={failedInspection,inspectionProofError,orderStatus,activeAftersale,completedOrder,shippingUnitIndexes,splitPartialOrders,shippingTiming,advanceShipping,cancellationReason,needsShipping,inShippingWindow,splitCategory,orderIssueTypes,channelDeadline,normalPendingCount,merchantAlerts,DAY,HOUR,cents,time,stamp,moneyValid,randomPlan,fundAllocation,fundDue,donationAmountModes,donationAmountMode,donationError,donationSnapshot,timeline,unitTimelines,acceptanceTiming,advanceAftersale,refundedIndexes,settledIndexes,unitPaidCents,refundRequest,recipientPaid};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.WorkbenchRules=api;
})(typeof window==='object'?window:globalThis);
