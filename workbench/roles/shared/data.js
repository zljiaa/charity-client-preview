'use strict';
window.WorkbenchData = {
 splitRecipients: [
  {id:'PLATFORM',status:'已入驻',role:'platform',name:'平台公司',verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}},
  {id:'A001',status:'已入驻',role:'association',name:'向善企业商会',verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}},
  {id:'U001',status:'已入驻',role:'university',name:'明川大学',verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}}
 ],
 organizations: [
  {id:'M001',businessRoles:['品牌商'],registeredAddress:'杭州市西湖区向善路 18 号（示例）',entrantName:'林晓',entrantIdentity:'DEMO-ID-M001',identityValidUntil:'2036-12-31',role:'merchant',name:'善集公益自营商家',short:'善',admin:'林晓',contact:'13800001001',code:'DEMO-M001',status:'已入驻',address:'杭州市西湖区向善路 18 号（示例）',bank:'1900001001',inviter:'平台自营',verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}},
  {id:'M002',businessRoles:['厂家'],registeredAddress:'杭州市拱墅区青禾路 28 号（示例）',entrantName:'林晓',entrantIdentity:'DEMO-ID-M002',identityValidUntil:'2036-12-31',role:'merchant',name:'青禾文创有限公司',short:'青',admin:'林晓',contact:'13800001001',code:'DEMO-M002',status:'已入驻',address:'杭州市拱墅区青禾路 28 号（示例）',bank:'1900001002',inviter:'向善企业商会',verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}},
  {id:'F001',role:'foundation',name:'春禾公益基金会',short:'春',admin:'周宁',contact:'13800005001',code:'DEMO-F001',status:'已入驻',address:'杭州市西湖区春禾路 12 号（示例）',bank:'1900005001',qualified:true,verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}},
  {id:'F002',role:'foundation',name:'远山助学基金会',short:'远',admin:'周宁',contact:'13800005001',code:'DEMO-F002',status:'已入驻',address:'湖州市远山路 8 号（示例）',bank:'1900005002',qualified:false,verified:true,splitQualification:{payment:'已核验',agreement:'有效',channel:'有效',validUntil:'2030-12-31'}}
 ],
 shops:[{id:'S001',org:'M001',operatingQualifications:[{id:'QS001',source:'organization',organizationId:'M001',category:'文具'}],contactPhone:'13800001001',businessAddress:'杭州市西湖区向善路 18 号（示例）',name:'善集公益自营店',intro:'把日常所需，变成一份持续的善意。',status:'已开通',category:'文具 / 家居',service:'微信客服 · 善集小助手',seller:'善集公益自营商家',kind:'平台自营',verified:true,donationAgreement:"签约公司：善集公益自营商家\n公益机构：示例公益基金会\n\n公司承诺，将本店铺每笔订单按双方约定计算金额的 1% 捐赠给公益机构，用于支持公益项目。\n\n具体计算口径、捐赠用途及结算安排按双方签署的协议执行。"}],
 projects:[
  {id:'J001',org:'F001',name:'让乡村孩子有书可读',intro:'把一本好书送到需要它的孩子身边。',body:'为乡村学校补充适龄阅读书籍，建设班级阅读角，支持志愿者陪伴阅读。每一次义卖与捐赠，都将用于图书采购、配送和阅读活动。',location:'浙江 · 丽水',end:'2027-06-30T18:00',target:50000,status:'已发布',version:2,cohost:'向善企业商会（会长单位）',organizer:'明川大学',contact:'周宁 13800005001',donate:true,options:'10,50,100',publication:36},
  {id:'J002',org:'F001',name:'一份温暖，陪伴长者',intro:'让独居长者的日常多一份陪伴。',body:'联合社区志愿者开展定期探访、便民服务与节日关怀。',location:'浙江 · 杭州',end:'2027-05-01T18:00',target:20000,status:'已下线',version:1,cohost:'向善企业商会（会长单位）',organizer:'向善企业商会',contact:'周宁 13800005001',donate:true,options:'20,50,100',publication:18,reason:'调整社区服务安排'},
  {id:'J003',org:'F002',name:'远山新学期助学计划',intro:'让远山里的新学期如期开始。',body:'为山区学生提供学习用品，组织陪伴与学习支持活动。',location:'浙江 · 湖州',end:'2027-07-01T18:00',target:30000,status:'已发布',version:1,cohost:'向善企业商会（会长单位）',organizer:'明川大学',contact:'周宁 13800005001',donate:false,options:'10,50,100',publication:9}
 ],
 products:[
  {id:'P001',shop:'S001',name:'山川手帐 · 公益笔记本',status:'在售',review:'已通过',version:2,project:'J001',promise:'每售出一件，为乡村阅读项目贡献 10 元公益款。',promisor:'善集公益自营商家',plan:'乡村阅读公益计划',pickupAfter:true,returnAuto:false,returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',skus:[{name:'森林绿 / A5',price:68,stock:228,fund:10,association:3,university:2},{name:'暖沙色 / A5',price:68,stock:106,fund:10,association:3,university:2}],art:0},
  {id:'P002',shop:'S001',name:'一杯温暖 · 陶瓷马克杯',status:'在售',review:'待审批',version:1,project:'J001',promise:'每售出一件，为乡村阅读项目贡献 15 元公益款。',promisor:'善集公益自营商家',plan:'温暖阅读计划',pickupAfter:true,returnAuto:false,returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',skus:[{name:'米白 / 350ml',price:89,stock:106,fund:15,association:4,university:3}],art:1},
  {id:'P003',shop:'S001',name:'日常有爱 · 帆布袋',status:'已下架',review:'已通过',version:1,project:'J002',promise:'每售出一件，为长者关怀项目贡献 8 元公益款。',promisor:'善集公益自营商家',plan:'长者关怀计划',pickupAfter:false,returnAuto:false,returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',skus:[{name:'原色 / 标准款',price:49,stock:60,fund:8,association:0,university:0}],art:2},
  {id:'P004',shop:'S001',name:'一页善意 · 阅读书签',status:'未上架',review:'草稿',version:0,project:'J001',promise:'每售出一件，为乡村阅读项目贡献 3 元公益款。',promisor:'善集公益自营商家',plan:'书签公益计划',pickupAfter:true,returnAuto:false,returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',skus:[{name:'纸质 / 四枚装',price:19,stock:120,fund:3,association:1,university:0}],art:0}
 ],
 orders:[
  {id:'SO20261030001',org:'M001',shop:'S001',product:'P001',productName:'山川手帐 · 公益笔记本',sku:'森林绿 / A5',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:3,paid:204,refund:68,refundedQty:1,delivery:'待发货',method:'快递配送',payment:'支付成功',split:'待分账',settled:0,fund:10,fundSettled:0,association:3,university:2,after:'极速退款已完成',afterType:'极速退款',afterQty:1,notify:'发送失败',date:'2026-10-30 09:42',received:'',plan:'v2',waybills:'',receiver:'林小禾\n13800009901\n浙江省杭州市西湖区向善路 68 号（示例）'},
  {id:'SO20261030002',org:'M001',shop:'S001',product:'P002',productName:'一杯温暖 · 陶瓷马克杯',sku:'米白 / 350ml',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:1,paid:89,refund:0,refundedQty:0,delivery:'待发货',method:'快递配送',payment:'支付成功',split:'待分账',settled:0,fund:15,fundSettled:0,association:4,university:3,after:'无售后',notify:'发送成功',date:'2026-10-30 10:15',received:'',plan:'v1',waybills:'',receiver:'陈小林\n13800009902\n浙江省杭州市拱墅区春风路 12 号（示例）'},
  {id:'SO20261029003',org:'M001',shop:'S001',product:'P001',productName:'山川手帐 · 公益笔记本',sku:'森林绿 / A5',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:2,paid:136,refund:0,refundedQty:0,delivery:'已收货',method:'快递配送',payment:'支付成功',split:'售后暂停',settled:0,fund:10,fundSettled:0,association:3,university:2,after:'待验收',afterType:'退货退款',afterQty:1,notify:'发送成功',date:'2026-10-29 11:20',received:'2026-10-30 12:00',plan:'v2',waybills:'SF20261029003',receiver:'周小月\n13800009903\n浙江省杭州市滨江区江南路 16 号（示例）'},
  {id:'SO20261028004',org:'M001',shop:'S001',product:'P002',productName:'一杯温暖 · 陶瓷马克杯',sku:'米白 / 350ml',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:2,paid:178,refund:0,refundedQty:0,delivery:'已收货',method:'快递配送',payment:'支付成功',split:'售后暂停',settled:0,fund:15,fundSettled:0,association:4,university:3,after:'待验收',afterType:'退货退款',afterQty:1,notify:'发送成功',date:'2026-10-28 15:10',received:'2026-10-29 16:00',plan:'v1',waybills:'SF20261028004',receiver:'宋小雨\n13800009904\n浙江省杭州市上城区春华路 20 号（示例）'},
  {id:'SO20261022005',org:'M001',shop:'S001',product:'P001',productName:'山川手帐 · 公益笔记本',sku:'森林绿 / A5',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:2,paid:136,refund:0,refundedQty:0,delivery:'已收货',method:'快递配送',payment:'支付成功',split:'分账成功',settled:136,fund:10,fundSettled:20,association:3,university:2,after:'无售后',notify:'发送成功',date:'2026-10-22 08:20',received:'2026-10-23 09:00',plan:'v1',waybills:'SF20261022005',receiver:'许小青\n13800009905\n浙江省湖州市向阳路 11 号（示例）'},
  {id:'SO20261020006',org:'M001',shop:'S001',product:'P003',productName:'日常有爱 · 帆布袋',sku:'原色 / 标准款',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J002',qty:3,paid:147,refund:0,refundedQty:0,delivery:'已收货',method:'快递配送',payment:'支付成功',split:'分账异常',settled:0,fund:8,fundSettled:0,association:0,university:0,after:'无售后',notify:'发送成功',date:'2026-10-20 14:30',received:'2026-10-21 17:00',plan:'v1',waybills:'SF20261020006',receiver:'沈小星\n13800009906\n浙江省杭州市余杭区向阳路 9 号（示例）'},
  {id:'SO20261030007',org:'M001',shop:'S001',product:'P001',productName:'山川手帐 · 公益笔记本',sku:'森林绿 / A5',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:1,paid:68,refund:0,refundedQty:0,delivery:'待领取',method:'现场交付',payment:'支付成功',split:'待分账',settled:0,fund:10,fundSettled:0,association:3,university:2,after:'无售后',notify:'发送成功',date:'2026-10-30 12:20',received:'',plan:'v2',waybills:'',receiver:''},
  {id:'SO20261021008',fulfillmentIssue:'物流异常 · 尚未确认收货',org:'M001',shop:'S001',product:'P002',productName:'一杯温暖 · 陶瓷马克杯',sku:'米白 / 350ml',returnAddress:'林晓 13800001001 杭州市西湖区向善路18号（示例）',project:'J001',qty:1,paid:89,refund:0,refundedQty:0,delivery:'已发货',method:'快递配送',payment:'支付成功',split:'售后暂停',settled:0,fund:15,fundSettled:0,association:4,university:3,after:'待处理',afterType:'退款（无需退货）',afterQty:1,notify:'发送成功',date:'2026-10-21 12:30',received:'',plan:'v1',waybills:'SF20261021008',receiver:'李小白\n13800009908\n浙江省杭州市西湖区云水路 10 号（示例）'}
 ],
 activities:[
  {id:'A001',project:'J001',kind:'项目活动',template:'报名类',name:'乡村阅读共创交流会',status:'已发布',version:1,start:'2026-11-15T14:00',end:'2026-11-15T17:00',deadline:'2026-11-12T18:00',capacity:20,limit:30,location:'杭州 · 公益空间',contact:'周宁 13800005001',intro:'邀请企业代表共同探讨乡村阅读支持计划。'},
  {id:'A002',project:'J001',kind:'项目活动',template:'捐款类',name:'一份书香，一份希望',status:'已发布',version:1,end:'2026-12-20T18:00',start:'2026-11-01T09:00',deadline:'2026-12-20T18:00',capacity:100,limit:100,amount:50,location:'线上捐赠',contact:'周宁 13800005001',intro:'支持乡村学校阅读角建设，捐赠用于采购适龄图书。'},
  {id:'A003',project:'J001',kind:'项目活动',template:'捐赠参会类',name:'让阅读发生 · 公益分享会',status:'已发布',version:1,start:'2026-11-20T14:00',end:'2026-11-20T17:00',deadline:'2026-11-18T18:00',capacity:25,limit:25,amount:100,format:'线上',location:'腾讯会议 · 定向邀请',contact:'周宁 13800005001',intro:'与一线阅读推广人一起，分享陪伴孩子成长的经验。',meetingPublished:false,issue:'参会信息待发布',held:1},
  {id:'A004',project:'J001',kind:'公益行动',template:'报名类',name:'周末陪伴阅读志愿行动',status:'已发布',version:1,start:'2026-11-08T09:00',end:'2026-11-08T16:00',deadline:'2026-11-06T18:00',capacity:12,limit:20,location:'丽水 · 阅读中心',contact:'周宁 13800005001',intro:'招募志愿者，与孩子们共读一本书。'},
  {id:'A005',project:'J001',kind:'公益行动',template:'宣发类',name:'书香进校园 · 活动资讯',status:'草稿',version:0,start:'2026-11-08T09:00',end:'2026-11-10T18:00',deadline:'2026-11-06T18:00',capacity:12,limit:20,related:'A004',location:'丽水 · 阅读中心',contact:'周宁 13800005001',intro:'记录并分享志愿阅读行动的进展。'},
  {id:'A006',project:'J002',kind:'公益行动',template:'报名类',name:'社区长者探访',status:'已停止报名',version:1,start:'2026-11-12T09:00',end:'2026-11-12T16:00',deadline:'2026-11-10T18:00',capacity:10,limit:20,location:'杭州 · 春禾社区',contact:'周宁 13800005001',intro:'定期探访社区长者。'}
 ],
 registrations:[
  {id:'B001',activity:'A001',name:'林晓',company:'青禾文创（示例企业）',position:'项目经理',phone:'138****6001',people:1,status:'待审核',version:'v1',date:'2026-10-29 10:20'},
  {id:'B002',activity:'A001',name:'陈星',company:'山川生活（示例企业）',position:'运营负责人',phone:'138****6002',people:1,status:'已录取',version:'v1',date:'2026-10-28 12:20'},
  {id:'B003',activity:'A004',name:'林小禾',phone:'138****6003',people:1,status:'待审核',version:'v1',date:'2026-10-30 08:15'},
  {id:'B004',activity:'A004',name:'宋小雨',phone:'138****6004',people:1,status:'已录取',version:'v1',date:'2026-10-28 10:00'},
  {id:'B005',activity:'A003',name:'许小青',phone:'138****6005',meetingPhone:'13800006005',people:1,status:'资格有效',version:'v1',date:'2026-10-29 10:00',imported:false},
  {id:'B006',activity:'A003',name:'陈小星',phone:'138****6006',meetingPhone:'13800006006',people:1,status:'资格有效',version:'v1',date:'2026-10-30 09:00',imported:false}
 ],
 donations:[{id:'D001',project:'J001',activity:'',name:'林**',amount:100,status:'支付成功',date:'2026-10-30 10:00'},{id:'D002',project:'J001',activity:'A002',name:'陈**',amount:50,status:'支付成功',date:'2026-10-29 09:00'},{id:'D003',project:'J001',activity:'A003',name:'许**',amount:100,status:'支付成功',date:'2026-10-29 10:00'},{id:'D004',project:'J001',activity:'A003',name:'陈**',amount:100,status:'支付成功',date:'2026-10-30 09:00'},{id:'D005',project:'J001',activity:'A002',name:'周**',amount:50,status:'结果待核实',date:'2026-10-30 11:00'}],
 applications:[{id:'AP001',org:'M001',type:'商品资料变更',object:'P002',title:'一杯温暖 · 陶瓷马克杯',status:'待审批',stage:'系统商家管理员审批',version:2,date:'2026-10-29 16:20',snapshot:{intro:'温暖升级，新增礼盒包装。'},who:'林晓'}, {id:'AP002',org:'F001',type:'项目资料变更',object:'J001',title:'让乡村孩子有书可读',status:'已驳回',stage:'系统基金会管理员审批',version:3,date:'2026-10-29 11:00',reason:'请补充执行地与项目介绍。',snapshot:{intro:'扩大阅读角覆盖范围'},who:'周宁'}],
 members:[{id:'U001',org:'M001',name:'林晓',phone:'138****1001',role:'组织管理员'},{id:'U002',org:'M001',name:'陈星',remark:'负责日常商品及订单运营',phone:'138****1002',role:'组织成员'},{id:'U003',org:'F001',name:'周宁',phone:'138****5001',role:'组织管理员'},{id:'U004',org:'F001',name:'宋雨',phone:'138****5002',role:'组织成员'}],
 joins:[{id:'Q001',org:'M001',name:'李小禾',remark:'负责仓库发货及退货验收，请安排笔记本相关权限',phone:'139****1003',status:'待审批',date:'2026-10-30 09:00'},{id:'Q002',org:'F001',name:'许小青',remark:'申请参与公益项目运营',phone:'139****5003',status:'待审批',date:'2026-10-30 10:00'}],
 logs:[{id:1,org:'M001',object:'SO20261030001',action:'支付核验成功，订单进入待发货列表',who:'系统',role:'系统任务',date:'2026-10-30 09:42',project:'J001',result:'成功'},{id:2,org:'F001',object:'让乡村孩子有书可读',action:'项目 v2 审批通过并发布',who:'系统基金会管理员',role:'系统基金会管理员',date:'2026-10-28 16:00',project:'J001',result:'成功'}]
};

// Local demonstration records; logistics and evidence do not connect to external services.
for(const o of window.WorkbenchData.orders){
 o.shipments=o.waybills?[{carrier:'顺丰速运',carrierPhone:'95338',waybill:o.waybills,events:[
  {time:o.date.slice(0,10)+' 18:00:00',text:'快件已揽收，发往杭州转运中心'},
  {time:o.date.slice(0,10)+' 19:00:00',text:'快件已到达杭州转运中心'},
  {time:o.date.slice(0,10)+' 20:30:00',text:'快件已离开杭州转运中心，发往收件地配送站'},
  {time:o.received?o.received+':00':'2026-10-22 10:20:00',text:o.received?'快件已签收':'派送未完成，快件暂存配送站，等待再次派送',issue:!o.received}
 ]}]:[];
 o.returnShipments=o.after==='待验收'?[{carrier:'顺丰速运',carrierPhone:'95338',waybill:'SFRET'+o.id.slice(2),events:[
  {time:'2026-10-31 09:30:00',text:'买家退回的快件已揽收'},
  {time:'2026-10-31 18:10:00',text:'快件到达杭州转运中心'},
  {time:'2026-11-01 11:20:00',text:'退回快件已签收，等待商家确认'}
 ]}]:[];
 o.evidence=o.after==='无售后'?[]:[{src:'../shared/assets/after-evidence.svg',name:'商品外包装凭证'}];
}
// Approved review examples; historical orders retain their own delivery-fee snapshots.
window.WorkbenchData.features={merchantAfterReject:false};
window.WorkbenchData.shippingTemplates=window.WorkbenchData.organizations.filter(o=>o.role==='merchant').map(o=>ShippingTemplates.defaultTemplate(o.id));
for(const p of window.WorkbenchData.products){const shop=window.WorkbenchData.shops.find(s=>s.id===p.shop),template=window.WorkbenchData.shippingTemplates.find(t=>t.org===shop?.org)||ShippingTemplates.defaultTemplate();p.shippingTemplateId=template.id;p.shippingTemplate=ShippingTemplates.clone(template);p.shippingHours=48;p.sevenDayReturn=true;}
for(const p of window.WorkbenchData.projects)Object.assign(p,{amountMode:'custom',donationOptions:p.options,allowCustom:true,minimumMode:'unlimited',minimum:0,drawMin:1,drawMax:100});
for(const a of window.WorkbenchData.activities)Object.assign(a,{amountMode:a.kind==='公益行动'?'custom':a.amount?'fixed':'custom',donationOptions:'1,10,50',allowCustom:true,minimumMode:'unlimited',minimum:0,drawMin:1,drawMax:100});
for(const a of window.WorkbenchData.activities)if(['报名类','宣发类','捐赠参会类'].includes(a.template))Object.assign(a,{amountModes:['preset','random','custom'],amountMode:'multiple',donationOptions:a.template==='捐赠参会类'?'50,100,200':'1,10,50'});
for(const o of window.WorkbenchData.orders){
 o.shippingFee=o.method==='快递配送'?6:0;
 o.buyerId='BUYER-'+o.id.slice(-3);
 if(o.method==='快递配送'&&o.received)o.signedAt=o.received;
 if(o.after!=='无售后'){o.afterSubmittedAt='2026-11-01 09:00';if(o.after==='待验收'){o.afterApprovedAt='2026-10-30 10:00';o.afterSubmittedAt='2026-10-30 09:00';o.returnCollectedAt='2026-10-31 09:30';o.returnSignedAt='2026-11-01 11:20';}}
}
Object.assign(window.WorkbenchData.orders.find(o=>o.id==='SO20261029003'),{donationMode:'random',fundUnitAmounts:[10.01,10],association:0,university:0});
window.WorkbenchData.activities.push({id:'A007',project:'J001',kind:'公益行动',template:'报名类',name:'十月乡村阅读行动',status:'已结束',version:1,start:'2026-10-25T09:00',end:'2026-10-25T16:00',deadline:'2026-10-24T18:00',capacity:12,limit:20,location:'丽水 · 阅读中心',contact:'周宁 13800005001',intro:'与孩子们一起阅读并分享故事。',amountMode:'custom',donationOptions:'1,10,50',allowCustom:true,minimumMode:'unlimited',minimum:0,drawMin:1,drawMax:100});
window.WorkbenchData.donations.push({id:'DN-ACTION-001',project:'J001',action:'A004',name:'同行者（示例）',amount:0.01,status:'支付成功',date:'2026-11-01 09:30'});

// 商品媒体与结构化规格，用于编辑、审批快照和客户端预览。
for(const p of window.WorkbenchData.products){
 p.parameters=[{name:'品牌',value:'善集'},{name:'产地',value:'浙江杭州'},{name:'发货地',value:'上海'},{name:'类型',value:{P001:'笔记本',P002:'随行杯',P003:'帆布袋',P004:'书签'}[p.id]},{name:'材质',value:{P001:'纸质',P002:'陶瓷',P003:'棉帆布',P004:'黄铜'}[p.id]}];
 const front={src:'../shared/assets/product-notebook-forest.svg',name:'森林绿轮播图.svg'};
 const sand={src:'../shared/assets/product-notebook-sand.svg',name:'暖沙色轮播图.svg'};
 if(p.id==='P001'){
  p.carouselImages=[front,sand];p.detailImages=[{src:'../shared/assets/product-notebook-detail.svg',name:'商品详情.svg'}];
  p.specs=[{name:'颜色',withImages:true,values:[{name:'森林绿',image:front},{name:'暖沙色',image:sand}]},{name:'尺寸',withImages:false,values:[{name:'A5'}]}];
  p.skus.forEach((s,i)=>s.image=i?sand:front);
 }else{
  const asset={P002:'cup',P003:'bag',P004:'bookmark'}[p.id];p.carouselImages=[{src:'../shared/assets/product-'+asset+'.svg',name:p.name+'轮播图.svg'}];p.detailImages=[];p.specs=[{name:'规格',withImages:false,values:p.skus.map(s=>({name:s.name}))}];
 }
}

// Demonstration timestamps for order-detail milestones.
for(const o of window.WorkbenchData.orders){
 if(o.payment==='支付成功')o.paidAt=o.date;
 if(o.shipments?.length)o.shippedAt=o.shipments[0].events[0]?.time;
}

// Platform-owned WeChat customer-service accounts (demonstration configuration).
window.WorkbenchData.customerService={
 corpId:'ww_demo_shanxing',enterpriseName:'善集公益平台',fallbackId:'kf_demo_platform',
 accounts:[
  {id:'kf_demo_platform',name:'平台客服',url:'https://work.weixin.qq.com/kf/demo-platform',servicers:['林晓','周宁'],enabled:true},
  {id:'kf_demo_culture',name:'文创客服',url:'https://work.weixin.qq.com/kf/demo-culture',servicers:['陈远','李禾'],enabled:true},
  {id:'kf_demo_home',name:'家居客服',url:'https://work.weixin.qq.com/kf/demo-home',servicers:['王宁'],enabled:true}
 ]
};
window.WorkbenchData.shops.find(s=>s.id==='S001').customerServiceId='kf_demo_platform';
window.WorkbenchData.products.find(p=>p.id==='P001').customerServiceId='kf_demo_culture';
window.WorkbenchData.products.find(p=>p.id==='P002').customerServiceId='kf_demo_home';

window.WorkbenchData.customerService.directory=window.WorkbenchData.customerService.accounts.map(a=>({...a,servicers:[...a.servicers]}));

// Reception staff are enterprise members, distinct from public customer-service accounts.
for(const a of window.WorkbenchData.customerService.accounts){a.servicerIds={kf_demo_platform:['linxiao','zhouning'],kf_demo_culture:['chenyuan','lihe'],kf_demo_home:['wangning']}[a.id];}
window.WorkbenchData.customerService.directory=window.WorkbenchData.customerService.accounts.map(a=>({...a,servicers:[...a.servicers],servicerIds:[...a.servicerIds]}));

window.WorkbenchData.customerService.sync={intervalMs:300000,lastSuccessAt:new Date().toISOString(),status:'正常',error:''};

// Capture approved product contents once; order links never read the live product.
window.WorkbenchData.productVersions=window.WorkbenchData.products.filter(p=>p.version>0).map(p=>({
 id:p.id+'-v'+p.version,product:p.id,version:p.version,
 snapshot:JSON.parse(JSON.stringify({...p,status:'在售',review:'已通过',projectName:window.WorkbenchData.projects.find(j=>j.id===p.project)?.name||''}))
}));
{
 const D=window.WorkbenchData,previous=JSON.parse(JSON.stringify(D.productVersions.find(v=>v.product==='P001')));
 previous.id='P001-v1';previous.version=1;previous.snapshot.version=1;
 D.productVersions.push(previous);
 for(const o of D.orders){
  const version=o.id==='SO20261022005'?previous:D.productVersions.find(v=>v.product===o.product&&v.version===D.products.find(p=>p.id===o.product)?.version);
  o.productVersionId=version.id;o.productVersion=version.version;
  o.projectName=version.snapshot.projectName;
 }
}

// Channel timestamps are illustrative integration snapshots, not a universal WeChat duration.
window.WorkbenchData.merchantAlertConfig={channelWarningHours:24,shippingWarningHours:4,reviewWarningHours:4,acceptanceWarningHours:4,splitGraceHours:1,refundProcessingHours:24};
for(const o of window.WorkbenchData.orders){
 o.wechatSplitDeadline=({SO20261030001:'2026-11-03 15:00',SO20261030002:'2026-11-03 12:00',SO20261029003:'2026-11-03 14:00',SO20261028004:'2026-11-03 16:00',SO20261022005:'2026-11-15 12:00',SO20261020006:'2026-11-02 12:00',SO20261030007:'2026-11-04 12:00',SO20261021008:'2026-11-03 10:00'})[o.id]||'';
 if(o.payment==='支付成功'&&o.method==='快递配送')o.shippingDeadline=WorkbenchRules.stamp(WorkbenchRules.time(o.paidAt)+48*WorkbenchRules.HOUR);
}

// Order-owned split snapshots are seeded once from the historical demonstration records.
// Subsequent product / organization edits do not rewrite these saved names or amounts.
{
 const D=window.WorkbenchData,clone=value=>JSON.parse(JSON.stringify(value));
 const freeze=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 for(const o of D.orders){
  const product=D.productVersions.find(v=>v.id===o.productVersionId)?.snapshot;
  if(!product)continue;
  const merchant=D.organizations.find(x=>x.id===o.org),foundation=D.organizations.find(x=>x.id===D.projects.find(j=>j.id===o.project)?.org);
  const random=o.donationMode==='random';
  const skus=product.skus.map(s=>{
   const current=s.name===o.sku,fund=current?o.fund:s.fund;
   const configured=s.splitRecipients||[{id:'A001',amount:current?o.association:s.association},{id:'U001',amount:current?o.university:s.university}].filter(r=>Number(r.amount)>0);
   const extra=random?[]:configured.map(r=>{
    const org=[...D.organizations,...D.splitRecipients].find(x=>x.id===r.id);
    return {id:r.id,name:org?.name||r.id,role:org?.role,amount:Number(r.amount)};
   });
   return {name:s.name,price:s.price,recipients:[
    {id:merchant.id,name:merchant.name,role:'merchant',amount:random?null:Math.round((s.price-fund-extra.reduce((n,r)=>n+r.amount,0))*100)/100},
    {id:foundation.id,name:foundation.name,role:'foundation',amount:random?null:fund},...extra]};
  });
  o.splitPlanSnapshot=freeze(clone({id:o.product+'-'+o.plan+'-'+(random?'random':'fixed'),version:o.plan,product:o.product,productVersionId:o.productVersionId,name:product.plan,project:o.project,projectName:o.projectName,mode:random?'random':'fixed',skus}));
  const sku=skus.find(s=>s.name===o.sku);
  o.splitAllocations=freeze(sku.recipients.map(r=>({recipientId:r.id,
   paidSource:r.id===o.org?0:r.id===foundation.id?1:r.id==='A001'?2:r.id==='U001'?3:null,
   unitAmounts:Array.from({length:o.qty},(_,i)=>{
    const fund=o.fundUnitAmounts?.[i]??o.fund;
    return Math.round((r.role==='foundation'?fund:r.id===o.org?o.paid/o.qty-fund-sku.recipients.filter(x=>x.id!==o.org&&x.role!=='foundation').reduce((n,x)=>n+x.amount,0):r.amount)*100)/100;
   })})));
 }
}

// Dealer multi-shop and product collaborator name scenarios. One membership per account and organization.
{
 const D=window.WorkbenchData,clone=x=>JSON.parse(JSON.stringify(x));
 D.organizations.find(o=>o.id==='M001').businessRoles=['品牌商','经销商'];
 D.shops.push({...clone(D.shops[0]),id:'S002',name:'善行生活精选店',category:'家居',intro:'日常好物，持续行善。',kind:'经销商店铺'});
 const p={...clone(D.products.find(p=>p.id==='P003')),id:'P005',shop:'S002',name:'生活精选 · 公益帆布袋',status:'在售',review:'已通过'};D.products.push(p);
 const o={...clone(D.orders.find(o=>o.id==='SO20261030002')),id:'SO20261116001',shop:'S002',product:'P005',productName:p.name,sku:p.skus[0].name,paid:49,unitPrice:49,fund:8,association:0,university:0,productVersionId:'P005-v1',productSnapshot:clone(p)};delete o.splitPlanSnapshot;D.orders.push(o);
 D.productVersions.push({id:'P005-v1',product:p.id,version:1,snapshot:clone(p)});
 for(const m of D.members){m.accountKey=({U001:'lin',U002:'chen',U003:'zhou',U004:'song'})[m.id];m.shopIds=m.org==='M001'&&m.role==='组织成员'?['S001']:['*'];m.permissions=['orders','products','analytics','shop'];}
 D.members.push({id:'U005',org:'M002',name:'林晓',phone:'138****1001',accountKey:'lin',role:'组织管理员',shopIds:['*'],permissions:['orders','products','analytics','shop']});
 for(const p of D.products)p.collaboratorName=({P001:'山川文具制造有限公司',P002:'暖陶家居制造有限公司'})[p.id]||'';
 D.members.push({id:'U008',org:'F002',name:'周宁',phone:'138****5001',accountKey:'zhou',role:'组织管理员',shopIds:['*'],permissions:[]});
 D.collaborationAudit=[];
}

// Order-query examples: one product/SKU ships together; aftersale quantities branch independently.
{
 const D=window.WorkbenchData,clone=x=>JSON.parse(JSON.stringify(x));
 const notebook=D.orders.find(o=>o.id==='SO20261030001');
 function example(id,state){
  const source=notebook,price=68;
  const o={...clone(source),id,qty:1,paid:price,refund:0,refundedQty:0,settled:0,fundSettled:0,after:'无售后',afterQty:0,split:'待分账',delivery:'待发货',method:'快递配送',payment:'支付成功',date:'2026-10-30 13:00',paidAt:'2026-10-30 13:00',received:'',signedAt:'',shippedAt:'',waybills:'',shipments:[],returnShipments:[],evidence:[],notify:'发送成功',shippingFee:6,unitPrice:price,goodsAmount:price,orderAmount:price+6,shippingDeadline:'2026-11-01 13:00',wechatSplitDeadline:'2026-11-06 13:00'};
  for(const key of Object.keys(o))if(key.startsWith('after')&&key!=='after'&&key!=='afterQty'||key.startsWith('refund')&& !['refund','refundedQty'].includes(key)||['fulfillmentIssue','returnCollectedAt','returnSignedAt','returnReceivedAt','cancelReason','fundUnitAmounts','refundedUnitIndexes','settledUnitIndexes','unitReceipts','returnWaybill','returnCarrier'].includes(key))delete o[key];
  o.receiver=notebook.receiver;
  if(o.splitAllocations)o.splitAllocations.forEach(a=>a.unitAmounts=[a.unitAmounts[0]]);
  if(state==='待付款'||state==='已取消')Object.assign(o,{paid:0,payment:'待付款',paidAt:'',shippingDeadline:'',wechatSplitDeadline:'',delivery:state==='已取消'?'已关闭':'待付款',split:'—'});
  if(state==='待收货'||state==='已完成'){
   const waybill='SF'+id.replace(/\D/g,'');
   Object.assign(o,{delivery:state==='已完成'?'已收货':'已发货',shippedAt:'2026-10-31 10:00',waybills:waybill,shipments:[{carrier:'顺丰速运',carrierPhone:'95338',waybill,quantity:1,unitIndexes:[0],events:[{time:'2026-10-31 10:00',text:'快件已揽收'},{time:'2026-11-01 11:00',text:state==='已完成'?'快件已签收':'快件运输中'}]}]});
   if(state==='已完成')Object.assign(o,{received:'2026-11-01 11:00',signedAt:'2026-11-01 11:00'});
  }
  if(state==='退款成功')Object.assign(o,{refund:price,refundedQty:1,refundedUnitIndexes:[0],delivery:'已关闭',split:'分账取消',after:'已退款',afterType:'退款（无需退货）',afterQty:1,afterSubmittedAt:'2026-10-31 09:00',afterApprovedAt:'2026-10-31 10:00',refundSubmittedAt:'2026-10-31 10:00',refundedAt:'2026-10-31 10:05',closedAt:'2026-10-31 10:05',afterReason:'买家申请退款'});
  return o;
 }
 const singles=[['SO20261102001','已取消','用户取消'],['SO20261102002','已取消','超时未支付'],['SO20261102003','待付款'],['SO20261102004','待发货'],['SO20261102005','待收货'],['SO20261102006','已完成'],['SO20261102007','退款成功']].map(([id,state,reason])=>{
  const o=example(id,state);if(reason)Object.assign(o,{cancelReason:reason,closedAt:reason==='用户取消'?'2026-10-30 13:10':'2026-10-30 13:30'});return o;
 });
 const scenarios=[['待发货','待发货'],['已完成','已完成'],['待发货','退款成功'],['待收货','待收货'],['待收货','退款成功'],['已完成','退款成功']],pairs=[];let n=0;
 for(const states of scenarios){
  const parent='SO20261102'+String(101+n++).padStart(3,'0');
  const children=[example(parent+'-01',states[0]),example(parent+'-02',states[1])];
  if(states[0]===states[1]&&children[0].shipments.length){children[1].waybills=children[0].waybills;children[1].shipments=clone(children[0].shipments);}
  children.forEach((o,k)=>{o.parentOrderId=parent;o.shippingFee=k?0:6;o.orderAmount=o.goodsAmount+o.shippingFee;});pairs.push(...children);
 }
 // Completed refund cases and all current aftersale stages can be inspected in the list.
 function after(id,stage,extra={}){const target=pairs.find(o=>o.id===id);if(window.WorkbenchRules.activeAftersale(stage)&&target.delivery==='已收货')Object.assign(target,{delivery:'已发货',received:''});Object.assign(target,{after:stage,afterQty:1,afterType:'退货退款',afterSubmittedAt:'2026-11-02 09:00',afterReason:'商品与预期不符',...extra});}
 after('SO20261102101-02','待处理',{afterType:'退款（无需退货）',split:'售后暂停'});
 after('SO20261102102-02','待买家退货',{afterApprovedAt:'2026-11-02 10:00',split:'售后暂停'});
 after('SO20261102103-01','已取消',{afterCloseReason:'买家主动取消'});
 after('SO20261102104-01','退款处理中',{afterType:'退款（无需退货）',refundSubmittedAt:'2026-11-02 10:00',split:'售后暂停'});
 after('SO20261102105-01','已拒绝',{afterCloseReason:'商品不符合本次售后申请条件'});
 after('SO20261102106-01','待验收',{returnWaybill:'SFRET20261102106',returnShipments:[{waybill:'SFRET20261102106',carrier:'顺丰速运',events:[{time:'2026-11-02 12:00',text:'退件已签收'}]}],returnCollectedAt:'2026-11-02 09:30',returnSignedAt:'2026-11-02 12:00',split:'售后暂停'});
 const history=pairs.find(o=>o.id==='SO20261102106-01');
 history.aftersales=[{id:'AS-HISTORY-106',after:'已取消',afterType:'退货退款',afterQty:1,afterSubmittedAt:'2026-10-31 08:00',afterCloseReason:'买家主动取消',returnWaybill:'HISTORYRET106',returnShipments:[]}];
 const timeout=example('SO20261102008','待发货');Object.assign(timeout,{date:'2026-10-26 13:00',paidAt:'2026-10-26 13:00',shippingDeadline:'2026-10-28 13:00'});
 // A standalone inspection task remains easy to find, including in existing demo sessions.
 const inspection=example('SO20261102009','待收货');
 Object.assign(inspection,{date:'2026-11-02 08:00',paidAt:'2026-11-02 08:00',shippedAt:'2026-11-02 09:00',signedAt:'2026-11-02 10:00',
  after:'待收货验收',afterId:'AS20261102009-01',afterType:'退货退款',afterQty:1,afterUnitIndexes:[0],afterSubmittedAt:'2026-11-02 10:10',afterApprovedAt:'2026-11-02 10:30',afterReason:'商品与预期不符',split:'售后暂停',
  returnWaybill:'SFRET20261102009',returnCarrier:'顺丰速运',returnCollectedAt:'2026-11-02 11:00',returnSignedAt:'2026-11-02 14:00',
  returnShipments:[{waybill:'SFRET20261102009',carrier:'顺丰速运',carrierPhone:'95338',events:[{time:'2026-11-02 11:00',text:'买家退回的快件已揽收'},{time:'2026-11-02 14:00',text:'退回快件已签收，等待商家收货验收'}]}]});
 inspection.shipments[0].events=[{time:inspection.shippedAt,text:'快件已揽收'},{time:inspection.signedAt,text:'快件已签收'}];
 D.orders.unshift(inspection,...singles,...pairs,timeout);
 D.orderStateExamples={inspection:inspection.id,singles:singles.map(o=>o.id),pairs:Array.from({length:6},(_,i)=>'SO20261102'+String(101+i).padStart(3,'0'))};
}

// Payment collection is platform-owned; split recipients retain their own accounts.
window.WorkbenchData.paymentCollection={id:'PLATFORM',name:'平台公司'};


// Return inspection and refund confirmation are separate work queues.
{
 const o=window.WorkbenchData.orders.find(o=>o.id==='SO20261028004');
 if(o){o.afterId='AS20261028004-01';o.after='待确认退款';o.returnReceivedAt='2026-11-02 10:00';o.collaborationInspection={afterId:o.afterId,result:'已收货，存在异常',note:'退回商品外包装破损，已拍照留存。',proofNames:['退货验收异常凭证.svg'],proofs:[{name:'退货验收异常凭证.svg',type:'image/svg+xml',src:'../shared/assets/inspection-abnormal.svg'}],actor:'仓库验收员',partnerOrg:o.org,date:o.returnReceivedAt};}
}

// Reviewed project examples use the exact same carousel assets as the client.
{
 const samples={"reading": [{"name": "让阅读，走进更多乡村", "caption": "让阅读，走进更多乡村", "src": "reading-1.svg", "type": "image/svg+xml"}, {"name": "一起共读，相伴成长", "caption": "一起共读，相伴成长", "src": "reading-2.svg", "type": "image/svg+xml"}, {"name": "让好书成为日常", "caption": "让好书成为日常", "src": "reading-3.svg", "type": "image/svg+xml"}], "community": [{"name": "让关怀，走进社区日常", "caption": "让关怀，走进社区日常", "src": "community-1.svg", "type": "image/svg+xml"}, {"name": "邻里相伴，温暖同行", "caption": "邻里相伴，温暖同行", "src": "community-2.svg", "type": "image/svg+xml"}, {"name": "让关怀成为日常", "caption": "让关怀成为日常", "src": "community-3.svg", "type": "image/svg+xml"}]};
 for(const project of window.WorkbenchData.projects){
  const files=samples[project.id==='J002'?'community':'reading'].map(file=>({...file,src:new URL('../../../assets/project-carousel/'+file.src,location.href).href}));
  project.images=files;project.carouselMedia=files.map(file=>({...file}));
 }
}

// The current notebook uses color and size variants; orders retain their captured versions.
{
 const D=window.WorkbenchData,p=D.products.find(p=>p.id==='P001'),previous=p.skus;
 const colors=[{name:'绿色',key:'green'},{name:'米色',key:'beige'}],sizes=['A5','A3','A2'];
 p.specs=[{name:'颜色',key:'notebook-color',withImages:true,values:colors.map((color,i)=>({...color,image:previous[i]?.image}))},{name:'大小',key:'notebook-size',withImages:false,values:sizes.map(name=>({name,key:name.toLowerCase()}))}];
 p.skus=colors.flatMap((color,i)=>sizes.map((size,j)=>({...previous[i]||previous[0],name:color.name+' / '+size,specKey:'notebook-color:'+color.key+'|notebook-size:'+size.toLowerCase(),stock:j===0?(previous[i]?.stock??0):0})));
 p.version=3;
 D.productVersions.push({id:p.id+'-v'+p.version,product:p.id,version:p.version,snapshot:JSON.parse(JSON.stringify({...p,projectName:D.projects.find(j=>j.id===p.project)?.name||''}))});
}

// Personnel examples use the same member and per-product grants as normal authorization.
{
 const D=window.WorkbenchData;
 const examples=[
  {id:'U009',name:'许晴',accountKey:'xuqing',phone:'138****1009',shopIds:['S001','S002'],shopPermissions:{S001:['shop'],S002:['shop']},permissionExample:'商品运营 · 两店商品及店铺管理'},
  {id:'U010',name:'赵磊',accountKey:'zhaolei',phone:'138****1010',shopIds:['S001'],shopPermissions:{},permissionExample:'山川厂商 · 笔记本发货与退货验收'},
  {id:'U011',name:'吴敏',accountKey:'wumin',phone:'138****1011',shopIds:['S001'],shopPermissions:{},permissionExample:'暖陶厂商 · 马克杯发货与退货验收'},
  {id:'U012',name:'刘悦',accountKey:'liuyue',phone:'138****1012',shopIds:['S001'],shopPermissions:{},permissionExample:'售后人员 · 自营店订单、售后及备注'},
  {id:'U013',name:'孙琪',accountKey:'sunqi',phone:'138****1013',shopIds:['S001','S002'],shopPermissions:{S001:['analytics'],S002:['analytics']},permissionExample:'数据人员 · 两店经营数据'},
  {id:'U014',name:'周航',accountKey:'zhouhang',phone:'138****1014',shopIds:['S001','S002'],shopPermissions:{},permissionExample:'财务人员 · 两店订单分账详情'}
 ];
 for(const m of examples)D.members.push({...m,org:'M001',role:'组织成员',permissions:[]});
 for(const p of D.products.filter(p=>D.shops.find(s=>s.id===p.shop)?.org==='M001')){
  // Retain the original general-purpose member fixture while adding narrower examples.
  p.personPermissions??=D.members.filter(m=>m.org==='M001'&&m.role==='组织成员'&&m.shopIds?.includes(p.shop)&&!m.permissionExample).map(m=>({memberId:m.id,permissions:[...(m.permissions?.includes('products')?['productView','edit','publish','stock','price']:[]),...(m.permissions?.includes('orders')?['orderView','ship','inspect','afterApprove','remark']:[])]})).filter(g=>g.permissions.length);
  p.personPermissions.push({memberId:'U009',permissions:['productView','edit','publish','stock','price']},{memberId:'U014',permissions:['splitView']});
  if(p.shop==='S001')p.personPermissions.push({memberId:'U012',permissions:['orderView','afterApprove','remark']});
  if(p.id==='P001')p.personPermissions.push({memberId:'U010',permissions:['ship','inspect']});
  if(p.id==='P002')p.personPermissions.push({memberId:'U011',permissions:['ship','inspect']});
 }
}

// My Applications: organization onboarding and immediate shop opening examples.
{
 const D=window.WorkbenchData,clone=x=>JSON.parse(JSON.stringify(x));
 const applicant={accountKey:'lin',who:'林晓',version:1};
 const subject={contactName:'林晓',contact:'13800001001',address:'杭州市西湖区向善路 36 号（示例）',entrantName:'林晓',entrantIdentity:'DEMO-ID-ONBOARDING',identityValidUntil:'2036-12-31',licenseValidUntil:'2036-12-31',registeredAddress:'杭州市西湖区向善路 36 号（示例）',businessRoles:['品牌商'],bank:'1900008001'};
 D.merchantOnboardingApplications=[
  {...applicant,id:'ON-DEMO-001',type:'组织入驻',snapshot:{...clone(subject),name:'禾光生活用品有限公司（示例）',code:'DEMO-ONBOARDING-001'},status:'待审核',stage:'系统商家管理员 / 系统超级管理员审批',date:'2026-11-02 10:30:00',history:[{action:'提交申请',date:'2026-11-02 10:30:00'}],consent:{title:'组织入驻及合作协议',version:'原型示例 v1',accountKey:'lin',date:'2026-11-02 10:30:00'}},
  {...applicant,id:'ON-DEMO-002',type:'组织入驻',snapshot:{...clone(subject),name:'向善文创有限公司（示例）',code:'DEMO-ONBOARDING-002'},status:'草稿',stage:'未提交',date:'2026-11-02 09:00:00',history:[{action:'保存草稿',date:'2026-11-02 09:00:00'}]}
 ];
 const opened=D.shops.find(s=>s.id==='S002');
 D.applications.push(
  {...applicant,id:'AP-SHOP-DEMO-001',org:'M001',type:'店铺开通',object:opened.id,title:opened.name,status:'已通过',stage:'已开通',date:'2026-11-01 14:20:00',baseline:{},snapshot:clone(opened),approvalNodes:[{name:'校验通过，店铺已开通',status:'已完成',time:'2026-11-01 14:20:00',operator:'系统'}]},
  {...applicant,id:'AP-SHOP-DEMO-002',org:'M001',type:'店铺开通',object:'SHOP-DEMO-001',title:'善集文创礼品店（示例）',status:'草稿',stage:'未提交',date:'2026-11-02 11:00:00',baseline:{},snapshot:{name:'善集文创礼品店（示例）',category:'文具 / 家居',intro:'以文创好物传递善意。',customerServiceId:'kf_demo_platform',qualificationSource:'organization',qualificationCategory:'文具'}}
 );
}

// Foundation lifecycle examples: each existing list status has a reviewable record.
{
 const D=window.WorkbenchData,clone=x=>JSON.parse(JSON.stringify(x));
 const projectBase=D.projects.find(p=>p.id==='J001');
 D.projects.push(
  {...clone(projectBase),id:'J004',name:'乡村儿童艺术课堂',intro:'以艺术课堂陪伴乡村儿童成长。',body:'联合志愿教师开展绘画与手工课堂，筹备教学物料与课程。',status:'草稿',version:0,publication:0},
  {...clone(projectBase),id:'J005',name:'校园饮水守护计划',intro:'支持乡村学校改善饮水条件。',body:'联合学校开展饮水设施调研、设备采购及日常维护培训。',status:'待审批',version:0,publication:0},
  {...clone(projectBase),id:'J006',name:'旧书循环公益计划',intro:'让闲置图书继续传递知识。',body:'通过社区旧书募集与整理，为阅读角补充适龄书籍。',status:'永久下线',version:1,publication:0,reason:'合作场地撤销，项目永久停止。'},
  {...clone(projectBase),id:'J007',name:'十月乡村阅读角建设',intro:'为乡村学校建设班级阅读角。',body:'已完成图书募集、采购与配送，并开展阅读陪伴活动。',status:'已结束',version:1,publication:0,start:'2026-10-01T09:00',end:'2026-10-25T18:00'}
 );
 const activityBase=D.activities.find(a=>a.id==='A001'),actionBase=D.activities.find(a=>a.id==='A004');
 const examples=[
  {id:'A008',kind:'项目活动',name:'阅读伙伴交流沙龙',status:'草稿',intro:'筹备阅读伙伴交流沙龙，分享阅读陪伴经验。'},
  {id:'A009',kind:'项目活动',name:'校园阅读志愿者培训',status:'待审批',intro:'为企业志愿者提供阅读陪伴培训。'},
  {id:'A010',kind:'项目活动',name:'书香企业共创会',status:'已停止报名',intro:'报名已停止，已录取企业按原安排参会。',reason:'报名名额已满，按原计划举行。'},
  {id:'A011',kind:'项目活动',name:'十月阅读成果分享会',status:'已结束',intro:'分享十月乡村阅读成果与志愿服务经验。'},
  {id:'A012',kind:'项目活动',name:'阅读空间开放日',status:'已取消',intro:'邀请企业参访阅读空间。',reason:'场地临时维护，本次活动取消。'},
  {id:'A013',kind:'公益行动',name:'乡村图书整理行动',status:'待审批',intro:'组织志愿者整理图书并建立借阅目录。'},
  {id:'A014',kind:'公益行动',name:'流动书屋进乡村行动',status:'已取消',intro:'组织流动书屋走进乡村，为孩子提供阅读支持。',reason:'交通条件变化，本次行动取消。'},
  {id:'A015',kind:'公益行动',name:'周末图书打包行动',status:'已停止报名',intro:'报名已停止，已录取志愿者按计划参与图书打包。',reason:'志愿者名额已满，按原计划举行。'}
 ];
 for(const example of examples){
  const ended=example.status==='已结束';
  D.activities.push({...clone(example.kind==='项目活动'?activityBase:actionBase),...example,project:'J001',version:['草稿','待审批'].includes(example.status)?0:1,
   start:ended?'2026-10-25T09:00':'2026-11-25T09:00',end:ended?'2026-10-25T16:00':'2026-11-25T16:00',deadline:ended?'2026-10-24T18:00':'2026-11-24T18:00'});
 }
 // Draft and pending examples use the same application flow as newly created content.
 for(const obj of [...D.projects.filter(p=>p.org==='F001'),...D.activities.filter(a=>a.project==='J001')].filter(o=>['草稿','待审批'].includes(o.status))){
  const draft=obj.status==='草稿',snapshot=clone(obj);delete snapshot.status;delete snapshot.version;
  D.applications.push({id:'AP-FOUNDATION-'+obj.id,org:'F001',object:obj.id,title:obj.name,type:obj.kind?obj.kind+'发布 / 变更':'项目资料变更',status:obj.status,stage:draft?'未提交':'系统基金会管理员审批',version:1,date:'2026-10-30 14:00:00',who:'周宁',accountKey:'zhou',baseline:{...clone(obj),status:'草稿',version:0},snapshot});
 }
}
