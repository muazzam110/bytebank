export const DIRECTIONS = ["all", "sent", "received"];
export const TYPES = ["INITIAL_DEPOSIT", "TRANSFER", "ADMIN_DEPOSIT"];
export const STATUSES = ["COMPLETED", "FAILED"];
export const SORTS = ["-createdAt", "createdAt", "-amount", "amount"];
export const LIMITS = [10, 20, 50, 100];

export const DEFAULT_FILTERS = {
  q: "",
  direction: "all",
  type: "",
  status: "",
  from: "",
  to: "",
  page: 1,
  sort: "-createdAt",
  limit: 20,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SPAN_DAYS = 366; // same rule as the server

function isRealDay(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// URL → filters. The URL is typed by humans, so EVERY value is checked; bad values fall back to defaults.
// That way a hand-edited link never produces a server 400.
export function parseFilters(params) {
  const pick = (key, allowed, fallback) => (allowed.includes(params.get(key)) ? params.get(key) : fallback);
  const page = Number.parseInt(params.get("page") ?? "", 10);
  const limit = Number.parseInt(params.get("limit") ?? "", 10);

  let from = isRealDay(params.get("from") ?? "") ? params.get("from") : "";
  let to = isRealDay(params.get("to") ?? "") ? params.get("to") : "";
  if (from && to) {
    const span = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
    if (from > to || span > MAX_SPAN_DAYS) {
      from = "";
      to = "";
    }
  }

  return {
    q: (params.get("q") ?? "").trim().slice(0, 40),
    direction: pick("direction", DIRECTIONS, DEFAULT_FILTERS.direction),
    type: pick("type", TYPES, ""),
    status: pick("status", STATUSES, ""),
    from,
    to,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    sort: pick("sort", SORTS, DEFAULT_FILTERS.sort),
    limit: LIMITS.includes(limit) ? limit : DEFAULT_FILTERS.limit,
  };
}

// filters → canonical query string (defaults omitted → the default view has a clean URL)
export function serializeFilters(f) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.direction !== DEFAULT_FILTERS.direction) p.set("direction", f.direction);
  if (f.type) p.set("type", f.type);
  if (f.status) p.set("status", f.status);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.sort !== DEFAULT_FILTERS.sort) p.set("sort", f.sort);
  if (f.limit !== DEFAULT_FILTERS.limit) p.set("limit", String(f.limit));
  if (f.page !== 1) p.set("page", String(f.page));
  return p.toString();
}

// limit/sort are VIEW preferences, not filters
export const hasActiveFilters = (f) => Boolean(f.q || f.direction !== "all" || f.type || f.status || f.from || f.to);
