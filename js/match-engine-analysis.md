# Grassroots to Glory — Analiza silnika meczowego

Pełny opis czynników wpływających na wynik `simMatch()` — dokument referencyjny.

Stan na: kod po wersji v221. Dokument czysto opisowy — bez propozycji zmian.

Dokument opisuje wyłącznie AKTUALNY stan kodu (`js/engine/match-engine.js`, `js/engine/match-post.js`, `js/ui/dev-mode.js`, `js/ui/news-bootstrap.js`, `js/systems/traits-history.js`, `js/engine/week-progress.js`). Nie zawiera żadnych rekomendacji ani planowanych zmian.

---

## 1. Źródła danych o zawodnikach i drużynie

Wszystkie ścieżki (`simMatch`, `devSimMyMatch`, `simOthers`) budują siłę drużyny funkcją `tS()` (match-engine.js, linie 4-22), która woła `playerStr()` (news-bootstrap.js:277-292) dla każdego zawodnika w składzie wyjściowym (`.starter`).

### 1.1 playerStr(p) — baza siły pojedynczego zawodnika

Plik: `js/ui/news-bootstrap.js`, linie 277-292. Wagi pozycyjne:

| Pozycja | Wzór |
|---|---|
| NAP (napastnik) | `sht*0.40 + tec*0.25 + phy*0.20 + men*0.15` |
| POL (pomocnik) | `pas*0.35 + tec*0.25 + men*0.20 + phy*0.20` |
| OBR (obrońca) | `def*0.40 + phy*0.30 + men*0.20 + pas*0.10` |
| GK (bramkarz) | `def*0.45 + men*0.35 + phy*0.15 + pas*0.05` |

Bonusy cech wliczone PRZED powyższym wzorem (tymczasowa modyfikacja atrybutu, tylko na czas obliczenia):
- sprinter: phy +5
- artysta: tec +5
- snajper (tylko NAP/POL): sht +5
- mur (tylko OBR/GK): def +5

**Symetria:** PEŁNA — funkcja nie odwołuje się do `G.myClubId`, więc identyczne wagi i bonusy cech stosują się do zawodników gracza i AI. **Obecność:** WSZYSTKIE 3 ścieżki (`tS()` jest współdzielone przez `_buildMatchPhases`, `_buildMatchLite` i `devSimMyMatch`, który dziedziczy z `_buildMatchPhases`).

### 1.2 tS(cid) — agregacja drużynowa

Plik: `js/engine/match-engine.js`, linie 4-22.

| Element | Wzór | Uwagi |
|---|---|---|
| atk | `round((śr.playerStr(NAP)*0.7 + śr.playerStr(POL)*0.3) * menBonus)` | |
| mid | `round((śr.playerStr(POL)*0.6 + śr.playerStr(NAP)*0.2 + śr.playerStr(OBR)*0.2) * menBonus)` | |
| def | `round((śr.playerStr(OBR)*0.7 + śr.playerStr(GK)*0.3) * menBonus)` | |
| form (fm) | `0.85 + (śr. form zawodników)/666` | mnożnik siły, zakres ~0.85-1.0 |
| menBonus | `1 + (śr. men - 50)/500` | bonus mentalności drużyny |

**Symetria:** pełna. **Obecność:** wszystkie 3 ścieżki.

### 1.3 Indywidualne atrybuty używane bezpośrednio w bldEvs() (tylko pełny silnik)

| Atrybut | Gdzie użyty | Wpływ |
|---|---|---|
| sht (strzelca) | match-engine.js:294 (shtAttr) | baza accuracyChance (celność strzału) |
| pas (rozgrywającego) | match-engine.js:344 (asysty), :374 (rzuty rożne — kto podaje) | dobór asystenta / wykonawcy rożnego |
| def (bramkarza) | match-engine.js:296 (gkDef) | baza saveChance (obrona) |
| def (obrońcy) | match-engine.js:273 (wybór clearance) | kto dostaje statystykę wybicia po nieudanej akcji |
| phy (do główek) | match-engine.js:375 (headerP przy rożnych) | kto głowuje z rożnego |

Te atrybuty NIE są używane w `_buildMatchLite` (agregacja drużynowa, brak wyboru pojedynczego zawodnika) — więc w meczach AI-AI (`simOthers`) nie mają żadnego indywidualnego odzwierciedlenia, tylko zbiorczy atk/mid/def z `tS()`.

### 1.4 Forma (p.form)

Wliczona do `tS()` (patrz 1.2). Aktualizowana co tydzień w `week-progress.js` (m.in. cechy szybki_start/słaby_start, patrz sekcja 5) oraz po każdym meczu (wygrana/przegrana +1/-1, patrz match-engine.js ~856-859, match-post.js analogicznie dla AI).

