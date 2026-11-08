/* Citylife – carica i dati degli eventi e poi l'app.
   Nel sito: i file accanto alla pagina (sono già quelli aggiornati).
   Nell'app Android: prima la versione aggiornata da internet (lo scanner la rinnova ogni lunedì),
   se non c'è connessione la copia contenuta nell'app. */
(function () {
  'use strict';
  var C = window.Capacitor;
  var NATIVA = !!(C && C.isNativePlatform && C.isNativePlatform());
  var REMOTO = 'https://fedethe7-dot.github.io/Sagre/';
  var DATI = ['eventi.js', 'luoghi.js', 'proposte.js'];
  window.CITYLIFE = { nativa: NATIVA, origine: {} };

  function locale(f) {
    return new Promise(function (ok) { var s = document.createElement('script'); s.src = f; s.onload = s.onerror = ok; document.body.appendChild(s); });
  }
  function remoto(f) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    return fetch(REMOTO + f + '?t=' + Date.now(), { cache: 'no-store', signal: ctl && ctl.signal })
      .then(function (r) { clearTimeout(t); if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (txt) { var s = document.createElement('script'); s.textContent = txt; document.body.appendChild(s); window.CITYLIFE.origine[f] = 'internet'; });
  }
  function uno(f) {
    if (!NATIVA) return locale(f);
    return remoto(f).catch(function () { window.CITYLIFE.origine[f] = 'copia'; return locale(f); });
  }
  DATI.reduce(function (p, f) { return p.then(function () { return uno(f); }); }, Promise.resolve())
    .then(function () { return locale('app.js'); });
})();
