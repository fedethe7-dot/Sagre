# Citylife

Sagre, feste, fiere ed eventi del Veneto con le date previste. App: https://fedethe7-dot.github.io/Sagre/

- `eventi.js` – elenco degli eventi ricorrenti
- `luoghi.js` – coordinate dei paesi per il Radar
- `fonti.txt` – siti da controllare ogni settimana (un link per riga)
- `proposte.js` – eventi trovati sui siti (lo scrive lo scanner, non a mano)
- `scripts/scansiona.mjs` + `.github/workflows/scansiona.yml` – scanner automatico, ogni lunedì

## Citylife
- Sezioni nell'Agenda: **Sagre**, **Cult** (teatro, gospel, classica), **Concerti**, **Night**. Il "Chiedi" cerca anche in Cult e Concerti e riconosce i nomi dei tuoi artisti.
- Concerti: i tuoi artisti in cima con la ★, si aggiungono e tolgono dall'app; tasto "Solo i miei".
- In `fonti.txt` i siti si segnano con `| night`, `| cult` o `| concerti`.
- Lo scanner del lunedì aggiorna il ramo che il sito pubblica (Settings > Pages).
- `carica.js` carica i dati: nell'app Android li prende aggiornati da internet.
