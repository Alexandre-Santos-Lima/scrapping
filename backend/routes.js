const express = require('express');
const { CONFIG, PROFISSOES } = require('./config');
const { scrapeGoogleMaps, isBrowserConnected, platform, isDocker } = require('./scraper');

const router = express.Router();

// =============================
// SISTEMA DE FILA
// =============================
let isProcessing = false;
const queue = [];

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  const { profissao, local, maxResults, resolve, reject } = queue.shift();
  
  console.log(`📋 Fila: ${queue.length} aguardando`);
  
  try {
    const result = await scrapeGoogleMaps(profissao, local, maxResults);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    setTimeout(() => processQueue(), 2000);
  }
}

function addToQueue(profissao, local, maxResults) {
  return new Promise((resolve, reject) => {
    queue.push({ profissao, local, maxResults, resolve, reject });
    console.log(`➕ Adicionado à fila: ${profissao} | ${local} (posição: ${queue.length})`);
    processQueue();
  });
}

// =============================
// ROTAS
// =============================

// GET /api/profissoes - Lista profissões disponíveis
router.get('/profissoes', (req, res) => {
  res.json({ 
    profissoes: PROFISSOES,
    total: PROFISSOES.length
  });
});

// POST /api/search - Realiza busca no Google Maps
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { profissao, local, maxResults } = req.body;

    // Validações
    if (!profissao || !local) {
      return res.status(400).json({ 
        success: false,
        error: 'Profissão e local são obrigatórios' 
      });
    }

    if (typeof profissao !== 'string' || profissao.length < 2 || profissao.length > 100) {
      return res.status(400).json({ 
        success: false,
        error: 'Profissão deve ter entre 2 e 100 caracteres' 
      });
    }

    if (typeof local !== 'string' || local.length < 2 || local.length > 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Local deve ter entre 2 e 200 caracteres' 
      });
    }

    const limit = maxResults ? Math.min(Math.max(parseInt(maxResults), 1), 100) : CONFIG.MAX_RESULTS;

    console.log(`\n🔥 Nova requisição: ${profissao} | ${local} | Limite: ${limit}`);

    const { results, stats } = await addToQueue(profissao, local, limit);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Busca concluída em ${duration}s | ${results.length} resultados | ${stats.retries} retries\n`);

    res.json({
      success: true,
      query: { profissao, local, maxResults: limit },
      count: results.length,
      duration: `${duration}s`,
      stats: stats,
      results: results
    });

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Erro após ${duration}s:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Erro ao realizar busca',
      message: error.message,
      duration: `${duration}s`
    });
  }
});

// GET /api/queue - Status da fila de processamento
router.get('/queue', (req, res) => {
  res.json({
    processing: isProcessing,
    queueLength: queue.length,
    browserConnected: isBrowserConnected(),
    positions: queue.map((item, i) => ({
      position: i + 1,
      profissao: item.profissao,
      local: item.local,
      maxResults: item.maxResults
    }))
  });
});

// GET /health - Health check do servidor
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.1',
    platform: platform,
    isDocker: isDocker,
    config: {
      maxResults: CONFIG.MAX_RESULTS,
      filterMode: CONFIG.FILTER_MODE,
      maxRetries: CONFIG.MAX_RETRIES,
      retryDelay: `${CONFIG.RETRY_DELAY / 1000}s`,
      pageTimeout: `${CONFIG.PAGE_TIMEOUT / 1000}s`,
      scroll: {
        distance: `${CONFIG.SCROLL.DISTANCE}px`,
        interval: `${CONFIG.SCROLL.INTERVAL / 1000}s`,
        maxAttempts: `maxResults * ${CONFIG.SCROLL.MAX_ATTEMPTS_MULTIPLIER}`,
        stableLimit: CONFIG.SCROLL.STABLE_COUNT_LIMIT,
        maxHeight: `${CONFIG.SCROLL.MAX_HEIGHT}px`
      }
    },
    browser: {
      connected: isBrowserConnected()
    },
    queue: {
      processing: isProcessing,
      waiting: queue.length
    }
  });
});

module.exports = router;