# Špajzka

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: mobilně přívětivý klient zůstává bez sestavovacího kroku v HTML, CSS a JavaScriptu. Lokální server běží v nativním TypeScriptu na Node.js a pro současnou vývojovou etapu ukládá účty, domácnosti, relace a sdílený stav do SQLite. Databázová vrstva je záměrně oddělená pro pozdější přechod na PostgreSQL; integrace s oficiálním Rohlík MCP přijde po stabilizaci základu.

## Users

Členové jedné domácnosti, kteří společně plánují jídla, vaří podle sdílených rodinných receptů a nakupují suroviny online. Aplikace musí být stejně srozumitelná zkušenému autorovi receptu i člověku, který dané jídlo vaří poprvé.

## Product Purpose

Špajzka spojuje rodinné recepty, plánování jídel, individuální stravovací potřeby a přípravu nákupu. Úspěch znamená, že rodina zvolí jídla, dostane bezpečný a relevantní seznam surovin a s minimem ručního hledání připraví košík na Rohlíku.

## Positioning

Nejde o obecnou databázi receptů. Špajzka zná konkrétní domácnost: její vlastní postupy, členy, alergie, zákazy, obliby, preferované náhrady i oblíbené výrobky.

## Operating Context

Aplikace se používá hlavně na telefonu při společném plánování týdne, před nákupem a během vaření. Uživatel vybírá, kdo bude dané jídlo jíst; doporučení i kontrola surovin se přizpůsobí právě těmto lidem.

## Capabilities and Constraints

- Správa rodinných receptů včetně surovin, množství, porcí a postupu.
- Profily členů domácnosti.
- Rozlišení alergie, tvrdého zákazu, neobliby, obliby a preferované náhrady.
- Filtrování receptů podle osob, které budou jídlo jíst.
- Učení preferencí z běžně formulované věty až po výslovném potvrzení uživatelem.
- Vysvětlení, proč byl recept doporučen nebo vyřazen.
- Sloučení surovin z více receptů a odečtení domácích zásob.
- Pozdější napojení na oficiální Rohlík MCP pro vyhledání produktů a vložení do košíku.
- Finální kontrola a odeslání objednávky zůstává na uživateli v rozhraní Rohlíku.

## Brand Commitments

Název produktu je „Špajzka“, technický název repozitáře `spajzka`. Jazyk rozhraní je čeština. Komunikace má být domácí, věcná a laskavá, nikoli infantilní.

## Evidence on Hand

Zatím nejsou dodané fotografie, logo ani skutečná sada rodinných receptů. Ukázková data musí být označena jako demonstrační a nesmí předstírat skutečné preference rodiny.

## Product Principles

- Bezpečnostní omezení mají přednost před doporučováním.
- Uživatel vždy vidí, co si aplikace pamatuje, a může to změnit.
- AI navrhuje; trvalé změny preferencí potvrzuje člověk.
- Každé vyřazení nebo nahrazení musí být srozumitelně vysvětlitelné.
- Nejkratší cesta vede od výběru jídla ke zkontrolovanému nákupnímu seznamu.

## Accessibility & Inclusion

Rozhraní musí být ovladatelné klávesnicí, mít čitelné kontrasty a nesmí sdělovat alergie či stav pouze barvou.
