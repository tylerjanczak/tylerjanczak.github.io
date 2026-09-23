import { kv } from "@vercel/kv";
import { createHash } from "crypto";

const MAX_TEXTS_PER_REQUEST = 60;
const MAX_TEXT_LENGTH = 500;
const CONCURRENCY = 5;
const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

function cacheKeyFor(lang, text) {
  const hash = createHash("sha1").update(text).digest("hex");
  return `${lang}::${hash}`;
}

async function translateOne(text, lang) {
  const params = new URLSearchParams({
    q: text,
    langpair: `en|${lang}`
  });

  const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`, {
    headers: { "User-Agent": "tylerjanczak.com accessibility widget" }
  });

  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  const status = data?.responseStatus;

  // MyMemory returns 200 even when it's actually refusing (quota, bad
  // langpair) — it signals that in the text itself, so check for it.
  const looksLikeRefusal =
    typeof translated !== "string" ||
    /MYMEMORY WARNING|QUOTA|INVALID LANGUAGE/i.test(translated);

  if (status !== 200 || looksLikeRefusal) {
    // Fail soft: hand back the original text untranslated rather than
    // breaking the page, and don't cache it so a later request can retry
    // once quota resets.
    return { text, ok: false };
  }

  return { text: translated, ok: true };
}

async function translateBatch(texts, lang) {
  const results = new Array(texts.length);
  let cursor = 0;

  async function worker() {
    while (cursor < texts.length) {
      const i = cursor++;
      try {
        results[i] = await translateOne(texts[i], lang);
      } catch {
        results[i] = { text: texts[i], ok: false };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker)
  );

  return results;
}

async function handleTranslate(req, res) {
  try {
    const { lang, texts } = req.body || {};

    if (
      !lang ||
      typeof lang !== "string" ||
      !/^[a-zA-Z-]{2,10}$/.test(lang) ||
      !Array.isArray(texts)
    ) {
      return res.status(400).json({ error: "Invalid payload." });
    }

    if (lang.toLowerCase() === "en") {
      // Nothing to translate — the caller should be restoring originals
      // client-side instead of calling this endpoint for English.
      return res.status(200).json({ translations: texts });
    }

    const trimmedTexts = texts
      .slice(0, MAX_TEXTS_PER_REQUEST)
      .map((t) => (typeof t === "string" ? t.slice(0, MAX_TEXT_LENGTH) : ""));

    // Look up whichever of these we've already translated before, for
    // this exact language, anywhere on the site.
    const cacheKeys = trimmedTexts.map((t) => cacheKeyFor(lang, t));
    const cached = await Promise.all(
      cacheKeys.map((key) => (key ? kv.hget("translate_cache", key) : null))
    );

    const toFetch = [];
    const toFetchIndexes = [];

    trimmedTexts.forEach((text, i) => {
      if (!text.trim()) return;
      if (cached[i] === null || cached[i] === undefined) {
        toFetch.push(text);
        toFetchIndexes.push(i);
      }
    });

    const fetched =
      toFetch.length > 0 ? await translateBatch(toFetch, lang) : [];

    const output = trimmedTexts.map((text, i) => cached[i] ?? text);

    const cacheWrites = {};
    fetched.forEach((result, j) => {
      const i = toFetchIndexes[j];
      output[i] = result.text;
      // Only cache successful, non-trivial translations — never cache a
      // quota-refusal or an untranslated echo, so it's retried later.
      if (result.ok && result.text && result.text !== trimmedTexts[i]) {
        cacheWrites[cacheKeys[i]] = result.text;
      }
    });

    if (Object.keys(cacheWrites).length > 0) {
      await kv.hset("translate_cache", cacheWrites);
    }

    return res.status(200).json({ translations: output });
  } catch (err) {
    console.error("Translate endpoint failed:", err);
    // Fail soft — the widget falls back to the untranslated original text.
    return res.status(200).json({ translations: (req.body?.texts || []) });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return handleTranslate(req, res);
}
