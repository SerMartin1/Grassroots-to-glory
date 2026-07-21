# TODO – Grassroots to Glory (Android Football Manager)

## STATUS
Projekt: Grassroots to Glory
Typ: Football Manager (singleplayer)
Cel: emocjonalna kariera + historia klubu + długoterminowa retencja

---

## ZASADY OBOWIĄZUJĄCE W KAŻDYM ZADANIU
- Każda nowa treść tekstowa: jednocześnie **T.pl i T.en** (nigdy jeden język).
- Każdy nowy UI: tylko 9 istniejących tokenów `--fs-*` / klas `.fs-*`, zero literalnych `font-size`.
- Zero `font-family` w JS — tylko `font-weight`, jeśli w ogóle.
- Realne progi liczbowe zawsze wyciągane z istniejącego kodu — nigdy nie wymyślane.
- Brak migracji zapisów — nowe pola `G` inicjalizowane w `initGame()` z komentarzem o kompatybilności.
- **Zasada #7**: każda sesja Claude Code zaczyna się od diagnozy read-only (lista plików, raport,
  pytania) i czeka na moją akceptację przed napisaniem kodu.

## FILOZOFIA (feedback ze społeczności)
Gracze nie proszą o więcej lig/klubów. Proszą o głębię rozgrywki, długie sensowne kariery,
akademię i wychowanków, relacje z zawodnikami, realistyczną symulację.
→ Priorytet: **JAKOŚĆ SYSTEMÓW > ILOŚĆ ZAWARTOŚCI**. Mniej lig, ale każda w pełni "żywa".

**Zamrożone do czasu domknięcia:** transfer systemu (redesign), kontuzji (pełny system),
eventów/Kroniki (retencja), AI transferowego — nie rozbudowywać liczby lig/klubów wcześniej.

---

## JAK CZYTAĆ TĘ LISTĘ

Poniżej wszystkie zadania (stare + nowe, bez duplikatów) posortowane **od najmniejszego do
największego nakładu pracy wdrożeniowej** — nie wg tematu, tylko wg tego, ile trzeba dotknąć
kodu/plików. Każdy punkt ma odnośnik `[prompt: #N]` do gotowego, wklej-i-działaj promptu
diagnostycznego z pliku **PROMPTY_ROZWOJOWE.md** (numeracja 1–18). Dwa tematy (Ekonomia,
Akademia) mają już pełne, rozbudowane prompty napisane wcześniej — zostawione w całości na
końcu tego pliku, bo są zbyt długie żeby streszczać.

---

# 🟢 POZIOM 1 — Drobne poprawki (bug, jedna funkcja, jedna sesja)

☐ **Karta zawodnika — numer zawodnika**
  Dodać/poprawić wyświetlanie numeru na karcie. (część większego zadania #9 poniżej —
  jeśli chcesz to zrobić osobno i szybko, wydziel tylko tę część)

☐ **Reputacja i frekwencja — widoczność zmian**
  Po przejściu do nowego widoku pokazać deltę zmiany (nie tylko wartość końcową).

☐ **Stabilność ogólna**: font consistency, UI click delays, render lag fixes, drobne bug fixy
  (zbiorczy worek na drobnice wykryte na bieżąco)

