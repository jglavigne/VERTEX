"use client";

import { useState, useEffect } from "react";

type ApiOption = {
  value: string;
  label: string;
  dataContent?: string;
};

export default function ClientApiPage() {
  const apiOptions: ApiOption[] = [
    { value: "https://01k8tk4pgg8qy2vwt0z6yw7gq510-b7f49b16203cdddcaed6.requestinspector.com/", label: "Request Inspector" },
    { value: "https://viseo.free.nf/serv-apio.php?test=oui", label: "viseo.free.nf APIo" },
    { value: "https://viseo.free.nf/serv-apit.php?test=oui", label: "viseo.free.nf apit" },
    { value: "https://viseo.free.nf/see-headers.php?test=oui", label: "viseo.free.nf see-headers" },
    { value: "https://viseo.free.nf/JGPK1.php?customerCode=TEST", label: "viseo.free.nf JGPK1" },
    { value: "https://viseo.yzz.me/serv-apio.php?test=oui", label: "viseo.yzz.me APIo" },
    { value: "https://viseo.yzz.me/serv-apit.php?test=oui", label: "viseo.yzz.me apit" },
    { value: "https://viseo.yzz.me/see-headers.php?test=oui", label: "viseo.yzz.me see-headers" },
    { value: "https://viseo.yzz.me/JGPK1.php?customerCode=TEST", label: "viseo.yzz.me JGPK1" },
    { value: "https://viseo.vercel.app/api/promos", label: "viseo.vercel.app/api/promos" },
    { value: "https://viseo.vercel.app/api/send", label: "viseo.vercel.app/api/send" },
    {
      value: "https://viseo.vercel.app/api/proxy",
      label: "viseo.vercel.app/api/proxy",
      dataContent: JSON.stringify({
        url: "https://retail-services.cegid.cloud/t/pos/external-basket/v1",
        payload: {
          externalReference: "SimpleSale",
          basketType: "RECEIPT",
          customer: { customerCode: "001000000003" },
          itemLines: [
            {
              itemLineId: 1,
              discounts: [
                { discountReason: { discountReasonId: "PXCLB" }, discountAmount: { currency: "EUR", value: 10.5 } }
              ],
              item: { itemCode: "FM-050-5G-24M                    X" },
              quantity: 1,
              price: { basePrice: 105, currentPrice: 105 },
              lineAmount: { currency: "EUR", value: 94.5 },
              inventoryOrigin: { warehouseId: "ORLS" },
              externalReference: "LINEREF-0001",
              catalogReference: "CAT-2025-AUTUMN"
            }
          ],
          store: { storeId: "ORLS" }
        }
      })
    }
  ];

  const [apiUrl, setApiUrl] = useState(apiOptions[0].value);
  const [method, setMethod] = useState("POST");
  const [token, setToken] = useState("TOKEN4");
  const [timeout, setTimeoutValue] = useState(10000);
  const [queryInput, setQueryInput] = useState("");
  const [body, setBody] = useState<any>({});
  const [output, setOutput] = useState("");
  const [headersOutput, setHeadersOutput] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const selectedOption = apiOptions.find(opt => opt.value === apiUrl);
    if (selectedOption?.dataContent) {
      try {
        setBody(JSON.parse(selectedOption.dataContent));
      } catch {
        setBody({});
      }
    } else {
      setBody({});
    }
  }, [apiUrl]);

  function parseQueryInput(input: string) {
    const s = input.trim();
    if (!s) return null;

    try {
      const obj = JSON.parse(s);
      if (obj && typeof obj === "object") return obj;
    } catch { }

    const usp = new URLSearchParams(s);
    const out: any = {};
    for (const [k, v] of usp.entries()) {
      if (k in out) {
        out[k] = Array.isArray(out[k]) ? out[k].concat(v) : [out[k], v];
      } else out[k] = v;
    }
    return out;
  }

  async function callApi() {
    setStatusMsg("Appel en cours...");
    setOutput("");
    setHeadersOutput("");

    const query = parseQueryInput(queryInput);
    let finalUrl = apiUrl;

    if (query && typeof query === "object") {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) v.forEach(item => usp.append(k, String(item)));
        else usp.append(k, String(v));
      }
      const qs = usp.toString();
      if (qs) finalUrl += (finalUrl.includes("?") ? "&" : "?") + qs;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
        if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";
      }

      const fetchBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase()) ? JSON.stringify(body) : undefined;

      const res = await fetch(finalUrl, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
        redirect: "manual"
      });

      clearTimeout(timer);

      const raw = await res.text();
      let data;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

      const headersObj: any = {};
      res.headers.forEach((v, k) => { headersObj[k] = v; });

      setHeadersOutput(JSON.stringify({ ok: res.ok, status: res.status, statusText: res.statusText, url: finalUrl, headers: headersObj }, null, 2));
      setOutput(typeof data === "string" ? data : JSON.stringify(data, null, 2));
      setStatusMsg(res.ok ? `Succès (HTTP ${res.status})` : `Erreur (HTTP ${res.status})`);

    } catch (err: any) {
      clearTimeout(timer);
      setStatusMsg("Erreur réseau / timeout");
      setOutput(err.message || String(err));
    }
  }

  return (
    <main style={{ fontFamily: "system-ui", margin: 20 }}>
      <h1>Client API – GET/POST/PUT/DELETE</h1>

      <fieldset>
        <legend>Endpoint</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<div>
  <label>URL</label>
  <select
    value={apiUrl}
    onChange={(e) => {
      const selected = apiOptions.find(opt => opt.value === e.target.value);
      setApiUrl(e.target.value);
      // Mettre à jour l’input uniquement si dataContent est défini
      if (selected?.dataContent) {
        try {
          setBody(JSON.parse(selected.dataContent));
        } catch {
          setBody({});
        }
      }
    }}
  >
    {apiOptions.map(opt => (
      <option key={opt.value} value={opt.value} data-content={opt.dataContent}>
        {opt.label}
      </option>
    ))}
  </select>

  <input
    type="text"
    value={apiUrl} // c’est la valeur visible et modifiable
    onChange={(e) => setApiUrl(e.target.value)} // l’utilisateur peut la changer librement
    style={{ marginTop: "6px" }}
  />
</div>

        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12 }}>
          <div>
            <label>Authorization (Bearer)</label>
            <input type="text" value={token} onChange={e => setToken(e.target.value)} />
          </div>
          <div>
            <label>Timeout (ms)</label>
            <input type="number" value={timeout} onChange={e => setTimeoutValue(Number(e.target.value))} />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Paramètres</legend>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label>Query params</label>
            <textarea value={queryInput} onChange={e => setQueryInput(e.target.value)} rows={6} />
          </div>
          <div>
            <label>Body (JSON pour POST/PUT/PATCH/DELETE)</label>
            <textarea value={JSON.stringify(body, null, 2)} onChange={e => setBody(JSON.parse(e.target.value))} rows={6} />
          </div>
        </div>
      </fieldset>

      <div style={{ marginTop: 12 }}>
        <button onClick={callApi}>Envoyer</button>
        <span style={{ marginLeft: 12 }}>{statusMsg}</span>
      </div>

      <h3>Headers</h3>
      <pre style={{ background:"#0b1020", color:"#e7e7e7", padding:12, borderRadius:6, overflow:"auto" }}>{headersOutput}</pre>

      <h3>Réponse</h3>
      <pre style={{ background:"#0b1020", color:"#e7e7e7", padding:12, borderRadius:6, overflow:"auto" }}>{output}</pre>
    </main>
  );
}
