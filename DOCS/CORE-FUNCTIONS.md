[← Back to Index](INDEX.md)

# Core Functions Reference

These are the essential retirement projection functions that form the foundation of the Canadian Retirement Calculator.

---

## RETIREMENT_INCOME

Calculates RRSP & TFSA at retirement and level monthly income until death.

```
=RETIREMENT_INCOME(currentAge, retirementAge, lifeExpectancyAge, rrspBalanceNow, 
                   tfsaBalanceNow, annualRrspContribution, annualTfsaContribution,
                   preRetNominalReturn, postRetNominalReturn, inflationRate)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentAge | number | Your current age |
| retirementAge | number | Age you plan to retire |
| lifeExpectancyAge | number | Age to plan until |
| rrspBalanceNow | number | Current RRSP balance |
| tfsaBalanceNow | number | Current TFSA balance |
| annualRrspContribution | number | Annual RRSP contribution |
| annualTfsaContribution | number | Annual TFSA contribution |
| preRetNominalReturn | number | Nominal return before retirement (e.g., 0.06) |
| postRetNominalReturn | number | Nominal return after retirement (e.g., 0.04) |
| inflationRate | number | Expected inflation rate (e.g., 0.02) |

**Returns:** Array with [RRSP at retirement, TFSA at retirement, Total, Monthly Income]

**Example:**
```
=RETIREMENT_INCOME(40, 65, 90, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02)
```

---

## LIFE_EXPECTANCY_AGE

Calculates a conservative planning age based on health and lifestyle factors.

```
=LIFE_EXPECTANCY_AGE(currentAge, sex, health, smoker, familyLongevity)
```

**Parameters:**
| Parameter | Type | Options |
|-----------|------|---------|
| currentAge | number | Your current age |
| sex | string | "M", "F", or other |
| health | string | "excellent", "good", "average", "poor" |
| smoker | boolean | TRUE or FALSE |
| familyLongevity | string | "long", "average", "short" |

**Returns:** Suggested planning age (number)

**Example:**
```
=LIFE_EXPECTANCY_AGE(40, "M", "good", FALSE, "long")
→ Returns: 94
```

---

## PENSION_INCOME_PROJECTED

Projects defined-benefit pension income at retirement.

```
=PENSION_INCOME_PROJECTED(currentAge, retirementAge, currentSalary, realSalaryGrowth,
                          yearsServiceNow, accrualRate, maxServiceYears, finalAverageYears)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| currentAge | number | Your current age |
| retirementAge | number | Planned retirement age |
| currentSalary | number | Current annual salary |
| realSalaryGrowth | number | Real salary growth rate (e.g., 0.01 = 1%) |
| yearsServiceNow | number | Current years of service |
| accrualRate | number | Pension accrual rate (e.g., 0.02 = 2%) |
| maxServiceYears | number | Maximum years counted (e.g., 35) |
| finalAverageYears | number | Years used for final average (e.g., 5) |

**Returns:** Projected annual pension (number)

**Example:**
```
=PENSION_INCOME_PROJECTED(40, 65, 120000, 0.01, 10, 0.02, 35, 5)
→ Returns: ~$85,000 annual pension
```

---

## RETIREMENT_TARGET_SPEND_TABLE

Creates a year-by-year projection table that maintains constant real spending.

```
=RETIREMENT_TARGET_SPEND_TABLE(currentAge, retirementAge, lifeExpectancyAge,
                               rrspBalanceNow, tfsaBalanceNow, annualRrspContribution,
                               annualTfsaContribution, preRetNominalReturn,
                               postRetNominalReturn, inflationRate, targetAnnualSpending)
```

**Returns:** A table with columns:
- Age, YearOffset, RRSP_Begin, TFSA_Begin, Other_Taxable, Other_NonTaxable
- Portfolio_Withdrawal, Total_Cashflow, RRSP_End, TFSA_End, Portfolio_End, Shortfall

**Example:**
```
=RETIREMENT_TARGET_SPEND_TABLE(40, 65, 90, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02, 60000)
```
