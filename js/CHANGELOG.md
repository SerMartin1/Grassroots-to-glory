CHANGELOG
Zasady

Po każdej większej zmianie dopisz kilka krótkich punktów opisujących, co zostało zmienione wraz z datą.


14.07.2026
1. Resztkowy spadek OVR świata (cz. 4) — szerszy bonus potencjału juniora AI
- Kontynuacja zgłoszenia o spadającym OVR świata: po poprawkach z 13.07 (tempo treningu, dopasowanie transferów do ligi) świat przestawał spadać w nieskończoność, ale stabilizował się wyraźnie PONIŻEJ poziomu sezonu 1 (symulacja 40-sezonowa: średnio -3 do -9 pkt/liga). Cel: równowaga jak najbliżej sezonu 1.
- Diagnoza: potencjał juniora (`calcPotential()`, data.js) liczy się jako `aktualny_OVR + wąski_bonus`, a junior wchodzi z OVR blisko dołu ligi — nawet przy szybkim treningu fizycznie nie ma dokąd rosnąć. Dwie testowane poprawki (poszerzenie `LEAGUE_POT` per liga + podniesienie startowego OVR juniora do środka pasma ligi) okazały się WADLIWE przy pełnej weryfikacji: poszerzenie `LEAGUE_POT` jest globalne dla `calcPotential()`, więc podbijało potencjał też już dojrzałej populacji sezonu 1, nie tylko juniorów; podniesienie startu juniora w połączeniu z tym dawało systemowy WZROST OVR świata o +4 do +9 pkt PONAD sezon 1 zamiast stabilizacji (każdy z ~150-200 juniorów/sezon startował już blisko szczytu ligi, z dodatkowym szerokim bonusem na to nałożonym). Obie wycofane.
- Wdrożone: start OVR juniora zostaje przy oryginalnym paśmie (`r(lgMin-3,lgMin+10)`, ogon ligi), `LEAGUE_POT`/`calcPotential()` bez zmian (nie dotyka reszty świata). Jedyna zmiana: potencjał juniora liczony teraz OSOBNO, z szerszym bonusem `r(10,18)` zamiast wąskiego per-ligowego (np. VIII liga: 3-10) — sufit wciąż `LEAGUE_POT[lvl].max`, ten sam co dla reszty ligi.
- Wynik (symulacja 40-sezonowa, 3 przebiegi uśrednione): VI/VII/VIII liga (6/7/8) praktycznie odzyskują poziom sezonu 1 (-1,2 / +0,1, znaczna poprawa względem -5,7/-3,0 sprzed zmiany), IV/V liga (3/4) też wyraźnie lepiej (-4,3/-4,6 z -6,9/-8,6). Premier Division i I Liga (1/2) zostają bez zmiany, ok. -8 do -9 pkt poniżej sezonu 1 — osobny efekt, patrz pkt. 2 niżej.

2. Resztkowa luka Premier Division/I Liga (cz. 5) — głębia składu, nie gwiazdy
- Diagnoza (rozkład OVR starterzy-vs-ławka w symulacji 40-sezonowej, nie tylko średnia całego składu): w L1/L2 STARTERZY (top 11/klub) trzymają się blisko poziomu sezonu 1, ale ŁAWKA/głębia składu (pozostali ~13 zawodników) spada wszędzie o 9-11,5 pkt — także w ligach, które w pkt. 1 wróciły do poziomu sezonu 1. Przyczyna: `mkLeaguePlayers()` (news-bootstrap.js) przy starcie gry przydziela OVR całym 24-osobowym składom wg klasy klubu (gradient słaby→mocny klub w tabeli), więc nawet głębia mocnego klubu startuje wysoko — ale od sezonu 2 każdy klub, niezależnie od własnej siły, rekrutuje juniora z tego samego, płaskiego pasma CAŁEJ ligi (`r(lgMin-3,lgMin+10)`). Mocne kluby tracą tę przewagę w głębi składu, gdy ich sezon-1 kohorta się starzeje i schodzi z boiska.
- Wdrożone: start juniora podniesiony TYLKO dla klubów wyraźnie mocniejszych niż typowa dla ligi (`avgOvr` klubu, już liczone w tym miejscu pętli) — `r(max(lgMin-3,avgOvr-25), max(lgMin+10,avgOvr-10))` zamiast płaskiego `r(lgMin-3,lgMin+10)` dla wszystkich. Słabe/średnie kluby (avgOvr blisko lgMin) dostają dokładnie to samo pasmo co wcześniej — to nie jest jednolite podniesienie całej ligi (które w pkt. 1 zalewało świat i podbijało OVR ponad sezon 1), tylko przywrócenie różnicy między klubami.
- Wynik (symulacja 40-sezonowa, 3 przebiegi uśrednione): L1 -8,9→-7,6, L2 -8,0→-5,7 — realna, ale częściowa poprawa. Reszta lig w granicach szumu (L3 -4,3→-3,5, L4 -4,6→-6,5, L5 -7,7→-7,3, L6 -6,4→-6,7, L7 -1,2→0,0, L8 0,1→-0,2). L1/L2 wciąż zostają ok. 6-8 pkt poniżej sezonu 1 — luka nie zamknięta w całości, prawdopodobnie dlatego, że osiągnięcie elitarnego OVR (85+) zajmuje więcej sezonów rozwoju niż niższe ligi, a emerytura (ten sam wiekowy próg dla wszystkich) zabiera zawodników zanim nowe pokolenie w pełni dorośnie — osobny mechanizm (tempo starzenia/czas kariery), nietknięty w tej poprawce.

DO ZROBIENIA (jutro / następna sesja):
- Domknąć resztkową lukę Premier Division/I Ligi (L1 -7,6, L2 -5,7 poniżej sezonu 1) — hipoteza: tempo starzenia (28+, `aiSeasonalRefresh()`) i/lub próg wieku emerytury (`aiRenewContracts()`, match-post.js) jest tym samym dla wszystkich lig, więc elicie (potrzebującej więcej sezonów rozwoju do OVR 85+) brakuje czasu, zanim trafi na emeryturę — do zweryfikowania symulacją przed wdrożeniem, tym samym trybem co pkt. 1-2 wyżej (nie zgadywać, zmierzyć).
- Po wdrożeniu: przetestować w realnej grze (nie tylko izolowanej symulacji Node) na kilkusezonowym zapisie — symulacja nie ma prawdziwych wyników meczowych/tabel/Pucharu, więc bonus rozwoju za górną połowę tabeli (`clubDevMult`) nigdy się w niej nie różnicował jak w prawdziwej rozgrywce.
- Skrypty symulacyjne (Node, poza repo) zostały w scratchpadzie sesji — jeśli dalsza praca nad OVR świata ma być kontynuowana, odtworzyć je od nowa (nie są częścią repo, zgodnie z zasadą projektu o nietworzeniu zbędnych plików).

