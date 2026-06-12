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

// Excluir usuário (apaga créditos primeiro para não violar foreign key)
router.delete('/usuarios/:id', adminAuth, async (req, res) => {
  try {
    // 1. Remove créditos do usuário
    const { error: erroCred } = await supabase
      .from('creditos')
      .delete()
      .eq('usuario_id', req.params.id);
    if (erroCred) throw erroCred;

    // 2. Remove o usuário
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

// Listar usuários ativos para distribuição de créditos
router.get('/creditos/usuarios-ativos', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, cpf, modelo, assinatura, conta_antes')
      .eq('status', 'ativo')
      .neq('role', 'admin')
      .order('nome');
    if (error) throw error;
    res.json({ usuarios: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Distribuir créditos para usuários selecionados
router.post('/creditos/distribuir', adminAuth, async (req, res) => {
  try {
    const { creditoValor, usuarioIds, mes } = req.body;

    if (!creditoValor || isNaN(creditoValor) || Number(creditoValor) <= 0) {
      return res.status(400).json({ erro: 'Valor de crédito inválido' });
    }
    if (!usuarioIds || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
      return res.status(400).json({ erro: 'Selecione ao menos um usuário' });
    }

    const valor = Number(creditoValor);
    // mes é DATE no banco (YYYY-MM-DD). Usa o recebido ou o 1º dia do mês atual
    const agora = new Date();
    const mesData = mes || `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;

    const registros = usuarioIds.map(id => ({
      usuario_id: id,
      credito_valor: valor,
      mes: mesData,
    }));

    const { data, error } = await supabase
      .from('creditos')
      .insert(registros)
      .select();

    if (error) throw error;

    res.json({
      mensagem: `Crédito de R$ ${valor} distribuído para ${usuarioIds.length} usuário(s)!`,
      total: usuarioIds.length,
      registros: data,
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Listar todos os créditos distribuídos (com nome do usuário)
router.get('/creditos', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .select('id, credito_valor, mes, created_at, usuario_id, usuarios(nome, cpf, modelo, assinatura)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ creditos: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Remover um crédito específico
router.delete('/creditos/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('creditos')
      .delete()
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ mensagem: 'Crédito removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
