// src/pages/PixCheckout2/index.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, QrCode, Copy, Clock, Ticket } from 'lucide-react';
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
  const [tempoRestante, setTempoRestante] = useState(900); // 15 minutos

  // Timer regressivo do PIX
  useEffect(() => {
    let timer: any;
    if (statusPagamento === 'pendente' && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [statusPagamento, tempoRestante]);

  // Pooling de verificação do pagamento (de 3 em 3 seg)
  useEffect(() => {
    let intervalo: any;
    if (dadosPix.paymentId && statusPagamento === 'pendente') {
      intervalo = setInterval(async () => {
        try {
          const data = await api.checarPagamento(dadosPix.paymentId!);
          if (data.status === 'approved') {
            setStatusPagamento('pago');
            clearInterval(intervalo);
          }
        } catch (err) { 
          console.error("Erro ao checar status do pagamento:", err); 
        }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [dadosPix.paymentId, statusPagamento]);

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(dadosPix.qrCodePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000); 
  };

  return (
    <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
      {statusPagamento === 'pago' ? (
        <div className="py-2 space-y-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">
            Pagamento <br /> Confirmado!
          </h2>
          <p className="text-zinc-400 font-bold text-sm max-w-xs mx-auto">
            O comprovante e os detalhes da sua inscrição foram enviados para o e-mail: <strong className="text-emerald-500">{dadosPix.emailPrincipal}</strong>
          </p>

          <div className="space-y-4 text-left w-full max-w-md mx-auto pt-4 pb-2">
            {participantes.map((p, index) => (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: index * 0.2 }} 
                key={index} 
                className="bg-zinc-900/80 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-4"
              >
                <div className="bg-emerald-500/10 p-3 rounded-lg">
                  <Ticket className="text-emerald-500" size={24} />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest">
                    {index === 0 ? "Titular" : "Acompanhante"}
                  </p>
                  <p className="text-white font-bold uppercase truncate">{p.name}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={onNovaInscricao} className="mt-8 px-6 py-3 border border-zinc-700 hover:border-emerald-500 rounded-xl text-zinc-400 hover:text-emerald-500 text-xs font-bold uppercase tracking-widest transition-all">
            Fazer Nova Inscrição
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
              <QrCode className="text-emerald-500 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Escaneie o PIX</h2>
          </div>
          
          {dadosPix.qrCodeImg && (
            <div className="flex justify-center my-6">
              <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/30">
                <img src={`data:image/jpeg;base64,${dadosPix.qrCodeImg}`} alt="PIX" className="w-48 h-48 rounded-lg" />
              </div>
            </div>
          )}
          
          <div className="bg-zinc-800/40 border border-emerald-500/30 rounded-3xl p-6 shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Valor total</p>
            <p className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(dadosPix.valorTotal)}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-4 rounded-xl border border-zinc-700/50">
              <span className="text-xs font-mono text-zinc-300 truncate w-full text-left">{dadosPix.qrCodePix}</span>
              <button onClick={copiarPix} className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${copiado ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                {copiado ? <CheckCircle size={14} /> : <Copy size={14} />} 
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            
            {tempoRestante > 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 mt-4">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold animate-pulse">Aguardando pagamento...</p>
                <div className="flex items-center gap-2 text-2xl font-mono bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-white">
                  <Clock size={20} className="text-emerald-500" />
                  <span>{formatarTempo(tempoRestante)}</span>
                </div>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tempo para o PIX expirar</p>
              </div>
            ) : (
              <div className="text-red-500 font-bold text-xs mt-4 bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                Tempo expirado! Por favor, recarregue a página e gere uma nova inscrição.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PixCheckout;