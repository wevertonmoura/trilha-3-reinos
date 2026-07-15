import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está definida nas variáveis de ambiente da Vercel.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 1. Liberação completa de CORS para o navegador não bloquear a resposta
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  
  try {
    // 2. 🛡️ LEITURA DEFENSIVA DO BODY: Evita quebrar se o JSON vier como texto ou vazio
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const senhaDigitada = (body.senha || '').trim(); // .trim() remove espaços acidentais
    
    // 3. 🛡️ LIMPEZA DE SENHA: Puxa a variável da Vercel e remove espaços extras
    const senhaCorreta = (process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN || '').trim();

    if (!senhaCorreta || senhaDigitada !== senhaCorreta) {
      console.warn("⚠️ Acesso bloqueado: Senha digitada não confere com a variável da Vercel.");
      return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
    }

    console.log("🔓 Acesso liberado! Buscando inscritos no banco de dados...");

    // 4. 🏆 BUSCA 100% BLINDADA: Removemos o .order() do SQL!
    // Isso garante que o Supabase NUNCA dê Erro 500 se a coluna se chamar criado_em ou created_at
    const { data, error } = await supabase
      .from('inscricao_trilha')
      .select('*');

    if (error) {
      console.error("❌ Erro interno do Supabase:", error.message);
      return res.status(400).json({ error: `Erro no banco: ${error.message}` });
    }
    
    // 5. Mapeia a data independentemente do nome que estiver na coluna do banco
    const dadosFormatados = (data || []).map(item => ({
      ...item,
      created_at: item.created_at || item.criado_em || new Date().toISOString()
    }));

    // 6. Ordena os inscritos do mais recente para o mais antigo aqui pelo Javascript (Segurança Máxima)
    dadosFormatados.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`✅ Sucesso! ${dadosFormatados.length} registros enviados para o painel.`);
    return res.status(200).json(dadosFormatados);

  } catch (err) {
    console.error("❌ Erro fatal no servidor da Vercel:", err);
    return res.status(500).json({ error: 'Erro interno no servidor', detalhes: err.message });
  }
}