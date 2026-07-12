CHANGELOG
Zasady

Po każdej większej zmianie dopisz kilka krótkich punktów opisujących, co zostało zmienione wraz z datą.


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


