// @ts-nocheck
// src/pages/Admin/AdminActions.ts

export const chamarNoWhatsApp = (telefone: string, nome: string, pago: boolean) => {
  let fone = (telefone || '').replace(/\D/g, ''); 
  if (fone.length === 10 || fone.length === 11) fone = '55' + fone;
  
  const nomeFormatado = nome || ''; 
  
  const txtPago = `Fala, ${nomeFormatado}!

✅ *Sua inscrição foi confirmada com sucesso!*

Para a gente preparar a arte de presença confirmada, por favor:
1️⃣ Me mande o seu @ do Instagram (e o do seu acompanhante, se tiver).
2️⃣ Envie uma foto bem massa sua (ou de vocês).

🗓️ *Aviso:* Na semana da trilha (dia 01), vamos criar um grupo oficial no WhatsApp onde vamos passar todas as informações e tirar todas as dúvidas.

Bora simbora! ⛰️🔥`;

  const txtPendente = `Fala, ${nomeFormatado}! Aqui é da organização do Vem Para Trilha. Vi que você iniciou sua inscrição, mas o pagamento ainda não constou. Precisa de alguma ajuda com o PIX?`;
  
  // 👉 SINTAXE CORRIGIDA AQUI (${ ... })
  window.open(`https://wa.me/\({fone}?text=\){encodeURIComponent(pago ? txtPago : txtPendente)}`, '_blank');
};

export const exportarCSV = (dados: any[], tipo: 'SOS' | 'COMPLETA' | 'ESPERA') => {
  if (!dados || dados.length === 0) return alert("Nenhum dado para exportar!");
  
  let headers: string[] = [];
  let rows: string[] = [];
  let filename = 'exportacao';

  if (tipo === 'SOS') {
    headers = ["Nome Completo", "Contato de Emergência"];
    // 👉 SINTAXE CORRIGIDA AQUI
    rows = dados.filter((item: any) => item.pago === true).map((item: any) => `"\({item.nome || ''}";"\){item.contato_emergencia || 'Não informado'}"`);
    filename = 'Lista_SOS_Tres_Reinos';
  } else if (tipo === 'COMPLETA') {
    headers = ["Nome Completo", "WhatsApp", "CPF", "Contato de Emergência", "Status"];
    // 👉 SINTAXE CORRIGIDA AQUI
    rows = dados.map((item: any) => `"\({item.nome || ''}";"\){item.telefone || ''}";"\({item.cpf || ''}";"\){item.contato_emergencia || ''}";"${item.pago ? 'PAGO' : 'PENDENTE'}"`);
    filename = 'Inscritos_Geral_Tres_Reinos';
  } else {
    headers = ["Nome na Espera", "WhatsApp", "Data de Cadastro"];
    // 👉 SINTAXE CORRIGIDA AQUI
    rows = dados.map((item: any) => `"\({item.nome || ''}";"\){item.telefone || ''}";"${item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''}"`);
    filename = 'Lista_Espera_VIP_Tres_Reinos';
  }

  const content = [headers.join(';'), ...rows].join('\n');
  const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  // 👉 SINTAXE CORRIGIDA AQUI
  link.setAttribute("download", `\({filename}_\){new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};