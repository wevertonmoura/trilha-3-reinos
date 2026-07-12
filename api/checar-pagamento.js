// api/checar-pagamento.js

export default async function handler(req, res) {
  // 1. Liberação de CORS (Essencial para o pooling de 3 em 3 segundos no navegador)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { paymentId } = req.query;

  // 2. Validação básica de entrada
  if (!paymentId) {
    return res.status(400).json({ error: 'ID do pagamento não fornecido.' });
  }

  // 3. Proteção: Verifica se o token está configurado no painel da Vercel
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("ERRO CRÍTICO: MP_ACCESS_TOKEN não configurado no Vercel.");
    return res.status(500).json({ error: 'Erro de configuração no servidor de pagamentos.' });
  }

  try {
    // 4. Consulta oficial na API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();

    // 5. Se o Mercado Pago retornar um erro (ex: 404 de ID não encontrado)
    if (!response.ok) {
      console.error(`Erro ao consultar MP [${response.status}]:`, data);
      return res.status(response.status).json({ 
        error: 'Não foi possível verificar o pagamento no Mercado Pago.',
        details: data.message || 'Erro desconhecido.'
      });
    }

    // 6. 🏆 OTIMIZAÇÃO SÊNIOR: Devolvemos um objeto limpo e leve apenas com o que importa
    return res.status(200).json({
      id: data.id,
      status: data.status, // É esse 'approved' que o seu front-end está esperando!
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount
    });
    
  } catch (error) {
    console.error("Erro interno no servidor ao verificar pagamento:", error);
    return res.status(500).json({ error: 'Erro interno ao consultar o Mercado Pago.' });
  }
}