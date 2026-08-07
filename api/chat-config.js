import { kv } from "@vercel/kv";

function ipInCidr(ip, cidr) {
  try {
    const [rangeIp, prefixStr] = cidr.split("/");
    const prefix = parseInt(prefixStr, 10);

    const toInt = (addr) =>
      addr.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;

    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

    return (toInt(ip) & mask) === (toInt(rangeIp) & mask);
  } catch {
    return false;
  }
}

async function handleStatus(req, res) {
  try {
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown";

    const deviceFingerprint = req.query.fp || null;

    const [chatStored, maintenanceStored, isBanned, bannedRanges, isFingerprintBanned] = await Promise.all([
      kv.get("tyler_ai_chat_enabled"),
      kv.get("site_maintenance_enabled"),
      kv.sismember("banned_ips", clientIp),
      kv.smembers("banned_ranges"),
      deviceFingerprint ? kv.sismember("banned_fingerprints", deviceFingerprint) : Promise.resolve(false)
    ]);

    const enabled =
      chatStored === null || chatStored === undefined
        ? true
        : chatStored === "true" || chatStored === true;

    const maintenance =
      maintenanceStored === "true" || maintenanceStored === true;

    const isInBannedRange = (bannedRanges || []).some((range) => ipInCidr(clientIp, range));
    const ipBlocked = Boolean(isBanned) || isInBannedRange || Boolean(isFingerprintBanned);

    return res.status(200).json({ enabled, maintenance, ipBlocked });
  } catch (err) {
    console.error(err);
    // Fail open — a broken status check shouldn't take down the widget or the site.
    return res.status(200).json({ enabled: true, maintenance: false, ipBlocked: false });
  }
}

async function requireSession(req, res) {
  const sessionToken = req.headers.authorization?.replace("Bearer ", "");

  if (!sessionToken) {
    res.status(401).json({ error: "Not signed in." });
    return null;
  }

  const sessionValid = await kv.get(`webauthn_session_${sessionToken}`);

  if (!sessionValid) {
    res.status(401).json({ error: "Session expired. Please sign in again." });
    return null;
  }

  return sessionToken;
}

async function handleToggle(req, res) {
  if (!(await requireSession(req, res))) return;

  try {
    const { enabled, maintenance } = req.body;

    if (typeof enabled === "boolean") {
      await kv.set("tyler_ai_chat_enabled", enabled ? "true" : "false");
      return res.status(200).json({ success: true, enabled });
    }

    if (typeof maintenance === "boolean") {
      await kv.set("site_maintenance_enabled", maintenance ? "true" : "false");

      await kv.lpush(
        "site_maintenance_log",
        JSON.stringify({
          id: crypto.randomUUID(),
          action: maintenance ? "enabled" : "disabled",
          timestamp: new Date().toISOString()
        })
      );

      return res.status(200).json({ success: true, maintenance });
    }

    return res.status(400).json({ error: "Invalid request." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return handleStatus(req, res);
  }

  if (req.method === "POST") {
    return handleToggle(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
