'use strict';
window.MerchantAnalytics=(()=>{
 const menuPages=['经营总览','商品数据','交易数据','服务数据','流量数据','粉丝数据','公益数据'];
 const pages=[...menuPages,'售后数据','客服数据','物流数据'];
 const day=86400000,stamp=d=>d.toISOString().slice(0,10),date=s=>new Date(s+'T00:00:00Z');
 const defaults=()=>({range:'实时',from:'',to:'',detailRange:'实时',detailFrom:'',detailTo:'',regionRange:'昨日',pilotIds:'',pilotName:'',metric:'',query:'',sort:'favorites',direction:'desc',trend:'累计趋势图',sub:'',productId:'',region:'',columns:'visitors,views,paid,qty,orders,buyers,conversion,favorites'});
 const ranges=['实时','昨日','7日','30日','周','月','自定义'];
 function range(state,now){
  const mode=({'今日':'实时','近7日':'7日','近30日':'30日'})[state.range]||state.range;
  if(!ranges.includes(mode))return null;
  let end=date(now.slice(0,10)),start=new Date(end);
  if(mode==='自定义'){start=date(state.from);end=date(state.to);}
  else if(mode!=='实时'){
   end=new Date(+end-day);start=new Date(end);
   if(mode==='7日'||mode==='30日')start=new Date(+end-(Number(mode.replace('日',''))-1)*day);
   if(mode==='周'){end=new Date(+date(now.slice(0,10))-((date(now.slice(0,10)).getUTCDay()+6)%7+1)*day);start=new Date(+end-6*day);}
   if(mode==='月'){end=new Date(Date.UTC(date(now.slice(0,10)).getUTCFullYear(),date(now.slice(0,10)).getUTCMonth(),0));start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1));}
  }
  if(!Number.isFinite(+start)||!Number.isFinite(+end)||start>end||end>date(now.slice(0,10))||(end-start)/day>=366)return null;
  if(mode==='自定义'&&(stamp(start)!==state.from||stamp(end)!==state.to))return null;
  const days=Math.round((end-start)/day)+1;
  return {from:stamp(start),to:stamp(end),days,realtime:mode==='实时',previousFrom:stamp(new Date(+start-days*day)),previousTo:stamp(new Date(+start-day))};
 }
 const sum=(rows,key)=>Math.round(rows.reduce((n,o)=>n+Number(o[key]||0),0)*100)/100;
 const growthThresholds=[0,55,422,2232,7438,17573];
 function growth(ctx,now){
  const period=range({range:'30日'},now),total=sum(cohort(ctx.orders,period.from,period.to),'paid'),daily=total/30;
  const level=growthThresholds.reduce((value,minimum,index)=>total>=minimum*30?index+1:value,1),next=growthThresholds[level];
  return {period,total,daily,level,next,gap:next===undefined?0:Math.ceil((next*30-total)*100/30)/100};
 }
 const unique=items=>new Set(items.filter(Boolean)).size;
 const inPeriod=(value,from,to)=>Boolean(value&&value.slice(0,10)>=from&&value.slice(0,10)<=to);
 function cohort(orders,from,to){return orders.filter(o=>o.payment==='支付成功'&&inPeriod(o.paidAt||o.date,from,to));}
 // Missing event collection must not produce fabricated zeroes or demo traffic.
 function samples(ctx){return (ctx.analyticsEvents||[]).filter(event=>ctx.products.some(p=>p.id===event.product&&p.shop===event.shop));}
 function refundTime(o){return o.refundSucceededAt||o.refundedAt||'';}
 function totals(rows,ctx){
  const shipping=rows.filter(o=>o.method==='快递配送');
  return {paid:sum(rows,'paid'),orders:rows.length,qty:sum(rows,'qty'),buyers:unique(rows.map(o=>o.buyerId)),refund:sum(rows,'refund'),refundOrders:rows.filter(o=>o.refund>0).length,refundRate:rows.length?rows.filter(o=>o.refund>0).length/rows.length*100:0,net:Math.round((sum(rows,'paid')-sum(rows,'refund'))*100)/100,average:rows.length?sum(rows,'paid')/rows.length:0,afterPending:rows.filter(ctx.activeAfter).length,shipping:shipping.length,shipped:shipping.filter(o=>['已发货','已收货'].includes(o.delivery)).length,received:shipping.filter(o=>o.delivery==='已收货').length,waiting:shipping.filter(o=>o.delivery==='待发货'&&o.qty>o.refundedQty).length,fundDue:Math.round(rows.reduce((n,o)=>n+ctx.fundDue(o),0)*100)/100,fundSettled:sum(rows,'fundSettled')};
 }
 function measure(ctx,period,productId=''){
  const all=ctx.orders.filter(o=>!productId||o.product===productId),paid=cohort(all,period.from,period.to),events=samples(ctx).filter(o=>(!productId||o.product===productId)&&inPeriod(o.date,period.from,period.to)),m=totals(paid,ctx),refunded=all.filter(o=>o.refund>0&&inPeriod(refundTime(o),period.from,period.to));
  const rollingFrom=stamp(new Date(+date(period.to)-29*day)),rollingPaid=cohort(all,rollingFrom,period.to),rollingRefunded=all.filter(o=>o.refund>0&&inPeriod(refundTime(o),rollingFrom,period.to));
  const refundDuration=o=>{const start=o.afterSubmittedAt,end=refundTime(o);if(!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(start||'')||!/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(end))return null;const hours=(new Date(end.replace(' ','T'))-new Date(start.replace(' ','T')))/3600000;return Number.isFinite(hours)&&hours>=0?hours:null;};
  const placed=all.filter(o=>inPeriod(o.date,period.from,period.to)),placedBuyers=unique(placed.map(o=>o.buyerId)),visitors=unique(events.flatMap(o=>o.visitors)),buyers=unique(paid.map(o=>o.buyerId)),oldBuyers=new Set(all.filter(o=>o.payment==='支付成功'&&(o.paidAt||o.date).slice(0,10)<period.from).map(o=>o.buyerId)),consultations=sum(events,'consultations'),replied=sum(events,'replied');
  const durations=(end,start)=>(paid.filter(o=>o.method==='快递配送').map(o=>{const a=end(o),b=start(o);return a&&b?(new Date(a.replace(' ','T'))-new Date(b.replace(' ','T')))/3600000:null;}).filter(n=>n!==null&&n>=0));
  const mean=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:null;
  Object.assign(m,{orderRate:visitors?placedBuyers/visitors*100:0,dealRate:placedBuyers?buyers/placedBuyers*100:0,lossIndex:null,buyers,average:buyers?m.paid/buyers:0,visitors,views:sum(events,'views'),visitedProducts:unique(events.map(o=>o.product)),favorites:sum(events,'favorites'),conversion:visitors?buyers/visitors*100:0,oldBuyerRate:buyers?unique(paid.filter(o=>oldBuyers.has(o.buyerId)).map(o=>o.buyerId))/buyers*100:0,shopVisitors:visitors,shopViews:sum(events,'views'),searchHeat:sum(events,'searchHeat'),searchIndex:sum(events,'searchIndex'),fans:samples(ctx).filter(o=>o.date<=period.to).reduce((n,o)=>n+o.newFans,0),newFans:sum(events,'newFans'),refund:sum(refunded,'refund'),refundOrders:refunded.length,refundRate:rollingPaid.length?rollingRefunded.length/rollingPaid.length*100:null,qualityRefunds:0,qualityRate:0,refundHours:mean(rollingRefunded.map(refundDuration).filter(n=>n!==null)),returnHours:null,selfRefundHours:null,replyRate:consultations?replied/consultations*100:null,consultations,needReply:consultations,servicePeople:replied,responseSeconds:events.length?sum(events,'responseSeconds')/events.length:null,consultConversion:consultations?Math.min(buyers,replied)/consultations*100:0,serviceSales:0,unreplied:consultations-replied,logisticsRate:0,logisticsErrors:0,shipHours:mean(durations(o=>o.shippedAt,o=>o.paidAt||o.date)),collectHours:mean(durations(o=>o.shipments?.[0]?.events?.find(e=>/揽收|取件/.test(e.text||e.status||''))?.time,o=>o.paidAt||o.date)),signHours:mean(durations(o=>o.signedAt||o.received,o=>o.paidAt||o.date)),uvValue:visitors?m.paid/visitors:0,fanOrders:0,fanShare:0,fanPaid:0,fanRepurchase:0,fundPending:Math.max(0,m.fundDue-m.fundSettled),fundPaused:paid.reduce((n,o)=>n+ctx.pausedFund(o),0)});
  // These statistics require data not supplied by the current product.
  for(const key of ['searchHeat','searchIndex','fans','newFans','fanOrders','fanShare','fanPaid','fanRepurchase','qualityRefunds','qualityRate','logisticsRate','logisticsErrors','serviceSales'])m[key]=null;
  if(!events.length)for(const key of ['orderRate','dealRate','visitors','views','visitedProducts','favorites','conversion','shopVisitors','shopViews','uvValue','consultations','needReply','servicePeople','responseSeconds','consultConversion','replyRate','unreplied'])m[key]=null;
  m.shipSignHours=mean(durations(o=>o.signedAt,o=>o.shippedAt));m.collectSignHours=mean(durations(o=>o.signedAt,o=>o.shipments?.[0]?.events?.find(e=>/揽收|取件/.test(e.text||e.status||''))?.time));m.logisticsComplaintRate=null;m.logisticsComplete=null;
  return m;
 }
 const labels={orderRate:'下单率',dealRate:'成交率',lossIndex:'流量损失指数',paid:'成交金额',orders:'成交订单数',qty:'成交件数',buyers:'成交买家数',average:'客单价',conversion:'成交转化率',oldBuyerRate:'成交老买家占比',visitors:'商品访客数',views:'商品浏览量',visitedProducts:'被访问商品数',favorites:'商品收藏用户数',shopVisitors:'店铺访客数',shopViews:'店铺浏览量',searchHeat:'整体商品搜索热度',searchIndex:'整体搜索销售指数',fans:'累计粉丝数',newFans:'新增粉丝数',refund:'成功退款金额',refundOrders:'成功退款订单数',refundRate:'成功退款率',qualityRefunds:'品质退款数',qualityRate:'品质退款率',refundHours:'平均退款时长',returnHours:'退货退款自主完结时长',selfRefundHours:'退款自主完结时长',replyRate:'3分钟人工回复率',servicePeople:'人工接待人数',responseSeconds:'平均人工响应时长',consultConversion:'询单转化率',serviceSales:'客服销售额',consultations:'咨询人数',needReply:'需人工回复的咨询人数',unreplied:'当前待回复人数',shipSignHours:'发货到签收',collectSignHours:'揽件到签收',logisticsComplaintRate:'物流投诉率',logisticsComplete:'物流详情完整度',logisticsRate:'物流异常率',logisticsErrors:'物流异常数',shipHours:'成交到发货时长',collectHours:'成交到揽件时长',signHours:'成交到签收时长',uvValue:'成交UV价值',fanOrders:'粉丝订单量',fanShare:'粉丝订单占比',fanPaid:'粉丝成交金额',fanRepurchase:'粉丝复购率',fundDue:'应计公益款',fundSettled:'已到账公益款',fundPending:'待到账公益款',fundPaused:'售后暂停公益款',afterPending:'售后处理中订单数',shipping:'快递订单数',shipped:'已发货订单数',received:'已收货订单数',waiting:'待发货订单数'};
 const metricDefinitions={
  refundOrders:'统计日期内成功退款的订单总数。',
  refund:'统计日期内实际成功退还的金额合计，以退款成功金额为准。',
  refundRate:'截至统计日期近30天退款成功订单数 ÷ 近30天支付成功订单数 × 100%。',
  qualityRefunds:'截至统计日期近30天退款成功、且申请原因为商品品质问题的订单数。',
  qualityRate:'截至统计日期近30天支付成功的订单中，品质退款订单数 ÷ 该期间支付成功订单数 × 100%。',
  refundHours:'截至统计日期近30天成功退款订单，从申请退款至退款成功的平均时长。',
  returnHours:'截至统计日期近30天由商家自主处理完结的退货退款订单，平均退款完结时长。',
  selfRefundHours:'截至统计日期近30天由商家自主处理完结的退款订单，平均退款完结时长；包括未发货退款和已发货退款。',
  replyRate:'仅统计08:00—23:00的咨询：（咨询人数－3分钟未人工回复累计人数）÷ 咨询人数 × 100%。买家任一条消息超过3分钟未获人工回复，该买家计入未及时回复人数。',
  responseSeconds:'仅统计08:00—23:00，买家每条消息发出至人工客服回复的平均等待时长。',
  consultConversion:'最终成交人数 ÷ 询单人数 × 100%。最终成交人数为统计日询单、3日内下单且支付成功并归属于该客服的买家人数；客服归属优先取下单前最后咨询的客服。销售归因数据在3日后完整展示。',
  serviceSales:'统计日询单的买家在3日内下单且支付成功的订单金额合计，按询单日期归组；销售归因数据在3日后完整展示。'
 };
 const ratingDefinitions={
  '近30天3分钟人工回复率':'近30天08:00—23:00的咨询中，（咨询人数－3分钟未人工回复累计人数）÷ 咨询人数 × 100%。买家任一条消息超过3分钟未获人工回复，该买家计入未及时回复人数。',
  '近30天在途订单退款时长':'近30天消费者尚未签收的订单，平均退款处理时长。',
  '近30天商家签收消费者退货订单后的平均退款时长':'近30天退货订单，从退货物流显示商家签收到商家同意退款的平均时长。',
  '近30天严重劣质率':'近30天支付成功订单中产生的严重劣质订单数 ÷ 该期间支付成功订单数 × 100%。',
  '近30天成交至签收时效':'近30天订单从支付成功至物流签收的平均时长。',
  '近30天物流综合违规处理率':'近30天支付成功的快递订单中，已确认缺货或超过承诺发货时限的订单数 ÷ 该期间支付成功的快递订单数 × 100%。',
  '近30天店铺活跃度':'综合近30天商品发布、订单成交等店铺经营活动计算的活跃程度。',
  '近30天品质退款率':metricDefinitions.qualityRate,
 };

 const groups={'交易数据':['paid','buyers','orders','conversion','average'],'商品数据':['visitors','views','qty','visitedProducts','favorites'],'流量数据':['searchHeat','searchIndex','shopVisitors','shopViews','fans'],'售后数据':['refundOrders','refund','refundRate','refundHours'],'客服数据':['replyRate','responseSeconds','consultConversion','serviceSales'],'物流数据':['logisticsRate','logisticsErrors','shipHours','collectHours','signHours'],'公益数据':['fundDue','fundSettled','fundPending','fundPaused']};
 const moneyKeys=new Set(['paid','average','refund','serviceSales','uvValue','fanPaid','fundDue','fundSettled','fundPending','fundPaused']);
 const rateKeys=new Set(['orderRate','dealRate','conversion','oldBuyerRate','refundRate','interventionRate','disputeRate','qualityRate','replyRate','consultConversion','logisticsRate','fanShare','fanRepurchase']);
 function format(key,value){if(value===null||value===undefined)return '--';if(moneyKeys.has(key))return Number(value).toFixed(2);if(rateKeys.has(key))return Number(value).toFixed(2)+'%';if(key.endsWith('Hours'))return Number(value).toFixed(1)+'小时';if(key==='responseSeconds')return Math.round(value)+'秒';return Number(value).toLocaleString('zh-CN',{maximumFractionDigits:2});}
 function goalKey(ctx){return 'merchant-analytics-goals:'+ctx.products[0]?.shop;}
 function goals(ctx){try{const g=JSON.parse(localStorage.getItem(goalKey(ctx))||'{}');return Object.fromEntries(Object.entries(g).filter(([k,v])=>/^\d{4}-\d{2}$/.test(k)&&Number.isFinite(v)&&v>=0));}catch{return {};}}
 function saveGoals(ctx,values){const clean={};for(const [key,value] of Object.entries(values)){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)||String(value).trim()===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>10000000000)throw Error('目标成交额须为0至100亿元的金额');clean[key]=Math.round(Number(value)*100)/100;}localStorage.setItem(goalKey(ctx),JSON.stringify({...goals(ctx),...clean}));}
 function goalTable(ctx){
  const year=ctx.now.slice(0,4),g=goals(ctx),amount=(y,m)=>sum(cohort(ctx.orders,y+'-'+m+'-01',y+'-'+m+'-31'),'paid');let total=0,previous=0,target=0;
  const rows=Array.from({length:12},(_,i)=>{const month=String(i+1).padStart(2,'0'),key=year+'-'+month,paid=amount(year,month),prior=amount(Number(year)-1,month),value=g[key]||0;total+=paid;previous+=prior;target+=value;return '<tr><td>'+(i+1)+'月</td><td>'+format('paid',prior)+'</td><td>'+format('paid',paid)+'</td><td><input name="'+key+'" type="number" min="0" max="10000000000" step="0.01" required value="'+value+'" placeholder="请输入'+(i+1)+'月目标成交额" aria-label="'+(i+1)+'月目标成交额" data-goal-paid="'+paid+'"></td><td data-goal-progress="'+key+'">'+(value?(paid/value*100).toFixed(2)+'%':'--')+'</td></tr>';}).join('');
  return '<div class="full analytics-goal-scroll"><table class="analytics-goal-table"><thead><tr><th>月份</th><th>'+(Number(year)-1)+'年成交额(元)</th><th>'+year+'年成交额(元)</th><th>'+year+'年目标成交额(元)</th><th>每月完成度</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td>合计</td><td>'+format('paid',previous)+'</td><td>'+format('paid',total)+'</td><td data-goal-total>'+format('paid',target)+'</td><td data-goal-total-progress data-goal-total-paid="'+total+'">'+(target?(total/target*100).toFixed(2)+'%':'--')+'</td></tr></tfoot></table></div>';
 }
 function province(o){return o.province||o.receiver?.match(/([\u4e00-\u9fa5]{2,3})省/)?.[1]||o.receiver?.match(/(北京|上海|天津|重庆)市/)?.[1]||'未知地区';}
 function render(ctx){
  const {esc:e,btn,table,tr,state,now}=ctx,active=pages.includes(ctx.page)?ctx.page:'经营总览',period=range(ctx.detailOnly?{range:state.detailRange,from:state.detailFrom,to:state.detailTo}:ctx.regionOnly?{range:state.regionRange}:state,now)||range(defaults(),now),overviewPeriod=range({range:'昨日'},now),chosen=active==='经营总览'?overviewPeriod:period;
  const scoped=state.productId&&active==='商品数据'?ctx.products.find(p=>p.id===state.productId):null;
  const current=measure(ctx,chosen,scoped?.id),before=measure(ctx,{from:chosen.previousFrom,to:chosen.previousTo},scoped?.id),isReal=chosen.realtime,g=goals(ctx);
  const action=(label,key,value,cls='btn')=>btn(label,'analytics-control',key+'|'+value,cls);
  const empty=(text='暂无数据')=>'<div class="analytics-no-data">'+e(text)+'</div>';
  const modal=(title,body,key,cls='')=>'<div class="analytics-dialog-shade"><section class="dialog analytics-data-dialog '+cls+'" role="dialog" aria-modal="true" aria-label="'+e(title)+'"><header class="dialog-head"><h2>'+e(title)+'</h2>'+action('<span aria-hidden="true">×</span><span class="sr-only">关闭弹窗</span>',key,'','icon-btn')+'</header><div class="dialog-body analytics-page">'+body+'</div></section></div>';
  if(scoped&&!ctx.detailOnly)return render({...ctx,state:{...state,productId:''}})+modal('商品数据详情',render({...ctx,detailOnly:true}),'productId','analytics-product-dialog');
  if(state.region&&active==='交易数据'&&!ctx.regionOnly)return render({...ctx,state:{...state,region:''}})+modal(state.region+'交易数据',render({...ctx,regionOnly:true,orders:ctx.orders.filter(o=>province(o)===state.region)}),'region','analytics-region-dialog');
  const helpLabel=label=>ratingDefinitions[label]?'<span class="analytics-definition-label" tabindex="0" data-metric-definition="'+e(ratingDefinitions[label])+'">'+e(label)+'</span>':e(label);
  const regionPeriod=range({range:state.regionRange},now)||range({range:'昨日'},now);
  const detailPeriod=range({range:state.detailRange,from:state.detailFrom,to:state.detailTo},now)||period;
  const time=p=>'<span class="analytics-time">统计时间：'+(p.realtime?now:p.from)+(p.from===p.to?'':' ～ '+p.to)+'</span>';
  const section=(title,body,near='',right='',cls='')=>'<section class="card analytics-section '+cls+'"><header class="analytics-section-head"><div class="analytics-section-title"><h2>'+e(title)+'</h2>'+near+'</div>'+right+'</header>'+body+'</section>';
  const datebar=(mode='full',detail=false)=>{if(mode==='single')return '<div class="analytics-datebar analytics-datebar-single"><input type="date" data-analytics-day aria-label="售后统计日期" value="'+chosen.to+'" max="'+now.slice(0,10)+'"></div>';const regional=mode==='region';detail=detail||Boolean(ctx.detailOnly);const selected=regional?state.regionRange:detail?state.detailRange:state.range,p=regional?regionPeriod:detail?detailPeriod:period;return '<div class="analytics-datebar analytics-datebar-'+mode+'">'+(regional?['昨日','7日','30日']:mode==='single'?['自定义']:mode==='full'?ranges:['昨日','7日','30日','自定义']).map(name=>btn(mode==='single'?chosen.to.slice(5):mode==='fans'?({'昨日':'昨天','7日':'近7天','30日':'近30天','自定义':'指定日期'})[name]:mode==='traffic'?({'7日':'近7日','30日':'近30日','自定义':'日'})[name]||name:mode==='customer'?({'昨日':'近1天','7日':'近7天','30日':'近30天'})[name]||name:name,'analytics-range',(regional?'region:':detail?'detail:':'')+name,'btn'+(selected===name?' selected':''))).join('')+(selected==='自定义'?'<form id="'+(ctx.detailOnly?'analytics-product-date-form':detail?'analytics-detail-date-form':'analytics-date-form')+'"><input aria-label="开始日期" type="date" name="from" value="'+p.from+'" max="'+now.slice(0,10)+'" required><span>至</span><input aria-label="结束日期" type="date" name="to" value="'+p.to+'" max="'+now.slice(0,10)+'" required><button class="btn primary" type="submit">查询</button></form>':'')+'</div>';};
  function metricCards(keys,target=active,options={}){
   const values=options.values||current,prev=options.before||before,selected=keys.includes(state.metric)?state.metric:keys[0];
   return '<div class="analytics-metrics'+(options.cols===8?' analytics-metrics-compact':'')+'" style="--metric-columns:'+Math.min(keys.length,options.cols||5)+'">'+keys.map(key=>{
    let a=values[key],b=prev[key];if(active==='商品数据'&&!scoped&&isReal&&key==='favorites'){a=measure(ctx,overviewPeriod,scoped?.id)[key];b=measure(ctx,{from:overviewPeriod.previousFrom,to:overviewPeriod.previousTo},scoped?.id)[key];}let comparison='--';
    if(a!==null&&b!==null&&a!==undefined&&b!==undefined)comparison=b?((a-b)/Math.abs(b)*100).toFixed(2)+'%':a===0?'0.00%':'--';
    const special=active==='商品数据'&&!scoped&&isReal&&key==='favorites'?'昨日收藏用户数':active==='经营总览'&&key==='qty'?'商品成交件数':active==='经营总览'&&key==='favorites'?'商品收藏总数':labels[key];
    const prior=active==='经营总览'&&key==='fans'?'本周新增':active==='商品数据'&&!scoped&&isReal&&key==='favorites'?'较前1日':isReal&&active!=='经营总览'?'昨日':'较前'+(options.days||chosen.days||1)+'日';
    return '<button type="button" class="analytics-metric'+(selected===key&&target===active?' active':'')+'" aria-pressed="'+(selected===key&&target===active)+'" data-action="analytics-metric" data-id="'+e(target+'|'+key)+'"><span'+(metricDefinitions[key]?' data-metric-definition="'+e(metricDefinitions[key])+'"':'')+'>'+e(special)+'</span><strong data-metric="'+key+'">'+format(key,a)+(options.units&&moneyKeys.has(key)?'<em>元</em>':'')+'</strong><small>'+prior+'<b>'+e(active==='经营总览'&&key==='fans'?format('newFans',measure(ctx,range({range:'7日'},now)).newFans):isReal&&active!=='经营总览'&&key!=='favorites'?format(key,b):comparison)+'</b></small></button>';
   }).join('')+'</div>';
  }
  function trend(keys,chartPeriod=chosen,dailyOnly=false){
   const metric=keys.includes(state.metric)?state.metric:keys[0];
   const points=[];
   if(isReal&&active!=='经营总览'&&!dailyOnly){
    const hrs=Number(now.slice(11,13));for(let i=0;i<24;i++){
     const rows=ctx.orders.filter(o=>(!scoped||o.product===scoped.id)&&o.payment==='支付成功'&&(o.paidAt||o.date).slice(0,10)===period.to&&Number((o.paidAt||o.date).slice(11,13))===(i));
     let value=totals(rows,ctx)[metric];if(value===undefined)value=null;
     points.push({label:String(i).padStart(2,'0')+':00',value:i<=hrs?value:null});
    }
   }else for(let i=0;i<chartPeriod.days;i++){const d=stamp(new Date(+date(chartPeriod.from)+i*day));points.push({label:d.slice(5),value:measure(ctx,{from:d,to:d},scoped?.id)[metric]});}
   let cumulative=0;const data=points.map(p=>{if(p.value===null)return p;if(isReal&&!dailyOnly&&state.trend!=='时段趋势图'&&!rateKeys.has(metric)&&!metric.endsWith('Hours')&&metric!=='responseSeconds')cumulative+=p.value;return {...p,value:isReal&&!dailyOnly&&state.trend!=='时段趋势图'&&!rateKeys.has(metric)&&!metric.endsWith('Hours')&&metric!=='responseSeconds'?cumulative:p.value};});
   if(!data.some(p=>p.value!==null&&p.value!==undefined))return '<div class="analytics-trend-options"><select data-analytics-metric aria-label="趋势指标">'+keys.map(k=>'<option value="'+k+'"'+(k===metric?' selected':'')+'>'+labels[k]+'</option>').join('')+'</select></div>'+empty();
   const max=Math.max(1,...data.map(p=>p.value||0)),x=i=>60+(data.length===1?390:i/(data.length-1)*780),y=v=>190-v/max*150;
   const svg='<div class="analytics-chart"><svg viewBox="0 0 900 235" role="img" aria-label="'+e(labels[metric])+'趋势"><title>'+e(labels[metric])+'</title>'+[0,.25,.5,.75,1].map(t=>'<line x1="60" x2="840" y1="'+y(max*t)+'" y2="'+y(max*t)+'" class="analytics-gridline"/><text x="52" y="'+(y(max*t)+4)+'" text-anchor="end">'+(max*t).toFixed(moneyKeys.has(metric)?2:0)+'</text>').join('')+'<polyline class="analytics-trend-line" points="'+data.map((d,i)=>d.value===null?'':x(i)+','+y(d.value)).filter(Boolean).join(' ')+'"/>'+data.map((d,i)=>d.value===null?'':'<circle cx="'+x(i)+'" cy="'+y(d.value)+'" r="3" tabindex="0"><title>'+d.label+'：'+e(format(metric,d.value))+'</title></circle>').join('')+[0,Math.floor((data.length-1)/2),data.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>'<text x="'+x(i)+'" y="218" text-anchor="middle">'+data[i].label+'</text>').join('')+'</svg></div>';
   return '<div class="analytics-trend-options"><label><select data-analytics-metric aria-label="趋势指标">'+keys.map(k=>'<option value="'+k+'"'+(k===metric?' selected':'')+'>'+labels[k]+'</option>').join('')+'</select></label>'+(active==='交易数据'?'<span class="spacer"></span>'+['累计趋势图','时段趋势图'].map(v=>action(v,'trend',v,'btn'+(state.trend===v?' selected':''))).join(''):'')+'</div>'+svg;
  }
  const overviewLink=name=>btn('进入'+name,'analytics-page',name,'btn analytics-enter');
  const statTable=(heads,rows)=>table(heads,rows.map(tr));
  const goodsTable=(heads,rows)=>'<div class="table-wrap" tabindex="0" aria-label="商品数据列表"><table><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(tr).join(''):'<tr><td colspan="'+heads.length+'"><div class="empty">暂无符合条件的记录</div></td></tr>')+'</tbody></table></div><div class="table-footer">共 '+rows.length+' 条记录</div>';
  const linkOrder=o=>btn(e(o.id),'analytics-order',o.id,'link')||e(o.id);
  const orderTable=(list,heads,cells)=>statTable(['订单编号','商品',...heads,'操作'],list.map(o=>[linkOrder(o),e(o.productName||o.product),...cells(o),btn('查看详情','analytics-order',o.id,'link')]));
  const paid=cohort(ctx.orders,chosen.from,chosen.to);
  const serviceTabs=['成长层级','综合体验星级','商品领航员','售后数据','客服数据','消费者体验指标'];
  const serviceNav=()=>'<div class="analytics-inner-tabs">'+serviceTabs.map(t=>t==='售后数据'||t==='客服数据'?btn(t,'analytics-page',t,'tab'+(active===t?' active':'')):action(t,'sub',t,'tab'+(active==='服务数据'&&(state.sub||'成长层级')===t?' active':''))).join('')+'</div>';
  let content='';
  if(active==='经营总览'){
   const month=now.slice(0,7),year=now.slice(0,4),monthPaid=sum(cohort(ctx.orders,month+'-01',now.slice(0,10)),'paid'),yearPaid=sum(cohort(ctx.orders,year+'-01-01',now.slice(0,10)),'paid'),yearGoal=Object.entries(g).filter(([key])=>key.startsWith(year)).reduce((n,[,v])=>n+v,0);
   const plan=(title,amount,target)=>'<div class="analytics-plan-item"><div class="analytics-progress" style="--progress:'+Math.min(100,target?amount/target*100:0)+'%"><strong>'+(target?amount/target*100:0).toFixed(2)+'%</strong><span>完成进度</span></div><div><h3>'+title+'</h3><p>目标 <b>'+(target?format('paid',target)+'元':'暂无设置')+'</b></p><p>已完成 <b>'+format('paid',amount)+'元</b></p></div></div>';
   content='<section class="card analytics-summary"><div class="analytics-level"><h2>成长层级 <small>（每日更新）</small></h2><strong>'+growth(ctx,now).level+'<em>级</em></strong><div>'+btn('去查看','analytics-page','服务数据','link')+'</div></div><div class="analytics-score"><h2>店铺经营评分 <small>（每日更新）</small></h2><strong>--</strong>'+action('查看优化建议','sub','消费者体验指标','link')+'</div><div class="analytics-plan"><header><h2>经营计划</h2>'+btn('设置经营目标','analytics-goals','','link')+'</header><div class="analytics-plan-items">'+plan('本月销售情况',monthPaid,g[month])+plan('全年销售情况',yearPaid,yearGoal)+'</div></div></section>';
   content+=Object.entries(groups).map(([name,keys])=>{const p=name==='物流数据'?range({range:'30日'},now):chosen;return section(name,metricCards(keys,name,{units:true,days:p.days,values:measure(ctx,p),before:measure(ctx,{from:p.previousFrom,to:p.previousTo})}),overviewLink(name),time(p),'analytics-overview-section');}).join('');
  }else if(active==='交易数据'){
   const keys=ctx.regionOnly?['paid','orders','average']:['paid','orders','buyers','conversion','average','oldBuyerRate'];
   if(ctx.regionOnly)return time(regionPeriod)+datebar('region')+metricCards(keys,active,{cols:3})+trend(keys,regionPeriod,true);
   content=section('交易概况',datebar()+metricCards(keys,active,{cols:6})+'<div class="analytics-secondary-metrics">'+[['昨日关注用户数',format('newFans',measure(ctx,overviewPeriod).newFans)],['昨日退款金额',format('refund',measure(ctx,overviewPeriod).refund)],['昨日退款单数',measure(ctx,overviewPeriod).refundOrders],['昨日访客价值',format('uvValue',measure(ctx,overviewPeriod).uvValue)]].map(([label,v])=>'<div><span>'+label+'</span><strong>'+v+'</strong></div>').join('')+'</div>'+trend(keys),'',time(chosen));
   const year=now.slice(0,4),yearRows=Array.from({length:12},(_,i)=>{const month=year+'-'+String(i+1).padStart(2,'0'),amount=sum(cohort(ctx.orders,month+'-01',month+'-31'),'paid'),target=g[month]||0;const priorMonth=(Number(year)-1)+month.slice(4),prior=sum(cohort(ctx.orders,priorMonth+'-01',priorMonth+'-31'),'paid');return [(i+1)+'月',format('paid',prior),format('paid',amount),format('paid',target),target?(amount/target*100).toFixed(2)+'%':'--%'];});
   content+=section('年度经营情况','<div class="analytics-annual">'+[yearRows.slice(0,6),yearRows.slice(6)].map(rows=>statTable(['月份',(Number(year)-1)+'年成交额(元)',year+'年成交额(元)',year+'年目标成交额(元)','每月完成度'],rows)).join('')+'</div>',btn('设置目标成交额','analytics-goals','','btn'),time({from:now,to:now}));
   const pending=ctx.orders.filter(o=>o.payment!=='支付成功'&&o.delivery!=='已取消');
   content+=section('订单数据','<div class="analytics-inline-stats">'+[['下单待付款订单数',pending.length],['下单待付款金额',format('paid',sum(pending,'paid'))+'元'],['待到账金额',format('paid',ctx.orders.filter(o=>o.payment==='支付成功').reduce((n,o)=>n+Math.max(0,o.paid-o.refund-o.settled),0))+'元']].map(([label,v])=>'<div><span>'+label+'</span><strong>'+v+'</strong></div>').join('')+'</div>','',time({from:now,to:now}));
   content+=section('催付数据','<div class="analytics-inline-stats"><div><span>引导下单人数</span><strong>--</strong></div><div><span>引导成交金额</span><strong>--</strong></div></div>','',time(chosen));
   const regionPaid=cohort(ctx.orders,regionPeriod.from,regionPeriod.to),provinces=[...new Set(regionPaid.map(o=>province(o)))];
   content+=section('地区交易数据',datebar('region')+statTable(['省份','成交金额(元)','成交订单数','成交买家数','成交订单单价(元)','成交客单价(元)','操作'],provinces.map(p=>{const rows=regionPaid.filter(o=>(province(o))===p),m=totals(rows,ctx);return [e(p),format('paid',m.paid),m.orders,m.buyers,format('paid',m.average),format('paid',m.buyers?m.paid/m.buyers:0),action('查看详情','region',p,'link')];}))+(state.region?'<div class="analytics-detail"><h3>'+e(state.region)+'交易明细 '+action('收起','region','','link')+'</h3>'+orderTable(regionPaid.filter(o=>(province(o))===state.region),['成交金额(元)'],o=>[format('paid',o.paid)])+'</div>':''),'',time(regionPeriod));
  }else if(active==='商品数据'){
   const keys=scoped?['visitors','views','paid','qty','orders','buyers','conversion','favorites','orderRate','dealRate','lossIndex']:['visitors','views','favorites','visitedProducts','paid','orders','buyers','conversion'];
   if(scoped)content='<div class="analytics-detail-bar">'+'<strong>'+e(scoped.name)+'</strong><span>ID：'+e(scoped.id)+'</span>'+btn('编辑商品','analytics-edit-product',scoped.id)+'</div>';
   content+=section(scoped?'数据明细':'商品概况',datebar()+metricCards(keys,active,{cols:4})+trend(keys),'',time(chosen));
   if(!scoped){
    const columns=state.columns.split(',').filter(k=>['visitors','views','paid','qty','orders','buyers','conversion','favorites','orderRate','dealRate','lossIndex'].includes(k)),query=state.query.trim().toLowerCase(),sort=['favorites','views','visitors','conversion','paid','qty','orders','buyers','orderRate','dealRate','lossIndex','refund'].includes(state.sort)?state.sort:'favorites';
    const goods=ctx.products.filter(p=>!query||query.split(/[,，]/).some(q=>q.trim()&&[p.id,p.name].some(v=>v.toLowerCase().includes(q.trim())))).map(p=>({p,m:measure(ctx,detailPeriod,p.id)})).sort((a,b)=>(state.direction==='asc'?-1:1)*((b.m[sort]||0)-(a.m[sort]||0))||a.p.id.localeCompare(b.p.id));
    const filter='<div class="analytics-goods-top"><div class="analytics-ranks">'+[['收藏榜','favorites'],['浏览量榜','views'],['访客榜','visitors'],['成交转化榜','conversion']].map(([label,k])=>action(label,'sort',k,'tab'+(sort===k?' active':''))).join('')+'</div><form id="analytics-goods-form"><input name="query" aria-label="商品查询" placeholder="请输入商品名称或ID搜索，多个ID用逗号隔开" value="'+e(state.query)+'"><button class="btn primary" type="submit">查询</button></form></div>';
    content+=section('商品明细',filter+'<div class="analytics-goods-dates">'+time(detailPeriod)+datebar('full',true)+'</div><div class="analytics-columns">'+['visitors','views','paid','qty','orders','buyers','conversion','favorites','orderRate','dealRate','lossIndex'].map(k=>'<label><input type="checkbox" data-analytics-column="'+k+'"'+(columns.includes(k)?' checked':'')+'>'+labels[k]+'</label>').join('')+'</div>'+goodsTable(['商品信息',...columns.map(k=>action(labels[k]+(moneyKeys.has(k)?'(元)':'')+' <span aria-hidden="true">'+(sort===k?(state.direction==='asc'?'↑':'↓'):'↕')+'</span>','sort',k,'analytics-sort-button')),'操作'],goods.map(({p,m})=>[ctx.productEntity(p),...columns.map(k=>'<span>'+format(k,m[k])+'</span><small class="analytics-cell-previous">'+(detailPeriod.realtime?'昨日 ':'较前'+detailPeriod.days+'日 ')+format(k,measure(ctx,{from:detailPeriod.previousFrom,to:detailPeriod.previousTo},p.id)[k])+'</small>'),'<div class="analytics-row-actions">'+btn('数据详情','analytics-goods',p.id,'link')+btn('编辑商品','analytics-edit-product',p.id,'link')+'</div>'])));
   }else {content+=section('近30日售后数据',metricCards(['refundOrders','refund'],active,{cols:3,values:measure(ctx,range({range:'30日'},now),scoped.id)}),'',time(range({range:'30日'},now)));content+=section('商品成交订单',orderTable(paid.filter(o=>o.product===scoped.id),['成交金额(元)','数量'],o=>[format('paid',o.paid),o.qty]));}
  }else if(active==='流量数据'){
   content='<div class="analytics-inner-tabs">'+action('流量看板','sub','流量看板','tab'+(state.sub!=='搜索流量'?' active':''))+action('搜索流量','sub','搜索流量','tab'+(state.sub==='搜索流量'?' active':''))+'</div>';
   const realtime=measure(ctx,range({range:'实时'},now));
   if(state.sub!=='搜索流量')content+=section('实时数据',metricCards(['shopVisitors','shopViews','visitors','views'],active,{values:realtime,cols:4}),'','<span class="analytics-time">更新时间：'+e(now)+'</span>');
   const keys=state.sub==='搜索流量'?['searchHeat','searchIndex']:['shopVisitors','shopViews','visitors','views','buyers','orders','paid','conversion','average','uvValue'];
   content+=section('数据总览',datebar(state.sub==='搜索流量'?'short':'traffic')+metricCards(keys,active,{cols:5})+trend(keys),'',time(chosen));
  }else if(active==='粉丝数据'){
   content=section('粉丝运营数据','<div class="analytics-inline-stats">'+[['当前粉丝总数',format('fans',current.fans)],['本周新增粉丝数','--'],['上周新增粉丝数量','--']].map(([label,v])=>'<div><span>'+label+'</span><strong>'+v+'</strong></div>').join('')+'</div>','','<span class="analytics-time">数据更新截止至：'+chosen.to+'</span>');
   content+=section('粉丝交易数据',datebar('fans')+metricCards(['fanOrders','fanShare','fanPaid','fanRepurchase'],active,{cols:4})+'<h3 class="analytics-trend-title">近30天趋势图</h3>'+trend(['fanOrders','fanPaid','fanShare','fanRepurchase'],range({range:'30日'},now),true),'','<span class="analytics-time">数据更新截止至：'+chosen.to+'</span>');
  }else if(active==='服务数据'){
   const sub=serviceTabs.includes(state.sub)?state.sub:'成长层级';content=serviceNav();
   if(sub==='成长层级'){
    const rating=growth(ctx,now);
    const rows=growthThresholds.map((minimum,index)=>'<tr'+(rating.level===index+1?' class="analytics-growth-current" aria-current="true"':'')+'><td>'+(index+1)+'级'+(rating.level===index+1?' · 当前层级':'')+'</td><td>≥ '+minimum+' 元'+(growthThresholds[index+1]===undefined?'':'，＜ '+growthThresholds[index+1]+' 元')+'</td></tr>').join('');
    content+=section('成长层级','<div class="analytics-service-level"><div><span>当前层级</span><strong>'+rating.level+'<em>级</em></strong></div><div><h3><span class="analytics-definition-label" tabindex="0" data-metric-definition="截至昨日近30天支付成功订单的商品实付金额合计 ÷ 30，商品实付金额不含运费。开店不足30天仍除以30。">近30天日均交易额</span> '+format('paid',rating.daily)+' 元</h3><p class="muted">'+(rating.next===undefined?'已达到最高层级':'距离'+(rating.level+1)+'级还需日均 '+format('paid',rating.gap)+' 元')+'</p></div></div><h3 class="analytics-trend-title">评级标准</h3>'+table(['层级','近30天日均交易额'],[rows],false)+'<p class="analytics-growth-note muted">每日更新，统计周期：'+rating.period.from+' 至 '+rating.period.to+'。日均交易额 = 近30天商品实付金额合计 ÷ 30，开店不足30天仍按30天计算。</p>','','<span class="analytics-time">每日更新</span>');
   }
   else if(sub==='综合体验星级'){
    const starMode=state.range==='7日'?'7日':'30日',starPeriod=range({range:starMode},now);
    const dimensions=[
     ['售后服务',['近30天3分钟人工回复率','近30天在途订单退款时长','近30天商家签收消费者退货订单后的平均退款时长']],
     ['商品品质',['近30天严重劣质率']],
     ['物流服务',['近30天成交至签收时效','近30天物流综合违规处理率']],
     ['店铺活跃',['近30天店铺活跃度']]
    ];
    const dimensionRows=dimensions.map(([name,items])=>items.map((label,i)=>'<tr>'+(i===0?'<td rowspan="'+items.length+'" class="analytics-dimension-name">'+name+'</td>':'')+'<td>'+helpLabel(label)+'</td><td>--</td><td>--</td></tr>').join('')).join('');
    content+=section('店铺综合体验星级','<div class="analytics-star-summary"><div class="analytics-star-value"><strong>--</strong><span class="analytics-star-icons" aria-hidden="true">☆ ☆ ☆ ☆ ☆</span></div><p>暂无店铺星级数据</p></div><div class="analytics-star-trend-head"><h3>星级趋势图</h3><span class="analytics-time">统计时间：'+starPeriod.from+' 至 '+starPeriod.to+'</span><div class="analytics-star-ranges">'+['7日','30日'].map(value=>btn('近'+value,'analytics-range',value,'btn'+(starMode===value?' selected':''))).join('')+'</div></div><div class="analytics-star-chart" role="img" aria-label="星级趋势暂无评分数据"><div>暂无评分数据</div><span>'+starPeriod.from+'</span><span>'+starPeriod.to+'</span></div>','','<span class="analytics-time">统计时间：--</span>','analytics-experience');
    content+=section('维度指标表现明细','<div class="table-wrap"><table class="analytics-dimension-table"><thead><tr><th>体验维度</th><th>考核指标</th><th>店铺表现</th><th>下一星级（--星）标准</th></tr></thead><tbody>'+dimensionRows+'</tbody></table></div>','','<span class="analytics-time">综合分行业排名：--</span>');
   }
   else if(sub==='消费者体验指标')content+=section(sub,'<div class="analytics-empty-score"><strong>--分</strong><p>暂无评分数据</p></div>'+metricCards(['refundRate','replyRate','shipHours']),btn('刷新','analytics-refresh'));
   else if(sub==='商品领航员'){
    const ids=(state.pilotIds||'').trim().split(/[\s,，]+/).filter(Boolean),name=(state.pilotName||'').trim().toLowerCase(),products=ctx.products.filter(p=>(!ids.length||ids.includes(p.id))&&(!name||p.name.toLowerCase().includes(name)));
    const rows=products.map(p=>'<tr><td>'+ctx.productEntity(p)+'</td><td>'+helpLabel('近30天品质退款率')+'</td><td>'+format('qualityRate',measure(ctx,range({range:'30日'},now),p.id).qualityRate)+'</td></tr>').join('');
    const filters='<form id="analytics-pilot-form" class="analytics-pilot-filters"><label>商品ID<input name="pilotIds" value="'+e(state.pilotIds||'')+'" placeholder="最多输入10个，ID之间以空格隔开"></label><label>商品名称<input name="pilotName" value="'+e(state.pilotName||'')+'" placeholder="请输入"></label><button type="submit" class="btn primary">查询</button>'+btn('重置','analytics-pilot-reset')+'</form>';
    content+=section('商品领航员',filters+'<div class="table-wrap"><table class="analytics-pilot-table"><thead><tr>'+['商品信息','考核指标','商品表现'].map(label=>'<th>'+helpLabel(label)+'</th>').join('')+'</tr></thead><tbody>'+(rows||'<tr><td colspan="3">暂无符合条件的商品</td></tr>')+'</tbody></table></div><div class="table-footer">共有 '+products.length+' 条</div>','','<span class="analytics-time">统计时间：--</span>');
   }
  }else if(active==='售后数据'){
   const keys=['refundOrders','refund','refundRate','qualityRefunds','qualityRate','refundHours','returnHours','selfRefundHours'];
   content=serviceNav()+section('售后考核指标',metricCards(keys,active,{cols:8})+trend(keys),btn('刷新','analytics-refresh'),datebar('single'));
   content+=section('近30日高退款商品',statTable(['商品信息','成功退款订单数','成功退款金额(元)','品质退款率'],ctx.products.map(p=>({p,m:measure(ctx,range({range:'30日'},now),p.id)})).filter(({m})=>m.refundOrders).sort((a,b)=>b.m.refundOrders-a.m.refundOrders).map(({p,m})=>[ctx.productEntity(p),m.refundOrders,format('refund',m.refund),format('qualityRate',m.qualityRate)])),'',time(chosen));
  }else if(active==='客服数据'){
   const keys=['replyRate','responseSeconds','consultConversion','serviceSales'],metric=keys.includes(state.metric)?state.metric:keys[0];
   const latest=range({range:'昨日'},now),history=range({range:'30日'},now),values=measure(ctx,latest),previous=measure(ctx,{from:latest.previousFrom,to:latest.previousTo});
   const serviceValue=(key,value,withUnit=true)=>{
    if(value===null||value===undefined)return '--';
    if(key==='responseSeconds')return (value/60).toFixed(2)+(withUnit?' 分钟':'');
    if(key==='serviceSales')return Number(value).toFixed(2)+(withUnit?' 元':'');
    return format(key,value);
   };
   const cards='<div class="analytics-metrics analytics-service-metrics">'+keys.map(key=>{
    const value=values[key],prior=previous[key],difference=value==null||prior==null?null:value-prior;
    return '<button type="button" class="analytics-metric'+(metric===key?' active':'')+'" aria-pressed="'+(metric===key)+'" data-action="analytics-metric" data-id="客服数据|'+key+'"><span data-metric-definition="'+e(metricDefinitions[key])+'">'+e(labels[key])+'</span><strong data-metric="'+key+'">'+e(serviceValue(key,value))+'</strong><small>较前一天 <b>'+e(serviceValue(key,difference,false))+'</b></small></button>';
   }).join('')+'</div>';
   const points=Array.from({length:history.days},(_,i)=>{
    const d=stamp(new Date(+date(history.from)+i*day));return {date:d,value:measure(ctx,{from:d,to:d})[metric]};
   });
   const numeric=points.filter(p=>p.value!=null).map(p=>metric==='responseSeconds'?p.value/60:p.value);
   const max=rateKeys.has(metric)?Math.max(100,...numeric):Math.max(1,...numeric),x=i=>65+i/(points.length-1)*1110,y=v=>280-v/max*255;
   const axis=value=>rateKeys.has(metric)?value.toFixed(2)+'%':value.toFixed(2)+(metric==='responseSeconds'?'分钟':'元');
   const segments=[];let segment=[];
   for(let i=0;i<points.length;i++){
    if(points[i].value==null){if(segment.length)segments.push(segment);segment=[];continue;}
    segment.push(x(i)+','+y(metric==='responseSeconds'?points[i].value/60:points[i].value));
   }
   if(segment.length)segments.push(segment);
   const ticks=[0,5,10,15,20,25,points.length-1];
   const chart='<div class="analytics-chart analytics-service-chart"><svg viewBox="0 0 1200 320" role="img" aria-label="'+e(labels[metric])+'近30天趋势"><title>'+e(labels[metric])+'近30天趋势</title>'+
    [0,max].map(v=>'<line x1="65" x2="1175" y1="'+y(v)+'" y2="'+y(v)+'" class="analytics-gridline"/><text x="57" y="'+(y(v)+4)+'" text-anchor="end">'+e(axis(v))+'</text>').join('')+
    segments.map(segment=>'<polyline class="analytics-trend-line" points="'+segment.join(' ')+'"/>').join('')+
    points.map((point,i)=>point.value==null?'':'<circle cx="'+x(i)+'" cy="'+y(metric==='responseSeconds'?point.value/60:point.value)+'" r="3" tabindex="0"><title>'+point.date+'：'+e(serviceValue(metric,point.value))+'</title></circle>').join('')+
    ticks.map(i=>'<text x="'+x(i)+'" y="302" text-anchor="'+(i===points.length-1?'end':'middle')+'">'+points[i].date+'</text>').join('')+'</svg>'+(numeric.length?'':'<span class="analytics-service-empty">暂无数据</span>')+'</div>';
   content=serviceNav()+section('客服服务数据',cards+chart,'<span class="analytics-time">（统计时间：'+latest.to+'）</span>','','analytics-customer-service');
  }else if(active==='物流数据'){
   const keys=['shipHours','collectHours','signHours','shipSignHours','collectSignHours','logisticsComplaintRate','logisticsComplete','shipped'];
   content=section('物流数据',metricCards(keys,active,{cols:4}),'',time(chosen));
   const carriers=[...new Set(paid.flatMap(o=>(o.shipments||[]).map(s=>s.carrier)).filter(Boolean))];
   content+=section('物流指标',statTable(['快递公司','发货到签收(时)','揽收到签收(时)','物流投诉率(%)'],carriers.map(carrier=>{const m=measure({...ctx,orders:ctx.orders.filter(o=>o.shipments?.some(s=>s.carrier===carrier))},chosen);return [e(carrier),m.shipSignHours===null?'--':m.shipSignHours.toFixed(1),m.collectSignHours===null?'--':m.collectSignHours.toFixed(1),'--'];})));
   content+=section('快递订单明细',orderTable(paid.filter(o=>o.method==='快递配送'),['发货状态','快递单号'],o=>[e(o.delivery),e(o.waybills||'—')]));
  }else if(active==='公益数据'){
   content=section('公益概况',datebar()+metricCards(groups[active])+trend(groups[active]),'',time(chosen));
   content+=section('订单公益明细',orderTable(paid,['应计公益款(元)','已到账公益款(元)','分账状态'],o=>[format('fundDue',ctx.fundDue(o)),format('fundSettled',o.fundSettled),e(ctx.splitStatus(o))]));
  }
  if(ctx.detailOnly)return content;
  return ctx.heading(active==='客服数据'?'服务数据':active,active==='客服数据'?'':btn('刷新','analytics-refresh'))+'<div class="analytics-page">'+content+'</div>';
 }
 return {pages,menuPages,ranges,defaults,range,cohort,totals,measure,labels,format,goals,saveGoals,goalTable,province,growth,growthThresholds,render};
})();

