# AUDYT: Stabilność OVR świata AI (100+ sezonów)

> Dokument diagnostyczny. Data: 14.07.2026.
>
> **STATUS: część propozycji WDROŻONA, WERYFIKACJA POWDROŻENIOWA WYKAZAŁA, ŻE POPRAWKA NIE
> DZIAŁA ZGODNIE Z ZAMIERZENIEM** — patrz sekcja 9. Po akceptacji sekcji 6/8 wdrożono punkty 4.2
> (reputacja→jakość juniora), 4.5 (bonus mistrzowski + tłumienie piętrzenia, sekcja 7.7 pkt. 1)
> i 4.6 (doprecyzowanie `stabilny`) — pełny opis zmian: `CHANGELOG.md`, 14.07.2026, pkt. 3.
> **Przebieg weryfikacyjny (sekcja 9) pokazał, że tłumienie piętrzenia NIE zmniejszyło wzrostu
> OVR świata — w 5 z 8 lig wzrost jest teraz WIĘKSZY niż przed poprawką**, a jedyna realna
> przed-wdrożeniowa awaria korytarza (L8, sezon 10) pozostała bez zmian. Decyzja o korekcie
> czeka na Ciebie, patrz 9.3. Świadomie NIE wdrożono: mechanizmu różnicującego rozwój
> rdzeń/głębia składu (7.7 pkt. 2 — brak zmierzonego wzoru) i żadnej zmiany dla L1/L8 (7.7 pkt.
> 3 — wymaga weryfikacji `runDevSim()` w prawdziwej grze). Reszta dokumentu poniżej to oryginalny
> raport diagnostyczny, zostawiony bez zmian jako zapis procesu.

---

## 0. Kontekst, którego nie było w poleceniu: to nie jest nowy temat

Zanim przejdę do odpowiedzi — ważne odkrycie z samego `CHANGELOG.md`: **ten dokładny problem
jest już w trakcie wielodniowej diagnozy** (wpisy 11.07 → 14.07.2026), tą samą metodą, o którą
prosisz (symulacja Node, prawdziwy kod gry w `vm.Context`, pomiar przed decyzją). Stan na koniec
sesji 14.07 (dosłowny cytat z `CHANGELOG.md`, sekcja "DO ZROBIENIA — jutro/następna sesja"):

- Większość lig (III–VIII) po poprawkach z 13–14.07 trzyma się blisko poziomu sezonu 1 w
  symulacji 40-sezonowej (odchylenia rzędu -1 do +0,1 pkt, w granicach szumu).
- **Premier Division i I Liga zostają ok. 6-8 pkt OVR poniżej sezonu 1** nawet po poprawkach —
  wpisana hipoteza (niezweryfikowana): próg wieku emerytury i tempo starzenia (`aiSeasonalRefresh`,
  `aiRenewContracts`) są identyczne dla wszystkich lig, więc elicie (potrzebującej więcej sezonów
  rozwoju do OVR 85+) brakuje czasu zanim trafi na emeryturę.
- Skrypt symulacyjny poprzedniej sesji **nie został zapisany w repo** (zgodnie z zasadą projektu
  o nietworzeniu zbędnych plików) — trzeba było odtworzyć go od nowa na potrzeby tego audytu.

Twoje pytanie z dziś jest w praktyce **rozszerzeniem tamtego zgłoszenia** o twardy, mierzalny
korytarz (-1%/10 sezonów, -3%/50 sezonów) oraz o zupełnie nowy wątek: podwójną rolę reputacji
(dziś: przychody/cele zarządu/tempo rozwoju — **nie** jakość juniorów), bonus mistrzowski i
archetypy transferowe. Część z tego już częściowo istnieje w kodzie (patrz niżej) — nie
zaczynamy od zera.

---

## 1. Gdzie dziś żyje każdy mechanizm (z lokalizacją w kodzie)

### 1.1 Reputacja — pełny obraz po przebudowie z 10.07.2026

Reputacja **nie ma dziś jednego pliku** — to rozproszony system z jednym centralnym mutatorem:

- **Zapis/zmiana wartości**: `G.reputation` (gracz) / `club.ai.reputation` (AI) — zwykłe pole
  liczbowe, bez górnego limitu (usunięty 10.07.2026). Centralny mutator dla gracza:
  `changeReputation(delta, reason)` w `ui/news-bootstrap.js:49` (loguje do `G.repHistory`, jedyne
  miejsce, które powinno zmieniać `G.reputation` — ale w praktyce ~50 miejsc w `kronika.js` wciąż
  robi `G.reputation=(G.reputation||30)+N` bezpośrednio, z pominięciem historii/logowania — to
  świadomy, znany dług, nie coś do naprawy w tym zadaniu).
- **Krzywa nasycająca**: `repCurve(rep,base,range,K)` w `core/data.js:238` — asymptotyczne
  zbliżanie się do `base+range`, nigdy sufitu. Używana w 4 miejscach `calcWeeklyIncome()`
  (`core/data.js:243`, sponsorzy/reklamy/kontrakty/frekwencja) i w `systems/finance.js:356,366,397`
  (kontrakty sponsorskie, wycena sprzedaży klubu?).
- **Baza per liga (AI) — JUŻ ISTNIEJE**: `initClubAI(club, leagueLevel)` w
  `engine/match-post.js:772`: `reputation:Math.round(10+(8-leagueLevel)*30+Math.random()*60)`.
  Liga 8 (VII Liga, najniższa) → 10-70. Liga 1 (Premier Division) → 220-280. **To dokładnie to,
  o co prosisz w punkcie "baza reputacji per liga" — już działa dla klubów AI**, tylko nikt go
  jeszcze nie podpiął do jakości juniorów (patrz 1.3). Gracz startuje zawsze z `G.reputation:30`
  ustawionym na sztywno w `initGame()` (`ui/news-bootstrap.js:507`) — nieszkodliwe, bo gracz
  zawsze zaczyna w lidze 8 (`startLeague` w `save-setup-misc.js` nigdzie nie jest przekazywane
  inną wartością), więc 30 mieści się w tym samym paśmie co AI ligi 8.
- **Wzrost**: mecz wygrany gracza (+1, `dev-mode.js`/mecz na żywo), awans (AI: +50,
  `season-summary.js:561`), spadek (AI: -30, `:596`), cel zarządu (AI: +45 tytuł/awans, +15
  reszta — `match-post.js:1321`; gracz: `board-goals.js` reward.rep, skala 5-120 zależnie od
  trudności), Puchar (AI: +50 zwycięzca / niżej finalista — `cup-engine.js:267-269`; gracz: cash,
  nie rep — `grantCupReward()`), ~50 zdarzeń Kroniki Klubu (gracz, `kronika.js`, wartości -20..+25
  per zdarzenie), klub typu `bogaty` dostaje dodatkowo +2/sezon niezależnie od wyników
  (`match-post.js:1326` — nie jest to udokumentowane jako zamierzone, ale nieszkodliwe).
- **Dzisiejsze zastosowania reputacji (do zachowania w całości)**:
  1. `calcWeeklyIncome()` — mnożnik przychodu (sponsorzy/reklamy/kontrakty/frekwencja),
     `core/data.js`.
  2. `aiSeasonalRefresh()` — `_repTierR` (0.95×–1.10×) wchodzi w `clubDevMult`, czyli **reputacja
     już dziś wpływa na tempo treningu/starzenia AI** (ale nie na jakość nowo wygenerowanego
     juniora) — `engine/kronika.js:2130-2134`.
  3. Cel zarządu (AI i gracz) — nagroda w reputacji zamiast/obok pieniędzy.
  4. Wymóg poziomu akademii gracza (`ACADEMY.levels[i].req` — 100/250/500/800 rep) —
     `systems/academy.js` + `core/data.js`.
  5. Mnożnik ceny sprzedaży zawodnika (`calcDynamicValueMult`, `core/state.js:71-76`).
  6. Sortowanie/wyświetlanie w zakładce Świat, karcie klubu, Centrum Danych — czysto
     prezentacyjne.
  - **Nowa funkcja, o którą prosisz (jakość juniora), dziś NIE ISTNIEJE nigdzie** — patrz 1.3.

### 1.2 Emerytury

Dwa **osobne, symetryczne** mechanizmy (celowo rozdzielone po naprawie z 12.07.2026 —
wcześniej AI miało przez pomyłkę podwójną loterię, patrz `CHANGELOG.md` pkt 14, 12.07):

- **Gracz**: `ui/season-summary.js:367` (`startNewSeason()`), próg wieku:
  `{32:.10,33:.10,34:.25,35:.25,36:.50,37:.50,38:.90}`, powyżej 38: 0.95. Nigdy przed 32.
- **AI**: `engine/match-post.js:575` (`aiRenewContracts()`), próg wieku:
  `{32:.05,33:.10,34:.20,35:.35,36:.55,37:.70,38:.90}`, powyżej 38: 0.95. Nigdy przed 32.
- Oba progi to **stopniowana tabela, nie sztywny próg** — narasta płynnie 32→38, więc nie ma
  dosłownego "urwiska pokoleniowego" w jednym roczniku. Rozrzut/losowość: rzut kostką co sezon
  per zawodnik, więc naturalnie rozkłada się w czasie (nie każdy 35-latek odchodzi jednocześnie).
  Drobna, niewyjaśniona w kodzie asymetria: gracz ma wyższe szanse w 32-33 (0.10 vs 0.05 u AI) —
  nieszkodliwe, ale warto ujednolicić przy okazji, jeśli i tak dotykamy tego kodu.
- Emeryci trafiają do `G.retiredPlayers` (limit 200 najnowszych), `clubId=0`,
  `status='retired'` — zgodne z zasadą zamkniętego świata w `js/CLAUDE.md`.

### 1.3 Generowanie juniorów — DWA niezależne generatory, ŻADEN nie używa reputacji

- **Akademia gracza** (`systems/academy.js:366`, `generateProspects()`): `baseOvr=r(10,25)`
  (stały, niezależny od ligi/reputacji), `potential=min(acad.maxPot, baseOvr+r(20,acad.maxPot-baseOvr))`.
  Jedyny pośredni wpływ reputacji: próg `rep>=100/250/500/800` żeby w ogóle odblokować wyższy
  poziom akademii (`ACADEMY.levels[i].req`, `acadCost`/`acadUpkeep` skalowane ligą, nie
  reputacją). Reputacja **nie wpływa na OVR/potencjał konkretnego juniora**, tylko pośrednio
  poprzez to, czy stać cię na wyższy poziom budynku.
