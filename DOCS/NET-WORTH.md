[← Back to Index](INDEX.md)

# Net Worth & Inflation Calculators

This page documents the net worth summary and inflation calculation functions.

---

## NET_WORTH_SUMMARY

Provides comprehensive net worth breakdown.

```
=NET_WORTH_SUMMARY(rrspBalance, tfsaBalance, nonRegBalance, homeEquity, 
                   otherAssets, debts, marginalTaxRate)
```

### Returns

Table showing:
- Each asset category (gross and after-tax)
- Total net worth
- Liquid vs. illiquid assets

### Example

```
=NET_WORTH_SUMMARY(400000, 100000, 50000, 300000, 30000, 10000, 0.35)
```

---

## FUTURE_VALUE_INFLATION

Calculates what today's amount will need to be in the future to maintain purchasing power.

```
=FUTURE_VALUE_INFLATION(presentValue, years, inflationRate)
```

### Example

```
=FUTURE_VALUE_INFLATION(50000, 25, 0.02)
→ $82,030 (what $50,000 needs to be in 25 years)
```

---

## PRESENT_VALUE_INFLATION

Calculates what a future amount is worth in today's dollars.

```
=PRESENT_VALUE_INFLATION(futureValue, years, inflationRate)
```

### Example

```
=PRESENT_VALUE_INFLATION(100000, 25, 0.02)
→ $60,953 (today's value of $100,000 in 25 years)
```