13.07.2026
1. Sezon 1: brak transferów AI do okna zimowego + bezpiecznik budżetowy AI
- Zgłoszenie gracza: zawodnicy FA na starcie gry, brak transferów w pierwszych kolejkach sezonu 1, brak transferów „za darmo" gdy klub nie ma funduszy. Analiza wykazała, że rozdział dodatkowej głębi składu (0-2 zawodników/klub) bezpośrednio do klubów na starcie zamiast osobnej puli FA to już wcześniej wdrożona, zamierzona zmiana (patrz pkt. 10, 12.07.2026, „zasada zamkniętego świata") — bez modyfikacji.
- Naprawione: `initGame()` (news-bootstrap.js) wołał `aiTransferSeason(false)` od razu na starcie kariery — kluby AI robiły pełną aktywność transferową (sprzedaż/kupno/juniorzy) jeszcze przed 1. kolejką sezonu 1. Usunięte; pierwsza aktywność transferowa AI w karierze pojawia się teraz dopiero przy otwarciu okna zimowego (runda 16), tak jak w każdym kolejnym sezonie (`aiTransferSeason(false)` nadal wołane przy zmianie sezonu w season-summary.js). Rynek transferowy gracza pozostaje otwarty od tygodnia 1 jak dotąd (nie ruszany).
- Naprawione: uzupełnianie składu klubu AI do preferowanego rozmiaru (krok w Fazie 3 `aiTransferSeason()`, match-post.js, wywołujący `aiSignReplacement`) nie sprawdzało w ogóle budżetu klubu — klub bez pieniędzy i tak „kupował" zawodnika, schodząc głęboko na minus. Rozdzielone na dwa kroki: prawdziwy kryzys składu (<18 zawodników) nadal może podpisać zawodnika mimo braku funduszy jako ostateczność (żeby klub AI nie został bez możliwości wystawienia drużyny), natomiast zwykłe uzupełnianie (18→24) wymaga teraz pokrycia w budżecie (`requireBudget:true`) — klub bez funduszy po prostu nie robi transferu.

