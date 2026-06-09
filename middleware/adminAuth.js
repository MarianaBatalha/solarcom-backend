const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, role')
      .eq('id', decoded.id)
      .single();
    if (error || !data) return res.status(401).json({ erro: 'Usuário não encontrado' });
    if (data.role !== 'admin') return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
    req.usuarioId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
};
