import fs from 'fs/promises';
import path from 'path';
import { handleCorsDef } from '../../helpers.js';
import { upsertCustomData } from "../../lib/customdtService";

export default async function handler(req, res) {
  // Vérifie le CORS
  if (!handleCorsDef(req, res)) return;

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const incoming = req.body || {};
    const { authUrl } = incoming;
    if (!authUrl) return res.status(400).json({ error: 'authUrl is required in the body' });

    // Prepare body to send to authUrl.
    // Heuristics: if grant_type or username/password present, send as application/x-www-form-urlencoded
    const isForm = !!(incoming.grant_type || incoming.username || incoming.password || incoming.scope || incoming.formUrlEncoded);

    const headers = {};
    let bodyToSend;

    // Optionally support Basic auth header if user passes useBasicAuth true
    if (incoming.useBasicAuth && incoming.client_id && incoming.client_secret) {
      const pair = `${incoming.client_id}:${incoming.client_secret}`;
      const basic = Buffer.from(pair).toString('base64');
      headers['Authorization'] = 'Basic ' + basic;
    }

    if (isForm) {
      const params = new URLSearchParams();
      // copy relevant fields except control flags
      for (const [k, v] of Object.entries(incoming)) {
        if (k === 'authUrl' || k === 'formUrlEncoded' || k === 'useBasicAuth') continue;
        // skip undefined
        if (v === undefined || v === null) continue;
        params.append(k, String(v));
      }
      bodyToSend = params.toString();
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else {
      // default to JSON
      const payload = { ...incoming };
      delete payload.authUrl;
      bodyToSend = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
    }

    const r = await fetch(authUrl, {
      method: 'POST',
      headers,
      body: bodyToSend
    });

    // try to parse JSON, fallback to text
    let json;
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) json = await r.json();
    else json = { text: await r.text() };

    // Try to extract a token from common fields
    const token = (json && (json.access_token || json.token || json.id_token || json.accessToken)) || null;

    const data = {
      storedAt: new Date().toISOString(),
      authUrl,
      token,
      raw: json
    };

//    const dataDir = path.join(process.cwd(), 'data');
//    await fs.mkdir(dataDir, { recursive: true });
//    await fs.writeFile(path.join(dataDir, 'token.json'), JSON.stringify(data, null, 2), 'utf8');
//    console.log("Storing token data:", data)
   await upsertCustomData("OAUTH_PARAM","CEGID","TOKEN", "KEY", data);

    return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, stored: true, hasToken: !!token, raw: json });
  } catch (err) {
    console.error('auth error', err);
    return res.status(500).json({ error: err.message });
  }
}
