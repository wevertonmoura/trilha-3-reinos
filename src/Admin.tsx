import { useState, useEffect } from 'react';
import { UserCheck, DollarSign, Users, ArrowLeft, Loader2, Search, ShieldAlert, Check, Download, Trash2 } from 'lucide-react';

const Admin = ({ senha, formatarMoeda, fecharAdmin }: any) => {
  const [adminData, setAdminData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [aprovandoId, setAprovandoId] = useState<string | null>(null); 
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-listar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });
      const data = await res.json();
      if (data && !data.error) {
        setAdminData(data);
      } else {
        console.error("Erro do servidor:", data.error);
      }
    } catch (err) {
      console.error("Falha ao carregar dados:", err);
    }
    setLoading(false);
  };

  const aprovarPagamentoManual = async (id: string) => {
    setAprovandoId(id); 
    try {
      const res = await fetch('/api/admin-aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, id })
      });
      
      if (res.ok) {
        setAdminData(prevData => prevData.map(item => item.id === id ? { ...item, pago: true } : item));
      } else {
        throw new Error("Acesso negado");
      }
    } catch (err) {
      alert("Erro ao aprovar manualmente.");
    } finally {
      setAprovandoId(null);
    }
  };

  // === FUNÇÃO DE EXCLUSÃO ===
  const excluirParticipante = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR permanentemente a inscrição de ${nome}?`)) return;

    setExcluindoId(id);
    try {
      const res = await fetch('/api/admin-excluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha, id })
      });

      if (res.ok) {
        // Tira o participante da tela na mesma hora
        setAdminData(prevData => prevData.filter(item => item.id !== id));
      } else {
        throw new Error("Acesso negado");
      }
    } catch (err) {
      alert("Erro ao excluir participante.");
      console.error(err);
    } finally {
      setExcluindoId(null);
    }
  };

  const exportarPlanilha = () => {
    const headers = ["Nome Completo", "WhatsApp", "CPF", "Contato de Emergência", "Status"];
    const csvRows = adminData.map(p => {
      return [ `"${p.nome}"`, `"${p.telefone}"`, `"${p.cpf || 'Não informado'}"`, `"${p.contato_emergencia || 'Não informado'}"`, p.pago ? '"PAGO"' : '"PENDENTE"' ].join(';'); 
    });
    const csvContent = [headers.join(';'), ...csvRows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lista_Invasores_Trilha_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPagos = adminData.filter(p => p.pago).length;
  const arrecadado = totalPagos * 20; 

  const dadosFiltrados = adminData.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.telefone.includes(busca)
  );

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full"></div>
      <Loader2 className="animate-spin text-emerald-500 relative z-10" size={48} />
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse relative z-10">Carregando cofre...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans relative overflow-hidden z-0">
      <div className="fixed top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-emerald-900/20 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] bg-zinc-800/40 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 md:p-8 rounded-[2rem] gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldAlert size={28} className="text-zinc-950" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Comando Central</h1>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Invasores 081 • Edição Trilha</p>
            </div>
          </div>
          <button onClick={fecharAdmin} className="w-full md:w-auto bg-zinc-800/80 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border border-zinc-700 shadow-lg group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Voltar ao Site
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-zinc-800/50 flex items-center gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0"><UserCheck size={32}/></div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Confirmados</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{totalPagos}</h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-zinc-800/50 flex items-center gap-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0"><DollarSign size={32}/></div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Arrecadado</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">{formatarMoeda(arrecadado)}</h3>
            </div>
          </div>

          <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-zinc-800/50 flex items-center gap-6 shadow-xl relative overflow-hidden">
            <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-700/50 shrink-0"><Users size={32}/></div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Gerado</p>
              <h3 className="text-4xl font-black text-zinc-300 tracking-tighter">{adminData.length}</h3>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] border border-zinc-800/80 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50"><Search size={20} className="text-emerald-500" /></div>
              <input 
                type="text" 
                placeholder="Pesquisar por nome ou WhatsApp..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="bg-transparent border-none outline-none text-base md:text-lg font-bold text-white w-full placeholder:text-zinc-600 focus:ring-0"
              />
            </div>
            <button onClick={exportarPlanilha} className="w-full md:w-auto bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-6 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border border-emerald-500/30">
              <Download size={18} /> Baixar Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-6 whitespace-nowrap">Participante & Doc</th>
                  <th className="p-6 whitespace-nowrap">Contato</th>
                  <th className="p-6 whitespace-nowrap text-right">Status & Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {dadosFiltrados.map((p, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-all duration-300 group">
                    <td className="p-6">
                      <div className="font-black text-white text-base tracking-tight mb-1 group-hover:text-emerald-400 transition-colors">{p.nome}</div>
                      <div className="flex gap-3 items-center">
                        <span className="text-[10px] bg-zinc-950 text-zinc-500 px-2 py-1 rounded font-mono uppercase border border-zinc-800">
                          {p.cpf ? `CPF: ${p.cpf}` : 'CPF Pendente'}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="font-bold text-zinc-300 mb-1">{p.telefone}</div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block"></span> 
                        SOS: <span className="text-zinc-400">{p.contato_emergencia || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {/* STATUS PAGO OU PENDENTE */}
                        {p.pago ? (
                          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase mt-[1px]">Pago</span>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => aprovarPagamentoManual(p.id)}
                              disabled={aprovandoId === p.id}
                              className="bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-400 p-2 rounded-full transition-colors border border-zinc-700 hover:border-emerald-500 group-hover:opacity-100 opacity-60 flex items-center justify-center"
                              title="Aprovar Manualmente"
                            >
                              {aprovandoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            </button>
                            <div className="inline-flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/80 px-4 py-2 rounded-full">
                              <span className="w-2 h-2 bg-zinc-500 rounded-full"></span>
                              <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase mt-[1px]">Pendente</span>
                            </div>
                          </>
                        )}

                        {/* BOTÃO EXCLUIR */}
                        <button 
                          onClick={() => excluirParticipante(p.id, p.nome)}
                          disabled={excluindoId === p.id}
                          className="bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-400 p-2 rounded-full transition-colors border border-zinc-700 hover:border-red-500 group-hover:opacity-100 opacity-60 flex items-center justify-center ml-2"
                          title="Excluir Participante"
                        >
                          {excluindoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {dadosFiltrados.length === 0 && (
              <div className="p-24 text-center flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 text-zinc-700">
                  <Search size={24} />
                </div>
                <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Nenhum Invasor encontrado na busca</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;