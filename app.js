/* Che si fa? — v2 "assistente al centro".
   Dati: eventi.js (ricorrenze), luoghi.js (coordinate), proposte.js (scanner dei siti).
   Le preferenze restano nella stessa memoria della versione classica ('lunario-v1'), così preferiti ed eventi tuoi non si perdono. */
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
const TIPI={S:'Sagra / fiera',F:'Festa e ricorrenza',G:'Grande evento',A:'Auto e moto',N:'Serata',W:'Dai siti'};
const TIPIP={S:'Sagre e fiere',F:'Feste',G:'Grandi eventi',A:'Auto e moto'};
const DAY=864e5;
const pad=n=>String(n).padStart(2,'0');
const d0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const add=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseIso=s=>{const p=String(s||'').split('-');return p.length===3?new Date(+p[0],+p[1]-1,+p[2]):null};
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const TODAY=d0(new Date());

/* ---------- icone ---------- */
const P={
 chat:'<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 map:'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
 heart:'<path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>',
 sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
 mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 send:'<path d="M4 12 20 4l-6 16-3-7z"/>',
 locate:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
 star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 filter:'<path d="M4 5h16l-6 8v6l-4-2v-4z"/>',
 pin:'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
 ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 google:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 12h-8"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',
 trash:'<path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13"/>',
 refresh:'<path d="M20 11a8 8 0 1 0-2 5.3M20 4v7h-7"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
 list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h0M4 12h0M4 18h0"/>'
};
const ic=(n,s)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${s?` style="${s}"`:''} aria-hidden="true">${P[n]}</svg>`;

/* ---------- memoria ---------- */
const K='lunario-v1';
let st={sez:'sagre',tab:'prossimi',prov:'tutte',tipi:[],fav:[],mine:[],mese:null,ign:[]};
try{Object.assign(st,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
st.tipi=[...new Set((st.tipi||[]).map(x=>x==='M'?'S':x))];if(!Array.isArray(st.ign))st.ign=[];
st.v2=Object.assign({view:'chiedi',sez:'sagre',day:null,mode:'lista',look:{theme:'dark',acc:0,glass:1,anim:1,fs:16}},st.v2||{});
const V=st.v2;
function save(){try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}}
let q='';

/* ---------- aspetto ---------- */
const ACC=[['Viola','#8B5CF6','#EC4899'],['Oceano','#3B82F6','#06B6D4'],['Tramonto','#F97316','#EF4444'],['Menta','#10B981','#06B6D4'],['Oro','#F59E0B','#EC4899']];
function applyLook(){
  const L=V.look,r=document.documentElement;
  const dark=L.theme==='auto'?matchMedia('(prefers-color-scheme: dark)').matches:L.theme!=='light';
  r.dataset.theme=dark?'dark':'light';
  r.dataset.glass=L.glass?'on':'off';r.dataset.anim=L.anim?'on':'off';
  const a=ACC[L.acc]||ACC[0];r.style.setProperty('--acc',a[1]);r.style.setProperty('--acc2',a[2]);
  r.style.setProperty('--fs',L.fs+'px');
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.content=dark?'#07080D':'#EEF0F7';
}
applyLook();
matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(V.look.theme==='auto')applyLook()});

/* ---------- regole delle date ---------- */
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
function lastYear(ev){const y=String(ev.u||'').match(/20\d\d/g);return y?Math.max(...y.map(Number)):0}
const stale=ev=>!ev.mine&&!exact(ev)&&lastYear(ev)>0&&lastYear(ev)<TODAY.getFullYear();

/* ---------- dati ---------- */
const REPO='fedethe7-dot/sagre';
const PROP=(typeof PROPOSTE!=='undefined'&&PROPOSTE)||{aggiornato:null,fonti:[],eventi:[]};
function allEvents(){
  const base=EVENTI.map(a=>({id:a[0],n:a[1],c:a[2],p:a[3],t:a[4]==='M'?'S':a[4],r:a[5],d:a[6],u:a[7]}));
  return base.concat(st.mine.map(m=>Object.assign({mine:1},m,{t:m.t==='M'?'S':m.t})));
}
let EV=allEvents();
function pending(){
  const mine=new Set(st.mine.map(m=>(m.n||'').toLowerCase()+'|'+((m.r&&(m.r.f||m.r.f2)||[])[0]||'')));
  return (PROP.eventi||[]).filter(p=>p.t!=='N'&&!st.ign.includes(p.id)&&p.e>=iso(TODAY)&&!mine.has(p.n.toLowerCase()+'|'+p.s));
}
function passes(ev){
  if(st.prov!=='tutte'&&ev.p!==st.prov)return false;
  if(st.tipi.length&&!st.tipi.includes(ev.t))return false;
  if(q){const t=norm(ev.n+' '+ev.c+' '+(PROVINCE[ev.p]||'')+' '+(ev.d||''));if(!norm(q).split(/\s+/).every(w=>t.includes(w)))return false}
  return true;
}
function occBetween(from,to,list){
  const out=[];
  for(const ev of list){for(let Y=from.getFullYear();Y<=to.getFullYear();Y++){for(const o of occ(ev,Y)){if(o.e>=from&&o.s<=to)out.push({ev,s:o.s,e:o.e})}}}
  return out.sort((a,b)=>a.s-b.s||a.e-b.e||a.ev.n.localeCompare(b.ev.n,'it'));
}
function nextOcc(ev){const o=occBetween(TODAY,add(TODAY,800),[ev]);return o[0]||null}
const placeOf=ev=>ev.ll||LUOGHI[ev.c+'|'+ev.p]||null;
function km(a,b){const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]);const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}

/* serate fisse ogni settimana (NIGHT_FISSE in eventi.js) */
function nightFisse(trovate){
  const out=[];
  for(const f of (typeof NIGHT_FISSE!=='undefined'?NIGHT_FISSE:[])){
    const parola=f.n.toLowerCase().split(' ')[0];
    for(let i=0;i<60;i++){
      const d=add(TODAY,i);if(d.getDay()!==f.g)continue;const s=iso(d);
      if(trovate.some(p=>p.s===s&&p.n.toLowerCase().includes(parola)))continue;
      out.push({id:f.id+'-'+s,n:f.n,c:f.c,p:f.p,s,e:s,url:f.url,d:f.d||'',t:'N'});
    }
  }
  return out;
}
/* tutte le cose da fare in un unico formato: ev (ricorrenze), web (trovati sui siti), night (serate) */
const itEv=o=>({k:'ev',id:o.ev.id,n:o.ev.n,c:o.ev.c,p:o.ev.p,t:o.ev.t,s:o.s,e:o.e,d:o.ev.d||'',ev:o.ev,ll:placeOf(o.ev)});
const itRaw=(p,k)=>({k,id:p.id,n:p.n,c:p.c||'',p:p.p||'',t:k==='night'?'N':'W',s:parseIso(p.s),e:parseIso(p.e),d:p.d||'',url:p.url,ll:p.ll||LUOGHI[(p.c||'')+'|'+(p.p||'')]||null,raw:p});
function nightItems(){
  const trovate=(PROP.eventi||[]).filter(p=>p.t==='N'&&p.e>=iso(TODAY));
  return trovate.concat(nightFisse(trovate)).map(p=>itRaw(p,'night'));
}
const webItems=()=>pending().map(p=>itRaw(p,'web'));
const inRange=(it,a,b)=>it.e>=a&&it.s<=b;
function itemsBetween(a,b,kinds,evList){
  let out=[];
  if(kinds.ev)out=out.concat(occBetween(a,b,evList||EV).map(itEv));
  if(kinds.web)out=out.concat(webItems().filter(x=>inRange(x,a,b)));
  if(kinds.night)out=out.concat(nightItems().filter(x=>inRange(x,a,b)));
  return out.sort((x,y)=>x.s-y.s||x.n.localeCompare(y.n,'it'));
}
function weekendRange(){const g=TODAY.getDay();const fri=g===0?add(TODAY,-2):g===6?add(TODAY,-1):add(TODAY,5-g);return {s:g===0?TODAY:fri<TODAY?TODAY:fri,e:add(fri,2)}}

/* ---------- formati ---------- */
const fdate=d=>GL[d.getDay()]+' '+d.getDate()+' '+MESI[d.getMonth()];
function frange(s,e){
  if(+s===+e)return fdate(s)+' '+s.getFullYear();
  const sameM=s.getMonth()===e.getMonth();
  return GS[s.getDay()]+' '+s.getDate()+(sameM?'':' '+MS[s.getMonth()])+' – '+GS[e.getDay()]+' '+e.getDate()+' '+MS[e.getMonth()]+' '+e.getFullYear();
}
function card(it,dist){
  const fav=it.k==='ev'&&st.fav.includes(it.id);
  const ongoing=it.s<TODAY&&it.e>=TODAY;
  const dd=ongoing?`<small>fino</small><b>${it.e.getDate()}</b><small>${MS[it.e.getMonth()]}</small>`
    :`<small>${GS[it.s.getDay()]}</small><b>${it.s.getDate()}</b><small>${MS[it.s.getMonth()]}</small>`;
  const days=Math.round((it.e-it.s)/DAY)+1;
  let tags=`<span class="tag t">${TIPI[it.t]}</span>`;
  if(dist!=null)tags=`<span class="tag">${dist} km</span>`+tags;
  if(it.p)tags+=`<span class="tag">${esc(it.p)}</span>`;
  if(days>1&&!ongoing)tags+=`<span class="tag">${days} giorni</span>`;
  if(it.k==='ev'&&!exact(it.ev))tags+=stale(it.ev)?'<span class="tag warn">da verificare</span>':'<span class="tag">date previste</span>';
  return `<button class="card glass" data-act="open" data-k="${it.k}" data-id="${esc(it.id)}" data-s="${iso(it.s)}" style="--tc:var(--t-${it.t})">
    <span class="date">${dd}</span>
    <span class="cb"><span class="n">${fav?'<span class="star">★</span> ':''}${esc(it.n)}</span>
    ${it.c?`<span class="w">${esc(it.c)}</span>`:''}
    <span class="tags">${tags}</span></span></button>`;
}

/* =====================================================================
   ASSISTENTE: capisce domande in italiano e risponde con gli eventi
   ===================================================================== */
const CAPO={PD:[45.407,11.876],VE:[45.438,12.327],VI:[45.546,11.546],TV:[45.666,12.243],VR:[45.438,10.992],RO:[45.070,11.790],BL:[46.139,12.217]};
const PROVN={padova:'PD',padovano:'PD',venezia:'VE',veneziano:'VE',vicenza:'VI',vicentino:'VI',treviso:'TV',trevigiano:'TV',verona:'VR',veronese:'VR',rovigo:'RO',polesine:'RO',belluno:'BL',bellunese:'BL'};
const GIORNI={domenica:0,lunedi:1,martedi:2,mercoledi:3,giovedi:4,venerdi:5,sabato:6};
const MESIN=MESI.map(norm);
const STOP=new Set(('che cosa cosa posso fare fa si ci di da del della dello dei degli delle a al alla allo ai agli alle in nel nella nei nelle con per tra fra su sul sulla e ed o oppure ma il lo la i gli le un uno una mi ti vi ne voglio vorrei andare andiamo vado andrei qualcosa qualche c\'e ce sono ci sono c sono questo questa questi queste quello quella prossimo prossima prossimi prossime oggi stasera stanotte domani dopodomani weekend fine settimana sera serata mattina pomeriggio notte giorno giorni mese vicino vicini me qui zona dintorni intorno dove quando come quali quale tipo tipi eventi evento roba cose cosa fare uscire tutto tutti tutte provincia veneto entro km kilometri chilometri sagra sagre festa feste fiera fiere mercato mercati serate discoteca discoteche locale locali ballare club party night concerto concerti mostra mostre teatro auto moto raduno raduni mangiare cena pranzo grandi grande bello bella belle belli consigli consiglio consigliami suggerisci dimmi trova trovami cerca cercami ho hai ha voglia abbiamo siamo sono andare stavolta ora adesso').split(/\s+/));
let PLACES=null;
function places(){
  if(PLACES)return PLACES;
  const m=new Map();
  const put=(name,ll,p)=>{const k=norm(name).trim();if(k.length<4||PROVN[k])return;if(!m.has(k))m.set(k,{name:name.trim(),ll,p})};
  Object.keys(LUOGHI).forEach(key=>{const [c,p]=key.split('|');c.split(',').forEach(x=>put(x,LUOGHI[key],p));put(c,LUOGHI[key],p)});
  PLACES=[...m.values()].sort((a,b)=>b.name.length-a.name.length);
  return PLACES;
}
function parse(text){
  const t=' '+norm(text).replace(/[^\w\s']/g,' ').replace(/\s+/g,' ')+' ';
  const has=re=>re.test(t);
  const Q={text,range:null,label:'',kinds:null,tipi:null,prov:null,center:null,radius:null,geo:false,words:[],intent:null};
  if(has(/ (aiuto|help|cosa sai fare|come funzion|istruzioni) /))Q.intent='help';
  else if(has(/ (preferit|salvat)/))Q.intent='fav';
  else if(/^\s*(ciao|buongiorno|buonasera|hey|ehi|salve)\s*$/.test(t))Q.intent='hi';
  else if(has(/ grazie /))Q.intent='thanks';
  /* quando */
  let mi=-1;MESIN.forEach((m,i)=>{if(t.includes(' '+m+' '))mi=i});
  const dnum=t.match(/ (\d{1,2}) (gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre) /);
  let gi=null;Object.keys(GIORNI).forEach(g=>{if(t.includes(' '+g+' '))gi=GIORNI[g]});
  if(dnum){let d=new Date(TODAY.getFullYear(),MESIN.indexOf(dnum[2]),+dnum[1]);if(d<TODAY)d=new Date(d.getFullYear()+1,d.getMonth(),d.getDate());Q.range={s:d,e:d};Q.label=fdate(d)}
  else if(has(/ (stasera|stanotte|oggi|adesso|ora|subito) /)){Q.range={s:TODAY,e:TODAY};Q.label=has(/ (stasera|stanotte) /)?'stasera':'oggi'}
  else if(has(/ dopodomani /)){const d=add(TODAY,2);Q.range={s:d,e:d};Q.label='dopodomani'}
  else if(has(/ domani /)){const d=add(TODAY,1);Q.range={s:d,e:d};Q.label=has(/ domani sera /)?'domani sera':'domani'}
  else if(has(/ (weekend|week end|fine settimana|finesettimana) /)){let w=weekendRange();if(has(/ prossimo /)&&(TODAY.getDay()===0||TODAY.getDay()===6))w={s:add(w.e,5),e:add(w.e,7)};Q.range=w;Q.label=w.s<=TODAY?'questo weekend':'nel weekend'}
  else if(gi!==null){let n=(gi-TODAY.getDay()+7)%7;if(has(/ prossim/)&&n===0)n=7;const d=add(TODAY,n);Q.range={s:d,e:d};Q.label=n===0?'oggi':n===1?'domani':GL[gi]+' '+d.getDate()+' '+MESI[d.getMonth()]}
  else if(mi>=0){let Y=TODAY.getFullYear();if(mi<TODAY.getMonth())Y++;const s=new Date(Y,mi,1),e=new Date(Y,mi+1,0);Q.range={s:s<TODAY?TODAY:s,e};Q.label='a '+MESI[mi]}
  else if(has(/ (settimana|prossimi giorni|questi giorni) /)){Q.range={s:TODAY,e:add(TODAY,6)};Q.label='nei prossimi 7 giorni'}
  else if(has(/ mese /)){Q.range={s:TODAY,e:add(TODAY,30)};Q.label='nel prossimo mese'}
  /* cosa */
  const night=has(/ (discotec\w*|serat\w*|ballare|ballo|balliamo|club|locale|locali|dj|night|movida|aperitiv\w*|karaoke|reggaeton|techno|house|latino|latini|party|halloween|drink|cocktail|pub|fare festa|fare serata) /);
  const T=[];
  if(has(/ (sagr\w*|mangiar\w*|cibo|cena|pranzo|fiera|fiere|mercat\w*|gastronom\w*|degust\w*|enogastr\w*) /))T.push('S');
  if(has(/ (feste|ricorrenz\w*|palio|patrono|tradizion\w*|carneval\w*|rievocaz\w*|storic\w*) /)||(!night&&has(/ festa /)))T.push('F');
  if(has(/ (auto|moto|motor\w*|raduno|raduni|rally|epoca) /))T.push('A');
  const big=has(/ (concert\w*|grand\w* event\w*|spettacol\w*|teatro|mostra|mostre|festival|cultura|musica|museo|musei) /);
  if(big)T.push('G');
  if(night&&!T.length)Q.kinds={night:1};
  else if(T.length)Q.kinds={ev:1,web:big,night:night};
  else Q.kinds={ev:1,web:1,night:1};
  Q.tipi=T.length?T:null;
  const bw=[];
  if(has(/ (concert\w*|musica|live) /))bw.push('concert|live|musica|band|orchestra|jazz|coro|tour|dj|cantautor');
  if(has(/ (mostra|mostre|museo|musei|arte) /))bw.push('mostra|museo|arte|esposiz|pittur|fotograf');
  if(has(/ (teatro|spettacol\w*|commedia) /))bw.push('teatro|commedia|spettacol|sipario|musical');
  if(has(/ festival /))bw.push('festival');
  Q.webRe=bw.length?new RegExp(bw.join('|')):null;
  /* dove */
  const kmm=t.match(/ entro (\d{1,3}) ?(km|chilometri|kilometri)? /);if(kmm)Q.radius=+kmm[1];
  const pl=places().find(p=>t.includes(' '+norm(p.name)+' '));
  let pv=null;Object.keys(PROVN).forEach(k=>{if(t.includes(' '+k+' '))pv=PROVN[k]});
  if(pl&&!(pv&&has(/ provincia /))){Q.center={ll:pl.ll,nome:pl.name};Q.radius=Q.radius||20}
  else if(pv&&(kmm||has(/ (vicino|dintorni|intorno|da|dalle parti di) (a )?(padova|venezia|vicenza|treviso|verona|rovigo|belluno) /))){Q.center={ll:CAPO[pv],nome:PROVINCE[pv]};Q.radius=Q.radius||20}
  else if(pv){Q.prov=pv}
  else if(has(/ (vicino|vicini|qui|zona|dintorni|intorno|nei paraggi|a due passi) /)){Q.geo=true;Q.radius=Q.radius||25}
  /* parole chiave rimaste (baccalà, zucca, castagne…) */
  const used=new Set(Object.keys(PROVN).concat(Object.keys(GIORNI),MESIN));
  if(pl)norm(pl.name).split(' ').forEach(w=>used.add(w));
  Q.words=t.trim().split(' ').filter(w=>w.length>=4&&!STOP.has(w)&&!used.has(w)&&!/^\d+$/.test(w)&&!/^(sagr|fest|seral|seral|discot|serat|mangi|ricorr|concert|spettac|aperit)/.test(w));
  return Q;
}
function getPos(){
  return new Promise(res=>{
    if(!navigator.geolocation)return res(null);
    navigator.geolocation.getCurrentPosition(p=>res([+p.coords.latitude.toFixed(4),+p.coords.longitude.toFixed(4)]),()=>res(null),{enableHighAccuracy:false,timeout:9000,maximumAge:600000});
  });
}
async function answer(text){
  const Q=parse(text);
  if(Q.intent==='help')return {html:`<p>Chiedimi quello che ti viene in mente, come lo diresti a un amico:</p><p>• <i>stasera discoteca</i><br>• <i>sagre domenica vicino a Este</i><br>• <i>cosa c'è questo weekend in provincia di Treviso</i><br>• <i>feste a dicembre</i><br>• <i>dove si mangia il baccalà</i><br>• <i>raduni auto entro 30 km</i></p><p>Cerco tra le sagre e le ricorrenze del Veneto, le serate dei locali e gli eventi trovati sui tuoi siti.</p>`};
  if(Q.intent==='hi')return {html:`<p>Ciao! Dimmi quando vuoi uscire e cosa ti va: sagre, feste, serate, concerti… ci penso io.</p>`};
  if(Q.intent==='thanks')return {html:`<p>Figurati! Divertiti 🎉</p>`};
  if(Q.intent==='fav'){
    const favs=EV.filter(ev=>st.fav.includes(ev.id)).map(ev=>{const o=nextOcc(ev);return o?itEv(o):null}).filter(Boolean).sort((a,b)=>a.s-b.s);
    return favs.length?{html:`<p>Ecco i tuoi preferiti, in ordine di data:</p>`,items:favs}:{html:`<p>Non hai ancora preferiti. Apri un evento e tocca la stella ★.</p>`};
  }
  let center=Q.center,note='';
  if(Q.geo){const ll=await getPos();if(ll){center={ll,nome:'te'};st.centro={ll,nome:'la tua posizione'};save()}else{center=st.centro?{ll:st.centro.ll,nome:st.centro.nome}:{ll:[45.407,11.876],nome:'Padova'};note=`Non riesco a sapere dove sei, quindi cerco vicino a ${esc(center.nome)}.`}}
  const range=Q.range||{s:TODAY,e:add(TODAY,13)};
  const label=Q.label||'nelle prossime due settimane';
  const per='per '+({'nelle prossime due settimane':'le prossime due settimane','nei prossimi 7 giorni':'i prossimi 7 giorni','nel weekend':'il weekend','nel prossimo mese':'il prossimo mese'}[label]||label.replace(/^a /,''));
  const filt=(list)=>{
    let L=list;
    if(Q.tipi)L=L.filter(x=>x.k!=='ev'||Q.tipi.includes(x.t));
    if(Q.webRe)L=L.filter(x=>x.k!=='web'||Q.webRe.test(norm(x.n+' '+x.d)));
    if(Q.prov)L=L.filter(x=>x.p===Q.prov);
    if(center){L=L.map(x=>{if(!x.ll)return norm(x.c).includes(norm(center.nome))?Object.assign(x,{km:0}):null;return Object.assign(x,{km:km(center.ll,x.ll)})}).filter(x=>x&&x.km<=(Q.radius||25))}
    return L;
  };
  let all=filt(itemsBetween(range.s,range.e,Q.kinds));
  let kw='';
  if(Q.words.length){
    const hit=all.filter(x=>{const tx=norm(x.n+' '+x.c+' '+x.d);return Q.words.some(w=>tx.includes(w.slice(0,Math.max(4,w.length-1))))});
    if(hit.length)all=hit;
    else{
      /* se la parola non c'è in quel periodo, la cerco più avanti */
      const later=filt(itemsBetween(TODAY,add(TODAY,365),Q.kinds)).filter(x=>{const tx=norm(x.n+' '+x.c+' '+x.d);return Q.words.some(w=>tx.includes(w.slice(0,Math.max(4,w.length-1))))});
      if(later.length&&Q.range)kw=`${cap(per)} non trovo «${esc(Q.words.join(' '))}», ma più avanti sì:`;
      if(later.length){all=later;if(!Q.range)kw=`Ecco cosa ho trovato per «${esc(Q.words.join(' '))}»:`}
    }
  }
  const st0=x=>x.s<range.s?1:0;
  all.sort((a,b)=>st0(a)-st0(b)||a.s-b.s||(center?a.km-b.km:0)||(a.k==='night'?-1:0));
  const dove=center?(center.nome==='te'?' vicino a te':' vicino a '+esc(center.nome))+` (entro ${Q.radius||25} km)`:Q.prov?' in provincia di '+PROVINCE[Q.prov]:'';
  if(!all.length){
    /* niente: provo ad allargare */
    const after=filt(itemsBetween(add(range.e,1),add(range.e,21),Q.kinds));
    if(after.length)return {html:`<p>${note?note+' ':''}${cap(per)}${dove} non ho trovato niente 😕</p><p>Ma poco dopo c'è qualcosa:</p>`,items:after};
    return {html:`<p>${note?note+' ':''}${cap(per)}${dove} non ho trovato niente.</p><p>Prova ad allargare la zona (es. «entro 50 km») o a cambiare giorno.</p>`};
  }
  const n={ev:0,web:0,night:0};all.forEach(x=>n[x.k]++);
  const parts=[];
  if(n.night)parts.push(n.night+(n.night===1?' serata':' serate'));
  if(n.ev)parts.push(n.ev+(Q.tipi&&Q.tipi.length===1&&Q.tipi[0]==='S'?(n.ev===1?' sagra':' sagre'):(n.ev===1?' evento':' eventi')));
  if(n.web)parts.push(n.web+(n.web===1?' evento dai siti':' eventi dai siti'));
  const head=kw||`${cap(label)}${dove} ho trovato ${parts.join(', ').replace(/, ([^,]*)$/,' e $1')}.`;
  return {html:`${note?`<p>${note}</p>`:''}<p>${head}</p>`,items:all,dist:!!center};
}

