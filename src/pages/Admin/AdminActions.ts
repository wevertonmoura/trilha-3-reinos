// @ts-nocheck
// src/pages/Admin/AdminActions.ts

export const chamarNoWhatsApp = (telefone: string, nome: string, pago: boolean) => {
  // Pega apenas os números
  let fone = (telefone || '').replace(/\D/g, ''); 
  
  // Remove o zero inicial se houver
  if (fone.startsWith('0')) fone = fone.substring(1);

  // Adiciona DDD e código do país conforme o tamanho
  if (fone.length === 8 || fone.length === 9) {
    fone = '5581' + fone;
  } else if (fone.length === 10 || fone.length === 11) {
    fone = '55' + fone;
  }

  if (!fone || fone.length < 12) {
    alert(`O telefone salvo para ${nome || 'este participante'} (${telefone}) está inválido ou incompleto.`);
    return;
  }

  const nomeFormatado = nome || ''; 
  
  // 👉 MENSAGEM PARA QUEM PAGOU (CANCELAMENTO E ESTORNO)
  const txtPago = `Fala, ${nomeFormatado}! Tudo bem?

Primeiramente, queria agradecer muito por ter garantido sua vaga e pela confiança no nosso grupo.

Infelizmente, estou entrando em contato para dar uma notícia chata: *a nossa trilha do Santuário dos 3 Reinos precisou ser cancelada.* 

🚨 *O que aconteceu?*
Como alguns de vocês devem ter visto nas redes sociais, alguns vídeos do Santuário viralizaram recentemente. Devido a isso, um volume muito grande de pessoas começou a frequentar o local de forma desordenada e fazendo bagunça. Por conta dessa situação, o acesso ao local e as trilhas foram *suspensos temporariamente por tempo indeterminado*.

💸 *Sobre o Reembolso:*
Como não há previsão de liberação do espaço e zelamos pela organização, vamos realizar o estorno integral do valor que você pagou. 

Para eu fazer a transferência, *por favor, me envie respondendo a esta mensagem:*
1️⃣ Sua Chave PIX.
2️⃣ Nome de quem vai receber (titular da conta).

Qualquer dúvida que tiver, é só perguntar por aqui. Pedimos desculpas por esse imprevisto que, infelizmente, fugiu do nosso controle, mas logo estaremos juntos em uma nova aventura!

Fico no aguardo do seu PIX. ⛰️🤝`;

  // 👉 MENSAGEM PARA QUEM NÃO PAGOU (APENAS AVISO DE CANCELAMENTO)
  const txtPendente = `Fala, ${nomeFormatado}! Tudo bem? 
        
Passando para avisar que, infelizmente, *a nossa trilha do Santuário dos 3 Reinos precisou ser cancelada* por tempo indeterminado. 

Alguns vídeos do local viralizaram, o que gerou muita bagunça e superlotação. Por segurança e respeito ao meio ambiente, o acesso foi suspenso.

Como vimos que você iniciou a inscrição mas ainda não tinha feito o pagamento, estamos apenas avisando para que você não faça o PIX, beleza? 

Agradecemos o interesse e esperamos você em uma próxima aventura! ⛰️🤝`;
  
  window.open(`https://wa.me/${fone}?text=${encodeURIComponent(pago ? txtPago : txtPendente)}`, '_blank');
};

export const exportarCSV = (dados: any[], tipo: 'SOS' | 'COMPLETA' | 'ESPERA') => {
  if (!dados || dados.length === 0) return alert("Nenhum dado para exportar!");
  
  let headers: string[] = [];
  let rows: string[] = [];
  let filename = '';

  if (tipo === 'SOS') {
    headers = ["Nome Completo", "Contato de Emergência"];
    rows = dados.filter(p => p.pago).map(p => `"${p.nome || ''}";"${p.contato_emergencia || 'Não informado'}"`);
    filename = 'Lista_SOS_Tres_Reinos';
  } else if (tipo === 'COMPLETA') {
    headers = ["Nome Completo", "WhatsApp", "CPF", "Contato de Emergência", "Status"];
    rows = dados.map(p => `"${p.nome || ''}";"${p.telefone || ''}";"${p.cpf || ''}";"${p.contato_emergencia || ''}";"${p.pago ? 'PAGO' : 'PENDENTE'}"`);
    filename = 'Inscritos_Geral_Tres_Reinos';
  } else {
    headers = ["Nome na Espera", "WhatsApp", "Data de Cadastro"];
    rows = dados.map(p => `"${p.nome || ''}";"${p.telefone || ''}";"${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}"`);
    filename = 'Lista_Espera_VIP_Tres_Reinos';
  }

  const content = [headers.join(';'), ...rows].join('\n');
  const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `${filename}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};