# Grassroots to Glory – Game Design Rules
## Źródło prawdy
Ten dokument jest głównym opisem zasad działania gry.
Jeżeli kod i ten dokument są ze sobą sprzeczne:
- nie zmieniaj samodzielnie mechanik gry,
- wskaż niezgodność,
- zaproponuj rozwiązanie,
- zaczekaj na decyzję użytkownika.
Nigdy nie zakładaj nowych zasad gry bez wyraźnej decyzji użytkownika.

## Cel gry
Grassroots to Glory jest jednoosobowym managerem piłkarskim na Androida.
Gracz buduje klub od najniższych lig do najwyższych rozgrywek.
Największą wartością gry jest stworzenie własnej historii klubu na przestrzeni wielu sezonów.
Gra ma budować emocjonalne przywiązanie do klubu, zawodników i osiągnięć.

## Główne filary gry
- Prosty i szybki interfejs.
- Krótkie, płynne sesje gry.
- Widoczny rozwój klubu.
- Każdy sezon tworzy historię.
- Każda decyzja powinna mieć znaczenie.

## Filozofia projektu
Nowe funkcje nie są dodawane tylko dlatego, że występują w innych managerach.
Każda nowa mechanika powinna spełniać przynajmniej jeden z celów:
- zwiększać satysfakcję z prowadzenia klubu,
- tworzyć ciekawe historie,
- zwiększać różnorodność kolejnych sezonów,
- zachęcać do rozegrania następnego sezonu.

## Mecze
Symulacja meczów ma być wiarygodna, ale przede wszystkim przyjemna.
Faworyci powinni wygrywać częściej, jednak niespodzianki są ważnym elementem rozgrywki.
Silnik meczowy powinien zachowywać rozsądny balans między realizmem i grywalnością.

## Transfery
Rynek transferowy powinien sprawiać wrażenie żywego.
Kluby AI aktywnie kupują i sprzedają zawodników.
Cena zawodnika zależy między innymi od:
- wieku,
- umiejętności,
- potencjału,
- długości kontraktu,
- zainteresowania innych klubów.
Rynek transferowy powinien zmieniać się z tygodnia na tydzień.

## Akademia
Akademia jest jednym z najważniejszych systemów gry.
Wychowankowie mają budować więź gracza z klubem.
Dobry wychowanek powinien być wydarzeniem, które gracz zapamięta.

## Trening
Młodzi zawodnicy rozwijają się szybciej.
Po około 30 roku życia rozwój zawodnika powinien być znacznie wolniejszy.
Kontuzje i wiek wpływają na tempo rozwoju.

## Kontuzje
Kontuzje są elementem strategii.
Nie powinny występować zbyt często.
Przemęczeni zawodnicy powinni być bardziej narażeni na urazy.
Rodzaj kontuzji wpływa na długość absencji.

## Finanse
System finansów powinien być prosty i czytelny.
Gracz zawsze powinien rozumieć:
- skąd pochodzą przychody,
- na co wydawane są pieniądze,
- jaki wpływ mają jego decyzje na budżet klubu.

## Kibice
Kibice są częścią świata gry.
Powinni reagować między innymi na:
- awanse,
- spadki,
- derby,
- rekordy,
- legendy klubu,
- sukcesy wychowanków.
Ich reakcje powinny pojawiać się głównie w newsach i kronice klubu.

## Kronika Klubu
Kronika Klubu jest jednym z najważniejszych systemów Grassroots to Glory.
Każdy sezon powinien pozostawiać trwały ślad.
Najważniejsze wydarzenia powinny być zapamiętywane nawet po kilkudziesięciu sezonach.
Historia klubu ma zachęcać gracza do kontynuowania kariery.

## Newsy
Newsy nie służą wyłącznie przekazywaniu informacji.
Ich zadaniem jest budowanie świata gry.
Powinny opowiadać historię klubu, ligi oraz świata piłki.

## AI Klubów
Każdy klub powinien zachowywać się inaczej.
Niektóre kluby inwestują w młodzież.
Inne preferują doświadczonych zawodników.
Jeszcze inne częściej sprzedają piłkarzy dla zysku.
AI powinno sprawiać wrażenie, że rozwija klub niezależnie od działań gracza.

## Interfejs użytkownika
Interfejs powinien być prosty, szybki i spójny.
Każda akcja powinna wymagać możliwie najmniejszej liczby kliknięć.
Powrót z okien i kart powinien prowadzić do miejsca, z którego gracz przyszedł.

## Rozgrywka
Gra powinna utrzymywać szybkie tempo.
Między decyzjami nie powinno być długich przerw.
Gracz powinien często otrzymywać nowe informacje, wydarzenia i cele.

## Retencja
Po zakończeniu sezonu gracz powinien mieć kilka powodów do rozpoczęcia kolejnego sezonu.
Przykładowo:
- pojawił się utalentowany junior,
- rywal dokonał dużego transferu,
- można rozbudować stadion,
- otworzyły się nowe możliwości rozwoju klubu,
- wydarzyło się coś ważnego w historii ligi lub klubu.
Każdy sezon powinien naturalnie zachęcać do rozegrania następnego.

## Zasady pracy z kodem
Podczas dodawania nowych funkcji:
- nie zmieniaj istniejących mechanik bez wyraźnej potrzeby,
- zachowuj zgodność z obecnym stylem kodowania,
- wykorzystuj istniejące systemy zamiast tworzyć ich duplikaty,
- jeżeli zmiana wymaga modyfikacji kilku modułów, najpierw przedstaw plan zmian.

## Najważniejsza zasada projektu
Grassroots to Glory ma opowiadać historię.
Każda nowa funkcja powinna wzmacniać poczucie prowadzenia własnego klubu przez wiele sezonów.
Jeżeli istnieje wybór pomiędzy dodaniem kolejnego systemu a ulepszeniem już istniejących mechanik, priorytetem jest dopracowanie obecnych systemów.