let THREAD=[];let ansSeq=0;const ANS={};
async function ask(text){
  text=String(text||'').trim();if(!text)return;
  const id='a'+(++ansSeq);
  THREAD.unshift({id,q:text,r:null});
  V.view='chiedi';render();
  const r=await answer(text);
  await new Promise(ok=>setTimeout(ok,V.look.anim?350:0));
  const m=THREAD.find(x=>x.id===id);if(m){m.r=r;ANS[id]=r}
  render();
}
function renderAnswer(m){
  if(!m.r)return `<div class="msg bot glass"><span class="typing"><i></i><i></i><i></i></span></div>`;
  const r=m.r,items=r.items||[],show=m.all?items:items.slice(0,6);
  return `<div class="answer"><div class="msg bot glass">${r.html}</div>
    ${show.length?`<div class="list">${show.map(it=>card(it,r.dist&&it.km!=null?Math.round(it.km):null)).join('')}</div>`:''}
    ${items.length>show.length?`<button class="more glass" data-act="more" data-id="${m.id}">Mostra altri ${items.length-show.length}</button>`:''}</div>`;
}
function greet(){
  const h=new Date().getHours(),g=TODAY.getDay();
  if(g===5||g===6)return h<15?'questo <span>weekend?</span>':'<span>stasera?</span>';
  if(g===0)return h<14?'<span>oggi?</span>':'<span>stasera?</span>';
  return h<16?'<span>oggi?</span>':'<span>stasera?</span>';
}
function vChiedi(){
  const empty=!THREAD.length;
  const w=weekendRange();
  const nTonight=itemsBetween(TODAY,TODAY,{ev:1,web:1,night:1}).length;
  const nWe=itemsBetween(w.s,w.e,{ev:1}).length;
  const nNight=nightItems().filter(x=>x.s<=add(TODAY,6)).length;
  const nWeb=pending().length;
  let h=`<div class="view">`;
  h+=empty?`<div class="hero"><h2>Che si fa ${greet()}</h2><p>Chiedimi cosa ti va di fare e ti dico dove andare.</p></div>`:'';
  h+=`<form class="ask glass" id="askForm" autocomplete="off"><textarea id="askIn" rows="1" placeholder="Es. stasera discoteca…" aria-label="Fai una domanda"></textarea>
    ${('webkitSpeechRecognition' in window||'SpeechRecognition' in window)?`<button type="button" class="send mic" data-act="mic" aria-label="Parla">${ic('mic')}</button>`:''}
    <button class="send go" aria-label="Chiedi">${ic('send')}</button></form>`;
  const sugg=[['Stasera','cosa si fa stasera'],['Domani','cosa c\'è domani'],['Weekend','cosa c\'è questo weekend'],['Vicino a me','cosa c\'è vicino a me questo weekend'],['Discoteca','stasera discoteca'],['Sagre','sagre questo weekend'],['Concerti e mostre','concerti e mostre questa settimana'],['Auto e moto','raduni auto e moto questo mese']];
  h+=`<div class="chips">${sugg.map(([l,qq])=>`<button class="chip glass" data-act="ask" data-q="${esc(qq)}">${l}</button>`).join('')}</div>`;
  if(empty){
    h+=`<div class="lbl">In breve</div><div class="tiles">
      <button class="tile glass" data-act="ask" data-q="cosa si fa stasera" style="--tc:var(--acc)"><b>${nTonight}</b><span>Oggi e stasera</span><small>tutto quello che c'è</small></button>
      <button class="tile glass" data-act="ask" data-q="cosa c'è questo weekend" style="--tc:var(--t-S)"><b>${nWe}</b><span>${w.s<=TODAY?'Questo':'Prossimo'} weekend</span><small>sagre e feste</small></button>
      <button class="tile glass" data-act="ask" data-q="serate in discoteca questa settimana" style="--tc:var(--t-N)"><b>${nNight}</b><span>Serate</span><small>nei prossimi 7 giorni</small></button>
      <button class="tile glass" data-act="ask" data-q="cosa c'è vicino a me questa settimana" style="--tc:var(--t-W)"><b>${ic('locate','width:28px;height:28px')}</b><span>Vicino a te</span><small>entro 25 km</small></button></div>`;
    if(nWeb)h+=`<button class="banner glass" data-act="prop"><b>${nWeb}</b><span>Nuovi eventi dai tuoi siti<small>tocca per controllarli e aggiungerli</small></span>${ic('globe','width:22px;height:22px')}</button>`;
  }else{
    h+=`<div class="lbl">La tua ricerca <button data-act="clear">Nuova chat</button></div><div class="thread">`;
    THREAD.forEach((m,i)=>{h+=`${i?'<div style="height:14px"></div>':''}<div class="msg me">${esc(m.q)}</div>`+renderAnswer(m)});
    h+='</div>';
  }
  return h+`<p class="note">Le date delle ricorrenze sono calcolate dal periodo in cui si ripetono di solito: controlla sempre il programma ufficiale prima di partire.</p></div>`;
}

