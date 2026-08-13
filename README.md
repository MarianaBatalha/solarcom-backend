# ☀️ SolarCom — Backend API

API REST para o aplicativo **SolarCom**, plataforma de energia solar compartilhada que permite a moradores de uma comunidade receber créditos de uma fazenda solar diretamente na conta de luz, sem instalar painéis no telhado.

🌐 **App em produção:** [solarcom.vercel.app](https://solarcom.vercel.app)

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express.js |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | JWT (jsonwebtoken) + bcrypt |
| Deploy | Railway (CI/CD automático via GitHub) |
| Frontend | React Native + Expo Web → Vercel |

---

## Funcionalidades

### Autenticação
- `POST /auth/cadastro` — Registro com validação de CPF (algoritmo dígito verificador) e bcrypt hash de senha
- `POST /auth/login` — Login com rate limiting (10 req/15min), geração de JWT 24h

### Área do Cliente
- `GET /creditos` — Histórico de créditos solares aplicados
- `GET /creditos/mes-atual` — Crédito do mês com cálculo de economia líquida (plano fixo ou percentual)
- `GET /usuario/perfil` — Dados do perfil autenticado
- `PUT /usuario/perfil` — Edição de dados pessoais
- `PUT /usuario/senha` — Alteração de senha com verificação da senha atual
- `GET /fazenda` — Dados técnicos da fazenda solar (capacidade, geração, impacto CO₂)
- `GET /comunidade` — Lista de vizinhos ativos na comunidade (sem dados sensíveis)

### Painel Admin
- `GET /admin/usuarios/pendentes` — Aprovação de novos cadastros
- `GET /admin/usuarios/todos` — Listagem completa de usuários
- `PATCH /admin/usuarios/:id/status` — Aprovar, bloquear ou alterar role
- `PUT /admin/usuarios/:id/senha` — Redefinição de senha de qualquer usuário
- `DELETE /admin/usuarios/:id` — Exclusão de usuário (remove créditos antes, por FK constraint)
- `GET /admin/creditos` — Histórico completo de distribuições
- `POST /admin/creditos/distribuir` — Distribuição em lote para múltiplos usuários
- `DELETE /admin/creditos/:id` — Estorno de crédito

---

## Modelo de Negócio

O sistema suporta dois planos de crédito:

**Plano Fixo (padrão)**
```
economia_liquida = credito_gerado - assinatura_mensal
ex: R$200 (crédito) - R$79 (assinatura) = R$121 de economia
```

**Plano Percentual**
```
economia_liquida = credito_gerado × (1 - percentual_solarcom)
ex: R$200 × 0.70 = R$140 de economia
```

---

## Segurança

- Senhas com **bcrypt** (salt rounds: 10)
- JWT com expiração de 24h e segredo via variável de ambiente
- **Rate limiting** no endpoint de login (previne força bruta)
- Chave `service_role` do Supabase apenas no servidor — nunca exposta ao cliente
- Validação de CPF via algoritmo de dígitos verificadores no cadastro
- Middleware de autenticação em todas as rotas protegidas
- `.env` no `.gitignore` — credenciais apenas no Railway

---

## Estrutura

```
solarcom-backend/
├── config/
│   └── supabase.js         # cliente Supabase com service_role key
├── middleware/
│   └── auth.js             # middleware JWT — extrai req.usuarioId
├── routes/
│   ├── auth.js             # /auth/cadastro, /auth/login
│   ├── creditos.js         # /creditos, /creditos/mes-atual
│   ├── usuario.js          # /usuario/perfil, /usuario/senha
│   ├── fazenda.js          # /fazenda
│   ├── comunidade.js       # /comunidade
│   └── admin.js            # /admin/** (requer role = admin)
├── .env                    # variáveis de ambiente (não versionado)
├── server.js               # entry point + registro das rotas
└── package.json
```

---

## Banco de Dados (Supabase / PostgreSQL)

### Tabela `usuarios`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK gerado pelo Supabase |
| nome | TEXT | Nome completo |
| cpf | TEXT UNIQUE | CPF sem formatação |
| email | TEXT UNIQUE | E-mail |
| senha | TEXT | Hash bcrypt |
| role | TEXT | `cliente` ou `admin` |
| status | TEXT | `pendente`, `ativo`, `bloqueado` |
| ativo | BOOLEAN | Flag de conta ativa |
| modelo | TEXT | `fixo` ou `percentual` |
| assinatura | INTEGER | Valor mensal do plano fixo |
| conta_antes | INTEGER | Valor médio da conta antes do SolarCom |
| distribuidora | TEXT | Ex: "Enel SP" |

### Tabela `creditos`
| Coluna | Tipo | Descrição |
|---|---|---|
| id | UUID | PK |
| usuario_id | UUID | FK → usuarios.id |
| credito_valor | INTEGER | Valor em R$ do crédito gerado |
| mes | DATE | Mês de referência |
| created_at | TIMESTAMP | Data de distribuição |

---

## Rodar localmente

```bash
# Instalar dependências
npm install

# Criar .env com as variáveis necessárias
cp .env.example .env
# Editar .env com SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, PORT

# Iniciar em desenvolvimento
npm run dev

# Iniciar em produção
npm start
```

### Variáveis de Ambiente

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_service_role_key
JWT_SECRET=seu_segredo_jwt_de_pelo_menos_64_chars
PORT=3001
```

---

## Acesso Demo

| Tipo | CPF | Senha |
|---|---|---|
| Cliente | `529.982.247-25` | `demo123` |
| Admin | (solicitar ao desenvolvedor) | — |

---

## Deploy

O backend faz deploy automático no **Railway** a cada push para `main`.
O frontend está em **Vercel** ([solarcom.vercel.app](https://solarcom.vercel.app)).

---

## Desenvolvido por

**Mariana Batalha** — [batalha.mariana.2004@gmail.com](mailto:batalha.mariana.2004@gmail.com)

*Projeto de portfólio — Full Stack Node.js + React Native + Supabase*
