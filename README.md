# Špajzka

Rodinný plánovač jídel, receptů a chytrých nákupů potravin.

## Spuštění aplikace

Vyžaduje Node.js 24 nebo novější. Závislosti nejsou potřeba — server používá vestavěné moduly Node.js a SQLite:

```bash
npm start
```

Poté otevřete `http://localhost:4173`.

Při prvním spuštění zvolte **Vytvořit účet**. První uživatel založí domácnost a v části Rodina najde zvací kód. Další člen použije stejnou registrační obrazovku, ale místo nové domácnosti vyplní tento kód.

Databáze vznikne jako `data/spajzka.sqlite`. Adresář `data/` není verzovaný a před smazáním projektu je vhodné jej zálohovat.

## Co prototyp umí

- týdenní plán jídel,
- přiřazování různých receptů jednotlivým dnům,
- detail receptu se surovinami a rodinným postupem,
- vytváření, úpravu a mazání vlastních receptů,
- přepočítání surovin podle plánovaného počtu porcí,
- recepty filtrované podle vybraných členů domácnosti,
- profily členů a ukládání stravovacích preferencí,
- kontrolní krok před trvalým uložením preference,
- vysvětlení konfliktů mezi receptem a preferencemi,
- automaticky sloučený nákup na celý týden včetně zdrojových receptů,
- označení surovin, které už jsou doma,
- lokální záložní kopii stavu v `localStorage`,
- bezpečné uživatelské účty a přihlášení,
- společnou domácnost se zvacím kódem,
- synchronizaci receptů, plánu a preferencí mezi zařízeními,
- lokální SQLite databázi v adresáři `data/`.

Napojení na oficiální Rohlík MCP a produkční PostgreSQL jsou plánované pro další etapu.
