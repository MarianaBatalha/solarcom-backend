require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`☀ SolarCom API rodando na porta ${PORT}`);
});