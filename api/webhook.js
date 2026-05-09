import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Instancia o Supabase
const supabase = createClient(
  'https://revyeudqlndidaiprabc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

// Configurando o "carteiro" com o seu Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    // A sua lógica original perfeita para pegar o ID do Mercado Pago
    const paymentId = req.query.id || req.query['data.id'] || req.body?.data?.id;
    
    if (!paymentId) {
      return res.status(400).send('Falta o ID do pagamento');
    }

    // 1. Vai no Mercado Pago ver se o pagamento realmente foi aprovado
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const mpData = await mpResponse.json();

    // Se o status for "approved" (PIX pago)
    if (mpData.status === 'approved') {
      const emailPrincipal = mpData.external_reference;

      if (emailPrincipal) {
        // 2. Verifica no banco e pega a lista de pessoas desse pagamento
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricao_trilha')
          .select('*')
          .eq('email', emailPrincipal);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          // Se ainda não estiver pago no banco, a gente atualiza e manda o e-mail
          if (!inscricoes[0].pago) {
            
            // Atualiza o banco (Sua lógica original)
            const { error: erroUpdate } = await supabase
              .from('inscricao_trilha')
              .update({ pago: true })
              .eq('email', emailPrincipal);

            if (erroUpdate) {
              console.error("Erro ao atualizar Supabase:", erroUpdate);
            } else {
              console.log("Banco atualizado com SUCESSO para:", emailPrincipal);
              
              // 3. Monta a lista de nomes e dispara o E-mail VIP!
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

                      <p style="margin-top: 25px; font-size: 14px;">Qualquer dúvida, é só nos chamar no WhatsApp do suporte: <a href="https://wa.me/5581988227739" style="color: #10b981; font-weight: bold; text-decoration: none;">(81) 98822-7739</a></p>
                      <p>Nos vemos na trilha!<br><strong>Equipe Invasores</strong></p>
                    </div>
                  </div>
                `
              };

              await transporter.sendMail(mailOptions);
              console.log(`E-mail de confirmação enviado para: ${emailPrincipal}`);
            }
          }
        }
      }
    }
    
    // A RESPOSTA VAI AQUI NO FINAL! (Exatamente como você fazia antes)
    return res.status(200).send('Webhook processado com sucesso');

  } catch (error) { 
    console.error("Erro no Webhook:", error); 
    return res.status(500).send('Erro interno no servidor');
  }
}