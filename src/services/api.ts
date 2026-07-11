// src/services/api.ts
import type { Participante } from '../types';

export const api = {
  // Checa a quantidade total de vagas ocupadas
  checarVagas: async () => {
    const res = await fetch('/api/checar-vagas');
    const data = await res.json();
    return data.total || 0;
  },

  // Faz login no painel administrativo
  loginAdmin: async (senha: string) => {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    return res;
  },

  // Envia os inscritos e gera o PIX no Mercado Pago/Backend
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
      throw new Error(data.error || "Erro ao processar inscrição no servidor.");
    }
    return data;
  },

  // Fica checando o status da transação via pooling
  checarPagamento: async (paymentId: string) => {
    const res = await fetch(`/api/checar-pagamento?paymentId=${paymentId}`);
    return res.json();
  }
};