import { createClient } from '@supabase/supabase-js';

// Instancia o Supabase fora para otimizar
const supabase = createClient(
  'https://moqhjiesavnivkancxpz.supabase.co', 
  process.env.SUPABASE_SERVICE_KEY // ATENÇÃO: O nome no Vercel tem que ser exatamente esse!
);

export default async function handler(req, res) {
  // ATENÇÃO: Tiramos o res.status(200) daqui do topo! O Vercel agora vai esperar.

  try {
    // Pegamos o ID de todas as formas que o MP costuma mandar
    const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id;
    
    if (!paymentId) {
      return res.status(400).send('Falta o ID do pagamento');
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    const paymentData = await mpResponse.json();

    if (paymentData.status === 'approved') {
      const emailPagador = paymentData.external_reference; 
      
      if (emailPagador) {
        // A Chave Mestra edita o banco
        const { error } = await supabase
          .from('inscricao_trilha')
          .update({ pago: true })
          .eq('email', emailPagador);

        if (error) {
          console.error("Erro ao atualizar Supabase:", error);
        } else {
          console.log("Banco atualizado com SUCESSO para:", emailPagador);
        }
      }
    }
    
    // A RESPOSTA VAI AQUI NO FINAL! O Mercado Pago recebe o OK depois de tudo pronto.
    return res.status(200).send('Webhook processado com sucesso');

  } catch (error) { 
    console.error("Erro no Webhook:", error); 
    return res.status(500).send('Erro interno no servidor');
  }
}