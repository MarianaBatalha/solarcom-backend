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
const adminRoutes = require('./routes/admin');
console.log('admin OK');

app.use('/auth', authRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/creditos', creditosRoutes);
app.use('/fazenda', fazendaRoutes);
app.use('/comunidade', comunidadeRoutes);
app.use('/admin', adminRoutes);

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

app.get('/debug/creditos-schema', async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    const adminId = 'd2755055-ac40-414b-8dd1-e9bbd8c483b6';
    // Tenta formato DATE
    const { data: d1, error: e1 } = await supabase
      .from('creditos').insert([{ usuario_id: adminId, credito_valor: 1, mes: '2026-06-01' }]).select();
    if (!e1) {
      await supabase.from('creditos').delete().eq('id', d1[0].id);
      return res.json({ formato_funcionou: 'DATE: 2026-06-01' });
    }
    // Tenta formato texto
    const { data: d2, error: e2 } = await supabase
      .from('creditos').insert([{ usuario_id: adminId, credito_valor: 1, mes: 'Junho/2026' }]).select();
    if (!e2) {
      await supabase.from('creditos').delete().eq('id', d2[0].id);
      return res.json({ formato_funcionou: 'TEXT: Junho/2026' });
    }
    // Tenta formato numérico (mês como número)
    const { data: d3, error: e3 } = await supabase
      .from('creditos').insert([{ usuario_id: adminId, credito_valor: 1, mes: 6 }]).select();
    if (!e3) {
      await supabase.from('creditos').delete().eq('id', d3[0].id);
      return res.json({ formato_funcionou: 'INTEGER: 6' });
    }
    res.json({ erro_date: e1.message, erro_text: e2.message, erro_int: e3.message });
  } catch (e) {
    res.json({ excecao: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`☀ SolarCom API rodando na porta ${PORT}`);
});