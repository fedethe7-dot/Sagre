/* Citylife – logica dell'app (prima era dentro index.html) */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MESI=['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const MS=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const GS=['dom','lun','mar','mer','gio','ven','sab'];
const GL=['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
const ORD={1:'primo',2:'secondo',3:'terzo',4:'quarto',5:'quinto','-1':'ultimo'};
const ORDF={1:'prima',2:'seconda',3:'terza',4:'quarta',5:'quinta','-1':'ultima'};
const TIPI={S:'Sagra / fiera',F:'Festa e ricorrenza',G:'Grande evento',A:'Auto e moto'};
const TIPIP={S:'Sagre e fiere',F:'Feste e ricorrenze',G:'Grandi eventi',A:'Auto e moto'};
const DAY=864e5;
const pad=n=>String(n).padStart(2,'0');
const d0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseIso=s=>{const p=String(s||'').split('-');return p.length===3?new Date(+p[0],+p[1]-1,+p[2]):null};
const TODAY=d0(new Date());

/* ---------- storage ---------- */
const K='lunario-v1';
let st={sez:'sagre',tab:'prossimi',prov:'tutte',tipi:[],fav:[],mine:[],mese:null,ign:[],artisti:null,soloMiei:false};
try{Object.assign(st,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
st.tipi=[...new Set((st.tipi||[]).map(x=>x==='M'?'S':x))];if(!Array.isArray(st.ign))st.ign=[];
if(!Array.isArray(st.artisti))st.artisti=['Blue','Eros Ramazzotti','Jamiroquai','Anastacia','Lady Gaga','David Guetta','Pitbull'];
function save(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}
let q='';

/* ---------- date rules ---------- */
function easter(Y){const a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(Y,mo-1,da)}
function nthSunday(Y,m,n){
  if(n>0){const d=new Date(Y,m-1,1);d.setDate(1+(7-d.getDay())%7+7*(n-1));return d.getMonth()===m-1?d:null}
  const d=new Date(Y,m,0);d.setDate(d.getDate()-d.getDay());return d;
}
function occ(ev,Y){
  const r=ev.r;if(r.y==='pari'&&Y%2)return [];if(r.y==='dispari'&&!(Y%2))return [];
  if(r.w){const [m,n,pre=2,post=0]=r.w;const s=nthSunday(Y,m,n);if(!s)return [];return [{s:add(s,-pre),e:add(s,post)}]}
  if(r.d){const [m,g,len=1]=r.d;const s=new Date(Y,m-1,g);return [{s,e:add(s,len-1)}]}
  if(r.e){const [off,len=1]=r.e;const s=add(easter(Y),off);return [{s,e:add(s,len-1)}]}
  if(r.mo!==undefined){const out=[];for(let m=1;m<=12;m++){const s=nthSunday(Y,m,r.mo);if(s)out.push({s,e:s})}return out}
  if(r.f){const s=parseIso(r.f[0]),e=parseIso(r.f[1]||r.f[0]);return s&&s.getFullYear()===Y?[{s,e}]:[]}
  return [];
}
function descr(ev){
  const r=ev.r;if(r.q)return r.q;
  if(r.mo!==undefined)return 'ogni '+ORDF[r.mo]+' domenica del mese';
  if(r.w){const [m,n,pre=2,post=0]=r.w;const mese=MESI[m-1];
    if(post>=7){const k=Math.round(post/7);return 'dal '+ORD[n]+' weekend di '+mese+' per '+(k+1)+' weekend';}
    if(pre===0&&post===0)return 'la '+ORDF[n]+' domenica di '+mese;
    return ORD[n]+' weekend di '+mese;}
  if(r.d){const [m,g,len=1]=r.d;if(r.x)return len===1?'ogni '+g+' '+MESI[m-1]:'dal '+g+' '+MESI[m-1]+' per '+len+' giorni';
    const parte=g<=10?'inizio':g<=20?'metà':'fine';return len===1?'intorno al '+g+' '+MESI[m-1]:parte+' '+MESI[m-1]+(len>3?', per circa '+(len>=14?Math.round(len/7)+' settimane':len+' giorni'):'');}
  if(r.f)return 'data segnata da te';
  return '';
}
const exact=ev=>!!(ev.r.x||ev.r.f);
/* eventi con l'ultima conferma vecchia: da ricontrollare */
function lastYear(ev){const y=String(ev.u||'').match(/20\d\d/g);return y?Math.max(...y.map(Number)):0}
const stale=ev=>!ev.mine&&!exact(ev)&&lastYear(ev)>0&&lastYear(ev)<TODAY.getFullYear();
/* eventi trovati dallo scanner sui siti (proposte.js) */
const REPO='fedethe7-dot/sagre';
const PROP=(typeof PROPOSTE!=='undefined'&&PROPOSTE)||{aggiornato:null,fonti:[],eventi:[]};
function pending(){
  const mine=new Set(st.mine.map(m=>(m.n||'').toLowerCase()+'|'+((m.r&&(m.r.f||m.r.f2)||[])[0]||'')));
  return (PROP.eventi||[]).filter(p=>!p.t&&!st.ign.includes(p.id)&&p.e>=iso(TODAY)&&!mine.has(p.n.toLowerCase()+'|'+p.s));
}

/* ---------- data ---------- */
function allEvents(){
  const base=EVENTI.map(a=>({id:a[0],n:a[1],c:a[2],p:a[3],t:a[4]==='M'?'S':a[4],r:a[5],d:a[6],u:a[7]}));
  return base.concat(st.mine.map(m=>Object.assign({mine:1},m,{t:m.t==='M'?'S':m.t})));
}
let EV=allEvents();
function passes(ev){
  if(st.prov!=='tutte'&&ev.p!==st.prov)return false;
  if(st.tipi.length&&!st.tipi.includes(ev.t))return false;
  if(q){const t=(ev.n+' '+ev.c+' '+(PROVINCE[ev.p]||'')+' '+(ev.d||'')).toLowerCase();if(!q.split(/\s+/).every(w=>t.includes(w)))return false}
  return true;
}
function occBetween(from,to,list){
  const out=[];
  for(const ev of list){for(let Y=from.getFullYear();Y<=to.getFullYear();Y++){for(const o of occ(ev,Y)){if(o.e>=from&&o.s<=to)out.push({ev,s:o.s,e:o.e})}}}
  return out.sort((a,b)=>a.s-b.s||a.e-b.e||a.ev.n.localeCompare(b.ev.n,'it'));
}
function nextOcc(ev){const o=occBetween(TODAY,add(TODAY,800),[ev]);return o[0]||null}

/* ---------- formatting ---------- */
const fdate=d=>GL[d.getDay()]+' '+d.getDate()+' '+MESI[d.getMonth()];
function frange(s,e){
  if(+s===+e)return fdate(s)+' '+s.getFullYear();
  const sameM=s.getMonth()===e.getMonth();
  return GS[s.getDay()]+' '+s.getDate()+(sameM?'':' '+MS[s.getMonth()])+' – '+GS[e.getDay()]+' '+e.getDate()+' '+MS[e.getMonth()]+' '+e.getFullYear();
}
function row(o,dist){
  const ev=o.ev,fav=st.fav.includes(ev.id),days=Math.round((o.e-o.s)/DAY)+1;
  const ongoing=o.s<TODAY&&o.e>=TODAY;
  const leaf=ongoing?`<b>${o.e.getDate()}</b><span>fino al</span><em>${MS[o.e.getMonth()]}</em>`
    :`<b>${o.s.getDate()}</b><span>${GS[o.s.getDay()]}</span><em>${days>1?'→ '+o.e.getDate()+' '+MS[o.e.getMonth()]:MS[o.s.getMonth()]}</em>`;
  return `<button class="ev" data-act="open" data-id="${esc(ev.id)}" data-s="${iso(o.s)}" style="--tc:var(--t-${ev.t})">
    <span class="leaf">${leaf}</span>
    <span class="evb"><span class="evt">${fav?'<span class="star" aria-label="Preferito">★</span>':''}<span>${esc(ev.n)}</span></span>
    <span class="evs">${esc(ev.c)}</span>
    <span class="evm">${dist?`<span class="dist">${dist}</span>`:''}<span class="prov">${esc(ev.p)}</span><span class="type">${TIPI[ev.t]}</span>${exact(ev)?'':stale(ev)?'<span class="chk">· da verificare</span>':'<span class="approx">· date previste</span>'}${ev.mine?'<span>· tuo</span>':''}</span></span></button>`;
}

/* ---------- views ---------- */
function weekendRange(){const g=TODAY.getDay();const fri=g===0?add(TODAY,-2):g===6?add(TODAY,-1):add(TODAY,5-g);return {s:g===0?TODAY:fri<TODAY?TODAY:fri,e:add(fri,2)}}
function foundCard(){
  const p=pending(),n=(PROP.fonti||[]).length;
  if(p.length)return `<button class="found" data-act="prop"><b>${p.length}</b><span>${p.length===1?'Nuovo evento trovato':'Nuovi eventi trovati'} sui tuoi siti<small>Tocca per controllarli e aggiungerli</small></span><span aria-hidden="true" style="flex:none">›</span></button>`;
  return `<button class="found quiet" data-act="prop"><span>${n?'Siti controllati: '+n+(PROP.aggiornato?' · ultimo controllo '+fdate(new Date(PROP.aggiornato)):''):'Aggiungi i siti di eventi da controllare ogni settimana'}</span><span aria-hidden="true" style="flex:none">›</span></button>`;
}
function vProssimi(list){
  const w=weekendRange();
  const wk=occBetween(w.s,w.e,list);
  const ids=new Set(wk.map(o=>o.ev.id+iso(o.s)));
  const later=occBetween(add(w.e,1),add(TODAY,120),list).filter(o=>!ids.has(o.ev.id+iso(o.s)));
  let h=`<h3 class="sec">${TODAY.getDay()===0||TODAY.getDay()===6?'Questo weekend':'Il prossimo weekend'} <small>${+w.s===+w.e?GL[w.s.getDay()]+' '+w.s.getDate()+' '+MS[w.s.getMonth()]:w.s.getDate()+(w.s.getMonth()!==w.e.getMonth()?' '+MS[w.s.getMonth()]:'')+'–'+w.e.getDate()+' '+MS[w.e.getMonth()]}</small></h3>`;
  h+=wk.length?`<div class="list">${wk.map(o=>row(o)).join('')}</div>`:`<div class="empty">Nessun evento in elenco per questo weekend con questi filtri.</div>`;
  let cur='';
  later.forEach(o=>{const k=MESI[o.s.getMonth()].replace(/^./,c=>c.toUpperCase())+' '+o.s.getFullYear();if(k!==cur){if(cur)h+='</div>';cur=k;h+=`<h3 class="sec">${k}</h3><div class="list">`}h+=row(o)});
  if(cur)h+='</div>';
  if(!later.length&&!wk.length)h=`<div class="empty">Nessun evento nei prossimi mesi con questi filtri.</div>`;
  return foundCard()+h;
}
function vCalendario(list){
  const m=st.mese?parseIso(st.mese+'-01'):new Date(TODAY.getFullYear(),TODAY.getMonth(),1);
  const from=new Date(m.getFullYear(),m.getMonth(),1),to=new Date(m.getFullYear(),m.getMonth()+1,0);
  const all=occBetween(from,to,list),os=all.filter(o=>o.e>=TODAY),past=all.filter(o=>o.e<TODAY);
  return `<div class="monthnav"><button class="navbtn" data-act="mese" data-v="-1" aria-label="Mese precedente">‹</button><h2>${MESI[m.getMonth()]} ${m.getFullYear()}</h2><button class="navbtn" data-act="mese" data-v="1" aria-label="Mese successivo">›</button></div>
  <p class="note" style="margin:0 0 10px">${all.length} ${all.length===1?'evento':'eventi'}${st.prov!=='tutte'?' in provincia di '+PROVINCE[st.prov]:' in Veneto'}${past.length&&os.length?' · '+os.length+' ancora da venire':''}</p>
  ${os.length?`<div class="list">${os.map(o=>row(o)).join('')}</div>`:past.length?`<div class="empty">Gli eventi di questo mese sono già passati.</div>`:`<div class="empty">Nessun evento in questo mese con questi filtri.</div>`}
  ${past.length?`<details class="past"><summary>Già passati (${past.length})</summary><div class="list">${past.map(o=>row(o)).join('')}</div></details>`:''}`;
}
function vPreferiti(list){
  const favs=list.filter(ev=>st.fav.includes(ev.id)).map(ev=>{const o=nextOcc(ev);return o?{ev,s:o.s,e:o.e}:null}).filter(Boolean).sort((a,b)=>a.s-b.s);
  return favs.length?`<h3 class="sec">I tuoi preferiti <small>in ordine di data</small></h3><div class="list">${favs.map(o=>row(o)).join('')}</div>`
   :`<div class="empty">Nessun preferito ancora.<br>Apri un evento e tocca <b>★ Salva nei preferiti</b>.</div>`;
}

/* ---------- radar ---------- */
const PERIODI={oggi:'Oggi',weekend:'Weekend',sette:'7 giorni',trenta:'30 giorni'};
const RAGGI=[10,25,50,100,0];
let MAP=null,mapView=null;
function periodRange(k){
  if(k==='oggi')return {s:TODAY,e:TODAY};
  if(k==='sette')return {s:TODAY,e:add(TODAY,6)};
  if(k==='trenta')return {s:TODAY,e:add(TODAY,29)};
  return weekendRange();
}
function km(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]);const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
const placeOf=ev=>ev.ll||LUOGHI[ev.c+'|'+ev.p]||null;
function centro(){return st.centro||{ll:[45.407,11.876],nome:'Padova'}}
function radarData(list){
  const rng=periodRange(st.periodo||'weekend'),c=centro(),R=st.raggio===undefined?25:st.raggio;
  const os=occBetween(rng.s,rng.e,list).map(o=>{const ll=placeOf(o.ev);return ll?Object.assign(o,{ll,km:km(c.ll,ll)}):null}).filter(Boolean);
  const vis=R?os.filter(o=>o.km<=R):os;
  vis.sort((a,b)=>a.km-b.km||a.s-b.s);
  return {rng,c,R,vis,senza:list.filter(ev=>!placeOf(ev)&&ev.mine).length};
}
function vRadar(list){
  const d=radarData(list);
  const per=st.periodo||'weekend';
  const lab=+d.rng.s===+d.rng.e?fdate(d.rng.s):d.rng.s.getDate()+' '+MS[d.rng.s.getMonth()]+' – '+d.rng.e.getDate()+' '+MS[d.rng.e.getMonth()];
  return `<div class="radar-ctl">
    <button class="btn primary" data-act="geo">Vicino a me</button>
    <p class="note" style="margin:0">Centro: <b>${esc(d.c.nome)}</b>. Tocca la mappa per spostarlo.</p>
    <div class="scroller" role="group" aria-label="Distanza">${RAGGI.map(r=>`<button class="chip" data-act="raggio" data-v="${r}" aria-pressed="${d.R===r}">${r?r+' km':'Tutti'}</button>`).join('')}</div>
    <div class="scroller" role="group" aria-label="Quando">${Object.keys(PERIODI).map(k=>`<button class="chip" data-act="periodo" data-v="${k}" aria-pressed="${per===k}">${PERIODI[k]}</button>`).join('')}</div>
  </div>
  <div id="map" class="map" role="region" aria-label="Mappa degli eventi"></div>
  <h3 class="sec">${d.vis.length} ${d.vis.length===1?'evento':'eventi'} ${d.R?'entro '+d.R+' km':''} <small>${lab}</small></h3>
  ${d.vis.length?`<div class="list">${d.vis.map(o=>row(o,Math.round(o.km)+' km')).join('')}</div>`:`<div class="empty">Nessun evento in questa zona nel periodo scelto. Prova ad allargare la distanza o il periodo.</div>`}
  ${d.senza?`<p class="note">I tuoi eventi aggiunti a mano non compaiono sul radar perché non hanno una posizione.</p>`:''}`;
}
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#C2410C'}
function initMap(list){
  if(MAP){MAP.remove();MAP=null}
  const el=document.getElementById('map');if(!el)return;
  if(!window.L){el.innerHTML='<p class="note" style="padding:16px">La mappa ha bisogno di internet. Riprova quando sei connesso.</p>';return}
  const d=radarData(list);
  const zoom={10:11,25:10,50:9,100:8,0:8}[d.R];
  MAP=L.map(el,{scrollWheelZoom:false}).setView(mapView?mapView.c:d.c.ll,mapView?mapView.z:zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(MAP);
  if(d.R)L.circle(d.c.ll,{radius:d.R*1000,color:cssVar('--accent'),weight:2,fillOpacity:.06}).addTo(MAP);
  L.circleMarker(d.c.ll,{radius:7,color:'#ffffff',weight:3,fillColor:'#1C2620',fillOpacity:1}).addTo(MAP).bindTooltip(d.c.nome);
  const per={};d.vis.forEach(o=>{const k=o.ll.join(',');(per[k]=per[k]||[]).push(o)});
  Object.values(per).forEach(g=>{
    const t=g[0].ev.t;
    const m=L.circleMarker(g[0].ll,{radius:g.length>1?11:9,color:'#ffffff',weight:2,fillColor:cssVar('--t-'+t),fillOpacity:1}).addTo(MAP);
    m.bindPopup(`<div class="pop"><b>${esc(g[0].ev.c)}</b> · ${Math.round(g[0].km)} km${g.map(o=>`<button data-open="${esc(o.ev.id)}" data-s="${iso(o.s)}">${esc(o.ev.n)}<small>${frange(o.s,o.e)}</small></button>`).join('')}</div>`);
  });
  MAP.on('popupopen',e=>{e.popup.getElement().querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{MAP.closePopup();openEvent(b.dataset.open,b.dataset.s)}))});
  MAP.on('moveend',()=>{mapView={c:MAP.getCenter(),z:MAP.getZoom()}});
  MAP.on('click',e=>{st.centro={ll:[+e.latlng.lat.toFixed(4),+e.latlng.lng.toFixed(4)],nome:'punto scelto sulla mappa'};mapView=null;save();render()});
}
function geo(){
  if(!navigator.geolocation){toast('Questo telefono non dà la posizione: tocca la mappa');return}
  toast('Cerco la tua posizione…');
  navigator.geolocation.getCurrentPosition(p=>{st.centro={ll:[+p.coords.latitude.toFixed(4),+p.coords.longitude.toFixed(4)],nome:'la tua posizione'};mapView=null;save();render();toast('Ecco cosa c\'è vicino a te')},
    ()=>toast('Posizione non disponibile: tocca la mappa per scegliere il centro'),{enableHighAccuracy:false,timeout:12000,maximumAge:300000});
}

/* serate che si ripetono ogni settimana (NIGHT_FISSE in eventi.js): le date le calcola l'app per i prossimi 60 giorni */
function nightFisse(trovate){
  const out=[];
  for(const f of (typeof NIGHT_FISSE!=='undefined'?NIGHT_FISSE:[])){
    const parola=f.n.toLowerCase().split(' ')[0];
    for(let i=0;i<60;i++){
      const d=add(TODAY,i);if(d.getDay()!==f.g)continue;
      const s=iso(d);
      if(trovate.some(p=>p.s===s&&p.n.toLowerCase().includes(parola)))continue;
      out.push({id:f.id+'-'+s,n:f.n,c:f.c,p:f.p,s,e:s,url:f.url,d:f.d||'',t:'N'});
    }
  }
  return out;
}
function vNight(){
  const trovate=(PROP.eventi||[]).filter(p=>p.t==='N'&&p.e>=iso(TODAY));
  const all=trovate.concat(nightFisse(trovate)).filter(p=>!q||q.split(/\s+/).every(w=>(p.n+' '+p.c+' '+(p.d||'')).toLowerCase().includes(w))).sort((a,b)=>a.s.localeCompare(b.s)||a.n.localeCompare(b.n,'it'));
  const srcN=(PROP.fonti||[]).filter(f=>f.night).length;
  if(!all.length)return `<div class="empty">${srcN?'Nessuna serata in arrivo per ora. La lista si aggiorna da sola ogni lunedì.':'Aggiungi in fonti.txt un sito di locali con <b>| night</b> alla fine della riga.'}</div>`;
  let h=`<p class="note" style="margin:14px 0 0">${all.length} serate nei locali${PROP.aggiornato?' · aggiornato '+fdate(new Date(PROP.aggiornato)):''}</p>`,cur='';
  for(const p of all){
    const s=parseIso(p.s),e=parseIso(p.e),d=s<TODAY?TODAY:s;
    const k=+d===+TODAY?'Stasera':+d===+add(TODAY,1)?'Domani':fdate(d);
    if(k!==cur){if(cur)h+='</div>';cur=k;h+=`<h3 class="nday">${k}</h3><div class="list">`}
    h+=`<a class="nev" href="${esc(p.url)}" target="_blank" rel="noopener"><b>${esc(p.n)}</b><span>${p.c?esc(p.c)+' · ':''}${+s===+e?'':frange(s,e)+' · '}apri sul sito ↗</span></a>`;
  }
  return h+'</div>';
}
/* ---------- Cult e Concerti: eventi trovati dallo scanner sui siti segnati | cult o | concerti ---------- */
const normA=s=>' '+String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim()+' ';
function diArtista(p){const t=normA(p.n+' '+(p.d||''));return st.artisti.find(a=>{const n=normA(a).trim();return n&&t.includes(' '+n+' ')})||''}
function vTrovati(t){
  const conc=t==='K';
  let all=(PROP.eventi||[]).filter(p=>p.t===t&&p.e>=iso(TODAY)&&(st.prov==='tutte'||p.p===st.prov))
    .filter(p=>!q||q.split(/\s+/).every(w=>(p.n+' '+p.c+' '+(p.d||'')).toLowerCase().includes(w)))
    .map(p=>Object.assign({},p,{art:conc?diArtista(p):''}))
    .sort((a,b)=>a.s.localeCompare(b.s)||a.n.localeCompare(b.n,'it'));
  const miei=all.filter(p=>p.art);
  if(conc&&st.soloMiei)all=miei;
  const nomeSez=conc?'concerti':'eventi';
  let h='';
  if(conc){
    h+=`<div class="artisti"><div class="art-head"><b>I tuoi artisti</b><button class="chip" data-act="soloMiei" aria-pressed="${st.soloMiei}">Solo i miei</button></div>
      <div class="art-list">${st.artisti.map(a=>`<span class="art">${esc(a)}<button data-act="artDel" data-v="${esc(a)}" aria-label="Togli ${esc(a)}">×</button></span>`).join('')}
      <form class="art-add" data-form="art"><input id="artNuovo" placeholder="Aggiungi un artista" autocomplete="off"><button class="chip" aria-pressed="true">+</button></form></div></div>`;
    if(miei.length&&!st.soloMiei){
      h+=`<h3 class="nday">★ I tuoi artisti in Veneto</h3><div class="list">`+miei.map(rigaTrovato).join('')+'</div>';
    }
  }
  if(!all.length){
    const nSiti=(PROP.fonti||[]).filter(f=>f.sez===t).length;
    return h+`<div class="empty">${conc&&st.soloMiei?'Nessun concerto dei tuoi artisti in Veneto per ora. La lista si aggiorna da sola ogni lunedì.':nSiti?'Nessun evento in arrivo per ora. La lista si aggiorna da sola ogni lunedì.':'I siti da controllare per questa sezione arrivano col prossimo controllo automatico.'}</div>`;
  }
  h+=`<p class="note" style="margin:14px 0 0">${all.length} ${nomeSez} in arrivo${PROP.aggiornato?' · aggiornato '+fdate(new Date(PROP.aggiornato)):''}</p>`;
  let cur='';
  for(const p of all){
    const d=parseIso(p.s),k=MESI[d.getMonth()]+' '+d.getFullYear();
    if(k!==cur){if(cur)h+='</div>';cur=k;h+=`<h3 class="nday">${k[0].toUpperCase()+k.slice(1)}</h3><div class="list">`}
    h+=rigaTrovato(p);
  }
  return h+'</div>';
}
function rigaTrovato(p){
  const s=parseIso(p.s),e=parseIso(p.e);
  const quando=+s===+e?GS[s.getDay()]+' '+s.getDate()+' '+MS[s.getMonth()]:frange(s,e);
  return `<a class="nev${p.art?' mio':''}" href="${esc(p.url)}" target="_blank" rel="noopener"><b>${p.art?'★ ':''}${esc(p.n)}</b><span>${quando}${p.c?' · '+esc(p.c):''}${p.p?' ('+esc(p.p)+')':''} · apri sul sito ↗</span></a>`;
}
function vAperitivo(){
  const all=(typeof APERITIVI!=='undefined'?APERITIVI:[]).filter(a=>!q||q.split(/\s+/).every(w=>(a.n+' '+a.c+' '+a.d).toLowerCase().includes(w)));
  if(!all.length)return `<div class="empty">Nessun locale trovato.</div>`;
  let h=`<h3 class="nday">Locali invernali</h3><div class="list">`;
  for(const a of all)h+=`<a class="nev ap" href="${esc(a.url)}" target="_blank" rel="noopener"><b>${esc(a.n)}</b><span>${esc(a.c)} (${esc(a.p)}) · ${esc(a.ind)}</span><span>${esc(a.d)}</span><small>${esc(a.o)} · apri sul sito ↗</small></a>`;
  return h+'</div>';
}
function render(){
  EV=allEvents();
  const list=EV.filter(passes);
  $('#sub').textContent=GL[TODAY.getDay()]+' '+TODAY.getDate()+' '+MESI[TODAY.getMonth()]+' · sagre, cultura, concerti e serate in Veneto';
  document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===st.tab));
  $('#provChips').innerHTML=[['tutte','Tutto il Veneto']].concat(REGIONI.Veneto.map(p=>[p,PROVINCE[p]])).map(([k,l])=>`<button class="chip" data-act="prov" data-v="${k}" aria-pressed="${st.prov===k}">${l}</button>`).join('');
  $('#typeChips').innerHTML=Object.keys(TIPIP).map(k=>`<button class="chip" data-act="tipo" data-v="${k}" aria-pressed="${st.tipi.includes(k)}"><i style="background:var(--t-${k})"></i>${TIPIP[k]}</button>`).join('');
  const night=st.sez!=='sagre',conProv=st.sez==='cult'||st.sez==='concerti';
  document.querySelectorAll('.sez button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===st.sez));
  $('#tabs').hidden=night;$('#provChips').hidden=night&&!conProv;$('#typeChips').hidden=night;$('.addbtn').hidden=night;
  $('#q').placeholder=st.sez==='aperitivo'?'Cerca: spritz, Vigonza, locale…':st.sez==='cult'?'Cerca: teatro, gospel, Verdi…':st.sez==='concerti'?'Cerca: artista, Arena, Kioene…':night?'Cerca: Halloween, reggaeton, locale…':'Cerca: baccalà, Arquà, palio…';
  if((night||st.tab!=='radar')&&MAP){MAP.remove();MAP=null}
  if(st.sez==='aperitivo'){$('#app').innerHTML=vAperitivo()+`<p class="note">Orari presi dai siti dei locali: controlla sempre prima di andare.</p>`;return}
  if(st.sez==='cult'){$('#app').innerHTML=vTrovati('C')+`<p class="note">Teatro, concerti gospel, classica e spettacoli presi in automatico dai siti: controlla sempre date e biglietti sul sito.</p>`;return}
  if(st.sez==='concerti'){$('#app').innerHTML=vTrovati('K')+`<p class="note">Concerti presi in automatico dai siti delle arene e dei teatri del Veneto: controlla sempre date e biglietti sul sito.</p>`;return}
  if(night){$('#app').innerHTML=vNight()+`<p class="note">Serate prese in automatico dai siti dei locali: controlla sempre sul sito orari e prezzi.</p>`;return}
  const filt=(st.prov!=='tutte'||st.tipi.length||q)&&st.tab!=='preferiti';
  const banner=filt?`<div class="filtbar"><span>Filtri attivi: vedi ${list.length} ricorrenze su ${EV.length}</span><button class="chip" data-act="reset" aria-pressed="true">Mostra tutto</button></div>`:'';
  $('#app').innerHTML=banner+(st.tab==='calendario'?vCalendario(list):st.tab==='preferiti'?vPreferiti(EV):st.tab==='radar'?vRadar(list):vProssimi(list))
   +`<p class="note">Le date sono calcolate dal periodo in cui l'evento si ripete di solito: controlla sempre il programma ufficiale prima di partire. Gli eventi segnati «date previste» possono spostarsi di qualche giorno.${st.tab==='radar'?' Sulla mappa ogni evento è nel centro del paese, non all\'indirizzo esatto.':''}</p>`;
  if(st.tab==='radar')initMap(list);
}

/* ---------- sheet ---------- */
function openSheet(h){$('#sheetBody').innerHTML=h;$('#sheetWrap').hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){$('#sheetWrap').hidden=true;$('#sheetBody').innerHTML='';document.body.style.overflow=''}
let tt=0;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2400)}
const gcal=(ev,o)=>'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(ev.n)+'&dates='+iso(o.s).replace(/-/g,'')+'/'+iso(add(o.e,1)).replace(/-/g,'')+'&location='+encodeURIComponent(ev.c+', '+(PROVINCE[ev.p]||''))+'&details='+encodeURIComponent((ev.d||'')+(exact(ev)?'':'\nDate previste: verificare il programma ufficiale.'));
function icsFile(ev,o){
  const d=x=>iso(x).replace(/-/g,''),t=s=>String(s||'').replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
  const now=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Citylife//IT','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:'+ev.id+'-'+d(o.s)+'@lunario-sagre','DTSTAMP:'+now,'DTSTART;VALUE=DATE:'+d(o.s),'DTEND;VALUE=DATE:'+d(add(o.e,1)),
    'SUMMARY:'+t(ev.n),'LOCATION:'+t(ev.c+', '+(PROVINCE[ev.p]||'')),'DESCRIPTION:'+t((ev.d||'')+(exact(ev)?'':' Date previste: verifica il programma ufficiale.')),
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+t('Domani: '+ev.n),'TRIGGER:-PT6H','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));
  a.download=ev.n.replace(/[^\w\sàèéìòù-]/gi,'').trim().replace(/\s+/g,'-').slice(0,40)+'.ics';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  toast('Apri il file per aggiungerlo: ti avvisa il giorno prima');
}
const maps=ev=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(ev.c+', '+(PROVINCE[ev.p]||'')+', Italia');
const gsearch=(ev,o)=>'https://www.google.com/search?q='+encodeURIComponent(ev.n+' '+ev.c+' '+o.s.getFullYear()+' programma');
function openEvent(id,sIso){
  const ev=EV.find(x=>x.id===id);if(!ev)return;
  let o=null;
  if(sIso){const s=parseIso(sIso);o=occBetween(s,s,[ev]).find(x=>+x.s===+s)||null}
  if(!o)o=nextOcc(ev);
  const nx=nextOcc(ev),fav=st.fav.includes(ev.id);
  openSheet(`<h2>${esc(ev.n)}</h2><p class="place">${esc(ev.c)} · ${esc(PROVINCE[ev.p]||ev.p)}</p>
  <div class="when" style="--tc:var(--t-${ev.t})"><span class="lab">${TIPI[ev.t]} · ${o&&o.e<TODAY?'edizione passata':exact(ev)?'prossima data':'prossima edizione prevista'}</span>
    <span class="big">${o?frange(o.s,o.e):'—'}</span>
    <span class="s">Di solito: ${esc(descr(ev))}</span>
    ${ev.u?`<span class="s">Ultima edizione nota: ${esc(ev.u)}</span>`:''}
    ${stale(ev)?`<span class="s chk">Ultima conferma del ${lastYear(ev)}: controlla il programma prima di andare</span>`:''}</div>
  ${ev.d?`<p class="desc">${esc(ev.d)}</p>`:''}
  <div class="actions">
    <button class="btn ${fav?'':'primary'}" data-act="fav" data-id="${esc(ev.id)}">${fav?'★ Togli dai preferiti':'★ Salva nei preferiti'}</button>
    ${o&&o.e>=TODAY?`<button class="btn" data-act="ics" data-id="${esc(ev.id)}" data-s="${iso(o.s)}">Aggiungi al calendario del telefono</button>`:''}
    ${o?`<a class="btn" href="${gcal(ev,o)}" target="_blank" rel="noopener">Aggiungi a Google Calendar</a>`:''}
    ${ev.url?`<a class="btn" href="${esc(ev.url)}" target="_blank" rel="noopener">Pagina dell'evento</a>`:''}
    ${o?`<a class="btn" href="${gsearch(ev,o)}" target="_blank" rel="noopener">Cerca il programma ${o.s.getFullYear()}</a>`:''}
    <a class="btn" href="${maps(ev)}" target="_blank" rel="noopener">Apri in Maps</a>
    ${ev.mine?`<button class="btn" data-act="edit" data-id="${esc(ev.id)}">Modifica</button><button class="btn danger" data-act="del" data-id="${esc(ev.id)}">Elimina evento</button>`:''}
    <button class="btn ghost" data-act="close">Chiudi</button>
  </div>
  ${!exact(ev)&&nx?'<p class="note" style="margin-top:14px">Data calcolata dal periodo abituale: verifica il programma ufficiale prima di andare.</p>':''}`);
}
function openProp(){
  const p=pending(),f=PROP.fonti||[];
  const old=EV.filter(stale).map(ev=>{const o=nextOcc(ev);return o&&{ev,s:o.s,e:o.e}}).filter(Boolean).sort((a,b)=>a.s-b.s).slice(0,40);
  openSheet(`<h2>Eventi dai tuoi siti</h2>
  <p class="place">${PROP.aggiornato?'Ultimo controllo: '+fdate(new Date(PROP.aggiornato))+'. ':''}I siti vengono controllati da soli ogni lunedì mattina.</p>
  ${p.length>1?`<div class="actions" style="margin:8px 0 12px"><button class="btn primary" data-act="propAddAll">Aggiungi tutti (${p.length})</button><button class="btn ghost" data-act="propIgnAll">Ignora tutti</button></div>`:''}
  ${p.length?p.map(x=>{const s=parseIso(x.s),e=parseIso(x.e);return `<div class="prop"><span class="evt">${esc(x.n)}</span>
    <span class="evs">${frange(s,e)}${x.c?' · '+esc(x.c):''}${x.p?' ('+esc(x.p)+')':''}</span>
    ${x.d?`<span class="evm">${esc(x.d.slice(0,160))}</span>`:''}
    <a class="src" href="${esc(x.url)}" target="_blank" rel="noopener">Vedi sul sito ↗</a>
    <span class="pbtn"><button class="btn primary" data-act="propAdd" data-id="${esc(x.id)}">Aggiungi</button><button class="btn" data-act="propIgn" data-id="${esc(x.id)}">Ignora</button></span></div>`}).join('')
   :`<div class="empty" style="margin-top:0">${f.length?'Nessun evento nuovo da controllare.':'Non hai ancora aggiunto siti da controllare.'}</div>`}
  <h3 class="sec">I tuoi siti <small>${f.length}</small></h3>
  ${f.map(x=>`<div class="src-row"><span>${esc(x.url.replace(/^https?:\/\/(www\.)?/,''))}</span><span>${x.ok?x.n+' trovati':'<span class="chk">'+esc(x.errore||'non letto')+'</span>'}</span></div>`).join('')}
  <div class="actions" style="margin-top:14px">
    <a class="btn primary" href="https://github.com/${REPO}/edit/main/fonti.txt" target="_blank" rel="noopener">Aggiungi o togli un sito</a>
    <button class="btn" data-act="scanNow">Controlla i siti adesso</button>
  </div>
  <p class="note" style="margin-top:8px">Il controllo ci mette 3-5 minuti: poi chiudi e riapri l'app per vedere le novità. <a class="src" href="https://github.com/${REPO}/actions/workflows/scansiona.yml" target="_blank" rel="noopener">Vedi lo stato su GitHub ↗</a></p>
  <p class="note" style="margin-top:10px">Lo scanner legge le date scritte sui siti: controlla sempre prima di aggiungere. Dopo un controllo, l'app si aggiorna in un paio di minuti.</p>
  ${old.length?`<h3 class="sec">Da ricontrollare <small>ultima conferma vecchia</small></h3><div class="list">${old.map(o=>row(o)).join('')}</div>`:''}
  <div class="actions" style="margin-top:14px"><button class="btn ghost" data-act="close">Chiudi</button></div>`);
}
/* avvia lo scanner su GitHub (workflow_dispatch). La chiave personale resta solo su questo telefono */
const TOKK='lunario-gh';
function leggiTok(){try{return localStorage.getItem(TOKK)||''}catch(e){return ''}}
function tokForm(msg){
  openSheet(`<h2>Avvia il controllo dei siti</h2>
  ${msg?`<p class="note chk" style="margin:0 0 10px">${esc(msg)}</p>`:''}
  <p class="note" style="margin:0 0 10px">Per farlo partire da qui serve una chiave personale di GitHub, da creare una volta sola. Resta salvata solo su questo telefono.</p>
  <ol class="note" style="margin:0 0 12px;padding-left:20px;line-height:1.5">
    <li>Apri <a class="src" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">questa pagina di GitHub ↗</a> (accedi se serve).</li>
    <li>Nome: <b>Lunario</b>. Scadenza: la più lunga (1 anno).</li>
    <li>In «Repository access» scegli <b>Only select repositories</b> e seleziona <b>Sagre</b>.</li>
    <li>In «Permissions» → «Repository permissions» imposta <b>Actions</b> su <b>Read and write</b>.</li>
    <li>Tocca «Generate token», copia la chiave e incollala qui sotto.</li>
  </ol>
  <div class="field"><label for="fTok">Chiave GitHub</label><input class="in" id="fTok" type="password" autocomplete="off" placeholder="github_pat_…"></div>
  <div class="actions"><button class="btn primary" data-act="saveTok">Salva e avvia il controllo</button><button class="btn ghost" data-act="close">Annulla</button></div>`);
}
function avviaScan(){
  const tok=leggiTok();
  if(!tok){tokForm();return}
  toast('Avvio il controllo…');
  fetch('https://api.github.com/repos/'+REPO+'/actions/workflows/scansiona.yml/dispatches',{method:'POST',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tok,'X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'main'})})
    .then(r=>{
      if(r.status===204){closeSheet();toast('Controllo avviato: ci mette 3-5 minuti, poi riapri l\'app')}
      else if(r.status===401||r.status===403||r.status===404){try{localStorage.removeItem(TOKK)}catch(e){}tokForm('La chiave non funziona (scaduta o con permessi sbagliati). Creane una nuova seguendo i passaggi.')}
      else toast('Errore '+r.status+': riprova tra poco')})
    .catch(()=>toast('Nessuna connessione: riprova'));
}
function evForm(ev,pid){
  const m=ev||{};const fr=m.r&&(m.r.f||m.r.f2);const s=fr?fr[0]:iso(TODAY),e=fr?fr[1]:iso(TODAY);
  openSheet(`<h2>${m.id?'Modifica evento':'Nuovo evento'}</h2>
  <div class="field"><label for="fN">Nome</label><input class="in" id="fN" value="${esc(m.n||'')}" placeholder="Es. Sagra di San Rocco"></div>
  <div class="field"><label for="fC">Comune o luogo</label><input class="in" id="fC" value="${esc(m.c||'')}" placeholder="Es. Arsego"></div>
  <div class="row2"><div class="field"><label for="fP">Provincia</label><select class="in" id="fP">${REGIONI.Veneto.map(p=>`<option value="${p}" ${(m.p||'PD')===p?'selected':''}>${PROVINCE[p]}</option>`).join('')}</select></div>
  <div class="field"><label for="fT">Tipo</label><select class="in" id="fT">${Object.keys(TIPI).map(k=>`<option value="${k}" ${(m.t||'S')===k?'selected':''}>${TIPI[k]}</option>`).join('')}</select></div></div>
  <div class="row2"><div class="field"><label for="fS">Dal</label><input class="in" type="date" id="fS" value="${s}"></div><div class="field"><label for="fE">Al</label><input class="in" type="date" id="fE" value="${e}"></div></div>
  <label class="check"><input type="checkbox" id="fY" ${m.r&&m.r.ann?'checked':''}> Si ripete ogni anno nelle stesse date</label>
  <div class="field"><label for="fD">Note</label><input class="in" id="fD" value="${esc(m.d||'')}" placeholder="Cosa si mangia, con chi andare…"></div>
  <div class="actions"><button class="btn primary" data-act="saveEv" data-id="${esc(m.id||'')}" data-pid="${esc(pid||'')}">Salva</button><button class="btn ghost" data-act="close">Annulla</button></div>`);
}

/* ---------- actions ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v,id=b.dataset.id;
  switch(a){
  case 'tab':st.tab=v;save();render();window.scrollTo(0,0);break;
  case 'sez':st.sez=v;save();render();window.scrollTo(0,0);break;
  case 'soloMiei':st.soloMiei=!st.soloMiei;save();render();break;
  case 'artDel':st.artisti=st.artisti.filter(x=>x!==v);save();render();toast('Tolto: '+v);break;
  case 'reset':st.prov='tutte';st.tipi=[];q='';{const i=document.querySelector('#q');if(i)i.value=''}save();render();break;
  case 'prov':st.prov=v;save();render();break;
  case 'tipo':st.tipi=st.tipi.includes(v)?st.tipi.filter(x=>x!==v):st.tipi.concat(v);save();render();break;
  case 'mese':{const m=st.mese?parseIso(st.mese+'-01'):new Date(TODAY.getFullYear(),TODAY.getMonth(),1);const n=new Date(m.getFullYear(),m.getMonth()+(+v),1);st.mese=n.getFullYear()+'-'+pad(n.getMonth()+1);save();render();break}
  case 'open':openEvent(id,b.dataset.s);break;
  case 'geo':geo();break;
  case 'raggio':st.raggio=+v;mapView=null;save();render();break;
  case 'periodo':st.periodo=v;save();render();break;
  case 'close':closeSheet();break;
  case 'fav':{const on=st.fav.includes(id);st.fav=on?st.fav.filter(x=>x!==id):st.fav.concat(id);save();render();openEvent(id);toast(on?'Tolto dai preferiti':'Salvato nei preferiti');break}
  case 'add':evForm(null);break;
  case 'prop':openProp();break;
  case 'propIgn':st.ign.push(id);save();render();openProp();break;
  case 'propIgnAll':pending().forEach(x=>st.ign.push(x.id));save();render();openProp();toast('Ignorati');break;
  case 'scanNow':avviaScan();break;
  case 'saveTok':{const t=($('#fTok').value||'').trim();if(t.length<20){toast('Incolla la chiave completa');return}
    try{localStorage.setItem(TOKK,t)}catch(e){toast('Il telefono non permette di salvare la chiave');return}
    avviaScan();break}
  case 'propAddAll':{
    if(!b.dataset.ok){b.dataset.ok='1';b.textContent='Tocca di nuovo per aggiungere tutti';break}
    const lista=pending();let n=0;
    lista.forEach((x,i)=>{
      st.mine.push({id:'mio-'+Date.now().toString(36)+i,n:x.n,c:x.c||'—',p:REGIONI.Veneto.includes(x.p)?x.p:'PD',
        t:/auto|moto|motor|rally|raduno/i.test(x.n)?'A':/festa|palio|carneval|patrono/i.test(x.n)?'F':'S',
        r:{f:[x.s,x.e]},d:x.d||'',u:'',url:x.url||'',ll:x.ll});
      st.ign.push(x.id);n++;
    });
    save();closeSheet();render();toast(n+' eventi aggiunti');break}
  case 'propAdd':{const x=(PROP.eventi||[]).find(z=>z.id===id);if(!x)return;
    evForm({n:x.n,c:x.c,p:REGIONI.Veneto.includes(x.p)?x.p:'PD',t:/auto|moto|motor|rally|raduno/i.test(x.n)?'A':/festa|palio|carneval|patrono/i.test(x.n)?'F':'S',r:{f:[x.s,x.e]},d:x.d||'',url:x.url,ll:x.ll},x.id);break}
  case 'ics':{const ev=EV.find(z=>z.id===id);if(!ev)return;const s=parseIso(b.dataset.s);const o=occBetween(s,s,[ev]).find(z=>+z.s===+s)||nextOcc(ev);if(o)icsFile(ev,o);break}
  case 'edit':evForm(st.mine.find(x=>x.id===id));break;
  case 'del':{if(b.dataset.ok){st.mine=st.mine.filter(x=>x.id!==id);st.fav=st.fav.filter(x=>x!==id);save();closeSheet();render();toast('Evento eliminato')}else{b.dataset.ok='1';b.textContent='Tocca di nuovo per eliminare'}break}
  case 'saveEv':{const n=$('#fN').value.trim();if(!n){toast('Scrivi il nome');return}
    let s=$('#fS').value,en=$('#fE').value||s;if(!s){toast('Scegli la data');return}if(en<s)en=s;
    const ann=$('#fY').checked;const sd=parseIso(s),ed=parseIso(en);
    const r=ann?{d:[sd.getMonth()+1,sd.getDate(),Math.round((ed-sd)/DAY)+1],x:1,ann:1,f2:[s,en]}:{f:[s,en]};
    const old=st.mine.find(x=>x.id===id)||{},pid=b.dataset.pid,px=pid&&(PROP.eventi||[]).find(z=>z.id===pid)||{};
    const c=$('#fC').value.trim()||'—';
    const ev={id:id||('mio-'+Date.now().toString(36)),n,c,p:$('#fP').value,t:$('#fT').value,r,d:$('#fD').value.trim(),u:'',url:old.url||px.url||''};
    const ll=old.ll||px.ll;if(ll&&(c===(old.c||px.c)))ev.ll=ll;
    if(pid&&!st.ign.includes(pid))st.ign.push(pid);
    const i=st.mine.findIndex(x=>x.id===ev.id);if(i>=0)st.mine[i]=ev;else st.mine.push(ev);
    save();closeSheet();render();toast('Evento salvato');break}
  }
});
document.addEventListener('submit',e=>{
  if(e.target.dataset.form!=='art')return;e.preventDefault();
  const n=($('#artNuovo').value||'').trim();if(!n)return;
  if(st.artisti.some(x=>x.toLowerCase()===n.toLowerCase())){toast('C\'è già');return}
  st.artisti.push(n);save();render();toast('Aggiunto: '+n);
});
let qt=0;$('#q').addEventListener('input',e=>{clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value.trim().toLowerCase();render()},150)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheetWrap').hidden)closeSheet()});
render();
if('serviceWorker' in navigator&&!(window.CITYLIFE&&CITYLIFE.nativa))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
