// Harud AI API (Cloudflare Worker)

const MODELS = ["gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

const ALLOWED_ORIGIN = "*";

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const path = new URL(request.url).pathname;
    if (path === "/advisories" && request.method === "GET") return getAdvisories(env);
    if (path === "/content" && request.method === "GET") return json(await loadContent(env));
    if (path.startsWith("/img/") && request.method === "GET") return getImage(path.slice(5), env);
    if (path.startsWith("/admin/") && request.method === "POST") return adminAction(path, request, env);
    if (request.method !== "POST") return json({ error: "POST only" }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Bad request" }, 400);
    }

    const { image, mediaType, crop } = body;
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!image || !okTypes.includes(mediaType)) return json({ error: "Invalid image" }, 400);
    if (image.length > 5_000_000) return json({ error: "Image too large" }, 413);

    const safeCrop = String(crop || "Apple").slice(0, 20);

    const prompt =
      `You are an agricultural plant-pathologist assistant for farmers in Kashmir, India. ` +
      `First check: does this photo actually show a real leaf, fruit, plant, crop field or something you can meaningfully diagnose? ` +
      `If it does NOT, respond with ONLY this JSON: ` +
      `{"is_valid_crop_photo":false,"message_en":"This doesn't look like a photo of a crop, leaf or fruit. Please upload a clear photo of the affected plant.","message_ur":"یہ فصل، پتے یا پھل کی تصویر نظر نہیں آتی۔ براہ کرم متاثرہ پودے کی واضح تصویر اپلوڈ کریں۔","message_hi":"यह फसल, पत्ते या फल की तस्वीर नहीं लगती। कृपया प्रभावित पौधे की साफ़ तस्वीर अपलोड करें।","message_hl":"Ye fasal, patte ya phal ki photo nahi lag rahi. Please prabhavit paudhe ki saaf photo upload karein."}\n` +
      `If it DOES show a real ${safeCrop} leaf, fruit or plant, identify the most likely disease or disorder (or say healthy), and respond with ONLY a raw JSON object, no markdown, in exactly this shape:\n` +
      `{"is_valid_crop_photo":true,"crop":"...","disease_en":"...","severity":"low|medium|high","confidence":0-100,` +
      `"cause_en":"...","cause_ur":"...","cause_hi":"...","cause_hl":"...","treatment_en":"...","treatment_ur":"...","treatment_hi":"...","treatment_hl":"...",` +
      `"prevention_en":"...","prevention_ur":"...","prevention_hi":"...","prevention_hl":"...","weather_risk_en":"...","weather_risk_ur":"...","weather_risk_hi":"...","weather_risk_hl":"..."}\n` +
      `Safety rules: never give pesticide doses, concentrations, mixing ratios or spray schedules (no numbers like g/L or ml/L). You may name a general type of treatment, but always add that the farmer should confirm the product and dose with a local agriculture officer before spraying. A photo alone cannot confirm a disease, so use cautious wording such as 'likely' or 'possible', and do not state a specific pathogen name as certain. If the photo is unclear or the cause is uncertain, say so and keep the confidence low. Keep each field to one short, practical sentence a farmer can act on. Write the *_ur fields in natural, simple Urdu and the *_hi fields in natural, simple Hindi (Devanagari) and the *_hl fields in Hinglish: simple conversational Hindi written in English/Roman letters, the way people chat on WhatsApp (example: "Haan, patton par spray karein"). Do not use Devanagari in *_hl fields.`;

    try {
      const payload = JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mediaType, data: image } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      });

      // Retry on temporary errors, then fall back to the next model.
      let res = null;
      for (const model of MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
            body: payload,
          });
          if (res.ok) break;
          if (res.status !== 503 && res.status !== 429 && res.status !== 500) break;
          await new Promise((r) => setTimeout(r, 1200));
        }
        if (res.ok) break;
      }

      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        return json({ error: "AI request failed", status: res.status, detail }, 502);
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const text = parts.map((p) => p.text || "").join("\n");
      const cleaned = text.replace(/```json|```/g, "").trim();
      return json(JSON.parse(cleaned));
    } catch (e) {
      return json({ error: "Could not analyze", detail: String(e).slice(0, 200) }, 500);
    }
  },
};

// ---------- Advisories (admin panel) ----------
async function loadList(env) {
  const raw = await env.ADVISORIES.get("list");
  return raw ? JSON.parse(raw) : [];
}

async function getAdvisories(env) {
  try {
    return json(await loadList(env));
  } catch {
    return json([]);
  }
}

async function adminAction(path, request, env) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  if (!env.ADMIN_PASSWORD || b.password !== env.ADMIN_PASSWORD) return json({ error: "Wrong password" }, 401);

  const list = await loadList(env);

  if (path === "/admin/check") return json({ ok: true });

  if (path === "/admin/text") {
    const key = String(b.key || "");
    if (!/^t[0-9a-f]{1,8}$/.test(key)) return json({ error: "Bad key" }, 400);
    const c = await loadContent(env);
    const val = String(b.value || "").trim().slice(0, 1000);
    if (val) c.texts[key] = val; else delete c.texts[key];
    await env.ADVISORIES.put("content", JSON.stringify(c));
    return json({ ok: true });
  }

  if (path === "/admin/image") {
    const key = String(b.key || "");
    if (!/^i[0-9a-f]{1,8}$/.test(key)) return json({ error: "Bad key" }, 400);
    const c = await loadContent(env);
    if (b.dataUrl) {
      const d = String(b.dataUrl);
      if (!/^data:image\/(jpeg|png|webp);base64,/.test(d) || d.length > 3_000_000) return json({ error: "Invalid or too large image" }, 400);
      await env.ADVISORIES.put("img:" + key, d);
      c.imgs[key] = Date.now().toString(36);
    } else {
      await env.ADVISORIES.delete("img:" + key);
      delete c.imgs[key];
    }
    await env.ADVISORIES.put("content", JSON.stringify(c));
    return json({ ok: true });
  }

  if (path === "/admin/add") {
    const title = String(b.title || "").trim().slice(0, 80);
    const message = String(b.message || "").trim().slice(0, 600);
    if (!title || !message) return json({ error: "Title and message required" }, 400);
    list.unshift({
      id: Date.now().toString(36),
      title,
      message,
      crop: String(b.crop || "All").slice(0, 20),
      date: new Date().toISOString().slice(0, 10),
    });
    await env.ADVISORIES.put("list", JSON.stringify(list.slice(0, 30)));
    return json({ ok: true });
  }

  if (path === "/admin/delete") {
    await env.ADVISORIES.put("list", JSON.stringify(list.filter((a) => a.id !== b.id)));
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

// ---------- Editable app content (texts + images) ----------
async function loadContent(env) {
  try {
    const raw = await env.ADVISORIES.get("content");
    const c = raw ? JSON.parse(raw) : {};
    return { texts: c.texts || {}, imgs: c.imgs || {} };
  } catch {
    return { texts: {}, imgs: {} };
  }
}

async function getImage(key, env) {
  const d = await env.ADVISORIES.get("img:" + key);
  if (!d) return new Response("Not found", { status: 404, headers: CORS });
  const m = d.match(/^data:(image\/[a-z]+);base64,(.*)$/s);
  if (!m) return new Response("Bad image", { status: 500, headers: CORS });
  const bytes = Uint8Array.from(atob(m[2]), (ch) => ch.charCodeAt(0));
  return new Response(bytes, {
    headers: { "Content-Type": m[1], "Cache-Control": "public, max-age=86400", ...CORS },
  });
}