- **Juniorzy klubów AI** (`engine/match-post.js` w `aiTransferSeason()`, ~linia 1218-1273):
  `juniorOvr=r(_juniorFloor,_juniorCeil)` gdzie `_juniorFloor=max(lgMin-3, avgOvr-25)`,
  `_juniorCeil=max(lgMin+10, avgOvr-10)` — **zależy od poziomu ligi i średniego OVR wyjściowej
  jedenastki KLUBU**, ale nigdzie od `club.ai.reputation`. Potencjał: `min(LEAGUE_POT[lvl].max,
  ovr(junior)+r(10,18))` — też bez reputacji. Liczba juniorów na sezon: `def.juniors` z
  `AI_TYPES` (np. `akademia:[3,5]`, `bogaty:[0,0]`), +1 górny limit dla lig 1-2 typu
  `akademia`/`sprzedajacy`.
- **Wniosek**: to dokładnie ta luka, o której piszesz w założeniach — mechanizm do dobudowania,
  nie do poprawienia (nic dziś nie jest "zepsute" w generowaniu juniorów, po prostu reputacja
  nie ma tam żadnego wejścia).

### 1.4 Archetypy klubów AI — JUŻ ISTNIEJĄ, częściowo pokrywają Twoją listę

`AI_TYPES` w `engine/match-post.js:731-756`, 4 typy, wybierane losowo w `initClubAI()` z lekką
wagą (typ `bogaty` wykluczony w ligach 5-8):

| Typ | Ikona | `buyRate`/`sellRate` | `juniors` | `maxBuyAge` | `budgetMult` | `devMult` | Odpowiednik z Twojej listy |
|---|---|---|---|---|---|---|---|
| `akademia` | 🎓 | 0.3 / 0.4 | [3,5] | 23 | 0.7 | 1.3 | młodzieżowy |
| `sprzedajacy` | 💸 | 0.7 / 0.8 | [1,2] | 27 | 1.0 | 1.15 | handlowy/spekulacyjny |
| `bogaty` | 💰 | 0.9 / 0.2 | [0,0] | 32 | 2.0 | 0.85 | ambitny/zamożny |
| `stabilny` | 🛡️ | 0.3 / 0.25 | [1,1] | 30 | 1.1 | 1.0 | skromny (najbliższy) |

Każdy typ ma też własny `minUpgradeDelta`, `maxAnnualSignings/Sells`, `coreProtectSize`,
`renewChance` — realnie różne zachowanie transferowe, egzekwowane przez `aiEvaluateSale`/
`aiEvaluateSigning`/`aiSigningCap`/`aiSellingCap`/`aiCoreProtect` (wszystko `match-post.js`).
Dodatkowo `LEAGUE_AI_TUNING` (`core/data.js:184`) skaluje "szczelność" decyzji per liga
(`churnMult`, `strictnessMult`) niezależnie od typu klubu.

**Brakujący, wyraźnie osobny typ "stawiający na doświadczenie"** — dziś najbliżej jest
`stabilny`/`bogaty` (wyższy `maxBuyAge`, niski nabór juniorów), ale żaden typ nie ma explicite
"kupuj tylko dojrzałych, ignoruj młodzież" jako tożsamości. Realny brak względem Twojej listy
5 typów, reszta (4/5) już istnieje i działa.

### 1.5 Bonus za mistrzostwo/puchar — częściowo istnieje, ale pośrednio i tylko dla Pucharu

- **Puchar (AI)**: `cup-engine.js:267` — zwycięzca +50 rep, finalista mniej. To wchodzi do
  `aiSeasonalRefresh()`'s `_successMultR` (`kronika.js:2129-2133`): wygrana Pucharu +0.15 do
  `clubDevMult`, finał +0.08, **górna połowa tabeli ligowej** (nie tylko mistrz) +0.10 —
  realnie przyspiesza rozwój/łagodzi starzenie zawodników klubu **przez cały następny sezon**.
  To już jest namiastka Twojego "bonusu na cały kolejny sezon", tylko nienazwana wprost i
  nieróżnicująca mistrza ligi od zwykłego miejsca w górnej połowie tabeli.
- **Mistrzostwo ligi (AI)**: dziś tylko news (`addWorldNewsEvent('champion',...)`,
  `season-summary.js:489`) + to, że mistrz i tak zwykle należy do "górnej połowy" bonusu wyżej
  (+0.10, nieodróżnialne od miejsca np. 6.). **Brak dedykowanego, wyraźnie większego bonusu za
  SAM tytuł mistrzowski** — to realna luka względem Twojego wymagania.
- **Cel zarządu** (AI): jeśli celem sezonu było `title`/`promotion` i został spełniony → +45 rep
  (`match-post.js:1321`) — ale to tylko jeśli klub akurat miał taki cel wylosowany, nie
  gwarantowane dla każdego mistrza.
- **Gracz**: Puchar daje gotówkę (`grantCupReward`), mistrzostwo — nic specjalnego poza tym, co
  już wynika z `board-goals.js` (jeśli akurat cel zarządu to obejmował) i newsów Kroniki.

---

## 2. Dane z symulacji wieloseznowej

### 2.1 Metoda i ograniczenia harnessu (przeczytaj przed zaufaniem liczbom)

Harness Node.js — prawdziwy, niezmodyfikowany kod gry (`core/data.js`, `core/state.js`,
`engine/kronika.js`, `engine/match-post.js`) załadowany w `vm.Context` ze stubami DOM,
syntetyczny świat 8 lig × 10 klubów, 100 sezonów, 2 przebiegi uśrednione. Wszystkie tabele
(`LEAGUE_OVR`, `LEAGUE_POT`, `AI_TYPES`, `SQUAD_SIZE`, `POS_QUOTA`) i funkcje (`ovr`, `mkPlayer`,
`calcPotential`, `initClubAI`, `aiRenewContracts`, `aiSeasonalRefresh`, `aiTransferSeason`) to
prawdziwy kod, nietknięty.

**Trzy uproszczenia harnessu, które trzeba znać przy interpretacji wyników — wszystkie działają
w stronę PESYMISTYCZNĄ (zaniżają wynik względem prawdziwej gry), nie w stronę optymistyczną:**

1. **Brak silnika Pucharu** (`engine/cup-engine.js` nie był ładowany) → `G.cupHistory` zawsze
   puste → bonus `_wonCupR`/`_finalCupR` do `clubDevMult` w `aiSeasonalRefresh()` (patrz 1.5)
   **nigdy się nie uruchamia**. To realnie usuwa ścieżkę wzrostu, która w prawdziwej grze
   premiuje akurat najlepsze kluby — zaniża wynik najmocniej dla lig 1-2, gdzie kluby typu
   `bogaty`/`akademia` częściej wygrywają Puchar.
2. **Brak zimowego okna transferowego** (tylko letnie `aiTransferSeason(false)`) → z grubsza
   połowa realnego wolumenu transferów AI.
3. **10 klubów/ligę zamiast 16, przy tej samej regule awans/spadek (top 2 / dół 2)** → 20%
   składu ligi zmienia się między poziomami co sezon zamiast ~12,5% w produkcji — to sztucznie
   wzmacnia szum wynikający z bonusów/kar za awans-spadek przy każdej zmianie ligi.

Reszta silnika (starzenie, emerytury, generowanie juniorów, limity pozycji) to dokładnie ten sam
kod co w grze. **Traktuj poniższe liczby jako dolną granicę (pesymistyczny wariant) prawdziwego
zjawiska, nie jako dokładną wartość produkcyjną** — ale sam KIERUNEK i KSZTAŁT problemu (patrz
2.3) pokrywa się z tym, co już wcześniej zmierzono w prawdziwszej symulacji (`CHANGELOG.md`,
14.07.2026), co jest sensownym potwierdzeniem, że sygnał jest realny, nie tylko artefakt
uproszczonego harnessu.

### 2.2 Wyniki: dryf względem sezonu 1, per liga

Legenda progów: **PASS** = mieści się w korytarzu (max -1% do sezonu 10, max -3% do sezonu 50
względem punktu startowego); **FAIL** = przekracza próg.

| Liga | OVR S1 (kadra) | `avgSquadOvr` dryf S10 / S50 | Wynik (kadra) | `avgXIOvr` dryf S10 / S50 | Wynik (XI) |
|---|---|---|---|---|---|
| L1 (Premier Division) | 75,97 | −0,44% / **−9,32%** | PASS / **FAIL** | +8,57% / −5,69% | PASS / **FAIL** |
| L2 (I Liga) | 63,63 | +2,46% / **−3,19%** | PASS / **FAIL** | +14,56% / +4,96% | PASS / PASS |
| L3 (II Liga) | 56,01 | +0,27% / −0,60% | PASS / PASS | +12,56% / +8,72% | PASS / PASS |
| L4 (III Liga) | 49,29 | +1,95% / +3,48% | PASS / PASS | +14,03% / +16,61% | PASS / PASS |
| L5 (IV Liga) | 44,54 | **−4,36%** / −2,06% | **FAIL** / PASS | +7,54% / +11,54% | PASS / PASS |
| L6 (V Liga) | 38,64 | **−3,66%** / **−4,93%** | **FAIL** / **FAIL** | +10,33% / +11,18% | PASS / PASS |
| L7 (VI Liga) | 31,20 | −0,94% / −0,54% | PASS / PASS | +16,05% / +17,99% | PASS / PASS |
| L8 (VII Liga, najniższa) | 24,50 | **−8,42%** / **−6,94%** | **FAIL** / **FAIL** | −10,81% (S25, najgorzej) / **−6,94%** | **FAIL** / **FAIL** |

Populacja świata: S1=1920 → S10=2055 → S25=2016 → S50=2065 → S100=2046 — **stabilna, bez
kolapsu i bez niekontrolowanego wzrostu** (bilans junior/emerytura trzyma się w ryzach, zgodnie
z poprawkami z 12.07.2026).

### 2.3 Interpretacja

