import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  try {
    // === 1. A TRAVA MESTRA (LIMPANDO PELO TELEFONE) ===
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');

    await supabase
      .from('inscricao_trilha')
      .delete()
      .eq('telefone', telefoneTitular)
      .eq('pago', false);

    // === 2. SALVAMENTO NO BANCO (BULK INSERT) ===
    // Montamos um "pacote" com todos os participantes e salvamos de uma vez só!
    const dadosParaSalvar = participantes.map((p, index) => ({
      nome: p.name,
      email: index === 0 ? emailPrincipal : (p.email || emailPrincipal),
      telefone: telefoneTitular, // Amarramos todos ao telefone do titular
      cpf: p.cpf ? p.cpf.replace(/\D/g, '') : null, // O acompanhante envia nulo e o banco aceita
      contato_emergencia: contatoEmergencia,
      pago: false
    }));

    // Inserção em lote (o Supabase aceita um Array com vários objetos)
    const { error: erroInsert } = await supabase.from('inscricao_trilha').insert(dadosParaSalvar);
    
    // Se o banco chiar, agora ele vai te dizer exatamente o motivo na tela!
    if (erroInsert) {
      console.error("Erro do Supabase:", erroInsert);
      throw new Error(`Erro do Banco de Dados: ${erroInsert.message}`);
    }

    // === 3. GERAÇÃO DO PIX NO MERCADO PAGO ===
    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    const payerCpf = participantes[0].cpf.replace(/\D/g, '');

    const webhookUrl = 'https://trilha-3-reino.vercel.app/api/webhook';

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${payerCpf}` 
      },
      body: JSON.stringify({
        transaction_amount: Number(valorTotal),
        description: `Inscrição Trilha - ${participantes[0].name}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPrincipal,
          first_name: firstName,
          last_name: lastName,
          identification: { type: 'CPF', number: payerCpf }
        },
        external_reference: emailPrincipal, 
        notification_url: webhookUrl
      })
    });

    const mpData = await response.json();

    if (mpData.id) {
      res.status(200).json(mpData);
    } else {
      res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

  } catch (error) {
    console.error("Erro no Servidor:", error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}