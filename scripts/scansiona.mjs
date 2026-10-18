// Lunario delle Sagre - scanner dei siti di eventi.
// Legge i link da fonti.txt, scarica ogni pagina, cerca eventi con le date
// e scrive proposte.js: l'app li mostra in "Eventi trovati sui tuoi siti" da controllare.
// Uso: node scripts/scansiona.mjs            (scarica i siti)
//      node scripts/scansiona.mjs --file pagina.html [PD]   (prova su un file locale)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OGGI = new Date(); OGGI.setHours(0, 0, 0, 0);
const MAX_GIORNI = 550;          // ignora eventi oltre ~18 mesi
const MAX_PER_SITO = 80;

/* ---------- dati dell'app (per riconoscere comuni e doppioni) ---------- */
function caricaDati() {
  const src = readFileSync(join(ROOT, 'eventi.js'), 'utf8') + '\n' + readFileSync(join(ROOT, 'luoghi.js'), 'utf8');
  return new Function(src + '\nreturn {EVENTI, PROVINCE, LUOGHI};')();
}
const { EVENTI, PROVINCE, LUOGHI } = caricaDati();
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const SIGLE = Object.keys(PROVINCE);
// comuni conosciuti: "Arsego, San Giorgio delle Pertiche|PD" -> "arsego" e "san giorgio delle pertiche"
const COMUNI = [];
for (const k of Object.keys(LUOGHI)) {
  const [luogo, p] = k.split('|');
  for (const parte of luogo.split(',')) { const n = norm(parte); if (n.length > 3) COMUNI.push({ n, nome: parte.trim(), p, chiave: luogo }); }
}
for (const [p, nome] of Object.entries(PROVINCE)) if (!COMUNI.some(c => c.n === norm(nome))) COMUNI.push({ n: norm(nome), nome, p, chiave: '' });
COMUNI.sort((a, b) => b.n.length - a.n.length);
const NOMI_NOTI = EVENTI.map(e => ({ n: norm(e[1]), c: norm(e[2]) }));

/* ---------- date in italiano ---------- */
const MESI = { gen: 1, feb: 2, mar: 3, apr: 4, mag: 5, giu: 6, lug: 7, ago: 8, set: 9, sett: 9, ott: 10, nov: 11, dic: 12 };
const MESE_RE = '(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|genn?|feb|mar|apr|mag|giu|lug|ago|sett?|ott|nov|dic)\\.?';
const mese = s => MESI[s.toLowerCase().replace('.', '').slice(0, 3)] || MESI[s.toLowerCase().slice(0, 4)];
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
function data(g, m, y) {
  if (!m || g < 1 || g > 31) return null;
  if (!y) { // anno mancante: quest'anno, o il prossimo se è già passato da più di un mese
    y = OGGI.getFullYear();
    if (new Date(y, m - 1, g) < new Date(OGGI.getTime() - 31 * 864e5)) y++;
  }
  if (y < 100) y += 2000;
  const d = new Date(y, m - 1, g);
  return d.getMonth() === m - 1 ? d : null;
}
// Restituisce tutte le date (o intervalli) trovate in un testo: [{s, e, pos}]
function trovaDate(t) {
  const out = [];
  const presi = [];
  const libero = (a, b) => !presi.some(([x, y]) => a < y && b > x);
  const prendi = (m, s, e) => { if (s && e && e >= s && libero(m.index, m.index + m[0].length)) { presi.push([m.index, m.index + m[0].length]); out.push({ s, e, pos: m.index }); } };
  let re, m;
  // dal 30 settembre al 5 ottobre 2026 / 30 set - 5 ott 2026
  re = new RegExp(`(\\d{1,2})\\s+${MESE_RE}(?:\\s+(\\d{4}))?\\s*(?:-|–|—|al|all'|fino al)\\s*(\\d{1,2})\\s+${MESE_RE}(?:\\s+(\\d{4}))?`, 'gi');
  while ((m = re.exec(t))) { const y2 = m[6] && +m[6]; const y1 = m[3] ? +m[3] : y2; const e = data(+m[4], mese(m[5]), y2); prendi(m, data(+m[1], mese(m[2]), y1 || (e && e.getFullYear())), e); }
  // dal 17 al 20 ottobre 2026 / 17-20 ott / 17, 18 e 19 ottobre
  re = new RegExp(`(\\d{1,2})(?:\\s*,\\s*\\d{1,2})*\\s*(?:-|–|—|al|e|\\/)\\s*(\\d{1,2})\\s+${MESE_RE}(?:\\s+(\\d{4}))?`, 'gi');
  while ((m = re.exec(t))) { const mm = mese(m[3]); const y = m[4] && +m[4]; prendi(m, data(+m[1], mm, y), data(+m[2], mm, y)); }
  // 17/10/2026 - 20/10/2026
  re = /(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})\s*(?:-|–|—|al|a)\s*(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/g;
  while ((m = re.exec(t))) prendi(m, data(+m[1], +m[2], +m[3]), data(+m[4], +m[5], +m[6]));
  // 17 ottobre 2026 / domenica 18 ott
  re = new RegExp(`(\\d{1,2})\\s+${MESE_RE}(?:[\\s,]+(\\d{4}))?`, 'gi');
  while ((m = re.exec(t))) { const d = data(+m[1], mese(m[2]), m[3] && +m[3]); prendi(m, d, d); }
  // 17/10/2026
  re = /\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d{2})\b/g;
  while ((m = re.exec(t))) { const d = data(+m[1], +m[2], +m[3]); prendi(m, d, d); }
  return out.sort((a, b) => a.pos - b.pos);
}

