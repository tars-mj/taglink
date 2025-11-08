# Dokument wymagań produktu (PRD) - TagLink

## 1. Przegląd produktu

TagLink to aplikacja webowa do zarządzania i organizacji linków internetowych z wykorzystaniem systemu tagowania wspomaganego przez sztuczną inteligencję. Aplikacja rozwiązuje problem chaosu w przechowywaniu ciekawych linków z różnych źródeł poprzez automatyczne generowanie opisów i inteligentne sugerowanie tagów.

Wersja: MVP (Minimum Viable Product)
Model biznesowy: Freemium (szczegóły do określenia w przyszłości)
Platforma: Aplikacja webowa z podstawową responsywnością mobilną

Kluczowe cechy produktu:
- Synchroniczne przetwarzanie treści z automatycznym scrapingiem
- System płaskich tagów (bez hierarchii)
- Wyszukiwanie real-time z debounce
- System oceny gwiazdkowej (1-5)
- Wykrywanie duplikatów linków
- Stricte prywatna (bez funkcji współdzielenia)

## 2. Problem użytkownika

Użytkownicy internetu regularnie napotykają na wartościowe treści z różnych źródeł (social media, portale informacyjne, wyniki wyszukiwania), które chcą zachować na później. Aktualne sposoby zapisywania linków prowadzą do następujących problemów:

Problemy identyfikowane:
- Chaos i brak organizacji zapisanych linków
- Utrata informacji o kontekście i wartości zapisanego materiału
- Nadmiar otwartych zakładek w przeglądarce
- Brak możliwości szybkiego odnalezienia konkretnego linku
- Zapominanie gdzie został zapisany dany zasób
- Brak systemu priorytetyzacji ważności materiałów

Grupa docelowa:
- Wszyscy użytkownicy internetu niezależnie od poziomu zaawansowania
- Osoby gromadzące wiedzę z różnych źródeł
- Profesjonaliści potrzebujący organizacji zasobów branżowych
- Studenci i osoby uczące się nowych umiejętności

Wartość biznesowa:
- Rozwiązanie powszechnego problemu organizacji informacji
- Wykorzystanie AI do automatyzacji procesu kategoryzacji
- Potencjał do rozwoju w kierunku narzędzia produktywności

## 3. Wymagania funkcjonalne

### 3.1 Zarządzanie linkami

3.1.1 Dodawanie linków
- Możliwość wklejenia URL bezpośrednio do aplikacji
- Synchroniczne pobieranie metadanych przed zapisaniem (5-10 sekund)
- Link zapisywany z pełnymi danymi od razu
- Rate limiting: 30 linków na godzinę per użytkownik
- Wykrywanie duplikatów przed zapisaniem

3.1.2 Edycja linków
- Możliwość edycji opisu wygenerowanego przez AI
- Dodawanie i usuwanie tagów dla istniejącego linku
- Zmiana oceny gwiazdkowej (1-5)
- Edycja tylko pojedynczych wpisów (brak operacji masowych)

3.1.3 Usuwanie linków
- Możliwość usunięcia linku z systemu
- Automatyczne usunięcie powiązań z tagami

### 3.2 System tagowania

3.2.1 Kreator tagów
- Tworzenie własnych tagów przez użytkownika
- Walidacja tagów: 2-30 znaków, lowercase
- Dozwolone znaki: litery, cyfry, spacje, myślniki
- Automatyczna konwersja do lowercase

3.2.2 AI sugestie tagów
- Sugerowanie 3-10 tagów (optymalnie 3-5) z predefiniowanej puli użytkownika
- Analiza tylko tagów już zdefiniowanych w systemie przez użytkownika
- Brak tworzenia nowych tagów przez AI
- Możliwość akceptacji lub odrzucenia sugestii

3.2.3 Zarządzanie tagami
- Sortowanie tagów według częstotliwości użycia
- Wyświetlanie najczęściej używanych tagów
- Możliwość ręcznego przypisania tagów

### 3.3 AI i przetwarzanie treści

3.3.1 Scraping treści
- Automatyczne pobieranie: tytuł strony, meta description, pierwsze 500 słów treści
- Obsługa błędów scrapingu z fallback na ręczne wprowadzenie
- Synchroniczne przetwarzanie z timeoutem 30 sekund

