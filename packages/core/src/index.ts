// @wally/core — núcleo de domínio puro (sem I/O, sem framework).
// Aritmética monetária, divisão por maior resto e cálculo de saldos de grupo.
export {
  MoneyError,
  assertCents,
  assertNonNegativeCents,
  assertPositiveCents,
  addCents,
  formatCents,
} from './money'
export { splitByLargestRemainder, splitEqually } from './split'
export {
  computeBalances,
  simplifyDebts,
  type ShareInput,
  type ExpenseInput,
  type SettlementInput,
  type BalancesInput,
  type Transfer,
} from './balances'
