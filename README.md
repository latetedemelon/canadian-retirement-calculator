# Canadian Retirement Calculator (Google Sheets)

A comprehensive Google Sheets–based retirement planning tool designed specifically for **Canadian** investors.

This project provides a Google Apps Script file (`code.gs`) that plugs into a Google Sheet and gives you:

- **RRSP & TFSA** accumulation and decumulation modelling in **real (inflation-adjusted) dollars**
- **CPP, OAS, and GIS** benefit calculators with adjustment factors
- **RRIF** mandatory minimum withdrawal calculator
- **Tax estimation** for all 13 provinces and territories (2024 brackets)
- **Contribution room tracking** for RRSP and TFSA
- **Optimal withdrawal strategy** recommendations
- A **constant real spending** engine and much more

📖 **[View Full Function Documentation](DOCS/INDEX.md)**

---

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

After installation, use the **"Retirement"** menu to get started:

1. Click **Retirement → Setup sheets (INPUTS & OTHER_INCOME)**
2. This creates two helper sheets in your spreadsheet

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

---

## Documentation

For detailed documentation on all available functions, see:

📖 **[DOCS/INDEX.md](DOCS/INDEX.md)** - Complete function reference including:
- Core retirement projection functions
- CPP, OAS, and GIS calculators
- RRIF withdrawal calculators
- Tax estimation functions
- Contribution room tracking
- Withdrawal strategies
- And more...

---

## License

MIT License – See LICENSE file for details

---

> ⚠️ **Disclaimer:** This is an educational tool, not financial or tax advice.  
> Always verify results against official sources (CRA, Service Canada, plan documents) and/or a professional advisor before making decisions.