/* =====================================================================
   AGENDA
   ===================================================================== */
function vAgenda(){
  const night=V.sez==='night';
  const list=EV.filter(passes);
  const nf=(st.prov!=='tutte'?1:0)+st.tipi.length;
  let h=`<div class="view"><div class="seg glass"><button data-act="sez" data-v="sagre" aria-pressed="${!night}">Sagre e feste</button><button data-act="sez" data-v="night" aria-pressed="${night}">Night</button></div>`;
  h+=`<div class="bar"><label class="search glass">${ic('search','width:18px;height:18px;color:var(--mut)')}<input id="q" type="search" value="${esc(q)}" placeholder="${night?'Halloween, latino, locale…':'Baccalà, Arquà, palio…'}"></label>
    ${night?'':`<button class="fbtn glass" data-act="filters">${ic('filter','width:18px;height:18px')}${nf?`<em>${nf}</em>`:''}</button>
    <button class="fbtn glass" data-act="mode" aria-label="${V.mode==='mese'?'Vista lista':'Vista mese'}">${ic(V.mode==='mese'?'list':'grid','width:18px;height:18px')}</button>`}</div>`;
  if(night)return h+vNight()+'</div>';
  if(V.mode==='mese')return h+vMese(list)+'</div>';
  /* striscia dei giorni */
  const from=TODAY,to=add(TODAY,44);
  const os=occBetween(from,to,list);
  const cnt=i=>{const d=add(TODAY,i);return os.filter(o=>o.s<=d&&o.e>=d).length};
  h+=`<div class="days">${Array.from({length:45},(_,i)=>{const d=add(TODAY,i),n=cnt(i),we=d.getDay()===0||d.getDay()===6;
    return `<button class="day glass${we?' we':''}" data-act="day" data-v="${iso(d)}" aria-pressed="${V.day===iso(d)}"><small>${i===0?'oggi':GS[d.getDay()]}</small><b>${d.getDate()}</b><i>${n?n:''}</i></button>`}).join('')}</div>`;
  if(nf||q)h+=`<p class="note" style="margin:6px 4px 0">Filtri attivi: ${list.length} ricorrenze su ${EV.length}. <button class="link" data-act="reset">Togli filtri</button></p>`;
  if(V.day){
    const d=parseIso(V.day);
    const L=occBetween(d,d,list).map(itEv);
    h+=`<div class="sec">${cap(fdate(d))} <small><button class="link" data-act="day" data-v="${V.day}">tutti i giorni</button></small></div>`;
    h+=L.length?`<div class="list">${L.map(x=>card(x)).join('')}</div>`:`<div class="empty">Nessun evento in elenco per questo giorno.</div>`;
    return h+'</div>';
  }
  const p=pending();
  if(p.length)h+=`<button class="banner glass" data-act="prop"><b>${p.length}</b><span>Nuovi eventi dai tuoi siti<small>tocca per controllarli</small></span>${ic('globe','width:22px;height:22px')}</button>`;
  const w=weekendRange();
  const wk=occBetween(w.s,w.e,list).map(itEv);
  const ids=new Set(wk.map(o=>o.id+iso(o.s)));
  const later=occBetween(add(w.e,1),add(TODAY,120),list).map(itEv).filter(o=>!ids.has(o.id+iso(o.s)));
  h+=`<div class="sec">${w.s<=TODAY?'Questo weekend':'Il prossimo weekend'} <small>${w.s.getDate()}–${w.e.getDate()} ${MS[w.e.getMonth()]}</small></div>`;
  h+=wk.length?`<div class="list">${wk.map(x=>card(x)).join('')}</div>`:`<div class="empty">Niente in elenco per questo weekend con questi filtri.</div>`;
  let cur='';
  later.forEach(o=>{const k=cap(MESI[o.s.getMonth()])+' '+o.s.getFullYear();if(k!==cur){if(cur)h+='</div>';cur=k;h+=`<div class="sec">${k}</div><div class="list">`}h+=card(o)});
  if(cur)h+='</div>';
  return h+'</div>';
}
function vMese(list){
  const m=V.mese?parseIso(V.mese+'-01'):new Date(TODAY.getFullYear(),TODAY.getMonth(),1);
  const from=new Date(m.getFullYear(),m.getMonth(),1),to=new Date(m.getFullYear(),m.getMonth()+1,0);
  const all=occBetween(from,to,list);
  let h=`<div class="sec" style="align-items:center"><button class="fbtn glass" data-act="mese" data-v="-1" aria-label="Mese precedente">‹</button><span>${cap(MESI[m.getMonth()])} ${m.getFullYear()}</span><button class="fbtn glass" data-act="mese" data-v="1" aria-label="Mese successivo">›</button></div>`;
  const lead=(from.getDay()+6)%7;
  h+=`<div class="glass" style="border-radius:22px;padding:10px;display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center">`;
  h+=['lun','mar','mer','gio','ven','sab','dom'].map(g=>`<small style="color:var(--mut);font-weight:800;font-size:.68rem;text-transform:uppercase">${g}</small>`).join('');
  for(let i=0;i<lead;i++)h+='<span></span>';
  for(let g=1;g<=to.getDate();g++){
    const d=new Date(m.getFullYear(),m.getMonth(),g),n=all.filter(o=>+o.s===+d).length,sel=V.day===iso(d),past=d<TODAY;
    h+=`<button data-act="mday" data-v="${iso(d)}" style="padding:7px 0;border-radius:12px;font-weight:800;${sel?'background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;':+d===+TODAY?'outline:1px solid var(--acc);':''}${past&&!sel?'opacity:.45;':''}">${g}<span style="display:block;height:6px;margin-top:2px">${n?`<i style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${sel?'#fff':'var(--acc2)'}"></i>`:''}</span></button>`;
  }
  h+='</div>';
  const sel=V.day&&parseIso(V.day);
  const L=(sel&&sel>=from&&sel<=to?occBetween(sel,sel,list):all).map(itEv);
  const fut=L.filter(o=>o.e>=TODAY),past=L.filter(o=>o.e<TODAY);
  h+=`<div class="sec">${sel&&sel>=from&&sel<=to?cap(fdate(sel)):all.length+' eventi nel mese'}</div>`;
  h+=fut.length?`<div class="list">${fut.map(x=>card(x)).join('')}</div>`:past.length?'':`<div class="empty">Nessun evento.</div>`;
  if(past.length)h+=`<details style="margin-top:14px"><summary class="note" style="margin:0;cursor:pointer;font-weight:700">Già passati (${past.length})</summary><div class="list" style="opacity:.6;margin-top:10px">${past.map(x=>card(x)).join('')}</div></details>`;
  return h;
}
function vNight(){
  let all=nightItems().sort((a,b)=>a.s-b.s||a.n.localeCompare(b.n,'it'));
  if(q)all=all.filter(p=>norm(q).split(/\s+/).every(w=>norm(p.n+' '+p.c+' '+p.d).includes(w)));
  const srcN=(PROP.fonti||[]).filter(f=>f.night).length;
  if(!all.length)return `<div class="empty" style="margin-top:14px">${srcN?'Nessuna serata in arrivo per ora. La lista si aggiorna da sola ogni lunedì.':'Aggiungi in fonti.txt un sito di locali con <b>| night</b> alla fine della riga.'}</div>`;
  let h='',cur='';
  for(const p of all){
    const d=p.s<TODAY?TODAY:p.s;
    const k=+d===+TODAY?'Stasera':+d===+add(TODAY,1)?'Domani':cap(fdate(d));
    if(k!==cur){if(cur)h+='</div>';cur=k;h+=`<div class="sec">${k}</div><div class="list">`}
    h+=card(p);
  }
  return h+`</div><p class="note">Serate prese in automatico dai siti dei locali${PROP.aggiornato?', aggiornate '+fdate(new Date(PROP.aggiornato)):''}: controlla sempre orari e prezzi sul sito.</p>`;
}

