export function sendJson(res, data, status = 200) {
  res.status(status).json(data);
}

export function handleCors(req, res, allowedOrigins = []) {
  let origin = req.headers.origin || "";
  if (!origin) { origin = "*.*"; }
  console.log("origin", origin);
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    console.log("Domaine autorisé "+origin);
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Expose-Headers", "Content-Type, Authorization, X-Requested-With");

    return true;
  } else {
    console.log("Domaine non autorisé "+origin); 
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    console.log("CORS refusé pour l'origine :", origin);
    res.end(JSON.stringify({ error: "Origine "+origin+" non autorisée" }));
    return false;
  }
}

export function handleCorsDef(req, res) {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://viseo.vercel.app",
    "https://viseo.worldlite.fr",
    "https://retail-services.cegid.cloud",
    "*",
    "*.*"
  ];
  return handleCors(req, res, allowedOrigins)
}