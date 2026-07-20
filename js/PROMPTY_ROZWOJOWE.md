# Prompty do Claude Code — GtG (diagnoza-first, Zasada #7)

Każdy prompt jest samodzielny, wklej-i-działaj, po polsku, zaczyna się od diagnozy read-only
(lista plików, raport, pytania — bez kodu przed zatwierdzeniem). Pamiętaj o zasadach stałych:
nowe treści zawsze T.pl + T.en jednocześnie, nowe UI tylko przez tokeny --fs-*, brak font-family
inline w JS, brak wymyślonych wartości liczbowych (tylko z istniejącego kodu), brak migracji save'ów.

---

## 1. Finanse i Infrastruktura — diagnoza rozbudowy

```
Diagnoza rozbudowy systemu Finanse + Infrastruktura w GtG.

Zakres do przeanalizowania (read-only, bez kodu):
- systems/finance.js, systems/training-stadium.js, core/data.js
- Kontrakty zawodników (koszty, prawdopodobieństwo akceptacji)
- Bilety (cennik, wpływ na frekwencję)
- Premie zespołowe (za wynik, za cel zarządu)
- Logistyka/transport na mecze wyjazdowe
- Prawa TV (zależne od ligi/wyników)
- Rozbudowa stadionu (moduły, koszty, wpływ na przychód)
- Kredyt bankowy (warunki, spłata, ryzyko)
- Sponsoring: koszulki, banery, nazwa stadionu — oferty i ich wysokość zależne od poziomu ligi
- Nowe budynki klubowe z realnym wpływem na rozgrywkę (nie tylko kosmetyka)

Cel ekonomii: gra ma wymuszać kombinowanie na granicy niedoboru środków — obecnie sprawdź,
czy gracz zbyt łatwo gromadzi nadwyżkę budżetu i zaproponuj, gdzie dokręcić śrubę (bez
wymyślania nowych wartości liczbowych — bazuj na aktualnych stałych w kodzie).

Wypisz wszystkie pliki, których to dotyczy, zależności między nimi, obecne mechanizmy
(z nazwami funkcji), oraz pytania do mnie przed jakąkolwiek implementacją. Nie pisz kodu.
```

---

## 2. Gablota osiągnięć — komentarze przy awansie/mistrzostwie

```
Diagnoza: chcę dodać komentarz/wpis przy każdym awansie lub mistrzostwie w gablocie osiągnięć
(traits-history.js / Kronika). Potrzebuję min. 100 unikalnych wariantów komentarzy, które nie
mogą się powtarzać w ramach jednej rozgrywki.

Sprawdź (read-only):
- gdzie obecnie renderowana jest gablota osiągnięć i jak wygląda struktura danych o
  awansach/mistrzostwach
- czy istnieje już mechanizm anty-powtórkowy (podobny do tego z eventów Kroniki) który
  można wykorzystać, czy trzeba nowy
- jak dodać T.pl/T.en dla 100+ wpisów bez zaśmiecania i18n.js

Zaproponuj strukturę danych (plik/tablica komentarzy) i mechanizm losowania bez powtórek.
Raport + pytania, bez implementacji.
```

---

## 3. Kronika — pożegnanie legendy/wychowanka zamiast suchego newsa transferowego

```
Diagnoza: gdy legenda klubu lub wychowanek odchodzi (transfer albo koniec kariery), zamiast
standardowego newsa transferowego chcę pełny wpis pożegnalny w Kronice Klubu z podsumowaniem
kariery w klubie (liczba meczów, goli, sezonów, ewentualne tytuły).

Sprawdź (read-only):
- engine/kronika.js — jak obecnie działa kronTrigger() i buildKron*Events()
- gdzie dziś generowany jest news transferowy dla odchodzących zawodników
- jak rozpoznać "legendę" / "wychowanka" (jakie flagi/pola już istnieją)
- czy taki wpis powinien trafiać na whitelistę timeline (G.timeline[])

Zaproponuj warunki triggera (staż w klubie, liczba meczów, status wychowanka) i strukturę
treści wpisu. Raport + pytania, bez kodu.
```

