'use strict';
const {chromium}=require('/Users/zhaolijia/.npm/_npx/dd6c45a6a1785775/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),checks=[],errors=[],requests=[];
 const base=process.argv[2]||'http://127.0.0.1:8765/docs/prototypes/workbench/roles/01-super-admin/index.html';
 const reference=new URL('../03-foundation/index.html',base).href;
 context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().includes('favicon'))requests.push(r.status()+' '+r.url())});
 const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
 const go=async q=>{await page.goto(base+'?'+q,{waitUntil:'domcontentloaded'});};
 const click=async(a,id)=>page.locator('[data-action="'+a+'"]'+(id?'[data-id="'+id+'"]':'')).filter({visible:true}).first().click();
 const f=()=>page.frameLocator('#platform-foundation-frame');
 const fc=async(a,id)=>f().locator('[data-action="'+a+'"]'+(id?'[data-id="'+id+'"]':'')).filter({visible:true}).first().click();
 const field=n=>f().locator('#edit-form [name="'+n+'"]');
 const signature=async root=>root.locator('#edit-form').evaluate(el=>[...el.elements].filter(e=>e.name&&e.name!=='intent').map(e=>[e.name,e.type,e.required]));
 try{
 await go('view=overview');check(await page.locator('h1').innerText()==='工作概览','平台概览保留');check(await page.locator('.sidebar .nav-item').count()===12,'超级管理员导航保留');
 await go('view=content&role=merchant');check(await page.locator('#platform-foundation-frame').count()===0,'商家管理员无法进入公益管理');
 // Compare actual markup and editor fields with the foundation application, not a copied fixture.
 const ref=await context.newPage();
 for(const [kind,view] of [['项目','projects'],['项目活动','activities'],['公益行动','actions']]){
  await go('view=content&kind='+kind+'&role=foundation');await f().locator('h1').waitFor();
  await ref.goto(reference+'?view='+view+'&org=F001&demoAccount=zhou');
  check(await f().locator('h1').innerText()===await ref.locator('h1').innerText(),kind+'标题沿用基金会');
  assert.deepEqual(await f().locator('th').allTextContents(),await ref.locator('th').allTextContents());check(true,kind+'列表字段一致');
  if(view==='projects'){await fc('project-new');await ref.locator('[data-action=project-new]').click();}
  else{
   await fc('activity-new',kind);await field('project').selectOption('J001');await f().locator('#edit-form button[type=submit]').click();
   await ref.locator('[data-action=activity-new]').click();await ref.locator('#edit-form [name=project]').selectOption('J001');await ref.locator('#edit-form button[type=submit]').click();
  }
  assert.deepEqual(await signature(f()),await signature(ref));check(true,kind+'创建字段及校验与基金会一致');
  check(await f().locator('iframe[data-content-client-preview]').count()===1,kind+'使用真实客户端预览');
  if(view!=='projects'){
   assert.deepEqual(await field('template').locator('option').allTextContents(),await ref.locator('#edit-form [name=template] option').allTextContents());check(true,kind+'模板一致');
   await field('template').selectOption('宣发类');await ref.locator('#edit-form [name=template]').selectOption('宣发类');assert.deepEqual(await signature(f()),await signature(ref));check(true,kind+'模板动态字段一致');
  }
 }
 await ref.close();
 for(const role of ['super','foundation']){
  await go('view=content&role='+role+'&kind=项目&edit=1');await field('name').fill('复用验证项目 '+role);await f().locator('button[value=draft]').click();await f().locator('#edit-form').waitFor({state:'detached'});
  check((await f().locator('#main').innerText()).includes('复用验证项目 '+role),role+'可保存项目草稿');
  await page.reload();await f().locator('h1').waitFor();const row=f().locator('tbody tr').filter({hasText:'复用验证项目 '+role});await row.locator('[data-action=project-edit]').click();check(await field('name').inputValue()==='复用验证项目 '+role,role+'刷新后草稿可续编');
  await field('location').fill('浙江 · 杭州');await field('intro').fill('复用基金会编辑器的公益项目');await f().locator('#edit-form [contenteditable=true]').fill('用于验证系统管理员创建和审批的公益项目介绍。');await field('agreement').check();await f().locator('button[value=submit]').click();await f().locator('#edit-form').waitFor({state:'detached'});
  const frame=page.frames().find(frame=>frame.url().includes('foundation-content.html'));
  const item=await frame.evaluate(name=>window.WorkbenchFoundationContent.data.projects.find(p=>p.name===name),'复用验证项目 '+role);
  check(item.org==='F001'&&item.status==='草稿',role+'提交待审版本保留基础内容');
  await click('nav','applications');const appRow=page.locator('tbody tr').filter({hasText:'复用验证项目 '+role});await appRow.waitFor();check((await appRow.innerText()).includes('待审批'),role+'申请进入平台我的申请');await appRow.locator('[data-action=review]').click();check((await page.locator('.platform-review-snapshot').innerText()).includes('复用基金会编辑器'),role+'审批展示共用提交快照');await click('approve');await page.locator('#edit-form button[type=submit]').click();await page.locator('#edit-form').waitFor({state:'detached'});
  await go('view=content&role='+role+'&kind=项目&project='+item.id);await f().locator('h1').waitFor();check((await f().locator('#main').innerText()).includes('已发布'),role+'审批通过同步共享项目');
  const projectUrl=page.url();
  for(const kind of ['项目活动','公益行动']){
   await fc('project-tab',kind);await fc('activity-new',kind);await field('name').fill('复用验证'+kind+' '+role);await f().locator('button[value=draft]').click();await f().locator('#edit-form').waitFor({state:'detached'});check((await f().locator('#main').innerText()).includes('复用验证'+kind+' '+role),role+'可创建'+kind+'草稿');
   const activityRow=f().locator('tbody tr').filter({hasText:'复用验证'+kind+' '+role});await activityRow.locator('[data-action=activity-edit]').click();
   await field('template').selectOption('宣发类');await f().locator('#edit-form [contenteditable=true]').fill('项目进展图文发布验证。');await field('agreement').check();await f().locator('button[value=submit]').click();await f().locator('#edit-form').waitFor({state:'detached'});
   await click('nav','applications');const applicationRow=page.locator('tbody tr').filter({hasText:'复用验证'+kind+' '+role});await applicationRow.waitFor();check((await applicationRow.innerText()).includes('待审批'),role+'可提交'+kind);
   await applicationRow.locator('[data-action=platform-withdraw]').click();await click('platform-withdraw-confirm');check((await page.locator('tbody tr').filter({hasText:'复用验证'+kind+' '+role}).innerText()).includes('已撤回'),role+'可撤回'+kind+'申请');
   await go(new URL(projectUrl).search.slice(1));await f().locator('h1').waitFor();
  }
 }
 await go('view=content');await page.locator('#platform-foundation-org').selectOption('F002');await f().locator('h1').waitFor();check((await f().locator('#main').innerText()).includes('远山新学期助学计划')&&!(await f().locator('#main').innerText()).includes('让乡村孩子有书可读'),'主办基金会选择保持项目归属隔离');
 await go('view=foundations&org=F001&tab=项目管理');await f().locator('h1').waitFor();check(await page.locator('#platform-foundation-org').count()===0,'基金会组织详情直接复用同一项目页');
 await go('view=content&project=J001');await f().locator('h1').waitFor();check(await f().locator('[data-action=project-tab]').count()===7,'项目详情沿用七个选项卡');for(const tab of ['基本信息','进展与公示','贡献明细','关联商品','项目活动','公益行动','操作记录']){await fc('project-tab',tab);check(await f().locator('h1').innerText()==='让乡村孩子有书可读','共用项目详情 '+tab);}
 await fc('project-tab','公益行动');await fc('activity','A004');check(await f().locator('[data-action=activity-tab]').count()===5,'行动详情沿用报名、捐赠、通知和操作记录');await page.reload();await f().locator('h1').waitFor();check((await f().locator('h1').innerText()).includes('周末陪伴阅读'),'行动详情刷新保留路由');
 await page.setViewportSize({width:390,height:844});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'手机平台外壳无横向溢出');check(await page.frames().find(frame=>frame.url().includes('foundation-content.html')).evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'手机共用内容无横向溢出');
 check(errors.length===0,'无浏览器脚本错误');check(requests.length===0,'无脚本与素材加载错误');fs.writeFileSync(path.join(__dirname,'platform-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),url:base,checks:checks.length,passed:checks,errors,requests},null,2));console.log(JSON.stringify({checks:checks.length,errors,requests}));
 }catch(error){await page.screenshot({path:'/private/tmp/foundation-reuse-failure.png'});console.error(JSON.stringify({failure:error.message,url:page.url(),errors,requests,body:await f().locator('#main').innerText(),saved:await page.evaluate(()=>JSON.parse(sessionStorage.getItem('shanxing-content-edits-v1'))?.applications.filter(a=>a.who==='平台管理员').map(a=>({id:a.id,object:a.object,status:a.status,snapshot:a.snapshot?.name})))}));throw error;}finally{await browser.close();}
})().catch(()=>process.exit(1));
