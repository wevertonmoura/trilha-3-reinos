import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está definida nas variáveis de ambiente da Vercel.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  
  try {
    const { senha } = req.body;
    const senhaCorreta = process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN;

    if (!senhaCorreta || senha !== senhaCorreta) {
      console.error("Acesso bloqueado: Senha digitada não confere.");
      return res.status(401).json({ error: 'Acesso negado' });
    }

    console.log("Acesso liberado. Buscando trilheiros na tabela inscricao_trilha...");

    // 🛡️ CORREÇÃO DEFENSIVA: Busca todos os campos ordenando por created_at (padrão)
    const { data, error } = await supabase
      .from('inscricao_trilha')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro interno do Supabase:", error.message);
      return res.status(400).json({ error: error.message });
    }
    
    // Mapeamento duplo para blindar contra qualquer nome de coluna que esteja no banco
    const dadosFormatados = (data || []).map(item => ({
      ...item,
      created_at: item.created_at || item.criado_em 
    }));

    console.log(`Busca concluída! ${dadosFormatados.length} registros enviados para o painel.`);
    return res.status(200).json(dadosFormatados);

  } catch (err) {
    console.error("Erro no servidor da Vercel:", err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}