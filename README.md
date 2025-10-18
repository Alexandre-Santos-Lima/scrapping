# 🚀 Maps Scraper Pro - Execução Local

## ⚡ Início Rápido (3 comandos)

### **Opção 1: Automático (Linux/Mac)**
```bash
chmod +x start-local.sh
./start-local.sh
```

### **Opção 2: Automático (Windows)**
```cmd
start-local.bat
```

### **Opção 3: Manual (Qualquer SO)**
```bash
# Terminal 1 - Backend
cd backend
npm install
node server.js

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### **Opção 4: Com NPM Scripts (Recomendado)**
```bash
# Na raiz do projeto
npm install  # Instala concurrently e nodemon
npm run install-all  # Instala dependências do backend e frontend
npm run dev  # Inicia ambos com hot reload
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:5173 | Interface do usuário |
| **Backend** | http://localhost:3001 | API REST |
| **Health Check** | http://localhost:3001/health | Status do servidor |
| **Profissões** | http://localhost:3001/api/profissoes | Lista de profissões |

---

## 📋 Pré-requisitos

- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ 4GB RAM livre
- ✅ Conexão com internet

---

## 🧪 Testar se Está Funcionando

### **Teste 1: Health Check**
```bash
curl http://localhost:3001/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T...",
  "version": "2.0",
  "browser": {
    "connected": false
  }
}
```

### **Teste 2: Busca via Interface**
1. Abra http://localhost:5173
2. Selecione "Dentista"
3. Digite "Rio de Janeiro, RJ"
4. Clique em "Buscar"
5. Aguarde 30-90 segundos
6. Veja os resultados!

### **Teste 3: Busca via API (Postman/curl)**
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "profissao": "Dentista",
    "local": "Rio de Janeiro, RJ",
    "maxResults": 10
  }'
```

---

## 🛑 Parar os Servidores

### **Linux/Mac:**
```bash
./stop-local.sh
# ou pressione Ctrl+C no terminal
```

### **Windows:**
```cmd
Feche as janelas do cmd
```