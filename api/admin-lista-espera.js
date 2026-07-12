import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://revyeudqlndidaiprabc.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });

  const { senha } = req.body;
  // Lembre-se de remover o VITE_ por segurança:
  if (senha !== process.env.VITE_SENHA_ADMIN && senha !== process.env.SENHA_ADMIN) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  // Busca os dados no Supabase e ordena pelos mais recentes
  const { data, error } = await supabase
    .from('lista_espera')
    .select('id, nome, telefone, criado_em')
    .order('criado_em', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Mapeia o campo 'criado_em' para 'created_at' para o React ler perfeitamente
  const dadosFormatados = (data || []).map(item => ({
    ...item,
    created_at: item.criado_em
  }));

  return res.status(200).json(dadosFormatados);
}