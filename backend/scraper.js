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
// EXTRAÇÃO ITEM POR ITEM (1 a 1)
// =============================
async function extractOneByOne(page, maxResults) {
  console.log('🔄 Iniciando extração ITEM POR ITEM (1 a 1)...');
  
  // Passar o timestamp de início para o evaluate
  const startTimestamp = Date.now();
  
  return await page.evaluate(async (config) => {
    const { maxResults, startTime } = config;
    
    // Funções auxiliares dentro do contexto do navegador
    function extractWebsite(element) {
      const websiteButton = element.querySelector('a[data-item-id="authority"]');
      if (websiteButton && websiteButton.href) return websiteButton.href;

      const linkByLabel = Array.from(element.querySelectorAll('a[aria-label]'))
        .find(a => /website|site|página/i.test(a.getAttribute('aria-label') || ''));
      if (linkByLabel && linkByLabel.href) return linkByLabel.href;

      const externalLink = Array.from(element.querySelectorAll('a[href^="http"]'))
        .find(a => !/google\.com|gstatic\.com|googleusercontent\.com/i.test(a.href || ''));
      if (externalLink && externalLink.href) return externalLink.href;

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

      return null;
    }

    function extractDataFromElement(element) {
      try {
        let name = null;
        
        const nameEl1 = element.querySelector('div.qBF1Pd');
        if (nameEl1) name = nameEl1.innerText.trim();
        
        if (!name || name.length < 2) {
          const linkEl = element.querySelector('a[href*="/maps/place/"]');
          if (linkEl) {
            const ariaLabel = linkEl.getAttribute('aria-label');
            if (ariaLabel) name = ariaLabel.trim();
          }
        }
        
        if (!name || name.length < 2) return null;

        const phone = extractPhone(element);
        const website = extractWebsite(element);
        const address = extractAddress(element);

        let rating = null;
        const ratingEl = element.querySelector('span.ZkP5Je[role="img"]');
        if (ratingEl) rating = ratingEl.getAttribute('aria-label');

        return {
          nome: name,
          telefone: phone,
          website: website,
          endereco: address,
          avaliacao: rating
        };
      } catch (err) {
        return null;
      }
    }

    function formatElapsedTime(ms) {
      const seconds = Math.floor(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }

    // =============================
    // EXTRAÇÃO SEQUENCIAL 1 A 1
    // =============================
    const wrapper = document.querySelector('div[role="main"]');
    if (!wrapper) {
      console.log('⚠️  Wrapper principal não encontrado');
      return { items: [], stats: { extracted: 0, scrolls: 0, processed: 0 } };
    }

    const savedItems = []; // Array final de itens salvos
    const processedKeys = new Set(); // Controle de duplicatas
    
    let totalScrolls = 0;
    let consecutiveNoNew = 0;
    let processedCount = 0;
    
    const MAX_NO_NEW = 15; // Parar após 15 tentativas sem novos itens
    const SCROLL_DISTANCE = 600;
    const WAIT_AFTER_SCROLL = 2000;

    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║  🎯 EXTRAÇÃO ITEM POR ITEM INICIADA   ║`);
    console.log(`╚════════════════════════════════════════╝`);
    console.log(`📊 Meta: ${maxResults} leads`);
    console.log(`⏱️  Início: ${new Date().toLocaleTimeString()}`);
    console.log(`═══════════════════════════════════════\n`);

    while (savedItems.length < maxResults && consecutiveNoNew < MAX_NO_NEW) {
      // Pegar TODOS os links visíveis na viewport atual
      const allLinks = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      
      let foundNewInThisRound = false;

      // Processar cada link individualmente
      for (const link of allLinks) {
        processedCount++;
        
        // Já atingiu o limite? Parar
        if (savedItems.length >= maxResults) {
          const elapsed = Date.now() - startTime;
          console.log(`\n🎉 META ATINGIDA: ${savedItems.length} leads em ${formatElapsedTime(elapsed)}`);
          break;
        }

        // Encontrar o container pai
        let container = link;
        for (let i = 0; i < 6; i++) {
          container = container.parentElement;
          if (!container) break;
          const classes = container.className || '';
          if (classes.includes('Nv2PK') || classes.includes('THOPZb')) break;
        }

        if (!container) continue;

        // Extrair dados deste item específico
        const data = extractDataFromElement(container);
        if (!data || !data.nome) continue;

        // Chave única para evitar duplicatas
        const uniqueKey = `${data.nome}|${data.endereco || 'N/A'}`;

        // Se já foi processado, pular
        if (processedKeys.has(uniqueKey)) {
          continue;
        }

        // ✅ SALVAR ITEM IMEDIATAMENTE NA "TABLE"
        processedKeys.add(uniqueKey);
        savedItems.push(data);
        foundNewInThisRound = true;

        // 📊 LOG DETALHADO DE CADA LEAD SALVO
        const elapsed = Date.now() - startTime;
        const hasContact = data.telefone || data.website;
        const contactInfo = [];
        if (data.telefone) contactInfo.push(`📞 ${data.telefone}`);
        if (data.website) contactInfo.push(`🌐 Site`);
        
        console.log(`╔════════════════════════════════════════╗`);
        console.log(`║ 💾 LEAD #${savedItems.length} SALVO NA TABLE`);
        console.log(`╠════════════════════════════════════════╣`);
        console.log(`║ 👤 Nome: ${data.nome.substring(0, 35)}`);
        if (contactInfo.length > 0) {
          console.log(`║ 📞 Contato: ${contactInfo.join(' | ')}`);
        } else {
          console.log(`║ ⚠️  Sem contato`);
        }
        console.log(`║ ⏱️  Tempo: ${formatElapsedTime(elapsed)}`);
        console.log(`║ 📊 Progresso: ${savedItems.length}/${maxResults} (${Math.round(savedItems.length/maxResults*100)}%)`);
        console.log(`╚════════════════════════════════════════╝\n`);
      }

      // Se encontrou novos itens, resetar contador
      if (foundNewInThisRound) {
        consecutiveNoNew = 0;
      } else {
        consecutiveNoNew++;
      }

      // Se atingiu o limite, parar
      if (savedItems.length >= maxResults) {
        break;
      }

      // Se não encontrou novos itens por muito tempo, parar
      if (consecutiveNoNew >= MAX_NO_NEW) {
        const elapsed = Date.now() - startTime;
        console.log(`\n⚠️  PARANDO: ${consecutiveNoNew} tentativas sem novos leads`);
        console.log(`⏱️  Tempo total: ${formatElapsedTime(elapsed)}`);
        break;
      }

      // =============================
      // SCROLL PARA CARREGAR MAIS
      // =============================
      const elapsed = Date.now() - startTime;
      console.log(`🔄 Scroll #${totalScrolls + 1} - Carregando mais leads... (${formatElapsedTime(elapsed)})`);
      
      const beforeScroll = wrapper.scrollTop;
      wrapper.scrollBy(0, SCROLL_DISTANCE);
      const afterScroll = wrapper.scrollTop;
      
      totalScrolls++;

      // Verificar se conseguiu scrollar (não chegou no fim)
      if (beforeScroll === afterScroll) {
        console.log(`⚠️  FIM DA PÁGINA - Não há mais leads disponíveis`);
        consecutiveNoNew++;
      }

      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, WAIT_AFTER_SCROLL));
    }

    const totalElapsed = Date.now() - startTime;
    
    console.log(`\n╔════════════════════════════════════════╗`);
    console.log(`║     ✅ EXTRAÇÃO CONCLUÍDA COM SUCESSO ║`);
    console.log(`╠════════════════════════════════════════╣`);
    console.log(`║ 💾 Leads salvos: ${savedItems.length}/${maxResults}`);
    console.log(`║ ⏱️  Tempo total: ${formatElapsedTime(totalElapsed)}`);
    console.log(`║ 🔄 Scrolls: ${totalScrolls}`);
    console.log(`║ 🔍 Processados: ${processedCount}`);
    console.log(`║ 📞 Com telefone: ${savedItems.filter(i => i.telefone).length}`);
    console.log(`║ 🌐 Com website: ${savedItems.filter(i => i.website).length}`);
    console.log(`╚════════════════════════════════════════╝\n`);

    return {
      items: savedItems,
      stats: {
        extracted: savedItems.length,
        scrolls: totalScrolls,
        processed: processedCount,
        duration: totalElapsed
      }
    };
  }, { maxResults, startTime: startTimestamp });
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

      console.log('🔷 [5/6] Extraindo dados ITEM POR ITEM...');
      const extractionStartTime = Date.now();
      const { items: rawResults, stats: extractionStats } = await extractOneByOne(page, maxResults);
      const extractionDuration = ((Date.now() - extractionStartTime) / 1000).toFixed(2);

      console.log(`\n═══════════════════════════════════════`);
      console.log(`✅ Extração finalizada!`);
      console.log(`📊 Itens extraídos: ${rawResults.length}`);
      console.log(`⏱️  Tempo de extração: ${extractionDuration}s`);
      console.log(`🔄 Total de scrolls: ${extractionStats.scrolls}`);
      console.log(`🔍 Total processado: ${extractionStats.processed}`);
      console.log(`═══════════════════════════════════════\n`);

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
        retries: retries,
        scrolls: extractionStats.scrolls
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