3.3.2 Generowanie opisów
- AI generuje opis maksymalnie 280 znaków (2-3 zdania)
- Analiza pobranej treści strony
- Możliwość ręcznej edycji wygenerowanego opisu

### 3.4 System oceny

3.4.1 Ocena gwiazdkowa
- Przypisanie oceny od 1 do 5 gwiazdek
- Określenie ważności/priorytetu linku
- Możliwość zmiany oceny w dowolnym momencie
- Wpływ na sortowanie wyników

### 3.5 Wyszukiwanie i filtrowanie

3.5.1 Wyszukiwarka
- Real-time search z debounce 300-500ms
- Wyszukiwanie w opisach i tagach
- Natychmiastowe indeksowanie nowych linków

3.5.2 Filtrowanie przez tagi
- Algorytm AND (przecięcie tagów)
- Zawężanie wyników przy wyborze kolejnych tagów
- Dynamiczne aktualizowanie listy wyników

3.5.3 Sortowanie
- Domyślne sortowanie: po ocenie gwiazdkowej (malejąco)
- Alternatywne sortowanie: po dacie dodania, po trafności wyszukiwania
- Przełączanie między trybami sortowania

### 3.6 Widok i prezentacja

3.6.1 Lista linków
- Prosty widok listy bez miniaturek
- Wyświetlanie: tytuł, opis, tagi, ocena gwiazdkowa
- Data dodania (bez historii zmian)

3.6.2 Onboarding
- Możliwość natychmiastowego dodania pierwszego linku
- Brak długiego procesu wdrożeniowego

### 3.7 Autentykacja i prywatność

3.7.1 System użytkowników
- Aplikacja stricte prywatna
- Każdy użytkownik ma własną przestrzeń
- Brak funkcji współdzielenia w MVP

3.7.2 Bezpieczeństwo
- Rate limiting zapobiegający nadużyciom
- Podstawowa ochrona danych użytkownika

## 4. Granice produktu

### 4.1 Funkcje wyłączone z MVP

Następujące funkcje NIE wchodzą w zakres MVP i mogą być rozważone w przyszłych wersjach:

Techniczne:
- Sprawdzanie czy link jest nadal aktywny
- Zaawansowane wyszukiwarki (Algolia, ElasticSearch)
- Mechanizm weryfikacji bezpieczeństwa linków
- Dedykowana aplikacja mobilna
- System powiadomień
- Import/eksport linków
- Historia zmian i wersjonowanie
- Operacje masowe na linkach
- Pełna zgodność z RODO

Funkcjonalne:
- Hierarchia tagów lub zagnieżdżone tagi
- Kolekcje lub foldery
- Współdzielenie linków z innymi użytkownikami
- Sugerowanie podobnych linków
- Tworzenie nowych tagów przez AI
- Miniaturki stron w widoku listy
- Integracje z przeglądarkami
- Integracje z narzędziami zewnętrznymi

Inne ograniczenia:
- Brak limitów liczby linków w MVP (może być dodane w przyszłości)
- Tylko podstawowa responsywność mobilna
- Brak wielojęzyczności
- Brak zaawansowanych statystyk użytkowania

### 4.2 Założenia techniczne

- Aplikacja webowa jako jedyna platforma
- Rate limiting: 30 linków/godzinę
- Opis AI: maksymalnie 280 znaków
- Analiza AI: tytuł + meta + 500 słów
- Debounce wyszukiwania: 300-500ms
- Limit tagów: 3-10 per link (optymalnie 3-5)

### 4.3 Założenia biznesowe

- Model freemium (szczegóły do doprecyzowania)
- Brak określonego budżetu i harmonogramu w tym etapie
- Prywatność jako priorytet
- Prostota użytkowania ponad zaawansowane funkcje

## 5. Historyjki użytkowników

### 5.1 Autentykacja i onboarding

US-001: Rejestracja nowego użytkownika
Jako nowy użytkownik
Chcę zarejestrować się w aplikacji
Aby móc zacząć zapisywać swoje linki

Kryteria akceptacji:
- Użytkownik może utworzyć konto podając wymagane dane
- System waliduje poprawność danych rejestracyjnych
- Po rejestracji użytkownik jest automatycznie zalogowany
- Użytkownik trafia bezpośrednio do interfejsu dodawania pierwszego linku

US-002: Logowanie użytkownika
Jako zarejestrowany użytkownik
Chcę zalogować się do swojego konta
Aby uzyskać dostęp do moich zapisanych linków

