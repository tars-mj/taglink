# Tech Stack - TagLink

## Frontend - Next.js 15 jako pełnoprawny framework full-stack

- Next.js 15 zapewnia kompletne rozwiązanie z wbudowanym routingiem, SSR/SSG i API Routes dla optymalnej wydajności
- TypeScript 5 gwarantuje bezpieczeństwo typów i lepsze wsparcie IDE podczas rozwoju aplikacji
- Tailwind 4 umożliwia szybkie i spójne stylowanie z utility-first approach
- Shadcn/ui dostarcza wysokiej jakości, dostępne komponenty React gotowe do customizacji

## Backend i baza danych - Supabase jako kompleksowe rozwiązanie backendowe

- Zapewnia zarządzaną bazę danych PostgreSQL z Row Level Security (RLS)
- Oferuje gotową autentykację użytkowników z obsługą OAuth i magic links
- Real-time subscriptions umożliwiają natychmiastową synchronizację danych
- Edge Functions pozwalają na wykonywanie logiki biznesowej po stronie serwera
- Open source z możliwością self-hostingu dla pełnej kontroli nad danymi

## Komunikacja z modelami AI - OpenRouter.ai jako agregator modeli

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google, Meta) z jednego API
- Automatyczny fallback między modelami w przypadku niedostępności
- Elastyczne zarządzanie kosztami z możliwością ustawienia limitów per klucz API
- Optymalizacja kosztów poprzez wybór najtańszego modelu spełniającego wymagania

## Web Scraping - Playwright dla niezawodnego pobierania treści

- Obsługa nowoczesnych aplikacji SPA i stron z lazy loading
- Automatyczne czekanie na załadowanie treści dynamicznej
- Wsparcie dla wielu silników przeglądarek (Chromium, Firefox, WebKit)
- Inteligentna obsługa cookie banners, paywalli i innych przeszkód

## CI/CD i Hosting

- GitHub Actions automatyzuje testy, budowanie i deployment aplikacji
- Railway zapewnia prosty deployment z automatycznym skalowaniem i wbudowanym CI/CD
- Automatyczne budowanie z każdym pushem do wybranej gałęzi GitHub
- Wbudowane zmienne środowiskowe, certyfikaty SSL i monitoring aplikacji