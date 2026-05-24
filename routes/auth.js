const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

router.post('/cadastro', async (req, res) => {
  try {
    const { nome, cpf, email, senha, telefone, endereco, distribuidora, codigo_cliente, conta_antes } = req.body;
    if (!nome || !cpf || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, CPF, email e senha são obrigatórios' });
    }
    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) {
      return res.status(400).json({ erro: 'CPF inválido' });
    }
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }
    const senhaHash = await bcrypt.hash(senha, 10);
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nome, cpf: cpfLimpo, email, senha: senhaHash, telefone, endereco, distribuidora, codigo_cliente, conta_antes: conta_antes || 200, modelo: 'fixo', assinatura: 79, ativo: true }])
      .select().single();
    if (error) throw error;
    const token = jwt.sign({ id: data.id, cpf: data.cpf }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ mensagem: 'Cadastro realizado!', token, usuario: { id: data.id, nome: data.nome, email: data.email } });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ erro: 'CPF ou e-mail já cadastrado' });
    }
    res.status(500).json({ erro: error.message });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { cpf, senha } = req.body;
    if (!cpf || !senha) return res.status(400).json({ erro: 'CPF e senha obrigatórios' });
    const cpfLimpo = cpf.replace(/\D/g, '');
    const { data: usuario, error } = await supabase.from('usuarios').select('*').eq('cpf', cpfLimpo).single();
    if (error || !usuario) return res.status(401).json({ erro: 'CPF ou senha incorretos' });
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) return res.status(401).json({ erro: 'CPF ou senha incorretos' });
    const token = jwt.sign({ id: usuario.id, cpf: usuario.cpf }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ mensagem: 'Login realizado!', token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, modelo: usuario.modelo } });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
