// src/types/index.ts

export interface Participante {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  emergencyName: string;
  emergencyPhone: string;
}

export interface DadosPix {
  qrCodePix: string;
  qrCodeImg: string;
  paymentId: string | null;
  valorTotal: number;
  emailPrincipal: string;
}