---

## 4. Audyt reputacji — równe szanse gracz vs AI

```
Diagnoza: sprawdź, czy wzrost reputacji klubu jest tak samo dostępny dla drużyny gracza jak
dla drużyn AI, czy któraś strona ma ukrytą przewagę/karę.

Przeanalizuj (read-only) wszystkie miejsca, gdzie reputacja jest modyfikowana (wyniki,
transfery, cele zarządu, Kronika, itd.) i porównaj ścieżki dla gracza i AI. Zrób tabelę
różnic (jeśli są) i wskaż, czy są zamierzone czy to błąd. Bez kodu — tylko raport i pytania.
```

---

## 5. Kontrakty — UI newsów + kolorowanie wygasających + prawdopodobieństwo akceptacji

```
Diagnoza dwóch powiązanych tematów w systemie kontraktów:

A) Po przedłużeniu kontraktu chcę informację w aktualnościach w kategorii "klub", a
   zawodnicy z kontraktem kończącym się (expiring) mają być wizualnie wyróżnieni innym
   kolorem na liście.

B) Akceptacja oferty (przedłużenie kontraktu lub transfer) powinna działać na zasadzie
   prawdopodobieństwa, np. około 1 na 3 próby zamiast pewności.

Sprawdź: gdzie dziś generowane są newsy kontraktowe, jak wygląda kategoria "klub" w
aktualnościach, jaki system kolorów/klas CSS już istnieje (pamiętaj o tokenach --fs-* przy
ewentualnych zmianach UI), oraz gdzie dziś liczona jest akceptacja ofert kontraktowych i
transferowych. Zaproponuj min. 2 rozwiązania dla (A) i mechanizm szans dla (B) oparty na
istniejących atrybutach (np. reputacja, zadowolenie, wiek) — bez wymyślonych progów.
Raport + pytania, bez kodu.
```

---

## 6. Cele zarządu — usunięcie "nie spadnij z ligi" w VII lidze

```
Bug/logika: w VII lidze (najniższa liga) zarząd nie powinien móc wygenerować celu
"nie spadnij z ligi", bo z niej nie ma gdzie spadać.

Sprawdź systems/board-goals.js: gdzie definiowana jest pula możliwych celów i jak są
filtrowane wg poziomu ligi. Zaproponuj warunek wykluczający ten cel dla VII ligi. Raport +
propozycja, bez kodu (chyba że to trywialna poprawka jednowierszowa — w takim wypadku możesz
zaproponować dokładny diff do zatwierdzenia, ale nie wdrażaj bez mojego OK).
```

---

## 7. Bug — zakładka Wyniki resetuje się po zamknięciu meczu

```
Bug: gdy jestem w zakładce "Wyniki" i otworzę mecz, po jego zamknięciu powinienem wrócić do
zakładki "Wyniki", a obecnie tak się nie dzieje.

Sprawdź (read-only) ui/navigation-squad.js i logikę przełączania widoków po zamknięciu
ekranu meczu/podsumowania. Znajdź, gdzie zapisywany/przywracany jest aktywny tab, i wskaż
dokładne miejsce, gdzie trzeba dodać zapamiętanie poprzedniej zakładki. Raport z dokładną
lokalizacją problemu, bez implementacji.
```

---

## 8. Akademia — rekrutacja od 15. roku życia + rozwój juniorów

```
Diagnoza rozbudowy akademii: rekrutacja zawodników już od 15. roku życia oraz indywidualny
rozwój/trening w akademii, z eventami debiutu w Kronice.

Sprawdź systems/academy.js i powiązania z engine/kronika.js. Zaproponuj 3 warianty
rozwiązania (np. różniące się poziomem złożoności/mikrozarządzania: lekki automat vs.
częściowa kontrola ręczna vs. pełne indywidualne plany treningowe), z plusami/minusami
każdego pod kątem "depth over polish" i sesji krótkich/płynnych. Raport + pytania,
bez kodu.
```

---

## 9. Karta zawodnika — więcej wskaźników + podział fizyczne/techniczne