Kryteria akceptacji:
- Użytkownik może zalogować się używając swoich danych
- System weryfikuje poprawność danych logowania
- Po zalogowaniu użytkownik widzi swoje zapisane linki
- System wyświetla komunikat błędu przy niepoprawnych danych

US-003: Wylogowanie użytkownika
Jako zalogowany użytkownik
Chcę wylogować się z aplikacji
Aby zabezpieczyć swoje konto

Kryteria akceptacji:
- Użytkownik może wylogować się z dowolnego miejsca w aplikacji
- Po wylogowaniu sesja jest zakończona
- Użytkownik jest przekierowany do strony logowania
- Próba dostępu do prywatnych zasobów wymaga ponownego logowania

### 5.2 Dodawanie i zarządzanie linkami

US-004: Dodanie nowego linku
Jako użytkownik
Chcę dodać nowy link do aplikacji
Aby zapisać interesującą mnie stronę

Kryteria akceptacji:
- Użytkownik może wkleić URL do dedykowanego pola
- System waliduje poprawność formatu URL
- System pobiera metadane synchronicznie (użytkownik czeka)
- Link jest widoczny w liście z pełnymi danymi po zapisaniu
- System pokazuje komunikat o pobieraniu metadanych podczas oczekiwania

US-005: Przetwarzanie linku przez AI
Jako użytkownik
Chcę aby AI automatycznie wygenerowało opis i zasugerowało tagi
Aby zaoszczędzić czas na ręcznej kategoryzacji

Kryteria akceptacji:
- System automatycznie pobiera tytuł, meta description i pierwsze 500 słów treści
- AI generuje opis maksymalnie 280 znaków (2-3 zdania)
- AI sugeruje 3-10 tagów z puli tagów użytkownika
- Przetwarzanie działa synchronicznie podczas dodawania linku
- Użytkownik widzi komunikat o przetwarzaniu podczas oczekiwania
- Dane są dostępne natychmiast po zakończeniu dodawania

US-006: Obsługa błędu scrapingu
Jako użytkownik
Chcę móc ręcznie wprowadzić opis gdy scraping nie powiedzie się
Aby móc zapisać link mimo problemów technicznych

Kryteria akceptacji:
- System wykrywa błędy scrapingu
- Użytkownik otrzymuje komunikat o błędzie z możliwością ręcznego wprowadzenia opisu
- Użytkownik może wprowadzić własny opis (max 280 znaków)
- Użytkownik może ręcznie przypisać tagi
- Link jest zapisywany z ręcznie wprowadzonymi danymi

US-007: Wykrywanie duplikatów
Jako użytkownik
Chcę być informowany gdy próbuję dodać link który już istnieje
Aby uniknąć duplikatów w mojej kolekcji

Kryteria akceptacji:
- System sprawdza czy URL już istnieje w bazie użytkownika
- Przy próbie dodania duplikatu wyświetlany jest komunikat
- Użytkownik widzi istniejący wpis z tym linkiem
- Użytkownik może zdecydować czy edytować istniejący czy anulować

US-008: Edycja opisu linku
Jako użytkownik
Chcę edytować opis wygenerowany przez AI
Aby dostosować go do swoich potrzeb

Kryteria akceptacji:
- Użytkownik może kliknąć w edycję opisu
- System wyświetla pole tekstowe z obecnym opisem
- Walidacja: maksymalnie 280 znaków
- Zapisanie zmian aktualizuje opis
- Możliwość anulowania zmian

US-009: Zmiana oceny gwiazdkowej
Jako użytkownik
Chcę przypisać lub zmienić ocenę gwiazdkową linku
Aby określić jego ważność dla mnie

Kryteria akceptacji:
- Użytkownik może wybrać ocenę od 1 do 5 gwiazdek
- Zmiana oceny jest natychmiast zapisywana
- Ocena jest widoczna przy linku w liście
- Ocena wpływa na domyślne sortowanie

US-010: Usunięcie linku
Jako użytkownik
Chcę usunąć link z systemu
Aby pozbyć się niepotrzebnych już zapisów

Kryteria akceptacji:
- Użytkownik może kliknąć opcję usunięcia linku
- System wyświetla potwierdzenie usunięcia
- Po potwierdzeniu link jest trwale usunięty
- Wszystkie powiązania z tagami są automatycznie usunięte
- Link znika z listy i wyników wyszukiwania

