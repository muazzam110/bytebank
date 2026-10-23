// The client NEVER decides money values. It only FORMATS integers that the server sent.
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatINR = (paise) => inr.format(paise / 100); // 10000000 → ₹1,00,000.00 (Indian grouping)

// For the hero typography: big whole part, small ₹ and small .00
export function splitINR(paise) {
  const abs = Math.abs(paise);
  return {
    symbol: "₹",
    whole: new Intl.NumberFormat("en-IN").format(Math.floor(abs / 100)),
    fraction: String(abs % 100).padStart(2, "0"),
  };
}

export const maskAccount = (n) => `•••• ${n.slice(-4)}`;

// UX-ONLY helpers for the amount box. The server stays the authority:
// we SEND the typed string, never this number, and never store it.
// "500.5" → 50050, or null if it isn't a valid amount. Pure string math, no floats.
export function rupeesStringToPaise(input) {
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(input)) return null;
  const [whole, fraction = ""] = input.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export const paiseToInputString = (paise) =>
  `${Math.floor(paise / 100)}.${String(paise % 100).padStart(2, "0")}`; // 950000 → "9500.00"
