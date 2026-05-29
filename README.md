# Canadian Retirement Calculator (Google Sheets)

A comprehensive Google Sheets–based retirement planning tool designed specifically for **Canadian** investors.

This project provides a Google Apps Script file (`code.gs`) that plugs into a Google Sheet and gives you:

- **RRSP & TFSA** accumulation and decumulation modelling in **real (inflation-adjusted) dollars**
- **CPP (Canada Pension Plan)** benefit calculator with early/late adjustment factors
- **OAS (Old Age Security)** calculator with deferral bonuses and clawback calculations
- **GIS (Guaranteed Income Supplement)** calculator for low-income retirees
- **RRIF** mandatory minimum withdrawal calculator
- **Tax estimation** for all 13 provinces and territories (2024 brackets)
- And many more retirement planning functions...

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
29. [Single-Scenario Retirement Workbook Flow](#29-single-scenario-retirement-workbook-flow)

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
## Quick Start / Getting Started

### Installation

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

### Using the Setup Wizard

After installation, click **Retirement → Setup sheets (INPUTS & OTHER_INCOME)** to create two helper sheets:

#### INPUTS Sheet

The wizard creates an **INPUTS** sheet with these fields:

| Row | Label | Default Value | Description |
|-----|-------|---------------|-------------|
| 2 | Current age | 40 | Your current age in years |
| 3 | Retirement age | 65 | When you plan to retire |
| 4 | Planning age | 90 | Age to plan income until |
| 5 | RRSP balance now | 200,000 | Current RRSP/RRIF balance |
| 6 | TFSA balance now | 50,000 | Current TFSA balance |
| 7 | Annual RRSP contrib | 18,000 | Your annual RRSP contribution |
| 8 | Annual TFSA contrib | 6,000 | Your annual TFSA contribution |
| 9 | Pre-ret nominal r | 0.06 | Expected return before retirement (6%) |
| 10 | Post-ret nominal r | 0.04 | Expected return after retirement (4%) |
| 11 | Inflation rate | 0.02 | Expected inflation (2%) |
| 12 | Target spend (annual) | 60,000 | Your target annual spending in retirement |

Replace the default values in column B with your actual numbers, then reference these cells in formulas.

#### OTHER_INCOME Sheet

The wizard creates an **OTHER_INCOME** sheet for additional income sources (CPP, OAS, pensions, rental income, etc.):

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

---

## Documentation

For detailed function documentation, examples, and troubleshooting, see the **[DOCS/INDEX.md](DOCS/INDEX.md)**.

The documentation covers:
- Core retirement projection functions
- CPP, OAS, and GIS calculators
- RRIF and withdrawal strategies
- Tax estimation
- Contribution room tracking
- Retirement readiness assessment
- And more...

---

## Disclaimer

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

## 29. Single-Scenario Retirement Workbook Flow

The calculator now includes a **script-driven projection flow** that builds a complete year-by-year retirement plan with CPP/OAS estimation.

### Overview

This feature performs most calculations in Apps Script (rather than formulas) and writes results to a structured **Calcs** sheet for use in summary displays. It's designed for a single-scenario workbook.

### Required Sheet Structure

You need **four sheets** in your workbook:

1. **Inputs** - Contains all input parameters via named ranges
2. **CPP_Contribs** - Contains your historical CPP contribution data
3. **Calcs** - Receives projection parameters and year-by-year projection table
4. **Summary** - Uses data from Calcs for summary displays

### Named Ranges Setup

#### On the Inputs Sheet

Create these named ranges pointing to cells on your Inputs sheet:

| Named Range | Cell | Description |
|-------------|------|-------------|
| `retirement_age` | Inputs!B2 | Age you plan to retire |
| `current_age` | Inputs!B3 | Your current age |
| `current_year` | Inputs!B4 | Current calendar year |
| `cpp_start_age` | Inputs!B5 | Age to start CPP (60-70) |
| `oas_start_age` | Inputs!B6 | Age to start OAS (65-70) |
| `province` | Inputs!B7 | Province code (ON, BC, AB, etc.) |
| `marital_status` | Inputs!B8 | Marital status |
| `current_income` | Inputs!B10 | Current annual income |
| `annual_contrib` | Inputs!B11 | Annual retirement savings contribution |
| `rrsp_balance_now` | Inputs!B12 | Current RRSP balance |
| `tfsa_balance_now` | Inputs!B13 | Current TFSA balance |
| `taxable_balance_now` | Inputs!B14 | Current taxable account balance |
| `real_return` | Inputs!B15 | Expected real return (as %, e.g., 4 for 4%) |
| `inflation_rate` | Inputs!B16 | Expected inflation rate (as %, e.g., 2 for 2%) |
| `target_net_income_today` | Inputs!B17 | Target annual net income in retirement (today's $) |
| `life_expectancy_age` | Inputs!B19 | Age to plan until |

**To create a named range in Google Sheets:**
1. Select the cell (e.g., B2)
2. Go to **Data → Named ranges**
3. Enter the name (e.g., `retirement_age`)
4. Click **Done**

#### On the CPP_Contribs Sheet

Create this named range:

| Named Range | Cell | Description |
|-------------|------|-------------|
| `cpp_contribs_range` | CPP_Contribs!A2:F500 | Your CPP contribution history |

**CPP_Contribs Sheet Structure:**

The CPP_Contribs sheet should have these columns (row 1 = headers, data starts at row 2):

| Column | Header | Description |
|--------|--------|-------------|
| A | Year | Calendar year of contribution |
| B | Age | Your age that year |
| C | Pensionable Earnings | Your earnings subject to CPP |
| D | YMPE | Year's Maximum Pensionable Earnings for that year |
| E | Earnings/YMPE | Ratio (auto-calculate: =C2/D2) |
| F | Notes | Optional notes |

**How to populate CPP_Contribs:**
- You can get your actual CPP contribution history from [My Service Canada Account](https://www.canada.ca/en/employment-social-development/services/my-account.html)
- Or estimate based on your employment history
- Leave rows blank if you didn't contribute in certain years

#### On the Calcs Sheet

Create these named ranges for summary outputs:

| Named Range | Cell | Description |
|-------------|------|-------------|
| `projection_start_year` | Calcs!B5 | First year of projection |
| `projection_end_year` | Calcs!B6 | Last year of projection |
| `real_return_decimal` | Calcs!B7 | Real return as decimal |
| `inflation_decimal` | Calcs!B8 | Inflation as decimal |
| `cpp_annual_today` | Calcs!B27 | Estimated CPP annual benefit (today's $) |
| `cpp_annual_nominal` | Calcs!B28 | CPP annual benefit (nominal, in start year) |
| `oas_annual_today` | Calcs!B29 | Estimated OAS annual benefit (today's $) |
| `oas_annual_nominal` | Calcs!B30 | OAS annual benefit (nominal, in start year) |

You can add labels in column A (e.g., A5 = "Projection Start Year") and the named ranges point to the values in column B.

### Running the Projection

1. **Ensure all sheets and named ranges are set up** as described above
2. In Google Sheets, go to the **Retirement** menu
3. Click **Run Projection**
4. The script will:
   - Read your inputs from named ranges
   - Read your CPP contribution history
   - Calculate CPP and OAS benefit estimates
   - Write summary values to the Calcs sheet
   - Build a year-by-year projection table in Calcs (starting at row 50)

### Projection Table Output

The projection table appears in the **Calcs** sheet starting at **row 50** (headers) and **row 51** (data).

**Columns:**
1. **Year** - Calendar year
2. **Age** - Your age
3. **Employment Income** - Income from work (before retirement)
4. **CPP Income** - CPP benefits (starts at cpp_start_age)
5. **OAS Income** - OAS benefits (starts at oas_start_age)
6. **DB Pension** - Defined benefit pension (placeholder for future)
7. **Other Income** - Other income sources (placeholder for future)
8. **Gross Income** - Total income before tax
9. **Taxes** - Estimated income tax
10. **Net Income** - Income after tax
11. **Start Balance** - Portfolio value at start of year
12. **Contributions** - Annual contributions (pre-retirement)
13. **Withdrawals** - Portfolio withdrawals (post-retirement)
14. **Investment Return** - Portfolio growth
15. **End Balance** - Portfolio value at end of year
16. **Net Income (today's $)** - Net income discounted to current year

### CPP and OAS Estimation

The projection uses **simplified estimation models**:

**CPP Estimation:**
- Calculates average Earnings/YMPE ratio from your contribution history
- Scales MAX_CPP_65_TODAY constant by this ratio
- Applies early/late adjustment (7.2% per year reduction if early, 8.4% per year increase if late)
- Current default: MAX_CPP_65_TODAY = $16,375/year

**OAS Estimation:**
- Assumes full OAS eligibility (40+ years residence)
- Applies deferral bonus (7.2% per year if deferred past 65)
- Current default: FULL_OAS_ANNUAL_TODAY = $8,560/year

**To adjust these constants:**
1. Open the Apps Script editor (**Extensions → Apps Script**)
2. Find the `PROJECTION_CONSTANTS` object (search for "PROJECTION_CONSTANTS")
3. Update the values:
   ```javascript
   var PROJECTION_CONSTANTS = {
     MAX_CPP_65_TODAY: 16375,        // Adjust this
     FULL_OAS_ANNUAL_TODAY: 8560,    // Adjust this
     // ... other constants
   };
   ```
4. Save the script

### Tax Estimation

The projection uses a **simplified progressive tax model** with hard-coded brackets (in today's dollars):

- $0 - $15,000: 0% (basic personal amount)
- $15,000 - $50,000: 20%
- $50,000 - $100,000: 30%
- $100,000 - $155,000: 40%
- $155,000 - $220,000: 45%
- $220,000+: 50%

These are approximate combined federal+provincial rates.

**Limitations:**
- Does not use actual province-specific brackets
- Does not account for tax credits (age amount, pension splitting, etc.)
- Brackets are inflated each year but are rough estimates

**To improve tax accuracy:**
- In the Apps Script editor, find `SIMPLE_TAX_BRACKETS_TODAY`
- Adjust the brackets and rates to better match your situation
- Or modify `computeTax_()` to call `ESTIMATE_TAX()` for province-specific calculation

### Withdrawal Strategy

For retirement years (age >= retirement_age):

1. Calculate income from CPP, OAS, and employment (if any)
2. Compute tax on that income
3. Determine the gap between target net income and actual net income
4. Calculate portfolio withdrawal needed to fill the gap
5. Re-compute tax with withdrawal included
6. Update portfolio balance

This aims to provide consistent purchasing power (target_net_income_today) throughout retirement.

### Limitations and Future Enhancements

**Current Limitations:**
- CPP/OAS estimates are simplified (real Service Canada amounts may vary)
- Tax calculation is approximate (not province-specific, no credits)
- Assumes one person (no spouse modeling)
- No RRIF minimum withdrawal enforcement
- No OAS clawback calculation
- DB Pension and Other Income columns are placeholders

**Future Enhancements:**
- Integration with existing `ESTIMATE_TAX()` for province-specific taxes
- RRIF minimum withdrawals (age 71+)
- OAS clawback based on income
- Spouse/family modeling
- Monte Carlo simulation for multiple scenarios
- Integration with OTHER_INCOME sheet

### Troubleshooting

**Error: "Named range '...' not found"**
- Ensure you've created all required named ranges
- Check spelling and case sensitivity
- Verify the named ranges point to the correct cells

**Error: "Calcs sheet not found"**
- Create a sheet named "Calcs" (case-sensitive)

**CPP/OAS amounts seem wrong:**
- Check your CPP contribution history in CPP_Contribs
- Verify cpp_start_age and oas_start_age in Inputs
- Adjust PROJECTION_CONSTANTS if needed

**Projection table is empty:**
- Check that current_age < retirement_age < life_expectancy_age
- Verify all named ranges have valid numeric values
- Look for error messages in the toast notification

---

## Contributing

Contributions are welcome! Please ensure:
- All calculations follow current CRA rules
- Tax brackets are updated for the current year
- Functions include proper documentation
- Backward compatibility is maintained
> ⚠️ **Disclaimer:** This is an educational tool, not financial or tax advice.  
> Always verify results against official sources (CRA, Service Canada, plan documents) and/or a professional advisor before making decisions.

---

> ⚠️ **Disclaimer:** This is an educational tool, not financial or tax advice.  
> Always verify results against official sources (CRA, Service Canada, plan documents) and/or a professional advisor before making decisions.
