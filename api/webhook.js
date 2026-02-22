import { createClient } from '@supabase/supabase-js';

// Agora usamos a Chave Mestra (SUPABASE_SERVICE_KEY) para atualizar o banco por trás dos panos!
const supabase = createClient('https://moqhjiesavnivkancxpz.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  res.status(200).send('OK');
  try {
    const paymentId = req.query.id || req.body?.data?.id;
    if (!paymentId) return;

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    const paymentData = await mpResponse.json();

    if (paymentData.status === 'approved') {
      const emailPagador = paymentData.external_reference; 
      if (emailPagador) {
        // A Chave Mestra consegue editar o banco mesmo ele estando trancado!
        await supabase.from('inscricao_trilha').update({ pago: true }).eq('email', emailPagador);
      }
    }
  } catch (error) { console.error("Erro no Webhook:", error); }
}