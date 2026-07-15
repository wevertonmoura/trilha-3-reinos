// src/pages/Inscricao/index.tsx
import React, { useState } from 'react';
import { Loader2, Hourglass, CheckCircle, Trash2, Plus, AlertCircle, ChevronRight, CreditCard, QrCode } from 'lucide-react';
import type { Participante, DadosPix } from '../../types';
import { api } from '../../services/api';
import { validarCPF, formatarMoeda } from '../../utils/helpers';

interface InscricaoProps {
  vagasOcupadas: number;
  verificandoVagas: boolean;
  LIMITE_VAGAS: number;
  onPixGerado: (dadosPix: DadosPix, participantes: Participante[]) => void;
}

const Inscricao: React.FC<InscricaoProps> = ({
  vagasOcupadas,
  verificandoVagas,
  LIMITE_VAGAS,
  onPixGerado
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Lista de Espera VIP
  const [listaEsperaNome, setListaEsperaNome] = useState('');
  const [listaEsperaFone, setListaEsperaFone] = useState('');
  const [entrouLista, setEntrouLista] = useState(false);

  // Participantes
  const [participants, setParticipants] = useState<Participante[]>([
    { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '' }
  ]);

  const taxaPix = 1;
  const calcularValorIngressos = (qtd: number) => {
    const pares = Math.floor(qtd / 2);
    const avulsos = qtd % 2;
    return (pares * 100) + (avulsos * 55);
  };

  const removeParticipant = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  const addParticipant = () => {
    if (vagasOcupadas + participants.length >= LIMITE_VAGAS) {
      alert("Atenção: Vagas insuficientes para adicionar outro acompanhante!");
      return;
    }
    setParticipants([...participants, { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '' }]);
  };

  const updateParticipant = (index: number, field: keyof Participante, value: string) => {
    const newParticipants = [...participants];
    let v = value;
    if (field === 'phone' || field === 'emergencyPhone') {
      v = v.replace(/\D/g, "").slice(0, 11);
      if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
    } else if (field === 'cpf') {
      v = v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    newParticipants[index] = { ...newParticipants[index], [field]: v };
    setParticipants(newParticipants);
  };

  // Salva silenciosamente no banco na Lista VIP
  const handleListaEspera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (listaEsperaNome.trim().length < 3 || listaEsperaFone.length < 14) {
      alert("Preencha seus dados corretamente!"); 
      return;
    }

    try {
      const res = await fetch('/api/salvar-lista-espera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: listaEsperaNome,
          telefone: listaEsperaFone
        })
      });

      if (!res.ok) {
        throw new Error("Não foi possível salvar na lista de espera.");
      }

      setEntrouLista(true);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao entrar na lista VIP. Tente novamente em alguns instantes!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (vagasOcupadas + participants.length > LIMITE_VAGAS) {
      setErrorMsg(`Infelizmente não temos vagas suficientes disponíveis agora.`);
      return;
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (p.name.trim().length < 3) { setErrorMsg(i === 0 ? `Preencha o nome do Titular.` : `Preencha o nome do Acompanhante ${i}.`); return; }

      if (i === 0) {
        if (p.phone.replace(/\D/g, '').length < 10) { setErrorMsg(`WhatsApp incompleto no Titular.`); return; }
        if (!validarCPF(p.cpf)) { setErrorMsg(`⚠️ CPF Inválido! Verifique o número digitado pelo Titular.`); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) { setErrorMsg("Digite um e-mail válido."); return; }
        if (p.emergencyName.trim().length < 2 || p.emergencyPhone.replace(/\D/g, '').length < 10) {
          setErrorMsg("Preencha corretamente os dados de Emergência (SOS)."); return;
        }
      }
    }

    if (!termsAccepted) { setErrorMsg("Aceite o termo de responsabilidade e regras de cancelamento."); return; }

    setLoading(true);
    setErrorMsg('');

    try {
      const mainEmergency = `${participants[0].emergencyName} - ${participants[0].emergencyPhone}`;
      const mainEmail = participants[0].email;
      const valorTotal = Number((calcularValorIngressos(participants.length) + taxaPix).toFixed(2));

      // 1. Chama a API atualizada (que agora gera o link do Checkout Pro aceitando PIX e Cartão)
      const mpData = await api.gerarPix({
        participantes: participants,
        valorTotal: valorTotal,
        emailPrincipal: mainEmail,
        contatoEmergencia: mainEmergency
      });

      // 2. 🚀 REDIRECIONAMENTO INTELIGENTE (Checkout Pro vs. PIX Direto)
      if (mpData.url_pagamento) {
        // Se o servidor devolveu o link do Checkout Pro (PIX + Cartão em até 12x), redireciona na hora!
        window.location.href = mpData.url_pagamento;
        return;
      } 
      else if (mpData.point_of_interaction?.transaction_data) {
        // Fallback defensivo: se por acaso for usado o modo antigo de PIX direto, mantém compatibilidade
        onPixGerado({
          qrCodePix: mpData.point_of_interaction.transaction_data.qr_code,
          qrCodeImg: mpData.point_of_interaction.transaction_data.qr_code_base64,
          paymentId: mpData.id,
          valorTotal: valorTotal,
          emailPrincipal: mainEmail
        }, participants);
      } else {
        throw new Error("Erro ao gerar a sessão de pagamento. Verifique as credenciais no servidor.");
      }
    } catch (err: any) {
      console.error("Erro no checkout:", err);
      setErrorMsg(err.message || "Erro de conexão ao gerar pagamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // ESTADO 1: VERIFICANDO VAGAS
  if (verificandoVagas) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Verificando Vagas...</p>
      </div>
    );
  }

  // ESTADO 2: VAGAS ESGOTADAS -> LISTA DE ESPERA VIP
  if (vagasOcupadas >= LIMITE_VAGAS) {
    return (
      <div className="animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Hourglass size={28} className="text-red-500" />
          </div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">ESGOTADO!</h2>
          <p className="text-zinc-400 text-xs font-bold mt-2">Todas as vagas foram preenchidas.</p>
        </div>

        {!entrouLista ? (
          <div className="bg-zinc-800/40 p-6 rounded-3xl border border-zinc-700/50 shadow-inner">
            <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center mb-6">Lista de Espera VIP</h3>
            <form onSubmit={handleListaEspera} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seu Nome</label>
                <input required type="text" value={listaEsperaNome} onChange={e => setListaEsperaNome(e.target.value)} className="w-full bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="Nome e Sobrenome" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Seu WhatsApp</label>
                <input required type="tel" value={listaEsperaFone} onChange={e => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                  if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                  if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`;
                  setListaEsperaFone(v);
                }} className="w-full bg-zinc-950 border border-zinc-700/50 rounded-xl px-4 py-3 text-white font-bold text-sm" placeholder="(81) 99999-9999" />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 rounded-xl shadow-xl mt-4 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all">
                Entrar na Lista VIP <ChevronRight size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-3xl text-center space-y-4">
            <CheckCircle className="text-emerald-500 mx-auto" size={40} />
            <p className="text-emerald-400 font-bold text-sm">Você foi adicionado à lista de espera com sucesso!</p>
            <p className="text-zinc-400 text-xs">Se alguma vaga abrir, entraremos em contato com você via WhatsApp.</p>
          </div>
        )}
      </div>
    );
  }

  // ESTADO 3: FORMULÁRIO NORMAL DE COMPRA
  return (
    <>
      <div className="text-center mb-10 relative">
        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">INSCRIÇÃO</h2>
        <p className="text-emerald-500 text-sm font-bold mt-2 tracking-widest">R$ 55 INDIVIDUAL | R$ 100 VOCÊ + 1 AMIGO</p>
        
        {/* Adicionado selo de meios de pagamento para passar mais confiança */}
        <div className="flex items-center justify-center gap-4 mt-3 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><QrCode size={14} className="text-emerald-500" /> PIX Imediato</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1"><CreditCard size={14} className="text-emerald-500" /> Cartão em até 12x</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {participants.map((participant, index) => (
          <div key={index} className="p-6 rounded-3xl bg-zinc-800/40 border border-zinc-700/50 relative shadow-inner overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${index === 0 ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>

            <div className="flex justify-between items-center mb-4 pl-2 border-b border-zinc-700/50 pb-2">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${index === 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {index === 0 ? "👤 Titular da Inscrição (Responsável)" : `👥 Acompanhante ${index}`}
              </h3>
              {index > 0 && (
                <button type="button" onClick={() => removeParticipant(index)} className="text-zinc-500 hover:text-red-500 transition-colors p-1" title="Remover Acompanhante"><Trash2 size={16} /></button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nome Completo</label>
                <input type="text" value={participant.name} onChange={e => updateParticipant(index, 'name', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Ex: João Silva" />
              </div>

              {index === 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                      <input type="tel" value={participant.phone} onChange={e => updateParticipant(index, 'phone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 99999-9999" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">CPF (Necessário para a compra)</label>
                      <input type="text" required value={participant.cpf} onChange={e => updateParticipant(index, 'cpf', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="000.000.000-00" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">E-mail</label>
                    <input type="email" value={participant.email} onChange={e => updateParticipant(index, 'email', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="seu@gmail.com" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Contato de Emergência (SOS)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={participant.emergencyName} onChange={e => updateParticipant(index, 'emergencyName', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Nome" />
                      <input type="tel" value={participant.emergencyPhone} onChange={e => updateParticipant(index, 'emergencyPhone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 99999-9999" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {vagasOcupadas + participants.length < LIMITE_VAGAS && (
          <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
            <Plus size={16} /> Comprar Ingresso Extra (Acompanhante)
          </button>
        )}

        <label className="flex items-start gap-3 pt-6 border-t border-zinc-700/50 cursor-pointer group">
          <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer rounded shrink-0 group-hover:ring-2 ring-emerald-500/50 transition-all" />
          <span className="text-[11px] text-zinc-400 font-bold leading-relaxed select-none group-hover:text-zinc-300 transition-colors">
            Aceito o Termo de Responsabilidade (declaro estar em boas condições de saúde) e estou ciente de que NÃO haverá devolução ou reembolso do valor pago sob nenhuma hipótese.
          </span>
        </label>

        {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"><AlertCircle size={14} /> {errorMsg}</div>}

        <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" />
              <span>Redirecionando para o Mercado Pago...</span>
            </div>
          ) : (
            <>Ir para o Pagamento (R$ {formatarMoeda(calcularValorIngressos(participants.length) + taxaPix)}) <ChevronRight size={20} /></>
          )}
        </button>
      </form>
    </>
  );
};

export default Inscricao;