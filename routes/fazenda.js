const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const autenticar = require('../middleware/auth');

// GET /fazenda
router.get('/', autenticar, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('fazendas')
      .select('*')
      .eq('status', 'operacional')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ erro: 'Nenhuma fazenda operacional encontrada' });
    }

    const co2Evitado = (data.capacidade_kwp * 30 * 0.07).toFixed(1);
    const arvoresEquiv = Math.round(co2Evitado / 21);

    res.json({
      fazenda: data,
      impacto: {
        co2Evitado: `${co2Evitado} ton`,
        arvoresEquiv,
        familiasAtendidas: data.max_familias,
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;