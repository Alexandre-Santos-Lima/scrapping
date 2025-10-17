const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const MAX_RESULTS = 50;
const FILTER_MODE = 'CONTACT_REQUIRED';

// =============================
// NAVEGADOR PERSISTENTE
// =============================
let sharedBrowser = null;

async function getOrCreateBrowser() {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    console.log('♻️  Reutilizando navegador existente');
    return sharedBrowser;
  }

  console.log('🔷 Criando novo navegador...');
  
  sharedBrowser = await puppeteer.launch({
  headless: true,
  executablePath: '/usr/bin/chromium',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--disable-blink-features=AutomationControlled',
    '--window-size=1920,1080',
    '--user-data-dir=/tmp/chromium-data'
  ],
  ignoreDefaultArgs: ['--enable-automation'],
  dumpio: true,
  timeout: 90000
});


  console.log('✅ Navegador criado!');
  return sharedBrowser;
}

// =============================
// SISTEMA DE FILA
// =============================
let isProcessing = false;
const queue = [];

async function processQueue() {
  if (isProcessing || queue.length === 0) return;
  
  isProcessing = true;
  const { profissao, local, resolve, reject } = queue.shift();
  
  console.log(`📋 Fila: ${queue.length} aguardando`);
  
  try {
    const result = await scrapeGoogleMaps(profissao, local);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    isProcessing = false;
    setTimeout(() => processQueue(), 2000);
  }
}

function addToQueue(profissao, local) {
  return new Promise((resolve, reject) => {
    queue.push({ profissao, local, resolve, reject });
    console.log(`➕ Adicionado à fila: ${profissao} | ${local} (posição: ${queue.length})`);
    processQueue();
  });
}

// =============================

const FILTER_CONFIGS = {
  NAME_ONLY: {
    description: 'Retorna todos os leads que tenham nome',
    validate: (item) => Boolean(item.nome)
  },
  
  CONTACT_REQUIRED: {
    description: 'Retorna apenas leads com nome e pelo menos um contato (telefone ou website)',
    validate: (item) => Boolean(item.nome && (item.telefone || item.website))
  },
  
  STRICT: {
    description: 'Retorna apenas leads completos (nome, telefone, website e endereço)',
    validate: (item) => Boolean(
      item.nome && 
      item.telefone && 
      item.website && 
      item.endereco
    )
  }
};

const profissoes = [
  'Nutricionista',
  'Dentista',
  'Advogado',
  'Contador',
  'Arquiteto',
  'Fisioterapeuta',
  'Psicólogo',
  'Personal Trainer',
  'Veterinário',
  'Engenheiro',
  'Médico',
  'Farmácia',
  'Restaurante',
  'Academia',
  'Salão de Beleza',
  'Pet Shop',
  'Clínica',
  'Consultório',
  'Escritório',
  'Loja'
];

app.get('/api/profissoes', (req, res) => {
  res.json({ profissoes });
});

