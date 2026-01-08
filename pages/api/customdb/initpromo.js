import { upsertCustomData } from "../../../lib/customdtService";
import { getCustomData } from "../../../lib/customdtService";
export default async function handler(req, res) {
  const dts = {
    HALLO2025: "Halloween",
    NOEL2025: "Noël",
  };

  for (const [key, value] of Object.entries(dts)) {
    await upsertCustomData(
      "PROMO", // classe
      "CEGID", // workspace
      "LS", // grp
      key, // item = nom du paramètre
      value // data = valeur
    );
  }

  console.log("Tous les paramètres OAuth ont été stockés dans la table");
  let dt = {};
  for (const key of Object.keys(dts)) {
    if (key.toLowerCase() === "password") continue;
    dt[key] = await getCustomData("PROMO", "CEGID", "LS", key);
  }

 
  console.log(
    "result",
    dt
  );
  return res.status(200).json(dt);
}
