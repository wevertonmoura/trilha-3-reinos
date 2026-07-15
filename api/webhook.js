import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY || '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const paymentId = req.body?.data?.id || req.query?.id || req.query['data.id'];
    if (!paymentId) return res.status(200).send('OK');

    console.log(`🔍 Processando Webhook Mercado Pago ID: ${paymentId}`);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    if (!mpResponse.ok) return res.status(200).send('Erro ao consultar API do MP');
    const mpData = await mpResponse.json();

    if (mpData.status === 'approved') {
      const idDoPagamentoString = paymentId.toString();
      console.log(`✅ Pagamento APROVADO! ID: ${idDoPagamentoString}`);

      const { data: inscricoes, error: erroBusca } = await supabase
        .from('inscricao_trilha')
        .select('*')
        .eq('payment_id', idDoPagamentoString);

      if (erroBusca || !inscricoes || inscricoes.length === 0) {
        console.warn(`⚠️ Pagamento aprovado, mas nenhum registro encontrado no Supabase para payment_id ${idDoPagamentoString}`);
        return res.status(200).send('Sem registros correspondentes');
      }

      if (!inscricoes[0].pago) {
        const { error: erroUpdate } = await supabase
          .from('inscricao_trilha')
          .update({ pago: true })
          .eq('payment_id', idDoPagamentoString);

        if (erroUpdate) {
          console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
          return res.status(500).send('Falha ao atualizar banco');
        } 

        console.log("🚀 Banco atualizado para PAGO com sucesso!");
        
        const emailDestinatario = mpData.external_reference || inscricoes[0].email;
        if (!emailDestinatario || !emailDestinatario.includes('@')) {
          return res.status(200).send('Aprovado no banco sem e-mail');
        }

        const nomesParticipantes = inscricoes
          .map(p => `<li style="margin-bottom: 8px;">🎟️ <strong>${p.nome || 'Trilheiro'}</strong></li>`)
          .join('');

        const mailOptions = {
          from: `"Vem Para Trilha" <${process.env.EMAIL_USER}>`, 
          to: emailDestinatario,
          subject: '✅ Vaga Garantida: Trilha 3 Reinos!', 
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; color: #374151;">
              <div style="background-color: #10b981; padding: 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-style: italic; font-size: 26px; letter-spacing: 1px;">PAGAMENTO CONFIRMADO!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.5; color: #111827;">Olá! Seu pagamento foi aprovado com sucesso pelo nosso sistema.</p>
                <p style="font-size: 16px; line-height: 1.5; color: #374151;">Aqui estão os participantes com presença confirmada nesta compra:</p>
                
                <ul style="font-size: 16px; list-style-type: none; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534;">
                  ${nomesParticipantes}
                </ul>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; margin-top: 25px;">
                  <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Resumo do Evento</h3>
                  <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Data:</strong> 23/08/2026 (Domingo)</p>
                  <p style="margin: 8px 0; font-size: 15px;">⏰ <strong>Horário:</strong> 07:00 às 12:00</p>
                  <p style="margin: 8px 0; font-size: 15px;">📍 <strong>Local:</strong> Guabiraba, Recife - PE</p>
                </div>

                <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">Qualquer dúvida, chame nossa equipe diretamente no WhatsApp: <a href="https://wa.me/5581988227739" style="color: #10b981; font-weight: bold; text-decoration: none;">(81) 98822-7739</a></p>
                <p style="margin-bottom: 0; font-size: 15px;">Nos vemos na trilha!<br><strong style="color: #10b981;">Equipe Vem Para Trilha</strong></p>
              </div>
            </div>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`📧 E-mail enviado com sucesso para: ${emailDestinatario}`);
        } catch (eMailError) {
          console.error("⚠️ Erro ao enviar e-mail (mas o banco foi aprovado):", eMailError.message);
        }
      }
    } 
    return res.status(200).send('Webhook processado com sucesso');
  } catch (error) { 
    console.error("❌ Erro crítico no Webhook:", error); 
    return res.status(200).send('Webhook capturou um erro interno');
  }
}