/* =====================================================================
   MAPPA
   ===================================================================== */
const PERIODI={oggi:'Oggi',weekend:'Weekend',sette:'7 giorni',trenta:'30 giorni'};
const RAGGI=[10,25,50,100,0];
let MAP=null,mapView=null,drawerLow=false;
function periodRange(k){
  if(k==='oggi')return {s:TODAY,e:TODAY};
  if(k==='sette')return {s:TODAY,e:add(TODAY,6)};
  if(k==='trenta')return {s:TODAY,e:add(TODAY,29)};
  return weekendRange();
}
function centro(){return st.centro||{ll:[45.407,11.876],nome:'Padova'}}
function radarData(){
  const rng=periodRange(st.periodo||'weekend'),c=centro(),R=st.raggio===undefined?25:st.raggio;
  const os=itemsBetween(rng.s,rng.e,{ev:1,web:1,night:1},EV.filter(passes)).filter(x=>x.ll).map(x=>Object.assign(x,{km:km(c.ll,x.ll)}));
  const vis=(R?os.filter(o=>o.km<=R):os).sort((a,b)=>a.km-b.km||a.s-b.s);
  return {rng,c,R,vis};
}
function vMappa(){
  const d=radarData(),per=st.periodo||'weekend';
  return `<div class="view"><div class="mapwrap">
    <div id="map" class="map" role="region" aria-label="Mappa degli eventi"></div>
    <div class="mapctl">
      <div class="chips">${Object.keys(PERIODI).map(k=>`<button class="chip glass" data-act="periodo" data-v="${k}" aria-pressed="${per===k}">${PERIODI[k]}</button>`).join('')}</div>
      <div class="chips">${RAGGI.map(r=>`<button class="chip glass" data-act="raggio" data-v="${r}" aria-pressed="${d.R===r}">${r?r+' km':'Tutti'}</button>`).join('')}</div>
    </div>
    <button class="geo glass" data-act="geo" aria-label="Vicino a me">${ic('locate','width:24px;height:24px')}</button>
    <div class="drawer glass${drawerLow?' low':''}" id="drawer">
      <div class="grab" data-act="drawer"></div>
      <h3 data-act="drawer"><span>${d.vis.length} ${d.vis.length===1?'evento':'eventi'}${d.R?' entro '+d.R+' km':''}</span><small>da ${esc(d.c.nome)}</small></h3>
      <div class="list">${d.vis.length?d.vis.map(o=>card(o,Math.round(o.km))).join(''):`<div class="empty">Nessun evento qui nel periodo scelto. Allarga la distanza o il periodo.</div>`}</div>
    </div></div></div>`;
}
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#8B5CF6'}
function initMap(){
  if(MAP){MAP.remove();MAP=null}
  const el=document.getElementById('map');if(!el)return;
  if(!window.L){el.innerHTML='<p class="note" style="padding:16px">La mappa ha bisogno di internet.</p>';return}
  const d=radarData();
  const zoom={10:11,25:10,50:9,100:8,0:8}[d.R];
  MAP=L.map(el,{zoomControl:false,attributionControl:true}).setView(mapView?mapView.c:d.c.ll,mapView?mapView.z:zoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(MAP);
  if(d.R)L.circle(d.c.ll,{radius:d.R*1000,color:cssVar('--acc'),weight:1.5,fillOpacity:.07,dashArray:'6 6'}).addTo(MAP);
  L.marker(d.c.ll,{icon:L.divIcon({className:'',html:'<div class="me-pin"></div>',iconSize:[16,16],iconAnchor:[8,8]})}).addTo(MAP).bindTooltip(d.c.nome);
  const per={};d.vis.forEach(o=>{const k=o.ll.join(',');(per[k]=per[k]||[]).push(o)});
  Object.values(per).forEach(g=>{
    const m=L.marker(g[0].ll,{icon:L.divIcon({className:'',html:`<div class="pin" style="--c:${cssVar('--t-'+g[0].t)}"></div>`,iconSize:[18,18],iconAnchor:[9,9]})}).addTo(MAP);
    m.bindPopup(`<div class="pop"><b>${esc(g[0].c||'')}</b>${Math.round(g[0].km)} km${g.map(o=>`<button data-k="${o.k}" data-open="${esc(o.id)}" data-s="${iso(o.s)}">${esc(o.n)}<small>${frange(o.s,o.e)}</small></button>`).join('')}</div>`);
  });
  MAP.on('popupopen',e=>{e.popup.getElement().querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{MAP.closePopup();openItem(b.dataset.k,b.dataset.open,b.dataset.s)}))});
  MAP.on('moveend',()=>{mapView={c:MAP.getCenter(),z:MAP.getZoom()}});
  MAP.on('click',e=>{st.centro={ll:[+e.latlng.lat.toFixed(4),+e.latlng.lng.toFixed(4)],nome:'punto scelto'};mapView=null;save();render()});
}
async function geo(){
  toast('Cerco la tua posizione…');
  const ll=await getPos();
  if(!ll){toast('Posizione non disponibile: tocca la mappa per scegliere il centro');return}
  st.centro={ll,nome:'la tua posizione'};mapView=null;save();render();toast('Ecco cosa c\'è vicino a te');
}

