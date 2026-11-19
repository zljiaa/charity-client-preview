'use strict';
(function(root){
 const regions=['北京','安徽','福建','甘肃','广东','广西','贵州','海南','河北','河南','黑龙江','湖北','湖南','吉林','江苏','江西','辽宁','内蒙古','宁夏','青海','山东','山西','陕西','上海','四川','天津','云南','浙江','重庆','西藏','新疆','香港','澳门','台湾'];
 const clone=v=>JSON.parse(JSON.stringify(v));
 function defaultTemplate(org='M001'){return {id:'FT-'+org+'-DEFAULT',org,name:'默认运费模板',rules:[{regions:regions.slice(0,29),firstCount:1,firstFee:6,extraCount:1,extraFee:0},{regions:['西藏','新疆'],firstCount:1,firstFee:28,extraCount:1,extraFee:25}]};}
 function error(template){
  if(!template.name.trim())return '请填写模板名称。';
  if(!template.rules.length)return '请至少设置一组配送地区及运费。';
  const seen=new Set(),amount=v=>v!==''&&Number.isFinite(Number(v))&&Number(v)>=0&&Math.abs(Number(v)*100-Math.round(Number(v)*100))<0.000001;
  for(const r of template.rules){
   if(!r.regions.length)return '请选择每组配送地区。';
   for(const region of r.regions){if(!regions.includes(region)||seen.has(region))return '配送地区必须有效，且不能重复分组。';seen.add(region);}
   if(![r.firstCount,r.extraCount].every(v=>v!==''&&Number.isSafeInteger(Number(v))&&Number(v)>=1))return '首件和续件数量须为正整数。';
   if(![r.firstFee,r.extraFee].every(amount))return '运费须为非负金额且最多两位小数。';
  }
  return '';
 }
 function calculate(template,region,qty,method='快递配送'){
  if(method==='现场领取')return 0;
  if(!Number.isSafeInteger(qty)||qty<1||error(template))return null;
  const r=template.rules.find(row=>row.regions.includes(region));if(!r)return null;
  return (Math.round(Number(r.firstFee)*100)+Math.max(0,Math.ceil((qty-Number(r.firstCount))/Number(r.extraCount)))*Math.round(Number(r.extraFee)*100))/100;
 }
 const api={regions,clone,defaultTemplate,error,calculate};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.ShippingTemplates=api;
})(typeof window==='object'?window:globalThis);
