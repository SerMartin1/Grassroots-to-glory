CHANGELOG
Zasady

Po każdej większej zmianie dopisz kilka krótkich punktów opisujących, co zostało zmienione wraz z datą.


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


