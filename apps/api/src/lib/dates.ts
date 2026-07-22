/** Period ranges in UTC. `end` is exclusive: the start of the next period. */

export interface DateRange {
  start: Date
  end: Date
}

export function monthRange(now: Date): DateRange {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  return {
    start: new Date(Date.UTC(y, m, 1)),
    end: new Date(Date.UTC(y, m + 1, 1)),
  }
}

export function yearRange(now: Date): DateRange {
  const y = now.getUTCFullYear()
  return {
    start: new Date(Date.UTC(y, 0, 1)),
    end: new Date(Date.UTC(y + 1, 0, 1)),
  }
}

/** Week starting on Monday, in UTC. */
export function weekRange(now: Date): DateRange {
  const day = now.getUTCDay() // 0=domingo
  const diffToMonday = (day + 6) % 7
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - diffToMonday,
    ),
  )
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 7)
  return { start, end }
}

export function periodRange(
  period: 'weekly' | 'monthly' | 'yearly',
  now: Date,
): DateRange {
  if (period === 'weekly') return weekRange(now)
  if (period === 'yearly') return yearRange(now)
  return monthRange(now)
}
