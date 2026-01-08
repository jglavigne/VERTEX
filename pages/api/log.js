// import { handleCorsDef } from "../../helpers.js";
// if (!handleCorsDef(req, res)) return;

export default async function handler(req, res) {
  const { data } = req.query;

  if (data) {
    console.log('Message reçu depuis frontend:', data);
    res.status(200).json({ ok: true });
  } else {
    res.status(400).json({ error: 'No data provided' });
  }
}