```
Diagnoza rozbudowy karty zawodnika (ui/tactics-playercard.js): więcej wskaźników,
z podziałem np. na fizyczne i techniczne, plus numer zawodnika na karcie.

Sprawdź obecną strukturę atrybutów w core/data.js i jak są renderowane dziś. Zaproponuj
3 warianty układu karty (np. zakładki fizyczne/techniczne/mentalne, radar chart, kompaktowa
lista z sekcjami) — każdy ma być przejrzysty i kompletny, zgodny z tokenami --fs-* i bez
font-family inline. Uwzględnij też gdzie/jak dodać numer zawodnika. Raport z 3 wariantami
i pytaniami, bez kodu.
```

---

## 10. Zakładka Transfery — przebudowa

```
Diagnoza przebudowy zakładki transferów: m.in. stały pool ok. 20 ofert na sezon oraz ogólna
poprawa czytelności/UX.

Sprawdź systems/transfers.js i ui odpowiadające za tę zakładkę. Wskaż obecne ograniczenia
(dlaczego oferty są jak są, skąd biorą się dziś), zaproponuj strukturę nowej zakładki
(filtry, sortowanie, snapshoty scoutingowe już zaimplementowane — jak je tam wpiąć). Raport
+ pytania, bez kodu.
```

---

## 11. Kapitan drużyny — wybór i bonus

```
Diagnoza nowej mechaniki: wybór kapitana drużyny przez gracza + bonus dla kapitana (np.
wpływ na innych zawodników albo na rating meczowy).

Sprawdź core/state.js (gdzie trzymać wybór kapitana), engine/match-engine.js /
calcFinalRatings() (gdzie wpiąć bonus). Zaproponuj mechanikę bonusu opartą na istniejących
atrybutach (np. charyzma/doświadczenie, jeśli istnieją) — bez wymyślonych nowych wartości.
Raport + pytania, bez kodu.
```

---

## 12. Fizyczność zawodnika (wzrost/waga) — wpływ na grę

```
Diagnoza: czy i jak wzrost i waga zawodnika powinny wpływać na przebieg meczu (np. gra
głową, pojedynki fizyczne, szybkość).

Sprawdź core/data.js — czy te pola już istnieją i są wykorzystywane w silniku meczowym.
Jeśli nie są używane nigdzie w calcFinalRatings()/simMatch(), zaproponuj konkretne miejsca
integracji oparte na istniejących mechanizmach pojedynków, nie na nowych wymyślonych
współczynnikach. Raport + pytania, bez kodu.
```

---

## 13. Silnik meczowy — pojedynki pozycyjne i atrybuty atak/obrona

```
Diagnoza głębszej przebudowy silnika: wynik meczu ma zależeć od ustawień poszczególnych
zawodników i ich bezpośrednich "pojedynków" (atakujący vs broniący), z atrybutami które się
neutralizują lub dają przewagę.

Przeanalizuj engine/match-engine.js: calcFinalRatings(), simMatch(), simOthers() — jak dziś
liczone są starcia pozycyjne (jeśli w ogóle). To duża zmiana architektoniczna — w raporcie
zaznacz wyraźnie ryzyka dla stabilności (Zasada: stabilność ponad elegancję, incremental over
wholesale) i zaproponuj, czy da się to wprowadzić etapami. Raport + pytania, bez kodu.
```

---

## 14. Balans meczowy — dalsza weryfikacja liczby strzałów

```
Kontynuacja audytu z match-engine-analysis.md: nadal za dużo strzałów na mecz. Zrób kolejną
weryfikację (read-only) — porównaj obecne dane z devLog/runDevSim (symulacja wielosezonowa)
do realistycznych wartości ligowych, zidentyfikuj, które funkcje odpowiadają za generowanie
akcji strzeleckich i gdzie mogła powstać nadprodukcja. Raport z konkretnymi liczbami i
hipotezami, bez kodu.
```

---

## 15. Ekonomia świata gry — czy kluby AI mają za duże zyski

