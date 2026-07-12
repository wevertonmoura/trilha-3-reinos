import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://revyeudqlndidaiprabc.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método inválido');
  
  const { senha, id } = req.body;

  // Aceita a senha segura (recomendado) ou a atual com VITE_ para não quebrar nada
  const senhaValida = process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN;
  if (senha !== senhaValida) return res.status(401).json({ error: 'Acesso negado' });

  // Proteção: Evita chamar o banco se o ID não tiver sido enviado
  if (!id) return res.status(400).json({ error: 'ID do participante não fornecido.' });

  // Executa a exclusão na tabela principal do evento
  const { error } = await supabase.from('inscricao_trilha').delete().eq('id', id);
  if (error) return res.status(400).json({ error: error.message });
  
  return res.status(200).json({ success: true });
}