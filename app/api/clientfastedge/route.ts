import { sql } from '../../../lib/neon';

// ✅ Nouvelle syntaxe pour Edge runtime
export const runtime = 'edge';

// ✅ Exporter une fonction GET (pas de default export)
export async function GET() {
  try {
    const result = await sql`SELECT * FROM clients ORDER BY id ASC`;

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Erreur récupération des clients:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