/* =====================================================================
   SALVATI
   ===================================================================== */
function vSalvati(){
  const favs=EV.filter(ev=>st.fav.includes(ev.id)).map(ev=>{const o=nextOcc(ev);return o?itEv(o):null}).filter(Boolean).sort((a,b)=>a.s-b.s);
  const mine=st.mine.map(m=>EV.find(e=>e.id===m.id)).filter(Boolean).map(ev=>{const o=nextOcc(ev);return o?itEv(o):null}).filter(Boolean).sort((a,b)=>a.s-b.s);
  const p=pending().length;
  let h=`<div class="view"><div class="hero" style="padding-top:8px"><h2 style="font-size:1.6rem">I tuoi <span>salvati</span></h2></div>
  <div class="actrow"><button class="big glass" data-act="add">${ic('plus')}Nuovo evento</button><button class="big glass" data-act="prop">${ic('globe')}Dai tuoi siti${p?` <span class="tag t" style="--tc:var(--acc)">${p}</span>`:''}</button></div>`;
  h+=`<div class="sec">Preferiti <small>${favs.length}</small></div>`;
  h+=favs.length?`<div class="list">${favs.map(x=>card(x)).join('')}</div>`:`<div class="empty">Nessun preferito. Apri un evento e tocca la ★.</div>`;
  if(mine.length)h+=`<div class="sec">Aggiunti da te <small>${mine.length}</small></div><div class="list">${mine.map(x=>card(x)).join('')}</div>`;
  return h+'</div>';
}

