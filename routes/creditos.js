const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const autenticar = require('../middleware/auth');

// GET /creditos
router.get('/', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('creditos')
      .select('*')
      .eq('usuario_id', req.usuarioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ creditos: data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /creditos/mes-atual
router.get('/mes-atual', autenticar, async (req, res) => {
  try {
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('conta_antes, assinatura, modelo')
      .eq('id', req.usuarioId)
      .single();

    if (erroUsuario || !usuario) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const { data, error } = await supabase
      .from('creditos')
      .select('*')
      .eq('usuario_id', req.usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({
        credito: null,
        economiaLiquida: 0,
        contaAntes: usuario.conta_antes,
        contaDepois: usuario.conta_antes,
      });
    }

    let economiaLiquida;
    if (usuario.modelo === 'percentual') {
      economiaLiquida = data.credito_valor * 0.7;
    } else {
      economiaLiquida = data.credito_valor - usuario.assinatura;
    }

    res.json({
      credito: data,
      economiaLiquida,
      contaAntes: usuario.conta_antes,
      contaDepois: usuario.conta_antes - data.credito_valor + usuario.assinatura,
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
