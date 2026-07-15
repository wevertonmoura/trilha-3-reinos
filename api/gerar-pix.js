import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error("ERRO CRÍTICO: SUPABASE_SERVICE_KEY não está configurada no servidor.");
}

const supabase = createClient(supabaseUrl, supabaseKey || '');

export default async function handler(req, res) {
  // 1. Liberação de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  if (!participantes || !Array.isArray(participantes) || participantes.length === 0) {
    return res.status(400).json({ error: 'Lista de participantes inválida ou vazia.' });
  }

  if (!valorTotal || Number(valorTotal) <= 0 || isNaN(Number(valorTotal))) {
    return res.status(400).json({ error: 'Valor total inválido para a transação.' });
  }

  const emailLimpo = (emailPrincipal || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailLimpo)) {
    return res.status(400).json({ error: 'O e-mail principal fornecido é inválido.' });
  }

  try {
    const titular = participantes[0];
    const cpfTitular = titular.cpf ? String(titular.cpf).replace(/\D/g, '') : '';
    const telefoneTitular = titular.phone ? String(titular.phone).replace(/\D/g, '') : '';
    
    if (cpfTitular.length !== 11) {
      return res.status(400).json({ error: 'CPF do titular com formato inválido para o Mercado Pago.' });
    }

    // ============================================================================
    // 🛡️ REGRA DE NEGÓCIO: LIMPEZA DE CADASTROS PENDENTES REPETIDOS DO MESMO CPF
    // ============================================================================
    console.log(`[VERIFICAÇÃO] Checando se o CPF ${cpfTitular} já tem inscrições pendentes antigas...`);
    
    // Deleta qualquer inscrição PENDENTE (pago = false) vinculada a esse mesmo CPF
    // Nota: As que já estão PAGAS (pago = true) ficam intocadas em segurança!
    const { error: erroLimpeza } = await supabase
      .from('inscricao_trilha')
      .delete()
      .eq('cpf', cpfTitular)
      .eq('pago', false);

    if (erroLimpeza) {
      console.warn(`[AVISO] Não foi possível limpar pendências antigas do CPF ${cpfTitular}:`, erroLimpeza.message);
    } else {
      console.log(`[LIMPEZA CONCLUÍDA] Tentativas pendentes antigas do CPF ${cpfTitular} foram removidas para dar lugar à mais recente.`);
    }
    // ============================================================================

    // Descobre o domínio automaticamente para o Webhook
    const hostAtual = req.headers['x-forwarded-host'] || req.headers['host'] || 'vemparatrilha.vercel.app';
    const protocolo = hostAtual.includes('localhost') ? 'http' : 'https';
    const webhookUrl = process.env.MP_WEBHOOK_URL || `${protocolo}://${hostAtual}/api/webhook`;

    const payerName = (titular.name || 'Participante Trilha').trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Trilheiro";
    
    console.log(`[PIX DIRETO] Gerando QR Code de R$ ${Number(valorTotal).toFixed(2)} para ${firstName}...`);

    // === 1. GERAÇÃO DIRETA DE PIX NO MERCADO PAGO ===
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${cpfTitular}` // Previne cobranças duplicadas
      },
      body: JSON.stringify({
        transaction_amount: Number(valorTotal),
        description: `Inscrição Trilha - ${titular.name}`,
        payment_method_id: 'pix',
        payer: {
          email: emailLimpo,
          first_name: firstName,
          last_name: lastName,
          identification: { type: 'CPF', number: cpfTitular }
        },
        external_reference: emailLimpo, 
        notification_url: webhookUrl
      })
    });

    const mpData = await response.json();

    if (!response.ok || !mpData.id) {
      const msgErro = mpData.message || mpData.error || (mpData.cause && mpData.cause[0]?.description) || 'Falha ao gerar o QR Code no Mercado Pago.';
      console.error("[PIX ERRO]", JSON.stringify(mpData));
      return res.status(response.status || 400).json({ error: 'Não foi possível gerar o PIX.', details: msgErro });
    }

    const idDoPagamento = mpData.id.toString();
    console.log(`[PIX SUCESSO] ID gerado: ${idDoPagamento}. Gravando nova tentativa no Supabase...`);

    // === 2. SALVAMOS A TENTATIVA MAIS RECENTE NO BANCO ===
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? String(p.cpf).replace(/\D/g, '') : null;
      const telefoneLimpo = p.phone ? String(p.phone).replace(/\D/g, '') : telefoneTitular;
      
      return {
        nome: (p.name || 'Sem Nome').trim(),
        email: index === 0 ? emailLimpo : ((p.email || emailLimpo).trim()),
        telefone: index === 0 ? telefoneTitular : telefoneLimpo,
        cpf: index === 0 ? cpfLimpo : null,
        contato_emergencia: (contatoEmergencia || '').trim() || null,
        pago: false,
        payment_id: idDoPagamento
      };
    });

    const { error: erroInsert } = await supabase.from('inscricao_trilha').insert(dadosParaSalvar);
    
    if (erroInsert) {
      console.error("[SUPABASE ERRO] Falha ao salvar inscritos:", erroInsert);
      throw new Error(`Erro ao registrar no banco de dados: ${erroInsert.message}`);
    }

    console.log(`[BANCO SUCESSO] ${dadosParaSalvar.length} participante(s) gravado(s)! Devolvendo QR Code para a tela...`);

    return res.status(200).json(mpData);

  } catch (error) {
    console.error("[ERRO FATAL SERVIDOR]:", error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}