/* =====================================================================
   SCHEDE (sheet)
   ===================================================================== */
function openSheet(h){$('#sheetBody').innerHTML=h;$('#sheetWrap').hidden=false;document.body.style.overflow='hidden'}
function closeSheet(){$('#sheetWrap').hidden=true;$('#sheetBody').innerHTML='';document.body.style.overflow=''}
let tt=0;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(tt);tt=setTimeout(()=>el.hidden=true,2400)}
const gcal=(n,c,p,d,s,e)=>'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(n)+'&dates='+iso(s).replace(/-/g,'')+'/'+iso(add(e,1)).replace(/-/g,'')+'&location='+encodeURIComponent(c+(p?', '+(PROVINCE[p]||p):''))+'&details='+encodeURIComponent(d||'');
function icsFile(ev,o){
  const d=x=>iso(x).replace(/-/g,''),t=s=>String(s||'').replace(/([,;\\])/g,'\\$1').replace(/\n/g,'\\n');
  const now=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
  const txt=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Che si fa//IT','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    'UID:'+ev.id+'-'+d(o.s)+'@lunario-sagre','DTSTAMP:'+now,'DTSTART;VALUE=DATE:'+d(o.s),'DTEND;VALUE=DATE:'+d(add(o.e,1)),
    'SUMMARY:'+t(ev.n),'LOCATION:'+t(ev.c+', '+(PROVINCE[ev.p]||'')),'DESCRIPTION:'+t((ev.d||'')+(exact(ev)?'':' Date previste: verifica il programma ufficiale.')),
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+t('Domani: '+ev.n),'TRIGGER:-PT6H','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'text/calendar'}));
  a.download=ev.n.replace(/[^\w\sàèéìòù-]/gi,'').trim().replace(/\s+/g,'-').slice(0,40)+'.ics';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
  toast('Apri il file per aggiungerlo: ti avvisa il giorno prima');
}
const maps=(c,p)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c+', '+(PROVINCE[p]||p||'')+', Italia');
const gsearch=(n,c,Y)=>'https://www.google.com/search?q='+encodeURIComponent(n+' '+c+' '+Y+' programma');
const gb=(icon,label,attrs,on)=>`<${attrs.startsWith('href')?'a':'button'} class="gbtn glass${on?' on':''}" ${attrs}>${ic(icon)}${label}</${attrs.startsWith('href')?'a':'button'}>`;
function openItem(k,id,s){
  if(k==='ev')return openEvent(id,s);
  const it=(k==='night'?nightItems():webItems()).find(x=>x.id===id);if(!it)return;
  openSheet(`<h2>${esc(it.n)}</h2><p class="place">${esc(it.c||'')}${it.p?' · '+esc(PROVINCE[it.p]||it.p):''}</p>
  <div class="evhero" style="--tc:var(--t-${it.t})"><div class="k">${k==='night'?'Serata nei locali':'Trovato sui tuoi siti'}</div><div class="d">${frange(it.s,it.e)}</div>
  <div class="s">${k==='night'?'Preso in automatico dal sito del locale: controlla orari e prezzi.':'Trovato dallo scanner: controlla sul sito prima di andare.'}</div></div>
  ${it.d?`<p class="desc">${esc(String(it.d).replace(/<[^>]+>/g,'').slice(0,300))}</p>`:''}
  <div class="grid">
    ${it.url?gb('ext','Apri il sito',`href="${esc(it.url)}" target="_blank" rel="noopener"`):''}
    ${gb('google','Google Calendar',`href="${gcal(it.n,it.c,it.p,it.url,it.s,it.e)}" target="_blank" rel="noopener"`)}
    ${it.c?gb('pin','Maps',`href="${maps(it.c,it.p)}" target="_blank" rel="noopener"`):''}
  </div>
  <div class="stack">${k==='web'?`<button class="btn pri" data-act="propAdd" data-id="${esc(it.id)}">Aggiungi ai miei eventi</button><button class="btn glass" data-act="propIgn" data-id="${esc(it.id)}">Non mi interessa</button>`:''}
  <button class="btn glass" data-act="close">Chiudi</button></div>`);
}
function openEvent(id,sIso){
  const ev=EV.find(x=>x.id===id);if(!ev)return;
  let o=null;
  if(sIso){const s=parseIso(sIso);o=occBetween(s,s,[ev]).find(x=>+x.s===+s)||null}
  if(!o)o=nextOcc(ev);
  const fav=st.fav.includes(ev.id);
  openSheet(`<h2>${esc(ev.n)}</h2><p class="place">${esc(ev.c)} · ${esc(PROVINCE[ev.p]||ev.p)}</p>
  <div class="evhero" style="--tc:var(--t-${ev.t})"><div class="k">${TIPI[ev.t]} · ${o&&o.e<TODAY?'edizione passata':exact(ev)?'prossima data':'prossima edizione prevista'}</div>
    <div class="d">${o?frange(o.s,o.e):'—'}</div>
    <div class="s">Di solito: ${esc(descr(ev))}</div>
    ${ev.u?`<div class="s">Ultima edizione nota: ${esc(ev.u)}</div>`:''}
    ${stale(ev)?`<div class="s warn">Ultima conferma del ${lastYear(ev)}: controlla il programma prima di andare</div>`:''}</div>
  ${ev.d?`<p class="desc">${esc(ev.d)}</p>`:''}
  <div class="grid">
    ${gb('star',fav?'Salvato':'Salva',`data-act="fav" data-id="${esc(ev.id)}"`,fav)}
    ${o&&o.e>=TODAY?gb('bell','Promemoria',`data-act="ics" data-id="${esc(ev.id)}" data-s="${iso(o.s)}"`):''}
    ${o?gb('google','Google Calendar',`href="${gcal(ev.n,ev.c,ev.p,ev.d,o.s,o.e)}" target="_blank" rel="noopener"`):''}
    ${gb('pin','Maps',`href="${maps(ev.c,ev.p)}" target="_blank" rel="noopener"`)}
    ${o?gb('search','Programma '+o.s.getFullYear(),`href="${gsearch(ev.n,ev.c,o.s.getFullYear())}" target="_blank" rel="noopener"`):''}
    ${ev.url?gb('ext','Pagina evento',`href="${esc(ev.url)}" target="_blank" rel="noopener"`):''}
    ${ev.mine?gb('edit','Modifica',`data-act="edit" data-id="${esc(ev.id)}"`)+gb('trash','Elimina',`data-act="del" data-id="${esc(ev.id)}"`):''}
  </div>
  <div class="stack"><button class="btn glass" data-act="close">Chiudi</button></div>
  ${!exact(ev)?'<p class="note" style="margin-top:12px">Data calcolata dal periodo abituale: verifica il programma ufficiale prima di andare.</p>':''}`);
}
function openFilters(){
  openSheet(`<h2>Filtri</h2>
  <div class="field"><label>Provincia</label><div class="opt">${[['tutte','Tutto il Veneto']].concat(REGIONI.Veneto.map(p=>[p,PROVINCE[p]])).map(([k,l])=>`<button class="chip glass" data-act="prov" data-v="${k}" aria-pressed="${st.prov===k}">${l}</button>`).join('')}</div></div>
  <div class="field"><label>Tipo</label><div class="opt">${Object.keys(TIPIP).map(k=>`<button class="chip glass" data-act="tipo" data-v="${k}" aria-pressed="${st.tipi.includes(k)}"><span class="dot" style="background:var(--t-${k})"></span>${TIPIP[k]}</button>`).join('')}</div></div>
  <div class="stack"><button class="btn pri" data-act="close">Fatto</button><button class="btn glass" data-act="reset">Togli tutti i filtri</button></div>`);
}
function openLook(){
  const L=V.look;
  const o=(act,v,cur,label)=>`<button class="chip glass" data-act="${act}" data-v="${v}" aria-pressed="${cur}">${label}</button>`;
  openSheet(`<h2>Aspetto</h2><p class="place">Le scelte restano salvate su questo telefono.</p>
  <div class="field"><label>Tema</label><div class="opt">${o('lk-theme','dark',L.theme==='dark','Scuro')}${o('lk-theme','light',L.theme==='light','Chiaro')}${o('lk-theme','auto',L.theme==='auto','Come il telefono')}</div></div>
  <div class="field"><label>Colore</label><div class="opt">${ACC.map((a,i)=>`<button class="sw" data-act="lk-acc" data-v="${i}" aria-pressed="${L.acc===i}" aria-label="${a[0]}" style="background:linear-gradient(135deg,${a[1]},${a[2]})"></button>`).join('')}</div></div>
  <div class="field"><label>Effetto vetro</label><div class="opt">${o('lk-glass','1',!!L.glass,'Acceso')}${o('lk-glass','0',!L.glass,'Spento (più veloce)')}</div></div>
  <div class="field"><label>Animazioni</label><div class="opt">${o('lk-anim','1',!!L.anim,'Accese')}${o('lk-anim','0',!L.anim,'Spente')}</div></div>
  <div class="field"><label>Dimensione testo</label><div class="opt">${o('lk-fs','14',L.fs===14,'Piccolo')}${o('lk-fs','16',L.fs===16,'Normale')}${o('lk-fs','18',L.fs===18,'Grande')}</div></div>
  <div class="stack"><button class="btn glass" data-act="prop">Siti controllati e scanner</button><button class="btn pri" data-act="close">Fatto</button></div>`);
}
function openProp(){
  const p=pending(),f=PROP.fonti||[];
  const old=EV.filter(stale).map(ev=>{const o=nextOcc(ev);return o&&itEv(o)}).filter(Boolean).sort((a,b)=>a.s-b.s).slice(0,40);
  openSheet(`<h2>Eventi dai tuoi siti</h2>
  <p class="place">${PROP.aggiornato?'Ultimo controllo: '+fdate(new Date(PROP.aggiornato))+'. ':''}I siti vengono controllati da soli ogni lunedì mattina.</p>
  ${p.length>1?`<div class="row2" style="margin-bottom:12px"><button class="btn pri" data-act="propAddAll">Aggiungi tutti (${p.length})</button><button class="btn glass" data-act="propIgnAll">Ignora tutti</button></div>`:''}
  ${p.length?p.map(x=>{const s=parseIso(x.s),e=parseIso(x.e);return `<div class="prop glass"><b>${esc(x.n)}</b>
    <span style="font-size:.88rem;color:var(--ink2)">${frange(s,e)}${x.c?' · '+esc(x.c):''}${x.p?' ('+esc(x.p)+')':''}</span>
    ${x.d?`<span style="font-size:.8rem;color:var(--mut)">${esc(String(x.d).replace(/<[^>]+>/g,'').slice(0,160))}</span>`:''}
    <a class="src" href="${esc(x.url)}" target="_blank" rel="noopener">Vedi sul sito ↗</a>
    <span class="pb"><button class="btn pri" data-act="propAdd" data-id="${esc(x.id)}">Aggiungi</button><button class="btn glass" data-act="propIgn" data-id="${esc(x.id)}">Ignora</button></span></div>`}).join('')
   :`<div class="empty">${f.length?'Nessun evento nuovo da controllare.':'Non hai ancora aggiunto siti da controllare.'}</div>`}
  <div class="sec">I tuoi siti <small>${f.length}</small></div>
  ${f.map(x=>`<div class="srow"><span>${esc(x.url.replace(/^https?:\/\/(www\.)?/,''))}</span><span>${x.ok?x.n+' trovati':'<span class="warn">'+esc(x.errore||'non letto')+'</span>'}</span></div>`).join('')}
  <div class="stack">
    <a class="btn pri" href="https://github.com/${REPO}/edit/main/fonti.txt" target="_blank" rel="noopener">Aggiungi o togli un sito</a>
    <button class="btn glass" data-act="scanNow">${ic('refresh','width:18px;height:18px')} Controlla i siti adesso</button>
  </div>
  <p class="note" style="margin-top:8px">Il controllo ci mette 3-5 minuti: poi chiudi e riapri l'app. <a class="link" href="https://github.com/${REPO}/actions/workflows/scansiona.yml" target="_blank" rel="noopener">Stato su GitHub ↗</a></p>
  ${old.length?`<div class="sec">Da ricontrollare <small>ultima conferma vecchia</small></div><div class="list">${old.map(o=>card(o)).join('')}</div>`:''}
  <div class="stack"><button class="btn glass" data-act="close">Chiudi</button></div>`);
}
const TOKK='lunario-gh';
function leggiTok(){try{return localStorage.getItem(TOKK)||''}catch(e){return ''}}
function tokForm(msg){
  openSheet(`<h2>Avvia il controllo dei siti</h2>
  ${msg?`<p class="warn" style="margin:0 0 10px">${esc(msg)}</p>`:''}
  <p class="place">Serve una chiave personale di GitHub, da creare una volta sola. Resta salvata solo su questo telefono.</p>
  <ol style="margin:0 0 14px;padding-left:20px;line-height:1.6;color:var(--ink2);font-size:.92rem">
    <li>Apri <a class="link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">questa pagina di GitHub ↗</a></li>
    <li>Nome: <b>Che si fa</b>. Scadenza: la più lunga (1 anno).</li>
    <li>In «Repository access» scegli <b>Only select repositories</b> e seleziona <b>Sagre</b>.</li>
    <li>In «Permissions» → «Repository permissions» imposta <b>Actions</b> su <b>Read and write</b>.</li>
    <li>Tocca «Generate token», copia la chiave e incollala qui sotto.</li></ol>
  <div class="field"><label for="fTok">Chiave GitHub</label><input class="in glass" id="fTok" type="password" autocomplete="off" placeholder="github_pat_…"></div>
  <div class="stack"><button class="btn pri" data-act="saveTok">Salva e avvia il controllo</button><button class="btn glass" data-act="close">Annulla</button></div>`);
}
function avviaScan(){
  const tok=leggiTok();if(!tok){tokForm();return}
  toast('Avvio il controllo…');
  fetch('https://api.github.com/repos/'+REPO+'/actions/workflows/scansiona.yml/dispatches',{method:'POST',
    headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+tok,'X-GitHub-Api-Version':'2022-11-28'},body:JSON.stringify({ref:'main'})})
    .then(r=>{
      if(r.status===204){closeSheet();toast('Controllo avviato: ci mette 3-5 minuti, poi riapri l\'app')}
      else if(r.status===401||r.status===403||r.status===404){try{localStorage.removeItem(TOKK)}catch(e){}tokForm('La chiave non funziona (scaduta o con permessi sbagliati). Creane una nuova.')}
      else toast('Errore '+r.status+': riprova tra poco')})
    .catch(()=>toast('Nessuna connessione: riprova'));
}
function evForm(ev,pid){
  const m=ev||{};const fr=m.r&&(m.r.f||m.r.f2);const s=fr?fr[0]:iso(TODAY),e=fr?fr[1]:iso(TODAY);
  openSheet(`<h2>${m.id?'Modifica evento':'Nuovo evento'}</h2>
  <div class="field"><label for="fN">Nome</label><input class="in glass" id="fN" value="${esc(m.n||'')}" placeholder="Es. Sagra di San Rocco"></div>
  <div class="field"><label for="fC">Comune o luogo</label><input class="in glass" id="fC" value="${esc(m.c||'')}" placeholder="Es. Arsego"></div>
  <div class="row2"><div class="field"><label for="fP">Provincia</label><select class="in glass" id="fP">${REGIONI.Veneto.map(p=>`<option value="${p}" ${(m.p||'PD')===p?'selected':''}>${PROVINCE[p]}</option>`).join('')}</select></div>
  <div class="field"><label for="fT">Tipo</label><select class="in glass" id="fT">${Object.keys(TIPIP).map(k=>`<option value="${k}" ${(m.t||'S')===k?'selected':''}>${TIPI[k]}</option>`).join('')}</select></div></div>
  <div class="row2"><div class="field"><label for="fS">Dal</label><input class="in glass" type="date" id="fS" value="${s}"></div><div class="field"><label for="fE">Al</label><input class="in glass" type="date" id="fE" value="${e}"></div></div>
  <label class="check"><input type="checkbox" id="fY" ${m.r&&m.r.ann?'checked':''}> Si ripete ogni anno nelle stesse date</label>
  <div class="field"><label for="fD">Note</label><input class="in glass" id="fD" value="${esc(m.d||'')}" placeholder="Cosa si mangia, con chi andare…"></div>
  <div class="stack"><button class="btn pri" data-act="saveEv" data-id="${esc(m.id||'')}" data-pid="${esc(pid||'')}">Salva</button><button class="btn glass" data-act="close">Annulla</button></div>`);
}

