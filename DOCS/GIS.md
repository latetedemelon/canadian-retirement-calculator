[← Back to Index](INDEX.md)

# GIS Calculator

Functions for calculating Guaranteed Income Supplement benefits.

---

## GIS_BENEFIT

Calculates Guaranteed Income Supplement for low-income seniors.

```
=GIS_BENEFIT(annualIncome, maritalStatus, [spouseOAS])
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| annualIncome | number | Annual income (excluding OAS) |
| maritalStatus | string | "single" or "married" |
| spouseOAS | boolean | Does spouse receive OAS? (optional, for married) |

**Key Rules:**
- Must be receiving OAS to qualify
- Income-tested (reduces as income increases)
- 2024 maximum: ~$1,065/month (single)
- Different rates for married couples depending on spouse's OAS status

**Example:**
```
=GIS_BENEFIT(12000, "single")  → ~$565/month
```

**Important Notes:**
- GIS is not taxable income
- Must apply annually or have income tax return filed
- Income used is previous year's income (excluding OAS)
- Certain income types are exempt or partially exempt from the calculation

**Eligibility:**
1. Must be 65 or older
2. Must be receiving OAS
3. Must meet income requirements
4. Must be a legal resident of Canada