☐ **Terminarz — numer kolejki przy każdym meczu**
  Przy każdym meczu w terminarzu wyraźnie zaznaczyć, która to kolejka (nie tylko
  data/przeciwnik). [prompt: #19]

---

# 🟡 POZIOM 2 — Małe zadania (jeden plik/moduł, ograniczony zakres)

☐ **Kontrakty — natychmiastowy update po akceptacji**
  UI ma się odświeżać od razu po zaakceptowaniu warunków.

☐ **Kontrakty — info w aktualnościach + kolor dla wygasających**
  Po przedłużeniu kontraktu: news w kategorii "klub". Zawodnicy z kończącym się kontraktem
  wyróżnieni innym kolorem na liście. [prompt: #5, część A]

☐ **Trening 30+**
  Wiek 30+ → wolniejszy progres atrybutów.

☐ **Audyt: równe szanse reputacji gracz vs AI**
  Sprawdzić, czy wzrost reputacji jest tak samo dostępny dla klubu gracza i klubów AI, czy
  jest ukryta przewaga/kara po którejś stronie. [prompt: #4]

☐ **Menu UI: "Zgłoś błąd"**
  Formspree + state dump.

---

# 🟠 POZIOM 3 — Średnie zadania (nowa treść/mechanika, kilka plików, kontrolowany zakres)

☐ **Gablota osiągnięć — komentarze przy awansie/mistrzostwie**
  Min. 100 unikalnych wariantów tekstowych, bez powtórek w ramach jednej rozgrywki.
  [prompt: #2]

☐ **Kronika — pożegnanie legendy/wychowanka**
  Gdy legenda/wychowanek odchodzi (transfer lub koniec kariery) — pełny wpis pożegnalny
  z podsumowaniem kariery (mecze, gole, sezony) zamiast suchego newsa transferowego.
  [prompt: #3]

☐ **Kontrakty — procentowa szansa akceptacji**
  Zamienić prosty warunek (np. "1 na 3 akceptuje") na szansę zależną od pensji, wieku,
  formy/potencjału, ligi klubu, więzi. [prompt: #5, część B]

☐ **Karta zawodnika — rozbudowa wskaźników**
  Więcej wskaźników, podział np. fizyczne/techniczne. Przygotować 3 warianty układu do
  wyboru. [prompt: #9]

☐ **Optymalizacja danych i zakładek przed publikacją**
  Przegląd wydajności: localStorage, lazy-loading modułów, duplikaty/martwe funkcje,
  re-rendery UI. [prompt: #18]

☐ **Strona klubu + domena**
  Decyzja nazwy (pełna nazwa vs skrót GtG), landing page z Kroniką jako hakiem
  marketingowym + link do gry + dev-logi, kupić domenę przed publikacją.

☐ **Kosmetyczna personalizacja tożsamości klubu**
  Nazwa stadionu, motto klubu, kolory — zero wpływu na rozgrywkę, budowanie przywiązania
  emocjonalnego (możliwy przyszły kandydat na płatną opcję kosmetyczną). Pierwsza iteracja
  prawdopodobnie tylko motto + nazwa stadionu; kolory osobno ze względu na powiązanie
  z `pixelart.js`. [prompt: #20]

☐ **Promocja Kroniki Klubu (viral hook) + demo na itch.io**
  Kronika jako główny mechanizm "shareable" (screenshoty/historia klubu) — rozpisać jako
  plan komunikacji Reddit/Discord. Do rozważenia: demo ograniczone do ~5 sezonów na itch.io,
  pełna wersja na własnej stronie (to już zadanie techniczne — jeśli chcesz, zrobię osobny
  prompt diagnostyczny na limit sezonów w wersji demo).

---

# 🔴 POZIOM 4 — Duże zadania (nowe systemy, wiele plików, wielosesyjne)

☐ **Kontuzje — pełny system**
  Prawdopodobieństwo, wpływ na formę, wpływ na trening.

☐ **Przebudowa zakładki Transfery (UI/UX)**
  `systems/transfers.js` łączy logikę z renderowaniem — sprawdzać oba aspekty przy zmianie.
  Rozważyć stały limit ofert w sezonie (np. 20/sezon). [prompt: #10]

☐ **AI Transfer Market**
  Rotacja zawodników (weekly), dynamiczny popyt → cena, "zarezerwuj zainteresowanie",
  wskaźnik rywalizacji na karcie.

☐ **Rynek transferowy — okna transferowe**
  Przeglądanie/negocjowanie/kupno/sprzedaż możliwe w każdej kolejce, ale zawodnik
  faktycznie przechodzi do/z klubu tylko w oknach (np. kolejki 1–2 i 16–17). Wymaga
  osobnego stanu "oferta w toku, czeka na okno" i dotyka przepływu danych całego
  systemu transferowego (gracz + AI). [prompt: #22]

☐ **Wzrost i waga zawodnika — wpływ na grę**
  Fizyczność (gra powietrzna, pojedynki barkowe, stałe fragmenty) jako realny czynnik
  w silniku meczowym. [prompt: #12]

☐ **Więcej budynków infrastruktury**
  Nowe budynki (np. ośrodek medyczny, centrum analityczne) z jasnym efektem mechanicznym,
  kosztem i progiem zależnym od ligi. [prompt: #1 / #L]

☐ **Rozbudowa sponsoringu**
  Osobne kategorie: sponsor koszulki, banery stadionowe, nazwa tytularna stadionu — liczba
  i wysokość ofert zależna od poziomu ligi. [prompt: #1 / #M]

☐ **Finanse — nowe źródła przychodu/kosztu (diagnoza zbiorcza)**
  Bilety (cennik i wpływ na frekwencję), premie zespołowe (za wynik/cel zarządu), logistyka
  transportu na wyjazdy, prawa TV zależne od ligi, kredyt bankowy (warunki/spłata/ryzyko).
  Cel dodatkowy: dokręcić ekonomię tak, żeby trzeba było kombinować na granicy niedoboru
  środków. [prompt: #1]

☐ **"One more season effect"**
  Hooki po sezonie: talent w akademii, sponsor, rywal transfer, stadion upgrade,
  historyczny awans.

☐ **Scenarios mode**
  Start z długiem, no transfers, survival mode.

☐ **Legacy profile**
  Statystyki menedżera, historia klubów po zakończeniu kariery.

☐ **Akademia — reszta rozbudowy (wiek 15 lat + wypożyczenia)** *(Wariant B już wdrożony —
  patrz ZREALIZOWANE niżej: trening w akademii, promocja, łuki fabularne ac21-ac33)*
  Zostały dwie świadomie odłożone części z pierwotnej diagnozy: (1) rekrutacja od 15. roku
  życia (dziś zostaje 16-17, wymaga osobnej mini-diagnozy wpływu na loterię emerytalną/
  populację świata), (2) wypożyczenie wychowanka do klubu AI w trakcie treningu i powrót
  (Wariant C z diagnozy — realnie osobny system, którego dziś w ogóle nie ma w kodzie).

---

# 🟣 POZIOM 5 — Zadania architektoniczne (rdzeń silnika, długoterminowe systemy)

☐ **Meta-postęp kosmetyczny między save'ami** *(kandydat na najdłuższą diagnostykę z całej
  listy — priorytet dokładność raportu nad szybkością)*
  Tytuły/herby/motta odblokowywane po ukończeniu długich karier w poprzednich save'ach —
  czysto kosmetyczne, nigdy nie wpływa na OVR/ekonomię. Wykracza poza pojedynczy save
  (potencjalnie dane globalne, poza `G`, poza dzisiejszym modelem localStorage per-slot) —
  sesja diagnostyczna ma tylko zidentyfikować pytania architektoniczne, nie proponować
  gotowego rozwiązania. [prompt: #21]

☐ **Silnik gry — pojedynki zawodników (atak vs obrona)**
  Wynik meczu zależny od indywidualnych pojedynków (strefy boiska, atrybuty atakujące vs
  broniące, neutralizacja/przewaga), nie tylko zbiorczy rating drużyny. Duża zmiana
  architektury silnika — wymaga osobnej diagnozy przed mockupem. [prompt: #13]

☐ **Dalsza weryfikacja balansu strzałów/goli**
  Kontynuacja diagnozy asymetrii bonusów gracz vs symulacje AI-AI (taktyka, forma,
  zmęczenie, więź klubowa, stałe fragmenty gry). [prompt: #14]

☐ **Ekonomia gry — weryfikacja długoterminowa** *(diagnoza już napisana — patrz załącznik)*
  Audyt inflacji bogactwa (5–10 sezonów w przód), czy kluby AI mają nierealnie wysokie
  zyski, propozycja mechanizmu "ściągania" pieniędzy z gry.

☐ **Monetyzacja (future)**
  Premium (wyłącznie kosmetyka + statystyki + historia, zero pay-to-win), share system
  (generowane grafiki kariery, eksport do social media).

---

# 📌 SEKCJE BEZ PRZYPISANEGO ZADANIA (zostawione jako nagłówki na przyszłość)

- CRITICAL UX / FLOW FIXES — obecnie pusta, wrzucaj tu nowe krytyczne bugi na bieżąco
- LOCALIZATION / LANGUAGE SYSTEM — obecnie pusta
- HISTORY / LEGACY SYSTEM — obecnie pusta (patrz też Legacy profile w Poziomie 4)
- DATA / LOCALIZATION CLEANUP — obecnie pusta (patrz też optymalizacja w Poziomie 3)

---

# ✅ ZREALIZOWANE

☑ Losowa drużyna przy tworzeniu kariery (`drawRandomClub` / `rerollClub`) — było: prompt #17
☑ Więzi zawodników — UI poprawa + ekspozycja
☑ Kapitan drużyny — wybór i bonus — było: prompt #11
☑ Cechy gracza (traits) — weryfikacja wpływu na mecz — było: prompt #16
☑ Bug: zakładka Wyniki resetuje się po zamknięciu meczu — było: prompt #7
☑ Bug: cel zarządu "nie spadnij z ligi" możliwy w VII lidze (`systems/board-goals.js`) — było: prompt #6
☑ Akademia — Wariant B: trening w akademii przed promocją do kadry, sezonowy fokus, 13 nowych eventów Kroniki (`ac21-ac33`) — było: prompt #8 (częściowo, patrz punkt wyżej w Poziomie 4)
☑ Oznaczenie wychowanków (🎓) w Składzie → Meczowy, na boisku meczowym/taktycznym i w Treningu

---

# 🔥 CORE DESIGN GOAL
→ Grassroots to Glory = jedna historia gracza
→ gra ma tworzyć emocje i pamięć kariery
→ retencja przez wydarzenia, nie grind

---

# ZAŁĄCZNIK 1 — pełny prompt: EKONOMIA GRY — WERYFIKACJA DŁUGOTERMINOWA

[prompt gotowy: zbiór promptów rozwojowych, pkt C]

☐ AUDYT INFLACJI BOGACTWA (kilka sezonów naprzód)
- cel: sprawdzić, czy kluby (gracz i AI) nie gromadzą nadmiernego
  budżetu po np. 5–10 symulowanych sezonach
- metoda: wykorzystać istniejący dev mode (`runDevSim`) do przewinięcia
  wielu sezonów i zalogować budżet klubu co sezon (`devLog`)

☐ METRYKI DO ZEBRANIA PODCZAS SYMULACJI
- budżet klubu gracza vs. budżety kilku losowych klubów AI (start/koniec
  każdego sezonu)
- stosunek fundusz płac / przychód tygodniowy (czy rośnie, maleje,
  stabilizuje się?)
- średnia wartość transferowa zawodnika w danej lidze na przestrzeni
  sezonów (czy `calcValueDynamic`/`calcDynamicValueMult` powoduje
  narastającą inflację cen?)
- suma nagród z celów zarządu (`board-goals.js`) w czasie
- koszty utrzymania (`tcUpkeep`, `acadUpkeep`, moduły stadionu) — czy
  skalują się razem z przychodem, czy zostają w tyle?

☐ MOŻLIWE PRZYCZYNY DO SPRAWDZENIA (bez zgadywania — tylko analiza)
- brak mechanizmu "ściągania" pieniędzy z gry (sink) proporcjonalnego
  do sukcesu klubu (podatek, rosnące pensje gwiazd, inflacja kosztów
  transferu wychodzącego)
- czy `calcWeeklyIncome` (core/data.js) rośnie szybciej niż koszty
  operacyjne klubu
- czy AI (`aiTransferPlayer`/`aiTransferSeason` w match-post.js)
  systematycznie kupuje/sprzedaje w sposób, który generuje im nadwyżkę
  bez realnego kosztu
- czy nagrody z pucharu/ligi (`grantCupReward`, `checkBoardGoals`) mają
  sensowny sufit, czy skalują się bez ograniczeń wraz z sukcesem klubu

☐ PLIKI ZWIĄZANE Z EKONOMIĄ (do analizy przed jakąkolwiek zmianą —
  zgodnie z zasadą nr 7 z CLAUDE.md, najpierw lista plików i propozycja,
  potem kod)
- core/state.js — calcValue, calcValueDynamic, calcDynamicValueMult,
  calcSalary
- core/data.js — calcWeeklyIncome
- systems/finance.js — przychody/wydatki, kontrakty
- systems/transfers.js — ceny rynkowe, oferty
- engine/match-post.js — aiTransferPlayer, aiTransferSeason (ekonomia AI)
- systems/training-stadium.js, systems/academy.js — koszty utrzymania
- systems/board-goals.js — nagrody za cele zarządu
- engine/cup-engine.js — grantCupReward

☐ WYNIK OCZEKIWANY
- raport: czy istnieje realny problem inflacji, w którym dokładnie
  miejscu (przychody, koszty, czy oba), oraz propozycja rozwiązania
  (np. skalujące się koszty, podatek od sukcesu, sufit nagród) —
  bez wdrażania zmian przed akceptacją

---

# ZAŁĄCZNIK 2 — pełny prompt: KONTEKST AKADEMIA

Chcę rozbudować system Akademii (systems/academy.js) w Grassroots to Glory, żeby
gracz mógł się w nią mocniej angażować — obecnie akademia generuje "prospektów"
i pozwala ich zaakceptować/odrzucić, ale poza tym jest dość bierna. Chcę realnego
systemu wychowanków: zawodnicy trafiający do akademii już od 15. roku życia,
z możliwością ich indywidualnego treningu/rozwoju w ramach akademii (nie tylko
przez ogólny training-stadium.js), zanim trafią do kadry seniorskiej.

Dodatkowo: akademia ma stać się jednym z filarów retencji, nie tylko generatorem
zawodników. Chcę, żeby każdy wychowanek miał prosty łuk fabularny — kilka
zdefiniowanych "etapów" jego historii w klubie (np. debiut, pierwszy poważny kryzys
formy/kontuzja, przełomowy sezon, ewentualny odjazd na wypożyczenie, powrót,
osiągnięcie statusu gwiazdy albo rozczarowanie i zejście z radaru), które generują
wpisy w Kronice Klubu i budują przywiązanie gracza do konkretnego zawodnika — a nie
tylko traktują wychowanka jako kolejny zestaw liczb OVR/potencjał. Łuk ma być prosty
(kilka etapów, nie rozgałęziona fabuła) i mechanicznie tani we wdrożeniu — cel to
częstsze, drobne momenty emocjonalne rozłożone w czasie, a nie jeden duży system.

Dodatkowo chcę, żeby samo szkolenie juniora w akademii było ciekawym mechanizmem samym
w sobie, a nie tylko biernym "poczekaj N sezonów aż wyrośnie OVR" — coś, co daje graczowi
realne, powtarzalne decyzje do podjęcia (np. wybór ścieżki rozwoju/fokusu, kompromis
między szybszym rozwojem a ryzykiem, elastyczność zależna od zaangażowania gracza) i
samo w sobie zachęca do regularnego wracania do zakładki akademii — to osobny czynnik
retencji obok łuków fabularnych, więc w diagnozie i propozycjach potraktuj go jako
odrębny wymóg, nie tylko przy okazji.

KROK 1 — DIAGNOZA (przed jakimkolwiek kodem)
Przeanalizuj i opisz obecny stan, w szczególności:
1. `systems/academy.js` — jak dziś działa `generateProspects`, `acceptProspect`,
   `rejectProspect`, jaki jest obecny przedział wiekowy generowanych prospektów,
   jak wygląda `renderAcadWychowankowie` i co faktycznie dziś się w niej dzieje
   po zaakceptowaniu zawodnika (czy trafia od razu do `G.players`, czy istnieje
   jakiś pośredni status "w akademii"?).
2. `core/state.js` — `mkPlayer`/`mkAttrs`/`calcPotential` — jak są dziś liczone
   atrybuty/potencjał juniora i czy dają się bezpiecznie rozszerzyć o młodszy
   wiek startowy (15 lat) bez psucia istniejących wzorów dla reszty świata.
3. `systems/training-stadium.js` — jak działa dziś trening (`setTrain`,
   `setIntensity`, obozy) i profile Centrum Treningowego (`tcProfiles`,
   `tcMaxProfiles`) — czy i jak dałoby się to powiązać/odseparować dla
   wychowanków akademii vs. reszty kadry.
4. Znany, już udokumentowany dług: pola `h.ovr`/`h.m`/`h.g`/`h.a`/`h.club`
   w `G.academy.hist` (zakładka "Historia" wychowanka) nigdy nie są
   ustawiane przez żadne miejsce, które tam pushuje — sprawdź, czy to
   wchodzi w zakres tego zlecenia i czy nowy system powinien to naprawić
   przy okazji, czy zgłosić jako osobną sprawę.
5. Powiąż z zasadą stabilności OVR (max -1%/10 sezonów AI, +brak górnego
   limitu) — nowy system treningu młodzieży w akademii NIE może zaburzać
   tej równowagi dla świata AI, tylko dla klubu gracza.
6. `engine/kronika.js` — jak dziś działa `kronTrigger()` i `buildKron<Category>Events()`,
   czy istnieje już mechanizm śledzenia stanu pojedynczego zawodnika na przestrzeni
   sezonów (podobny do `G.flags.<name>` dla chain eventów), na którym dałoby się
   oprzeć prosty łuk fabularny wychowanka bez budowania nowego systemu od zera.

KROK 2 — 3 PROPOZYCJE ROZWOJU AKADEMII
Na bazie diagnozy przedstaw 3 różne koncepcyjnie propozycje (nie warianty
kosmetyczne, tylko odrębne podejścia do mechaniki), z uwzględnieniem:
- generowania wychowanków od 15. roku życia (przedział wiekowy, jak wpływa
  to na loterię emerytalną/populację świata — patrz naprawy z CHANGELOG
  pkt. 13-14, nie chcę powtórzyć tamtych błędów przy młodszej kohorcie),
- osobnego, aktywnego treningu wychowanka W RAMACH akademii (nie w training-
  stadium.js z resztą kadry) — np. indywidualne programy rozwoju, fokusy
  treningowe specyficzne dla wieku 15-18 lat, ryzyko kontuzji/wypalenia,
- ciekawy mechanizm samego szkolenia jako osobny czynnik retencji: nie bierne
  czekanie na wzrost OVR, tylko regularne, powtarzalne decyzje gracza (np. wybór
  fokusu na dany okres, kompromis szybszy rozwój/większe ryzyko, elastyczne
  dostosowanie planu do formy/wieku wychowanka) — coś, co samo w sobie zachęca
  do częstego wracania do zakładki akademii,
- momentu i warunków "promocji" wychowanka do kadry seniorskiej (automat
  po osiągnięciu wieku? decyzja gracza? wpływ na Kronikę Klubu — nowy typ
  eventu kronTrigger() dla debiutu wychowanka?),
- kosztu/zasobów: czy trening w akademii kosztuje osobny budżet, czy zależy
  od poziomu akademii (`getAcadLvl`), czy koliduje z limitami Centrum
  Treningowego,
- prosty łuk fabularny wychowanka jako czynnik retencji: zaproponuj konkretne
  etapy łuku (ile, jakie, w jakiej kolejności/warunkach się odblokowują),
  które z nich powinny trafiać na whitelistę timeline (`G.timeline[]`) a które
  zostają lokalnym newsem, i jak uniknąć tego, żeby łuk stał się kolejnym
  martwym mechanizmem (patrz dead event pattern / dawny `a05`) — każdy etap
  musi mieć konkretną konsekwencję mechaniczną lub przynajmniej trwały wpis
  w historii wychowanka, nie tylko tekst.

Dla każdej z 3 propozycji podaj: na czym polega, jakie pliki/funkcje by
dotknęła, główne ryzyka/koszty wdrożenia, jak podchodzi do łuku fabularnego
wychowanków, jak wygląda sam mechanizm szkolenia (na czym polegają decyzje
gracza i dlaczego mają być angażujące), i czy wymaga migawki/snapshotu
podobnego do systemu skautingu (Transfery), czy raczej ciągłego stanu.

STANDARDOWE ZASADY OBOWIĄZUJĄCE W TYM PROJEKCIE
- Każda nowa treść tekstowa: jednocześnie T.pl i T.en (nigdy jeden język).
- Żadnych literalnych font-size — tylko 9 istniejących tokenów --fs-* / klas .fs-*.
- Żadnego font-family w JS — tylko font-weight, jeśli w ogóle.
- Nie używaj `t` jako nazwy lokalnej zmiennej (koliduje z globalnym t()) — używaj `tr`.
- Wewnętrzne pola G/nazwy funkcji zostają po polsku, tłumaczenie tylko w warstwie t().
- Realne progi liczbowe (np. koszty rozbudowy akademii) zawsze wyciągaj z istniejącego
  kodu (`acadCost`, `acadUpkeep`) — nigdy nie wymyślaj.
- Brak promptów o migracji zapisów — jeśli trzeba, dodaj inicjalizację nowych pól G
  w initGame() z komentarzem o kompatybilności starych zapisów, bez pytania mnie o to.

Nie pisz żadnego kodu produkcyjnego w tej wiadomości — tylko diagnoza + 3 propozycje.
Czekam na moją akceptację jednej z nich (lub połączenia elementów) przed mockupem/kodem.