/* =====================================================================
   RENDER
   ===================================================================== */
const VIEWS=[['chiedi','Chiedi','chat'],['agenda','Agenda','cal'],['mappa','Mappa','map'],['salvati','Salvati','heart']];
function render(){
  EV=allEvents();
  $('#sub').textContent=cap(GL[TODAY.getDay()])+' '+TODAY.getDate()+' '+MESI[TODAY.getMonth()];
  $('#nav').innerHTML=VIEWS.map(([k,l,i])=>`<button data-act="view" data-v="${k}" aria-current="${V.view===k}">${ic(i)}${l}</button>`).join('');
  if(V.view!=='mappa'&&MAP){MAP.remove();MAP=null}
  const html=V.view==='agenda'?vAgenda():V.view==='mappa'?vMappa():V.view==='salvati'?vSalvati():vChiedi();
  const app=$('#app');
  const qIn=document.activeElement&&document.activeElement.id==='q';
  app.innerHTML=html;
  if(V.view==='mappa')initMap();
  if(qIn){const i=$('#q');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}}
  bindAsk();
}
function bindAsk(){
  const f=$('#askForm');if(!f)return;
  const ta=$('#askIn');
  const grow=()=>{ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,120)+'px'};
  ta.addEventListener('input',grow);
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();f.requestSubmit()}});
  f.addEventListener('submit',e=>{e.preventDefault();const v=ta.value;ta.value='';ask(v)});
}
let REC=null;
function mic(btn){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return;
  if(REC){REC.stop();return}
  REC=new SR();REC.lang='it-IT';REC.interimResults=true;REC.maxAlternatives=1;
  btn.classList.add('on');
  let fin='';
  REC.onresult=e=>{let s='';for(const r of e.results){s+=r[0].transcript;if(r.isFinal)fin=s}const ta=$('#askIn');if(ta)ta.value=s};
  REC.onerror=()=>{toast('Non ho sentito bene, riprova')};
  REC.onend=()=>{btn.classList.remove('on');REC=null;if(fin)ask(fin)};
  try{REC.start()}catch(e){REC=null;btn.classList.remove('on')}
}

