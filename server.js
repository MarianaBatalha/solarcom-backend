require('dotenv').config();

// Verificação de variáveis obrigatórias
console.log('🔍 Verificando variáveis de ambiente...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ OK' : '❌ NÃO DEFINIDA');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅ OK' : '❌ NÃO DEFINIDA');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ OK' : '❌ NÃO DEFINIDA');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.JWT_SECRET) {
  console.error('❌ ERRO FATAL: Variáveis de ambiente obrigatórias não configuradas!');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

console.log('Carregando rotas...');
const authRoutes = require('./routes/auth');
console.log('auth OK');
const usuarioRoutes = require('./routes/usuario');
console.log('usuario OK');
const creditosRoutes = require('./routes/creditos');
console.log('creditos OK');
const fazendaRoutes = require('./routes/fazenda');
console.log('fazenda OK');
const comunidadeRoutes = require('./routes/comunidade');
console.log('comunidade OK');

app.use('/auth', authRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/creditos', creditosRoutes);
app.use('/fazenda', fazendaRoutes);
app.use('/comunidade', comunidadeRoutes);

app.get('/', (req, res) => {
  res.json({ mensagem: '☀ SolarCom API funcionando!', status: 'online' });
});

app.get('/debug/supabase', async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    const { data, error } = await supabase.from('fazendas').select('id').limit(1);
    res.json({
      supabase_url: process.env.SUPABASE_URL,
      erro: error ? error.message : null,
      data: data,
    });
  } catch (e) {
    res.json({ supabase_url: process.env.SUPABASE_URL, excecao: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`☀ SolarCom API rodando na porta ${PORT}`);
});