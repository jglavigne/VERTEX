import { handleCorsDef } from "../../helpers.js";
import { getValidToken } from "../../lib/authManager.js";

export default async function handler(req, res) {
  // CORS
  if (!handleCorsDef(req, res)) return;
  console.log("CORS autorisé",req.method);
  if (req.method === "OPTIONS") return res.status(204).end();

  const targetUrl = req.query.url || req.body?.url;
  //console.log("Proxy request to:", targetUrl);
  if (!targetUrl)
    return res
      .status(400)
      .json({ error: "Missing parameter: url or body.url" });

  try {
    let token = await getValidToken();

    if (!token)
      return res.status(400).json({ error: "Unable to get a valid token" });


    // Fonction interne pour envoyer la requête avec un token donné
    const sendRequest = async (bearer) => {
      const fetchOptions = {
        method: req.method,
        headers: { "Authorization": `Bearer ${bearer}` },
      };
      if (req.method !== "GET" && req.method !== "HEAD") {
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body =
          req.body.payload == null
            ? "{}"
            : typeof req.body.payload === "object"
            ? JSON.stringify(req.body.payload)
            : typeof req.body.payload === "string"
            ? req.body.payload
            : JSON.stringify(req.body.payload);
      }
      return fetch(targetUrl, fetchOptions);
    };

    // Première tentative
    let r = await sendRequest(token);

    if (r.status === 401) {
      console.log("401, tentative de refresh du token ...");
      token = await getValidToken(r.status);
      // Réessaie avec le nouveau token
      r = await sendRequest(token);
    }

    // Lecture du body et parsing JSON
    const contentType = r.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const raw = await r.text();

    let body;
    if (isJson) {
      try {
        body = raw.trim() ? JSON.parse(raw) : {};
      } catch (err) {
        console.error("Remote JSON parse error:", err);
        body = {
          _parseError: "Invalid JSON returned",
          text: raw.substring(0, 500),
        };
      }
  //    body._vercelGeo = {
          // country: req.headers["x-vercel-ip-country"],
          // region: req.headers["x-vercel-ip-country-region"],
          // city: req.headers["x-vercel-ip-city"],
          // continent: req.headers["x-vercel-ip-continent"]
          
    //    };
body._vercelGeo = Object.fromEntries(
  Object.entries(req.headers).filter(([key]) =>
    key.startsWith("x-vercel-")
  )
);
        

    } else {
      body = raw;
    }

    return res
      .status(r.status)
      .setHeader("Content-Type", "application/json")
      .json(body);
  } catch (err) {
    console.error("Proxy error", err);
    return res.status(500).json({ error: err.message });
  }
}