US-011: Zastosowanie rate limiting
Jako system
Chcę ograniczyć liczbę dodawanych linków do 30 na godzinę
Aby zapobiec nadużyciom i przeciążeniu

Kryteria akceptacji:
- System śledzi liczbę dodanych linków w ostatniej godzinie
- Po przekroczeniu 30 linków wyświetlany jest komunikat błędu
- Użytkownik widzi informację kiedy będzie mógł dodać kolejny link
- Licznik resetuje się po godzinie
- Rate limiting jest per użytkownik

### 5.3 System tagowania

US-012: Tworzenie nowego tagu
Jako użytkownik
Chcę utworzyć własny tag
Aby móc kategoryzować linki według własnych kryteriów

Kryteria akceptacji:
- Użytkownik może wprowadzić nazwę nowego tagu
- System waliduje długość: 2-30 znaków
- System automatycznie konwertuje do lowercase
- Dozwolone znaki: litery, cyfry, spacje, myślniki
- System wyświetla błąd przy niepoprawnym formacie
- Tag jest dodawany do puli użytkownika

US-013: Akceptacja sugestii tagów AI
Jako użytkownik
Chcę zaakceptować sugerowane przez AI tagi
Aby szybko skategoryzować link

Kryteria akceptacji:
- System wyświetla 3-10 sugerowanych tagów
- Użytkownik może wybrać które tagi zaakceptować
- Minimum 3 tagi muszą być wybrane
- Maksimum 10 tagów może być przypisanych
- Wybrane tagi są automatycznie przypisane do linku
- Możliwość zaakceptowania wszystkich lub wybranych

US-014: Odrzucenie sugestii i ręczne przypisanie tagów
Jako użytkownik
Chcę odrzucić sugestie AI i ręcznie wybrać tagi
Aby mieć pełną kontrolę nad kategoryzacją

Kryteria akceptacji:
- Użytkownik może odrzucić wszystkie sugestie AI
- System wyświetla listę wszystkich tagów użytkownika
- Użytkownik może wybrać tagi z listy
- Minimum 3 tagi muszą być wybrane
- System waliduje minimalną liczbę tagów przed zapisaniem

US-015: Dodanie tagów do istniejącego linku
Jako użytkownik
Chcę dodać nowe tagi do zapisanego linku
Aby lepiej go skategoryzować

Kryteria akceptacji:
- Użytkownik może otworzyć edycję tagów dla linku
- System wyświetla obecne tagi i listę dostępnych
- Użytkownik może wybrać dodatkowe tagi
- Limit 10 tagów per link jest egzekwowany
- Zmiany są zapisywane po potwierdzeniu

US-016: Usunięcie tagów z linku
Jako użytkownik
Chcę usunąć niepasujące tagi z linku
Aby poprawić jego kategoryzację

Kryteria akceptacji:
- Użytkownik może usunąć wybrane tagi z linku
- System wymaga minimum 3 tagi per link
- Nie można usunąć tagów jeśli pozostałyby mniej niż 3
- Zmiany są zapisywane po potwierdzeniu

US-017: Wyświetlanie najczęściej używanych tagów
Jako użytkownik
Chcę widzieć moje najczęściej używane tagi na górze listy
Aby szybciej je wybierać

Kryteria akceptacji:
- Tagi są sortowane według częstotliwości użycia
- Najczęściej używane tagi wyświetlane są na górze
- Licznik użycia jest aktualizowany przy każdym przypisaniu
- Sortowanie jest dynamiczne

### 5.4 Wyszukiwanie i filtrowanie

US-018: Wyszukiwanie linków po frazie
Jako użytkownik
Chcę wyszukać linki wpisując frazę
Aby szybko znaleźć interesujący mnie zasób

Kryteria akceptacji:
- Pole wyszukiwania jest widoczne i dostępne
- Wyszukiwanie działa w czasie rzeczywistym z debounce 300-500ms
- System przeszukuje opisy i tagi
- Wyniki aktualizują się podczas pisania
- Brak wyników wyświetla odpowiedni komunikat

US-019: Filtrowanie przez pojedynczy tag
Jako użytkownik
Chcę wyfiltrować linki klikając w tag
Aby zobaczyć wszystkie linki z daną kategorią

