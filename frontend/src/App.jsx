import React, { useState, useEffect } from 'react';
import { Search, Home, Book, Code } from 'lucide-react';

// Importar páginas
import HomePage from './pages/HomePage';
import DocsPage from './pages/DocsPage';
import APIPage from './pages/APIPage';

export default function App() {
  // =============================
  // ESTADO
  // =============================
  const [page, setPage] = useState('home');
  const [profissoes, setProfissoes] = useState([]);
  const [profissao, setProfissao] = useState('');
  const [local, setLocal] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchStats, setSearchStats] = useState(null);

  const API_URL = '/api';

  // =============================
  // CARREGAR PROFISSÕES
  // =============================
  useEffect(() => {
    fetch(`${API_URL}/profissoes`)
      .then(res => res.json())
      .then(data => setProfissoes(data.profissoes))
      .catch(err => console.error('Erro ao carregar profissões:', err));
  }, []);

  // =============================
  // HANDLER DE BUSCA
  // =============================
  const handleSearch = async () => {
    if (!profissao || !local) return;

    setLoading(true);
    setSearched(false);
    setResults([]);
    setSearchStats(null);

    try {
      const response = await fetch(`${API_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profissao, local })
      });

      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setSearchStats(data.stats);
        setSearched(true);
      } else {
        alert('Erro: ' + (data.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao realizar busca. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // NAVEGAÇÃO
  // =============================
  const navigationItems = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'docs', label: 'Documentação', icon: Book },
    { id: 'api', label: 'API', icon: Code }
  ];

  // =============================
  // RENDER
  // =============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation Bar */}
        <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Maps Scraper Pro
                </h1>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex gap-4">
                {navigationItems.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPage(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      page === id 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          {page === 'home' && (
            <HomePage
              profissoes={profissoes}
              profissao={profissao}
              setProfissao={setProfissao}
              local={local}
              setLocal={setLocal}
              loading={loading}
              handleSearch={handleSearch}
              searched={searched}
              searchStats={searchStats}
              results={results}
            />
          )}
          
          {page === 'docs' && <DocsPage />}
          {page === 'api' && <APIPage />}
        </div>

        {/* Footer */}
        <footer className="text-center py-8 text-gray-400 text-sm">
          <p>Desenvolvido por APsolutions • Maps Scraper Pro v2.0</p>
        </footer>
      </div>
    </div>
  );
}