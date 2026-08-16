import { kv } from "@vercel/kv";

// Runs on Vercel's Edge Network before any page is sent to the browser —
// a banned visitor never receives the real page content at all, not even
// for a flash. Only checks IP and subnet bans; device fingerprint bans
// still rely on the client-side check in tyler-ai.js, since a fingerprint
// requires JavaScript to run in an already-loaded page first.

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"]
};

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

function buildBlockedPage() {
  const patternSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260">
    <g stroke="#d9d2c4" stroke-width="1.5" fill="none" opacity="0.9">
      <g transform="translate(28,36)">
        <path d="M10 50 L10 15 Q10 0 20 0 Q30 0 30 15 L30 50 L20 62 Z"/>
        <circle cx="20" cy="18" r="5"/>
        <path d="M10 40 L0 55 L10 50 Z"/>
        <path d="M30 40 L40 55 L30 50 Z"/>
      </g>
      <g transform="translate(190,34)">
        <circle cx="0" cy="0" r="13"/>
        <ellipse cx="0" cy="0" rx="25" ry="7" transform="rotate(-20)"/>
      </g>
      <path d="M92,96 L96,106 L106,106 L98,112 L101,122 L92,116 L83,122 L86,112 L78,106 L88,106 Z"/>
      <g transform="translate(205,155) rotate(25) scale(0.65)">
        <path d="M10 50 L10 15 Q10 0 20 0 Q30 0 30 15 L30 50 L20 62 Z"/>
        <circle cx="20" cy="18" r="5"/>
      </g>
      <g transform="translate(55,195)">
        <circle cx="0" cy="0" r="9"/>
        <ellipse cx="0" cy="0" rx="18" ry="5" transform="rotate(15)"/>
      </g>
      <path d="M225,222 l3,7 l7,0 l-5,5 l2,7 l-7,-4 l-7,4 l2,-7 l-5,-5 l7,0 Z"/>
    </g>
  </svg>`;

  const patternUrl = `data:image/svg+xml,${encodeURIComponent(patternSvg)}`;

  const shipSvg = `<svg width="140" height="150" viewBox="0 0 150 160" xmlns="http://www.w3.org/2000/svg">
    <polygon points="75,58 48,112 102,112" fill="#fdf6d8" opacity="0.85"/>
    <g>
      <ellipse cx="75" cy="34" rx="17" ry="30" fill="#3a4a63"/>
      <path d="M58 30 Q75 -2 92 30 L92 34 Q75 42 58 34 Z" fill="#2a3750"/>
      <ellipse cx="75" cy="30" rx="9" ry="12" fill="#7fb3d5" stroke="#25324a" stroke-width="1.5"/>
      <ellipse cx="75" cy="30" rx="5" ry="7" fill="#cfe8f7" opacity="0.7"/>
      <path d="M58 44 L44 58 L58 56 Z" fill="#25324a"/>
      <path d="M92 44 L106 58 L92 56 Z" fill="#25324a"/>
      <ellipse cx="75" cy="58" rx="16" ry="6" fill="#25324a"/>
      <circle cx="66" cy="58" r="2.4" fill="#f2c94c"/>
      <circle cx="75" cy="59" r="2.4" fill="#f2c94c"/>
      <circle cx="84" cy="58" r="2.4" fill="#f2c94c"/>
    </g>
    <g transform="translate(78,98)">
      <line x1="-15" y1="9" x2="-16" y2="21" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round"/>
      <line x1="-4" y1="10" x2="-4" y2="22" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="10" x2="6" y2="22" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round"/>
      <line x1="11" y1="9" x2="12" y2="21" stroke="#1b1b1b" stroke-width="2" stroke-linecap="round"/>
      <path d="M17 1 Q23 5 21 12" stroke="#1b1b1b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M -18 5 Q -20 -6 -9 -8 L 11 -9 Q 20 -9 20 0 Q 20 8 10 9 L -12 9 Q -18 9 -18 5 Z" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.5"/>
      <path d="M -18 -2 Q -28 -5 -30 2 Q -31 8 -25 10 L -18 5 Z" fill="#ffffff" stroke="#1b1b1b" stroke-width="1.5"/>
      <ellipse cx="-24" cy="-6" rx="3.4" ry="2" fill="#f4c9c9" stroke="#1b1b1b" stroke-width="1.1" transform="rotate(-30 -24 -6)"/>
      <path d="M-21 -9 Q-22.5 -12 -19 -13" stroke="#e0c992" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <circle cx="-25" cy="1" r="1.1" fill="#1b1b1b"/>
      <path d="M -3 -8 Q 5 -9 9 -6 Q 10 -2 5 -1 Q -1 -1 -3 -4 Z" fill="#c98a4b"/>
      <path d="M -10 1 Q -7 0 -6 3 Q -8 5 -10 4 Z" fill="#8a5a35"/>
      <path d="M 12 -2 Q 15.5 -2 15 1.5 Q 13 2.5 11 1 Z" fill="#8a5a35"/>
    </g>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex, nofollow" />
<title>Access Denied</title>
</head>
<body style="margin:0;">
  <div style="
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f7f4ee;
    background-image: url('${patternUrl}');
    background-size: 260px 260px;
    background-repeat: repeat;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    padding: 24px;
  ">
    <div style="
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 30px 70px rgba(0,0,0,0.22);
      max-width: 420px;
      width: 100%;
      overflow: hidden;
      text-align: center;
    ">
      <div style="padding: 26px 28px 4px; display: flex; justify-content: center;">${shipSvg}</div>
      <div style="padding: 4px 30px 30px;">
        <div style="display: flex; justify-content: center; margin-bottom: 16px;">
          <div style="width: 60px; border-radius: 5px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.12);">
            <div style="
              height: 46px;
              background: repeating-linear-gradient(-45deg, #d94a40, #d94a40 5px, #b3261e 5px, #b3261e 10px);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2 L23 21 L1 21 Z" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
                <rect x="11" y="9" width="2" height="6" fill="#ffffff"/>
                <rect x="11" y="16.5" width="2" height="2" fill="#ffffff"/>
              </svg>
            </div>
          </div>
        </div>
        <div style="font-family: Georgia, serif; font-size: 25px; font-weight: 700; color: #b3261e; margin-bottom: 6px; line-height: 1.2;">
          Hard Stop: Error
        </div>
        <div style="font-size: 18px; font-weight: 600; color: #1b1b1b; margin-bottom: 14px;">
          Access Denied
        </div>
        <div style="margin-top: 10px; padding-top: 16px; border-top: 1px solid #e2ddd0; font-size: 11px; letter-spacing: 0.06em; color: #8b857e;">
          &copy; 2026 Tyler Janczak
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export default async function middleware(request) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const [isBanned, bannedRanges] = await Promise.all([
      kv.sismember("banned_ips", clientIp),
      kv.smembers("banned_ranges")
    ]);

    const isInBannedRange = (bannedRanges || []).some((range) => ipInCidr(clientIp, range));

    if (isBanned || isInBannedRange) {
      return new Response(buildBlockedPage(), {
        status: 403,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
  } catch (err) {
    // Fail open — a broken KV check should never take the whole site down.
    console.error("Middleware ban check failed:", err);
  }

  // Not blocked — let the request through untouched.
}
