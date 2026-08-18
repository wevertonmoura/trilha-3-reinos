// src/pages/Admin/AdminActions.ts

export const chamarNoWhatsApp = (telefone: string, nome: string, pago: boolean) => {
  let fone = (telefone || '').replace(/\D/g, ''); 
  if (fone.length === 10 || fone.length === 11) fone = '55' + fone;
  
  // 🚀 Tirei o .split(' ')[0] para a tabela conseguir mandar "João e Maria" juntos!
  const nomeFormatado = nome || ''; 
  
  // ✅ MENSAGEM DO SANTUÁRIO DOS 3 REINOS
 const txtPago = `Fala, ${nomeFormatado}!

🚨 *ATENÇÃO, GALERA DO VEM PARA TRILHA!* 🚨

A nossa aventura está chegando! É neste *domingo, dia 23/08*. ⛰️🔥

📲 *PASSO OBRIGATÓRIO (GRUPO OFICIAL):*
Entre agora no grupo oficial da trilha para receber o ponto de encontro e os horários finais:
👉 https://chat.whatsapp.com/EInPVWqK0Rf5jeOvqWxHoa?s=cl&p=a&ilr=4

_(Atenção: Se você comprou mais de um ingresso, mande esse link agora mesmo para o seu acompanhante entrar no grupo também!)_

⚠️ *AVISO IMPORTANTE - ZERO PENETRAS:*
Faremos uma chamada nominal e detalhada pela lista de pagantes antes de iniciar a trilha. Só fará o percurso quem estiver com o nome na lista. Por favor, *não levem pessoas sem ingresso (penetras)* para evitar constrangimentos e não passar vergonha na hora, beleza?

Nos vemos no domingo! Bora simbora lavar a alma!`;
  const txtPendente = `Fala, ${nomeFormatado}! Aqui é da organização do Vem Para Trilha. Vi que você iniciou sua inscrição, mas o pagamento ainda não constou. Precisa de alguma ajuda com o PIX?`;
  
  window.open(`https://wa.me/${fone}?text=${encodeURIComponent(pago ? txtPago : txtPendente)}`, '_blank');
};

export const exportarCSV = (dados: any[], tipo: 'SOS' | 'COMPLETA' | 'ESPERA') => {
  if (!dados || dados.length === 0) return alert("Nenhum dado para exportar!");
  
  let headers: string[] = [];
  let rows: string[] = [];
  let filename = '';

  // 🚀 Arrumei os nomes dos arquivos para Tres_Reinos
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