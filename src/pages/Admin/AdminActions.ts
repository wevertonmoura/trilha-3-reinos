// src/pages/Admin/AdminActions.ts

export const chamarNoWhatsApp = (telefone: string, nome: string, pago: boolean) => {
  let fone = (telefone || '').replace(/\D/g, ''); 
  if (fone.length === 10 || fone.length === 11) fone = '55' + fone;
  
  const primeiroNome = (nome || '').split(' ')[0]; 
  const txtPago = `Fala, ${primeiroNome}! Aqui é da organização do Vem Para Trilha.\n\nA nossa aventura na trilha do Santuário dos Três Reinos já é agora! 🌿⛰️\n\nEntre no nosso Grupo Oficial do WhatsApp para receber o ponto de encontro e instruções finais:\n🔗 https://chat.whatsapp.com/EX5BV94TEvGDpaude0hl4v\n\nNos vemos lá! 💦🔥`;
  const txtPendente = `Fala ${primeiroNome}! Aqui é da organização do Vem Para Trilha. Vi que você iniciou sua inscrição, mas o pagamento ainda não constou. Precisa de alguma ajuda com o PIX?`;
  
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