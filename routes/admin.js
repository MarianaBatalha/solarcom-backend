const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const adminAuth = require('../middleware/adminAuth');

// Listar todos os usuários (exceto o próprio admin)
router.get('/usuarios', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, email, telefone, distribuidora, codigo_cliente, role, status, created_at')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ usuarios: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Aprovar usuário
router.put('/usuarios/:id/aprovar', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ status: 'ativo', ativo: true })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Usuário aprovado com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Bloquear/rejeitar usuário
router.put('/usuarios/:id/bloquear', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ status: 'bloqueado', ativo: false })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Usuário bloqueado!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Excluir usuário
router.delete('/usuarios/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Usuário excluído com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Redefinir senha do usuário
router.put('/usuarios/:id/senha', adminAuth, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    const { error } = await supabase
      .from('usuarios')
      .update({ senha: senhaHash })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Alterar role do usuário (admin <-> cliente)
router.put('/usuarios/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'cliente'].includes(role)) {
      return res.status(400).json({ erro: 'Role inválido. Use admin ou cliente.' });
    }
    const { error } = await supabase
      .from('usuarios')
      .update({ role })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: `Usuário agora é ${role}!` });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
