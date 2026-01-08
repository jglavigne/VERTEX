import { upsertCustomDataObj } from "../../../lib/customdtService";
//import { upsertCustomData } from "@/services/customdtService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
console.log("Body reçu :", req.body);
    if (!body.classe || !body.workspace || !body.data) {
      return res.status(400).json({
        error: "Champs 'classe', 'workspace' et 'data' requis",
      });
    }

    const saved = await upsertCustomDataObj({
      classe: body.classe,
      workspace: body.workspace,
      grp: body.grp ?? null,
      item: body.item ?? null,
      data: body.data,
    });

    return res.status(200).json(saved); // ✅ Node.js runtime
  } catch (err) {
    console.error("Erreur upsertCustomDataObj :", err);
    return res.status(500).json({ error: err.message });
  }
}