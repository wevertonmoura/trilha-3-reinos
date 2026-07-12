import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://revyeudqlndidaiprabc.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const { nome, telefone } = req.body;
  if (!nome || !telefone) return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });

  // Insere na tabela lista_espera usando a sintaxe do Supabase
  const { error } = await supabase.from('lista_espera').insert([{ nome, telefone }]);
  
  if (error) {
    console.error('Erro Supabase:', error);
    return res.status(500).json({ error: 'Erro ao salvar na lista de espera.' });
  }

  return res.status(200).json({ success: true, message: 'Cadastrado na lista VIP com sucesso!' });
}