Kryteria akceptacji:
- Użytkownik może kliknąć w tag
- System wyświetla wszystkie linki zawierające ten tag
- Liczba wyników jest widoczna
- Użytkownik może wyczyścić filtr

US-020: Filtrowanie przez wiele tagów (algorytm AND)
Jako użytkownik
Chcę zawęzić wyniki wybierając kolejne tagi
Aby znaleźć linki pasujące do wielu kryteriów

Kryteria akceptacji:
- Użytkownik może wybrać wiele tagów jednocześnie
- System stosuje logikę AND (przecięcie)
- Wyświetlane są tylko linki posiadające WSZYSTKIE wybrane tagi
- Liczba wyników aktualizuje się po każdym dodaniu/usunięciu tagu
- Użytkownik widzi aktywne filtry

US-021: Sortowanie wyników po ocenie gwiazdkowej
Jako użytkownik
Chcę widzieć linki posortowane po ocenie
Aby najpierw zobaczyć najważniejsze materiały

Kryteria akceptacji:
- Domyślne sortowanie to ocena malejąco (5 do 1)
- Linki bez oceny wyświetlane na końcu
- Sortowanie działa po zastosowaniu filtrów
- Stan sortowania jest zapamiętywany

US-022: Sortowanie wyników po dacie dodania
Jako użytkownik
Chcę widzieć najnowsze linki na górze
Aby śledzić ostatnio zapisane materiały

Kryteria akceptacji:
- Użytkownik może przełączyć sortowanie na datę
- Najnowsze linki wyświetlane są na górze
- Data dodania jest widoczna przy każdym linku
- Sortowanie działa po zastosowaniu filtrów

US-023: Sortowanie wyników po trafności
Jako użytkownik
Chcę widzieć najbardziej trafne wyniki wyszukiwania
Aby szybko znaleźć to czego szukam

Kryteria akceptacji:
- Opcja sortowania po trafności dostępna podczas wyszukiwania
- Algorytm ocenia dopasowanie frazy do opisu i tagów
- Najbardziej trafne wyniki na górze
- Sortowanie aktualizuje się przy zmianie frazy

US-024: Natychmiastowe indeksowanie nowych linków
Jako użytkownik
Chcę aby nowo dodany link był od razu dostępny w wyszukiwarce
Aby móc go natychmiast znaleźć

Kryteria akceptacji:
- Link jest dostępny w wyszukiwarce natychmiast po zapisaniu
- Wyszukiwanie działa nawet gdy AI jeszcze przetwarza treść
- Link ma przynajmniej podstawowe informacje (URL)
- Pełne dane (opis, tagi) pojawiają się po zakończeniu przetwarzania AI

### 5.5 Widok i prezentacja

US-025: Wyświetlanie listy linków
Jako użytkownik
Chcę widzieć listę moich zapisanych linków
Aby mieć przegląd mojej kolekcji

Kryteria akceptacji:
- Lista wyświetla: tytuł, opis, tagi, ocenę, datę dodania
- Prosty widok bez miniaturek
- Każdy wpis ma opcje: edytuj, usuń
- Lista jest paginowana lub używa infinite scroll
- Responsywny layout na urządzeniach mobilnych

US-026: Wyświetlanie szczegółów linku
Jako użytkownik
Chcę zobaczyć pełne szczegóły linku
Aby przeczytać opis i sprawdzić wszystkie tagi

Kryteria akceptacji:
- Kliknięcie w link otwiera szczegóły
- Widoczny pełny opis (280 znaków)
- Wszystkie tagi wyświetlone w formie czytelnej
- Ocena gwiazdkowa
- Data dodania
- Przycisk do otwarcia linku w nowej karcie

US-027: Brak wyników wyszukiwania
Jako użytkownik
Chcę zobaczyć komunikat gdy brak wyników
Aby wiedzieć że wyszukiwanie się wykonało

Kryteria akceptacji:
- Komunikat "Brak wyników" gdy nie znaleziono linków
- Sugestia sprawdzenia filtrów lub frazy
- Możliwość wyczyszczenia wszystkich filtrów jednym kliknięciem

### 5.6 Responsywność mobilna

US-028: Podstawowa obsługa na urządzeniach mobilnych
Jako użytkownik mobilny
Chcę korzystać z aplikacji na telefonie
Aby zarządzać linkami w dowolnym miejscu

