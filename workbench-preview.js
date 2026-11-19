'use strict';
// Render workbench snapshots inside the actual reviewed client product screen.
// Normal client visits do not enable this bridge.
(() => {
  if (window.parent === window || new URLSearchParams(location.search).get('workbenchPreview') !== '1') return;
  if (new URLSearchParams(location.search).get('previewKind') === 'content') {
    const script = document.createElement('script');
    script.src = new URL('workbench-content-preview.js', location.href).href;
    document.head.append(script);
    return;
  }
  const phone = document.getElementById('screen-sale-1');
  if (!phone) return;
  const style = document.createElement('style');
  style.textContent = `
    html,body.experience{margin:0;padding:0;background:#fff;overflow:hidden}
    .experience .studio{display:none}
    .experience .plate{padding:0}
    .experience .pair>.current-screen,.experience .phone{width:100%;max-width:390px;margin:auto}
    .experience .phone{height:100dvh;border:0;border-radius:0;box-shadow:none}
    .product-detail-cover .hero[data-preview-images]{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0}
    .product-detail-cover .hero[data-preview-images] img{flex:0 0 100%;width:100%;height:100%;object-fit:contain;scroll-snap-align:start}
    .preview-buy-overlay{position:absolute;inset:0;z-index:60;display:flex;align-items:flex-end;background:#0006}
    .preview-buy-overlay[hidden]{display:none}
    .preview-buy-overlay .order-sheet{position:relative;inset:auto;width:100%;max-height:90%;display:flex;flex-direction:column;background:#fff}
    .preview-buy-overlay button{font:inherit;cursor:pointer}
    .preview-buy-overlay .sku-options>button{padding:7px 19px;border:1px solid #e6e9e3;border-radius:5px;background:#f4f5f2;color:#74816d;font-size:11px}
    .preview-buy-overlay .sku-options>button.active{color:#2b6b57;border-color:#56836b;background:#eef5e9}
    .preview-buy-overlay .checkout-thumb img{width:100%;height:100%;object-fit:contain}
    .preview-buy-overlay .quantity-stepper button{width:24px;height:24px;border:0;border-radius:3px;background:#f1f3ee;color:#69805f}
    .preview-buy-overlay button:disabled{opacity:.45;cursor:default}
    .preview-buy-overlay .sheet-close{border:0;background:transparent}
    .preview-buy-overlay .checkout-selected{flex-wrap:wrap}
    .preview-buy-overlay .checkout-product>b{overflow-wrap:anywhere}
    .preview-buy-overlay .preview-buy-stock{font-size:10px;color:#8d9687;margin-top:6px}
    .preview-buy-overlay .preview-buy-note{margin:0 0 8px;text-align:center;font-size:10px;color:#879088}
  `;
  document.head.append(style);
  const serviceList = phone.querySelector('.product-service-scroll');
  const serviceTemplate = serviceList.firstElementChild.cloneNode(true);
  const summaryTemplate = phone.querySelector('.product-service-summary>span').cloneNode(true);
  const currency = value => '¥' + Number(value || 0).toFixed(2);
  let currentProduct, selection = [], quantity = 1, returnFocus;
  const purchase = document.createElement('div');
  purchase.className = 'preview-buy-overlay';
  purchase.hidden = true;
  purchase.innerHTML = '<section class="sheet order-sheet" role="dialog" aria-modal="true" aria-label="确认订单预览" tabindex="-1"><div class="sheet-title"><b>确认订单</b><button type="button" class="sheet-close" aria-label="关闭购买预览">×</button></div><div class="sheet-scroll"><div class="checkout-summary"><div class="checkout-thumb"><img alt="商品图片"></div><div class="checkout-product"><b></b><div class="checkout-price"><strong></strong><span>单价</span></div><div class="checkout-selected"><span></span><div class="quantity-stepper"><button type="button" aria-label="减少数量">−</button><b>1</b><button type="button" aria-label="增加数量">＋</button></div></div><p class="preview-buy-stock"></p></div></div><div data-preview-specs></div><div class="checkout-services"><span>商品小计</span><b data-preview-subtotal></b></div></div><div class="checkout-fixed"><p class="preview-buy-note" role="status">购买弹窗预览</p><div class="sheet-bottom"><button type="button" class="button" data-preview-confirm>确定</button></div></div></section>';
  phone.append(purchase);
  const selectedSku = () => {
    const groups = currentProduct?.specs || [];
    const key = groups.map((group, i) => group.key + ':' + group.values[selection[i]]?.key).sort().join('|');
    return currentProduct?.skus?.find(sku => sku.specKey === key) || currentProduct?.skus?.find(sku => sku.name === groups.map((group, i) => group.values[selection[i]]?.name).join(' / ')) || (!groups.length ? currentProduct?.skus?.[0] : null);
  };
  function updatePurchase() {
    const p = currentProduct, sku = selectedSku(), stock = sku?.published===false ? 0 : Math.max(0, Number(sku?.stock) || 0);
    quantity = Math.min(quantity, Math.max(1, stock));
    purchase.querySelector('.checkout-product>b').textContent = p.name || '请输入商品标题';
    purchase.querySelector('.checkout-price strong').textContent = sku ? currency(sku.price) : '待设置价格';
    purchase.querySelector('.checkout-selected>span').textContent = '已选：' + (sku?.name || '暂无可用规格');
    purchase.querySelector('.quantity-stepper>b').textContent = quantity;
    purchase.querySelector('[aria-label=减少数量]').disabled = quantity <= 1;
    purchase.querySelector('[aria-label=增加数量]').disabled = quantity >= stock;
    purchase.querySelector('.preview-buy-stock').textContent = sku?.published===false ? '该规格已下架' : stock ? '库存 ' + stock + ' 件' : '暂无库存';
    purchase.querySelector('[data-preview-subtotal]').textContent = currency((sku?.price || 0) * quantity);
    purchase.querySelector('[data-preview-confirm]').disabled = !stock;
    const image = purchase.querySelector('.checkout-thumb img'), src = sku?.image?.src || p.carouselImages?.[0]?.src;
    image.hidden = !src;
    if (src) image.src = src; else image.removeAttribute('src');
    purchase.querySelectorAll('[data-preview-option]').forEach(button => {
      const active = selection[Number(button.dataset.group)] === Number(button.dataset.previewOption);
      button.classList.toggle('active', active);button.setAttribute('aria-pressed', String(active));
    });
    purchase.querySelector('.preview-buy-note').textContent = '购买弹窗预览';
  }
  function openPurchase() {
    if (!currentProduct) return;
    returnFocus = document.activeElement; quantity = 1;
    const first = currentProduct.skus?.find(sku => sku.published!==false && Number(sku.stock) > 0) || currentProduct.skus?.find(sku => sku.published!==false) || currentProduct.skus?.[0];
    selection = (currentProduct.specs || []).map(group => Math.max(0, group.values.findIndex(value => first?.specKey?.split('|').includes(group.key + ':' + value.key))));
    const groups = (currentProduct.specs || []).map((group, i) => {
      const section = document.createElement('div');section.className = 'sku-group';
      const title = document.createElement('h3');title.textContent = group.name;
      const options = document.createElement('div');options.className = 'sku-options';
      group.values.forEach((value, j) => {
        const button = document.createElement('button');button.type = 'button';button.textContent = value.name;
        button.dataset.group = i;button.dataset.previewOption = j;
        button.onclick = () => {selection[i] = j;quantity = 1;updatePurchase();}; options.append(button);
      });
      section.append(title, options);return section;
    });
    purchase.querySelector('[data-preview-specs]').replaceChildren(...groups);
    updatePurchase(); purchase.hidden = false;purchase.querySelector('.sheet-close').focus();
  }
  function closePurchase() {purchase.hidden = true;returnFocus?.focus();}
  purchase.querySelector('.sheet-close').onclick = closePurchase;
  purchase.onclick = event => {if (event.target === purchase) closePurchase();};
  purchase.querySelector('[aria-label=减少数量]').onclick = () => {quantity--;updatePurchase();};
  purchase.querySelector('[aria-label=增加数量]').onclick = () => {quantity++;updatePurchase();};
  purchase.querySelector('[data-preview-confirm]').onclick = () => {purchase.querySelector('.preview-buy-note').textContent = '预览模式，不会创建订单或发起支付';};
  document.addEventListener('keydown', event => {
    if (purchase.hidden) return;
    if (event.key === 'Escape') {event.preventDefault();event.stopImmediatePropagation();closePurchase();}
    if (event.key === 'Tab') {
      const controls = [...purchase.querySelectorAll('button:not(:disabled)')], first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  }, true);
  const service = (title, description) => {
    const row = serviceTemplate.cloneNode(true);
    row.querySelector('h3').textContent = title;
    row.querySelector('p').textContent = description;
    return row;
  };
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.data?.type !== 'workbench:product-preview') return;
    const p = event.data.product;
    if (!p || typeof p !== 'object') return;
    if (!purchase.hidden) closePurchase();
    currentProduct = p;
    const title = p.name || '请输入商品标题';
    renderProductContent(phone, {
      title, parameters: (p.parameters || []).map(row => [row.name, row.value]),
      detailImages: (p.detailImages || []).map(image => image.src)
    });
    phone.querySelector('.product-overview h2').textContent = title;
    const prices = (p.skus || []).map(s => Number(s.price)).filter(value => value > 0);
    phone.querySelector('.price-line strong').textContent = prices.length ? currency(Math.min(...prices)) : '待设置价格';
    phone.querySelector('.price-line span').textContent = '商家已捐赠 ' + currency(p.donated);
    const cover = phone.querySelector('.product-detail-cover .hero');
    const sources = (p.carouselImages || []).map(image => image.src);
    // Keep the carousel position while other edited fields update.
    if (cover.dataset.previewImages !== JSON.stringify(sources)) {
      cover.dataset.previewImages = JSON.stringify(sources);
      cover.replaceChildren(...sources.map((src, index) => {
        const image = document.createElement('img'); image.src = src; image.alt = title + ' · 轮播图 ' + (index + 1); return image;
      }));
    }
    const random = p.donationMode === 'random';
    phone.querySelector('.sponsor-donation-cover').textContent = random ? '随单捐 · 最高全额捐' : '每件捐赠 ' + currency(p.skus?.[0]?.fund);
    phone.querySelector('.product-charity-link b').textContent = p.projectName || '请选择关联项目';
    phone.querySelector('.product-charity-promise p').textContent = p.promise || (random ? '商家承担随单捐，支持' + (p.projectName || '公益项目') + '；最高为商品实付金额（不含运费）。' : '商家按商品配置的公益份额，支持' + (p.projectName || '公益项目') + '。');
    phone.querySelector('.shop-identity>b').textContent = p.shopName || '';
    phone.querySelector('.shop-identity>p').textContent = p.shopIntro || '';
    phone.querySelector('.self-tag').hidden = p.shopKind !== '平台自营';
    const rules = p.shippingTemplate?.rules || [];
    const shipping = rules.length ? rules.map(rule => rule.regions.join('、') + '：' + rule.firstCount + '件内' + currency(rule.firstFee) + '，每增加' + rule.extraCount + '件加' + currency(rule.extraFee)).join('；') + '。其他地区不配送。现场领取运费为 ¥0.00。' : '运费按收货地区及购买件数计算。';
    const services = [['快递配送', shipping], ['支持退款退货', '尚未分账数量可按交易及售后规则申请退款或退货退款。'], [(Number(p.shippingHours) || 48) + '小时内发货及揽收', '自支付成功起算。']];
    if (p.pickupAfter) services.push(['现场领取后支持售后', '现场领取后，尚未分账数量可按交易及售后规则申请售后。']);
    if (p.returnAuto) services.push(['退货免审批', '退货退款申请自动通过。']);
    if (p.sevenDayReturn) services.push(['7天无理由退货', '按7天无理由退货规则申请售后。']);
    serviceList.replaceChildren(...services.map(([name, text]) => service(name, text)));
    const summary = phone.querySelector('.product-service-summary');
    summary.querySelectorAll(':scope>span').forEach(node => node.remove());
    services.slice(0, 3).forEach(([name]) => {
      const item = summaryTemplate.cloneNode(true);
      [...item.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
      item.append(document.createTextNode(name)); summary.insertBefore(item, summary.lastElementChild);
    });
    document.documentElement.dataset.workbenchPreview = 'ready';
  });
  // Preview dialogs remain interactive; links cannot create a sample transaction.
  document.addEventListener('click', event => {
    if (event.target.closest('#screen-sale-1 footer a[href="#checkout"]')) {event.preventDefault();event.stopImmediatePropagation();openPurchase();return;}
    if (event.target.closest('a, .prototype-back, .share')) {event.preventDefault(); event.stopImmediatePropagation();}
  }, true);
  window.parent.postMessage({type:'client:product-preview-ready'}, '*');
})();
