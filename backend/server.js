const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const MAX_RESULTS = 50;
const FILTER_MODE = 'CONTACT_REQUIRED';
const MAX_RETRIES = 2;
const RETRY_DELAY = 5000;

// =============================
// DETECTAR SISTEMA OPERACIONAL E CONFIGURAR BROWSER
// =============================
const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;
const platform = os.platform();

function getBrowserConfig() {
  // Se estiver em Docker/Linux com caminho definido
  if (isDocker) {
    console.log('🐳 Ambiente: Docker/Production');
    return {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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
      ignoreDefaultArgs: ['--enable-automation']
    };
  }
  
  // Windows, Mac ou Linux local - usa Chrome baixado pelo Puppeteer
  console.log(`💻 Ambiente: Local ${platform}`);
  return {
    headless: 'new', // Usa novo headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080'
    ],
    ignoreDefaultArgs: ['--enable-automation']
  };
}

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
  
  const config = getBrowserConfig();
  
  sharedBrowser = await puppeteer.launch({
    ...config,
    dumpio: false, // Desabilita logs verbosos
    timeout: 120000
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

function addToQueue(profissao, local, maxResults = MAX_RESULTS) {
  return new Promise((resolve, reject) => {
    queue.push({ profissao, local, maxResults, resolve, reject });
    console.log(`➕ Adicionado à fila: ${profissao} | ${local} (posição: ${queue.length})`);
    processQueue();
  });
}

// =============================
// CONFIGURAÇÕES DE FILTRO
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

// =============================
// FUNÇÃO PRINCIPAL DE SCRAPING (MELHORADA)
// =============================
async function scrapeGoogleMaps(profissao, local, maxResults = MAX_RESULTS) {
  let page = null;
  let retries = 0;
  
  while (retries <= MAX_RETRIES) {
    try {
      console.log(`🔷 Tentativa ${retries + 1}/${MAX_RETRIES + 1}`);
      
      console.log('🔷 [1/6] Obtendo navegador...');
      const browser = await getOrCreateBrowser();
      
      console.log('🔷 [2/6] Criando nova aba...');
      page = await browser.newPage();
      
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(120000);
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      const searchQuery = `${profissao} em ${local}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      console.log(`🔷 [3/6] Navegando para: ${searchQuery}`);
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 120000 
      });
      
      console.log('✅ Página carregada!');
      console.log('🔷 [4/6] Aguardando resultados aparecerem...');
      
      // MELHORADO: Tenta múltiplos seletores
      const resultsFound = await waitForResults(page);
      
      if (!resultsFound) {
        console.log('⚠️  Nenhum resultado encontrado');
        return { 
          results: [], 
          stats: { total: 0, returned: 0, withPhone: 0, withWebsite: 0, withAddress: 0, validAfterFilter: 0 },
          retries: retries
        };
      }
      
      console.log('✅ Resultados detectados!');
      
      // Aguardar estabilização
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('🔷 [5/6] Fazendo scroll para carregar mais...');
      await autoScrollLimited(page, maxResults);

      console.log('🔷 [6/6] Extraindo dados...');
      const rawResults = await extractDataFromPage(page, maxResults);

      console.log(`✅ Extraídos: ${rawResults.length} itens brutos`);

      const filterConfig = FILTER_CONFIGS[FILTER_MODE];
      const filteredResults = rawResults.filter(filterConfig.validate);

      console.log(`✅ Após filtro: ${filteredResults.length} resultados válidos`);

      const finalResults = filteredResults.slice(0, maxResults);

      const stats = {
        total: rawResults.length,
        withPhone: rawResults.filter(r => r.telefone).length,
        withWebsite: rawResults.filter(r => r.website).length,
        withAddress: rawResults.filter(r => r.endereco).length,
        validAfterFilter: filteredResults.length,
        returned: finalResults.length,
        retries: retries
      };

      console.log(`📊 Estatísticas: ${stats.withPhone} telefones | ${stats.withWebsite} websites | ${stats.withAddress} endereços`);

      // Sucesso - sai do loop de retry
      return { results: finalResults, stats };

    } catch (error) {
      console.error(`❌ Erro na tentativa ${retries + 1}:`, error.message);
      
      if (retries < MAX_RETRIES) {
        console.log(`⏳ Aguardando ${RETRY_DELAY / 1000}s antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        retries++;
        
        // Fecha a página atual antes de retry
        if (page) {
          try {
            await page.close();
            page = null;
          } catch (e) {
            console.error('Erro ao fechar aba:', e.message);
          }
        }
      } else {
        // Esgotou tentativas
        throw new Error(`Falha após ${MAX_RETRIES + 1} tentativas: ${error.message}`);
      }
    } finally {
      if (page && retries > MAX_RETRIES) {
        try {
          await page.close();
          console.log('✅ Aba fechada (navegador permanece aberto)');
        } catch (e) {
          console.error('Erro ao fechar aba:', e.message);
        }
      }
    }
  }
}

// =============================
// NOVA FUNÇÃO: AGUARDAR RESULTADOS COM MÚLTIPLOS SELETORES
// =============================
async function waitForResults(page) {
  const selectors = [
    'a[href*="/maps/place/"]',  // Seletor principal baseado no F12
    'div.Nv2PK',                // Seletor do container
    'div.qBF1Pd',               // Seletor do título (do F12)
    'div[role="article"]'       // Fallback
  ];

  for (const selector of selectors) {
    try {
      console.log(`🔍 Tentando seletor: ${selector}`);
      await page.waitForSelector(selector, { 
        timeout: 15000,
        visible: true 
      });
      console.log(`✅ Seletor encontrado: ${selector}`);
      return true;
    } catch (e) {
      console.log(`⚠️  Seletor não encontrado: ${selector}`);
      continue;
    }
  }
  
  return false;
}

// =============================
// NOVA FUNÇÃO: EXTRAÇÃO DE DADOS MELHORADA
// =============================
async function extractDataFromPage(page, maxResults) {
  return await page.evaluate((maxResults) => {
    
    function extractWebsite(element) {
      const websiteButton = element.querySelector('a[data-item-id="authority"]');
      if (websiteButton && websiteButton.href) {
        return websiteButton.href;
      }

      const linkByLabel = Array.from(element.querySelectorAll('a[aria-label]'))
        .find(a => {
          const label = a.getAttribute('aria-label') || '';
          return /website|site|página/i.test(label);
        });
      if (linkByLabel && linkByLabel.href) {
        return linkByLabel.href;
      }

      const externalLink = Array.from(element.querySelectorAll('a[href^="http"]'))
        .find(a => {
          const href = a.href || '';
          return !/google\.com|gstatic\.com|googleusercontent\.com/i.test(href);
        });
      if (externalLink && externalLink.href) {
        return externalLink.href;
      }

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const textContent = element.innerText || '';
      const urls = textContent.match(urlRegex);
      if (urls && urls.length > 0) {
        const validUrl = urls.find(url => !/google\.com/i.test(url));
        if (validUrl) return validUrl;
      }

      return null;
    }

    function extractPhone(element) {
      const phoneButton = element.querySelector('button[data-item-id*="phone"]');
      if (phoneButton) {
        const phoneText = phoneButton.innerText || phoneButton.textContent || '';
        const phoneMatch = phoneText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/);
        if (phoneMatch) return phoneMatch[0];
      }

      const text = element.innerText || element.textContent || '';
      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g;
      const phones = text.match(phoneRegex);
      
      if (phones && phones.length > 0) {
        const validPhone = phones.find(p => {
          const digits = p.replace(/\D/g, '');
          return digits.length >= 10 && digits.length <= 15;
        });
        return validPhone || phones[0];
      }

      return null;
    }

    function extractAddress(element) {
      const addressEl1 = element.querySelector('[aria-label][data-tooltip]');
      if (addressEl1 && addressEl1.innerText) {
        const text = addressEl1.innerText.trim();
        if (text.length > 5 && text.length < 200) {
          return text;
        }
      }

      const addressEl2 = element.querySelector('span[jsaction]');
      if (addressEl2 && addressEl2.innerText) {
        const text = addressEl2.innerText.trim();
        if (text.length > 5 && text.length < 200) {
          return text;
        }
      }

      const text = element.innerText || '';
      const addressRegex = /(?:Rua|Avenida|Av\.|R\.|Travessa|Alameda|Praça)[^,\n]{5,100}/i;
      const match = text.match(addressRegex);
      if (match) {
        return match[0].trim();
      }

      return null;
    }

    const items = [];
    
    // MÚLTIPLOS SELETORES PARA ENCONTRAR OS CARDS
    let elements = [];
    
    // Tenta seletor 1: div[role="article"]
    elements = Array.from(document.querySelectorAll('div[role="article"]'));
    console.log(`🔍 Seletor 1 [role="article"]: ${elements.length} elementos`);
    
    // Tenta seletor 2: links para lugares (fallback)
    if (elements.length === 0) {
      elements = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'))
        .map(link => {
          // Pega o container pai que tem as informações
          let parent = link;
          for (let i = 0; i < 5; i++) {
            parent = parent.parentElement;
            if (!parent) break;
            // Verifica se o pai tem conteúdo substancial
            const text = parent.innerText || '';
            if (text.length > 50) break;
          }
          return parent;
        })
        .filter(el => el !== null);
      console.log(`🔍 Seletor 2 [links]: ${elements.length} elementos`);
    }
    
    // Tenta seletor 3: divs com aria-label (novo formato do Maps)
    if (elements.length === 0) {
      elements = Array.from(document.querySelectorAll('div[aria-label]'))
        .filter(el => {
          const label = el.getAttribute('aria-label') || '';
          const text = el.innerText || '';
          // Filtra elementos que parecem ser cards de resultados
          return text.length > 30 && text.length < 1000;
        });
      console.log(`🔍 Seletor 3 [aria-label]: ${elements.length} elementos`);
    }

    console.log(`✅ Total de elementos para processar: ${elements.length}`);

    // Remove duplicatas baseado no texto interno
    const uniqueElements = [];
    const seenTexts = new Set();
    
    elements.forEach(el => {
      const text = (el.innerText || '').substring(0, 100);
      if (!seenTexts.has(text) && text.length > 10) {
        seenTexts.add(text);
        uniqueElements.push(el);
      }
    });
    
    console.log(`✅ Elementos únicos após deduplicação: ${uniqueElements.length}`);

    uniqueElements.slice(0, maxResults * 2).forEach((el, index) => {
      try {
        // BUSCA DE NOME MELHORADA - múltiplas tentativas
        let name = null;
        
        // Tentativa 1: h3 > span
        const nameEl1 = el.querySelector('h3 span');
        if (nameEl1) name = nameEl1.innerText.trim();
        
        // Tentativa 2: h3 direto
        if (!name) {
          const nameEl2 = el.querySelector('h3');
          if (nameEl2) name = nameEl2.innerText.trim();
        }
        
        // Tentativa 3: qualquer heading
        if (!name) {
          const nameEl3 = el.querySelector('h1, h2, h4');
          if (nameEl3) name = nameEl3.innerText.trim();
        }
        
        // Tentativa 4: Link para o lugar
        if (!name) {
          const linkEl = el.querySelector('a[href*="/maps/place/"]');
          if (linkEl) {
            const ariaLabel = linkEl.getAttribute('aria-label');
            if (ariaLabel) name = ariaLabel.trim();
          }
        }
        
        // Tentativa 5: Primeiro texto em negrito grande
        if (!name) {
          const boldEl = el.querySelector('[class*="fontHeadline"], [class*="fontTitle"]');
          if (boldEl) name = boldEl.innerText.trim();
        }
        
        if (!name || name.length < 2) {
          console.log(`⚠️  Item ${index}: Nome não encontrado`);
          return;
        }

        const phone = extractPhone(el);
        const website = extractWebsite(el);
        const address = extractAddress(el);

        const ratingEl = el.querySelector('span[role="img"]');
        const rating = ratingEl ? ratingEl.getAttribute('aria-label') : null;

        const item = {
          nome: name,
          telefone: phone,
          website: website,
          endereco: address,
          avaliacao: rating
        };

        console.log(`✅ Item ${index}: ${name} | Tel: ${phone ? '✓' : '✗'} | Web: ${website ? '✓' : '✗'} | End: ${address ? '✓' : '✗'}`);

        items.push(item);
      } catch (err) {
        console.error(`❌ Erro ao extrair item ${index}:`, err.message);
      }
    });

    return items.slice(0, maxResults);
  }, maxResults);
}

