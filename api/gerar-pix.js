
export default async function handler(req, res) {
  const { valor, email, nome } = req.body;
  // Use o Access Token de PRODUÇÃO (que começa com APP_USR-)
  const token = 'APP_USR-3160159209203933-021923-32fa49b9baf1895da22c8725bb046484-690601631'; 

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: valor,
        description: `Trilha 3 Reinos`,
        payment_method_id: 'pix',
        payer: { email, first_name: nome }
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar PIX' });
  }
}