// One viewport-positioned tooltip also works inside clipped sections and dialogs.
(()=>{
 let tip,anchor,timer;
 const hide=()=>{clearTimeout(timer);if(anchor){(anchor.closest('.analytics-metric')||anchor).removeAttribute('aria-describedby');anchor=null;}tip?.remove();tip=null;};
 const deferHide=()=>{clearTimeout(timer);timer=setTimeout(hide,120);};
 const position=()=>{
  if(!tip||!anchor)return;
  const r=anchor.getBoundingClientRect(),box=tip.getBoundingClientRect();
  if(!anchor.isConnected||r.bottom<=0||r.top>=innerHeight||r.right<=0||r.left>=innerWidth){hide();return;}
  const above=r.top-box.height-8>=12,left=Math.max(12,Math.min(r.left,innerWidth-box.width-12));
  tip.dataset.placement=above?'above':'below';
  tip.style.left=left+'px';
  tip.style.top=Math.max(12,above?r.top-box.height-8:Math.min(r.bottom+8,innerHeight-box.height-12))+'px';
  tip.style.setProperty('--tooltip-arrow-x',Math.max(12,Math.min(r.left+r.width/2-left,box.width-12))+'px');
 };
 const show=label=>{
  if(anchor===label&&tip){clearTimeout(timer);return;}hide();anchor=label;
  tip=document.createElement('div');tip.id='analytics-metric-tooltip';tip.className='analytics-metric-tooltip';tip.setAttribute('role','tooltip');tip.textContent=label.dataset.metricDefinition;
  tip.addEventListener('pointerenter',()=>clearTimeout(timer));tip.addEventListener('pointerleave',deferHide);document.body.append(tip);
  (label.closest('.analytics-metric')||label).setAttribute('aria-describedby',tip.id);
  position();
 };
 document.addEventListener('pointerover',event=>{const label=event.target.closest('[data-metric-definition]');if(label)show(label);});
 document.addEventListener('pointerout',event=>{if(event.target.closest('[data-metric-definition]')&&!event.relatedTarget?.closest('[data-metric-definition],.analytics-metric-tooltip'))deferHide();});
 document.addEventListener('focusin',event=>{const label=event.target.closest('[data-metric-definition]')||event.target.closest('.analytics-metric')?.querySelector('[data-metric-definition]');if(label)show(label);});
 document.addEventListener('focusout',event=>{if(event.target.closest('.analytics-metric,[data-metric-definition]'))deferHide();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
 document.addEventListener('click',event=>{if(event.target.closest('.analytics-metric'))hide();});
 window.addEventListener('scroll',position,true);window.addEventListener('resize',position);
})();
