export const TYPE_LABELS = {
  INITIAL_DEPOSIT: "Initial deposit",
  TRANSFER: "Transfer",
  ADMIN_DEPOSIT: "Admin deposit",
};
export const STATUS_LABELS = { COMPLETED: "Completed", PENDING: "Pending", FAILED: "Failed" };

// Deposits have no human counterparty; they come from the bank itself
export function counterpartyLabel(tx) {
  if (tx.type === "INITIAL_DEPOSIT") return "Bytebank";
  if (tx.type === "ADMIN_DEPOSIT") return "Bytebank (admin deposit)";
  return tx.counterparty?.name ?? "Unknown";
}

// the <Money> component speaks "credit" / "debit"
export const moneyDirection = (tx) => (tx.direction === "received" ? "credit" : "debit");
