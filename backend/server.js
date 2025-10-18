const express = require('express');
const cors = require('cors');
const { CONFIG, PROFISSOES } = require('./config');
const { closeBrowser, platform, isDocker } = require('./scraper');
const routes = require('./routes');

// =============================
// INICIALIZAÇÃO DO EXPRESS
// =============================
const app = express();
const PORT = process.env.PORT || 3001;

// =============================
// MIDDLEWARES
// =============================
app.use(cors());
app.use(express.json());

// =============================
// ROTAS
// =============================
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Maps Scraper Pro API',
    version: '2.1',
    status: 'online',
    endpoints: {
      health: '/health',
      profissoes: '/api/profissoes',
      search: 'POST /api/search',
      queue: '/api/queue'
    }
  });
});

// =============================
// GRACEFUL SHUTDOWN
// =============================
async function shutdown(signal) {
  console.log(`\n🛑 ${signal} recebido, encerrando gracefully...`);
  await closeBrowser();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// =============================
// INICIALIZAÇÃO DO SERVIDOR
// =============================
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Maps Scraper Pro - Backend v2.1    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`💻 Plataforma: ${platform}`);
  console.log(`🐳 Docker: ${isDocker ? 'Sim' : 'Não'}`);
  console.log(`📋 Profissões disponíveis: ${PROFISSOES.length}`);
  console.log(`📊 Limite por busca: ${CONFIG.MAX_RESULTS} resultados`);
  console.log(`🔧 Modo de filtragem: ${CONFIG.FILTER_MODE}`);
  console.log(`🔄 Retries automáticos: ${CONFIG.MAX_RETRIES}`);
  console.log(`⏱️  Delay entre retries: ${CONFIG.RETRY_DELAY / 1000}s`);
  console.log(`⚙️  Sistema de fila: ATIVO`);
  console.log(`♻️  Navegador persistente: ATIVO`);
  console.log(`🐌 Modo LENTO: ATIVO (Prioriza QUANTIDADE)`);
  console.log('════════════════════════════════════════\n');
});