/* ---------- azioni ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v,id=b.dataset.id;
  switch(a){
  case 'view':V.view=v;save();render();window.scrollTo(0,0);break;
  case 'ask':ask(b.dataset.q);window.scrollTo(0,0);break;
  case 'more':{const m=THREAD.find(x=>x.id===id);if(m){m.all=1;render()}break}
  case 'clear':THREAD=[];render();break;
  case 'mic':mic(b);break;
  case 'look':openLook();break;
  case 'lk-theme':V.look.theme=v;save();applyLook();openLook();if(MAP)render();break;
  case 'lk-acc':V.look.acc=+v;save();applyLook();openLook();break;
  case 'lk-glass':V.look.glass=+v;save();applyLook();openLook();break;
  case 'lk-anim':V.look.anim=+v;save();applyLook();openLook();break;
  case 'lk-fs':V.look.fs=+v;save();applyLook();openLook();break;
  case 'sez':V.sez=v;q='';save();render();break;
  case 'day':V.day=V.day===v?null:v;save();render();break;
  case 'mday':V.day=V.day===v?null:v;save();render();break;
  case 'mode':V.mode=V.mode==='mese'?'lista':'mese';V.day=null;save();render();break;
  case 'mese':{const m=V.mese?parseIso(V.mese+'-01'):new Date(TODAY.getFullYear(),TODAY.getMonth(),1);const n=new Date(m.getFullYear(),m.getMonth()+(+v),1);V.mese=n.getFullYear()+'-'+pad(n.getMonth()+1);V.day=null;save();render();break}
  case 'filters':openFilters();break;
  case 'reset':st.prov='tutte';st.tipi=[];q='';save();if(!$('#sheetWrap').hidden)closeSheet();render();break;
  case 'prov':st.prov=v;save();render();openFilters();break;
  case 'tipo':st.tipi=st.tipi.includes(v)?st.tipi.filter(x=>x!==v):st.tipi.concat(v);save();render();openFilters();break;
  case 'open':openItem(b.dataset.k||'ev',id,b.dataset.s);break;
  case 'geo':geo();break;
  case 'drawer':drawerLow=!drawerLow;$('#drawer').classList.toggle('low',drawerLow);break;
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
    let n=0;
    pending().forEach((x,i)=>{
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
  case 'del':{if(b.dataset.ok){st.mine=st.mine.filter(x=>x.id!==id);st.fav=st.fav.filter(x=>x!==id);save();closeSheet();render();toast('Evento eliminato')}else{b.dataset.ok='1';b.lastChild.textContent='Tocca ancora'}break}
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
let qt=0;document.addEventListener('input',e=>{if(e.target.id!=='q')return;clearTimeout(qt);qt=setTimeout(()=>{q=e.target.value.trim();render()},200)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheetWrap').hidden)closeSheet()});
$('#lookBtn').innerHTML=ic('sliders','width:20px;height:20px');
render();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
/* per le prove */
window.__chesifa={parse,answer};
})();
