const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven",
  "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const below100 = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ""));
const below1000 = (n) => {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return [hundreds ? `${ONES[hundreds]} hundred` : "", rest ? below100(rest) : ""].filter(Boolean).join(" ");
};

function numberToWords(n) {
  if (n === 0) return "zero";
  const parts = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;
  if (crore) parts.push(`${numberToWords(crore)} crore`);
  if (lakh) parts.push(`${below100(lakh)} lakh`);
  if (thousand) parts.push(`${below100(thousand)} thousand`);
  if (n) parts.push(below1000(n));
  return parts.join(" ");
}

// 1000000 (paise) → "Ten thousand rupees only"
export function amountInWords(paise) {
  const rupees = Math.floor(paise / 100);
  const ps = paise % 100;
  let words = rupees > 0 ? `${numberToWords(rupees)} ${rupees === 1 ? "rupee" : "rupees"}` : "";
  if (ps) words += `${words ? " and " : ""}${numberToWords(ps)} paise`;
  const sentence = `${words || "zero rupees"} only`;
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}
