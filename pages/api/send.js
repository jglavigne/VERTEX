export default function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Préflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body; // <-- CORRECTION ICI
    console.log("Données reçues :", data);

    // Exemple de réponse
    res.status(200).json({ ok: true, received: data });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
}