Kryteria akceptacji:
- Interfejs dostosowuje się do małych ekranów
- Wszystkie funkcje są dostępne na mobile
- Formularz dodawania linku jest użyteczny na telefonie
- Tagi są kliklalne i czytelne
- Podstawowa responsywność bez dedykowanej aplikacji

### 5.7 Scenariusze brzegowe

US-029: Obsługa bardzo długiego URL
Jako użytkownik
Chcę dodać link z bardzo długim URL
Aby zapisać wszystkie typy stron

Kryteria akceptacji:
- System akceptuje URL do określonej maksymalnej długości
- Długie URL są obcinane w widoku z możliwością rozwinięcia
- Pełny URL jest zawsze dostępny do skopiowania

US-030: Obsługa stron wymagających logowania
Jako użytkownik
Chcę być poinformowany gdy strona wymaga logowania
Aby zrozumieć dlaczego scraping się nie powiódł

Kryteria akceptacji:
- System wykrywa strony wymagające autoryzacji
- Wyświetlany jest odpowiedni komunikat
- Użytkownik może wprowadzić opis ręcznie
- Link jest zapisywany z informacją o ograniczonym dostępie

US-031: Brak dostępnych tagów do sugestii
Jako nowy użytkownik
Chcę dodać pierwszy link gdy nie mam jeszcze żadnych tagów
Aby rozpocząć korzystanie z aplikacji

Kryteria akceptacji:
- AI nie sugeruje tagów gdy użytkownik nie ma jeszcze żadnych
- System wyświetla komunikat o konieczności utworzenia tagów
- Użytkownik jest prowadzony do kreатора tagów
- Po utworzeniu tagów może wrócić do zapisywania linku

US-032: Przekroczenie limitu 10 tagów
Jako użytkownik
Chcę być poinformowany gdy próbuję dodać więcej niż 10 tagów
Aby zrozumieć ograniczenia systemu

Kryteria akceptacji:
- System blokuje dodanie więcej niż 10 tagów
- Wyświetlany jest komunikat o limicie
- Użytkownik musi usunąć tag aby dodać nowy
- Licznik wybranych tagów jest widoczny

US-033: Poniżej minimum 3 tagów
Jako użytkownik
Chcę być poinformowany gdy próbuję zapisać link z mniej niż 3 tagami
Aby spełnić kryteria jakości

Kryteria akceptacji:
- System nie pozwala zapisać linku z mniej niż 3 tagami
- Wyświetlany jest komunikat o minimum 3 tagów
- Licznik wybranych tagów pokazuje ile brakuje
- Przycisk zapisu jest nieaktywny do czasu spełnienia warunku

## 6. Metryki sukcesu

### 6.1 Metryki ilościowe

6.1.1 Liczba zapisanych linków per użytkownik (KPI główne)
- Cel: Średnio minimum 10 linków per aktywny użytkownik w pierwszym miesiącu
- Mierzenie: Średnia liczba linków w bazie na użytkownika
- Częstotliwość: Tygodniowo
- Cel biznesowy: Wskaźnik zaangażowania i wartości aplikacji dla użytkownika

6.1.2 Minimum 3 tagi per link (wskaźnik jakości)
- Cel: 95% linków ma przynajmniej 3 tagi
- Mierzenie: Procent linków spełniających kryterium
- Częstotliwość: Tygodniowo
- Cel biznesowy: Jakość kategoryzacji i użyteczność wyszukiwania

6.1.3 Skuteczność wyszukiwania
- Cel: Użytkownik znajduje link w czasie krótszym niż 30 sekund
- Mierzenie: Czas od rozpoczęcia wyszukiwania do kliknięcia w link
- Częstotliwość: Miesięcznie przez analitykę
- Cel biznesowy: Efektywność podstawowej funkcji aplikacji

6.1.4 Wskaźnik retencji użytkowników
- Cel: 40% użytkowników wraca w ciągu 7 dni
- Mierzenie: Procent użytkowników aktywnych w tygodniu po pierwszym użyciu
- Częstotliwość: Tygodniowo
- Cel biznesowy: Długoterminowa wartość produktu

6.1.5 Liczba wyszukiwań per użytkownik
- Cel: Średnio minimum 3 wyszukiwania per sesja
- Mierzenie: Średnia liczba zapytań wyszukiwania
- Częstotliwość: Tygodniowo
- Cel biznesowy: Aktywne korzystanie z głównej funkcji

### 6.2 Metryki jakościowe

