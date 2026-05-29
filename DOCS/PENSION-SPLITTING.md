[← Back to Index](INDEX.md)

# Pension Income Splitting

Functions for optimizing pension income between spouses.

---

## PENSION_INCOME_SPLIT

Calculates optimal pension income splitting between spouses for tax savings.

```
=PENSION_INCOME_SPLIT(higherSpouseIncome, lowerSpouseIncome, eligiblePensionIncome, province)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| higherSpouseIncome | number | Total income of higher-earning spouse |
| lowerSpouseIncome | number | Total income of lower-earning spouse |
| eligiblePensionIncome | number | Amount of eligible pension income |
| province | string | Two-letter province code |

**Key Rules:**
- Up to 50% of eligible pension income can be split
- Must be 65+ for RRIF/RRSP annuity income
- Any age for DB pension income
- Both spouses must be Canadian residents

**Returns:** Table showing:
- Optimal split amount
- Tax without splitting
- Tax with optimal split
- Annual tax savings

**Example:**
```
=PENSION_INCOME_SPLIT(80000, 20000, 40000, "ON")
→ Shows potential savings of ~$3,000-5,000/year
```

**Eligible Pension Income:**

**At any age:**
- Lifetime annuity from a registered pension plan (RPP)
- Certain amounts from a pooled registered pension plan (PRPP)

**Age 65 or older:**
- RRIF payments
- RRSP annuity payments
- DPSP annuity payments
- Certain foreign pension income

**Not eligible:**
- CPP/QPP benefits
- OAS benefits
- RRSP withdrawals (not annuity)

**Strategic Considerations:**
1. Calculate marginal rate difference between spouses
2. Split enough to equalize rates or reach lower bracket
3. Consider impact on OAS clawback
4. Remember receiving spouse reports the income
