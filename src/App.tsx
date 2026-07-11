// src/App.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORTAÇÕES DAS NOSSAS TELAS E SERVIÇOS
import { api } from './services/api';
import type { DadosPix, Participante } from './types';
import { formatarMoeda } from './utils/helpers';

import HeroSection from './components/HeroSection';
import EventInfo from './components/EventInfo';
import Footer from './components/Footer';

// NOSSAS NOVAS PÁGINAS SEPARADAS
import Inscricao from './pages/Inscricao';
import PixCheckout from './pages/PixCheckout2';
import LoginAdmin from './pages/Admin/Login';
import AdminPanel from './pages/Admin/Panel';

const App = () => {
  // Estados gerais da aplicação
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix' | 'login_admin' | 'admin'>('formulario');
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [senhaAdmin, setSenhaAdmin] = useState('');

  // Vagas e Dados da Compra
  const LIMITE_VAGAS = 60;
  const [vagasOcupadas, setVagasOcupadas] = useState(0);
  const [verificandoVagas, setVerificandoVagas] = useState(true);
  const [dadosPix, setDadosPix] = useState<DadosPix | null>(null);
  const [participantesPix, setParticipantesPix] = useState<Participante[]>([]);

  const images = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];

  // Checa se veio ?admin=true na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setTelaAtual('login_admin');
    }
  }, []);

  // Busca as vagas ocupadas na montagem
  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const total = await api.checarVagas();
        setVagasOcupadas(total);
      } catch (err) {
        console.error("Erro ao checar vagas", err);
      } finally {
        setVerificandoVagas(false);
      }
    };
    fetchVagas();
  }, []);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. TELA DE LOGIN DO ADMIN
  if (telaAtual === 'login_admin') {
    return (
      <LoginAdmin 
        onLoginSuccess={(senha) => {
          setSenhaAdmin(senha);
          setTelaAtual('admin');
        }} 
        onVoltar={() => setTelaAtual('formulario')} 
      />
    );
  }

  // 2. TELA DO PAINEL ADMIN
  if (telaAtual === 'admin') {
    return (
      <AdminPanel 
        senha={senhaAdmin} 
        formatarMoeda={formatarMoeda} 
        fecharAdmin={() => setTelaAtual('formulario')} 
      />
    );
  }

  // 3. APLICAÇÃO PRINCIPAL (HERO + INFO + FORMULÁRIO OU PIX)
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 overflow-x-hidden">
      
      {/* MODAL DE IMAGEM */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOPO (HERO SECTION) */}
      <HeroSection 
        vagasOcupadas={vagasOcupadas} 
        LIMITE_VAGAS={LIMITE_VAGAS} 
        scrollToForm={scrollToForm} 
        images={images} 
      />

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* COLUNA DA ESQUERDA (INFORMAÇÕES DO EVENTO) */}
          <EventInfo 
            images={images} 
            setSelectedImg={setSelectedImg} 
          />

          {/* COLUNA DA DIREITA (ÁREA INTERATIVA: INSCRIÇÃO OU PIX) */}
          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="lg:sticky lg:top-8 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              
              {telaAtual === 'pix' && dadosPix ? (
                <PixCheckout 
                  dadosPix={dadosPix}
                  participantes={participantesPix}
                  onNovaInscricao={() => window.location.reload()}
                />
              ) : (
                <Inscricao 
                  vagasOcupadas={vagasOcupadas}
                  verificandoVagas={verificandoVagas}
                  LIMITE_VAGAS={LIMITE_VAGAS}
                  onPixGerado={(dados, participantes) => {
                    setDadosPix(dados);
                    setParticipantesPix(participantes);
                    setTelaAtual('pix');
                  }}
                />
              )}

            </section>
          </div>

        </div>
      </main>

      {/* RODAPÉ */}
      <Footer />
    </div>
  );
};

export default App;