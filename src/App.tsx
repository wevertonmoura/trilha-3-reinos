import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, ChevronRight, Clock, Ticket, AlertTriangle, Mountain, Droplets, Coffee, Loader2, AlertCircle, ShieldCheck, Plus, Trash2, Waves, Info, VolumeX, Copy, QrCode, CheckCircle, MessageCircle, X, Maximize2, Instagram, Users, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// === CONFIGURAÇÃO DO SUPABASE ===
const supabaseUrl = 'https://moqhjiesavnivkancxpz.supabase.co';
const supabaseKey = 'sb_publishable_X5iKQonjycmsEMfeePTsyg_OkKp5ts-';
const supabase = createClient(supabaseUrl, supabaseKey);

const Trilha3Reinos = () => {
  // === ESTADOS DO SISTEMA ===
  const [showSplash, setShowSplash] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix'>('formulario');
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pendente');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  // === LINKS E VALORES ===
  const mpAccessToken = 'APP_USR-3160159209203933-021923-32fa49b9baf1895da22c8725bb046484-690601631'; 
  const linkGrupoWhats = "https://chat.whatsapp.com/JiSGu7PT6S3Ds3h6ZObqdd"; // Grupo VIP (Pós-pagamento)
  const linkGrupoGeral = "https://chat.whatsapp.com/BEjOT8bcJkZB8D8Krzxr3R"; // Grupo Geral (Rodapé)
  const linkInstagram = "https://www.instagram.com/invasores_081?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="; 
  
  const valorIngresso = 20; 
  const taxaPix = 0.20; 

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const [qrCodePix, setQrCodePix] = useState(''); 
  const [qrCodeImg, setQrCodeImg] = useState(''); 
  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', emergency: '' }
  ]);

  const images = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];

  // EFEITOS (Splash e Carrossel)
  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1)), 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  // VIGIA DO PAGAMENTO MERCADO PAGO
  useEffect(() => {
    let intervalo: any;
    if (paymentId && statusPagamento === 'pendente' && telaAtual === 'pix') {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${mpAccessToken}` }
          });
          const data = await res.json();
          if (data.status === 'approved') {
            setStatusPagamento('pago');
            clearInterval(intervalo);
          }
        } catch (err) {
          console.error("Erro ao checar status:", err);
        }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [paymentId, statusPagamento, telaAtual, mpAccessToken]);

  // FUNÇÕES DE MANIPULAÇÃO DE PARTICIPANTES
  const addParticipant = () => setParticipants([...participants, { name: '', email: '', phone: '', emergency: '' }]);
  
  const removeParticipant = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  // MÁSCARA DO WHATSAPP APLICADA AQUI
  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    
    if (field === 'phone') {
      let v = value.replace(/\D/g, ""); 
      if (v.length > 11) v = v.slice(0, 11); 
      if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`; 
      if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`; 
      newParticipants[index] = { ...newParticipants[index], [field]: v };
    } else {
      newParticipants[index] = { ...newParticipants[index], [field]: value };
    }
    
    setParticipants(newParticipants);
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth' });
  };

  // FUNÇÃO DE SUBMIT COM VALIDAÇÃO
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validação Inteligente
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (p.name.trim().length < 3) {
        setErrorMsg(`Preencha o nome completo do Participante ${i + 1}.`);
        return;
      }
      if (p.phone.replace(/\D/g, '').length < 10) {
        setErrorMsg(`WhatsApp incompleto no Participante ${i + 1}.`);
        return;
      }
      if (i === 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) {
          setErrorMsg("Digite um e-mail válido (ex: seu@email.com).");
          return;
        }
        if (p.emergency.trim().length < 5) {
          setErrorMsg("Preencha o Contato de Emergência (Nome + Telefone).");
          return;
        }
      }
    }

    // 2. Termos
    if (!termsAccepted) {
      setErrorMsg("Aceite o termo de responsabilidade.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const mainEmergency = participants[0].emergency;
      const mainEmail = participants[0].email;
      const valorTotal = (participants.length * valorIngresso) + taxaPix; 

      const promises = participants.map(p => 
        supabase.from('inscricao_trilha').insert([{ 
          nome: p.name, 
          email: p.email || mainEmail, 
          telefone: p.phone,
          contato_emergencia: mainEmergency,
          evento: "Trilha Santuário Dos três reinos", 
          data_evento: "2026-03-22" 
        }])
      );
      await Promise.all(promises);
      
      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: valorTotal,
          email: mainEmail,
          nome: participants[0].name
        })
      });

      const mpData = await response.json();

      if (mpData.point_of_interaction?.transaction_data) {
        setQrCodePix(mpData.point_of_interaction.transaction_data.qr_code);
        setQrCodeImg(mpData.point_of_interaction.transaction_data.qr_code_base64);
        setPaymentId(mpData.id); 
        setTelaAtual('pix');
      } else {
        setErrorMsg("Erro ao gerar o PIX. Verifique a configuração.");
      }
      
    } catch (err) {
      setErrorMsg("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(qrCodePix);
    alert('Código PIX copiado!');
  };

  // === RENDERIZAÇÃO DA TELA ===
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 overflow-x-hidden">
      
      {/* SPLASH SCREEN */}
      <AnimatePresence>
        {showSplash && (
          <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="fixed inset-0 z-[999] bg-zinc-950 flex flex-col items-center justify-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <img src="/logo.png" alt="Invasores" className="w-40 h-40 object-cover rounded-full border-4 border-zinc-900 shadow-[0_0_25px_rgba(16,185,129,0.3)]" />
              <div className="mt-6 flex gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img key={currentImg} src={images[currentImg]} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full object-cover" />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>
        <div className="container mx-auto px-6 pb-12 relative z-10">
          <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">Invasores Apresenta</span>
          <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter mt-1 uppercase leading-none">Trilha <br/> <span className="text-emerald-500">3 Reinos</span></h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
            <a href="#inscricao" onClick={scrollToForm} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px]">
              Garantir Ingresso <ChevronRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Descrição do evento</h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p className="text-white font-bold italic">Trilha Santuário Dos três reinos</p>
                <p>O grupo <span className="text-white font-bold text-emerald-500">Invasores</span> convida você para uma manhã de imersão total na natureza, explorando as belas paisagens da região.</p>
                <p>Esta é a oportunidade perfeita para sair da rotina, respirar ar puro e se reconectar. Nossa trilha foi planejada para proporcionar uma experiência energizante, e como recompensa, um refrescante banho de rio para lavar a alma e renovar as energias.</p>
              </div>

              <div className="mt-10">
                <h2 className="text-xl font-black uppercase italic mb-6 text-zinc-500 tracking-widest">Explore o Cenário</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg border border-zinc-900" onClick={() => setSelectedImg(img)}>
                      <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="text-white" size={24} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="col-span-full"><h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Sobre o evento</h2></div>
              <InfoRow icon={<Calendar />} title="Data" text="22 de Março de 2026" />
              <InfoRow icon={<Clock />} title="Horário" text="07:00 às 12:00" />
              <a href="https://www.google.com/maps/place/?q=place_id:ChIJ4-tYpb8RqwcRxSQFPEP7it4" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <InfoRow icon={<MapPin className="text-emerald-500" />} title="Localização" text="Guabiraba, Recife - PE" />
              </a>
              <InfoRow icon={<Trophy />} title="Investimento" text={`R$ ${valorIngresso},00 por pessoa`} />
            </section>

            <section>
              <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">O QUE LEVAR? (RECOMENDAÇÕES)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CheckItem icon={<Droplets />} text="Água (pelo menos 1,5 litro)" />
                <CheckItem icon={<ShieldCheck />} text="Protetor solar e repelente" />
                <CheckItem icon={<Waves />} text="Roupa de banho e toalha" />
                <CheckItem icon={<Info />} text="Boné ou chapéu" />
                <CheckItem icon={<Mountain />} text="Calçados confortáveis" />
                <CheckItem icon={<Trash2 />} text="Sacola para seu lixo" />
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-black uppercase italic mb-6 text-emerald-500 tracking-tighter">INFORMAÇÕES IMPORTANTES</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <Ticket className="text-emerald-500 shrink-0" size={32}/>
                  <div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Investimento</h4><p className="text-sm text-zinc-400 leading-relaxed">O valor da inscrição é de <strong className="text-emerald-500">R$ 20,00 por pessoa</strong>. Vagas limitadas.</p></div>
                </div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <VolumeX className="text-emerald-500 shrink-0" size={32}/>
                  <div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Som e Natureza</h4><p className="text-sm text-zinc-400 leading-relaxed">Não é permitido o uso de caixas de som em volume alto.</p></div>
                </div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <QrCode className="text-emerald-500 shrink-0" size={32}/>
                  <div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Pagamento via PIX</h4><p className="text-sm text-zinc-400 leading-relaxed">Confirmação automática via PIX. Acréscimo de taxa de <strong className="text-emerald-500">R$ 0,20</strong>.</p></div>
                </div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <Coffee className="text-emerald-500 shrink-0" size={32}/>
                  <div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Café Coletivo</h4><p className="text-sm text-zinc-400 leading-relaxed">Pedimos que cada participante leve um item para compartilhar.</p></div>
                </div>
                <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 flex gap-5">
                  <AlertTriangle className="text-red-500 shrink-0" size={32}/>
                  <div><h4 className="font-bold text-red-500 uppercase text-sm mb-2 tracking-widest">Segurança</h4><p className="text-sm text-zinc-400 leading-relaxed">Siga sempre as instruções dos organizadores Invasores.</p></div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="lg:sticky lg:top-8 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              {telaAtual === 'formulario' ? (
                <>
                  <div className="text-center mb-10">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">INSCRIÇÃO</h2>
                    <p className="text-emerald-500 text-sm font-bold mt-2 tracking-widest">R$ 20,00 POR PESSOA</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {participants.map((participant, index) => (
                      <div key={index} className="p-6 rounded-3xl bg-zinc-800/40 border border-zinc-700/50 relative shadow-inner">
                        {index > 0 && (
                          <div className="flex justify-between items-center mb-6">
                            <button type="button" onClick={() => removeParticipant(index)} className="text-zinc-500 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                          </div>
                        )}
                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nome Completo</label>
                            <input type="text" value={participant.name} onChange={e => updateParticipant(index, 'name', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Ex: João Silva" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                            <input type="tel" value={participant.phone} onChange={e => updateParticipant(index, 'phone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 9...." />
                          </div>
                          {index === 0 && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">E-mail</label>
                                <input type="email" value={participant.email} onChange={e => updateParticipant(index, 'email', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="seu@gmail.com" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Contato de Emergência</label>
                                <input type="text" value={participant.emergency} onChange={e => updateParticipant(index, 'emergency', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Nome + Telefone" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
                      <Plus size={16} /> Comprar outro ingresso
                    </button>

                    <div className="flex items-start gap-3 pt-6 border-t border-zinc-700/50">
                      <input type="checkbox" id="terms" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer rounded" />
                      <label htmlFor="terms" className="text-[11px] text-zinc-400 font-bold leading-relaxed cursor-pointer select-none">
                        Aceito o Termo de Responsabilidade: declaro estar em boas condições de saúde.
                      </label>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold flex items-center gap-2">
                        <AlertCircle size={14}/> {errorMsg}
                      </div>
                    )}

                    <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
                      {loading ? <Loader2 className="animate-spin" /> : <>Finalizar (R$ {formatarMoeda((participants.length * valorIngresso) + taxaPix)}) <ChevronRight size={20} /></>}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  {statusPagamento === 'pago' ? (
                    <div className="py-10 space-y-6">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]"><CheckCircle size={40} className="text-white" /></div>
                      <h2 className="text-2xl font-black uppercase italic">Vaga Garantida!</h2>
                      <p className="text-zinc-400 text-sm">Seu pagamento foi aprovado. Entre no grupo oficial da trilha:</p>
                      <a href={linkGrupoWhats} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full bg-[#25D366] p-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transform hover:scale-105 transition-all"><MessageCircle size={20} /> Entrar no Grupo Oficial</a>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2"><QrCode className="text-emerald-500 w-10 h-10" /></div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Escaneie o PIX</h2>
                      </div>
                      {qrCodeImg && (
                        <div className="flex justify-center my-6"><div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/30"><img src={`data:image/jpeg;base64,${qrCodeImg}`} alt="PIX" className="w-48 h-48 rounded-lg" /></div></div>
                      )}
                      <div className="bg-zinc-800/40 border border-emerald-500/30 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                        <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Valor total</p>
                        <p className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda((participants.length * valorIngresso) + taxaPix)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-4 rounded-xl border border-zinc-700/50">
                          <span className="text-xs font-mono text-zinc-300 truncate w-full text-left">{qrCodePix}</span>
                          <button onClick={copiarPix} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0"><Copy size={14} /> Copiar</button>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-500 uppercase font-bold animate-pulse"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div>Aguardando pagamento...</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-zinc-950 pt-12 pb-6 border-t border-zinc-900 relative overflow-hidden mt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-sm"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-md mx-auto bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-8 backdrop-blur-sm relative overflow-hidden group">
            <h4 className="text-white font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2 text-sm">Faça parte da família <Users size={16} className="text-emerald-500"/></h4>
            <p className="text-zinc-400 text-xs mb-6 px-2 leading-relaxed">Acompanhe nossa rotina, tire dúvidas e venha correr com a gente. <br/><span className="text-emerald-500 font-bold mt-2 block">#Invasores </span></p>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkInstagram} target="_blank" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest"><Instagram size={16} /> Siga no Insta</motion.a>
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkGrupoGeral} target="_blank" className="flex-1 bg-emerald-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest"><MessageCircle size={16} /> Entra no Grupo</motion.a>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 border-t border-zinc-900/80 pt-6">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Grupo Invasores. Todos os direitos reservados.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="py-2 px-6 rounded-full bg-zinc-900/50 border border-zinc-800 text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors">Voltar ao Topo <ArrowRight className="-rotate-90 w-3 h-3" /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// COMPONENTES AUXILIARES
const InfoRow = ({ icon, title, text }: any) => (
  <div className="flex items-start gap-5">
    <div className="mt-1 text-emerald-500">{icon}</div>
    <div><h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">{title}</h4><p className="text-white font-bold text-xl leading-tight">{text}</p></div>
  </div>
);

const CheckItem = ({ text, icon }: any) => (
  <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
    <span className="text-emerald-500 shrink-0">{icon}</span><span className="text-xs font-bold text-zinc-300">{text}</span>
  </div>
);

export default Trilha3Reinos;