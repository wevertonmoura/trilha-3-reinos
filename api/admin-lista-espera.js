// api/admin-lista-espera.js
import { sql } from '@vercel/postgres'; // Ou o banco de dados que você está usando (Supabase, Firebase, etc)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { senha } = req.body;

  // Validação simples da senha do cofre
  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso negado. Senha incorreta.' });
  }

  try {
    // Busca os cadastrados na tabela de lista de espera, ordenando pelos mais recentes
    const { rows } = await sql`
      SELECT id, nome, telefone, created_at 
      FROM lista_espera 
      ORDER BY created_at DESC;
    `;

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar lista de espera:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar dados da lista de espera.' });
  }
}