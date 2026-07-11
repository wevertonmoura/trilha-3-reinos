// src/pages/Admin/Panel.tsx (ou Admin.tsx)
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Search, ShieldAlert, Download, Users, ListFilter } from 'lucide-react';

import AdminStats from './pages/Admin/AdminStats';
import AdminTable from './pages/Admin/AdminTable';
import { chamarNoWhatsApp, exportarCSV } from './pages/Admin/AdminActions';

const Admin = ({ senha, formatarMoeda, fecharAdmin }: any) => {
  const [adminData, setAdminData] = useState<any[]>([]);
  const [listaEspera, setListaEspera] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<'inscritos' | 'espera'>('inscritos');
  
  const [aprovandoId, setAprovandoId] = useState<string | null>(null); 
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const resInscritos = await fetch('/api/admin-listar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) });
      const dataInscritos = await resInscritos.json();
      if (dataInscritos && !dataInscritos.error) setAdminData(dataInscritos);

      const resEspera = await fetch('/api/admin-lista-espera', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) });
      const dataEspera = await resEspera.json();
      if (dataEspera && !dataEspera.error) setListaEspera(dataEspera);
    } catch (err) { console.error("Falha ao carregar:", err); }
    setLoading(false);
  };

  const aprovarPagamentoManual = async (id: string) => {
    if (!window.confirm("Confirmar recebimento manual?")) return;
    setAprovandoId(id); 
    try {
      const res = await fetch('/api/admin-aprovar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha, id }) });
      if (res.ok) setAdminData(prev => prev.map(item => item.id === id ? { ...item, pago: true } : item));
    } finally { setAprovandoId(null); }
  };

  const excluirParticipante = async (id: string, nome: string, daEspera: boolean = false) => {
    if (!window.confirm(`Tem certeza que deseja EXCLUIR ${nome}?`)) return;
    setExcluindoId(id);
    try {
      const res = await fetch(daEspera ? '/api/admin-excluir-espera' : '/api/admin-excluir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha, id }) });
      if (res.ok) {
        if (daEspera) setListaEspera(prev => prev.filter(item => item.id !== id));
        else setAdminData(prev => prev.filter(item => item.id !== id));
      }
    } finally { setExcluindoId(null); }
  };

  const totalPagos = adminData.filter(p => p.pago).length;
  const arrecadado = formatarMoeda((Math.floor(totalPagos / 2) * 90) + ((totalPagos % 2) * 50)); 
  const dadosFiltrados = (abaAtiva === 'inscritos' ? adminData : listaEspera)
    .filter(p => (p.nome || '').toLowerCase().includes(busca.toLowerCase()) || (p.telefone || '').includes(busca))
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));

  if (loading) return <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4"><Loader2 className="animate-spin text-emerald-500" size={48} /><p className="text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Carregando cofre...</p></div>;

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8 font-sans relative z-0">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* TOPO DO COMANDO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-6 md:p-8 rounded-[2rem] gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><ShieldAlert size={28} className="text-zinc-950" /></div>
            <div><h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Comando Central</h1><p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Vem Para Trilha • Santuário dos Três Reinos</p></div>
          </div>
          <button onClick={fecharAdmin} className="w-full md:w-auto bg-zinc-800/80 hover:bg-zinc-700 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all border border-zinc-700"><ArrowLeft size={16}/> Voltar ao Site</button>
        </div>

        {/* CARDS DE ESTATÍSTICAS */}
        <AdminStats totalPagos={totalPagos} totalPendentes={adminData.length - totalPagos} arrecadado={arrecadado} totalEspera={listaEspera.length} />

        {/* CONTROLE DE ABAS E BUSCA */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-[2.5rem] border border-zinc-800/80 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button onClick={() => setAbaAtiva('inscritos')} className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${abaAtiva === 'inscritos' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-white'}`}><ListFilter size={16} /> Inscritos ({adminData.length})</button>
              <button onClick={() => setAbaAtiva('espera')} className={`flex-1 md:flex-initial px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${abaAtiva === 'espera' ? 'bg-purple-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}><Users size={16} /> Lista VIP ({listaEspera.length})</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {abaAtiva === 'inscritos' ? (
                <>
                  <button onClick={() => exportarCSV(adminData, 'SOS')} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/30">Lista SOS</button>
                  <button onClick={() => exportarCSV(adminData, 'COMPLETA')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/30">Lista Completa</button>
                </>
              ) : (
                <button onClick={() => exportarCSV(listaEspera, 'ESPERA')} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest border border-purple-500/30 flex items-center gap-2"><Download size={16}/> Exportar Espera</button>
              )}
            </div>
          </div>

          <div className="px-8 py-4 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center gap-4">
            <Search size={20} className="text-zinc-500" />
            <input type="text" placeholder={`Buscar na ${abaAtiva === 'inscritos' ? 'lista principal' : 'lista de espera'}...`} value={busca} onChange={(e) => setBusca(e.target.value)} className="bg-transparent border-none outline-none text-sm font-bold text-white w-full placeholder:text-zinc-600" />
          </div>

          {/* COMPONENTE DA TABELA ISOLADO */}
          <AdminTable
            dados={dadosFiltrados}
            abaAtiva={abaAtiva}
            aprovandoId={aprovandoId}
            excluindoId={excluindoId}
            onAprovar={aprovarPagamentoManual}
            onExcluir={excluirParticipante}
            onWhatsApp={chamarNoWhatsApp}
          />
        </div>
      </div>
    </div>
  );
};

export default Admin;