// =============================
// FUNÇÃO DE SCROLL
// =============================
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

  await new Promise(resolve => setTimeout(resolve, 3000));
}

// =============================
// ENDPOINT DE BUSCA
// =============================
app.post('/api/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { profissao, local, maxResults } = req.body;

    if (!profissao || !local) {
      return res.status(400).json({ 
        error: 'Profissão e local são obrigatórios' 
      });
    }

    if (typeof profissao !== 'string' || profissao.length < 2 || profissao.length > 100) {
      return res.status(400).json({ 
        error: 'Profissão deve ter entre 2 e 100 caracteres' 
      });
    }

    if (typeof local !== 'string' || local.length < 2 || local.length > 200) {
      return res.status(400).json({ 
        error: 'Local deve ter entre 2 e 200 caracteres' 
      });
    }

    const limit = maxResults ? Math.min(Math.max(parseInt(maxResults), 1), 100) : MAX_RESULTS;

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

// =============================
// ENDPOINTS AUXILIARES
// =============================
app.get('/api/queue', (req, res) => {
  res.json({
    processing: isProcessing,
    queueLength: queue.length,
    browserConnected: sharedBrowser ? sharedBrowser.isConnected() : false,
    positions: queue.map((item, i) => ({
      position: i + 1,
      profissao: item.profissao,
      local: item.local,
      maxResults: item.maxResults
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0',
    platform: platform,
    isDocker: isDocker,
    maxResults: MAX_RESULTS,
    filterMode: FILTER_MODE,
    maxRetries: MAX_RETRIES,
    retryDelay: `${RETRY_DELAY / 1000}s`,
    browser: {
      connected: sharedBrowser ? sharedBrowser.isConnected() : false
    },
    queue: {
      processing: isProcessing,
      waiting: queue.length
    }
  });
});

// =============================
// GRACEFUL SHUTDOWN
// =============================
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recebido, fechando navegador...');
  if (sharedBrowser) {
    await sharedBrowser.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recebido, fechando navegador...');
  if (sharedBrowser) {
    await sharedBrowser.close();
  }
  process.exit(0);
});

// =============================
// INICIALIZAÇÃO
// =============================
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Maps Scraper Pro - Backend v2.0    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`💻 Plataforma: ${platform}`);
  console.log(`🐳 Docker: ${isDocker ? 'Sim' : 'Não'}`);
  console.log(`📋 Profissões disponíveis: ${profissoes.length}`);
  console.log(`📊 Limite por busca: ${MAX_RESULTS} resultados`);
  console.log(`🔧 Modo de filtragem: ${FILTER_MODE}`);
  console.log(`🔄 Retries automáticos: ${MAX_RETRIES}`);
  console.log(`⏱️  Delay entre retries: ${RETRY_DELAY / 1000}s`);
  console.log(`⚙️  Sistema de fila: ATIVO`);
  console.log(`♻️  Navegador persistente: ATIVO`);
  console.log('════════════════════════════════════════\n');
});