import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://revyeudqlndidaiprabc.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const { senha, id } = req.body;
  if (senha !== process.env.VITE_SENHA_ADMIN && senha !== process.env.SENHA_ADMIN) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (!id) return res.status(400).json({ error: 'ID não fornecido.' });

  // Deleta o registro no Supabase pelo ID
  const { error } = await supabase.from('lista_espera').delete().eq('id', id);
  
  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ success: true });
}