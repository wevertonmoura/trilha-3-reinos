export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { valor, email, nome, cpf } = req.body;

  // Tratando o nome para enviar primeiro e último nome separadamente
  const nomePartes = nome.trim().split(" ");
  const firstName = nomePartes[0];
  const lastName = nomePartes.length > 1 ? nomePartes.slice(1).join(" ") : "Invasor";

  // CORREÇÃO: Força o Mercado Pago a ligar sempre para o site oficial (destrancado)
  // ATENÇÃO: Confirme se o link do seu site oficial é exatamente este abaixo! Se for "trilha-3-reino" sem o "s" no final, ajuste ali.
  const webhookUrl = 'https://trilha-3-reinos.vercel.app/api/webhook';

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}` 
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: `Inscrição Trilha 3 Reinos - ${nome}`,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: cpf 
          }
        },
        external_reference: email, // <-- A ETIQUETA: Usamos o e-mail para achar os ingressos depois
        notification_url: webhookUrl // <-- O TELEFONE FIXO: O MP vai chamar o link oficial destrancado!
      })
    });

    const data = await response.json();

    if (data.id) { 
      res.status(200).json(data);
    } else {
      console.error("Erro do Mercado Pago:", data);
      res.status(400).json({ error: 'Erro na API do Mercado Pago', details: data });
    }

  } catch (error) {
    console.error("Erro no Servidor:", error);
    res.status(500).json({ error: 'Erro interno ao gerar PIX' });
  }
}