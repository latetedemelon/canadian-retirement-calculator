[← Back to Index](INDEX.md)

# Net Worth & Savings Rate

Functions for calculating net worth and inflation adjustments.

---

## NET_WORTH_SUMMARY

Provides comprehensive net worth breakdown.

```
=NET_WORTH_SUMMARY(rrspBalance, tfsaBalance, nonRegBalance, homeEquity, 
                   otherAssets, debts, marginalTaxRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| rrspBalance | number | RRSP/RRIF balance |
| tfsaBalance | number | TFSA balance |
| nonRegBalance | number | Non-registered investment balance |
| homeEquity | number | Home equity (value minus mortgage) |
| otherAssets | number | Other assets (vehicles, etc.) |
| debts | number | Total debts (excluding mortgage) |
| marginalTaxRate | number | Your marginal tax rate (for after-tax calculations) |

**Returns:** Table showing:
- Each asset category (gross value)
- After-tax value (where applicable)
- Total gross net worth
- Total after-tax net worth
- Liquid vs. illiquid breakdown

**Example:**
```
=NET_WORTH_SUMMARY(400000, 100000, 50000, 300000, 30000, 10000, 0.35)
```

**After-Tax Calculations:**
- **RRSP:** Reduced by marginal tax rate
- **TFSA:** Full value (tax-free)
- **Non-registered:** Partial reduction for embedded gains
- **Home equity:** Full value (principal residence exemption)

---

## FUTURE_VALUE_INFLATION

Calculates what today's amount will need to be in the future to maintain purchasing power.

```
=FUTURE_VALUE_INFLATION(presentValue, years, inflationRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| presentValue | number | Today's dollar amount |
| years | number | Number of years in the future |
| inflationRate | number | Annual inflation rate (e.g., 0.02 for 2%) |

**Returns:** Future value needed to maintain purchasing power

**Example:**
```
=FUTURE_VALUE_INFLATION(50000, 25, 0.02)
→ $82,030 (what $50,000 today will need to be in 25 years)
```

**Formula:** `FV = PV × (1 + inflation)^years`

**Use Cases:**
- Planning retirement spending needs
- Estimating future costs of major expenses
- Understanding impact of inflation on savings goals

---

## PRESENT_VALUE_INFLATION

Calculates what a future amount is worth in today's dollars.

```
=PRESENT_VALUE_INFLATION(futureValue, years, inflationRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| futureValue | number | Future dollar amount |
| years | number | Number of years in the future |
| inflationRate | number | Annual inflation rate (e.g., 0.02 for 2%) |

**Returns:** Today's value (purchasing power equivalent)

**Example:**
```
=PRESENT_VALUE_INFLATION(100000, 25, 0.02)
→ $60,953 (today's value of $100,000 in 25 years)
```

**Formula:** `PV = FV / (1 + inflation)^years`

**Use Cases:**
- Comparing future income to today's needs
- Understanding real value of projected savings
- Evaluating pension benefits in today's terms

---

## Common Scenarios

### Retirement Spending Planning
```
If you need $50,000/year today:
=FUTURE_VALUE_INFLATION(50000, 25, 0.02)
→ You'll need $82,030/year in 25 years
```

### Evaluating a Pension Offer
```
Pension promises $80,000/year starting in 20 years:
=PRESENT_VALUE_INFLATION(80000, 20, 0.02)
→ That's equivalent to $53,827 in today's dollars
```

### Inflation Impact Table
| Years | $50,000 Today Becomes | Inflation Rate |
|-------|----------------------|----------------|
| 10 | $60,950 | 2% |
| 20 | $74,297 | 2% |
| 25 | $82,030 | 2% |
| 30 | $90,568 | 2% |
