import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 1. Liberação de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  try {
    const { senha, id, nome, telefone, email, cpf, contato_emergencia, valor } = req.body;
    const senhaCorreta = (process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN || '').trim();

    if (!senhaCorreta || senha !== senhaCorreta) {
      return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
    }

    if (!id) return res.status(400).json({ error: 'ID do participante é obrigatório.' });

    console.log(`[EDITAR] Atualizando registro ID ${id} no Supabase...`);

    // 2. Monta o objeto de atualização apenas com os campos que foram enviados
    const dadosAtualizados = {
      nome: nome?.trim(),
      telefone: telefone?.replace(/\D/g, ''),
      email: email?.trim() || null,
      cpf: cpf?.replace(/\D/g, '') || null,
      contato_emergencia: contato_emergencia?.trim() || null,
      valor: valor ? Number(valor) : 55
    };

    // 3. Executa o UPDATE no Supabase
    const { error } = await supabase
      .from('inscricao_trilha')
      .update(dadosAtualizados)
      .eq('id', id);

    if (error) {
      console.error("[ERRO SUPABASE EDITAR]:", error.message);
      return res.status(400).json({ error: error.message });
    }

    console.log(`[SUCESSO] Participante ID ${id} editado com sucesso!`);
    return res.status(200).json({ success: true, message: 'Dados atualizados com sucesso!' });

  } catch (err) {
    console.error("[ERRO FATAL EDITAR]:", err);
    return res.status(500).json({ error: 'Erro interno ao editar participante.' });
  }
}