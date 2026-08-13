// Executa: node scripts/criar-demo.js
// Cria ou redefine o usuário de demonstração no banco

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  const senhaHash = await bcrypt.hash('demo123', 10);

  const demoUser = {
    nome: 'Maria Oliveira',
    cpf: '52998224725',
    email: 'demo@solarcom.com.br',
    senha: senhaHash,
    telefone: '(11) 99999-0001',
    endereco: 'Rua das Acácias, 142 — São Paulo, SP',
    distribuidora: 'Enel SP',
    codigo_cliente: 'ENL-00042',
    conta_antes: 240,
    modelo: 'fixo',
    assinatura: 79,
    ativo: true,
    status: 'ativo',
    role: 'cliente',
  };

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('cpf', '52998224725')
    .maybeSingle();

  if (existente) {
    const { error } = await supabase
      .from('usuarios')
      .update({ senha: senhaHash, ativo: true, status: 'ativo' })
      .eq('cpf', '52998224725');
    console.log(error ? `Erro ao atualizar: ${error.message}` : '✅ Usuário demo atualizado com senha demo123');
  } else {
    const { error } = await supabase.from('usuarios').insert([demoUser]);
    console.log(error ? `Erro ao criar: ${error.message}` : '✅ Usuário demo criado: CPF 529.982.247-25 / senha demo123');
  }

  // Adiciona créditos de demonstração se não tiver
  const { data: usuario } = await supabase
    .from('usuarios').select('id').eq('cpf', '52998224725').maybeSingle();

  if (usuario) {
    const { data: creditosExist } = await supabase
      .from('creditos').select('id').eq('usuario_id', usuario.id).limit(1);

    if (!creditosExist || creditosExist.length === 0) {
      const creditos = [3, 2, 1, 0].map(mesesAtras => {
        const data = new Date();
        data.setMonth(data.getMonth() - mesesAtras);
        return {
          usuario_id: usuario.id,
          credito_valor: 180 + Math.round(Math.random() * 60),
          mes: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`,
        };
      });
      const { error } = await supabase.from('creditos').insert(creditos);
      console.log(error ? `Erro ao criar créditos: ${error.message}` : '✅ Créditos demo criados (últimos 4 meses)');
    } else {
      console.log('ℹ️  Usuário já possui créditos');
    }
  }
}

main().catch(console.error);
