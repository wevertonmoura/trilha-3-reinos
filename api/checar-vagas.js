import { createClient } from '@supabase/supabase-js';

// Lê da variável segura do servidor ou aceita a com VITE_ como fallback
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Proteção contra falha de configuração na Vercel
if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está definida nas variáveis de ambiente.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 1. Liberação de CORS e Bloqueio Estrito de Cache
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 🚫 IMPEDE CACHE: Garante que o navegador/CDN sempre busque o número real em tempo real no banco!
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Garante que aceita apenas requisições válidas de leitura
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // 3. 🏆 Consulta ultrarrápida: Conta apenas o cabeçalho das linhas com pago = true
    const { count, error } = await supabase
      .from('inscricao_trilha')
      .select('*', { count: 'exact', head: true })
      .eq('pago', true);

    if (error) {
      console.error("[SUPABASE ERRO] Falha ao contar vagas ocupadas:", error.message);
      throw error;
    }

    const vagasOcupadas = count || 0;
    console.log(`[VAGAS] Checagem em tempo real: ${vagasOcupadas} vaga(s) confirmada(s) no momento.`);

    // 4. Retorna o total para o front-end liberar ou alternar automaticamente para a Lista VIP
    return res.status(200).json({ total: vagasOcupadas });

  } catch (error) {
    console.error("[ERRO FATAL SERVIDOR] Erro ao buscar vagas:", error);
    return res.status(500).json({ error: 'Erro interno ao buscar a quantidade de vagas disponíveis.' });
  }
}