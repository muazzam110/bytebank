export const initials = (name = "") =>
  name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

// Same name → same colour (DESIGN: "gradient seeded from name hash")
export function avatarGradient(name = "") {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  return `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 45) % 360} 70% 42%))`;
}
