(()=>{
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* cabeçalho */
const header=$('.site-header');
const onScroll=()=>header?.classList.toggle('scrolled',scrollY>8);
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* menu móvel */
const menu=$('.menu-button'),nav=$('#nav');
const setMenu=open=>{nav?.classList.toggle('open',open);menu?.setAttribute('aria-expanded',String(open));menu?.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')};
menu?.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
$$('#nav a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){setMenu(false);menu.focus()}});

/* vídeo principal: reprodução automática, pausa fora do ecrã, controlo acessível */
const video=$('.hero-video'),toggle=$('.video-toggle');
if(video){
  let userPaused=reduce;
  const sync=()=>{const playing=!video.paused;toggle.dataset.playing=String(playing);toggle.setAttribute('aria-label',playing?'Pausar vídeo':'Reproduzir vídeo')};
  video.addEventListener('play',sync);video.addEventListener('pause',sync);
  if(reduce){video.removeAttribute('autoplay');video.pause()}
  toggle.addEventListener('click',()=>{if(video.paused){userPaused=false;video.play()}else{userPaused=true;video.pause()}});
  new IntersectionObserver(([e])=>{if(e.isIntersecting&&!userPaused)video.play().catch(()=>{});else if(!e.isIntersecting)video.pause()},{threshold:.2}).observe(video);
  sync();
  const dlg=$('.video-dialog'),big=$('.video-large');
  $('.video-full')?.addEventListener('click',()=>{video.pause();big.currentTime=video.currentTime;dlg.showModal();document.body.classList.add('dialog-open');big.play().catch(()=>{})});
  dlg?.querySelector('.dialog-close').addEventListener('click',()=>dlg.close());
  dlg?.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  dlg?.addEventListener('close',()=>{big.pause();document.body.classList.remove('dialog-open');if(!userPaused)video.play().catch(()=>{});$('.video-full').focus()});
}

/* vídeos de serviço: em ciclo enquanto visíveis, com botão de pausa (WCAG 2.2.2) */
const loops=$$('video[data-autoplay]');
if(loops.length){
  const btnFor=v=>v.parentElement.querySelector('.loop-toggle');
  const syncBtn=v=>{const b=btnFor(v);if(!b)return;const on=!v.paused;b.dataset.playing=String(on);b.setAttribute('aria-label',on?'Pausar vídeo':'Reproduzir vídeo')};
  const io=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting){if(v.preload==='none')v.preload='auto';if(!reduce&&v.dataset.userPaused!=='true')v.play().catch(()=>{})}else v.pause()}),{threshold:.25,rootMargin:'100px 0px'});
  loops.forEach(v=>{v.muted=true;v.addEventListener('play',()=>syncBtn(v));v.addEventListener('pause',()=>syncBtn(v));syncBtn(v);io.observe(v);
    btnFor(v)?.addEventListener('click',e=>{e.preventDefault();if(v.paused){v.dataset.userPaused='false';v.play().catch(()=>{})}else{v.dataset.userPaused='true';v.pause()}})});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)loops.forEach(v=>v.pause())});
}

/* legendas Antes / Depois sincronizadas com o vídeo */
$$('video[data-cues]').forEach(v=>{let cues=[];try{cues=JSON.parse(v.dataset.cues)}catch{}const tag=v.parentElement.querySelector('.cue');if(!tag||!cues.length)return;
  const upd=()=>{let c=cues[0];for(const k of cues)if(v.currentTime>=k[0])c=k;if(tag.textContent!==c[1]){tag.textContent=c[1];tag.dataset.state=c[2]}};
  v.addEventListener('timeupdate',upd);v.addEventListener('seeked',upd)});

/* serviços: pré-visualização da fotografia */
const preview=$('.service-preview img');
if(preview){
  const rows=$$('.service-row');let current=rows[0];current?.classList.add('is-active');
  const show=row=>{if(row===current)return;current?.classList.remove('is-active');current=row;row.classList.add('is-active');preview.classList.add('swap');const img=new Image();img.src=row.dataset.img;img.onload=()=>{preview.removeAttribute('srcset');preview.src=row.dataset.img;preview.alt=row.dataset.alt;preview.classList.remove('swap')}};
  rows.forEach(r=>{r.addEventListener('mouseenter',()=>show(r));r.addEventListener('focus',()=>show(r))});
}

/* antes e depois: separadores por tipo de trabalho, setas entre pares */
const tabs=$$('.work-tab');let pairs=[],pi=0;
function showPair(k){if(!pairs.length)return;pi=(k+pairs.length)%pairs.length;const [bf,af,txt]=pairs[pi];
  const b=$('#before-image'),a=$('#after-image');[b,a].forEach(img=>{img.style.opacity=.2;img.removeAttribute('srcset');img.onload=()=>img.style.opacity=1});
  b.src='/assets/'+bf+'.webp';a.src='/assets/'+af+'.webp';b.alt='Antes: '+txt;a.alt='Depois: '+txt;
  $('#work-text').textContent=txt;const pos=$('.pair-pos');if(pos)pos.textContent=(pi+1)+' de '+pairs.length;$('.pair-nav').hidden=pairs.length<2}
function activate(i,focus){const t=tabs[i];tabs.forEach((x,j)=>{x.setAttribute('aria-selected',String(j===i));x.tabIndex=j===i?0:-1});
  try{pairs=JSON.parse(t.dataset.pairs)}catch{pairs=[]}$('#work-title').textContent=t.dataset.title;$('#work-panel').setAttribute('aria-labelledby',t.id);showPair(0);if(focus)t.focus()}
