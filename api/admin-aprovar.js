import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || '');

export default async function handler(req, res) {
  // 🛡️ LIBERAÇÃO DE CORS (Evita bloqueio da tela do Admin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  
  const { senha, id } = req.body;
  const senhaValida = process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN;
  
  if (!senha || senha !== senhaValida) {
    return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
  }

  if (!id) return res.status(400).json({ error: 'ID do participante é obrigatório.' });

  // 🏆 APROVAÇÃO SILENCIOSA E SEGURA NO BANCO DE DADOS
  const { error } = await supabase.from('inscricao_trilha').update({ pago: true }).eq('id', id);
  
  if (error) {
    console.error("[ERRO ADMIN APROVAR]:", error.message);
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true, message: 'Inscrição aprovada manual com sucesso!' });
}