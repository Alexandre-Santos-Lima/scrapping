import React, { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Globe, Star, Loader2, CheckCircle, Book, Code, Home, TrendingUp } from 'lucide-react';

export default function App() {
  const [page, setPage] = useState('home');
  const [profissoes, setProfissoes] = useState([]);
  const [profissao, setProfissao] = useState('');
  const [local, setLocal] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchStats, setSearchStats] = useState(null);

  const API_URL = '/api';

  // Carregar profissões apenas uma vez
  useEffect(() => {
    fetch(`${API_URL}/profissoes`)
      .then(res => res.json())
      .then(data => setProfissoes(data.profissoes))
      .catch(err => console.error('Erro ao carregar profissões:', err));
  }, []);

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

  const HomePage = () => (
    <>
      <div className="text-center mb-12">
        <p className="text-gray-300 text-lg">
          Encontre contatos e websites de profissionais em qualquer região
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                Profissão ou Empresa
              </label>
              <select
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="" className="bg-slate-800">Selecione uma opção</option>
                {profissoes.map((prof) => (
                  <option key={prof} value={prof} className="bg-slate-800">
                    {prof}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-400" />
                Localização
              </label>
              <input
                type="text"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                placeholder="Ex: Rio de Janeiro, RJ"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !profissao || !local}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 shadow-lg shadow-purple-500/50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando resultados...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Buscar no Google Maps
              </>
            )}
          </button>
        </div>
      </div>

      {searched && (
        <div className="max-w-6xl mx-auto">
          {/* Estatísticas da Busca */}
          {searchStats && (
            <div className="backdrop-blur-xl bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-3xl p-6 border border-green-500/30 shadow-2xl mb-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-xl font-bold text-white">Estatísticas da Busca</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {searchStats.returned}
                  </div>
                  <div className="text-sm text-gray-300">Resultados Válidos</div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-blue-400 mb-1">
                    {searchStats.withPhone}
                  </div>
                  <div className="text-sm text-gray-300">Com Telefone</div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {searchStats.withWebsite}
                  </div>
                  <div className="text-sm text-gray-300">Com Website</div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold text-pink-400 mb-1">
                    {searchStats.withAddress}
                  </div>
                  <div className="text-sm text-gray-300">Com Endereço</div>
                </div>
              </div>

              {searchStats.total > searchStats.returned && (
                <div className="mt-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ {searchStats.total - searchStats.returned} resultados foram ignorados por não terem dados de contato
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-green-400" />
                Resultados da Busca
              </h2>
              <div className="flex gap-3">
                <span className="bg-purple-600/50 px-4 py-2 rounded-full text-white font-semibold">
                  {results.length} encontrados
                </span>
                {results.length >= 50 && (
                  <span className="bg-yellow-600/50 px-4 py-2 rounded-full text-white font-semibold text-sm flex items-center gap-2">
                    ⚠️ Limite atingido
                  </span>
                )}
              </div>
            </div>

            {results.length === 0 ? (
              <p className="text-gray-300 text-center py-8">
                Nenhum resultado encontrado para essa busca.
              </p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all hover:border-purple-500/50"
                  >
                    <h3 className="text-xl font-bold text-white mb-3">
                      {result.nome}
                    </h3>
                    
                    <div className="space-y-2">
                      {result.telefone && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <Phone className="w-5 h-5 text-green-400" />
                          <a href={`tel:${result.telefone}`} className="hover:text-green-400 transition-colors">
                            {result.telefone}
                          </a>
                        </div>
                      )}
                      
                      {result.website && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <Globe className="w-5 h-5 text-blue-400" />
                          <a 
                            href={result.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-400 transition-colors truncate max-w-md block"
                          >
                            {result.website}
                          </a>
                        </div>
                      )}
                      
                      {result.endereco && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <MapPin className="w-5 h-5 text-pink-400" />
                          <span>{result.endereco}</span>
                        </div>
                      )}
                      
                      {result.avaliacao && (
                        <div className="flex items-center gap-3 text-gray-300">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span>{result.avaliacao}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const DocsPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
          <Book className="w-10 h-10 text-purple-400" />
          Documentação
        </h2>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h3 className="text-2xl font-bold text-purple-400 mb-4">📋 Sobre o Maps Scraper Pro</h3>
            <p className="text-gray-300 leading-relaxed">
              O Maps Scraper Pro é uma ferramenta automatizada para extrair dados de contato de profissionais 
              e empresas do Google Maps. Ideal para prospecção de clientes, pesquisa de mercado e geração de leads.
            </p>
          </section>

          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold text-pink-400 mb-4">🎯 Funcionalidades</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Busca automatizada no Google Maps com scroll infinito</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Extração de nome, telefone, website, endereço e avaliação</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>API REST para integração com n8n, Zapier e outras ferramentas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Interface moderna e responsiva</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <span>Estatísticas detalhadas de cada busca</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-blue-400 mb-4">🚀 Como Usar</h3>
            <div className="space-y-4 text-gray-300">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2">1. Selecione a Profissão</h4>
                <p>Escolha na lista pré-definida para evitar erros de digitação.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2">2. Digite o Local</h4>
                <p>Informe cidade e estado (ex: Rio de Janeiro, RJ).</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2">3. Clique em Buscar</h4>
                <p>Aguarde enquanto o sistema coleta todos os resultados disponíveis.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2">4. Visualize Estatísticas e Resultados</h4>
                <p>Veja quantos contatos foram encontrados e acesse os dados completos.</p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ Notas Importantes</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• O processo pode levar de 30 a 90 segundos dependendo da quantidade de resultados</li>
              <li>• Evite fazer múltiplas buscas simultâneas</li>
              <li>• Nem todos os estabelecimentos terão telefone ou website cadastrados</li>
              <li>• Respeite os Termos de Serviço do Google ao usar os dados coletados</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );

  const APIPage = () => (
    <div className="max-w-5xl mx-auto">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
          <Code className="w-10 h-10 text-blue-400" />
          Documentação da API
        </h2>

        <div className="space-y-8">
          <section>
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Base URL</h3>
            <div className="bg-slate-900 rounded-lg p-4 border border-purple-500/30">
              <code className="text-green-400 font-mono">
                https://scrapping.apsolutions.ia.br/api
              </code>
            </div>
          </section>

          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold text-pink-400 mb-4">Endpoints</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded text-sm font-bold">GET</span>
                  <code className="text-blue-400 font-mono">/api/profissoes</code>
                </div>
                <p className="text-gray-300 mb-3">Lista todas as profissões disponíveis para busca.</p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">POST</span>
                  <code className="text-blue-400 font-mono">/api/search</code>
                </div>
                <p className="text-gray-300 mb-3">Realiza busca no Google Maps e retorna os resultados com estatísticas.</p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded text-sm font-bold">GET</span>
                  <code className="text-blue-400 font-mono">/health</code>
                </div>
                <p className="text-gray-300 mb-3">Health check do servidor.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <nav className="backdrop-blur-xl bg-white/5 border-b border-white/10 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Maps Scraper Pro
                </h1>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setPage('home')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    page === 'home' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  Início
                </button>
                <button
                  onClick={() => setPage('docs')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    page === 'docs' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Book className="w-4 h-4" />
                  Documentação
                </button>
                <button
                  onClick={() => setPage('api')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    page === 'api' 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  API
                </button>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="container mx-auto px-4 py-12">
          {page === 'home' && <HomePage />}
          {page === 'docs' && <DocsPage />}
          {page === 'api' && <APIPage />}
        </div>

        <footer className="text-center py-8 text-gray-400 text-sm">
          <p>Desenvolvido por APsolutions • Maps Scraper Pro v2.1</p>
        </footer>
      </div>
    </div>
  );
}