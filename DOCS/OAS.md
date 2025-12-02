[← Back to Index](INDEX.md)

# OAS Calculator

This page documents the Old Age Security (OAS) calculation functions.

---

## OAS_BENEFIT

Calculates monthly Old Age Security benefit.

```
=OAS_BENEFIT(yearsInCanada, startAge, [currentAge])
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| yearsInCanada | number | Years of Canadian residence after age 18 |
| startAge | number | Age to start OAS (65-70) |
| currentAge | number | Optional: Current age (for 75+ bonus) |

### Key Rules Applied

- Minimum 10 years residence required
- 40 years for full OAS
- Deferral bonus: 0.6% per month (7.2% per year) up to age 70
- Higher rate for ages 75+

### Examples

```
=OAS_BENEFIT(40, 65, 67)    → ~$713/month (full OAS at 65)
=OAS_BENEFIT(40, 70, 72)    → ~$970/month (5-year deferral = 36% bonus)
=OAS_BENEFIT(20, 65, 67)    → ~$356/month (50% - only 20 years residence)
```

---

## OAS_CLAWBACK

Calculates OAS Recovery Tax (clawback) based on income.

```
=OAS_CLAWBACK(netIncome, oasAnnual)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| netIncome | number | Annual net income |
| oasAnnual | number | Annual OAS benefit |

### Key Rules

- 2024 threshold: $86,912
- Clawback rate: 15% of income above threshold
- Cannot exceed OAS received

### Example

```
=OAS_CLAWBACK(100000, 8560)  → ~$1,963 clawed back
```

---

## OAS_BENEFIT_DETAILED

Returns complete OAS breakdown including clawback.

```
=OAS_BENEFIT_DETAILED(yearsInCanada, startAge, currentAge, [netIncome])
```
