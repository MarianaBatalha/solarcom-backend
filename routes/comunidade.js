const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const autenticar = require('../middleware/auth');

// GET /comunidade
router.get('/', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome, created_at')
      .eq('ativo', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Retorna s� nome e meses (sem dados sens�veis)
    const vizinhos = data.map(u => ({
      id: u.id,
      nome: u.nome,
      mesesAtivo: Math.floor(
        (Date.now() - new Date(u.created_at)) / (1000 * 60 * 60 * 24 * 30)
      ) + 1
    }));

    res.json({
      vizinhos,
      total: vizinhos.length,
      vagasDisponiveis: 50 - vizinhos.length
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
