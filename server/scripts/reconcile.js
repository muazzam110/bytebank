import { connectDB, disconnectDB } from "../src/config/db.js";
import { runReconciliation } from "../src/services/reconcile.service.js";

let exitCode = 0;
try {
  await connectDB();
  const report = await runReconciliation();

  console.log("\nBytebank reconciliation\n");
  for (const c of report.checks) {
    console.log(`${c.ok ? "✅" : "❌"} (${c.id}) ${c.name}`);
    console.log(`     ${c.ok ? c.summary : `${c.problemCount} problem(s):`}`);
    c.problems.forEach((p) => console.log(`       - ${p}`));
  }
  const s = report.stats;
  console.log(
    `\nRESULT: ${report.ok ? "PASS" : "FAIL"}  (${s.accounts} accounts, ${s.transactions} transactions, ${s.ledgerEntries} ledger entries)\n`
  );
  exitCode = report.ok ? 0 : 1;
} catch (err) {
  console.error("Reconciliation could not run:", err);
  exitCode = 2;
} finally {
  await disconnectDB();
}
process.exit(exitCode); // non-zero on failure → usable in CI
