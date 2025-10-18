// =============================
// CONFIGURAÇÕES GLOBAIS
// =============================

const CONFIG = {
  MAX_RESULTS: parseInt(process.env.MAX_RESULTS) || 50,
  FILTER_MODE: process.env.FILTER_MODE || 'CONTACT_REQUIRED',
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 2,
  RETRY_DELAY: parseInt(process.env.RETRY_DELAY) || 5000,
  PAGE_TIMEOUT: parseInt(process.env.PAGE_TIMEOUT) || 180000,
  SCROLL: {
    DISTANCE: parseInt(process.env.SCROLL_DISTANCE) || 500,
    INTERVAL: parseInt(process.env.SCROLL_INTERVAL) || 1000,
    MAX_ATTEMPTS_MULTIPLIER: parseInt(process.env.SCROLL_MULTIPLIER) || 2,
    STABLE_COUNT_LIMIT: parseInt(process.env.SCROLL_STABLE_LIMIT) || 8,
    MAX_HEIGHT: parseInt(process.env.SCROLL_MAX_HEIGHT) || 50000,
    INITIAL_WAIT: parseInt(process.env.SCROLL_INITIAL_WAIT) || 5000,
    FINAL_WAIT: parseInt(process.env.SCROLL_FINAL_WAIT) || 8000
  }
};

// =============================
// PROFISSÕES DISPONÍVEIS
// =============================

const PROFISSOES = [
  'Nutricionista', 'Dentista', 'Advogado', 'Contador', 'Arquiteto',
  'Fisioterapeuta', 'Psicólogo', 'Personal Trainer', 'Veterinário',
  'Engenheiro', 'Médico', 'Farmácia', 'Restaurante', 'Academia',
  'Salão de Beleza', 'Pet Shop', 'Clínica', 'Consultório', 
  'Escritório', 'Loja'
];

// =============================
// FILTROS DE VALIDAÇÃO
// =============================

const FILTER_CONFIGS = {
  NAME_ONLY: {
    description: 'Retorna todos os leads que tenham nome',
    validate: (item) => Boolean(item.nome)
  },
  CONTACT_REQUIRED: {
    description: 'Retorna apenas leads com nome e pelo menos um contato',
    validate: (item) => Boolean(item.nome && (item.telefone || item.website))
  },
  STRICT: {
    description: 'Retorna apenas leads completos',
    validate: (item) => Boolean(item.nome && item.telefone && item.website && item.endereco)
  }
};

module.exports = {
  CONFIG,
  PROFISSOES,
  FILTER_CONFIGS
};