# Canadian Retirement Calculator (Google Sheets)

A comprehensive Google Sheets–based retirement planning tool designed specifically for **Canadian** investors.

This project provides a Google Apps Script file (`code.gs`) that plugs into a Google Sheet and gives you:

- **RRSP & TFSA** accumulation and decumulation modelling in **real (inflation-adjusted) dollars**
- **CPP (Canada Pension Plan)** benefit calculator with early/late adjustment factors
- **OAS (Old Age Security)** calculator with deferral bonuses and clawback calculations
- **GIS (Guaranteed Income Supplement)** calculator for low-income retirees
- **RRIF** mandatory minimum withdrawal calculator
- **Tax estimation** for all 13 provinces and territories (2024 brackets)
- **Non-registered account** support with capital gains tracking
- **Contribution room tracking** for RRSP and TFSA
- **Optimal withdrawal strategy** recommendations
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
14. [Examples & Use Cases](#14-examples--use-cases)
15. [Troubleshooting](#15-troubleshooting)

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

## 14. Examples & Use Cases

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

## 15. Troubleshooting

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

## Contributing

Contributions are welcome! Please ensure:
- All calculations follow current CRA rules
- Tax brackets are updated for the current year
- Functions include proper documentation
- Backward compatibility is maintained

---

## License

MIT License – See LICENSE file for details
