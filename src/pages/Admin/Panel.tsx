// src/pages/Admin/Panel.tsx
import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Search, RefreshCw, LogOut, Download, CheckCircle, Clock, ShieldAlert, Phone, Mail, FileText, Trash2, Check, MessageCircle, Loader2, Pencil, X, Save, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Participante } from '../../types';

interface AdminProps {
  senha: string;
  formatarMoeda: (valor: number) => string;
  fecharAdmin: () => void;
}

interface InscricaoAdmin extends Participante {
  id?: string | number;
  status?: 'pago' | 'pendente';
  valor?: number;
  data?: string;
  tipo?: 'Titular' | 'Acompanhante';
  dataRegistro?: string; // 🚀 Adicionado para receber a data do banco
}

const AdminPanel: React.FC<AdminProps> = ({ senha, formatarMoeda, fecharAdmin }) => {
  const [inscricoes, setInscricoes] = useState<InscricaoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos');
  const [erro, setErro] = useState('');

  const [processandoId, setProcessandoId] = useState<string | number | null>(null);

  // ESTADO DO MODAL DE EDIÇÃO
  const [itemEditando, setItemEditando] = useState<InscricaoAdmin | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  // Função auxiliar para formatar a data e hora
  const formatarDataHora = (dataIso?: string) => {
    if (!dataIso) return 'Data não registrada';
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return 'Data inválida';
    return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Função auxiliar para limpar R$ duplo
  const limparR$ = (valorFormatado: string) => {
    return valorFormatado.replace(/R\$\s?/g, '').trim();
  };

  // 1. CARREGAR DADOS
  const carregarInscricoes = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/admin-listar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha })
      });

      if (res.status === 401) throw new Error('Senha incorreta ou acesso negado pelo servidor.');
      if (!res.ok) throw new Error('Falha ao carregar dados. Verifique a conexão com a API.');
      
      const data = await res.json();
      
      const dadosTratados = (Array.isArray(data) ? data : data.inscricoes || []).map((item: any, ind: number) => {
        const em = item.contato_emergencia || item.emergencyName || '';
        const partesEm = em.includes('-') ? em.split('-') : [em, ''];
        
        return {
          ...item,
          id: item.id || ind,
          name: item.name || item.nome || 'Trilheiro Sem Nome',
          cpf: item.cpf || 'Acompanhante (Sem CPF)',
          phone: item.phone || item.telefone || '---',
          email: item.email || '',
          emergencyName: partesEm[0].trim() || 'Não informado',
          emergencyPhone: item.emergencyPhone || partesEm[1]?.trim() || '---',
          status: (item.status === 'pago' || item.pago === true) ? 'pago' : 'pendente',
          valor: Number(item.valor || 55),
          tipo: item.cpf ? 'Titular' : 'Acompanhante',
          // 🚀 Puxando a data de criação direto do banco (created_at ou criado_em)
          dataRegistro: item.created_at || item.criado_em || item.data || new Date().toISOString()
        };
      });

      setInscricoes(dadosTratados);
    } catch (err: any) {
      console.error("Erro no painel:", err);
      setErro(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarInscricoes();
  }, []);

  // 2. SALVAR EDIÇÃO
  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemEditando || !itemEditando.id) return;

    setSalvandoEdicao(true);
    try {
      const contatoSosCompleto = `${itemEditando.emergencyName || ''} - ${itemEditando.emergencyPhone || ''}`.trim();

      const res = await fetch('/api/admin-acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'editar',
          senha,
          id: itemEditando.id,
          nome: itemEditando.name,
          telefone: itemEditando.phone,
          email: itemEditando.email,
          cpf: itemEditando.cpf,
          contato_emergencia: contatoSosCompleto,
          valor: itemEditando.valor
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao salvar no servidor.');
      }

      setInscricoes(prev => prev.map(item => item.id === itemEditando.id ? itemEditando : item));
      setItemEditando(null);
      alert('Dados atualizados com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao editar: ${err.message}`);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // 3. EXCLUIR INSCRITO
  const excluirInscricao = async (id: string | number | undefined, nome: string) => {
    if (!id) return;
    if (!window.confirm(`Tem certeza que deseja EXCLUIR a inscrição de "${nome}"? Esta ação não pode ser desfeita.`)) return;

    setProcessandoId(id);
    try {
      const res = await fetch('/api/admin-acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'excluir', senha, id })
      });

      if (!res.ok) throw new Error('Erro ao excluir no servidor.');

      setInscricoes(prev => prev.filter(item => item.id !== id));
      alert(`Inscrição de ${nome} excluída com sucesso!`);
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao excluir: ${err.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  // 4. APROVAR PAGAMENTO MANUAL
  const aprovarInscricao = async (id: string | number | undefined, nome: string) => {
    if (!id) return;
    if (!window.confirm(`Confirmar o pagamento de "${nome}" manualmente?`)) return;

    setProcessandoId(id);
    try {
      const res = await fetch('/api/admin-acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aprovar', senha, id })
      });

      if (!res.ok) throw new Error('Erro ao aprovar pagamento no servidor.');
      setInscricoes(prev => prev.map(item => item.id === id ? { ...item, status: 'pago' } : item));
    } catch (err: any) {
      console.error(err);
      alert(`Falha ao aprovar: ${err.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  // 5. ABRIR WHATSAPP
  const chamarWhatsApp = (telefone: string, nome: string, pago: boolean) => {
    const foneLimpo = telefone.replace(/\D/g, '');
    if (foneLimpo.length < 10) return alert("Número de WhatsApp inválido!");
    
    const statusMsg = pago ? "confirmadíssima ✅" : "pendente de pagamento ⏳";
    const texto = encodeURIComponent(`Olá ${nome}! Aqui é da organização da *Trilha 3 Reinos*. Vimos que sua inscrição está ${statusMsg}. Tudo certo para a nossa aventura dia 23 de Agosto? 🌿⛰️`);
    window.open(`https://wa.me/55${foneLimpo}?text=${texto}`, '_blank');
  };

  // Resumos e Filtros
  const totalInscritos = inscricoes.length;
  const pagamentosConfirmados = inscricoes.filter(i => i.status === 'pago').length;
  const pagamentosPendentes = inscricoes.filter(i => i.status === 'pendente').length;
  const receitaTotal = inscricoes.filter(i => i.status === 'pago').reduce((acc, curr) => acc + (curr.valor || 55), 0);

  const inscricoesFiltradas = inscricoes.filter(item => {
    const atendeBusca = 
      item.name.toLowerCase().includes(busca.toLowerCase()) ||
      String(item.cpf).includes(busca) ||
      (item.email && item.email.toLowerCase().includes(busca.toLowerCase()));
    
    const atendeStatus = filtroStatus === 'todos' ? true : item.status === filtroStatus;
    return atendeBusca && atendeStatus;
  });

  const exportarCSV = () => {
    if (inscricoesFiltradas.length === 0) return alert("Nenhum dado para exportar!");
    const cabecalho = "Data Cadastro,Tipo,Nome,CPF,WhatsApp,E-mail,Emergencia,Fone Emergencia,Status,Valor\n";
    const linhas = inscricoesFiltradas.map(i => {
      const dataFormatadaStr = new Date(i.dataRegistro || '').toLocaleString('pt-BR');
      return `"${dataFormatadaStr}","${i.tipo || 'Titular'}","${i.name}","${i.cpf}","${i.phone}","${i.email || ''}","${i.emergencyName || ''}","${i.emergencyPhone || ''}","${i.status || 'pendente'}","R$ ${i.valor || 55}"`
    }).join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `trilha_3_reinos_inscritos_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO DO PAINEL */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl backdrop-blur-md shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Área Restrita</p>
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white mt-1">
              Painel Geral — Trilha 3 Reinos
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button onClick={carregarInscricoes} disabled={loading} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin text-emerald-500" : ""} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button onClick={exportarCSV} className="bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-zinc-950 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
              <Download size={16} />
              <span>Exportar Excel</span>
            </button>
            <button onClick={fecharAdmin} className="bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all">
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {/* CARDS DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Users size={48} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total de Inscritos</p>
            <p className="text-3xl font-black text-white mt-2 font-mono">{totalInscritos}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign size={48} className="text-emerald-500" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Receita (Confirmada)</p>
            {/* 🚀 CORREÇÃO DO R$ DUPLICADO AQUI */}
            <p className="text-3xl font-black text-white mt-2 font-mono">R$ {limparR$(formatarMoeda(receitaTotal))}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle size={48} className="text-emerald-500" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pix Confirmados</p>
            <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">{pagamentosConfirmados}</p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Clock size={48} className="text-amber-500" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Aguardando Pix</p>
            <p className="text-3xl font-black text-amber-400 mt-2 font-mono">{pagamentosPendentes}</p>
          </div>
        </div>

        {/* BARRA DE FILTROS E BUSCA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-2xl">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Buscar por nome, CPF ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-xs font-bold text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition-all" />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button onClick={() => setFiltroStatus('todos')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${filtroStatus === 'todos' ? 'bg-white text-zinc-950 font-black' : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800'}`}>
              Todos ({totalInscritos})
            </button>
            <button onClick={() => setFiltroStatus('pago')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${filtroStatus === 'pago' ? 'bg-emerald-500 text-zinc-950 font-black' : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800'}`}>
              <CheckCircle size={14} /> Pagos ({pagamentosConfirmados})
            </button>
            <button onClick={() => setFiltroStatus('pendente')} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${filtroStatus === 'pendente' ? 'bg-amber-500 text-zinc-950 font-black' : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800'}`}>
              <Clock size={14} /> Pendentes ({pagamentosPendentes})
            </button>
          </div>
        </div>

        {/* ERRO DE COMUNICAÇÃO */}
        {erro && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-3">
            <ShieldAlert size={20} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* LISTA DE INSCRITOS */}
        {loading ? (
          <div className="text-center py-20 opacity-50 space-y-4">
            <RefreshCw className="animate-spin text-emerald-500 mx-auto" size={32} />
            <p className="text-xs uppercase font-bold tracking-widest text-zinc-400">Carregando lista de inscritos...</p>
          </div>
        ) : inscricoesFiltradas.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl p-8">
            <FileText className="text-zinc-600 mx-auto mb-3" size={40} />
            <p className="text-zinc-400 font-bold text-sm">Nenhuma inscrição encontrada.</p>
            <p className="text-zinc-600 text-xs mt-1">Tente mudar os termos da busca ou os filtros acima.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inscricoesFiltradas.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id || idx}
                className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  item.status === 'pago' 
                    ? 'bg-zinc-900/80 border-emerald-500/30 hover:border-emerald-500/60' 
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'pago' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>

                <div className="space-y-4 pl-2">
                  <div className="flex justify-between items-start gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {item.tipo || 'Titular'}
                      </span>
                      <h3 className="font-bold text-white text-base leading-snug">{item.name}</h3>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">{item.cpf}</p>
                      
                      {/* 🚀 NOVA DATA E HORA DE CADASTRO ABAIXO DO CPF */}
                      <div className="flex items-center gap-1.5 mt-2 text-[9px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-950 inline-flex px-2 py-1 rounded-md border border-zinc-800">
                        <CalendarDays size={10} className="text-emerald-500/70" />
                        {formatarDataHora(item.dataRegistro)}
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 flex items-center gap-1 ${
                      item.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {item.status === 'pago' ? <CheckCircle size={10} /> : <Clock size={10} />}
                      {item.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-zinc-300">
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={14} className="text-emerald-500 shrink-0" />
                      <span className="font-mono">{item.phone || 'Sem telefone'}</span>
                    </div>

                    {item.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail size={14} className="text-zinc-500 shrink-0" />
                        <span className="truncate text-zinc-400">{item.email}</span>
                      </div>
                    )}
                  </div>

                  {/* BOX DE EMERGÊNCIA */}
                  <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1">
                      <ShieldAlert size={12} /> Contato de SOS
                    </p>
                    <p className="text-xs font-bold text-zinc-300 truncate">
                      {item.emergencyName || 'Não informado'}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      {item.emergencyPhone || '---'}
                    </p>
                  </div>
                </div>

                {/* BARRA DE BOTÕES DE AÇÃO */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col gap-3 pl-2">
                  <div className="flex justify-between items-center text-xs font-mono text-zinc-500">
                    {/* 🚀 CORREÇÃO DO R$ DUPLICADO AQUI TAMBÉM */}
                    <span>Valor: R$ {limparR$(formatarMoeda(item.valor || 55))}</span>
                    <span>#{(idx + 1).toString().padStart(3, '0')}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {/* BOTÃO EDITAR */}
                    <button 
                      onClick={() => setItemEditando({ ...item })} 
                      className="bg-zinc-800 hover:bg-blue-600 text-zinc-400 hover:text-white p-2.5 rounded-xl transition-all border border-zinc-700 hover:border-blue-500 flex items-center gap-1 text-[11px] font-bold"
                      title="Editar Dados do Participante"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Botão WhatsApp */}
                    <button 
                      onClick={() => chamarWhatsApp(item.phone, item.name, item.status === 'pago')} 
                      className="bg-zinc-800 hover:bg-[#25D366] text-zinc-400 hover:text-zinc-950 p-2.5 rounded-xl transition-all border border-zinc-700 hover:border-[#25D366] flex items-center gap-1 text-[11px] font-bold"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle size={15} />
                    </button>

                    {/* Botão Aprovar Manual */}
                    {item.status !== 'pago' && (
                      <button 
                        onClick={() => aprovarInscricao(item.id, item.name)} 
                        disabled={processandoId === item.id}
                        className="bg-zinc-800 hover:bg-emerald-500 text-zinc-400 hover:text-zinc-950 p-2.5 rounded-xl transition-all border border-zinc-700 hover:border-emerald-500 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                        title="Aprovar Pagamento Manualmente"
                      >
                        {processandoId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        <span className="text-[10px] uppercase font-black">Aprovar</span>
                      </button>
                    )}

                    {/* Botão Excluir */}
                    <button 
                      onClick={() => excluirInscricao(item.id, item.name)} 
                      disabled={processandoId === item.id}
                      className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white p-2.5 rounded-xl transition-all border border-zinc-700 hover:border-red-500 flex items-center gap-1 text-[11px] font-bold disabled:opacity-50"
                      title="Excluir Registro"
                    >
                      {processandoId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* MODAL DE EDIÇÃO DE PARTICIPANTE */}
      <AnimatePresence>
        {itemEditando && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20 text-blue-400">
                    <Pencil size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white">Editar Participante</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ID do Registro: #{itemEditando.id}</p>
                  </div>
                </div>
                <button onClick={() => setItemEditando(null)} className="text-zinc-500 hover:text-white p-2 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={salvarEdicao} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome Completo</label>
                  <input required type="text" value={itemEditando.name} onChange={e => setItemEditando({...itemEditando, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">WhatsApp</label>
                    <input type="tel" value={itemEditando.phone} onChange={e => setItemEditando({...itemEditando, phone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="(81) 99999-9999" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">CPF</label>
                    <input type="text" value={itemEditando.cpf} onChange={e => setItemEditando({...itemEditando, cpf: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="000.000.000-00" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">E-mail</label>
                  <input type="email" value={itemEditando.email} onChange={e => setItemEditando({...itemEditando, email: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="email@exemplo.com" />
                </div>

                <div className="pt-2 border-t border-zinc-800/80">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-2 flex items-center gap-1">
                    <ShieldAlert size={12} /> Contato de Emergência (SOS)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-zinc-500 ml-1">Nome (Parentesco)</label>
                      <input type="text" value={itemEditando.emergencyName} onChange={e => setItemEditando({...itemEditando, emergencyName: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="Ex: Ana (Mãe)" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-zinc-500 ml-1">Telefone SOS</label>
                      <input type="tel" value={itemEditando.emergencyPhone} onChange={e => setItemEditando({...itemEditando, emergencyPhone: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-blue-500 transition-all" placeholder="(81) 99999-9999" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setItemEditando(null)} className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase text-xs rounded-xl tracking-widest transition-all">
                    Cancelar
                  </button>
                  <button type="submit" disabled={salvandoEdicao} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs rounded-xl tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    {salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{salvandoEdicao ? 'Salvando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminPanel;