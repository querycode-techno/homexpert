/** Money is integer paise everywhere. Only display strings are formatted, and only here. */
export const money = (paise) => ({
  amountPaise: paise,
  currency: 'INR',
  display: `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: paise % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`,
})

/** round-half-up of paise * pct/100 (pct may be fractional, e.g. 18). */
export const pctOf = (paise, pct) => Math.floor((paise * pct) / 100 + 0.5)