6.2.1 Trafność sugestii AI
- Cel: 70% sugerowanych tagów jest akceptowanych przez użytkowników
- Mierzenie: Stosunek zaakceptowanych tagów do wszystkich sugerowanych
- Częstotliwość: Tygodniowo
- Cel biznesowy: Jakość automatyzacji AI

6.2.2 Prostota użytkowania (feedback)
- Cel: Ocena prostoty na poziomie minimum 4/5
- Mierzenie: Ankiety użytkowników (skala 1-5)
- Częstotliwość: Miesięcznie
- Cel biznesowy: Spełnienie głównego założenia prostoty

6.2.3 Zadowolenie z systemu organizacji
- Cel: 80% użytkowników ocenia system tagów jako wystarczający
- Mierzenie: Ankiety i feedback użytkowników
- Częstotliwość: Miesięcznie
- Cel biznesowy: Walidacja założenia o wystarczalności płaskich tagów

6.2.4 Skuteczność wykrywania duplikatów
- Cel: Mniej niż 5% duplikatów w bazie użytkownika
- Mierzenie: Analiza bazy pod kątem zduplikowanych URL
- Częstotliwość: Miesięcznie
- Cel biznesowy: Jakość danych i doświadczenia użytkownika

### 6.3 Metryki techniczne

6.3.1 Czas przetwarzania AI
- Cel: 90% linków przetworzonych w czasie krótszym niż 10 sekund
- Mierzenie: Czas od dodania linku do zakończenia przetwarzania AI
- Częstotliwość: Ciągłe monitorowanie
- Cel biznesowy: Szybkość odpowiedzi systemu

6.3.2 Sukces scrapingu
- Cel: 85% linków prawidłowo zescrapowanych
- Mierzenie: Procent udanych operacji scrapingu
- Częstotliwość: Tygodniowo
- Cel biznesowy: Niezawodność automatyzacji

6.3.3 Debounce wyszukiwania
- Cel: Wyszukiwanie reaguje w czasie 300-500ms po zakończeniu pisania
- Mierzenie: Pomiar opóźnienia w środowisku produkcyjnym
- Częstotliwość: Tygodniowo
- Cel biznesowy: Optymalizacja UX

6.3.4 Rate limiting
- Cel: 0 przypadków nadużyć (próby przekroczenia 30 linków/h)
- Mierzenie: Logi prób przekroczenia limitu
- Częstotliwość: Ciągłe monitorowanie
- Cel biznesowy: Zabezpieczenie zasobów

### 6.4 Metryki biznesowe

6.4.1 Konwersja na rejestrację
- Cel: 20% odwiedzających rejestruje konto
- Mierzenie: Stosunek rejestracji do unikalnych wizyt
- Częstotliwość: Tygodniowo
- Cel biznesowy: Efektywność pozyskiwania użytkowników

6.4.2 Koszt AI per użytkownik
- Cel: Utrzymanie kosztów API AI poniżej określonego budżetu
- Mierzenie: Całkowity koszt API / liczba aktywnych użytkowników
- Częstotliwość: Miesięcznie
- Cel biznesowy: Rentowność wersji darmowej

6.4.3 Średni czas sesji
- Cel: Minimum 5 minut per sesja
- Mierzenie: Czas od zalogowania do zakończenia sesji
- Częstotliwość: Tygodniowo
- Cel biznesowy: Zaangażowanie użytkowników

### 6.5 Priorytety mierzenia

Priorytet 1 (krytyczne dla MVP):
- Liczba zapisanych linków per użytkownik
- Minimum 3 tagi per link
- Trafność sugestii AI
- Czas przetwarzania AI

Priorytet 2 (ważne):
- Skuteczność wyszukiwania
- Wskaźnik retencji
- Sukces scrapingu
- Prostota użytkowania

Priorytet 3 (pomocnicze):
- Liczba wyszukiwań per użytkownik
- Koszt AI per użytkownik
- Średni czas sesji
- Konwersja na rejestrację

### 6.6 Metody zbierania danych

- Google Analytics lub alternatywa do śledzenia zachowań użytkowników
- Logi systemowe do monitorowania wydajności technicznej
- Okresowe ankiety użytkowników (miesięczne)
- A/B testing dla kluczowych funkcji interfejsu
- Analiza bazy danych dla metryk jakości danych
- Monitoring kosztów API w czasie rzeczywistym