### 1.5 Zmęczenie (PHY) — dwa niezależne mechanizmy

| Mechanizm | Plik / linia | Wzór | Wpływ | Symetria |
|---|---|---|---|---|
| staminaFactor (wolumen akcji fazy 3) | match-engine.js:194-201, 225-226 | `0.90 + avgPhy/500` | mnoży h3/a3 (liczbę akcji 61-90') | Symetryczny (naprawione — obie strony liczą własny avgPhy) |
| _fatigueSavePenalty (obrona GK) | match-engine.js:203-207, 320-321 | `max(0,(100-phyAvg)/100) * (min-65)/25 * 0.10`, tylko od 65' | odejmowane od saveChance | Symetryczny |

**Obecność:** tylko `_buildMatchPhases` (simMatch + devSimMyMatch). `_buildMatchLite` nie ma pojęcia zmęczenia w ogóle.

### 1.6 Cechy zawodników (TRAITS) wpływające na wynik meczu

| Cecha | Mechanizm | Plik | Symetria gracz-AI | W simOthers? | W dev mode? |
|---|---|---|---|---|---|
| sprinter/artysta/snajper/mur | bonus do atrybutu w playerStr() | news-bootstrap.js:277-292 | Symetryczny | Tak | Tak |
| goalStreak (celność +5%/+12%) | _streakB w bldEvs() | match-engine.js:304 | formuła symetryczna, ale licznik tylko dla myPl() (linie 763-770) | Nie (brak licznika) | Nie (licznik nigdy nie rośnie) |
| szybki_start / słaby_start | ±2 formy w tyg. 1-5 | week-progress.js:342-350 | Asymetryczny — tylko myPl().filter(starter) | Nie | Częściowo — zależy od cyklu tygodniowego |
| wytrzymały (mniejsza szansa na kontuzję) | injMult=0.7 przy losowaniu kontuzji w trakcie meczu | match-engine.js:723 | formuła obejmuje obie drużyny, ale system istnieje tylko w live | Nie (brak systemu kontuzji w AI-AI) | Nie (brak w devSimMyMatch) |
| lider (+2 formy drużyny po wygranej) | post-match bonus formy | match-engine.js:843-845 (gracz), match-post.js (AI, dodane) | Symetryczny (od tej sesji) | Tak | Tak (dziedziczy z simOthers) |
| zimna_krew / nerwowy (modyfikator formy po porażce) | post-match | match-engine.js:850-853 (gracz), match-post.js (AI, dodane) | Symetryczny (od tej sesji) | Tak | Tak |
| pewny_siebie (bonus przy serii ≥3 zwycięstw) | post-match, warunek G.winStreak>=3 | match-engine.js:846-848 | Asymetryczny — G.winStreak istnieje tylko dla klubu gracza | Nie | Nie |
| profesjonalista (opis: forma stabilniejsza) | BRAK IMPLEMENTACJI | traits-history.js:61 (tylko w martwym getTraitEffect) | n/d — nie działa dla nikogo | Nie | Nie |

Cechy pominięte powyżej (dotyczą treningu/transferów/kontraktów, nie samego wyniku meczu): pojęty (trainBonus), lojalny (noLeave), twardy (injFormKeep), żądny kasy (salaryMult).

### 1.7 Więź z klubem (_seasonsAtClub)

Dwa OSOBNE mechanizmy o podobnej idei:
- **getBondLevel()/getBondFormBonus()** — `js/ui/news-bootstrap.js:258-274`. Filtr "tylko G.myClubId" jest CELOWY — używane w UI karty zawodnika (tactics-playercard.js:587, komentarz "tylko własni") i w logice ofert transferowych (transfers.js:911,978,995). NIE jest wołane w meczu.
- **_matchBondFormBonus()** — `js/engine/match-engine.js:212-220`. Lokalna funkcja TYLKO na potrzeby meczu, bez filtra klubu, oparta o te same progi _seasonsAtClub. Wywoływana w bldEvs() (linia 301) jako mnożnik celności (_bondShtMod, max +6%).

**Symetria:** PEŁNA (od poprawki tej sesji) — _seasonsAtClub jest liczone dla wszystkich klubów (match-post.js, aiTransferSeason). **Obecność:** tylko `_buildMatchPhases`. Brak w `_buildMatchLite`.

### 1.8 Wiek — NIE wpływa bezpośrednio na wynik meczu

`p.age` jest używany w match-engine.js wyłącznie w jednym miejscu: linia 788, szansa na rozwój umiejętności PO meczu (trening), zależna od wieku (≤20: 20%, ≤26: 8%, ≤29: 3%, powyżej: 0%). Wiek NIE wchodzi do `ovr()`, `playerStr()` ani żadnej formuły strzału/celności/obrony. Wpływa na mecz WYŁĄCZNIE pośrednio — przez to, jak z czasem zmieniają się atrybuty zawodnika w treningu.

### 1.9 Kontuzje i zawieszenia

`p.injured` / `p.suspension` NIE degradują wydajności w trakcie meczu — działają jako TWARDA BLOKADA przed meczem: `simMatch()` (match-engine.js:617) usuwa kontuzjowanych/zawieszonych z `.starter` przed rozpoczęciem, więc wpływają na wynik wyłącznie przez to, kto w ogóle może zagrać (pośrednio przez `tS()`/`playerStr()` słabszego składu zastępczego).

Nowe kontuzje W TRAKCIE meczu (match-engine.js:718-727, funkcja `applyInjury`) istnieją TYLKO w `simMatch()` (next() completion handler) — nie usuwają jednak zawodnika z bieżącego meczu (mecz już rozstrzygnięty), wpływają tylko na NASTĘPNY mecz.

---

## 2. Ustawienia taktyczne

Wspólna funkcja `_clubTactic(clubId)` (match-engine.js:25-37) czyta `G.style`/`G.pressing`/`G.line`/`G.instruction`/`G.formation`/`G.tempo` dla klubu gracza, a `G.clubTactics[clubId]` (z neutralnym fallbackiem) dla AI. Uwaga poboczna: linia 29 zawiera efekt uboczny — wywołanie `_clubTactic()` dla klubu gracza NADPISUJE `G.instruction` z "Bezpośrednia" na "Długie piłki" za każdym razem gdy jest ono ustawione na "Bezpośrednia" (stary kod migracyjny), co oznacza że gracz nie może faktycznie utrzymać wyboru "Bezpośrednia".

### 2.1 Formacja (G.formation) — formMod

| Formacja | atk | mid | def |
|---|---|---|---|
| 4-4-2 (neutralna) | 1.00 | 1.00 | 1.00 |
| 4-3-3 | 1.15 | 0.95 | 0.90 |
| 3-5-2 | 1.00 | 1.15 | 0.90 |
| 5-3-2 | 0.90 | 0.95 | 1.15 |
| 3-4-3 | 1.20 | 1.00 | 0.80 |
| 4-5-1 | 0.85 | 1.20 | 1.00 |

Plik: match-engine.js:39-46. Zastosowanie: `_applyTacticsToStrength()` (linie 72-79), mnożnik do atk/mid/def drużyny. **Symetria:** pełna. **Obecność:** wszystkie 3 ścieżki.

### 2.2 Styl (G.style) — styleMod

| Styl | actions | shotChance | foul |
|---|---|---|---|
| Defensywny | 0.85 | 0.85 | 0.70 |
| Zrównoważony (neutralny) | 1.00 | 1.00 | 1.00 |
| Ofensywny | 1.15 | 1.15 | 1.30 |

Plik: match-engine.js:47-51. `actions` → mnożnik liczby akcji (baseTot, linia 169). `shotChance` → mnożnik baseShot (scMod, linia 250/268). `foul` → mnożnik szansy na żółtą kartkę (bldCards, linia 452). **Symetria:** pełna. **Obecność:** actions/shotChance tylko pełny silnik, foul tylko pełny silnik (bldCards nie istnieje w lite).

### 2.3 Tempo (G.tempo) — tempoMod

Wolne: 0.80, Normalne: 1.00, Szybkie: 1.20. Plik: match-engine.js:52. Wpływa na baseTot (łączną liczbę akcji meczu, linia 169) — średnia obu drużyn. **Symetria:** pełna. **Obecność:** wszystkie 3 ścieżki.

### 2.4 Pressing (G.pressing) — pressMod

| Pressing | oppAct (redukcja akcji rywala) | myFouls (mnożnik fauli) | myDef (bonus obrony) |
|---|---|---|---|
| Niski | -0.10 (rywal +10% akcji) | -0.15 | +0.08 |
| Normalny (neutralny) | 0 | 0 | 0 |
| Wysoki | +0.15 (rywal -15% akcji) | +0.35 | -0.05 |

Plik: match-engine.js:53-57. **Symetria:** pełna. **Obecność:** oppAct/myDef tylko pełny silnik, myFouls tylko pełny silnik (bldCards).

### 2.5 Linia obrony (G.line) — lineMod

| Linia | def | atk | offsideRisk |
|---|---|---|---|
| Niska | +0.12 | -0.08 | 0 |
| Normalna (neutralna) | 0 | 0 | 0 |
| Wysoka | -0.10 | +0.10 | 0.15 (szansa na zdarzenie spalonego) |

Plik: match-engine.js:58-62. def/atk wliczone w `_applyTacticsToStrength` (siła bazowa). offsideRisk generuje tylko zdarzenie narracyjne (match-engine.js:602-609) — BEZ wpływu na wynik (spalony nie anuluje gola, to czysto kosmetyczny komunikat).

### 2.6 Instrukcja (G.instruction) — instrMod

| Instrukcja | mid | atk | counterBonus |
|---|---|---|---|
| Posiadanie | +0.15 | -0.05 | 0.8 |
| Długie piłki | -0.05 | +0.10 | 1.1 |
| Bezpośrednia (neutralna, patrz uwaga wyżej) | 0 | 0 | 1.0 |
| Kontry | -0.10 | -0.10 | 1.6 |

Plik: match-engine.js:63-68. counterBonus → wchodzi do counterMod w bldEvs (linia 282): drużyna grająca stylem Defensywny DODATKOWO mnoży counterBonus przez 1.25. counterMod mnoży accuracyChance (celność) — **to najsilniejszy pojedynczy mnożnik w całym silniku** (do ×2.0 dla kombinacji Defensywny+Kontry). **Symetria:** pełna. **Obecność:** mid/atk we wszystkich 3 ścieżkach, counterBonus tylko pełny silnik.

### 2.7 Nastawienie meczowe (mood: atak/blok/balans)

Gracz wybiera ręcznie (UI, przechowywane w `G._matchMood`), AI dobiera automatycznie funkcją `_pickAIMood()` (match-engine.js:145-154) na podstawie różnicy siły względem przeciwnika (underdog częściej "atak", faworyt częściej "blok", plus losowość).

| Mood | atk | mid | def | własne akcje (own) | akcje rywala (opp) |
|---|---|---|---|---|---|
| atak | ×1.08 | ×1.04 | ×0.95 | ×1.08 | ×1.05 |
| balans (neutralny) | — | — | — | ×1.00 | ×1.00 |
| blok | ×0.95 | ×1.03 | ×1.08 | ×0.93 | ×0.96 |

Plik: match-engine.js:126-157. **Symetria:** pełna (obie strony przechodzą przez tę samą logikę, tylko źródło decyzji inne — gracz ręcznie, AI algorytmicznie). **Obecność:** tylko `_buildMatchPhases`. W devSimMyMatch — gracz nie ma UI, więc `G._matchMood` pozostaje tym, co było ustawione ostatnio (domyślnie "balans" przy pierwszym uruchomieniu panelu meczu).

### 2.8 Zmiana taktyczna w 46. minucie (TACTICAL_SHIFT_DEFS)

| Wybór | shotMod | saveMod |
|---|---|---|
| Atak totalny | 1.20 | 0.85 |
| Kontratak | 1.25 | 1.05 |
| Graj na czas | 0.85 | 1.12 |
| Pressing | 0.92 | 1.00 |

Plik: match-engine.js:230, 557-563 (AI), dev-mode.js:58-70 (_applyTactic, wybór gracza).

- **GRACZ (live simMatch):** musi kliknąć jeden z 4 przycisków w ciągu 10-sekundowego odliczania (match-engine.js:1030-1054). Jeśli nie kliknie — neutralny shotMod=1.0/saveMod=1.0.
- **GRACZ (dev mode, devSimMyMatch):** ZAWSZE neutralny (dev-mode.js:370, brak UI) — nigdy nie dostaje bonusu.
- **AI:** ZAWSZE, bezwarunkowo, algorytmicznie wybiera jedną z 4 opcji funkcją `_pickAIShiftKey()` (match-engine.js:557-561) na podstawie wyniku po 2 fazach: przegrywa→Atak totalny, wygrywa→Graj na czas, remis→losowo Kontratak/Pressing. AI NIGDY nie zostaje na neutralnym mnożniku.

**Symetria:** ASYMETRYCZNA z natury projektu — AI ma gwarantowany, kontekstowo trafny wybór; gracz w live ma taki sam zestaw opcji ale wymaga aktywnego kliknięcia, w dev mode nie ma szansy w ogóle.

---

## 3. Czynniki niezwiązane z zawodnikami

### 3.1 Przewaga własnego boiska (home advantage) — trzy niezależne warstwy

| Warstwa | Plik/linia | Wzór | Efekt |
|---|---|---|---|
| Podział akcji (hs) | match-engine.js:166-173 | `hPow2=(hSt.total)*hSt.form*1.07` vs `aPow2` bez mnożnika; `hs=0.5+rawHs*(0.42 lub 0.28)` | ~+5-6% akcji dla gospodarza przy równych drużynach |
| homeBonus (celność) | match-engine.js:298 | `isH ? 1.10 : 0.93` | ~+18% względnej celności gospodarza vs gościa |
| saveChanceMod (obrona) | match-engine.js:313 | `isH ? 0.97 : 1.03` | ~+6% mniejsza szansa obrony bramkarza gościa |

Zawsze przypisane do REALNEGO gospodarza (m.h), niezależnie od tego czy to klub gracza (naprawione w tej sesji — wcześniej warstwa 1 była błędnie przypisana do "mojego klubu"). **Symetria:** warstwy działają tak samo niezależnie od tego kto jest gospodarzem — to jest z definicji jednostronny bonus (dla gospodarza), ale identyczny mechanizm dla obu możliwych gospodarzy. **Obecność:** warstwa 1 (uproszczona, jeden mnożnik 1.373) w `_buildMatchLite`; warstwy 2-3 tylko w pełnym silniku.

### 3.2 Momentum meczowe

| Funkcja | Plik/linia | Wzór | Efekt |
|---|---|---|---|
| _applyMomentum(isScorer) | match-engine.js:490-511 | strzelec +2.5 (max 10), przeciwnik -1.5 (min -10) | zmienia _momentum[true/false] |
| _momBoost(isH) | match-engine.js:512 | `momentum[isH] * 0.008` | dodawane do baseShot (max ±8%) |
| _momDecay() | match-engine.js:513-520 | po każdej akcji bez gola: -0.18 w stronę zera | wywoływane przed każdą próbą strzału w bldEvs |

**Symetria:** pełna (dotyczy obu drużyn identycznie, liczone tick-po-ticku wewnątrz jednego wywołania bldEvs). **Obecność:** TYLKO pełny silnik — momentum liczone krok po kroku w pętli zdarzeń, której `_buildMatchLite` nie ma (jeden zbiorczy rzut Poissona, zero pojęcia momentum).

### 3.3 Modyfikator czasowy (_timeMod)

| Minuta meczu | Mnożnik |
|---|---|
| 1-15' | 0.90 (zimny start) |
| 16-70' | 1.00 (neutralnie) |
| 71-84' | 1.00 do 1.25 (rosnąco) |
| 85-90' | 1.25 do 1.35 (rosnąco) |

Plik: match-engine.js:521-527. Mnoży baseShot. **Symetria:** pełna (ta sama funkcja czasu dla obu drużyn). **Obecność:** tylko pełny silnik.

### 3.4 Derby (presja psychologiczna)

Plik: match-engine.js:473-483. Derby = przeciwnik w top-3 tabeli LUB różnica pozycji ≤1 (odczytywane zawsze z `G.standing`, czyli tabeli LIGI GRACZA). `_derbyFactor=1.08` jeśli derby, inaczej 1.0. Mnoży baseShot (obie strony) i lekko modyfikuje saveChance (`_derbySaveMod=0.97` gdy derby). **Symetria:** pełna dla obu drużyn biorących udział w danym meczu. **Obecność:** tylko pełny silnik.

### 3.5 Losowość / RNG

| Typ losowania | Gdzie | Rozkład |
|---|---|---|
| r(a,b) | core/state.js (funkcja pomocnicza) | jednostajny (uniform) losowy int z przedziału [a,b] włącznie |
| Math.random() | wszystkie bramki prawdopodobieństwa (baseShot, accuracyChance, saveChance, kartki) | jednostajny (uniform) float [0,1) |
| Wybór strzelca (wpick) | match-engine.js:283-292 | losowanie ważone: waga = wagaPozycji * (sht/45)² |
| Wybór asystenta | match-engine.js:339-349 | losowanie ważone: waga = wagaPozycji * (pas/45)² |

Brak rozkładu normalnego/Gaussa gdziekolwiek w silniku — wszystkie zakresy to czyste rozkłady jednostajne lub ważone losowanie dyskretne.

---

## 4. Tabela zbiorcza wszystkich czynników

| Czynnik | Plik : linia | Symetria gracz-AI | W simOthers? | W dev mode? |
|---|---|---|---|---|
| playerStr (atrybuty+cechy) | news-bootstrap.js:277 | Symetryczny | Tak | Tak |
| tS (agregacja drużyny) | match-engine.js:4 | Symetryczny | Tak | Tak |
| Forma (form) | match-engine.js:9-10 (w tS) | Symetryczny | Tak | Tak |
| Indywidualne sht/pas/def/phy w bldEvs | match-engine.js:294,344,296,375 | Symetryczny | Nie | Tak |
| Zmęczenie — wolumen akcji (staminaFactor) | match-engine.js:194-201 | Symetryczny (naprawione) | Nie | Tak |
| Zmęczenie — obrona GK (_fatigueSavePenalty) | match-engine.js:203-207 | Symetryczny | Nie | Tak |
| goalStreak (celność +5/+12%) | match-engine.js:304 | formuła: TAK / licznik: NIE (tylko myPl, tylko live) | Nie | Nie |
| Więź z klubem (_matchBondFormBonus) | match-engine.js:212 | Symetryczny (naprawione) | Nie | Tak |
| Wiek | brak w formułach meczu | n/d | n/d | n/d |
| Kontuzje/zawieszenia (blokada przedmeczowa) | match-engine.js:617 | Symetryczny | Tak (osobny system) | Tak |
| Kontuzje w trakcie meczu | match-engine.js:718-727 | formuła: TAK / system: tylko live | Nie | Nie |
| Formacja (formMod) | match-engine.js:39-46 | Symetryczny | Tak | Tak |
| Styl (styleMod) | match-engine.js:47-51 | Symetryczny | Częściowo (actions), nie (shotChance/foul) | Tak |
| Tempo (tempoMod) | match-engine.js:52 | Symetryczny | Tak | Tak |
| Pressing (pressMod) | match-engine.js:53-57 | Symetryczny | Częściowo (nie ma bldEvs/bldCards) | Tak |
| Linia (lineMod) | match-engine.js:58-62 | Symetryczny | Tak (def/atk), nie (offsideRisk) | Tak |
| Instrukcja (instrMod) | match-engine.js:63-68 | Symetryczny | Częściowo (mid/atk tak, counterBonus nie) | Tak |
| Nastawienie (mood) | match-engine.js:126-157 | Symetryczny | Nie | Tak (G._matchMood statyczne, brak UI) |
| Zmiana taktyczna 46' | match-engine.js:228-230,557-563 | Asymetryczny (z projektu) | Nie (brak fazy 3/przerwy) | Tak (AI), Nie (gracz zawsze neutralny) |
| Home advantage (3 warstwy) | match-engine.js:166-173,298,313 | symetryczne wobec realnego gospodarza | Częściowo (1 uproszczona warstwa) | Tak (pełne 3 warstwy) |
| Momentum | match-engine.js:490-520 | Symetryczny | Nie | Tak |
| Modyfikator czasowy (_timeMod) | match-engine.js:521-527 | Symetryczny | Nie | Tak |
| Derby | match-engine.js:473-483 | Symetryczny (zawsze wg G.standing) | Nie | Tak |
| Rzuty rożne/wolne/karne (bldSetPieces) | match-engine.js:367-442 | Symetryczny | Nie (uproszczony dodatek _spLam w lite) | Tak |
| Kartki/faule (bldCards) | match-engine.js:443-468 | Symetryczny | Nie | Tak |

Uwaga do wiersza "Derby": funkcja zawsze czyta `G.standing` (tabela LIGI GRACZA), niezależnie od tego które kluby faktycznie grają — dla realnych meczów gracza to poprawne, ale dla diagnostycznych wywołań silnika na innych ligach (patrz `runDiagStatsSample` w dev-mode.js) może dawać nieprecyzyjne wykrycie derby.

---

## 5. Funkcjonalności martwe

Elementy, które powinny wpływać na wynik meczu (mają nazwę, opis, czasem UI), ale w praktyce nie robią tego — częściowo lub całkowicie.

### 5.1 getTraitEffect() — całkowicie martwa funkcja

| Pole | Wartość |
|---|---|
| Plik/linia | `js/systems/traits-history.js:47-68` |
| Co powinna robić | Zwracać obiekt efektu (np. `{injMult:0.7}`, `{earlyBonus:10}`, `{teamWinBonus:2}`) dla danej cechy — generyczny system efektów cech |
| Dlaczego nie działa | ZERO wywołań w całym repozytorium (sprawdzone grepem). Efekty części cech (sprinter/artysta/snajper/mur/lider/pewny_siebie/zimna_krew/nerwowy/wytrzymały/szybki_start/słaby_start) są zaimplementowane OSOBNO, bezpośrednio w miejscach użycia (playerStr, post-match bonusy, week-progress) — NIE przez tę funkcję. To wygląda na porzuconą, wcześniejszą wersję systemu, zastąpioną bezpośrednimi implementacjami. |
| Dotyczy | simMatch, simOthers, dev mode — wszędzie, bo nigdzie nie jest wołana |

### 5.2 Cecha "profesjonalista" — martwa w 100%

| Pole | Wartość |
|---|---|
| Plik/linia | traits-history.js:13 (definicja), i18n.js:1149-1150 / 3698-3699 (nazwa/opis widoczne dla gracza) |
| Co powinna robić | "Forma utrzymuje się stabilniej" (opis widoczny w grze) — zgodnie z getTraitEffect() ma dawać `formStable:true` |
| Dlaczego nie działa | Cecha jest przypisywalna zawodnikom (w puli losowania cech dla POL/GK), ma nazwę i opis w UI, ale NIGDZIE w kodzie (poza martwym getTraitEffect) nie ma warunku sprawdzającego `traits.includes('profesjonalista')`. Zawodnik z tą cechą traci formę dokładnie tak samo jak każdy inny. |
| Dotyczy | Wszystkie ścieżki — cecha jest kompletnie kosmetyczna, wprowadza gracza w błąd co do jej działania |

### 5.3 goalStreak (bonus za serię goli) — działa tylko w live simMatch

| Pole | Wartość |
|---|---|
| Plik/linia | formuła: match-engine.js:304 (bldEvs). Aktualizacja licznika: match-engine.js:763-770 |
| Co powinna robić | +5% celności przy serii ≥3 meczów z golem, +12% przy ≥5 — dla KAŻDEGO strzelca (formuła nie ma filtra klubu) |
| Dlaczego nie działa (częściowo) | Aktualizacja pola p.goalStreak (linia 763: "aktualizuj goalStreak dla zawodników mojego klubu") występuje WYŁĄCZNIE wewnątrz next() completion handlera simMatch() — nie ma jej ani w devSimMyMatch(), ani nigdzie dla zawodników AI. Efekt: formuła jest gotowa na symetrię, ale pole źródłowe rośnie tylko dla mojego klubu i tylko podczas live rozgrywki. |
| Dotyczy | AI (zawsze martwe — pole nigdy nie rośnie), dev mode (martwe dla WSZYSTKICH klubów, w tym gracza — bo aktualizacja siedzi tylko w kodzie live UI, nie w devSimMyMatch) |

### 5.4 szybki_start / słaby_start — nigdy dla AI

| Pole | Wartość |
|---|---|
| Plik/linia | week-progress.js:342-350 |
| Co powinna robić | ±2 formy tygodniowo w pierwszych 5 kolejkach sezonu — dla każdego zawodnika z tą cechą |
| Dlaczego nie działa (dla AI) | Pętla to `myPl().filter(p=>p.starter)` — dosłownie tylko zawodnicy klubu gracza. Zawodnik AI z tą cechą nigdy nie dostaje bonusu/kary formy. |
| Dotyczy | Tylko AI (klub gracza ma to poprawnie zaimplementowane, we wszystkich trybach, bo week-progress leci niezależnie od simMatch/simOthers) |

### 5.5 wytrzymały (mniejsza szansa na kontuzję) — tylko live

| Pole | Wartość |
|---|---|
| Plik/linia | match-engine.js:718-727 (wewnątrz next() completion handlera simMatch()) |
| Co powinna robić | injMult=0.7 (30% redukcja szansy na kontuzję) po meczu — dla każdego zawodnika (pętla obejmuje m.h i m.a, czyli obie drużyny) |
| Dlaczego nie działa (poza live) | Całe losowanie kontuzji w trakcie meczu istnieje TYLKO w next() (kod UI live matcha). devSimMyMatch() go nie ma. simOthers()/_buildMatchLite w ogóle nie ma żadnego systemu kontuzji meczowych. |
| Dotyczy | Dev mode (całkowicie martwe, także dla klubu gracza) i AI-AI (całkowicie martwe — brak jakiegokolwiek systemu kontuzji meczowych w tej ścieżce) |

### 5.6 pewny_siebie (bonus przy serii ≥3 zwycięstw) — tylko gracz

| Pole | Wartość |
|---|---|
| Plik/linia | match-engine.js:846-848 |
| Co powinna robić | +2 formy dla zawodników z tą cechą, gdy G.winStreak>=3 |
| Dlaczego nie działa (dla AI) | Warunek opiera się o G.winStreak — pojedynczą zmienną globalną istniejącą wyłącznie dla klubu gracza. Kluby AI nie mają żadnego odpowiednika licznika serii zwycięstw w strukturze danych. |
| Dotyczy | Tylko AI (klub gracza działa poprawnie w simMatch; w devSimMyMatch też, bo ta logika jest częścią kodu wołanego identycznie) |

### 5.7 Spalony (offsideRisk) — kosmetyczny, bez wpływu na wynik

| Pole | Wartość |
|---|---|
| Plik/linia | match-engine.js:602-609 (zdarzenie), lineMod.offsideRisk w match-engine.js:58-62 (definicja szansy) |
| Co mogłoby sugerować | Że wysoka linia obrony generuje realne sytuacje spalonego, które anulują szansę/gola |
| Dlaczego nie wpływa na wynik | To wyłącznie zdarzenie narracyjne (type:"narration") dodawane do logu meczu — nie anuluje żadnego strzału/gola, nie zmienia żadnej statystyki. Czysto kosmetyczny komunikat. |
| Dotyczy | Wszystkie ścieżki z pełnym silnikiem (nieszkodliwe, ale nazwa sugeruje więcej niż robi) |

---

## 6. Przepływ symulacji jednego meczu (kolejność stosowania czynników)

Poniższa lista pokazuje kolejność wykonania wewnątrz `_buildMatchPhases()` (współdzielone przez simMatch i devSimMyMatch). Pozycje oznaczone **[MARTWE]** pokazują, gdzie funkcjonalność z sekcji 5 POWINNA się włączyć, ale tego nie robi.

**Krok 1 — Budowa siły bazowej**
- `tS(m.h)`, `tS(m.a)` → `playerStr()` dla każdego starter (atrybuty + cechy sprinter/artysta/snajper/mur + forma + mentalność)
- **[MARTWE — 5.2]** profesjonalista nie ma tu żadnego efektu na stabilność formy

**Krok 2 — Taktyka**
- `_clubTactic()` dla obu drużyn → formacja/styl/tempo/pressing/linia/instrukcja
- `_applyTacticsToStrength()` — mnożniki formacji/linii/instrukcji do atk/mid/def

**Krok 3 — Nastawienie (mood)**
- Gracz: `G._matchMood` (ręczne). AI: `_pickAIMood()` (algorytmiczne, wg różnicy siły)
- `_applyMoodTo()` — modyfikacja atk/mid/def obu stron

**Krok 4 — Podział akcji na mecz (hA/aA)**
- Home advantage warstwa 1 (hs, asymetryczny podział wg siły + własne boisko)
- Mnożniki mood (własne akcje + wpływ na akcje rywala)
- Pressing obu drużyn (redukcja akcji rywala)
- Różnica MID (midDiff)
- CAP na hA/aA (max 32/stronę)

**Krok 5 — Zmęczenie (faza 3, 61-90')**
- staminaFactor / staminaFactorOpp — modyfikują wolumen akcji h3f/a3f
- **[MARTWE — 5.6]** pewny_siebie nie wpływa tutaj na formę/wydajność, bo G.winStreak dotyczy tylko gracza

**Krok 6 — Faza 1 (1-30') i Faza 2 (31-60') — bldEvs() per akcja**
- Dla każdej akcji: baseShot (siła atk/def + momentum + czas + shift taktyczny + derby)
- **[MARTWE — 5.3]** goalStreak: formuła gotowa, ale licznik nigdy nie rośnie dla AI ani w dev mode
- Jeśli akcja = strzał: accuracyChance (atrybut sht + counterMod + home advantage warstwa 2 + streak + więź z klubem)
- Jeśli celny: saveChance (obrona GK + home advantage warstwa 3 + zmęczenie obrony + shift taktyczny + derby)
- Jeśli gol: `_applyMomentum()` aktualizuje przewagę psychologiczną

**Krok 7 — Kartki (bldCards, po fazach 1+2)**
- Szansa żółtej kartki na zawodnika (styl + pressing WŁASNEJ drużyny)
- Czerwona kartka redukuje siłę drużyny (-15%) i skraca fazę 3 (-20% akcji)

**Krok 8 — Decyzja taktyczna w 46. minucie**
- AI: ZAWSZE algorytmicznie (`_pickAIShiftKey`, wg wyniku po fazie 1+2)
- Gracz (live): opcjonalnie, 10s na kliknięcie, inaczej neutralnie
- **[MARTWE — częściowo]** Gracz (dev mode): zawsze neutralnie, zero szans na bonus

**Krok 9 — Faza 3 (61-90') — dopiero po decyzji z Kroku 8**
- bldEvs() z shotMod/saveMod z wybranej taktyki 46'
- **[MARTWE — 5.5]** wytrzymały: brak jakiegokolwiek losowania kontuzji w tym miejscu (to się dzieje dopiero po całym meczu, i tylko w live)

**Krok 10 — Rzuty rożne/wolne/karne (bldSetPieces)**
- Niezależne od faz czasowych, doliczane do końcowego wyniku, atrybuty pas/sht/phy konkretnych wykonawców

**Krok 11 — Zdarzenia specjalne (kosmetyczne, bez wpływu na wynik)**
- **[MARTWE — 5.7]** Spalony — tylko komunikat narracyjny
- Derby, pressing, kontratak — komunikaty narracyjne

**Krok 12 — Zliczenie wyniku końcowego**
- fHG/fAG = suma zdarzeń typu "goal" ze wszystkich faz + set pieces

**Krok 13 — Poza _buildMatchPhases (tylko simMatch, next() completion)**
- **[MARTWE poza tym miejscem]** Aktualizacja goalStreak (5.3) — tylko tu, tylko dla mojego klubu
- **[MARTWE poza tym miejscem]** Losowanie kontuzji w trakcie meczu z uwzględnieniem wytrzymały (5.5) — tylko tu
- Post-match: forma obu drużyn, lider/zimna_krew/nerwowy/pewny_siebie (5.6 częściowo martwe dla AI w simMatch, ale zaimplementowane symetrycznie w simOthers od tej sesji)

---

*Koniec dokumentu. Wyłącznie opis stanu obecnego — bez rekomendacji zmian.*
