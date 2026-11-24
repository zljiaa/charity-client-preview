'use strict';
(() => {
 const historyIcon=redo=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+(redo?'<path d="m17 3 4 4-4 4M21 7H10a7 7 0 0 0 0 14h2"/>':'<path d="m7 3-4 4 4 4M3 7h11a7 7 0 0 1 0 14h-2"/>')+'</svg>';
 function mount(form,context){
  const field=context.kind==='project'?'body':'intro',input=form.elements[field],base=context.base||{},label=input.closest('label');
  const host=document.createElement('section');host.className='article-editor full';host.setAttribute('aria-label','图文介绍编辑器');
  host.innerHTML='<div class="article-editor-heading"><strong>'+ (context.kind==='project'?'项目介绍':context.base.kind==='公益行动'?'行动介绍':'活动介绍')+'</strong><span>图文正文</span></div><div class="article-toolbar" role="toolbar" aria-label="正文排版"><select aria-label="段落格式"><option value="p">正文</option><option value="h2">大标题</option><option value="h3">小标题</option><option value="blockquote">引用</option></select>'+[['bold','加粗','B'],['italic','斜体','I'],['underline','下划线','U'],['insertUnorderedList','无序列表','• 列表'],['insertOrderedList','有序列表','1. 列表'],['justifyLeft','左对齐','左对齐'],['justifyCenter','居中','居中'],['undo','撤销',historyIcon(false)],['redo','重做',historyIcon(true)],['removeFormat','清除格式','清除格式']].map(([cmd,title,text])=>'<button type="button" data-rich-command="'+cmd+'" title="'+title+'" aria-label="'+title+'">'+text+'</button>').join('')+'<button type="button" data-rich-media>插入图片或视频</button></div><div class="article-paper"><div class="client-article-body article-editable" contenteditable="true" role="textbox" aria-multiline="true" aria-label="介绍正文" data-placeholder="在这里输入介绍，在光标位置插入图片或视频……"></div></div><div class="article-editor-foot"><span>图片或视频插入光标处，支持粘贴或拖入素材</span><span data-rich-count></span></div><input type="file" accept="image/*,video/*" multiple data-rich-files hidden>';
  label.replaceWith(host);input.hidden=true;input.required=false;host.append(input);
  const htmlInput=document.createElement('input');htmlInput.type='hidden';htmlInput.name='bodyHtml';host.append(htmlInput);
  const editor=host.querySelector('[contenteditable]'),files=host.querySelector('[data-rich-files]'),count=host.querySelector('[data-rich-count]');
  let html=base.bodyHtml===undefined?ContentBody.fromText(input.value):base.bodyHtml;
  // Keep legacy article media even when the record also has a separate carousel.
  if(base.bodyHtml===undefined){
   const carousel=new Set((base.carouselMedia||[]).map(file=>file.src));
   for(const file of [...(base.images||[]),...(base.videos||[])]){
    if(carousel.has(file.src)||context.kind==='project'&&base.carouselMedia===undefined)continue;
    const node=document.createElement(file.type?.startsWith('video/')?'video':'img');node.src=file.src;
    if(node.tagName==='VIDEO')node.controls=true;else node.alt=file.name||'';
    html+=node.outerHTML;
   }
  }
  ContentBody.render(editor,html);let range=null,pending=0;
  const toggleCommands=new Set(['bold','italic','underline','insertUnorderedList','insertOrderedList','justifyLeft','justifyCenter']);
  const toggles=[...host.querySelectorAll('[data-rich-command]')].filter(button=>toggleCommands.has(button.dataset.richCommand));
  toggles.forEach(button=>button.setAttribute('aria-pressed','false'));
  function updateToolbar(){
   const selection=getSelection();if(!selection.rangeCount||!editor.contains(selection.anchorNode)||!editor.contains(selection.focusNode))return;
   for(const button of toggles)button.setAttribute('aria-pressed',String(document.queryCommandState(button.dataset.richCommand)));
   const block=String(document.queryCommandValue('formatBlock')).toLowerCase().replace(/[<>]/g,'');
   host.querySelector('select').value=['h2','h3','blockquote'].includes(block)?block:'p';
  }
  function remember(){const selection=getSelection();if(selection.rangeCount&&editor.contains(selection.anchorNode)&&editor.contains(selection.focusNode)){range=selection.getRangeAt(0).cloneRange();updateToolbar();}}
  const onSelectionChange=()=>{if(host.isConnected)remember();else document.removeEventListener('selectionchange',onSelectionChange);};
  document.addEventListener('selectionchange',onSelectionChange);
  function restore(){editor.focus();const selection=getSelection();if(!range||!editor.contains(range.commonAncestorContainer)){range=document.createRange();range.selectNodeContents(editor);range.collapse(false);}selection.removeAllRanges();selection.addRange(range);}
  function sync(){htmlInput.value=ContentBody.sanitize(editor.innerHTML);input.value=ContentBody.text(htmlInput.value);count.textContent=input.value.length+' 字';}
  function changed(){sync();editor.dispatchEvent(new Event('input',{bubbles:true}));}
  function insert(html){restore();document.execCommand('insertHTML',false,ContentBody.sanitize(html));remember();changed();}
  async function insertFiles(list){
   const selection=range?.cloneRange();pending++;host.dataset.loading='true';
   try{const images=await Promise.all([...list].filter(file=>file.type.startsWith('image/')||file.type.startsWith('video/')).map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const image=document.createElement(file.type.startsWith('video/')?'video':'img');image.src=reader.result;if(image.tagName==='VIDEO'){image.controls=true;image.setAttribute('playsinline','');image.preload='metadata';}else image.alt=file.name;resolve(image.outerHTML);};reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);}))); 
    if(!host.isConnected)return;if(selection)range=selection;insert(images.map(image=>image+'<p><br></p>').join(''));
   }catch{if(host.isConnected)form.querySelector('#form-error').textContent='素材读取失败，请重新选择。';}finally{pending--;host.dataset.loading=String(pending>0);files.value='';}
  }
  editor.addEventListener('input',()=>{sync();remember();});editor.addEventListener('keyup',remember);editor.addEventListener('mouseup',remember);editor.addEventListener('blur',remember);
  host.querySelector('.article-toolbar').addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault();});
  host.querySelectorAll('[data-rich-command]').forEach(button=>button.addEventListener('click',()=>{restore();document.execCommand(button.dataset.richCommand,false);remember();changed();}));
  host.querySelector('select').addEventListener('change',event=>{restore();document.execCommand('formatBlock',false,event.target.value);remember();changed();});
  host.querySelector('[data-rich-media]').addEventListener('click',()=>{remember();files.click();});files.addEventListener('change',()=>insertFiles(files.files));
  editor.addEventListener('paste',event=>{event.preventDefault();remember();if(event.clipboardData.files.length)insertFiles(event.clipboardData.files);else insert(event.clipboardData.getData('text/html')||ContentBody.fromText(event.clipboardData.getData('text/plain')));});
  editor.addEventListener('dragover',event=>event.preventDefault());editor.addEventListener('drop',event=>{event.preventDefault();const position=document.caretRangeFromPoint?.(event.clientX,event.clientY);if(position&&editor.contains(position.startContainer))range=position;else remember();if(event.dataTransfer.files.length)insertFiles(event.dataTransfer.files);});
  form.addEventListener('submit',event=>{sync();if(pending){event.preventDefault();event.stopImmediatePropagation();form.querySelector('#form-error').textContent='正文素材正在读取，请稍候再提交。';}},true);
  sync();
 }
 window.WorkbenchContentEditor={mount};
})();
