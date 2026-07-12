// api/admin-login.js

export default function handler(req, res) {
  // 1. Liberação de CORS (Evita bloqueios no navegador ao testar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Garante que só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }

  const { senha } = req.body;

  // 3. 🛡️ Segurança: Busca a senha segura primeiro, mas aceita a antiga com VITE_ para não quebrar nada
  const senhaValida = process.env.SENHA_ADMIN || process.env.VITE_SENHA_ADMIN;

  // 4. Validação
  if (senha === senhaValida) {
    return res.status(200).json({ success: true, message: 'Acesso autorizado' });
  } else {
    return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
  }
}