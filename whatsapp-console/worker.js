const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
});

function b64urlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
function decodePart(value) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(value)));
}
async function verifyAccess(request, env) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token || !env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const header = decodePart(parts[0]), payload = decodePart(parts[1]);
    if (header.alg !== "RS256" || !payload.exp || payload.exp <= Date.now() / 1000) return false;
    const issuer = env.CF_ACCESS_TEAM_DOMAIN.replace(/\/$/, "") + "/";
    if (payload.iss !== issuer || !Array.isArray(payload.aud) || !payload.aud.includes(env.CF_ACCESS_AUD)) return false;
    if (String(payload.email || "").toLowerCase() !== "bessie.bsbsh@gmail.com") return false;
    const jwksResponse = await fetch(issuer + "cdn-cgi/access/certs", { cf: { cacheTtl: 300 } });
    if (!jwksResponse.ok) return false;
    const jwks = await jwksResponse.json();
    const jwk = jwks.keys.find(k => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return false;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlToBytes(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  } catch { return false; }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/whatsapp/send") return json({ error: "Not found" }, 404);
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!await verifyAccess(request, env)) return json({ error: "Acesso não autorizado" }, 401);
    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_GRAPH_VERSION) {
      return json({ error: "Backend ainda não configurado. Cadastre os secrets e variáveis da Cloudflare." }, 503);
    }
    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido" }, 400); }
    const phone = String(body.phone || "").replace(/\D/g, "");
    const template = String(body.template || "");
    const language = String(body.language || "pt_BR");
    const parameters = Array.isArray(body.parameters) ? body.parameters : [];
    if (!/^\d{10,15}$/.test(phone)) return json({ error: "Telefone inválido: use formato internacional com DDI." }, 400);
    if (!/^[a-zA-Z0-9_]{2,128}$/.test(template)) return json({ error: "Nome de template inválido." }, 400);
    if (!/^[a-z]{2}_[A-Z]{2}$/.test(language)) return json({ error: "Idioma inválido." }, 400);
    if (parameters.length > 20 || parameters.some(p => typeof p !== "string" || p.length > 500)) return json({ error: "Parâmetros inválidos." }, 400);
    const payload = {
      messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "template",
      template: { name: template, language: { code: language }, ...(parameters.length ? { components: [{ type: "body", parameters: parameters.map(text => ({ type: "text", text })) }] } : {}) }
    };
    const apiResponse = await fetch("https://graph.facebook.com/" + env.WHATSAPP_GRAPH_VERSION + "/" + env.WHATSAPP_PHONE_NUMBER_ID + "/messages", {
      method: "POST",
      headers: { authorization: "Bearer " + env.WHATSAPP_TOKEN, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await apiResponse.json().catch(() => ({}));
    if (!apiResponse.ok) return json({ error: result.error?.message || "A API do WhatsApp recusou o envio.", code: result.error?.code || null }, 502);
    return json({ messageId: result.messages?.[0]?.id || null, status: "accepted" });
  }
};