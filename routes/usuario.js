const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const autenticar = require('../middleware/auth');

router.get('/perfil', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, email, telefone, endereco, distribuidora, codigo_cliente, conta_antes, modelo, assinatura, ativo, role, status, created_at')
      .eq('id', req.usuarioId)
      .single();
    if (error) throw error;
    res.json({ usuario: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

router.put('/perfil', autenticar, async (req, res) => {
  try {
    const { nome, telefone, endereco, distribuidora, codigo_cliente } = req.body;
    const { data, error } = await supabase
      .from('usuarios')
      .update({ nome, telefone, endereco, distribuidora, codigo_cliente })
      .eq('id', req.usuarioId)
      .select('id, nome, cpf, email, telefone, endereco, distribuidora, codigo_cliente, conta_antes, modelo, assinatura, ativo, role, status, created_at')
      .single();
    if (error) throw error;
    res.json({ mensagem: 'Perfil atualizado!', usuario: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

router.put('/senha', autenticar, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias' });
    }
    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: 'Nova senha deve ter pelo menos 6 caracteres' });
    }
    const { data: usuario, error } = await supabase
      .from('usuarios').select('senha').eq('id', req.usuarioId).single();
    if (error) throw error;
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaCorreta) return res.status(401).json({ erro: 'Senha atual incorreta' });
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const { error: erroUpdate } = await supabase
      .from('usuarios').update({ senha: senhaHash }).eq('id', req.usuarioId);
    if (erroUpdate) throw erroUpdate;
    res.json({ mensagem: 'Senha alterada com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
