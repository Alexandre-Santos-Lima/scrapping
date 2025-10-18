const puppeteer = require('puppeteer');
const os = require('os');
const { CONFIG, FILTER_CONFIGS } = require('./config');

// =============================
// ESTADO GLOBAL
// =============================
let sharedBrowser = null;
const isDocker = process.env.PUPPETEER_EXECUTABLE_PATH !== undefined;
const platform = os.platform();

// =============================
// CONFIGURAÇÃO DO NAVEGADOR
// =============================
function getBrowserConfig() {
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
  
  console.log(`💻 Ambiente: Local ${platform}`);
  return {
    headless: 'new',
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
// GERENCIAMENTO DO NAVEGADOR
// =============================
async function getOrCreateBrowser() {
  if (sharedBrowser && sharedBrowser.isConnected()) {
    console.log('♻️  Reutilizando navegador existente');
    return sharedBrowser;
  }

  console.log('🔷 Criando novo navegador...');
  const config = getBrowserConfig();
  
  sharedBrowser = await puppeteer.launch({
    ...config,
    dumpio: false,
    timeout: 120000
  });

  console.log('✅ Navegador criado!');
  return sharedBrowser;
}

async function closeBrowser() {
  if (sharedBrowser) {
    await sharedBrowser.close();
    sharedBrowser = null;
    console.log('🛑 Navegador fechado');
  }
}

function isBrowserConnected() {
  return sharedBrowser ? sharedBrowser.isConnected() : false;
}

// =============================
// NAVEGAÇÃO E DETECÇÃO
// =============================
async function waitForResults(page) {
  const selectors = [
    'a[href*="/maps/place/"]',
    'div.Nv2PK',
    'div.qBF1Pd',
    'div[role="article"]'
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
// SCROLL INTELIGENTE
// =============================
async function autoScrollLimited(page, maxResults) {
  console.log('🐌 Modo LENTO ativado: Priorizando QUANTIDADE sobre velocidade');
  
  await page.evaluate(async (config) => {
    const wrapper = document.querySelector('div[role="main"]');
    if (!wrapper) {
      console.log('⚠️  Wrapper não encontrado');
      return;
    }

    await new Promise((resolve) => {
      let totalHeight = 0;
      let scrollAttempts = 0;
      let lastItemCount = 0;
      let stableCount = 0;
      
      const maxScrollAttempts = config.maxResults * config.multiplier;
      
      console.log(`🔄 Iniciando scroll AGRESSIVO... Meta: ${config.maxResults} resultados`);
      console.log(`📊 Máximo de tentativas: ${maxScrollAttempts} scrolls`);
      
      const timer = setInterval(() => {
        const scrollHeight = wrapper.scrollHeight;
        wrapper.scrollBy(0, config.distance);
        totalHeight += config.distance;
        scrollAttempts++;

        const currentItems = document.querySelectorAll('a[href*="/maps/place/"]').length;
        
        if (scrollAttempts % 5 === 0 || currentItems !== lastItemCount) {
          console.log(`📜 Scroll ${scrollAttempts}/${maxScrollAttempts}: ${currentItems} itens | ${totalHeight}px`);
        }
        
        if (currentItems === lastItemCount) {
          stableCount++;
        } else {
          stableCount = 0;
          lastItemCount = currentItems;
        }
        
        if (currentItems >= config.maxResults * 2 || 
            scrollAttempts >= maxScrollAttempts || 
            stableCount >= config.stableLimit ||
            totalHeight > config.maxHeight) {
          
          console.log(`✅ Scroll finalizado: ${currentItems} itens em ${scrollAttempts} scrolls (${totalHeight}px)`);
          clearInterval(timer);
          resolve();
        }
      }, config.interval);
    });
  }, {
    maxResults: maxResults,
    distance: CONFIG.SCROLL.DISTANCE,
    interval: CONFIG.SCROLL.INTERVAL,
    multiplier: CONFIG.SCROLL.MAX_ATTEMPTS_MULTIPLIER,
    stableLimit: CONFIG.SCROLL.STABLE_COUNT_LIMIT,
    maxHeight: CONFIG.SCROLL.MAX_HEIGHT
  });

  console.log(`⏳ Aguardando ${CONFIG.SCROLL.FINAL_WAIT / 1000}s para garantir renderização final...`);
  await new Promise(resolve => setTimeout(resolve, CONFIG.SCROLL.FINAL_WAIT));
  console.log('✅ Renderização final concluída!');
}

// =============================
// EXTRAÇÃO DE DADOS
// =============================
async function extractDataFromPage(page, maxResults) {
  return await page.evaluate((maxResults) => {
    
    function extractWebsite(element) {
      const websiteButton = element.querySelector('a[data-item-id="authority"]');
      if (websiteButton && websiteButton.href) return websiteButton.href;

      const linkByLabel = Array.from(element.querySelectorAll('a[aria-label]'))
        .find(a => /website|site|página/i.test(a.getAttribute('aria-label') || ''));
      if (linkByLabel && linkByLabel.href) return linkByLabel.href;

      const externalLink = Array.from(element.querySelectorAll('a[href^="http"]'))
        .find(a => !/google\.com|gstatic\.com|googleusercontent\.com/i.test(a.href || ''));
      if (externalLink && externalLink.href) return externalLink.href;

      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = (element.innerText || '').match(urlRegex);
      if (urls && urls.length > 0) {
        const validUrl = urls.find(url => !/google\.com/i.test(url));
        if (validUrl) return validUrl;
      }

      return null;
    }

    function extractPhone(element) {
      const phoneButton = element.querySelector('button[data-item-id*="phone"]');
      if (phoneButton) {
        const phoneMatch = (phoneButton.innerText || '').match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/);
        if (phoneMatch) return phoneMatch[0];
      }

      const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,3}\)?[-.\s]?\d{4,5}[-.\s]?\d{4}/g;
      const phones = (element.innerText || '').match(phoneRegex);
      
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
        if (text.length > 5 && text.length < 200) return text;
      }

      const addressEl2 = element.querySelector('span[jsaction]');
      if (addressEl2 && addressEl2.innerText) {
        const text = addressEl2.innerText.trim();
        if (text.length > 5 && text.length < 200) return text;
      }

      const addressRegex = /(?:Rua|Avenida|Av\.|R\.|Travessa|Alameda|Praça)[^,\n]{5,100}/i;
      const match = (element.innerText || '').match(addressRegex);
      if (match) return match[0].trim();

      return null;
    }

    const items = [];
    const placeLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
    console.log(`🔍 Links encontrados: ${placeLinks.length}`);
    
    let elements = placeLinks
      .map(link => {
        let parent = link;
        for (let i = 0; i < 6; i++) {
          parent = parent.parentElement;
          if (!parent) break;
          const classes = parent.className || '';
          if (classes.includes('Nv2PK') || classes.includes('THOPZb')) break;
        }
        return parent;
      })
      .filter(el => el !== null);
    
    console.log(`✅ Containers pai encontrados: ${elements.length}`);
    
    if (elements.length === 0) {
      elements = Array.from(document.querySelectorAll('div.Nv2PK, div.THOPZb'));
      console.log(`🔍 Fallback - containers diretos: ${elements.length}`);
    }

    const uniqueElements = [];
    const seenTexts = new Set();
    
    elements.forEach(el => {
      const text = (el.innerText || '').substring(0, 100);
      if (!seenTexts.has(text) && text.length > 10) {
        seenTexts.add(text);
        uniqueElements.push(el);
      }
    });
    
    console.log(`✅ Elementos únicos: ${uniqueElements.length}`);

    uniqueElements.slice(0, maxResults * 2).forEach((el, index) => {
      try {
        let name = null;
        
        const nameEl1 = el.querySelector('div.qBF1Pd');
        if (nameEl1) name = nameEl1.innerText.trim();
        
        if (!name || name.length < 2) {
          const linkEl = el.querySelector('a[href*="/maps/place/"]');
          if (linkEl) {
            const ariaLabel = linkEl.getAttribute('aria-label');
            if (ariaLabel) name = ariaLabel.trim();
          }
        }
        
        if (!name || name.length < 2) {
          const headingEl = el.querySelector('h3, h2, h1');
          if (headingEl) name = headingEl.innerText.trim();
        }
        
        if (!name || name.length < 2) {
          const fontEl = el.querySelector('[class*="fontHeadline"]');
          if (fontEl) name = fontEl.innerText.trim();
        }
        
        if (!name || name.length < 2) return;

        let phone = null;
        const phoneEl = el.querySelector('span.UsdlK');
        if (phoneEl) phone = phoneEl.innerText.trim();
        if (!phone) phone = extractPhone(el);

        const website = extractWebsite(el);
        const address = extractAddress(el);

        let rating = null;
        const ratingEl = el.querySelector('span.ZkP5Je[role="img"]');
        if (ratingEl) rating = ratingEl.getAttribute('aria-label');

        items.push({
          nome: name,
          telefone: phone,
          website: website,
          endereco: address,
          avaliacao: rating
        });

      } catch (err) {
        console.error(`❌ Erro ao extrair item ${index}:`, err.message);
      }
    });

    return items.slice(0, maxResults);
  }, maxResults);
}

