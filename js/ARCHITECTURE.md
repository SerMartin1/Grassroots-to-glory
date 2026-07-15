# ARCHITECTURE.md — Grassroots to Glory

> Dokument techniczny projektu. Opisuje wyłącznie architekturę kodu: podział na moduły,
> odpowiedzialności, zasady komunikacji i przepływ danych. Nie opisuje mechanik gry ani roadmapy
> (patrz `TODO.md`) ani zasad pracy z Claude (patrz `CLAUDE.md`).

---

## 1. Przegląd architektury

Grassroots to Glory to gra przeglądarkowa (retro pixel-art football manager), pojedynczy
`index.html` + zestaw plików `.js` ładowanych sekwencyjnie jako klasyczne skrypty (bez bundlera,
bez modułów ES `import/export`). Cały stan gry żyje w jednym globalnym obiekcie `G`, a moduły
komunikują się przez:

- **globalne zmienne** (`G`, `selClubId`, `buyId`, `LANG`, `T`, `NAME_POOL`, …),
- **globalne funkcje** wołane bezpośrednio po nazwie (brak namespace'ów, brak importów),
- **konwencję nazw** (`fillX()` = renderuj panel X, `renderXTab()` = renderuj zakładkę,
  `addNews()` = zapisz wpis do kroniki/newsów).

Nie ma warstwy zdarzeń (event bus) ani DI — to świadomy wybór pod kątem prostoty i tempa
iteracji jednoosobowego projektu. Bezpieczeństwo tego modelu opiera się wyłącznie na
**dyscyplinie podziału odpowiedzialności między folderami** opisanej niżej.

Kolejność ładowania skryptów w `index.html` (istotna, bo przy zduplikowanej nazwie funkcji w
dwóch plikach **wygrywa ta zdefiniowana później** — nadpisuje poprzednią w globalnym scope):

```
core/i18n.js → core/data.js → core/state.js → engine/pixelart.js
→ ui/news-bootstrap.js → ui/navigation-squad.js → ui/tactics-playercard.js → ui/match-ui.js
→ engine/match-engine.js → engine/match-post.js → engine/week-progress.js
→ engine/kronika.js → engine/cup-engine.js → ui/season-summary.js
→ systems/transfers.js → ui/club-modal.js → systems/training-stadium.js
→ systems/finance.js → systems/academy.js → ui/dev-mode.js → systems/board-goals.js
→ ui/world-board-render.js → systems/traits-history.js → ui/data-center.js
→ ui/save-setup-misc.js
```

### Filozofia architektury

1. **Jeden stan (`G`), wiele modułów czytających/piszących do niego.** Moduły nie trzymają
   własnej kopii stanu — zawsze operują na `G` i jego polach (`G.myClub`, `G.standing`,
   `G.season`, `G.timeline`, …).
2. **Silny podział wg odpowiedzialności, nie wg ekranu.** Folder mówi *co wolno* robić danemu
   plikowi, niezależnie od tego, jak bardzo dany ekran "chciałby" zrobić coś więcej.
3. **Logika gry nigdy nie mieszka w warstwie UI.** `engine/` i `systems/` mogą działać
   teoretycznie bez żadnego DOM-u (nawet jeśli dziś tego nie testujemy).
4. **UI jest cienkie i głupie.** Renderuje to, co obliczyły `engine/` i `systems/`; jeśli
   trzeba zmienić dane, UI wywołuje funkcję systemu — nigdy nie modyfikuje `G` samodzielnie
   poza trywialnymi flagami widoku (np. `G._activeTab`).
5. **i18n jest scentralizowane.** Jedyne źródło tekstu to `T.pl` / `T.en` w `i18n.js` + funkcja
   `t(key)`. Żaden inny moduł nie trzyma tekstu na sztywno (poza newsami w `kronika.js`, które są
   w trakcie migracji — patrz dług techniczny w pamięci projektu).
6. **Stabilność > elegancja.** Zgodnie z `CLAUDE.md`: nie usuwamy, nie przenazywamy, nie
   duplikujemy bez wyraźnej potrzeby. Architektura ma ułatwiać *bezpieczne* dokładanie kodu,
   nie refaktoryzację dla samej refaktoryzacji.

### Standardowe zasady dla nowych treści (obowiązują zawsze, bez przypominania)

- **Każda nowa treść tekstowa w grze musi mieć wersję polską i angielską jednocześnie.**
  Nowy klucz w `T.pl` bez odpowiednika w `T.en` (i odwrotnie) jest niedokończoną zmianą —
  dotyczy to każdego modułu, który dopisuje `addNews()`, tekst eventu, etykietę UI czy opis
  cechy zawodnika.
- **Każda nowa treść tekstowa/wizualna musi używać istniejących tokenów czcionek**, nigdy
  literału `font-size:Npx`. Dziewięć tokenów zdefiniowanych w `style.css :root` (`--fs-hero`,
  `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-micro`, `--fs-display`, `--fs-body`, `--fs-meta`,
  `--fs-dense`) to jedyne dozwolone rozmiary tekstu HTML w projekcie — nowy element UI dobiera
  najbliższy pasujący token, nie tworzy nowego rozmiaru. Wyjątkiem technicznym są rozmiary
  tekstu wewnątrz generowanego SVG (atrybut `font-size` w `<text>`, np. wykresy w
  `club-modal.js`) — to inny mechanizm renderowania niż CSS i nie podlega tokenom, ale też nie
  powinien być rozszerzany bez potrzeby.

---

## 2. Struktura katalogów

```
core/       — fundamenty: dane referencyjne, i18n, stan gry, generatory
engine/     — silnik gry: symulacja meczu, puchar, pixel art, tydzień gry, kronika zdarzeń
ui/         — wyłącznie interfejs: renderowanie, nawigacja, obsługa kliknięć
systems/    — systemy gry z własną logiką biznesową: transfery, finanse, trening/stadion,
              akademia, cele zarządu, cechy/historia
```

### Rola każdego folderu

**`core/`**
- odpowiada za dane bazowe (kluby, ligi, generowanie zawodników, nazwiska), stan gry (`G`) i
  tłumaczenia,
- nie zawiera logiki "co się dzieje w tygodniu" ani logiki meczu,
- inne moduły *czytają* z `core/`, ale nie powinny nadpisywać jego struktur (np. `T`, `G` schema)
  bez zgody.

**`engine/`**
- odpowiada wyłącznie za logikę gry: symulację meczu, przebieg tygodnia, puchar, generowanie
  grafiki pixel-art, wyzwalanie wydarzeń fabularnych (Kronika),
- **nie tworzy HTML** poza minimalnymi wyjątkami historycznymi (patrz sekcja 6 — miejsca do
  ostrożności),
- nie otwiera okien/modali samodzielnie — zwraca dane lub wywołuje funkcję UI, która to robi,
- może wołać `systems/` (np. `week-progress.js` woła `aiTransferSeason()` z `match-post.js`).

**`ui/`**
- odpowiada wyłącznie za interfejs: renderowanie paneli, obsługę zakładek, nawigację,
- **nie liczy logiki gry** (nie oblicza wyników meczów, wartości zawodników, wypłat itd.),
- **nie zmienia danych gry bez wywołania funkcji z `engine/`/`systems/`** — może zmieniać
  wyłącznie stan widoku (aktywna zakładka, otwarty modal, filtry sortowania UI).

**`systems/`**
- odpowiada za konkretne, domenowe systemy gry z własną logiką biznesową: transfery, finanse,
  trening/stadion, akademia, cele zarządu, cechy zawodników i historia klubu,
- każdy system jest samodzielny logicznie, ale może czytać stan z `core/` i wywoływać
  `addNews()`/`pushTimeline()`, by zapisać skutek w kronice/osi czasu,
- nie renderuje UI poza własnymi plikami `renderXTab()`/`fillX()` — pliki w `systems/` w tym
  projekcie łączą logikę z lekką warstwą renderowania własnej zakładki (patrz uwaga w
  sekcji 6 — odstępstwo od czystego podziału).

---

## 3. Opis wszystkich modułów

Poniżej: wszystkie 25 plików modułowych, po jednym na blok. Zależności są wyprowadzone z
realnych wywołań w kodzie (grep + odczyt kluczowych fragmentów), nie z założeń. Wszystkie
25 plików zostało zweryfikowanych bezpośrednio na kodzie źródłowym.

### 1. `core/i18n.js`
**Odpowiada za:**
- słownik tłumaczeń `T.pl` / `T.en` (776 kluczy, parytet PL=EN),
- funkcję odczytu `t(key)` z fallbackiem PL → klucz,
- `setLang()`, `applyLang()` (aktualizacja wszystkich elementów `[data-i18n]` + ręcznych
  `_setTxt()` wywołań dla elementów bez atrybutu),
- wybór języka przy starcie (`pickLang`, `showLangPicker`, `onSplashTap`),
- budowę puli nazwisk uwzględniającej język (`buildNamePoolI18n`, `getClubsPool`).

**Nie odpowiada za:**
- logikę gry, dane zawodników/klubów, renderowanie paneli poza własnym lang-pickerem.

**Można bezpiecznie edytować:**
✔ dodawanie nowych kluczy do `T.pl`/`T.en` (zawsze parą)
✔ `applyLang()` — dopisywanie nowych `_setTxt()`

**Zmiany wymagające innych modułów:**
⚠ każdy moduł, który dodaje nowy tekst w UI — musi dodać klucz tutaj

---

### 2. `core/data.js`
**Odpowiada za:**
- dane referencyjne lig i klubów (`initLeagues`, `getLeagueClubs`, `setCurrentLeague`),
- generowanie puli nazwisk (`buildNamePool`, `getUniqueName`),
- pomocnicze przeliczenia bazowe: `calcPotential`, `calcWeeklyIncome`.

**Nie odpowiada za:**
- UI, symulację meczu, generowanie pojedynczego zawodnika (to `state.js`).

**Można bezpiecznie edytować:**
✔ dane lig/klubów, algorytm puli nazwisk

**Zmiany wymagające innych modułów:**
⚠ `i18n.js` (nazwy lig jako `Proxy` — patrz zasady i18n), `transfers.js`/`academy.js` (konsumują
`getUniqueName`)

---

### 3. `core/state.js`
**Odpowiada za:**
- globalny stan gry: deklaracje `G`, `selClubId`, `buyId`, `matchSpeed`, `liveStats`, `NAME_POOL`,
- generator zawodnika `mkPlayer()`, atrybuty `mkAttrs()`, ranking `ovr()`,
- wycenę i pensje: `calcValue`, `calcValueDynamic`, `calcDynamicValueMult`, `calcSalary`,
- system skautów: definicje `SCOUTS_DEF`, `getScoutDef`, `initScout`, `scoutModeASlots`,
- oś czasu klubu: `pushTimeline()` + listy `KRON_TIMELINE_WORTHY`/`KRON_IGNORED_WORTHY`,
- narzędzia ogólne: `r()`, `pick()`, `fmt()`, `fmtVal()`, `posOrd()`, `ageMult()`.

**Nie odpowiada za:**
- renderowanie, symulację meczu, AI transferów (tylko wycenę/generowanie surowych danych).

**Można bezpiecznie edytować:**
✔ wzory wyceny/pensji, tabele wieku/skautów, generator atrybutów

**Zmiany wymagające innych modułów:**
⚠ każdy moduł czytający `ovr()`/`calcValue` (transfers, finance, match-engine) — zmiana skali
wpłynie na wszystkie systemy ekonomiczne jednocześnie

---

### 4. `engine/pixelart.js`
**Odpowiada za:**
- deterministyczne (seedowane) generowanie grafiki pixel-art: twarze (`pxFace`), herby klubowe
  (`pxCrest`), stroje z numerem (`pxKit`), paletę barw klubowych (`pxClubColors`),
- zwraca gotowe elementy `<canvas>` — jedyny moduł silnika, który świadomie tworzy DOM, bo jego
  *produktem* jest grafika, nie interfejs.

**Nie odpowiada za:**
- logikę gry, dane zawodników/klubów (przyjmuje tylko `seed`/`clubId`/opcjonalnie `age` z
  zewnątrz — nigdy nie czyta `G` bezpośrednio), osadzanie canvasu w konkretnym panelu (robi to
  wołający kod w `ui/`).

**Można bezpiecznie edytować:**
✔ palety kolorów, wzory generowania (`kStyle`, `pat`, `sym`), rozmiar siatki pikseli

**Zmiany wymagające innych modułów:**
⚠ brak istotnych — moduł czysto funkcyjny, wywoływany przez `ui/` (np. karty zawodnika, herby
w tabeli ligowej)

**`pxFace(seed, sc, age)` — warstwy twarzy i jak dodać nowy wariant:**
Twarz to 12×14 „pikseli” złożonych z kategorii: `faceShape`(3), `skin`(8), `hairStyle`(8, w tym
łysy=0), `hairColor`(8), `eyebrow`(3), `eyeColor`(6), `eyeShape`(2), `nose`(3), `mouth`(3, zawsze
symetryczne/neutralne — bez uśmiechu/grymasu), `facialHair`(4), `accessory`(3: brak/okulary/
blizna). Każda cecha jest losowana raz przez `_faceTraits(seed, age)` i cache'owana pod kluczem
`seed_age` (sam `sc` nigdy nie wpływa na dobór cech, tylko na skalę rysunku). `age` jest
opcjonalny — jego brak (istniejące wywołania z 2 argumentami) daje rozkład wag `mid` (bez biasu).
Tabele wag `W_HAIR_STYLE/W_HAIR_COLOR/W_BEARD` mają warianty `young/mid/vet` (próg wieku w
`_faceTraits`: <23 / 23-31 / ≥32) — tak łysina, siwizna i zarost stają się częstsze u weteranów.
Pól `nationality`/`archetype` nie ma dziś w obiekcie zawodnika (`mkPlayer` w `core/state.js` ma
tylko `age`), więc karnacja/fryzura nie są nimi ważone — dodanie takiego biasu wymagałoby
najpierw dodania pola w `core/state.js` (osobna decyzja, poza tym plikiem).

Aby dodać nowy wariant w istniejącej kategorii (np. 9. fryzurę): (1) dopisz wagę do każdego z
`W_HAIR_STYLE.young/mid/vet` (kolejność = indeks), (2) dodaj gałąź `else if(tr.hairStyle===8){...}`
w `drawFace` rysującą nowy układ pikseli tym samym `_px(ctx,x,y,col,sc)`. Aby dodać całkiem nową
kategorię: dopisz pole do obiektu `tr` w `_faceTraits` (roluj przez `_wpick` lub
`Math.floor(r()*N)`), potem narysuj je w `drawFace` w wybranym, dotąd wolnym rzędzie siatki
(rzędy 0-1 zajęte przez fryzury, 2 głowa, 4 brwi, 5 oczy, 6 częściowo wolny — nos/okulary/blizna/
zmarszczki go współdzielą, 7 nos, 8 usta/wąsy, 9-11 broda/szczęka). Nowe kombinacje zawsze
sprawdzaj w `face-harness.html` (siatka 50-100 twarzy) pod kątem nachodzących warstw.

---

### 5. `ui/news-bootstrap.js`
**Odpowiada za** (moduł większy niż nazwa sugeruje — łączy trzy odpowiedzialności):
- **system newsów**: `addNews()` (globalny zapis wpisu), `renderNews()`, `newsSetTab`,
  `newsFilterPrev`, `newsTogglePrev`, `newsClickable`, `newsAction`, `_newsBadge`,
  `_newsItemHtml`, `_newsTabFilter`, `_renderPrevList` — wołane z niemal każdego modułu w
  projekcie (`kronika.js`, `week-progress.js`, `transfers.js`, `board-goals.js`,
  `cup-engine.js`, `match-post.js`, `academy.js`, `training-stadium.js`),
- **inicjalizację nowej gry/sezonu**: `initGame()`, `buildSchedule()` (terminarz ligi),
  `mkLeaguePlayers()` (składy 24+głębia, zamknięty świat — bez osobnej puli FA, patrz
  `js/CLAUDE.md`), `assignJerseyNumbers()`/`assignJerseyNum()`, `assignAITactics()`,
  `genPlayerHistory()`, `capOvrAtPotential()`,
- **zapis/odczyt gry**: `saveGame()`, `loadGame()`, `delSave()`, `saveInfo()`,
- **pomocnicze funkcje składu/formacji** używane w całym projekcie: `myPl()` (moi zawodnicy),
  `mySt()` (moi starterzy), `formationLimits()`, `positionsForFormation()`, `showById()`
  (otwiera kartę zawodnika po ID — wołane m.in. z `club-modal.js`), `playerStr()`, `tStr()`,
- **więzi z klubem / kontuzje**: `applyInjury()`, `getBondLevel()`, `getBondFormBonus()`.

**Nie odpowiada za:**
- generowanie *treści* newsów (to robią moduły domenowe — ten plik tylko przyjmuje gotowy
  tekst i renderuje), logikę meczu, taktyki, transferów.

**Można bezpiecznie edytować:**
✔ format wizualny listy newsów, limit/filtrowanie wpisów, drobne poprawki w generatorze
terminarza czy początkowych wolnych agentów

**Zmiany wymagające innych modułów:**
⚠ **każdy moduł w projekcie** — `addNews()`, `myPl()`, `mySt()`, `formationLimits()` są wołane
dosłownie wszędzie; zmiana sygnatury którejkolwiek wymaga przejrzenia całego kodu
⚠ `save-setup-misc.js` — bezpośrednio woła `initGame()` przy starcie nowej kariery

---

### 6. `ui/navigation-squad.js`
**Odpowiada za:**
- **nawigację**: `go()` (przełączanie głównych widoków `.view`), `openPanel`/`closePanel`/
  `closeAllPanels`/`fillPanel`, `openModal`/`closeModal`,
- **pasek powiadomień**: `notif()` — globalna funkcja komunikatów UI, wołana z niemal
  wszystkich systemów,
- **renderowanie kadry/składu**: `fillSquad`, `renderSquadContracts`, `renderSquadHealth`,
  `renderSquadStats`, `setSqFilter`/`setSqSort`, `squadTab`,
- **uzupełnianie składu przed meczem**: `autoFillSquadFromBench` — z ławki na tej samej pozycji,
  a gdy to nie wystarcza (kontuzje/zawieszenia wybiły całą pozycję) awaryjnie zawodnikiem z innej
  pozycji (tymczasowa zmiana `p.pos` na czas kryzysu, cofana automatycznie przy kolejnym meczu);
  minimum na pozycję przy sprzedaży pilnuje `POS_QUOTA` w `openSellModal()` (tactics-playercard.js)
  — dawny system "kryzysu kadrowego" (rynek awaryjny od AI) usunięty,
- **przejście do kolejnego tygodnia/meczu**: `handleNextWeek`, `tryOpenMatch`, `advWeekPrep`,
- **nagłówek gry**: `updateHdr`,
- zakładki pomocnicze: `matchTab`, `trTab` (uwaga — zobacz sekcja 15, ta definicja jest
  martwym kodem, nadpisana przez `transfers.js`).

**Nie odpowiada za:**
- logikę składu/formacji jako taką (limity formacji, `mySt()` — to `news-bootstrap.js`),
  właściwe rozliczenie tygodnia (`advWeek()` w `week-progress.js` — `advWeekPrep()` tutaj to
  osobna, lżejsza funkcja odpalana w fazie przedsezonowej, nie mylić z `advWeek()`).

**Można bezpiecznie edytować:**
✔ layout listy zawodników, sortowanie/filtry widoku kadry, treść komunikatów `notif()`

**Zmiany wymagające innych modułów:**
⚠ `news-bootstrap.js` (`myPl`, `mySt`, `formationLimits`), `week-progress.js` (`advWeek` —
inny, właściwy cykl tygodnia), `transfers.js`/`training-stadium.js` (odświeżają widok kadry po
transferze/kontuzji)
⚠ **znany dług techniczny w tym pliku**: dwie definicje `function advWeekPrep(){...}` w tym
samym pliku (druga nadpisuje pierwszą) — pierwsza wygląda na źle nazwany fragment kodu do
podświetlania linków w newsach (odwołuje się do nieistniejącej zmiennej `n`), a nie do logiki
przedsezonowej. Do wyjaśnienia/uporządkowania przy najbliższej okazji pracy nad tym plikiem

---

### 7. `ui/tactics-playercard.js`
**Odpowiada za:**
- **panel taktyki**: `fillTactics`, `tacTab`, `setSty`/`setForm`/`setLine`/`setPres`/
  `setPress`/`setTem`/`setInstr` (ustawienia stylu/formacji/linii/pressingu/tempa), `fillPitch`,
  `fillTacSquad`, `mkTacCard`, `autoSelectSquad` (auto-dobór składu, wołany też z `dev-mode.js`),
  `_styleLabel`,
- **kartę zawodnika**: `showPlayer`, `_captureReturnPoint` (v223 — jeden, ogólny mechanizm
  powrotu: przy każdym otwarciu karty automatycznie zapamiętuje w `window._playerReturnTo`
  aktualnie otwarty panel LUB modal — `modal-club-ai`/`modal-season-summary`/`md-overlay` —
  wraz z minimalnym kontekstem potrzebnym do odtworzenia; odczytywane w `closePanel('p-player')`
  w `navigation-squad.js`; zastąpił 4 wcześniejsze, częściowo martwe flagi), `mkCard`, `plrTab`,
  `renderPlayerHistory`, `renderPlayerAwards`, `showAwardDetail`, `toggleTraitDesc`,
  `_traitLabel`, `_traitDesc` (warstwa wyświetlania cech — zgodnie z zasadą, że `TRAITS`
  strukturalnie zostaje nietknięte),
- **kontrakty i sprzedaż z poziomu karty zawodnika**: `openContractModal`, `doExt`,
  `calcContractSalary`, `calcReadiness`, `acceptChance`, `playerDemand`, `changeMCSalary`,
  `selContractYears`, `renderExt`, `_renderContractModal`, `openSellModal`, `doSell`,
  `doSellFromPanelTop`, `calcSellPrice`.

**Nie odpowiada za:**
- przeliczanie efektu taktyki na wynik meczu (to `match-engine.js`/`match-post.js` —
  `_applyTactic`), samą logikę cech (`genTraits`/`getTraitEffect` w `traits-history.js`),
  pierwsze podpisanie kontraktu wolnego agenta (`signContract` w `finance.js` — tutaj chodzi o
  **przedłużenie/renegocjację** kontraktu obecnego zawodnika).

**Można bezpiecznie edytować:**
✔ układ karty zawodnika, prezentację opcji taktycznych, formuły akceptacji przedłużenia
kontraktu

**Zmiany wymagające innych modułów:**
⚠ `match-engine.js`/`match-post.js` (odczytują `G.style`/`G.pressing`/`G.line`/
`G.instruction` — klucze wewnętrzne PL, tłumaczone tylko na warstwie wyświetlania)
⚠ **znany dług techniczny**: w tym pliku istnieją po dwie definicje `setLine()` i
`setInstr()` (druga nadpisuje pierwszą) — do sprawdzenia, czy pierwsza wersja jest w pełni
martwa, czy różni się czymś istotnym
⚠ **znany dług techniczny (v223)**: `showPlayerFromClubModal()` i `mkCard()` są zdefiniowane,
ale nigdzie w projekcie nie są już wołane (zweryfikowane grepem) — prawdopodobnie zastąpione
przez `showById()`/`showPlayer()` bezpośrednio. Zostawione bez zmian (nieużywany kod, zero
ryzyka), do ewentualnego uprzątnięcia przy najbliższej pracy nad tym plikiem.

---

### 8. `ui/match-ui.js`
**Odpowiada za:**
- renderowanie panelu meczu na żywo: `fillMatch()` (w tym obsługę stanu meczu pucharowego
  `G._cupMatchActive` i blokadę odświeżania w trakcie trwania meczu), `nextMatch()`
  (wyznaczenie kolejnego meczu z terminarza),
- kontrolę prędkości symulacji: `changeSpeed`, `setMatchSpeed`, `updateSpeedLabel`.

**Nie odpowiada za:**
- symulację przebiegu meczu (`match-engine.js`), przeliczanie ocen (`calcFinalRatings` w
  `match-post.js`), panel zmian zawodników (`openSubs`/`confirmSub` — zdefiniowane w
  `match-post.js`), event chipy live (`_addEventChip` — też `match-post.js`).

**Można bezpiecznie edytować:**
✔ animacje, prezentację wydarzeń meczowych, layout panelu meczu, kroki prędkości symulacji

**Zmiany wymagające innych modułów:**
⚠ `match-engine.js` (jedyne źródło prawdy o przebiegu meczu), `match-post.js` (zmiany/oceny),
`cup-engine.js` (`G._cupMatchActive`)

---

### 9. `engine/match-engine.js`
**Odpowiada za:**
- symulację pojedynczego meczu: `simMatch()`, generowanie wydarzeń (`bldEvs`, `bldCards`,
  `bldSetPieces`), momentum (`_applyMomentum`, `_momBoost`, `_momDecay`), modyfikatory czasowe
  (`_timeMod`), krok po kroku przebiegu (`next`), update UI na żywo (`upUI`),
- na koniec meczu wywołuje `postMatch()` (z `match-post.js`) i `addNews()`.

**Nie odpowiada za:**
- rozliczenie potransferowe/kontraktowe po meczu (`match-post.js`), UI panelu meczu (`ui/`).

**Można bezpiecznie edytować:**
✔ wagi zdarzeń, formuły momentum, prawdopodobieństwa akcji

**Zmiany wymagające innych modułów:**
⚠ `match-post.js` (odbiera wynik przez `postMatch()`), `week-progress.js` (wywołuje `advWeek()`
gdy nie ma meczu), `cup-engine.js` (mecze pucharowe współdzielą silnik)

---

### 10. `engine/match-post.js`
**Odpowiada za:**
- rozliczenie meczu: `postMatch()`, końcowe oceny (`calcFinalRatings`), aktualizację tabeli
  (`updStand`), symulację meczów AI w tej samej kolejce (`simOthers`),
- AI klubów: `initClubAI`, `ensureClubsHaveAI`, `aiSelectSquad`, `aiRenewContracts`,
  `aiTransferPlayer`, `aiTransferSeason`,
- panel zmian zawodników w trakcie meczu (`openSubs`, `autoSubs`, `confirmSub`, `selectSubOut`),
- zakładkę ocen (`ratTab`, `renderRatingsPitch`).

**Nie odpowiada za:**
- sam przebieg akcji meczowej (`match-engine.js`), transfery inicjowane przez gracza
  (`transfers.js`) — tylko transfery AI.

**Można bezpiecznie edytować:**
✔ logikę AI (dobór składu, odnowienia kontraktów, transfery AI), formuły ocen

**Zmiany wymagające innych modułów:**
⚠ `state.js` (`calcValue`/`calcSalary` używane przy transferach/kontraktach AI), `data.js`
(baza klubów przy `aiTransferPlayer`)

**Reputacja per liga (AI) — udokumentowane 14.07.2026, audyt stabilności OVR świata:**
`initClubAI(club, leagueLevel)` nadaje klubowi AI reputację startową skalowaną poziomem ligi:
`10+(8-poziom)*30+losowe(0,60)` — liga 1 (Premier Division) startuje z 220-280, liga 8 (VII
Liga, najniższa) z 10-70. Gracz zawsze startuje z `G.reputation:30` (sztywne w `initGame()`,
`news-bootstrap.js`), spójne z ligą 8 (gracz zawsze zaczyna tam). Reputacja AI od 14.07.2026 ma
też wpływ na jakość juniora (`_repJuniorBonus` w `aiTransferSeason()`, ten sam próg co
`_repTierR` w `aiSeasonalRefresh()`, `kronika.js`) — obok już istniejących ról (tempo rozwoju
przez `clubDevMult`, cele zarządu).

**`AI_TYPES` — 4 archetypy klubów AI**, wybierane losowo w `initClubAI()` (typ `bogaty`
wykluczony w ligach 5-8): `akademia` (młodzieżowy — wysoki nabór juniorów, niski `maxBuyAge`),
`sprzedajacy` (handlowy/spekulacyjny — wysoki `sellRate`, rozwija i sprzedaje), `bogaty`
(ambitny/zamożny — wysoki budżet i `buyRate`, zero naboru juniorów), `stabilny` (skromny/
doświadczony — wysoki `maxBuyAge`, niski nabór juniorów, ostrożne zakupy; doprecyzowany
14.07.2026 w stronę "stawia na doświadczenie"). Każdy typ ma osobne `minUpgradeDelta`/
`maxAnnualSignings`/`maxAnnualSells`/`coreProtectSize`/`renewChance`, egzekwowane przez
`aiEvaluateSale`/`aiEvaluateSigning`/`aiSigningCap`/`aiSellingCap`/`aiCoreProtect` (ten plik).
`LEAGUE_AI_TUNING` (`data.js`) skaluje dodatkowo "szczelność" decyzji per liga, niezależnie od
typu klubu.

---

### 11. `engine/week-progress.js`
**Odpowiada za:**
- **centralny dyrygent cyklu tygodnia**: `advWeek()` — inkrementuje tydzień/kolejkę, wywołuje
  w odpowiedniej kolejności: kontuzje, finanse tygodniowe, aktualizacje skautów/akademii/TC,
  `kronUpdateBenchWeeks()` + `kronTrigger()`, `fanMemoryTrigger()`, `checkBoardGoals()`,
  `checkCupTrigger()`, transfery AI zimowe (`aiTransferSeason(true)`), odświeżenie paneli
  (`fillStadium`, `renderBuyTab`, `renderStadModuly`, `renderStadRozbudowa`).

**Nie odpowiada za:**
- szczegółową logikę żadnego z wywoływanych systemów — wyłącznie **orkiestrację kolejności**.

**Można bezpiecznie edytować:**
✔ kolejność/warunki wywołań w ramach `advWeek()`, nowe hooki "co tydzień"

**Zmiany wymagające innych modułów:**
⚠ **praktycznie wszystkie systemy** — to najbardziej wrażliwy punkt integracji w całym
projekcie (patrz sekcja 6)

---

### 12. `engine/kronika.js`
**Odpowiada za:**
- system wydarzeń fabularnych "Kronika Klubu": `kronTrigger()` (losowanie i wyzwalanie
  eventów), `kronUpdateBenchWeeks()`, `kronShowModal()` (prezentacja eventu),
  `fanMemoryTrigger()` (callbacki pamięci kibiców), `aiSeasonalRefresh()`,
- ~89 wywołań `addNews()` z treścią eventów (obecnie częściowo niezinternacjonalizowane —
  świadomy dług, patrz pamięć projektu),
- korzysta z progów `KRON_TIMELINE_WORTHY` / `KRON_IGNORED_WORTHY` zdefiniowanych w `state.js`
  i woła `pushTimeline()` dla wydarzeń wartych osi czasu klubu.

**Nie odpowiada za:**
- renderowanie ekranu Kroniki jako zakładki (to `ui/` + `traits-history.js`/`histTab` dla
  powiązanej historii), logikę meczową/transferową.

**Można bezpiecznie edytować:**
✔ treść i warunki wyzwalania nowych eventów (`KRON_EVENTS`), wagi/prawdopodobieństwa

**Zmiany wymagające innych modułów:**
⚠ `i18n.js` — **każdy nowy event musi mieć `T.pl`/`T.en`** (zasada bilingual-from-start),
⚠ `state.js` — jeśli event ma trafiać na oś czasu, dopisz go do `KRON_TIMELINE_WORTHY`
⚠ nazwa parametru lambda w blokach efektów/outcome musi być `tr`, nie `t` (żeby nie
przesłaniać globalnej `t()`)

---

### 13. `engine/cup-engine.js`
**Odpowiada za:**
- rozgrywki pucharowe: inicjalizację drabinki (`initCup`, `shuffle64`), symulację rund
  (`simCupRound`, `advanceCupRound`, `resolveCupMyMatch`), nagrody (`grantCupReward`),
  wyzwalanie momentu wejścia do pucharu (`checkCupTrigger`),
- renderowanie własnej zakładki i drabinki (`cupTab`, `fillCup`, `renderCupDrzewko`,
  `renderCupZwyciezcy`, `cupDrzewkoNav`, `cupToggleRound`, `updateCupTileBadge`),
- etykiety rund jako `Proxy` i18n (`_cupRoundLabels`).

**Nie odpowiada za:**
- symulację samego meczu gracza (deleguje do `match-engine.js`/`match-post.js` przez
  `resolveCupMyMatch`).

**Można bezpiecznie edytować:**
✔ format drabinki, nagrody, harmonogram rund

**Zmiany wymagające innych modułów:**
⚠ `match-engine.js`/`match-post.js` (mecz gracza w pucharze), `week-progress.js`
(`checkCupTrigger()` wołane co tydzień)

---

### 14. `ui/season-summary.js`
**Odpowiada za** (największy plik UI — 1266 linii, dwie połączone odpowiedzialności):
- **modal podsumowania sezonu** ("MSS"): `showSeasonSummary`, `mssTab` (przełączanie zakładek
  wewnątrz modala), `startNewSeason`, `closeSeasSummaryAndStartNew`, `calcSeasonValuations`
  (wołane też z `week-progress.js`), `isTransferWindow` (wołane też z `week-progress.js`),
- **przegląd wszystkich lig** ("world leagues overview"): `fillLeaguesOverview`, `fillTable`,
  `toggleFullTable`, `showLgSeasonTable`, `lgSwitchTab`, `lgRefreshWyniki`, `handleTableClick`,
  `renderHistoria`, `renderLegenda`.

**Nie odpowiada za:**
- przeliczanie tabeli/wyników bieżącej kolejki (`updStand` w `match-post.js` — ten plik tylko
  prezentuje tabele historyczne/końcowe), rozgrywanie meczów innych klubów (`simOthers`).

**Można bezpiecznie edytować:**
✔ layout i treść podsumowania sezonu, prezentację tabel ligowych

**Zmiany wymagające innych modułów:**
⚠ `week-progress.js` (`calcSeasonValuations`, `isTransferWindow` wołane stamtąd),
`traits-history.js` (`renderHistSezony`, dane historyczne sezonu), `finance.js`
(`renderFinSezony`)

---

### 15. `systems/transfers.js`
**Odpowiada za:**
- kupno/sprzedaż zawodników (`buyTransfer`, `doBuy`, `sellPlayer`, `acceptOffer`,
  `rejectOffer`, `adjOffer`, `toggleListed`),
- generowanie rynku transferowego (`genTransferMarket`, `genWeeklyMarket`,
  `genTransferContext`), oczekiwań kontraktowych (`genDemands`, `applyDemandEffect`,
  `demandsHtml*`, `getDemandResults`),
- system skautingu (`sendScoutModeA/B`, `scoutObserveClub/Market`, `scoutSearchTalent`,
  `genTalent`, `acceptProspect`/`signTalent`/`dismissTalent`/`rejectTalent`, `upgradeScout`),
- rozpatrywanie ofert AI (`processAIOffers`).
- Zawiera też własną warstwę renderowania zakładki (`fillTransfers`, `renderMarket`,
  `renderBuyTab`, `renderSellTab`, `renderAnalitykaTab`, `renderScoutsTab`,
  `renderHistoriaTab`) — świadome odstępstwo od czystego podziału `systems/` vs `ui/`
  (patrz sekcja 6).

**Nie odpowiada za:**
- transfery inicjowane przez AI między klubami AI (`aiTransferPlayer`/`aiTransferSeason` w
  `match-post.js`), wycenę bazową zawodnika (`calcValue*` w `state.js` — transfers.js z niej
  tylko korzysta).

**Można bezpiecznie edytować:**
✔ wyceny ofert, logikę skautingu, generowanie rynku

**Zmiany wymagające innych modułów:**
⚠ `state.js` (`calcValue`, `calcSalary`, `ovr`), `ui/news-bootstrap.js` (`addNews` przy każdej
transakcji), `finance.js` (budżet klubu wpływa na możliwe oferty)
⚠ **`trTab()` jest tu zdefiniowana ponownie** i — dzięki kolejności ładowania skryptów (patrz
sekcja 1) — **nadpisuje** wersję z `navigation-squad.js`; ta ostatnia jest więc martwym kodem
⚠ **znany dług techniczny**: plik zawiera dwie definicje `function signTalent(idx){...}` (linie
~1072 i ~1315) z różną logiką limitu talentów (`maxT=[0,2,4,6,8][acadLvl]` vs
`acadMaxTalents()`) — druga nadpisuje pierwszą i jest tą faktycznie używaną; warto usunąć
pierwszą przy najbliższej pracy nad tym plikiem, żeby uniknąć pomyłki przy przyszłych zmianach

---

### 16. `ui/club-modal.js`
**Odpowiada za:**
- modal ze szczegółami dowolnego klubu (własnego lub rywala): `openClubModal`/
  `closeClubModal`, zakładki (`cmTab`), kartę klubu z herbem (`_renderClubCard`, woła
  `pxCrest()`/`pxFace()` z `pixelart.js`), historię klubu (`_renderClubHistory`), podgląd
  składu (`_renderClubSquad`, `openClubSquad`),
- przejście z podglądu składu klubu (i innych list w tym pliku) do karty konkretnego
  zawodnika przez `showById()` — punkt powrotu do modalu klubu zapisuje się automatycznie
  (patrz `_captureReturnPoint()` w `tactics-playercard.js`, sekcja 7), ten plik nie musi już
  nic zapisywać ręcznie.

**Nie odpowiada za:**
- logikę AI klubu, generowanie/liczenie statystyk (czyta gotowe dane z `G`/`data.js`), samą
  kartę zawodnika (`showPlayer()`/`showById()` przejmują dalej).

**Można bezpiecznie edytować:**
✔ layout modala, dobór prezentowanych statystyk/zakładek

**Zmiany wymagające innych modułów:**
⚠ `pixelart.js` (`pxCrest`, `pxFace`), `data.js` (dane klubu), `tactics-playercard.js`
(`showPlayerFromClubModal` odczytuje `window._playerReturnTo`/`window._playerReturnClubId`
ustawione tutaj — zmiana nazw tych zmiennych globalnych musi być zsynchronizowana w obu plikach)

---

### 17. `systems/training-stadium.js`
**Odpowiada za:**
- trening: intensywność, fokus treningowy, obozy indywidualne/drużynowe (`setTrain`,
  `setIntensity`, `sendIndCamp`, `startTeamCamp`, `toggleIndCamp`),
- centrum treningowe (`buildTC`, `tcLevel`, `tcCost`, `tcUpkeep`, `tcProfiles`,
  `unlockTCProfiles`, `toggleTCProfile`),
- stadion: rozbudowę i moduły (`fillStadium`, `startBuild`, `buyModule`, `checkModuleReq`,
  `getModuleLvl`, `changeStadAdd`, `drawStadiumTopDown`),
- renderowanie własnych zakładek (`stadTab`, `trainTab`, `renderStadPrzeglad`,
  `renderStadRozbudowa`, `renderStadModuly`, `renderStadHistoria`, `fillTraining`,
  `fillCampPanel`, `fillProgressPanel`).

**Nie odpowiada za:**
- finanse ogólne klubu (`finance.js` — ten moduł tylko konsumuje/odejmuje budżet przez wywołania
  systemowe), rozwój młodzieży (`academy.js`).

**Można bezpiecznie edytować:**
✔ koszty modułów, tempo progresu treningowego, layout top-down stadionu

**Zmiany wymagające innych modułów:**
⚠ `finance.js`/budżet klubu, `week-progress.js` (cykliczne odświeżanie co tydzień)

---

### 18. `systems/finance.js`
**Odpowiada za:**
- panele finansowe: przegląd (`renderFinPrzeglad`), historia (`renderFinHistoria`), kontrakty
  (`renderFinKontrakty`, `signContract`), sezony (`renderFinSezony`), zarząd
  (`renderFinZarzad`/`finZarzadInner`/`renderFinZarzadInner`), zakładka (`finTab`).

**Nie odpowiada za:**
- generowanie przychodu tygodniowego (`calcWeeklyIncome` w `data.js` — finance.js go
  wykorzystuje/prezentuje), transakcje transferowe (`transfers.js`).

**Można bezpiecznie edytować:**
✔ prezentację danych finansowych, warunki podpisywania kontraktów

**Zmiany wymagające innych modułów:**
⚠ `data.js` (`calcWeeklyIncome`), `transfers.js`/`training-stadium.js` (obciążają budżet
klubu, który finance.js tylko wyświetla)

---

### 19. `systems/academy.js`
**Odpowiada za:**
- akademię młodzieżową: poziom i koszt (`getAcadLvl`, `acadCost`, `acadUpkeep`),
  generowanie/akceptację/odrzucenie talentów (`generateProspects`, `acceptProspect`,
  `rejectProspect`),
- panele akademii (`buildAcademy`, `fillAcademy`, `acadTab`, `renderAcadPrzeglad`,
  `renderAcadRozbudowa`, `renderAcadWychowankowie`, `renderAcadHistoryTab`),
- profile Centrum Treningowego powiązane z akademią (`tcMaxProfiles` używane też z
  `training-stadium.js`).

**Nie odpowiada za:**
- generowanie zawodnika na poziomie atrybutów (`mkPlayer`/`mkAttrs` w `state.js` — academy
  buduje na tym warstwę "prospektów"), skauting seniorski (`transfers.js`).

**Można bezpiecznie edytować:**
✔ tempo generowania talentów, koszty rozbudowy akademii

**Zmiany wymagające innych modułów:**
⚠ `state.js` (`mkPlayer`, `ovr`), `training-stadium.js` (współdzielone limity profili TC)

---

### 20. `ui/dev-mode.js`
**Odpowiada za:**
- narzędzia deweloperskie: `openDevMode`, `updateDevStatus`, `devLog`,
- symulację wielu sezonów naprzód do testów (`changeDevSeasons`, `runDevSim`,
  `devSimMyMatch`), powrót do gry po symulacji (`devGoToGame` — woła `autoSelectSquad()` z
  `tactics-playercard.js`, `go()`/`updateHdr()`/`renderNews()` z odpowiednio
  `navigation-squad.js`/`news-bootstrap.js`).
- Cały moduł jest zabezpieczony globalną flagą `DEV_MODE` (zdefiniowaną w `core/data.js`;
  `board-goals.js` też ją sprawdza, żeby ukryć/pokazać przycisk wejścia w tryb dev).

**Nie odpowiada za:**
- jakąkolwiek logikę gry produkcyjnej — wyłącznie odczyt i wymuszanie wywołań istniejących
  funkcji innych modułów.

**Można bezpiecznie edytować:**
✔ dowolnie — to narzędzie deweloperskie, nie wpływa na rozgrywkę graczy (o ile `DEV_MODE`
pozostaje `false` w wersji produkcyjnej)

**Zmiany wymagające innych modułów:**
⚠ `core/data.js` (flaga `DEV_MODE` musi być `false` przy publikacji) — poza tym brak; musi
wywoływać istniejące API, nie duplikować logiki

---

### 21. `systems/board-goals.js`
**Odpowiada za:**
- cele zarządu: generowanie (`genBoardGoals`), wybór głównego/dodatkowego celu
  (`selectMainGoal`, `selectOptGoal`), sprawdzanie postępu/spełnienia (`checkBoardGoals` —
  wołane co tydzień z `week-progress.js`), pozycję progową (`getBoardPos`),
- renderowanie zakładki (`boardTab`).

**Nie odpowiada za:**
- konsekwencje niespełnienia celów poza newsem/`addNews()` — nie zwalnia menedżera, nie zmienia
  wyniku meczu.

**Można bezpiecznie edytować:**
✔ typy celów, progi, częstotliwość generowania

**Zmiany wymagające innych modułów:**
⚠ `week-progress.js` (punkt wywołania cyklicznego), `traits-history.js` (historia
osiągnięć/porażek zarządu)

---

### 22. `ui/world-board-render.js`
**Odpowiada za** (dwie niezależne odpowiedzialności renderowania, stąd nazwa złożona):
- **panel "Świat" (inne kluby/ligi)**: `worldTab`, `fillWorld`, `renderWorldClubs`,
  `renderWorldTransfers`, `buildWorldTransferLog` (log transferów AI do wyświetlenia),
- **renderowanie treści panelu "Zarząd"**: `fillBoard`, `renderBoardCele`,
  `renderBoardHistoria` — **uwaga**: logika celów zarządu i przełącznik zakładek (`boardTab`)
  żyją w `systems/board-goals.js`, ale faktyczne renderowanie HTML tych zakładek jest tutaj;
  to świadome (choć nieoczywiste z nazwy pliku) rozdzielenie logiki od renderowania dla tego
  konkretnego panelu.

**Nie odpowiada za:**
- symulację wyników innych klubów (`simOthers` w `match-post.js` — tylko renderuje wynik tej
  symulacji), generowanie/sprawdzanie celów zarządu (`genBoardGoals`/`checkBoardGoals` w
  `board-goals.js`).

**Można bezpiecznie edytować:**
✔ layout tabel/widoków świata gry, prezentację celów i historii zarządu

**Zmiany wymagające innych modułów:**
⚠ `match-post.js` (`updStand`, `simOthers`), `data.js` (lista lig/klubów), `board-goals.js`
(`boardTab` wywołuje `renderBoardCele`/`renderBoardHistoria` zdefiniowane tutaj — zmiana nazw
tych funkcji wymaga edycji w obu plikach)

---

### 23. `systems/traits-history.js`
**Odpowiada za:**
- cechy zawodników: generowanie (`genTraits`) i ich efekt (`getTraitEffect`),
- historię klubu: zakładka (`histTab`), dynastia/legendy (`renderHistDynastia`), rekordy
  (`renderHistRekordy`), sezony (`renderHistSezony`), zawodnicy (`renderHistZawodnicy`),
  szczegóły meczu (`showMatchDetail`, `showSeasonTable`),
- uzupełnianie luk w historii (`fillHistory`, `fillFinance` — nazwa historyczna, dotyczy
  uzupełniania danych finansowych w kontekście historii, nie panelu Finanse).

**Nie odpowiada za:**
- przypisywanie cech w momencie tworzenia zawodnika (`mkPlayer` w `state.js` woła
  `genTraits()`, ale sam obiekt zawodnika tworzy `state.js`), transfery.

**Można bezpiecznie edytować:**
✔ pulę cech i ich opisy/efekty, prezentację historii/rekordów

**Zmiany wymagające innych modułów:**
⚠ `state.js` (`genTraits` wołane z `mkPlayer`), `i18n.js` (opisy cech — `_traitLabel`/
`_traitDesc`, **nie modyfikować struktury `TRAITS`, tylko warstwę wyświetlania**)

---

### 24. `ui/data-center.js`
**Odpowiada za:**
- zbiorczy panel statystyk/wykresów: `dcSub`/`dcRender` (przełączanie podzakładek: wzrost,
  legendy, kadra, klub), `dcRenderWzrost`, `dcRenderLeg` (legendy), `dcRenderKadra`,
  `dcRenderKlub`, oraz komponenty wizualne wykresów: `dcChart`, `dcBars`, `dcBarsDouble`,
  `dcRowBars`, `dcLegend`,
- własne funkcje pomocnicze rankingu legend: `legScore`, `legTrophies`.

**Nie odpowiada za:**
- generowanie danych źródłowych (czyta z `G` i systemów, nie liczy własnej logiki biznesowej).

**Można bezpiecznie edytować:**
✔ zestawy prezentowanych statystyk, typy wykresów, layout

**Zmiany wymagające innych modułów:**
⚠ każdy system, którego dane agreguje (transfers/finance/traits-history/board-goals)
✔ **naprawione**: plik kiedyś definiował własną, nadpisującą kopię `fmtVal()` — usunięta;
`fmtVal()` jest dziś scentralizowana wyłącznie w `core/state.js` (patrz komentarz w tym pliku)

---

### 25. `ui/save-setup-misc.js`
**Odpowiada za:**
- ekran slotów zapisu: `goSaves`, `openSaveModal`, `doSaveSlot`, `doLoad`, `doDel`,
  `resumeGame` — wołają odpowiednio `saveGame`/`loadGame`/`delSave` z `news-bootstrap.js`,
- ekran tworzenia nowej kariery: `goSetup`, `_startNewGameFlow`, `drawRandomClub`,
  `rerollClub`, `selClub`, `editClubName`/`saveClubName` (własna nazwa klubu),
  `startGame()` — **punkt startu nowej gry**, woła `initGame()` (z `news-bootstrap.js`),
  następnie `go('v-game')`, `updateHdr()`,
- tutorial i onboarding: `showGuideModal`, `showBriefingModal`, `toggleTutorial`,
  `tutorialClose`, `tutorialDisable`, `tutorialOpenPanel`.

**Nie odpowiada za:**
- strukturę samego obiektu `G` (definiowaną w `state.js`) ani samą serializację do
  `localStorage` (to robi `saveGame`/`loadGame` w `news-bootstrap.js` — ten plik tylko obsługuje
  UI slotów i woła te funkcje), generowanie zawodników/terminarza (`initGame`/`mkLeaguePlayers`
  w `news-bootstrap.js`).

**Można bezpiecznie edytować:**
✔ format ekranu setupu, listę slotów zapisu, treść tutoriala/briefingu

**Zmiany wymagające innych modułów:**
⚠ `news-bootstrap.js` (`initGame`, `saveGame`, `loadGame`, `delSave`) — **każda zmiana
struktury `G` lub sygnatury `initGame()`** wymaga sprawdzenia zgodności z tym plikiem i ze
starymi zapisami graczy

---

## 4. Przepływ danych

Ogólny kierunek przepływu w typowej interakcji:

```
Akcja gracza (UI)
   → funkcja systemu/silnika (systems/ lub engine/)
      → odczyt/zapis G (core/state.js, core/data.js)
      → efekt uboczny: addNews() / pushTimeline() (ui/news-bootstrap.js, core/state.js)
   → funkcja renderująca (fillX()/renderXTab()) odświeża widok na podstawie nowego G
```

Kluczowa zasada: **UI nigdy nie liczy wyniku samo** — zawsze woła funkcję domenową i renderuje
to, co ta funkcja zapisała w `G`.

---

## 5. Cykl rozgrywki (tydzień)

Punkt wejścia: `advWeek()` w `engine/week-progress.js`. Uproszczony porządek operacji na
podstawie kodu:

1. **Inkrementacja czasu** — `G.week++`, ewentualnie `G.round++`.
2. **Mecz kolejki** (jeśli jest) — rozgrywany przez `match-engine.js::simMatch()`, który na
   koniec woła `match-post.js::postMatch()` (aktualizacja tabeli, oceny, AI innych klubów) oraz
   `addNews()` z wynikiem. Jeśli nie ma meczu w danej kolejce, `simMatch()` sam wywołuje
   `advWeek()`.
3. **Systemy cykliczne** (wewnątrz `advWeek()`), w przybliżonej kolejności:
   - kontuzje (`applyInjury`),
   - finanse tygodniowe (`calcWeeklyIncome`, koszty utrzymania: `acadUpkeep`, `tcUpkeep`),
   - progres skautingu/transferów (`canScoutModeB`, generowanie rynku:
     `genWeeklyMarket`/`genTransferContext`, rozpatrzenie ofert AI: `processAIOffers`),
   - **od tygodnia 4 w sezonie**: `kronUpdateBenchWeeks()` → `kronTrigger()` (Kronika Klubu),
     `fanMemoryTrigger()` (Fan Memory),
   - `checkBoardGoals()` (cele zarządu),
   - `checkCupTrigger()` (czy wchodzimy w rundę pucharu),
   - w oknie zimowym: `aiTransferSeason(true)` (transfery AI).
4. **Odświeżenie widoków** dotkniętych paneli: `fillStadium`, `renderBuyTab`,
   `renderStadModuly`, `renderStadRozbudowa`, aktualizacja nagłówka (`updateHdr`).
5. **Koniec sezonu** — przejście do `season-summary.js` i reset liczników tygodniowych/sezonowych
   (poza zakresem tego dokumentu — patrz punkt „miejsca wymagające ostrożności”).

---

## 6. Zasady rozwoju — gdzie dodawać nowe funkcje

| Chcę dodać… | Gdzie |
|---|---|
| Nowy wzór ekonomiczny (wycena, pensja) | `core/state.js` |
| Nowe dane referencyjne klubu/ligi | `core/data.js` |
| Nowy tekst w UI (dowolny język) | `core/i18n.js` — **zawsze `T.pl` + `T.en` razem** |
| Nowy typ wydarzenia fabularnego | `engine/kronika.js` + wpis w `i18n.js` (+ ew. `KRON_TIMELINE_WORTHY` w `state.js`) |
| Nową mechanikę wpływającą na wynik meczu | `engine/match-engine.js` |
| Nowy krok po meczu (kontrakty, AI, oceny) | `engine/match-post.js` |
| Nowy hook "co tydzień" | `engine/week-progress.js`, wołający funkcję zdefiniowaną w odpowiednim systemie |
| Nową funkcję rynku transferowego | `systems/transfers.js` |
| Nowy element treningu/stadionu | `systems/training-stadium.js` |
| Nowy panel finansowy | `systems/finance.js` |
| Nową mechanikę akademii | `systems/academy.js` |
| Nowy typ celu zarządu | `systems/board-goals.js` |
| Nową cechę zawodnika lub sekcję historii | `systems/traits-history.js` |
| Nowy ekran/nawigację | odpowiedni plik w `ui/` — bez logiki biznesowej w środku |
| Nowy generator grafiki pixel-art | `engine/pixelart.js` |
| Nowy typ newsa/filtr newsów | `ui/news-bootstrap.js` |
| Nową funkcję pomocniczą składu (np. inny sposób liczenia starterów) | `ui/news-bootstrap.js` (`myPl`/`mySt`/`formationLimits`) |
| Nowe ustawienie taktyczne lub pole karty zawodnika | `ui/tactics-playercard.js` |
| Nową zakładkę w modalu klubu | `ui/club-modal.js` |
| Nowy wykres/statystykę w Centrum Danych | `ui/data-center.js` |
| Nowy krok onboardingu/tutorialu lub ekranu setupu | `ui/save-setup-misc.js` |
| Nową sekcję podsumowania sezonu lub tabeli lig | `ui/season-summary.js` |
| Nowe narzędzie deweloperskie/testowe | `ui/dev-mode.js` (pamiętać o `DEV_MODE`) |

**Ogólna reguła:** jeśli nowa funkcja *liczy* coś (wynik, cenę, prawdopodobieństwo) — trafia do
`engine/` lub `systems/`. Jeśli tylko *pokazuje* coś, co już policzono — trafia do `ui/`.

---

## 7. Miejsca wymagające szczególnej ostrożności

- **`engine/week-progress.js` (`advWeek`)** — centralny punkt integracji niemal wszystkich
  systemów. Zmiana kolejności wywołań lub warunków (`G.week>=4`, `G.seasonEnded`) może cicho
  zepsuć wiele niepowiązanych mechanik naraz. Każda zmiana tutaj wymaga wypisania listy
  systemów, które są wołane w tej funkcji (zgodnie z regułą nr 7 z `CLAUDE.md`).
- **`ui/news-bootstrap.js` (`addNews`)** — wołane z każdego niemal modułu (>150 wywołań w
  całym projekcie). Zmiana sygnatury funkcji jest zmianą globalną.
- **`core/state.js` (`G`, `ovr`, `calcValue*`, `calcSalary`)** — fundament ekonomii gry.
  Modyfikacja wpływa jednocześnie na `transfers.js`, `finance.js`, `match-post.js` (AI),
  `academy.js`.
- **`core/i18n.js` (`T`, `t()`)** — zmiana struktury słownika (np. zagnieżdżenie kluczy) wymaga
  przejrzenia wszystkich miejsc wywołujących `t('...')` w całym projekcie.
- **`engine/kronika.js`** — 91 wywołań `addNews()` z tekstem **jeszcze nie w pełni
  zinternacjonalizowanym** (świadomy dług techniczny). Dopóki nie zostanie domknięty, nowe
  eventy tutaj muszą i tak być pisane dwujęzycznie od razu (zasada bilingual-from-start), by
  dług się nie powiększał.
- **`systems/transfers.js`** — największy plik systemowy (1372 linie), łączy logikę z
  renderowaniem własnej zakładki. Zmiany tu łatwo niechcący dotykają zarówno ekonomii, jak i UI
  jednocześnie — sprawdzać oba aspekty przy każdej edycji.
- **Struktura obiektu `G`** — każda zmiana kształtu `G` (nowe/usunięte pola) musi być
  zweryfikowana pod kątem zgodności z zapisami gry (`ui/save-setup-misc.js`), inaczej stare
  save'y graczy mogą się wysypać przy wczytywaniu.
- **`ui/news-bootstrap.js`** — poza newsami trzyma też inicjalizację nowej gry (`initGame`),
  zapis/odczyt (`saveGame`/`loadGame`) i kluczowe funkcje pomocnicze składu (`myPl`, `mySt`,
  `formationLimits`) używane przez cały projekt. Nazwa pliku nie oddaje już w pełni jego
  zakresu odpowiedzialności — przy dużych zmianach traktować go jak fundament, nie jak
  "tylko newsy".
- **Panel "Zarząd" jest rozdzielony między dwa pliki**: logika i przełącznik zakładek
  (`boardTab`, `checkBoardGoals`, `genBoardGoals`) są w `systems/board-goals.js`, ale faktyczne
  renderowanie HTML (`renderBoardCele`, `renderBoardHistoria`, `fillBoard`) — w
  `ui/world-board-render.js`. Zmiana nazwy którejkolwiek z tych funkcji renderujących wymaga
  edycji w obu plikach jednocześnie.
- **Zduplikowane definicje funkcji o tej samej nazwie** — w JS bez modułów ostatnia
  zdefiniowana wersja *w kolejności ładowania skryptów* nadpisuje poprzednie. Znane przypadki
  w projekcie (data ostatniej weryfikacji: sesja architektury, lipiec 2026):
  - `trTab()` — w `ui/navigation-squad.js` **i** `systems/transfers.js` → wygrywa
    `transfers.js` (ładowany później); wersja z `navigation-squad.js` jest martwym kodem.
  - `signTalent()` — dwie definicje **w tym samym pliku** `systems/transfers.js`, z różną
    logiką limitu talentów → wygrywa druga (późniejsza w pliku).
  - `setLine()` i `setInstr()` — dwie definicje w tym samym pliku
    `ui/tactics-playercard.js` → wygrywa druga.
  - `advWeekPrep()` — dwie definicje w tym samym pliku `ui/navigation-squad.js`; pierwsza
    wygląda na źle nazwany fragment kodu niezwiązany z logiką przedsezonową (odwołuje się do
    nieistniejącej zmiennej `n`) → wygrywa druga, właściwa.
  - `renderStadModuly()` — dwie definicje w tym samym pliku `systems/training-stadium.js`;
    druga to jednolinijkowy alias na `_renderStadModulyInRozb()` → wygrywa druga, pierwsza
    (pełna implementacja) jest martwym kodem.
  - `fmtVal()` — **naprawione**, duplikat w `ui/data-center.js` usunięty; scentralizowana
    wyłącznie w `core/state.js`. Zobacz też `fmtMln()` (tamże) — wariant tylko-mln/k bez
    trzeciego progu "gołych euro", używany w tabelach porównawczych (np. `worldTab` →
    Aktywne Kluby), gdzie adaptacyjne trzy-progowe `fmtVal()` dawało niespójne jednostki
    między wierszami przy porównywaniu klubów z różnych lig.

  Żadna z pozostałych duplikacji nie powoduje dziś widocznego błędu (gra działa), ale są to realne
  "pułapki" przy przyszłej edycji: zmiana w "niewłaściwej" (przegranej) kopii nie da żadnego
  efektu w grze. Warto je uporządkować przy okazji pracy nad danym plikiem, zgodnie z zasadą
  "nie duplikuj funkcji" z `CLAUDE.md`.

---

## 8. Mapa zależności

Poniżej realne łańcuchy wywołań wyprowadzone z kodu (nie założenia).

### Cykl tygodnia
```
week-progress.js (advWeek)
  ├─→ core/state.js         (kontuzje, wyceny, pushTimeline)
  ├─→ core/data.js          (calcWeeklyIncome)
  ├─→ systems/transfers.js  (genWeeklyMarket, processAIOffers, canScoutModeB)
  ├─→ systems/academy.js    (acadUpkeep)
  ├─→ systems/training-stadium.js (tcUpkeep, fillStadium, renderStadModuly/Rozbudowa)
  ├─→ engine/kronika.js     (kronUpdateBenchWeeks, kronTrigger, fanMemoryTrigger)
  ├─→ systems/board-goals.js (checkBoardGoals)
  ├─→ engine/cup-engine.js  (checkCupTrigger)
  ├─→ engine/match-post.js  (aiTransferSeason — okno zimowe)
  └─→ ui/news-bootstrap.js  (addNews — w wielu z powyższych gałęzi)
```

### Cykl meczu
```
engine/match-engine.js (simMatch)
  ├─→ core/state.js         (odczyt G, mySt(), formationLimits())
  ├─→ engine/match-post.js  (postMatch → updStand, calcFinalRatings, simOthers)
  │      └─→ engine/cup-engine.js (jeśli mecz pucharowy — resolveCupMyMatch)
  ├─→ ui/news-bootstrap.js  (addNews z wynikiem)
  └─→ engine/week-progress.js (advWeek — jeśli brak meczu w kolejce)
```

### Transfery
```
systems/transfers.js
  ├─→ core/state.js   (calcValue, calcValueDynamic, calcSalary, ovr)
  ├─→ core/data.js    (getUniqueName przy generowaniu talentów/rynku)
  └─→ ui/news-bootstrap.js (addNews przy każdej transakcji)

engine/match-post.js (aiTransferPlayer/aiTransferSeason)
  └─→ core/state.js   (te same wzory wyceny — współdzielone z transfers.js)
```

### i18n (przekrojowo, wszystkie moduły)
```
core/i18n.js (T, t())
  ← odczytywane przez: praktycznie każdy plik ui/ i systems/, oraz engine/kronika.js
  → applyLang() odświeża [data-i18n] + ręczne _setTxt() po zmianie języka
```

### Kronika / oś czasu / newsy (fabuła)
```
engine/week-progress.js
  → engine/kronika.js (kronTrigger, fanMemoryTrigger)
      → core/state.js (pushTimeline — jeśli event na liście KRON_TIMELINE_WORTHY)
      → ui/news-bootstrap.js (addNews — treść eventu)
```

### Start nowej gry
```
ui/save-setup-misc.js (startGame)
  → ui/news-bootstrap.js (initGame → buildSchedule, mkLeaguePlayers,
                           assignJerseyNumbers, assignAITactics)
  → ui/navigation-squad.js (go, updateHdr)
```

### Karta zawodnika — wejścia z różnych miejsc (v223: jeden mechanizm powrotu)
```
~20 miejsc w całym projekcie (skład, transfery, taktyka, modal klubu, Centrum Danych,
Kronika/historia, podsumowanie sezonu, szczegóły meczu, akademia, ranking treningowy...)
  → ui/news-bootstrap.js (showById) — LUB bezpośrednio showPlayer(p)
      → ui/tactics-playercard.js (showPlayer)
          → _captureReturnPoint() — zapisuje window._playerReturnTo (panel LUB modal + kontekst),
            tylko przy pierwszym otwarciu (nie przy odświeżeniu już otwartej karty)
  ← ui/navigation-squad.js (closePanel('p-player')) czyta window._playerReturnTo
    i przywraca dokładnie ten panel/modal, z którego przyszedł gracz
```

### Panel "Zarząd" (logika ↔ render rozdzielone między pliki)
```
systems/board-goals.js (boardTab, checkBoardGoals, genBoardGoals)
  → ui/world-board-render.js (renderBoardCele, renderBoardHistoria, fillBoard)
```

### Panel "Świat" (inne ligi/kluby)
```
ui/world-board-render.js (worldTab, fillWorld)
  → engine/match-post.js (dane z updStand/simOthers — tylko odczyt do prezentacji)
  → core/data.js (lista lig/klubów)
```

### Tryb deweloperski
```
ui/dev-mode.js (devGoToGame, runDevSim)
  → ui/tactics-playercard.js (autoSelectSquad)
  → ui/navigation-squad.js (go, updateHdr)
  → ui/news-bootstrap.js (renderNews)
  (bramkowane globalną flagą DEV_MODE z core/data.js)
```
