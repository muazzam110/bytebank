import { format, parse } from "date-fns";

const IST = "Asia/Kolkata";
const full = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: IST,
});
const short = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: IST,
});

// Display ALWAYS in IST: timestamps are UTC in the DB and rendered per ARCHITECTURE §11
export const formatDateTime = (iso) => full.format(new Date(iso)); // 12 Oct 2026, 6:42 pm
export const formatShortDateTime = (iso) => short.format(new Date(iso)); // 12 Oct, 6:42 pm

// "YYYY-MM-DD" ⇄ Date: what the filters send to the server, and what the Calendar understands
export const toIsoDay = (date) => format(date, "yyyy-MM-dd");
export const fromIsoDay = (s) => parse(s, "yyyy-MM-dd", new Date());

export function formatRangeLabel(from, to) {
  const f = (s) => format(fromIsoDay(s), "d MMM yyyy");
  if (from && to) return from === to ? f(from) : `${f(from)} – ${f(to)}`;
  if (from) return `From ${f(from)}`;
  if (to) return `Until ${f(to)}`;
  return "Any date";
}
