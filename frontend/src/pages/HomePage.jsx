import React from 'react';
import { Search, MapPin, Phone, Globe, Star, Loader2, CheckCircle, TrendingUp } from 'lucide-react';

export default function HomePage({ 
  profissoes, 
  profissao, 
  setProfissao, 
  local, 
  setLocal, 
  loading, 
  handleSearch, 
  searched, 
  searchStats, 
  results 
}) {
  
  return (
    <>
      {/* Header Section */}
      <div className="text-center mb-12">
        <p className="text-gray-300 text-lg">
          Encontre contatos e websites de profissionais em qualquer região
        </p>
      </div>

      {/* Search Form */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Profissão Select */}
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

            {/* Local Input */}
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

          {/* Search Button */}
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

      {/* Results Section */}
      {searched && (
        <div className="max-w-6xl mx-auto">
          {/* Statistics */}
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

          {/* Results List */}
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
}