// =============================
// FUNÇÃO PRINCIPAL DE SCRAPING
// =============================
async function scrapeGoogleMaps(profissao, local, maxResults = CONFIG.MAX_RESULTS) {
  let page = null;
  let retries = 0;
  
  while (retries <= CONFIG.MAX_RETRIES) {
    try {
      console.log(`🔷 Tentativa ${retries + 1}/${CONFIG.MAX_RETRIES + 1}`);
      
      console.log('🔷 [1/6] Obtendo navegador...');
      const browser = await getOrCreateBrowser();
      
      console.log('🔷 [2/6] Criando nova aba...');
      page = await browser.newPage();
      
      page.setDefaultTimeout(CONFIG.PAGE_TIMEOUT);
      page.setDefaultNavigationTimeout(CONFIG.PAGE_TIMEOUT);
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      const searchQuery = `${profissao} em ${local}`;
      const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
      
      console.log(`🔷 [3/6] Navegando para: ${searchQuery}`);
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: CONFIG.PAGE_TIMEOUT 
      });
      
      console.log('✅ Página carregada!');
      console.log('🔷 [4/6] Aguardando resultados aparecerem...');
      
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
      await new Promise(resolve => setTimeout(resolve, CONFIG.SCROLL.INITIAL_WAIT));

      console.log('🔷 [5/6] Fazendo scroll AGRESSIVO para carregar MÁXIMO de resultados...');
      await autoScrollLimited(page, maxResults);

      console.log('🔷 [6/6] Extraindo dados...');
      const rawResults = await extractDataFromPage(page, maxResults);

      console.log(`✅ Extraídos: ${rawResults.length} itens brutos`);

      const filterConfig = FILTER_CONFIGS[CONFIG.FILTER_MODE];
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

      return { results: finalResults, stats };

    } catch (error) {
      console.error(`❌ Erro na tentativa ${retries + 1}:`, error.message);
      
      if (retries < CONFIG.MAX_RETRIES) {
        console.log(`⏳ Aguardando ${CONFIG.RETRY_DELAY / 1000}s antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        retries++;
        
        if (page) {
          try {
            await page.close();
            page = null;
          } catch (e) {
            console.error('Erro ao fechar aba:', e.message);
          }
        }
      } else {
        throw new Error(`Falha após ${CONFIG.MAX_RETRIES + 1} tentativas: ${error.message}`);
      }
    } finally {
      if (page && retries > CONFIG.MAX_RETRIES) {
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

module.exports = {
  scrapeGoogleMaps,
  closeBrowser,
  isBrowserConnected,
  platform,
  isDocker
};