/* ---------- luogo ---------- */
function trovaLuogo(t, provDefault, dove) {
  const n = ' ' + norm(t) + ' ';
  let p = null;
  const sig = String(t).match(/\((PD|VE|VI|TV|VR|RO|BL)\)/);
  if (sig) p = sig[1];
  for (const c of COMUNI) if (n.includes(' ' + c.n + ' ') && (!p || c.p === p)) return { c: c.nome, p: c.p, ll: LUOGHI[c.chiave + '|' + c.p] || null };
  const ultimo = String(dove || '').split(/[,|]/).map(x => x.trim()).filter(x => x && x.length < 30 && /^[A-ZÀ-Ú]/.test(x)).pop();
  return { c: ultimo && !trovaDate(ultimo).length ? ultimo : '', p: p || provDefault || '' };
}

/* ---------- HTML ---------- */
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', egrave: 'è', eacute: 'é', agrave: 'à', igrave: 'ì', ograve: 'ò', ugrave: 'ù', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', hellip: '…' };
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (x, c) => c[0] === '#' ? String.fromCodePoint(c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : +c.slice(1)) : (ENT[c.toLowerCase()] ?? x));
const testo = h => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const assoluto = (href, base) => { try { return new URL(decode(href), base).href; } catch { return base; } };

// 1) Dati strutturati schema.org (molti siti di eventi li hanno)
function daJsonLd(html, base) {
  const out = [];
  const vedi = o => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(vedi);
    if (o['@graph']) vedi(o['@graph']);
    if (o.itemListElement) vedi([].concat(o.itemListElement).map(x => x.item || x));
    const tipo = [].concat(o['@type'] || []).join(' ');
    if (/Event|Festival/i.test(tipo) && o.name && o.startDate) {
      const s = new Date(String(o.startDate).slice(0, 10) + 'T00:00:00'), e = new Date(String(o.endDate || o.startDate).slice(0, 10) + 'T00:00:00');
      const loc = [].concat(o.location || [])[0] || {};
      const ad = loc.address || {};
      const dove = [loc.name, typeof ad === 'string' ? ad : [ad.addressLocality, ad.addressRegion].join(' ')].filter(Boolean).join(' ');
      if (!isNaN(s)) out.push({ n: testo(String(o.name)), s, e: isNaN(e) ? s : e, dove, url: o.url ? assoluto(String(o.url), base) : base, d: o.description ? testo(String(o.description)).slice(0, 220) : '' });
    }
  };
  for (const m of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { vedi(JSON.parse(m[1].trim())); } catch { /* json rotto: lo salto */ }
  }
  return out;
}

