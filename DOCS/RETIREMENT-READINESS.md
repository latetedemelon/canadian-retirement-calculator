[← Back to Index](INDEX.md)

# Retirement Readiness

This page documents the retirement readiness assessment functions.

---

## RETIREMENT_SAVINGS_TARGET

Calculates how much you need saved at retirement.

```
=RETIREMENT_SAVINGS_TARGET(desiredAnnualSpending, retirementAge, lifeExpectancy, otherAnnualIncome, postRetRealReturn)
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| desiredAnnualSpending | number | Target annual spending in retirement |
| retirementAge | number | Age at retirement |
| lifeExpectancy | number | Planning age |
| otherAnnualIncome | number | CPP, OAS, pension income |
| postRetRealReturn | number | Real return after retirement |

### Example

```
=RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)
→ ~$700,000 savings needed
```

---

## RETIREMENT_READINESS_SCORE

Calculates whether you're on track for retirement.

```
=RETIREMENT_READINESS_SCORE(currentAge, retirementAge, lifeExpectancy, currentSavings,
                            annualContribution, desiredAnnualSpending, otherAnnualIncome,
                            preRetRealReturn, postRetRealReturn)
```

### Returns

Table with:
- Readiness Score (0-100%)
- Status (On Track, Nearly There, Needs Attention, Significant Gap)
- Target vs. Projected Savings
- Surplus or Shortfall

### Example

```
=RETIREMENT_READINESS_SCORE(40, 65, 90, 250000, 24000, 60000, 25000, 0.04, 0.02)
```

---

## REQUIRED_SAVINGS_RATE

Calculates how much you need to save annually to reach your goal.

```
=REQUIRED_SAVINGS_RATE(currentAge, retirementAge, currentSavings, targetSavings, preRetRealReturn)
```

### Example

```
=REQUIRED_SAVINGS_RATE(40, 65, 100000, 1000000, 0.04)
→ ~$21,500/year needed
```
