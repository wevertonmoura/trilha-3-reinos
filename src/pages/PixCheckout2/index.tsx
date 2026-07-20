import React, { useState, useEffect } from 'react';
import { CheckCircle, QrCode, Copy, Clock, Ticket, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DadosPix, Participante } from '../../types';
import { api } from '../../services/api';
import { formatarMoeda } from '../../utils/helpers';

interface PixCheckoutProps {
  dadosPix: DadosPix;
  participantes: Participante[];
  onNovaInscricao: () => void;
}

const PixCheckout: React.FC<PixCheckoutProps> = ({ dadosPix, participantes, onNovaInscricao }) => {
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pendente');
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); // 15 minutos = 900 segundos

  // 1. Timer regressivo do PIX
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (statusPagamento === 'pendente' && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [statusPagamento, tempoRestante]);

  // 2. Polling de verificação do pagamento
  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval>;
    if (dadosPix.paymentId && statusPagamento === 'pendente' && tempoRestante > 0) {
      intervalo = setInterval(async () => {
        try {
          const data = await api.checarPagamento(dadosPix.paymentId!);
          if (data.status === 'approved') {
            setStatusPagamento('pago');
            clearInterval(intervalo);
          }
        } catch (err) { 
          console.error("Erro ao checar status do pagamento no servidor:", err); 
        }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [dadosPix.paymentId, statusPagamento, tempoRestante]);

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copiarPix = async () => {
    try {
      await navigator.clipboard.writeText(dadosPix.qrCodePix);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (err) {
      console.error("Falha ao copiar para a área de transferência:", err);
    }
  };

  const getQrCodeImageSrc = (imgString: string) => {
    if (imgString.startsWith('data:image')) return imgString;
    return `data:image/jpeg;base64,${imgString}`;
  };

  // Previne o duplo "R$" limpando caso o helper já traga a formatação
  const valorExibicao = String(formatarMoeda(dadosPix.valorTotal)).replace('R$', '').trim();

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
      
      {statusPagamento === 'pago' ? (
        /* ============================================================================
           🎉 CARD OFICIAL DE COMPRA CONFIRMADA (TURBINADO!)
           ============================================================================ */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900/95 border-2 border-emerald-500/40 rounded-[2.5rem] p-6 md:p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] max-w-md mx-auto relative overflow-hidden text-center space-y-6"
        >
          {/* Enfeite: Luz de neon superior no Card */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 animate-pulse" />

          {/* Ícone de Sucesso Animado */}
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.5)] mt-2"
          >
            <CheckCircle size={42} className="text-zinc-950 stroke-[2.5]" />
          </motion.div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block mb-2.5 shadow-sm">
              ✨ Inscrição Garantida
            </span>
            <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none">
              Compra <br /> Confirmada!
            </h2>
          </div>
          
          {/* DESTAQUE PARA O E-MAIL DO COMPROVANTE */}
          <div className="bg-zinc-950/90 p-4 rounded-2xl border border-emerald-500/30 shadow-inner space-y-1.5 text-left">
            <p className="text-zinc-400 font-semibold text-xs leading-relaxed">
              📧 O comprovante e os detalhes da sua aventura foram enviados para o e-mail:
            </p>
            <p className="text-emerald-400 font-black text-sm tracking-wide break-all underline decoration-emerald-500/50">
              {dadosPix.emailPrincipal}
            </p>
          </div>

          {/* LISTA DE PARTICIPANTES NO CARD */}
          <div className="space-y-2.5 text-left pt-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center mb-2">
              Participantes Confirmados ({participantes.length})
            </p>
            {participantes.map((p, index) => (
              <motion.div 
                initial={{ x: -15, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ delay: 0.2 + index * 0.1 }} 
                key={index} 
                className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3.5 shadow-md hover:border-emerald-500/50 transition-colors"
              >
                <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 shrink-0">
                  <Ticket className="text-emerald-400" size={20} />
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[9px] uppercase text-emerald-500 font-extrabold tracking-widest">
                    {index === 0 ? "Titular da Compra" : `Trilheiro(a) #${index + 1}`}
                  </p>
                  <p className="text-white font-bold uppercase truncate text-sm">{p.name || 'Participante'}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={onNovaInscricao} 
            className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 flex items-center justify-center gap-2"
          >
            Fazer Nova Inscrição
          </button>
        </motion.div>
      ) : (
        /* ============================================================================
           ⏳ TELA DE PAGAMENTO (AGUARDANDO PIX OU EXPIRADO)
           ============================================================================ */
        <>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-1 shadow-inner">
              <QrCode className="text-emerald-400 w-8 h-8 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
              {tempoRestante > 0 ? "Escaneie o PIX" : "PIX Expirado"}
            </h2>
          </div>
          
          <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden max-w-sm mx-auto">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Valor Total da Inscrição</p>
            <p className="text-4xl font-black text-white tracking-tighter">R$ {valorExibicao}</p>
          </div>

          {tempoRestante > 0 ? (
            /* --- SUB-TELA: PIX ATIVO --- */
            <div className="space-y-6 max-w-sm mx-auto">
              {dadosPix.qrCodeImg && (
                <div className="flex justify-center my-4">
                  <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
                    <img 
                      src={getQrCodeImageSrc(dadosPix.qrCodeImg)} 
                      alt="QR Code PIX Trilha" 
                      className="w-48 h-48 rounded-lg object-contain" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Ou copie o código PIX Copia e Cola:</p>
                
                <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-3 rounded-xl border border-zinc-800 shadow-inner">
                  <span className="text-xs font-mono text-zinc-400 truncate w-full text-left select-all">{dadosPix.qrCodePix}</span>
                  <button 
                    onClick={copiarPix} 
                    className={`px-4 py-3 rounded-lg text-xs font-black flex items-center gap-2 shrink-0 transition-all active:scale-95 ${
                      copiado 
                        ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                    }`}
                  >
                    {copiado ? <CheckCircle size={14} /> : <Copy size={14} />} 
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center gap-2 pt-4 border-t border-zinc-800/80">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-extrabold animate-pulse">
                  ⚡ Aguardando confirmação do banco...
                </p>
                <div className="flex items-center gap-2 text-xl font-mono bg-zinc-950 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-200 shadow-inner">
                  <Clock size={18} className="text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>{formatarTempo(tempoRestante)}</span>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tempo restante para o PIX expirar</p>
              </div>
            </div>
          ) : (
            /* --- SUB-TELA: PIX EXPIRADO --- */
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm mx-auto bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-center space-y-4 my-6"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-red-400 font-black uppercase text-sm tracking-wide">Tempo Expirado!</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  O código PIX anterior foi cancelado por segurança pelo Mercado Pago. Para garantir sua vaga, gere uma nova inscrição.
                </p>
              </div>
              
              <button 
                onClick={onNovaInscricao} 
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                Gerar Novo PIX
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default PixCheckout;