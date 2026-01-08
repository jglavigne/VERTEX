import { getCustomData, upsertCustomData } from "./customdtService";

// Cache mémoire
const oauthCache = {
  token: null,
  expiresAt: null,
};

// lock global anti double-refresh
let refreshPromise = null;

// marge de sécurité : 5 minutes
const SAFETY_MARGIN = 5 * 60 * 1000;

function computeExpiry(expiresInSec) {
  return new Date(Date.now() + expiresInSec * 1000).toISOString();
}

export async function getValidToken(lastStatusCode = null) {
  const now = Date.now();
  const shouldRefresh = lastStatusCode === 401;
  // 1) Si cache mémoire valide, on retourne direct
 // if (
 //   oauthCache.token &&
 //   oauthCache.expiresAt &&
 //   new Date(oauthCache.expiresAt).getTime() - now > SAFETY_MARGIN
 // ) {
 //   return oauthCache.token; // ⚡ instantané
//  }

  // 2) Vérifier la DB si cache vide ou presque expiré
  if (!shouldRefresh) {
    const dbToken = await getCustomData(
      "OAUTH_PARAM",
      "CEGID",
      "TOKEN",
      "LAST_TOKEN"
    );
    console.log("TKN Vérifier la DB")
    if (dbToken?.token && dbToken?.expiresAt) {
      const expires = new Date(dbToken.expiresAt).getTime();
      if (expires - now > SAFETY_MARGIN) {
        // mettre en cache mémoire
        oauthCache.token = dbToken.token;
        oauthCache.expiresAt = dbToken.expiresAt;
        return dbToken.token;
      }
    }
  }
  // 3) Token absent, expiré ou 401 → refresh
  return await refreshTokenSafe();
}

async function refreshTokenSafe() {
  if (refreshPromise) {
    return await refreshPromise; // un refresh est déjà en cours → on attend
  }

  refreshPromise = refreshOAuthToken().finally(() => {
    refreshPromise = null;
  });

  return await refreshPromise;
}

async function refreshOAuthToken() {
  const params = await loadOAuthParams();
  const url = params.authUrl;
  console.log("OAuth refreshOAuthToken", url);
  if (!url) throw new Error("authUrl missing in DB");

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k !== "authUrl") body.append(k, v);
  }

  let lastErr = null;

  // Retry automatique 3 fois
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const json = await r.json();

      if (!r.ok) throw new Error("OAuth error: " + JSON.stringify(json));

      const token = json.access_token;
      const expiresAt = computeExpiry(json.expires_in);

      // store DB
      await upsertCustomData("OAUTH_PARAM", "CEGID", "TOKEN", "LAST_TOKEN", {
        token,
        expiresAt,
        raw: json,
      });

      // store memory cache
      oauthCache.token = token;
      oauthCache.expiresAt = expiresAt;

      return token;
    } catch (err) {
      lastErr = err;

      // attendre avant retry
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  throw lastErr;
}

async function loadOAuthParams() {
  const keys = [
    "authUrl",
    "client_id",
    "scope",
    "username",
    "password",
    "grant_type",
  ];

  const params = {};

  for (const key of keys) {
    const value = await getCustomData("OAUTH_PARAM", "CEGID", "TOKEN", key);
    if (value !== null && value !== undefined) params[key] = value;
  }

  return params;
}