async function scrapeGoogleMaps(profissao, local) {
  let page = null;
  
  try {
    console.log('🔷 [1/5] Obtendo navegador...');
    const browser = await getOrCreateBrowser();
    
    console.log('🔷 [2/5] Criando nova aba...');
    page = await browser.newPage();
    
    page.setDefaultTimeout(90000);
    page.setDefaultNavigationTimeout(90000);
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });

    const searchQuery = `${profissao} em ${local}`;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    
    console.log(`🔷 [3/5] Navegando para: ${searchQuery}`);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 90000 
    });
    
    console.log('✅ Página carregada!');
    console.log('🔷 [4/5] Aguardando resultados aparecerem...');
    
    // CRÍTICO: Aguardar os cards de resultados aparecerem
    try {
      await page.waitForSelector('div[role="article"]', { 
        timeout: 30000,
        visible: true 
      });
      console.log('✅ Resultados detectados!');
    } catch (e) {
      console.log('⚠️  Nenhum resultado encontrado após 30s');
      return { results: [], stats: { total: 0, returned: 0 } };
    }
    
    // Aguardar mais um pouco para garantir
    await page.waitForTimeout(3000);

    console.log('🔷 [5/5] Fazendo scroll para carregar mais...');
    await autoScrollLimited(page, MAX_RESULTS);

    console.log('🔷 [6/6] Extraindo dados...');
    const rawResults = await page.evaluate((maxResults) => {

      function extractWebsite(element) {
        // Primeiro tenta link com aria-label contendo "website" ou "site"
        const linkByLabel = Array.from(element.querySelectorAll('a[aria-label]'))
          .find(a => /website|site/i.test(a.getAttribute('aria-label')));
        if (linkByLabel) return linkByLabel.href;

        // Depois qualquer link externo que não seja google
        const externalLink = Array.from(element.querySelectorAll('a[href^="http"]'))
          .find(a => !/google\.com/.test(a.href));
        return externalLink ? externalLink.href : null;
      }

      const items = [];
      const elements = Array.from(document.querySelectorAll('div[role="article"]')).slice(0, maxResults * 2);

      console.log(`🔍 Encontrados ${elements.length} elementos no DOM`);

      elements.forEach((el, index) => {
        try {
          // Nome do local
          const nameEl = el.querySelector('h3 span');
          const name = nameEl ? nameEl.innerText.trim() : null;
          if (!name) return;

          // Endereço
          const addressEl = el.querySelector('[aria-label][data-tooltip]') || el.querySelector('span[jsaction]');
          const address = addressEl ? addressEl.innerText.trim() : null;

          // Telefone
          const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g;
          const phones = el.innerText.match(phoneRegex);
          const phone = phones ? phones[0] : null;

          // Avaliação
          const ratingEl = el.querySelector('span[role="img"]');
          const rating = ratingEl ? ratingEl.getAttribute('aria-label') : null;

          // Website
          const website = extractWebsite(el);

          items.push({
            nome: name,
            telefone: phone,
            website: website,
            endereco: address,
            avaliacao: rating
          });
        } catch (err) {
          console.error(`Erro ao extrair item ${index}:`, err);
        }
      });

      return items.slice(0, maxResults);
    }, MAX_RESULTS);

    console.log(`✅ Extraídos: ${rawResults.length} itens brutos`);

    const filterConfig = FILTER_CONFIGS[FILTER_MODE];
    const filteredResults = rawResults.filter(filterConfig.validate);

    console.log(`✅ Após filtro: ${filteredResults.length} resultados válidos`);

    const finalResults = filteredResults.slice(0, MAX_RESULTS);

    const stats = {
      total: rawResults.length,
      withPhone: rawResults.filter(r => r.telefone).length,
      withWebsite: rawResults.filter(r => r.website).length,
      withAddress: rawResults.filter(r => r.endereco).length,
      validAfterFilter: filteredResults.length,
      returned: finalResults.length
    };

    console.log(`📊 Estatísticas: ${stats.withPhone} telefones | ${stats.withWebsite} websites`);

    return { results: finalResults, stats };

  } catch (error) {
    console.error('❌ Erro no scraping:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
        console.log('✅ Aba fechada (navegador permanece aberto)');
      } catch (e) {
        console.error('Erro ao fechar aba:', e.message);
      }
    }
  }
}

async function autoScrollLimited(page, maxResults) {
  await page.evaluate(async (maxResults) => {
    const wrapper = document.querySelector('div[role="main"]');
    if (!wrapper) {
      console.log('⚠️  Wrapper não encontrado');
      return;
    }

    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      let scrollAttempts = 0;
      const maxScrollAttempts = Math.ceil(maxResults / 5) * 2;
      
      const timer = setInterval(() => {
        const scrollHeight = wrapper.scrollHeight;
        wrapper.scrollBy(0, distance);
        totalHeight += distance;
        scrollAttempts++;

        const currentItems = document.querySelectorAll('div[role="article"]').length;
        console.log(`Scroll ${scrollAttempts}: ${currentItems} items`);
        
        if (currentItems >= maxResults * 1.5 || 
            scrollAttempts >= maxScrollAttempts || 
            totalHeight >= scrollHeight ||
            totalHeight > 15000) {
          clearInterval(timer);
          resolve();
        }
      }, 800);
    });
  }, maxResults);

  await page.waitForTimeout(3000);
}


app.post('/api/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { profissao, local } = req.body;

    if (!profissao || !local) {
      return res.status(400).json({ 
        error: 'Profissão e local são obrigatórios' 
      });
    }

    console.log(`\n🔥 Nova requisição: ${profissao} | ${local}`);

    const { results, stats } = await addToQueue(profissao, local);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Busca concluída em ${duration}s | ${results.length} resultados\n`);

    res.json({
      success: true,
      query: { profissao, local },
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

app.get('/api/queue', (req, res) => {
  res.json({
    processing: isProcessing,
    queueLength: queue.length,
    browserConnected: sharedBrowser ? sharedBrowser.isConnected() : false,
    positions: queue.map((item, i) => ({
      position: i + 1,
      profissao: item.profissao,
      local: item.local
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    maxResults: MAX_RESULTS,
    filterMode: FILTER_MODE,
    browser: {
      connected: sharedBrowser ? sharedBrowser.isConnected() : false
    },
    queue: {
      processing: isProcessing,
      waiting: queue.length
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, fechando navegador...');
  if (sharedBrowser) {
    await sharedBrowser.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📋 Profissões disponíveis: ${profissoes.length}`);
  console.log(`📊 Limite por busca: ${MAX_RESULTS} resultados`);
  console.log(`🔧 Modo de filtragem: ${FILTER_MODE}`);
  console.log(`🌐 Chromium: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
  console.log(`⚙️  Sistema de fila: ATIVO`);
  console.log(`♻️  Navegador persistente: ATIVO`);
});