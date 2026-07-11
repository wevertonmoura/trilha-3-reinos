// src/pages/Admin/AdminTable.tsx
import React from 'react';
import { Clock, Loader2, Check, MessageCircle, Trash2, Search } from 'lucide-react';

interface AdminTableProps {
  dados: any[];
  abaAtiva: 'inscritos' | 'espera';
  aprovandoId: string | null;
  excluindoId: string | null;
  onAprovar: (id: string) => void;
  onExcluir: (id: string, nome: string, daEspera: boolean) => void;
  onWhatsApp: (telefone: string, nome: string, pago: boolean) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
  dados, abaAtiva, aprovandoId, excluindoId, onAprovar, onExcluir, onWhatsApp
}) => {
  if (dados.length === 0) {
    return (
      <div className="p-20 text-center flex flex-col items-center justify-center gap-3">
        <Search size={28} className="text-zinc-700" />
        <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Ninguém encontrado nesta lista</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-zinc-950/50 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <tr>
            <th className="p-6">Participante & Registro</th>
            <th className="p-6">Contato & Informações</th>
            <th className="p-6 text-right">Status & Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50 text-sm">
          {dados.map((p, i) => (
            <tr key={i} className="hover:bg-zinc-800/30 transition-all group">
              <td className="p-6">
                <div className="font-black text-white text-base mb-1 group-hover:text-emerald-400 transition-colors">{p.nome || 'N/A'}</div>
                <div className="flex gap-2 items-center">
                  {p.cpf && <span className="text-[10px] bg-zinc-950 text-zinc-500 px-2 py-1 rounded font-mono uppercase border border-zinc-800">CPF: {p.cpf}</span>}
                  {p.created_at && <span className="text-[10px] text-zinc-500 font-bold uppercase"><Clock size={10} className="inline mr-1" />{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>}
                </div>
              </td>
              <td className="p-6">
                <div className="font-bold text-zinc-300 mb-1">{p.telefone || 'N/A'}</div>
                {abaAtiva === 'inscritos' ? (
                  <div className="text-[10px] text-zinc-500 uppercase font-bold"><span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1"></span>SOS: <span className="text-zinc-400">{p.contato_emergencia || 'N/A'}</span></div>
                ) : (
                  <div className="text-[10px] text-purple-400 uppercase font-black tracking-widest">Aguardando Vaga Esgotada</div>
                )}
              </td>
              <td className="p-6 text-right">
                <div className="flex items-center justify-end gap-3">
                  {abaAtiva === 'inscritos' ? (
                    p.pago ? (
                      <span className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Pago</span>
                    ) : (
                      <span className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-yellow-500 uppercase tracking-widest">Pendente</span>
                    )
                  ) : (
                    <span className="bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-purple-300 uppercase tracking-widest">Lista VIP</span>
                  )}

                  <div className="flex gap-2 ml-2">
                    {abaAtiva === 'inscritos' && !p.pago && (
                      <button onClick={() => onAprovar(p.id)} disabled={aprovandoId === p.id} className="bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-emerald-500" title="Aprovar Pagamento">
                        {aprovandoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                    )}
                    <button onClick={() => onWhatsApp(p.telefone, p.nome, p.pago)} className="bg-zinc-800 hover:bg-[#25D366] text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-[#25D366]" title="Enviar WhatsApp"><MessageCircle size={16} /></button>
                    <button onClick={() => onExcluir(p.id, p.nome, abaAtiva === 'espera')} disabled={excluindoId === p.id} className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-red-500" title="Excluir">
                      {excluindoId === p.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;