// 1b) Moduli eventi Deskline/feratel (usati da molti siti turistici del Veneto)
function daDeskline(html, base) {
  const out = [];
  const inizi = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>\s*(?:<!---->)*\s*<div[^>]*class="event_offer-card__upper(?=[\s"])/gi)];
  for (let i = 0; i < inizi.length; i++) {
    const m = inizi[i];
    const card = html.slice(m.index, i + 1 < inizi.length ? inizi[i + 1].index : m.index + 20000);
    const pick = cls => { const x = card.match(new RegExp('class="(?:[^"]*\\s)?' + cls + '(?=[\\s"])[^"]*"[^>]*>([\\s\\S]*?)<\\/div>')); return x ? testo(x[1]) : ''; };
    const n = pick('event_offer-card__title');
    const quando = testo((card.match(/<dw-event-badge[\s\S]*?<\/dw-event-badge>/i) || [''])[0]);
    const date = trovaDate(quando.replace(/,/g, ' '));
    if (!n || !date.length) continue;
    const dove = pick('event_offer-card__location').replace(/Mostra sulla mappa/i, '').trim();
    let href = m[1];
    if (/^#\//.test(href) || !href) href = base.split('#')[0] + href;
    out.push({ n, s: date[0].s, e: date[0].e, dove, url: assoluto(href, base), d: pick('event_offer-card__description-block'), strutturato: 1 });
  }
  return out;
}

