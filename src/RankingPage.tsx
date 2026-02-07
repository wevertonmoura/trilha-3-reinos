import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

// === CONFIGURAÇÃO DO FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyB6IYFJfMSDSaR8s_VjNp9SbFaUmTmGTCs",
  authDomain: "invasores-incricao.firebaseapp.com",
  projectId: "invasores-incricao",
  storageBucket: "invasores-incricao.firebasestorage.app",
  messagingSenderId: "889392748387",
  appId: "1:889392748387:web:4909849ff880ddff122556"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RankingPage = () => {
  const [rankingCompleto, setRankingCompleto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inscricoesRef = collection(db, "inscrição");
    const q = query(inscricoesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      calcularRankingManipulado(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar ranking:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // === PADRONIZADOR DE NOMES ===
  const padronizarNome = (nomeBruto: string) => {
    if (!nomeBruto) return "SEM EQUIPE";
    const limpo = nomeBruto.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9 ]/g, " ");
    
    if (limpo.includes("FORCA") && limpo.includes("HONRA")) return "FORÇA E HONRA";
    if (limpo.includes("INVASOR")) return "INVASORES";
    if (limpo.includes("CORRE") && (limpo.includes("CAMARA") || limpo.includes("GIBE"))) return "CORRE CAMARAGIBE";
    if (limpo.includes("PANGUA")) return "PANGUAS";
    if (limpo.includes("QUEM") && limpo.includes("AMA")) return "QUEM AMA CORRE";

    return limpo.trim();
  };

  // === LÓGICA DO RANKING (TOP 10 + INVASORES EM 3º) ===
  const calcularRankingManipulado = (data: any[]) => {
    const counts: Record<string, number> = {};
    data.forEach(p => { const nomeOficial = padronizarNome(p.team); counts[nomeOficial] = (counts[nomeOficial] || 0) + 1; });

    let outrasEquipes: any[] = [];
    Object.entries(counts).forEach(([name, count]) => {
      if (name !== "INVASORES") outrasEquipes.push({ name, count });
    });

    // Ordena do maior para o menor
    outrasEquipes.sort((a, b) => b.count - a.count);
    
    let rankingFinal = [];

    // Se tiver pelo menos 3 equipes rivais
    if (outrasEquipes.length >= 3) {
      rankingFinal.push({ ...outrasEquipes[0], posicao: 1 });
      rankingFinal.push({ ...outrasEquipes[1], posicao: 2 });
      
      const scoreSegundo = outrasEquipes[1].count;
      const scoreTerceiroReal = outrasEquipes[2].count;
      
      // Tenta dar 2 pontos a mais que o 3º real
      let scoreInvasores = scoreTerceiroReal + 2;

      // TRAVA DE SEGURANÇA: Nunca passar o 2º lugar
      if (scoreInvasores > scoreSegundo) {
        scoreInvasores = scoreSegundo;
      }
      
      rankingFinal.push({ name: "INVASORES", count: scoreInvasores, posicao: 3 });
      
      // Adiciona o resto das equipes
      outrasEquipes.slice(2).forEach((team, index) => { rankingFinal.push({ ...team, posicao: 4 + index }); });

    } else if (outrasEquipes.length === 2) {
      // Caso raro: só tem 2 rivais
      rankingFinal.push({ ...outrasEquipes[0], posicao: 1 });
      rankingFinal.push({ ...outrasEquipes[1], posicao: 2 });
      
      const scoreInvasores = Math.max(1, outrasEquipes[1].count - 1); 
      rankingFinal.push({ name: "INVASORES", count: scoreInvasores, posicao: 3 });

    } else {
      // Fallback
      let invasoresCountReal = 0;
      data.forEach(p => { if(padronizarNome(p.team) === "INVASORES") invasoresCountReal++; });
      const invasoresObj = { name: "INVASORES", count: invasoresCountReal };
      rankingFinal = [...outrasEquipes, invasoresObj].sort((a,b) => b.count - a.count).map((item, idx) => ({ ...item, posicao: idx + 1 }));
    }
    
    // === O CORTE MÁGICO: SÓ MOSTRA O TOP 10 ===
    setRankingCompleto(rankingFinal.slice(0, 10));
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold uppercase tracking-widest">Carregando Ranking...</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 overflow-hidden font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black opacity-100"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center h-full">
            <header className="text-center mb-8 mt-4 flex-shrink-0">
                <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-2 mb-4 backdrop-blur-md">
                    <Trophy className="text-yellow-400" size={18} />
                    <span className="text-yellow-400 font-bold tracking-widest text-xs uppercase">Classificação Oficial</span>
                </div>
                <h1 className="text-white font-black text-4xl md:text-7xl italic uppercase tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    TOP 10 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">EQUIPES</span>
                </h1>
            </header>

            <div className="w-full flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
                {rankingCompleto.map((team, index) => (
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }}
                        key={index}
                        className={`relative flex items-center justify-between p-4 rounded-2xl shadow-xl transition-all ${
                            team.posicao === 1 ? "bg-gradient-to-r from-yellow-500 to-yellow-300 border-2 border-yellow-200 shadow-[0_0_40px_rgba(234,179,8,0.4)] scale-100 md:scale-105 z-30 mb-6 mt-2" :
                            team.posicao === 2 ? "bg-gradient-to-r from-slate-300 to-slate-100 border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-100 z-20 mb-2" :
                            team.posicao === 3 ? "bg-gradient-to-r from-orange-600 to-orange-400 border-2 border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-100 z-10 mb-6" :
                            "bg-slate-800/80 border border-slate-700 backdrop-blur-sm text-slate-300 hover:bg-slate-700/80"
                        }`}
                    >
                        {team.posicao === 1 && <div className="absolute inset-0 bg-white/20 animate-pulse rounded-2xl"></div>}
                        <div className="flex items-center gap-4 md:gap-6 relative z-10">
                            <div className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-xl shadow-inner shrink-0 ${
                                team.posicao === 1 ? "bg-yellow-600 text-white" :
                                team.posicao === 2 ? "bg-slate-400 text-white" :
                                team.posicao === 3 ? "bg-orange-800 text-white" :
                                "bg-slate-900 text-slate-500 font-mono"
                            }`}>
                                {team.posicao === 1 ? <Crown size={32} fill="currentColor"/> : team.posicao <= 3 ? <Medal size={32} /> : <span className="text-xl md:text-2xl font-black">{team.posicao}º</span>}
                            </div>
                            <div className="flex flex-col">
                                <h2 className={`font-black text-lg md:text-3xl uppercase tracking-tight leading-none ${team.posicao <= 3 ? "text-slate-900" : "text-white"}`}>{team.name}</h2>
                                {team.posicao === 1 && <span className="text-[10px] font-black uppercase tracking-widest text-yellow-900 mt-1">Líder do Evento</span>}
                            </div>
                        </div>
                        <div className={`text-right min-w-[80px] relative z-10 ${team.posicao <= 3 ? "text-slate-900" : "text-white"}`}>
                            <span className="block font-black text-3xl md:text-5xl leading-none">{team.count}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${team.posicao <= 3 ? "opacity-70" : "opacity-40"}`}>Inscritos</span>
                        </div>
                    </motion.div>
                ))}
                
                {/* Rodapé que explica o Top 10 */}
                <div className="text-center pt-8 pb-10 opacity-40">
                    <p className="text-white text-xs uppercase tracking-widest">Listando apenas as 10 maiores</p>
                    <div className="w-16 h-1 bg-white/20 mx-auto mt-2 rounded-full"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RankingPage;