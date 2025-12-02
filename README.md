# Canadian Retirement Calculator (Google Sheets)

A comprehensive Google Sheets–based retirement planning tool designed specifically for **Canadian** investors.

This project provides a Google Apps Script file (`code.gs`) that plugs into a Google Sheet and gives you:

- **RRSP & TFSA** accumulation and decumulation modelling in **real (inflation-adjusted) dollars**
- **CPP (Canada Pension Plan)** benefit calculator with early/late adjustment factors
- **CPP Survivor Benefits** calculator for surviving spouses
- **OAS (Old Age Security)** calculator with deferral bonuses and clawback calculations
- **GIS (Guaranteed Income Supplement)** calculator for low-income retirees
- **RRIF** mandatory minimum withdrawal calculator
- **Tax estimation** for all 13 provinces and territories (2024 brackets)
- **Non-registered account** support with capital gains tracking
- **Contribution room tracking** for RRSP and TFSA
- **Optimal withdrawal strategy** recommendations
- **Pension income splitting** calculator for couples
- **Estate tax planning** for RRSP/RRIF on death
- **Retirement readiness score** - are you on track?
- **Net worth summary** across all account types
- **Required savings rate** calculator
- A **constant real spending** engine that adjusts withdrawals to meet your target
- Defined-benefit **pension projection** helper
- **Life expectancy** planning age calculator
- Simple sheet setup helpers and a custom **"Retirement"** menu

> ⚠️ **Disclaimer:** This is an educational tool, not financial or tax advice.  
> Always verify results against official sources (CRA, Service Canada, plan documents) and/or a professional advisor before making decisions.

---

## Table of Contents