Wyraźny, spójny wzorzec: **`avgXIOvr` (top-11 wg OVR) mieści się w korytarzu w 7 z 8 lig** — sam
czubek składu (realni starterzy) rośnie mocno i się trzyma. **`avgSquadOvr` (pełna ~24-osobowa
kadra) łamie korytarz w 5 z 8 lig (L1, L2, L5, L6, L8)** — to **głębia/ławka** systematycznie
traci OVR, podczas gdy czołówka składu jest w porządku. To dokładnie ten sam kształt problemu,
który już wcześniej opisano w `CHANGELOG.md` (14.07.2026, pkt 2: "STARTERZY trzymają się blisko
poziomu sezonu 1, ale ŁAWKA/głębia składu spada wszędzie o 9-11,5 pkt") — czyli mimo uproszczeń
harnessu ten sam jakościowy defekt wychodzi niezależnie, co jest sensownym potwierdzeniem, że to
realne zjawisko w grze, a nie artefakt tej konkretnej symulacji.

Dodatkowy, nowy sygnał względem tego, co było już wiadome: **problem nie jest ograniczony do
góry piramidy lig (L1/L2)** — najgorszy wynik w całej tabeli to **L8 (najniższa liga)**, gdzie
zarówno kadra, jak i XI łamią korytarz na obu progach czasowych. To może być efekt harnessu
(mniejsza liga = mniej klubów jako źródło realokacji przy wygasłych kontraktach/wymianie
głębi) albo realne zjawisko — **do zweryfikowania w wierniejszej symulacji** (z Pucharem i
oknem zimowym) przed jakąkolwiek decyzją o zmianie mechaniki dla L7/L8.

**Wniosek do decyzji**: nie proponuję jeszcze konkretnych wartości liczbowych do wdrożenia (patrz
sekcja 4.3) — te dane pokazują KIERUNEK i SKALĘ problemu (głębia składu, nie czubek; nasilone na
obu końcach piramidy lig, nie tylko na górze), ale przez pesymistyczne obciążenie harnessu
(brak Pucharu, brak zimowego okna) rekomenduję **jeden dodatkowy przebieg symulacji z pełnym
`engine/cup-engine.js` i oknem zimowym przed ustaleniem ostatecznych progów interwencji** —
szczególnie dla L1/L2, gdzie brakujący bonus pucharowy najbardziej zaniża wynik.

---

## 3. Odpowiedzi na pytania diagnostyczne z prompta

**Q7 — jaka metryka OVR jest właściwa do śledzenia?**

Rekomendacja: **śledzić obie równolegle — średnią całej kadry ORAZ średnią wyjściowej
jedenastki (proxy: top-11 wg OVR)**, per liga, nie jedną łączną liczbę. Uzasadnienie wprost z
`CHANGELOG.md` (14.07.2026, pkt 2): to już był realny problem — cała reszta świata "naprawiła
się" (wróciła do poziomu sezonu 1), ale okazało się, że to była średnia CAŁEJ kadry; rozbicie na
starterów-vs-ławkę pokazało, że w L1/L2 STARTERZY trzymali poziom, a ŁAWKA/głębia spadała o
9-11,5 pkt — niewidoczne w jednej łącznej średniej. Średnia ważona minutami byłaby jeszcze
dokładniejsza (nagradza realnie grających, nie martwą głębię), ale wymaga śledzenia minut w
symulacji uproszczonej (harness bez pełnego silnika meczowego nie ma realnych minut per
zawodnik) — praktyczny kompromis to top-11 wg OVR jako przybliżenie realnej jedenastki.

**Q8 — pełna mapa powiązań wpływających na cel stabilnego OVR**

Poza plikami z sekcji startowej prompta, w toku analizy potwierdzone/wykluczone:

| System | Plik | Wpływ na OVR świata | Uwaga |
|---|---|---|---|
| Starzenie/rozwój AI | `engine/kronika.js` (`aiSeasonalRefresh`) | **Główny mechanizm** — jedyne miejsce, gdzie atrybuty AI rosną/maleją sezonowo | `clubDevMult` już łączy typ klubu × reputację × sukces sezonu |
| Emerytury AI | `engine/match-post.js` (`aiRenewContracts`) | **Główny odpływ** | Próg wieku, patrz 1.2 |
| Emerytury gracza | `ui/season-summary.js` (`startNewSeason`) | Tylko klub gracza, nie wpływa na świat AI | — |
| Juniorzy AI | `engine/match-post.js` (`aiTransferSeason`) | **Główny dopływ** | Patrz 1.3 |
| Transfery AI↔AI | `engine/match-post.js` (`aiEvaluateSale/Signing`, `aiSignReplacement`) | Redystrybucja, nie zmienia sumy OVR świata, ale zmienia rozkład per liga (mocne kluby vs słabe) | Ograniczone limitami sezonowymi (`aiSigningCap`/`aiSellingCap`) |
| Wygasłe kontrakty AI | `engine/match-post.js` (`aiRenewContracts`, krok 3) | Realokacja między klubami, przechodzi przez te same limity od 12.07 | — |
| Kontuzje | `ui/news-bootstrap.js` (`applyInjury`), wyzwalane w `engine/week-progress.js` | **Sprawdzone i wykluczone dla świata AI**: pętla wyzwalająca kontuzje/zmęczenie/trening (`week-progress.js` ok. linii 171) jest w całości `myPl().forEach(...)` — tylko klub gracza. AI nigdy nie dostaje kontuzji obniżającej `phy` na stałe. | Realny, trwały efekt (`phyDrop` do -3) istnieje, ale tylko dla gracza — nie wpływa na stabilność OVR świata AI |
| Forma/zmęczenie | j.w. | j.w. — tylko gracz | `club.ai.form` istnieje (`match-post.js`), ale to osobny licznik "passy" (news o seriach), nie wpływa na atrybuty |
| Cele zarządu AI | `engine/match-post.js` (boardGoal w `aiTransferSeason`) | Pośrednio przez reputację → `clubDevMult` | Nie generuje/nie usuwa zawodników |
| Puchar | `engine/cup-engine.js` (`grantCupReward`, linie ok. 267-269) | Pośrednio przez reputację → `clubDevMult` na kolejny sezon | Patrz 1.5 |
| Migracja zapisów gry | `ui/news-bootstrap.js` (`loadGame`) | **Brak wpływu na świat AI** — migracje dotyczą tylko struktury danych klubu gracza (sprawdzone grepem: brak logiki migracji dotykającej `club.ai`/`G.players` masowo) | Nie do dalszej analizy |
| Limity pozycji | `core/data.js` (`POS_QUOTA`), egzekwowane w `aiEvaluateSale/Signing` | Pośrednio — zapobiega degeneracji składu (np. 10 bramkarzy), ale nie zmienia średniego OVR wprost | — |
| `LEAGUE_POT`/`calcPotential` | `core/data.js` | Sufit rozwoju całej populacji (sezon 1 + transfery), **celowo nietknięty** przy poprzednich poprawkach juniora AI (poszerzenie tu podbijało też dojrzałą populację, zmierzone i wycofane 14.07) | Ostrzeżenie w komentarzu w kodzie — nie zmieniać bez izolowania efektu od generatora juniora |

**Rzeczy, o które pytałeś wprost i które sprawdziłem, a które NIE mają wpływu**: kontuzje (patrz
tabela), migracja zapisów. **Rzeczy, o które nie pytałeś, a mają wpływ**: `LEAGUE_AI_TUNING`
(`churnMult`/`strictnessMult` per liga — wpływa na to, jak szybko słabe kluby "doganiają"
lukę), `POS_QUOTA` (zapobiega degeneracji pozycyjnej, pośrednio chroni jakość składu).

---

## 4. Propozycja (do akceptacji — bez wdrożenia)

### 4.1 Baza reputacji per liga

**Nie wymaga nowego kodu dla AI — już istnieje** (`initClubAI`, `match-post.js:772`). Rekomendacja:
zostawić bez zmian, ewentualnie tylko udokumentować to w `ARCHITECTURE.md` (dziś nieopisane).

### 4.2 Reputacja → jakość juniora (NOWA funkcja, do dobudowania)

Proponowany kształt (analogiczny do już istniejącego `_repTierR` w `aiSeasonalRefresh`, żeby nie
wprowadzać nowego wzorca obok istniejącego):

```
_repJuniorBonus = reputacja>=500 ? +6 : reputacja>=250 ? +3 : reputacja<50 ? -2 : 0
juniorOvr = r(_juniorFloor, _juniorCeil) + _repJuniorBonus   // ten sam clamp do LEAGUE_OVR co dziś
```

Dodawane WYŁĄCZNIE w generatorze juniora AI (`match-post.js`, `aiTransferSeason`) — **nie** w
`calcPotential()`/`LEAGUE_POT` (data.js), z tego samego powodu co 14.07: ta funkcja jest
współdzielona z populacją startową i transferami, poszerzenie tam podbija cały świat, nie tylko
juniorów. Do zweryfikowania symulacją PRZED wdrożeniem (dokładnie jak poprzednie 4 iteracje w
CHANGELOG) — wielkość bonusu dobrana wstępnie, nie zgadnięta na sztywno do wdrożenia bez pomiaru.

### 4.3 Korytarz stabilizujący (-1%/10 sezonów, -3%/50 sezonów, brak górnego limitu poza cap 100)

Dane z sekcji 2 (nawet w pesymistycznym wariancie harnessu) pokazują, że problem **nie jest
jednorodny dla całej ligi** — to konkretnie głębia/ławka, skoncentrowana na obu końcach piramidy
lig (L1/L2 i L6/L8), podczas gdy realni starterzy (top-11) trzymają poziom niemal wszędzie.
Wynika z tego, że **interwencja powinna celować w rozwój/rotację głębi składu, nie w globalne
stałe jak `LEAGUE_POT`/`calcPotential`** (które i tak są świadomie nietykane od 14.07 —
poszerzenie ich podbija całą populację, nie tylko słabszą część). Konkretne kierunki do
zweryfikowania w drugim, wierniejszym przebiegu symulacji (z Pucharem + oknem zimowym) przed
ustaleniem liczb:

- zwiększenie tempa rozwoju 23-27 lat (`aiSeasonalRefresh`, dziś `r(4,8)*clubDevMult`) TYLKO dla
  zawodników spoza czołowych ~11 w składzie (dziś jeden wzór dla całej kadry) — najbardziej
  bezpośrednio adresuje "ławka nie nadąża",
- rewizja `_juniorFloor`/`_juniorCeil` w generatorze juniora AI dla lig 1-2 (patrz komentarz w
  kodzie z 14.07 — już raz korygowane per `avgOvr` klubu, ale L1/L2 wciąż nie domykają luki),
- dla L8: do wyjaśnienia najpierw, czy to realne zjawisko czy artefakt małej ligi w harnessu
  (mniej klubów = mniej partnerów do realokacji wygasłych kontraktów) — nie zmieniać kodu dla L8
  bez powtórzenia symulacji na pełnych 16 klubach/lidze.

**Nie proponuję konkretnych finalnych wartości liczbowych do wdrożenia w tym raporcie** — zgodnie
z metodą całego audytu (pomiar → decyzja → kod), rekomenduję jeszcze jeden przebieg symulacji
(pełny silnik Pucharu + okno zimowe + 16 klubów/liga) jako podstawę do konkretnych progów, nie
szacunek na podstawie samej tabeli z sekcji 2.2.

### 4.4 Rozłożenie emerytur w czasie

Obecna tabela (32→38, narastająco) już jest rozłożona, nie skokowa — nie widzę dziś dowodu na
"urwisko pokoleniowe" w kodzie. Jeśli symulacja (sekcja 2) pokaże falowanie populacji wiekowej
(np. kohorty), rozważyć dodanie **rozrzutu ±1 rok do progu** zamiast zmiany samych szans — ale to
warunkowe na wynik pomiaru, nie do wdrożenia na ślepo.

### 4.5 Bonus mistrzowski/pucharowy na kolejny sezon

Proponowane rozszerzenie istniejącego `_successMultR` w `aiSeasonalRefresh()`
(`engine/kronika.js:2131-2133`), dodanie osobnej, wyższej stawki dla SAMEGO mistrzostwa (dziś
nieodróżnialnego od "górnej połowy tabeli"):

```
if(_isChampionR)_successMultR+=0.20;      // NOWE — wyraźnie więcej niż +0.10 za górną połowę
else if(_topHalfR)_successMultR+=0.10;    // bez zmian
if(_wonCupR)_successMultR+=0.15;else if(_finalCupR)_successMultR+=0.08; // bez zmian
```

Wymaga dociągnięcia informacji "kto był mistrzem tej ligi w kończącym się sezonie" do
`aiSeasonalRefresh()` — dziś liczy to `season-summary.js` (`champClub`) w innym miejscu tej samej
sekwencji `startNewSeason()`; trzeba przekazać/odczytać to samo źródło (`G.allStandings`,
pozycja 1) w obu miejscach bez duplikowania logiki.

**Decyzja (Twoja): bonus wyłącznie dla klubów AI, nie dla klubu gracza.** Zgodne z tym, jak
zaprojektowany był powyższy fragment — `aiSeasonalRefresh()` w `engine/kronika.js` już dziś
filtruje `lg.clubs.filter(c=>c.id!==G.myClubId)` (patrz 1.5/2.1), więc rozszerzenie
`_successMultR` o `_isChampionR` naturalnie obejmie tylko AI bez dodatkowego warunku — nie
trzeba nic dodatkowo wykluczać dla klubu gracza, to już jest właściwość tej funkcji. Klub gracza
zostaje bez zmian: ewentualny bonus za tytuł to nadal tylko to, co już wynika z `board-goals.js`
(jeśli akurat cel zarządu to obejmował) — poza zakresem tego zgłoszenia.

### 4.6 Zróżnicowane strategie transferowe wg typu klubu

**Decyzja (Twoja): doprecyzować istniejący typ, nie dodawać piątego.** `stabilny` jest dziś
najbliżej "stawia na doświadczenie", ale nie jest od tego wyraźnie odróżniony — ma neutralny
`devMult:1.0`, średni `maxBuyAge:30`, `juniors:[1,1]` (czyli sam w sobie robi też trochę
młodzieży, nie jest czystym profilem "tylko doświadczenie"). Proponowane doprecyzowanie (bez
zmiany nazwy/tożsamości typu, tylko liczb w istniejącym wpisie `AI_TYPES.stabilny`):

```
stabilny:{
  ...bez zmian ikony/opisu...
  maxBuyAge:33,        // było 30 — wyraźniej preferuje dojrzałych (32-38 to i tak próg emerytury)
  juniors:[0,1],        // było [1,1] — rzadszy nabór młodzieży, zgodnie z tożsamością "doświadczenie"
  minUpgradeDelta:2,    // było 1 — kupuje tylko realnie lepszych, nie ryzykuje na młodych
  renewChance:0.80      // było 0.70 — chętniej przedłuża kontrakty sprawdzonym, dojrzałym zawodnikom
}
```

Do zweryfikowania symulacją, czy to nie pogłębia problemu z głębią składu (sekcja 2.3) w ligach,
gdzie `stabilny` dominuje — `stabilny` i tak ma dziś niski `juniors`, więc dalsze ograniczenie
dopływu młodzieży trzeba sprawdzić pod kątem wpływu na bilans dopływ/odpływ całej ligi, nie tylko
pod kątem "wierności" archetypowi.

---

## 5. Pliki wymagające zmian przy wdrożeniu (zgodnie z zasadą nr 7 CLAUDE.md)

Jeśli zdecydujesz się wdrożyć powyższe propozycje, modyfikacji wymagają:

- **`engine/match-post.js`** — generator juniora AI (`aiTransferSeason`, dodanie `_repJuniorBonus`),
  ewentualnie nowy wpis w `AI_TYPES` (typ "doświadczony"), ewentualna korekta progu emerytury
  (`aiRenewContracts`) TYLKO jeśli symulacja potwierdzi potrzebę per-ligowego różnicowania.
- **`engine/kronika.js`** — `aiSeasonalRefresh()`, dodanie osobnej stawki `_successMultR` dla
  mistrzostwa ligi (odróżnienie od "górnej połowy tabeli"), wymaga dostępu do informacji o
  mistrzu bieżącej ligi w tym samym miejscu sekwencji co dziś `season-summary.js`.
- **`ui/season-summary.js`** — jeśli 4.5 wymaga przekazania informacji o mistrzu do
  `aiSeasonalRefresh()` (kolejność wywołań w `startNewSeason()`), synchronizacja obu miejsc.
- **`core/data.js`** — WYŁĄCZNIE jeśli 4.3 (korytarz) wymaga korekty `LEAGUE_POT`/`calcPotential`
  — do unikania, patrz ostrzeżenie w kodzie (14.07: poszerzenie tu podbiło świat ponad sezon 1
  przy poprzedniej próbie). Preferowane miejsce zmian to zawsze generator juniora AI w
  `match-post.js`, nie ta współdzielona funkcja.
- **`ARCHITECTURE.md`** — dopisanie sekcji o systemie reputacji per liga (dziś nieudokumentowanej)
  i o `AI_TYPES`/archetypach AI, żeby przyszłe sesje nie musiały ich odnajdywać od zera grepem
  (tak jak ta sesja).
- **`CHANGELOG.md`** — kontynuacja wpisów z 14.07.2026 (ten audyt to bezpośrednia kontynuacja
  wątku "Resztkowy spadek OVR świata").

**Pliki, które NIE wymagają zmian** (sprawdzone i wykluczone): `systems/academy.js` (mechanizm
gracza, celowo osobny — patrz 12.07.2026 pkt 13 w CHANGELOG), `ui/news-bootstrap.js`
(`applyInjury` — potwierdzone, nie dotyczy AI), `systems/board-goals.js` (mechanizm gracza,
AI ma własny, prostszy odpowiednik w `match-post.js`).

---

## 6. Otwarte pytania — ODPOWIEDZI (14.07.2026)

1. **Tak** — korytarz -1%/10 sezonów i -3%/50 sezonów weryfikowany na podstawie danych z
   symulacji (sekcja 2), nie a priori. Wynik pierwszego przebiegu: patrz 2.2/2.3 (5 z 8 lig łamie
   próg na poziomie pełnej kadry). Drugi, wierniejszy przebieg — patrz sekcja 7 niżej.
2. **Doprecyzować istniejący typ `stabilny`**, bez dodawania piątego wpisu do `AI_TYPES` —
   patrz zaktualizowana sekcja 4.6.
3. **Bonus mistrzowski wyłącznie dla klubów AI** — patrz zaktualizowana sekcja 4.5. Klub gracza
   poza zakresem tego zgłoszenia.

---

## 7. Drugi przebieg symulacji — pełny silnik Pucharu + okno zimowe + 16 klubów/liga

### 7.1 Wynik: werdykt się ODWRACA — i to jest najważniejsze odkrycie tego audytu

Drugi przebieg (16 klubów/liga, realny Puchar co sezon, dodane okno zimowe) daje **całkowicie
odwrotny obraz** niż pierwszy przebieg z sekcji 2:

| Liga | OVR S1 (kadra) | Dryf S10 | Dryf S50 | Wynik S10/S50 |
|---|---|---|---|---|
| L1 | 76,05 | +4,2% | +9,1% | PASS / PASS |
| L2 | 63,73 | +6,4% | +17,0% | PASS / PASS |
| L3 | 56,64 | +4,5% | +21,7% | PASS / PASS |
| L4 | 49,61 | +0,9% | +22,9% | PASS / PASS |
| L5 | 44,69 | **−5,8%** | +18,0% | **FAIL** / PASS |
| L6 | 38,69 | **−5,3%** | +14,0% | **FAIL** / PASS |
| L7 | 31,01 | +1,9% | +14,8% | PASS / PASS |
| L8 | 24,21 | **−7,5%** | +5,2% | **FAIL** / PASS |

Do sezonu 100 **każda liga jest +17% do +37% POWYŻEJ poziomu sezonu 1** — dokładne przeciwieństwo
pierwszego przebiegu (tam: spadek w 5/8 lig). L5/L6/L8 wciąż łamią próg -1% w krótkim oknie do
sezonu 10 (chwilowy dołek zanim przejmie wzrost), ale nawet one kończą sezon 50 na plusie.
Populacja świata stabilna (3072→~3240), bez kolapsu.

### 7.2 Dlaczego werdykt się odwrócił — analiza przyczynowa (ablacja)

Zanim potraktowałem powyższe liczby jako prawdę, sprawdziłem osobno wpływ każdej z 3 zmian
(30-sezonowe przebiegi, każda zmiana osobno):

- **16 klubów, bez Pucharu, bez zimy** (powtórka wariantu z sekcji 2): spadek, zgodny z
  pierwszym przebiegiem — liczba klubów per liga NIE jest przyczyną różnicy.
- **16 klubów + okno zimowe, bez Pucharu**: dalej spadek, tej samej skali — okno zimowe
  praktycznie nie ma znaczenia w żadną stronę.
- **16 klubów + Puchar, bez okna zimowego**: **silny wzrost** (+4% do +15% do sezonu 30) — SAMA
  ta jedna zmiana odwraca znak całego zjawiska.

**Wniosek: to Puchar jest dominującą przyczyną**, konkretnie przez bonus sukcesu w
`clubDevMult` (`_wonCupR`/`_finalCupR`/`_topHalfR` w `aiSeasonalRefresh()`,
`engine/kronika.js` ok. linii 2129-2134) — **to nie błąd harnessu, to prawdziwy,
niezmodyfikowany kod produkcyjny działający zgodnie z projektem**.

**Sprawdzone dodatkowo na wyraźną prośbę: czy bonus mistrzowski/pucharowy sumuje się między
sezonami zamiast resetować co rok? NIE — kod jest poprawny.** `_successMultR` (linia 2131) to
zmienna lokalna tworzona od zera (`=1.0`) przy każdym wywołaniu `aiSeasonalRefresh()` (raz na
sezon), a `_wonCupR`/`_finalCupR` (linia 2129) sprawdzają wyłącznie wynik Pucharu **z sezonu,
który się właśnie skończył** (`G.cupHistory.find(ch=>ch.season===G.season)`, linia 2113) —
klub, który wygrał Puchar 3 sezony temu i potem nic, w tym sezonie dostaje `_wonCupR=false`.
Żadna wartość bonusu nie jest zapisywana trwale na `club.ai` między sezonami. Efekt "piętrzenia"
zaobserwowany w ablacji (7.2) to NIE suma kolejnych bonusów, tylko pętla sprzężenia przez dwa
INNE, faktycznie trwałe stany: (a) `ai.reputation` — bez limitu i bez naturalnego spadku, każdy
sukces podnosi ją na stałe, a to ona (przez `_repTierR`, 0,95×-1,10×) trwale podbija tempo
rozwoju we wszystkich kolejnych sezonach, nie tylko w tym, w którym padł sukces; (b) sam OVR
zawodników z udanego sezonu naturalnie utrzymuje się i ułatwia sukces (a więc kolejny bonus) w
następnym sezonie. Mechanizm jest więc architekturalny (dwa trwałe stany karmiące z powrotem
szansę na kolejny "świeży" bonus), nie błąd w logice resetowania samego bonusu — ale praktyczny
skutek jest taki sam: im dłużej klub wygrywa, tym łatwiej mu wygrywać dalej, bez mechanizmu
wygaszającego. Ale najprawdopodobniej skala
efektu jest zawyżona przez ograniczenie harnessu, którego nie dało się usunąć w tym przebiegu:
wyniki Pucharu i lig rozstrzyga uproszczony wzór (stosunek mocy OVR obu drużyn, ten sam co
`runDevSim()` używa dla meczów AI-AI), z dużo mniejszą wariancją niespodzianek niż prawdziwy
silnik meczowy (`_buildMatchPhases()`) — więc te same mocne kluby wygrywają Puchar dużo bardziej
konsekwentnie niż realnie by wygrywały, co sztucznie nakręca pętlę "sukces → szybszy rozwój →
kolejny sukces" ponad to, co dałaby prawdziwa gra. Weryfikacja z realnym silnikiem meczowym
wymagałaby pełnych zmiennych globalnych żywego meczu (canvas, stan taktyczny na żywo itd.) —
świadomie wykluczonych z zakresu obu przebiegów harnessu, poza zakresem tego audytu.

### 7.3 Co to zmienia w diagnozie i propozycji z sekcji 4

To jest **najważniejsza zmiana wynikająca z całego audytu** — pierwotna hipoteza z
`CHANGELOG.md` (próg emerytury/tempo starzenia identyczne dla wszystkich lig, elita nie ma
czasu dorosnąć) **nie jest już głównym podejrzanym**. Prawdziwym mechanizmem, który decyduje o
kierunku (spadek vs wzrost) całego świata, jest **nieograniczone piętrzenie bonusu sukcesu w
`clubDevMult`** — klub, który wygrywa (Puchar/górna połowa tabeli), rozwija się szybciej, co
zwiększa szansę na kolejny sukces, co dalej przyspiesza rozwój — pętla sprzężenia zwrotnego bez
mechanizmu wygaszającego (np. malejących przyrostów przy wielu sezonach sukcesu z rzędu).

**Praktyczna konsekwencja dla Twojej prośby o bonus mistrzowski (sekcja 4.5)**: proponowany tam
dodatkowy `+0.20` do `_successMultR` za sam tytuł mistrzowski **dokłada się do już
zidentyfikowanego, niekontrolowanego mechanizmu wzrostu**, zamiast do neutralnego punktu
odniesienia. Nie wycofuję propozycji (to wciąż to, o co prosiłeś), ale **rekomenduję wdrożyć ją
dopiero razem z jakimś mechanizmem tłumiącym piętrzenie** (np. malejący bonus przy kolejnych
sezonach sukcesu z rzędu tego samego klubu, albo twardy sufit na `clubDevMult` niższy niż dzisiejszy
1.6) — inaczej ryzykujesz pogłębienie efektu "bogaty klub rośnie w nieskończoność", którego
korytarz -1%/-3% miał właśnie unikać (tyle że po stronie górnego, nie dolnego ograniczenia — a
Twoje założenia mówiły wprost "wzrost bez limitu poza cap 100 na zawodnika": pytanie, czy
"bez limitu" miało też obejmować rosnące rozwarstwienie między najlepszymi i najsłabszymi
klubami tej samej ligi, czy tylko brak sufitu dla pojedynczego zawodnika — to warto doprecyzować
przed wdrożeniem, patrz sekcja 8).

### 7.4 Pozostałe ograniczenia harnessu (nieusunięte)

- Wyniki meczów ligowych i pucharowych: uproszczony wzór mocy OVR, nie prawdziwy silnik meczowy —
  prawdopodobnie największa pozostała luka wierności, przyczyna zawyżonej skali wzrostu (7.2).
  Prawdziwa gra prawdopodobnie leży GDZIEŚ POMIĘDZY wynikiem sekcji 2 (spadek, bez Pucharu) a
  wynikiem tej sekcji (silny wzrost, z Pucharem) — bliżej wzrostu, bo Puchar w produkcji jest
  zawsze aktywny, ale bez tak skrajnej koncentracji zwycięstw w rękach tych samych klubów.
- Okno zimowe: przybliżony moment wywołania (raz na sezon, nie zakotwiczone do konkretnej
  kolejki) — ablacja pokazuje, że to i tak prawie nie ma znaczenia w żadną stronę.
- Awanse/spadki: te same, realne bonusy/kary atrybutów co w produkcji, przy 16 klubach to
  ~12,5%/sezon w każdą stronę — zgodne ze skalą produkcyjną (w przeciwieństwie do 20% w
  pierwszym przebiegu na 10 klubach).

Surowe dane: `raw_results_v2.json`/`aggregated_v2.json` (pełny przebieg) oraz
`raw_results_abl{A,B,C,D}.json` (ablacja) w katalogu scratchpad sesji (poza repo).

### 7.5 Pogłębiona analiza 30 sezonów per liga (dane z surowych plików ablacji)

Poniższa tabela to bezpośredni odczyt z surowych wyników ablacji (nie streszczenie fork'a) —
dryf `avgSquadOvr` względem sezonu 1, w sezonach 10/20/30, dla wszystkich 4 wariantów. **Przy
weryfikacji poprawiłem błąd we własnym wcześniejszym mapowaniu etykiet** — warianty C i D miały
zamienione opisy w sekcji 7.2; poniższe dane są zweryfikowane bezpośrednio z surowych plików
(liczba klubów odczytana z sumy populacji sezonu 1: 1920=10 klubów/ligę, 3072=16 klubów/ligę).

| Liga | A: 10 klubów, bez Pucharu/zimy | B: 16 klubów, bez Pucharu/zimy | C: 16 klubów + **Puchar**, bez zimy | D: 16 klubów + zima, bez Pucharu |
|---|---|---|---|---|
| L1 | +1,8% / −8,1% / **−10,1%** | +1,1% / −8,8% / **−8,5%** | +5,2% / +1,7% / **+4,6%** | +0,5% / −8,3% / **−9,3%** |
| L2 | +4,7% / −5,0% / **−2,9%** | +1,5% / −7,9% / **−4,7%** | +5,1% / +7,6% / **+12,9%** | +1,4% / −6,8% / **−2,5%** |
| L3 | +2,4% / −7,4% / **+0,1%** | +0,1% / −5,3% / **−5,6%** | +4,6% / +3,9% / **+13,4%** | +0,9% / −7,0% / **−2,6%** |
| L4 | −2,1% / −1,2% / **+2,2%** | −0,7% / −6,8% / **−1,2%** | +2,4% / +2,9% / **+14,1%** | −3,8% / −4,8% / **−3,1%** |
| L5 | −1,3% / −1,3% / **−4,0%** | −5,7% / −7,4% / **−9,0%** | −1,0% / +0,3% / **+6,1%** | −8,3% / −5,1% / **−7,0%** |
| L6 | +1,0% / +4,5% / **+1,6%** | −7,1% / −7,8% / **−9,7%** | −4,3% / +3,0% / **+6,9%** | −7,8% / −6,4% / **−6,4%** |
| L7 | +2,8% / +7,5% / **+0,9%** | −5,0% / −8,1% / **−10,1%** | +3,4% / +7,1% / **+9,5%** | −0,3% / +0,5% / **−8,6%** |
| L8 | −0,1% / −3,0% / **−8,1%** | −15,0% / −13,1% / **−12,3%** | +1,2% / +7,8% / **+15,4%** | −10,2% / −10,1% / **−16,6%** |

(kolumny: dryf w sezonie 10 / 20 / 30, pogrubione = sezon 30)

**Obserwacje z tej tabeli:**

1. **Sam Puchar (kolumna C) to jedyny wariant, w którym WSZYSTKIE 8 lig kończy sezon 30 na
   plusie** — od +4,6% (L1) do +15,4% (L8). To potwierdza wcześniejszy wniosek liczbowo, nie
   tylko jakościowo: włączenie realnego Pucharu jest pojedynczą zmianą o największym wpływie na
   KIERUNEK całego zjawiska, silniejszą niż liczba klubów czy okno zimowe razem wzięte.
2. **Ciekawy, nowy szczegół**: w wariancie z Pucharem wzrost jest RÓWNIEŻ najsilniejszy w
   najniższych ligach (L8 +15,4%, L4 +14,1%) — nie tylko na górze piramidy. To zaprzecza
   intuicji "tylko bogate kluby korzystają z Pucharu" — mechanizm `_topHalfR`/`clubDevMult`
   działa tak samo we wszystkich ligach, a niższe ligi mają niżej OVR startowy (mniejszy
   mianownik), więc te same punkty bonusowe dają wyższy procentowy wzrost.
3. **Bez Pucharu (warianty A, B, D) najgorzej wypadają oba KOŃCE piramidy lig — L1 i L8** —
   spójne we wszystkich trzech wariantach (L1: -8,5% do -10,1%, L8: -8,1% do -16,6%), podczas
   gdy środek stawki (L3-L4, L6-L7) jest bliżej neutralnego. To pokrywa się z pierwotną hipotezą
   z `CHANGELOG.md` (elita potrzebuje więcej czasu na rozwój) DLA L1, ale nie tłumaczy, dlaczego
   L8 cierpi tak samo mocno — L8 nie ma nad sobą presji "potrzeby dogonienia elity", więc to
   raczej efekt niskiej bazy OVR (mały spadek punktowy = duży spadek procentowy) połączony z
   brakiem typu `bogaty` w tej lidze (patrz Aneks A.1) i mniejszą pulą klubów do redystrybucji
   przy wygasłych kontraktach.
4. **Wariant B vs D (16 klubów, różnica tylko w oknie zimowym) są niemal identyczne** — potwierdza
   to, co ablacja już sugerowała: okno zimowe ma marginalny wpływ na kierunek/skalę zjawiska,
   nie jest priorytetem do zmiany.
5. **We WSZYSTKICH 4 wariantach, bez wyjątku**, `avgXIOvr` (czubek składu) rośnie szybciej/spada
   wolniej niż `avgSquadOvr` (cała kadra) — to jedyny wzorzec obecny niezależnie od tego, czy
   świat jako całość rośnie czy spada. To wzmacnia wniosek z sekcji 2.3: **erozja głębi/ławki
   składu to osobny, stały mechanizm, niezależny od tego, czy Puchar jest włączony** — nie jest
   artefaktem żadnego konkretnego wariantu symulacji.

### 7.6 Co wpływa najbardziej — ranking przyczyn (na podstawie ablacji)

| Czynnik | Wpływ na KIERUNEK dryfu OVR świata | Wpływ na erozję głębi składu (starterzy vs ławka) |
|---|---|---|
| **Bonus sukcesu w `clubDevMult`** (Puchar/górna połowa tabeli → `aiSeasonalRefresh`) | **Dominujący** — pojedyncza zmiana odwraca znak we wszystkich 8 ligach | Brak bezpośredniego wpływu (obecne w każdym wariancie) |
| Liczba klubów w lidze (10 vs 16) | Minimalny — kierunek bez zmian, tylko drobne różnice skali | Brak zmierzonego wpływu |
| Okno transferowe zimowe | Pomijalny — warianty B i D niemal identyczne | Brak zmierzonego wpływu |
| Mechanizm rozwoju 23-27 lat / starzenia 28+ (`aiSeasonalRefresh`, niezmieniany w żadnym wariancie) | Nie testowany osobno w ablacji, ale obecny identycznie we wszystkich 4 wariantach | **Prawdopodobny główny sprawca** — jeden wzór dla całej kadry, więc gwiazdy i głębia rosną tym samym tempem nominalnym, ale różnym efektywnym (gwiazdy bliżej potencjału ligi, głębia dalej od niego) |
| Próg wieku emerytury (jednakowy dla wszystkich lig) | Pierwotna hipoteza z CHANGELOG — nie testowana osobno w tej ablacji, wciąż otwarta | Możliwy współczynnik dla L1/L2 (elita potrzebuje więcej czasu) |

### 7.7 Zaktualizowana propozycja — co jeszcze zmienić (priorytety wg zmierzonego wpływu)

1. **[NAJWYŻSZY PRIORYTET] Zmierzone bezpośrednio w tej sesji, nie tylko szacowane**: dodać
   mechanizm tłumiący piętrzenie `clubDevMult` u klubów z wieloma sezonami sukcesu z rzędu —
   np. `_successMultR` maleje, jeśli klub wygrywał Puchar/był w górnej połowie N sezonów z rzędu
   (nagradza pojedynczy sukces pełną stawką, jak chciałeś w 4.5, ale nie daje wiecznej premii za
   sam fakt bycia dziś silnym). To jedyna zmiana, która w ablacji odwróciła kierunek całego
   świata — najwyższy zwrot z najmniejszej zmiany kodu.
2. **[ŚREDNI PRIORYTET] Potwierdzone w KAŻDYM wariancie**: erozja głębi/ławki względem
   starterów — do adresowania przez zróżnicowanie tempa rozwoju 23-27 lat między rdzeniem
   składu a resztą (patrz oryginalna propozycja 4.3), niezależnie od decyzji w punkcie 1.
3. **[DO DALSZEJ WERYFIKACJI, nie do wdrożenia na tej podstawie]**: L1 i L8 jako końce piramidy
   najbardziej wrażliwe na brak Pucharu — zanim cokolwiek zmienię punktowo dla tych dwóch lig,
   potrzebny jest przebieg z prawdziwym silnikiem meczowym (sekcja 8.2 — `runDevSim()` w grze),
   bo obie skrajne ligi mogą reagować inaczej na mniej deterministyczne wyniki meczów niż
   uproszczony wzór mocy OVR używany w tym harnessie.
4. **Pierwotna hipoteza z CHANGELOG (próg emerytury/tempo starzenia per liga)** spada w
   priorytecie — nie została obalona, ale nie jest już głównym podejrzanym o KIERUNEK zjawiska;
   zostaje jako kandydat do adresowania erozji głębi składu (punkt 2), nie jako samodzielny
   priorytet.

---

## 8. Zaktualizowane podsumowanie i nowe pytania do Ciebie

### 8.1 Co się realnie zmieniło w diagnozie

Dwa przebiegi symulacji dały **przeciwne znaki** (spadek vs wzrost) dla tego samego świata,
różniące się tylko obecnością realnego Pucharu. To samo w sobie jest wynikiem: pokazuje, że
**kierunek dryfu OVR całego świata jest dziś cienką granicą, zdominowaną przez jeden mechanizm**
— piętrzenie bonusu sukcesu w `clubDevMult` (`aiSeasonalRefresh()`, `engine/kronika.js`), a NIE
przez pierwotnie podejrzewane progi emerytury/tempo starzenia z `CHANGELOG.md` (14.07.2026).
Te ostatnie wciąż mogą mieć swój udział (patrz sekcja 2 — głębia/ławka słabsza niż czubek składu
utrzymuje się w obu przebiegach jako osobny, mniejszy wzorzec), ale nie są już głównym
podejrzanym co do KIERUNKU całego zjawiska.

### 8.2 Rekomendacja co do dalszych kroków

Nie rekomenduję ustalania konkretnych progów korytarza (-1%/-3%) na podstawie żadnego z tych
dwóch przebiegów osobno — oba mają wiarygodne, ale przeciwstawne obciążenie (sekcja 2.1 vs 7.4).
Zamiast trzeciego wariantu harnessu (który i tak nie rozwiąże fundamentalnego braku prawdziwego
silnika meczowego), praktyczniejsza weryfikacja to: **kilka realnych przebiegów `runDevSim()`
w samej grze** (już istniejące narzędzie, `ui/dev-mode.js`, chronione `DEV_MODE`) na 30-50
sezonów, z dodatkowym, tymczasowym logowaniem średniego OVR świata per liga do `devLog()` —
to używa PRAWDZIWEGO silnika meczowego (`_buildMatchPhases`), więc eliminuje niepewność z 7.4
kosztem wolniejszego przebiegu (nie da się łatwo zrobić 100 sezonów w przeglądarce). To byłaby
naturalna kontynuacja tej sesji, jeśli chcesz iść dalej przed podjęciem decyzji o konkretnych
liczbach.

### 8.3 Nowe pytania do Ciebie

1. Czy zgadzasz się przesunąć priorytet z "próg emerytury/tempo starzenia per liga" (pierwotna
   hipoteza z CHANGELOG) na "**piętrzenie bonusu sukcesu w `clubDevMult`**" jako główny
   mechanizm do zaadresowania, skoro to on okazał się decydować o kierunku całego zjawiska?
2. Czy chcesz, żebym (zanim zaproponuję konkretny kod) zweryfikował to jeszcze raz przez
   `runDevSim()` w prawdziwej grze (sekcja 8.2), czy akceptujesz obecny poziom pewności
   (dwa przebiegi harnessu + ablacja przyczynowa) jako wystarczający do przejścia do projektowania
   konkretnego mechanizmu tłumiącego (np. malejący bonus przy kolejnych sezonach sukcesu z rzędu)?
3. Twoje pierwotne założenie "wzrost bez górnego limitu poza cap 100 na zawodnika" — czy to
   miało też oznaczać akceptację rosnącego rozwarstwienia MIĘDZY klubami tej samej ligi (bogaty
   klub coraz bardziej odrywa się od reszty), czy zależy Ci też na ograniczeniu tego
   rozwarstwienia, nie tylko na indywidualnym capie 100?

---

## Aneks A. Syntetyczna tabela progów i bonusów per liga (stan dzisiejszy, bez zmian)

Wszystkie wartości to dosłowne stałe z kodu (`core/data.js`, `engine/match-post.js`,
`core/state.js`, `systems/academy.js`, `systems/board-goals.js`). Liga 1 = Premier Division
(najwyższa), liga 8 = VII Liga (najniższa) — numeracja poziomu jest ODWROTNA do nazwy ligi w UI.

### A.1 Jakość składu i reputacja — to, co bezpośrednio dotyczy audytu OVR

| Liga (poziom/nazwa) | OVR sezon 1 (ogon→lider)¹ | Potencjał: sufit / bonus² | Reputacja startowa AI³ | Typy klubów dostępne⁴ | AI tuning (churn/strictness)⁵ |
|---|---|---|---|---|---|
| 1 — Premier Division | 58–72 → 82–92 | 99 / +5 do +20 | 220–280 | akademia, sprzedający, bogaty, stabilny | 0,8 / 1,3 |
| 2 — I Liga | 45–58 → 70–82 | 90 / +8 do +25 | 190–250 | akademia, sprzedający, bogaty, stabilny | 0,9 / 1,2 |
| 3 — II Liga | 38–52 → 62–74 | 82 / +10 do +28 | 160–220 | akademia, sprzedający, bogaty, stabilny | 1,0 / 1,1 |
| 4 — III Liga | 32–45 → 55–67 | 74 / +8 do +22 | 130–190 | akademia, sprzedający, bogaty, stabilny | 1,0 / 1,0 |
| 5 — IV Liga | 27–40 → 50–62 | 66 / +6 do +18 | 100–160 | akademia, sprzedający, stabilny (**bez bogaty**) | 1,1 / 0,95 |
| 6 — V Liga | 22–33 → 44–56 | 58 / +5 do +15 | 70–130 | akademia, sprzedający, stabilny | 1,2 / 0,9 |
| 7 — VI Liga | 15–26 → 36–48 | 50 / +4 do +12 | 40–100 | akademia, sprzedający, stabilny | 1,3 / 0,85 |
| 8 — VII Liga (najniższa) | 8–20 → 28–42 | 42 / +3 do +10 | 10–70 | akademia, sprzedający, stabilny | 1,4 / 0,8 |

¹ `LEAGUE_OVR[lvl]` — pasmo OVR najsłabszego i najmocniejszego klubu przy starcie gry
(`mkLeaguePlayers()`), pozostałe kluby interpolowane liniowo między tymi wartościami wg pozycji
w tabeli startowej.
² `LEAGUE_POT[lvl]` (`calcPotential()`) — potencjał = `min(sufit, OVR_aktualny + losowy_bonus)`,
korygowany w dół dla zawodników 28+ (mniej przestrzeni do wzrostu).
³ `initClubAI()`: `10+(8-poziom)*30+losowe(0,60)` — jedyna tabela w grze, gdzie reputacja
startowa jest wprost skalowana ligą (to jest odpowiedź na Twoje pytanie 1 z sekcji diagnostycznej
— już istnieje). Gracz zawsze startuje z 30, niezależnie od tego pola (ale zawsze w lidze 8, więc
to spójne).
⁴ `initClubAI()` losuje typ z puli `[akademia,akademia,sprzedajacy,sprzedajacy,stabilny,stabilny,
bogaty]` — typ `bogaty` jest **odfiltrowany dla lig 5-8**, więc realnie niedostępny w dolnej
połowie piramidy.
⁵ `LEAGUE_AI_TUNING[lvl]` — `churnMult` skaluje limit transferów/sezon (wyższy w słabszych
ligach = więcej naturalnej rotacji), `strictnessMult` skaluje próg "czy kandydat jest realną
poprawą" (wyższy w mocniejszych ligach = ostrzejsza selekcja).

**Uwaga — próg emerytury NIE jest w tej tabeli, bo dziś NIE jest per-ligowy**: ten sam próg
wieku `{32:.05,...,38:.90,>38:.95}` (AI) obowiązuje we wszystkich 8 ligach jednakowo
(`aiRenewContracts()`, `match-post.js`). To jedyny większy mechanizm z całej listy audytu, który
**nie** skaluje się z ligą — wszystko inne (OVR, potencjał, reputacja, typy klubów, tuning AI,
ekonomia niżej) już jest zróżnicowane per liga.

**Pasmo OVR juniora AI** też nie jest osobną, per-ligową stałą tabelą — liczone dynamicznie w
`aiTransferSeason()` jako `r(max(lgMin-3, avgOvr_klubu-25), max(lgMin+10, avgOvr_klubu-10))`,
gdzie `lgMin` to dolna granica z `LEAGUE_OVR[lvl]` powyżej, a `avgOvr_klubu` to średnia XI
KONKRETNEGO klubu (nie całej ligi) — więc mocne kluby w danej lidze produkują lepszych juniorów
niż słabe kluby tej samej ligi, ale reputacja dziś nie wchodzi do tego wzoru (patrz sekcja 1.3 /
propozycja 4.2).

### A.2 Ekonomia per liga (kontekst — nie bezpośredni przedmiot audytu OVR, ale współdzielone stałe)

| Liga | Budżet startowy | Sponsor tyg. bazowy | Reklamy tyg. | TV tyg. | Cena biletu | Bonus za 1. miejsce (sezon)⁶ | `rewardScale` celów zarządu⁷ | Mnożnik kosztu akademii/CT⁸ |
|---|---|---|---|---|---|---|---|---|
| 1 | 2 000 000 | 80 000 | 45 000 | 60 000 | 30 | 12 000 000 | 500 000 | 5,0 / 6,0 |
| 2 | 800 000 | 30 000 | 18 000 | 25 000 | 20 | 2 000 000 | 200 000 | 3,0 / 3,5 |
| 3 | 300 000 | 28 000 | 6 000 | 8 000 | 15 | 500 000 | 80 000 | 1,8 / 4,0 |
| 4 | 120 000 | 8 000 | 3 500 | 0 | 12 | 120 000 | 30 000 | 1,2 / 3,6 |
| 5 | 60 000 | 3 500 | 1 000 | 0 | 10 | 40 000 | 12 000 | 0,8 / 2,1 |
| 6 | 30 000 | 1 800 | 400 | 0 | 8 | 15 000 | 5 000 | 0,5 / 1,2 |
| 7 | 18 000 | 1 000 | 300 | 0 | 6 | 6 000 | 2 000 | 0,35 / 0,75 |
| 8 | 12 000 | 600 | 120 | 0 | 5 | 3 000 | 800 | 0,25 / 0,45 |

⁶ `FIN.bonus[lvl][0]` — jednorazowa premia za 1. miejsce w tabeli na koniec sezonu (dla gracza;
AI ma osobny mechanizm — mnożnik 0,7×-1,4× własnego funduszu płac, patrz sekcja 1).
⁷ `board-goals.js` `rewardScale` — baza, z której liczone są wszystkie nagrody/kary celów
zarządu (mnożniki ×0,25 do ×5 zależnie od trudności celu) — **tylko klub gracza**.
⁸ `ACADEMY.costMult[lvl]` / `ACADEMY.upkMult[lvl]` (`systems/academy.js`) — mnożnik kosztu
budowy / utrzymania akademii i centrum treningowego względem bazowej ceny; ta sama para
mnożników obsługuje oba budynki.

**Znaleziona przy okazji drobna niespójność (poza zakresem audytu OVR, zgłaszam bo wypłynęła z
tej samej tabeli)**: w kodzie istnieją DWIE różne tabele minimalnej/maksymalnej pensji per liga —
`calcSalary()` w `core/state.js` (aktywna, faktycznie używana: `SAL_MIN`/`SAL_MAX`, np. liga 8:
150-450) oraz `FIN.salMin`/`FIN.salMax` w `core/data.js` (np. liga 8: 100-280) — ta druga jest
**martwym kodem**, zdefiniowana, ale nigdzie w projekcie nieużywana (sprawdzone grepem). Nie
wpływa na nic dziś, ale warto wiedzieć przy ewentualnym sprzątaniu `core/data.js`.

---

## 9. Weryfikacja powdrożeniowa (pkt. 4 z listy "co zostało") — poprawka NIE działa zgodnie z zamierzeniem

### 9.1 Metoda

Ten sam, najwierniejszy wariant harnessu co w sekcji 7 (16 klubów/liga, realny silnik Pucharu,
okno zimowe), uruchomiony PONOWNIE — tym razem przeciwko już zmienionemu kodowi źródłowemu
(3 zmiany z `CHANGELOG.md` pkt. 3), 100 sezonów, 2 przebiegi uśrednione. Punkt odniesienia
"przed": dokładnie te same liczby z sekcji 7.1 (przebieg na kodzie SPRZED wdrożenia).

### 9.2 Wynik: dryf S10/S50/S100, przed → po wdrożeniu

| Liga | S10 przed→po | S50 przed→po | S100 przed→po |
|---|---|---|---|
| L1 | +4,2%→+6,2% | +9,1%→**+17,7%** | +16,7%→+20,6% |
| L2 | +6,4%→+7,7% | +17,0%→**+26,9%** | +32,3%→+33,9% |
| L3 | +4,5%→+8,2% | +21,7%→**+28,2%** | +34,1%→+37,9% |
| L4 | +0,9%→+4,6% | +22,9%→**+29,7%** | +36,6%→+39,1% |
| L5 | −5,8%→−0,5% (lepiej) | +18,0%→+22,6% | +34,5%→+37,1% |
| L6 | −5,3%→+3,2% | +14,0%→+13,7% (bez zmian) | +35,3%→+42,3% |
| L7 | +1,9%→+1,7% (bez zmian) | +14,8%→+10,1% (lepiej) | +37,2%→+35,9% |
| L8 | **−7,5%→−7,5% (BEZ ZMIAN, dalej łamie próg -1%)** | +5,2%→**−1,3%** (dużo lepiej) | +17,5%→+16,3% |

Populacja świata stabilna (3072→~3100-3140), bez kolapsu.

**Sprawdzone dodatkowo (na własną inicjatywę, jako kontrola poprawności mechanizmu)**: pole
`ai._successStreak` działa technicznie bezbłędnie — 0 błędów na 128 klubach AI w 30-sezonowym
przebiegu kontrolnym, rozkład streaków `{0:64, 1:25, 2:15, 3:9, 4:5, 5:2, 6:3, 8:2, 11:2, 12:1}`,
maksymalny zaobserwowany streak 12 (tłumienie poprawnie płaszczeje od streak≥10, sam licznik
rośnie dalej, co jest zamierzone). **To nie jest błąd implementacji — kod robi dokładnie to, co
zaprogramowałem.** Problem jest w SKALI/DOBORZE PARAMETRÓW, nie w logice.

### 9.3 Diagnoza: dlaczego tłumienie nie pomogło

**Jedyna realna awaria korytarza sprzed wdrożenia (L8, sezon 10, -7,5%) pozostała DOKŁADNIE bez
zmian** — poprawka nie dotknęła tego, co miała naprawić. Jednocześnie **wzrost (formalnie nie
ograniczony korytarzem — patrz Twoje pierwotne założenie "wzrost bez limitu poza cap 100") jest
większy niż przed poprawką w 5 z 8 lig przy sezonie 50** (L1-L4 wyraźnie, L5 nieznacznie).

Przyczyna, którą widzę po analizie zmiany, jaką sam wprowadziłem: **nowy bonus mistrzowski
(+0,20) jest WIĘKSZY niż to, co zastępuje** — mistrz ligi z definicji był już w "górnej połowie
tabeli" i dostawał +0,10; teraz dostaje +0,20, czyli **dwa razy więcej niż wcześniej, przy
KAŻDYM tytule, w każdej z 8 lig, w każdym sezonie**. Tłumienie piętrzenia, tak jak
zaprojektowałem je na Twoją prośbę ("nagradza pojedynczy sukces pełną stawką"), **celowo NIE
ogranicza pierwszego sukcesu danego klubu** — a przy 16 klubach w lidze na przestrzeni 100
sezonów mistrz się często zmienia (różne kluby wygrywają w różnych latach), więc większość
tytułów to dla danego klubu "pierwszy/niski streak" — dampening prawie nigdy nie osłabia
PEŁNEJ, podwojonej stawki. Dodatkowo `_repJuniorBonus` (punkt 4.2) to CAŁKOWICIE OSOBNY,
niedampowany kanał wzrostu dla klubów o wysokiej reputacji — te same kluby, które najczęściej
wygrywają Puchar/mistrzostwo, mają też wysoką reputację, więc oba mechanizmy premiują tę samą
grupę klubów jednocześnie.

**Wniosek: to nie błąd w logice tłumienia (działa dokładnie tak, jak zaprojektowałem), tylko
błędny dobór WIELKOŚCI bonusu mistrzowskiego względem tego, co zastępował** — 4.5 podniosło
premię za tytuł z +0,10 do +0,20 (podwojenie), a tłumienie chroni tylko przed DYNASTIĄ
(ten sam klub wygrywający wiele lat z rzędu), nie przed sumarycznym wzrostem światowym
napędzanym przez WIELE różnych klubów wygrywających po kolei.

### 9.4 Decyzja do podjęcia przed kolejną zmianą kodu

Nie wprowadzam kolejnej poprawki bez Twojej decyzji — dwie niezależne kwestie do rozstrzygnięcia:

1. **Czy większy wzrost (nie łamiący litery korytarza — brak sufitu na wzrost w Twoich
   założeniach) jest problemem, który chcesz adresować?** Jeśli nie — wzrost sam w sobie nie
   był ograniczony w Twoim pierwotnym poleceniu, więc wynik z 9.2 może być formalnie
   akceptowalny (poza L8/S10, patrz punkt 2). Jeśli tak — proponuję zmniejszyć bonus
   mistrzowski z `+0.20` na coś bliższego `+0.12`-`+0.14` (wyraźnie odróżnialne od `+0.10` za
   górną połowę, ale bez podwojenia), i/lub dodać tłumienie także dla `_repJuniorBonus`
   (dziś całkowicie niezależne od streaku).
2. **L8/sezon 10 nadal łamie próg -1%, bez zmiany od wdrożenia** — ta poprawka nigdy nie miała
   tego naprawić (adresowała kierunek świata przez Puchar, nie ten konkretny, izolowany dołek).
   Wymaga osobnej diagnozy, niezależnej od punktów 1-3 z tej sekcji.

Do czasu Twojej decyzji stan w repo zostaje taki, jaki jest — 3 zmiany z pkt. 3 CHANGELOG są w
kodzie, zweryfikowane jako techniczne poprawne, ale nie osiągające zamierzonego efektu
stabilizacyjnego.

---

## 10. Korekta bonusu mistrzowskiego (+0,20→+0,15) i diagnoza L8 (na Twoje polecenie, 14.07.2026)

### 10.1 Sufit OVR — sprawdzone ponownie, bez zmian w kodzie

Na wyraźne polecenie zweryfikowano, że żaden atrybut zawodnika (a więc i `ovr()`, ich średnia
ważona) nie może przekroczyć 100, nawet z bonusami rozwoju. Przejrzane wszystkie miejsca
modyfikujące atrybuty `tec/pas/sht/def/phy/men`: `mkAttrs()` (`state.js`), `aiSeasonalRefresh()`
(w tym właśnie bonus sukcesu z sekcji 9), cotygodniowy trening gracza (`week-progress.js`),
generator juniora (`match-post.js`), akademia (`academy.js`) — **każde bez wyjątku klamruje do
`Math.min(99, ...)` przy każdym pojedynczym przyroście**, niezależnie od wielkości mnożnika
`clubDevMult`/bonusu. Rzeczywisty sufit to 99 (o 1 pkt niżej niż wymagane 100) — wymóg spełniony
z zapasem, zero zmian w kodzie potrzebnych. Jedyne wystąpienia `Math.min(100,...)` w kodzie
dotyczą pola `form` (kondycja/dyspozycja, osobna skala 0-100, nie wchodzi do wzoru `ovr()`).

### 10.2 Bonus mistrzowski zmniejszony z +0,20 do +0,15

`engine/kronika.js`, `aiSeasonalRefresh()` — jedna liczba zmieniona (`_isChampionR` gałąź
`_successMultR`). Wciąż wyraźnie wyższy niż `+0,10` za samą górną połowę tabeli, ale już nie
podwojony względem tego, co zastępował. Mechanizm tłumienia piętrzenia (`ai._successStreak`,
sekcja 9) bez zmian. `node --check` przeszedł. **Nie uruchomiono jeszcze nowej symulacji
weryfikującej tę konkretną wartość** — do zrobienia, jeśli chcesz kontynuować pętlę
pomiar→decyzja→kod dla tej zmiany tak samo rygorystycznie jak dla poprzedniej.

### 10.3 Diagnoza L8 — znaleziona prawdziwa przyczyna, NIE jest to bonus reputacyjny

Zbudowana dedykowana instrumentacja (trajektoria sezon-po-sezonie zamiast tylko punktów
kontrolnych S1/S10/S50, rozbicie juniorów wg progu reputacji, mini-ablacja z wyzerowanym
`_repJuniorBonus`) wykazała:

**Prawdziwa przyczyna: jednorazowy "wstrząs bootstrapowy" przy przejściu sezon 1→2, którego
WZGLĘDNA (procentowa) dotkliwość rośnie im niżej w piramidzie lig.** `mkPlayer()` losuje wiek
początkowego składu jednolicie z `r(17,35)`, niezależnie od ligi — więc każda liga startuje z
częścią zawodników już w paśmie ryzyka emerytalnego (32+). Przy przejściu sezon 1→2 ta grupa
przechodzi na emeryturę jednorazowo, masowo (w zmierzonym przebiegu: 22 emerytury w L8 w tym
jednym przejściu, potem **zero** emerytur przez sezony 2-15, dopóki pierwszy rocznik juniorów nie
dorośnie do wieku ryzyka ~14-16 sezonów później). Ten wstrząs dotyka WSZYSTKICH lig jednakowo w
punktach absolutnych, ale:
- L1 ma dostęp do typu `bogaty` (wykluczonego w ligach 5-8) — natychmiast odkupuje jakość, czubek
  składu ledwo drgnie;
- L8 nie ma `bogaty`, ma najwyższy `churnMult` (najluźniejsze standardy zastępstwa) i pasmo
  zastępczych juniorów zakotwiczone o `lgMin=8` — najniższe z całej gry — więc emeryci są
  zastępowani dużo słabszymi zawodnikami;
- ten sam ABSOLUTNY spadek punktowy ląduje na bazowym OVR ~24,5 (L8) zamiast ~76 (L1) — z grubsza
  **poczwórnie mocniejszy efekt procentowy** na dole piramidy niż na górze.

Trajektoria sezon-po-sezonie (ten sam przebieg, sezony 0-7): L1: 0% / 1,8% / 2,4% / 3,1% / 3,4% /
4,0% / 5,1% / 5,0%. L8: 0% / **-9,5%** / -9,2% / -9,5% / -6,8% / -7,2% / -3,7% / **-1,1%**. **To
efekt przejściowy, samoistnie wygasający** — L8 wyraźnie odbija już od sezonu 4-5 i zbliża się do
zera do sezonu 8. Próg korytarza (-1% w sezonie 10) trafia dokładnie w środek tej krzywej
powrotu, nie w jej dno.

**Hipoteza o bonusie reputacyjnym: częściowo trafna, ale NIE dominująca przyczyna, i nie dało się
jej czysto wyizolować.** L8 ma faktycznie więcej klubów poniżej progu rep&lt;50 niż wyższe ligi
(11/16 w zmierzonym S1 vs praktycznie zero w L7) — junior OVR w L8: rep&lt;50 średnio 11,91
(n=721) vs rep 50-249 średnio 19,17 (n=794), różnica 7,26 pkt — ale z tego tylko ~2 pkt to
faktycznie nowy `_repJuniorBonus` (reszta to już wcześniej istniejący wzór zakotwiczony do
`avgOvr` klubu, który i tak faworyzował silniejsze/zwykle bogatsze w reputację kluby, zanim
cokolwiek dziś zmieniłem). Mini-ablacja (ten sam harness, `ai.reputation` sztucznie ustawione na
100 — pasmo zerowego bonusu — tylko na czas generowania juniora) dała wynik **odwrotny** do
hipotezy: wariant BEZ bonusu wypadł gorzej (S10 -6,80%/S50 +5,54%) niż z prawdziwym kodem (S10
+2,49%/S50 +23,80%) w tym samym przebiegu — ale ten sam nominalny wariant dał w dwóch
WCZEŚNIEJSZYCH, niezależnych przebiegach w tej sesji -7,5% w S10, nie +2,49%. **L8 ma tak niski
OVR bazowy, że procentowy odczyt jest silnie zaszumiony pojedynczą próbą** — różnica między
przebiegami tego samego nominalnego wariantu jest większa niż mierzony efekt bonusu. Wniosek:
wkładu `_repJuniorBonus` w problem L8 nie da się dziś czysto wydzielić z szumu przy budżecie
prób użytym w tej diagnozie.

Awanse/spadki specyficzne dla L8 (2 kluby w/z każdego sezonu, L8 nie ma niższej ligi do
"zrzucania" najsłabszych klubów) sprawdzone i **wykluczone** jako istotny wkład w dołek sezonu 10
— stałe, nie wyróżniają się.

### 10.4 Wniosek i rekomendacja

**To nie jest coś, co dzisiejsze zmiany wprowadziły ani coś, co bonus reputacyjny psuje lub
naprawia w wykrywalny sposób** — to strukturalny, jednorazowy efekt startu gry (rozkład wieku
populacji sezonu 1), wzmocniony strukturą L8 (brak `bogaty`, najniższe pasmo juniora), a nie
mechanizm cykliczny wymagający corocznej korekty. Kandydat do adresowania, jeśli zależy Ci na
domknięciu tego konkretnego punktu korytarza: **złagodzenie rozkładu wieku populacji startowej**
(`mkLeaguePlayers()`/`mkPlayer()`, dziś jednolite `r(17,35)` niezależnie od ligi) tak, by mniej
zawodników startowało już głęboko w paśmie ryzyka emerytalnego — to adresowałoby PRZYCZYNĘ
(wstrząs bootstrapowy), nie tylko L8, tylko OSOBNO dla wszystkich lig proporcjonalnie do ich
wrażliwości. **Nie proponuję konkretnego wzoru bez pomiaru** — czekam na Twoją decyzję, czy to
w ogóle wymaga interwencji, skoro efekt jest przejściowy i samoistnie wygasający do sezonu 8.
