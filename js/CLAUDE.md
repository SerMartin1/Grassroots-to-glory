## Projekt
 
Jest to gra manager piłkarski na Androida przeznaczona do publikacji w Google Play.
 
Projekt rozwijany jest modułowo i znajduje się na GitHubie.
 
Najważniejszym celem jest stabilność projektu. Nie wolno psuć istniejących funkcji podczas dodawania nowych.
 
---
 
# Zasady pracy
 
1. Edytuj wyłącznie pliki wskazane w poleceniu.
 
2. Nie zmieniaj nazw istniejących funkcji bez wyraźnej prośby.
 
3. Nie usuwaj istniejącego kodu, jeśli nie jest to konieczne.
 
4. Nie twórz duplikatów funkcji ani zmiennych.
 
5. Zachowuj obecny styl kodowania projektu.
 
6. Staraj się wykorzystywać istniejące funkcje zamiast pisać nowe odpowiedniki.
 
7. Jeśli proponowana zmiana wymaga modyfikacji innych modułów, nie wykonuj jej samodzielnie. Najpierw wypisz listę plików, które również będą wymagały zmian.
 
8. Nie zmieniaj logiki innych systemów bez wyraźnej zgody.
 
9. Kod powinien być czytelny, wydajny i zgodny z JavaScript ES6.
 
10. Nie dodawaj bibliotek zewnętrznych bez wyraźnej prośby.
 
---

# Zasada zamkniętego świata zawodników

Pula zawodników w grze (kluby AI + klub gracza + wolni agenci) jest zamkniętym obiegiem:

1. **Wejście do świata wyłącznie jako junior** — nowy zawodnik (id, tożsamość) powstaje tylko
   przez system wychowanków (akademia gracza, juniorzy AI w `aiTransferSeason()`). Poza tym
   nikt nowy nie powinien być generowany w trakcie rozgrywki (wyjątek: pula startowa przy
   `initGame()`/`buildInitialFA()` — to jednorazowy punkt zerowy świata, nie coś, co dzieje się
   cyklicznie).
2. **Wyjście ze świata wyłącznie przez emeryturę** — zawodnik znika z aktywnej puli tylko gdy
   przechodzi na emeryturę (`G.retiredPlayers`). Nic innego nie usuwa zawodnika bez śladu.
3. **Cała reszta ruchu to bilansowanie między klubami** — sprzedaże, zakupy, wygasłe kontrakty,
   wolni agenci: to zawsze ten sam zawodnik (ten sam obiekt, ta sama historia), zmienia się
   tylko `clubId`. Żadna operacja poza (1) i (2) nie powinna ani tworzyć nowego zawodnika przez
   `mkPlayer()`, ani usuwać istniejącego z `G.players`/`G.fa` bez przenoszenia go do
   `G.retiredPlayers`.

Przykład błędu tej zasady (naprawiony): reset składu dołu VIII Ligi w `season-summary.js`
kasował zawodników bez śladu i tworzył nowych przez surowy `mkPlayer()` z pominięciem pasma
OVR ligi — złamanie punktów 1 i 2 jednocześnie. Przy każdej zmianie dotykającej `G.players`,
`G.fa` lub `G.retiredPlayers` sprawdź, czy nie łamie tej zasady.

---
 
# Przed zakończeniem pracy sprawdź
 
* Czy kod zawiera błędy składni.
* Czy nie uszkodzono istniejących funkcji.
* Czy nowe funkcje współpracują z obecnym systemem.
* Czy nie powstały nieużywane zmienne lub funkcje.
* Czy kod nie zawiera zbędnych powtórzeń.
 
---
 
# Jeśli nie masz pewności
 
Nie zgaduj.
 
Opisz problem i zaproponuj najlepsze rozwiązanie przed napisaniem kodu.