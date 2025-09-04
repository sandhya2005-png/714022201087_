export function isValidUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseValidInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  return n;
}

export function isValidShortcode(code) {
  if (!code) return false;
  if (code.length < 4 || code.length > 32) return false;
  return /^[a-zA-Z0-9]+$/.test(code);
}

export function generateCode(len = 6) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function nowISO() {
  return new Date().toISOString();
}

export function minutesFromNowISO(mins) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d.toISOString();
}

export function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

export function isExpired(iso) {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

export function getCoarseLocation() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
    const lang = navigator.language || "en";
    return `${tz} • ${lang}`;
  } catch {
    return "Unknown";
  }
}

