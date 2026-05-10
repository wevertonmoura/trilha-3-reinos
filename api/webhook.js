import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  // Importante: Mercado Pago às vezes envia via POST ou GET dependendo da configuração
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    // Pegando o ID do pagamento de várias formas possíveis (body ou query)
    const paymentId = req.body?.data?.id || req.query?.id || req.query['data.id'];
    
    if (!paymentId) {
      console.log("⚠️ Notificação recebida sem ID de pagamento.");
      return res.status(200).send('OK'); // Respondemos 200 para o MP parar de tentar
    }

    console.log(`🔍 Processando pagamento ID: ${paymentId}`);

    // 1. Consultar Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    if (!mpResponse.ok) {
        console.error("❌ Erro ao consultar Mercado Pago");
        return res.status(200).send('Erro na API do MP');
    }

    const mpData = await mpResponse.json();

    // 2. Verificar se foi aprovado
    if (mpData.status === 'approved') {
      const emailPrincipal = mpData.external_reference;
      console.log(`✅ Pagamento APROVADO para o e-mail: ${emailPrincipal}`);

      if (emailPrincipal) {
        // Buscamos as inscrições vinculadas a esse e-mail que ainda não foram pagas
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricao_trilha')
          .select('*')
          .eq('email', emailPrincipal);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          // Só enviamos e-mail se o primeiro da lista ainda não estiver como pago
          if (!inscricoes[0].pago) {
            
            console.log(`📝 Atualizando ${inscricoes.length} inscritos no banco...`);

            // Atualiza TODAS as inscrições com esse e-mail para PAGO
            const { error: erroUpdate } = await supabase
              .from('inscricao_trilha')
              .update({ pago: true })
              .eq('email', emailPrincipal);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              // 3. Disparar E-mail de Confirmação
              const nomesParticipantes = inscricoes.map(p => `<li>🎟️ <strong>${p.nome}</strong></li>`).join('');

              const mailOptions = {
                from: `"Vem Para Trilha" <${process.env.EMAIL_USER}>`, 
                to: emailPrincipal,
                subject: '✅ Vaga Garantida: Vem Para Trilha!', 
                html: `
                  <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #10b981; padding: 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-style: italic;">PAGAMENTO CONFIRMADO!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #fafafa; color: #374151;">
                      <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso.</p>
                      <p style="font-size: 16px;">Aqui estão os participantes confirmados nesta compra:</p>
                      <ul style="font-size: 16px; list-style-type: none; padding: 0;">
                        ${nomesParticipantes}
                      </ul>
                      
                      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                        <p style="margin: 5px 0;">📅 <strong>Data:</strong> 14/06/2026</p>
                        <p style="margin: 5px 0;">⏰ <strong>Horário:</strong> 07:00 às 12:00</p>
                        <p style="margin: 5px 0;">📍 <strong>Local:</strong> Guabiraba, Recife - PE</p>
                      </div>

                      <p style="margin-top: 25px; font-size: 14px;">Qualquer dúvida, chame no WhatsApp: <a href="https://wa.me/5581988227739" style="color: #10b981; font-weight: bold; text-decoration: none;">(81) 98822-7739</a></p>
                      <p>Nos vemos na trilha!<br><strong>Equipe Vem Para Trilha</strong></p>
                    </div>
                  </div>
                `
              };

              try {
                  await transporter.sendMail(mailOptions);
                  console.log("📧 E-mail enviado com sucesso.");
              } catch (eMailError) {
                  console.error("⚠️ Erro ao enviar e-mail:", eMailError);
              }
            }
          } else {
              console.log("ℹ️ Inscrição já estava marcada como paga. Ignorando re-envio.");
          }
        }
      }
    } else {
        console.log(`⚠️ Pagamento ${paymentId} com status: ${mpData.status}`);
    }
    
    return res.status(200).send('Webhook processado');

  } catch (error) { 
    console.error("❌ Erro crítico no Webhook:", error); 
    return res.status(500).send('Erro interno');
  }
}