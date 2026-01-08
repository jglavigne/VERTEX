import { upsertCustomData } from "../../../lib/customdtService";
import { getCustomData } from "../../../lib/customdtService";
export default async function handler(req, res) {
  const oauthParams = {
    authUrl: "https://retail-services.cegid.cloud/t/as/connect/token",
    client_id: "CegidRetailResourceFlowClient",
    scope: "RetailBackendApi",
    username: "JGL@90033366_003_TEST",
    password: "Reveur2=",
    grant_type: "password",
  };

  for (const [key, value] of Object.entries(oauthParams)) {
    await upsertCustomData(
      "OAUTH_PARAM", // classe
      "CEGID", // workspace
      "TOKEN", // grp
      key, // item = nom du paramètre
      value // data = valeur
    );
  }

  console.log("Tous les paramètres OAuth ont été stockés dans la table");
  let dt = {};
  for (const key of Object.keys(oauthParams)) {
    if (key.toLowerCase() === "password") continue;
    dt[key] = await getCustomData("OAUTH_PARAM", "CEGID", "TOKEN", key);
  }
   dt["KEY"] = await getCustomData("OAUTH_PARAM", "CEGID", "TOKEN", "KEY");
 
  console.log(
    "result",
    dt
  );
  return res.status(200).json(dt);
}
