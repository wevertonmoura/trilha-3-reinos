import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Trophy, ChevronRight, Clock, Ticket, 
  Mountain, Droplets, Coffee, Loader2,
  AlertCircle, ShieldCheck, Plus, Trash2, Waves, Info, 
  VolumeX, Copy, QrCode, CheckCircle, X, Maximize2, 
  Instagram, Users, ArrowRight, Lock, ArrowLeft, Hourglass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Admin from './Admin';

// === FUNÇÃO DE VALIDAÇÃO MATEMÁTICA DE CPF ===
const validarCPF = (cpf: string) => {
  if (!cpf) return false;
  const strCPF = cpf.replace(/\D/g, ''); 
  
  if (strCPF.length !== 11 || /^(\d)\1{10}$/.test(strCPF)) return false; 
  
  let soma = 0;
  for (let i = 1; i <= 9; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(9, 10))) return false;
  
  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(10, 11))) return false;
  
  return true;
};

const Trilha3Reinos = () => {
  const [currentImg, setCurrentImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  
  const [telaAtual, setTelaAtual] = useState<'formulario' | 'pix' | 'login_admin' | 'admin'>('formulario');
  const [statusPagamento, setStatusPagamento] = useState<'pendente' | 'pago'>('pendente');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroLoginAdmin, setErroLoginAdmin] = useState('');

  // === SISTEMA DE TRAVA E LISTA DE ESPERA ===
  const LIMITE_VAGAS = 60;
  const [vagasOcupadas, setVagasOcupadas] = useState(0);
  const [verificandoVagas, setVerificandoVagas] = useState(true);
  const [listaEsperaNome, setListaEsperaNome] = useState('');
  const [listaEsperaFone, setListaEsperaFone] = useState('');
  const [entrouLista, setEntrouLista] = useState(false);

  // === LINKS ATUALIZADOS ===
  const linkGrupoGeral = "https://chat.whatsapp.com/H5DWJOz0wcC2PntYSq1t8y"; 
  const linkInstagram = "https://www.instagram.com/vem_para_trilha?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="; 
   
  const taxaPix = 1; // Taxa de transação de R$ 1,00

 // === LÓGICA DE PREÇOS (VOCÊ + 1 AMIGO) ===
  const calcularValorIngressos = (qtd: number) => {
    const pares = Math.floor(qtd / 2); 
    const avulsos = qtd % 2;           
    return (pares * 90) + (avulsos * 50); // ✅ CORRIGIDO
  };
  const formatarMoeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const [qrCodePix, setQrCodePix] = useState(''); 
  const [qrCodeImg, setQrCodeImg] = useState(''); 
  const [copiado, setCopiado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(900); 

  const [participants, setParticipants] = useState([
    { name: '', email: '', phone: '', cpf: '', emergencyName: '', emergencyPhone: '' }
  ]);

  const images = ["/foto1.jpg", "/foto2.jpg", "/foto3.jpg", "/foto4.jpg"];

  useEffect(() => {
    const fetchVagas = async () => {
      try {
        const res = await fetch('/api/checar-vagas');
        const data = await res.json();
        setVagasOcupadas(data.total || 0);
      } catch (err) {
        console.error("Erro ao checar vagas");
      } finally {
        setVerificandoVagas(false);
      }
    };
    fetchVagas();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setTelaAtual('login_admin'); 
    }
  }, []);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLoginAdmin('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaAdmin })
      });
      if (res.ok) setTelaAtual('admin');
      else setErroLoginAdmin('Senha incorreta.');
    } catch { setErroLoginAdmin('Erro de comunicação.'); }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentImg((prev) => (prev === images.length - 1 ? 0 : prev + 1)), 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    let timer: any;
    if (telaAtual === 'pix' && statusPagamento === 'pendente' && tempoRestante > 0) {
      timer = setInterval(() => setTempoRestante(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [telaAtual, statusPagamento, tempoRestante]);

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60).toString().padStart(2, '0');
    const s = (segundos % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // === CHECAGEM DE PAGAMENTO (POLLING) ===
  useEffect(() => {
    let intervalo: any;
    if (paymentId && statusPagamento === 'pendente' && telaAtual === 'pix') {
      intervalo = setInterval(async () => {
        try {
          const res = await fetch(`/api/checar-pagamento?paymentId=${paymentId}`);
          const data = await res.json();
          if (data.status === 'approved') {
            setStatusPagamento('pago');
            clearInterval(intervalo);
          }
        } catch (err) { console.error(err); }
      }, 3000);
    }
    return () => clearInterval(intervalo);
  }, [paymentId, statusPagamento, telaAtual]);

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

  const updateParticipant = (index: number, field: string, value: string) => {
    const newParticipants = [...participants];
    let v = value;
    if (field === 'phone' || field === 'emergencyPhone' || field === 'listaEsperaFone') {
      v = v.replace(/\D/g, "").slice(0, 11); 
      if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`; 
      if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`; 
    } else if (field === 'cpf') {
      v = v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    newParticipants[index] = { ...newParticipants[index], [field]: v };
    setParticipants(newParticipants);
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('inscricao')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleListaEspera = (e: React.FormEvent) => {
    e.preventDefault();
    if (listaEsperaNome.trim().length < 3 || listaEsperaFone.length < 14) {
      alert("Preencha seus dados corretamente!"); return;
    }
    const msg = `🚀 *LISTA VIP - TRILHA 3 REINOS* 🚀%0A%0A*Nome:* ${listaEsperaNome}%0A*WhatsApp:* ${listaEsperaFone}%0A%0AOlá! Vi que as vagas esgotaram. Gostaria de entrar na lista de espera caso alguém desista!`;
    window.open(`https://wa.me/5581994350798?text=${msg}`, '_blank');
    setEntrouLista(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (vagasOcupadas + participants.length > LIMITE_VAGAS) {
      setErrorMsg(`Infelizmente não temos vagas suficientes disponíveis agora.`);
      return;
    }

    // === VALIDAÇÕES ADAPTADAS ===
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      
      if (p.name.trim().length < 3) { 
        setErrorMsg(i === 0 ? `Preencha o nome do Titular.` : `Preencha o nome do Acompanhante ${i}.`); 
        return; 
      }
      
      if (i === 0) {
        if (p.phone.replace(/\D/g, '').length < 10) { 
          setErrorMsg(`WhatsApp incompleto no Titular.`); return; 
        }
        if (!validarCPF(p.cpf)) { 
          setErrorMsg(`⚠️ CPF Inválido! Verifique o número digitado pelo Titular.`); return; 
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) { setErrorMsg("Digite um e-mail válido."); return; }
        
        if (p.emergencyName.trim().length < 2 || p.emergencyPhone.replace(/\D/g, '').length < 10) { 
          setErrorMsg("Preencha corretamente os dados de Emergência (SOS)."); return; 
        }
      }
    }
    
    if (!termsAccepted) { 
      setErrorMsg("Aceite o termo de responsabilidade e regras de cancelamento."); 
      return; 
    }

    setLoading(true);
    setErrorMsg('');
    setStatusPagamento('pendente');

    try {
      const mainEmergency = `${participants[0].emergencyName} - ${participants[0].emergencyPhone}`;
      const mainEmail = participants[0].email;
      const valorTotal = Number((calcularValorIngressos(participants.length) + taxaPix).toFixed(2));

      const response = await fetch('/api/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantes: participants,
          valorTotal: valorTotal,
          emailPrincipal: mainEmail,
          contatoEmergencia: mainEmergency
        })
      });

      const mpData = await response.json();
      if (!response.ok) throw new Error(mpData.error || "Erro ao processar inscrição no servidor.");

      if (mpData.point_of_interaction?.transaction_data) {
        setQrCodePix(mpData.point_of_interaction.transaction_data.qr_code);
        setQrCodeImg(mpData.point_of_interaction.transaction_data.qr_code_base64);
        setPaymentId(mpData.id); 
        setTelaAtual('pix');
        setTempoRestante(900); 
      } else {
        throw new Error("Erro ao gerar o PIX. Verifique a configuração.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copiarPix = () => {
    navigator.clipboard.writeText(qrCodePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000); 
  };

  const reiniciarCompra = () => {
    window.location.reload();
  };

  if (telaAtual === 'login_admin') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none"></div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Lock size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Acesso Restrito</h2>
            </div>
            <form onSubmit={handleLoginAdmin} className="space-y-6">
              <div className="space-y-2">
                <input type="password" autoFocus placeholder="SENHA MESTRE" value={senhaAdmin} onChange={(e) => setSenhaAdmin(e.target.value)} className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-5 py-4 text-white text-center text-lg font-mono tracking-[0.2em] outline-none focus:border-emerald-500" />
              </div>
              {erroLoginAdmin && <div className="text-red-500 text-xs font-bold text-center animate-in shake">{erroLoginAdmin}</div>}
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-xs">Desbloquear Cofre</button>
            </form>
            <button onClick={() => setTelaAtual('formulario')} className="w-full mt-6 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><ArrowLeft size={12} /> Voltar</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (telaAtual === 'admin') return <Admin senha={senhaAdmin} formatarMoeda={formatarMoeda} fecharAdmin={() => setTelaAtual('formulario')} />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 overflow-x-hidden">
      <AnimatePresence>
        {selectedImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 cursor-pointer" onClick={() => setSelectedImg(null)}>
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><X size={32}/></button>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={selectedImg} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative h-[50vh] md:h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img key={currentImg} src={images[currentImg]} initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full object-cover" />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>
        <div className="container mx-auto px-6 pb-12 relative z-10">
          <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">Vem Para Trilha Apresenta</span>
          <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter mt-1 uppercase leading-none">Trilha <br/> <span className="text-emerald-500"> 3 Reinos</span></h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
            <a href="#inscricao" onClick={scrollToForm} className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-3 px-8 rounded-xl shadow-lg transition-all uppercase tracking-widest text-[10px]">
              {vagasOcupadas >= LIMITE_VAGAS ? 'Lista de Espera' : 'Garantir Ingresso'} <ChevronRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 md:px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-16">
            <section>
              <h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Descrição do evento</h2>
              <div className="space-y-6 text-zinc-400 text-lg leading-relaxed">
                <p className="text-white font-bold italic">Trilha Santuário Dos três reinos</p>
                <p>Precisa dar uma pausa na rotina? O projeto <span className="text-white font-bold text-emerald-500">Vem Para Trilha</span> preparou uma manhã de imersão completa na natureza para você respirar novos ares.</p>
                <p>Nossa rota foi cuidadosamente desenhada para unir o desafio da caminhada com a paz da contemplação. Venha gastar energia na trilha e fechar a experiência com um refrescante banho de rio. A oportunidade perfeita para renovar a mente e colecionar boas memórias.</p>
              </div>
              <div className="mt-10">
                <h2 className="text-xl font-black uppercase italic mb-6 text-zinc-500 tracking-widest">Explore o Cenário</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-lg border border-zinc-900" onClick={() => setSelectedImg(img)}>
                      <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Maximize2 className="text-white" size={24} /></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="col-span-full"><h2 className="text-2xl font-black uppercase italic mb-6 border-b border-zinc-900 pb-2 text-zinc-500">Sobre o evento</h2></div>
              <InfoRow icon={<Calendar />} title="Data" text="14 de Junho de 2026" />
              <InfoRow icon={<Clock />} title="Horário" text="07:00 às 12:00" />
              <a href="https://www.google.com/maps/place/?q=place_id:ChIJ4-tYpb8RqwcRxSQFPEP7it4" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity"><InfoRow icon={<MapPin className="text-emerald-500" />} title="Localização" text="Guabiraba, Recife - PE" /></a>
              <InfoRow icon={<Trophy />} title="Investimento" text="R$ 50 Individual | R$ 90 (Você + 1 Amigo)" />
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
                
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 flex gap-5 col-span-1 md:col-span-2 shadow-inner">
                  <ShieldCheck className="text-red-500 shrink-0" size={32}/>
                  <div>
                    <h4 className="font-bold text-red-500 uppercase text-sm mb-2 tracking-widest">Acesso Restrito (Sem Penetra)</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">A área do evento é uma <strong className="text-white">propriedade privada</strong>. Somente pessoas com o nome na lista oficial de pagantes poderão entrar. <strong>Não será permitida a entrada de pessoas não inscritas</strong> sob nenhuma hipótese.</p>
                  </div>
                </div>

                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><Ticket className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Investimento</h4><p className="text-sm text-zinc-400 leading-relaxed">O valor da inscrição é de <strong className="text-emerald-500">R$ 50,00 (Individual) ou R$ 90,00 (Você + 1 Amigo)</strong>. Vagas limitadas.</p></div></div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><VolumeX className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Som e Natureza</h4><p className="text-sm text-zinc-400 leading-relaxed">Não é permitido o uso de caixas de som em volume alto.</p></div></div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><QrCode className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Pagamento via PIX</h4><p className="text-sm text-zinc-400 leading-relaxed">Confirmação automática via PIX. Acréscimo de taxa de <strong className="text-emerald-500">R$ 1,00</strong>.</p></div></div>
                <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700/50 flex gap-5"><Coffee className="text-emerald-500 shrink-0" size={32}/><div><h4 className="font-bold text-white uppercase text-sm mb-2 tracking-widest">Café Coletivo</h4><p className="text-sm text-zinc-400 leading-relaxed">Pedimos que cada participante leve um item para compartilhar.</p></div></div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1 mt-10 lg:mt-0">
            <section id="inscricao" className="lg:sticky lg:top-8 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-[2.5rem] p-6 md:p-10 shadow-2xl">
              
              {/* ESTADO 1: VERIFICANDO VAGAS */}
              {verificandoVagas ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                  <Loader2 className="animate-spin text-emerald-500 mb-4" size={40} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Verificando Vagas...</p>
                </div>
              ) : 
              
              /* ESTADO 2: VAGAS ESGOTADAS -> LISTA DE ESPERA VIP */
              vagasOcupadas >= LIMITE_VAGAS && telaAtual === 'formulario' ? (
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
                          Entrar na Lista VIP <ChevronRight size={16}/>
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
              ) : 
              
              /* ESTADO 3: FORMULÁRIO NORMAL DE COMPRA */
              telaAtual === 'formulario' ? (
                <>
                  <div className="text-center mb-10 relative">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">INSCRIÇÃO</h2>
                    <p className="text-emerald-500 text-sm font-bold mt-2 tracking-widest">R$ 50 INDIVIDUAL | R$ 90 VOCÊ + 1 AMIGO</p>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* === FORMULÁRIO DINÂMICO PARA TITULAR E ACOMPANHANTES === */}
                    {participants.map((participant, index) => (
                      <div key={index} className="p-6 rounded-3xl bg-zinc-800/40 border border-zinc-700/50 relative shadow-inner overflow-hidden">
                        
                        {/* Etiqueta colorida no canto para separar Titular de Acompanhante */}
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

                          {/* DADOS SENSÍVEIS (WHATSAPP, CPF, EMAIL E EMERGÊNCIA) SÓ PARA O TITULAR */}
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
                       <button type="button" onClick={addParticipant} className="w-full py-4 border-2 border-dashed border-zinc-600 rounded-2xl text-zinc-400 font-bold hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"><Plus size={16} /> Comprar Ingresso Extra (Acompanhante)</button>
                    )}

                    <label className="flex items-start gap-3 pt-6 border-t border-zinc-700/50 cursor-pointer group">
                      <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer rounded shrink-0 group-hover:ring-2 ring-emerald-500/50 transition-all" />
                      <span className="text-[11px] text-zinc-400 font-bold leading-relaxed select-none group-hover:text-zinc-300 transition-colors">
                        Aceito o Termo de Responsabilidade (declaro estar em boas condições de saúde) e estou ciente de que NÃO haverá devolução ou reembolso do valor pago sob nenhuma hipótese.
                      </span>
                    </label>

                    {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2"><AlertCircle size={14}/> {errorMsg}</div>}
                    
                    <button disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-5 rounded-2xl shadow-xl transition-all uppercase tracking-widest flex items-center justify-center gap-3 text-sm mt-4">
                      {loading ? <Loader2 className="animate-spin" /> : <>Finalizar Inscrição (R$ {formatarMoeda(calcularValorIngressos(participants.length) + taxaPix)}) <ChevronRight size={20} /></>}
                    </button>
                  </form>
                </>
              ) : (
                /* ESTADO 4: TELA DO PIX OU SUCESSO */
                <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  {statusPagamento === 'pago' ? (
                    <div className="py-2 space-y-6 flex flex-col items-center">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <CheckCircle size={40} className="text-white" />
                      </div>
                      <h2 className="text-3xl font-black uppercase italic text-white tracking-tighter">Pagamento <br /> Confirmado!</h2>
                      <p className="text-zinc-400 font-bold text-sm max-w-xs mx-auto">
                        O comprovante e os detalhes da sua inscrição foram enviados para o e-mail: <strong className="text-emerald-500">{participants[0].email}</strong>
                      </p>

                      {/* CARTÕES DA COMPRA ATUAL */}
                      <div className="space-y-4 text-left w-full max-w-md mx-auto pt-4 pb-2">
                        {participants.map((p, index) => (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.2 }} key={index} 
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

                      <button onClick={reiniciarCompra} className="mt-8 px-6 py-3 border border-zinc-700 hover:border-emerald-500 rounded-xl text-zinc-400 hover:text-emerald-500 text-xs font-bold uppercase tracking-widest transition-all">
                        Fazer Nova Inscrição
                      </button>
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
                        <p className="text-5xl font-black text-white tracking-tighter">R$ {formatarMoeda(calcularValorIngressos(participants.length) + taxaPix)}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-zinc-950 p-2 pl-4 rounded-xl border border-zinc-700/50">
                          <span className="text-xs font-mono text-zinc-300 truncate w-full text-left">{qrCodePix}</span>
                          <button onClick={copiarPix} className={`px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 shrink-0 transition-all ${copiado ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
                            {copiado ? <CheckCircle size={14} /> : <Copy size={14} />} 
                            {copiado ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                        {tempoRestante > 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 mt-4">
                            <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold animate-pulse">Aguardando pagamento...</p>
                            <div className="flex items-center gap-2 text-2xl font-mono bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-white"><Clock size={20} className="text-emerald-500" /><span>{formatarTempo(tempoRestante)}</span></div>
                            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Tempo para o PIX expirar</p>
                          </div>
                        ) : (
                          <div className="text-red-500 font-bold text-xs mt-4 bg-red-500/10 p-4 rounded-xl border border-red-500/30">Tempo expirado! Por favor, recarregue a página e gere uma nova inscrição.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* RODAPÉ ESCURO COM LINKS ATUALIZADOS */}
      <footer className="bg-zinc-950 pt-12 pb-6 border-t border-zinc-900 relative overflow-hidden mt-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-sm"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          
          <div className="max-w-md mx-auto mb-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <h4 className="text-white font-black uppercase tracking-widest mb-4 flex items-center justify-center gap-2 text-sm">
              Faça parte da família <Users size={16} className="text-emerald-500"/>
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkInstagram} target="_blank" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest">
                <Instagram size={16} /> Siga no Insta
              </motion.a>
              
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkGrupoGeral} target="_blank" className="flex-1 bg-emerald-600 text-white font-black py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.996 0A11.96 11.96 0 0 0 0 11.996c0 2.115.548 4.14 1.59 5.955L.003 24l6.19-1.62A11.956 11.956 0 0 0 11.996 24C18.625 24 24 18.625 24 11.996 24 5.367 18.625 0 11.996 0zM7.202 5.86c.218-.01.442-.016.666-.016.27 0 .618.01.9.52.316.57 1.018 2.476 1.107 2.665.09.19.16.42-.03.65-.188.22-.26.33-.518.65-.258.31-.54.67-.77.905-.258.26-.528.53-.228 1.04.3.5 1.34 2.21 2.89 3.58 2.008 1.77 3.658 2.33 4.198 2.56.54.23.86.19 1.17-.13.31-.32 1.34-1.57 1.7-2.11.36-.54.72-.45 1.21-.26.5.19 3.16 1.49 3.7 1.76.54.26.9.39 1.03.6.13.22.13 1.26-.35 2.48-.48 1.22-2.82 2.38-3.9 2.45-1.07.07-2.22.4-6.35-1.22-4.9-1.92-8.08-6.9-8.33-7.23-.25-.33-1.98-2.65-1.98-5.06s1.22-3.6 1.66-4.06c.44-.45 1.05-.58 1.54-.58z"/>
                </svg>
                Entra no Grupo
              </motion.a>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 border-t border-zinc-900/80 pt-6">
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">© 2026 Trilha 3 Reinos. Todos os direitos reservados.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="py-2 px-6 rounded-full bg-zinc-900/50 border border-zinc-800 text-emerald-500 font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors">Voltar ao Topo <ArrowRight className="-rotate-90 w-3 h-3" /></button>
          </div>
        </div>
      </footer>
    </div>
  );
};

const InfoRow = ({ icon, title, text }: any) => (
  <div className="flex items-start gap-5">
    <div className="text-emerald-500 mt-1">{icon}</div>
    <div>
      <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{title}</h4>
      <p className="text-white font-bold text-xl leading-tight">{text}</p>
    </div>
  </div>
);

const CheckItem = ({ text, icon }: any) => (
  <div className="flex items-center gap-3 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800 shadow-sm">
    <span className="text-emerald-500 shrink-0">{icon}</span>
    <span className="text-xs font-bold text-zinc-300">{text}</span>
  </div>
);

export default Trilha3Reinos;