import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Puxa a URL segura ou aceita o fallback
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está configurada no servidor.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Deve ser uma "Senha de App" do Google (16 caracteres)
  }
});

export default async function handler(req, res) {
  // 1. Liberação de CORS (Essencial para as validações automáticas dos servidores do Mercado Pago)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  try {
    // Busca o ID do pagamento em qualquer um dos formatos que o Mercado Pago costuma enviar
    const paymentId = req.body?.data?.id || req.query?.id || req.query['data.id'];
    
    if (!paymentId) {
      console.log("⚠️ Notificação recebida sem ID de pagamento (Provável teste de Webhook ou ping).");
      return res.status(200).send('OK');
    }

    console.log(`🔍 Processando notificação do Mercado Pago para ID: ${paymentId}`);

    // Consulta oficial à API do Mercado Pago para evitar fraudes ou disparos falsos
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    if (!mpResponse.ok) {
      console.error(`❌ Erro ao consultar Mercado Pago [HTTP ${mpResponse.status}]`);
      return res.status(200).send('Erro ao consultar API do MP');
    }

    const mpData = await mpResponse.json();

    if (mpData.status === 'approved') {
      const idDoPagamentoString = paymentId.toString(); // O elo que liga todos os participantes do grupo!
      console.log(`✅ Pagamento APROVADO no Mercado Pago! ID: ${idDoPagamentoString}`);

      if (idDoPagamentoString) {
        // === 1. BUSCAMOS OS INSCRITOS ATRELADOS A ESTE PAYMENT_ID ===
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricao_trilha')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (erroBusca) {
          console.error("❌ Erro ao buscar no Supabase:", erroBusca.message);
          return res.status(500).send('Erro no banco de dados');
        }

        if (inscricoes && inscricoes.length > 0) {
          
          // Verifica se a primeira linha já não foi marcada como paga por outra notificação anterior
          if (!inscricoes[0].pago) {
            
            console.log(`📝 Atualizando status para PAGO de ${inscricoes.length} inscrito(s)...`);

            // === 2. ATUALIZAMOS O GRUPO INTEIRO EM UMA ÚNICA QUERY ===
            const { error: erroUpdate } = await supabase
              .from('inscricao_trilha')
              .update({ pago: true })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
              return res.status(500).send('Falha ao atualizar status de pagamento');
            } 

            console.log("🚀 Banco de dados atualizado com SUCESSO!");
            
            // === 3. DISPARAR E-MAIL DE CONFIRMAÇÃO ===
            // Tenta usar a referência externa; se vier vazia, pega do primeiro participante no banco
            const emailDestinatario = mpData.external_reference || inscricoes[0].email;

            if (!emailDestinatario || !emailDestinatario.includes('@')) {
              console.warn("⚠️ Nenhum e-mail válido encontrado para envio do recibo. Aprovado apenas no banco.");
              return res.status(200).send('Webhook processado sem envio de e-mail');
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
                    <p style="font-size: 16px; line-height: 1.5; color: #111827;">Olá! Seu PIX foi aprovado com sucesso pelo nosso sistema.</p>
                    <p style="font-size: 16px; line-height: 1.5; color: #374151;">Aqui estão os participantes com presença confirmada nesta compra:</p>
                    
                    <ul style="font-size: 16px; list-style-type: none; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; color: #166534;">
                      ${nomesParticipantes}
                    </ul>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 10px; margin-top: 25px;">
                      <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Resumo do Evento</h3>
                      <p style="margin: 8px 0; font-size: 15px;">📅 <strong>Data:</strong> 14/06/2026</p>
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
              console.log(`📧 E-mail de confirmação enviado com sucesso para: ${emailDestinatario}`);
            } catch (eMailError) {
              console.error("⚠️ Erro ao enviar e-mail de confirmação (mas o banco foi aprovado):", eMailError.message);
            }

          } else {
            console.log("ℹ️ Esta transação já estava marcada como paga anteriormente. Nenhuma ação necessária.");
          }
        } else {
          console.warn(`⚠️ O pagamento ID ${idDoPagamentoString} foi aprovado, mas nenhum registro correspondente foi encontrado na tabela inscricao_trilha.`);
        }
      }
    } else {
      console.log(`ℹ️ Status do pagamento: ${mpData.status} (Aguardando aprovação).`);
    }
    
    // Devolve 200 rápido para que o Mercado Pago saiba que recebemos a mensagem sem tentar enviar de novo
    return res.status(200).send('Webhook processado com sucesso');

  } catch (error) { 
    console.error("❌ Erro crítico no Webhook:", error); 
    // É boa prática retornar 200 no catch para que o MP não fique martelando o seu servidor em loop num erro fatal de código
    return res.status(200).send('Webhook capturou um erro interno');
  }
}