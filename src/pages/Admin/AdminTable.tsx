// src/pages/Admin/AdminTable.tsx
import React from 'react';
import { Clock, Loader2, Check, MessageCircle, Trash2, Search } from 'lucide-react';

interface AdminTableProps {
  dados: any[];
  abaAtiva: 'inscritos' | 'espera';
  aprovandoId: string | number | null;
  excluindoId: string | number | null;
  onAprovar: (id: any) => void;
  onExcluir: (id: any, nome: string, daEspera: boolean) => void;
  onWhatsApp: (telefone: string, nome: string, pago: boolean) => void;
}

const AdminTable: React.FC<AdminTableProps> = ({
  dados, abaAtiva, aprovandoId, excluindoId, onAprovar, onExcluir, onWhatsApp
}) => {
  if (!dados || dados.length === 0) {
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
          {dados.map((p, i) => {
            // 🚀 LEITURA INTELIGENTE (Compatível com nomes em inglês do Panel ou português do Banco)
            const nomePessoa = p.name || p.nome || 'Trilheiro Sem Nome';
            const telefonePessoa = p.phone || p.telefone || '';
            const cpfPessoa = p.cpf || '';
            const dataRegistro = p.created_at || p.criado_em || p.data || null;
            const sosContato = p.emergencyName ? `${p.emergencyName} (${p.emergencyPhone || '---'})` : (p.contato_emergencia || 'N/A');
            const isPago = p.status === 'pago' || p.pago === true;
            const idPessoa = p.id || i;

            return (
              <tr key={idPessoa} className="hover:bg-zinc-800/30 transition-all group">
                <td className="p-6">
                  <div className="font-black text-white text-base mb-1 group-hover:text-emerald-400 transition-colors">
                    {nomePessoa}
                  </div>
                  <div className="flex gap-2 items-center flex-wrap">
                    {cpfPessoa && (
                      <span className="text-[10px] bg-zinc-950 text-zinc-500 px-2 py-1 rounded font-mono uppercase border border-zinc-800">
                        CPF: {cpfPessoa}
                      </span>
                    )}
                    {dataRegistro && (
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        <Clock size={10} className="inline mr-1" />
                        {new Date(dataRegistro).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-6">
                  <div className="font-bold text-zinc-300 mb-1">{telefonePessoa || 'Sem telefone'}</div>
                  {abaAtiva === 'inscritos' ? (
                    <div className="text-[10px] text-zinc-500 uppercase font-bold">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block mr-1"></span>
                      SOS: <span className="text-zinc-400">{sosContato}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-purple-400 uppercase font-black tracking-widest">
                      Aguardando Vaga Esgotada
                    </div>
                  )}
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {abaAtiva === 'inscritos' ? (
                      isPago ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                          Pago
                        </span>
                      ) : (
                        <span className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                          Pendente
                        </span>
                      )
                    ) : (
                      <span className="bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full text-[10px] font-black text-purple-300 uppercase tracking-widest">
                        Lista VIP
                      </span>
                    )}

                    <div className="flex gap-2 ml-2">
                      {abaAtiva === 'inscritos' && !isPago && (
                        <button 
                          onClick={() => onAprovar(idPessoa)} 
                          disabled={aprovandoId === idPessoa} 
                          className="bg-zinc-800 hover:bg-emerald-600 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-emerald-500" 
                          title="Aprovar Pagamento Manualmente"
                        >
                          {aprovandoId === idPessoa ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => onWhatsApp(telefonePessoa, nomePessoa, isPago)} 
                        className="bg-zinc-800 hover:bg-[#25D366] text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-[#25D366]" 
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </button>
                      
                      <button 
                        onClick={() => onExcluir(idPessoa, nomePessoa, abaAtiva === 'espera')} 
                        disabled={excluindoId === idPessoa} 
                        className="bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white p-2 rounded-xl transition-colors border border-zinc-700 hover:border-red-500" 
                        title="Excluir Registro"
                      >
                        {excluindoId === idPessoa ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;