if(tabs.length){try{pairs=JSON.parse(tabs[0].dataset.pairs)}catch{}$('.pair-prev')?.addEventListener('click',()=>showPair(pi-1));$('.pair-next')?.addEventListener('click',()=>showPair(pi+1))}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>activate(i));t.addEventListener('keydown',e=>{const n=tabs.length;let k={ArrowRight:(i+1)%n,ArrowLeft:(i+n-1)%n,Home:0,End:n-1}[e.key];if(k===undefined)return;e.preventDefault();activate(k,true)})});

/* formulário → email (Netlify + Resend; alternativa Web3Forms) */
const form=$('#quote-form');
form?.addEventListener('submit',async e=>{e.preventDefault();
  let firstBad=null;
  $$('.field',form).forEach(f=>{const el=f.querySelector('input,select,textarea');const old=f.querySelector('.field-error');old?.remove();f.classList.remove('invalid');el.removeAttribute('aria-invalid');
    if(!el.checkValidity()){f.classList.add('invalid');el.setAttribute('aria-invalid','true');const m=document.createElement('span');m.className='field-error';m.id=el.id+'-err';el.setAttribute('aria-describedby',m.id);
      m.textContent=el.validity.valueMissing?(el.tagName==='SELECT'?'Escolha um serviço.':'Preencha este campo.'):el.type==='email'?'Indique um email válido, por exemplo nome@exemplo.pt.':el.tagName==='TEXTAREA'?'Descreva o que precisa (pelo menos 10 caracteres).':'Indique um número de telefone válido.';f.appendChild(m);firstBad??=el}});
  if(firstBad){firstBad.focus();return}
  const d=new FormData(form);if(d.get('botcheck'))return;
  const out=$('#form-message'),btn=form.querySelector('button[type=submit]');
  const data={nome:d.get('name'),email:d.get('email'),telefone:d.get('phone'),servico:d.get('service'),localidade:d.get('location'),detalhes:d.get('message'),botcheck:false};
  const subject='Pedido de orçamento: '+data.servico+' ('+data.localidade+')';
  const post=async(url,payload)=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});const j=await r.json().catch(()=>({}));if(!r.ok||!(j.success===true||j.success==='true')){console.warn('Formulário:',url,r.status,j.message||'');throw new Error(j.message||'erro')}};
  btn.disabled=true;out.className='form-message';out.textContent='A enviar o pedido…';
  try{
    try{await post(form.dataset.endpoint,data)}
    catch(e1){await post(form.dataset.fallback,{access_key:form.dataset.key,subject,from_name:'Site Brilho Lusitano',replyto:data.email,Nome:data.nome,Email:data.email,Telefone:data.telefone,Serviço:data.servico,Localidade:data.localidade,Detalhes:data.detalhes,botcheck:false})}
    form.reset();out.textContent='Pedido enviado. Obrigado! Vamos responder para o email que indicou.'}
  catch(err){const mail='mailto:geral@brilholusitanopt.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(`Nome: ${data.nome}\nEmail: ${data.email}\nTelefone: ${data.telefone}\nServiço: ${data.servico}\nLocalidade: ${data.localidade}\nDetalhes: ${data.detalhes}`);
    out.className='form-message form-error';out.replaceChildren(document.createTextNode('Não foi possível enviar agora. '));const l=document.createElement('a');l.href=mail;l.textContent='Enviar por email';out.append(l,document.createTextNode(' ou ligue 934 956 241.'))}
  finally{btn.disabled=false}});
$$('.field input,.field select,.field textarea').forEach(el=>el.addEventListener('input',()=>{const f=el.closest('.field');if(f.classList.contains('invalid')&&el.checkValidity()){f.classList.remove('invalid');el.removeAttribute('aria-invalid');f.querySelector('.field-error')?.remove()}}));

/* galeria */
const dialog=$('.photo-dialog'),tiles=$$('.tile');let trigger=null,active=0;
const visible=()=>tiles.filter(t=>!t.hidden).map(t=>t.querySelector('.tile-open'));
function show(i){const items=visible();active=(i+items.length)%items.length;const it=items[active];const big=$('.photo-large',dialog);big.src=it.dataset.image;big.alt=it.dataset.caption;$('.photo-caption',dialog).textContent=it.dataset.caption;$('.photo-pos',dialog).textContent=(active+1)+' / '+items.length}
$$('.chip').forEach(c=>c.addEventListener('click',()=>{$$('.chip').forEach(x=>x.setAttribute('aria-pressed',String(x===c)));tiles.forEach(t=>t.hidden=c.dataset.filter!=='Todos'&&t.dataset.category!==c.dataset.filter);const n=visible().length;$('.photo-count').textContent=n+(n===1?' fotografia':' fotografias')}));
$$('.tile-open').forEach(b=>b.addEventListener('click',()=>{trigger=b;show(visible().indexOf(b));dialog.showModal();document.body.classList.add('dialog-open')}));
if(dialog){$('.photo-close',dialog).addEventListener('click',()=>dialog.close());$('.photo-prev',dialog).addEventListener('click',()=>show(active-1));$('.photo-next',dialog).addEventListener('click',()=>show(active+1));
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();show(active-1)}if(e.key==='ArrowRight'){e.preventDefault();show(active+1)}});
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');trigger?.focus()})}
})();
