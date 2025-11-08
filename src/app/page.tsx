import Link from "next/link";
import {
  Sparkles,
  Search,
  Shield,
  Zap,
  Tag,
  Star,
  Brain,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                TagLink
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex px-4 py-2 bg-linear-to-r from-purple-600 to-blue-500 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                Rozpocznij za darmo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                Powered by AI
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Zarządzaj linkami
              <br />
              <span className="bg-linear-to-r from-purple-600 via-blue-500 to-pink-500 bg-clip-text text-transparent">
                inteligentnie
              </span>
            </h1>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Zapisuj, organizuj i odnajduj swoje linki z pomocą AI. TagLink
              automatycznie generuje opisy i sugeruje tagi, oszczędzając Twój
              czas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/register"
                className="group px-8 py-4 bg-linear-to-r from-purple-600 to-blue-500 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Rozpocznij za darmo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                Zobacz więcej
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">30</div>
                <div className="text-sm text-gray-600">linków/godzinę</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">&lt;10s</div>
                <div className="text-sm text-gray-600">przetwarzanie AI</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">prywatne</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Dlaczego TagLink?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Przestań tracić czas na ręczną organizację. Pozwól AI zrobić to
              za Ciebie.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Descriptions
              </h3>
              <p className="text-gray-600">
                Automatyczne generowanie opisów z zawartości strony. Nigdy więcej ręcznego pisania notatek.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Tagging
              </h3>
              <p className="text-gray-600">
                AI sugeruje 3-10 tagów z Twojej kolekcji. Inteligentna kategoryzacja bez wysiłku.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Search
              </h3>
              <p className="text-gray-600">
                Znajdź każdy link w sekundę. Wyszukiwanie po tagach, tytułach i opisach.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-pink-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Rating System
              </h3>
              <p className="text-gray-600">
                Oceń ważność linków gwiazdkami. Sortuj po ocenie, aby zawsze mieć najważniejsze na wierzchu.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Instant Processing
              </h3>
              <p className="text-gray-600">
                Przetwarzanie linku w 5-10 sekund. Scraping + AI w jednym kroku.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                100% Prywatne
              </h3>
              <p className="text-gray-600">
                Twoje dane należą tylko do Ciebie. Brak współdzielenia, pełna prywatność.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Jak to działa?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Trzy proste kroki do lepszej organizacji linków
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative ml-6 md:ml-0">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-linear-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                1
              </div>
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  Wklej URL
                </h3>
                <p className="text-gray-600 text-center">
                  Po prostu wklej link do interesującej Cię strony. TagLink automatycznie pobierze wszystkie potrzebne dane.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative ml-6 md:ml-0">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-linear-to-br from-blue-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                2
              </div>
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  AI przetwarza
                </h3>
                <p className="text-gray-600 text-center">
                  Sztuczna inteligencja analizuje treść, generuje opis i sugeruje najlepsze tagi z Twojej kolekcji.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative ml-6 md:ml-0">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-linear-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                3
              </div>
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  Gotowe!
                </h3>
                <p className="text-gray-600 text-center">
                  Twój link jest zapisany, opisany i skategoryzowany. Teraz możesz go łatwo odnaleźć w przyszłości.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-linear-to-br from-purple-600 via-blue-500 to-pink-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Gotowy na lepszą organizację?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Dołącz do TagLink i przestań tracić czas na szukanie linków. AI
            zrobi to za Ciebie.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              Rozpocznij za darmo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-purple-100 text-sm mt-6">
            Nie wymagamy karty kredytowej • Freemium model • 30 linków/godzinę
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-linear-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                TagLink
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 TagLink. Inteligentne zarządzanie linkami z AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
