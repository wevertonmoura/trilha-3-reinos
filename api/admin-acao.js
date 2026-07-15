// api/admin-acao.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || '');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  try {
    // Puxamos a "acao" que o front-end quer executar: 'excluir', 'aprovar' ou 'editar'
    const { acao, senha, id, nome, telefone, email, cpf, contato_emergencia, valor } = req.body;
    const senhaCorreta = (process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN || '').trim();

    if (!senhaCorreta || senha !== senhaCorreta) {
      return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
    }

    if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

    // === AÇÃO 1: EXCLUIR ===
    if (acao === 'excluir') {
      const { error } = await supabase.from('inscricao_trilha').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Excluído com sucesso!' });
    }

    // === AÇÃO 2: APROVAR PAGAMENTO ===
    if (acao === 'aprovar') {
      const { error } = await supabase.from('inscricao_trilha').update({ pago: true }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Aprovado com sucesso!' });
    }

    // === AÇÃO 3: EDITAR DADOS ===
    if (acao === 'editar') {
      const dadosAtualizados = {
        nome: nome?.trim(),
        telefone: telefone?.replace(/\D/g, ''),
        email: email?.trim() || null,
        cpf: cpf?.replace(/\D/g, '') || null,
        contato_emergencia: contato_emergencia?.trim() || null,
        valor: valor ? Number(valor) : 55
      };
      const { error } = await supabase.from('inscricao_trilha').update(dadosAtualizados).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true, message: 'Editado com sucesso!' });
    }

    return res.status(400).json({ error: 'Ação desconhecida ou não informada.' });

  } catch (err) {
    console.error("[ERRO ADMIN AÇÃO]:", err);
    return res.status(500).json({ error: err.message || 'Erro interno no servidor.' });
  }
}