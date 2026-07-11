// api/admin-excluir-espera.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { senha, id } = req.body;

  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso negado.' });
  }

  if (!id) {
    return res.status(400).json({ error: 'ID não fornecido.' });
  }

  try {
    await sql`DELETE FROM lista_espera WHERE id = ${id};`;
    return res.status(200).json({ success: true, message: 'Removido da lista de espera com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir da lista de espera:', error);
    return res.status(500).json({ error: 'Erro ao remover participante.' });
  }
}