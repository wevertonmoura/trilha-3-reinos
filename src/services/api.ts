// src/services/api.ts
import type { Participante } from '../types';

export const api = {
  // ============================================================================
  // 🎟️ FLUXO PÚBLICO (INSCRIÇÃO E VAGAS)
  // ============================================================================

  // Checa a quantidade total de vagas confirmadas em tempo real
  checarVagas: async (): Promise<number> => {
    try {
      // ⚡ TRUQUE SÊNIOR: '?t=Date.now()' impede o Safari/Chrome mobile de cachear a resposta!
      const res = await fetch(`/api/checar-vagas?t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return 0;
      const data = await res.json();
      return data.total || 0;
    } catch (error) {
      console.error("Erro ao checar vagas:", error);
      return 0; // Fallback seguro para não travar a tela
    }
  },

  // Envia os inscritos e gera o PIX transacional no Mercado Pago
  gerarPix: async (dados: {
    participantes: Participante[];
    valorTotal: number;
    emailPrincipal: string;
    contatoEmergencia: string;
  }) => {
    const res = await fetch('/api/gerar-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.details || "Erro ao processar inscrição no servidor.");
    }
    return data;
  },

  // Checa o status do pagamento no Mercado Pago (Usado no pooling da tela de QR Code)
  checarPagamento: async (paymentId: string) => {
    try {
      const res = await fetch(`/api/checar-pagamento?paymentId=${paymentId}&t=${Date.now()}`);
      if (!res.ok) return { status: 'pending' }; // Se a rede piscar, mantém como pendente
      return await res.json();
    } catch (error) {
      console.warn("Oscilação de rede ao checar PIX, tentando novamente em breve...", error);
      return { status: 'pending' };
    }
  },

  // ============================================================================
  // ⏳ FLUXO DA LISTA DE ESPERA VIP
  // ============================================================================

  // Cadastra um interessado quando as vagas oficiais esgotam
  salvarListaEspera: async (dados: { nome: string; telefone: string }) => {
    const res = await fetch('/api/salvar-lista-espera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao entrar na lista de espera.");
    return data;
  },

  // ============================================================================
  // 🔐 FLUXO DO PAINEL ADMINISTRATIVO
  // ============================================================================

  // Autenticação no painel
  loginAdmin: async (senha: string) => {
    return await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
  },

  // Busca a lista principal de inscritos (Tabela Verde)
  listarAdmin: async (senha: string) => {
    const res = await fetch('/api/admin-listar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    if (!res.ok) throw new Error("Acesso negado ou erro na listagem.");
    return await res.json();
  },

  // Aprova manualmente um pagamento (Muda para pago: true)
  aprovarInscricao: async (senha: string, id: number | string) => {
    const res = await fetch('/api/admin-aprovar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha, id })
    });
    if (!res.ok) throw new Error("Erro ao aprovar inscrição.");
    return await res.json();
  },

  // Exclui um participante da tabela principal
  excluirInscricao: async (senha: string, id: number | string) => {
    const res = await fetch('/api/admin-excluir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha, id })
    });
    if (!res.ok) throw new Error("Erro ao excluir participante.");
    return await res.json();
  },

  // Busca a lista de interessados na fila VIP (Tabela Roxa)
  listarEsperaAdmin: async (senha: string) => {
    const res = await fetch('/api/admin-lista-espera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    if (!res.ok) throw new Error("Erro ao buscar lista de espera.");
    return await res.json();
  },

  // Remove alguém da lista de espera VIP
  excluirEsperaAdmin: async (senha: string, id: number | string) => {
    const res = await fetch('/api/admin-excluir-espera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha, id })
    });
    if (!res.ok) throw new Error("Erro ao remover da lista VIP.");
    return await res.json();
  }
};