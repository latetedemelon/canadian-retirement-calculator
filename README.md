## Canadian Retirement Calculator (Google Sheets)

A Google Sheets–based retirement model tuned for **Canadian** investors.

This project provides a Google Apps Script file (`Code.gs`) that plugs into a Google Sheet and gives you:

- RRSP & TFSA accumulation and decumulation modelling in **real (inflation-adjusted) dollars**
- A **constant real spending** engine that:
  - Grows RRSP/TFSA pre-retirement
  - Uses CPP, OAS, defined-benefit pensions, rental income, etc. from an `OTHER_INCOME` sheet
  - Adjusts RRSP/TFSA withdrawals so **total retirement cashflow ≈ your target spending**
- A defined-benefit **pension projection** helper
- A heuristic **life-expectancy planning age** helper
- Simple sheet setup helpers and a custom **“Retirement”** menu

> ⚠️ **Disclaimer:** This is an educational tool, not financial or tax advice.  
> Always verify results against official sources (CRA, Service Canada, plan documents) and/or a professional advisor before making decisions.

---

## 1. Files & structure

This repo is intended to contain at least:

- `LICENSE` – MIT license (default).
- `README.md` – this file.
- `google-sheets/Code.gs` – the main Apps Script source for the Google Sheets version.

You’ll copy the contents of `google-sheets/Code.gs` into the Apps Script editor for your sheet.

---

## 2. Installing into Google Sheets

1. **Create a new sheet** (or open one you want to use).
2. In the sheet, go to:  
   **Extensions → Apps Script**
3. Delete any placeholder code in `Code.gs`, then **paste** the contents of `google-sheets/Code.gs` from this repo.
4. Click **Save**.
5. Back in the sheet, reload the page. You should see a new menu called **“Retirement”** in the top menu bar.

On first use, you may be asked to **authorize** the script (standard Apps Script permissions).

---

## 3. What the script provides

### 3.1 Helper functions (used internally / can also be called)

- `realReturn_(nominal, infl)`  
  Converts a nominal annual return to a **real** (after-inflation) return.

- `futureValueReal_(pv, pmt, r, n)`  
  Simple future value with **annual contributions** at end of year, all in real terms.

- `annuityPayment_(pv, r, periods)`  
  Standard level-payment formula (used to compute constant withdrawals).

You usually don’t call these directly from the sheet; they support the functions below.

---

### 3.2 Core public functions

#### `RETIREMENT_INCOME(...)`

> **RRSP/TFSA only – level monthly income in real dollars**

Signature:

```gs
=RETIREMENT_INCOME(
  currentAge,
  retirementAge,
  lifeExpectancyAge,
  rrspBalanceNow,
  tfsaBalanceNow,
  annualRrspContribution,
  annualTfsaContribution,
  preRetNominalReturn,
  postRetNominalReturn,
  inflationRate
)