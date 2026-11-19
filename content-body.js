'use strict';
// One article format for the workbench, client detail pages and embedded previews.
(() => {
 const allowed=new Set('P DIV BR H2 H3 STRONG B EM I U S UL OL LI BLOCKQUOTE A IMG VIDEO SOURCE FIGURE FIGCAPTION HR SPAN'.split(' '));
 const safeUrl=(value,image=false)=>{
  const raw=String(value||'').trim();
  if(image&&/^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/i.test(raw))return raw;
  if(image&&/^data:video\/(mp4|webm|ogg|quicktime);base64,/i.test(raw))return raw;
  try{const url=new URL(raw,location.href);return ['http:','https:',...(image?['blob:','file:']:['mailto:','tel:','file:'])].includes(url.protocol)?raw:'';}catch{return '';}
 };
 function sanitize(html){
  const source=document.createElement('template');source.innerHTML=String(html||'');
  const clean=node=>{
   if(node.nodeType===Node.TEXT_NODE)return document.createTextNode(node.textContent);
   if(node.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
   if(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','AUDIO'].includes(node.tagName))return document.createDocumentFragment();
   const el=allowed.has(node.tagName)?document.createElement(node.tagName):document.createDocumentFragment();
   if(el.nodeType===Node.ELEMENT_NODE){
    if(['left','center','right','justify'].includes(node.style.textAlign))el.style.textAlign=node.style.textAlign;
    if(node.tagName==='IMG'){const src=safeUrl(node.getAttribute('src'),true);if(!src)return document.createDocumentFragment();el.src=src;el.alt=node.getAttribute('alt')||'';}
    if(['VIDEO','SOURCE'].includes(node.tagName)){const src=safeUrl(node.getAttribute('src'),true);if(src)el.setAttribute('src',src);if(node.tagName==='VIDEO'){el.controls=true;el.setAttribute('playsinline','');el.preload='metadata';const poster=safeUrl(node.getAttribute('poster'),true);if(poster)el.setAttribute('poster',poster);}else if(/^video\/[a-z0-9.+-]+$/i.test(node.getAttribute('type')||''))el.type=node.getAttribute('type');}
    if(node.tagName==='A'){const href=safeUrl(node.getAttribute('href'));if(href){el.setAttribute('href',href);el.rel='noopener noreferrer';}}
   }
   for(const child of node.childNodes)el.append(clean(child));return el;
  };
  const out=document.createElement('div');for(const child of source.content.childNodes)out.append(clean(child));return out.innerHTML;
 }
 function fromText(text){return text?String(text).split('\n').map(line=>{const p=document.createElement('p');p.textContent=line;return p.outerHTML;}).join(''):'';}
 function text(html){const el=document.createElement('div');el.innerHTML=sanitize(html);el.querySelectorAll('p,div,h2,h3,li,blockquote,br,figure').forEach(node=>node.append(document.createTextNode('\n')));return el.textContent.replace(/\n{3,}/g,'\n\n').trim();}
 function render(root,html){const clean=sanitize(html);root.classList.add('client-article-body');if(root.innerHTML!==clean)root.innerHTML=clean;}
 window.ContentBody={sanitize,fromText,text,render,safeUrl};
})();
