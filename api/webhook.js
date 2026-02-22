import { createClient } from '@supabase/supabase-js';

// Conectamos direto no banco pelo servidor
const supabaseUrl = 'https://moqhjiesavnivkancxpz.supabase.co';
const supabaseKey = 'sb_publishable_X5iKQonjycmsEMfeePTsyg_OkKp5ts-';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // O Mercado Pago exige que respondamos rápido dizendo "Recebi a mensagem!"
  res.status(200).send('OK');

  try {
    // O Mercado Pago pode mandar o ID de duas formas diferentes, pegamos a correta:
    const paymentId = req.query.id || req.body?.data?.id;

    if (!paymentId) return; // Se não tiver ID, ignora

    // 1. Vamos até o Mercado Pago confirmar se esse pagamento é real e foi aprovado
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });
    
    const paymentData = await mpResponse.json();

    // 2. Se a situação do pagamento for "approved" (Aprovado e dinheiro na conta)
    if (paymentData.status === 'approved') {
      
      // Lembra que mandamos o e-mail como etiqueta (external_reference)? Pegamos ele de volta:
      const emailPagador = paymentData.external_reference; 

      if (emailPagador) {
        // 3. Atualiza no banco de dados! 
        // Ele vai marcar como PAGO todos os ingressos atrelados a este e-mail.
        await supabase
          .from('inscricao_trilha')
          .update({ pago: true })
          .eq('email', emailPagador);
          
        console.log(`Pagamento via Webhook aprovado com sucesso para: ${emailPagador}`);
      }
    }
  } catch (error) {
    console.error("Erro no Webhook:", error);
  }
}