```
Diagnoza: sprawdź czy kluby AI (poza klubem gracza) generują nierealistycznie wysokie zyski
w symulacji wieloletniej. Wykorzystaj runDevSim/devLog do zebrania danych finansowych klubów
AI na przestrzeni kilku-kilkunastu sezonów i porównaj do budżetów realnych dla danego
poziomu ligi. Wskaż źródło ewentualnej nadprodukcji przychodu. Raport, bez kodu.
```

---

## 16. Cechy gracza (traits) — czy realnie wpływają na mecz

```
Diagnoza: zweryfikuj, czy cechy/traity zawodnika faktycznie są odczytywane i mają wpływ na
wynik symulacji meczu, czy tylko istnieją w danych bez konsekwencji mechanicznych (podobnie
jak martwy wzorzec eventu a05 w Kronice — verify trigger fields exist before shipping).
Sprawdź wszystkie miejsca w silniku, gdzie powinny być odczytywane. Raport z listą traitów i
statusem (używany/martwy), bez kodu.
```

---

## 17. Losowa drużyna przy starcie nowej gry

```
Diagnoza: dodać opcję losowego wyboru klubu startowego (zamiast tylko ręcznego wyboru) w
nowym flow startu gry (Filozofia Klubu / Archetyp / Scenariusz). Sprawdź gdzie dziś odbywa
się wybór klubu i zaproponuj, gdzie wpiąć przycisk/opcję losowania z zachowaniem
matematycznie zachowanej średniej OVR dla VII ligi (już ustalone w poprzednim audycie).
Raport + pytania, bez kodu.
```

---

## 18. Optymalizacja danych i zakładek przed publikacją

```
Diagnoza przedpremierowa: przegląd wydajności i porządku w danych/zakładkach gry przed
publikacją. Sprawdź (read-only):
- rozmiar/strukturę zapisu w localStorage (czy nic nie rośnie w nieskończoność)
- czy wszystkie 25 modułów faktycznie są potrzebne przy starcie, czy da się coś
  leniwie ładować
- duplikaty/martwe funkcje (patrz ARCHITECTURE.md — known duplicate-function traps)
- ogólny porządek w zakładkach UI (czy nawigacja nie robi zbędnych re-renderów)

Raport z listą znalezisk posortowaną wg wpływu na wydajność/rozmiar, bez kodu.
```

---

## 19. Terminarz — numer kolejki przy każdym meczu

```
Diagnoza: w terminarzu chcę, żeby przy każdym meczu było wyraźnie napisane, która to
kolejka (np. "Kolejka 12"), nie tylko data/przeciwnik.

Sprawdź (read-only), gdzie dziś renderowany jest terminarz/lista meczów i czy numer
kolejki jest już gdzieś w strukturze danych (G.fixtures / harmonogram sezonu) czy trzeba
go dopiero policzyć/dociągnąć. Zwróć uwagę na tokeny --fs-* przy ewentualnym dodaniu nowego
elementu tekstowego i na T.pl/T.en dla etykiety "Kolejka X". Raport z dokładną lokalizacją
i propozycją miejsca wstawienia numeru, bez kodu (chyba że to trywialna jednowierszowa
zmiana — wtedy zaproponuj dokładny diff do zatwierdzenia, ale nie wdrażaj bez OK).
```

---

## 20. Kosmetyczna personalizacja tożsamości klubu

```
Zadanie: nazwa stadionu, motto klubu, kolory — zero wpływu na rozgrywkę, budowanie
przywiązania emocjonalnego. Możliwy przyszły kandydat na płatną opcję (nie psuje balansu).

Zasada #7 — wyłącznie odczyt na start:
1. Pliki: core/state.js (struktura danych klubu w G — gdzie dziś żyje nazwa stadionu/
   kolory, jeśli w ogóle są edytowalne), engine/pixelart.js (pxCrest/pxKit — czy kolory
   klubu już wpływają na generowany herb/strój, czy trzeba by to dociągnąć), ui/club-modal.js
   (miejsce prezentacji tożsamości klubu — kandydat na miejsce edycji).
2. Zdiagnozuj: co z tych elementów (nazwa stadionu, motto, kolory) jest dziś stałe/
   generowane raz, a co teoretycznie mogłoby być edytowalne bez naruszania innych systemów
   (np. czy kolory klubu są gdzieś indziej używane do logiki, nie tylko wizualnie).
3. Zaproponuj zakres pierwszej iteracji (np. tylko motto + nazwa stadionu, kolory jako
   osobna, późniejsza sesja ze względu na powiązanie z pixelart.js).
4. Nie implementuj.

Standing rules jak wyżej.
```