2. Log transferów klubu pokazywał zbyt dużo pozycji „—" (za darmo) + błędna etykieta „→ FA"
- Zgłoszenie gracza: w historii transferów klubu (karta klubu → zakładka Karta, sekcja logu) zdecydowana większość wpisów miała cenę „—" zamiast kwoty, a część sprzedaży pokazywała „→ FA" mimo że zamknięty świat (pkt. 10, 12.07.2026) nie ma puli wolnych agentów.
- Przyczyna 1 (realny błąd zaokrąglenia): `calcValue()` (state.js) ma podłogę 500 i nigdy nie zwraca 0, ale dwa miejsca liczące cenę transferu AI (Faza 1 — wystawienie na sprzedaż, i `aiSignReplacement()` — realokacja) zaokrąglały wynik do pełnych tysięcy PO przemnożeniu przez losowy mnożnik, więc dla słabych/starszych zawodników blisko tej podłogi cena potrafiła spaść do 0. Naprawione: podłoga 500 dodana też po przemnożeniu, w obu miejscach (match-post.js).
- Przyczyna 2 (celowe 0, zmienione na decyzję gracza): transfer po wygasłym kontrakcie bez odnowienia (`aiRenewContracts()`, krok „wygasłe kontrakty", match-post.js) miał zawsze cenę sztywno 0 — to była zasada Bosmana (realny wolny transfer), ale generowała największy wolumen wpisów „—" w logu. Zmienione na symboliczną opłatę (10-20% wartości zawodnika, podłoga 500) — nowy klub musi mieć na nią pokrycie w budżecie, inaczej kandydat odpada, a przy braku jakiegokolwiek chętnego kontrakt automatycznie się przedłuża (istniejący fallback). Rzadkie wydarzenia fabularne Kroniki Klubu (pkt. C, kronika.js) zostawione bez zmian — to osobny, świadomie darmowy mechanizm narracyjny, znikomy wolumen.
- Przyczyna 3 (błąd wyświetlania, nie mechanizmu): etykieta „→ FA" zamiast „→ 🏁" przy emeryturze zawodnika AI. Log emerytury (match-post.js) zapisywał `toClub:null` i liczył na to, że karta klubu (club-modal.js) znajdzie żywy obiekt gracza po `playerId` i sprawdzi `status==='retired'` — ale zapis gry (news-bootstrap.js) przycina `G.retiredPlayers` do zawodników, którzy grali w klubie gracza, więc AI-owy emeryt po wczytaniu zapisu znikał z danych i log mylnie pokazywał „→ FA", sugerując istnienie puli wolnych agentów, choć w rzeczywistości zawodnik po prostu zakończył karierę. Naprawione jawną flagą `retired:true` zapisywaną wprost na wpisie logu — nie zależy już od tego, czy zawodnik nadal istnieje w danych.

3. Kluby AI w słabszych ligach kurczyły się poniżej minimum składu (VII liga: spadek do ~14 zawodników po 10 sezonach)
- Zgłoszenie gracza: ustalić min/max liczby zawodników na pozycję i całościowo dla klubów AI; dla gracza jedna całościowa liczba max, bez wymuszonego minimum ani rozkładu pozycyjnego.
- Wprowadzona jedna wspólna stała `SQUAD_SIZE={min:18, target:24, max:30}` (data.js) zastępująca rozrzucone po match-post.js literały (25/40/22-25 zależnie od miejsca) — `min` to suma `POS_QUOTA.min` (GK 2, OBR 6, POL 6, NAP 4).
- Przyczyna 1: krok „wygasłe kontrakty" w `aiRenewContracts()` (match-post.js) — najbardziej masowa ścieżka odpływu zawodników AI — w ogóle nie sprawdzał, czy odejście zepchnie klub źródłowy poniżej `SQUAD_SIZE.min` lub poniżej `POS_QUOTA.min` na danej pozycji (w odróżnieniu od dobrowolnej sprzedaży, gdzie `aiEvaluateSale()` już to pilnował). Naprawione: taki sam warunek dodany przed przeniesieniem; jeśli złamałby minimum, kontrakt automatycznie się przedłuża (istniejący fallback), zamiast wywozić klub poniżej progu.
- Przyczyna 2: naprawa „kryzysu składu" (<18 zawodników, wprowadzona 13.07.2026 pkt. 1) ograniczała dosyp do sztywnych 2 zawodników na sezon niezależnie od realnego niedoboru — klub na 12 zawodnikach i tak dostawał tylko +2, nigdy nie odrabiając różnicy. Naprawione: liczba dosypywanych zawodników domyka teraz faktyczny deficyt do `SQUAD_SIZE.min` (pętla w `aiSignReplacement` i tak zatrzymuje się na `targetSize`, więc to nie ryzykuje przesady).
- Dla gracza: nowy pojedynczy sufit `SQUAD_SIZE.max` (30) przy kupnie z rynku (`doBuy()`, transfers.js), podpisywaniu skautowanego talentu (`signTalent()`, transfers.js) i awaryjnym podpisaniu z panelu kryzysu kadrowego (`signFreeAgent()`, navigation-squad.js) — bez wymuszonego minimum ani wymogu pozycyjnego, gracz decyduje sam o liczbie i pozycjach w tym zakresie. Istniejący blok sprzedaży (min 22 zawodników, min 2 bramkarzy, tactics-playercard.js) zostawiony bez zmian na wyraźną prośbę.

4. Spadający OVR świata AI, cz. 3 — kluby importowały zawodników za słabych na swoją ligę + trening AI 4-9× wolniejszy niż u gracza
- Zgłoszenie gracza: czy kluby AI kupują zawodników odpowiednich do swojej ligi, czy z za niskim OVR; następnie (w toku analizy) prośba o sprawdzenie, czy wzrost przez trening w klubach AI nie jest za niski względem treningu gracza.
- Metoda weryfikacji: izolowana symulacja 16-sezonowa w Node (prawdziwy kod gry — match-post.js/kronika.js/data.js/state.js załadowane w `vm.Context` ze stubami DOM, syntetyczny świat 8 lig × 10 klubów), z opomiarowaniem każdego transferu AI (`aiTransferPlayer` — jedyne miejsce, przez które przechodzi każdy transfer) oraz z dekompozycją sumy OVR świata na sezon (trening/starzenie vs emerytury vs juniorzy).
- Przyczyna 1 (dopasowanie transferów): krok „wygasłe kontrakty" (`aiRenewContracts()`, match-post.js) — **>50% całego wolumenu transferów AI w świecie** — dobierał klub docelowy wyłącznie po zasięgu poziomu ligi (±2), wolnym miejscu i budżecie, bez żadnego sprawdzenia OVR względem ligi docelowej. W symulacji 40% transferów tą ścieżką lądowało poniżej dolnej granicy ligi docelowej (20% z całego wolumenu >5 pkt poniżej). Naprawione: dodana ta sama tolerancja co w `aiSignReplacement()` (`band[0]=lgMin-5`) — kandydat na klub docelowy odpada, jeśli zawodnik miałby tam OVR >5 pkt poniżej dolnej granicy tej ligi; brak pasującego kandydata → kontrakt automatycznie się przedłuża (istniejący fallback). Wynik: głębokie niedopasowania (>5 pkt poniżej granicy) spadły z 20% do ~0% transferów w symulacji.
- Przyczyna 2 (dominująca — tempo treningu AI): dekompozycja sumy OVR świata pokazała, że trening AI (`aiSeasonalRefresh()`, kronika.js — wzrost <22 lat i 23-27 lat) dawał netto zaledwie ~70-180 pkt/sezon na ~2000 zawodników świata — praktycznie nie licząc się przy odpływie emerytur (~-5000 pkt/sezon). Monte Carlo obu ścieżek (ta sama formuła co week-progress.js dla gracza) pokazało dlaczego: dawne `r(1,2)`/sezon (<22 lat) i `r(0,2)`/sezon (23-27 lat) dawały AI ~1-1,5 pkt/sezon, podczas gdy gracz z aktywnym fokusem na NOR dostaje ~8-9 pkt/sezon — **4-9× szybciej**, mimo że to sam mechanizm rozwoju (potencjał, `calcPotential`) miał być wspólny dla całego zamkniętego świata. Naprawione: `r(1,2)`→`r(6,10)` (<22 lat), `r(0,2)`→`r(4,8)` (23-27 lat), oba dalej skalowane przez `clubDevMult` (filozofia klubu × reputacja × sukces sezonu) — przy clubDevMult=1,0 AI dostaje teraz ~8 pkt/sezon (20 lat) / ~6 pkt/sezon (24 lata), tego samego rzędu co gracz na NOR, wciąż nieco niżej (AI rozrzuca punkty po WSZYSTKICH 6 atrybutach zamiast 2 atrybutów fokusu, więc efektywny wpływ na OVR jest i tak skromniejszy niż u aktywnie zarządzanego gracza).
- Wynik łączny (symulacja 16-sezonowa, ten sam syntetyczny świat): trend spadku OVR wyraźnie spłaszczony, szczególnie w pierwszej połowie symulacji (Liga 1: poprzednio ~74→60 w 16 sezonów, po poprawce ~74→69, ze stabilnym płaskim odcinkiem sezony 3-9). Resztkowy spadek w dalszych sezonach wynika już głównie z naturalnej przewagi odpływu emerytów (~5000 pkt OVR/sezon) nad dopływem juniorów (~3500 pkt OVR/sezon) — osobny, mniejszy efekt, zostawiony bez zmian w tym przebiegu (juniorzy i emerytura były już tuningowane w pkt. 13-14, 12.07.2026).

12.07.2026
1. Zakładka WYNIKI w karcie klubu — mecze otwierały się „z opóźnieniem"
- Przyczyna: modal klubu jest przy każdym otwarciu przenoszony na koniec <body>, więc przy tym samym z-index co overlay meczu zawsze lądował nad nim — klik na mecz otwierał overlay ukryty pod wciąż widocznym modalem klubu. Naprawione: klik na mecz najpierw zamyka modal klubu (closeClubModal()), dopiero potem otwiera szczegóły meczu.

2. Oceny zawodników w szczegółach meczu — podpis drużyny + naprawiony brakujący skład rywala
- Sekcja ocen podzielona na dwie grupy z nagłówkiem nazwy drużyny (gospodarz/gość) zamiast jednej wymieszanej listy bez podpisu — dotyczy meczów AI-AI i gracz-AI.
- Złapany przy okazji poważniejszy błąd: mecz gracz-AI zapisywał w historii (G.mHist) oceny WYŁĄCZNIE własnych zawodników (filtr myPl() w match-engine.js) — oceny rywala AI w ogóle nie trafiały do zapisu, więc w historycznym widoku meczu połowa ocen zawsze była pusta. Naprawione zapisem obu drużyn, tak jak już działo się to dla meczów AI-AI.

3. Zakładka Tabela → Wyniki — można teraz otworzyć też mecze AI-AI
- Wcześniej klikalne były wyłącznie mecze z udziałem klubu gracza (lgRefreshWyniki() w season-summary.js); mecze AI-AI nie miały żadnej akcji. Dodane wyszukiwanie wpisu w G._mHistAI i otwarcie tych samych szczegółów meczu.

4. Powrót do widoku meczu po otwarciu karty zawodnika ze strzelców/ocen
- Linki do zawodnika w szczegółach meczu zamykały overlay meczu PRZED otwarciem karty zawodnika, więc mechanizm zapamiętywania „skąd wróciłem" (_captureReturnPoint()) nie widział już overlayu jako otwartego i po zamknięciu karty gracz lądował w złym miejscu (np. w tabeli ligi). Naprawione: overlay zamyka się dopiero PO otwarciu karty (showById() w news-bootstrap.js), tym samym wzorcem co już istniał dla modalu klubu/podsumowania sezonu.

5. News o wyniku meczu — przycisk „ZOBACZ MECZ" + naprawiony brak natychmiastowego wyświetlania
- Wiadomość o wyniku Twojego meczu w aktualnościach dostała przycisk prowadzący wprost do szczegółów tego meczu.
- Złapany własny błąd po drodze: addNews() renderuje listę od razu w środku siebie, a pole action/actionLabel dopisywało się do newsa DOPIERO po tym wywołaniu — pierwszy render wychodził bez przycisku i pojawiał się dopiero po przypadkowym kolejnym odświeżeniu listy. Naprawione dodatkowym renderNews() po ustawieniu action.

6. Przebudowa „PRZEBIEG MECZU" — wydarzenia pogrupowane per drużyna
- Zamiast jednej chronologicznej listy z tagiem drużyny przy strzelcu: dwie kolumny — wydarzenia gospodarzy po lewej, gości po prawej, każda z nagłówkiem nazwy drużyny i własną chronologią (gole + kartki). Kartki (bez zapisanej wprost drużyny w danych) przypisywane po aktualnym klubie zawodnika, tak jak już robiła to sekcja ocen.
- W kartach ocen doszły ikonki ⚽/🅰️ przy nazwisku — liczba ikonek odpowiada liczbie goli/asyst danego zawodnika w tym meczu.

7. Karta zawodnika: zakładka NAGRODY nie odświeżała się od razu
- renderPlayerAwards() był wołany wyłącznie przy ręcznym kliknięciu zakładki, w przeciwieństwie do zakładki HISTORIA, która odświeża się przy każdym (re)renderze karty. Efekt: świeża nagroda (np. MVP) nie pojawiała się, dopóki gracz nie przełączył zakładki i nie wrócił. Naprawione — nagrody renderują się teraz zawsze przy otwarciu/odświeżeniu karty, tak samo jak historia.

8. Powrót z karty klubu otwartej z poziomu karty zawodnika
- Audyt całego mechanizmu powrotu (karta klubu/gracza/mecz/podsumowanie sezonu) wykrył jeszcze jedną lukę: klik na nazwę klubu w karcie zawodnika zamykał kartę zawodnika PRZED otwarciem karty klubu, więc karta klubu nie miała zapisane, skąd przyszła — zamknięcie lądowało na przypadkowym wcześniejszym panelu zamiast z powrotem na karcie zawodnika. Naprawione dopisaniem tej ścieżki do window._clubModalReturn/closeClubModal(), tym samym mechanizmem co istniejący już powrót karta klubu ↔ szczegóły meczu.

9. Diagnoza i naprawa spadku OVR klubów AI — rozwój, transfery, limity pozycji
- Diagnoza (symulacja wieloseznowa w izolowanym środowisku, nie w grze): OVR klubów AI systematycznie spadał, bo `aiSeasonalRefresh()` (kronika.js) miał starzenie 28+ i wzrost ≤22 lat, ale zupełną lukę 23-27 lat (wiek świetności zawodnika stał w miejscu), a AI w ogóle nie miało własnego treningu.
- `aiSeasonalRefresh()` przebudowany: nowy mnożnik `clubDevMult` (filozofia klubu × reputacja × sukces kończącego się sezonu — górna połowa tabeli/Puchar) przyspiesza rozwój i łagodzi starzenie; nowe pasmo wzrostu 23-27 lat.
- Mechanika transferowa AI przepisana od zera (`match-post.js`): sprzedaż/zakup przechodzi teraz przez bramkę jakości (`aiEvaluateSale`/`aiEvaluateSigning` — kupuj tylko lepszych/porównywalnych, sprzedawaj tylko z konkretnym powodem), ochronę rdzenia składu (`aiCoreProtect` — najlepsi + młodzi wychowankowie nie idą na sprzedaż bez wyjątkowej oferty) i limit podpisań na sezon skalowany typem klubu i ligą (`aiSigningCap`, `LEAGUE_AI_TUNING`). Nowy mechanizm: AI proaktywnie przedłuża kontrakty chronionym graczom przed wygaśnięciem (`aiTryRenewContracts`), zamiast tracić ich bez decyzji klubu.
- Nowe limity liczby zawodników na pozycję w składzie (`POS_QUOTA`, data.js) — bez tego kluby AI potrafiły zgromadzić np. 10 bramkarzy i 0 napastników (zmierzone: 38% klubów z ≥4 bramkarzami po 8 sezonach), co samo w sobie osłabiało wyniki i przez to tempo rozwoju.
- Usunięty reset składu dołu VIII Ligi (season-summary.js) — kasował zawodników bez śladu i tworzył nowych przez surowy mkPlayer() z pominięciem pasma OVR ligi; to też był błąd, przez który klub GRACZA (jeśli spadł na dno VIII Ligi) tracił cały skład bez ostrzeżenia.

10. Likwidacja puli wolnych agentów (G.fa) — zamknięty świat
- Nowa, formalna zasada w js/CLAUDE.md: świat zawodników to zamknięty obieg — wejście wyłącznie jako junior, wyjście wyłącznie przez emeryturę, cała reszta to bilansowanie między klubami. Pula G.fa (zawodnicy „zawieszeni" bez klubu) łamała tę zasadę i dawała nierealistyczne, oderwane od budżetu ceny.
- Silnik AI: wygasły kontrakt/sprzedaż bez kupca szuka teraz bezpośrednio realnego klubu z wolnym miejscem (`aiSignReplacement` — zastąpił dawną `aiSignFromFA`); brak takiego klubu = kontrakt zostaje automatycznie przedłużony. Zero zawodników w zawieszeniu.
- Panel kryzysu kadrowego gracza (navigation-squad.js) pokazuje teraz konkretne, nazwane oferty transferu od klubów AI z nadwyżką na danej pozycji zamiast anonimowej listy „wolnych agentów", z ceną kotwiczoną do aktualnego budżetu gracza (nigdy więcej niż połowa) zamiast pełnej wartości rynkowej.
- 8 wydarzeń Kroniki Klubu opartych o G.fa (m.in. „okazja transferowa", „licytacja z rywalem", zbuntowany zawodnik) przepisane na realnych kandydatów z nadwyżki u klubów AI, z tą samą logiką kotwiczenia ceny do budżetu.
- 150 startowych wolnych agentów rozdzielone bezpośrednio do klubów AI na starcie gry zamiast osobnej puli.

11. Naprawa nadmiernej liczby transferów AI po pkt. 9-10
- Po wdrożeniu limitu podpisań na sezon (pkt 9) okazało się, że i tak dochodziło do kilkunastu transferów na klub na sezon zamiast kilku wg AI_TYPES.maxAnnualSignings, część z kwotami sięgającymi setek milionów euro, część klubów AI na kilkudziesięciomilionowym minusie budżetowym.
- Przyczyna 1: `aiTransferPlayer()` nigdy nie zapisywał strony sprzedającego (tylko kupującego) — naprawione, teraz loguje obie strony jednego transferu w jednym miejscu.
- Przyczyna 2: cztery z pięciu miejsc uzupełniających skład AI nie miały żadnego limitu liczby zakupów na wywołanie ani odniesienia ceny do budżetu — dodane limity i cena kotwiczona do budżetu kupującego (ta sama zasada co w pkt 10).
- Przyczyna 3: trzy niezależne, redundantne ścieżki robiły dokładnie to samo zadanie („uzupełnij skład") w tej samej sekwencji zmiany sezonu — dwie usunięte jako czysta duplikacja.
- Przyczyna 4: limit podpisań na sezon zerował się w środku sekwencji zmiany sezonu, PO tym jak dwie wcześniejsze funkcje już coś podpisały — te podpisania nigdy się nie liczyły do limitu. Reset przeniesiony na sam początek sekwencji.
- Wynik: liczba transferów na klub na sezon spadła o połowę, 0 klubów AI na minusie budżetowym w symulacji 5-sezonowej (wcześniej ~55 na ~127). Nadal wyżej niż docelowe 3-6/sezon — do dalszej obserwacji.

12. Limit sprzedaży, domknięcie ostatniej dziury w limitach transferów AI i naprawa populacji świata
- Dodany symetryczny limit sprzedaży (`aiSellingCap`, `maxAnnualSells` w AI_TYPES — akademia 2, sprzedający 5, bogaty 1, stabilny 2, skalowane ligą) — do tej pory capowane było tylko kupno, sprzedaż nie miała żadnego ograniczenia.
- Znaleziona i domknięta ostatnia nielimitowana ścieżka: krok „wygasłe kontrakty" w `aiRenewContracts()` (match-post.js) przenosił zawodnika do innego klubu całkowicie z pominięciem `aiSigningCap`/`aiSellingCap` — to była najbardziej masowa, w pełni bezlimitowa ścieżka transferów AI. Naprawione: transfer odbywa się teraz tylko gdy obie strony mają jeszcze zapas w limicie sezonowym; inaczej kontrakt automatycznie się przedłuża (już istniejący fallback).
- Wynik (symulacja 5-sezonowa): wolumen transferów na klub spadł z 48-64 (suma kupna+sprzedaży po 5 sezonach) do 25-49, zgodnie z zaprojektowanymi limitami per typ klubu (np. „sprzedający" z założenia ma wyższy wolumen — to jego filozofia, nie błąd).

13. Diagnoza i naprawa spadającego OVR świata AI, cz. 2 — nieosiągalny potencjał juniorów
- Diagnoza (symulacja 16-sezonowa z podziałem na grupy wiekowe): OVR grupy ≤22 lat spadał z ~46 do ~32 i się tam stabilizował, a `headroom` (potencjał minus OVR) rósł bez końca zamiast się domykać — grupa 23-27 zaczynała łapać ten sam spadek po ok. 6 sezonach, gdy słaby rocznik zaczynał w nią wchodzić.
- Przyczyna: generator juniorów AI (`aiTransferSeason`, match-post.js) liczył potencjał osobnym wzorem kotwiczonym do szczytu ligi (`lgMax*0.9+r(0,10)`), niezależnie od faktycznego (niskiego) OVR startowego juniora — luka 26-31 pkt, nieosiągalna przy obecnym tempie wzrostu. Cała reszta świata (populacja startowa, `mkLeaguePlayers()`) już używała właściwej, powiązanej z OVR formuły `calcPotential()` (data.js) — to był jedyny niespójny punkt.
- Naprawione dwoma zmianami w tej samej funkcji: pasmo startowego OVR juniora podniesione z `r(lgMin-8,lgMin+5)` na `r(lgMin-3,lgMin+10)`, potencjał liczony teraz przez `calcPotential(junior,lvl)` zamiast osobnego wzoru — headroom po zmianie stabilny ~12 pkt (dopasowany do reszty świata) zamiast rosnącego bez końca.
- Sprawdzone: system akademii własnego klubu gracza (`systems/academy.js`) ma podobnie dużą lukę potencjału (min. 20 pkt), ale to inny, zamierzony mechanizm — napędzany aktywnym treningiem gracza (`training-stadium.js`, bez twardej granicy wieku, ze wzmocnieniami z centrum treningowego), analitycznie osiągalny w ~7 sezonach nawet bez inwestycji. Zostawiony bez zmian.

14. Naprawa kurczącej się populacji świata AI
- Diagnoza: mimo napraw z pkt. 12-13 populacja świata AI systematycznie malała (3428→2921 w 16 sezonów, ~15%, bez oznak zatrzymania), choć dobór juniorów (~140-210/sezon) formalnie przewyższał zmierzony odpływ emerytów.
- Przyczyna 1 — podwójna loteria emerytalna: `season-summary.js` losował emeryturę dla WSZYSTKICH zawodników (`G.players.forEach`, próg 10-90% wg wieku) tuż przed tym, jak `aiRenewContracts()` (match-post.js) robił dla klubów AI DRUGĄ, niezależną loterię (inny próg 5-90%) — AI miało efektywnie dwie szanse na emeryturę w tym samym sezonie zamiast jednej. Pętla w `season-summary.js` miała wyraźny ślad, że pierwotnie miała dotyczyć tylko klubu gracza (news o zapowiedzi emerytury filtrowany po `myClubId`) — zawężona do `myPl()`, tak jak było zamierzone; AI ma teraz jedną, właściwą loterię.
- Przyczyna 2 — dobór juniorów wciąż za wolny nawet bez duplikatu: każdy klub AI miał tylko 85% szans w sezonie na w ogóle podjęcie naboru juniora (`Math.random()<0.85` w `aiTransferSeason`) — usunięty ten losowy próg (+17,6% naboru), dopasowane do zmierzonego niedoboru (~18%).
- Wynik (symulacja 16-sezonowa): populacja ustabilizowała się w okolicach 3120-3260 zamiast dalej spadać (spadek złagodniał z ~15% do ~9% i się wypłaszcza od 6. sezonu). Średni OVR świata nadal spada podobnym tempem co wcześniej — to osobny, wciąż niezbadany wątek (skład populacji nowych juniorów zdaje się przesuwać w stronę słabszych lig z czasem), do dalszej analizy.

11.07.2026
1. Newsy klubowe/transferowe — osobna sekcja per liga
- Przeniesione z ogólnej zakładki Świat do kontekstu przeglądu lig (ui/season-summary.js) — każda liga ma teraz własną zakładkę Newsy z wydarzeniami klubów tej ligi.
- Diagnoza przed wdrożeniem: struktura newsa (addNews) nie miała pola clubId/leagueId — trzeba było dopisać leagueLevel do G.worldNews (osobny kanał od newsów gracza, bez ryzyka dla starych zapisów).
- Zakładka Świat → Newsy usunięta całkowicie (duplikowała nową sekcję per liga) — zakładka „Newsy" w karcie klubu pokazuje wszystkie zdarzenia tego klubu bez filtra, zakładka przy lidze — tylko istotne (priority ≥ 50).
- Limit newsów: per liga (60 dla własnej ligi, 30 dla pozostałych) zamiast jednego globalnego licznika, z priorytetowym kasowaniem (ważne zdarzenia przeżywają dłużej niż rutynowe).
- Próg „duży transfer" przeliczony z mnożnika OVR (nieosiągalny w I lidze — wymagał OVR>99) na wartość rynkową zawodnika na szczycie pasma danej ligi.
- Zakres rozszerzony na wszystkie 8 lig (wcześniej tylko własna liga ±1) — dotyczy serii wyników, kryzysu finansowego (potem usuniętego, patrz niżej), talentów akademii, celów zarządu.

2. Pełna przebudowa architektury newsów (rejestr typów, nie if/else)
- Zaprojektowany i wdrożony rejestr WORLD_NEWS_TYPES (priorytet/ikona/kolor/pula wariantów tekstu/reguła cooldownu per typ) — dodawanie nowego typu newsa to teraz jeden wpis w rejestrze, nie rozgałęziony kod.
- Usunięty news o kryzysie finansowym klubów AI (Twoja decyzja redakcyjna) — samo naliczanie budżetu zostaje, wpływa na zdolność zakupową AI.
- Rekord serii klubu — seria zwycięstw/porażek jest teraz porównywana z historycznym rekordem klubu (nie tylko „dokładnie 4 z rzędu”); pobicie rekordu dostaje mocniejszy tekst i wyższy priorytet.
- Priorytet newsów akademii obniżony pod próg zakładki ligi — widoczne tylko na karcie klubu, zgodnie z Twoją uwagą.
- Komplet humorystycznych wariantów tekstu PL/EN dla każdego typu (3 warianty na typ), w tonie już ustalonym w narracji meczowej.

3. Łączenie newsów tego samego klubu w jednym tygodniu (digest)
- Na Twoją prośbę: kilka zdarzeń jednego klubu z tego samego tygodnia scala się teraz w jeden wpis zamiast osobno zaśmiecać log.
- Wymagało to przebudowy potoku zapisu na dwuetapowy: detektory zdarzeń buforują w club.ai, a flushWeeklyNews() (wołane na końcu tygodniowego cyklu i przy starcie nowego sezonu) opróżnia bufor — pojedyncze zdarzenie zapisuje się normalnie, kilka scala się w digest.
- Złapany własny błąd po drodze: newsy generowane na starcie sezonu (zapowiedź bukmacherska) trafiały do bufora, ale nic go tam nie opróżniało — ginęły po cichu. Naprawione dopisaniem brakującego wywołania flush we właściwym miejscu.

4. Walka o tytuł/spadek i bukmacherska zapowiedź sezonu
- 3 kolejki przed końcem sezonu: news o zaostrzającej się walce o tytuł i o utrzymanie, liczony matematycznie (czy pozostałe punkty do zdobycia wciąż pozwalają dogonić lidera/uciec ze strefy spadkowej).
- Pierwszy news sezonu w każdej lidze: bukmacherski typ na tytuł i kandydatów do spadku, oparty o już istniejącą siłę składu (tStr) — bez nowej symulacji.

5. Rywalizacje/derby
- Kluby parowane w derby na starcie każdego sezonu — jawnie umownie (arbitralnie), bo projekt nie ma danych geograficznych do parowania „prawdziwego"; potwierdzone z Tobą przed wdrożeniem.
- Mecz między parą rywali generuje osobny news z wyższym priorytetem niż zwykły wynik.
- Efekt uboczny: ożywione martwe dotąd pole G.rival w Kronice Klubu (istniało w kodzie, nigdy nie było przypisywane) — bez dotykania tego pliku.

6. Retrospektywa sezonu
- Klub AI i liga: podsumowanie najważniejszych zdarzeń sezonu budowane redakcyjnie nad już zapisanymi newsami (bez nowej symulacji), widoczne w karcie klubu i w zakładce ligi.
- Klub gracza: osobna ścieżka na Twoją prośbę — nowa zakładka „Sezon" w istniejącym podsumowaniu sezonu, budowana z newsów gracza (G.news), nie z kanału AI.
- Złapany własny błąd po drodze: mechanizm łączenia newsów (pkt 3) scalał niemal wszystkie zdarzenia klubu w jeden wpis na tydzień, więc próg „co najmniej 2 zdarzenia" na retrospektywę był praktycznie nieosiągalny — poprawione na „2 zdarzenia lub 1 naprawdę ważne".
- Całość zweryfikowana dynamicznie: dwa pełne sezony rozegrane w przeglądarce przez wbudowany symulator deweloperski, zero błędów w konsoli.

7. Poprawki po Twoim zgłoszeniu z dev-mode (3. sezon) + rozszerzenie puli tekstów
- Duplikat ikony w newsach świata: każdy szablon i tak zaczynał się od własnej ikony, a osobny znacznik ikony w _worldNewsItemHtml() ją powielał — usunięty znacznik, kolorowy pasek zostaje jako wskaźnik typu.
- Chronologia przy zmianie sezonu była zaburzona: newsy końca sezonu (mistrzostwo/awans/spadek/cel, a także zwykłe zaległe newsy tygodniowe typu seria/derby z ostatniego tygodnia) znakowały się numerem NOWEGO sezonu zamiast kończącego się, bo G.season++ następował przed ich wygenerowaniem/spłukaniem bufora. Naprawione przekazaniem zapamiętanego numeru i tygodnia kończącego się sezonu do flushAllWeeklyNews()/generateSeasonRecaps() — obejmuje to każdy typ zdarzenia, nie tylko wyliczankę. Kolejność wywołań w startNewSeason() przestawiona tak, by retrospektywa lądowała w newsach POD derbami/zapowiedzią nowego sezonu, zgodnie z oczekiwanym obiegiem: derby → zapowiedź → newsy sezonu → podsumowanie → (nowy sezon) podsumowanie poprzedniego → derby → zapowiedź...
- Zakres historii recapów rozdzielony na Twoją prośbę: w zakładce ligi widoczny tylko recap ostatniego zakończonego sezonu (starsze znikają), w karcie klubu zostaje pełna kronika wszystkich sezonów wstecz.
- Każdy klub AI dostaje teraz „sezon w skrócie" w karcie klubu co sezon, również gdy sezon był spokojny (wcześniej próg „min. 2 zdarzenia" pomijał ciche kluby całkowicie) — spokojny sezon dostaje dedykowany tekst zamiast braku wpisu.
- Pula tekstów newsów rozszerzona z 3 do 10 wariantów na typ (PL+EN), dla wszystkich 19 typów zdarzeń — WORLD_NEWS_TYPES generuje teraz listę szablonów pomocniczą funkcją zamiast ręcznie wypisanych kluczy a/b/c.

8. Kolejna runda poprawek po testach w dev-mode (chronologia, karta klubu, bramkarze, nagrody AI)
- Chronologia — druga warstwa błędu: nie tylko mistrzostwo/awans/spadek/cel, ale KAŻDY zwykły zaległy news tygodnia (seria, derby) mógł dostać datę nowego sezonu, jeśli czekał w buforze klubu w momencie zamknięcia sezonu. Naprawione przeniesieniem nadpisania sezonu/tygodnia na poziom samego wywołania flusha zamiast wyliczanki typów.
- Bukmacherska zapowiedź sezonu i ogłoszenie derbów (zdarzenia z tygodnia 1, nie „co się wydarzyło") wykluczone z puli kandydatów do retrospektywy — wcześniej ich wysoki priorytet wciągał je do „sezonu w skrócie" poprzedniego sezonu.
- Złapany własny błąd: limit newsów per liga kasował retrospektywy klubów jako pierwsze (priorytet 40, poniżej progu zakładki ligi) — przy ~15 klubach w lidze same coroczne podsumowania przekraczały limit i znikały. Retrospektywy całkowicie wyłączone z tego kasowania; dopisany backfill dogenerowujący brakujące wpisy (S1 wzwyż) na istniejących zapisach.
- Zakres retrospektywy ligi ograniczony na Twoją prośbę do ostatniego zakończonego sezonu (starsze znikają z zakładki ligi); w karcie klubu zostaje pełna kronika wszystkich sezonów.
- Klub gracza dostał to samo traktowanie co AI: retrospektywa budowana z jego newsów (G.news), z filtrem wykluczającym przypomnienia-CTA (okno transferowe, cele zarządu, sponsorzy, obóz, oferty premium — mają w kodzie pole `.action`, to przyciski „zrób X", nie historia sezonu).
- Nazwy klubów wspomniane w treści newsa (nie tylko ten, do którego news jest przypięty) są teraz klikalne — prowadzą do karty tej konkretnej drużyny.
- Trofeum „Mistrz" w karcie klubu nie pokazywało której ligi — dodana nazwa ligi; dopisana też naprawa retrospektyw, które w starym kodzie zgubiły samo zdarzenie mistrzostwa (dane zawsze poprawne w G.lgHist, niezależnym źródle).
- Bezpiecznik: mkPlayer() losuje pozycję bez gwarancji rozkładu (1/8 szans na bramkarza) — przy generowaniu całego składu naraz (reset dołu VII Ligi) była realna szansa (~9%) na zero bramkarzy w klubie AI. Dodana funkcja sprawdzająca i uzupełniająca po każdej operacji, która może zmienić składy AI (zmiana sezonu, zimowe okno, wczytanie zapisu).
- Nagrody sezonowe zawodników (mistrzostwo, Puchar, awans, król strzelców, najlepsza ocena, MVP, wierny klubowi, ulubieniec kibiców) liczyły się wyłącznie dla składu gracza — zakładka Nagrody u zawodników AI zawsze była pusta. Wydzielona wspólna funkcja, wołana teraz też dla każdego klubu AI z danych uniwersalnych (allStandings/cupHistory zamiast G.trophies, systemu tylko dla klubu gracza).

9. Poprawka daty nagród AI (Twoje zgłoszenie: puchar za sezon, który dopiero się zaczął)
- Nagrody klubów AI z pkt. 8 dostały tę samą chorobę co newsy: assignSeasonAwards() dla AI było wołane już PO G.season++, więc nagroda za właśnie zakończony sezon zapisywała się z numerem NOWEGO sezonu — widoczne jako np. „Mistrzostwo ligi — SEZON 4" tuż po starcie sezonu 4, mimo że tytuł padł w sezonie 3. Karta drużyny (trofea z G.lgHist) była cały czas poprawna — błąd dotyczył tylko p.awards w karcie zawodnika.
- Naprawione: assignSeasonAwards() przyjmuje teraz jawny numer kończącego się sezonu zamiast liczyć na bieżący G.season.
- Migracja na wczytaniu zapisu: każda nagroda oznaczona numerem dopiero co rozpoczętego sezonu jest z definicji artefaktem tego błędu (nagroda mogła powstać tylko na koniec sezonu, zanim ten się zaczął) — cofa jej datę o jeden sezon.

10. Usunięty ranking prestiżu z zakładki Tabela → Historia → Legenda
- Na Twoją prośbę usunięty cały blok „KLUB — Ranking prestiżu" w renderLegenda() (season-summary.js) wraz z nieużywanymi już kluczami i18n (lg_prestige_*).

11. Zniesiony limit 3 zakupów w oknie transferowym
- Usunięta blokada w buyTransfer() (transfers.js) — zakup ograniczony teraz tylko budżetem klubu. Usunięty licznik „Kupiono: X/3" i disabled na przycisku Kup oraz powiązane nieużywane zmienne/klucze i18n. Limit sprzedaży (3/okno) zostawiony bez zmian — nie był objęty prośbą.

12. Karta klubu AI: „Forma" pokazuje realną dyspozycję zawodników zamiast sztucznego licznika
- Wiersz Forma w _renderClubCard() (club-modal.js) czytał dotąd club.ai.form — osobny licznik „passy" (start 50, ±3 za wygraną/porażkę), niezwiązany z realną kondycją zawodników i w ogóle niepokazywany dla własnego klubu, stąd wrażenie że AI startuje na 50% a gracz na 100%. Podmieniony na średnią formy (p.form) zawodników wyjściowej 11 — tę samą wartość, która realnie wpływa na moc drużyny w meczu — więc oba kluby startują teraz na ~100% i wartość reaguje na zmęczenie/kontuzje w sezonie. club.ai.form zostaje nietknięty, dalej napędza newsy o seriach wygranych/przegranych.

13. Poprawka przekierowań newsów do złej zakładki
- newsAction() (news-bootstrap.js): akcja finance_contracts celowała w .tab-btn:nth-child(3) panelu Finanse, czyli w zakładkę SEZONY zamiast KONTRAKTY — naprawione na selektor [data-tab="kontrakty"]. News o wygasłym kontrakcie (season-summary.js) prowadził tylko do ogólnego przeglądu Finansów zamiast wprost do kontraktów — przełączony na tę samą, poprawną akcję.

14. Usunięty bonus reputacji za nowy sezon
- Usunięte changeReputation(5, „Nowy sezon w roli menedżera") w season-summary.js — klub gracza nie dostaje już automatycznego +5 rep na starcie każdego sezonu. Reputacja za awanse/spadki/cele zarządu bez zmian.

15. Wyniki ligowe drużyny w karcie klubu (nowa zakładka WYNIKI)
- Diagnoza przed wdrożeniem: wynik każdego meczu bieżącego sezonu istniał w G.allSchedules, ale mecze AI-AI (simOthers() w match-post.js) nigdy nie trafiały do żadnego logu — tylko do zbiorczej tabeli; showMatchDetail() (traits-history.js) był ściśle sprzężony z perspektywą klubu gracza (czytał wyłącznie G.mHist).
- Wdrożony wariant „B-lekki" (Twoja decyzja): simOthers() dopisuje teraz lekki log meczu (minuta gola, kartki wg tych samych bazowych prawdopodobieństw co pełny silnik, oceny obu drużyn) do nowego G._mHistAI — pole runtime-only, celowo pominięte w saveGame() (SKIP), więc zero wpływu na rozmiar zapisu; resetowane co sezon tak jak G.mHist.
- Nowa zakładka WYNIKI w karcie klubu (własnego i dowolnego rywala) łączy G.mHist + G._mHistAI; klik na mecz otwiera showMatchDetail().
- showMatchDetail() dostał opcjonalny parametr src (mHist/ai) i neutralny framing „WYGRANA GOSPODARZY/GOŚCI" zamiast mylącego „WYGRANA/PRZEGRANA", gdy żaden z klubów w meczu nie jest klubem gracza. Ścieżka powrotu karta klubu ↔ karta zawodnika ↔ szczegóły meczu zsynchronizowana w club-modal.js/navigation-squad.js/tactics-playercard.js, żeby src przechodziło przez cały łańcuch.
- Zweryfikowane dynamicznie w przeglądarce (Playwright): pełna gra od nowej kariery po 1. kolejkę, zero błędów w konsoli; G._mHistAI miało poprawne 63 wpisy po kolejce, framing i ścieżka powrotu potwierdzone zrzutami ekranu dla meczu AI-AI i meczu gracza.
- Przy okazji znaleziony niezwiązany, wcześniej istniejący drobny problem: .md-overlay (position:absolute) może wyrenderować się poza widocznym obszarem po przewinięciu strony — zgłoszony, celowo nienaprawiany (poza zakresem tego zadania).

10.07.2026
1. Żywy świat klubów AI (nowy system)
- Osobny kanał newsów o klubach AI (G.worldNews) — awanse/spadki, seria wygranych/przegranych, Puchar, talenty z akademii, kryzysy finansowe, cele zarządu — widoczny w zakładce Świat i w karcie każdego klubu.
- Nowe pola klubu AI: forma, cel zarządu na sezon (losowany wg siły składu: mistrzostwo/awans/utrzymanie).
- Bilans bezpośrednich starć (H2H) z Twoim klubem w karcie rywala.

2. Ekonomia klubów AI
- Realne pensje zawodników AI (potrącane co 4 tygodnie, tak jak u Ciebie) — wcześniej p.salary istniało tylko na papierze.
- Przychód sezonowy zależny od miejsca w tabeli (0,7×–1,4× własnego funduszu płac klubu).
- Naprawiony poważny błąd: przychód liczył się przed tegorocznymi transferami, więc ekonomia AI systematycznie się rozjeżdżała (w 10-sezonowej symulacji: mediana budżetu spadała z +20k do -420k, 94% klubów na minusie) — po przeniesieniu liczenia na koniec fazy transferowej: 0 klubów poniżej zera w żadnym z 10 sezonów.
- AI kupuje zawodników tylko wtedy, gdy realnie ma na to budżet (wcześniej mogła się zadłużać bez ograniczeń, widziałem -40 mln).
- W karcie klubu i rankingu „Aktywne kluby" budżet zastąpiony wartością składu (realna, rynkowa wycena zawodników).

3. Reputacja — pełna przebudowa
- Modal historii reputacji gracza (klik na ⭐ Rep: w nagłówku) — pokazuje każdą zmianę z powodem i datą; podpięty do ~15 miejsc w grze + jeden centralny hak w Kronice (zamiast edycji ~50 osobnych zdarzeń).
- Reputacja AI działa według tych samych reguł co gracza (awans +50, spadek -30, Puchar, cele zarządu) i na tej samej skali.
- Cel zarządu w karcie klubu daje premię w reputacji zamiast pieniędzy.
- Na Twoją prośbę: limit 1000 zdjęty całkowicie — reputacja rośnie bez końca, a przychody (sponsorzy/reklamy/kontrakty/frekwencja/TV) liczone teraz krzywą nasycającą zamiast liniowego mnożnika z twardym sufitem — więcej reputacji zawsze coś daje, z malejącymi zyskami, bez ściany.

4. Drobne poprawki po drodze
- Kolory newsów o seriach wygranych/przegranych rozdzielone (zielony/czerwony zamiast jednego niebieskiego).
- Usunięte niepotrzebne pole „morale" (nic nie robiło) i „ambicja" po jego usunięciu.
- Kilka znalezionych martwych fragmentów kodu posprzątanych po drodze (m.in. duplikat logiki stadionu w dwóch plikach).

Podsumowanie od ostatniego podsumowania

Reputacja bez limitu 1000
- Usunięty twardy sufit — reputacja rośnie bez końca (gracz i AI).
- Przychody (sponsorzy/reklamy/kontrakty/frekwencja/TV) przeliczone na krzywą nasycającą repCurve() zamiast liniowego mnożnika z twardym cap — więcej reputacji zawsze coś daje, malejąco, bez ściany.
- Tabela progów sponsorskich rozszerzona o dwa otwarte poziomy powyżej 1000.

Cele zarządu za reputację
- Znalazłem, że rep500/rep1000 były zdefiniowane, ale nigdy nie trafiały do puli wyboru (martwy kod) — pokazałem Ci pełną tabelę 29 celów i drzewo doboru.
- Naprawione: rep1000 przekalibrowany, dodane nowe rep2000 ("Ikona ligi") i rep4000 ("Żywa legenda futbolu"), podpięte do 3 gałęzi selekcji.
- Złapałem własny błąd po drodze: rep4000 miał nieobsługiwaną trudność 'extreme', przez co renderowałby się na zielono zamiast czerwono — poprawione na 'hard'.

Audyt mechaniki reputacji
- Na Twoją prośbę wypisałem kompletną listę: kiedy i o ile zmienia się reputacja gracza (mecz, awans/spadek, Puchar, cele zarządu, Kronika) i AI (te same reguły, węższy zestaw wyzwalaczy, bez Kroniki i bez bonusu za pojedynczy mecz).

Naprawa jednostek w worldTab → Aktywne Kluby
- Diagnoza: to nie błąd danych ani duplikat fmtVal() (ten duplikat już wcześniej ktoś usunął — poprawiłem nieaktualną notatkę o tym w ARCHITECTURE.md) — tylko adaptacyjny formatter użyty w tabeli porównawczej.
- Dodana fmtMln() — dwa progi (mln ≥1mln, k poniżej), podmieniona w 4 miejscach (wydatki/przychody/saldo/wartość składu).
- Przy okazji znaleziony bonus-bug: fmtVal() źle formatuje liczby ujemne (np. -2500000 € zamiast -2,5 mln €) — zgłoszony, nie naprawiony (osobna decyzja, bo dotyczy funkcji używanej w wielu innych miejscach).

"Zawodnik star" klubu — usunięta duplikacja
- Zdiagnozowano: kryterium to najwyższy OVR w całej kadrze klubu (ui/club-modal.js), logika była zduplikowana w dwóch funkcjach.
- Wydzielona wspólna funkcja clubStarPlayer() — bez zmiany kryterium ani zachowania.

Trofeum za mistrzostwo ligi w karcie klubu
- Diagnoza: mechanizm już istniał, ale był zepsuty — wpis ligowy w G.trophies nigdy nie miał place:1, więc filtr w club-modal.js go nie łapał; dodatkowo G.trophies jest scoped tylko do własnego klubu, więc dla klubów AI trofeum i tak by się nie pokazało.
- Naprawione: trofea ligowe budowane teraz z entries (lgHist — uniwersalne dla każdego klubu), tak samo jak puchary z G.cupHistory.
- Przy okazji naprawiona ta sama przyczyna w liczeniu tytułów ligowych legend klubu (lgWins zawsze wychodziło 0).

Rekord transferowy i Aktywne kluby — pełna historia kariery
- Diagnoza: dane dla własnego klubu (G.fin.transfers) już liczyły się za całą karierę, ale dla klubów AI były ucięte do ostatnich 20 transferów na klub (transferLog) — starsze rekordowe transfery znikały, sprawiając wrażenie statystyk tylko z bieżącego sezonu.
- Dodane G.worldTopTransfers — globalny rekord transferowy (cała kariera, max 100, aktualizowany na bieżąco) oraz liczniki ai.totalSpent/totalEarned/totalBuys/totalSells na klubach AI.
- Stare zapisy: jednorazowa migracja z tego, co jeszcze zostało w okrojonym logu, żeby nic nie zniknęło z widoku po aktualizacji.
- Dopisane podpisy „cała historia kariery" w obu zakładkach Świata (Transfery i Aktywne kluby).





09.07.2026

Poprawa algorytmu wyboru MVP

☐ NIEZGODNOŚĆ WYNIKU MECZU (3-1 vs 4-1)
- wynik na boisku (np. 3-1) różni się od wyniku w relacji/komentarzu
  po meczu (np. 4-1)
- zdiagnozować rozjazd między silnikiem meczu a warstwą raportującą wynik
  (match-engine.js vs match-post.js / komentarz)
- ☐ KARTA ZAWODNIKA — ROZSZERZENIE
- rozważyć dodanie dodatkowych informacji, np. liczby MVP – dodano do nagród.

- ☐ DEFAULT LANGUAGE
- EN = domyślny język przy starcie nowej kariery
- PL = opcjonalny

-
☐ TIMING EVENTÓW KRONIKI - naprawione
- eventy nie powinny pojawiać się od razu po zakończeniu meczu
- wyzwalanie dopiero po wyjściu z ekranu meczu

- poprawa przejścia między meczem ligowym a pucharowym, musi być zachowana sekwencja wszystkich etapów – poprawione.
 
- poprawa żeby następowała zmiana wieku zawodników gracza, 


04.07.2026
Tłumaczenia z polski na angielski: sesja 1, sesja 2 i sesja 3, sesja 4, sesja 5 kronika 1/3,
Przywrócenie akademii 2 zakładek zamiast 3.

05.07.2026 
Dokończenie tłumaczeń na angielski:, etap 4 sesja 7 2/3 i 3/3, etap 5 sesja 8.
Są jeszcze w grze nieprzetłumaczone miejsca:…dużo cząstkowych i transfery całościowo.
Tłumaczenie całościowo przez Claude code – sprawdzenie pozostawionych braków tłumaczeń, podział na etapy i przetłumaczenie do końca.
Zakończono tłumaczenia.

06.07.2026 kolejne działania – nie można wychodzić z meczu jak się już wejdzie. Zostało to poprawione jak wejdziesz w analizę przedmeczową lub mecz nie można wyjść z meczu. Można wyjść ale wraca się do meczu.

Usunięcie przycisku skład z analizy przedmeczowej zostaje tylko taktyka. 

Poprawka nierównej liczby meczów przez puchary.

Poprawka dodanie walut euro, dol, zł. I przełącznik.

Poprawa wizualna zakładki tabela, i widoku tabeli ligowej.

poprawa asymetrii goli w meczach gracza i AI.


07.07.2026
Dalsza poprawa asymetrii goli w meczach gracza i AI. Poprawa silnika meczowego.

Poprawa tłumaczenia na angielski w transfery kupno zimowe.

Karta analizy przedmeczowej match odds poprawione.

Poprawa widoku w zakładce tabela.

Nowy wzór widoku meczu.

08.07.2026

Pracujemy nad nową wizualizacją meczu i po meczu.

Aktualizacja relacji meczowych na humorystyczne. 

Poprawa wychodzenia z karty zadania żeby wychodziło do ostatniego widoku.

Teraz wychodzenie jak się wejdzie do karty zadania do ostatniego widoku działa. 


Dodanie nowej zakładki po meczu: podsumowania meczowego.

Aktualizacja grafiki twarzy pixel art.


