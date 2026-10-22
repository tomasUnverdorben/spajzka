# Špajzka

Rodinný plánovač jídel, receptů a chytrých nákupů potravin.

## Spuštění prototypu

Projekt je v první etapě bez sestavovacího kroku. Spusťte lokální HTTP server:

```bash
python3 -m http.server 4173
```

Poté otevřete `http://localhost:4173`.

## Co prototyp umí

- týdenní plán jídel,
- přiřazování různých receptů jednotlivým dnům,
- detail receptu se surovinami a rodinným postupem,
- recepty filtrované podle vybraných členů domácnosti,
- profily členů a ukládání stravovacích preferencí,
- kontrolní krok před trvalým uložením preference,
- vysvětlení konfliktů mezi receptem a preferencemi,
- nákupní seznam sestavený z chybějících surovin receptů,
- uložení stavu do `localStorage`.

Napojení na oficiální Rohlík MCP a trvalá databáze jsou plánované pro další etapu.
