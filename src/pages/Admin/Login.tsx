// src/pages/Admin/Login.tsx
import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';

interface LoginProps {
  onLoginSuccess: (senhaValidada: string) => void;
  onVoltar: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onVoltar }) => {
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroLoginAdmin, setErroLoginAdmin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLoginAdmin('');
    setLoading(true);
    
    try {
      const res = await api.loginAdmin(senhaAdmin);
      if (res.ok) {
        onLoginSuccess(senhaAdmin);
      } else {
        setErroLoginAdmin('Senha incorreta.');
      }
    } catch { 
      setErroLoginAdmin('Erro de comunicação.'); 
    } finally {
      setLoading(false);
    }
  };

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
              <input 
                type="password" 
                autoFocus 
                placeholder="SENHA MESTRE" 
                value={senhaAdmin} 
                onChange={(e) => setSenhaAdmin(e.target.value)} 
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-5 py-4 text-white text-center text-lg font-mono tracking-[0.2em] outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
            {erroLoginAdmin && <div className="text-red-500 text-xs font-bold text-center animate-in shake">{erroLoginAdmin}</div>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Desbloquear Cofre'}
            </button>
          </form>
          
          <button onClick={onVoltar} className="w-full mt-6 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <ArrowLeft size={12} /> Voltar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;