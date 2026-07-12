import { createClient } from '@supabase/supabase-js';

// Lê da variável segura do servidor (sem VITE_) ou aceita a antiga por compatibilidade
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Prevenção contra queda do servidor caso a chave não esteja configurada na Vercel
if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está definida nas variáveis de ambiente da Vercel.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // Prevenção de bloqueio de CORS na Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }
  
  try {
    const { senha } = req.body;
    
    // 🛡️ SEGURANÇA: Lê apenas das variáveis de ambiente da Vercel (Nunca escreva a senha em texto puro aqui!)
    const senhaCorreta = process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN;

    if (!senhaCorreta || senha !== senhaCorreta) {
      console.error("Acesso bloqueado: Senha digitada não confere ou não está configurada no servidor.");
      return res.status(401).json({ error: 'Acesso negado' });
    }

    console.log("Acesso liberado. Buscando invasores na tabela inscricao_trilha...");

    // Busca os dados ordenando pela coluna real do banco (criado_em)
    const { data, error } = await supabase
      .from('inscricao_trilha')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error("Erro interno do Supabase:", error.message);
      return res.status(400).json({ error: error.message });
    }
    
    // 🔄 TRUQUE SÊNIOR: Adapta o nome da coluna para que a tabela do front-end leia a data sem dar erro
    const dadosFormatados = (data || []).map(item => ({
      ...item,
      created_at: item.criado_em // Cria um espelho da data para compatibilidade visual
    }));

    console.log(`Busca concluída! ${dadosFormatados.length} registros enviados para o painel.`);
    return res.status(200).json(dadosFormatados);

  } catch (err) {
    console.error("Erro no servidor da Vercel:", err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}