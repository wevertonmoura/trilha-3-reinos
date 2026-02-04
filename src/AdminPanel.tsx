import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Trophy, Activity, ArrowLeft, Search, Users, X, RotateCcw } from 'lucide-react';

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

const AdminPanel = () => {
  const [inscritos, setInscritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  
  // Estado auxiliar para forçar a atualização
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true); // Mostra carregando ao atualizar
    const inscricoesRef = collection(db, "inscrição");
    const q = query(inscricoesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Ordena do mais novo para o mais antigo
      const ordenados = data.sort((a, b) => Number(b.numero_inscricao) - Number(a.numero_inscricao));
      
      setInscritos(ordenados);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshKey]); // O useEffect roda de novo quando o refreshKey muda

  // Função do Botão Atualizar
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Filtro de Pesquisa
  const inscritosFiltrados = inscritos.filter((item) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    const equipe = (item.team || "Sem Equipe").toLowerCase();
    return equipe.includes(termo);
  });

  return (
    <div className="min-h-screen bg-blue-950 p-4 font-sans text-white selection:bg-yellow-400 selection:text-blue-900">
      <div className="max-w-4xl mx-auto">
        
        {/* === CABEÇALHO === */}
        <header className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 border-b border-blue-800 pb-6 pt-4 gap-4">
          <div className="flex items-center gap-4">
            <div>
                <div className="flex items-center gap-2 text-yellow-400 mb-1">
                    <Trophy size={24} />
                    <h1 className="font-black text-3xl uppercase italic tracking-tighter">Painel ADM</h1>
                </div>
                <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Gestão de Equipes</p>
            </div>
            
            {/* BOTÃO ATUALIZAR */}
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="bg-blue-900 hover:bg-blue-800 border border-blue-700 text-blue-200 p-2 rounded-xl transition-all active:scale-95 disabled:opacity-50 group"
              title="Atualizar Lista"
            >
              <RotateCcw size={20} className={`transition-transform ${loading ? "animate-spin text-yellow-400" : "group-hover:rotate-180"}`} />
            </button>
          </div>
          
          {/* Placar */}
          <div className="bg-blue-900/50 border border-blue-800 p-4 rounded-xl text-right min-w-[140px]">
            <span className="text-4xl font-black text-white leading-none block">
              {loading ? "..." : inscritosFiltrados.length}
            </span>
            <p className="text-yellow-400 text-[9px] font-bold uppercase tracking-widest mt-1">
              {busca ? "Nesta Pesquisa" : "Total Geral"}
            </p>
          </div>
        </header>

        {/* === BARRA DE PESQUISA === */}
        <div className="mb-6 relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-yellow-400 transition-colors">
                <Search size={20} />
            </div>
            <input 
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar nome da equipe..."
                className="w-full bg-blue-900/40 border border-blue-800 text-white font-bold placeholder:text-blue-500/50 text-lg rounded-2xl pl-12 pr-12 py-4 outline-none focus:border-yellow-400 focus:bg-blue-900/60 transition-all shadow-lg"
            />
            {busca && (
                <button 
                    onClick={() => setBusca("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-white bg-blue-800/50 hover:bg-red-500/80 p-1 rounded-full transition-all"
                >
                    <X size={16} />
                </button>
            )}
        </div>

        {/* === LISTA (MOSTRA LOADING SE TIVER ATUALIZANDO) === */}
        {loading ? (
           <div className="py-20 text-center flex flex-col items-center justify-center opacity-70">
              <RotateCcw className="animate-spin text-yellow-400 mb-4" size={40} />
              <p className="text-blue-300 font-bold text-sm uppercase tracking-widest">Atualizando dados...</p>
           </div>
        ) : (
            <div className="grid gap-3 mb-10">
            {inscritosFiltrados.length > 0 ? (
                inscritosFiltrados.map((pessoa) => (
                    <div key={pessoa.id} className="bg-blue-900/40 border border-blue-800 p-5 rounded-2xl flex justify-between items-center backdrop-blur-sm hover:bg-blue-900/60 transition-colors group">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded italic shadow-md">Nº {pessoa.numero_inscricao}</span>
                                <h3 className="font-black text-lg uppercase leading-none">{pessoa.name}</h3>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight ${busca ? "text-yellow-300" : "text-blue-300"}`}>
                                    <Users size={12} />
                                    {pessoa.team || "Sem Equipe"}
                                </div>
                                <p className="text-blue-500 text-[10px] font-medium">{pessoa.email}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`text-[9px] font-black px-2 py-1 rounded uppercase flex items-center gap-1 border ${
                                pessoa.level === 'Iniciante' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                pessoa.level === 'Intermediário' ? 'bg-orange-900/30 text-orange-400 border-orange-800' :
                                'bg-red-900/30 text-red-400 border-red-800'
                            }`}>
                            <Activity size={10} /> {pessoa.level}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 opacity-50 border-2 border-dashed border-blue-800 rounded-3xl">
                    <Users size={48} className="mx-auto text-blue-700 mb-3" />
                    <p className="text-blue-300 font-bold text-lg">Nenhuma equipe encontrada.</p>
                    <button onClick={() => setBusca("")} className="text-yellow-400 text-xs font-bold uppercase mt-2 hover:underline">Limpar Pesquisa</button>
                </div>
            )}
            </div>
        )}
        
        <button 
            onClick={() => window.location.href = '/'} 
            className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors mx-auto pb-10 active:scale-95"
        >
            <ArrowLeft size={14} /> Voltar para o Site
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;