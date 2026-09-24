require('dotenv').config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.JWT_SECRET) {
  console.error('❌ ERRO FATAL: Variáveis de ambiente obrigatórias não configuradas!');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security headers
app.use(helmet());

// CORS — only allow the production frontend
const ALLOWED_ORIGINS = [
  'https://solarcom.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origem não permitida'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

// Body limit to prevent oversized payloads
app.use(express.json({ limit: '10kb' }));

// General rate limiter — 100 requests per 15 minutes per IP
const limiterGeral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use(limiterGeral);

// Stricter limiter for auth routes — 10 attempts per 15 minutes per IP
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuario');
const creditosRoutes = require('./routes/creditos');
const fazendaRoutes = require('./routes/fazenda');
const comunidadeRoutes = require('./routes/comunidade');
const adminRoutes = require('./routes/admin');

app.use('/auth', limiterAuth, authRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/creditos', creditosRoutes);
app.use('/fazenda', fazendaRoutes);
app.use('/comunidade', comunidadeRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.json({ mensagem: '☀ SolarCom API funcionando!', status: 'online' });
});

// Health check — faz uma query real no Supabase para evitar pausa por inatividade
app.get('/health', async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    const { count, error } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ status: 'ok', db: 'online', usuarios: count, ts: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'erro', detalhe: e.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`☀ SolarCom API rodando na porta ${PORT}`);
});
