[← Back to Index](INDEX.md)

# Non-Registered Accounts

Functions for managing taxable investment accounts.

---

## TAXABLE_ACCOUNT_GROWTH

Projects growth of non-registered investment account.

```
=TAXABLE_ACCOUNT_GROWTH(currentBalance, costBase, annualContribution, years,
                        nominalReturn, inflationRate, turnoverRate, marginalTaxRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentBalance | number | Current account value |
| costBase | number | Adjusted cost base (ACB) |
| annualContribution | number | Annual contribution |
| years | number | Projection period |
| nominalReturn | number | Expected return (e.g., 0.06 for 6%) |
| inflationRate | number | Inflation rate (e.g., 0.02 for 2%) |
| turnoverRate | number | Portfolio turnover (e.g., 0.10 = 10%) |
| marginalTaxRate | number | Your marginal tax rate |

**Returns:** Year-by-year table with:
- Year
- Beginning Balance
- Contributions
- Growth
- Tax Paid (on realized gains)
- Ending Balance
- Adjusted Cost Base

**Notes:**
- Turnover rate affects annual tax drag
- Higher turnover = more realized gains = higher annual taxes
- Index funds typically have lower turnover than active funds

---

## CAPITAL_GAINS_TAX

Calculates tax on realized capital gains (2024 rules).

```
=CAPITAL_GAINS_TAX(capitalGain, marginalTaxRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| capitalGain | number | Total capital gain to be taxed |
| marginalTaxRate | number | Your marginal tax rate (as decimal) |

**Key Rules (2024):**
- First $250,000: 50% inclusion rate
- Above $250,000: 66.67% inclusion rate

**Examples:**
```
=CAPITAL_GAINS_TAX(100000, 0.40)  → $20,000 tax
  (100000 × 50% inclusion × 40% rate = $20,000)

=CAPITAL_GAINS_TAX(400000, 0.50)  → $112,500 tax
  (First 250000 × 50% × 50% = $62,500)
  (Next 150000 × 66.67% × 50% = $50,000)
  (Total = $112,500)
```

**Important Notes:**
- Capital losses can offset capital gains
- Unused losses can be carried forward indefinitely
- Superficial loss rules apply if repurchasing within 30 days
