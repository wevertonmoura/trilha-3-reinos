import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, ChevronRight, Clock, Ticket, AlertTriangle, Mountain, Droplets, Coffee, Loader2, AlertCircle, ShieldCheck, Plus, Trash2, Waves, Info, VolumeX, Copy, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

// === CONFIGURAÇÃO DO SUPABASE ===
const supabaseUrl = 'https://moqhjiesavnivkancxpz.supabase.co';
const supabaseKey = 'sb_publishable_X5iKQonjycmsEMfeePTsyg_OkKp5ts-';
const supabase = createClient(supabaseUrl, supabaseKey);

const Trilha3Reinos = () => {
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix'>('formulario');
  
  // === DADOS DO MERCADO PAGO ===
  const mpAccessToken = 'APP_USR-COLE_SEU_TOKEN_AQUI'; 

  const [qrCodePix, setQrCodePix] = useState(''); 
  const [qrCodeImg, setQrCodeImg] = useState(''); 

  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', emergency: '' }
  ]);

  const images = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];
  const valorIngresso = 20; 
  const mapsUrl = "https://maps.app.goo.gl/m43fPvDdkKRoNGjs8";

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '', phone: '', emergency: '' }]);
  };

  const removeParticipant = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = { ...newParticipants[index], [field]: value };
    setParticipants(newParticipants);
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setErrorMsg("Aceite o termo de responsabilidade.");
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const mainEmergency = participants[0].emergency;
      const mainEmail = participants[0].email;
      const valorTotal = participants.length * valorIngresso;

      const promises = participants.map(p => 
        supabase.from('inscricao_trilha').insert([{ 
          nome: p.name, 
          email: p.email || mainEmail, 
          telefone: p.phone,
          contato_emergencia: mainEmergency,
          evento: "Trilha 3 Reinos", 
          data_evento: "2026-03-21" 
        }])
      );
      await Promise.all(promises);
      
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': Date.now().toString()
        },
        body: JSON.stringify({
          transaction_amount: valorTotal,
          description: `Trilha 3 Reinos - ${participants.length} Ingressos`,
          payment_method_id: 'pix',
          payer: {
            email: mainEmail,
            first_name: participants[0].name
          }
        })
      });

      const mpData = await mpResponse.json();

      if (mpData.point_of_interaction?.transaction_data) {
        setQrCodePix(mpData.point_of_interaction.transaction_data.qr_code);
        setQrCodeImg(mpData.point_of_interaction.transaction_data.qr_code_base64);
        setTelaAtual('pix');
      } else {
        setErrorMsg("Erro ao gerar o PIX. Verifique o Access Token.");
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500">
      
      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img key={currentImg} src={images[currentImg]} initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full object-cover" />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
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

      <main className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 lg:gap-12">
          
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Descrição do evento</h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p className="text-white font-bold italic">Trilha Invasores - 3 reino!</p>
                <p>O grupo <span className="text-white font-bold text-emerald-500">Invasores</span> convida você para uma manhã de imersão total na natureza, explorando as belas paisagens da região de Aldeia.</p>
                <p>Esta é a oportunidade perfeita para sair da rotina, respirar ar puro e se reconectar. Nossa trilha foi planejada para proporcionar uma experiência energizante, culminando em um refrescante banho de rio para lavar a alma e renovar as energias.</p>
                <p>Chame seus amigos, traga sua melhor energia e venha curtir um domingo diferente com a gente!</p>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="col-span-full">
                <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Sobre o evento</h2>
              </div>
              <InfoRow icon={<Calendar />} title="Data" text="21 de Março de 2026" />
              <InfoRow icon={<Clock />} title="Horário" text="07:30 às 12:00" />
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <InfoRow icon={<MapPin className="text-emerald-500" />} title="Endereço" text="Rua 01, Camaragibe - PE" />
              </a>
              <InfoRow icon={<Trophy />} title="Investimento" text={`R$ ${valorIngresso},00 por pessoa`} />
            </section>

            <hr className="border-zinc-900" />

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
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Investimento</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">O valor da inscrição é de <strong className="text-emerald-500">R$ 20,00 por pessoa</strong>. As vagas são limitadas para garantir a organização do grupo.</p>
                  </div>
                </div>

                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <VolumeX className="text-emerald-500 shrink-0" size={32}/>
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Som e Natureza</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">Não é permitido o uso de caixas de som em volume alto. Nosso objetivo é curtir a tranquilidade.</p>
                  </div>
                </div>

                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5">
                  <Coffee className="text-emerald-500 shrink-0" size={32}/>
                  <div>
                    <h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Café Coletivo</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">Pedimos que cada participante leve um item para compartilhar.</p>
                  </div>
                </div>

                <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 flex gap-5">
                  <AlertTriangle className="text-red-500 shrink-0" size={32}/>
                  <div>
                    <h4 className="font-bold text-red-500 uppercase text-sm mb-2 tracking-widest">Segurança Obrigatória</h4>
                    <p className="text-sm text-zinc-400 leading-relaxed">Siga sempre as instruções dos organizadores Invasores.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="sticky top-8 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
              {telaAtual === 'formulario' ? (
                <>
                  <div className="text-center mb-10">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">INSCRIÇÃO</h2>
                    <p className="text-emerald-500 text-sm font-bold mt-2 tracking-widest">R$ 20,00 POR PESSOA</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {participants.map((participant, index) => (
                      <div key={index} className="p-6 rounded-3xl bg-zinc-800/40 border border-zinc-700/50 relative shadow-inner">
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            {index === 0 ? "Comprador Principal" : `Participante ${index + 1}`}
                          </span>
                          {index > 0 && (
                            <button type="button" onClick={() => removeParticipant(index)} className="text-zinc-500 hover:text-red-500 transition-colors p-1">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Nome Completo</label>
                            <input type="text" required value={participant.name} onChange={e => updateParticipant(index, 'name', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Ex: João Silva" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">WhatsApp</label>
                            <input type="tel" required value={participant.phone} onChange={e => updateParticipant(index, 'phone', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="(81) 9...." />
                          </div>
                          {index === 0 && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">E-mail para Confirmação</label>
                                <input type="email" required value={participant.email} onChange={e => updateParticipant(index, 'email', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="seu@gmail.com" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400 ml-1">Contato de Emergência</label>
                                <input type="text" required value={participant.emergency} onChange={e => updateParticipant(index, 'emergency', e.target.value)} className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 focus:border-emerald-500 outline-none font-bold text-sm text-white transition-all shadow-sm" placeholder="Nome + Telefone" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest">
                      <Plus size={16} /> Comprar outro ingresso
                    </button>

                    <div className="flex items-start gap-3 pt-6 border-t border-zinc-700/50">
                      <input type="checkbox" id="terms" required checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer rounded" />
                      <label htmlFor="terms" className="text-[11px] text-zinc-400 font-bold leading-relaxed cursor-pointer select-none">
                        Aceito o Termo de Responsabilidade: declaro estar em boas condições de saúde.
                      </label>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold flex items-center gap-2">
                        <AlertCircle size={14}/> {errorMsg}
                      </div>
                    )}

                    <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
                      {loading ? <Loader2 className="animate-spin" /> : <>Finalizar compra (R$ {participants.length * valorIngresso},00) <ChevronRight size={20} /></>}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                      <QrCode className="text-emerald-500 w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Escaneie o PIX</h2>
                  </div>

                  {qrCodeImg && (
                    <div className="flex justify-center my-6">
                      <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500/30">
                        <img src={`data:image/jpeg;base64,${qrCodeImg}`} alt="PIX" className="w-48 h-48 rounded-lg" />
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-800/40 border border-emerald-500/30 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                    <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-2">Valor total</p>
                    <p className="text-5xl font-black text-white tracking-tighter">R$ {participants.length * valorIngresso},00</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-4 rounded-xl border border-zinc-700/50">
                      <span className="text-xs font-mono text-zinc-300 truncate w-full text-left">{qrCodePix}</span>
                      <button onClick={copiarPix} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0">
                        <Copy size={14} /> Copiar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center opacity-20">
        <span className="text-zinc-500 font-black italic text-4xl tracking-tighter uppercase">Invasores</span>
      </footer>
    </div>
  );
};

const InfoRow = ({ icon, title, text }: any) => (
  <div className="flex items-start gap-5">
    <div className="mt-1 text-emerald-500">{icon}</div>
    <div>
      <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">{title}</h4>
      <p className="text-white font-bold text-xl leading-tight">{text}</p>
    </div>
  </div>
);

const CheckItem = ({ text, icon }: any) => (
  <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
    <span className="text-emerald-500 shrink-0">{icon}</span>
    <span className="text-xs font-bold text-zinc-300">{text}</span>
  </div>
);

export default Trilha3Reinos;