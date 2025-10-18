import React from 'react';
import { Code } from 'lucide-react';

export default function APIPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-6 flex items-center gap-3">
          <Code className="w-10 h-10 text-blue-400" />
          Documentação da API
        </h2>

        <div className="space-y-8">
          {/* Base URL */}
          <section>
            <h3 className="text-2xl font-bold text-purple-400 mb-4">Base URL</h3>
            <div className="bg-slate-900 rounded-lg p-4 border border-purple-500/30">
              <code className="text-green-400 font-mono">
                https://scrapping.apsolutions.ia.br/api
              </code>
            </div>
          </section>

          {/* Endpoints */}
          <section className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-2xl font-bold text-pink-400 mb-4">Endpoints</h3>
            
            <div className="space-y-6">
              {/* GET /api/profissoes */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded text-sm font-bold">GET</span>
                  <code className="text-blue-400 font-mono">/api/profissoes</code>
                </div>
                <p className="text-gray-300 mb-3">Lista todas as profissões disponíveis para busca.</p>
                
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Resposta:</p>
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "profissoes": [
    "Nutricionista",
    "Dentista",
    "Advogado",
    ...
  ],
  "total": 20
}`}
                  </pre>
                </div>
              </div>

              {/* POST /api/search */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-600 px-3 py-1 rounded text-sm font-bold">POST</span>
                  <code className="text-blue-400 font-mono">/api/search</code>
                </div>
                <p className="text-gray-300 mb-3">Realiza busca no Google Maps e retorna os resultados com estatísticas.</p>
                
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10 mb-3">
                  <p className="text-xs text-gray-400 mb-2">Request Body:</p>
                  <pre className="text-yellow-400 text-sm overflow-x-auto">
{`{
  "profissao": "Nutricionista",
  "local": "Rio de Janeiro, RJ",
  "maxResults": 50
}`}
                  </pre>
                </div>

                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Resposta:</p>
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "success": true,
  "query": {
    "profissao": "Nutricionista",
    "local": "Rio de Janeiro, RJ",
    "maxResults": 50
  },
  "count": 45,
  "duration": "62.5s",
  "stats": {
    "total": 48,
    "withPhone": 42,
    "withWebsite": 38,
    "withAddress": 45,
    "validAfterFilter": 45,
    "returned": 45,
    "retries": 0
  },
  "results": [
    {
      "nome": "Clínica XYZ",
      "telefone": "(21) 98765-4321",
      "website": "https://exemplo.com",
      "endereco": "Rua ABC, 123",
      "avaliacao": "4,5 estrelas"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              {/* GET /health */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-green-600 px-3 py-1 rounded text-sm font-bold">GET</span>
                  <code className="text-blue-400 font-mono">/health</code>
                </div>
                <p className="text-gray-300 mb-3">Health check do servidor.</p>
                
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">Resposta:</p>
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`{
  "status": "ok",
  "timestamp": "2025-10-18T12:00:00.000Z",
  "version": "2.1",
  "platform": "linux",
  "config": {
    "maxResults": 50,
    "filterMode": "CONTACT_REQUIRED"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </section>

          {/* Exemplos */}
          <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">💡 Exemplos de Uso</h3>
            
            <div className="space-y-4">
              {/* cURL */}
              <div>
                <h4 className="text-white font-bold mb-2">cURL</h4>
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <pre className="text-yellow-400 text-sm overflow-x-auto">
{`curl -X POST https://scrapping.apsolutions.ia.br/api/search \\
  -H "Content-Type: application/json" \\
  -d '{
    "profissao": "Dentista",
    "local": "São Paulo, SP",
    "maxResults": 30
  }'`}
                  </pre>
                </div>
              </div>

              {/* JavaScript */}
              <div>
                <h4 className="text-white font-bold mb-2">JavaScript (Fetch)</h4>
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <pre className="text-blue-400 text-sm overflow-x-auto">
{`const response = await fetch('/api/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profissao: 'Dentista',
    local: 'São Paulo, SP',
    maxResults: 30
  })
});

const data = await response.json();
console.log(data.results);`}
                  </pre>
                </div>
              </div>

              {/* Python */}
              <div>
                <h4 className="text-white font-bold mb-2">Python (Requests)</h4>
                <div className="bg-slate-900 rounded-lg p-4 border border-white/10">
                  <pre className="text-pink-400 text-sm overflow-x-auto">
{`import requests

response = requests.post(
    'https://scrapping.apsolutions.ia.br/api/search',
    json={
        'profissao': 'Dentista',
        'local': 'São Paulo, SP',
        'maxResults': 30
    }
)

data = response.json()
print(f"Encontrados: {data['count']} resultados")`}
                  </pre>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}