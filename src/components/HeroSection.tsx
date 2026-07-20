// src/components/HeroSection.tsx
import React from 'react';
import { ChevronRight, Calendar, Footprints, Clock, MapPin, Mountain } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeroProps {
  vagasOcupadas: number;
  LIMITE_VAGAS: number;
  scrollToForm: (e: React.MouseEvent) => void;
  images?: string[]; 
}

export default function HeroSection({ vagasOcupadas, LIMITE_VAGAS, scrollToForm }: HeroProps) {
  return (
    <section className="relative min-h-[75vh] md:min-h-[82vh] flex items-center justify-center overflow-hidden bg-zinc-950 pt-12 pb-10 px-4">
      
      {/* ============================================================================
          ⛰️ FUNDO COM 5 CAMADAS DE MONTANHAS (MISTÉRIO E NEBLINA)
          ============================================================================ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Fundo base escuro */}
        <div className="absolute inset-0 bg-zinc-950" />
        
        {/* Brilho verde de aurora/neblina ao fundo (mais suave e elegante) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-900/30 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Camada 1 - Montanhas Mais Distantes (Bem suaves) */}
        <svg className="absolute bottom-0 w-full h-[65%] object-cover text-zinc-800/30" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,320 0,220 150,160 350,230 550,110 800,200 1050,90 1280,180 1440,130 1440,320" />
        </svg>

        {/* Camada 2 - Montanhas de Fundo */}
        <svg className="absolute bottom-0 w-full h-[55%] object-cover text-zinc-800/50" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,320 0,180 200,120 450,240 700,90 950,220 1200,110 1440,240 1440,320" />
        </svg>

        {/* Camada 3 - Montanhas Intermediárias */}
        <svg className="absolute bottom-0 w-full h-[45%] object-cover text-zinc-800/80" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,320 0,240 160,130 360,250 600,80 860,220 1100,100 1380,230 1440,180 1440,320" />
        </svg>

        {/* Camada 4 - Montanhas Sub-Frontais (Quase pretas) */}
        <svg className="absolute bottom-0 w-full h-[35%] object-cover text-zinc-900" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,320 0,210 180,150 400,230 650,120 890,210 1150,130 1350,200 1440,160 1440,320" />
        </svg>

        {/* Camada 5 - Montanhas da Frente (Preta para fundir com a página embaixo) */}
        <svg className="absolute bottom-0 w-full h-[20%] object-cover text-zinc-950" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="currentColor">
          <polygon points="0,320 0,260 240,160 480,280 720,140 960,270 1200,170 1440,280 1440,320" />
        </svg>

        {/* 🌟 O SEGREDO MÁGICO: Um esfumaçado de baixo para cima que une as montanhas com a tela preta de baixo */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      {/* ============================================================================
          🎯 CONTEÚDO PRINCIPAL (TRILHA 3 REINOS)
          ============================================================================ */}
      <div className="container mx-auto max-w-md text-center relative z-10 flex flex-col items-center">
        
        {/* Etiqueta Superior */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase mb-6 shadow-sm backdrop-blur-md"
        >
          <Mountain size={12} className="text-emerald-500" /> Vem Para Trilha Apresenta
        </motion.div>

        {/* 🌟 LOGO EM DESTAQUE COM AUREOLA NEON */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-36 h-36 md:w-40 md:h-40 mb-6 relative flex items-center justify-center p-1.5 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] group"
        >
          <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-xl group-hover:bg-emerald-500/40 transition-all duration-500 animate-pulse" />
          <div className="relative z-10 w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/40 bg-zinc-950 flex items-center justify-center p-2 shadow-inner">
            <img 
              src="/logo.png" 
              alt="Vem Para Trilha" 
              className="w-full h-full object-contain scale-105 transform transition-transform duration-500 group-hover:scale-110" 
            />
          </div>
        </motion.div>

        {/* TÍTULO DA TRILHA 3 REINOS */}
        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white mb-2 drop-shadow-md">
          Trilha <br /> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]">
            3 Reinos
          </span>
        </h1>

        {/* Localização Oficial */}
        <p className="text-zinc-300 font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 mb-6 tracking-wide drop-shadow-md">
          <MapPin size={15} className="text-emerald-500 shrink-0" /> Guabiraba, Recife - PE
        </p>

        {/* BLOCOS SLIM DE INFORMAÇÃO */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full flex flex-col gap-2.5 mb-8 max-w-[280px]"
        >
          <div className="flex items-center justify-center gap-2 bg-zinc-900/80 text-zinc-200 text-xs font-bold py-2.5 px-4 rounded-xl border border-zinc-700/50 backdrop-blur-md shadow-lg uppercase tracking-wider">
            <Calendar size={14} className="text-emerald-400" />
            <span>23 de Agosto, 2026</span>
          </div>

          <div className="flex items-center justify-center gap-2 bg-zinc-900/80 text-emerald-400 text-xs font-black py-2.5 px-4 rounded-xl border border-emerald-500/30 backdrop-blur-md shadow-lg uppercase tracking-widest">
            <Footprints size={14} className="text-emerald-400" />
            <span>Imersão na Natureza</span>
          </div>

          <div className="flex items-center justify-center gap-2 bg-zinc-900/80 text-amber-400 text-xs font-bold py-2.5 px-4 rounded-xl border border-amber-500/30 backdrop-blur-md shadow-lg uppercase tracking-wider">
            <Clock size={14} className="text-amber-400" />
            <span>07:00h às 12:00h</span>
          </div>
        </motion.div>

        {/* BOTÃO DE GARANTIR VAGA / LISTA DE ESPERA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full max-w-[260px]"
        >
          <a 
            href="#inscricao" 
            onClick={scrollToForm} 
            className={`w-full inline-flex items-center justify-center gap-2 font-black py-4 px-6 rounded-xl shadow-2xl transition-all duration-300 uppercase tracking-widest text-[11px] md:text-xs cursor-pointer border ${
              vagasOcupadas >= LIMITE_VAGAS 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/50 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-400/50 text-white shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-1 active:scale-95'
            }`}
          >
            <span>{vagasOcupadas >= LIMITE_VAGAS ? 'Lista de Espera' : 'Garantir Ingresso'}</span>
            <ChevronRight size={16} />
          </a>
        </motion.div>

      </div>
    </section>
  );
}