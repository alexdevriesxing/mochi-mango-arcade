// Keeps commerce-facing UI aligned with the verified "concept preview" status.
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
let applying=false;

function applyTrustPolish(){
  if(applying)return;
  applying=true;
  try{
    $('.header-cart-btn')?.remove();
    $('#cartDrawer')?.remove();
    if(!location.pathname.startsWith('/shop'))return;

    const main=$('#main');
    const hero=$('.shop-hero-section, .page-hero, .detail-card',main||document);
    if(hero&&!$('#shopConceptNotice')){
      hero.insertAdjacentHTML('afterend','<section id="shopConceptNotice" class="shop-concept-notice" role="status"><strong>Merchandise concept preview</strong><p>These product ideas show how Mochi Mango Arcade characters could extend into collectibles. Purchasing, stock and pre-orders are not currently available.</p></section>');
    }

    $$('.shop-hero-badge').forEach((badge,index)=>{
      badge.textContent=['🎨 Original character concepts','🧸 Future collectible ideas','🔒 No checkout yet'][index]||'Concept preview';
    });
    $('.shop-limited-drop-banner')?.remove();
    $('.merch-promo-banner')?.remove();

    $$('.add-cart').forEach(button=>{
      button.disabled=true;
      button.textContent='Concept preview';
      button.setAttribute('aria-label','Concept preview; purchasing is not available');
    });
    $$('.price').forEach(price=>{price.textContent='Preview';price.setAttribute('aria-label','Concept preview')});
    $$('.product-rating-row').forEach(row=>row.remove());

    $$('.filters .field').forEach(field=>{
      const label=field.querySelector('label')?.textContent?.trim().toLowerCase();
      if(label==='availability'||label==='size')field.remove();
    });
  }finally{applying=false}
}

new MutationObserver(()=>requestAnimationFrame(applyTrustPolish)).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyTrustPolish,{once:true});else applyTrustPolish();