---

## 21. Meta-postęp kosmetyczny między save'ami (osobna, większa diagnostyka)

```
Zadanie: tytuły/herby/motta odblokowywane po ukończeniu długich karier w poprzednich
save'ach — czysto kosmetyczne, nigdy nie wpływa na OVR/ekonomię. To zmiana wykraczająca
poza pojedynczy save (dane globalne, poza G).

Zasada #7 — wyłącznie odczyt na start, TRAKTUJ TO JAKO ODDZIELNY, WIĘKSZY PROBLEM
ARCHITEKTONICZNY, nie zwykłą funkcję gry:
1. Pliki: ui/save-setup-misc.js (cały mechanizm save/load, sloty zapisu — to jedyne
   miejsce, gdzie dziś istnieje jakikolwiek koncept "wielu save'ów"), core/state.js
   (initGame() — gdzie dziś zaczyna się każdy nowy G od zera).
2. Kluczowe pytanie: gra dziś przechowuje dane wyłącznie per-save w localStorage pod
   kluczem danego slotu — sprawdź dokładnie, jak nazwane są klucze localStorage i czy
   istnieje już jakikolwiek mechanizm danych "globalnych" (wspólnych dla wszystkich
   save'ów na tym urządzeniu), czy trzeba by go budować od zera.
3. Zaproponuj: minimalny kształt osobnego klucza localStorage na dane meta (niezależnego
   od G danego save'a), kryteria "ukończenia kariery" kwalifikujące do odblokowania,
   i miejsce prezentacji odblokowanych elementów przy tworzeniu nowej gry
   (ui/save-setup-misc.js).
4. Wyraźnie zaznacz ryzyka: nowy mechanizm danych poza G wymaga osobnego planu
   kompatybilności (co się dzieje, gdy gracz czyści dane przeglądarki, gra na innym
   urządzeniu itd.) — nie proponuj rozwiązania na sesji diagnostycznej, tylko zidentyfikuj
   pytania, które musimy razem rozstrzygnąć przed jakimkolwiek mockupem.
5. Nie implementuj.

Standing rules jak wyżej. To kandydat na najdłuższą diagnostykę z całej listy — potraktuj
priorytetowo dokładność raportu nad szybkością.
```

---

## Uwaga: dwa punkty spoza zakresu Claude Code

Poniższe nie są zadaniami programistycznymi, tylko decyzjami produktowo-marketingowymi —
nie nadają się na prompt diagnostyczny do kodu, ale zapisuję je, żebyś miał je pod ręką:

- **Duży promot Kroniki Klubu** — potraktuj jako viral hook (już w Twoich zapiskach) i
  rozpisz osobno jako plan komunikacji (Reddit/Discord), np. seria screenshotów przykładowych
  wpisów Kroniki, format "oto co wydarzyło się w moim klubie".
- **Demo na itch.io (5 sezonów) + pełna wersja na stronie** — do ustalenia: jak technicznie
  ograniczyć demo (blokada po sezonie 5, osobny build czy flaga w tym samym kodzie). To
  właściwie *jest* zadanie programistyczne — jeśli chcesz, mogę to też rozpisać jako
  osobny prompt diagnostyczny (np. "diagnoza: dodać limit sezonów w wersji demo i przełącznik
  builda demo/pełna").

---

*Każdy prompt powyżej: wklej do Claude Code jako osobną sesję, jeden temat na raz. Claude
Code ma zacząć od diagnozy read-only i czekać na Twoje zatwierdzenie przed napisaniem kodu.*
