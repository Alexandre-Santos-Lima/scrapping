import React from 'react';
import { Book, CheckCircle } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
          <Book className="w-10 h-10 text-purple-400" />
          Documentação
        </h2>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Sobre */}
          <section>
            <h3 className="text-2xl font-bold text-purple-400 mb-4">📋 Sobre o Maps Scraper Pro</h3>
            <p className="text-gray-300 leading-relaxed">
              O Maps Scraper Pro é uma ferramenta automatizada para extrair dados de contato de profissionais 
              e empresas do Google Maps. Ideal para prospecção de clientes, pesquisa de mercado e geração de leads.
            </p>
          </section>

          {/* Funcionalidades */}
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

          {/* Como Usar */}
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

          {/* Notas Importantes */}
          <section className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">⚠️ Notas Importantes</h3>
            <ul className="space-y-2 text-gray-300">
              <li>• O processo pode levar de 30 a 90 segundos dependendo da quantidade de resultados</li>
              <li>• Evite fazer múltiplas buscas simultâneas</li>
              <li>• Nem todos os estabelecimentos terão telefone ou website cadastrados</li>
              <li>• Respeite os Termos de Serviço do Google ao usar os dados coletados</li>
            </ul>
          </section>

          {/* Integrações */}
          <section>
            <h3 className="text-2xl font-bold text-green-400 mb-4">🔌 Integrações</h3>
            <p className="text-gray-300 mb-4">
              O Maps Scraper Pro pode ser integrado com diversas plataformas de automação através da API REST.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* n8n */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  n8n
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  Use o nó HTTP Request para fazer chamadas à API.
                </p>
                <code className="text-xs bg-slate-900 px-2 py-1 rounded text-blue-400">
                  POST /api/search
                </code>
              </div>

              {/* Zapier */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Zapier
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  Configure um Webhook para receber os dados.
                </p>
                <code className="text-xs bg-slate-900 px-2 py-1 rounded text-blue-400">
                  Webhooks by Zapier
                </code>
              </div>

              {/* Make (Integromat) */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Make (Integromat)
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  Use o módulo HTTP para fazer requisições.
                </p>
                <code className="text-xs bg-slate-900 px-2 py-1 rounded text-blue-400">
                  HTTP: Make a request
                </code>
              </div>

              {/* Python/Node.js */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Scripts Personalizados
                </h4>
                <p className="text-gray-300 text-sm mb-2">
                  Integre diretamente com Python, Node.js, etc.
                </p>
                <code className="text-xs bg-slate-900 px-2 py-1 rounded text-blue-400">
                  Ver seção API
                </code>
              </div>
            </div>

            <div className="mt-4 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                💡 <strong>Dica:</strong> Consulte a seção <strong>API</strong> para exemplos completos de código e integrações.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}