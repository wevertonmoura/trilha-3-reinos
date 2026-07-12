import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Puxa a URL segura ou aceita o fallback
const supabaseUrl = process.env.SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não configurada no servidor.");
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
  // 1. Liberação básica de CORS para teste e monitoramento
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. 🛡️ SEGURANÇA REAL: Permite apenas disparos do Cron Job da Vercel OU do Admin com senha
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`;
  const isAuthorizedAdmin = req.body?.senha === (process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN) || req.query?.senha === (process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN);

  if (!isVercelCron && !isAuthorizedAdmin) {
    console.warn("Tentativa de acesso não autorizada na recuperação de carrinho.");
    return res.status(401).json({ error: 'Acesso negado. Requer autorização de robô (Cron) ou Admin.' });
  }

  try {
    const agora = Date.now();
    
    // ⏰ Janela de Tempo Lógica: Mais antigo que 25 minutos, porém mais novo que 2 horas
    const limiteRecente = new Date(agora - 25 * 60 * 1000).toISOString(); // 25 min atrás (Teto)
    const limiteAntigo = new Date(agora - 120 * 60 * 1000).toISOString(); // 2 horas atrás (Chão)

    console.log(`Buscando carrinhos abandonados entre ${limiteAntigo} e ${limiteRecente}...`);

    // 3. Busca no Supabase (Filtrando com .not('cpf', 'is', null) para pegar SÓ OS TITULARES e evitar spam para acompanhantes!)
    const { data: pendentes, error } = await supabase
      .from('inscricao_trilha')
      .select('*')
      .eq('pago', false)
      .eq('lembrete_enviado', false)
      .not('cpf', 'is', null) // <--- O PULO DO GATO: Só titular tem CPF na nossa estrutura!
      .lt('criado_em', limiteRecente) // Criado ANTES do limite recente
      .gt('criado_em', limiteAntigo); // Criado DEPOIS do limite antigo

    if (error) {
      console.error("Erro no Supabase:", error.message);
      throw error;
    }

    if (!pendentes || pendentes.length === 0) {
      console.log("Nenhum carrinho titular para recuperar nesta janela de tempo.");
      return res.status(200).json({ success: true, message: 'Nenhum carrinho pendente para envio de e-mail agora.' });
    }

    console.log(`Encontrados ${pendentes.length} carrinhos titulares! Iniciando disparo de e-mails...`);
    
    let enviosComSucesso = 0;
    let enviosComFalha = 0;

    // 4. 🏆 OTIMIZAÇÃO SÊNIOR: Loop protegido e isolado
    for (const inscrito of pendentes) {
      try {
        if (!inscrito.email || !inscrito.email.includes('@')) {
          console.warn(`Pular inscrito ID ${inscrito.id}: e-mail inválido (${inscrito.email}).`);
          continue;
        }

        const mailOptions = {
          from: `"Vem Para Trilha" <${process.env.EMAIL_USER}>`,
          to: inscrito.email,
          subject: '⚠️ Sua vaga na Trilha 3 Reinos está esperando por você!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #10b981; border-radius: 12px; padding: 25px; background-color: #09090b; color: #f4f4f5;">
              <h2 style="color: #10b981; margin-top: 0; font-size: 24px;">Olá, ${inscrito.nome || 'Trilheiro'}! 🌿⛰️</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #a1a1aa;">Vimos que você iniciou a sua inscrição para a aventura na <strong>Trilha 3 Reinos</strong>, mas o pagamento via PIX acabou expirando antes da confirmação do nosso sistema.</p>
              <p style="font-size: 15px; line-height: 1.6; color: #f4f4f5;">As vagas são estritamente limitadas pelo controle de acesso do Santuário e estão acabando rápido! Não queremos que você fique de fora dessa imersão incrível na natureza.</p>
              
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://trilha-3-reino.vercel.app" style="background-color: #10b981; color: #09090b; padding: 16px 30px; text-decoration: none; font-weight: 900; border-radius: 8px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">👉 GARANTIR MINHA VAGA AGORA</a>
              </div>
              
              <hr style="border: 0; border-top: 1px solid #27272a; margin: 25px 0;" />
              <p style="font-size: 12px; color: #71717a; line-height: 1.5;">Se você já realizou o pagamento nos últimos minutos ou teve algum problema técnico na hora do Pix, por favor ignore este e-mail ou chame nossa organização diretamente no WhatsApp.</p>
              <p style="font-size: 14px; color: #10b981; margin-bottom: 0;"><strong>Bora simbora lavar a alma! Nos vemos lá! 💦🔥</strong><br><span style="color: #a1a1aa; font-size: 12px;">Equipe Vem Para Trilha</span></p>
            </div>
          `
        };

        // Tenta enviar o e-mail
        await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail enviado com sucesso para: ${inscrito.email}`);

        // 5. Marca no banco que o lembrete foi enviado (Usando o payment_id se existir para marcar todos do mesmo carrinho, ou o ID individual)
        if (inscrito.payment_id) {
          await supabase
            .from('inscricao_trilha')
            .update({ lembrete_enviado: true })
            .eq('payment_id', inscrito.payment_id);
        } else {
          await supabase
            .from('inscricao_trilha')
            .update({ lembrete_enviado: true })
            .eq('id', inscrito.id);
        }

        enviosComSucesso++;

      } catch (errLoop) {
        console.error(`❌ Falha ao processar e-mail para ${inscrito.email}:`, errLoop.message);
        enviosComFalha++;
      }
    }

    console.log(`Ciclo finalizado. Sucessos: ${enviosComSucesso} | Falhas: ${enviosComFalha}`);
    return res.status(200).json({ 
      success: true, 
      message: `Processamento concluído. ${enviosComSucesso} e-mails enviados com sucesso.`,
      sucessos: enviosComSucesso,
      falhas: enviosComFalha
    });

  } catch (error) {
    console.error("Erro fatal na automação de recuperação:", error);
    return res.status(500).json({ error: 'Erro interno na automação de e-mails.' });
  }
}