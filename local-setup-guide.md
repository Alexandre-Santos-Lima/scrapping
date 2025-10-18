# 🚀 Guia de Instalação Local - Maps Scraper Pro

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- ✅ **Node.js** (versão 18 ou superior) - [Download aqui](https://nodejs.org/)
- ✅ **VSCode** - [Download aqui](https://code.visualstudio.com/)
- ✅ **Git** (opcional, mas recomendado)

### Verificar instalação:
```bash
node --version
# Deve mostrar: v18.x.x ou superior

npm --version
# Deve mostrar: 9.x.x ou superior
```

---

## 📂 Estrutura do Projeto

Certifique-se de que seu projeto tenha essa estrutura:

```
maps-scraper-pro/
├── backend/
│   ├── package-lock.json
│   ├── package.json
│   ├── config.js
│   ├── routes.js
│   ├── scraper.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├──pages/
│   │   │   ├── APIPage.jsx
│   │   │   ├── DocsPage.jsx
│   │   │   └── HomePage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── start-local.bat
├── start-local.sh
├── stop-local.sh
├── local-setup-guide.md
└── README.md
```

---

## 🔧 Instalação Passo a Passo

### **Passo 1: Abrir o projeto no VSCode**

```bash
# Abra o terminal e navegue até a pasta do projeto
cd caminho/para/maps-scraper-pro

# Abra no VSCode
code .
```

---

### **Passo 2: Instalar Dependências do Backend**

Abra o terminal integrado do VSCode (`Ctrl + '` ou `Cmd + '` no Mac):

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Aguarde a instalação...
```

**Dependências instaladas:**
- `express` - Servidor HTTP
- `puppeteer` - Automação do browser
- `cors` - Permitir requisições do frontend

---

### **Passo 3: Instalar Dependências do Frontend**

```bash
# Volte para a raiz do projeto
cd ..

# Entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Aguarde a instalação...
```

**Dependências instaladas:**
- `react` + `react-dom` - Framework
- `vite` - Build tool
- `tailwindcss` - Estilização
- `lucide-react` - Ícones

---

## ▶️ Rodando o Projeto

### **Opção 1: Rodar Backend e Frontend Separadamente (RECOMENDADO)**

#### Terminal 1 - Backend:
```bash
cd backend
node server.js
```

**Saída esperada:**
```
╔════════════════════════════════════════╗
║   Maps Scraper Pro - Backend v2.0      ║
╚════════════════════════════════════════╝
🚀 Servidor rodando na porta 3001
📋 Profissões disponíveis: 20
📊 Limite por busca: 50 resultados
...
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

**Saída esperada:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### **Opção 2: Usar Scripts Automatizados**

Execute:
```bash
chmod +x start-local.sh
./start-local.sh
```

---

## 🌐 Acessando a Aplicação

1. **Abra o navegador**
2. **Acesse:** `http://localhost:5173`
3. **Pronto!** O sistema está rodando 🎉

---

## 🧪 Testando a Aplicação

### **Teste 1: Interface**
1. Acesse `http://localhost:5173`
2. Selecione uma profissão (ex: "Dentista")
3. Digite um local (ex: "Rio de Janeiro, RJ")
4. Clique em "Buscar no Google Maps"

### **Teste 2: API diretamente**

Use o **Postman** ou **curl**:

```bash
# Listar profissões
curl http://localhost:3001/api/profissoes

# Fazer uma busca
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profissao": "Dentista",
    "local": "Rio de Janeiro, RJ"
  }'

# Health check
curl http://localhost:3001/health
```

### **Teste 3: DevTools**

Abra o DevTools do navegador (`F12`):
- **Console**: Veja logs do frontend
- **Network**: Veja requisições para `/api/search`
- **Application**: Veja localStorage (futuro histórico)

---

## 🐛 Problemas Comuns

### **Erro: "Cannot find module 'puppeteer'"**
```bash
cd backend
npm install
```

### **Erro: "Port 3001 already in use"**
```bash
# Linux/Mac
lsof -ti:3001 | xargs kill -9

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### **Erro: "Failed to launch browser"**

**No Windows:**
```bash
# Puppeteer vai baixar o Chromium automaticamente
cd backend
npm install puppeteer
```

**No Linux:**
```bash
# Instale dependências do Chromium
sudo apt-get install -y \
  chromium-browser \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libcups2 \
  libxrandr2 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0
```

**No Mac:**
```bash
# Puppeteer funciona out-of-the-box
# Se der erro, reinstale:
cd backend
rm -rf node_modules package-lock.json
npm install
```

### **Frontend não carrega estilos**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run dev
```

---

## 🔥 Dicas de Desenvolvimento

### **1. Hot Reload Automático**

O Vite já faz hot reload do frontend automaticamente!

Para o backend, use **nodemon**:
```bash
cd backend
npm install -D nodemon

# Depois rode:
npx nodemon server.js
```

### **2. Ver Logs do Puppeteer**

Edite `backend/server.js`:
```javascript
const browser = await puppeteer.launch({
  headless: false, // ← Mostra o navegador
  dumpio: true,    // ← Mostra logs do Chromium
  // ...
});
```

### **3. Debugar no VSCode**

Crie `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Backend Debug",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

Depois aperte `F5` para debugar!

### **4. Testar API no VSCode**

Instale a extensão **REST Client** e crie `test.http`:

```http
### Listar Profissões
GET http://localhost:3001/api/profissoes

### Buscar Leads
POST http://localhost:3001/api/search
Content-Type: application/json

{
  "profissao": "Dentista",
  "local": "São Paulo, SP",
  "maxResults": 10
}

### Health Check
GET http://localhost:3001/health
```

Clique em "Send Request" acima de cada bloco!

---

## 📊 Monitoramento

### **Ver requisições em tempo real:**

**Backend:**
```bash
cd backend
node server.js
# Veja os logs no terminal
```

**Frontend (Network Tab):**
1. Abra DevTools (`F12`)
2. Aba "Network"
3. Filtre por `api`
4. Veja todas as requisições

---

## 🎯 Próximos Passos

1. ✅ Rode o projeto localmente
2. 🧪 Faça alguns testes de busca
3. 🔍 Analise os logs no terminal
4. 📊 Veja as estatísticas retornadas
5. 🐛 Reporte bugs ou comportamentos estranhos

---

## 📝 Checklist Final

- [ ] Node.js instalado
- [ ] Dependências do backend instaladas
- [ ] Dependências do frontend instaladas
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 5173
- [ ] Conseguiu acessar `http://localhost:5173`
- [ ] Primeira busca funcionou
- [ ] Viu resultados com telefone/website

---

## 💡 Dica Pro

Adicione no `package.json` da raiz:

```json
{
  "name": "maps-scraper-pro",
  "version": "1.0.0",
  "scripts": {
    "backend": "cd backend && node server.js",
    "frontend": "cd frontend && npm run dev",
    "install-all": "cd backend && npm install && cd ../frontend && npm install"
  }
}
```

Depois rode:
```bash
npm run install-all  # Instala tudo de uma vez
npm run backend      # Roda só o backend
npm run frontend     # Roda só o frontend
```

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs no terminal**
2. **Veja o Console do navegador (F12)**
3. **Certifique-se que as portas 3001 e 5173 estão livres**
4. **Reinstale as dependências se necessário**

---

**Boa sorte! 🚀**