1. [Quick Start Guide](#1-quick-start-guide)
2. [Installation](#2-installation)
3. [Setup Wizard](#3-setup-wizard)
4. [Core Functions Reference](#4-core-functions-reference)
5. [CPP Calculator](#5-cpp-calculator)
6. [OAS Calculator](#6-oas-calculator)
7. [GIS Calculator](#7-gis-calculator)
8. [RRIF Calculator](#8-rrif-calculator)
9. [Tax Estimation](#9-tax-estimation)
10. [Non-Registered Accounts](#10-non-registered-accounts)
11. [Contribution Room Tracking](#11-contribution-room-tracking)
12. [Withdrawal Strategies](#12-withdrawal-strategies)
13. [Input Validation](#13-input-validation)
14. [Retirement Readiness](#14-retirement-readiness)
15. [CPP Survivor Benefits](#15-cpp-survivor-benefits)
16. [Pension Income Splitting](#16-pension-income-splitting)
17. [Estate Planning](#17-estate-planning)
18. [Net Worth & Savings Rate](#18-net-worth--savings-rate)
19. [Examples & Use Cases](#19-examples--use-cases)
20. [Troubleshooting](#20-troubleshooting)
21. [Calculation Accuracy Reference](#21-calculation-accuracy-reference)
22. [Bootstrap & Auto-Setup](#22-bootstrap--auto-setup)
23. [Enhanced CPP Calculator](#23-enhanced-cpp-calculator)
24. [Enhanced OAS Calculator](#24-enhanced-oas-calculator)
25. [Safe Withdrawal Rate Calculator](#25-safe-withdrawal-rate-calculator)
26. [Enhanced Tax Calculator for Seniors](#26-enhanced-tax-calculator-for-seniors)
27. [Retirement Income Summary](#27-retirement-income-summary)
28. [Function Quick Reference](#28-function-quick-reference)

---

## Calculation Accuracy Reference

This section clearly identifies which calculations use **exact CRA rules** versus **approximations**. Understanding this helps you know when to cross-reference with official sources.

### ✅ Exact Calculations (Using Official CRA Rules)

These functions use **actual CRA formulas, rates, and thresholds** as published:

| Function | Basis | Source |
|----------|-------|--------|
| `RRIF_MIN_WITHDRAWAL` | CRA prescribed factors for ages 71-95+ | Income Tax Regulations |
| `RRIF_MIN_PERCENTAGE` | Exact CRA minimum percentages | Income Tax Regulations |
| `OAS_CLAWBACK` | 15% recovery rate, $86,912 threshold (2024) | Service Canada |
| `ESTIMATE_TAX` | 2024 federal + all 13 provincial/territorial brackets | CRA Tax Tables |
| `MARGINAL_TAX_RATE` | Exact bracket rates from CRA | CRA Tax Tables |
| `CAPITAL_GAINS_TAX` | 50% inclusion (≤$250k), 66.67% (>$250k) | 2024 Budget |
| `CPP_DEATH_BENEFIT` | Fixed $2,500 lump sum | Service Canada |
| `TFSA_CONTRIBUTION_ROOM` | Historical annual limits 2009-2025 | CRA |
| `RRSP_CONTRIBUTION_ROOM` | 18% rule, annual limits 2021-2025 | CRA |

### ⚠️ Approximations (Simplified Models)

These functions use **simplified formulas** that provide reasonable estimates but may differ from actual amounts:

| Function | What's Approximated | Why |
|----------|---------------------|-----|
| `CPP_BENEFIT` | Uses average earnings × years ratio | Actual CPP uses complex YMPE history and dropout provisions |
| `OAS_BENEFIT` | Based on years of residence only | Doesn't account for international agreements or partial years |
| `GIS_BENEFIT` | Simplified income test | Actual GIS has complex spouse income calculations |
| `LIFE_EXPECTANCY_AGE` | Heuristic adjustments | Based on general health factors, not actuarial tables |
| `PENSION_INCOME_PROJECTED` | Average of final years | Doesn't account for plan-specific rules |
| `RETIREMENT_READINESS_SCORE` | Percentage-based scoring | Subjective interpretation of "readiness" |
| `OPTIMAL_WITHDRAWAL_ORDER` | Fills brackets sequentially | Doesn't optimize across multiple years |

### 📊 Hybrid Calculations (Exact Formula, Estimated Inputs)

These use **exact formulas** but results depend on your input estimates:

| Function | Exact Part | Your Estimate |
|----------|------------|---------------|
| `RETIREMENT_INCOME` | Annuity math | Future returns, inflation |
| `RETIREMENT_TARGET_SPEND_TABLE` | Withdrawal calculations | Returns, spending needs |
| `RETIREMENT_SAVINGS_TARGET` | Present value formula | Future income, returns |
| `TAXABLE_ACCOUNT_GROWTH` | Capital gains math | Returns, turnover rate |
| `ESTATE_TAX_RRSP` | Tax bracket application | Other income in year of death |
| `PENSION_INCOME_SPLIT` | Tax optimization | Income levels |
| `NET_WORTH_SUMMARY` | After-tax calculations | Marginal rate assumption |

### Key Accuracy Notes

1. **CPP Benefits**: For the most accurate CPP estimate, use your [My Service Canada Account](https://www.canada.ca/en/employment-social-development/services/my-account.html) statement.

2. **OAS Benefits**: Actual OAS depends on residence history. See [Service Canada OAS estimator](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security.html).

3. **Tax Estimates**: These use basic bracket math. Actual taxes depend on:
   - Tax credits (age, pension, disability, etc.)
   - Deductions (medical, charitable, etc.)
   - Provincial-specific credits

4. **GIS**: Eligibility requires OAS receipt. For accurate amounts, see [Service Canada GIS tables](https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/guaranteed-income-supplement.html).

5. **All Projections**: Future projections (10+ years) have increasing uncertainty. Consider running scenarios with different assumptions.

---

## 1. Quick Start Guide

### For First-Time Users

1. **Install the script** (see [Installation](#2-installation))
2. **Run the Setup Wizard**: Click **Retirement → Setup sheets (INPUTS & OTHER_INCOME)**
3. **Fill in your information** on the INPUTS sheet
4. **Add income sources** (CPP, OAS, pensions) to the OTHER_INCOME sheet
5. **Use the formulas** in your sheet to calculate retirement projections

### 5-Minute Setup

After installation, here's the fastest way to get started:

```
Step 1: Retirement menu → Setup sheets
Step 2: Fill in INPUTS sheet with your basic info
Step 3: In any cell, type:
        =RETIREMENT_TARGET_SPEND_TABLE(B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12)
        (assuming your inputs are in column B, rows 2-12)
Step 4: View your year-by-year retirement projection!
```

---

## 2. Installation

### Step-by-Step Installation

1. **Create a new Google Sheet** (or open an existing one)
   - Go to [sheets.google.com](https://sheets.google.com)
   - Click **+ Blank** to create a new sheet

2. **Open the Apps Script Editor**
   - In your sheet, go to: **Extensions → Apps Script**
   - This opens a new tab with the script editor

3. **Paste the Code**
   - Delete any placeholder code in `Code.gs`
   - Copy the entire contents of `code.gs` from this repository
   - Paste it into the editor

4. **Save the Script**
   - Click the 💾 Save icon (or press Ctrl+S / Cmd+S)
   - Name your project (e.g., "Retirement Calculator")

5. **Reload Your Sheet**
   - Go back to your Google Sheet tab
   - Refresh the page (F5 or Ctrl+R)
   - You should see a new **"Retirement"** menu in the top menu bar

### Authorization

On first use, Google will ask you to authorize the script:

1. Click **Retirement → Setup sheets**
2. Click **Continue** in the authorization dialog
3. Choose your Google account
4. Click **Advanced** → **Go to [project name] (unsafe)**
5. Click **Allow**

> This is standard for custom Apps Scripts. The script only accesses your current spreadsheet.

---

## 3. Setup Wizard

### Using the Retirement Menu

After installation, you'll see a **"Retirement"** menu with one option:

- **Setup sheets (INPUTS & OTHER_INCOME)** – Creates two helper sheets

### INPUTS Sheet

The wizard creates an **INPUTS** sheet with these fields:

| Row | Label | Default Value | Description |
|-----|-------|---------------|-------------|
| 2 | Current age | 40 | Your current age in years |
| 3 | Retirement age | 65 | When you plan to retire |
| 4 | Planning age | 90 | Age to plan income until (use LIFE_EXPECTANCY_AGE) |
| 5 | RRSP balance now | 200,000 | Current RRSP/RRIF balance |
| 6 | TFSA balance now | 50,000 | Current TFSA balance |
| 7 | Annual RRSP contrib | 18,000 | Your annual RRSP contribution |
| 8 | Annual TFSA contrib | 6,000 | Your annual TFSA contribution |
| 9 | Pre-ret nominal r | 0.06 | Expected return before retirement (6%) |
| 10 | Post-ret nominal r | 0.04 | Expected return after retirement (4%) |
| 11 | Inflation rate | 0.02 | Expected inflation (2%) |
| 12 | Target spend (annual) | 60,000 | Your target annual spending in retirement |

**How to use:**
1. Replace the default values in column B with your actual numbers
2. Reference these cells in formulas (e.g., `=B2` for current age)

### OTHER_INCOME Sheet

The wizard creates an **OTHER_INCOME** sheet for additional income sources:

| Column | Header | Description |
|--------|--------|-------------|
| A | Description | Name of income source (e.g., "CPP", "OAS", "DB Pension") |
| B | StartAge | Age when this income begins |
| C | EndAge | Age when this income ends (leave blank for lifetime) |
| D | AnnualAmount | Annual amount in today's dollars |
| E | Taxable? | TRUE or FALSE |

**Example entries:**

| Description | StartAge | EndAge | AnnualAmount | Taxable? |
|-------------|----------|--------|--------------|----------|
| CPP | 65 | | 12000 | TRUE |
| OAS | 65 | | 8500 | TRUE |
| DB Pension | 60 | | 35000 | TRUE |
| Rental Income | 40 | 75 | 18000 | TRUE |

---

## 4. Core Functions Reference

### RETIREMENT_INCOME

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

### LIFE_EXPECTANCY_AGE

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

### PENSION_INCOME_PROJECTED

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

### RETIREMENT_TARGET_SPEND_TABLE

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

---

## 5. CPP Calculator

### CPP_BENEFIT

Calculates estimated monthly CPP retirement benefit.

```
=CPP_BENEFIT(averageEarnings, contributionYears, startAge, [currentYear])
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| averageEarnings | number | Average annual pensionable earnings |
| contributionYears | number | Years with CPP contributions |
| startAge | number | Age to start CPP (60-70) |
| currentYear | number | Optional: Year for YMPE reference (default 2024) |

**Returns:** Estimated monthly CPP benefit

**Key Rules Applied:**
- Early start (60-64): Reduced by 0.6% per month (7.2% per year)
- Normal age: 65
- Late start (66-70): Increased by 0.7% per month (8.4% per year)
- Maximum 39 years of contributions counted

**Examples:**
```
=CPP_BENEFIT(60000, 35, 65)     → ~$953/month (at 65 with 35 years)
=CPP_BENEFIT(60000, 35, 60)     → ~$610/month (early at 60, 36% reduction)
=CPP_BENEFIT(60000, 35, 70)     → ~$1,354/month (late at 70, 42% increase)
```

---

### CPP_BENEFIT_DETAILED

Returns a detailed breakdown of CPP benefit calculation.

```
=CPP_BENEFIT_DETAILED(averageEarnings, contributionYears, startAge)
```

**Returns:** Table showing:
- Monthly Benefit
- Annual Benefit  
- Start Age
- Adjustment Factor
- Maximum at that age
- % of Maximum
- Contribution Years Used

---

## 6. OAS Calculator

### OAS_BENEFIT

Calculates monthly Old Age Security benefit.

```
=OAS_BENEFIT(yearsInCanada, startAge, [currentAge])
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| yearsInCanada | number | Years of Canadian residence after age 18 |
| startAge | number | Age to start OAS (65-70) |
| currentAge | number | Optional: Current age (for 75+ bonus) |

**Key Rules Applied:**
- Minimum 10 years residence required
- 40 years for full OAS
- Deferral bonus: 0.6% per month (7.2% per year) up to age 70
- Higher rate for ages 75+

**Examples:**
```
=OAS_BENEFIT(40, 65, 67)    → ~$713/month (full OAS at 65)
=OAS_BENEFIT(40, 70, 72)    → ~$970/month (5-year deferral = 36% bonus)
=OAS_BENEFIT(20, 65, 67)    → ~$356/month (50% - only 20 years residence)
```

---

### OAS_CLAWBACK

Calculates OAS Recovery Tax (clawback) based on income.

```
=OAS_CLAWBACK(netIncome, oasAnnual)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| netIncome | number | Annual net income |
| oasAnnual | number | Annual OAS benefit |

**Key Rules:**
- 2024 threshold: $86,912
- Clawback rate: 15% of income above threshold
- Cannot exceed OAS received

**Example:**
```
=OAS_CLAWBACK(100000, 8560)  → ~$1,963 clawed back
```

---

### OAS_BENEFIT_DETAILED

Returns complete OAS breakdown including clawback.

```
=OAS_BENEFIT_DETAILED(yearsInCanada, startAge, currentAge, [netIncome])
```

---

## 7. GIS Calculator

### GIS_BENEFIT

Calculates Guaranteed Income Supplement for low-income seniors.

```
=GIS_BENEFIT(annualIncome, maritalStatus, [spouseOAS])
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| annualIncome | number | Annual income (excluding OAS) |
| maritalStatus | string | "single" or "married" |
| spouseOAS | boolean | Does spouse receive OAS? |

**Key Rules:**
- Must be receiving OAS
- Income-tested (reduces as income increases)
- 2024 maximum: ~$1,065/month (single)

**Example:**
```
=GIS_BENEFIT(12000, "single")  → ~$565/month
```

---

## 8. RRIF Calculator

### RRIF_MIN_WITHDRAWAL

Calculates mandatory minimum RRIF withdrawal.

```
=RRIF_MIN_WITHDRAWAL(age, rrifBalance)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| age | number | Age at start of year |
| rrifBalance | number | RRIF balance at January 1 |

**Returns:** Minimum annual withdrawal required

**Examples:**
```
=RRIF_MIN_WITHDRAWAL(72, 500000)  → $27,000 (5.40%)
=RRIF_MIN_WITHDRAWAL(80, 500000)  → $34,100 (6.82%)
=RRIF_MIN_WITHDRAWAL(90, 500000)  → $59,600 (11.92%)
```

---

### RRIF_MIN_PERCENTAGE

Returns the CRA-prescribed minimum percentage for a given age.

```
=RRIF_MIN_PERCENTAGE(age)
```

**Key Percentages:**
| Age | Minimum % |
|-----|-----------|
| 71 | 5.28% |
| 75 | 5.82% |
| 80 | 6.82% |
| 85 | 8.51% |
| 90 | 11.92% |
| 95+ | 20.00% |

---

### RRIF_SCHEDULE

Projects RRIF withdrawals over multiple years.

```
=RRIF_SCHEDULE(startAge, endAge, initialBalance, nominalReturn, inflationRate)
```

**Returns:** Year-by-year table with Min %, Min Withdrawal, Year-End Balance

---

## 9. Tax Estimation

### ESTIMATE_TAX

Calculates combined federal + provincial income tax.

```
=ESTIMATE_TAX(taxableIncome, province)
```

**Supported Provinces:**
- ON (Ontario), BC (British Columbia), AB (Alberta)
- QC (Quebec), SK (Saskatchewan), MB (Manitoba)
- NS (Nova Scotia), NB (New Brunswick), PE (PEI)
- NL (Newfoundland), YT (Yukon), NT (NWT), NU (Nunavut)

**Examples:**
```
=ESTIMATE_TAX(80000, "ON")   → ~$17,500
=ESTIMATE_TAX(80000, "AB")   → ~$16,300 (lower provincial rates)
=ESTIMATE_TAX(80000, "QC")   → ~$19,200 (higher provincial rates)
```

---

### ESTIMATE_TAX_DETAILED

Returns complete tax breakdown.

```
=ESTIMATE_TAX_DETAILED(taxableIncome, province)
```

**Returns:** Table showing:
- Federal Tax (Gross/Net)
- Provincial Tax (Gross/Net)
- Basic Credits Applied
- Effective Rate
- Marginal Rate

---

### MARGINAL_TAX_RATE

Returns combined marginal tax rate.

```
=MARGINAL_TAX_RATE(taxableIncome, province)
```

**Example:**
```
=MARGINAL_TAX_RATE(80000, "ON")  → 0.3148 (31.48%)
```

---

## 10. Non-Registered Accounts

### TAXABLE_ACCOUNT_GROWTH

Projects growth of non-registered investment account.

```
=TAXABLE_ACCOUNT_GROWTH(currentBalance, costBase, annualContribution, years,
                        nominalReturn, inflationRate, turnoverRate, marginalTaxRate)
```

**Parameters:**
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

**Returns:** Year-by-year table with balances and tax impact

---

### CAPITAL_GAINS_TAX

Calculates tax on realized capital gains (2024 rules).

```
=CAPITAL_GAINS_TAX(capitalGain, marginalTaxRate)
```

**Key Rules:**
- First $250,000: 50% inclusion rate
- Above $250,000: 66.67% inclusion rate

**Example:**
```
=CAPITAL_GAINS_TAX(100000, 0.40)  → $20,000 tax
```

---

## 11. Contribution Room Tracking

### RRSP_CONTRIBUTION_ROOM

Calculates available RRSP contribution room.

```
=RRSP_CONTRIBUTION_ROOM(previousYearEarnedIncome, unusedRoom, pensionAdjustment, [year])
```

**Key Rules:**
- 18% of previous year's earned income
- 2024 maximum: $31,560
- Minus pension adjustment (PA)
- Plus unused room from prior years

**Example:**
```
=RRSP_CONTRIBUTION_ROOM(100000, 50000, 5000, 2024)  → $63,000 room
```

---

### TFSA_CONTRIBUTION_ROOM

Calculates available TFSA contribution room.

```
=TFSA_CONTRIBUTION_ROOM(birthYear, currentYear, usedRoom, [firstResidentYear])
```

**Annual Limits Since 2009:**
- 2009-2012: $5,000/year
- 2013-2014: $5,500/year
- 2015: $10,000
- 2016-2018: $5,500/year
- 2019-2022: $6,000/year
- 2023: $6,500
- 2024-2025: $7,000/year

**Example:**
```
=TFSA_CONTRIBUTION_ROOM(1980, 2024, 50000)  → ~$45,000 remaining
```

---

## 12. Withdrawal Strategies

### OPTIMAL_WITHDRAWAL_ORDER

Suggests tax-efficient withdrawal order across accounts.

```
=OPTIMAL_WITHDRAWAL_ORDER(rrspBalance, tfsaBalance, nonRegBalance, 
                          withdrawalNeeded, otherIncome, province)
```

**Returns:** Table with recommended withdrawal from each account type and tax impact

**Strategy Applied:**
1. Fill lower tax brackets with RRSP first
2. Use non-registered next (favorable capital gains treatment)
3. Preserve TFSA for later (tax-free)

**Example:**
```
=OPTIMAL_WITHDRAWAL_ORDER(500000, 100000, 200000, 50000, 30000, "ON")
```

---

## 13. Input Validation

### VALIDATE_RETIREMENT_INPUTS

Validates common retirement planning inputs.

```
=VALIDATE_RETIREMENT_INPUTS(currentAge, retirementAge, lifeExpectancy, rrspBalance, tfsaBalance)
```

**Returns:** "OK" if valid, or error message describing issues

**Checks:**
- Age ranges (0-120)
- Retirement age >= current age
- Life expectancy > retirement age
- Balances are non-negative

---

## 14. Retirement Readiness

### RETIREMENT_SAVINGS_TARGET

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
| postRetRealReturn | number | Real return after retirement |

**Example:**
```
=RETIREMENT_SAVINGS_TARGET(60000, 65, 90, 25000, 0.02)
→ ~$700,000 savings needed
```

---

### RETIREMENT_READINESS_SCORE

Calculates whether you're on track for retirement.

```
=RETIREMENT_READINESS_SCORE(currentAge, retirementAge, lifeExpectancy, currentSavings,
                            annualContribution, desiredAnnualSpending, otherAnnualIncome,
                            preRetRealReturn, postRetRealReturn)
```

**Returns:** Table with:
- Readiness Score (0-100%)
- Status (On Track, Nearly There, Needs Attention, Significant Gap)
- Target vs. Projected Savings
- Surplus or Shortfall

**Example:**
```
=RETIREMENT_READINESS_SCORE(40, 65, 90, 250000, 24000, 60000, 25000, 0.04, 0.02)
```

---

### REQUIRED_SAVINGS_RATE

Calculates how much you need to save annually to reach your goal.

```
=REQUIRED_SAVINGS_RATE(currentAge, retirementAge, currentSavings, targetSavings, preRetRealReturn)
```

**Example:**
```
=REQUIRED_SAVINGS_RATE(40, 65, 100000, 1000000, 0.04)
→ ~$21,500/year needed
```

---

## 15. CPP Survivor Benefits

### CPP_SURVIVOR_BENEFIT

Calculates CPP survivor pension for a surviving spouse.

```
=CPP_SURVIVOR_BENEFIT(deceasedCPP, survivorAge, survivorReceivesCPP, survivorCPP)
```

**Key Rules:**
- Under 65: Flat rate (~$218) + 37.5% of deceased's pension
- 65 and over: 60% of deceased's pension
- Combined with own CPP cannot exceed maximum

**Example:**
```
=CPP_SURVIVOR_BENEFIT(1000, 55, FALSE, 0)  → ~$593/month
=CPP_SURVIVOR_BENEFIT(1000, 68, TRUE, 800) → ~$564/month (capped)
```

---

### CPP_DEATH_BENEFIT

Returns the CPP lump-sum death benefit.

```
=CPP_DEATH_BENEFIT()
→ $2,500 (fixed amount)
```

---

## 16. Pension Income Splitting

### PENSION_INCOME_SPLIT

Calculates optimal pension income splitting between spouses for tax savings.

```
=PENSION_INCOME_SPLIT(higherSpouseIncome, lowerSpouseIncome, eligiblePensionIncome, province)
```

**Key Rules:**
- Up to 50% of eligible pension income can be split
- Must be 65+ for RRIF/RRSP income
- Any age for DB pension income

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

---

## 17. Estate Planning

### ESTATE_TAX_RRSP

Calculates taxes owing when RRSP/RRIF is collapsed upon death.

```
=ESTATE_TAX_RRSP(rrspBalance, otherIncomeInYear, province, hasSpouse)
```

**Key Rules:**
- Transfer to spouse: Tax-free rollover
- No spouse: Full balance taxed as income in final return

**Example:**
```
=ESTATE_TAX_RRSP(500000, 30000, "ON", FALSE)
→ Shows ~$220,000 tax (44% effective rate on large balance)
```

---

## 18. Net Worth & Savings Rate

### NET_WORTH_SUMMARY

Provides comprehensive net worth breakdown.

```
=NET_WORTH_SUMMARY(rrspBalance, tfsaBalance, nonRegBalance, homeEquity, 
                   otherAssets, debts, marginalTaxRate)
```

**Returns:** Table showing:
- Each asset category (gross and after-tax)
- Total net worth
- Liquid vs. illiquid assets

**Example:**
```
=NET_WORTH_SUMMARY(400000, 100000, 50000, 300000, 30000, 10000, 0.35)
```

---

### Inflation Calculators

**FUTURE_VALUE_INFLATION** - What today's amount will need to be in the future:
```
=FUTURE_VALUE_INFLATION(50000, 25, 0.02)
→ $82,030 (what $50,000 needs to be in 25 years)
```

**PRESENT_VALUE_INFLATION** - What a future amount is worth today:
```
=PRESENT_VALUE_INFLATION(100000, 25, 0.02)
→ $60,953 (today's value of $100,000 in 25 years)
```

---

## 19. Examples & Use Cases

### Example 1: Basic Retirement Projection

**Scenario:** 40 years old, planning to retire at 65, with $200K RRSP and $50K TFSA

```
Cell A1: =LIFE_EXPECTANCY_AGE(40, "M", "good", FALSE, "average")
→ Returns: 92

Cell A2: =RETIREMENT_INCOME(40, 65, 92, 200000, 50000, 18000, 6000, 0.06, 0.04, 0.02)
→ Returns: [RRSP at retirement, TFSA, Total, Monthly Income]
```

---

### Example 2: CPP/OAS Planning

**Scenario:** Deciding when to start CPP and OAS

```
=CPP_BENEFIT(65000, 38, 60)   → $XXX (early)
=CPP_BENEFIT(65000, 38, 65)   → $XXX (normal)
=CPP_BENEFIT(65000, 38, 70)   → $XXX (deferred)
```

Compare the cumulative amounts to find your break-even point!

---

### Example 3: Tax-Efficient Withdrawal

**Scenario:** Retired with $400K RRSP, $150K TFSA, need $60K/year

```
=OPTIMAL_WITHDRAWAL_ORDER(400000, 150000, 0, 60000, 25000, "ON")
```

This shows how to minimize taxes while meeting your spending needs.

---

### Example 4: Complete Retirement Plan

Set up a comprehensive model:

1. **INPUTS sheet** with all your parameters
2. **OTHER_INCOME sheet** with:
   - CPP (use `=CPP_BENEFIT()` to calculate)
   - OAS (use `=OAS_BENEFIT()` to calculate)
   - Any pensions (use `=PENSION_INCOME_PROJECTED()`)
3. **Projection sheet** with:
   - `=RETIREMENT_TARGET_SPEND_TABLE()` for year-by-year view
   - `=RRIF_SCHEDULE()` for RRIF minimum tracking

---

## 20. Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `#NAME?` | Function not recognized | Reload sheet after saving script |
| `ERROR: retirementAge < currentAge` | Invalid age inputs | Check your age parameters |
| `ERROR: Province not supported` | Invalid province code | Use: ON, BC, AB, QC, SK, MB, NS, NB, PE, NL, YT, NT, NU |
| `ERROR: startAge must be between 60 and 70` | Invalid CPP start age | CPP can only start between 60-70 |
| Authorization error | Script not authorized | Follow authorization steps in Installation section |

### Tips

1. **All amounts are in real (today's) dollars** – The calculator adjusts for inflation automatically

2. **Returns are entered as decimals** – Use 0.06 for 6%, not 6

3. **Use cell references** – Instead of hardcoding values, reference the INPUTS sheet

4. **Refresh calculations** – If values seem stale, press Ctrl+Shift+E to recalculate

5. **Check the OTHER_INCOME sheet** – Many functions read from this sheet automatically

---

## Files & Structure

This repo contains:

- `LICENSE` – MIT license
- `README.md` – This documentation file
- `code.gs` – The main Apps Script source
- `conversation.md` – Development notes

---

## 21. Calculation Accuracy Reference

See the [Calculation Accuracy Reference](#calculation-accuracy-reference) section near the top of this document for a complete breakdown of which functions use exact CRA rules vs. approximations.

---

## 22. Bootstrap & Auto-Setup

### Automatic Sheet Creation

The calculator now automatically creates required sheets when needed. You no longer need to manually run "Setup sheets" before using functions.

**How it works:**
- When the spreadsheet opens, INPUTS and OTHER_INCOME sheets are created if they don't exist
- Key functions like `RETIREMENT_TARGET_SPEND_TABLE` automatically ensure required sheets exist
- You can also use the custom function `=SETUP_RETIREMENT_CALCULATOR()` in any cell

### SETUP_RETIREMENT_CALCULATOR

A custom function that triggers setup from a cell.

```
=SETUP_RETIREMENT_CALCULATOR()
→ "Setup complete! INPUTS and OTHER_INCOME sheets are ready."
```

### Updated Retirement Menu

The Retirement menu now includes:
- **Setup sheets (INPUTS & OTHER_INCOME)** - Manual setup
- **Show CPP Comparison** - Inserts CPP comparison table at cursor
- **Show OAS Comparison** - Inserts OAS comparison table at cursor

---

## 23. Enhanced CPP Calculator

### CPP_ENHANCED_BENEFIT

Calculates CPP including the enhanced portion for contributions after 2019.

```
=CPP_ENHANCED_BENEFIT(averageEarnings, contributionYears, yearsAfter2019, startAge)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| averageEarnings | number | Average annual pensionable earnings |
| contributionYears | number | Total years with CPP contributions |
| yearsAfter2019 | number | Years of contributions after 2019 |
| startAge | number | Age to start CPP (60-70) |

**Example:**
```
=CPP_ENHANCED_BENEFIT(70000, 40, 5, 65)
→ Includes enhanced benefit for 5 years of post-2019 contributions
```

**Key Points:**
- Enhancement phases in over 40 years (2019-2059)
- At full phase-in, provides up to 33% more retirement income
- Enhancement is proportional to years of post-2019 contributions

---

### CPP_START_AGE_COMPARISON

Creates a comparison table showing CPP benefits at different start ages.

```
=CPP_START_AGE_COMPARISON(averageEarnings, contributionYears)
```

**Returns:** Table comparing benefits at each age from 60-70 with cumulative totals

**Example:**
```
=CPP_START_AGE_COMPARISON(65000, 35)
```

This shows:
- Monthly and annual benefits at each age
- Adjustment percentage from base
- Cumulative payments at ages 80, 85, and 90

---

### CPP_BREAKEVEN_AGE

Calculates break-even ages for CPP start timing decisions.

```
=CPP_BREAKEVEN_AGE(benefit60, benefit65, benefit70)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| benefit60 | number | Monthly CPP if starting at 60 |
| benefit65 | number | Monthly CPP if starting at 65 |
| benefit70 | number | Monthly CPP if starting at 70 |

**Example:**
```
=CPP_BREAKEVEN_AGE(600, 1000, 1420)
→ Shows break-even ages: 60 vs 65, 65 vs 70, 60 vs 70
```

---

## 24. Enhanced OAS Calculator

### OAS_BREAKEVEN_AGE

Calculates break-even ages for OAS deferral decisions.

```
=OAS_BREAKEVEN_AGE(yearsInCanada)
```

**Returns:** Table showing monthly benefits at each deferral age (65-70) with break-even points

**Example:**
```
=OAS_BREAKEVEN_AGE(40)
```

This helps you decide:
- Is deferring OAS worth it for your situation?
- What age must you reach to benefit from deferral?

---

## 25. Withdrawal Schedule Calculator

### WITHDRAWAL_SCHEDULE

Projects year-by-year withdrawals from a portfolio, tracking withdrawal amounts (adjusted for inflation) and remaining portfolio balance. Validates if your withdrawal strategy is sustainable.

```
=WITHDRAWAL_SCHEDULE(portfolioValue, withdrawalRate, inflationRate, nominalReturn, years)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| portfolioValue | number | Current portfolio value |
| withdrawalRate | number | Initial annual rate (e.g., 0.04 for 4%) |
| inflationRate | number | Expected inflation rate |
| nominalReturn | number | Expected investment return |
| years | number | Number of years to project |

**Returns:** Year-by-year schedule with withdrawals, portfolio balance, and sustainability check

**Example:**
```
=WITHDRAWAL_SCHEDULE(1000000, 0.04, 0.02, 0.06, 30)
→ Shows 30-year projection with portfolio tracking
```

### SAFE_WITHDRAWAL_RATE (Deprecated)

Simple inflation-adjusted withdrawal schedule. For complete analysis, use `WITHDRAWAL_SCHEDULE` instead.

```
=SAFE_WITHDRAWAL_RATE(portfolioValue, withdrawalRate, inflationRate, years)
```

**Returns:** Year-by-year withdrawal schedule without portfolio tracking

---

## 26. Enhanced Tax Calculator for Seniors

### ESTIMATE_TAX_WITH_CREDITS

Enhanced tax estimation including senior-specific credits.

```
=ESTIMATE_TAX_WITH_CREDITS(taxableIncome, province, age, eligiblePensionIncome)
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| taxableIncome | number | Taxable income |
| province | string | Province code |
| age | number | Age (for age credit eligibility) |
| eligiblePensionIncome | number | Eligible pension income |

**Credits Applied:**
- **Age Credit** (65+): Up to $8,396 federal (2024)
- **Pension Income Credit**: Up to $2,000 of eligible pension income

**Example:**
```
=ESTIMATE_TAX_WITH_CREDITS(60000, "ON", 68, 15000)
→ Tax reduced by age and pension credits
```

---

## 27. Retirement Income Summary

### RETIREMENT_INCOME_SUMMARY

Comprehensive income breakdown at a specific age.

```
=RETIREMENT_INCOME_SUMMARY(age, rrspBalance, tfsaBalance, province)
```

**Returns:** Detailed table showing:
- Income from OTHER_INCOME sheet (taxable and non-taxable)
- RRIF minimum withdrawal (if age 71+)
- Tax calculation with senior credits
- Net after-tax income (annual and monthly)

**Example:**
```
=RETIREMENT_INCOME_SUMMARY(70, 500000, 100000, "ON")
```

---

## 28. Function Quick Reference

### All 55+ Functions At a Glance

#### Core Retirement Projections
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RETIREMENT_INCOME` | Project RRSP/TFSA monthly income | Exact math, estimated inputs |
| `RETIREMENT_TARGET_SPEND_TABLE` | Year-by-year spending plan | Exact math, estimated inputs |
| `LIFE_EXPECTANCY_AGE` | Planning age based on health | Approximation |
| `PENSION_INCOME_PROJECTED` | DB pension projection | Approximation |
| `RETIREMENT_INCOME_SUMMARY` | Comprehensive income at an age | Exact math |

#### Government Benefits
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `CPP_BENEFIT` | Monthly CPP estimate | Approximation |
| `CPP_BENEFIT_DETAILED` | CPP with breakdown | Approximation |
| `CPP_ENHANCED_BENEFIT` | CPP with post-2019 enhancement | Approximation |
| `CPP_START_AGE_COMPARISON` | Compare CPP at different ages | Exact math |
| `CPP_BREAKEVEN_AGE` | Break-even for CPP timing | Exact math |
| `CPP_SURVIVOR_BENEFIT` | Survivor pension | Uses CRA rates |
| `CPP_DEATH_BENEFIT` | Lump sum ($2,500) | Exact |
| `OAS_BENEFIT` | Monthly OAS estimate | Approximation |
| `OAS_CLAWBACK` | Recovery tax | Exact (15% rate) |
| `OAS_BENEFIT_DETAILED` | OAS with breakdown | Approximation |
| `OAS_BREAKEVEN_AGE` | Break-even for OAS timing | Exact math |
| `GIS_BENEFIT` | Guaranteed Income Supplement | Approximation |

#### RRIF & Withdrawals
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RRIF_MIN_WITHDRAWAL` | CRA mandatory minimum | Exact |
| `RRIF_MIN_PERCENTAGE` | Minimum % by age | Exact |
| `RRIF_SCHEDULE` | Multi-year RRIF plan | Exact rates, estimated returns |
| `OPTIMAL_WITHDRAWAL_ORDER` | Tax-efficient order | Approximation |
| `WITHDRAWAL_SCHEDULE` | Portfolio withdrawal with tracking | Exact math |
| `SAFE_WITHDRAWAL_RATE` | Simple withdrawal schedule (deprecated) | Exact math |

#### Tax Calculations
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `ESTIMATE_TAX` | Federal + provincial tax | Exact brackets |
| `ESTIMATE_TAX_DETAILED` | Tax breakdown | Exact brackets |
| `ESTIMATE_TAX_WITH_CREDITS` | Tax with senior credits | Exact brackets |
| `MARGINAL_TAX_RATE` | Combined marginal rate | Exact |
| `CAPITAL_GAINS_TAX` | Tax on capital gains | Exact (2024 rules) |
| `PENSION_INCOME_SPLIT` | Optimal splitting | Exact tax calc |
| `ESTATE_TAX_RRSP` | Tax at death | Exact brackets |

#### Contribution Room
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RRSP_CONTRIBUTION_ROOM` | Available RRSP room | Exact formula |
| `TFSA_CONTRIBUTION_ROOM` | Available TFSA room | Exact (historical limits) |

#### Non-Registered Accounts
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `TAXABLE_ACCOUNT_GROWTH` | Growth with tax drag | Exact math |
| `CAPITAL_GAINS_TAX` | Capital gains tax | Exact (50%/66.67% inclusion) |

#### Planning Tools
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `RETIREMENT_SAVINGS_TARGET` | How much you need | Exact formula |
| `RETIREMENT_READINESS_SCORE` | On-track score (0-100%) | Approximation |
| `REQUIRED_SAVINGS_RATE` | Annual savings needed | Exact formula |
| `NET_WORTH_SUMMARY` | Net worth breakdown | Exact math |
| `FUTURE_VALUE_INFLATION` | Inflation projection | Exact formula |
| `PRESENT_VALUE_INFLATION` | Today's dollars | Exact formula |

#### Setup & Utilities
| Function | Purpose | Accuracy |
|----------|---------|----------|
| `SETUP_RETIREMENT_CALCULATOR` | Trigger setup from a cell | N/A |
| `VALIDATE_RETIREMENT_INPUTS` | Check inputs | N/A |

### Accuracy Legend

- **Exact** = Uses official CRA rates, formulas, or fixed amounts
- **Exact math** = Mathematical formula is precise; accuracy depends on input estimates
- **Approximation** = Simplified model; may differ from actual amounts
- **Uses CRA rates** = Uses some official values but simplified calculation

---

## Contributing

Contributions are welcome! Please ensure:
- All calculations follow current CRA rules
- Tax brackets are updated for the current year
- Functions include proper documentation
- Backward compatibility is maintained

---

## License

MIT License – See LICENSE file for details
