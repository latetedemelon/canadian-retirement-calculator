[← Back to Index](INDEX.md)

# Pension Income Splitting

This page documents the pension income splitting optimization function.

---

## PENSION_INCOME_SPLIT

Calculates optimal pension income splitting between spouses for tax savings.

```
=PENSION_INCOME_SPLIT(higherSpouseIncome, lowerSpouseIncome, eligiblePensionIncome, province)
```

### Key Rules

- Up to 50% of eligible pension income can be split
- Must be 65+ for RRIF/RRSP income
- Any age for DB pension income

### Returns

Table showing:
- Optimal split amount
- Tax without splitting
- Tax with optimal split
- Annual tax savings

### Example

```
=PENSION_INCOME_SPLIT(80000, 20000, 40000, "ON")
→ Shows potential savings of ~$3,000-5,000/year
```
