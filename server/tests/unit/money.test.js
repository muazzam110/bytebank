import { describe, it, expect } from "vitest";
import { parseRupeesToPaise, paiseToRupeesString, formatRupees } from "../../src/utils/money.js";

describe("parseRupeesToPaise", () => {
  it.each([
    ["500.00", 50000],
    ["500", 50000],
    ["500.5", 50050],
    ["0.01", 1],
    ["0.1", 10],
    ["1000000", 100000000],
  ])("%s → %i", (input, expected) => expect(parseRupeesToPaise(input)).toBe(expected));
  it.each(["0", "0.00", "-5", "1.234", "1e3", "abc", "", " 5", "5 ", "1,000", 500, null, undefined])(
    "rejects %j",
    (input) => expect(() => parseRupeesToPaise(input)).toThrow()
  );
});

describe("paiseToRupeesString", () => {
  it("formats", () => {
    expect(paiseToRupeesString(1000000)).toBe("10000.00");
    expect(paiseToRupeesString(5)).toBe("0.05");
  });
});

describe("formatRupees", () => {
  it("uses Indian grouping", () => {
    expect(formatRupees(950000)).toBe("₹9,500.00");
    expect(formatRupees(10000000)).toBe("₹1,00,000.00");
  });
});
