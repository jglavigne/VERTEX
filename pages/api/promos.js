import { sendJson, handleCorsDef } from "../../helpers.js";
import pool from "../../lib/db";

export default async function handler(req, res) {
  console.time("API /promos - TOTAL");
  if (!handleCorsDef(req, res)) return;
  if (req.method === "OPTIONS") return res.status(204).end();

  let promos = [];
  try {
    console.time("DB - connect()");
    const client = await pool.connect();
    console.timeEnd("DB - connect()");
    console.time("DB - SELECT");
    const result = await client.query(
      "SELECT item, data FROM customdt WHERE classe = 'PROMO' ORDER BY item"
    );
    console.timeEnd("DB - SELECT");
    client.release();

    console.time("Transform rows");

    for (const c of result.rows) {
      // auto detect JSON object vs primitive
      if (typeof c.data === "object" && c.data !== null) {
        promos.push({
          PromoLabel: c.data.key || c.item,
          PromoCode: c.data.value ?? null,
        });
      } else {
        // primitive string or number
        promos.push({
          PromoLabel: c.item,
          PromoCode: c.data,
        });
      }
    }
    console.timeEnd("Transform rows");
  } catch (err) {
    console.error("Erreur récupération des promos:", err);
  }

  //   console.log("Données envoyées :", promos);
  console.time("Send JSON");
  sendJson(res, promos);
  console.timeEnd("Send JSON");
  console.timeEnd("API /promos - TOTAL");
}