// 2) Ricerca nel testo: blocchi con una data, titolo preso dal blocco o dal titolo sopra
function daTesto(html, base) {
  const pulito = html.replace(/<(script|style|noscript|svg|nav|footer|form|iframe)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const pezzi = pulito.split(/(?=<(?:h[1-6]|article|li|p|tr|div|section|dt|dd)\b)/i);
  const out = [];
  let titolo = '', titoloLink = '', distanza = 9;
  let attesa = null; // data trovata da sola: il titolo arriva nel blocco subito dopo (schede "data sopra, titolo sotto")
  for (const h of pezzi) {
    const t = testo(h);
    if (!t) continue;
    const isTitolo = /^<h[1-6]/i.test(h) || (t.length < 110 && /^<(?:div|li|p)[^>]*class="[^"]*(title|titolo|nome|heading)/i.test(h));
    const link = (h.match(/<a\b[^>]*href="([^"#][^"]*)"/i) || [])[1];
    const date = trovaDate(t);
    const soloData = date.length && t.replace(/\b(lun|mar|mer|gio|ven|sab|dom)[a-zì]*\b/gi, '').replace(/[\d\s\/.,:–-]+/g, ' ').trim().split(' ').length <= 3 && t.length < 40;
    if (attesa && !date.length) {
      const pulito = t.replace(/^\d{1,2}[.\/]\d{1,2}\s+/, '');
      if ((isTitolo || (link && t.length < 140)) && pulito.length >= 5) {
        out.push({ n: pulito.slice(0, 120), s: attesa.s, e: attesa.e, dove: t, url: link ? assoluto(link, base) : base, d: '' });
        attesa = null; continue;
      }
      if (++attesa.giri > 3) attesa = null;
    }
    if (isTitolo && !date.length) { titolo = t.slice(0, 140); titoloLink = link ? assoluto(link, base) : ''; distanza = 0; continue; }
    distanza++;
    if (soloData) { attesa = { s: date[0].s, e: date[0].e, giri: 0 }; continue; }
    if (!date.length || t.length > 900) continue;
    const d = date[0];
    // titolo: un link o grassetto nel blocco, altrimenti il titolo sopra, altrimenti l'inizio del testo
    const forte = (h.match(/<(?:a|strong|b|h[1-6])\b[^>]*>([\s\S]*?)<\/(?:a|strong|b|h[1-6])>/i) || [])[1];
    let n = forte && testo(forte);
    if (n && (trovaDate(n).length || n.length < 5)) n = '';
    if (!n && isTitolo) n = t.replace(/\d{1,2}[^a-z]*$/i, '');
    if (!n && distanza <= 3) n = titolo;
    if (!n) n = t.slice(0, d.pos).replace(/[\s\-–:,|·]+$/, '');
    if (!n || n.length < 5) continue;
    n = n.replace(/\s+/g, ' ').slice(0, 120);
    out.push({ n, s: d.s, e: d.e, dove: t, url: link ? assoluto(link, base) : (distanza <= 3 && titoloLink) || base, d: t.length > n.length + 5 ? t.slice(0, 220) : '' });
  }
  return out;
}

// tutti i link della pagina con il loro testo, per collegare ogni evento alla sua pagina
function linkPagina(html, base) {
  const out = [];
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const t = norm(testo(m[2]) || (m[0].match(/title="([^"]+)"/) || [])[1] || '');
    if (t.length > 8) out.push({ t, href: assoluto(m[1], base) });
  }
  return out;
}
function linkPer(n, links, base) {
  const a = norm(n);
  const x = links.find(l => l.t === a) || links.find(l => (l.t.includes(a) || a.includes(l.t)) && Math.min(a.length, l.t.length) > 12);
  return x && x.href !== base ? x.href : null;
}
function giaNoto(n, c) {
  const a = norm(n);
  return NOMI_NOTI.some(x => (x.n.length > 6 && (a.includes(x.n) || x.n.includes(a))) && (!c || !x.c || x.c.includes(norm(c).split(' ')[0])));
}
const PAROLE_EVENTO = /sagra|festa|fiera|mercat|palio|festival|rievoca|carneval|mostra|raduno|motor|auto|moto|trofeo|rally|concert|notte|degusta|vino|enogastr|evento|manifestaz|tradizion|antica|antico|patrono|san |santa |madonna|torneo|corsa|camminata|marcia/i;

function analizza(html, base, provDefault, night) {
  const strutt = daJsonLd(html, base);
  const desk = /event_offer-card/.test(html) ? daDeskline(html, base) : [];
  const grezzi = strutt.length ? strutt.map(x => Object.assign(x, { strutturato: 1 })) : desk.length ? desk : daTesto(html, base);
  const fine = new Date(OGGI.getTime() + (night ? 60 : MAX_GIORNI) * 864e5);
  const visti = new Set(), out = [], links = linkPagina(html, base);
  for (const x of grezzi) {
    if (x.e < OGGI || x.s > fine) continue;
    if ((x.e - x.s) / 864e5 > 60) continue;              // periodi troppo lunghi: probabilmente non sono un evento
    if (!night && !x.strutturato && !PAROLE_EVENTO.test(x.n + ' ' + x.d)) continue;
    const luogo = trovaLuogo(x.dove + ' ' + x.n, provDefault, x.strutturato ? x.dove : '');
    if (luogo.p && !SIGLE.includes(luogo.p)) continue;
    const id = 'w-' + norm(x.n).replace(/ /g, '-').slice(0, 50) + '-' + iso(x.s);
    if (visti.has(id)) continue; visti.add(id);
    if (!night && giaNoto(x.n, luogo.c)) continue;
    out.push({ id, n: x.n, c: luogo.c, p: luogo.p, ll: luogo.ll || undefined, s: iso(x.s), e: iso(x.e), url: x.url, d: x.d && x.d !== x.n ? x.d : '', fonte: base, t: night ? 'N' : undefined });
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.url === base) ultimo.url = linkPer(x.n, links, base) || base;
    if (out.length >= MAX_PER_SITO) break;
  }
  return out;
}

/* ---------- download ---------- */
async function scarica(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36 LunarioSagre/1.0', 'Accept-Language': 'it-IT,it;q=0.9' } });
    if (!r.ok) throw new Error('il sito ha risposto ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    let cs = ((r.headers.get('content-type') || '').match(/charset=([\w-]+)/i) || [])[1];
    if (!cs) cs = (buf.toString('latin1', 0, 3000).match(/charset=["']?([\w-]+)/i) || [])[1];
    try { return new TextDecoder(cs || 'utf-8').decode(buf); } catch { return new TextDecoder('utf-8').decode(buf); }
  } finally { clearTimeout(t); }
}

function leggiFonti() {
  const f = join(ROOT, 'fonti.txt');
  if (!existsSync(f)) return [];
  return readFileSync(f, 'utf8').split(/\r?\n/).map(r => r.trim()).filter(r => r && !r.startsWith('#'))
    .map(r => { const [u, p, t, nome] = r.split('|').map(x => x.trim()); return { url: /^https?:/i.test(u) ? u : 'https://' + u, p: (p || '').toUpperCase(), night: /night|notte|locali/i.test(t || ''), nome: nome || '' }; })
    .filter(x => /^https?:\/\/[^/\s]+\.[a-z]{2,}/i.test(x.url));
}

// Pagine che caricano gli eventi con JavaScript (o che bloccano i download semplici): le apro con un vero browser
let BROWSER = null;
async function apriConBrowser(url) {
  if (BROWSER === false) return null;
  try {
    if (!BROWSER) { const { chromium } = await import('playwright'); BROWSER = await chromium.launch(); }
    const pg = await BROWSER.newPage({ locale: 'it-IT', userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Mobile Safari/537.36' });
    try {
      await pg.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await pg.waitForTimeout(3000);
      for (let i = 0; i < 8; i++) {
        await pg.mouse.wheel(0, 4000); await pg.waitForTimeout(1000);
        // pulsanti "carica altri" / "mostra altri" (anche dentro i componenti shadow DOM)
        const cliccato = await pg.evaluate(() => {
          const re = /^(carica|mostra|vedi|visualizza)\s+(altr|di più|ancora|tutti)|^altri eventi|^load more|^show more/i;
          const giro = root => { for (const el of root.querySelectorAll('button,a,[role=button]')) { const t = (el.innerText || el.textContent || '').trim(); if (t.length < 40 && re.test(t)) { el.click(); return true; } }
            for (const el of root.querySelectorAll('*')) if (el.shadowRoot && giro(el.shadowRoot)) return true; return false; };
          return giro(document);
        }).catch(() => false);
        if (cliccato) await pg.waitForTimeout(2500);
      }
      const foto = async () => {
        // a volte gli eventi sono dentro un riquadro (iframe) o in componenti "shadow DOM" (moduli Deskline/feratel): prendo anche quelli
        let h = await pg.content();
        for (const f of pg.frames().slice(1)) { try { h += await f.content(); } catch {} }
        h += await pg.evaluate(() => {
          const out = [];
          const giro = root => root.querySelectorAll('*').forEach(el => { if (el.shadowRoot) { out.push('<div>' + el.shadowRoot.innerHTML + '</div>'); giro(el.shadowRoot); } });
          giro(document);
          return out.join('\n');
        }).catch(() => '');
        return h;
      };
      let html = await foto();
      // elenchi divisi in pagine (1, 2, 3…): le sfoglio fino a 8
      for (let k = 2; k <= 8; k++) {
        const ok = await pg.evaluate(k => {
          const re = new RegExp('^(go to page|vai alla pagina|pagina|page)\\s*' + k + '$', 'i');
          const giro = root => { for (const el of root.querySelectorAll('a,button,[role=button]')) { const l = (el.getAttribute('aria-label') || '').trim(), t = (el.textContent || '').trim();
              if (re.test(l) || (t === String(k) && el.closest('[class*=pagin]'))) { el.click(); return true; } }
            for (const el of root.querySelectorAll('*')) if (el.shadowRoot && giro(el.shadowRoot)) return true; return false; };
          return giro(document);
        }, k).catch(() => false);
        if (!ok) break;
        await pg.waitForTimeout(3500);
        html += await foto();
      }
      return html;
    } finally { await pg.close(); }
  } catch (e) { if (!BROWSER) BROWSER = false; console.log('  (browser non disponibile: ' + (e.message || e).split('\n')[0] + ')'); return null; }
}

async function main() {
  const arg = process.argv.slice(2);
  if (arg[0] === '--file') {
    const res = analizza(readFileSync(arg[1], 'utf8'), 'https://esempio.it/', (arg[2] || '').toUpperCase(), arg[3] === 'night');
    console.log(JSON.stringify(res, null, 1));
    return;
  }
  const fonti = leggiFonti();
  let prima = { eventi: [] };
  try { prima = new Function(readFileSync(join(ROOT, 'proposte.js'), 'utf8') + ';return PROPOSTE;')() || prima; } catch {}
  const oggiIso = iso(OGGI);
  const stato = [], eventi = [];
  for (const f of fonti) {
    try {
      let ev = [], html = null, errore = null;
      try { html = await scarica(f.url); ev = analizza(html, f.url, f.p, f.night); } catch (e) { errore = e; }
      if (!ev.length) {
        const h2 = await apriConBrowser(f.url);
        if (h2) {
          const ev2 = analizza(h2, f.url, f.p, f.night);
          if (ev2.length) { ev = ev2; errore = null; }
          if (process.env.DEBUG_DIR && ev2.length < 3) { mkdirSync(process.env.DEBUG_DIR, { recursive: true }); writeFileSync(join(process.env.DEBUG_DIR, f.url.replace(/[^a-z0-9]+/gi, '_').slice(0, 80) + '.html'), h2); }
        }
      }
      if (errore && !ev.length) throw errore;
      if (f.nome) ev.forEach(e => { if (!e.c) e.c = f.nome; });
      stato.push({ url: f.url, ok: 1, n: ev.length, night: f.night ? 1 : undefined });
      for (const e of ev) if (!eventi.some(x => x.id === e.id)) eventi.push(e);
      console.log(`✓ ${f.url}: ${ev.length} eventi`);
    } catch (e) {
      const vecchi = (prima.eventi || []).filter(x => x.fonte === f.url && x.e >= oggiIso);
      for (const x of vecchi) if (!eventi.some(y => y.id === x.id)) eventi.push(x);
      stato.push({ url: f.url, ok: 0, n: vecchi.length, errore: String(e.name === 'AbortError' ? 'il sito non risponde' : e.message || e) });
      console.log(`✗ ${f.url}: ${e.message || e}`);
    }
  }
  eventi.sort((a, b) => a.s.localeCompare(b.s) || a.n.localeCompare(b.n, 'it'));
  const out = { aggiornato: new Date().toISOString(), fonti: stato, eventi };
  writeFileSync(join(ROOT, 'proposte.js'),
    '/* Generato da scripts/scansiona.mjs: eventi trovati sui siti di fonti.txt. Non modificare a mano. */\nconst PROPOSTE = {"aggiornato":' + JSON.stringify(out.aggiornato) +
    ',\n"fonti":[' + stato.map(x => '\n' + JSON.stringify(x)).join(',') + '],\n"eventi":[' + eventi.map(x => '\n' + JSON.stringify(x)).join(',') + ']};\n');
  console.log(`Totale: ${eventi.length} eventi da ${fonti.length} siti`);
}
main().then(() => BROWSER && BROWSER.close()).catch(e => { console.error(e); process.exit(1); });
