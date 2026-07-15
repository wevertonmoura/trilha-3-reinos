import { createClient } from '@supabase/supabase-js';

// Lê da variável segura do servidor ou aceita a com VITE_ como fallback
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está configurada no servidor.");
}

// Instância segura do Supabase
const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 1. Liberação de CORS (Essencial para o front-end conseguir chamar sem bloqueios do navegador)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  // 2. 🛡️ VALIDAÇÃO DEFENSIVA: Evita o crash do servidor se o front-end mandar dados vazios
  if (!participantes || !Array.isArray(participantes) || participantes.length === 0) {
    return res.status(400).json({ error: 'Lista de participantes inválida ou vazia.' });
  }

  if (!valorTotal || Number(valorTotal) <= 0 || isNaN(Number(valorTotal))) {
    return res.status(400).json({ error: 'Valor total inválido para a transação.' });
  }

  // Validação básica do formato de e-mail exigido pelo Mercado Pago
  const emailLimpo = (emailPrincipal || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLimpo)) {
    return res.status(400).json({ error: 'O e-mail principal fornecido é inválido.' });
  }

  try {
    const titular = participantes[0];
    const cpfTitular = titular.cpf ? String(titular.cpf).replace(/\D/g, '') : '';
    const telefoneTitular = titular.phone ? String(titular.phone).replace(/\D/g, '') : '';
    
    if (cpfTitular.length !== 11) {
      return res.status(400).json({ error: 'CPF do titular com formato inválido para o Mercado Pago.' });
    }

    // 🛡️ CORREÇÃO INTELIGENTE DA URL: Descobre o domínio automaticamente para evitar Erro 400
    const hostAtual = req.headers['x-forwarded-host'] || req.headers['host'] || 'vemparatrilha.vercel.app';
    const protocolo = hostAtual.includes('localhost') ? 'http' : 'https';
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${protocolo}://${hostAtual}/api/webhook`;
    const siteUrl = `${protocolo}://${hostAtual}`;

    // ID único do pedido que ligará o Supabase ao Mercado Pago
    const idPedido = `trilha-${Date.now()}-${cpfTitular.slice(-4)}`;

    const payerName = (titular.name || 'Participante Trilha').trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Trilheiro";
    
    console.log(`[CHECKOUT] Gerando pagamento (PIX/Cartão) de R$ ${Number(valorTotal).toFixed(2)} para ${firstName}...`);

    // === 1. CRIAMOS A PREFERÊNCIA DO CHECKOUT PRO NO MERCADO PAGO ===
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: "Inscrição Trilha 3 Reinos",
            description: `Ingresso(s) para ${participantes.length} participante(s) - 23 de Agosto`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(valorTotal)
          }
        ],
        payer: {
          name: firstName,
          surname: lastName,
          email: emailLimpo,
          identification: { type: 'CPF', number: cpfTitular }
        },
        // 🚫 O SEGREDO SÊNIOR: BLOQUEIA BOLETOS E LOTÉRICAS, LIBERA SÓ PIX E CARTÃO!
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" }, // Bloqueia Boleto Bancário
            { id: "atm" }     // Bloqueia Pagamento em Lotérica/Caixa Eletrônico
          ],
          installments: 12    // Libera parcelamento no Cartão de Crédito em até 12x
        },
        external_reference: idPedido, 
        notification_url: webhookUrl,
        back_urls: {
          success: `${siteUrl}/?status=sucesso`,
          failure: `${siteUrl}/?status=erro`,
          pending: `${siteUrl}/?status=pendente`
        },
        auto_return: "approved"
      })
    });

    const mpData = await response.json();

    if (!response.ok || !mpData.id) {
      const msgErro = mpData.message || mpData.error || 'Falha ao gerar o Checkout no Mercado Pago.';
      console.error("[MP ERRO]", JSON.stringify(mpData));
      return res.status(response.status || 400).json({ error: 'Erro no provedor de pagamento.', details: msgErro });
    }

    console.log(`[MP SUCESSO] Link gerado: ${mpData.init_point}. Gravando no Supabase...`);

    // === 2. SALVAMOS NO BANCO ATRELANDO AO ID DO PEDIDO ===
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? String(p.cpf).replace(/\D/g, '') : null;
      const telefoneLimpo = p.phone ? String(p.phone).replace(/\D/g, '') : telefoneTitular;
      
      return {
        nome: (p.name || 'Sem Nome').trim(),
        email: index === 0 ? emailLimpo : ((p.email || emailLimpo).trim()),
        telefone: index === 0 ? telefoneTitular : telefoneLimpo,
        cpf: index === 0 ? cpfLimpo : null,
        contato_emergencia: (contatoEmergencia || '').trim() || null,
        pago: false,
        payment_id: idPedido // 🏆 Salvamos nosso ID único para o Webhook aprovar depois!
      };
    });

    const { error: erroInsert } = await supabase.from('inscricao_trilha').insert(dadosParaSalvar);
    
    if (erroInsert) {
      console.error("[SUPABASE ERRO] Falha ao salvar inscritos:", erroInsert);
      throw new Error(`Erro ao registrar no banco de dados: ${erroInsert.message}`);
    }

    console.log(`[BANCO SUCESSO] ${dadosParaSalvar.length} participante(s) gravado(s)!`);

    // === 3. DEVOLVEMOS A URL DO CHECKOUT PARA O FRONT-END ===
    // Retornamos o init_point (link da tela de pagamento do Mercado Pago)
    return res.status(200).json({
      url_pagamento: mpData.init_point,
      preference_id: mpData.id,
      idPedido: idPedido
    });

  } catch (error) {
    console.error("[ERRO FATAL SERVIDOR]:", error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}