[← Back to Index](INDEX.md)

# Retirement Readiness

Functions for assessing retirement preparedness.

---

## RETIREMENT_SAVINGS_TARGET

Calculates how much you need saved at retirement.

```
=RETIREMENT_SAVINGS_TARGET(desiredAnnualSpending, retirementAge, lifeExpectancy, otherAnnualIncome, postRetRealReturn)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| desiredAnnualSpending | number | Target annual spending in retirement |
| retirementAge | number | Age at retirement |
| lifeExpectancy | number | Planning age |
| otherAnnualIncome | number | CPP, OAS, pension income |
| postRetRealReturn | number | Real return after retirement (e.g., 0.02 for 2%) |

**Returns:** Target savings amount needed at retirement

**Example:**
```
=RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)
→ ~$700,000 savings needed
```

**Calculation Logic:**
1. Calculate gap between desired spending and guaranteed income
2. Calculate present value of that gap over retirement years
3. Account for real (inflation-adjusted) returns

---

## RETIREMENT_READINESS_SCORE

Calculates whether you're on track for retirement.

```
=RETIREMENT_READINESS_SCORE(currentAge, retirementAge, lifeExpectancy, currentSavings,
                            annualContribution, desiredAnnualSpending, otherAnnualIncome,
                            preRetRealReturn, postRetRealReturn)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentAge | number | Your current age |
| retirementAge | number | Planned retirement age |
| lifeExpectancy | number | Planning age |
| currentSavings | number | Current total savings (RRSP + TFSA) |
| annualContribution | number | Annual contribution to savings |
| desiredAnnualSpending | number | Target annual spending in retirement |
| otherAnnualIncome | number | Expected CPP, OAS, pension income |
| preRetRealReturn | number | Real return before retirement (e.g., 0.04) |
| postRetRealReturn | number | Real return after retirement (e.g., 0.02) |

**Returns:** Table with:
- Readiness Score (0-100%)
- Status (On Track, Nearly There, Needs Attention, Significant Gap)
- Target Savings (what you need)
- Projected Savings (what you'll have)
- Surplus or Shortfall

**Score Interpretation:**
| Score | Status | Meaning |
|-------|--------|---------|
| 100%+ | On Track | Projected savings exceed target |
| 80-99% | Nearly There | Close to target, minor adjustments may help |
| 60-79% | Needs Attention | Significant gap, consider changes |
| <60% | Significant Gap | Major changes needed |

**Example:**
```
=RETIREMENT_READINESS_SCORE(40, 65, 90, 250000, 24000, 60000, 25000, 0.04, 0.02)
```

---

## REQUIRED_SAVINGS_RATE

Calculates how much you need to save annually to reach your goal.

```
=REQUIRED_SAVINGS_RATE(currentAge, retirementAge, currentSavings, targetSavings, preRetRealReturn)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentAge | number | Your current age |
| retirementAge | number | Planned retirement age |
| currentSavings | number | Current total savings |
| targetSavings | number | Target savings at retirement |
| preRetRealReturn | number | Real return before retirement |

**Returns:** Required annual savings amount

**Example:**
```
=REQUIRED_SAVINGS_RATE(40, 65, 100000, 1000000, 0.04)
→ ~$21,500/year needed
```

**Use Case:**
Combine with RETIREMENT_SAVINGS_TARGET to find what you need to save:
```
Step 1: Calculate target
=RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)  → $700,000

Step 2: Calculate required savings
=REQUIRED_SAVINGS_RATE(40, 65, 100000, 700000, 0.04)  → ~$14,500/year
```
