// src/pages/Admin/AdminStats.tsx
import React from 'react';
import { UserCheck, Clock, DollarSign, Users } from 'lucide-react';

interface StatsProps {
  totalPagos: number;
  totalPendentes: number;
  arrecadado: string;
  totalEspera: number;
}

const AdminStats: React.FC<StatsProps> = ({ totalPagos, totalPendentes, arrecadado, totalEspera }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-2"><UserCheck size={20}/></div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Confirmados</p>
        <h3 className="text-3xl font-black text-emerald-500 tracking-tighter">{totalPagos}</h3>
      </div>

      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 mb-2"><Clock size={20}/></div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Pendentes</p>
        <h3 className="text-3xl font-black text-yellow-500 tracking-tighter">{totalPendentes}</h3>
      </div>

      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-2"><DollarSign size={20}/></div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Arrecadado</p>
        <h3 className="text-3xl font-black text-white tracking-tighter">{arrecadado}</h3>
      </div>

      <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-900/50 backdrop-blur-md p-6 rounded-[2rem] border border-zinc-800/50 shadow-xl">
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-2"><Users size={20}/></div>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Lista de Espera VIP</p>
        <h3 className="text-3xl font-black text-purple-400 tracking-tighter">{totalEspera}</h3>
      </div>
    </div>
  );
};

export default AdminStats;