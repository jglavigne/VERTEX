import { sendJson, handleCorsDef } from "../../helpers.js";


export default async function handler(req, res) {
  // Vérifie le CORS
  if (!handleCorsDef(req, res)) return;

  // Préflight OPTIONS
  if (req.method === "OPTIONS") return res.status(204).end();


  // Données fixe à retourner
  const promos = [
    { PromoLabel: process.env.lib2, PromoCode: "DISC10" },
    { PromoLabel: req.headers.origin || " SITE", PromoCode: "SITE" },
  ];

  console.log("Données envoyées :", promos);

  sendJson(res, promos);
}
