import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 🛡️ LIBERAÇÃO DE CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const { nome, telefone } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });

  try {
    // 🛡️ CORREÇÃO DE BUG: Apontando para lista_espera_trilha e limpando o telefone
    const { error } = await supabase.from('lista_espera_trilha').insert([{ 
      nome: nome.trim(), 
      telefone: String(telefone).replace(/\D/g, '') 
    }]);
    
    if (error) {
      console.error('Erro Supabase Lista VIP:', error);
      return res.status(500).json({ error: 'Erro ao salvar na lista de espera.' });
    }

    return res.status(200).json({ success: true, message: 'Cadastrado na lista VIP com sucesso!' });
  } catch (err) {
    console.error('Erro fatal Lista VIP:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar na lista de espera.' });
  }
}