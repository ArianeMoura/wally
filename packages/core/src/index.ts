// @wally/core — pure domain core: no I/O, no framework.
// Money arithmetic, largest-remainder splitting and group balance calculation.
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
