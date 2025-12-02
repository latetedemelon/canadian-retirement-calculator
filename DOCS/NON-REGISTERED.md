[← Back to Index](INDEX.md)

# Non-Registered Accounts

This page documents the non-registered (taxable) account functions.

---

## TAXABLE_ACCOUNT_GROWTH

Projects growth of non-registered investment account.

```
=TAXABLE_ACCOUNT_GROWTH(currentBalance, costBase, annualContribution, years,
                        nominalReturn, inflationRate, turnoverRate, marginalTaxRate)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| currentBalance | number | Current account value |
| costBase | number | Adjusted cost base (ACB) |
| annualContribution | number | Annual contribution |
| years | number | Projection period |
| nominalReturn | number | Expected return |
| inflationRate | number | Inflation rate |
| turnoverRate | number | Portfolio turnover (e.g., 0.10 = 10%) |
| marginalTaxRate | number | Your marginal tax rate |

### Returns

Year-by-year table with balances and tax impact

---

## CAPITAL_GAINS_TAX

Calculates tax on realized capital gains (2024 rules).

```
=CAPITAL_GAINS_TAX(capitalGain, marginalTaxRate)
```

### Key Rules

- First $250,000: 50% inclusion rate
- Above $250,000: 66.67% inclusion rate

### Example

```
=CAPITAL_GAINS_TAX(100000, 0.40)  → $20,000 tax
```
