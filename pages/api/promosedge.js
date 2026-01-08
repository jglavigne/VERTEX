import { sendJson, handleCorsDef } from "../../helpers.js";
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const startTotal = Date.now();



  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  const promos = [];

  try {
    const startSelect = Date.now();

    // sql`...` exécute la requête côté Neon serverless
    const result = await sql`
      SELECT item, data
      FROM customdt
      WHERE classe = 'PROMO'
      ORDER BY item
    `;

    const endSelect = Date.now();
    console.log(`DB - SELECT: ${endSelect - startSelect}ms`);

    const startTransform = Date.now();
    for (const c of result) {
      if (typeof c.data === "object" && c.data !== null) {
        promos.push({
          PromoLabel: c.data.key || c.item,
          PromoCode: c.data.value ?? null,
        });
      } else {
        promos.push({
          PromoLabel: c.item,
          PromoCode: c.data,
        });
      }
    }
    const endTransform = Date.now();
    console.log(`Transform rows: ${endTransform - startTransform}ms`);
  } catch (err) {
    console.error("Erreur récupération des promos:", err);
  }
console.log("Données envoyées :", promos);
  const startSend = Date.now();
   const response = new Response(JSON.stringify(promos), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  const endSend = Date.now();
  console.log(`Send JSON: ${endSend - startSend}ms`);

  console.log(`API /promos - TOTAL: ${Date.now() - startTotal}ms`);
  return response;
}